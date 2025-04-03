import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { HeaderComponent } from './header.component';
import { AuthService } from '../../auth/auth.service';
import { of } from 'rxjs';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

class MockAuthService {
  isAuthenticated() {
    return of(true);
  }
  isAdmin() {
    return of(true);
  }
}

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let authService: AuthService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [HeaderComponent],
      imports: [
        FormsModule,
        ReactiveFormsModule,

      ],
      providers: [{ provide: AuthService, useClass: MockAuthService }]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set isLoggedIn to true when authenticated', () => {
    spyOn(authService, 'isAuthenticated').and.returnValue(of(true));
    spyOn(authService, 'isAdmin').and.returnValue(of(false)); // Simulate not admin

    component.ngOnInit();

    expect(component.isLoggedIn).toBeTrue();
  });

  it('should set isAdmin to true if user is admin', () => {
    spyOn(authService, 'isAuthenticated').and.returnValue(of(true));
    spyOn(authService, 'isAdmin').and.returnValue(of(true));

    component.ngOnInit();

    expect(component.isAdmin).toBeTrue();
  });

  it('should set isAdmin to false if user is not admin', () => {
    spyOn(authService, 'isAuthenticated').and.returnValue(of(true));
    spyOn(authService, 'isAdmin').and.returnValue(of(false));

    component.ngOnInit();

    expect(component.isAdmin).toBeFalse();
  });

  it('should not call isAdmin if not logged in', () => {
    const isAdminSpy = spyOn(authService, 'isAdmin');
    spyOn(authService, 'isAuthenticated').and.returnValue(of(false));

    component.ngOnInit();

    expect(component.isLoggedIn).toBeFalse();
    expect(isAdminSpy).not.toHaveBeenCalled();
  });
});
