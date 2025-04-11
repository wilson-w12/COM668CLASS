import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
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
import { Location } from '@angular/common';

describe('ClassExamDetailsComponent', () => {
  let component: ClassExamDetailsComponent;
  let fixture: ComponentFixture<ClassExamDetailsComponent>;
  let teacherService: jasmine.SpyObj<TeacherService>;
  let popupService: jasmine.SpyObj<PopupNotificationService>;
  let pdfService: jasmine.SpyObj<PdfGenerationService>;
  let router: jasmine.SpyObj<Router>;
  let location: jasmine.SpyObj<Location>;

  beforeEach(async () => {
    teacherService = jasmine.createSpyObj('TeacherService', [
      'getExamByExamId',
      'getExamFilters',
      'updateExam',
      'deleteExam'
    ]);
    popupService = jasmine.createSpyObj('PopupNotificationService', ['showError', 'showSuccess']);
    pdfService = jasmine.createSpyObj('PdfGenerationService', [
      'addLogoToPDF',
      'addChartSection',
      'drawTableHeader',
      'wrapText',
      'checkPageBreak',
      'calculateRowHeight',
      'drawTableRow'
    ]);
    router = jasmine.createSpyObj('Router', ['navigate']);
    location = jasmine.createSpyObj('Location', ['back']);

    await TestBed.configureTestingModule({
      declarations: [ClassExamDetailsComponent],
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
        { provide: TeacherService, useValue: teacherService },
        { provide: PopupNotificationService, useValue: popupService },
        { provide: PdfGenerationService, useValue: pdfService },
        { provide: Router, useValue: router },
        { provide: Location, useValue: location },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'exam_id' ? 'mock-exam-id' : null)
              },
              queryParamMap: {
                get: (key: string) => {
                  if (key === 'year') return '10';
                  if (key === 'set') return 'B';
                  return null;
                }
              }
            }
          }
        },
        FormBuilder
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ClassExamDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should call fetchExamDetails with correct params on loadFilters', fakeAsync(() => {
    const examData = {
      title: 'Mock Exam',
      subject: 'Math',
      year: 10,
      due_date: '2025-05-01',
      total_marks: 100,
      'A*_grade': 90,
      A_grade: 80,
      B_grade: 70,
      C_grade: 60,
      F_grade: 0,
      results: []
    };
    teacherService.getExamFilters.and.returnValue(of({ years: [10], sets: ['B'] }));
    teacherService.getExamByExamId.and.returnValue(of(examData));

    component.ngOnInit();
    tick();

    expect(teacherService.getExamFilters).toHaveBeenCalled();
    expect(teacherService.getExamByExamId).toHaveBeenCalledWith('mock-exam-id', { year: 10, set: 'B' });
    expect(component.examForm).toBeDefined();
    expect(component.exam.title).toBe('Mock Exam');
  }));

  it('should validateBeforeSave return false if form invalid', () => {
    component.examForm = new FormBuilder().group({
      title: [''], // invalid
      subject: [''],
      year: [10],
      due_date: ['2025-05-01'],
      total_marks: [100],
      A_star_grade: [90],
      A_grade: [80],
      B_grade: [70],
      C_grade: [60],
      F_grade: [0]
    });

    component.studentResults = [];
    const isValid = component.validateBeforeSave();
    expect(isValid).toBeFalse();
    expect(popupService.showError).toHaveBeenCalled();
  });

  it('should validateBeforeSave return true if form is valid', () => {
    component.exam = { total_marks: 100 };
    component.examForm = new FormBuilder().group({
      title: ['Test'],
      subject: ['Math'],
      year: [10],
      due_date: ['2025-05-01'],
      total_marks: [100],
      A_star_grade: [90],
      A_grade: [80],
      B_grade: [70],
      C_grade: [60],
      F_grade: [0]
    });

    component.studentResults = [{ name: 'Alice', mark: 80, grade: 'A' }];
    const isValid = component.validateBeforeSave();
    expect(isValid).toBeTrue();
  });

  it('should save exam if form is valid and changes detected', () => {
    component.examId = 'mock-exam-id';
    component.exam = {
      title: 'Exam',
      subject: 'Science',
      year: 10,
      due_date: '2025-05-01',
      total_marks: 100,
      'A*_grade': 90,
      A_grade: 80,
      B_grade: 70,
      C_grade: 60,
      F_grade: 0
    };

    component.originalExam = {
      ...component.exam,
      results: [{ student_id: '1', mark: 50, grade: 'B' }]
    };

    component.studentResults = [{ student_id: '1', mark: 85, grade: 'A' }];

    component.examForm = new FormBuilder().group({
      title: ['Exam'],
      subject: ['Science'],
      year: [10],
      due_date: ['2025-05-01'],
      total_marks: [100],
      A_star_grade: [90],
      A_grade: [80],
      B_grade: [70],
      C_grade: [60],
      F_grade: [0]
    });

    teacherService.updateExam.and.returnValue(of({}));

    component.saveExam();

    expect(teacherService.updateExam).toHaveBeenCalledWith('mock-exam-id', jasmine.any(Object));
    expect(popupService.showSuccess).toHaveBeenCalled();
  });

  it('should not call updateExam if no changes', () => {
    const examData = {
      title: 'Same',
      subject: 'Same',
      year: 10,
      due_date: '2025-05-01',
      total_marks: 100,
      'A*_grade': 90,
      A_grade: 80,
      B_grade: 70,
      C_grade: 60,
      F_grade: 0,
      results: []
    };
    component.exam = { ...examData };
    component.originalExam = { ...examData };
    component.studentResults = [];

    component.examForm = new FormBuilder().group({
      title: ['Same'],
      subject: ['Same'],
      year: [10],
      due_date: ['2025-05-01'],
      total_marks: [100],
      A_star_grade: [90],
      A_grade: [80],
      B_grade: [70],
      C_grade: [60],
      F_grade: [0]
    });

    component.saveExam();
    expect(teacherService.updateExam).not.toHaveBeenCalled();
  });

  it('should delete exam and show success', () => {
    component.examId = 'mock-exam-id';
    teacherService.deleteExam.and.returnValue(of({}));

    component.deleteExam();

    expect(teacherService.deleteExam).toHaveBeenCalledWith('mock-exam-id');
    expect(popupService.showSuccess).toHaveBeenCalled();
  });

  it('should show error if delete exam fails', () => {
    spyOn(console, 'error');
    component.examId = 'mock-exam-id';
    teacherService.deleteExam.and.returnValue(throwError(() => new Error('delete error')));
    component.deleteExam();
    expect(popupService.showError).toHaveBeenCalledWith('Error deleting exam. Please try again.');
  });
});
