import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ClassAssignmentDetailsComponent } from './class-assignment-details.component';
import { TeacherService } from '../../services/teacher.service';
import { PopupNotificationService } from '../../services/popup-notification.service';
import { PdfGenerationService } from '../../services/PdfGeneration.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { HighchartsChartModule } from 'highcharts-angular';
import { of, throwError } from 'rxjs';

class MockTeacherService {
  getClassById = jasmine.createSpy().and.returnValue(of({ class: { year: 10, set: 'A', subject: 'Math', teachers: [{ name: 'Mr. Smith' }] } }));
  getAssignmentByAssignmentId = jasmine.createSpy().and.returnValue(of({ title: 'Test Assignment', results: [] }));
  getStudentsByClassId = jasmine.createSpy().and.returnValue(of({ students: [] }));
  updateAssignment = jasmine.createSpy().and.returnValue(of({}));
  deleteAssignment = jasmine.createSpy().and.returnValue(of({}));
}

class MockPopupNotificationService {
  showError = jasmine.createSpy();
  showSuccess = jasmine.createSpy();
}

class MockPdfGenerationService {
  addLogoToPDF = jasmine.createSpy();
  addChartSection = jasmine.createSpy();
  drawTableHeader = jasmine.createSpy();
  drawTableRow = jasmine.createSpy();
  wrapText = jasmine.createSpy().and.callFake((text: string) => text);
  checkPageBreak = jasmine.createSpy().and.callFake((_doc, y) => y);
  calculateRowHeight = jasmine.createSpy().and.returnValue(10);
}

class MockRouter {
  navigate = jasmine.createSpy();
}

class MockActivatedRoute {
  snapshot = {
    paramMap: {
      get: jasmine.createSpy('get').and.callFake((key: string) => {
        if (key === 'class_id') return 'class123';
        if (key === 'assignment_id') return 'assignment456';
        return null;
      })
    }
  };
}

