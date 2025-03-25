import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TeacherService } from '../../services/teacher.service';

@Component({
  selector: 'app-add-student',
  templateUrl: './add-student.component.html',
  styleUrls: ['./add-student.component.css'],
  standalone: false,
})
export class AddStudentComponent implements OnInit {
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

  constructor(private http: HttpClient, private teacherService: TeacherService) { }

  ngOnInit(): void {
    // Initialize form controls for each subject
    this.subjects.forEach((subject) => {
      this.teacherControls[subject] = new FormControl('');
      this.targetGradeControls[subject] = new FormControl('');
      this.teachersMap[subject] = [];
    });

    // Watch for changes in year and set, then auto-select teachers
    this.yearControl.valueChanges.subscribe(() => this.fetchClassesForYearSet());
    this.setControl.valueChanges.subscribe(() => this.fetchClassesForYearSet());

    this.subjects.forEach(subject => {
      this.getClassesForSubject(subject);
    });
  }

  // Fetch classes for selected year and set for each subject
  fetchClassesForYearSet(): void {
    const selectedYear = this.yearControl.value;
    const selectedSet = this.setControl.value;

    if (!selectedYear || !selectedSet) return;

    // Fetch classes for each subject based on selected year and set
    this.subjects.forEach(subject => {
      this.getClassesForSubjectYearSet(subject, selectedYear, selectedSet);
    });
  }

  // Fetch classes for a subject, year, set
  getClassesForSubjectYearSet(subject: string, year: string, set: string): void {
    this.teacherService.getClasses({ subject, year, set }).subscribe(
      (response) => {
        console.log(`Fetching classes for Subject: ${subject}, Year: ${year}, Set: ${set}`);
        console.log("Classes fetched:", response); // Log the full response

        // Find the matching teacher for the selected year and set
        const matchingTeacher = response.classes.find((classData: any) =>
          String(classData.year) === String(year) && classData.set === set
        );

        console.log("Matching teacher found:", matchingTeacher); // Log the matching teacher

        // If a matching teacher is found, set the value in the form control
        if (matchingTeacher) {
          console.log("Setting teacher value in form control");
          const class_id = matchingTeacher.class_id; // Get the class_id from the matched teacher
          console.log("Class ID:", class_id); // Log the class_id for debugging

          // Directly set the value in the teacherControls form control
          this.teacherControls[subject].setValue(class_id);

          // Optionally, you can also update the model if needed
          this.student.teachers[subject] = class_id;
        } else {
          console.log("No matching teacher found for the selected year and set");
        }
      },
      (error) => {
        console.error('Error fetching classes for subject:', subject, error);
      }
    );
  }

  // Fetch classes for a subject 
  getClassesForSubject(subject: string): void {
    this.teacherService.getClasses({ subject }).subscribe(
      (response) => {
        // Update teacher map with teacher information
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
      }
    );
  }

  // Automatically select teachers based on year and set
  autoSelectTeachers(): void {
    const selectedYear = this.yearControl.value;
    const selectedSet = this.setControl.value;

    if (!selectedYear || !selectedSet) return;

    this.subjects.forEach(subject => {
      // Find matching teacher based on selected year and set
      const matchingTeacher = this.teachersMap[subject].find(
        teacher => teacher.year === selectedYear && teacher.set === selectedSet
      );

      // Set the teacher in the corresponding form control
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
      teachers: this.student.teachers, 
      target_grades: Object.fromEntries(
        Object.entries(this.targetGradeControls).map(([subject, control]) => [subject, control.value])
      ),
    };
  
    this.teacherService.addStudent(studentData).subscribe(
      (response) => {
        console.log('Student added successfully:', response);
        alert('Student added successfully!');
      },
      (error) => {
        console.error('Error adding student:', error);
        alert('Failed to add student.');
      }
    );
  }  
}
