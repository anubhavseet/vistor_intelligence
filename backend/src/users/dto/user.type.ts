import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType('User')
export class UserType {
    @Field(() => ID)
    id: string;

    @Field()
    email: string;

    @Field()
    name: string;

    @Field()
    role: string;

    @Field()
    isActive: boolean;

    @Field({ nullable: true })
    lastLoginAt?: Date;

    @Field()
    createdAt: Date;

    @Field()
    updatedAt: Date;
}
