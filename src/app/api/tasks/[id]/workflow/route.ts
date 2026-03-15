import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action, reviewerId, notes } = body;

    // Fetch the task first
    const task = await prisma.task.findUnique({ 
      where: { id },
      include: {
        assignments: true,
      }
    });
    if (!task) return NextResponse.json({ message: "Not found" }, { status: 404 });

    let nextStatus = task.status;
    let reviewerStage = "Anggota Tim";
    let isApproved = true;
    let notifyUserIds: string[] = [];
    let notifyMsg = "";

    // Determine workflow state transition
    if (action === 'submit_to_ketuatim') {
      nextStatus = 'ApprovalKetuaTim';
      notifyUserIds.push(task.ketuaTimId);
      notifyMsg = `Anggota Tim submitted task ${task.title} for your review.`;
    } 
    else if (action === 'reject_by_ketuatim') {
      nextStatus = 'RejectKetuaTim';
      reviewerStage = "Ketua Tim";
      isApproved = false;
      notifyUserIds = task.assignments.map(a => a.userId);
      notifyMsg = `Ketua Tim rejected your work on task ${task.title}.`;
    }
    else if (action === 'submit_to_dalnis') {
      nextStatus = 'ApprovalDalnis';
      reviewerStage = "Ketua Tim";
      notifyUserIds.push(task.dalnisId);
      notifyMsg = `Ketua Tim submitted task ${task.title} for Dalnis review.`;
    }
    else if (action === 'approve_dalnis') {
      nextStatus = 'ApprovalSubkoor';
      reviewerStage = "Dalnis";
      notifyUserIds.push(task.subkoordinatorId);
      notifyMsg = `Dalnis approved task ${task.title}. Waiting for Subkoordinator review.`;
    }
    else if (action === 'reject_dalnis') {
      nextStatus = 'RejectDalnis';
      reviewerStage = "Dalnis";
      isApproved = false;
      notifyUserIds.push(task.ketuaTimId);
      notifyMsg = `Dalnis rejected task ${task.title}.`;
    }
    else if (action === 'approve_subkoor') {
      nextStatus = 'ApprovalKoordinator'; // Based on requirements, but Koordinator is not explicitly assigned, meaning they review all ApprovalKoordinator tasks globally
      reviewerStage = "Subkoordinator";
      isApproved = true;
      // Fetch all coordinators to notify them since they aren't tied to the task directly in relations
      const coordinators = await prisma.user.findMany({ where: { role: 'Koordinator' } });
      notifyUserIds = coordinators.map(c => c.id);
      notifyMsg = `Subkoordinator approved task ${task.title}. Ready for Koordinator Final Approval.`;
    }
    else if (action === 'reject_subkoor') {
      nextStatus = 'RejectSubkoor';
      reviewerStage = "Subkoordinator";
      isApproved = false;
      notifyUserIds.push(task.dalnisId);
      notifyMsg = `Subkoordinator rejected task ${task.title}.`;
    }
    else if (action === 'approve_koor') {
      nextStatus = 'Completed';
      reviewerStage = "Koordinator";
      isApproved = true;
      notifyUserIds.push(task.subkoordinatorId, task.dalnisId, task.ketuaTimId);
      notifyMsg = `Task ${task.title} is fully APPROVED and COMPLETED.`;
    }
    else if (action === 'reject_koor') {
      nextStatus = 'RejectKoordinator';
      reviewerStage = "Koordinator";
      isApproved = false;
      const subkoors = await prisma.user.findMany({ where: { role: 'Subkoordinator' } });
      notifyUserIds = subkoors.map(c => c.id);
      notifyMsg = `Koordinator rejected task ${task.title}.`;
    }
    else {
      return NextResponse.json({ message: "Invalid action" }, { status: 400 });
    }

    // Wrap in transaction: create review log (if applicable), update state, insert notifications
    const updates = [];
    updates.push(prisma.task.update({
      where: { id },
      data: { status: nextStatus }
    }));

    if (reviewerId && reviewerStage !== "Anggota Tim") {
       updates.push(prisma.taskReview.create({
         data: {
           taskId: id,
           stage: reviewerStage,
           reviewerId,
           isApproved,
           notes: notes || ""
         }
       }));
    }

    if (notifyUserIds.length > 0) {
      const notesData = notifyUserIds.map(uid => ({
        userId: uid,
        message: notifyMsg,
        taskId: id
      }));
      updates.push(prisma.notification.createMany({ data: notesData }));
    }

    await prisma.$transaction(updates);

    return NextResponse.json({ message: "Action Processed Successfully" }, { status: 200 });
  } catch (error) {
    console.error('Error processing task action:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
