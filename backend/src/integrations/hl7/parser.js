export function parseHL7Message(raw) {
  const message = String(raw).replace(/\n/g, '\r');
  const segments = message.split('\r').filter(Boolean);

  const out = {
    protocol: 'HL7',
    patientId: null,
    orderId: null,
    timestamp: new Date().toISOString(),
    results: []
  };

  for (const segment of segments) {
    const fields = segment.split('|');
    const type = fields[0];

    if (type === 'MSH') {
      out.timestamp = fields[6] || out.timestamp;
    }

    if (type === 'PID') {
      out.patientId = fields[3]?.split('^')[0] || fields[2] || out.patientId;
    }

    if (type === 'OBR') {
      out.orderId = fields[3]?.split('^')[0] || fields[2] || out.orderId;
    }

    if (type === 'OBX') {
      const testCode = fields[3]?.split('^')[0];
      const testName = fields[3]?.split('^')[1] || testCode;
      const value = fields[5] || '';
      const unit = fields[6] || '';
      const referenceRange = fields[7] || '';
      out.results.push({ testCode, testName, value, unit, referenceRange });
    }
  }

  if (!out.patientId || !out.orderId || out.results.length === 0) {
    throw new Error('Invalid HL7 payload: required PID/OBR/OBX fields missing');
  }

  return out;
}

export function toHL7Ack(controlId = 'ACK001') {
  return `MSH|^~\\&|LIMS|LAB|ANALYZER|LAB|${new Date().toISOString()}||ACK^R01|${controlId}|P|2.3\rMSA|AA|${controlId}\r`;
}

export function toHL7Nack(controlId = 'NACK001', reason = 'Parse Error') {
  return `MSH|^~\\&|LIMS|LAB|ANALYZER|LAB|${new Date().toISOString()}||ACK^R01|${controlId}|P|2.3\rMSA|AE|${controlId}|${reason}\r`;
}
