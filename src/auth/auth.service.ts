import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, catchError, map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
   private apiUrl = 'http://localhost:5000/api'; // Your Flask backend API URL
   private tokenValidationUrl = 'http://localhost:5000/api/validate-token';
  // private apiUrl = 'https://flask-backend-no8c.onrender.com/api'; // Render backend API URL
  // private tokenValidationUrl = 'https://flask-backend-no8c.onrender.com/api/validate-token'; // Render backend API URL

  // BehaviorSubject to track authentication state
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  private isAdminSubject = new BehaviorSubject<boolean>(false); // Track if the user is admin

  constructor(private http: HttpClient) {
    // Validate token on service initialization
    this.validateToken();
  }

  // Fetch current login state
  isAuthenticated(): Observable<boolean> {
    return this.isLoggedInSubject.asObservable();
  }

  // Fetch current admin state
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
        localStorage.setItem('isAdmin', response.isAdmin); // Store isAdmin flag
        this.isLoggedInSubject.next(true); // Set login state true
        this.isAdminSubject.next(response.isAdmin); // Set admin state
        return response;
      }),
      catchError((error) => {
        this.isLoggedInSubject.next(false); // Set login state false
        this.isAdminSubject.next(false); // Set admin state false
        throw error;
      })
    );
  }

  // Logout 
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
    this.isLoggedInSubject.next(false); // Set login state false
    this.isAdminSubject.next(false); // Set admin state false
  }

  // Validate token and set login state
  validateToken(): void {
    const token = localStorage.getItem('token');
    const isAdmin = localStorage.getItem('isAdmin') === 'true'; // Check isAdmin from localStorage
    if (!token) {
      this.isLoggedInSubject.next(false); // Set login state false
      this.isAdminSubject.next(false); // Set admin state false
      return;
    }

    this.http.post<{ valid: boolean }>(this.tokenValidationUrl, { token }).subscribe({
      next: (response) => {
        this.isLoggedInSubject.next(response.valid);
        if (response.valid) {
          this.isAdminSubject.next(isAdmin); // Set admin state based on stored value
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

  // Method to get the authorization token from local storage
  getAuthToken(): string | null {
    return localStorage.getItem('token');
  }
}
