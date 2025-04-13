import { Component, ChangeDetectorRef, AfterViewChecked } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TeacherService } from '../../services/teacher.service';
import * as Highcharts from 'highcharts';
import jsPDF from 'jspdf';
import { PdfGenerationService } from '../../services/PdfGeneration.service';
import { PopupNotificationService } from '../../services/popup-notification.service';

@Component({
  selector: 'app-class',
  templateUrl: './class.component.html',
  styleUrls: ['./class.component.css'],
  standalone: false,
})
export class ClassComponent implements AfterViewChecked {

  constructor(
    private route: ActivatedRoute,
    private teacherService: TeacherService,
    private cdRef: ChangeDetectorRef,
    private router: Router,
    private pdfGenerationService: PdfGenerationService,
    private popupService: PopupNotificationService
  ) { }

  classId: string | null = null;
  classDetails: any = null;
  assignments: any[] = [];
  exam: any[] = [];
  chartLabels: string[] = [];
  chartData: number[] = [];
  gradeCounts: { 'A*': number; 'A': number; 'B': number; 'C': number; 'F': number } = {
    'A*': 0, 'A': 0, 'B': 0, 'C': 0, 'F': 0
  };
  allStudents: any[] = [];
  filteredStudents: any[] = [];
  genderCounts: { Male: number; Female: number; 'Other': number } = { Male: 0, Female: 0, 'Other': 0 };
  genderChartOptions: Highcharts.Options = {};
  submissionRates: number[] = [];

  Highcharts: typeof Highcharts = Highcharts; 

  // Average Results Chart
  chartOptions: Highcharts.Options = {
    chart: { type: 'line' },
    title: { text: 'Loading...' },
    xAxis: { categories: [] },
    series: []
  };

  // Grade Distribution Chart 
  gradeChartOptions: Highcharts.Options = {
    chart: { type: 'column' },
    title: { text: 'Grade Distribution' },
    xAxis: { categories: ['A*', 'A', 'B', 'C', 'F'], title: { text: 'Grades' } },
    yAxis: { title: { text: 'Number of Students' }, allowDecimals: false },
    series: []
  };

  // Submission Rate Chart 
  submissionRateChartOptions: Highcharts.Options = {
    chart: { type: 'column' },
    title: { text: 'Assignment Completion Rate' },
    xAxis: { categories: [], title: { text: 'Assignments' } },
    yAxis: { title: { text: 'Completion Rate (%)' }, max: 100, allowDecimals: false },
    series: [{
      name: 'Completion Rate',
      type: 'column',
      data: []
    }]
  };

  ngOnInit(): void {
    this.classId = this.route.snapshot.paramMap.get('class_id');
    if (this.classId) {
      this.fetchClassDetails(this.classId);
      this.fetchAssignments(this.classId);
      this.fetchExamsAndGrades(this.classId); 
      this.fetchStudents(this.classId)
      this.updateCharts();
      this.updateGradeChart();
      this.updateGenderChart();
    }
  }

  ngAfterViewChecked(): void {
    this.cdRef.detectChanges();
  }

  fetchClassDetails(classId: string): void {
    this.teacherService.getClassById(classId).subscribe({
      next: (data) => {
        this.classDetails = data.class;
        console.log("Fetch class details: ", this.classDetails)
      },
      error: (err) => {
        console.error('Error fetching class details:', err);
        this.popupService.showError('Unable to load class details. Please try again.');
      }
    });
  }

  fetchAssignments(classId: string): void {
    this.teacherService.getAssignmentsByClassId(classId).subscribe({
      next: (data: { assignments: any[] }) => {
        this.assignments = data.assignments;
        console.log("Assignments: ", this.assignments);
        this.chartLabels = this.assignments.map((a) =>
          a.title.length > 10 ? a.title.substring(0, 10) + '...' : a.title
        );
        this.chartData = this.assignments.map((a) => Number(a.average_score));
        this.submissionRates = this.assignments.map((a) => Number(a.submission_rate));
        this.updateCharts();
      },
      error: (err: any) => {
        console.error('Error fetching assignments:', err);
        this.popupService.showError('Unable to load assignment details. Please try again.');
      }
    });
  }

  fetchExamsAndGrades(classId: string): void {
    this.teacherService.getExamAndGradesByClassId(classId).subscribe({
      next: (data) => {
        if (!data.exam || !data.exam.grade_distribution) {
          console.warn("Warning: data.exam or grade_distribution is missing", data);
          this.popupService.showError('Data missing. Please try again.');
          return;
        }

        // Reset grade counts
        this.gradeCounts = { 'A*': 0, 'A': 0, 'B': 0, 'C': 0, 'F': 0 };

        // Use grade_distribution directly
        Object.keys(this.gradeCounts).forEach((grade) => {
          this.gradeCounts[grade as keyof typeof this.gradeCounts] =
            data.exam.grade_distribution[grade] || 0;
        });
        this.updateGradeChart();
      },
      error: (err) => {
        console.error("Error fetching grade data:", err);
        this.popupService.showError('Unable to load grde details. Please try again.');
      }
    });
  }

  fetchStudents(classId: string): void {
    this.teacherService.getStudentsByClassId(classId).subscribe({
      next: (data) => {
        if (!data.students || !Array.isArray(data.students)) {
          console.warn("No students data received", data);
          return;
        }

        this.allStudents = data.students;
        this.filteredStudents = data.students;
        console.log("Data.students at chart creation: ", data.students);
        console.log("All students at chart creation: ", this.allStudents);
        console.log("Filtered students at chart creation: ", this.filteredStudents);
        // Reset gender counts 
        this.genderCounts = { Male: 0, Female: 0, 'Other': 0 };

        // Count occurrences of each gender
        this.allStudents.forEach((student) => {
          const genderKey = student.gender as keyof typeof this.genderCounts;
          if (this.genderCounts[genderKey] !== undefined) {
            this.genderCounts[genderKey]++;
          }
        });
        this.updateGenderChart();
      },
      error: (err) => {
        console.error("Error fetching student data:", err);
        this.popupService.showError('Unable to load student details. Please try again.');
      }
    });
  }

