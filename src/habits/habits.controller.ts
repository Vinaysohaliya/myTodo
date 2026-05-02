import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Request,
} from '@nestjs/common';
import { HabitsService } from './habits.service';
import { CreateHabitDto } from './dto/create-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';

const DEV_USER_ID = 'dev-user';

@Controller('habits')
export class HabitsController {
  constructor(private habitsService: HabitsService) {}

  @Get()
  // @UseGuards(JwtAuthGuard)
  findAll(@Request() req: any) {
    const userId = req.user?.id ?? DEV_USER_ID;
    return this.habitsService.findAll(userId);
  }

  @Post()
  // @UseGuards(JwtAuthGuard)
  create(@Request() req: any, @Body() dto: CreateHabitDto) {
    const userId = req.user?.id ?? DEV_USER_ID;
    return this.habitsService.create(userId, dto);
  }

  @Patch(':id')
  // @UseGuards(JwtAuthGuard)
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateHabitDto) {
    const userId = req.user?.id ?? DEV_USER_ID;
    return this.habitsService.update(userId, id, dto);
  }

  @Delete(':id')
  // @UseGuards(JwtAuthGuard)
  remove(@Request() req: any, @Param('id') id: string) {
    const userId = req.user?.id ?? DEV_USER_ID;
    return this.habitsService.remove(userId, id);
  }

  @Post(':id/log')
  // @UseGuards(JwtAuthGuard)
  logToday(@Request() req: any, @Param('id') id: string) {
    const userId = req.user?.id ?? DEV_USER_ID;
    return this.habitsService.logToday(userId, id);
  }

  @Delete(':id/log')
  // @UseGuards(JwtAuthGuard)
  unlogToday(@Request() req: any, @Param('id') id: string) {
    const userId = req.user?.id ?? DEV_USER_ID;
    return this.habitsService.unlogToday(userId, id);
  }

  @Get(':id/calendar')
  // @UseGuards(JwtAuthGuard)
  getCalendar(@Request() req: any, @Param('id') id: string) {
    const userId = req.user?.id ?? DEV_USER_ID;
    return this.habitsService.getCalendar(userId, id);
  }
}
