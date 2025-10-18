import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';


export type Status = 'todo' | 'in-progress' | 'done';

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: Status;
  done?: boolean;
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/tasks`;

  list(): Observable<Task[]> {
    return this.http.get<Task[]>(this.base);
  }
  create(dto: Partial<Task>): Observable<Task> {
    return this.http.post<Task>(this.base, dto);
  }
  update(id: number, dto: Partial<Task>): Observable<Task> {
    return this.http.patch<Task>(`${this.base}/${id}`, dto);
  }
  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
