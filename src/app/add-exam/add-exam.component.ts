import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PopupNotificationService } from '../../services/popup-notification.service';
import { TeacherService } from '../../services/teacher.service';
import { FormControl } from '@angular/forms';

interface ExamResult {
  student_id: string;
  name: string;
  mark: number | null;
  score: number | null;
  grade: string | null;
}

@Component({
  selector: 'app-add-exam',
  standalone: false,
  templateUrl: './add-exam.component.html',
  styleUrls: ['./add-exam.component.css']
})
export class AddExamComponent {
  classId!: string;
  classDetails: any = null;
  allStudents: any[] = [];
  exam: any = {
    title: '',
    year: '',
    subject: '',
    due_date: '',
    total_marks: null,
    "A*_grade": 90,
    "A_grade": 80,
    "B_grade": 70,
    "C_grade": 60,
    "F_grade": 0,
    results: []
  };
  isEditingScores = false;
  errors: string[] = [];

  filters = {
    year: '',
    set: '',
    search: ''
  };

  subjectControl = new FormControl('');
  subjects = [
    'Art', 'Biology', 'Chemistry', 'Computer Science', 'English',
    'Geography', 'History', 'Maths', 'Music', 'Physics'
  ];
  yearControl = new FormControl('');
  years = ['8', '9', '10', '11', '12'];

  constructor(
    private route: ActivatedRoute,
    private teacherService: TeacherService,
    private router: Router,
    private popupService: PopupNotificationService
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['year']) {
        this.yearControl.setValue(params['year']);
        this.filters.year = params['year'];
        this.fetchStudents();
      }
      if (params['subject']) {
        this.subjectControl.setValue(params['subject']);
      }
    });

    // Year drop-down changes
    this.yearControl.valueChanges.subscribe(year => {
      if (year) {
        this.filters.year = year;
        this.fetchStudents();
      }
    });
  }

  fetchStudents(): void {
    const params: any = {};
    if (this.filters.year) {
      params.year = this.filters.year;
    }
    else {
      return;
    }

    this.teacherService.getStudents(params).subscribe({
      next: (response) => {
        this.allStudents = response.students || [];
        this.exam.results = this.allStudents.map(student => ({
          student_id: student._id,
          name: `${student.first_name} ${student.last_name}`,
          mark: null,
          score: null,
          grade: null
        }));
      },
      error: (error) => {
        console.error('Error fetching students:', error);
      }
    });
  }

  recalculateAllScores(): void {
    if (!this.exam.total_marks) {
      this.exam.results.forEach((student: ExamResult) => {
        student.score = null;
        student.grade = null;
      });
      return;
    }
    this.exam.results.forEach((student: ExamResult) => {
      this.recalculateGradeAndScore(student);
    });
  }

  recalculateGradeAndScore(student: ExamResult): void {
    if (student.mark != null && this.exam.total_marks) {
      // Validate mark
      if (student.mark < 0 || student.mark > this.exam.total_marks!) {
        this.popupService.showError(`Invalid mark for ${student.name}. The mark must be between 0 and ${this.exam.total_marks}`);
        student.score = null;
        student.grade = null;
        return;
      }
  
      student.score = (student.mark / this.exam.total_marks!) * 100;
      student.grade = this.calculateGrade(student.score);
    } else {
      student.score = null;
      student.grade = null;
    }
  }
  
  calculateGrade(score: number): string {
    if (score >= this.exam["A*_grade"]) return "A*";
    if (score >= this.exam.A_grade) return "A";
    if (score >= this.exam.B_grade) return "B";  
    if (score >= this.exam.C_grade) return "C";
    return "F"; 
  }

  getTargetGrade(student_id: string): string {
    const student = this.allStudents.find(s => s._id === student_id);
    return student?.target_grade || 'N/A';
  }

  // Validate title
  validateTitle() {
    if (!this.exam.title) {
      this.errors.push('Title is required');
    }
  }

  // Validate due date
  validateDueDate() {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(this.exam.due_date)) {
      this.errors.push('Invalid due date format (YYYY-MM-DD)');
    }
  }

  // Validate total marks
  validateTotalMarks() {
    if (!this.exam.total_marks || this.exam.total_marks <= 0) {
      this.errors.push('Total marks must be a positive number');
    }
  }

  // Validate student marks
  validateStudentMarks() {
    for (const student of this.exam.results) {
      if (student.mark != null) {
        if (student.mark < 0 || student.mark > this.exam.total_marks!) {
          this.errors.push(`Invalid mark for ${student.name}. The mark must be between 0 and ${this.exam.total_marks}`);
        }
      }
    }
  }

  // Validate all fields
  validateFields() {
    this.errors = [];  
    this.validateTitle();
    this.validateDueDate();
    this.validateTotalMarks();
    this.validateStudentMarks();
  }

  save(): void {
    this.validateFields();  

    // Show errors
    if (this.errors.length > 0) {
      this.popupService.showError(this.errors.join(" - "));
      return;
    }

    // Save exam
    const examData = {
      title: this.exam.title,
      year: this.yearControl.value,
      subject: this.subjectControl.value,
      due_date: this.exam.due_date,
      total_marks: this.exam.total_marks,
      "A*_grade": this.exam["A*_grade"],
      "A_grade": this.exam.A_grade,
      "B_grade": this.exam.B_grade,
      "C_grade": this.exam.C_grade,
      "F_grade": this.exam.F_grade,
      results: this.exam.results
    };

    this.teacherService.addExam(examData).subscribe({
      next: (response) => {
        this.popupService.showSuccess("Exam added successfully");
      },
      error: (err) => {
        console.error("Error saving exam:", err);
        this.popupService.showError("Failed to add exam");
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

  navigateToClass(classId: string): void {
    this.router.navigate([`/classes/${classId}`]);
  }
}
