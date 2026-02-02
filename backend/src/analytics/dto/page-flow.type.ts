import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class PageTransition {
  @Field()
  transition: string;

  @Field()
  count: number;
}

@ObjectType()
export class PageFlow {
  @Field(() => [[String]])
  flows: string[][];

  @Field(() => [PageTransition])
  topTransitions: PageTransition[];
}
