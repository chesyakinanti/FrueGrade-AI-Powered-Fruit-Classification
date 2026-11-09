const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const profileDir = path.join(__dirname, 'edge_temp_profile');

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function getTabs(port) {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${port}/json`, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function capture(width, height, outFile, targetUrl = 'http://localhost:4321/#supported-fruits') {
  const port = 9334;
  const edge = spawn(edgePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    `--window-size=${width},${height}`,
    targetUrl
  ]);

  try {
    await sleep(2000);
    const tabs = await getTabs(port);
    const target = tabs.find(t => t.url.includes('4321'));
    if (!target) throw new Error('Target tab not found');

    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let msgId = 1;
    function send(method, params = {}) {
      return new Promise((resolve) => {
        const id = msgId++;
        const handler = (evt) => {
          const resp = JSON.parse(evt.data);
          if (resp.id === id) {
            ws.removeEventListener('message', handler);
            resolve(resp.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    // Set viewport
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 768
    });

    // Scroll directly to supported-fruits section
    await send('Runtime.evaluate', {
      expression: `
        const el = document.getElementById('supported-fruits');
        if (el) { el.scrollIntoView({ behavior: 'instant', block: 'start' }); }
      `
    });

    // Wait for scroll and images
    await sleep(2000);

    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(outFile, Buffer.from(data, 'base64'));
    console.log(`Saved screenshot to ${outFile}`);
    ws.close();
  } finally {
    edge.kill();
    await sleep(500);
  }
}

async function main() {
  console.log('Capturing compact supported fruits on Desktop (1280x950)...');
  await capture(1280, 950, path.join(__dirname, 'verified_compact_desktop.png'));

  console.log('Capturing compact supported fruits on Mobile (390x844)...');
  await capture(390, 844, path.join(__dirname, 'verified_compact_mobile.png'));

  console.log('All captures done!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
