'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectWithMembers } from '@/types';
import { CreateProjectDialog } from '@/components/projects/create-project-dialog';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateProject(data: { name: string; description?: string }) {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error('Failed to create project');
    }

    const newProject = await res.json();
    setProjects((prev) => [newProject, ...prev]);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-400">Loading projects...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-zinc-400 mt-1">Manage your projects and tasks</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>New Project</Button>
      </div>

      {projects.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-zinc-400 mb-4">No projects yet</div>
            <Button onClick={() => setDialogOpen(true)}>Create your first project</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="text-white">{project.name}</CardTitle>
                  {project.description && (
                    <CardDescription className="text-zinc-400 line-clamp-2">
                      {project.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-zinc-500">
                    <span>{project._count.tasks} tasks</span>
                    <span>{project.members.length} members</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <CreateProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreateProject}
      />
    </div>
  );
}
