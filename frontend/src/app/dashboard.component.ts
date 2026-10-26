import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Expense, ExpenseService, TxType } from './expense.service';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  currency = 'INR'; // change to 'USD', 'EUR', ... if needed

  categories = ['Food', 'Transport', 'Study', 'Bills', 'Fun', 'Health', 'Allowance', 'Other'];
  colors: Record<string, string> = {
    Food: '#f08a24', Transport: '#3b82f6', Study: '#7c5cf0', Bills: '#e5484d',
    Fun: '#e255a1', Health: '#0f9d8a', Allowance: '#14a44d', Other: '#8a90b5',
  };

  expenses: Expense[] = [];
  form: Expense = this.blank();
  editingId: number | null = null;
  search = '';
  typeFilter: 'all' | TxType = 'all';
  message = '';

  constructor(private api: ExpenseService, private auth: AuthService) {}

  ngOnInit() { this.load(); }

  get user() { return this.auth.user; }
  logout() { this.auth.logout(); }

  blank(): Expense {
    return { title: '', amount: null, type: 'expense', category: 'Food', date: new Date().toISOString().slice(0, 10) };
  }

  load() {
    this.api.list().subscribe({
      next: (data) => { this.expenses = data; this.message = ''; },
      error: () => (this.message = "Can't reach the server. Run \"npm start\" inside the backend folder."),
    });
  }

  // ---- totals ----
  get income() { return this.sum('income'); }
  get spent() { return this.sum('expense'); }
  get balance() { return this.income - this.spent; }
  get percentSpent() { return this.income ? Math.min(100, Math.round((this.spent / this.income) * 100)) : 0; }
  get ringOffset() { return 326.7 * (1 - this.percentSpent / 100); }

  private sum(type: TxType) {
    return this.expenses.filter((e) => e.type === type).reduce((t, e) => t + (e.amount || 0), 0);
  }

  get byCategory() {
    const totals: Record<string, number> = {};
    this.expenses.filter((e) => e.type === 'expense').forEach((e) => (totals[e.category] = (totals[e.category] || 0) + (e.amount || 0)));
    const rows = Object.entries(totals).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total);
    const max = rows.length ? rows[0].total : 1;
    return rows.map((r) => ({ ...r, width: Math.round((r.total / max) * 100) }));
  }

  get visible() {
    const q = this.search.trim().toLowerCase();
    return this.expenses
      .filter((e) => (this.typeFilter === 'all' || e.type === this.typeFilter) && (!q || e.title.toLowerCase().includes(q) || e.category.toLowerCase().includes(q)))
      .sort((a, b) => b.date.localeCompare(a.date) || (b.id || 0) - (a.id || 0));
  }

  // ---- actions ----
  save() {
    if (!this.form.title.trim() || !this.form.amount || this.form.amount <= 0) {
      this.message = 'Enter a title and an amount greater than 0.';
      return;
    }
    const done = () => { this.cancel(); this.load(); };
    const fail = (err: any) => (this.message = err?.error?.message || 'Could not save the transaction.');
    if (this.editingId) this.api.update(this.editingId, this.form).subscribe({ next: done, error: fail });
    else this.api.add(this.form).subscribe({ next: done, error: fail });
  }

  edit(e: Expense) {
    this.editingId = e.id!;
    this.form = { ...e };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancel() { this.editingId = null; this.form = this.blank(); this.message = ''; }

  remove(e: Expense) {
    if (!confirm(`Delete "${e.title}"?`)) return;
    this.api.remove(e.id!).subscribe({ next: () => this.load(), error: () => (this.message = 'Could not delete the transaction.') });
  }
}
