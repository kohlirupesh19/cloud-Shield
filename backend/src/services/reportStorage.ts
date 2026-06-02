import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { env } from '../config/env';
import logger from '../config/logger';

export interface ReportStorage {
  save(reportId: string, content: string | Buffer, ext: 'md' | 'pdf' | 'csv'): Promise<string>;
  getPath(reportId: string, ext: string): string;
  cleanupOlderThan(days: number): Promise<number>;
}

const REPORTS_DIR = path.resolve(env.UPLOAD_DIR || 'uploads', '..', 'reports');

function ensureDir() {
  if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

/** Generate a real binary PDF with basic layout: title, metrics, body text (from markdown). */
export async function generateReportPdf(
  title: string,
  metrics: Record<string, unknown>,
  body: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Title
    doc.fontSize(18).text(title, { align: 'center', underline: true });
    doc.moveDown(1.5);

    // Metrics section
    doc.fontSize(13).text('Metrics', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    Object.entries(metrics).forEach(([key, value]) => {
      const display = value === null || value === undefined ? 'N/A' : String(value);
      doc.text(`${key}: ${display}`);
    });
    doc.moveDown(1);

    // Body
    doc.fontSize(13).text('Report Body', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(9);

    // Basic markdown-to-text (strip common markers for readability)
    const cleanBody = body
      .replace(/^#+\s*/gm, '')
      .replace(/^\s*[-*]\s*/gm, '• ')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1');

    const lines = cleanBody.split(/\r?\n/);
    lines.forEach((line) => {
      if (line.trim() === '') {
        doc.moveDown(0.3);
      } else {
        doc.text(line, { continued: false });
      }
    });

    doc.end();
  });
}

export const localReportStorage: ReportStorage = {
  async save(reportId: string, content: string | Buffer, ext: 'md' | 'pdf' | 'csv') {
    ensureDir();
    const filename = `report-${reportId}-${Date.now()}.${ext}`;
    const full = path.join(REPORTS_DIR, filename);

    if (ext === 'pdf' && typeof content === 'string') {
      // Text fallback (for tests or when explicitly passing string body)
      fs.writeFileSync(full, content);
    } else {
      // Buffer (real binary PDF) or other content
      fs.writeFileSync(full, content);
    }

    logger.info({ reportId, path: full }, 'Report saved locally');
    return full;
  },
  getPath(reportId: string, ext: string) {
    ensureDir();
    // naive: latest match; in prod use DB path
    const files = fs.readdirSync(REPORTS_DIR).filter(f => f.includes(reportId) && f.endsWith(`.${ext}`));
    if (!files.length) return path.join(REPORTS_DIR, `report-${reportId}.${ext}`);
    files.sort((a, b) => fs.statSync(path.join(REPORTS_DIR, b)).mtimeMs - fs.statSync(path.join(REPORTS_DIR, a)).mtimeMs);
    return path.join(REPORTS_DIR, files[0]);
  },
  async cleanupOlderThan(days: number): Promise<number> {
    ensureDir();
    const cutoff = Date.now() - days * 24 * 3600 * 1000;
    let removed = 0;
    for (const f of fs.readdirSync(REPORTS_DIR)) {
      const fp = path.join(REPORTS_DIR, f);
      const st = fs.statSync(fp);
      if (st.mtimeMs < cutoff) {
        try { fs.unlinkSync(fp); removed++; } catch {}
      }
    }
    return removed;
  },
};

// S3 ready: export class S3ReportStorage implements ReportStorage { ... }

export const reportStorage = localReportStorage;
