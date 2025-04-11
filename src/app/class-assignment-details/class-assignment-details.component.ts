import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TeacherService } from '../../services/teacher.service';
import * as Highcharts from 'highcharts';
import { PopupNotificationService } from '../../services/popup-notification.service';
import { PdfGenerationService } from '../../services/PdfGeneration.service';
import jsPDF from 'jspdf';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-class-assignment-details',
  templateUrl: './class-assignment-details.component.html',
  styleUrls: ['./class-assignment-details.component.css'],
  standalone: false,
})
export class ClassAssignmentDetailsComponent {
  classId!: string;
  assignmentId!: string;
  classDetails: any = null;
  assignment: any = {};
  assignmentFields: any[] = [];
  originalAssignment: any = {};
  studentResults: any[] = [];
  studentScores: any[] = [];
  isEditingAssignmentDetails = false;
  allStudents: any[] = [];
  isEditingScores = false;
  originalStudentResults: any[] = [];
  updatedAssignment: any;
  assignmentForm!: FormGroup; 
  errors: string[] = [];


  Highcharts: typeof Highcharts = Highcharts;

  scoresChartOptions: Highcharts.Options = {};
  gradesChartOptions: Highcharts.Options = {};
  targetGradeChartOptions: Highcharts.Options = {};

  constructor(
    private route: ActivatedRoute,
    private teacherService: TeacherService,
    private router: Router,
    private popupService: PopupNotificationService,
    private pdfGenerationService: PdfGenerationService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.classId = this.route.snapshot.paramMap.get('class_id')!;
    this.assignmentId = this.route.snapshot.paramMap.get('assignment_id')!;

    this.fetchClassDetails();
    this.fetchAssignment();
    this.fetchStudents();
    this.updateCharts();
  }

  fetchClassDetails(): void {
    this.teacherService.getClassById(this.classId).subscribe({
      next: (data) => { this.classDetails = data.class; },
      error: (err) => {
        console.error('Error fetching class details:', err);
        this.popupService.showError('Unable to load class details. Please try again.');
      },
    });
  }

  fetchAssignment(): void {
    this.teacherService.getAssignmentByAssignmentId(this.classId, this.assignmentId).subscribe({
      next: (data) => {
        console.log("Data: ", data)
        this.assignment = { ...data };
        this.originalAssignment = { ...data };
        this.assignmentFields = this.formatAssignmentFields(data);
        console.log("assignment fields ", this.assignmentFields)
        // Ensure students have valid result
        this.studentResults = data.results?.map(({ student_id, name, score, mark, grade }: any) => ({
          student_id,
          name,
          score,
          mark: mark !== null ? mark : null, // Null if mark missing
          grade
        })) || [];

        this.originalStudentResults = this.studentResults;

        this.assignmentForm = this.fb.group({
          title: [this.assignment.title, Validators.required],
          topics: [this.assignment.topics, Validators.required],
          due_date: [this.assignment.due_date, [Validators.required, Validators.pattern('^\\d{4}-\\d{2}-\\d{2}$')]],
          total_marks: [this.assignment.total_marks, [Validators.required, Validators.min(1)]],
          A_star_grade: [this.assignment['A*_grade'], [Validators.required, Validators.min(0), Validators.max(100)]],
          A_grade: [this.assignment.A_grade, [Validators.required, Validators.min(0), Validators.max(100)]],
          B_grade: [this.assignment.B_grade, [Validators.required, Validators.min(0), Validators.max(100)]],
          C_grade: [this.assignment.C_grade, [Validators.required, Validators.min(0), Validators.max(100)]],
          F_grade: [this.assignment.F_grade, [Validators.required, Validators.min(0), Validators.max(100)]],
        });

        this.updateCharts();
      },
      error: (err) => {
        console.error('Error fetching assignments:', err);
        this.popupService.showError('Unable to load assignment details. Please try again.');
      },
    });
  }

  fetchStudents(): void {
    this.teacherService.getStudentsByClassId(this.classId).subscribe({
      next: (data) => {
        this.allStudents = data.students || [];
        this.updateTargetGradeChart();
      },
      error: (err) => {
        console.error("Error fetching student data:", err);
        this.popupService.showError('Unable to load student details. Please try again.');
      },
    });
  }

