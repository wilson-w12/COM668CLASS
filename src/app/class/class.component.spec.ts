import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClassComponent } from './class.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { HighchartsChartModule } from 'highcharts-angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { PdfGenerationService } from '../../services/PdfGeneration.service';
import { TeacherService } from '../../services/teacher.service';

describe('ClassComponent', () => {
  let component: ClassComponent;
  let fixture: ComponentFixture<ClassComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClassComponent],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        HighchartsChartModule,
      ],
      providers: [
        TeacherService,
        PdfGenerationService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => 'test-class-id',
              },
            },
          },
        },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ClassComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
