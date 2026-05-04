import net from 'net';

const host = process.env.SIM_TARGET_HOST || 'tcp-listener';
const port = Number(process.env.SIM_TARGET_PORT || process.env.TCP_LISTENER_PORT || 5000);
const interval = Number(process.env.MOCK_SIM_INTERVAL || 15000);

function rand(min, max, decimals = 2) {
  return (Math.random() * (max - min) + min).toFixed(decimals);
}

function buildMessage() {
  const orderId = `ORD-${Date.now()}`;
  const patientId = 'PAT-0001';
  const tests = [
    { code: 'WBC', name: 'White Blood Cells', value: rand(4.2, 11.5), unit: '10^3/uL', range: '4.0-10.0' },
    { code: 'RBC', name: 'Red Blood Cells', value: rand(4.1, 5.9), unit: '10^6/uL', range: '4.2-5.8' },
    { code: 'HGB', name: 'Hemoglobin', value: rand(10.5, 16.8), unit: 'g/dL', range: '12.0-16.0' },
    { code: 'HCT', name: 'Hematocrit', value: rand(33, 50), unit: '%', range: '36-48' },
    { code: 'PLT', name: 'Platelets', value: rand(140, 460), unit: '10^3/uL', range: '150-450' }
  ];

  const abnormalIndex = Math.floor(Math.random() * tests.length);
  tests[abnormalIndex].value = rand(0.5, 2.0);

  const msh = `MSH|^~\\&|SIMULATOR|LAB|LIMS|LAB|${new Date().toISOString()}||ORU^R01|${orderId}|P|2.3`;
  const pid = `PID|1||${patientId}||Demo^Patient||19900101|M`;
  const obr = `OBR|1|${orderId}|${orderId}|CBC^Complete Blood Count`;
  const obx = tests
    .map((t, idx) => `OBX|${idx + 1}|NM|${t.code}^${t.name}|1|${t.value}|${t.unit}|${t.range}|`)
    .join('\r');

  return `${msh}\r${pid}\r${obr}\r${obx}\r`;
}

function sendOnce() {
  const client = new net.Socket();
  client.connect(port, host, () => {
    const msg = buildMessage();
    client.write(msg);
  });

  client.on('data', (d) => {
    console.log('Simulator ACK:', d.toString('utf8').trim());
    client.destroy();
  });

  client.on('error', (err) => {
    console.error('Simulator error:', err.message);
    client.destroy();
  });
}

console.log(`Mock simulator started. Sending CBC HL7 every ${interval}ms to ${host}:${port}`);
sendOnce();
setInterval(sendOnce, interval);
