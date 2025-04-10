import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service'; 
import { PopupNotificationService } from '../../services/popup-notification.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: false,
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  loginError: boolean = false;

  constructor(private authService: AuthService, private router: Router, private popupService: PopupNotificationService,) {}

  // Submit
  onSubmit(): void {
    if (this.username && this.password) {
      this.authService.login(this.username, this.password).subscribe(
        (response: any) => {
          // Store token, move to dashboard
          localStorage.setItem('token', response.token); 
          this.router.navigate(['/home']); 
          console.log(response)
        },
        (error) => {
          this.loginError = true;
          this.popupService.showError('Unable to login. Please try again.');
        }
      );
    }
  }
}
