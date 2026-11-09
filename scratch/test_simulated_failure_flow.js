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
  const port = 9340;
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

    // Set to ID
    await evalCode(`window.FG.i18n.setLang('id')`);
    await sleep(300);

    console.log('=== TEST 1: Upload File Rusak Asli (Unreadable Image) ===');
    const actualCorruptResult = await evalCode(`(async () => {
      // Buat file rusak biner/teks yang tidak bisa di-decode oleh peramban
      const invalidBlob = new Blob(['BOGUS_NON_IMAGE_DATA_CORRUPTED_STREAM_12345'], { type: 'image/jpeg' });
      const badFile = new File([invalidBlob], 'actual-broken-file.jpg', { type: 'image/jpeg' });

      // Simulasikan pemilihan file asli lewat file input
      const dt = new DataTransfer();
      dt.items.add(badFile);
      const fileInput = document.getElementById('file-input');
      fileInput.files = dt.files;
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));

      // Beri sedikit jeda agar proses decoding asynchronous selesai dan ditolak
      await new Promise(r => setTimeout(r, 600));

      const previewFilled = document.getElementById('preview-filled');
      const analyzeBtn = document.getElementById('analyze-btn');
      const errorCode = document.getElementById('error-code');
      const errorMsg = document.getElementById('error-message');
      const errorPanel = document.getElementById('error-panel');

      return {
        previewHidden: previewFilled.hidden || previewFilled.classList.contains('is-hidden'),
        btnDisabled: analyzeBtn.disabled,
        errorVisible: !errorPanel.hidden && !errorPanel.classList.contains('is-hidden'),
        code: errorCode ? errorCode.textContent.trim() : '',
        msg: errorMsg ? errorMsg.textContent.trim() : ''
      };
    })()`);

    console.log('Actual corrupt file upload check:', actualCorruptResult);
    if (!actualCorruptResult.previewHidden) throw new Error('Preview must remain hidden when actual corrupt file is uploaded');
    if (!actualCorruptResult.btnDisabled) throw new Error('Analyze button must remain disabled when corrupt file is uploaded');
    if (!actualCorruptResult.errorVisible) throw new Error('Error panel must show for corrupt file');
    if (actualCorruptResult.code !== 'UNREADABLE_IMAGE') throw new Error('Expected UNREADABLE_IMAGE, got: ' + actualCorruptResult.code);
    console.log('✓ Test 1 Passed: File rusak asli langsung ditolak, status UNREADABLE_IMAGE, tombol Pindai Buah nonaktif.\n');

    console.log('=== TEST 2: Pilih Skenario Simulasi Gagal ===');
    await evalCode(`document.querySelector('[data-demo="error"]').click()`);
    await sleep(1500);

    const demoSelectionResult = await evalCode(`(() => {
      const previewImg = document.getElementById('preview-image');
      const statusText = document.getElementById('upload-status-text');
      const statusChip = document.getElementById('upload-status');
      const cardTitle = document.getElementById('preview-card-title');
      const analyzeBtn = document.getElementById('analyze-btn');
      const analyzeHint = document.getElementById('analyze-hint');
      const processing = document.getElementById('processing');
      const errorPanel = document.getElementById('error-panel');

      return {
        hasImage: !!(previewImg && previewImg.src),
        statusText: statusText ? statusText.textContent.trim() : '',
        chipClass: statusChip ? statusChip.className : '',
        cardTitle: cardTitle ? cardTitle.textContent.trim() : '',
        btnDisabled: analyzeBtn ? analyzeBtn.disabled : true,
        btnAriaDisabled: analyzeBtn ? analyzeBtn.getAttribute('aria-disabled') : '',
        hintText: analyzeHint ? analyzeHint.textContent.trim() : '',
        progressHidden: processing.hidden || processing.classList.contains('is-hidden'),
        errorHidden: errorPanel.hidden || errorPanel.classList.contains('is-hidden')
      };
    })()`);

    console.log('Simulasi Gagal selection check:', demoSelectionResult);
    if (!demoSelectionResult.hasImage) throw new Error('Sample image must be loaded into preview');
    if (demoSelectionResult.statusText !== 'Skenario simulasi kegagalan') {
      throw new Error('Expected status "Skenario simulasi kegagalan", got: ' + demoSelectionResult.statusText);
    }
    if (demoSelectionResult.cardTitle !== 'Skenario simulasi kegagalan') {
      throw new Error('Expected cardTitle "Skenario simulasi kegagalan", got: ' + demoSelectionResult.cardTitle);
    }
    if (demoSelectionResult.btnDisabled || demoSelectionResult.btnAriaDisabled === 'true') {
      throw new Error('Tombol Pindai Buah MUST be active and enabled for Simulasi Gagal scenario');
    }
    if (!demoSelectionResult.errorHidden) throw new Error('Error panel must NOT be visible before scanning is clicked');
    if (!demoSelectionResult.progressHidden) throw new Error('Progress must NOT be running before scanning is clicked');
    console.log('✓ Test 2 Passed: Preview tampil, status "Skenario simulasi kegagalan", tombol Pindai Buah aktif, belum ada error.\n');

    console.log('=== TEST 3: Tunggu 10 Detik (Pastikan Tidak Ada Auto-Analysis / Auto-Error) ===');
    for (let sec = 1; sec <= 10; sec++) {
      await sleep(1000);
      const intermediate = await evalCode(`(() => {
        const processing = document.getElementById('processing');
        const errorPanel = document.getElementById('error-panel');
        const analyzeBtn = document.getElementById('analyze-btn');
        return {
          processingHidden: processing.hidden || processing.classList.contains('is-hidden'),
          errorHidden: errorPanel.hidden || errorPanel.classList.contains('is-hidden'),
          btnDisabled: analyzeBtn.disabled
        };
      })()`);
      if (!intermediate.processingHidden) throw new Error(`Auto-analysis started prematurely at second ${sec}!`);
      if (!intermediate.errorHidden) throw new Error(`Auto-error appeared prematurely at second ${sec}!`);
      if (intermediate.btnDisabled) throw new Error(`Button got disabled prematurely at second ${sec}!`);
    }
    console.log('✓ Test 3 Passed: Setelah 10 detik penuh, tidak ada proses analisis atau error yang berjalan otomatis.\n');

    console.log('=== TEST 4: Klik Pindai Buah (Eksekusi Simulasi Kegagalan) ===');
    await evalCode(`document.getElementById('analyze-btn').click()`);
    await sleep(500);

    const duringScan = await evalCode(`(() => {
      const processing = document.getElementById('processing');
      const analyzeBtn = document.getElementById('analyze-btn');
      return {
        processingVisible: !processing.hidden && !processing.classList.contains('is-hidden'),
        btnDisabled: analyzeBtn.disabled
      };
    })()`);
    console.log('During scan state:', duringScan);
    if (!duringScan.processingVisible) throw new Error('Processing indicator should appear after clicking Pindai Buah');

    // Wait for simulation to finish (~2.5s)
    await sleep(3500);

    const postScanResult = await evalCode(`(() => {
      const errorPanel = document.getElementById('error-panel');
      const errorCode = document.getElementById('error-code');
      const errorMsg = document.getElementById('error-message');
      const processing = document.getElementById('processing');
      const analyzeBtn = document.getElementById('analyze-btn');

      return {
        errorVisible: !errorPanel.hidden && !errorPanel.classList.contains('is-hidden'),
        progressHidden: processing.hidden || processing.classList.contains('is-hidden'),
        code: errorCode ? errorCode.textContent.trim() : '',
        msg: errorMsg ? errorMsg.textContent.trim() : '',
        btnReadyAgain: !analyzeBtn.disabled
      };
    })()`);

    console.log('Post-scan error result:', postScanResult);
    if (!postScanResult.errorVisible) throw new Error('Error panel should be visible after scan finishes');
    if (postScanResult.code !== 'SIMULATED_ERROR') throw new Error('Expected errorCode SIMULATED_ERROR, got: ' + postScanResult.code);
    if (!postScanResult.msg.includes('disimulasikan')) throw new Error('Expected simulated failure explanation in error message, got: ' + postScanResult.msg);
    if (!postScanResult.progressHidden) throw new Error('Progress indicator should be hidden after error');
    if (!postScanResult.btnReadyAgain) throw new Error('Analyze button should be re-enabled for retry');
    console.log('✓ Test 4 Passed: Baru setelah tombol diklik, animasi analisis berjalan dan error SIMULATED_ERROR muncul.\n');

    console.log('=== TEST 5: Pengujian Bilingual (ID <-> EN) ===');
    await evalCode(`window.FG.i18n.setLang('en')`);
    await sleep(300);
    const enErrorMsg = await evalCode(`document.getElementById('error-message').textContent.trim()`);
    console.log('EN Error message:', enErrorMsg);
    if (!enErrorMsg.includes('simulated')) throw new Error('Expected English translation of simulated error');

    // Switch back to ID
    await evalCode(`window.FG.i18n.setLang('id')`);
    await sleep(300);
    console.log('✓ Test 5 Passed: Penerjemahan bahasa dinamis berfungsi sempurna.\n');

    console.log('=== TEST 6: Beralih ke Skenario Segar (Normal Flow Recovery) ===');
    await evalCode(`document.querySelector('[data-demo="fresh"]').click()`);
    await sleep(1500);
    const freshCheck = await evalCode(`(() => {
      const statusText = document.getElementById('upload-status-text');
      const errorPanel = document.getElementById('error-panel');
      const analyzeBtn = document.getElementById('analyze-btn');
      return {
        status: statusText.textContent.trim(),
        errorHidden: errorPanel.hidden || errorPanel.classList.contains('is-hidden'),
        btnEnabled: !analyzeBtn.disabled
      };
    })()`);
    console.log('Fresh recovery check:', freshCheck);
    if (freshCheck.status !== 'Gambar siap dianalisis') throw new Error('Expected Gambar siap dianalisis');
    if (!freshCheck.errorHidden) throw new Error('Error panel must be cleared when switching scenarios');
    if (!freshCheck.btnEnabled) throw new Error('Analyze button must be enabled');
    console.log('✓ Test 6 Passed: Pemulihan ke skenario segar berjalan normal.\n');

    console.log('\n=============================================================');
    console.log('>>> SELURUH PENGUJIAN SKENARIO SIMULASI GAGAL LULUS 100%! <<<');
    console.log('=============================================================\n');

    ws.close();
  } finally {
    edge.kill();
  }
}

run().catch(err => {
  console.error('\n❌ PENGUJIAN GAGAL:', err);
  process.exit(1);
});
