import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TeacherService } from '../../services/teacher.service';
import Highcharts from 'highcharts';
import { PopupNotificationService } from '../../services/popup-notification.service';
import { PdfGenerationService } from '../../services/PdfGeneration.service';
import jsPDF from 'jspdf';
import { Location } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-class-exam-details',
  templateUrl: './class-exam-details.component.html',
  styleUrl: './class-exam-details.component.css',
  standalone: false,
})
export class ClassExamDetailsComponent {
  classId!: string;
  examId!: string;
  examDetails: any = null;
  examFields: any[] = [];
  exam: any = {};
  originalExam: any = {};
  uniqueYears: number[] = [];
  uniqueSets: string[] = [];
  updatedExam: any;
  examForm!: FormGroup;
  errors: string[] = [];
  filters = {
    year: 0,
    set: ''
  };
  isEditingExamDetails = false;
  isEditingScores = false;

  Highcharts: typeof Highcharts = Highcharts;
  marksChartOptions: Highcharts.Options = {};
  studentResults: any[] = [];
  originalStudentResults: any[] = [];
  gradesChartOptions: Highcharts.Options = {};
  targetGradeChartOptions: Highcharts.Options = {};

  constructor(
    private route: ActivatedRoute,
    private teacherService: TeacherService,
    private router: Router,
    private popupService: PopupNotificationService,
    public pdfGenerationService: PdfGenerationService,
    private location: Location,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    // Capture the class ID from the route
    this.examId = this.route.snapshot.paramMap.get('exam_id')!;
    this.loadFilters(this.examId);
    this.updateCharts();
  }

  fetchExamDetails(examId: string): void {
    const params = { year: this.filters.year || '', set: this.filters.set || '' };
    this.teacherService.getExamByExamId(examId, params).subscribe({
      next: (data) => {
        this.exam = { ...data };
        this.originalExam = { ...data };
        this.examDetails = data;
        this.examFields = this.formatExamFields(data);

        // Ensure all students have a valid result
        this.studentResults = data.results?.map(({ student_id, name, mark, score, grade, target_grade }: any) => ({
          student_id,
          name,
          mark: mark !== null ? mark : null,
          score,
          grade,
          target_grade
        })) || [];
        this.originalStudentResults = this.studentResults

        this.examForm = this.fb.group({
          title: [this.exam.title, Validators.required],
          subject: [this.exam.subject, Validators.required],
          year: [this.exam.year, [Validators.required, Validators.min(7), Validators.max(13)]],
          due_date: [this.exam.due_date, [Validators.required, Validators.pattern('^\\d{4}-\\d{2}-\\d{2}$')]],
          total_marks: [this.exam.total_marks, [Validators.required, Validators.min(1)]],
          A_star_grade: [this.exam['A*_grade'], [Validators.required, Validators.min(0), Validators.max(100)]],
          A_grade: [this.exam.A_grade, [Validators.required, Validators.min(0), Validators.max(100)]],
          B_grade: [this.exam.B_grade, [Validators.required, Validators.min(0), Validators.max(100)]],
          C_grade: [this.exam.C_grade, [Validators.required, Validators.min(0), Validators.max(100)]],
          F_grade: [this.exam.F_grade, [Validators.required, Validators.min(0), Validators.max(100)]],
        });
        
        this.updateCharts();
      },
      error: (err) => { 
        console.error('Error fetching exam details:', err);         
        this.popupService.showError('Unable to load exam details. Please try again.');
      },
      
    });
  }

  formatExamFields(data: any): any[] {
    const fieldOrder = ['title', 'year', 'subject', 'due_date', 'total_marks', 'average_score', 'A*_grade', 'A_grade', 'B_grade', 'C_grade', 'F_grade'];
    return fieldOrder
      .filter((key) => data.hasOwnProperty(key))
      .map((key) => ({
        key,
        label: this.formatLabel(key),
        type: typeof data[key] === 'number' ? 'number' : 'text',
        isReadOnly: key === 'average_score',
      }));
  }

  formatLabel(key: string): string {
    return key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  }

