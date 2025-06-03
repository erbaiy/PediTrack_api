// ====================
// 3. Patient Service (patient.service.ts)
// ====================
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Patient, PatientDocument } from './patient.schema';
import {
  CreatePatientDto,
  PatientQueryDto,
  UpdatePatientDto,
} from './patient.dto';

@Injectable()
export class PatientService {
  constructor(
    @InjectModel(Patient.name) private patientModel: Model<PatientDocument>,
  ) {}

  async create(
    createPatientDto: CreatePatientDto,
    // userId: string,
    // userRole: string,
  ): Promise<Patient> {
    try {
      // Check if patient already exists (same name, birth date, and parent)
      const existingPatient = await this.patientModel.findOne({
        firstName: { $regex: new RegExp(createPatientDto.firstName, 'i') },
        lastName: { $regex: new RegExp(createPatientDto.lastName, 'i') },
        birthDate: createPatientDto.birthDate,
        // parentId: new Types.ObjectId(createPatientDto.parentId),
      });

      if (existingPatient) {
        throw new ConflictException(
          'A patient with the same name, birth date, and parent already exists',
        );
      }
      // Role-based validation
      // if (userRole === 'doctor' && createPatientDto.doctorId !== userId) {
      //   throw new ForbiddenException(
      //     'Doctors can only create patients assigned to themselves',
      //   );
      // }
      const doctorId = await this.patientModel.findOne({ role: 'doctor' });

      const patient = new this.patientModel({
        ...createPatientDto,
        // parentId: new Types.ObjectId(createPatientDto.parentId),
        doctorId: doctorId,
        growthCurveId: createPatientDto.growthCurveId
          ? new Types.ObjectId(createPatientDto.growthCurveId)
          : undefined,
      });

      return await patient.save();
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw new BadRequestException(`Validation failed: ${error.message}`);
      }
      throw error;
    }
  }

  async findAll(
    query: PatientQueryDto,
    // userId: string,
    // userRole: string,
  ): Promise<{
    patients: Patient[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const filter: any = {};

    // Role-based filtering
    // if (userRole === 'doctor') {
    //   filter.doctorId = new Types.ObjectId(userId);
    // }

    // Apply query filters
    if (query.search) {
      filter.$or = [
        { firstName: { $regex: query.search, $options: 'i' } },
        { lastName: { $regex: query.search, $options: 'i' } },
      ];
    }

    if (query.parentId) {
      filter.parentId = new Types.ObjectId(query.parentId);
    }

    if (query.doctorId) {
      filter.doctorId = new Types.ObjectId(query.doctorId);
    }

    if (query.gender) {
      filter.gender = query.gender;
    }

    // Pagination
    const skip = (query.page - 1) * query.limit;

    // Sorting
    const sortObject: any = {};
    sortObject[query.sortBy] = query.sortOrder === 'asc' ? 1 : -1;

    const [patients, total] = await Promise.all([
      this.patientModel
        .find(filter)
        .populate('parentId', 'name email phone')
        .populate('doctorId', 'name email')
        .sort(sortObject)
        .skip(skip)
        .limit(query.limit)
        .lean(),
      this.patientModel.countDocuments(filter),
    ]);

    return {
      patients,
      total,
      page: query.page,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  async findOne(
    id: string,
    // userId: string,
    // userRole: string,
  ): Promise<Patient> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid patient ID format');
    }

    const filter: any = { _id: new Types.ObjectId(id) };

    // Role-based filtering
    // if (userRole === 'doctor') {
    //   filter.doctorId = new Types.ObjectId(userId);
    // }

    const patient = await this.patientModel
      .findOne(filter)
      .populate('parentId', 'name email phone')
      .populate('doctorId', 'name email')
      .populate('growthCurveId')
      .lean();

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    return patient;
  }

  async update(
    id: string,
    updatePatientDto: UpdatePatientDto,
    userId: string,
    userRole: string,
  ): Promise<Patient> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid patient ID format');
    }

    const filter: any = { _id: new Types.ObjectId(id) };

    // Role-based filtering
    if (userRole === 'doctor') {
      filter.doctorId = new Types.ObjectId(userId);
    }

    const existingPatient = await this.patientModel.findOne(filter);
    if (!existingPatient) {
      throw new NotFoundException('Patient not found');
    }

    // Role-based validation for updates
    if (
      userRole === 'doctor' &&
      updatePatientDto.doctorId &&
      updatePatientDto.doctorId !== userId
    ) {
      throw new ForbiddenException(
        'Doctors cannot reassign patients to other doctors',
      );
    }

    try {
      const updateData: any = { ...updatePatientDto };

      // Convert string IDs to ObjectIds
      if (updateData.parentId) {
        updateData.parentId = new Types.ObjectId(updateData.parentId);
      }
      if (updateData.doctorId) {
        updateData.doctorId = new Types.ObjectId(updateData.doctorId);
      }
      if (updateData.growthCurveId) {
        updateData.growthCurveId = new Types.ObjectId(updateData.growthCurveId);
      }

      const patient = await this.patientModel
        .findByIdAndUpdate(id, updateData, {
          new: true,
          runValidators: true,
        })
        .populate('parentId', 'name email phone')
        .populate('doctorId', 'name email')
        .lean();

      return patient;
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw new BadRequestException(`Validation failed: ${error.message}`);
      }
      throw error;
    }
  }

  async remove(
    id: string,
    userId: string,
    userRole: string,
  ): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid patient ID format');
    }

    const filter: any = { _id: new Types.ObjectId(id) };

    // Role-based filtering
    if (userRole === 'doctor') {
      filter.doctorId = new Types.ObjectId(userId);
    }

    const patient = await this.patientModel.findOne(filter);
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Soft delete by adding deletedAt field
    await this.patientModel.findByIdAndUpdate(id, {
      deletedAt: new Date(),
      isActive: false,
    });

    return { message: 'Patient successfully deleted' };
  }

  // Additional utility methods
  async getPatientsByParent(parentId: string): Promise<Patient[]> {
    if (!Types.ObjectId.isValid(parentId)) {
      throw new BadRequestException('Invalid parent ID format');
    }

    return await this.patientModel
      .find({ parentId: new Types.ObjectId(parentId) })
      .populate('doctorId', 'name email')
      .lean();
  }

  async getPatientsByDoctor(
    doctorId: string,
    page = 1,
    limit = 10,
  ): Promise<{
    patients: Patient[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    if (!Types.ObjectId.isValid(doctorId)) {
      throw new BadRequestException('Invalid doctor ID format');
    }

    const skip = (page - 1) * limit;
    const filter = { doctorId: new Types.ObjectId(doctorId) };

    const [patients, total] = await Promise.all([
      this.patientModel
        .find(filter)
        .populate('parentId', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.patientModel.countDocuments(filter),
    ]);

    return {
      patients,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
