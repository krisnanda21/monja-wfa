import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    if (!id) return NextResponse.json({ message: 'Missing task ID' }, { status: 400 });

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        ketuaTim: true,
        dalnis: true,
        subkoordinator: true,
        assignments: {
          include: { user: true }
        },
        files: {
          include: { uploader: true },
          orderBy: { createdAt: 'desc' }
        },
        reviews: {
          include: { reviewer: true },
          orderBy: { timestamp: 'desc' }
        }
      }
    });

    if (!task) {
      return NextResponse.json({ message: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error fetching task details:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
