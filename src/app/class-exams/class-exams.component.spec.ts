import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClassExamsComponent } from './class-exams.component';

describe('ClassExamsComponent', () => {
  let component: ClassExamsComponent;
  let fixture: ComponentFixture<ClassExamsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClassExamsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClassExamsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
