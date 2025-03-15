import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClassExamDetailsComponent } from './class-exam-details.component';

describe('ClassExamDetailsComponent', () => {
  let component: ClassExamDetailsComponent;
  let fixture: ComponentFixture<ClassExamDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClassExamDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClassExamDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
