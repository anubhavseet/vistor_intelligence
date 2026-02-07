import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserType } from './dto/user.type';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver(() => UserType)
@UseGuards(JwtAuthGuard)
export class UsersResolver {
    constructor(private readonly usersService: UsersService) { }

    @Query(() => [UserType], { name: 'users' })
    findAll() {
        return this.usersService.findAll();
    }

    @Query(() => UserType, { name: 'user' })
    findOne(@Args('id') id: string) {
        return this.usersService.findOne(id);
    }

    @Mutation(() => UserType)
    createUser(@Args('createUserInput') createUserInput: CreateUserInput) {
        return this.usersService.create(createUserInput);
    }

    @Mutation(() => UserType)
    updateUser(@Args('updateUserInput') updateUserInput: UpdateUserInput) {
        return this.usersService.update(updateUserInput.id, updateUserInput);
    }

    @Mutation(() => UserType)
    deleteUser(@Args('id') id: string) {
        return this.usersService.remove(id);
    }
}
