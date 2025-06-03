// ====================
// 5. Patient Module (patient.module.ts)
// ====================
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PatientService } from './patient.service';
import { PatientController } from './patient.controller';
import { Patient, PatientSchema } from './patient.schema';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { JwtAuthGuard } from '../../common/guards/JwtAuthGuard.guard';

import { EmailVerificationService } from 'src/utils';
import { Algorithm } from 'jsonwebtoken';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Patient.name, schema: PatientSchema }]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.accessToken.expiresIn'),
          algorithm: configService.get<string>(
            'jwt.accessToken.algorithm',
          ) as Algorithm,
        },
      }),
      inject: [ConfigService],
    }),
  ],

  controllers: [PatientController],
  providers: [PatientService],
  exports: [PatientService],
})
export class PatientModule {}
