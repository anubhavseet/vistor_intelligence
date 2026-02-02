import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class GeoPoint {
  @Field()
  lat: number;

  @Field()
  lng: number;

  @Field()
  country: string;
}

@ObjectType()
export class CountryCount {
  @Field()
  country: string;

  @Field()
  count: number;
}

@ObjectType()
export class VisitorMap {
  @Field(() => [GeoPoint])
  points: GeoPoint[];

  @Field(() => [CountryCount])
  countryCounts: CountryCount[];

  @Field()
  totalVisitors: number;
}
