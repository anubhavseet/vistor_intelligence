import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

/**
 * User Schema
 * 
 * Platform users (clients who use the SaaS).
 */
@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string; // bcrypt hashed password

  @Prop({ required: true })
  name: string;

  @Prop({
    type: String,
    enum: ['admin', 'user'],
    default: 'user',
  })
  role: 'admin' | 'user';

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastLoginAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1 });
