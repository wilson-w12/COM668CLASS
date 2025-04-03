import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  standalone: false,
})
export class HeaderComponent implements OnInit {
  isLoggedIn = false;  
  isAdmin = false; // Direct boolean for admin state, not an observable

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Subscribe to login state changes
    this.authService.isAuthenticated().subscribe((isValid) => {
      this.isLoggedIn = isValid;
      console.log("isLoggedIn: " + this.isLoggedIn);

      // Now check if the user is an admin (if logged in)
      if (this.isLoggedIn) {
        this.authService.isAdmin().subscribe((isAdmin) => {
          this.isAdmin = isAdmin;
          console.log("isAdmin: " + this.isAdmin);
        });
      }
    });
  }
}