  updateCharts(): void {
    this.chartOptions = {
      chart: { type: 'line' },
      title: { text: 'Assignment Average Scores' },
      xAxis: { categories: this.chartLabels, title: { text: 'Assignments' } },
      yAxis: { title: { text: 'Average Scores' }, allowDecimals: false },
      series: [{
        name: 'Average Score',
        type: 'line',
        data: this.chartData
      }]
    };
    console.log("Updated submissionRateChartOptions:", this.submissionRates);
    this.submissionRateChartOptions = {
      chart: { type: 'column' },
      title: { text: 'Assignment Completion Rate' },
      xAxis: { categories: this.chartLabels, title: { text: 'Assignments' } },
      yAxis: { title: { text: 'Completion Rate (%)' }, max: 100, allowDecimals: false },
      series: [{
        name: 'Completion Rate',
        type: 'column',
        data: this.submissionRates
      }]
    };
  }

  updateGradeChart(): void {
    console.log("Updating grade chart")
    this.gradeChartOptions = {
      chart: { type: 'column' },
      title: { text: 'Most Recent Exam Grade Distribution' },
      xAxis: { categories: ['A*', 'A', 'B', 'C', 'F'], title: { text: 'Grades' } },
      yAxis: { title: { text: 'Number of Students' }, allowDecimals: false },
      series: [{
        name: 'Students',
        type: 'column',
        data: Object.values(this.gradeCounts)
      }]
    };
  }

  updateGenderChart(): void {
    this.genderChartOptions = {
      chart: { type: 'pie' },
      title: { text: 'Gender Distribution' },
      tooltip: {
        pointFormat: '<b>{point.percentage:.1f}%</b> ({point.y} students)'
      },
      plotOptions: {
        pie: {
          dataLabels: {
            enabled: true,
            format: '{point.name}: {point.percentage:.1f}%'
          }
        }
      },
      series: [{
        name: 'Students',
        type: 'pie',
        data: Object.entries(this.genderCounts).map(([gender, count]) => ({
          name: gender,
          y: count
        }))
      }]
    };
  }

  filterStudents(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase().trim();
    if (!searchTerm) {
      this.filteredStudents = this.allStudents;
      return;
    }
    const searchWords = searchTerm.split(/\s+/); // Split by spaces
    this.filteredStudents = this.allStudents.filter(student =>
      searchWords.every(word =>
        student.first_name.toLowerCase().includes(word) ||
        student.last_name.toLowerCase().includes(word)
      )
    );
  }

  generatePDF(): void {
    const title = `Year ${this.classDetails.year}: Set ${this.classDetails.set}`;
    const doc = new jsPDF();
    const studentData = this.allStudents;

    // Add Logo 
    this.pdfGenerationService.addLogoToPDF(doc, (updatedDoc: jsPDF, currentY: number) => {
      let currentYPosition = currentY;

      // Title
      updatedDoc.setFontSize(16);
      updatedDoc.setFont("helvetica", "bold");
      updatedDoc.text(title, doc.internal.pageSize.width / 2, currentY, { align: "center" });
      currentYPosition += 12;

      // Chart title
      updatedDoc.setFontSize(12);
      updatedDoc.setFont("helvetica", "normal");
      updatedDoc.text("Class Insights:", 10, currentYPosition);
      currentYPosition += 15;

      // Ensure charts render before adding students
      this.pdfGenerationService.addChartSection(updatedDoc, ["chartContainer", "gradeChartContainer"], 10, [90, 90], currentYPosition, (updatedY: number) => {
        currentYPosition = updatedY;
        this.pdfGenerationService.addChartSection(updatedDoc, ["genderChartContainer", "submissionRateChartContainer"], 10, [90, 90], currentYPosition, (updatedY: number) => {
          currentYPosition = updatedY + 10; // Ensure spacing after charts

          updatedDoc.addPage();
          currentYPosition = 20;
          // Add Students
          updatedDoc.setFontSize(12);
          updatedDoc.text('Students: ', 10, currentYPosition);
          currentYPosition += 10;

          // Student table headers
          const studentHeaders = ["First Name", "Last Name", "Gender"];
          const columnWidths = [50, 40, 40];
          this.pdfGenerationService.drawTableHeader(updatedDoc, studentHeaders, columnWidths, currentYPosition);
          currentYPosition += 10;

          // Student table rows
          studentData.forEach(item => {
            currentYPosition = this.pdfGenerationService.checkPageBreak(updatedDoc, currentYPosition);

            const rowData = [
              this.pdfGenerationService.wrapText(item.first_name || '', columnWidths[0]),
              this.pdfGenerationService.wrapText(item.last_name || '', columnWidths[1]),
              this.pdfGenerationService.wrapText(item.gender || '', columnWidths[2])
            ];

            const rowHeight = this.pdfGenerationService.calculateRowHeight(updatedDoc, rowData, columnWidths);
            this.pdfGenerationService.drawTableRow(updatedDoc, rowData, columnWidths, currentYPosition);
            currentYPosition += rowHeight;
          });

          updatedDoc.save(`Year_${this.classDetails.year}_Set_${this.classDetails.set}_Class_Report.pdf`);
        });
      });
    });
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
}
