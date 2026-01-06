'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskWithAssignee, ProjectWithMembers } from '@/types';

export default function AnalyticsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<ProjectWithMembers | null>(null);
  const [tasks, setTasks] = useState<TaskWithAssignee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  async function fetchData() {
    try {
      const [projectRes, tasksRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/projects/${projectId}/tasks`),
      ]);

      if (!projectRes.ok) {
        router.push('/projects');
        return;
      }

      const [projectData, tasksData] = await Promise.all([
        projectRes.json(),
        tasksRes.json(),
      ]);

      setProject(projectData);
      setTasks(tasksData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-400">Loading analytics...</div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  const todoCount = tasks.filter((t) => t.status === 'TODO').length;
  const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const reviewCount = tasks.filter((t) => t.status === 'REVIEW').length;
  const doneCount = tasks.filter((t) => t.status === 'DONE').length;
  const overdueCount = tasks.filter(
    (t) => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'DONE'
  ).length;

  const total = tasks.length;
  const completionRate = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  const stats = [
    { name: 'To Do', value: todoCount, color: 'bg-zinc-500' },
    { name: 'In Progress', value: inProgressCount, color: 'bg-blue-500' },
    { name: 'Review', value: reviewCount, color: 'bg-yellow-500' },
    { name: 'Done', value: doneCount, color: 'bg-green-500' },
    { name: 'Overdue', value: overdueCount, color: 'bg-red-500' },
  ];

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-1">
          <Link href="/projects" className="hover:text-zinc-300">Projects</Link>
          <span>/</span>
          <Link href={`/projects/${projectId}`} className="hover:text-zinc-300">{project.name}</Link>
          <span>/</span>
          <span className="text-zinc-300">Analytics</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-8">
        {stats.map((stat) => (
          <Card key={stat.name} className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">{stat.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Task Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.slice(0, 4).map((stat) => (
                <div key={stat.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-400">{stat.name}</span>
                    <span className="text-white">{stat.value}</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${stat.color} rounded-full transition-all`}
                      style={{ width: `${total > 0 ? (stat.value / total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="relative">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-zinc-800"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${completionRate * 3.52} 352`}
                    className="text-green-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">{completionRate}%</span>
                </div>
              </div>
            </div>
            <p className="text-center text-zinc-400">
              {doneCount} of {total} tasks completed
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
