export function parseASTMMessage(raw) {
  const clean = String(raw).replace(/\x02|\x03|\x04|\r\n/g, '\n');
  const lines = clean.split('\n').map((l) => l.trim()).filter(Boolean);

  const out = {
    protocol: 'ASTM',
    patientId: null,
    orderId: null,
    timestamp: new Date().toISOString(),
    results: []
  };

  for (const line of lines) {
    const parts = line.split('|');
    const type = parts[0].replace(/^\d+/, '');

    if (type === 'H') {
      out.timestamp = new Date().toISOString();
    }

    if (type === 'P') {
      out.patientId = parts[2] || parts[3] || out.patientId;
    }

    if (type === 'O') {
      out.orderId = parts[2] || out.orderId;
    }

    if (type === 'R') {
      const testCode = (parts[2] || '').replace(/\^/g, '') || 'UNKNOWN';
      const value = parts[3] || '';
      const unit = parts[4] || '';
      const referenceRange = parts[5] || '';
      out.results.push({ testCode, testName: testCode, value, unit, referenceRange });
    }
  }

  if (!out.patientId || !out.orderId || out.results.length === 0) {
    throw new Error('Invalid ASTM payload: required P/O/R records missing');
  }

  return out;
}

export function toASTMAck() {
  return '\x02H|\\^&|||LIMS|||||P|1\\rL|1|N\\x03';
}

export function toASTMNack(reason = 'Parse Error') {
  return `\x02H|\\^&|||LIMS|||||P|1\\rC|1|I|${reason}\\rL|1|N\\x03`;
}
