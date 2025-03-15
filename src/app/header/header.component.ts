import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  standalone: false,
})
export class HeaderComponent implements OnInit {
  isLoggedIn = false; // Default to not logged in

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Subscribe to login state changes
    this.authService.isAuthenticated().subscribe((isValid) => {
      this.isLoggedIn = isValid;
      console.log("isLoggedIn: "+this.isLoggedIn)
    });
  }

  // Call logout method
  logout(): void {
    this.authService.logout();
  }
}
