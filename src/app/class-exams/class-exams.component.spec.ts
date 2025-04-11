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
    const teacherServiceMock = jasmine.createSpyObj('TeacherService', [
      'getClassById', 'getExamsByClassId'
    ]);
  
    teacherServiceMock.getClassById.and.returnValue(of({
      class: {
        _id: 'test-class-id',
        year: 10,
        subject: 'Math',
        set: 'B',
        students: new Array(30),  
      }
    }));
  
    teacherServiceMock.getExamsByClassId.and.returnValue(of({
      exams: [{
        _id: 'exam1',
        title: 'Midterm Exam',
        due_date: '2023-05-01',
        results: new Array(20) 
      }]
    }));
  
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
      ],
      declarations: [ClassExamsComponent],
      providers: [
        { provide: TeacherService, useValue: teacherServiceMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => 'test-class-id',
              },
            },
          },
        },
      ]
    }).compileComponents();
  
    fixture = TestBed.createComponent(ClassExamsComponent);
    component = fixture.componentInstance;
  
    component.filteredExams = [{
      _id: 'exam1',
      title: 'Midterm Exam',
      due_date: '2023-05-01',
      results: new Array(20)
    }];
    component.classDetails = {
      _id: 'test-class-id',
      subject: 'Math',
      year: 10,
      set: 'B',
      students: new Array(30)
    };
  
    fixture.detectChanges();
  });  

  it('should create', () => {
    expect(component).toBeTruthy();
  });

});
