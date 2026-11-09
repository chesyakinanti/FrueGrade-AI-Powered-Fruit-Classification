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

async function runResultTests() {
  const port = 9337;
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

    console.log('--- Subtest A: Contoh Segar -> Pindai Buah -> Result ---');
    await evalCode(`(() => {
      document.querySelector('[data-demo="fresh"]').click();
    })()`);
    await sleep(1000);
    await evalCode(`(() => {
      document.getElementById('analyze-btn').click();
    })()`);
    await sleep(3500); // Wait for simulation + redirect

    const urlA = await evalCode(`window.location.href`);
    console.log('Redirected URL after fresh demo:', urlA);
    if (!urlA.includes('result.html')) throw new Error('Should redirect to result.html');

    const resultA = await evalCode(`(() => {
      const saved = FG.store.load();
      return {
        fruit: saved && saved.result ? saved.result.fruit : null,
        freshness: saved && saved.result ? saved.result.freshness : null
      };
    })()`);
    console.log('Fresh Demo Result in store:', resultA);
    if (resultA.freshness !== 'fresh') throw new Error('Should have freshness fresh');

    console.log('--- Subtest B: Return to upload -> Contoh Busuk -> Pindai Buah -> Result ---');
    await send('Page.navigate', { url: 'http://localhost:4321/upload.html' });
    await sleep(2000);

    await evalCode(`(() => {
      document.querySelector('[data-demo="rotten"]').click();
    })()`);
    await sleep(1000);
    await evalCode(`(() => {
      document.getElementById('analyze-btn').click();
    })()`);
    await sleep(3500); // Wait for simulation + redirect

    const urlB = await evalCode(`window.location.href`);
    console.log('Redirected URL after rotten demo:', urlB);
    if (!urlB.includes('result.html')) throw new Error('Should redirect to result.html');

    const resultB = await evalCode(`(() => {
      const saved = FG.store.load();
      return {
        fruit: saved && saved.result ? saved.result.fruit : null,
        freshness: saved && saved.result ? saved.result.freshness : null
      };
    })()`);
    console.log('Rotten Demo Result in store:', resultB);
    if (resultB.freshness !== 'rotten') throw new Error('Should have freshness rotten');

    console.log('\n>>> BOTH SIMULATION FLOWS VERIFIED SUCCESSFULLY! <<<\n');
    ws.close();
  } finally {
    edge.kill();
  }
}

runResultTests().catch(err => {
  console.error('RESULT TEST FAILED:', err);
  process.exit(1);
});
