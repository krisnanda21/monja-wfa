import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');

    if (!userId || !role) {
      return NextResponse.json({ message: 'Missing user context' }, { status: 400 });
    }

    const roles = role.split(',').map(r => r.trim());
    let whereClause: any = {};

    const seesAllTasks = roles.some(r => ['Koordinator', 'Admin', 'Assesor Utama'].includes(r));

    if (!seesAllTasks) {
      const orConditions: any[] = [];
      if (roles.includes('Anggota Tim')) orConditions.push({ assignments: { some: { userId } } });
      if (roles.includes('Ketua Tim')) orConditions.push({ ketuaTimId: userId });
      if (roles.includes('Dalnis')) orConditions.push({ dalnisId: userId });
      if (roles.includes('Subkoordinator')) orConditions.push({ subkoordinatorId: userId });

      if (orConditions.length > 0) {
        whereClause = { OR: orConditions };
      } else {
        // Fallback: If no recognized roles or empty, return nothing
        whereClause = { id: 'none' };
      }
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: { ketuaTim: true, assignments: { include: { user: true } }, reviews: { include: { reviewer: true } }, files: true },
      orderBy: { startDate: 'desc' }
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error GET my-job:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
