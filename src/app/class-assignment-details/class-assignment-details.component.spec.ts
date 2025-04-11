import { ComponentFixture, TestBed } from '@angular/core/testing';
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

describe('ClassAssignmentDetailsComponent', () => {
  let component: ClassAssignmentDetailsComponent;
  let fixture: ComponentFixture<ClassAssignmentDetailsComponent>;
  let teacherService: jasmine.SpyObj<TeacherService>;
  let popupService: jasmine.SpyObj<PopupNotificationService>;
  let pdfService: jasmine.SpyObj<PdfGenerationService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    teacherService = jasmine.createSpyObj('TeacherService', [
      'getClassById',
      'getAssignmentByAssignmentId',
      'getStudentsByClassId',
      'updateAssignment',
      'deleteAssignment'
    ]);

    popupService = jasmine.createSpyObj('PopupNotificationService', ['showError', 'showSuccess']);

    pdfService = jasmine.createSpyObj('PdfGenerationService', [
      'addLogoToPDF',
      'addChartSection',
      'drawTableHeader',
      'drawTableRow',
      'wrapText',
      'checkPageBreak',
      'calculateRowHeight'
    ]);

    router = jasmine.createSpyObj('Router', ['navigate']);

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
        { provide: TeacherService, useValue: teacherService },
        { provide: PopupNotificationService, useValue: popupService },
        { provide: PdfGenerationService, useValue: pdfService },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => {
                  if (key === 'class_id') return 'class123';
                  if (key === 'assignment_id') return 'assignment456';
                  return null;
                }
              }
            }
          }
        }
      ]
    }).compileComponents();

    // Default return values
    teacherService.getClassById.and.returnValue(of({ class: { year: 10, set: 'A', subject: 'Math', teachers: [{ name: 'Mr. Smith' }] } }));
    teacherService.getAssignmentByAssignmentId.and.returnValue(of({ title: 'Test Assignment', results: [] }));
    teacherService.getStudentsByClassId.and.returnValue(of({ students: [] }));
    teacherService.deleteAssignment.and.returnValue(of({}));
    teacherService.updateAssignment.and.returnValue(of({}));

    fixture = TestBed.createComponent(ClassAssignmentDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load data on init', () => {
    expect(teacherService.getClassById).toHaveBeenCalledWith('class123');
    expect(teacherService.getAssignmentByAssignmentId).toHaveBeenCalledWith('class123', 'assignment456');
    expect(teacherService.getStudentsByClassId).toHaveBeenCalledWith('class123');
  });

  it('should toggle edit mode and restore original on cancel', () => {
    component.originalAssignment = {
      title: 'Original Title',
      topics: 'Topic A',
      due_date: '2025-04-15',
      total_marks: 100,
      ['A*_grade']: 90,
      A_grade: 80,
      B_grade: 70,
      C_grade: 60,
      F_grade: 0
    };

    component.assignment = { ...component.originalAssignment, title: 'Edited' };

    component.assignmentForm.setValue({
      title: 'Edited',
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

  it('should show error if form or student marks are invalid', () => {
    component.assignment.total_marks = 100;
    component.assignmentForm.patchValue({ title: '' });
    component.studentResults = [{ mark: 150 }];

    component.saveAssignment();

    expect(popupService.showError).toHaveBeenCalled();
    expect(teacherService.updateAssignment).not.toHaveBeenCalled();
  });

  it('should save valid changes and show success', () => {
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

    expect(teacherService.updateAssignment).toHaveBeenCalled();
    expect(popupService.showSuccess).toHaveBeenCalled();
  });

  it('should not update if assignment is unchanged', () => {
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

    component.studentResults = [];

    component.saveAssignment();

    expect(teacherService.updateAssignment).not.toHaveBeenCalled();
  });

  it('should delete assignment and redirect on success', () => {
    component.classId = 'class123';
    component.assignmentId = 'assignment456';

    component.deleteAssignment();

    expect(teacherService.deleteAssignment).toHaveBeenCalledWith('class123', 'assignment456');
    expect(router.navigate).toHaveBeenCalledWith(['/classes/class123']);
    expect(popupService.showSuccess).toHaveBeenCalled();
  });

  it('should show error if deletion fails', () => {
    teacherService.deleteAssignment.and.returnValue(throwError(() => new Error('delete error')));
    component.classId = 'class123';
    component.assignmentId = 'assignment456';

    component.deleteAssignment();

    expect(popupService.showError).toHaveBeenCalled();
  });

  it('should calculate correct grade and score', () => {
    component.assignment = {
      total_marks: 100,
      ['A*_grade']: 90,
      A_grade: 80,
      B_grade: 70,
      C_grade: 60,
      F_grade: 0
    };

    const student: { mark: number | null, score: number | null, grade: string } = {
      mark: 85,
      score: null,
      grade: ''
    };
    component.recalculateGradeAndScore(student);

    expect(student.grade).toBe('A');
    expect(student.score).toBe(85);
  });

  it('should handle null mark as Not Submitted', () => {
    const student = { mark: null, score: null, grade: '' };
    component.recalculateGradeAndScore(student);
    expect(student.grade).toBe('Not Submitted');
    expect(student.score).toBeNull();
  });

  it('should generate PDF and save', () => {
    component.assignment = { title: 'PDF Test' };
    component.classDetails = { year: 10, set: 'A', subject: 'Math', teachers: [{ name: 'Teacher One' }] };
    component.assignmentFields = [];
    component.studentResults = [{ name: 'Alice', mark: 90, score: 90, grade: 'A*', student_id: '1' }];
    component.allStudents = [{ _id: '1', target_grade: 'A' }];

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

    (window as any).jsPDF = function () {
      return fakeDoc;
    };

    spyOn(component as any, 'getTargetGrade').and.returnValue('A');
    pdfService.addLogoToPDF.and.callFake((doc, cb) => cb(fakeDoc, 10));
    pdfService.addChartSection.and.callFake((_doc, _ids, _x, _w, y, cb) => cb(y + 50));

    component.generatePDF();

    expect(pdfService.addLogoToPDF).toHaveBeenCalled();
    expect(fakeDoc.save).toHaveBeenCalled();
  });
});
