import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { taskSchema } from '@/lib/validations';

async function checkProjectAccess(projectId: string, userId: string) {
  const member = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } }
  });
  return member;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { projectId } = await params;
  const access = await checkProjectAccess(projectId, session.user.id);
  if (!access) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const tasks = await prisma.task.findMany({
    where: { projectId },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true, email: true } }
    },
    orderBy: [{ status: 'asc' }, { order: 'asc' }, { createdAt: 'desc' }]
  });

  return NextResponse.json(tasks);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { projectId } = await params;
  const access = await checkProjectAccess(projectId, session.user.id);
  if (!access) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = taskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const maxOrder = await prisma.task.aggregate({
      where: { projectId, status: parsed.data.status || 'TODO' },
      _max: { order: true }
    });

    const task = await prisma.task.create({
      data: {
        ...parsed.data,
        deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : null,
        projectId,
        creatorId: session.user.id,
        order: (maxOrder._max.order ?? -1) + 1
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } }
      }
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
