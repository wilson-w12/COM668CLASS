import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { TeacherService } from '../../services/teacher.service';
import { ActivatedRoute } from '@angular/router';
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

  student = {
    firstName: '',
    lastName: '',
    gender: '',
    year: '',
    set: '',
    teachers: {} as { [key: string]: string },
  };

  genders = ['Male', 'Female', 'Other'];
  years = ['8', '9', '10', '11', '12'];
  sets = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  grades = ['A*', 'A', 'B', 'C', 'F'];

  subjects = [
    'Art', 'Biology', 'Chemistry', 'Computer Science', 'English',
    'Geography', 'History', 'Maths', 'Music', 'Physics'
  ];

  genderControl = new FormControl('');
  yearControl = new FormControl('');
  setControl = new FormControl('');
  targetGradeControls: { [subjectName: string]: FormControl<string | null> } = {};
  teacherControls: { [subjectName: string]: FormControl } = {};

  teachersMap: { [subjectName: string]: { class_id: string, name: string, year: string, set: string }[] } = {} as { [subjectName: string]: { class_id: string, name: string, year: string, set: string }[] };

  constructor(private http: HttpClient, private teacherService: TeacherService, private route: ActivatedRoute, private cdRef: ChangeDetectorRef, private popupService: PopupNotificationService
  ) { }

  ngOnInit(): void {
    this.studentId = this.route.snapshot.paramMap.get('student_id')!;
    this.fetchStudentClasses(this.studentId);

    this.subjects.forEach((subject) => {
      this.teacherControls[subject] = new FormControl('');
      this.targetGradeControls[subject] = new FormControl('');
      this.teachersMap[subject] = [];
    });

    this.subjects.forEach(subject => {
      this.getClassesForSubject(subject)
      this.teacherControls[subject].valueChanges.subscribe(selectedClassId => {
        if (selectedClassId) {
          this.student.teachers[subject] = selectedClassId;
        } else {
          delete this.student.teachers[subject]; // Remove if cleared
        }
        console.log("Updated teachers object: ", this.student.teachers);
      });
    });
  }

  fetchStudentClasses(studentId: string): void {
    this.teacherService.getStudentClasses(studentId).subscribe({
      next: (data) => {
        console.log("Student classes fetched: ", data);
  
        // Set student details
        this.studentDetails = data.student;
        this.studentClasses = data.classes;
        this.student.firstName = data.student.first_name;
        this.student.lastName = data.student.last_name;
        this.genderControl.setValue(data.student.gender);
        this.yearControl.setValue(data.student.year);
        this.setControl.setValue(data.student.set);
  
        // Set target grades
        if (data.student.target_grades) {
          Object.entries(data.student.target_grades).forEach(([subject, grade]) => {
            if (this.targetGradeControls[subject]) {
              this.targetGradeControls[subject].setValue(grade as string);
            }
          });
        }
  
        // Set teachers 
        this.student.teachers = {};
        this.studentClasses.forEach((classData: any) => {
          const subject = classData.subject;
          const classId = classData._id;
  
          if (this.teacherControls[subject]) {
            this.teacherControls[subject].setValue(classId);
            this.student.teachers[subject] = classId;
          }
        });
  
        // Trigger change detection
        this.cdRef.detectChanges(); 
  
        console.log("Updated student object: ", this.student);
      },
      error: (err) => {
        console.error('Error fetching student details:', err);
        this.popupService.showError('Unable to load student details. Please try again.');
      }
    });
  }


  // Fetch classes for a subject 
  getClassesForSubject(subject: string): void {
    this.teacherService.getClasses({ subject }).subscribe(
      (response) => {
        this.teachersMap[subject] = response.classes.map((classData: any) => ({
          class_id: classData.class_id,
          name: classData.teachers.map((teacher: any) => teacher.name).join(", "),
          year: classData.year,
          set: classData.set
        }));
        this.autoSelectTeachers();
      },
      (error) => {
        console.error('Error fetching classes for subject:', subject, error);
        this.popupService.showError('Unable to classes for subject: ' + subject);
      }
    );
  }

  // Auto select teachers using year and set
  autoSelectTeachers(): void {
    const selectedYear = this.yearControl.value;
    const selectedSet = this.setControl.value;

    if (!selectedYear || !selectedSet) return;
    this.subjects.forEach(subject => {
      // Find matching teacher 
      const matchingTeacher = this.teachersMap[subject].find(
        teacher => teacher.year === selectedYear && teacher.set === selectedSet
      );
      // Set teacher 
      if (matchingTeacher) {
        this.student.teachers[subject] = matchingTeacher.class_id;
      }
    });
  }

  // Clear drop-down value 
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

  save(): void {
    const studentData = {
      first_name: this.student.firstName,
      last_name: this.student.lastName,
      gender: this.genderControl.value,
      year: this.yearControl.value,
      set: this.setControl.value,
      target_grades: Object.fromEntries(
        Object.entries(this.targetGradeControls).map(([subject, control]) => [subject, control.value])
      ),
    };

    const studentClassesData = {
      classes: this.student.teachers
    };
    console.log(studentClassesData)
    this.teacherService.updateStudent(this.studentId, studentData).subscribe({
      next: () => {
        this.teacherService.updateStudentClasses(this.studentId, studentClassesData).subscribe({
          next: () => {
            console.log('Student and classes updated successfully');
            alert('Student details updated successfully!');
          },
          error: (err) => {
            console.error('Error updating student classes:', err);
            alert('Failed to update student classes.');
          }
        });
      },
      error: (err) => {
        console.error('Error updating student:', err);
        alert('Failed to update student details.');
      }
    });
  }
}
