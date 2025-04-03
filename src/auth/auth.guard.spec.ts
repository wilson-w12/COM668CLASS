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
    const spy = jasmine.createSpyObj('AuthService', ['isAuthenticated']);

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: spy }
      ]
    });

    guard = TestBed.inject(AuthGuard);
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow activation when authenticated', (done) => {
    authServiceSpy.isAuthenticated.and.returnValue(of(true));
  
    guard.canActivate({} as any, {} as any).subscribe(result => {
      expect(result).toBeTrue();
      done();
    });
  });
  
  it('should block activation and redirect when not authenticated', (done) => {
    authServiceSpy.isAuthenticated.and.returnValue(of(false));
  
    guard.canActivate({} as any, {} as any).subscribe(result => {
      expect(result).toEqual(router.createUrlTree(['/login']));
      done();
    });
  });  
});
