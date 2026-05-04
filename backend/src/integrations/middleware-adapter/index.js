import fs from 'fs-extra';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';

const incomingDir = path.join(env.uploadsDir, 'incoming');
const processedDir = path.join(env.uploadsDir, 'processed');
const API_BASE = process.env.API_BASE_URL || 'http://localhost:3001';

async function processCsvFile(filePath) {
  const fileContent = await fs.readFile(filePath, 'utf8');
  const rows = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  for (const row of rows) {
    const analyzerId = row.analyzer_id;
    const machineParam = row.machine_param;
    const mapping = await prisma.analyzerMapping.findFirst({
      where: {
        analyzerId,
        machineParamName: machineParam
      },
      include: {
        analyzer: true,
        testCatalog: true
      }
    });

    if (!mapping) {
      continue;
    }

    const body = {
      tenantId: mapping.analyzer.tenantId,
      orderId: row.order_id,
      patientId: row.patient_id,
      testCode: mapping.testCatalog.code,
      value: row.value,
      unit: row.unit || mapping.testCatalog.unit,
      referenceRange: row.reference_range || mapping.testCatalog.normalRangeMale,
      machineId: mapping.analyzerId,
      rawMessage: JSON.stringify(row),
      timestamp: row.timestamp || new Date().toISOString()
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
      throw new Error(`Failed posting internal result for ${path.basename(filePath)}: ${resp.status} ${txt}`);
    }
  }

  await fs.ensureDir(processedDir);
  const archivePath = path.join(processedDir, `${Date.now()}-${path.basename(filePath)}`);
  await fs.move(filePath, archivePath, { overwrite: true });
}

async function scanIncoming() {
  await fs.ensureDir(incomingDir);
  const files = await fs.readdir(incomingDir);
  const csvFiles = files.filter((f) => f.toLowerCase().endsWith('.csv'));

  for (const file of csvFiles) {
    const full = path.join(incomingDir, file);
    try {
      await processCsvFile(full);
      console.log(`Processed legacy CSV: ${file}`);
    } catch (error) {
      console.error(`Adapter error for ${file}:`, error.message);
    }
  }
}

console.log(`Legacy middleware adapter watching ${incomingDir}`);
scanIncoming();
setInterval(scanIncoming, 5000);
