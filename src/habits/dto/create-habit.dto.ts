import { IsString, IsOptional, MinLength } from 'class-validator';

export class CreateHabitDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsOptional()
  @IsString()
  identityStatement?: string;

  @IsOptional()
  @IsString()
  twoMinuteStarter?: string;

  @IsOptional()
  @IsString()
  implementationWhen?: string;

  @IsOptional()
  @IsString()
  implementationWhere?: string;
}
