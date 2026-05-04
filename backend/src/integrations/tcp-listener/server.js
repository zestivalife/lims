import net from 'net';
import fs from 'fs-extra';
import path from 'path';
import { env } from '../../config/env.js';
import { parseHL7Message, toHL7Ack, toHL7Nack } from '../hl7/parser.js';
import { parseASTMMessage, toASTMAck, toASTMNack } from '../astm/parser.js';

const LISTENER_PORT = Number(process.env.TCP_LISTENER_PORT || 5000);
const API_BASE = process.env.API_BASE_URL || 'http://backend:3001';
const uploadsDir = env.uploadsDir;
const errorLogPath = path.join(uploadsDir, 'incoming', 'tcp_errors.log');

async function logParseError(message, rawPayload) {
  await fs.ensureFile(errorLogPath);
  await fs.appendFile(errorLogPath, `${new Date().toISOString()} | ${message}\n${rawPayload}\n---\n`);
}

function detectProtocol(payload) {
  const text = String(payload || '');
  if (text.includes('MSH|')) return 'HL7';
  if (text.includes('\x02H|') || text.includes('\nH|') || text.includes('\rH|')) return 'ASTM';
  if (text.startsWith('\x02')) return 'ASTM';
  return 'UNKNOWN';
}

async function postInternalResult(parsed, rawPayload, machineId = 'TCP-LISTENER') {
  for (const row of parsed.results) {
    const body = {
      orderId: parsed.orderId,
      patientId: parsed.patientId,
      testCode: row.testCode,
      value: row.value,
      unit: row.unit,
      referenceRange: row.referenceRange,
      machineId,
      rawMessage: rawPayload,
      timestamp: parsed.timestamp
    };

    const resp = await fetch(`${API_BASE}/api/internal/results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': env.internalApiToken
      },
      body: JSON.stringify(body)
    });

    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`Internal API error: ${resp.status} ${txt}`);
    }
  }
}

const server = net.createServer((socket) => {
  socket.on('data', async (data) => {
    const rawPayload = data.toString('utf8');
    const protocol = detectProtocol(rawPayload);

    try {
      if (protocol === 'HL7') {
        const parsed = parseHL7Message(rawPayload);
        await postInternalResult(parsed, rawPayload, parsed.machineId || 'HL7-TCP');
        socket.write(toHL7Ack(parsed.orderId || 'ACK'));
        return;
      }

      if (protocol === 'ASTM') {
        const parsed = parseASTMMessage(rawPayload);
        await postInternalResult(parsed, rawPayload, parsed.machineId || 'ASTM-TCP');
        socket.write(toASTMAck());
        return;
      }

      await logParseError('Unknown protocol', rawPayload);
      socket.write(toHL7Nack('NACK', 'Unknown protocol'));
    } catch (error) {
      await logParseError(error.message, rawPayload);
      if (protocol === 'ASTM') {
        socket.write(toASTMNack(error.message));
      } else {
        socket.write(toHL7Nack('NACK', error.message));
      }
    }
  });

  socket.on('error', (err) => {
    console.error('TCP socket error:', err.message);
  });
});

server.listen(LISTENER_PORT, '0.0.0.0', async () => {
  await fs.ensureDir(path.join(uploadsDir, 'incoming'));
  await fs.ensureDir(path.join(uploadsDir, 'processed'));
  console.log(`TCP Listener active on port ${LISTENER_PORT}`);
});
