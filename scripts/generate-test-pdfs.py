# Test PDF Generator
# Script to create sample PDFs for testing pipeline functionality

import os
import sys
from pathlib import Path

try:
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter, A4, ARCH_D
    from reportlab.lib import colors
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_CENTER, TA_RIGHT
    import datetime
except ImportError:
    print("Error: reportlab not installed. Run: pip install reportlab")
    sys.exit(1)

def create_construction_drawing(filename, drawing_number="A-101", project_number="2024-001", revision="A"):
    """Create a construction drawing with title block and typical content"""
    
    # Use ARCH D size (24x36 inches) for construction drawings
    doc = SimpleDocTemplate(filename, pagesize=ARCH_D)
    story = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        alignment=TA_CENTER
    )
    
    # Main drawing title
    story.append(Paragraph("FLOOR PLAN - FIRST LEVEL", title_style))
    story.append(Spacer(1, 0.5*inch))
    
    # Add some typical drawing content
    story.append(Paragraph("GENERAL NOTES:", styles['Heading2']))
    
    notes = [
        "1. ALL DIMENSIONS TO BE VERIFIED IN FIELD BEFORE CONSTRUCTION",
        "2. CONTRACTOR TO COORDINATE ALL TRADES BEFORE PROCEEDING",
        "3. ALL WORK TO COMPLY WITH LOCAL BUILDING CODES",
        "4. RFI REQUIRED FOR ANY DISCREPANCIES OR CLARIFICATIONS",
        "5. REFER TO STRUCTURAL DRAWINGS FOR BEAM SIZES AND CONNECTIONS"
    ]
    
    for note in notes:
        story.append(Paragraph(note, styles['Normal']))
        story.append(Spacer(1, 6))
    
    story.append(Spacer(1, 1*inch))
    
    # Add a simple room schedule table
    story.append(Paragraph("ROOM SCHEDULE:", styles['Heading2']))
    
    room_data = [
        ['ROOM NO.', 'ROOM NAME', 'AREA (SF)', 'FINISH'],
        ['101', 'LOBBY', '450', 'CARPET'],
        ['102', 'CONFERENCE ROOM', '320', 'CARPET'],
        ['103', 'OFFICE', '150', 'VCT'],
        ['104', 'STORAGE', '80', 'SEALED CONCRETE'],
        ['105', 'BREAK ROOM', '200', 'VCT']
    ]
    
    room_table = Table(room_data)
    room_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.grey),
        ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 12),
        ('BOTTOMPADDING', (0,0), (-1,0), 12),
        ('BACKGROUND', (0,1), (-1,-1), colors.beige),
        ('GRID', (0,0), (-1,-1), 1, colors.black)
    ]))
    
    story.append(room_table)
    
    # Build the PDF
    doc.build(story)
    
    # Now add title block using low-level canvas
    add_title_block(filename, drawing_number, project_number, revision)

def add_title_block(filename, drawing_number, project_number, revision):
    """Add a title block to the bottom right of the PDF"""
    
    # Read existing PDF and add title block
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import ARCH_D
    
    # Create a new PDF with just the title block
    temp_file = filename.replace('.pdf', '_temp.pdf')
    c = canvas.Canvas(temp_file, pagesize=ARCH_D)
    
    # Title block dimensions (bottom right corner)
    tb_width = 4 * inch
    tb_height = 2 * inch
    page_width, page_height = ARCH_D
    
    x = page_width - tb_width - 0.5*inch
    y = 0.5*inch
    
    # Draw title block border
    c.setLineWidth(2)
    c.rect(x, y, tb_width, tb_height)
    
    # Internal divisions
    c.setLineWidth(1)
    c.line(x, y + tb_height/2, x + tb_width, y + tb_height/2)
    c.line(x + tb_width/2, y, x + tb_width/2, y + tb_height)
    
    # Title block text
    c.setFont("Helvetica-Bold", 8)
    
    # Project info (top left)
    c.drawString(x + 5, y + tb_height - 15, "PROJECT NO:")
    c.drawString(x + 5, y + tb_height - 25, project_number)
    c.drawString(x + 5, y + tb_height - 40, "PROJECT NAME:")
    c.drawString(x + 5, y + tb_height - 50, "OFFICE BUILDING")
    
    # Drawing info (top right)
    c.drawString(x + tb_width/2 + 5, y + tb_height - 15, "DRAWING NO:")
    c.drawString(x + tb_width/2 + 5, y + tb_height - 25, drawing_number)
    c.drawString(x + tb_width/2 + 5, y + tb_height - 40, "REV:")
    c.drawString(x + tb_width/2 + 5, y + tb_height - 50, revision)
    
    # Date and signature (bottom)
    today = datetime.datetime.now().strftime("%m/%d/%Y")
    c.drawString(x + 5, y + 25, f"DATE: {today}")
    c.drawString(x + 5, y + 15, "ENGINEER: J. SMITH, PE")
    c.drawString(x + tb_width/2 + 5, y + 25, "SIGNED:")
    c.drawString(x + tb_width/2 + 5, y + 15, "SEALED:")
    
    c.save()
    
    # For this simple example, just rename the temp file
    # In real implementation, you'd merge with the original PDF
    os.rename(temp_file, filename)

