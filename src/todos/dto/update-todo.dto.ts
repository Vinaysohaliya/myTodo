import { IsString, IsOptional, IsIn, IsBoolean, MaxLength, IsDateString } from 'class-validator';

export class UpdateTodoDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsIn(['work', 'personal', 'study', 'health'])
  category?: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @IsOptional()
  @IsIn(['low', 'medium', 'high'])
  priority?: string;

  @IsOptional()
  @IsIn(['easy', 'medium', 'hard'])
  difficulty?: string;

  @IsOptional()
  @IsIn(['low', 'medium', 'high'])
  importance?: string;

  @IsOptional()
  @IsIn(['low', 'medium', 'high'])
  urgency?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
