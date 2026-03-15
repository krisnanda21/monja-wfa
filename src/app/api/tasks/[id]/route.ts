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

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ message: 'Missing task ID' }, { status: 400 });

    await prisma.task.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ message: 'Internal server error while deleting task.' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ message: 'Missing task ID' }, { status: 400 });

    const body = await req.json();
    const {
      title, description, subbagian, startDate, endDate, dalnisId, subkoordinatorId, anggotaTimIds, assignmentLetterUrl
    } = body;

    const dataPayload: any = {
      title, description, subbagian, 
      startDate: new Date(startDate), 
      endDate: new Date(endDate),
      dalnisId, subkoordinatorId,
    };
    
    if (assignmentLetterUrl !== undefined) {
      dataPayload.assignmentLetterUrl = assignmentLetterUrl;
    }

    if (anggotaTimIds && Array.isArray(anggotaTimIds)) {
      dataPayload.assignments = {
        deleteMany: {},
        create: anggotaTimIds.map((userId: string) => ({ userId }))
      };
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: dataPayload
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ message: 'Internal server error while updating task.' }, { status: 500 });
  }
}

