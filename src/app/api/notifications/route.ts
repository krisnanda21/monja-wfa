import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) return NextResponse.json({ message: 'Missing user context' }, { status: 400 });

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 20
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    if (!userId) return NextResponse.json({ message: 'Missing user context' }, { status: 400 });

    // Mark all as read
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
