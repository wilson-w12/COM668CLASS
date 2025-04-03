import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

import { AddAssignmentComponent } from './add-assignment.component';
import { TeacherService } from '../../services/teacher.service';
import { PopupNotificationService } from '../../services/popup-notification.service';
import { Router, ActivatedRoute } from '@angular/router';

// Create a mock Router and ActivatedRoute
class MockRouter {
  navigate = jasmine.createSpy('navigate');
}

class MockActivatedRoute {
  snapshot = {
    paramMap: {
      get: jasmine.createSpy('get').and.returnValue('class_id') // Mock class_id param
    }
  };
}

describe('AddAssignmentComponent', () => {
  let component: AddAssignmentComponent;
  let fixture: ComponentFixture<AddAssignmentComponent>;
  let teacherServiceMock: jasmine.SpyObj<TeacherService>;
  let popupServiceMock: jasmine.SpyObj<PopupNotificationService>;
  let routerMock: MockRouter;
  let activatedRouteMock: MockActivatedRoute;

  beforeEach(async () => {
    // Mock services
    teacherServiceMock = jasmine.createSpyObj('TeacherService', ['addAssignment', 'getClassById', 'getStudentsByClassId']);
    popupServiceMock = jasmine.createSpyObj('PopupNotificationService', ['showError', 'showSuccess']);
    routerMock = new MockRouter();
    activatedRouteMock = new MockActivatedRoute();

    // Mock service responses
    teacherServiceMock.getClassById.and.returnValue(of({ class: { name: 'Math 101' } }));
    teacherServiceMock.getStudentsByClassId.and.returnValue(of({ students: [{ _id: '1', first_name: 'John', last_name: 'Doe' }] }));
    teacherServiceMock.addAssignment.and.returnValue(of({}));

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
      ],
      declarations: [AddAssignmentComponent],
      providers: [
        { provide: TeacherService, useValue: teacherServiceMock },
        { provide: PopupNotificationService, useValue: popupServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddAssignmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form with the correct controls', () => {
    expect(component.assignmentForm.contains('title')).toBe(true); 
    expect(component.assignmentForm.contains('topics')).toBe(true);
    expect(component.assignmentForm.contains('due_date')).toBe(true);
    expect(component.assignmentForm.contains('total_marks')).toBe(true);
    expect(component.assignmentForm.contains('A_star_grade')).toBe(true);
    expect(component.assignmentForm.contains('A_grade')).toBe(true);
    expect(component.assignmentForm.contains('B_grade')).toBe(true);
    expect(component.assignmentForm.contains('C_grade')).toBe(true);
    expect(component.assignmentForm.contains('F_grade')).toBe(true);
  });

  it('should load class details on init', () => {
    component.ngOnInit();
    expect(teacherServiceMock.getClassById).toHaveBeenCalled();
    expect(component.classDetails).toEqual({ name: 'Math 101' });
  });

  it('should load students for the class', () => {
    component.fetchStudents();
    expect(teacherServiceMock.getStudentsByClassId).toHaveBeenCalled();
    expect(component.allStudents.length).toBeGreaterThan(0);
  });

  it('should recalculate grades and scores for all students when total_marks is set', () => {
    // Mock grade boundaries 
    component.assignment.total_marks = 100;
    component.assignment.A_star_grade = 80;  
    component.assignment.A_grade = 70;  
    component.assignment.B_grade = 50;  
    component.assignment.C_grade = 30; 
    component.assignment.F_grade = 0;   
  
    // Mock student results
    component.assignment.results = [{ 
      student_id: '1', 
      name: 'John Doe', 
      mark: 50, 
      score: 70, 
      grade: 'B'
    }];
      component.recalculateAllScores();
    expect(component.assignment.results[0].score).toBe(50);
    expect(component.assignment.results[0].grade).toBe('B');
  });

  it('should validate form and show errors if invalid', () => {
    component.assignmentForm.setValue({
      title: '',
      topics: '',
      due_date: 'invalid-date',
      total_marks: -1,
      A_star_grade: 110,
      A_grade: 80,
      B_grade: 70,
      C_grade: 60,
      F_grade: 0,
    });

    component.save();

    expect(popupServiceMock.showError).toHaveBeenCalledWith(
      'Title is required - Invalid due date format (YYYY-MM-DD) - Total marks must be a positive number'
    );
  });

});
