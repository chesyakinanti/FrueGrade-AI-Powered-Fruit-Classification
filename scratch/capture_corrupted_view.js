const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const profileDir = path.join(__dirname, 'edge_temp_profile');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function getTabs(port) {
  return new Promise((res, rej) => {
    http.get('http://127.0.0.1:' + port + '/json', r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => res(JSON.parse(d)));
    }).on('error', rej);
  });
}

async function capture() {
  const port = 9339;
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=' + port,
    '--user-data-dir=' + profileDir,
    '--window-size=1200,900',
    'http://localhost:4321/upload.html'
  ]);

  try {
    await sleep(2000);
    const tabs = await getTabs(port);
    const target = tabs.find(t => t.url.includes('4321'));
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let id = 1;
    function send(method, params = {}) {
      return new Promise(r => {
        const msgId = id++;
        const handler = e => {
          const resp = JSON.parse(e.data);
          if (resp.id === msgId) {
            ws.removeEventListener('message', handler);
            r(resp.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    // Click demo error
    await send('Runtime.evaluate', { expression: `document.querySelector('[data-demo="error"]').click()` });
    await sleep(1500);
    // Scroll preview into view
    await send('Runtime.evaluate', { expression: `document.getElementById('preview-card').scrollIntoView({ block: 'center' })` });
    await sleep(800);

    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(__dirname, 'corrupted_card_screenshot.png'), Buffer.from(data, 'base64'));
    console.log('Saved screenshot successfully');
    ws.close();
  } finally {
    edge.kill();
  }
}
capture();
