import ExcelJS from 'exceljs';
import { FullAnalysisResponse } from '@/types';

const DARK = '030308';
const GREEN = '00ff88';
const BLUE = '00d4ff';
const PURPLE = 'bf5af2';
const TEXT = 'e2e8f0';
const MUTED = '475569';

function hdr(
  cell: ExcelJS.Cell,
  value: string,
  color: string = BLUE,
  bg: string = '0d1117'
): void {
  cell.value = value;
  cell.font = { bold: true, color: { argb: `FF${color}` }, size: 11 };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${bg}` } };
  cell.alignment = { vertical: 'middle', horizontal: 'center' };
  cell.border = {
    bottom: { style: 'thin', color: { argb: `FF${GREEN}` } },
  };
}

function cell(
  row: ExcelJS.Row,
  col: number,
  value: ExcelJS.CellValue,
  color: string = TEXT
): void {
  const c = row.getCell(col);
  c.value = value;
  c.font = { color: { argb: `FF${color}` }, size: 10 };
  c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${DARK}` } };
  c.alignment = { wrapText: true, vertical: 'top' };
}

export async function generateExcel(analysis: FullAnalysisResponse): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'PES Intelligence System';
  wb.created = new Date();

  // ── Sheet 1: Overview ──────────────────────────────────────────────────────
  const overview = wb.addWorksheet('Overview', {
    properties: { tabColor: { argb: `FF${GREEN}` } },
  });
  overview.columns = [
    { key: 'a', width: 30 },
    { key: 'b', width: 60 },
  ];

  hdr(overview.getCell('A1'), 'FIELD', BLUE, '0d1117');
  hdr(overview.getCell('B1'), 'VALUE', BLUE, '0d1117');

  const overviewRows: [string, string][] = [
    ['Report Date', new Date(analysis.generated_at).toLocaleString()],
    ['Date Range', analysis.date_range],
    ['Session ID', analysis.session_id],
    ['PES Active Ads', String(analysis.pes_data?.active_ad_count ?? 0)],
    ['Nilaya Active Ads', String(analysis.nilaya_data?.active_ad_count ?? 0)],
    ['Brand Ahead', analysis.ai_analysis?.which_brand_ahead ?? 'N/A'],
    ['Summary', analysis.ai_analysis?.summary ?? ''],
    ['Daily Battle Report', analysis.ai_analysis?.daily_battle_report ?? ''],
    ['Funnel Analysis', analysis.ai_analysis?.funnel_analysis ?? ''],
  ];

  for (const [label, value] of overviewRows) {
    const row = overview.addRow({});
    cell(row, 1, label, BLUE);
    cell(row, 2, value, TEXT);
    row.height = 20;
  }

  // ── Sheet 2: Scores ────────────────────────────────────────────────────────
  const scoresSheet = wb.addWorksheet('Scores', {
    properties: { tabColor: { argb: `FF${PURPLE}` } },
  });
  scoresSheet.columns = [
    { key: 'a', width: 30 },
    { key: 'b', width: 15 },
    { key: 'c', width: 15 },
  ];

  const scoreHeaders = scoresSheet.addRow({});
  hdr(scoreHeaders.getCell(1), 'DIMENSION', PURPLE, '0d1117');
  hdr(scoreHeaders.getCell(2), 'PES', GREEN, '0d1117');
  hdr(scoreHeaders.getCell(3), 'NILAYA', BLUE, '0d1117');

  const pesScores = analysis.ai_analysis?.scores?.['PES'] || analysis.ai_analysis?.scores?.['pes'];
  const nilayaScores =
    analysis.ai_analysis?.scores?.['Nilaya'] || analysis.ai_analysis?.scores?.['nilaya'];

  const dimensions: Array<[string, keyof typeof pesScores]> = [
    ['Ad Activity', 'ad_activity_score'],
    ['Content Frequency', 'content_frequency_score'],
    ['Engagement', 'engagement_score'],
    ['Brand Authority', 'brand_authority_score'],
    ['Trust', 'trust_score'],
    ['Placement Positioning', 'placement_positioning_score'],
    ['Founder Branding', 'founder_branding_score'],
    ['AI Readiness', 'ai_readiness_score'],
    ['Innovation', 'innovation_score'],
    ['OVERALL SCORE', 'overall_score'],
  ];

  for (const [label, key] of dimensions) {
    const row = scoresSheet.addRow({});
    const isOverall = label === 'OVERALL SCORE';
    cell(row, 1, label, isOverall ? GREEN : TEXT);
    cell(row, 2, pesScores?.[key] ?? 'N/A', isOverall ? GREEN : TEXT);
    cell(row, 3, nilayaScores?.[key] ?? 'N/A', isOverall ? BLUE : TEXT);
    row.height = 18;
  }

  // ── Sheet 3: SWOT ──────────────────────────────────────────────────────────
  const swotSheet = wb.addWorksheet('SWOT', {
    properties: { tabColor: { argb: `FF${GREEN}` } },
  });
  swotSheet.columns = [
    { key: 'a', width: 20 },
    { key: 'b', width: 20 },
    { key: 'c', width: 60 },
  ];

  const swotHeaderRow = swotSheet.addRow({});
  hdr(swotHeaderRow.getCell(1), 'BRAND', GREEN, '0d1117');
  hdr(swotHeaderRow.getCell(2), 'CATEGORY', GREEN, '0d1117');
  hdr(swotHeaderRow.getCell(3), 'ITEM', GREEN, '0d1117');

  const swot = analysis.ai_analysis?.swot || {};
  for (const [brand, s] of Object.entries(swot)) {
    const categories: Array<[string, string[], string]> = [
      ['Strengths', s.strengths || [], GREEN],
      ['Weaknesses', s.weaknesses || [], 'ff453a'],
      ['Opportunities', s.opportunities || [], BLUE],
      ['Threats', s.threats || [], 'ff9f0a'],
    ];
    for (const [cat, items, color] of categories) {
      for (const item of items) {
        const row = swotSheet.addRow({});
        cell(row, 1, brand, PURPLE);
        cell(row, 2, cat, color);
        cell(row, 3, item, TEXT);
        row.height = 18;
      }
    }
  }

  // ── Sheet 4: Recommendations ───────────────────────────────────────────────
  const recSheet = wb.addWorksheet('Recommendations', {
    properties: { tabColor: { argb: `FF${BLUE}` } },
  });
  recSheet.columns = [
    { key: 'a', width: 12 },
    { key: 'b', width: 35 },
    { key: 'c', width: 50 },
    { key: 'd', width: 50 },
    { key: 'e', width: 35 },
  ];

  const recHdrRow = recSheet.addRow({});
  hdr(recHdrRow.getCell(1), 'PRIORITY', BLUE, '0d1117');
  hdr(recHdrRow.getCell(2), 'TITLE', BLUE, '0d1117');
  hdr(recHdrRow.getCell(3), 'DESCRIPTION', BLUE, '0d1117');
  hdr(recHdrRow.getCell(4), 'ACTION ITEMS', BLUE, '0d1117');
  hdr(recHdrRow.getCell(5), 'EXPECTED IMPACT', BLUE, '0d1117');

  for (const rec of analysis.ai_analysis?.recommendations || []) {
    const row = recSheet.addRow({});
    const pColor =
      rec.priority === 'high' ? 'ff453a' : rec.priority === 'medium' ? 'ff9f0a' : GREEN;
    cell(row, 1, rec.priority?.toUpperCase(), pColor);
    cell(row, 2, rec.title, TEXT);
    cell(row, 3, rec.description, TEXT);
    cell(row, 4, (rec.action_items || []).join('\n• '), MUTED);
    cell(row, 5, rec.expected_impact, TEXT);
    row.height = 40;
  }

  // ── Sheet 5: Alerts ────────────────────────────────────────────────────────
  const alertSheet = wb.addWorksheet('Alerts', {
    properties: { tabColor: { argb: 'FFff453a' } },
  });
  alertSheet.columns = [
    { key: 'a', width: 12 },
    { key: 'b', width: 35 },
    { key: 'c', width: 50 },
    { key: 'd', width: 20 },
    { key: 'e', width: 20 },
    { key: 'f', width: 40 },
  ];

  const alertHdrRow = alertSheet.addRow({});
  hdr(alertHdrRow.getCell(1), 'SEVERITY', 'ff453a', '0d1117');
  hdr(alertHdrRow.getCell(2), 'TITLE', 'ff453a', '0d1117');
  hdr(alertHdrRow.getCell(3), 'DESCRIPTION', 'ff453a', '0d1117');
  hdr(alertHdrRow.getCell(4), 'BRAND', 'ff453a', '0d1117');
  hdr(alertHdrRow.getCell(5), 'PLATFORM', 'ff453a', '0d1117');
  hdr(alertHdrRow.getCell(6), 'ACTION REQUIRED', 'ff453a', '0d1117');

  for (const alert of analysis.ai_analysis?.alerts || []) {
    const row = alertSheet.addRow({});
    const sColor =
      alert.severity === 'critical' ? 'ff453a' : alert.severity === 'warning' ? 'ff9f0a' : BLUE;
    cell(row, 1, alert.severity?.toUpperCase(), sColor);
    cell(row, 2, alert.title, TEXT);
    cell(row, 3, alert.description, TEXT);
    cell(row, 4, alert.brand, PURPLE);
    cell(row, 5, alert.platform, BLUE);
    cell(row, 6, alert.action_required || '', MUTED);
    row.height = 25;
  }

  // ── Sheet 6: Suggestions ───────────────────────────────────────────────────
  const sugSheet = wb.addWorksheet('Suggestions', {
    properties: { tabColor: { argb: `FF${PURPLE}` } },
  });
  sugSheet.columns = [
    { key: 'a', width: 25 },
    { key: 'b', width: 80 },
  ];

  const sugHdrRow = sugSheet.addRow({});
  hdr(sugHdrRow.getCell(1), 'TYPE', PURPLE, '0d1117');
  hdr(sugHdrRow.getCell(2), 'SUGGESTION', PURPLE, '0d1117');

  const allSuggestions: Array<[string, string[]]> = [
    ['Campaign Idea', analysis.ai_analysis?.suggested_campaigns || []],
    ['Reel Idea', analysis.ai_analysis?.suggested_reel_ideas || []],
    ['Ad Hook', analysis.ai_analysis?.suggested_ad_hooks || []],
    ['WhatsApp Campaign', analysis.ai_analysis?.suggested_whatsapp_campaigns || []],
    ['Landing Page Fix', analysis.ai_analysis?.suggested_landing_page_improvements || []],
    ['Missed Opportunity', analysis.ai_analysis?.missed_opportunities || []],
  ];

  for (const [type, items] of allSuggestions) {
    for (const item of items) {
      const row = sugSheet.addRow({});
      cell(row, 1, type, PURPLE);
      cell(row, 2, item, TEXT);
      row.height = 22;
    }
  }

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
