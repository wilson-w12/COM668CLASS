import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { AddTeacherComponent } from './add-teacher.component';
import { TeacherService } from '../../services/teacher.service';
import { PopupNotificationService } from '../../services/popup-notification.service';
import { of } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input'; // For mat-input
import { MatSelectModule } from '@angular/material/select'; // For mat-select
import { MatButtonModule } from '@angular/material/button'; // If needed
import { MatIconModule } from '@angular/material/icon';

describe('AddTeacherComponent', () => {
  let component: AddTeacherComponent;
  let fixture: ComponentFixture<AddTeacherComponent>;
  let teacherServiceMock: jasmine.SpyObj<TeacherService>;
  let popupServiceMock: jasmine.SpyObj<PopupNotificationService>;

  beforeEach(async () => {
    // Mock services
    teacherServiceMock = jasmine.createSpyObj('TeacherService', ['addTeacher']);
    popupServiceMock = jasmine.createSpyObj('PopupNotificationService', ['showError', 'showSuccess']);

    // Mock addTeacher 
    teacherServiceMock.addTeacher.and.returnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule, 
        MatFormFieldModule, 
        MatIconModule,
        MatInputModule, 
        MatSelectModule,  
        MatButtonModule    
      ],
      declarations: [AddTeacherComponent],
      providers: [
        FormBuilder,
        { provide: TeacherService, useValue: teacherServiceMock },
        { provide: PopupNotificationService, useValue: popupServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddTeacherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form with the correct controls', () => {
    expect(component.teacherForm.contains('firstName')).toBe(true);
    expect(component.teacherForm.contains('lastName')).toBe(true);
    expect(component.teacherForm.contains('email')).toBe(true);
    expect(component.teacherForm.contains('password')).toBe(true);
    expect(component.teacherForm.contains('confirmPassword')).toBe(true);
    expect(component.teacherForm.contains('gender')).toBe(true);
    expect(component.teacherForm.contains('subjects')).toBe(true);
    expect(component.teacherForm.contains('classes')).toBe(true);
    expect(component.teacherForm.contains('title')).toBe(true); 
  });

  it('should call addTeacher method of TeacherService when form is valid', () => {
    component.teacherForm.setValue({
      title: 'Mr',
      firstName: 'John',
      lastName: 'Doe',
      gender: 'Male',
      email: 'john.doe@example.com',
      phone: '1234567890',
      password: 'Password123',
      confirmPassword: 'Password123',
      subjects: 'Math',
      classes: [{ subject: 'Math', year: '9', set: 'A' }],
      subject: 'Math',
      year: '9',
      set: 'A',
    });

    component.save();

    expect(teacherServiceMock.addTeacher).toHaveBeenCalledWith(component.teacherForm.value);
    expect(popupServiceMock.showSuccess).toHaveBeenCalledWith('Teacher added successfully');
  });

  it('should show error message when form is invalid', () => {
    component.teacherForm.setValue({
      title: '',
      firstName: '',
      lastName: '',
      gender: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      subjects: '',
      classes: [{ subject: '', year: '', set: '' }], 
      subject: '',
      year: '',
      set: '',
    });
  
    component.save();
  
    expect(popupServiceMock.showError).toHaveBeenCalledWith(
      'Please fill in all required fields correctly. First name is required. Last name is required. Gender is required. A valid email is required. Phone number is required. Password is required and must be at least 8 characters long with at least one number and one letter. At least one subject is required.'
    );
  });  
});
