// ====================
// 4. Patient Controller (patient.controller.ts)
// ====================
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/JwtAuthGuard.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PatientService } from './patient.service';
import {
  CreatePatientDto,
  PatientQueryDto,
  UpdatePatientDto,
} from './patient.dto';

@ApiTags('Patients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('doctor', 'assistant')
@Controller('patients')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new patient' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Patient successfully created',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Patient already exists',
  })
  async create(@Body() createPatientDto: CreatePatientDto, @Req() req: any) {
    return await this.patientService.create(
      createPatientDto,
      // req.user._id,
      // req.user.role,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all patients with filtering and pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Patients retrieved successfully',
  })
  async findAll(@Query() query: PatientQueryDto, @Req() req: any) {
    return await this.patientService.findAll(
      query,
      // ,
      //  req.user.id, req.user.role
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a patient by ID' })
  @ApiParam({ name: 'id', description: 'Patient ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Patient retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Patient not found',
  })
  async findOne(@Param('id') id: string, @Req() req: any) {
    return await this.patientService.findOne(
      id,
      // ,
      //  req.user.id, req.user.role
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a patient' })
  @ApiParam({ name: 'id', description: 'Patient ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Patient updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Patient not found',
  })
  async update(
    @Param('id') id: string,
    @Body() updatePatientDto: UpdatePatientDto,
    @Req() req: any,
  ) {
    return await this.patientService.update(
      id,
      updatePatientDto,
      req.user.id,
      req.user.role,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a patient' })
  @ApiParam({ name: 'id', description: 'Patient ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Patient deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Patient not found',
  })
  async remove(@Param('id') id: string, @Req() req: any) {
    return await this.patientService.remove(id, req.user.id, req.user.role);
  }

  @Get('parent/:parentId')
  @ApiOperation({ summary: 'Get patients by parent ID' })
  @ApiParam({ name: 'parentId', description: 'Parent ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Patients retrieved successfully',
  })
  async getPatientsByParent(@Param('parentId') parentId: string) {
    return await this.patientService.getPatientsByParent(parentId);
  }

  @Get('doctor/:doctorId')
  @ApiOperation({ summary: 'Get patients by doctor ID' })
  @ApiParam({ name: 'doctorId', description: 'Doctor ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Patients retrieved successfully',
  })
  async getPatientsByDoctor(
    @Param('doctorId') doctorId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return await this.patientService.getPatientsByDoctor(doctorId, page, limit);
  }
}
