import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClassAssignmentDetailsComponent } from './class-assignment-details.component';

describe('ClassAssignmentDetailsComponent', () => {
  let component: ClassAssignmentDetailsComponent;
  let fixture: ComponentFixture<ClassAssignmentDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClassAssignmentDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClassAssignmentDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
