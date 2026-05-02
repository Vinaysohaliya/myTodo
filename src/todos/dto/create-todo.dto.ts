import { IsString, IsNotEmpty, IsIn, MaxLength, IsOptional, IsDateString } from 'class-validator';

export class CreateTodoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsIn(['work', 'personal', 'study', 'health'])
  category: string;

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
