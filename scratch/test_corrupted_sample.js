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

async function run() {
  const port = 9338;
  const edge = spawn(edgePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    'http://localhost:4321/upload.html'
  ]);

  try {
    await sleep(2500);
    const tabs = await getTabs(port);
    const target = tabs.find(t => t.url.includes('4321/upload.html'));
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

    async function evalCode(expression) {
      const res = await send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true
      });
      if (res.exceptionDetails) {
        throw new Error('Eval error: ' + JSON.stringify(res.exceptionDetails));
      }
      return res.result ? res.result.value : undefined;
    }

    console.log('--- Step 1: Click "Simulasi gagal" ---');
    await evalCode(`(() => {
      document.querySelector('[data-demo="error"]').click();
    })()`);
    await sleep(1200);

    const check = await evalCode(`(() => {
      const previewImg = document.getElementById('preview-image');
      const fileNameEl = document.getElementById('file-name');
      const statusText = document.getElementById('upload-status-text');
      const analyzeBtn = document.getElementById('analyze-btn');
      const processing = document.getElementById('processing');
      const errorPanel = document.getElementById('error-panel');

      return {
        hasImage: !!(previewImg && previewImg.src),
        fileName: fileNameEl ? fileNameEl.textContent.trim() : '',
        status: statusText ? statusText.textContent.trim() : '',
        btnEnabled: analyzeBtn && !analyzeBtn.disabled,
        progressHidden: processing.hidden || processing.classList.contains('is-hidden'),
        errorHidden: errorPanel.hidden || errorPanel.classList.contains('is-hidden')
      };
    })()`);

    console.log('Corrupted sample check:', check);
    if (!check.hasImage) throw new Error('Preview image should be loaded');
    if (!check.fileName.includes('corrupted')) throw new Error('File name should be sample-corrupted.jpg, got: ' + check.fileName);
    if (!check.btnEnabled) throw new Error('Analyze button should be enabled');
    if (!check.progressHidden) throw new Error('Progress should be hidden');
    if (!check.errorHidden) throw new Error('Error should be hidden before scan');

    // Capture screenshot of the preview
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1200,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false
    });
    await sleep(800);
    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    const screenPath = path.join(__dirname, 'verified_corrupted_preview.png');
    fs.writeFileSync(screenPath, Buffer.from(data, 'base64'));
    console.log('Screenshot saved to:', screenPath);

    console.log('--- Step 2: Click "Pindai Buah" and Verify Simulated Error ---');
    await evalCode(`(() => {
      document.getElementById('analyze-btn').click();
    })()`);
    await sleep(3500);

    const postScanCheck = await evalCode(`(() => {
      const errorPanel = document.getElementById('error-panel');
      const errorCode = document.getElementById('error-code');
      const errorMessage = document.getElementById('error-message');
      const processing = document.getElementById('processing');
      const toast = document.querySelector('.fg-toast, [role="status"], [role="alert"]');
      return {
        errorVisible: !errorPanel.hidden && !errorPanel.classList.contains('is-hidden'),
        progressHidden: processing.hidden || processing.classList.contains('is-hidden'),
        code: errorCode ? errorCode.textContent.trim() : '',
        message: errorMessage ? errorMessage.textContent.trim() : '',
        toastText: toast ? toast.textContent.trim() : ''
      };
    })()`);

    console.log('Post-scan error check (current lang):', postScanCheck);
    if (!postScanCheck.errorVisible) throw new Error('Error panel should be visible after scan finishes');
    if (postScanCheck.code !== 'FILE_CORRUPTED') throw new Error('Expected errorCode FILE_CORRUPTED, got: ' + postScanCheck.code);
    if (!postScanCheck.message.toLowerCase().includes('corrupted') && !postScanCheck.message.toLowerCase().includes('korup')) {
      throw new Error('Expected message mentioning damaged/corrupted or rusak/korup, got: ' + postScanCheck.message);
    }

    console.log('--- Step 3: Test Dynamic Language Switch with Error Panel Active ---');
    // Switch to ID
    await evalCode(`window.FG.i18n.setLang('id')`);
    await sleep(400);
    const idMsg = await evalCode(`document.getElementById('error-message').textContent.trim()`);
    console.log('Error message in ID:', idMsg);
    if (!idMsg.includes('rusak atau korup')) throw new Error('Expected Indonesian corrupted error message, got: ' + idMsg);

    // Switch to EN
    await evalCode(`window.FG.i18n.setLang('en')`);
    await sleep(400);
    const enMsg = await evalCode(`document.getElementById('error-message').textContent.trim()`);
    console.log('Error message in EN:', enMsg);
    if (!enMsg.includes('damaged or corrupted')) throw new Error('Expected English corrupted error message, got: ' + enMsg);

    // Switch back to ID for default
    await evalCode(`window.FG.i18n.setLang('id')`);
    await sleep(400);

    // Capture screenshot of the error panel
    const errShot = await send('Page.captureScreenshot', { format: 'png' });
    const errPath = path.join(__dirname, 'verified_corrupted_error_panel.png');
    fs.writeFileSync(errPath, Buffer.from(errShot.data, 'base64'));
    console.log('Error screenshot saved to:', errPath);

    console.log('\n>>> CORRUPTED SAMPLE AND ERROR SIMULATION VERIFIED SUCCESSFULLY! <<<\n');
    ws.close();
  } finally {
    edge.kill();
  }
}

run().catch(err => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