describe('ClassAssignmentDetailsComponent', () => {
  let component: ClassAssignmentDetailsComponent;
  let fixture: ComponentFixture<ClassAssignmentDetailsComponent>;
  let teacherServiceMock: MockTeacherService;
  let popupServiceMock: MockPopupNotificationService;
  let pdfServiceMock: MockPdfGenerationService;
  let routerMock: MockRouter;
  let activatedRouteMock: MockActivatedRoute;

  beforeEach(async () => {
    teacherServiceMock = new MockTeacherService();
    popupServiceMock = new MockPopupNotificationService();
    pdfServiceMock = new MockPdfGenerationService();
    routerMock = new MockRouter();
    activatedRouteMock = new MockActivatedRoute();

    await TestBed.configureTestingModule({
      declarations: [ClassAssignmentDetailsComponent],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        FormsModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatCardModule,
        MatFormFieldModule,
        MatSelectModule,
        HighchartsChartModule
      ],
      providers: [
        { provide: TeacherService, useValue: teacherServiceMock },
        { provide: PopupNotificationService, useValue: popupServiceMock },
        { provide: PdfGenerationService, useValue: pdfServiceMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ClassAssignmentDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load class, assignment and students on init', () => {
    expect(teacherServiceMock.getClassById).toHaveBeenCalledWith('class123');
    expect(teacherServiceMock.getAssignmentByAssignmentId).toHaveBeenCalledWith('class123', 'assignment456');
    expect(teacherServiceMock.getStudentsByClassId).toHaveBeenCalledWith('class123');
  });

  it('should toggle edit mode and reset form when toggled off', () => {
    component.originalAssignment = { title: 'Original Title', topics: 'Topic A', due_date: '2025-04-15', total_marks: 100, ['A*_grade']: 90, A_grade: 80, B_grade: 70, C_grade: 60, F_grade: 0 };
    component.assignment = { ...component.originalAssignment, title: 'Edited Title' };
    component.assignmentForm.setValue({
      title: 'Edited Title',
      topics: 'Topic A',
      due_date: '2025-04-15',
      total_marks: 100,
      A_star_grade: 90,
      A_grade: 80,
      B_grade: 70,
      C_grade: 60,
      F_grade: 0
    });

    component.isEditingAssignmentDetails = true;
    component.toggleEditAssignmentDetails();

    expect(component.isEditingAssignmentDetails).toBeFalse();
    expect(component.assignment.title).toBe('Original Title');
  });

  it('should prevent save if form invalid or marks invalid', () => {
    component.assignmentForm.patchValue({ title: '' }); // force invalid title
    component.assignment.total_marks = 100;
    component.studentResults = [{ name: 'John', mark: 150 }];

    component.saveAssignment();
    expect(popupServiceMock.showError).toHaveBeenCalled();
  });

  it('should save valid assignment changes and show success', () => {
    component.assignment = {
      title: 'Assignment',
      topics: 'Algebra',
      due_date: '2025-04-15',
      total_marks: 100,
      ['A*_grade']: 90,
      A_grade: 80,
      B_grade: 70,
      C_grade: 60,
      F_grade: 0
    };
    component.originalAssignment = { ...component.assignment, results: [] };
    component.assignmentForm.setValue({
      title: 'Assignment',
      topics: 'Algebra',
      due_date: '2025-04-15',
      total_marks: 100,
      A_star_grade: 90,
      A_grade: 80,
      B_grade: 70,
      C_grade: 60,
      F_grade: 0
    });
    component.studentResults = [{ student_id: '1', name: 'John', mark: 95 }];
    component.allStudents = [{ _id: '1', target_grade: 'A' }];

    component.saveAssignment();

    expect(teacherServiceMock.updateAssignment).toHaveBeenCalled();
    expect(popupServiceMock.showSuccess).toHaveBeenCalled();
  });

  it('should not save if no changes detected', () => {
    const unchanged = {
      title: 'Assignment',
      topics: 'Algebra',
      due_date: '2025-04-15',
      total_marks: 100,
      ['A*_grade']: 90,
      A_grade: 80,
      B_grade: 70,
      C_grade: 60,
      F_grade: 0,
      results: []
    };

    component.assignment = { ...unchanged };
    component.originalAssignment = JSON.parse(JSON.stringify(unchanged));
    component.assignmentForm.setValue({
      title: unchanged.title,
      topics: unchanged.topics,
      due_date: unchanged.due_date,
      total_marks: unchanged.total_marks,
      A_star_grade: 90,
      A_grade: 80,
      B_grade: 70,
      C_grade: 60,
      F_grade: 0
    });
    component.studentResults = [];

    component.saveAssignment();

    expect(teacherServiceMock.updateAssignment).not.toHaveBeenCalled();
  });

  it('should delete assignment and navigate on success', () => {
    component.classId = 'class123';
    component.assignmentId = 'assignment456';

    component.deleteAssignment();

    expect(teacherServiceMock.deleteAssignment).toHaveBeenCalledWith('class123', 'assignment456');
    expect(routerMock.navigate).toHaveBeenCalledWith(['/classes/class123']);
    expect(popupServiceMock.showSuccess).toHaveBeenCalled();
  });

  it('should show error on delete failure', () => {
    teacherServiceMock.deleteAssignment.and.returnValue(throwError(() => new Error('delete failed')));
    component.classId = 'class123';
    component.assignmentId = 'assignment456';

    component.deleteAssignment();

    expect(popupServiceMock.showError).toHaveBeenCalled();
  });

  it('should recalculate grade and score correctly', () => {
    component.assignment = {
      total_marks: 100,
      ['A*_grade']: 90,
      A_grade: 80,
      B_grade: 70,
      C_grade: 60,
      F_grade: 0
    };
  
    const student: { mark: number; score: number | null; grade: string } = {
      mark: 85,
      score: null,
      grade: ''
    };
  
    component.recalculateGradeAndScore(student);
  
    expect(student.grade).toBe('A');
    expect(student.score).toBe(85);
  });  

  it('should handle null mark in recalculateGradeAndScore', () => {
    const student = { mark: null, score: null, grade: '' };
    component.recalculateGradeAndScore(student);
    expect(student.grade).toBe('Not Submitted');
    expect(student.score).toBeNull();
  });

  it('should call generatePDF and save', () => {
    component.assignment = { title: 'PDF Test' };
    component.classDetails = { year: 10, set: 'A', subject: 'Math', teachers: [{ name: 'Teacher One' }] };
    component.assignmentFields = [];
    component.studentResults = [{ name: 'Alice', mark: 90, score: 90, grade: 'A*', student_id: '1' }];
    component.allStudents = [{ _id: '1', target_grade: 'A' }];

    const fakeDoc = {
      setFontSize: () => {},
      setFont: () => {},
      text: () => {},
      addPage: () => {},
      internal: { pageSize: { width: 200 } },
      save: jasmine.createSpy('save')
    };

    (window as any).jsPDF = function () {
      return fakeDoc;
    };

    spyOn(component as any, 'getTargetGrade').and.returnValue('A');
    pdfServiceMock.addLogoToPDF.and.callFake((doc, cb) => cb(fakeDoc, 10));
    pdfServiceMock.addChartSection.and.callFake((_doc, _ids, _x, _w, y, cb) => cb(y + 50));

    component.generatePDF();

    expect(pdfServiceMock.addLogoToPDF).toHaveBeenCalled();
    expect(fakeDoc.save).toHaveBeenCalled();
  });
});
