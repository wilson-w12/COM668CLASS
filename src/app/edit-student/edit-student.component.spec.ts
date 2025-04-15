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
import { PopupNotificationService } from '../../services/popup-notification.service';

describe('EditStudentComponent', () => {
  let component: EditStudentComponent;
  let fixture: ComponentFixture<EditStudentComponent>;
  let teacherServiceSpy: jasmine.SpyObj<TeacherService>;
  let popupServiceSpy: jasmine.SpyObj<PopupNotificationService>;

  beforeEach(async () => {
    const teacherSpy = jasmine.createSpyObj('TeacherService', [
      'getStudentClasses',
      'getClasses',
      'updateStudent',
      'updateStudentClasses'
    ]);

    const popupSpy = jasmine.createSpyObj('PopupNotificationService', ['showSuccess', 'showError']);

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
        { provide: PopupNotificationService, useValue: popupSpy },
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
    popupServiceSpy = TestBed.inject(PopupNotificationService) as jasmine.SpyObj<PopupNotificationService>;

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

  it('should handle errors when fetching student classes', fakeAsync(() => {
    teacherServiceSpy.getStudentClasses.and.returnValue(throwError(() => new Error('Failed to fetch')));
    component.ngOnInit();
    tick();
    expect(popupServiceSpy.showError).toHaveBeenCalledWith('Unable to load student details. Please try again.');
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
    component.studentForm.patchValue({
      firstName: 'Test',
      lastName: 'Student',
      gender: 'Female',
      year: '9',
      set: 'A'
    });

    component.subjects.forEach(subject => {
      component.teacherControls[subject].setValue('class123');
      component.targetGradeControls[subject].setValue('A');
    });

    teacherServiceSpy.updateStudent.and.returnValue(of({}));
    teacherServiceSpy.updateStudentClasses.and.returnValue(of({}));

    component.save();
    tick();

    expect(teacherServiceSpy.updateStudent).toHaveBeenCalled();
    expect(teacherServiceSpy.updateStudentClasses).toHaveBeenCalled();
    expect(popupServiceSpy.showSuccess).toHaveBeenCalledWith('Student details updated successfully!');
  }));

  it('should handle error when updating student fails', fakeAsync(() => {
    component.studentId = '123';
    component.studentForm.patchValue({
      firstName: 'Test',
      lastName: 'Student',
      gender: 'Female',
      year: '9',
      set: 'A'
    });

    component.subjects.forEach(subject => {
      component.teacherControls[subject].setValue('class123');
      component.targetGradeControls[subject].setValue('A');
    });

    teacherServiceSpy.updateStudent.and.returnValue(throwError(() => new Error('Update failed')));

    component.save();
    tick();

    expect(popupServiceSpy.showError).toHaveBeenCalledWith('Failed to update student details.');
  }));

  it('should handle error when updating student classes fails', fakeAsync(() => {
    component.studentId = '123';
    component.studentForm.patchValue({
      firstName: 'Test',
      lastName: 'Student',
      gender: 'Female',
      year: '9',
      set: 'A'
    });

    component.subjects.forEach(subject => {
      component.teacherControls[subject].setValue('class123');
      component.targetGradeControls[subject].setValue('A');
    });

    teacherServiceSpy.updateStudent.and.returnValue(of({}));
    teacherServiceSpy.updateStudentClasses.and.returnValue(throwError(() => new Error('Class update failed')));

    component.save();
    tick();

    expect(popupServiceSpy.showError).toHaveBeenCalledWith('Failed to update student classes.');
  }));
});
