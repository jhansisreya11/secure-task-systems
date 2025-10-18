import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { Router } from '@angular/router'; 
import { AuthService } from '../../core/auth/auth.service';
import { Task, TaskService, Status } from './task.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.css']
})
export class TasksComponent implements OnInit {
  private tasksApi: TaskService = inject(TaskService);
  auth: AuthService = inject(AuthService);
  private router: Router = inject(Router); 

  title = '';
  description = '';

  tasks = signal<Task[]>([]);
  todo = computed(() => this.tasks().filter(t => t.status === 'todo'));
  inProgress = computed(() => this.tasks().filter(t => t.status === 'in-progress'));
  done = computed(() => this.tasks().filter(t => t.status === 'done'));

  role = computed(() => (this.auth.user()?.role ?? 'Viewer').toLowerCase());
  canEdit = computed<boolean>(() => {
    const r = (this.auth.user()?.role ?? '').toLowerCase();
    return r === 'owner' || r === 'admin';
  });

  ngOnInit() { this.reload(); }

  reload() {
    this.tasksApi.list().subscribe((list: Task[]) => this.tasks.set(list));
  }

  add() {
    if (!this.canEdit()) return;
    if (!this.title.trim()) return;
    this.tasksApi.create({
      title: this.title.trim(),
      description: this.description.trim(),
      status: 'todo',
      done: false,
    }).subscribe((t: Task) => {
      this.tasks.set([...this.tasks(), t]);
      this.title = '';
      this.description = '';
    });
  }

  onDrop(evt: CdkDragDrop<Task>, status: Status) {
    if (!this.canEdit()) return;
    const moved = evt.item.data as Task;
    if (!moved) return;
    if (moved.status === status && moved.done === (status === 'done')) return;

    this.tasks.set(this.tasks().map(t =>
      t.id === moved.id ? { ...t, status, done: status === 'done' } : t));

    this.tasksApi.update(moved.id, { status, done: status === 'done' })
      .subscribe((updated: Task) => {
        this.tasks.set(this.tasks().map(t => t.id === updated.id ? updated : t));
      });
  }

  toggleDone(t: Task) {
    if (!this.canEdit()) return;
    const goingDone = !t.done;
    const nextStatus: Status = goingDone ? 'done' : 'todo';

    this.tasks.set(this.tasks().map(x =>
      x.id === t.id ? { ...x, done: goingDone, status: nextStatus } : x));

    this.tasksApi.update(t.id, { done: goingDone, status: nextStatus })
      .subscribe((u: Task) => {
        this.tasks.set(this.tasks().map(x => x.id === u.id ? u : x));
      });
  }

  changeStatus(t: Task, status: Status) {
    if (!this.canEdit()) return;
    if (t.status === status && t.done === (status === 'done')) return;

    const patch: Partial<Task> = { status, done: status === 'done' };
    this.tasks.set(this.tasks().map(x => x.id === t.id ? { ...x, ...patch } : x));

    this.tasksApi.update(t.id, patch).subscribe((u: Task) => {
      this.tasks.set(this.tasks().map(x => x.id === u.id ? u : x));
    });
  }

  remove(t: Task) {
    if (!this.canEdit()) return;
    this.tasksApi.remove(t.id).subscribe(() => {
      this.tasks.set(this.tasks().filter(x => x.id !== t.id));
    });
  }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login'); 
  }
}
