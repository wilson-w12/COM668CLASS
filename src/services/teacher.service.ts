import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class TeacherService {
  // private apiUrl = 'http://localhost:5000/api'; // Flask backend API URL
   private apiUrl = 'https://flask-backend-no8c.onrender.com/api'; // Render backend API URL
  
  constructor(private authService: AuthService, private http: HttpClient) { }

  // ================== AUTHENTICATION METHODS ==================

  // Get authorization token from local storage
  private getAuthToken(): string | null {
    return localStorage.getItem('token'); 
  }

  // ================== CLASS METHODS ==================

  // Get current teacher's classes
  getCurrentTeacherClasses(): Observable<any> {
    const token = this.authService.getAuthToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<any>(`${this.apiUrl}/teacher/classes`, { headers });
  }

  // Get all classes with optional filters
  getClasses(params: any): Observable<any> {
    const token = this.authService.getAuthToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<any>(`${this.apiUrl}/classes`, { headers, params });
  }

  // Get class by ID
  getClassById(classId: string): Observable<any> {
    const token = this.authService.getAuthToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<any>(`${this.apiUrl}/classes/${classId}`, { headers });
  }

  // Get students for class
  getStudentsByClassId(classId: string): Observable<any> {
    const token = this.getAuthToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<any>(`${this.apiUrl}/classes/${classId}/students`, { headers });
  }

  // ================== ASSIGNMENT METHODS ==================

  // Get assignments for class
  getAssignmentsByClassId(classId: string): Observable<any> {
    const token = this.getAuthToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<any>(`${this.apiUrl}/classes/${classId}/assignments`, { headers });
  }

  // Get assignment details by assignment ID
  getAssignmentByAssignmentId(classId: string, assignmentId: string): Observable<any> {
    const token = this.getAuthToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<any>(`${this.apiUrl}/classes/${classId}/assignments/${assignmentId}`, { headers });
  }

  // Get assignment data for student charts
  getStudentAssignmentData(studentId: string, params: any): Observable<any> {
    const token = this.authService.getAuthToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<any>(`${this.apiUrl}/students/${studentId}/assignments-chart`, { headers, params });
  }

  // Update an assignment (details and student marks)
  updateAssignment(classId: string, assignmentId: string, updatedAssignment: any): Observable<any> {
    const token = this.getAuthToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.put<any>(
      `${this.apiUrl}/classes/${classId}/assignments/${assignmentId}`,
      updatedAssignment,
      { headers }
    );
  }

  // Add assignment
  addAssignment(classId: string, assignmentData: any): Observable<any> {
    const token = this.authService.getAuthToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post<any>(
      `${this.apiUrl}/classes/${classId}/assignments`, assignmentData, { headers });
  }  

  // Delete assignment
  deleteAssignment(classId: string, assignmentId: string): Observable<any> {
    const token = this.getAuthToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.delete<any>(`${this.apiUrl}/classes/${classId}/assignments/${assignmentId}`, { headers });
  }

  // ================== EXAM METHODS ==================

  // Get exams for class
  getExamsByClassId(classId: string): Observable<any> {
    const token = this.getAuthToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<any>(`${this.apiUrl}/classes/${classId}/exams`, { headers });
  }

  // Get exam by ID with optional filters
  getExamByExamId(examId: string, params: any): Observable<any> {
    const token = this.getAuthToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<any>(`${this.apiUrl}/exams/${examId}`, { headers, params });
  }

  // Get exam and grade distributions for class
  getExamAndGradesByClassId(classId: string): Observable<any> {
    const token = this.getAuthToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<any>(`${this.apiUrl}/classes/${classId}/recent-exam`, { headers });
  }

  // Get exam data for student charts
  getStudentExamData(studentId: string, params: any): Observable<any> {
    const token = this.authService.getAuthToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<any>(`${this.apiUrl}/students/${studentId}/exams-chart`, { headers, params });
  }

  // Get specific exam filter options
  getExamFilters(examId: string): Observable<any> {
    const token = this.authService.getAuthToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<any>(`${this.apiUrl}/exams/${examId}/exam-filters`, { headers });
  }

  // Update an assignment (details and student marks)
  updateExam(examId: string, updatedExam: any): Observable<any> {
    const token = this.getAuthToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.put<any>(
      `${this.apiUrl}/exams/${examId}`,
      updatedExam,
      { headers }
    );
  }

  // Add exam
  addExam(examData: any): Observable<any> {
    const token = this.authService.getAuthToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post<any>(
      `${this.apiUrl}/exams`, examData, { headers });
  } 

  // Delete exam
  deleteExam(examId: string): Observable<any> {
    const token = this.getAuthToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.delete<any>(`${this.apiUrl}/exams/${examId}`, { headers });
  }

  // ================== STUDENT METHODS ==================

  // Get all students with optional filters
  getStudents(params: any): Observable<any> {
    const token = this.authService.getAuthToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<any>(`${this.apiUrl}/students`, { headers, params });
  }

  // Get student details by student ID
  getStudent(studentId: string): Observable<any> {
    const token = this.getAuthToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<any>(`${this.apiUrl}/students/${studentId}`, { headers });
  }

  // Get student enrolled classes by student ID
  getStudentClasses(studentId: string): Observable<any> {
    const token = this.getAuthToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<any>(`${this.apiUrl}/students/${studentId}/classes`, { headers });
  }

  // Update student details
  updateStudent(studentId: string, updatedStudent: any): Observable<any> {
    const token = this.getAuthToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.put<any>(
      `${this.apiUrl}/students/${studentId}`,
      updatedStudent,
      { headers }
    );
  }

  // Update student details
  updateStudentClasses(studentId: string, updatedStudent: any): Observable<any> {
    const token = this.getAuthToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.put<any>(
      `${this.apiUrl}/students/${studentId}/classes`,
      updatedStudent,
      { headers }
    );
  }

  // Add student
  addStudent(studentData: any): Observable<any> {
    const token = this.getAuthToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post<any>(
      `${this.apiUrl}/students`,
      studentData,
      { headers }
    );
  }  

  // ================== TEACHER METHODS ==================
  // Get student details by student ID
  getTeacher(teacherId: string): Observable<any> {
    const token = this.getAuthToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<any>(`${this.apiUrl}/teachers/${teacherId}`, { headers });
  }

  // Get teacher ID from stored token
  getTeacherIdFromToken(): string | null {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      return tokenPayload.sub;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  // Get all teachers with optional subject filter
  getTeachers(subject?: string): Observable<any> {
    let params = new HttpParams();
    if (subject) {
      params = params.set('subject', subject);
    }
    const token = this.authService.getAuthToken(); 
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`); 
    return this.http.get<any>(`${this.apiUrl}/teachers`, { headers, params });
  }

// Update teacher by teacher ID
updateTeacher(teacherId: string, updatedUser: any): Observable < any > {
  const token = this.authService.getAuthToken();
  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  return this.http.put<any>(`${this.apiUrl}/teachers/${teacherId}`, updatedUser, { headers });
}

// Update teacher's classes
updateTeacherClasses(changedClasses: { class_id: string, selectedTeacherIds: string[] }[]): Observable < any > {
  const token = this.authService.getAuthToken();
  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  return this.http.put<any>(`${this.apiUrl}/update-teachers`, { classes: changedClasses }, { headers });
}

// Request verification code for password reset
requestVerificationCode(email: string): Observable < any > {
  return this.http.post<any>(`${this.apiUrl}/request-password-reset`, { email });
}

// Reset account password
resetPassword(email: string, verificationCode: string, newPassword: string, teacherId: string): Observable < any > {
  const token = this.authService.getAuthToken();
  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  const data = {
    teacherId: teacherId,
    email: email,
    verification_code: verificationCode,
    new_password: newPassword
  };
  return this.http.put<any>(`${this.apiUrl}/reset-password`, data, { headers });
}

// Add a teacher account
addTeacher(teacherData: any): Observable<any> {
  const token = this.authService.getAuthToken();
  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  return this.http.post<any>(`${this.apiUrl}/teachers`, teacherData, { headers });
}

// ================== FILTER METHODS ==================

// Get unique class filters (subjects & years)
getClassFilters(): Observable < any > {
  const token = this.authService.getAuthToken();
  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  return this.http.get<any>(`${this.apiUrl}/classes/classes-filters`, { headers });
}

// Get unique student filters (years & sets)
getStudentsFilters(): Observable < any > {
  const token = this.authService.getAuthToken();
  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  return this.http.get<any>(`${this.apiUrl}/students/students-filters`, { headers });
}

// Get unique subjects for specific student
getStudentFilters(studentId: string): Observable < any > {
  const token = this.authService.getAuthToken();
  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  return this.http.get<any>(`${this.apiUrl}/students/${studentId}/student-filters`, { headers });
}

// Get assignments and exams due today
getAssignmentsExamsDueToday(): Observable < any > {
  const token = this.authService.getAuthToken();
  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  return this.http.get<any>(`${this.apiUrl}/teacher/assignments-exams-due-today`, { headers });
}
}
