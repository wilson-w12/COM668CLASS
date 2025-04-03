import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ClassesComponent } from './classes.component';
import { TeacherService } from '../../services/teacher.service';
import { Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('ClassesComponent', () => {
  let component: ClassesComponent;
  let fixture: ComponentFixture<ClassesComponent>;
  let teacherServiceSpy: jasmine.SpyObj<TeacherService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockClassesResponse = {
    classes: [
      {
        class_id: '123',
        subject: 'Math',
        year: 2024,
        set: 'A',
        teachers: [{ id: 't1', name: 'Teacher One' }],
      }
    ],
    total_classes: 1
  };

  const mockFiltersResponse = {
    teachers: [{ id: 't1', name: 'Teacher One' }],
    subjects: ['Math', 'Science'],
    years: [2023, 2024],
    sets: ['A', 'B']
  };

  beforeEach(async () => {
    const teacherServiceMock = jasmine.createSpyObj('TeacherService', ['getClasses', 'getClassFilters', 'updateTeacherClasses']);
    const routerMock = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [ClassesComponent],
      imports: [ReactiveFormsModule, 
        HttpClientTestingModule, 
        FormsModule,
        ReactiveFormsModule,
        BrowserAnimationsModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        MatIconModule,
        MatButtonModule,
        MatAutocompleteModule,
        MatCardModule,],      providers: [
        { provide: TeacherService, useValue: teacherServiceMock },
        { provide: Router, useValue: routerMock },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ClassesComponent);
    component = fixture.componentInstance;
    teacherServiceSpy = TestBed.inject(TeacherService) as jasmine.SpyObj<TeacherService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    teacherServiceSpy.getClasses.and.returnValue(of(mockClassesResponse));
    teacherServiceSpy.getClassFilters.and.returnValue(of(mockFiltersResponse));
  });

  it('should detect and update changed classes on save', fakeAsync(() => {
    fixture.detectChanges();
    tick(); // allow observables to emit

    teacherServiceSpy.getClasses.calls.reset(); // clear init calls

    const updatedClass = {
      ...component.currentTeacherClasses[0],
      selectedTeacherIds: ['t2']
    };
    component.currentTeacherClasses = [updatedClass];

    teacherServiceSpy.updateTeacherClasses.and.returnValue(of({ success: true }));

    component.saveClasses();
    tick(); // simulate async response

    expect(teacherServiceSpy.updateTeacherClasses).toHaveBeenCalledWith([
      { class_id: '123', selectedTeacherIds: ['t2'] }
    ]);
    expect(teacherServiceSpy.getClasses).toHaveBeenCalledTimes(1); // only reload once
  }));

  it('should toggle view and reload classes', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    teacherServiceSpy.getClasses.calls.reset();

    component.toggleView(false);
    tick();

    expect(component.myClassesView).toBeFalse();
    expect(teacherServiceSpy.getClasses).toHaveBeenCalledTimes(1);
  }));

  it('should call loadMoreClasses and increment page', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    teacherServiceSpy.getClasses.calls.reset();

    const initialPage = component.currentPage;
    component.loadMoreClasses();
    tick();

    expect(component.currentPage).toBe(initialPage + 1);
    expect(teacherServiceSpy.getClasses).toHaveBeenCalledTimes(1);
  }));

  it('should handle filter change and call applyFilters', fakeAsync(() => {
    fixture.detectChanges();
    tick();
  
    const applySpy = spyOn(component, 'applyFilters').and.callThrough();
  
    component.teacherControl.setValue('Teacher One');
    tick();
  
    component.subjectControl.setValue('Math');
    tick();
  
    component.yearControl.setValue(2024);
    tick();
  
    component.setControl.setValue('A');
    tick();
  
    expect(applySpy).toHaveBeenCalledTimes(3);
  }));  
});
