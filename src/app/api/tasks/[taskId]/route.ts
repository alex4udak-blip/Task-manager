import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { taskSchema } from '@/lib/validations';

async function checkTaskAccess(taskId: string, userId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: {
        include: {
          members: { where: { userId } }
        }
      }
    }
  });
  return task && task.project.members.length > 0 ? task : null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { taskId } = await params;
  const task = await checkTaskAccess(taskId, session.user.id);
  if (!task) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = taskSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.deadline !== undefined) {
      updateData.deadline = parsed.data.deadline ? new Date(parsed.data.deadline) : null;
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } }
      }
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Update task error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { taskId } = await params;
  const task = await checkTaskAccess(taskId, session.user.id);
  if (!task) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.task.delete({ where: { id: taskId } });

  return NextResponse.json({ success: true });
}
