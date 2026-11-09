const { spawn } = require('child_process');
const http = require('http');
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

async function runStrictTest() {
  const port = 9336;
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

    console.log('================================================================');
    console.log('>>> TEST 1: CLICK "CONTOH SEGAR" & WAIT FULL 10 SECONDS <<<');
    console.log('================================================================');

    // Click Contoh Segar
    await evalCode(`(() => {
      const btn = document.querySelector('[data-demo="fresh"]');
      if (!btn) throw new Error('Contoh Segar button not found');
      btn.click();
    })()`);

    // Monitor the page every second for 10 full seconds
    for (let sec = 1; sec <= 10; sec++) {
      await sleep(1000);
      const stateCheck = await evalCode(`(() => {
        const previewFilled = document.getElementById('preview-filled');
        const analyzeBtn = document.getElementById('analyze-btn');
        const statusText = document.getElementById('upload-status-text');
        const processing = document.getElementById('processing');
        const errorPanel = document.getElementById('error-panel');
        const currentUrl = window.location.href;

        return {
          filledVisible: !previewFilled.hidden && !previewFilled.classList.contains('is-hidden'),
          btnEnabled: !analyzeBtn.disabled,
          statusText: statusText ? statusText.innerText.trim() : '',
          progressHidden: processing.hidden || processing.classList.contains('is-hidden') || processing.classList.contains('hidden'),
          errorHidden: errorPanel.hidden || errorPanel.classList.contains('is-hidden'),
          stillOnUploadPage: currentUrl.includes('upload.html')
        };
      })()`);

      console.log(`[Second ${sec}/10]: status="${stateCheck.statusText}", progressHidden=${stateCheck.progressHidden}, btnEnabled=${stateCheck.btnEnabled}`);

      if (!stateCheck.filledVisible) throw new Error(`Preview was not visible at second ${sec}`);
      if (!stateCheck.btnEnabled) throw new Error(`Scan button was not enabled at second ${sec}`);
      if (!stateCheck.progressHidden) throw new Error(`CRITICAL BUG: Processing progress bar became visible at second ${sec}!`);
      if (!stateCheck.errorHidden) throw new Error(`CRITICAL BUG: Error panel appeared at second ${sec}!`);
      if (!stateCheck.stillOnUploadPage) throw new Error(`CRITICAL BUG: Page redirected away at second ${sec}!`);
      if (!stateCheck.statusText.includes('siap dianalisis') && !stateCheck.statusText.includes('Ready')) {
        throw new Error(`CRITICAL BUG: Status changed away from Image Ready at second ${sec}: "${stateCheck.statusText}"`);
      }
    }
    console.log('>>> SUCCESS: 10 SECONDS ELAPSED WITH ZERO AUTO-ANALYSIS! <<<');

    console.log('\n================================================================');
    console.log('>>> TEST 2: SWITCH TO "CONTOH BUSUK" & WAIT 5 SECONDS <<<');
    console.log('================================================================');
    await evalCode(`(() => {
      document.querySelector('[data-demo="rotten"]').click();
    })()`);
    await sleep(800);

    for (let sec = 1; sec <= 5; sec++) {
      await sleep(1000);
      const stateCheck = await evalCode(`(() => {
        const previewImg = document.getElementById('preview-image');
        const processing = document.getElementById('processing');
        const statusText = document.getElementById('upload-status-text');
        return {
          src: previewImg ? previewImg.src : '',
          progressHidden: processing.hidden || processing.classList.contains('is-hidden'),
          status: statusText ? statusText.innerText.trim() : ''
        };
      })()`);

      console.log(`[Second ${sec}/5]: src="${stateCheck.src.split('/').pop()}", progressHidden=${stateCheck.progressHidden}`);
      if (!stateCheck.progressHidden) throw new Error('Progress must NOT run automatically for Contoh Busuk');
    }
    console.log('>>> SUCCESS: Contoh Busuk switched preview without auto-analysis! <<<');

    console.log('\n================================================================');
    console.log('>>> TEST 3: SWITCH TO "SIMULASI GAGAL" & WAIT 5 SECONDS <<<');
    console.log('================================================================');
    await evalCode(`(() => {
      document.querySelector('[data-demo="error"]').click();
    })()`);
    await sleep(800);

    for (let sec = 1; sec <= 5; sec++) {
      await sleep(1000);
      const stateCheck = await evalCode(`(() => {
        const errorPanel = document.getElementById('error-panel');
        const processing = document.getElementById('processing');
        const statusText = document.getElementById('upload-status-text');
        return {
          errorHidden: errorPanel.hidden || errorPanel.classList.contains('is-hidden'),
          progressHidden: processing.hidden || processing.classList.contains('is-hidden'),
          status: statusText ? statusText.innerText.trim() : ''
        };
      })()`);

      console.log(`[Second ${sec}/5]: errorHidden=${stateCheck.errorHidden}, progressHidden=${stateCheck.progressHidden}`);
      if (!stateCheck.errorHidden) throw new Error('Error must NOT show automatically for Simulasi Gagal');
      if (!stateCheck.progressHidden) throw new Error('Progress must NOT run automatically for Simulasi Gagal');
    }
    console.log('>>> SUCCESS: Simulasi Gagal selected without triggering error or progress! <<<');

    console.log('\n================================================================');
    console.log('>>> TEST 4: CLICK "PINDAI BUAH" FOR SIMULASI GAGAL <<<');
    console.log('================================================================');
    const triggerErrorCheck = await evalCode(`(async () => {
      const analyzeBtn = document.getElementById('analyze-btn');
      analyzeBtn.click(); // Now explicitly click Pindai Buah
      await new Promise(r => setTimeout(r, 100));

      const processing = document.getElementById('processing');
      const analyzeBtnNow = document.getElementById('analyze-btn');

      const duringState = {
        progressVisible: !processing.hidden && !processing.classList.contains('is-hidden'),
        btnDisabled: analyzeBtnNow.disabled
      };

      // Wait 3.5 seconds for mock error failure
      await new Promise(r => setTimeout(r, 3500));

      const errorPanel = document.getElementById('error-panel');
      const afterState = {
        errorVisible: !errorPanel.hidden && !errorPanel.classList.contains('is-hidden'),
        btnUnlocked: !analyzeBtnNow.disabled
      };

      return { during: duringState, after: afterState };
    })()`);

    console.log('Trigger error check:', triggerErrorCheck);
    if (!triggerErrorCheck.during.progressVisible) throw new Error('Progress must be visible during scan');
    if (!triggerErrorCheck.during.btnDisabled) throw new Error('Button must be disabled during scan');
    if (!triggerErrorCheck.after.errorVisible) throw new Error('Error must be visible after scan finishes');
    if (!triggerErrorCheck.after.btnUnlocked) throw new Error('Buttons must unlock after failure');
    console.log('>>> SUCCESS: Simulasi Gagal executed ONLY after clicking Pindai Buah! <<<');

    console.log('\n================================================================');
    console.log('>>> ALL STRICT TESTS PASSED PERFECTLY! <<<');
    console.log('================================================================\n');

    ws.close();
  } finally {
    edge.kill();
  }
}

runStrictTest().catch(err => {
  console.error('STRICT TEST FAILED:', err);
  process.exit(1);
});
