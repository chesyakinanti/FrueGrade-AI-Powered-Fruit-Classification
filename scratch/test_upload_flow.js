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
  const port = 9334;
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

    console.log('--- Step 1: Initial State Check ---');
    const initCheck = await evalCode(`(() => {
      const previewEmpty = document.getElementById('preview-empty');
      const previewFilled = document.getElementById('preview-filled');
      const analyzeBtn = document.getElementById('analyze-btn');
      const statusText = document.getElementById('upload-status-text');
      return {
        emptyHidden: previewEmpty.hidden,
        filledHidden: previewFilled.hidden,
        btnDisabled: analyzeBtn.disabled,
        btnText: analyzeBtn.innerText.trim(),
        status: statusText ? statusText.innerText.trim() : ''
      };
    })()`);
    console.log('Init check:', initCheck);
    if (initCheck.filledHidden !== true) throw new Error('Preview filled should be hidden initially');
    if (initCheck.btnDisabled !== true) throw new Error('Analyze button should be disabled initially');

    console.log('--- Step 2: Load Sample / Image Validation (Without Auto-Analyze) ---');
    const loadResult = await evalCode(`(async () => {
      const file = await FG.api.sampleFile('apple');
      // Set input file via dataTransfer / direct handleFile
      const fileInput = document.getElementById('file-input');
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInput.files = dt.files;
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise(r => setTimeout(r, 600));

      const previewFilled = document.getElementById('preview-filled');
      const analyzeBtn = document.getElementById('analyze-btn');
      const statusText = document.getElementById('upload-status-text');
      const replaceBtn = document.getElementById('btn-replace');
      const removeBtn = document.getElementById('btn-remove');
      const retakeBtn = document.getElementById('btn-retake-camera');
      const processing = document.getElementById('processing');

      return {
        filledHidden: previewFilled.hidden,
        btnDisabled: analyzeBtn.disabled,
        btnText: analyzeBtn.innerText.trim(),
        status: statusText ? statusText.innerText.trim() : '',
        replaceDisabled: replaceBtn.disabled,
        removeDisabled: removeBtn.disabled,
        retakeDisabled: retakeBtn.disabled,
        progressHidden: processing.hidden || processing.classList.contains('hidden') || processing.classList.contains('is-hidden')
      };
    })()`);
    console.log('After image select check:', loadResult);
    if (loadResult.filledHidden !== false) throw new Error('Preview filled must be visible after valid image');
    if (loadResult.btnDisabled !== false) throw new Error('Pindai Buah button must be ENABLED');
    if (!loadResult.btnText.includes('Pindai Buah')) throw new Error('Button text should be Pindai Buah');
    if (!loadResult.status.includes('siap dianalisis')) throw new Error('Status should be Gambar siap dianalisis');
    if (loadResult.progressHidden !== true) throw new Error('Analysis must NOT have started automatically!');

    console.log('--- Step 3: Test Remove Action ---');
    const removeCheck = await evalCode(`(() => {
      const removeBtn = document.getElementById('btn-remove');
      removeBtn.click();
      const previewEmpty = document.getElementById('preview-empty');
      const previewFilled = document.getElementById('preview-filled');
      return {
        emptyHidden: previewEmpty.hidden,
        filledHidden: previewFilled.hidden
      };
    })()`);
    console.log('After remove check:', removeCheck);
    if (removeCheck.filledHidden !== true) throw new Error('Preview should reset after remove');

    console.log('--- Step 4: Test Demo Scenario Click (Must NOT Auto Analyze) ---');
    const demoClickCheck = await evalCode(`(async () => {
      const freshDemoBtn = document.querySelector('[data-demo="fresh"]');
      if (!freshDemoBtn) throw new Error('Demo button not found');
      freshDemoBtn.click();
      // Wait 1200ms to ensure no timeout auto-runs analyze
      await new Promise(r => setTimeout(r, 1200));

      const previewFilled = document.getElementById('preview-filled');
      const analyzeBtn = document.getElementById('analyze-btn');
      const statusText = document.getElementById('upload-status-text');
      const processing = document.getElementById('processing');
      const replaceBtn = document.getElementById('btn-replace');
      const removeBtn = document.getElementById('btn-remove');

      return {
        filledHidden: previewFilled.hidden,
        btnDisabled: analyzeBtn.disabled,
        btnText: analyzeBtn.innerText.trim(),
        status: statusText ? statusText.innerText.trim() : '',
        replaceDisabled: replaceBtn.disabled,
        removeDisabled: removeBtn.disabled,
        progressHidden: processing.hidden || processing.classList.contains('hidden') || processing.classList.contains('is-hidden')
      };
    })()`);
    console.log('After demo button click check:', demoClickCheck);
    if (demoClickCheck.filledHidden !== false) throw new Error('Preview filled must be visible after clicking demo');
    if (demoClickCheck.btnDisabled !== false) throw new Error('Pindai Buah button must be ENABLED after clicking demo');
    if (!demoClickCheck.status.includes('siap dianalisis')) throw new Error('Status should be Gambar siap dianalisis');
    if (demoClickCheck.progressHidden !== true) throw new Error('DEMO SCENARIO MUST NOT AUTO ANALYZE!');

    console.log('--- Step 5: Click "Pindai Buah" and Verify Locked State ---');
    const scanTriggerCheck = await evalCode(`(async () => {
      const analyzeBtn = document.getElementById('analyze-btn');
      analyzeBtn.click(); // Manual click
      await new Promise(r => setTimeout(r, 100));

      const replaceBtn = document.getElementById('btn-replace');
      const removeBtn = document.getElementById('btn-remove');
      const retakeBtn = document.getElementById('btn-retake-camera');
      const processing = document.getElementById('processing');

      return {
        btnDisabled: analyzeBtn.disabled,
        btnText: analyzeBtn.innerText.trim(),
        replaceDisabled: replaceBtn.disabled,
        removeDisabled: removeBtn.disabled,
        retakeDisabled: retakeBtn.disabled,
        progressVisible: !processing.hidden && !processing.classList.contains('is-hidden')
      };
    })()`);
    console.log('After clicking Pindai Buah check:', scanTriggerCheck);
    if (scanTriggerCheck.btnDisabled !== true) throw new Error('Analyze button should be disabled during analysis');
    if (scanTriggerCheck.replaceDisabled !== true) throw new Error('Replace button should be disabled during analysis');
    if (scanTriggerCheck.removeDisabled !== true) throw new Error('Remove button should be disabled during analysis');
    if (scanTriggerCheck.retakeDisabled !== true) throw new Error('Retake button should be disabled during analysis');
    if (scanTriggerCheck.progressVisible !== true) throw new Error('Progress animation should be running now');

    console.log('ALL 5 TEST CRITERIA PASSED SUCCESSFULLY!');
    ws.close();
  } finally {
    edge.kill();
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
