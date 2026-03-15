import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { uploaderId, fileUrl, fileType, notes } = await req.json();

    const file = await prisma.taskFile.create({
      data: {
        taskId: id,
        uploaderId,
        fileUrl,
        fileType,
        notes,
        status: 'Pending'
      }
    });

    // Notify Ketua Tim if uploaded by Anggota Tim
    const task = await prisma.task.findUnique({ where: { id } });
    const uploaderUser = await prisma.user.findUnique({ where: { id: uploaderId }});
    
    if (task && uploaderUser?.role === 'Anggota Tim') {
      await prisma.notification.create({
        data: {
          userId: task.ketuaTimId,
          taskId: id,
          message: `${uploaderUser.name} uploaded a new file for task: ${task.title}`
        }
      });
    }

    return NextResponse.json(file);
  } catch (error) {
    console.error('Error adding file:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { fileId, status } = body; 
    // status = 'Approved' or 'Rejected'

    const updatedFile = await prisma.taskFile.update({
      where: { id: fileId },
      data: { status }
    });

    // Notify uploader about rejection/approval
    await prisma.notification.create({
      data: {
        userId: updatedFile.uploaderId,
        taskId: id,
        message: `Your uploaded file has been ${status} by Ketua Tim.`
      }
    });

    return NextResponse.json(updatedFile);
  } catch (error) {
    console.error('Error updating file status:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { fileId, userId } = body;

    const file = await prisma.taskFile.findUnique({ where: { id: fileId } });
    if (!file || file.taskId !== id) {
      return NextResponse.json({ message: "File not found" }, { status: 404 });
    }

    if (file.uploaderId !== userId) {
      return NextResponse.json({ message: "Unauthorized to delete this file" }, { status: 403 });
    }

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return NextResponse.json({ message: "Task not found" }, { status: 404 });

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (user?.role === 'Anggota Tim') {
       if (task.status !== 'SedangDikerjakan' && task.status !== 'RejectKetuaTim') {
           return NextResponse.json({ message: "File cannot be deleted at this stage." }, { status: 403 });
       }
    }

    await prisma.taskFile.delete({ where: { id: fileId } });

    return NextResponse.json({ success: true, message: "File deleted successfully" });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