  loadFilters(examId: string): void {
    this.teacherService.getExamFilters(examId).subscribe({
      next: (response) => {
        this.uniqueYears = response.years || [];
        this.uniqueSets = response.sets || [];
        this.filters.year = Number(this.route.snapshot.queryParamMap.get('year'));
        this.filters.set = this.route.snapshot.queryParamMap.get('set') || '';
        this.fetchExamDetails(this.examId);
      },
      error: (error) => {
        console.error('Error fetching filters:', error);
      },
    });
  }

  applyFilters(): void {
    this.fetchExamDetails(this.examId);
  }


  updateCharts(): void {
    this.marksChartOptions = {
      chart: { type: 'column' },
      title: { text: 'Student Scores Distribution' },
      xAxis: { categories: this.studentResults.map(student => student.name), title: { text: 'Students' } },
      yAxis: { title: { text: 'Scores' }, allowDecimals: false },
      series: [{
        name: 'Score',
        type: 'column',
        data: this.studentResults.map(student => student.grade !== "Not Submitted" ? student.score : null)
      }]
    };

    const gradeCounts = this.studentResults.reduce((acc, student) => {
      if (student.grade !== "Not Submitted") {
        acc[student.grade] = (acc[student.grade] || 0) + 1;
      }
      return acc;
    }, {} as { [key: string]: number });

    this.gradesChartOptions = {
      chart: { type: 'pie' },
      title: { text: 'Grade Distribution' },
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
        data: Object.entries(gradeCounts).map(([grade, count]) => ({
          name: grade,
          y: count as number 
        })) as Array<{ name: string, y: number }> 
      }]
    };
    

    const gradeMap: { [key: string]: number } = { 'A*': 9, 'A': 8, 'B': 7, 'C': 6, 'D': 5, 'F': 0 };

    this.targetGradeChartOptions = {
      chart: { type: 'column' },
      title: { text: 'Achieved Grades vs Target Grades' },
      xAxis: {
        categories: this.studentResults.map(student => student.name),
        title: { text: 'Students' },
      },
      yAxis: {
        title: { text: 'Grade Value' },
        allowDecimals: false,
      },
      series: [
        {
          name: 'Achieved Grades',
          type: 'column',
          data: this.studentResults.map(student => {
            return student.grade !== "Not Submitted" ? gradeMap[student.grade] || 0 : null;
          }),
          color: '#7cb5ec',
        },
        {
          name: 'Target Grades',
          type: 'column',
          data: this.studentResults.map(student => gradeMap[student.target_grade] || 0),
          color: '#434348',
        },
      ],
    };
  }

  toggleEditExamDetails(): void {
    this.isEditingExamDetails = !this.isEditingExamDetails;
  
    if (!this.isEditingExamDetails) {
      this.exam = { ...this.originalExam };
      this.examForm.setValue({
        title: this.exam.title,
        subject: this.exam.subject,
        year: this.exam.year,
        due_date: this.exam.due_date,
        total_marks: this.exam.total_marks,
        A_star_grade: this.exam['A*_grade'],
        A_grade: this.exam.A_grade,
        B_grade: this.exam.B_grade,
        C_grade: this.exam.C_grade,
        F_grade: this.exam.F_grade,
      });
    }
  }  

  toggleEditScores(): void {
    this.isEditingScores = !this.isEditingScores;
    if (!this.isEditingScores) {
      this.studentResults = JSON.parse(JSON.stringify(this.originalStudentResults));
    } else {
      this.originalStudentResults = JSON.parse(JSON.stringify(this.studentResults));
    }
  }

  validateBeforeSave(): boolean {
    this.examForm.markAllAsTouched();
    this.errors = [];

    if (!this.examForm.valid) {
      this.errors.push("Please ensure all assignment fields are correctly filled.");
    }

    const totalMarks = this.exam.total_marks;
    this.studentResults.forEach((student) => {
      if (student.mark !== null && (student.mark < 0 || student.mark > totalMarks)) {
        this.errors.push(`Invalid mark for ${student.name}: must be between 0 and ${totalMarks}`);
      }
    });

    if (this.errors.length > 0) {
      this.popupService.showError(this.errors.join(" - "));
      return false;
    }
    return true;
  }

  saveExam(): void {
    if (!this.validateBeforeSave()) return;

    const formValues = this.examForm.value;
    this.exam = {
      ...this.exam,
      title: formValues.title,
      subject: formValues.subject,
      year: formValues.year,
      due_date: formValues.due_date,
      total_marks: formValues.total_marks,
      "A*_grade": formValues.A_star_grade,
      A_grade: formValues.A_grade,
      B_grade: formValues.B_grade,
      C_grade: formValues.C_grade,
      F_grade: formValues.F_grade,
    };

    const formattedResults = this.studentResults.map(student => ({
      student_id: student.student_id,
      mark: student.mark !== undefined ? student.mark : null,
      grade: student.grade
    }));

    this.updatedExam = {
      ...this.exam,
      results: formattedResults
    };

    if (JSON.stringify(this.updatedExam) === JSON.stringify(this.originalExam)) {
      this.isEditingExamDetails = false;
      return;
    }

    this.teacherService.updateExam(this.examId, this.updatedExam).subscribe({
      next: () => {
        this.isEditingScores = false;
        this.isEditingExamDetails = false;
        this.fetchExamDetails(this.examId);
        this.popupService.showSuccess('Exam updated successfully!');
      },
      error: (error) => {
        console.error('Error updating assignment:', error);
        this.popupService.showError('Error updating exam. Please try again.');
      }
    });
  }

  recalculateGrade(student: any): void {
    if (student.mark !== null && student.mark !== undefined) {
      student.grade = this.calculateGrade(student.mark);
    } else {
      student.grade = "Not Submitted";
    }
  }

  calculateGrade(mark: number): string {
    const AStarGrade = this.exam['A*_grade']; 
    const AGrade = this.exam.A_grade;
    const BGrade = this.exam.B_grade;
    const CGrade = this.exam.C_grade;
    const FGrade = this.exam.F_grade;
    const totalMarks = this.exam.total_marks;
    const percentage = (mark / totalMarks) * 100;

    if (percentage >= AStarGrade) return "A*";
    if (percentage >= AGrade) return "A";
    if (percentage >= BGrade) return "B";
    if (percentage >= CGrade) return "C";
    return "F";
  }

  getTargetGrade(studentId: string): string {
    const student = this.studentResults.find(s => s._id === studentId);
    return student?.target_grade || 'N/A';
  }

  generatePDF(): void {
    // Build the title dynamically based on filters.year and filters.set
    let title = `Year ${this.examDetails.year}: Exam - ${this.examDetails.title}`;
    if (this.filters.year && this.filters.set) {
      title = `Year ${this.examDetails.year}: Exam - ${this.examDetails.title} (Year ${this.filters.year}: Set ${this.filters.set})`;
    } else if (this.filters.year) {
      title = `Year ${this.examDetails.year}: Exam - ${this.examDetails.title} (Year ${this.filters.year})`;
    } else if (this.filters.set) {
      title = `Year ${this.examDetails.year}: Exam - ${this.examDetails.title} (Set ${this.filters.set})`;
    }
    const tableTitle = 'Student Results:';
    const tableData = this.studentResults; // Your student results data
    const doc = new jsPDF();

    // Add Logo 
    this.pdfGenerationService.addLogoToPDF(doc, (updatedDoc: jsPDF, currentY: number) => {
      let currentYPosition = currentY;

      // Title
      updatedDoc.setFontSize(16);
      updatedDoc.setFont("helvetica", "bold");
      updatedDoc.text(title, doc.internal.pageSize.width / 2, currentY, { align: "center" });
      currentYPosition += 12;

      // Info Section
      updatedDoc.setFontSize(12);
      updatedDoc.setFont("helvetica", "normal");
      updatedDoc.text("Exam Info:", 10, currentYPosition);
      currentYPosition += 10;
      updatedDoc.setFontSize(10);

      // Define column widths
      const leftColumnX = 10;
      const rightColumnX = 110;
      const columnSpacing = 10;

      // Split the fields into two sections
      const firstHalfFields = this.examFields.slice(0, 6);
      const secondHalfFields = this.examFields.slice(6);

      // Draw left side
      firstHalfFields.forEach((field, index) => {
        let fieldValue = this.exam[field.key] || 'N/A';
        updatedDoc.text(`${field.label}: ${fieldValue}`, leftColumnX, currentYPosition);
        currentYPosition += columnSpacing; // Move down 
      });

      let secondColumnY = currentYPosition - (firstHalfFields.length * columnSpacing);

      // Draw the second half (right side)
      secondHalfFields.forEach((field, index) => {
        let fieldValue = this.exam[field.key] || 'N/A';
        updatedDoc.text(`${field.label}: ${fieldValue}`, rightColumnX, secondColumnY);
        secondColumnY += columnSpacing; // Move down 
      });
      currentYPosition += 15;

      //Table title
      updatedDoc.setFontSize(12);
      updatedDoc.text(tableTitle, 10, currentYPosition);
      currentYPosition += 15;

      // Table Header
      const headers = ["Name", "Mark", "Score", "Grade", "Target Grade"];
      const columnWidths = [50, 40, 40, 40, 40];
      this.pdfGenerationService.drawTableHeader(updatedDoc, headers, columnWidths, currentYPosition);
      currentYPosition += 10;

      // Table Rows
      tableData.forEach(item => {
        currentYPosition = this.pdfGenerationService.checkPageBreak(updatedDoc, currentYPosition);

        const rowData = [
          this.pdfGenerationService.wrapText(item.name || 'Unnamed Student', columnWidths[0]),
          item.mark != null ? item.mark.toString() : 'N/A',
          item.score != null ? item.score.toString() : 'N/A',
          item.grade || 'N/A',
          this.getTargetGrade(item.student_id) || 'N/A'
        ];

        const rowHeight = this.pdfGenerationService.calculateRowHeight(updatedDoc, rowData, columnWidths);
        this.pdfGenerationService.drawTableRow(updatedDoc, rowData, columnWidths, currentYPosition);
        currentYPosition += rowHeight;
      });

      // Add charts
      updatedDoc.addPage();
      updatedDoc.setFontSize(12);
      updatedDoc.text('Performance Charts:', 10, 10);
      currentYPosition = 20;

      this.pdfGenerationService.addChartSection(updatedDoc, ["marksChartContainer"], 10, [190], currentYPosition, (updatedY: number) => {
        currentYPosition = updatedY;
        this.pdfGenerationService.addChartSection(updatedDoc, ["gradesChartContainer"], 10, [100], currentYPosition, (updatedY: number) => {
          currentYPosition = updatedY;
          this.pdfGenerationService.addChartSection(updatedDoc, ["targetGradeChartContainer"], 10, [190], currentYPosition, (updatedY: number) => {
            currentYPosition = updatedY;
            const sanitizedTitle = this.exam.title
              .replace(/\s+/g, '_') // Replace spaces with underscores
              .replace(/[^\w\-]/g, ''); // Remove non-word characters except underscores and hyphens
            if (this.filters.year && this.filters.set) {
              updatedDoc.save(`Year_${this.exam.year}_Exam_${sanitizedTitle}_Filtered_Year_${this.filters.year}_Set_${this.filters.year}_Report.pdf`);
            } else if (this.filters.year) {
              updatedDoc.save(`Year_${this.exam.year}_Exam_${sanitizedTitle}_Filtered_Year_${this.filters.year}_Report.pdf`);
            } else {
              updatedDoc.save(`Year_${this.exam.year}_Exam_${sanitizedTitle}_Filtered_Set_${this.filters.year}_Report.pdf`);
            };
          });
        });
      });
    });
  }

  convertFormKey(key: string): string {
    return key === 'A*_grade' ? 'A_star_grade' : key;
  }  

  deleteExam(): void {
    this.teacherService.deleteExam(this.examId).subscribe({
      next: () => {
        this.location.back();
        console.log("Exam deleted successfully");
        this.popupService.showSuccess('Exam deleted successfully!');
      },
      error: (error) => {
        console.error('Error deleting exam:', error);
        this.popupService.showError('Error deleting exam. Please try again.');
      }
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