  formatAssignmentFields(data: any): any[] {
    const fieldOrder = ['title', 'topics', 'due_date', 'total_marks', 'average_score', 'A*_grade', 'A_grade', 'B_grade', 'C_grade', 'F_grade'];
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

  updateCharts(): void {
    console.log("Student Marks:", this.studentResults);
    this.updateScoresChart();
    this.updateGradesChart();
    this.updateTargetGradeChart();
  }

  updateScoresChart(): void {
    this.scoresChartOptions = {
      chart: { type: 'column' },
      title: { text: 'Student Scores Distribution' },
      xAxis: { categories: this.studentResults.map(student => student.name), title: { text: 'Students' } },
      yAxis: { title: { text: 'Scores' }, allowDecimals: false },
      series: [{
        name: 'Score',
        type: 'column',
        data: this.studentResults.map(student => student.grade !== "Not Submitted" ? student.score : null) // Ignore "Not Submitted"
      }]
    };
  }

  updateGradesChart(): void {
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
  }

  updateTargetGradeChart(): void {
    const gradeMap: { [key: string]: number } = { 'A*': 9, 'A': 8, 'B': 7, 'C': 6, 'D': 5, 'F': 0 };

    // Create the targetGradeMap from allStudents data
    const targetGradeMap = new Map(this.allStudents.map(student => [student.student_id, gradeMap[student.target_grade] || 0]));

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
          data: this.studentResults.map(student => targetGradeMap.get(student.target_grade) || 0),
          color: '#434348',
        },
      ],
    };
  }

  toggleEditAssignmentDetails(): void {
    this.isEditingAssignmentDetails = !this.isEditingAssignmentDetails;
  
    if (!this.isEditingAssignmentDetails) {
      this.assignment = { ...this.originalAssignment };
  
      // Reset form to original values
      this.assignmentForm.setValue({
        title: this.assignment.title,
        topics: this.assignment.topics,
        due_date: this.assignment.due_date,
        total_marks: this.assignment.total_marks,
        A_star_grade: this.assignment['A*_grade'],
        A_grade: this.assignment.A_grade,
        B_grade: this.assignment.B_grade,
        C_grade: this.assignment.C_grade,
        F_grade: this.assignment.F_grade,
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
    this.assignmentForm.markAllAsTouched();
    this.errors = [];

    if (!this.assignmentForm.valid) {
      this.errors.push("Please ensure all assignment fields are correctly filled.");
    }

    const totalMarks = this.assignment.total_marks;
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

  saveAssignment(): void {
    if (!this.validateBeforeSave()) return;
  
    const formValues = this.assignmentForm.value;
    this.assignment = {
      ...this.assignment,
      title: formValues.title,
      topics: formValues.topics,
      due_date: formValues.due_date,
      total_marks: formValues.total_marks,
      "A*_grade": formValues.A_star_grade,
      A_grade: formValues.A_grade,
      B_grade: formValues.B_grade,
      C_grade: formValues.C_grade,
      F_grade: formValues.F_grade,
    };
  
    const formattedResults = this.studentResults.map(student => {
      if (student.mark === undefined || student.mark === null) {
        student.grade = "Not Submitted";
        student.score = null;
      } else {
        this.recalculateGradeAndScore(student);
      }
  
      return {
        student_id: student.student_id,
        mark: student.mark !== undefined ? student.mark : null,
        score: student.score,
        grade: student.grade
      };
    });
  
    this.updatedAssignment = {
      ...this.assignment,
      results: formattedResults
    };
  
    if (JSON.stringify(this.updatedAssignment) === JSON.stringify(this.originalAssignment)) {
      console.log("No changes detected.");
      this.isEditingAssignmentDetails = false;
      return;
    }
  
    this.teacherService.updateAssignment(this.classId, this.assignmentId, this.updatedAssignment).subscribe({
      next: () => {
        console.log("Assignment updated successfully");
        this.isEditingScores = false;
        this.isEditingAssignmentDetails = false;
        this.fetchAssignment(); 
        this.popupService.showSuccess('Assignment updated successfully!');
      },
      error: (error) => {
        console.error('Error updating assignment:', error);
        this.popupService.showError('Error updating assignment. Please try again.');
      }
    });
  }
  

  getTargetGrade(studentId: string): string {
    const student = this.allStudents.find(s => s._id === studentId);
    return student?.target_grade || 'N/A';
  }

  recalculateGradeAndScore(student: any): void {
    if (student.mark !== null && student.mark !== undefined) {
      const result = this.calculateGradeAndScore(student.mark);
      student.grade = result.grade;
      student.score = result.percentage;
    } else {
      student.grade = "Not Submitted";
      student.score = null;
    }
  }

  calculateGradeAndScore(mark: number): { grade: string; percentage: number } {
    const AStarGrade = this.assignment['A*_grade'];
    const AGrade = this.assignment.A_grade;
    const BGrade = this.assignment.B_grade;
    const CGrade = this.assignment.C_grade;
    const FGrade = this.assignment.F_grade;
    const totalMarks = this.assignment.total_marks;

    const percentage = ((mark / totalMarks) * 100);
    const roundedPercentage = Math.round(percentage * 100) / 100;

    let grade: string;
    if (roundedPercentage >= AStarGrade) {
      grade = "A*";
    } else if (roundedPercentage >= AGrade) {
      grade = "A";
    } else if (roundedPercentage >= BGrade) {
      grade = "B";
    } else if (roundedPercentage >= CGrade) {
      grade = "C";
    } else {
      grade = "F";
    }

    return { grade, percentage: roundedPercentage };
  }

  convertFormKey(key: string): string {
    return key === 'A*_grade' ? 'A_star_grade' : key;
  }  

  generatePDF(): void {
    const title = `Year ${this.classDetails.year}: Set ${this.classDetails.set}: Assignment - ${this.assignment.title}`;
    const tableTitle = 'Student Results:';
    const tableData = this.studentResults; 
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
      updatedDoc.text(`Class Info:`, 10, currentYPosition);
      currentYPosition += 10;
      updatedDoc.setFontSize(10);

      // Column positions
      const leftColumnX = 10;
      const rightColumnX = 110;
      const columnSpacing = 10;

      // Extract class details
      const year = this.classDetails?.year || 'N/A';
      const set = this.classDetails?.set || 'N/A';
      const subject = this.classDetails?.subject || 'N/A';
      const teachers = this.classDetails?.teachers?.map((t: { id: string, name: string }) => t.name).join(', ') || 'N/A';

      // Left column
      updatedDoc.text(`Year: ${year}`, leftColumnX, currentYPosition);
      updatedDoc.text(`Set: ${set}`, leftColumnX, currentYPosition + columnSpacing);
      // Right column
      updatedDoc.text(`Subject: ${subject}`, rightColumnX, currentYPosition);
      updatedDoc.text(`Teacher(s): ${teachers}`, rightColumnX, currentYPosition + columnSpacing);
      currentYPosition += columnSpacing * 2 + 5;

      // Assignment info section
      updatedDoc.setFontSize(12);
      updatedDoc.text("Assignment Info:", 10, currentYPosition);
      currentYPosition += 10;
      updatedDoc.setFontSize(10);
      // Split the fields into two sections
      const firstHalfFields = this.assignmentFields.slice(0, 5);
      const secondHalfFields = this.assignmentFields.slice(5);

      // Left column
      firstHalfFields.forEach((field) => {
        let fieldValue = this.assignment[field.key] || 'N/A';
        updatedDoc.text(`${field.label}: ${fieldValue}`, leftColumnX, currentYPosition);
        currentYPosition += columnSpacing;
      });

      let secondColumnY = currentYPosition - (firstHalfFields.length * columnSpacing);

      // Right column
      secondHalfFields.forEach((field) => {
        let fieldValue = this.assignment[field.key] || 'N/A';
        updatedDoc.text(`${field.label}: ${fieldValue}`, rightColumnX, secondColumnY);
        secondColumnY += columnSpacing;
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

      this.pdfGenerationService.addChartSection(updatedDoc, ["scoresChartContainer"], 10, [190], currentYPosition, (updatedY: number) => {
        currentYPosition = updatedY;
        this.pdfGenerationService.addChartSection(updatedDoc, ["gradesChartContainer"], 10, [100], currentYPosition, (updatedY: number) => {
          currentYPosition = updatedY;
          this.pdfGenerationService.addChartSection(updatedDoc, ["targetGradesChartContainer"], 10, [190], currentYPosition, (updatedY: number) => {
            currentYPosition = updatedY;
            const sanitizedTitle = this.assignment.title
              .replace(/\s+/g, '_') // Replace spaces with underscores
              .replace(/[^\w\-]/g, ''); // Remove non-word characters except underscores and hyphens
            updatedDoc.save(`Year_${this.classDetails.year}_Set_${this.classDetails.set}_Assignment_${sanitizedTitle}_Report.pdf`);
          });
        });
      });
    });
  }

  deleteAssignment(): void {
    this.teacherService.deleteAssignment(this.classId, this.assignmentId).subscribe({
      next: () => {
        this.router.navigate([`/classes/${this.classId}`]);
        console.log("Assignment deleted successfully");
        this.popupService.showSuccess('Assignment deleted successfully!');
      },
      error: (error) => {
        console.error('Error deleting assignment:', error);
        this.popupService.showError('Error deleting assignment. Please try again.');
      }
    });
  }

  navigateToClass(classId: string): void {
    this.router.navigate([`/classes/${classId}`]);
  }

  navigateToAssignments(classId: string): void {
    this.router.navigate([`/classes/${classId}/assignments`]);
  }

  navigateToExams(classId: string): void {
    this.router.navigate([`/classes/${classId}/exams`]);
  }
}
