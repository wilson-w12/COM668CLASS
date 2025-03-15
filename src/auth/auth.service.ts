import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, catchError, map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:5000/api'; // Your Flask backend API URL
  private tokenValidationUrl = 'http://localhost:5000/api/validate-token';

  // BehaviorSubject to track authentication state
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {
    // Validate token on service initialization
    this.validateToken();
  }

  // Fetch current login state
  isAuthenticated(): Observable<boolean> {
    return this.isLoggedInSubject.asObservable();
  }

  // Login
  login(username: string, password: string): Observable<any> {
    const body = new FormData();
    body.append('email', username);
    body.append('password', password);

    return this.http.post<any>(this.apiUrl + '/login', body).pipe(
      map((response) => {
        localStorage.setItem('token', response.token);
        this.isLoggedInSubject.next(true); // Set login state true
        return response;
      }),
      catchError((error) => {
        this.isLoggedInSubject.next(false); // Set login state false
        throw error;
      })
    );
  }

  // Logout 
  logout(): void {
    localStorage.removeItem('token');
    this.isLoggedInSubject.next(false); // Set login state false
  }

  // Validate token and set login state
  validateToken(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      this.isLoggedInSubject.next(false); // Set login state flase
      return;
    }

    this.http.post<{ valid: boolean }>(this.tokenValidationUrl, { token }).subscribe({
      next: (response) => this.isLoggedInSubject.next(response.valid),
      error: () => this.isLoggedInSubject.next(false),
    });
  }

  // // Check initial login state (synchronous for app initialization)
  // private checkInitialLoginState(): boolean {
  //   const token = localStorage.getItem('token');
  //   return !!token;
  // }  

  signUp(username: string, password: string): Observable<any> {
    return this.http.post('/api/signup', { username, password });
  }

  // Method to get the authorization token from local storage
  getAuthToken(): string | null {
    return localStorage.getItem('token'); 
  }
}
