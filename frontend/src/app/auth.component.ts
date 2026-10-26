import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css',
})
export class AuthComponent implements OnInit {
  mode: 'login' | 'register' = 'login';
  name = '';
  email = '';
  password = '';
  error = '';
  busy = false;

  constructor(private auth: AuthService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    // The same component serves /login and /register, so react to route changes.
    this.route.data.subscribe((d) => { this.mode = d['mode']; this.error = ''; });
  }

  submit() {
    this.error = '';
    if (this.mode === 'register' && !this.name.trim()) { this.error = 'Enter your name.'; return; }
    if (!this.email.trim() || !this.password) { this.error = 'Enter your email and password.'; return; }
    if (this.mode === 'register' && this.password.length < 6) { this.error = 'Password must be at least 6 characters.'; return; }

    this.busy = true;
    const request = this.mode === 'login'
      ? this.auth.login(this.email, this.password)
      : this.auth.register(this.name, this.email, this.password);

    request.subscribe({
      next: () => this.router.navigate(['/']),
      error: (e) => {
        this.busy = false;
        this.error = e.status === 0
          ? "Can't reach the server. Run \"npm start\" inside the backend folder."
          : e?.error?.message || 'Something went wrong. Try again.';
      },
    });
  }
}
