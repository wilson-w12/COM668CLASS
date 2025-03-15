import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  standalone: true,
  imports: [CommonModule]  // Add CommonModule to imports
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
