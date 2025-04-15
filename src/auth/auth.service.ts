import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, catchError, map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // private apiUrl = 'http://localhost:5000/api'; 
  // private tokenValidationUrl = 'http://localhost:5000/api/validate-token';
  private apiUrl = 'https://flask-backend-no8c.onrender.com/api'; // Render backend API URL
  private tokenValidationUrl = 'https://flask-backend-no8c.onrender.com/api/validate-token'; // Render backend API URL

  // Track authentication state
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  private isAdminSubject = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {
    const token = localStorage.getItem('token');
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    this.isLoggedInSubject.next(!!token);
    this.isAdminSubject.next(isAdmin);
    
    this.validateToken();
  }

  // Get current login state
  isAuthenticated(): Observable<boolean> {
    return this.isLoggedInSubject.asObservable();
  }

  // Get current admin state
  isAdmin(): Observable<boolean> {
    return this.isAdminSubject.asObservable();
  }

  // Login
  login(username: string, password: string): Observable<any> {
    const body = new FormData();
    body.append('email', username);
    body.append('password', password);

    return this.http.post<any>(this.apiUrl + '/login', body).pipe(
      map((response) => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('isAdmin', response.isAdmin);
        this.isLoggedInSubject.next(true);
        this.isAdminSubject.next(response.isAdmin);
        return response;
      }),
      catchError((error) => {
        this.isLoggedInSubject.next(false);
        this.isAdminSubject.next(false);
        throw error;
      })
    );
  }

  // Logout 
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
    this.isLoggedInSubject.next(false);
    this.isAdminSubject.next(false);
  }

  // Validate token and set login state
  validateToken(): void {
    const token = localStorage.getItem('token');
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    if (!token) {
      this.isLoggedInSubject.next(false);
      this.isAdminSubject.next(false);
      return;
    }

    this.http.post<{ valid: boolean }>(this.tokenValidationUrl, { token }).subscribe({
      next: (response) => {
        this.isLoggedInSubject.next(response.valid);
        if (response.valid) {
          this.isAdminSubject.next(isAdmin);
        }
      },
      error: () => {
        this.isLoggedInSubject.next(false);
        this.isAdminSubject.next(false);
      },
    });
  }

  signUp(username: string, password: string): Observable<any> {
    return this.http.post('/api/signup', { username, password });
  }

  // Get authorization token from local storage
  getAuthToken(): string | null {
    return localStorage.getItem('token');
  }
}
