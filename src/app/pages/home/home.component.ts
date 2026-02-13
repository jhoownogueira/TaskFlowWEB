import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { AuthStore } from '../../auth/auth.store';
import { Router } from '@angular/router';
import { Task, TaskPage, TaskService, TaskStatusEnum } from '../../services/task.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
})
export class HomeComponent {
  private tasksApi = inject(TaskService);
  private auth = inject(AuthStore);
  private router = inject(Router);

  tasks = signal<TaskPage | null>(null);
  loading = signal(false);
  errorMsg = signal('');
  newTitle = signal('');

  ngOnInit() {
    this.load();
  }

  load() {
    this.errorMsg.set('');
    this.loading.set(true);

    this.tasksApi
      .list()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => this.tasks.set(data),
        error: (err) => {
          this.errorMsg.set(err?.error?.message ?? 'Erro ao carregar tarefas.');
        },
      });
  }

  add() {
    const title = this.newTitle().trim();
    if (!title) return;

    this.loading.set(true);
    this.tasksApi
      .create(title)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (created) => {
          this.tasks.set({
            ...this.tasks()!,
            items: [created, ...(this.tasks()!.items || [])],
          });
          this.newTitle.set('');
        },
        error: (err) => this.errorMsg.set(err?.error?.message ?? 'Erro ao criar tarefa.'),
      });
  }

  toggle(t: Task) {
    const prev = this.tasks();
    if (!prev) return;
    this.tasks.set({
      ...prev,
      items: prev.items.map((x) =>
        x.id === t.id
          ? {
              ...x,
              status: x.status === TaskStatusEnum.DONE ? TaskStatusEnum.TODO : TaskStatusEnum.DONE,
            }
          : x,
      ),
    });

    this.tasksApi
      .toggleDone(
        t.id,
        t.status === TaskStatusEnum.DONE ? TaskStatusEnum.TODO : TaskStatusEnum.DONE,
      )
      .subscribe({
        next: () => {},
        error: (err) => {
          this.tasks.set(prev);
          this.errorMsg.set(err?.error?.message ?? 'Erro ao atualizar tarefa.');
        },
      });
  }

  remove(t: Task) {
    const prev = this.tasks();
    if (!prev) return;
    this.tasks.set({
      ...prev,
      items: prev.items.filter((x) => x.id !== t.id),
    });

    this.tasksApi.remove(t.id).subscribe({
      next: () => {},
      error: (err) => {
        this.tasks.set(prev);
        this.errorMsg.set(err?.error?.message ?? 'Erro ao remover tarefa.');
      },
    });
  }

  logout() {
    this.auth.clear();
    this.router.navigateByUrl('/login');
  }
}
