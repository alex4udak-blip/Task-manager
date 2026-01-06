import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const reorderSchema = z.object({
  taskId: z.string(),
  newStatus: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']),
  newOrder: z.number(),
  projectId: z.string(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = reorderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const { taskId, newStatus, newOrder, projectId } = parsed.data;

    const member = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: session.user.id, projectId } }
    });

    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.projectId !== projectId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Update order for other tasks in the same status
    await prisma.task.updateMany({
      where: {
        projectId,
        status: newStatus,
        order: { gte: newOrder },
        id: { not: taskId }
      },
      data: { order: { increment: 1 } }
    });

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { status: newStatus, order: newOrder },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } }
      }
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Reorder task error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
