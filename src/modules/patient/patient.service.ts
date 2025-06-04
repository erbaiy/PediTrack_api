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
import { User, UserDocument } from '../auth/schema/user.schema';

@Injectable()
export class PatientService {
  constructor(
    @InjectModel(Patient.name) private patientModel: Model<PatientDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
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
      const saveParent = await this.userModel.create({
        fullName: createPatientDto.fullName,
        email: createPatientDto.email,
        phoneNumber: createPatientDto.phoneNumber,
        role: 'parent',
        isVerified: true,
        address: '',
      });
      const doctor = await this.userModel.findOne({ role: 'doctor' });
      console.log('doctor', doctor._id);
      if (!doctor) {
        throw new NotFoundException('No doctor found in the system');
      }

      const patient = new this.patientModel({
        ...createPatientDto,
        parentId: saveParent._id,
        doctorId: doctor._id,
      });

      return await patient.save();
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw new BadRequestException(`Validation failed: ${error.message}`);
      }
      throw error;
    }
  }

  async findAll() {
    console.log('Fetching all patients');
    try {
      const patients = await this.patientModel.find();
      // .populate({
      //   path: 'parentId',
      //   select: '_id fullName email phoneNumber',
      // })
      // .populate({
      //   path: 'doctorId',
      //   select: '_id fullName email',
      // });
      console.log('First patient parent:', patients[0]?.parentId);
      console.log('First patient doctor:', patients[0]?.doctorId);

      return patients;
    } catch (error) {
      throw new NotFoundException(`No patients found`);
    }
  }

  // async findAll(): Promise<{
  //   // Keep query as 'any' or define a custom interface if preferred
  //   patients: Patient[];
  //   total: number;
  //   page: number;
  //   totalPages: number;
  // }> {
  //   // const filter: any = {};

  //   // --- Start of Manual Validation ---

  //   // // Validate 'search' (optional, but good practice to ensure it's a string if present)
  //   // if (query.search !== undefined && typeof query.search !== 'string') {
  //   //   throw new BadRequestException('Search parameter must be a string.');
  //   // }
  //   // // Trim search term if it's a string (equivalent to @Transform)
  //   // if (typeof query.search === 'string') {
  //   //   query.search = query.search.trim();
  //   // }

  //   // // Validate 'parentId'
  //   // if (query.parentId !== undefined) {
  //   //   if (
  //   //     typeof query.parentId !== 'string' ||
  //   //     !Types.ObjectId.isValid(query.parentId)
  //   //   ) {
  //   //     throw new BadRequestException(
  //   //       'Parent ID must be a valid Mongo ObjectId string.',
  //   //     );
  //   //   }
  //   //   filter.parentId = new Types.ObjectId(query.parentId);
  //   // }

  //   // // Validate 'doctorId'
  //   // if (query.doctorId !== undefined) {
  //   //   if (
  //   //     typeof query.doctorId !== 'string' ||
  //   //     !Types.ObjectId.isValid(query.doctorId)
  //   //   ) {
  //   //     throw new BadRequestException(
  //   //       'Doctor ID must be a valid Mongo ObjectId string.',
  //   //     );
  //   //   }
  //   //   filter.doctorId = new Types.ObjectId(query.doctorId);
  //   // }

  //   // Validate 'gender'
  //   // const allowedGenders = ['male', 'female', 'other']; // Define your allowed gender values
  //   // if (query.gender !== undefined) {
  //   //   if (
  //   //     typeof query.gender !== 'string' ||
  //   //     !allowedGenders.includes(query.gender.toLowerCase())
  //   //   ) {
  //   //     throw new BadRequestException(
  //   //       `Gender must be one of: ${allowedGenders.join(', ')}.`,
  //   //     );
  //   //   }
  //   //   filter.gender = query.gender; // Use as is, or convert to lowercase if your DB expects it
  //   // }

  //   // Validate 'page' and 'limit' - these are already robustly handled by parseInt and || defaults
  //   const page = parseInt(query.page as any) || 1;
  //   const limit = parseInt(query.limit as any) || 10;

  //   if (isNaN(page) || page < 1) {
  //     // Additional check for negative/zero page
  //     throw new BadRequestException('Page number must be a positive integer.');
  //   }
  //   if (isNaN(limit) || limit < 1) {
  //     // Additional check for negative/zero limit
  //     throw new BadRequestException('Limit must be a positive integer.');
  //   }

  //   const skip = (page - 1) * limit;

  //   // Validate 'sortBy'
  //   const allowedSortBy = ['createdAt', 'firstName', 'lastName', 'birthDate']; // Add all sortable fields
  //   if (query.sortBy !== undefined) {
  //     if (
  //       typeof query.sortBy !== 'string' ||
  //       !allowedSortBy.includes(query.sortBy)
  //     ) {
  //       throw new BadRequestException(
  //         `SortBy field must be one of: ${allowedSortBy.join(', ')}.`,
  //       );
  //     }
  //   }
  //   const sortBy = query.sortBy || 'createdAt'; // Apply default after validation

  //   // Validate 'sortOrder'
  //   const allowedSortOrders = ['asc', 'desc'];
  //   if (query.sortOrder !== undefined) {
  //     if (
  //       typeof query.sortOrder !== 'string' ||
  //       !allowedSortOrders.includes(query.sortOrder.toLowerCase())
  //     ) {
  //       throw new BadRequestException(`SortOrder must be 'asc' or 'desc'.`);
  //     }
  //   }
  //   const sortOrder = query.sortOrder === 'asc' ? 1 : -1; // Apply default after validation

  //   const sortObject: any = { [sortBy]: sortOrder };

  //   // --- End of Manual Validation ---

  //   // Search filtering (remains the same)
  //   if (query.search) {
  //     // Note: query.search might now be an empty string after trim if user sends spaces
  //     filter.$or = [
  //       { firstName: { $regex: query.search, $options: 'i' } },
  //       { lastName: { $regex: query.search, $options: 'i' } },
  //     ];
  //   }

  //   const [patients, total] = await Promise.all([
  //     this.patientModel
  //       .find(filter)
  //       .populate('parentId', 'name email phone')
  //       .populate('doctorId', 'name email')
  //       .sort(sortObject)
  //       .skip(skip)
  //       .limit(limit)
  //       .lean(),
  //     this.patientModel.countDocuments(filter),
  //   ]);

  //   return {
  //     patients,
  //     total,
  //     page,
  //     totalPages: Math.ceil(total / limit),
  //   };
  // }

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
    // if (
    //   userRole === 'doctor' &&
    //   updatePatientDto.doctorId &&
    //   updatePatientDto.doctorId !== userId
    // ) {
    //   throw new ForbiddenException(
    //     'Doctors cannot reassign patients to other doctors',
    //   );
    // }

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
