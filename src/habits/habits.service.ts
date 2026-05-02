import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHabitDto } from './dto/create-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';

@Injectable()
export class HabitsService {
  constructor(private prisma: PrismaService) {}

  private today() {
    return new Date().toISOString().slice(0, 10);
  }

  private dateOffset(daysBack: number) {
    const d = new Date();
    d.setDate(d.getDate() - daysBack);
    return d.toISOString().slice(0, 10);
  }

  private async calculateStreak(habitId: string): Promise<number> {
    const logs = await this.prisma.habitLog.findMany({
      where: { habitId },
      orderBy: { date: 'desc' },
      select: { date: true },
    });
    if (logs.length === 0) return 0;

    const today = this.today();
    const yesterday = this.dateOffset(1);
    if (logs[0].date !== today && logs[0].date !== yesterday) return 0;

    let streak = 1;
    for (let i = 1; i < logs.length; i++) {
      const prev = new Date(logs[i - 1].date);
      prev.setDate(prev.getDate() - 1);
      const expected = prev.toISOString().slice(0, 10);
      if (logs[i].date !== expected) break;
      streak++;
    }
    return streak;
  }

  async findAll(userId: string) {
    const habits = await this.prisma.habit.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    const today = this.today();

    return Promise.all(
      habits.map(async (habit) => {
        // Last 7 days dates (oldest → newest)
        const last7Dates = Array.from({ length: 7 }, (_, i) =>
          this.dateOffset(6 - i),
        );

        const logsInRange = await this.prisma.habitLog.findMany({
          where: { habitId: habit.id, date: { gte: last7Dates[0] } },
          select: { date: true },
        });
        const logSet = new Set(logsInRange.map((l) => l.date));
        const last7 = last7Dates.map((d) => logSet.has(d));
        const doneToday = logSet.has(today);
        const currentStreak = await this.calculateStreak(habit.id);

        return { ...habit, last7, doneToday, currentStreak };
      }),
    );
  }

  async create(userId: string, dto: CreateHabitDto) {
    return this.prisma.habit.create({
      data: { id: randomUUID(), userId, ...dto },
    });
  }

  async update(userId: string, id: string, dto: UpdateHabitDto) {
    const habit = await this.prisma.habit.findFirst({ where: { id, userId } });
    if (!habit) throw new NotFoundException('Habit not found');
    return this.prisma.habit.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    const habit = await this.prisma.habit.findFirst({ where: { id, userId } });
    if (!habit) throw new NotFoundException('Habit not found');
    await this.prisma.habit.delete({ where: { id } });
    return { ok: true };
  }

  async logToday(userId: string, habitId: string) {
    const habit = await this.prisma.habit.findFirst({
      where: { id: habitId, userId },
    });
    if (!habit) throw new NotFoundException('Habit not found');

    const today = this.today();
    await this.prisma.habitLog.upsert({
      where: { habitId_date: { habitId, date: today } },
      create: { id: randomUUID(), habitId, userId, date: today },
      update: {},
    });

    const currentStreak = await this.calculateStreak(habitId);
    const xpGained = 25 + Math.min(currentStreak * 2, 50);
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { xp: { increment: xpGained } },
      });
    } catch {
      // non-fatal — don't break the log action
    }
    return { doneToday: true, currentStreak, xpGained };
  }

  async unlogToday(userId: string, habitId: string) {
    const habit = await this.prisma.habit.findFirst({
      where: { id: habitId, userId },
    });
    if (!habit) throw new NotFoundException('Habit not found');

    const today = this.today();
    await this.prisma.habitLog.deleteMany({
      where: { habitId, date: today },
    });
    return { doneToday: false, currentStreak: await this.calculateStreak(habitId) };
  }

  async getCalendar(userId: string, habitId: string) {
    const habit = await this.prisma.habit.findFirst({
      where: { id: habitId, userId },
    });
    if (!habit) throw new NotFoundException('Habit not found');

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 89);
    const startStr = startDate.toISOString().slice(0, 10);

    const logs = await this.prisma.habitLog.findMany({
      where: { habitId, date: { gte: startStr } },
      select: { date: true },
    });
    const logSet = new Set(logs.map((l) => l.date));

    const result: { date: string; done: boolean }[] = [];
    const cursor = new Date(startDate);
    while (cursor <= endDate) {
      const dateStr = cursor.toISOString().slice(0, 10);
      result.push({ date: dateStr, done: logSet.has(dateStr) });
      cursor.setDate(cursor.getDate() + 1);
    }
    return result;
  }
}
