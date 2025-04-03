import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { AddExamComponent } from './add-exam.component';
import { TeacherService } from '../../services/teacher.service';
import { PopupNotificationService } from '../../services/popup-notification.service';
import { Router, ActivatedRoute } from '@angular/router';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

// Mock services
class MockTeacherService {
  getStudents = jasmine.createSpy('getStudents').and.returnValue(of({ students: [] }));
  addExam = jasmine.createSpy('addExam').and.returnValue(of({}));
}

class MockPopupNotificationService {
  showError = jasmine.createSpy('showError');
  showSuccess = jasmine.createSpy('showSuccess');
}

class MockRouter {
  navigate = jasmine.createSpy('navigate');
}

class MockActivatedRoute {
  queryParams = of({
    year: '9',
    subject: 'Math'
  });
}

describe('AddExamComponent', () => {
  let component: AddExamComponent;
  let fixture: ComponentFixture<AddExamComponent>;
  let teacherServiceMock: MockTeacherService;
  let popupServiceMock: MockPopupNotificationService;
  let routerMock: MockRouter;
  let activatedRouteMock: MockActivatedRoute;

  beforeEach(async () => {
    teacherServiceMock = new MockTeacherService();
    popupServiceMock = new MockPopupNotificationService();
    routerMock = new MockRouter();
    activatedRouteMock = new MockActivatedRoute();

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        FormsModule,
        HttpClientTestingModule,
        RouterTestingModule,
        MatButtonModule,
        MatCardModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatSelectModule,
        MatAutocompleteModule,
        RouterTestingModule.withRoutes([{
          path: 'add-exam', component: AddExamComponent
        }])
      ],
      declarations: [AddExamComponent],
      providers: [
        { provide: TeacherService, useValue: teacherServiceMock },
        { provide: PopupNotificationService, useValue: popupServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddExamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    popupServiceMock.showSuccess.calls.reset();
    popupServiceMock.showError.calls.reset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load students when year is set', fakeAsync(() => {
    const students = [
      { _id: '1', first_name: 'John', last_name: 'Doe' },
      { _id: '2', first_name: 'Jane', last_name: 'Smith' }
    ];

    teacherServiceMock.getStudents.and.returnValue(of({ students }));

    component.yearControl.setValue('9');
    tick();  

    expect(teacherServiceMock.getStudents).toHaveBeenCalled();
    expect(component.allStudents.length).toBe(2);
  }));

  it('should validate title and mark errors', () => {
    component.exam.title = '';
    component.validateFields();
    expect(component.errors).toContain('Title is required');

    component.exam.total_marks = -5;
    component.validateFields();
    expect(component.errors).toContain('Total marks must be a positive number');
  });

  it('should recalculate grades and scores for all students when total_marks is set', () => {
    // Mock grade boundaries 
    component.exam.total_marks = 100;
    component.exam["A*_grade"] = 80;  
    component.exam.A_grade = 70;  
    component.exam.B_grade = 50;  
    component.exam.C_grade = 30; 
    component.exam.F_grade = 0;   
  
    // Mock student results
    component.exam.results = [{ 
      student_id: '1', 
      name: 'John Doe', 
      mark: 50, 
      score: null, 
      grade: null 
    }];
    component.recalculateAllScores();
    expect(component.exam.results[0].score).toBe(50);
    expect(component.exam.results[0].grade).toBe('B');
  });

  it('should save the exam and show success message', () => {
    component.exam.title = 'Test Exam';
    component.exam.year = 9;
    component.exam.subject = 'Math';
    component.exam.due_date = '2025-05-20';
    component.exam.total_marks = 100;
    teacherServiceMock.addExam.and.returnValue(of({}));

    component.save();

    expect(teacherServiceMock.addExam).toHaveBeenCalled();
    expect(popupServiceMock.showSuccess).toHaveBeenCalledWith('Exam added successfully');
  });

  it('should show error when saving exam fails', () => {
    teacherServiceMock.addExam.and.returnValue(throwError('Failed to add exam'));
  
    component.exam.title = 'Test Exam';
    component.exam.year = 9;
    component.exam.subject = 'Math';
    component.exam.due_date = '2025-05-20';
    component.exam.total_marks = 100;
  
    component.save();
  
    expect(teacherServiceMock.addExam).toHaveBeenCalled();
    expect(popupServiceMock.showError).toHaveBeenCalledWith('Failed to add exam');
  });
  
});
