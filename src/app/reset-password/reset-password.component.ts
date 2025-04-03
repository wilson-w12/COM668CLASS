import { Component, OnInit } from '@angular/core';
import { TeacherService } from '../../services/teacher.service';
import { PopupNotificationService } from '../../services/popup-notification.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css'],
  standalone: false
})
export class ResetPasswordComponent implements OnInit {
  user: any = {};
  tempUser: any = {}; 
  verificationCode: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  errors = {
    password: '',
    confirm_password: '',
    verification_code: ''
  };
  verificationMessage: string = ''; 

  constructor(
    private teacherService: TeacherService,
    private popupService: PopupNotificationService
  ) {}

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
        this.requestVerificationCode();
      },
      (error) => {
        console.error('Error fetching teacher details:', error);
        this.popupService.showError('Failed to fetch teacher details.');
      }
    );
  }

  // Request verification code
  requestVerificationCode() {
    this.teacherService.requestVerificationCode(this.user.email).subscribe(
      () => {
        this.verificationMessage = `A verification code has been sent to ${this.user.email}.`; 
        this.popupService.showInfo(this.verificationMessage);
      },
      (error) => {
        console.error('Error sending verification code:', error);
        this.popupService.showError('Failed to send verification code.');
      }
    );
  }

  // Validate password format
  validatePassword() {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/; // Min. 8 characters, 1 letter, 1 number
    this.errors.password = !passwordRegex.test(this.newPassword)
      ? 'Password must be at least 8 characters long, with at least one letter and one number.'
      : '';

    this.errors.confirm_password = this.newPassword !== this.confirmPassword
      ? 'Passwords do not match.'
      : '';
  }

  // Validate verification code
  validateVerificationCode() {
    this.errors.verification_code = !this.verificationCode.trim()
      ? 'Verification code is required.'
      : '';
  }

  // Reset password
  resetPassword() {
    this.validatePassword();
    this.validateVerificationCode();

    // If validation errors, prevent submission
    if (this.errors.password || this.errors.confirm_password || this.errors.verification_code) {
      this.popupService.showError('Please fix the errors before proceeding.');
      return;
    }

    const data = {
      email: this.user.email,
      verification_code: this.verificationCode,
      new_password: this.newPassword
    };

    this.teacherService.resetPassword(this.user.email, this.verificationCode, this.newPassword, this.user.teacherId).subscribe(
      () => {
        this.popupService.showSuccess('Password reset successful.');
      },
      (error) => {
        console.error('Error resetting password:', error);
        this.popupService.showError(error.error?.message || 'Failed to reset password.');
      }
    );
  }
}
