import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  username = '';
  password = '';
  rememberMe = false;
  showPassword = signal(false);
  errorMessage = signal('');

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  onSubmit(): void {
    this.errorMessage.set('');
    if (this.auth.login(this.username, this.password)) {
      const user = this.auth.user();
      this.router.navigate([user?.role === 'admin' ? '/admin' : '/']);
    } else {
      this.errorMessage.set(
        'Invalid credentials. Try: alice, bob, charlie, or admin',
      );
    }
  }
}
