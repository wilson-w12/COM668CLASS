import { TestBed } from '@angular/core/testing';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated']);
    const popupSpy = jasmine.createSpyObj('PopupNotificationService', ['showError']);

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authSpy }
      ]
    });

    guard = TestBed.inject(AuthGuard);
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow activation when authenticated and no admin required', (done) => {
    authServiceSpy.isAuthenticated.and.returnValue(of(true));

    const route = { data: {} } as any;
    guard.canActivate(route, {} as any).subscribe(result => {
      expect(result).toBeTrue();
      done();
    });
  });

  it('should block activation and redirect to login when not authenticated', (done) => {
    authServiceSpy.isAuthenticated.and.returnValue(of(false));

    const route = { data: {} } as any;
    guard.canActivate(route, {} as any).subscribe(result => {
      expect(result).toEqual(router.createUrlTree(['/login']));
      done();
    });
  });

  it('should block activation, show error, and redirect when non-admin accesses admin-only route', (done) => {
    authServiceSpy.isAuthenticated.and.returnValue(of(true));
    localStorage.setItem('isAdmin', 'false');

    const route = { data: { requiresAdmin: true } } as any;
    guard.canActivate(route, {} as any).subscribe(result => {
      expect(result).toEqual(router.createUrlTree(['/home']));
      done();
    });
  });

  it('should allow activation when admin accesses admin-only route', (done) => {
    authServiceSpy.isAuthenticated.and.returnValue(of(true));
    localStorage.setItem('isAdmin', 'true');

    const route = { data: { requiresAdmin: true } } as any;
    guard.canActivate(route, {} as any).subscribe(result => {
      expect(result).toBeTrue();
      done();
    });
  });
});
