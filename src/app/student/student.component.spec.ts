import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StudentComponent } from './student.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { TeacherService } from '../../services/teacher.service';
import { AuthService } from '../../auth/auth.service';
import { PdfGenerationService } from '../../services/PdfGeneration.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HighchartsChartModule } from 'highcharts-angular';

describe('StudentComponent', () => {
  let component: StudentComponent;
  let fixture: ComponentFixture<StudentComponent>;
  let mockTeacherService: any;

  beforeEach(async () => {
    const mockStudentData = {
      _id: '123',
      first_name: 'John',
      last_name: 'Doe',
      gender: 'Male',
      year: 10,
      set: 'A',
      target_grades: {
        Math: 'A',
        English: 'B'
      }
    };

    mockTeacherService = {
      getStudent: jasmine.createSpy('getStudent').and.returnValue(of(mockStudentData)),
      getStudentExamData: jasmine.createSpy('getStudentExamData').and.returnValue(of({
        student_scores: [],
        class_averages: [],
        year_averages: []
      })),
      getStudentAssignmentData: jasmine.createSpy('getStudentAssignmentData').and.returnValue(of({
        student_scores: [],
        class_averages: []
      })),
      getStudentFilters: jasmine.createSpy('getStudentFilters').and.returnValue(of({
        subjects: ['Math', 'English']
      })),
      updateStudent: jasmine.createSpy('updateStudent').and.returnValue(of({}))
    };

    await TestBed.configureTestingModule({
      declarations: [StudentComponent],
      imports: [
        HttpClientTestingModule,
        FormsModule,
        ReactiveFormsModule,
        BrowserAnimationsModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        MatIconModule,
        MatButtonModule,
        MatCardModule,
        HighchartsChartModule
      ],
      providers: [
        { provide: TeacherService, useValue: mockTeacherService },
        AuthService,
        PdfGenerationService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => '123' 
              }
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StudentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); 
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load student details correctly', () => {
    expect(component.studentDetails.first_name).toBe('John');
    expect(component.studentDetails.last_name).toBe('Doe');
    expect(component.studentSubjects).toEqual(['Math', 'English']);
  });

  it('should call getStudent and related data methods on init', () => {
    expect(mockTeacherService.getStudent).toHaveBeenCalledWith('123');
    expect(mockTeacherService.getStudentExamData).toHaveBeenCalledWith('123', { subject: '' });
    expect(mockTeacherService.getStudentAssignmentData).toHaveBeenCalledWith('123', { subject: '' });
    expect(mockTeacherService.getStudentFilters).toHaveBeenCalledWith('123');
  });
});
