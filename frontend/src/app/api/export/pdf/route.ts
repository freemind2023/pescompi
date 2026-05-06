import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-middleware';
import { getSession } from '@/lib/session';
import { generatePDF } from '@/lib/export/pdf';
import { FullAnalysisResponse } from '@/types';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const auth = await verifyToken(req);
  if (!auth) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  const session = await getSession(auth.sessionId);
  if (!session?.analysis) {
    return NextResponse.json({ detail: 'No analysis found. Run analysis first.' }, { status: 404 });
  }

  try {
    const analysis = session.analysis as unknown as FullAnalysisResponse;
    const buffer = await generatePDF(analysis);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="pes_intel_${new Date().toISOString().slice(0, 10)}.pdf"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (err) {
    console.error('PDF generation error:', err);
    return NextResponse.json({ detail: 'PDF generation failed' }, { status: 500 });
  }
}
