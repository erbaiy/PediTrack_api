// patient.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PatientDocument = Patient & Document;

@Schema({ 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})
export class Patient {
  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({
    required: true,
    enum: ['male', 'female'],
    lowercase: true,
  })
  gender: string;

  @Prop({ required: false })
  birthDate: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  parentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  doctorId: Types.ObjectId;

  @Prop()
  growthCurveId?: string;
}

export const PatientSchema = SchemaFactory.createForClass(Patient);

// Add virtual for appointments
PatientSchema.virtual('appointments', {
  ref: 'Appointment',
  localField: '_id',
  foreignField: 'patientId',
});

// Add indexes for better performance
PatientSchema.index({ parentId: 1, doctorId: 1 });
PatientSchema.index({ firstName: 1, lastName: 1 });
PatientSchema.index({ birthDate: 1 });

// Add virtuals for age and fullName
PatientSchema.virtual('age').get(function () {
  if (!this.birthDate) return null;
  const today = new Date();
  const birth = new Date(this.birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
});

PatientSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});







// // ====================
// // 1. Patient Schema (patient.schema.ts)
// // ====================
// import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
// import { Document, Types } from 'mongoose';

// export type PatientDocument = Patient & Document;

// @Schema({ timestamps: true })
// export class Patient {
//   @Prop({ required: true, trim: true })
//   firstName: string;

//   @Prop({ required: true, trim: true })
//   lastName: string;

//   @Prop({
//     required: true,
//     enum: ['male', 'female'],
//     lowercase: true,
//   })
//   gender: string;

//   @Prop({ required: false })
//   birthDate: string;
//   @Prop({ type: Types.ObjectId, ref: 'User' })
//   parentId: Types.ObjectId;

//   @Prop({ type: Types.ObjectId, ref: 'User' })
//   doctorId: Types.ObjectId;

//   @Prop({
//     // type: Types.string,
//   })
//   growthCurveId?: string;
//   // @Prop({
//   //   type: Types.ObjectId,
//   //   ref: 'GrowthCurve',
//   // })
//   // growthCurveId?: Types.ObjectId;

//   // Virtual field for age calculation
//   get age(): number {
//     const today = new Date();
//     const birth = new Date(this.birthDate);
//     let age = today.getFullYear() - birth.getFullYear();
//     const monthDiff = today.getMonth() - birth.getMonth();

//     if (
//       monthDiff < 0 ||
//       (monthDiff === 0 && today.getDate() < birth.getDate())
//     ) {
//       age--;
//     }
//     return age;
//   }

//   // Virtual field for full name
//   get fullName(): string {
//     return `${this.firstName} ${this.lastName}`;
//   }
// }

// export const PatientSchema = SchemaFactory.createForClass(Patient);

// // Add indexes for better performance
// PatientSchema.index({ parentId: 1, doctorId: 1 });
// PatientSchema.index({ firstName: 1, lastName: 1 });
// PatientSchema.index({ birthDate: 1 });

// // Add virtuals
// PatientSchema.virtual('age').get(function () {
//   const today = new Date();
//   const birth = new Date(this.birthDate);
//   let age = today.getFullYear() - birth.getFullYear();
//   const monthDiff = today.getMonth() - birth.getMonth();

//   if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
//     age--;
//   }
//   return age;
// });

// PatientSchema.virtual('fullName').get(function () {
//   return `${this.firstName} ${this.lastName}`;
// });

// PatientSchema.set('toJSON', { virtuals: true });
// PatientSchema.set('toObject', { virtuals: true });
