import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const subbagian = searchParams.get('subbagian') || 'All';

    const whereClause: any = {};
    if (subbagian !== 'All') {
      whereClause.subbagian = subbagian;
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        ketuaTim: true,
      }
    });

    // Calculate stats
    const total = tasks.length;
    let completed = 0;
    let inProgress = 0;
    let inReview = 0;

    const teamStats: Record<string, { total: number, completed: number, name: string }> = {};

    tasks.forEach(task => {
      // Basic global counts
      if (task.status === 'Completed') {
        completed++;
      } else if (task.status === 'SedangDikerjakan') {
        inProgress++;
      } else {
        inReview++;
      }

      // Progress stats (grouped by Subbagian)
      if (!teamStats[task.subbagian]) {
        teamStats[task.subbagian] = { total: 0, completed: 0, name: task.subbagian };
      }
      teamStats[task.subbagian].total++;
      if (task.status === 'Completed') {
        teamStats[task.subbagian].completed++;
      }
    });

    return NextResponse.json({
      summary: { total, completed, inProgress, inReview },
      teamStats: Object.values(teamStats),
      tasks // return raw tasks for listing if needed
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard' }, { status: 500 });
  }
}
