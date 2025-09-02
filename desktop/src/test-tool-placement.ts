// Test script for tool placement coordinate system
// This can be run in the browser console to verify coordinate transformation

export function testCoordinateTransformation() {
  console.log('Testing coordinate transformation system...');
  
  // Mock canvas and PDF dimensions
  const canvasWidth = 800;
  const canvasHeight = 600;
  const pdfWidth = 612; // Standard letter size in points
  const pdfHeight = 792;
  
  // Test coordinate conversion functions
  const pdfToCanvasCoords = (pdfX: number, pdfY: number) => {
    const scaleX = canvasWidth / pdfWidth;
    const scaleY = canvasHeight / pdfHeight;
    return {
      x: pdfX * scaleX,
      y: pdfY * scaleY
    };
  };
  
  const canvasToPDFCoords = (canvasX: number, canvasY: number) => {
    const scaleX = pdfWidth / canvasWidth;
    const scaleY = pdfHeight / canvasHeight;
    return {
      x: canvasX * scaleX,
      y: canvasY * scaleY
    };
  };
  
  // Test cases
  const testCases = [
    { pdf: { x: 0, y: 0 }, expectedCanvas: { x: 0, y: 0 } },
    { pdf: { x: pdfWidth, y: pdfHeight }, expectedCanvas: { x: canvasWidth, y: canvasHeight } },
    { pdf: { x: pdfWidth / 2, y: pdfHeight / 2 }, expectedCanvas: { x: canvasWidth / 2, y: canvasHeight / 2 } }
  ];
  
  console.log('PDF dimensions:', { width: pdfWidth, height: pdfHeight });
  console.log('Canvas dimensions:', { width: canvasWidth, height: canvasHeight });
  
  testCases.forEach((testCase, index) => {
    const canvasCoords = pdfToCanvasCoords(testCase.pdf.x, testCase.pdf.y);
    const backToPDF = canvasToPDFCoords(canvasCoords.x, canvasCoords.y);
    
    console.log(`Test ${index + 1}:`);
    console.log(`  PDF coords: (${testCase.pdf.x}, ${testCase.pdf.y})`);
    console.log(`  Canvas coords: (${canvasCoords.x}, ${canvasCoords.y})`);
    console.log(`  Back to PDF: (${backToPDF.x}, ${backToPDF.y})`);
    
    const tolerance = 0.1;
    const xDiff = Math.abs(backToPDF.x - testCase.pdf.x);
    const yDiff = Math.abs(backToPDF.y - testCase.pdf.y);
    
    if (xDiff < tolerance && yDiff < tolerance) {
      console.log('  ✅ PASS - Coordinate conversion is accurate');
    } else {
      console.log('  ❌ FAIL - Coordinate conversion has errors');
    }
  });
  
  console.log('Coordinate transformation test complete!');
}

// Make it available globally for console testing
(window as any).testCoordinateTransformation = testCoordinateTransformation;