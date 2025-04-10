import { Component, OnInit } from '@angular/core';
import { jsPDF } from 'jspdf';
import { ActivatedRoute, Router } from '@angular/router';
import { TeacherService } from '../../services/teacher.service';
import * as Highcharts from 'highcharts';
import { PdfGenerationService } from '../../services/PdfGeneration.service';
import { PopupNotificationService } from '../../services/popup-notification.service';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: any;
  }
}


interface ExamDataPoint {
  exam_id: string | null;
  y: number;  // Score (score, class average, or year average)
  mark?: number;
  grade?: string;  // Optional grade
  date: string; // Formatted date for display
  subject: string;
  title?: string; // Some data points may not have a title
}

interface AssignmentDataPoint {
  class_id: string | null;
  assignment_id: string | null;
  y: number;  // Score (score, class average, or year average)
  mark?: number;
  grade?: string;  // Optional grade
  date: string; // Formatted date for display
  subject: string;
  topics: string | null;
  title?: string; // Some data points may not have a title
}

@Component({
  selector: 'app-student',
  templateUrl: './student.component.html',
  styleUrls: ['./student.component.css'],
  standalone: false,

})
export class StudentComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private teacherService: TeacherService,
    private router: Router,
    private pdfGenerationService: PdfGenerationService,
    private popupService: PopupNotificationService,

  ) { }

  studentId: string | null = null;
  studentDetails: any = null;
  uniqueSubjects: string[] = [];
  filters = { subject: '' };

  originalStudent: any = {};
  studentFields: any[] = [];
  isEditingStudentDetails = false;
  student: any = {};
  studentSubjects: string[] = [];
  selectedSubject: string = '';
  gradeOptions: string[] = ['A*', 'A', 'B', 'C', 'F'];


  examCategories: string[] = [];
  examData: any = null;
  studentExamSeries: ExamDataPoint[] = [];
  classExamSeries: ExamDataPoint[] = [];
  yearExamSeries: ExamDataPoint[] = [];

  assignmentCategories: string[] = [];
  assignmentData: any = null;
  studentAssignmentSeries: AssignmentDataPoint[] = [];
  classAssignmentSeries: AssignmentDataPoint[] = [];
  yearAssignmentSeries: AssignmentDataPoint[] = [];

  Highcharts: typeof Highcharts = Highcharts;
  examChartOptions: Highcharts.Options = {
    chart: { type: 'line' },
    exporting: {
      enabled: true,
      buttons: {
        contextButton: {
          menuItems: [
            'downloadPDF',  // Enable PDF export
            'downloadSVG',  // Enable SVG export
          ]
        }
      }
    },
    title: { text: 'Loading...' },
    xAxis: { categories: [] },
    series: []
  };

  assignmentChartOptions: Highcharts.Options = {
    chart: { type: 'line' },
    title: { text: 'Loading...' },
    xAxis: { categories: [] },
    series: []
  };

  examGradeChartOptions: Highcharts.Options = {
    chart: { type: 'pie' },
    title: { text: 'Loading...' },
    series: []
  };

  assignmentGradeChartOptions: Highcharts.Options = {
    chart: { type: 'pie' },
    title: { text: 'Loading...' },
    series: []
  };

  ngOnInit(): void {
    this.studentId = this.route.snapshot.paramMap.get('student_id');
    if (this.studentId) {
      this.fetchStudentDetails(this.studentId);
      this.fetchExamData(this.studentId);
      this.fetchAssignmentData(this.studentId);
    }
    this.updateCharts();
  }

  fetchStudentDetails(studentId: string): void {
    this.teacherService.getStudent(studentId).subscribe({
      next: (data) => {
        this.studentDetails = data;
        this.student = { ...data };
        this.originalStudent = JSON.parse(JSON.stringify(this.student));

        this.studentSubjects = Object.keys(this.studentDetails.target_grades || {});
        this.selectedSubject = this.studentSubjects.length ? this.studentSubjects[0] : '';
        this.studentFields = this.formatStudentFields(data);
        this.loadFilters(studentId);
      },
      error: (err) => {
        console.error('Error fetching student details:', err);
        this.popupService.showError('Unable to load student details. Please try again.');
      }
    });
  }

  formatStudentFields(data: any): any[] {
    const fieldOrder = ['first_name', 'last_name', 'gender', 'year', 'set'];
    return fieldOrder
      .filter((key) => data.hasOwnProperty(key))
      .map((key) => ({
        key,
        label: this.formatLabel(key),
        type: typeof data[key] === 'number' ? 'number' : 'text',
      }));
  }

  formatLabel(key: string): string {
    return key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  }

  fetchExamData(studentId: string): void {
    const params = { subject: this.filters.subject || '' };

    this.teacherService.getStudentExamData(studentId, params).subscribe({
      next: (data: any) => {
        this.examData = data;
        this.processExamData();
      },
      error: (err: any) => {
        console.error('Error fetching exam data:', err);
      }
    });
  }

  fetchAssignmentData(studentId: string): void {
    const params = { subject: this.filters.subject || '' };

    this.teacherService.getStudentAssignmentData(studentId, params).subscribe({
      next: (data: any) => {
        this.assignmentData = data;
        this.processAssignmentData();
      },
      error: (err: any) => {
        console.error('Error fetching assignment data:', err);
      }
    });
  }

  processExamData(): void {
    if (!this.examData) {
      console.warn("Exam data is null, chart won't update.");
      return;
    }

    const studentScores: ExamDataPoint[] = this.examData.student_scores.map((exam: any): ExamDataPoint => ({
      exam_id: exam.exam_id,
      y: exam.score ?? 0,
      mark: exam.mark,
      grade: exam.grade,
      date: new Date(exam.due_date).toLocaleDateString(),
      subject: exam.subject,
      title: exam.title
    }));

    const classAverages: ExamDataPoint[] = this.examData.class_averages.map((exam: any): ExamDataPoint => ({
      exam_id: null,
      y: exam.class_avg ?? 0,
      date: new Date(exam.due_date).toLocaleDateString(),
      subject: exam.subject,
      title: exam.title
    }));

    const yearAverages: ExamDataPoint[] = this.examData.year_averages.map((exam: any): ExamDataPoint => ({
      exam_id: null,
      y: exam.year_avg ?? 0,
      date: new Date(exam.due_date).toLocaleDateString(),
      subject: exam.subject,
      title: exam.title
    }));

    studentScores.sort((a: ExamDataPoint, b: ExamDataPoint) => new Date(a.date).getTime() - new Date(b.date).getTime());
    classAverages.sort((a: ExamDataPoint, b: ExamDataPoint) => new Date(a.date).getTime() - new Date(b.date).getTime());
    yearAverages.sort((a: ExamDataPoint, b: ExamDataPoint) => new Date(a.date).getTime() - new Date(b.date).getTime());

    this.examCategories = studentScores.map((exam: ExamDataPoint) => exam.title || 'Unknown');

    this.studentExamSeries = studentScores;
    this.classExamSeries = classAverages;
    this.yearExamSeries = yearAverages;
    this.updateCharts();
  }

  processAssignmentData(): void {
    if (!this.assignmentData) {
      console.warn("Assignment data is null, chart won't update.");
      return;
    }

    const studentScores: AssignmentDataPoint[] = this.assignmentData.student_scores.map((assignment: any): AssignmentDataPoint => ({
      class_id: assignment.class_id,
      assignment_id: assignment.assignment_id,
      y: assignment.score ?? 0,
      mark: assignment.mark,
      grade: assignment.grade,
      date: new Date(assignment.due_date).toLocaleDateString(),
      subject: assignment.subject,
      topics: assignment.topics,
      title: assignment.title
    }));

    const classAverages: AssignmentDataPoint[] = this.assignmentData.class_averages.map((assignment: any): AssignmentDataPoint => ({
      class_id: assignment.class_id,
      assignment_id: null,
      y: assignment.class_avg ?? 0,
      date: new Date(assignment.due_date).toLocaleDateString(),
      subject: assignment.subject,
      topics: null,
      title: assignment.title

    }));

    studentScores.sort((a: AssignmentDataPoint, b: AssignmentDataPoint) => new Date(a.date).getTime() - new Date(b.date).getTime());
    classAverages.sort((a: AssignmentDataPoint, b: AssignmentDataPoint) => new Date(a.date).getTime() - new Date(b.date).getTime());

    this.assignmentCategories = studentScores.map((assignment: AssignmentDataPoint) => assignment.title || 'Unknown');

    this.studentAssignmentSeries = studentScores;
    this.classAssignmentSeries = classAverages;
    this.updateCharts();
  }

  updateCharts(): void {
    this.examChartOptions = {
      chart: { type: 'line' },
      exporting: {
        enabled: true,
        buttons: {
          contextButton: {
            menuItems: [
              'downloadPDF',  // Enable PDF export
              'downloadSVG',  // Enable SVG export
            ]
          }
        }
      },
      title: { text: 'Exam Performance' },
      xAxis: { categories: this.examCategories, title: { text: 'Subjects' } },
      yAxis: { title: { text: 'Scores' } },
      tooltip: {
        useHTML: true, // Ensure correct formatting
        formatter: function () {
          let gradeText = (this as any).grade ? `<b>Grade:</b> ${(this as any).grade} <br/>` : '';
          return `
            <span style="color:${this.color}">\u25CF</span> <b>${this.series.name}</b><br/>
            <b>Exam:</b> ${(this as any).title || this.x} <br/>
            <b>Score:</b> ${this.y} <br/>
            ${gradeText}
            <b>Exam Date:</b> ${(this as any).date || 'N/A'}
          `;
        }
      },
      series: [
        {
          name: 'Student Score',
          data: this.studentExamSeries,
          type: 'line',
          color: 'blue'
        },
        {
          name: 'Class Average',
          data: this.classExamSeries,
          type: 'line',
          color: 'green'
        },
        {
          name: 'Year Average',
          data: this.yearExamSeries,
          type: 'line',
          color: 'red'
        }
      ] as Highcharts.SeriesOptionsType[],
      legend: { enabled: true }
    };

    this.assignmentChartOptions = {
      chart: { type: 'line' },
      title: { text: 'Assignment Performance' },
      xAxis: { categories: this.assignmentCategories, title: { text: 'Subjects' } },
      yAxis: { title: { text: 'Scores' } },
      tooltip: {
        useHTML: true, // Ensure correct formatting
        formatter: function () {
          let gradeText = (this as any).grade ? `<b>Grade:</b> ${(this as any).grade} <br/>` : '';
          return `
            <span style="color:${this.color}">\u25CF</span> <b>${this.series.name}</b><br/>
            <b>Assignment:</b> ${(this as any).title || this.x} <br/>
            <b>Score:</b> ${this.y} <br/>
            ${gradeText}
            <b>Assignment Date:</b> ${(this as any).date || 'N/A'}
          `;
        }
      },
      series: [
        {
          name: 'Student Score',
          data: this.studentAssignmentSeries,
          type: 'line',
          color: 'blue'
        },
        {
          name: 'Class Average',
          data: this.classAssignmentSeries,
          type: 'line',
          color: 'green'
        }
      ] as Highcharts.SeriesOptionsType[],
      legend: { enabled: true }
    };

    // Process exam grades
    const examGradeCounts: Record<string, number> = {};
    this.studentExamSeries.forEach((exam) => {
      if (exam.grade) {
        examGradeCounts[exam.grade] = (examGradeCounts[exam.grade] || 0) + 1;
      }
    });

    // Format exam grade data for the pie chart
    const examGradeData = Object.entries(examGradeCounts).map(([grade, count]) => ({
      name: grade,
      y: count
    }));

    // Process assignment grades
    const assignmentGradeCounts: Record<string, number> = {};
    this.studentAssignmentSeries.forEach((assignment) => {
      if (assignment.grade) {
        assignmentGradeCounts[assignment.grade] = (assignmentGradeCounts[assignment.grade] || 0) + 1;
      }
    });

    // Format assignment grade data for the pie chart
    const assignmentGradeData = Object.entries(assignmentGradeCounts).map(([grade, count]) => ({
      name: grade,
      y: count
    }));

    // Update exam grade distribution chart
    this.examGradeChartOptions = {
      chart: { type: 'pie' },
      title: { text: 'Student Exam Grade Distribution' },
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
        name: 'Exam Grades',
        type: 'pie',
        data: examGradeData
      }]
    };

    // Update assignment grade distribution chart
    this.assignmentGradeChartOptions = {
      chart: { type: 'pie' },
      title: { text: 'Student Assignment Grade Distribution' },
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
        name: 'Assignment Grades',
        type: 'pie',
        data: assignmentGradeData
      }]
    };
  }


  loadFilters(studentId: string): void {
    this.teacherService.getStudentFilters(studentId).subscribe({
      next: (response) => {
        this.uniqueSubjects = response.subjects || [];
      },
      error: (error) => {
        console.error('Error fetching filters:', error);
      }
    });
  }

  applyFilters(): void {
    if (this.studentId) {
      this.fetchExamData(this.studentId);
      this.fetchAssignmentData(this.studentId);
    }
  }

  isPastDue(dueDate: string): boolean {
    const today = new Date();
    const examDueDate = new Date(dueDate);
    return examDueDate < today;
  }

  toggleEditStudentDetails(): void {
    if (this.isEditingStudentDetails) {
      // Restore original data if canceling
      this.student = JSON.parse(JSON.stringify(this.originalStudent));
      this.selectedSubject = Object.keys(this.student.target_grades)[0] || '';
    }
    this.isEditingStudentDetails = !this.isEditingStudentDetails;
  }

  validateStudentDetails(): string | boolean {
    // Validate basic student details
    if (!this.student.first_name || this.student.first_name.trim() === '') {
      return 'First name is required.';
    }
    if (!this.student.last_name || this.student.last_name.trim() === '') {
      return 'Last name is required.';
    }
    if (!this.student.year || isNaN(this.student.year) || this.student.year < 8 || this.student.year > 12) {
      return 'Year must be a number between 8 and 12.';
    }
    if (!this.student.set || this.student.set.trim() === '') {
      return 'Set is required.';
    }

    // Validate target grades
    for (const [subject, grade] of Object.entries(this.student.target_grades || {})) {
      if (!grade || !this.isValidGrade(grade)) {
        return `Grade for ${subject} is invalid.`;
      }
    }

    return true;
  }

  isValidGrade(grade: any): boolean {
    // Check grade is valid string grade
    const validGrades = ['A*', 'A', 'B', 'C', 'F'];
    return validGrades.includes(grade) || (typeof grade === 'number' && !isNaN(grade));
  }

  saveEditedDetails(): void {
    const validationResult = this.validateStudentDetails();
    if (validationResult !== true) {
      this.popupService.showError(validationResult as string);
      return;
    }

    if (this.studentId) {
      this.teacherService.updateStudent(this.studentId, this.student).subscribe({
        next: () => {
          this.isEditingStudentDetails = false;
          this.popupService.showSuccess('Student details updated successfully!');
        },
        error: (error) => {
          console.error('Error updating student details:', error);
          this.popupService.showError('Error updating student details. Please try again.');
        },
      });
    } else {
      console.error("Student ID is missing or invalid.");
    }
  }


  generatePDF(): void {
    const title = this.filters.subject
      ? `Student Report: ${this.studentDetails.first_name || 'Unknown'} ${this.studentDetails.last_name || 'Unknown'} - ${this.filters.subject}`
      : `Student Report: ${this.studentDetails.first_name || 'Unknown'} ${this.studentDetails.last_name || 'Unknown'}`;

    const examTableTitle = 'Exams:';
    const assignmentTableTitle = 'Assignments:';
    const examTableData = this.studentExamSeries;
    const assignmentTableData = this.studentAssignmentSeries;

    const doc = new jsPDF();
    let areasForImprovement: string[] = [];
    let areasOfStrength: string[] = [];

    this.pdfGenerationService.addLogoToPDF(doc, (updatedDoc: jsPDF, currentYPosition: number) => {
      // Title
      updatedDoc.setFontSize(16);
      updatedDoc.setFont("helvetica", "bold");
      updatedDoc.text(title, doc.internal.pageSize.width / 2, currentYPosition, { align: "center" });
      currentYPosition += 12;

      // Student Info
      updatedDoc.setFontSize(12);
      updatedDoc.setFont("helvetica", "normal");
      updatedDoc.text(`Student Info:`, 10, currentYPosition);
      currentYPosition += 10;
      updatedDoc.setFontSize(10);
      updatedDoc.text(
        `Gender: ${this.studentDetails.gender || 'Unknown'} \nYear: ${this.studentDetails.year || 'Unknown'} \nSet: ${this.studentDetails.set || 'Unknown'}`,
        10,
        currentYPosition
      );
      currentYPosition += 25;

      // Exams Table
      updatedDoc.setFontSize(12);
      updatedDoc.text(examTableTitle, 10, currentYPosition);
      currentYPosition += 15;

      const examHeaders = ["Title", "Subject", "Due Date", "Mark", "Score", "Grade"];
      const columnWidths = [40, 70, 25, 20, 20, 15];
      this.pdfGenerationService.drawTableHeader(updatedDoc, examHeaders, columnWidths, currentYPosition);
      currentYPosition += 10;

      examTableData.forEach(item => {
        currentYPosition = this.pdfGenerationService.checkPageBreak(updatedDoc, currentYPosition);
        const rowData = [
          this.pdfGenerationService.wrapText(item.title || 'Untitled Exam', columnWidths[0]),
          this.pdfGenerationService.wrapText(item.subject || 'N/A', columnWidths[1]),
          this.pdfGenerationService.wrapText(item.date || 'N/A', columnWidths[2]),
          this.pdfGenerationService.wrapText(item.mark != null ? item.mark.toString() : 'N/A', columnWidths[3]),
          this.pdfGenerationService.wrapText(item.y != null ? item.y.toString() : 'N/A', columnWidths[4]),
          this.pdfGenerationService.wrapText(item.grade || 'N/A', columnWidths[5])
        ];
        const rowHeight = this.pdfGenerationService.calculateRowHeight(updatedDoc, rowData, columnWidths);
        this.pdfGenerationService.drawTableRow(updatedDoc, rowData, columnWidths, currentYPosition);
        currentYPosition += rowHeight;
      });

      currentYPosition += 25;
      updatedDoc.setFontSize(12);
      updatedDoc.text(assignmentTableTitle, 10, currentYPosition);
      currentYPosition += 15;

      // Assignments Table
      const assignmentHeaders = ["Title", "Subject", "Topics", "Due Date", "Mark", "Score", "Grade"];
      const assignmentColumnWidths = [40, 30, 40, 25, 20, 20, 15];
      this.pdfGenerationService.drawTableHeader(updatedDoc, assignmentHeaders, assignmentColumnWidths, currentYPosition);
      currentYPosition += 10;

      assignmentTableData.forEach(item => {
        currentYPosition = this.pdfGenerationService.checkPageBreak(updatedDoc, currentYPosition);
        const grade = item.grade || 'N/A';
        const topics = item.topics || 'No topics';

        // Add to areas for improvement if grade is C or F
        if (grade === "C" || grade === "F") {
          if (!areasForImprovement.includes(topics)) {
            areasForImprovement.push(topics);
          }
        }

        // Add to areas of strength if grade is A or A*
        console.log("Grade: ", grade)
        if (grade === "A" || grade === "A*") {
          if (!areasOfStrength.includes(topics)) {
            areasOfStrength.push(topics);
          }
        }
        console.log("Areas of Strength: ", areasOfStrength)


        const rowData = [
          this.pdfGenerationService.wrapText(item.title || 'Untitled Assignment', assignmentColumnWidths[0]),
          this.pdfGenerationService.wrapText(item.subject || 'Untitled Assignment', assignmentColumnWidths[1]),
          this.pdfGenerationService.wrapText(topics, assignmentColumnWidths[2]),
          this.pdfGenerationService.wrapText(item.date || 'N/A', assignmentColumnWidths[3]),
          this.pdfGenerationService.wrapText(item.mark != null ? item.mark.toString() : 'N/A', assignmentColumnWidths[4]),
          this.pdfGenerationService.wrapText(item.y != null ? item.y.toString() : 'N/A', assignmentColumnWidths[5]),
          this.pdfGenerationService.wrapText(grade, assignmentColumnWidths[6])
        ];
        const rowHeight = this.pdfGenerationService.calculateRowHeight(updatedDoc, rowData, assignmentColumnWidths);
        this.pdfGenerationService.drawTableRow(updatedDoc, rowData, assignmentColumnWidths, currentYPosition);
        currentYPosition += rowHeight;
      });

      // Add Areas of Strength
      if (areasOfStrength.length > 0) {
        currentYPosition += 20;
        updatedDoc.setFontSize(12);
        updatedDoc.setFont("helvetica", "bold");
        updatedDoc.text("Areas of Strength:", 10, currentYPosition);
        currentYPosition += 10;
        updatedDoc.setFontSize(10);
        updatedDoc.setFont("helvetica", "normal");
        areasOfStrength.forEach(topic => {
          updatedDoc.text(`- ${topic}`, 12, currentYPosition);
          currentYPosition += 7;
        });
      }

      // Add Areas for Improvement
      if (areasForImprovement.length > 0) {
        currentYPosition += 20;
        updatedDoc.setFontSize(12);
        updatedDoc.setFont("helvetica", "bold");
        updatedDoc.text("Areas for Improvement:", 10, currentYPosition);
        currentYPosition += 10;
        updatedDoc.setFontSize(10);
        updatedDoc.setFont("helvetica", "normal");
        areasForImprovement.forEach(topic => {
          updatedDoc.text(`- ${topic}`, 12, currentYPosition);
          currentYPosition += 7;
        });
      }

      updatedDoc.addPage();
      updatedDoc.setFontSize(12);
      updatedDoc.text('Performance Charts:', 10, 10);
      currentYPosition = 20;

      this.pdfGenerationService.addChartSection(updatedDoc, ["examChartContainer", "examGradeChartContainer"], 10, [90, 90], currentYPosition, (updatedY: number) => {
        currentYPosition = updatedY;
        this.pdfGenerationService.addChartSection(updatedDoc, ["assignmentChartContainer", "assignmentGradeChartContainer"], 10, [90, 90], currentYPosition, (updatedY: number) => {
          currentYPosition = updatedY;
          const pdfTitle = this.filters.subject
            ? `${this.studentDetails.first_name || 'Unknown'}_${this.studentDetails.last_name || 'Unknown'}_${this.filters.subject}_Report.pdf`
            : `${this.studentDetails.first_name || 'Unknown'}_${this.studentDetails.last_name || 'Unknown'}_${this.filters.subject}_Report.pdf`;
          updatedDoc.save(pdfTitle);
        });
      });
    });
  }

  private formatDate(date: string): string {
    const dateObj = new Date(date);
    return `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear().toString().slice(-2)}`;
  }

  navigateToStudent(studentId: string): void {
    this.router.navigate([`/students/${studentId}`]);
  }

  navigateToExamDetails(examId: string | null) {
    if (examId) {
      this.router.navigate([`/exams/${examId}`]);
    } else {
      console.error('Invalid examId');
    }
  }

  navigateToAssignmentDetails(classId: string | null, assignmentId: string | null): void {
    if (classId && assignmentId) {
      this.router.navigate([`/classes/${classId}/assignments/${assignmentId}`]);
    } else {
      console.error('Invalid classId or assignmentId');
    }
  }

  navigateToEditStudent() {
    this.router.navigate([`/students/${this.studentId}/edit-student`]);
  }

}
