import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { HeaderComponent } from './header/header.component';
import { LoginComponent } from './login/login.component';
import { FooterComponent } from './footer/footer.component';
import { ClassComponent } from './class/class.component';
import { ClassesComponent } from './classes/classes.component';
import { SignUpComponent } from './sign-up/sign-up.component';
import { HighchartsChartModule } from 'highcharts-angular';
import { ClassAssignmentsComponent } from './class-assignments/class-assignments.component';
import { ClassExamsComponent } from './class-exams/class-exams.component';
import { ClassAssignmentDetailsComponent } from './class-assignment-details/class-assignment-details.component';
import { ClassExamDetailsComponent } from './class-exam-details/class-exam-details.component';
import { StudentComponent } from './student/student.component';
import { AccountComponent } from './account/account.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { PopupNotificationComponent } from './popup-notification/popup-notification.component';
import { CommonModule } from '@angular/common';
import Highcharts from 'highcharts';
import { NgSelectModule } from '@ng-select/ng-select';
import { HomeComponent } from './home/home.component';
import { AllStudentsComponent } from './all-students/all-students.component';
import { AddStudentComponent } from './add-student/add-student.component';
import { AddTeacherComponent } from './add-teacher/add-teacher.component';
import { MatIconModule } from '@angular/material/icon';
import { AddAssignmentComponent } from './add-assignment/add-assignment.component';
import { AddExamComponent } from './add-exam/add-exam.component';
import { EditStudentComponent } from './edit-student/edit-student.component';


@NgModule({
  declarations: [
    EditStudentComponent,
    AddExamComponent,
    AddAssignmentComponent,
    AddTeacherComponent,
    AllStudentsComponent,
    AppComponent,
    HomeComponent,
    AddStudentComponent,
    StudentComponent,
    HeaderComponent,
    LoginComponent,
    FooterComponent,
    ClassComponent,
    ClassesComponent,
    SignUpComponent,
    ClassAssignmentsComponent,
    ClassExamsComponent,
    ClassAssignmentDetailsComponent,
    ClassExamDetailsComponent,
    AccountComponent,
    ResetPasswordComponent,
    PopupNotificationComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    BrowserModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatSelectModule,
    ReactiveFormsModule,
    RouterModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    HighchartsChartModule,
    NgSelectModule,
  ],
  providers: [
    {
      provide: 'Highcharts',
      useValue: Highcharts.setOptions({
        credits: { enabled: false }
      })
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }