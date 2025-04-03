import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TeacherService } from '../../services/teacher.service';

@Component({
  selector: 'app-class-assignments',
  templateUrl: './class-assignments.component.html',
  styleUrls: ['./class-assignments.component.css'],
  standalone: false,
})

export class ClassAssignmentsComponent implements OnInit {
  classId!: string; // The definite assignment assertion
  classDetails: any = null;
  allAssignments: any[] = [];
  filteredAssignments: any[] = [];


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
    this.fetchAssignments(this.classId);
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

  fetchAssignments(classId: string): void {
    this.teacherService.getAssignmentsByClassId(classId).subscribe({
      next: (data: { assignments: any[] }) => {
        this.allAssignments = data.assignments.sort((a, b) =>
          new Date(b.due_date).getTime() - new Date(a.due_date).getTime()
        );
        this.filteredAssignments = [...this.allAssignments];
        console.log("Sorted Assignments: ", this.allAssignments);
      },
      error: (err: any) => {
        console.error('Error fetching assignments:', err);
      }
    });
  }


  filterAssignments(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase().trim();

    if (!searchTerm) {
      this.filteredAssignments = this.allAssignments;
      return;
    }

    this.filteredAssignments = this.allAssignments.filter(assignment =>
      assignment.title.toLowerCase().includes(searchTerm)
    );
  }

  isPastDue(dueDate: string): boolean {
    const today = new Date();
    const assignmentDueDate = new Date(dueDate);
    return assignmentDueDate < today;
  }

  getHandedInCount(assignment: any): number {
    if (!assignment?.results) return 0;
    return assignment.results.filter((result: any) => result.grade !== "Not Submitted").length;
  }

  getAwaitingCount(assignment: any): number {
    const totalStudents = this.classDetails?.students?.length || 0;
    const handedIn = this.getHandedInCount(assignment);
    return totalStudents - handedIn;
  }


  navigateToClass(classId: string): void {
    this.router.navigate([`/classes/${classId}`]);
  }

  navigateToAssignments(classId: string) {
    console.log(`Navigating to assignments for class: ${classId}`);
    this.router.navigate([`/classes/${classId}/assignments`]);
  }

  navigateToExams(classId: string) {
    console.log('Navigating to exams');
    this.router.navigate([`/classes/${classId}/exams`]);
  }

  navigateToAssignmentDetails(classId: string, assignmentId: string) {
    console.log('Navigating to assignment details');
    this.router.navigate([`/classes/${classId}/assignments/${assignmentId}`]);
  }

  navigateToAddAssignment(classId: string) {
    console.log('Navigating to add assignment');
    this.router.navigate([`/classes/${classId}/assignments/add-assignment`]);
  }

}

