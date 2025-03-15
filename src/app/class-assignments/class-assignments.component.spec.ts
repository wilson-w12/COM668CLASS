import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClassAssignmentsComponent } from './class-assignments.component';

describe('ClassAssignmentsComponent', () => {
  let component: ClassAssignmentsComponent;
  let fixture: ComponentFixture<ClassAssignmentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClassAssignmentsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClassAssignmentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
