import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClassExamsComponent } from './class-exams.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { TeacherService } from '../../services/teacher.service';

describe('ClassExamsComponent', () => {
  let component: ClassExamsComponent;
  let fixture: ComponentFixture<ClassExamsComponent>;
  let teacherService: jasmine.SpyObj<TeacherService>;

  beforeEach(async () => {
    // Mock TeacherService
    const teacherServiceMock = jasmine.createSpyObj('TeacherService', [
      'getClassById', 'getExamsByClassId'
    ]);

    // Mock data for service methods
    teacherServiceMock.getClassById.and.returnValue(of({ class: { year: 10, subject: 'Math' } }));
    teacherServiceMock.getExamsByClassId.and.returnValue(of({ exams: [{ title: 'Midterm Exam', due_date: '2023-05-01' }] }));

    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,  // Mock HTTP requests
        RouterTestingModule,      // Mock routing
      ],
      declarations: [ClassExamsComponent],  // Declare the standalone component here
      providers: [
        { provide: TeacherService, useValue: teacherServiceMock },
        {
          provide: ActivatedRoute,  // Mock ActivatedRoute
          useValue: {
            snapshot: {
              paramMap: {
                get: () => 'test-class-id', // Mock class ID route parameter
              },
            },
          },
        },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ClassExamsComponent);
    component = fixture.componentInstance;
    teacherService = TestBed.inject(TeacherService) as jasmine.SpyObj<TeacherService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

});
