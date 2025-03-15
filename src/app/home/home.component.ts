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
  totalClasses: number = 0; // To store the total number of classes
  subjectCounts: { [key: string]: number } = {}; // To store the classes per subject
  visibleSubjects: { key: string; value: number }[] = []; // Currently visible containers
  currentPage: number = 0; // Tracks the current page
  ITEMSPERPAGE: number = 3; // Number of items per page (adjust based on screen width)
  animationState = 'in';

  assignmentsDueToday: any[] = []; // To store assignments due today
  examsDueToday: any[] = []; // To store exams due today

  // Update the class properties
  isNextDisabled: boolean = false; // Tracks if the Next button is disabled
  isPreviousDisabled: boolean = false; // Tracks if the Previous button is disabled

  constructor(private teacherService: TeacherService) { } // Inject TeacherService

  ngOnInit(): void {
    this.fetchCurrentTeacherClasses();
    this.fetchAssignmentsExamsDueToday();
  }


  // Fetch current teacher's classes
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


  // Fetch assignments and exams due today
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


  // Update the visible subjects based on the current page
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

  // Handle the "Next" button click
  nextPage(): void {
    const maxPages = Math.ceil(Object.keys(this.subjectCounts).length / this.ITEMSPERPAGE);
    if (this.currentPage < maxPages - 1) {
      this.currentPage++;
      this.updateVisibleSubjects();
    }
  }

  // Handle the "Previous" button click
  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.updateVisibleSubjects();
    }
  }
}
