import { Component, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TeacherService } from '../../services/teacher.service';
import { PopupNotificationService } from '../../services/popup-notification.service';

@Component({
  selector: 'app-edit-student',
  templateUrl: './edit-student.component.html',
  styleUrl: './edit-student.component.css',
  standalone: false
})
export class EditStudentComponent {
  studentId!: string;
  studentDetails: any = null;
  studentClasses: any = null;

  studentForm: FormGroup;
  teacherControls: { [subject: string]: FormControl } = {};
  targetGradeControls: { [subject: string]: FormControl } = {};

  genders = ['Male', 'Female', 'Other'];
  years = ['8', '9', '10', '11', '12'];
  sets = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  grades = ['A*', 'A', 'B', 'C', 'F'];
  subjects = [
    'Art', 'Biology', 'Chemistry', 'Computer Science', 'English',
    'Geography', 'History', 'Maths', 'Music', 'Physics'
  ];

  teachersMap: { [subject: string]: { class_id: string, name: string, year: string, set: string }[] } = {};

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private teacherService: TeacherService,
    private route: ActivatedRoute,
    private cdRef: ChangeDetectorRef,
    private popupService: PopupNotificationService
  ) {
    this.studentForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      gender: ['', Validators.required],
      year: ['', Validators.required],
      set: ['', Validators.required]
    });

    this.subjects.forEach(subject => {
      this.teacherControls[subject] = new FormControl('', Validators.required);
      this.targetGradeControls[subject] = new FormControl('', Validators.required);
      this.teachersMap[subject] = [];

      // Update student class object on change
      this.teacherControls[subject].valueChanges.subscribe(selectedClassId => {
        if (selectedClassId) {
          this.studentForm.get(subject)?.setValue(selectedClassId);
        }
      });
    });
  }

  ngOnInit(): void {
    this.studentId = this.route.snapshot.paramMap.get('student_id')!;
    this.fetchStudentClasses(this.studentId);
    this.subjects.forEach(subject => this.getClassesForSubject(subject));
  }

  fetchStudentClasses(studentId: string): void {
    this.teacherService.getStudentClasses(studentId).subscribe({
      next: (data) => {
        this.studentDetails = data.student;
        this.studentClasses = data.classes;

        this.studentForm.patchValue({
          firstName: data.student.first_name,
          lastName: data.student.last_name,
          gender: data.student.gender,
          year: data.student.year,
          set: data.student.set
        });

        if (data.student.target_grades) {
          Object.entries(data.student.target_grades).forEach(([subject, grade]) => {
            if (this.targetGradeControls[subject]) {
              this.targetGradeControls[subject].setValue(grade as string);
            }
          });
        }

        this.studentClasses.forEach((classData: any) => {
          const subject = classData.subject;
          const classId = classData._id;
          if (this.teacherControls[subject]) {
            this.teacherControls[subject].setValue(classId);
          }
        });

        this.cdRef.detectChanges();
      },
      error: () => {
        this.popupService.showError('Unable to load student details. Please try again.');
      }
    });
  }

  getClassesForSubject(subject: string): void {
    this.teacherService.getClasses({ subject }).subscribe(
      (response) => {
        this.teachersMap[subject] = response.classes.map((classData: any) => ({
          class_id: classData.class_id,
          name: classData.teachers.map((t: any) => t.name).join(", "),
          year: classData.year,
          set: classData.set
        }));
        this.autoSelectTeachers();
      },
      () => {
        this.popupService.showError('Unable to load classes for subject: ' + subject);
      }
    );
  }

  autoSelectTeachers(): void {
    const selectedYear = this.studentForm.get('year')?.value;
    const selectedSet = this.studentForm.get('set')?.value;

    if (!selectedYear || !selectedSet) return;

    this.subjects.forEach(subject => {
      const matchingClass = this.teachersMap[subject].find(
        teacher => teacher.year === selectedYear && teacher.set === selectedSet
      );
      if (matchingClass) {
        this.teacherControls[subject].setValue(matchingClass.class_id);
      }
    });
  }

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
      if (!(validOptions as { class_id: string }[]).some(option => option.class_id === control.value)) {
        control.setValue('');
      }
    }
  }

  validateForm(): boolean {
    this.studentForm.markAllAsTouched();
    const gradesValid = Object.values(this.targetGradeControls).every(control => control.valid);
    const teachersValid = Object.values(this.teacherControls).every(control => control.valid);
    return this.studentForm.valid && gradesValid && teachersValid;
  }

  save(): void {
    if (!this.validateForm()) {
      this.popupService.showError("Please fill in all required fields correctly.");
      return;
    }

    const studentData = {
      first_name: this.studentForm.get('firstName')?.value,
      last_name: this.studentForm.get('lastName')?.value,
      gender: this.studentForm.get('gender')?.value,
      year: this.studentForm.get('year')?.value,
      set: this.studentForm.get('set')?.value,
      target_grades: Object.fromEntries(
        Object.entries(this.targetGradeControls).map(([subject, control]) => [subject, control.value])
      ),
    };

    const studentClassesData = {
      classes: Object.fromEntries(
        Object.entries(this.teacherControls).map(([subject, control]) => [subject, control.value])
      )
    };

    this.teacherService.updateStudent(this.studentId, studentData).subscribe({
      next: () => {
        this.teacherService.updateStudentClasses(this.studentId, studentClassesData).subscribe({
          next: () => {
            this.popupService.showSuccess('Student details updated successfully!');
          },
          error: () => {
            this.popupService.showError('Failed to update student classes.');
          }
        });
      },
      error: () => {
        this.popupService.showError('Failed to update student details.');
      }
    });
  }
}
