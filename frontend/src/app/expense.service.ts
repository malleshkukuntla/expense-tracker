import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type TxType = 'expense' | 'income';

export interface Expense {
  id?: number;
  title: string;
  amount: number | null;
  type: TxType;
  category: string;
  date: string;
}

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private api = '/api/expenses';
  constructor(private http: HttpClient) {}

  list(): Observable<Expense[]> { return this.http.get<Expense[]>(this.api); }
  add(e: Expense): Observable<Expense> { return this.http.post<Expense>(this.api, e); }
  update(id: number, e: Expense): Observable<Expense> { return this.http.put<Expense>(`${this.api}/${id}`, e); }
  remove(id: number): Observable<void> { return this.http.delete<void>(`${this.api}/${id}`); }
}
