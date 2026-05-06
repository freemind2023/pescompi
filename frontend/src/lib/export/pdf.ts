import PDFDocument from 'pdfkit';
import { FullAnalysisResponse } from '@/types';

export async function generatePDF(analysis: FullAnalysisResponse): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const BG = '#030308';
    const NEON_GREEN = '#00ff88';
    const NEON_BLUE = '#00d4ff';
    const NEON_PURPLE = '#bf5af2';
    const TEXT = '#e2e8f0';
    const MUTED = '#64748b';

    // ── Cover ──────────────────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(BG);

    doc
      .fontSize(28)
      .fillColor(NEON_GREEN)
      .text('PES COMPETITOR INTELLIGENCE', 50, 80, { align: 'center' });

    doc.fontSize(14).fillColor(NEON_BLUE).text('WAR ROOM REPORT', { align: 'center' });

    doc.moveDown(0.5);
    doc
      .fontSize(10)
      .fillColor(MUTED)
      .text(`Generated: ${new Date(analysis.generated_at).toLocaleString()}`, { align: 'center' });
    doc.text(`Date Range: ${analysis.date_range}`, { align: 'center' });

    // ── Divider ────────────────────────────────────────────────────────────────
    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(NEON_GREEN).lineWidth(1).stroke();
    doc.moveDown(1);

    // ── AI Summary ─────────────────────────────────────────────────────────────
    sectionHeader(doc, 'AI BATTLE REPORT', NEON_GREEN, BG);

    doc.fontSize(10).fillColor(TEXT).text(analysis.ai_analysis?.summary || 'No summary available.', {
      align: 'left',
      lineGap: 4,
    });

    doc.moveDown(0.5);
    doc
      .fontSize(11)
      .fillColor(NEON_PURPLE)
      .text(`VERDICT: ${analysis.ai_analysis?.which_brand_ahead || 'N/A'}`, { continued: false });

    // ── Ad Activity ────────────────────────────────────────────────────────────
    doc.addPage().rect(0, 0, doc.page.width, doc.page.height).fill(BG);
    sectionHeader(doc, 'AD ACTIVITY', NEON_BLUE, BG);

    tableRow(doc, 'Brand', 'Active Ads', 'Status', TEXT, true);
    tableRow(doc, 'PES', String(analysis.pes_data?.active_ad_count ?? 0), 'Active', TEXT, false);
    tableRow(doc, 'Nilaya', String(analysis.nilaya_data?.active_ad_count ?? 0), 'Active', TEXT, false);

    // ── Scores ─────────────────────────────────────────────────────────────────
    doc.moveDown(1);
    sectionHeader(doc, 'COMPETITOR SCORES', NEON_PURPLE, BG);

    const scores = analysis.ai_analysis?.scores || {};
    for (const [brand, s] of Object.entries(scores)) {
      doc.fontSize(11).fillColor(NEON_GREEN).text(brand.toUpperCase(), { underline: false });
      const dimensions = [
        ['Ad Activity', s.ad_activity_score],
        ['Content Freq.', s.content_frequency_score],
        ['Engagement', s.engagement_score],
        ['Brand Authority', s.brand_authority_score],
        ['Trust', s.trust_score],
        ['Placement', s.placement_positioning_score],
        ['Founder Brand', s.founder_branding_score],
        ['AI Readiness', s.ai_readiness_score],
        ['Innovation', s.innovation_score],
        ['OVERALL', s.overall_score],
      ];
      for (const [label, score] of dimensions) {
        const pct = typeof score === 'number' ? Math.round(score * 10) : 0;
        doc
          .fontSize(9)
          .fillColor(TEXT)
          .text(`  ${label}: ${typeof score === 'number' ? score.toFixed(1) : 'N/A'}/10 `, {
            continued: true,
          });
        doc.fillColor(NEON_GREEN).text(`[${'█'.repeat(pct)}${'░'.repeat(10 - pct)}]`);
      }
      doc.moveDown(0.5);
    }

    // ── SWOT ───────────────────────────────────────────────────────────────────
    doc.addPage().rect(0, 0, doc.page.width, doc.page.height).fill(BG);
    sectionHeader(doc, 'SWOT ANALYSIS', NEON_GREEN, BG);

    const swot = analysis.ai_analysis?.swot || {};
    for (const [brand, s] of Object.entries(swot)) {
      doc.fontSize(11).fillColor(NEON_BLUE).text(brand.toUpperCase());
      swotBlock(doc, 'Strengths', s.strengths, '#00ff88', TEXT);
      swotBlock(doc, 'Weaknesses', s.weaknesses, '#ff453a', TEXT);
      swotBlock(doc, 'Opportunities', s.opportunities, NEON_BLUE, TEXT);
      swotBlock(doc, 'Threats', s.threats, '#ff9f0a', TEXT);
      doc.moveDown(0.5);
    }

    // ── Recommendations ────────────────────────────────────────────────────────
    if (doc.y > 650) doc.addPage().rect(0, 0, doc.page.width, doc.page.height).fill(BG);
    else doc.moveDown(1);

    sectionHeader(doc, 'STRATEGIC RECOMMENDATIONS', NEON_PURPLE, BG);

    const recs = analysis.ai_analysis?.recommendations || [];
    for (const rec of recs.slice(0, 5)) {
      const priorityColor =
        rec.priority === 'high' ? '#ff453a' : rec.priority === 'medium' ? '#ff9f0a' : NEON_GREEN;
      doc.fontSize(10).fillColor(priorityColor).text(`[${rec.priority?.toUpperCase()}] ${rec.title}`);
      doc.fontSize(9).fillColor(TEXT).text(rec.description, { lineGap: 3 });
      if (rec.action_items?.length) {
        for (const item of rec.action_items.slice(0, 3)) {
          doc.fillColor(MUTED).text(`  • ${item}`, { lineGap: 2 });
        }
      }
      doc.moveDown(0.5);
    }

    // ── Suggested Campaigns ────────────────────────────────────────────────────
    if (doc.y > 600) doc.addPage().rect(0, 0, doc.page.width, doc.page.height).fill(BG);
    else doc.moveDown(1);

    sectionHeader(doc, 'FOUNDER SUGGESTIONS', NEON_GREEN, BG);

    listSection(doc, 'Campaign Ideas', analysis.ai_analysis?.suggested_campaigns, NEON_BLUE, TEXT);
    listSection(doc, 'Reel Ideas', analysis.ai_analysis?.suggested_reel_ideas, NEON_PURPLE, TEXT);
    listSection(doc, 'Ad Hooks', analysis.ai_analysis?.suggested_ad_hooks, NEON_GREEN, TEXT);

    // ── Alerts ─────────────────────────────────────────────────────────────────
    const alerts = analysis.ai_analysis?.alerts || [];
    if (alerts.length > 0) {
      if (doc.y > 550) doc.addPage().rect(0, 0, doc.page.width, doc.page.height).fill(BG);
      else doc.moveDown(1);

      sectionHeader(doc, 'AI ALERTS', '#ff453a', BG);

      for (const alert of alerts) {
        const color =
          alert.severity === 'critical' ? '#ff453a' : alert.severity === 'warning' ? '#ff9f0a' : NEON_BLUE;
        doc.fontSize(10).fillColor(color).text(`[${alert.severity?.toUpperCase()}] ${alert.title}`);
        doc.fontSize(9).fillColor(TEXT).text(alert.description, { lineGap: 2 });
        doc.moveDown(0.3);
      }
    }

    // ── Footer ─────────────────────────────────────────────────────────────────
    doc
      .fontSize(8)
      .fillColor(MUTED)
      .text('Confidential — PES Competitor Intelligence System', 50, doc.page.height - 40, {
        align: 'center',
      });

    doc.end();
  });
}

