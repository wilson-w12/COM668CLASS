import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { TeacherService } from '../../services/teacher.service';
import { PopupNotificationService } from '../../services/popup-notification.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css'],
  standalone: false
})

export class AccountComponent implements OnInit {
  isEditing: boolean = false;
  user: any = {};
  tempUser: any = {};
  errors = {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    verification_code: '',
    password: '',
    confirm_password: ''
  };
  verificationCode: string = '';
  newPassword: string = '';
  confirmPassword: string = '';

  constructor(private teacherService: TeacherService, private http: HttpClient, private popupService: PopupNotificationService, private router: Router,) { }

  ngOnInit() {
    this.fetchTeacherDetails();
  }

  // Fetch teacher details 
  fetchTeacherDetails() {
    const teacherId = this.teacherService.getTeacherIdFromToken();
    if (!teacherId) {
      console.error('No teacher ID found in token');
      return;
    }

    this.teacherService.getTeacher(teacherId).subscribe(
      (response: any) => {
        this.user = response;
        this.tempUser = { ...response };
      },
      (error) => {
        console.error('Error fetching teacher details:', error);
      }
    );
  }

  // Toggle edit mode
  toggleEdit() {
    if (!this.isEditing) {
      this.tempUser = { ...this.user };
    } else {
      this.user = { ...this.tempUser };
      this.clearErrors();
    }
    this.isEditing = !this.isEditing;
  }

  // Clear all validation errors
  clearErrors() {
    this.errors = { first_name: '', last_name: '', email: '', phone: '', verification_code: '', password: '', confirm_password: '' };
  }

  // Clear fields for password reset
  clearResetPasswordFields() {
    this.verificationCode = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.errors.password = '';
    this.errors.confirm_password = '';
    this.errors.verification_code = '';
  }

  // Save changes if validations pass
  saveDetails() {
    this.validateFirstName();
    this.validateLastName();
    this.validateEmail();
    this.validatePhone();

    if (!this.errors.first_name && !this.errors.last_name && !this.errors.email && !this.errors.phone) {
      console.log('Saving user details:', this.user);

      // Updated user
      const updatedUser = {
        first_name: this.user.first_name,
        last_name: this.user.last_name,
        email: this.user.email,
        phone: this.user.phone
      };

      this.teacherService.updateTeacher(this.user._id, updatedUser).subscribe({
        next: (response) => {
          console.log('Account updated successfully', response);
          this.isEditing = false;
          this.fetchTeacherDetails();

          // Show success pop-up
          this.popupService.showSuccess('Account updated successfully!');
        },
        error: (error) => {
          console.error('Error updating account:', error);
          // Show error pop-up
          this.popupService.showError('Error updating account. Please try again.');
        }
      });
    }
  }

  // Validate first name
  validateFirstName() {
    const nameRegex = /^[A-Za-z\s]{2,}$/;
    this.errors.first_name = nameRegex.test(this.user.first_name) ? '' : 'First name must be at least 2 letters and contain only letters and spaces';
  }

  // Validate last name
  validateLastName() {
    const nameRegex = /^[A-Za-z\s]{2,}$/;
    this.errors.last_name = nameRegex.test(this.user.last_name) ? '' : 'Last name must be at least 2 letters and contain only letters and spaces';
  }

  // Validate email
  validateEmail() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    this.errors.email = emailRegex.test(this.user.email) ? '' : 'Invalid email format';
  }

  // Validate phone number
  validatePhone() {
    const phoneRegex = /^[0-9-]+$/;
    this.errors.phone = phoneRegex.test(this.user.phone) ? '' : 'Invalid phone number format';
  }

  // Sign out user and clear token
  signOut() {
    localStorage.removeItem('token'); 
    this.popupService.showSuccess('You have successfully signed out!');
    this.router.navigate(['/login']);
  }
}