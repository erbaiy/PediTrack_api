// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './modules/auth/auth.module';
import { databaseConfig, jwtConfig, mailConfig } from './common/config/index';
import { RateLimiterModule } from 'nestjs-rate-limiter';
import { PatientModule } from './modules/patient/patient.module';
import { AppointmentModule } from './modules/appointment/appointment.module';
// import { SuperAdminModule } from './modules/super_admin/super-admin.module';

@Module({
  imports: [
    RateLimiterModule.register({
      points: 5, // 5 requests
      duration: 60, // per 60 seconds
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig, mailConfig],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
        ...configService.get('database.options'),
        retryAttempts: configService.get<number>('database.retryAttempts'),
        retryDelay: configService.get<number>('database.retryDelay'),
      }),
    }),
    AuthModule,
    PatientModule,
    AppointmentModule,
  ],
})
export class AppModule {}
