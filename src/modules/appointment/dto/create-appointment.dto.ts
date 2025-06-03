// dto/create-appointment.dto.ts
import { IsDateString, IsNotEmpty, IsMongoId, Matches } from 'class-validator';

export class CreateAppointmentDto {
  @IsMongoId({ message: 'Invalid patient ID' })
  patientId: string;

  // @IsMongoId({ message: 'Invalid doctor ID' })
  // doctorId: string;

  @IsDateString({}, { message: 'Date must be in ISO format (YYYY-MM-DD)' })
  date: string; // e.g., '2025-06-10'

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Time must be in HH:mm format',
  })
  time: string; // e.g., '14:30'
  @IsNotEmpty({ message: 'Type is required' })
  type: 'consultation' | 'follow-up';

  notes?: string;
}
