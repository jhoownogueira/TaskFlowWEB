import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export enum TaskStatusEnum {
  TODO = 'TODO',
  DOING = 'DOING',
  DONE = 'DONE',
}

export interface PageData {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatusEnum;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskPage extends PageData {
  items: Task[];
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  list(): Observable<TaskPage> {
    return this.http.get<TaskPage>(`${this.apiUrl}/tasks?page=1`);
  }

  create(title: string): Observable<Task> {
    return this.http.post<Task>(`${this.apiUrl}/tasks`, { title });
  }

  toggleDone(id: string, status: TaskStatusEnum): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/tasks/${id}`, { status });
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tasks/${id}`);
  }
}
