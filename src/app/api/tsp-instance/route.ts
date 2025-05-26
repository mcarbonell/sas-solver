
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fileName = searchParams.get('name');

  if (!fileName) {
    return NextResponse.json({ error: 'File name is required' }, { status: 400 });
  }

  // Basic validation to prevent directory traversal and ensure it's a .tsp file
  if (fileName.includes('..') || !fileName.endsWith('.tsp')) {
    return NextResponse.json({ error: 'Invalid file name' }, { status: 400 });
  }

  try {
    // Construct the full path to the file within the k-search/tsplib directory
    const filePath = path.join(process.cwd(), 'k-search', 'tsplib', fileName);
    
    // Read the file content
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    // Return the file content as a plain text response
    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    console.error(`Error reading TSP file ${fileName}:`, error);
    // Check if the error is because the file doesn't exist (ENOENT)
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json({ error: `File not found: ${fileName}` }, { status: 404 });
    }
    // For other errors, return a generic 500 server error
    return NextResponse.json({ error: `Failed to read file: ${fileName}` }, { status: 500 });
  }
}
