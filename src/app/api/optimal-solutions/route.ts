
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const filePath = path.join(process.cwd(), 'k-search', 'tsplib', 'optimal-solutions.txt');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    const lines = fileContent.split('\n');
    const optimalSolutions: Record<string, number> = {};

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine === '' || trimmedLine.startsWith('Optimal solutions')) continue; // Skip empty lines or headers

      const parts = trimmedLine.split(/\s*:\s*/); // Split by colon, allowing for optional spaces
      if (parts.length === 2) {
        const problemName = parts[0].trim();
        // Handle cases like "dsj1000 : 18659688 (EUC_2D)"
        const valuePart = parts[1].trim();
        const optimalValueString = valuePart.split(' ')[0]; // Take the first part before any space
        const optimalValue = parseInt(optimalValueString, 10);
        
        if (problemName && !isNaN(optimalValue) && !optimalSolutions[problemName]) {
          // Store only if name is valid, value is a number, and not already stored (for duplicates like dsj1000)
          optimalSolutions[problemName] = optimalValue;
        }
      }
    }
    
    return NextResponse.json(optimalSolutions, { status: 200 });
  } catch (error) {
    console.error('Error reading or parsing optimal-solutions.txt:', error);
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json({ error: 'optimal-solutions.txt not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to read or parse optimal solutions file' }, { status: 500 });
  }
}
