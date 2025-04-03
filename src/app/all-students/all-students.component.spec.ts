import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormControl, FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AllStudentsComponent } from './all-students.component';
import { TeacherService } from '../../services/teacher.service';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

describe('AllStudentsComponent', () => {
  let component: AllStudentsComponent;
  let fixture: ComponentFixture<AllStudentsComponent>;
  let teacherServiceMock: jasmine.SpyObj<TeacherService>;

  beforeEach(async () => {
    // Mock TeacherService
    teacherServiceMock = jasmine.createSpyObj('TeacherService', [
      'getStudents', 
      'getStudentsFilters'
    ]);

    // Mock getStudents and getStudentsFilters
    teacherServiceMock.getStudents.and.returnValue(of({
      students: [{ id: '1', name: 'John Doe' }],
      total_students: 100
    }));
    teacherServiceMock.getStudentsFilters.and.returnValue(of({
      years: [8, 9, 10, 11, 12],
      sets: ['A', 'B', 'C', 'D']
    }));

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        HttpClientTestingModule,  
        RouterTestingModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        MatIconModule,
        MatButtonModule,
        MatAutocompleteModule,
        MatCardModule,
      ],
      declarations: [AllStudentsComponent],
      providers: [
        { provide: TeacherService, useValue: teacherServiceMock },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AllStudentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form controls', () => {
    expect(component.yearControl).toBeTruthy();
    expect(component.setControl).toBeTruthy();
  });

  it('should load students on init', () => {
    component.loadStudents();

    expect(teacherServiceMock.getStudents).toHaveBeenCalled();
    expect(component.allStudents.length).toBe(1);
    expect(component.totalStudents).toBe(100);
  });

  it('should load filter options on init', () => {
    component.loadFilters();

    expect(teacherServiceMock.getStudentsFilters).toHaveBeenCalled();
    expect(component.uniqueYears.length).toBeGreaterThan(0);
    expect(component.uniqueSets.length).toBeGreaterThan(0);
  });

  it('should apply filters correctly', () => {
    component.filters.year = '9';
    component.filters.set = 'A';
    component.filters.search = 'John';
    component.applyFilters();

    expect(teacherServiceMock.getStudents).toHaveBeenCalledWith({
      page: 1,
      page_size: 24,
      year: '9',
      set: 'A',
      search: 'John'
    });
  });

  it('should load more students when needed', () => {
    component.currentPage = 1;
    component.totalStudents = 50;
    component.loadMoreStudents();

    expect(component.currentPage).toBe(2);
    expect(teacherServiceMock.getStudents).toHaveBeenCalledWith({
      page: 2,
      page_size: 25
    });
  });

  it('should navigate to student details when clicked', () => {
    const navigateSpy = spyOn(component['router'], 'navigate');
    component.navigateToStudent('1');
    expect(navigateSpy).toHaveBeenCalledWith(['/students/1']);
  });

  it('should navigate to add student page', () => {
    const navigateSpy = spyOn(component['router'], 'navigate');
    component.navigateToAddStudent();
    expect(navigateSpy).toHaveBeenCalledWith(['/students/add-student']);
  });
});
