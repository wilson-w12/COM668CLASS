import { Component, OnInit } from '@angular/core';
import { TeacherService } from '../../services/teacher.service';
import { Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { PopupNotificationService } from '../../services/popup-notification.service';

interface Teacher {
  id: string;
  name: string;
}

interface ClassItem {
  class_id: string;
  subject: string;
  year: number;
  set: string;
  teachers: Teacher[];
  selectedTeacherIds?: string[];
}


@Component({
  selector: 'app-classes',
  templateUrl: './classes.component.html',
  styleUrls: ['./classes.component.css'],
  standalone: false,
})
export class ClassesComponent implements OnInit {
  currentTeacherClasses: any[] = [];
  allClasses: any[] = [];
  uniqueTeachers: { id: string, name: string }[] = [];
  uniqueSubjects: string[] = [];
  uniqueYears: number[] = [];
  uniqueSets: string[] = [];
  filters = {
    teacher: '',
    subject: '',
    year: '',
    set: '',
    search: '',
  };
  totalClasses = 0;
  currentPage = 1;
  pageSize = 25;
  myClassesView = true;
  isEditing = false

  teacherCardControl = new FormControl();
  teacherControl = new FormControl();
  subjectControl = new FormControl();
  yearControl = new FormControl();
  setControl = new FormControl();

  filteredTeachers!: Observable<{ id: string, name: string }[]>;
  filteredSubjects!: Observable<string[]>;
  filteredYears!: Observable<number[]>;
  filteredSets!: Observable<string[]>;

  constructor(private teacherService: TeacherService, private router: Router, private popupService: PopupNotificationService,
) { }

  ngOnInit(): void {
    this.loadClasses();
    this.loadFilters();
  }

  loadClasses(): void {
    const searchTerms = this.filters.search.trim().toLowerCase().split(/\s+/);
    const params: any = {
      page: this.currentPage,
      page_size: this.pageSize,
      my_classes: this.myClassesView.toString(),
    };

    if (this.filters.teacher) {
      params.teacher = this.filters.teacher;
    }
    if (this.filters.subject) {
      params.subject = this.filters.subject;
    }
    if (this.filters.year) {
      params.year = this.filters.year;
    }
    if (this.filters.set) {
      params.set = this.filters.set;
    }
    // Search_terms
    if (this.filters.search) {
      params['search_terms[]'] = searchTerms;
    }

    this.teacherService.getClasses(params).subscribe({
      next: (response) => {
        const classes = response.classes;
        if (this.myClassesView) {
          this.currentTeacherClasses = this.currentPage === 1
            ? classes
            : [...this.currentTeacherClasses, ...classes];
        } else {
          this.allClasses = this.currentPage === 1
            ? classes
            : [...this.allClasses, ...classes];
        }
        this.totalClasses = response.total_classes;
      },
      error: (error) => {
        console.error('Error fetching classes:', error);
        this.popupService.showError('Unable to load classes. Please try again.');
      },
    });
  }

  loadFilters(): void {
    this.teacherService.getClassFilters().subscribe({
      next: (response) => {
        this.uniqueTeachers = response.teachers || [];
        this.uniqueSubjects = response.subjects || [];
        this.uniqueYears = response.years || [];
        this.uniqueSets = response.sets || [];

        this.filteredTeachers = this.teacherControl.valueChanges.pipe(
          startWith(''),
          map(value => {
            // Find selected teacher's ID
            const selectedTeacher = this.uniqueTeachers.find(teacher => teacher.name === value);
            this.filters.teacher = selectedTeacher ? selectedTeacher.id : ''; // Store ID
            this.applyFilters();
            return this.filterTeachers(value || '');
          })
        );

        this.filteredSubjects = this.subjectControl.valueChanges.pipe(
          startWith(''),
          map(value => {
            this.filters.subject = value;
            this.applyFilters();  // Apply filters when subject changes
            return this.filterOptions(this.uniqueSubjects, value || '');
          })
        );

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
      },
    });
  }

  saveClasses(): void {
    const changedClasses: { class_id: string; selectedTeacherIds: string[] }[] = [];
    const classesToCheck = this.myClassesView ? this.currentTeacherClasses : this.allClasses;
    //  Check if selected teachers have changed
    classesToCheck.forEach((classItem: ClassItem) => {
      // Compare selected teacher IDs with original teacher IDs
      const originalTeacherIds = classItem.teachers.map((t: Teacher) => t.id);
      if (classItem.selectedTeacherIds && !this.areArraysEqual(originalTeacherIds, classItem.selectedTeacherIds)) {
        // If different add class to changed classes list
        changedClasses.push({
          class_id: classItem.class_id,
          selectedTeacherIds: classItem.selectedTeacherIds
        });
      }
    });
  
    // Send changed classes to backend
    if (changedClasses.length > 0) {
      this.teacherService.updateTeacherClasses(changedClasses).subscribe({
        next: (response) => {
          this.loadClasses();
          this.isEditing = false; 
        },
        error: (error) => {
          console.error('Error updating teachers:', error);
        }
      });
    } else {
    }
  }
  
  // Detect changes in teacher assignments
  areArraysEqual(arr1: any[], arr2: any[]): boolean {
    if (arr1.length !== arr2.length) {
      return false;
    }
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) {
        return false;
      }
    }
    return true;
  }
  

  filterTeachers(value: string): { id: string; name: string }[] {
    const filterValue = value.toLowerCase();
    return this.uniqueTeachers.filter(teacher => teacher.name.toLowerCase().includes(filterValue));
  }

  filterOptions(options: string[], value: string): string[] {
    const filterValue = value.toLowerCase();
    return options.filter(option => option.toLowerCase().includes(filterValue));
  }

  filterYears(options: string[], value: string): string[] {
    return options.filter(option => option.includes(value));
  }

  toggleView(isMyClasses: boolean): void {
    this.myClassesView = isMyClasses;
    this.currentPage = 1;
    this.loadClasses();
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;

    if (this.isEditing && !this.myClassesView) {
      this.allClasses.forEach((classItem: ClassItem) => {
        classItem.selectedTeacherIds = classItem.teachers.map((t: Teacher) => t.id);

      });
    }

    else if (this.isEditing && this.myClassesView) {
      this.currentTeacherClasses.forEach((classItem: ClassItem) => {
        classItem.selectedTeacherIds = classItem.teachers.map((t: Teacher) => t.id);
      });
    }
  }

  getTeacherNames(classItem: ClassItem): string {
    return classItem.teachers?.map(t => t.name).join(', ') || 'N/A';
  }

  loadMoreClasses(): void {
    this.currentPage++;
    this.loadClasses();
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadClasses();
  }

  hasMoreClasses(): boolean {
    const currentClassesCount = this.myClassesView ? this.currentTeacherClasses.length : this.allClasses.length;
    return currentClassesCount < this.totalClasses;
  }

  navigateToAddClass(): void {
    this.router.navigate(['/add-class']);
  }

  navigateToClass(classId: string): void {
    this.router.navigate([`/classes/${classId}`]);
  }
}
