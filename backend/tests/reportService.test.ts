import { buildReportCsv } from '../src/services/report.service';
import { generateReportPdf } from '../src/services/reportStorage';

describe('buildReportCsv', () => {
  it('renders a metric,value header and real values', () => {
    const csv = buildReportCsv([
      ['confidence', 0.82],
      ['riskScore', 0.31],
    ]);
    expect(csv.startsWith('metric,value\n')).toBe(true);
    expect(csv).toContain('confidence,0.82');
    expect(csv).toContain('riskScore,0.31');
  });

  it('renders null/undefined metrics as N/A instead of fabricating numbers', () => {
    const csv = buildReportCsv([
      ['confidence', null],
      ['riskScore', undefined],
    ]);
    expect(csv).toContain('confidence,N/A');
    expect(csv).toContain('riskScore,N/A');
    // guard against the old hardcoded values ever creeping back
    expect(csv).not.toContain('0.90');
    expect(csv).not.toContain('0.35');
  });
});

describe('real PDF generation (pdfkit)', () => {
  it('generateReportPdf produces a Buffer (binary PDF) with title + metrics + body', async () => {
    const buf = await generateReportPdf(
      'Test Report',
      { confidence: 0.77, status: 'COMPLETED' },
      '# Body\n\nSome content here.'
    );
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(100); // real PDF header + content
    // Basic PDF signature
    expect(buf.slice(0, 5).toString()).toBe('%PDF-');
  });
});
