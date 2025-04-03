import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AccountComponent } from './account.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TeacherService } from '../../services/teacher.service';
import { PopupNotificationService } from '../../services/popup-notification.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('AccountComponent', () => {
  let component: AccountComponent;
  let fixture: ComponentFixture<AccountComponent>;
  let teacherServiceSpy: jasmine.SpyObj<TeacherService>;
  let popupServiceSpy: jasmine.SpyObj<PopupNotificationService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockUser = {
    _id: '123',
    first_name: 'Alice',
    last_name: 'Smith',
    email: 'alice@example.com',
    phone: '1234567890'
  };

  beforeEach(async () => {
    const teacherServiceMock = jasmine.createSpyObj('TeacherService', ['getTeacherIdFromToken', 'getTeacher', 'updateTeacher']);
    const popupServiceMock = jasmine.createSpyObj('PopupNotificationService', ['showSuccess', 'showError']);
    const routerMock = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [AccountComponent],
      imports: [HttpClientTestingModule],
      providers: [
        { provide: TeacherService, useValue: teacherServiceMock },
        { provide: PopupNotificationService, useValue: popupServiceMock },
        { provide: Router, useValue: routerMock },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AccountComponent);
    component = fixture.componentInstance;
    teacherServiceSpy = TestBed.inject(TeacherService) as jasmine.SpyObj<TeacherService>;
    popupServiceSpy = TestBed.inject(PopupNotificationService) as jasmine.SpyObj<PopupNotificationService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch teacher details on init if ID is present', () => {
    teacherServiceSpy.getTeacherIdFromToken.and.returnValue('123');
    teacherServiceSpy.getTeacher.and.returnValue(of(mockUser));

    component.ngOnInit();

    expect(teacherServiceSpy.getTeacher).toHaveBeenCalledWith('123');
    expect(component.user).toEqual(mockUser);
    expect(component.tempUser).toEqual(mockUser);
  });

  it('should not fetch teacher details if ID is not present', () => {
    teacherServiceSpy.getTeacherIdFromToken.and.returnValue(null);
    const consoleSpy = spyOn(console, 'error');

    component.ngOnInit();

    expect(consoleSpy).toHaveBeenCalledWith('No teacher ID found in token');
    expect(teacherServiceSpy.getTeacher).not.toHaveBeenCalled();
  });

  it('should toggle edit mode and reset user from tempUser when cancelling edit', () => {
    component.user = { ...mockUser };
    component.toggleEdit(); 
    expect(component.isEditing).toBeTrue();
    expect(component.tempUser).toEqual(mockUser);
  
    component.user.first_name = 'Changed'; 
    component.toggleEdit(); 
    expect(component.isEditing).toBeFalse();
    expect(component.user.first_name).toBe('Alice'); 
  });
  

  it('should clear errors', () => {
    component.errors.first_name = 'error';
    component.clearErrors();
    expect(component.errors.first_name).toBe('');
  });

  it('should clear reset password fields', () => {
    component.verificationCode = '123';
    component.newPassword = 'password';
    component.confirmPassword = 'password';
    component.errors = {
      verification_code: 'error',
      password: 'error',
      confirm_password: 'error',
      email: '', phone: '', first_name: '', last_name: ''
    };

    component.clearResetPasswordFields();

    expect(component.verificationCode).toBe('');
    expect(component.newPassword).toBe('');
    expect(component.confirmPassword).toBe('');
    expect(component.errors.password).toBe('');
    expect(component.errors.confirm_password).toBe('');
    expect(component.errors.verification_code).toBe('');
  });

  it('should validate fields correctly', () => {
    component.user = {
      first_name: 'A',
      last_name: '!',
      email: 'bademail',
      phone: 'abc'
    };

    component.validateFirstName();
    component.validateLastName();
    component.validateEmail();
    component.validatePhone();

    expect(component.errors.first_name).not.toBe('');
    expect(component.errors.last_name).not.toBe('');
    expect(component.errors.email).not.toBe('');
    expect(component.errors.phone).not.toBe('');
  });

  it('should save details if valid', fakeAsync(() => {
    component.user = { ...mockUser };
    teacherServiceSpy.updateTeacher.and.returnValue(of(mockUser));
    teacherServiceSpy.getTeacher.and.returnValue(of(mockUser));
    teacherServiceSpy.getTeacherIdFromToken.and.returnValue(mockUser._id);

    component.saveDetails();
    tick();

    expect(teacherServiceSpy.updateTeacher).toHaveBeenCalledWith(mockUser._id, {
      first_name: 'Alice',
      last_name: 'Smith',
      email: 'alice@example.com',
      phone: '1234567890'
    });
    expect(popupServiceSpy.showSuccess).toHaveBeenCalledWith('Account updated successfully!');
  }));

  it('should show error popup on update failure', fakeAsync(() => {
    component.user = { ...mockUser };
    teacherServiceSpy.updateTeacher.and.returnValue(throwError(() => new Error('Update failed')));

    component.saveDetails();
    tick();

    expect(popupServiceSpy.showError).toHaveBeenCalledWith('Error updating account. Please try again.');
  }));

  it('should sign out and redirect', () => {
    spyOn(localStorage, 'removeItem');
    component.signOut();
    expect(localStorage.removeItem).toHaveBeenCalledWith('token');
    expect(popupServiceSpy.showSuccess).toHaveBeenCalledWith('You have successfully signed out!');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });
});
