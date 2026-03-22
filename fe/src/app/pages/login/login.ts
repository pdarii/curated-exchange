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

  async onSubmit(): Promise<void> {
    this.errorMessage.set('');
    try {
      await this.auth.login(this.username, this.password);

      // We need to wait for the profile to be fetched before we can check the role
      // Instead of manual waiting, we can navigate to '/' and let the guards handle it
      // or we can wait for authInitialized.
      this.router.navigate(['/']);
    } catch (err: any) {
      console.error('Login.onSubmit: Login failed', err);
      this.errorMessage.set(err.message || 'Login failed');
    }
  }

  async onSignUp(): Promise<void> {
    this.errorMessage.set('');
    try {
      // For simplicity in this UI, we use username as display name
      await this.auth.signUp(this.username, this.password, this.username);
      this.router.navigate(['/']);
    } catch (err: any) {
      console.error('Login.onSignUp: Sign up failed', err);
      this.errorMessage.set(err.message || 'Sign up failed');
    }
  }
}