function sectionHeader(doc: PDFKit.PDFDocument, title: string, color: string, bg: string) {
  doc.rect(45, doc.y, doc.page.width - 90, 22).fill(bg);
  doc.fontSize(12).fillColor(color).text(title, 50, doc.y - 18);
  doc.moveDown(0.8);
}

function tableRow(
  doc: PDFKit.PDFDocument,
  col1: string,
  col2: string,
  col3: string,
  textColor: string,
  header: boolean
) {
  const y = doc.y;
  const fontSize = header ? 10 : 9;
  doc.fontSize(fontSize).fillColor(header ? '#00d4ff' : textColor);
  doc.text(col1, 50, y, { width: 180 });
  doc.text(col2, 230, y, { width: 150 });
  doc.text(col3, 380, y, { width: 150 });
  doc.moveDown(0.6);
}

function swotBlock(
  doc: PDFKit.PDFDocument,
  label: string,
  items: string[] | undefined,
  labelColor: string,
  textColor: string
) {
  if (!items?.length) return;
  doc.fontSize(9).fillColor(labelColor).text(`  ${label}:`);
  for (const item of items.slice(0, 3)) {
    doc.fillColor(textColor).text(`    • ${item}`, { lineGap: 2 });
  }
}

function listSection(
  doc: PDFKit.PDFDocument,
  label: string,
  items: string[] | undefined,
  labelColor: string,
  textColor: string
) {
  if (!items?.length) return;
  doc.fontSize(10).fillColor(labelColor).text(label);
  for (const item of items.slice(0, 4)) {
    doc.fontSize(9).fillColor(textColor).text(`  • ${item}`, { lineGap: 3 });
  }
  doc.moveDown(0.5);
}
