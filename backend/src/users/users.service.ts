import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../common/schemas/user.schema';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) { }

    async findAll(): Promise<UserDocument[]> {
        return this.userModel.find().exec();
    }

    async findOne(id: string): Promise<UserDocument> {
        const user = await this.userModel.findById(id).exec();
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        return user;
    }

    async findByEmail(email: string): Promise<UserDocument | null> {
        return this.userModel.findOne({ email }).exec();
    }

    async create(createUserInput: CreateUserInput): Promise<UserDocument> {
        const { email, password, ...rest } = createUserInput;

        const existingUser = await this.findByEmail(email);
        if (existingUser) {
            throw new BadRequestException('User with this email already exists');
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const newUser = new this.userModel({
            email,
            passwordHash,
            ...rest,
        });

        return newUser.save();
    }

    async update(id: string, updateUserInput: UpdateUserInput): Promise<UserDocument> {
        const { password, ...updateData } = updateUserInput;
        const user = await this.findOne(id);

        if (password) {
            user.passwordHash = await bcrypt.hash(password, 10);
        }

        if (updateData.email !== undefined) user.email = updateData.email;
        if (updateData.name !== undefined) user.name = updateData.name;
        if (updateData.role !== undefined) user.role = updateData.role as 'admin' | 'user';
        if (updateData.isActive !== undefined) user.isActive = updateData.isActive;

        return user.save();
    }

    async remove(id: string): Promise<UserDocument> {
        const user = await this.userModel.findByIdAndDelete(id).exec();
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        return user;
    }
}
