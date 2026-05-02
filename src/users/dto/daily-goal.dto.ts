import { IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class DailyGoalDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  dailyGoal: number;
}
