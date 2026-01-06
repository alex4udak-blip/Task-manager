'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TaskWithAssignee, ProjectMemberWithUser } from '@/types';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: TaskWithAssignee | null;
  members: ProjectMemberWithUser[];
  onSubmit: (data: {
    title: string;
    description?: string;
    priority: string;
    status: string;
    deadline?: string | null;
    assigneeId?: string | null;
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export function CreateTaskDialog({
  open,
  onOpenChange,
  task,
  members,
  onSubmit,
  onDelete,
}: CreateTaskDialogProps) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [status, setStatus] = useState('TODO');
  const [deadline, setDeadline] = useState('');
  const [assigneeId, setAssigneeId] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setStatus(task.status);
      setDeadline(task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '');
      setAssigneeId(task.assigneeId || '');
    } else {
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setStatus('TODO');
      setDeadline('');
      setAssigneeId('');
    }
  }, [task, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        title,
        description: description || undefined,
        priority,
        status,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        assigneeId: assigneeId || null,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || !confirm('Are you sure you want to delete this task?')) return;
    setLoading(true);
    try {
      await onDelete();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to delete task:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-white">
            {task ? 'Edit Task' : 'Create Task'}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            {task ? 'Update the task details below.' : 'Fill in the details for your new task.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-zinc-300">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
                required
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-zinc-300">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                rows={3}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="TODO">To Do</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="REVIEW">Review</SelectItem>
                    <SelectItem value="DONE">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deadline" className="text-zinc-300">Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Assignee</Label>
                <Select value={assigneeId} onValueChange={setAssigneeId}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="">Unassigned</SelectItem>
                    {members.map((member) => (
                      <SelectItem key={member.user.id} value={member.user.id}>
                        {member.user.name || member.user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            {task && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                Delete
              </Button>
            )}
            <div className="flex-1" />
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? 'Saving...' : task ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
