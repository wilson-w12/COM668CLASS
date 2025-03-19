import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { SignUpComponent } from './sign-up/sign-up.component';
import { HomeComponent } from './home/home.component';
import { ClassesComponent } from './classes/classes.component';
import { ClassComponent } from './class/class.component';
import { ClassAssignmentsComponent } from './class-assignments/class-assignments.component';
import { ClassExamsComponent } from './class-exams/class-exams.component';
import { ClassAssignmentDetailsComponent } from './class-assignment-details/class-assignment-details.component';
import { ClassExamDetailsComponent } from './class-exam-details/class-exam-details.component';
import { AllStudentsComponent } from './all-students/all-students.component';
import { StudentComponent } from './student/student.component';
import { AccountComponent } from './account/account.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { AddStudentComponent } from './add-student/add-student.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'sign-up', component: SignUpComponent },
  { path: 'home', component: HomeComponent },
  { path: 'classes', component: ClassesComponent },
  { path: 'classes/:class_id', component: ClassComponent },
  { path: 'classes/:class_id/assignments', component: ClassAssignmentsComponent },
  { path: 'classes/:class_id/exams', component: ClassExamsComponent },
  { path: 'classes/:class_id/assignments/:assignment_id', component: ClassAssignmentDetailsComponent },
  { path: 'exams/:exam_id', component: ClassExamDetailsComponent },
  { path: 'students/add-student', component: AddStudentComponent },
  { path: 'students', component: AllStudentsComponent },
  { path: 'students/:student_id', component: StudentComponent },
  { path: 'account', component: AccountComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
