import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'payments-data.json');

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        {
          error: 'Data file not found. Run: npm run parse',
          hint: 'Execute "npm run parse" in the dashboard directory to generate the data file from the Excel source.',
        },
        { status: 404 }
      );
    }

    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error reading payments data:', error);
    return NextResponse.json(
      { error: 'Failed to read payments data', details: error.message },
      { status: 500 }
    );
  }
}
