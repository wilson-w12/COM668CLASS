import { Injectable } from '@angular/core';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

@Injectable({
    providedIn: 'root',
})
export class PdfGenerationService {
    constructor() { }

    // Add logo 
    public addLogoToPDF(doc: jsPDF, callback: (doc: jsPDF, currentY: number) => void): void {
        const pageWidth = doc.internal.pageSize.width;
        const imgWidth = 40;
        const imgHeight = 20;
        const imgY = 10;
        const imgX = (pageWidth - imgWidth) / 2; // Center logo
        const img = new Image();
        img.src = "assets/img/CLASSLogo.png";

        img.onload = () => {
            doc.addImage(img, "PNG", imgX, imgY, imgWidth, imgHeight);
            const newCurrentY = imgY + imgHeight + 20;
            callback(doc, newCurrentY);
        };
    }


    // Check if new page
    public checkPageBreak(doc: jsPDF, currentY: number): number {
        if (currentY < 0) {
            return 10; 
        }
        const pageHeight = doc.internal.pageSize.height;
        const marginBottom = 20;
        if (currentY + marginBottom > pageHeight) {
            doc.addPage();
            return 10;
        }
        return currentY;
    }

    // Draw table header (left-aligned text)
    public drawTableHeader(doc: jsPDF, headers: string[], columnWidths: number[], startY: number): void {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        let currentX = 10;
    
        headers.forEach((header, i) => {
            doc.setFillColor(220, 220, 220);
            doc.rect(currentX, startY - 6, columnWidths[i], 8, "F");
    
            // Left-align header 
            doc.text(header, currentX + 2, startY - 2, { align: "left" });
    
            currentX += columnWidths[i];
        });
        doc.setLineWidth(0.5);
        doc.line(10, startY + 2, 10 + columnWidths.reduce((a, b) => a + b, 0), startY + 2);
    }    

    // Draw table row (left-aligned text)
    public drawTableRow(doc: jsPDF, rowData: string[], columnWidths: number[], startY: number): void {
        let currentX = 10;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
    
        rowData.forEach((cellData, i) => {
            if (isNaN(columnWidths[i]) || columnWidths[i] <= 0) {
                console.error(`Invalid column width at index ${i}:`, columnWidths[i]);
                return;  
            }
    
            const displayText = (cellData != null) ? cellData.toString() : 'N/A';        
            if (isNaN(currentX) || isNaN(startY) || currentX < 0 || startY < 0) {
                console.error("Invalid drawing position", currentX, startY);
                return;
            }
            doc.text(displayText, currentX + 2, startY + 5, { align: "left" });
            currentX += columnWidths[i];
        });
    }
    


    // Wrap text 
    public wrapText(text: string, maxWidth: number): string {
        if (!text) {
            return '';
        }
        const doc = new jsPDF();
        const words = text.split(' ');
        let currentLine = '';
        let wrappedText = '';

        words.forEach(word => {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const testWidth = doc.getStringUnitWidth(testLine) * 12 / doc.internal.scaleFactor;
            if (testWidth > maxWidth) {
                if (currentLine) {
                    wrappedText += currentLine + '\n';
                }
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        });
        wrappedText += currentLine;
        return wrappedText;
    }

    // Get row height 
    public calculateRowHeight(doc: jsPDF, rowData: string[], columnWidths: number[]): number {
        const lineHeight = 6;
        let maxLines = 2;
        rowData.forEach((cellData, i) => {
            const cellHeight = this.getTextHeight(doc, cellData, columnWidths[i]);
            const lines = Math.ceil(cellHeight / lineHeight);
            maxLines = Math.max(maxLines, lines);
        });
        return maxLines * lineHeight;
    }

    // Get text height 
    public getTextHeight(doc: jsPDF, text: string, maxWidth: number): number {
        const words = text.split(' ');
        let currentLine = '';
        let height = 0;

        words.forEach(word => {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const testWidth = doc.getStringUnitWidth(testLine) * doc.getFontSize() / doc.internal.scaleFactor;
            if (testWidth > maxWidth) {
                height += 6;
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        });
        height += 6;
        return height;
    }

    public addChartSection(
        doc: jsPDF,
        chartIds: string[],
        margin: number,
        chartWidths: number[],
        currentY: number,
        callback: (finalY: number) => void
    ): void {
        let chartsToRender = chartIds.filter((id) => document.getElementById(id) !== null);
        let finalY = currentY;

        if (chartsToRender.length > 0) {
            let chartX = margin;

            const addChartsToPDF = (index: number) => {
                if (index >= chartsToRender.length) {
                    callback(finalY);
                    return;
                }
                const chartElement = document.getElementById(chartsToRender[index]);
                if (chartElement) {
                    html2canvas(chartElement, { scale: 2 }).then((chartCanvas) => {
                        const aspectRatio = chartCanvas.width / chartCanvas.height;
                        const chartHeight = chartWidths[index] / aspectRatio;
                        // Add chart image
                        doc.addImage(chartCanvas.toDataURL('image/png'), 'PNG', chartX, finalY, chartWidths[index], chartHeight);

                        // Update X for next chart
                        chartX += chartWidths[index] + margin;
                        // If no more space in current row, move down
                        if (chartX + chartWidths[index] + margin > doc.internal.pageSize.width) {
                            chartX = margin; // Reset to left
                            finalY += chartHeight + margin; // Move down 
                        }

                        addChartsToPDF(index + 1);
                    }).catch((error) => {
                        console.error('Error capturing chart:', error);
                        addChartsToPDF(index + 1); // Skip if error
                    });
                } else {
                    addChartsToPDF(index + 1); // If chart missing, skip
                }
            };
            addChartsToPDF(0);
        } else {
            callback(finalY); // If no charts, return current Y 
        }
    }
}
