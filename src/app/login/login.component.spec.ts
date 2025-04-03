import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../../auth/auth.service';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call authService.login and navigate on successful login', fakeAsync(() => {
    const mockResponse = { token: 'mock-token' };
    authServiceSpy.login.and.returnValue(of(mockResponse));

    component.username = 'testuser';
    component.password = 'testpass';
    component.onSubmit();
    tick();

    expect(authServiceSpy.login).toHaveBeenCalledWith('testuser', 'testpass');
    expect(localStorage.getItem('token')).toBe('mock-token');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
    expect(component.loginError).toBeFalse();
  }));

  it('should set loginError to true on failed login', fakeAsync(() => {
    authServiceSpy.login.and.returnValue(throwError(() => new Error('Login failed')));

    component.username = 'testuser';
    component.password = 'wrongpass';
    component.onSubmit();
    tick();

    expect(authServiceSpy.login).toHaveBeenCalled();
    expect(component.loginError).toBeTrue();
  }));

  it('should not attempt login if username or password is missing', () => {
    component.username = '';
    component.password = '';
    component.onSubmit();

    expect(authServiceSpy.login).not.toHaveBeenCalled();
    expect(component.loginError).toBeFalse();
  });
});
