import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TeacherService } from '../../services/teacher.service';
import { PopupNotificationService } from '../../services/popup-notification.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

interface AssignmentResult {
  student_id: string;
  name: string;
  mark: number | null;
  score: number | null;
  grade: string | null;
}

@Component({
  selector: 'app-add-assignment',
  templateUrl: './add-assignment.component.html',
  styleUrls: ['./add-assignment.component.css'],
  standalone: false
})
export class AddAssignmentComponent {
  classId!: string;
  classDetails: any = null;
  allStudents: any[] = [];
  assignmentForm: FormGroup;
  assignment: any = {
    title: '',
    topics: '',
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
  errors: string[] = []  // Store error messages

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private teacherService: TeacherService,
    private router: Router,
    private popupService: PopupNotificationService
  ) {
    this.assignmentForm = this.fb.group({
      title: ['', Validators.required],
      topics: ['', Validators.required],
      due_date: ['', [Validators.required, Validators.pattern('^\\d{4}-\\d{2}-\\d{2}$')]],  // YYYY-MM-DD format
      total_marks: [null, [Validators.required, Validators.min(1)]],
      A_star_grade: [90, [Validators.required, Validators.min(0), Validators.max(100)]],
      A_grade: [80, [Validators.required, Validators.min(0), Validators.max(100)]],
      B_grade: [70, [Validators.required, Validators.min(0), Validators.max(100)]],
      C_grade: [60, [Validators.required, Validators.min(0), Validators.max(100)]],
      F_grade: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    });
  }

  ngOnInit(): void {
    this.classId = this.route.snapshot.paramMap.get('class_id')!;
    this.fetchClassDetails();
  }

  fetchClassDetails(): void {
    this.teacherService.getClassById(this.classId).subscribe({
      next: (data) => {
        this.classDetails = data.class;
        this.fetchStudents();
      },
      error: (err) => console.error('Error fetching class details:', err),
    });
  }

  fetchStudents(): void {
    this.teacherService.getStudentsByClassId(this.classId).subscribe({
      next: (data) => {
        this.allStudents = data.students || [];
        this.assignment.results = this.allStudents.map(student => ({
          student_id: student._id,
          name: `${student.first_name} ${student.last_name}`,
          mark: null,
          score: null,
          grade: null
        }));
      },
      error: (err) => console.error("Error fetching student data:", err),
    });
  }

  recalculateAllScores(): void {
    if (!this.assignment.total_marks) {
      this.assignment.results.forEach((student: AssignmentResult) => {
        student.score = null;
        student.grade = null;
      });
      return;
    }

    this.assignment.results.forEach((student: AssignmentResult) => {
      this.recalculateGradeAndScore(student);
    });
  }

  recalculateGradeAndScore(student: AssignmentResult): void {
    if (student.mark != null && this.assignment.total_marks) {
      // Validate mark
      if (student.mark < 0 || student.mark > this.assignment.total_marks!) {
        this.popupService.showError(`Invalid mark for ${student.name}. The mark must be between 0 and ${this.assignment.total_marks}`);
        student.score = null;
        student.grade = null;
        return;
      }
  
      student.score = (student.mark / this.assignment.total_marks!) * 100;
      student.grade = this.calculateGrade(student.score);
    } else {
      student.score = null;
      student.grade = null;
    }
  }
  
  calculateGrade(score: number): string {
    if (score >= this.assignment["A*_grade"]) return "A*";
    if (score >= this.assignment.A_grade) return "A";
    if (score >= this.assignment.B_grade) return "B";  
    if (score >= this.assignment.C_grade) return "C";
    return "F"; 
  }
  

  getTargetGrade(student_id: string): string {
    const student = this.allStudents.find(s => s._id === student_id);
    return student?.target_grade || 'N/A';
  }

  // Validate student marks
  validateAllMarks(): boolean {
    let isValid = true;
    for (const student of this.assignment.results) {
      if (student.mark != null) {
        if (student.mark < 0 || student.mark > this.assignment.total_marks!) {
          this.errors.push(`Invalid mark for ${student.name}. The mark must be between 0 and ${this.assignment.total_marks}`);
          isValid = false;
        }
      }
    }
    return isValid;
  }

  // Validate title
  validateTitle() {
    if (!this.assignment.title) {
      this.errors.push('Title is required');
    }
  }

  // Validate due date
  validateDueDate() {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(this.assignment.due_date)) {
      this.errors.push('Invalid due date format (YYYY-MM-DD)');
    }
  }

  // Validate total marks
  validateTotalMarks() {
    if (!this.assignment.total_marks || this.assignment.total_marks <= 0) {
      this.errors.push('Total marks must be a positive number');
    }
  }

  // Validate form
  validateTeacherForm(): boolean {
    this.assignmentForm.markAllAsTouched(); 
    return this.assignmentForm.valid;
  }

  // Validate all fields
  validateForm() {
    this.validateTeacherForm();
    this.errors = [];
    this.validateTitle();
    this.validateDueDate();
    this.validateTotalMarks();
    this.validateAllMarks();
  }

  save(): void {
    this.validateForm();
    if (this.errors.length > 0) {
      this.popupService.showError(this.errors.join(" - ")); 
      return;
    }
  
    const assignmentData = {
      title: this.assignment.title,
      topics: this.assignment.topics,
      due_date: this.assignment.due_date,
      total_marks: this.assignment.total_marks,
      "A*_grade": this.assignment["A*_grade"],
      "A_grade": this.assignment.A_grade,
      "B_grade": this.assignment.B_grade,
      "C_grade": this.assignment.C_grade,
      "F_grade": this.assignment.F_grade,
      results: this.assignment.results
    };
  
    this.teacherService.addAssignment(this.classId, assignmentData).subscribe({
      next: (response) => {
        this.popupService.showSuccess("Assignment added successfully");
      },
      error: (err) => {
        console.error("Error saving assignment:", err);
        this.popupService.showError("Failed to add assignment");
      }
    });
  }  

  navigateToClass(classId: string): void {
    this.router.navigate([`/classes/${classId}`]);
  }
}
