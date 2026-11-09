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
  const port = 9339;
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

    // Set language to ID first
    await evalCode(`window.FG.i18n.setLang('id')`);
    await sleep(300);

    console.log('--- Test 1: Click "Simulasi gagal" ---');
    await evalCode(`document.querySelector('[data-demo="error"]').click()`);
    await sleep(1500);

    const corruptedState = await evalCode(`(() => {
      const previewImg = document.getElementById('preview-image');
      const statusText = document.getElementById('upload-status-text');
      const statusChip = document.getElementById('upload-status');
      const cardTitle = document.getElementById('preview-card-title');
      const analyzeBtn = document.getElementById('analyze-btn');
      const analyzeHint = document.getElementById('analyze-hint');
      const errorPanel = document.getElementById('error-panel');
      const errorCode = document.getElementById('error-code');
      const errorMsg = document.getElementById('error-message');

      return {
        hasImage: !!(previewImg && previewImg.src),
        statusText: statusText ? statusText.textContent.trim() : '',
        isErrorChip: statusChip ? statusChip.classList.contains('chip-error') || statusChip.classList.contains('chip-rotten') : false,
        cardTitle: cardTitle ? cardTitle.textContent.trim() : '',
        btnDisabled: analyzeBtn ? analyzeBtn.disabled : false,
        btnAriaDisabled: analyzeBtn ? analyzeBtn.getAttribute('aria-disabled') : '',
        hintText: analyzeHint ? analyzeHint.textContent.trim() : '',
        errorVisible: errorPanel ? (!errorPanel.hidden && !errorPanel.classList.contains('is-hidden')) : false,
        errorCode: errorCode ? errorCode.textContent.trim() : '',
        errorMsg: errorMsg ? errorMsg.textContent.trim() : ''
      };
    })()`);

    console.log('Corrupted State Result (ID):', corruptedState);

    if (!corruptedState.hasImage) throw new Error('Preview image should be loaded');
    if (corruptedState.statusText !== 'Berkas rusak / korup') {
      throw new Error('Expected statusText "Berkas rusak / korup", got: ' + corruptedState.statusText);
    }
    if (!corruptedState.isErrorChip) throw new Error('Status chip should have error styling class');
    if (corruptedState.cardTitle !== 'Berkas gambar rusak') {
      throw new Error('Expected cardTitle "Berkas gambar rusak", got: ' + corruptedState.cardTitle);
    }
    if (!corruptedState.btnDisabled || corruptedState.btnAriaDisabled !== 'true') {
      throw new Error('Analyze button MUST be disabled ("gabisa pindai")');
    }
    if (!corruptedState.hintText.includes('tidak dapat dianalisis')) {
      throw new Error('Expected hint text to mention file cannot be analyzed');
    }
    if (!corruptedState.errorVisible) throw new Error('Error panel should be directly visible');
    if (corruptedState.errorCode !== 'FILE_CORRUPTED') {
      throw new Error('Expected errorCode FILE_CORRUPTED, got: ' + corruptedState.errorCode);
    }

    // Try clicking analyzeBtn - should remain blocked
    await evalCode(`document.getElementById('analyze-btn').click()`);
    await sleep(500);
    const stillBlocked = await evalCode(`(() => {
      const processing = document.getElementById('processing');
      return processing.hidden || processing.classList.contains('is-hidden');
    })()`);
    if (!stillBlocked) throw new Error('Analyze button click should NOT start processing when file is corrupted');

    // Take screenshot of the corrupted UI
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });
    await sleep(500);
    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    const screenPath = path.join(__dirname, 'verified_corrupted_blocked.png');
    fs.writeFileSync(screenPath, Buffer.from(data, 'base64'));
    console.log('Screenshot saved to:', screenPath);

    console.log('--- Test 2: Switch to English (EN) ---');
    await evalCode(`window.FG.i18n.setLang('en')`);
    await sleep(400);

    const enState = await evalCode(`(() => {
      const statusText = document.getElementById('upload-status-text');
      const cardTitle = document.getElementById('preview-card-title');
      const analyzeHint = document.getElementById('analyze-hint');
      const errorMsg = document.getElementById('error-message');
      const analyzeBtn = document.getElementById('analyze-btn');

      return {
        statusText: statusText ? statusText.textContent.trim() : '',
        cardTitle: cardTitle ? cardTitle.textContent.trim() : '',
        hintText: analyzeHint ? analyzeHint.textContent.trim() : '',
        errorMsg: errorMsg ? errorMsg.textContent.trim() : '',
        btnDisabled: analyzeBtn ? analyzeBtn.disabled : false
      };
    })()`);

    console.log('Corrupted State Result (EN):', enState);
    if (enState.statusText !== 'Corrupted file') throw new Error('Expected EN status "Corrupted file", got: ' + enState.statusText);
    if (enState.cardTitle !== 'Corrupted image file') throw new Error('Expected EN cardTitle "Corrupted image file", got: ' + enState.cardTitle);
    if (!enState.btnDisabled) throw new Error('Analyze button must remain disabled in EN');
    if (!enState.errorMsg.includes('damaged or corrupted')) throw new Error('Expected EN error message, got: ' + enState.errorMsg);

    console.log('--- Test 3: Switch to "Contoh segar" (Recovery) ---');
    await evalCode(`document.querySelector('[data-demo="fresh"]').click()`);
    await sleep(1500);

    const freshState = await evalCode(`(() => {
      const statusText = document.getElementById('upload-status-text');
      const cardTitle = document.getElementById('preview-card-title');
      const analyzeBtn = document.getElementById('analyze-btn');
      const errorPanel = document.getElementById('error-panel');

      return {
        statusText: statusText ? statusText.textContent.trim() : '',
        cardTitle: cardTitle ? cardTitle.textContent.trim() : '',
        btnDisabled: analyzeBtn ? analyzeBtn.disabled : true,
        errorHidden: errorPanel ? (errorPanel.hidden || errorPanel.classList.contains('is-hidden')) : false
      };
    })()`);

    console.log('Fresh Sample State (EN):', freshState);
    if (freshState.statusText !== 'Image Ready') throw new Error('Expected status "Image Ready"');
    if (freshState.cardTitle !== 'Image ready for analysis') throw new Error('Expected cardTitle "Image ready for analysis"');
    if (freshState.btnDisabled) throw new Error('Analyze button should now be enabled for fresh sample');
    if (!freshState.errorHidden) throw new Error('Error panel should now be cleared/hidden');

    console.log('\n>>> ALL CORRUPTED BLOCKED TESTS PASSED PERFECTLY! <<<\n');
    ws.close();
  } finally {
    edge.kill();
  }
}

run().catch(err => {
  console.error('TEST SUITE FAILED:', err);
  process.exit(1);
});
