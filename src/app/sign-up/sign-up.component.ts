import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service'; // Import the AuthService to handle sign-up

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css'],
  standalone: false,
})
export class SignUpComponent {
  username: string = '';
  password: string = '';
  confirmPassword: string = '';  // Add confirmPassword field
  signUpError: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  // Method to handle form submission
  onSubmit(): void {
    // Check if passwords match
    if (this.password !== this.confirmPassword) {
      this.signUpError = true;
      return; // Do not proceed if passwords do not match
    }

    if (this.username && this.password && this.confirmPassword) {
      // Call the sign-up method instead of login
      this.authService.signUp(this.username, this.password).subscribe(
        (response: any) => {
          // On successful sign up, store the token and navigate to the dashboard
          localStorage.setItem('token', response.access_token); // Store token in local storage
          this.router.navigate(['/dashboard']); // Redirect to dashboard or other protected route
        },
        (error) => {
          // Handle sign up error
          this.signUpError = true;
        }
      );
    }
  }
}