def create_scanned_drawing(filename):
    """Create a PDF that simulates a scanned drawing (for OCR testing)"""
    
    c = canvas.Canvas(filename, pagesize=letter)
    
    # Simulate slightly skewed text and lower quality
    c.setFont("Helvetica", 10)
    
    # Add some "scanned" text
    c.drawString(100, 700, "SCANNED CONSTRUCTION DRAWING")
    c.drawString(100, 680, "PROJECT NUMBER: 2024-SCAN-001")
    c.drawString(100, 660, "DRAWING NUMBER: S-101")
    c.drawString(100, 640, "REVISION: B")
    c.drawString(100, 620, "DATE: 09/02/2025")
    
    # Add some notes that OCR should pick up
    notes = [
        "NOTES:",
        "1. VERIFY ALL DIMENSIONS IN FIELD",
        "2. RFI REQUIRED FOR CLARIFICATIONS", 
        "3. TBD - STRUCTURAL CONNECTION DETAILS",
        "4. TO BE CONFIRMED WITH ARCHITECT"
    ]
    
    y_pos = 580
    for note in notes:
        c.drawString(100, y_pos, note)
        y_pos -= 20
    
    # Add some geometric shapes to simulate a drawing
    c.setLineWidth(2)
    c.rect(100, 200, 400, 300)  # Building outline
    c.rect(150, 250, 100, 100)  # Room 1
    c.rect(250, 250, 100, 100)  # Room 2
    c.rect(350, 250, 100, 100)  # Room 3
    
    # Add room labels
    c.setFont("Helvetica", 8)
    c.drawString(180, 300, "OFFICE")
    c.drawString(270, 300, "CONFERENCE")
    c.drawString(375, 300, "STORAGE")
    
    c.save()

def create_test_suite():
    """Create a complete test suite of PDF files"""
    
    # Create test data directory
    test_dir = Path("test-data")
    test_dir.mkdir(exist_ok=True)
    
    # Create subdirectories
    (test_dir / "drawings").mkdir(exist_ok=True)
    (test_dir / "scanned").mkdir(exist_ok=True)
    (test_dir / "mixed").mkdir(exist_ok=True)
    
    print("Creating test PDF files...")
    
    # Construction drawings
    create_construction_drawing(
        str(test_dir / "drawings" / "floor-plan-A101.pdf"),
        "A-101", "2024-001", "A"
    )
    
    create_construction_drawing(
        str(test_dir / "drawings" / "site-plan-C100.pdf"),
        "C-100", "2024-001", "B"
    )
    
    create_construction_drawing(
        str(test_dir / "drawings" / "details-A201.pdf"),
        "A-201", "2024-001", "A"
    )
    
    # Scanned documents (for OCR testing)
    create_scanned_drawing(str(test_dir / "scanned" / "legacy-drawing-scan.pdf"))
    
    print(f"Test files created in {test_dir}/")
    print("Files created:")
    for pdf_file in test_dir.rglob("*.pdf"):
        print(f"  - {pdf_file}")

if __name__ == "__main__":
    create_test_suite()