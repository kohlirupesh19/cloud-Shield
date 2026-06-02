export function mapRowsToSecurityLogs(rows: any[], datasetLabel: string) {
  return rows.map((row: any) => {
    const user = row.user || row.username || row.CardID || row.card_id || row.id || 'Card User';
    const ip = row.ip || row.ip_address || row.source || '192.168.1.100';

    let hour = 12;
    if (row.hour !== undefined) hour = Number(row.hour);
    else if (row.Time !== undefined) hour = Math.floor(Number(row.Time) / 3600) % 24;
    else if (row.time !== undefined) hour = Math.floor(Number(row.time) / 3600) % 24;

    let bytesTransferred = 50000;
    if (row.bytes !== undefined) bytesTransferred = Number(row.bytes);
    else if (row.Amount !== undefined) bytesTransferred = Number(row.Amount);
    else if (row.amount !== undefined) bytesTransferred = Number(row.amount);

    let failedLogins = 0;
    if (row.failed_logins !== undefined) failedLogins = Number(row.failed_logins);
    else if (row.Class !== undefined && Number(row.Class) === 1) failedLogins = 8;
    else if (row.class !== undefined && Number(row.class) === 1) failedLogins = 8;

    return {
      user,
      department: row.department || 'Finance',
      dataset: datasetLabel,
      action: row.action || (row.Class || row.class ? 'CREDIT_CARD_TX' : 'ACCESS'),
      hour,
      bytes: bytesTransferred,
      failed_logins: failedLogins,
      ip,
    };
  });
}

export function isTransactionOrAccessLog(rows: any[]): boolean {
  if (!rows.length) return false;
  const firstRow = rows[0] || {};
  const keys = Object.keys(firstRow).map((k) => k.toLowerCase());
  return (
    keys.includes('user') ||
    keys.includes('ip') ||
    keys.includes('failed_logins') ||
    keys.includes('bytes') ||
    keys.includes('amount') ||
    keys.includes('class')
  );
}
