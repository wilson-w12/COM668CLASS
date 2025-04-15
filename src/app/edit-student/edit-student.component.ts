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
  studentForm: FormGroup;

  subjects = [
    'Art', 'Biology', 'Chemistry', 'Computer Science', 'English',
    'Geography', 'History', 'Maths', 'Music', 'Physics'
  ];
  genders = ['Male', 'Female', 'Other'];
  years = ['8', '9', '10', '11', '12'];
  sets = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  grades = ['A*', 'A', 'B', 'C', 'F'];

  targetGradeControls: { [subject: string]: FormControl<string | null> } = {};
  teacherControls: { [subject: string]: FormControl } = {};
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
      set: ['', Validators.required],
    });

    this.subjects.forEach(subject => {
      this.targetGradeControls[subject] = new FormControl('', Validators.required);
      this.teacherControls[subject] = new FormControl('', Validators.required);
      this.teachersMap[subject] = [];

      this.teacherControls[subject].valueChanges.subscribe(selectedClassId => {
        if (selectedClassId) {
          this.studentForm.patchValue({ [subject]: selectedClassId });
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

        this.studentForm.patchValue({
          firstName: data.student.first_name,
          lastName: data.student.last_name,
          gender: data.student.gender,
          year: data.student.year,
          set: data.student.set
        });

        // Populate target grades
        if (data.student.target_grades) {
          Object.entries(data.student.target_grades).forEach(([subject, grade]) => {
            if (this.targetGradeControls[subject]) {
              this.targetGradeControls[subject].setValue(grade as string);
            }
          });
        }

        // Populate teachers
        data.classes.forEach((classData: any) => {
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
      },
      () => {
        this.popupService.showError('Unable to load classes for subject: ' + subject);
      }
    );
  }

  validateStudentForm(): boolean {
    this.studentForm.markAllAsTouched();
    const gradesValid = Object.values(this.targetGradeControls).every(c => c.valid);
    const teachersValid = Object.values(this.teacherControls).every(c => c.valid);
    return this.studentForm.valid && gradesValid && teachersValid;
  }

  save(): void {
    if (!this.validateStudentForm()) {
      this.popupService.showError('Please fill in all required fields correctly.');
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
