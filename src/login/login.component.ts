import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service'; 
import { CommonModule } from '@angular/common';  // Common directives like *ngIf
import { FormsModule } from '@angular/forms';   // Required for ngModel and ngForm

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]  
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  loginError: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  // Method to handle form submission
  onSubmit(): void {
    if (this.username && this.password) {
      this.authService.login(this.username, this.password).subscribe(
        (response: any) => {
          // On successful login, store the token and navigate to the dashboard
          localStorage.setItem('token', response.token); // Store token in local storage
          this.router.navigate(['/home']); // Redirect to dashboard or other protected route
          console.log(response)
        },
        (error) => {
          // Handle login error
          this.loginError = true;
        }
      );
    }
  }
}
