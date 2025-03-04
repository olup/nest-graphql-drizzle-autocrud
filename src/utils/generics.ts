import { Field, Float, InputType, Int, ObjectType } from "@nestjs/graphql";

@ObjectType("PageInfo")
export class PageInfo {
  @Field(() => Int)
  // @ts-expect-error we declare it
  public offset: number;
  @Field(() => Int, { nullable: true })
  // @ts-expect-error we declare it
  public limit: number;
  @Field(() => Int)
  // @ts-expect-error we declare it
  public total: number;
}

@InputType("StringFilter")
export class StringFilter {
  @Field(() => String, { nullable: true })
  public equals?: string;
  @Field(() => String, { nullable: true })
  public includes?: string;
  @Field(() => String, { nullable: true })
  public in?: string[];
  @Field(() => [String], { nullable: true })
  public lt?: string;
  @Field(() => String, { nullable: true })
  public lte?: string;
  @Field(() => String, { nullable: true })
  public gt?: string;
  @Field(() => String, { nullable: true })
  public gte?: string;
  @Field(() => Boolean, { nullable: true })
  isNull?: boolean;
}

@InputType("IntFilter")
export class IntFilter {
  @Field(() => Int, { nullable: true })
  public equals?: number;
  @Field(() => Int, { nullable: true })
  public in?: number[];
  @Field(() => [Int], { nullable: true })
  public lt?: number;
  @Field(() => Int, { nullable: true })
  public lte?: number;
  @Field(() => Int, { nullable: true })
  public gt?: number;
  @Field(() => Int, { nullable: true })
  public gte?: number;
  @Field(() => Boolean, { nullable: true })
  isNull?: boolean;
}

@InputType("FloatFilter")
export class FloatFilter {
  @Field(() => Float, { nullable: true })
  public equals?: number;
  @Field(() => Float, { nullable: true })
  public in?: number[];
  @Field(() => [Float], { nullable: true })
  public lt?: number;
  @Field(() => Float, { nullable: true })
  public lte?: number;
  @Field(() => Float, { nullable: true })
  public gt?: number;
  @Field(() => Float, { nullable: true })
  public gte?: number;
  @Field(() => Boolean, { nullable: true })
  isNull?: boolean;
}

@InputType("DateTimeFilter")
export class DateTimeFilter {
  @Field(() => Date, { nullable: true })
  public equals?: Date;
  @Field(() => Date, { nullable: true })
  public in?: Date[];
  @Field(() => [Date], { nullable: true })
  public lt?: Date;
  @Field(() => Date, { nullable: true })
  public lte?: Date;
  @Field(() => Date, { nullable: true })
  public gt?: Date;
  @Field(() => Date, { nullable: true })
  public gte?: Date;
  @Field(() => Boolean, { nullable: true })
  isNull?: boolean;
}

@InputType("BooleanFilter")
export class BooleanFilter {
  @Field(() => Boolean, { nullable: true })
  public equals?: boolean;
  @Field(() => Boolean, { nullable: true })
  isNull?: boolean;
}
