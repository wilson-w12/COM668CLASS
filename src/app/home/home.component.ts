import { Component, OnInit } from '@angular/core';
import { TeacherService } from '../../services/teacher.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: false,
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(10%)' }),
        animate('0.5s ease', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('0.5s ease', style({ opacity: 0, transform: 'translateX(-10%)' }))
      ])
    ])
  ]
})
export class HomeComponent implements OnInit {
  totalClasses: number = 0; 
  subjectCounts: { [key: string]: number } = {}; 
  visibleSubjects: { key: string; value: number }[] = []; 
  currentPage: number = 0; 
  ITEMSPERPAGE: number = 3; 
  animationState = 'in';

  assignmentsDueToday: any[] = [];
  examsDueToday: any[] = []; 

  isNextDisabled: boolean = false; 
  isPreviousDisabled: boolean = false; 

  constructor(private teacherService: TeacherService) { } 

  ngOnInit(): void {
    this.fetchCurrentTeacherClasses();
    this.fetchAssignmentsExamsDueToday();
  }

  // Get current teacher's classes
  fetchCurrentTeacherClasses(): void {
    this.teacherService.getCurrentTeacherClasses().subscribe({
      next: (response) => {
        const classes = response.classes;

        // Calculate total classes
        this.totalClasses = classes.length;

        // Group classes by subject
        this.subjectCounts = this.groupClassesBySubject(classes);

        // Update visible subjects
        this.updateVisibleSubjects();
      },
      error: (error) => {
        console.error('Error fetching teacher classes:', error);
      }
    });
  }

  // Group classes by subject
  groupClassesBySubject(classes: any[]): { [subject: string]: number } {
    return classes.reduce((counts, currentClass) => {
      const subject = currentClass.subject;
      counts[subject] = (counts[subject] || 0) + 1;
      return counts;
    }, {});
  }

  // Get assignments and exams due today
  fetchAssignmentsExamsDueToday(): void {
    this.teacherService.getAssignmentsExamsDueToday().subscribe({
      next: (response) => {
        this.assignmentsDueToday = response.assignments_due_today;
        this.examsDueToday = response.exams_due_today;
        console.log('Assignments due today:', this.assignmentsDueToday);
        console.log('Exams due today:', this.examsDueToday);
      },
      error: (error) => {
        console.error('Error fetching assignments and exams due today:', error);
      }
    });
  }

  // Update visible subjects based on current page
  updateVisibleSubjects(): void {
    const subjectArray = Object.entries(this.subjectCounts).map(([key, value]) => ({
      key,
      value
    }));
    const startIndex = this.currentPage * this.ITEMSPERPAGE;
    const endIndex = startIndex + this.ITEMSPERPAGE;
    this.visibleSubjects = subjectArray.slice(startIndex, endIndex);

    // Update arrow states
    const maxPages = Math.ceil(Object.keys(this.subjectCounts).length / this.ITEMSPERPAGE);
    this.isNextDisabled = this.currentPage >= maxPages - 1;
    this.isPreviousDisabled = this.currentPage <= 0;

  }

  // Next button click
  nextPage(): void {
    const maxPages = Math.ceil(Object.keys(this.subjectCounts).length / this.ITEMSPERPAGE);
    if (this.currentPage < maxPages - 1) {
      this.currentPage++;
      this.updateVisibleSubjects();
    }
  }

  // Previous button click
  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.updateVisibleSubjects();
    }
  }
}
