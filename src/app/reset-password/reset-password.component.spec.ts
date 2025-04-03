import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ResetPasswordComponent } from './reset-password.component';
import { TeacherService } from '../../services/teacher.service';
import { PopupNotificationService } from '../../services/popup-notification.service';

describe('ResetPasswordComponent', () => {
  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let mockTeacherService: jasmine.SpyObj<TeacherService>;
  let mockPopupService: jasmine.SpyObj<PopupNotificationService>;

  beforeEach(async () => {
    mockTeacherService = jasmine.createSpyObj('TeacherService', [
      'getTeacherIdFromToken',
      'getTeacher',
      'requestVerificationCode',
      'resetPassword'
    ]);

    mockPopupService = jasmine.createSpyObj('PopupNotificationService', [
      'showSuccess',
      'showError',
      'showInfo'
    ]);

    await TestBed.configureTestingModule({
      declarations: [ResetPasswordComponent],
      providers: [
        { provide: TeacherService, useValue: mockTeacherService },
        { provide: PopupNotificationService, useValue: mockPopupService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should call fetchTeacherDetails', () => {
      spyOn(component, 'fetchTeacherDetails');
      component.ngOnInit();
      expect(component.fetchTeacherDetails).toHaveBeenCalled();
    });
  });

  describe('fetchTeacherDetails', () => {
    it('should fetch teacher and request verification code on success', () => {
      const mockTeacher = { email: 'test@example.com', teacherId: '123' };
      mockTeacherService.getTeacherIdFromToken.and.returnValue('123');
      mockTeacherService.getTeacher.and.returnValue(of(mockTeacher));
      spyOn(component, 'requestVerificationCode');

      component.fetchTeacherDetails();

      expect(component.user).toEqual(mockTeacher);
      expect(component.tempUser).toEqual(mockTeacher);
      expect(component.requestVerificationCode).toHaveBeenCalled();
    });

    it('should show error if teacher fetch fails', () => {
      mockTeacherService.getTeacherIdFromToken.and.returnValue('123');
      mockTeacherService.getTeacher.and.returnValue(throwError(() => new Error('Error')));

      component.fetchTeacherDetails();

      expect(mockPopupService.showError).toHaveBeenCalledWith('Failed to fetch teacher details.');
    });

    it('should handle missing teacher ID', () => {
      mockTeacherService.getTeacherIdFromToken.and.returnValue(null);
      spyOn(console, 'error');
      component.fetchTeacherDetails();
      expect(console.error).toHaveBeenCalledWith('No teacher ID found in token');
    });
  });

  describe('requestVerificationCode', () => {
    it('should request verification code and show info', () => {
      component.user.email = 'test@example.com';
      mockTeacherService.requestVerificationCode.and.returnValue(of({}));

      component.requestVerificationCode();

      expect(component.verificationMessage).toContain('test@example.com');
      expect(mockPopupService.showInfo).toHaveBeenCalled();
    });

    it('should show error if request fails', () => {
      component.user.email = 'test@example.com';
      mockTeacherService.requestVerificationCode.and.returnValue(throwError(() => new Error('Error')));

      component.requestVerificationCode();

      expect(mockPopupService.showError).toHaveBeenCalledWith('Failed to send verification code.');
    });
  });

  describe('validatePassword', () => {
    it('should set error for invalid password', () => {
      component.newPassword = '123';
      component.confirmPassword = '123';
      component.validatePassword();
      expect(component.errors.password).toBeTruthy();
    });

    it('should set error for mismatching passwords', () => {
      component.newPassword = 'Password1';
      component.confirmPassword = 'Different1';
      component.validatePassword();
      expect(component.errors.confirm_password).toBe('Passwords do not match.');
    });

    it('should not set any error if valid', () => {
      component.newPassword = 'Password1';
      component.confirmPassword = 'Password1';
      component.validatePassword();
      expect(component.errors.password).toBe('');
      expect(component.errors.confirm_password).toBe('');
    });
  });

  describe('validateVerificationCode', () => {
    it('should set error if code is empty', () => {
      component.verificationCode = ' ';
      component.validateVerificationCode();
      expect(component.errors.verification_code).toBe('Verification code is required.');
    });

    it('should not set error if code is provided', () => {
      component.verificationCode = '123456';
      component.validateVerificationCode();
      expect(component.errors.verification_code).toBe('');
    });
  });

  describe('resetPassword', () => {
    beforeEach(() => {
      component.user = { email: 'test@example.com', teacherId: '123' };
    });

    it('should not proceed if validation fails', () => {
      component.newPassword = '123';
      component.confirmPassword = '321';
      component.verificationCode = '';

      component.resetPassword();

      expect(mockPopupService.showError).toHaveBeenCalledWith('Please fix the errors before proceeding.');
    });

    it('should call resetPassword on success', () => {
      component.newPassword = 'Password1';
      component.confirmPassword = 'Password1';
      component.verificationCode = 'abc123';

      mockTeacherService.resetPassword.and.returnValue(of({}));

      component.resetPassword();

      expect(mockPopupService.showSuccess).toHaveBeenCalledWith('Password reset successful.');
    });

    it('should show error if reset fails', () => {
      component.newPassword = 'Password1';
      component.confirmPassword = 'Password1';
      component.verificationCode = 'abc123';

      mockTeacherService.resetPassword.and.returnValue(
        throwError(() => ({ error: { message: 'Invalid code' } }))
      );

      component.resetPassword();

      expect(mockPopupService.showError).toHaveBeenCalledWith('Invalid code');
    });
  });
});
