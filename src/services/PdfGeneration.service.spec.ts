import { TestBed } from '@angular/core/testing';
import { PdfGenerationService } from './PdfGeneration.service';
import { jsPDF } from 'jspdf';

describe('PdfGenerationService', () => {
  let service: PdfGenerationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PdfGenerationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add a logo to the PDF and execute callback', (done) => {
    const doc = new jsPDF();
    service.addLogoToPDF(doc, (updatedDoc, y) => {
      expect(updatedDoc).toBeTruthy();
      expect(typeof y).toBe('number');
      done();
    });
  });

  it('should wrap text properly', () => {
    const result = service.wrapText('This is a long piece of text that needs wrapping properly across lines', 50);
    expect(typeof result).toBe('string');
    expect(result.includes('\n')).toBeTrue();
  });

  it('should calculate row height', () => {
    const doc = new jsPDF();
    const row = ['Test1', 'Test2', 'Test3'];
    const widths = [20, 20, 20];
    const height = service.calculateRowHeight(doc, row, widths);
    expect(typeof height).toBe('number');
  });
});
