import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';

const DEV_USER_ID = 'dev-user';

@Injectable()
export class TodosService {
  constructor(private prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.todo.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async stats(userId: string) {
    const todos = await this.prisma.todo.findMany({ where: { userId } });
    const categories = ['work', 'personal', 'study', 'health'];
    return categories.map((category) => ({
      category,
      total: todos.filter((t) => t.category === category).length,
      done:  todos.filter((t) => t.category === category && t.completed).length,
    }));
  }

  create(userId: string, dto: CreateTodoDto) {
    return this.prisma.todo.create({ data: { ...dto, userId } });
  }

  async update(userId: string, id: string, dto: UpdateTodoDto) {
    const todo = await this.prisma.todo.findFirst({ where: { id, userId } });
    if (!todo) throw new NotFoundException('Todo not found');

    const updated = await this.prisma.todo.update({ where: { id }, data: dto });

    // Update streak + XP when task is newly completed
    if (dto.completed === true && !todo.completed) {
      await this.updateStreak(userId, updated);
    }

    return updated;
  }

  async remove(userId: string, id: string) {
    const todo = await this.prisma.todo.findFirst({ where: { id, userId } });
    if (!todo) throw new NotFoundException('Todo not found');
    await this.prisma.todo.delete({ where: { id } });
  }

  private async updateStreak(userId: string, todo: { difficulty?: string; importance?: string; urgency?: string }) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) return;

      const DIFF: Record<string, number>   = { easy: 1, medium: 2, hard: 3 };
      const WEIGHT: Record<string, number> = { low: 1, medium: 2, high: 3 };
      const xpGain =
        (DIFF[todo.difficulty ?? 'medium'] ?? 2) *
        (WEIGHT[todo.importance ?? 'medium'] ?? 2) *
        (WEIGHT[todo.urgency ?? 'medium'] ?? 2) * 5;
      const today = new Date().toISOString().slice(0, 10);
      const last = user.lastCompletedDate;

      let currentStreak = user.currentStreak;

      if (last === today) {
        // Already counted today — just bump totalCompleted + xp
        await this.prisma.user.update({
          where: { id: userId },
          data: { totalCompleted: { increment: 1 }, xp: { increment: xpGain } },
        });
        return;
      }

      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      if (last === yesterday) {
        currentStreak += 1;
      } else {
        currentStreak = 1;
      }

      const longestStreak = Math.max(currentStreak, user.longestStreak);

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          currentStreak,
          longestStreak,
          lastCompletedDate: today,
          totalCompleted: { increment: 1 },
          xp: { increment: xpGain },
        },
      });
    } catch {
      // non-fatal
    }
  }
}
