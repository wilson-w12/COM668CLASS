import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { of, throwError } from 'rxjs';

import { ClassExamDetailsComponent } from './class-exam-details.component';
import { TeacherService } from '../../services/teacher.service';
import { PopupNotificationService } from '../../services/popup-notification.service';
import { PdfGenerationService } from '../../services/PdfGeneration.service';
import { Router, ActivatedRoute } from '@angular/router';
import { HighchartsChartModule } from 'highcharts-angular';

class MockTeacherService {
  getExamByExamId = jasmine.createSpy('getExamByExamId').and.returnValue(of({}));
  getExamFilters = jasmine.createSpy('getExamFilters').and.returnValue(of({ years: [8, 9, 10], sets: ['A', 'B'] }));
  updateExam = jasmine.createSpy('updateExam').and.returnValue(of({}));
  deleteExam = jasmine.createSpy('deleteExam').and.returnValue(of({}));
}

class MockPopupNotificationService {
  showError = jasmine.createSpy('showError');
  showSuccess = jasmine.createSpy('showSuccess');
}

class MockPdfGenerationService {
  addLogoToPDF = jasmine.createSpy('addLogoToPDF');
  addChartSection = jasmine.createSpy('addChartSection');
  drawTableHeader = jasmine.createSpy('drawTableHeader');
  wrapText = jasmine.createSpy('wrapText').and.callFake((text: string) => text);
  checkPageBreak = jasmine.createSpy('checkPageBreak').and.callFake((_doc, y) => y);
  calculateRowHeight = jasmine.createSpy('calculateRowHeight').and.returnValue(10);
  drawTableRow = jasmine.createSpy('drawTableRow');
}


class MockRouter {
  navigate = jasmine.createSpy('navigate');
}

class MockActivatedRoute {
  snapshot = {
    paramMap: {
      get: jasmine.createSpy('get').and.callFake((key: string) => {
        if (key === 'exam_id') return '1';
        if (key === 'year') return '9';
        if (key === 'set') return 'A';
        return null;
      })
    },
    queryParamMap: {
      get: jasmine.createSpy('get').and.callFake((key: string) => {
        if (key === 'year') return '9';
        if (key === 'set') return 'A';
        return null;
      })
    }
  };
}


