import path from 'path';

export function normalizeCustomValue(value: any): any {
  if (Array.isArray(value)) {
    return value.map(normalizeCustomValue);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, normalizeCustomValue(entry)]));
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length === 0) return value;
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      const numeric = Number(trimmed);
      if (!Number.isNaN(numeric)) return numeric;
    }
    if (trimmed.toLowerCase() === 'true') return true;
    if (trimmed.toLowerCase() === 'false') return false;
  }
  return value;
}

export function normalizeRows(rows: any[]) {
  return rows.map((row) => normalizeCustomValue(row));
}

export function parseDatasetRows(contentStr: string, originalName: string, maxRowsToParse = 5000): { rows: any[]; totalRowCount: number } {
  const ext = path.extname(originalName).toLowerCase().slice(1);

  if (ext === 'json') {
    const parsed = JSON.parse(contentStr);
    const allRows = Array.isArray(parsed) ? parsed : (parsed.rows || [parsed]);
    const totalRowCount = allRows.length;
    const rows = allRows.slice(0, maxRowsToParse);
    return { rows, totalRowCount };
  }

  if (ext === 'csv') {
    let totalLines = 0;
    let pos = 0;
    while ((pos = contentStr.indexOf('\n', pos)) !== -1) {
      totalLines++;
      pos++;
    }
    if (contentStr.length > 0 && !contentStr.endsWith('\n')) {
      totalLines++;
    }
    const totalRowCount = Math.max(0, totalLines - 1);

    let endPos = 0;
    let lineCount = 0;
    const targetLines = maxRowsToParse + 1;
    while (lineCount < targetLines && (endPos = contentStr.indexOf('\n', endPos)) !== -1) {
      lineCount++;
      endPos++;
    }
    const partToParse = endPos === -1 ? contentStr : contentStr.slice(0, endPos);
    const lines = partToParse.split(/\r?\n/).filter((line) => line.trim().length > 0);

    if (lines.length > 0) {
      const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
      const linesToParse = lines.slice(1);
      const rows = linesToParse.map((line) => {
        const values = line.split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
        const obj: any = {};
        headers.forEach((header, index) => {
          const val = values[index];
          if (val !== undefined && val !== '') {
            const num = Number(val);
            obj[header] = isNaN(num) ? val : num;
          } else {
            obj[header] = null;
          }
        });
        return obj;
      });
      return { rows, totalRowCount };
    }
  }

  return { rows: [{ content: contentStr.slice(0, 1000) }], totalRowCount: 1 };
}
