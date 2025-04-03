import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TeacherService } from '../../services/teacher.service';

@Component({
  selector: 'app-class-exams',
  templateUrl: './class-exams.component.html',
  styleUrl: './class-exams.component.css',
  standalone: false,
})
export class ClassExamsComponent implements OnInit {
  classId!: string; // The definite assignment assertion
  classDetails: any = null;
  allExams: any[] = [];
  filteredExams: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private teacherService: TeacherService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Capture the class ID from the route
    this.classId = this.route.snapshot.paramMap.get('class_id')!;
    // Use the classId to fetch class-specific assignments if needed
    this.fetchClassDetails(this.classId);
    this.fetchExams(this.classId);
  }

  fetchClassDetails(classId: string): void {
    this.teacherService.getClassById(classId).subscribe({
      next: (data) => {
        this.classDetails = data.class;
        console.log("Fetch class details: ", this.classDetails)
      },
      error: (err) => {
        console.error('Error fetching class details:', err);
      }
    });
  }

  fetchExams(classId: string): void {
    this.teacherService.getExamsByClassId(classId).subscribe({
      next: (data: { exams: any[] }) => {
        this.allExams = data.exams.sort((a, b) =>
          new Date(b.due_date).getTime() - new Date(a.due_date).getTime()
        );
        this.filteredExams = [...this.allExams];
        console.log("Sorted Exams: ", this.allExams);
      },
      error: (err: any) => {
        console.error('Error fetching exams:', err);
      }
    });
  }


  filterExams(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase().trim();

    if (!searchTerm) {
      this.filteredExams = this.allExams;
      return;
    }

    this.filteredExams = this.allExams.filter(exam =>
      exam.title.toLowerCase().includes(searchTerm)
    );
  }

  isPastDue(dueDate: string): boolean {
    const today = new Date();
    const examDueDate = new Date(dueDate);
    return examDueDate < today;
  }

  navigateToClass(classId: string): void {
    this.router.navigate([`/classes/${classId}`]);
  }

  navigateToAssignments(classId: string) {
    this.router.navigate([`/classes/${classId}/assignments`]);
  }

  navigateToExams(classId: string) {
    this.router.navigate([`/classes/${classId}/exams`]);
  }

  navigateToExamDetails(examId: string, year: string, set: string) {
    this.router.navigate([`/exams/${examId}`], { queryParams: { year, set } });
  }

  navigateToAddExam() {
    console.log('Navigating to add-exam');
    this.router.navigate(['/exams/add-exam'], {
      queryParams: {
        year: this.classDetails.year,
        subject: this.classDetails.subject
      }
    });
  }
}