describe('ClassExamDetailsComponent', () => {
  let component: ClassExamDetailsComponent;
  let fixture: ComponentFixture<ClassExamDetailsComponent>;
  let teacherServiceMock: MockTeacherService;
  let popupServiceMock: MockPopupNotificationService;
  let pdfGenerationServiceMock: MockPdfGenerationService;
  let routerMock: MockRouter;
  let activatedRouteMock: MockActivatedRoute;

  beforeEach(async () => {
    teacherServiceMock = new MockTeacherService();
    popupServiceMock = new MockPopupNotificationService();
    pdfGenerationServiceMock = new MockPdfGenerationService();
    routerMock = new MockRouter();
    activatedRouteMock = new MockActivatedRoute();

    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        FormsModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatCardModule,
        MatFormFieldModule,
        MatSelectModule,
        HighchartsChartModule,
      ],
      declarations: [ClassExamDetailsComponent],
      providers: [
        { provide: TeacherService, useValue: teacherServiceMock },
        { provide: PopupNotificationService, useValue: popupServiceMock },
        { provide: PdfGenerationService, useValue: pdfGenerationServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ClassExamDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    // Reset all spies
    teacherServiceMock.getExamByExamId.calls.reset();
    teacherServiceMock.getExamFilters.calls.reset();
    teacherServiceMock.updateExam.calls.reset();
    teacherServiceMock.deleteExam.calls.reset();
    popupServiceMock.showError.calls.reset();
    popupServiceMock.showSuccess.calls.reset();
    pdfGenerationServiceMock.addLogoToPDF.calls.reset();
    pdfGenerationServiceMock.addChartSection.calls.reset();
    routerMock.navigate.calls.reset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load exam details on load filters', fakeAsync(() => {
    spyOn(component, 'fetchExamDetails');

    component.loadFilters('1');
    tick();

    expect(component.fetchExamDetails).toHaveBeenCalledWith('1');
  }));

  it('should load exam filters on init', () => {
    component.ngOnInit();
    expect(teacherServiceMock.getExamFilters).toHaveBeenCalled();
  });

  it('should apply filters correctly', () => {
    component.filters.year = 9;
    component.filters.set = 'A';
    component.applyFilters();
    expect(teacherServiceMock.getExamByExamId).toHaveBeenCalledWith('1', { year: 9, set: 'A' });
  });

  it('should update charts after loading exam details', () => {
    const examDetails = {
      results: [{ student_id: '1', name: 'John Doe', mark: 50, score: 60, grade: 'B', target_grade: 'A' }]
    };
    teacherServiceMock.getExamByExamId.and.returnValue(of(examDetails));

    component.fetchExamDetails('exam_id');
    expect(component.marksChartOptions).toBeDefined();
    expect(component.gradesChartOptions).toBeDefined();
    expect(component.targetGradeChartOptions).toBeDefined();
  });

  it('should toggle exam details edit mode', () => {
    expect(component.isEditingExamDetails).toBeFalse();
    component.toggleEditExamDetails();
    expect(component.isEditingExamDetails).toBeTrue();
    component.toggleEditExamDetails();
    expect(component.isEditingExamDetails).toBeFalse();
  });

  it('should toggle scores edit mode', () => {
    expect(component.isEditingScores).toBeFalse();
    component.toggleEditScores();
    expect(component.isEditingScores).toBeTrue();
    component.toggleEditScores();
    expect(component.isEditingScores).toBeFalse();
  });

  it('should save exam details', () => {
    component.examId = '1';
    component.exam = {
      title: 'Test Exam',
      subject: 'Math',
      year: 9,
      total_marks: 100,
      "A*_grade": 90,
      A_grade: 80,
      B_grade: 70,
      C_grade: 60,
      F_grade: 0
    };
    component.studentResults = [{ student_id: '1', mark: 50, grade: 'B' }];
    component.originalExam = JSON.parse(JSON.stringify({
      ...component.exam,
      results: [{ student_id: '1', mark: 40, grade: 'C' }]
    }));

    component.saveExam();

    expect(teacherServiceMock.updateExam).toHaveBeenCalledWith('1', Object({ title: 'Test Exam', subject: 'Math', year: 9, total_marks: 100, "A*_grade": 90, A_grade: 80, B_grade: 70, C_grade: 60, F_grade: 0, results: [Object({ student_id: '1', mark: 50, grade: 'B' })] }))
  });

  it('should delete exam', () => {
    component.deleteExam();
    expect(teacherServiceMock.deleteExam).toHaveBeenCalled();
  });

  it('should validate exam correctly', () => {
    component.exam = {
      title: 'Test',
      subject: 'Math',
      year: 10,
      "A*_grade": 90,
      A_grade: 80,
      B_grade: 70,
      C_grade: 60,
      F_grade: 0,
      total_marks: 100
    };
    expect(component.validateExam()).toBeTrue();
  });

  it('should fail validateExam when missing title', () => {
    component.exam = {
      subject: 'Math',
      "A*_grade": 90,
      A_grade: 80,
      B_grade: 70,
      C_grade: 60,
      F_grade: 0,
      total_marks: 100
    };
  
    const result = component.validateExam();
    expect(result).toBeFalse(); 
  });

  it('should validate scores correctly', () => {
    component.exam = { total_marks: 100 };
    component.studentResults = [{ mark: 80, grade: 'A' }, { mark: null, grade: 'Not Submitted' }];
    expect(component.validateScores()).toBeTrue();
  });

  it('should fail validateScores with invalid score', () => {
    component.exam = { total_marks: 100 };
    component.studentResults = [{ mark: 110, grade: 'A' }];
    expect(component.validateScores()).toBeFalse();
  });

  it('should recalculate grade based on mark', () => {
    component.exam = { "A*_grade": 90, A_grade: 80, B_grade: 70, C_grade: 60, F_grade: 0, total_marks: 100 };
    const student: any = { mark: 85 };
    component.recalculateGrade(student);
    expect(student.grade).toBe('A');
  });

  it('should assign "Not Submitted" if mark is null in recalculateGrade', () => {
    const student: any = { mark: null };
    component.recalculateGrade(student);
    expect(student.grade).toBe('Not Submitted');
  });

  it('should save exam only when valid and changed', () => {
    component.exam = {
      title: 'Exam',
      subject: 'Math',
      year: 10,
      "A*_grade": 90,
      A_grade: 80,
      B_grade: 70,
      C_grade: 60,
      F_grade: 0,
      total_marks: 100
    };
    component.studentResults = [{ student_id: '1', mark: 90, grade: 'A*' }];
    component.originalExam = { ...component.exam, results: [{ student_id: '1', mark: 80, grade: 'A' }] };

    component.saveExam();
    expect(teacherServiceMock.updateExam).toHaveBeenCalled();
    expect(popupServiceMock.showSuccess).toHaveBeenCalled();
  });

  it('should not save exam if unchanged', () => {
    const unchanged = {
      title: 'Same',
      subject: 'Math',
      total_marks: 100,
      "A*_grade": 90,
      A_grade: 80,
      B_grade: 70,
      C_grade: 60,
      F_grade: 0,
      results: []
    };

    component.exam = { ...unchanged };
    component.originalExam = JSON.parse(JSON.stringify(unchanged));
    component.studentResults = [];

    component.saveExam();

    expect(teacherServiceMock.updateExam).not.toHaveBeenCalled();
  });

  it('should show error if exam validation fails', () => {
    component.exam = { subject: 'Math' };
    component.saveExam();
    expect(popupServiceMock.showError).toHaveBeenCalled();
  });

  it('should show error if scores validation fails', () => {
    component.exam = {
      title: 'Exam',
      subject: 'Math',
      total_marks: 100,
      "A*_grade": 90,
      A_grade: 80,
      B_grade: 70,
      C_grade: 60,
      F_grade: 0
    };
    component.studentResults = [{ mark: 999 }];
    component.saveExam();
    expect(popupServiceMock.showError).toHaveBeenCalled();
  });

  it('should call generatePDF and add charts', () => {
    component.examDetails = { title: 'Mock Exam', year: 10 };
    component.exam = { title: 'Mock Exam', year: 10 };
    component.examFields = [];
    component.studentResults = [
      { name: 'Student A', mark: 90, score: 90, grade: 'A*', target_grade: 'A', student_id: '1' }
    ];
  
    const fakeDoc: any = {
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
  
    pdfGenerationServiceMock.addLogoToPDF.and.callFake((doc, cb) => cb(fakeDoc, 10));
    pdfGenerationServiceMock.addChartSection.and.callFake((doc, ids, x, widths, y, cb) => cb(y + 50));
    spyOn(component as any, 'getTargetGrade').and.returnValue('A');
  
    component.generatePDF();
  
    expect(pdfGenerationServiceMock.addLogoToPDF).toHaveBeenCalled();
    expect(pdfGenerationServiceMock.addChartSection).toHaveBeenCalled();
    expect(fakeDoc.save).toHaveBeenCalled();
  });
  

  it('should navigate on deleteExam success', () => {
    component.deleteExam();
    expect(teacherServiceMock.deleteExam).toHaveBeenCalled();
    expect(popupServiceMock.showSuccess).toHaveBeenCalled();
  });

  it('should show error on deleteExam failure', () => {
    spyOn(console, 'error');
    teacherServiceMock.deleteExam.and.returnValue(throwError(() => new Error('delete failed')));
    component.examId = '1';
    component.deleteExam();
    expect(popupServiceMock.showError).toHaveBeenCalledWith('Error deleting exam. Please try again.');
  });

  it('should reset exam on toggleEditExamDetails false', () => {
    component.originalExam = { title: 'Original' };
    component.exam = { title: 'Changed' };
    component.isEditingExamDetails = true;
    component.toggleEditExamDetails();
    expect(component.exam).toEqual({ title: 'Original' });
  });

  it('should reset scores on toggleEditScores false', () => {
    const original = [{ name: 'Alice', mark: 90 }];
    component.studentResults = [{ name: 'Bob', mark: 50 }];
    component.originalStudentResults = original;
    component.isEditingScores = true;

    component.toggleEditScores();
    expect(component.studentResults).toEqual(original);
  });
});
