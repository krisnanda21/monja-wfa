import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      title, 
      description, 
      subbagian, 
      startDate, 
      endDate, 
      ketuaTimId, 
      dalnisId, 
      subkoordinatorId, 
      anggotaTimIds, 
      assignmentLetterUrl,
      fileAwalFiles,
      fileAwalLinks
    } = body;

    if (!title || !description || !subbagian || !startDate || !endDate || !ketuaTimId || !dalnisId || !subkoordinatorId || !anggotaTimIds.length) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        subbagian,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: 'SedangDikerjakan',
        assignmentLetterUrl,
        ketuaTimId,
        dalnisId,
        subkoordinatorId,
        assignments: {
          create: anggotaTimIds.map((id: string) => ({ userId: id }))
        }
      }
    });

    if (fileAwalFiles && fileAwalFiles.length > 0) {
      await prisma.taskFile.createMany({
        data: fileAwalFiles.map((url: string) => ({
          taskId: task.id,
          uploaderId: ketuaTimId,
          fileUrl: url,
          fileType: 'File',
          notes: 'File Awal'
        }))
      });
    }

    if (fileAwalLinks && fileAwalLinks.length > 0) {
      const linkData = fileAwalLinks.map((link: string) => {
        let formattedUrl = link.trim();
        if (!/^https?:\/\//i.test(formattedUrl)) {
          formattedUrl = `https://${formattedUrl}`;
        }
        return {
          taskId: task.id,
          uploaderId: ketuaTimId,
          fileUrl: formattedUrl,
          fileType: 'Link',
          notes: 'File Awal'
        };
      });

      await prisma.taskFile.createMany({
        data: linkData
      });
    }

    // Create notifications for assigned users
    const notifications = anggotaTimIds.map((id: string) => ({
      userId: id,
      message: `You have been assigned to a new task: ${title}`,
      taskId: task.id
    }));

    // Notify Dalnis and Subkoordinator
    notifications.push({
      userId: dalnisId,
      message: `You are designated as Dalnis for new task: ${title}`,
      taskId: task.id
    });
    
    notifications.push({
      userId: subkoordinatorId,
      message: `You are designated as Subkoordinator for new task: ${title}`,
      taskId: task.id
    });

    await prisma.notification.createMany({
      data: notifications
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ message: 'Internal server error while creating task' }, { status: 500 });
  }
}
