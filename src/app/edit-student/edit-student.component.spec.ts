import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { EditStudentComponent } from './edit-student.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TeacherService } from '../../services/teacher.service';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { HighchartsChartModule } from 'highcharts-angular';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

describe('EditStudentComponent', () => {
  let component: EditStudentComponent;
  let fixture: ComponentFixture<EditStudentComponent>;
  let teacherServiceSpy: jasmine.SpyObj<TeacherService>;

  beforeEach(async () => {
    const teacherSpy = jasmine.createSpyObj('TeacherService', [
      'getStudentClasses',
      'getClasses',
      'updateStudent',
      'updateStudentClasses'
    ]);

    await TestBed.configureTestingModule({
      declarations: [EditStudentComponent],
      imports: [
        FormsModule,
        ReactiveFormsModule,
        HttpClientTestingModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        MatIconModule,
        MatButtonModule,
        MatCardModule,
        MatAutocompleteModule,
        HighchartsChartModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: TeacherService, useValue: teacherSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => '123'
              }
            }
          }
        }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(EditStudentComponent);
    component = fixture.componentInstance;
    teacherServiceSpy = TestBed.inject(TeacherService) as jasmine.SpyObj<TeacherService>;

    teacherServiceSpy.getStudentClasses.and.returnValue(of({
      student: {
        first_name: '',
        last_name: '',
        gender: '',
        year: '',
        set: '',
        target_grades: {}
      },
      classes: []
    }));

    teacherServiceSpy.getClasses.and.callFake(() => of({ classes: [] }));

    fixture.detectChanges(); 
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form controls for subjects on init', () => {
    component.subjects.forEach((subject: string) => {
      expect(component.teacherControls[subject]).toBeTruthy();
      expect(component.targetGradeControls[subject]).toBeTruthy();
    });
  });

  /*it('should fetch student classes and populate form', fakeAsync(() => {
    const mockStudent = {
      first_name: 'John',
      last_name: 'Doe',
      gender: 'Male',
      year: '10',
      set: 'B',
      target_grades: { Maths: 'A', English: 'B' }
    };

    const mockClasses = [
      { _id: 'class1', subject: 'Maths' },
      { _id: 'class2', subject: 'English' }
    ];

    component.subjects = ['Maths', 'English'];
    component.subjects.forEach((subject: string) => {
      component.teacherControls[subject] = new FormControl('');
      component.targetGradeControls[subject] = new FormControl('');
      component.teachersMap[subject] = [];
    });

    teacherServiceSpy.getStudentClasses.and.returnValue(of({
      student: mockStudent,
      classes: mockClasses
    }));

    component.ngOnInit();
    tick();
    fixture.detectChanges();

    expect(component.student.firstName).toBe('John');
    expect(component.genderControl.value).toBe('Male');
    expect(component.targetGradeControls['Maths'].value).toBe('A');
    expect(component.teacherControls['Maths'].value).toBe('class1');
    expect(component.studentClasses).toEqual(mockClasses);
    expect(teacherServiceSpy.getStudentClasses).toHaveBeenCalledWith('123');
  }));*/

  it('should handle errors when fetching student classes', fakeAsync(() => {
    spyOn(console, 'error');
    teacherServiceSpy.getStudentClasses.and.returnValue(throwError(() => new Error('Failed to fetch')));
    component.ngOnInit();
    tick();
    expect(console.error).toHaveBeenCalled();
  }));

  it('should fetch teacher classes per subject and update teachersMap', fakeAsync(() => {
    const subject = 'Maths';
    const mockClasses = [
      { class_id: '1', teachers: [{ name: 'Mr A' }], year: '10', set: 'A' }
    ];
    teacherServiceSpy.getClasses.and.returnValue(of({ classes: mockClasses }));

    component.getClassesForSubject(subject);
    tick();

    expect(component.teachersMap[subject].length).toBe(1);
    expect(component.teachersMap[subject][0].name).toBe('Mr A');
  }));

  it('should save student details and classes successfully', fakeAsync(() => {
    component.studentId = '123';
    component.student.firstName = 'Test';
    component.student.lastName = 'Student';
    component.genderControl.setValue('Female');
    component.yearControl.setValue('9');
    component.setControl.setValue('A');
    component.teacherControls['Maths'] = new FormControl('maths123');
    component.targetGradeControls['Maths'] = new FormControl('A');

    teacherServiceSpy.updateStudent.and.returnValue(of({}));
    teacherServiceSpy.updateStudentClasses.and.returnValue(of({}));

    spyOn(window, 'alert');
    component.save();
    tick();

    expect(teacherServiceSpy.updateStudent).toHaveBeenCalled();
    expect(teacherServiceSpy.updateStudentClasses).toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('Student details updated successfully!');
  }));

  it('should handle error when updating student fails', fakeAsync(() => {
    component.studentId = '123';
    teacherServiceSpy.updateStudent.and.returnValue(throwError(() => new Error('Update failed')));
    spyOn(window, 'alert');
    component.save();
    tick();
    expect(window.alert).toHaveBeenCalledWith('Failed to update student details.');
  }));

  it('should handle error when updating student classes fails', fakeAsync(() => {
    component.studentId = '123';
    teacherServiceSpy.updateStudent.and.returnValue(of({}));
    teacherServiceSpy.updateStudentClasses.and.returnValue(throwError(() => new Error('Class update failed')));
    spyOn(window, 'alert');
    component.save();
    tick();
    expect(window.alert).toHaveBeenCalledWith('Failed to update student classes.');
  }));
});
