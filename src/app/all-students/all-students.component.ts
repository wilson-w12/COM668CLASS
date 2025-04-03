import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TeacherService } from '../../services/teacher.service';
import { FormControl } from '@angular/forms';
import { startWith, map, Observable } from 'rxjs';

@Component({
  selector: 'app-all-students',
  templateUrl: './all-students.component.html',
  styleUrls: ['./all-students.component.css'],
  standalone: false,
})
export class AllStudentsComponent implements OnInit {
  allStudents: any[] = [];
  uniqueYears: number[] = [];
  uniqueSets: string[] = [];
  totalStudents = 0;
  currentPage = 1;
  pageSize = 24;

  filters = {
    year: '',
    set: '',
    search: ''
  };

  // Declare the form controls
  yearControl = new FormControl();
  setControl = new FormControl();

  // Initialize filtered options
  filteredYears!: Observable<number[]>;
  filteredSets!: Observable<string[]>;


  constructor(
    private teacherService: TeacherService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadStudents();
    this.loadFilters();
  }

  /**
   * Fetch students based on filters and pagination.
   */
  loadStudents(): void {
    const searchTerms = this.filters.search.trim().toLowerCase().split(/\s+/);
    this.pageSize = this.currentPage === 1 ? 24 : 25;
    const params: any = {
      page: this.currentPage,
      page_size: this.pageSize
    };

    if (this.filters.year) {
      params.year = this.filters.year;
    }
    if (this.filters.set) {
      params.set = this.filters.set;
    }
    if (this.filters.search) {
      params['search'] = this.filters.search; // Pass search query directly
    }

    this.teacherService.getStudents(params).subscribe({
      next: (response) => {
        if (this.currentPage === 1) {
          this.allStudents = response.students; // Reset for new search
        } else {
          this.allStudents = [...this.allStudents, ...response.students]; // Append for pagination
        }
        this.totalStudents = response.total_students;
      },
      error: (error) => {
        console.error('Error fetching students:', error);
      }
    });
  }

  /**
   * Fetch unique years and sets for filter dropdowns.
   */
  loadFilters(): void {
    this.teacherService.getStudentsFilters().subscribe({
      next: (response) => {
        this.uniqueYears = response.years || [];
        this.uniqueSets = response.sets || [];

        this.filteredYears = this.yearControl.valueChanges.pipe(
          startWith(''),
          map(value => {
            this.filters.year = value;
            this.applyFilters();  // Apply filters when year changes
            return this.filterYears(this.uniqueYears.map(String), value || '').map(Number);
          })
        );

        this.filteredSets = this.setControl.valueChanges.pipe(
          startWith(''),
          map(value => {
            this.filters.set = value;
            this.applyFilters();  // Apply filters when set changes
            return this.filterOptions(this.uniqueSets, value || '');
          })
        );
      },
      error: (error) => {
        console.error('Error fetching filters:', error);
      }
    });
  }

  filterOptions(options: string[], value: string): string[] {
    const filterValue = value.toLowerCase();
    return options.filter(option => option.toLowerCase().includes(filterValue));
  }

  filterYears(options: string[], value: string): string[] {
    return options.filter(option => option.includes(value));
  }

  loadMoreStudents(): void {
    if (this.hasMoreStudents()) {
      this.currentPage++;
      this.loadStudents();
    }
  }

  hasMoreStudents(): boolean {
    return this.allStudents.length < this.totalStudents;
  }

  applyFilters(): void {
    this.currentPage = 1; 
    this.loadStudents();
  }

  navigateToStudent(studentId: string): void {
    this.router.navigate([`/students/${studentId}`]);
  }

  navigateToAddStudent(): void {
    this.router.navigate([`/students/add-student`]);
  }
}
