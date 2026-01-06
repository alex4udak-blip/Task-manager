'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Board } from '@/components/kanban/board';
import { CreateTaskDialog } from '@/components/kanban/create-task-dialog';
import { InviteDialog } from '@/components/projects/invite-dialog';
import { TaskWithAssignee, ProjectWithMembers, ProjectMemberWithUser } from '@/types';

export default function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<ProjectWithMembers | null>(null);
  const [tasks, setTasks] = useState<TaskWithAssignee[]>([]);
  const [members, setMembers] = useState<ProjectMemberWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskWithAssignee | null>(null);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  async function fetchData() {
    try {
      const [projectRes, tasksRes, membersRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/projects/${projectId}/tasks`),
        fetch(`/api/projects/${projectId}/members`),
      ]);

      if (!projectRes.ok) {
        router.push('/projects');
        return;
      }

      const [projectData, tasksData, membersData] = await Promise.all([
        projectRes.json(),
        tasksRes.json(),
        membersRes.json(),
      ]);

      setProject(projectData);
      setTasks(tasksData);
      setMembers(membersData);
    } catch (error) {
      console.error('Failed to fetch project data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTask(data: Parameters<typeof CreateTaskDialog>[0]['onSubmit'] extends (data: infer T) => unknown ? T : never) {
    const res = await fetch(`/api/projects/${projectId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error('Failed to create task');

    const newTask = await res.json();
    setTasks((prev) => [...prev, newTask]);
  }

  async function handleUpdateTask(data: Parameters<typeof CreateTaskDialog>[0]['onSubmit'] extends (data: infer T) => unknown ? T : never) {
    if (!selectedTask) return;

    const res = await fetch(`/api/tasks/${selectedTask.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error('Failed to update task');

    const updatedTask = await res.json();
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
  }

  async function handleDeleteTask() {
    if (!selectedTask) return;

    const res = await fetch(`/api/tasks/${selectedTask.id}`, {
      method: 'DELETE',
    });

    if (!res.ok) throw new Error('Failed to delete task');

    setTasks((prev) => prev.filter((t) => t.id !== selectedTask.id));
    setSelectedTask(null);
  }

  async function handleTaskReorder(taskId: string, newStatus: string, newOrder: number) {
    const res = await fetch('/api/tasks/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, newStatus, newOrder, projectId }),
    });

    if (!res.ok) throw new Error('Failed to reorder task');
  }

  async function handleInvite(email: string) {
    const res = await fetch(`/api/projects/${projectId}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to send invite');
    }
  }

  function handleTaskClick(task: TaskWithAssignee) {
    setSelectedTask(task);
    setTaskDialogOpen(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-400">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-zinc-500 mb-1">
            <Link href="/projects" className="hover:text-zinc-300">Projects</Link>
            <span>/</span>
            <span className="text-zinc-300">{project.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-white">{project.name}</h1>
          {project.description && (
            <p className="text-zinc-400 mt-1">{project.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setInviteDialogOpen(true)}>
            Invite
          </Button>
          <Link href={`/projects/${projectId}/analytics`}>
            <Button variant="outline">Analytics</Button>
          </Link>
          <Button onClick={() => { setSelectedTask(null); setTaskDialogOpen(true); }}>
            New Task
          </Button>
        </div>
      </div>

      <Board
        tasks={tasks}
        projectId={projectId}
        onTaskUpdate={async () => {}}
        onTaskReorder={handleTaskReorder}
        onTaskClick={handleTaskClick}
      />

      <CreateTaskDialog
        open={taskDialogOpen}
        onOpenChange={(open) => {
          setTaskDialogOpen(open);
          if (!open) setSelectedTask(null);
        }}
        task={selectedTask}
        members={members}
        onSubmit={selectedTask ? handleUpdateTask : handleCreateTask}
        onDelete={selectedTask ? handleDeleteTask : undefined}
      />

      <InviteDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onInvite={handleInvite}
      />
    </div>
  );
}
