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

  afterEach(() => {
    jasmine.getEnv().allowRespy(true);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch class details on init', () => {
    expect(teacherServiceMock.getClassById).toHaveBeenCalledWith('class123');
    expect(component.classDetails).toEqual(jasmine.objectContaining({ year: 10 }));
  });

  it('should fetch assignment details on init', () => {
    expect(teacherServiceMock.getAssignmentByAssignmentId).toHaveBeenCalledWith('class123', 'assignment456');
    expect(component.assignment.title).toBe('Test Assignment');
  });

  it('should fetch students on init', () => {
    expect(teacherServiceMock.getStudentsByClassId).toHaveBeenCalledWith('class123');
  });

  it('should toggle assignment edit mode', () => {
    component.assignment.title = 'Edited';
    component.originalAssignment.title = 'Original';
    component.isEditingAssignmentDetails = true;

    component.toggleEditAssignmentDetails();

    expect(component.isEditingAssignmentDetails).toBeFalse();
    expect(component.assignment.title).toBe('Original');
  });
  it('should validate assignment correctly', () => {
    component.assignment = {
      title: 'Math HW',
      total_marks: 100,
      ['A*_grade']: 90,
      A_grade: 80,
      B_grade: 70,
      C_grade: 60,
      F_grade: 0
    };
    expect(component.validateAssignment()).toBeTrue();
  });

  it('should fail validation if title is missing', () => {
    component.assignment = {
      title: '',
      total_marks: 100,
      ['A*_grade']: 90,
      A_grade: 80,
      B_grade: 70,
      C_grade: 60,
      F_grade: 0
    };
    expect(component.validateAssignment()).toBeFalse();
  });

  it('should validate student scores correctly', () => {
    component.assignment.total_marks = 100;
    component.studentResults = [
      { mark: 80, grade: 'A' },
      { mark: null, grade: 'Not Submitted' }
    ];
    expect(component.validateScores()).toBeTrue();
  });

  it('should fail validation on invalid score', () => {
    component.assignment.total_marks = 100;
    component.studentResults = [{ mark: 120, grade: 'A' }];
    expect(component.validateScores()).toBeFalse();
  });

  it('should not save if assignment is invalid', () => {
    component.assignment = { title: '' };
    component.saveAssignment();
    expect(popupServiceMock.showError).toHaveBeenCalled();
  });

  it('should not save if scores are invalid', () => {
    component.assignment = {
      title: 'Math',
      total_marks: 100,
      ['A*_grade']: 90,
      A_grade: 80,
      B_grade: 70,
      C_grade: 60,
      F_grade: 0
    };
    component.studentResults = [{ mark: 101 }];
    component.saveAssignment();
    expect(popupServiceMock.showError).toHaveBeenCalled();
  });

  it('should save updated assignment if valid and changed', () => {
    component.assignment = {
      title: 'Math',
      total_marks: 100,
      ['A*_grade']: 90,
      A_grade: 80,
      B_grade: 70,
      C_grade: 60,
      F_grade: 0
    };
    component.originalAssignment = { ...component.assignment, results: [] };
    component.studentResults = [{ student_id: '1', mark: 95, score: 95, grade: 'A*' }];
    component.allStudents = [{ _id: '1', target_grade: 'A' }];

    component.saveAssignment();

    expect(teacherServiceMock.updateAssignment).toHaveBeenCalled();
    expect(popupServiceMock.showSuccess).toHaveBeenCalled();
  });

  it('should not save assignment if unchanged', () => {
    const data = {
      title: 'Same',
      total_marks: 100,
      ['A*_grade']: 90,
      A_grade: 80,
      B_grade: 70,
      C_grade: 60,
      F_grade: 0,
      results: []
    };
    component.assignment = { ...data };
    component.originalAssignment = { ...data };
    component.studentResults = [];

    component.saveAssignment();

    expect(teacherServiceMock.updateAssignment).not.toHaveBeenCalled();
  });

  it('should generate PDF and trigger save', () => {
    component.assignment = { title: 'Test Assignment' };
    component.assignmentFields = [];
    component.studentResults = [
      { name: 'Alice', mark: 90, score: 90, grade: 'A*', student_id: '1' }
    ];
    component.allStudents = [{ _id: '1', target_grade: 'A' }];
    component.classDetails = {
      year: 10,
      set: 'A',
      subject: 'Math',
      teachers: [{ name: 'Mr. Smith' }]
    };

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
    expect(pdfServiceMock.addChartSection).toHaveBeenCalled();
    expect(fakeDoc.save).toHaveBeenCalled();
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
    spyOn(console, 'error');
    teacherServiceMock.deleteAssignment.and.returnValue(throwError(() => new Error('fail')));
    component.classId = 'class123';
    component.assignmentId = 'assignment456';

    component.deleteAssignment();

    expect(popupServiceMock.showError).toHaveBeenCalledWith('Error deleting assignment. Please try again.');
  });

  it('should navigate to class view', () => {
    component.navigateToClass('classX');
    expect(routerMock.navigate).toHaveBeenCalledWith(['/classes/classX']);
  });

  it('should navigate to assignments view', () => {
    component.navigateToAssignments('classY');
    expect(routerMock.navigate).toHaveBeenCalledWith(['/classes/classY/assignments']);
  });

  it('should navigate to exams view', () => {
    component.navigateToExams('classZ');
    expect(routerMock.navigate).toHaveBeenCalledWith(['/classes/classZ/exams']);
  });
});
