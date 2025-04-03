import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClassAssignmentsComponent } from './class-assignments.component';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TeacherService } from '../../services/teacher.service';

describe('ClassAssignmentsComponent', () => {
  let component: ClassAssignmentsComponent;
  let fixture: ComponentFixture<ClassAssignmentsComponent>;
  let teacherServiceSpy: jasmine.SpyObj<TeacherService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockActivatedRoute = {
    snapshot: {
      paramMap: {
        get: (key: string) => 'mockClassId'
      }
    }
  };

  beforeEach(async () => {
    teacherServiceSpy = jasmine.createSpyObj('TeacherService', ['getClassById', 'getAssignmentsByClassId']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [ClassAssignmentsComponent],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: TeacherService, useValue: teacherServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ClassAssignmentsComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch class details on init', () => {
    const mockClass = { students: ['s1', 's2', 's3'] };
  
    teacherServiceSpy.getClassById.and.returnValue(of({ class: mockClass }));
    teacherServiceSpy.getAssignmentsByClassId.and.returnValue(of({ assignments: [] })); 
    component.ngOnInit();
  
    expect(component.classId).toBe('mockClassId');
    expect(teacherServiceSpy.getClassById).toHaveBeenCalledWith('mockClassId');
  });
  

  it('should fetch and sort assignments on init', () => {
    const mockClass = { students: ['s1', 's2', 's3'] };
    const assignments = [
      { title: 'A1', due_date: '2025-04-02T12:00:00Z' },
      { title: 'A2', due_date: '2025-04-03T12:00:00Z' }
    ];
  
    teacherServiceSpy.getClassById.and.returnValue(of({ class: mockClass }));
    teacherServiceSpy.getAssignmentsByClassId.and.returnValue(of({ assignments }));
  
    component.ngOnInit();
  
    expect(component.allAssignments.length).toBe(2);
    expect(component.filteredAssignments[0].title).toBe('A2'); 
    expect(teacherServiceSpy.getClassById).toHaveBeenCalledWith('mockClassId');
    expect(teacherServiceSpy.getAssignmentsByClassId).toHaveBeenCalledWith('mockClassId');
  });  

  it('should handle fetch class details error', () => {
    spyOn(console, 'error');
    teacherServiceSpy.getClassById.and.returnValue(throwError(() => new Error('Class fetch error')));

    component.fetchClassDetails('mockClassId');

    expect(console.error).toHaveBeenCalled();
  });

  it('should filter assignments based on input', () => {
    component.allAssignments = [
      { title: 'Math Homework' },
      { title: 'Science Quiz' }
    ];

    const inputEvent = {
      target: { value: 'math' }
    } as unknown as Event;

    component.filterAssignments(inputEvent);

    expect(component.filteredAssignments.length).toBe(1);
    expect(component.filteredAssignments[0].title).toBe('Math Homework');
  });

  it('should return true if assignment is past due', () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString(); // yesterday
    expect(component.isPastDue(pastDate)).toBeTrue();
  });

  it('should return false if assignment is not past due', () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString(); // tomorrow
    expect(component.isPastDue(futureDate)).toBeFalse();
  });

  it('should return correct handed in count', () => {
    const assignment = {
      results: [
        { grade: 'A' },
        { grade: 'Not Submitted' },
        { grade: 'B' }
      ]
    };
    expect(component.getHandedInCount(assignment)).toBe(2);
  });

  it('should return 0 handed in count if no results', () => {
    expect(component.getHandedInCount({})).toBe(0);
  });

  it('should return correct awaiting count', () => {
    component.classDetails = { students: [1, 2, 3, 4] };
    const assignment = {
      results: [
        { grade: 'A' },
        { grade: 'Not Submitted' },
        { grade: 'B' }
      ]
    };
    expect(component.getAwaitingCount(assignment)).toBe(2);
  });

  it('should navigate to class', () => {
    component.navigateToClass('123');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/classes/123']);
  });

  it('should navigate to assignments', () => {
    component.navigateToAssignments('456');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/classes/456/assignments']);
  });

  it('should navigate to exams', () => {
    component.navigateToExams('789');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/classes/789/exams']);
  });

  it('should navigate to assignment details', () => {
    component.navigateToAssignmentDetails('1', '2');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/classes/1/assignments/2']);
  });

  it('should navigate to add assignment', () => {
    component.navigateToAddAssignment('999');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/classes/999/assignments/add-assignment']);
  });
});
