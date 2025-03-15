import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TeacherService } from '../services/teacher.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css'],
  imports: [CommonModule, FormsModule]
})
export class ResetPasswordComponent implements OnInit {
  user: any = {};
  tempUser: any = {}; 
  verificationCode: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  errors = {
    password: '',
    confirm_password: ''
  };

  constructor(private teacherService: TeacherService, private http: HttpClient) {}

  ngOnInit() {
    this.fetchTeacherDetails();
  }

  // Fetch teacher details using TeacherService
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
        this.requestVerificationCode();
      },
      (error) => {
        console.error('Error fetching teacher details:', error);
      }
    );
  }

  // Request verification code
  requestVerificationCode() {
    this.teacherService.requestVerificationCode(this.user.email).subscribe(
      (response: any) => {
        console.log('Verification code sent successfully');
      },
      (error) => {
        console.error('Error sending verification code:', error);
      }
    );
  }

  // Handle password reset
  resetPassword() {
    if (this.newPassword !== this.confirmPassword) {
      this.errors.password = 'Passwords do not match.';
      return;
    }

    this.errors.password = '';
    this.errors.confirm_password = '';

    const data = {
      email: this.user.email,
      verification_code: this.verificationCode,
      new_password: this.newPassword
    };

    this.teacherService.resetPassword(this.user.email, this.verificationCode, this.newPassword).subscribe(
      (response: any) => {
        console.log('Password reset successful');
      },
      (error) => {
        console.error('Error resetting password:', error);
      }
    );
  }

  // Validate password format
  validatePassword() {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/; // Min. 8 characters, 1 letter and 1 number
    if (!passwordRegex.test(this.newPassword)) {
      this.errors.password = 'Password must be at least 8 characters, with at least one letter and one number.';
    } else {
      this.errors.password = '';
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errors.confirm_password = 'Passwords do not match.';
    } else {
      this.errors.confirm_password = '';
    }
  }
}
