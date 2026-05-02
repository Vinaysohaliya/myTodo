import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 9000];
const LEVEL_TITLES = ['Beginner', 'Apprentice', 'Practitioner', 'Achiever', 'Specialist', 'Expert', 'Master', 'Elite', 'Champion', 'Legend'];
const MAX_LEVEL = LEVEL_THRESHOLDS.length;

function computeLevel(xp: number) {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) { level = i + 1; break; }
  }
  if (level > MAX_LEVEL) level = MAX_LEVEL;
  const currentXP = LEVEL_THRESHOLDS[level - 1];
  const nextXP    = level < MAX_LEVEL ? LEVEL_THRESHOLDS[level] : LEVEL_THRESHOLDS[MAX_LEVEL - 1];
  return {
    level,
    title: LEVEL_TITLES[level - 1],
    currentLevelXP: currentXP,
    nextLevelXP: nextXP,
  };
}

type StatsFields = 'totalCompleted' | 'longestStreak' | 'focusSessions';
const BADGES: { id: string; label: string; emoji: string; threshold: number; field: StatsFields }[] = [
  { id: 'first_task', label: 'First Task',        emoji: '🌱', threshold: 1,  field: 'totalCompleted' },
  { id: 'tasks_10',   label: '10 Tasks Done',     emoji: '⚡', threshold: 10, field: 'totalCompleted' },
  { id: 'tasks_25',   label: '25 Tasks Done',     emoji: '💪', threshold: 25, field: 'totalCompleted' },
  { id: 'tasks_50',   label: '50 Tasks Done',     emoji: '🏆', threshold: 50, field: 'totalCompleted' },
  { id: 'streak_3',   label: '3-Day Streak',      emoji: '🔥', threshold: 3,  field: 'longestStreak'  },
  { id: 'streak_7',   label: '7-Day Streak',      emoji: '💎', threshold: 7,  field: 'longestStreak'  },
  { id: 'focus_5',    label: '5 Focus Sessions',  emoji: '🎯', threshold: 5,  field: 'focusSessions'  },
  { id: 'focus_10',   label: '10 Focus Sessions', emoji: '🧠', threshold: 10, field: 'focusSessions'  },
];

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async getStats(userId: string) {
    let user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;

    const today     = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    // Auto-reset streak if the user missed a day
    if (
      user.currentStreak > 0 &&
      user.lastCompletedDate &&
      user.lastCompletedDate !== today &&
      user.lastCompletedDate !== yesterday
    ) {
      user = await this.prisma.user.update({
        where: { id: userId },
        data:  { currentStreak: 0 },
      });
    }

    const todayTodos = await this.prisma.todo.findMany({
      where: { userId, completed: true, updatedAt: { gte: new Date(today) } },
    });

    const stats = {
      totalCompleted: user.totalCompleted,
      longestStreak:  user.longestStreak,
      focusSessions:  user.focusSessions ?? 0,
    };
    const earnedBadges = BADGES.filter(b => (stats[b.field] ?? 0) >= b.threshold).map(b => ({
      id: b.id, label: b.label, emoji: b.emoji,
    }));

    const levelInfo = computeLevel(user.xp ?? 0);

    return {
      currentStreak:  user.currentStreak,
      longestStreak:  user.longestStreak,
      dailyGoal:      user.dailyGoal,
      todayDone:      todayTodos.length,
      totalCompleted: user.totalCompleted,
      focusSessions:  user.focusSessions ?? 0,
      badges:         earnedBadges,
      xp:             user.xp ?? 0,
      level:          levelInfo.level,
      levelTitle:     levelInfo.title,
      currentLevelXP: levelInfo.currentLevelXP,
      nextLevelXP:    levelInfo.nextLevelXP,
    };
  }

  async updateDailyGoal(userId: string, dailyGoal: number) {
    return this.prisma.user.update({ where: { id: userId }, data: { dailyGoal } });
  }

  async updateIdentity(userId: string, identityStatement: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { identityStatement },
      select: { identityStatement: true },
    });
  }

  async awardTimerXp(userId: string, minutes: number) {
    const xp = minutes === 2 ? 15 : 60;
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { xp: { increment: xp }, focusSessions: { increment: 1 } },
      });
    } catch {
      // non-fatal
    }
    return { xpGained: xp };
  }
}
