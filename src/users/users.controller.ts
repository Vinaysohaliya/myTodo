import { Controller, Get, Patch, Post, Body, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DailyGoalDto } from './dto/daily-goal.dto';
import { IsString, IsNumber } from 'class-validator';

class TimerXpDto {
  @IsNumber()
  minutes: number;
}

class IdentityDto {
  @IsString()
  identityStatement: string;
}

const DEV_USER_ID = 'dev-user';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  // @UseGuards(JwtAuthGuard)
  getMe(@Request() req: any) {
    const user = req.user ?? { id: DEV_USER_ID, name: 'Dev User', email: 'dev@local.dev', avatar: null };
    const { id, name, email, avatar } = user;
    return { id, name, email, avatar };
  }

  @Get('stats')
  // @UseGuards(JwtAuthGuard)
  getStats(@Request() req: any) {
    const userId = req.user?.id ?? DEV_USER_ID;
    return this.usersService.getStats(userId);
  }

  @Patch('me/daily-goal')
  // @UseGuards(JwtAuthGuard)
  updateDailyGoal(@Request() req: any, @Body() dto: DailyGoalDto) {
    const userId = req.user?.id ?? DEV_USER_ID;
    return this.usersService.updateDailyGoal(userId, dto.dailyGoal);
  }

  @Patch('me/identity')
  // @UseGuards(JwtAuthGuard)
  updateIdentity(@Request() req: any, @Body() dto: IdentityDto) {
    const userId = req.user?.id ?? DEV_USER_ID;
    return this.usersService.updateIdentity(userId, dto.identityStatement);
  }

  @Post('me/timer-xp')
  // @UseGuards(JwtAuthGuard)
  awardTimerXp(@Request() req: any, @Body() dto: TimerXpDto) {
    const userId = req.user?.id ?? DEV_USER_ID;
    return this.usersService.awardTimerXp(userId, dto.minutes);
  }
}
