import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, HttpCode, UseGuards, Request,
} from '@nestjs/common';
import { TodosService } from './todos.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const DEV_USER_ID = 'dev-user';

@Controller('todos')
// @UseGuards(JwtAuthGuard)
export class TodosController {
  constructor(private todosService: TodosService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.todosService.findAll(req.user?.id ?? DEV_USER_ID);
  }

  @Get('stats')
  stats(@Request() req: any) {
    return this.todosService.stats(req.user?.id ?? DEV_USER_ID);
  }

  @Post()
  create(@Request() req: any, @Body() dto: CreateTodoDto) {
    return this.todosService.create(req.user?.id ?? DEV_USER_ID, dto);
  }

  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateTodoDto) {
    return this.todosService.update(req.user?.id ?? DEV_USER_ID, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Request() req: any, @Param('id') id: string) {
    return this.todosService.remove(req.user?.id ?? DEV_USER_ID, id);
  }
}
