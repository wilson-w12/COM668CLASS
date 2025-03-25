import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import { TeacherService } from '../../services/teacher.service';
import { PopupNotificationService } from '../../services/popup-notification.service';  

@Component({
  selector: 'app-add-teacher',
  templateUrl: './add-teacher.component.html',
  styleUrls: ['./add-teacher.component.css'],
  standalone: false
})
export class AddTeacherComponent {
  teacherForm: FormGroup;
  genders = ['Male', 'Female', 'Other'];
  titles = ['None', 'Mr', 'Miss', 'Mrs', 'Dr', 'Other'];
  years = ['8', '9', '10', '11', '12'];
  sets = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  subjects = [
    'Art', 'Biology', 'Chemistry', 'Computer Science', 'English',
    'Geography', 'History', 'Maths', 'Music', 'Physics'
  ];

  constructor(
    private fb: FormBuilder,
    private teacherService: TeacherService,
    private popupService: PopupNotificationService  
  ) {
    this.teacherForm = this.fb.group({
      title: [''],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      gender: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      password: ['',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern('^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{8,}$')
        ]
      ],
      confirmPassword: ['', Validators.required],
      subjects: ['', Validators.required],
      classes: this.fb.array([]),
      subject: ['', Validators.required],
      year: ['', Validators.required],
      set: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.addClass(); 
  }

  get classes() {
    return (this.teacherForm.get('classes') as FormArray);
  }

  addClass(): void {
    const classGroup = this.fb.group({
      subject: ['', Validators.required],
      year: ['', Validators.required],
      set: ['', Validators.required]
    });
    this.classes.push(classGroup);
  }

  removeClass(index: number): void {
    this.classes.removeAt(index);
  }

  passwordMatchValidator(form: FormGroup): { [key: string]: boolean } | null {
    return form.get('password')?.value === form.get('confirmPassword')?.value ? null : { mismatch: true };
  }

  // Validate form
  validateTeacherForm(): boolean {
    this.teacherForm.markAllAsTouched(); 
    return this.teacherForm.valid && this.isClassesValid();
  }

  // Validate classes
  isClassesValid(): boolean {
    return this.classes.controls.every((classGroup) =>
      classGroup.get('subject')?.valid &&
      classGroup.get('year')?.valid &&
      classGroup.get('set')?.valid
    );
  }

  save() {
    if (!this.validateTeacherForm()) {
      let errorMessage = "Please fill in all required fields correctly.";
      if (!this.teacherForm.get('firstName')?.valid) errorMessage += " First name is required.";
      if (!this.teacherForm.get('lastName')?.valid) errorMessage += " Last name is required.";
      if (!this.teacherForm.get('gender')?.valid) errorMessage += " Gender is required.";
      if (!this.teacherForm.get('email')?.valid) errorMessage += " A valid email is required.";
      if (!this.teacherForm.get('phone')?.valid) errorMessage += " Phone number is required.";
      if (!this.teacherForm.get('password')?.valid) errorMessage += " Password is required and must be at least 8 characters long with at least one number and one letter.";
      if (this.teacherForm.get('password')?.value !== this.teacherForm.get('confirmPassword')?.value) errorMessage += " Passwords do not match.";
      if (!this.teacherForm.get('subjects')?.valid) errorMessage += " At least one subject is required.";
      this.popupService.showError(errorMessage);
      return;
    }

    this.teacherService.addTeacher(this.teacherForm.value).subscribe(response => {
      console.log('Teacher added successfully', response);
      this.popupService.showSuccess("Teacher added successfully");
    }, error => {
      console.error('Error adding teacher', error);
      this.popupService.showError("Failed to add teacher");
    });
  }

  // Clear value if not valid 
  clearIfNotValid(
    control: FormControl,
    validOptions: { class_id: string, name: string, year: string, set: string }[] | string[]
  ): void {
    if (validOptions.length === 0) return;

    if (typeof validOptions[0] === 'string') {
      if (!(validOptions as string[]).includes(control.value)) {
        control.setValue('');
      }
    } else {
      if (!(validOptions as { class_id: string, name: string, year: string, set: string }[]).some(
        (option: { class_id: string }) => option.class_id === control.value)) {
        control.setValue('');
      }
    }
  }
}
