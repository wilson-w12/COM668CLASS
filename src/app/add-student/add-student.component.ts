import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface TeacherClass {
  subject: string;
  year: number;
  set: string;
}

interface Teacher {
  _id: string;
  title: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  subjects: string[];
  classes: TeacherClass[];
}

interface SubjectTeacher {
  _id: string;
  name: string;
}

interface Subject {
  name: string;
  teachers: SubjectTeacher[];
}

interface Student {
  firstName: string;
  lastName: string;
  gender: string;
  year: string;
  set: string;
  teachers: { [subjectName: string]: string }; // Updated to index signature
}

@Component({
  selector: 'app-add-student',
  templateUrl: './add-student.component.html',
  standalone: false,
  styleUrl: './add-student.component.css'
})
export class AddStudentComponent implements OnInit {
  
  student: Student = {
    firstName: '',
    lastName: '',
    gender: '',
    year: '',
    set: '',
    teachers: {} // Empty object to be populated dynamically
  };

  genders = ["Male", "Female", "Other"];
  years = [8, 9, 10, 11, 12];
  sets = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

  subjects: Subject[] = [
    { name: "Art", teachers: [] },
    { name: "Biology", teachers: [] },
    { name: "Chemistry", teachers: [] },
    { name: "Computer Science", teachers: [] },
    { name: "English", teachers: [] },
    { name: "Geography", teachers: [] },
    { name: "History", teachers: [] },
    { name: "Maths", teachers: [] },
    { name: "Music", teachers: [] },
    { name: "Physics", teachers: [] }
  ];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadTeachers();
  }

  loadTeachers() {
    this.subjects.forEach(subject => {
      this.http.get<{ teachers: Teacher[] }>(`/api/teachers?subject=${subject.name}`).subscribe(
        response => {
          subject.teachers = response.teachers
            .flatMap((teacher: Teacher) => 
              teacher.classes
                .filter((c: TeacherClass) => c.subject === subject.name)
                .map((c: TeacherClass) => ({
                  _id: teacher._id,
                  name: `${teacher.title} ${teacher.first_name} ${teacher.last_name} (Year ${c.year}, Set ${c.set})`
                })))
            .sort((a, b) => a.name.localeCompare(b.name));

          // Add 'Unassigned' option
          subject.teachers.unshift({ _id: "unassigned", name: "Unassigned" });
        },
        error => {
          console.error(`Error fetching teachers for ${subject.name}:`, error);
        }
      );
    });
  }
}
