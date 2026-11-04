/* ============================================================
   FruGrade — API layer
   Ganti FG.config.mode = 'live' untuk memakai Flask.
   Kontrak:
     POST /predict  (multipart/form-data, field: file)
     200 { ok, fruit, freshness, label, confidence, probabilities[], latency_ms }
     4xx/5xx { ok:false, code, message }
   ============================================================ */
(function () {
  'use strict';

  window.FG = window.FG || {};

  var LABEL = { fresh: 'Fresh', rotten: 'Rotten' };
  var FRUIT_EN = { apple: 'Apple', orange: 'Orange', banana: 'Banana' };

  function humanLabel(fruit, freshness) {
    return (LABEL[freshness] || 'Class') + ' ' + (FRUIT_EN[fruit] || 'Fruit');
  }

  function distribution(fruit, freshness, confidence) {
    var selected = humanLabel(fruit, freshness);
    var p = [{ label: selected, p: confidence }];
    var rest = 1 - confidence;
    var others = [];
    Object.keys(FRUIT_EN).forEach(function (id) {
      ['fresh', 'rotten'].forEach(function (fr) {
        var label = humanLabel(id, fr);
        if (label !== selected) others.push(label);
      });
    });
    // Distribusi sisa probabilitas, menurun
    var weights = [0.55, 0.27, 0.12, 0.06];
    others.slice(0, 4).forEach(function (label, i) {
      p.push({ label: label, p: +(rest * weights[i]).toFixed(4) });
    });
    return p.sort(function (a, b) { return b.p - a.p; });
  }

  function guessFruit(name) {
    var n = String(name || '').toLowerCase();
    if (/apel|apple|malus/.test(n)) return 'apple';
    if (/jeruk|orange|citrus/.test(n)) return 'orange';
    if (/pisang|banana|musa/.test(n)) return 'banana';
    return null;
  }

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function mockPayload(file, scenario) {
    var guess = guessFruit(file && file.name);

    if (scenario === 'rotten') {
      var rottenFruit = guess || pick(['apple', 'banana', 'orange']);
      return {
        ok: true,
        fruit: rottenFruit,
        freshness: 'rotten',
        label: humanLabel(rottenFruit, 'rotten'),
        confidence: 0.913,
        probabilities: distribution(rottenFruit, 'rotten', 0.913),
        latency_ms: null,
        model: FG.config.model.name + ' ' + FG.config.model.version,
        mock: true
      };
    }

    if (scenario === 'fresh' || !scenario) {
      var freshFruit = guess || pick(['apple', 'orange', 'banana']);
      var conf = freshFruit === 'apple' ? 0.948 : (freshFruit === 'orange' ? 0.921 : 0.936);
      return {
        ok: true,
        fruit: freshFruit,
        freshness: 'fresh',
        label: humanLabel(freshFruit, 'fresh'),
        confidence: conf,
        probabilities: distribution(freshFruit, 'fresh', conf),
        latency_ms: null,
        model: FG.config.model.name + ' ' + FG.config.model.version,
        mock: true
      };
    }

    return null;
  }

  FG.api = {
    forcedScenario: null,

    /** @param {File} file */
    predict: function (file) {
      // Satu pintu masuk untuk UI: mock atau live dipilih di sini.
      if (FG.config.mode === 'live') return this.live(file);

      var scenario = this.forcedScenario || FG.config.scenario || null;
      var delay = scenario === 'slow' ? 6500 : 1900 + Math.random() * 700;

      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          if (scenario === 'error') {
            var err = new Error('Model gagal memproses gambar. Coba lagi dengan foto lain.');
            err.code = 'PREDICTION_FAILED';
            reject(err);
            return;
          }
          var payload = mockPayload(file, scenario === 'slow' ? 'fresh' : scenario);
          if (!payload) {
            var e2 = new Error('Skenario tidak dikenal.');
            e2.code = 'BAD_SCENARIO';
            reject(e2);
            return;
          }
          resolve(payload);
        }, FG.util.prefersReduced() ? Math.min(delay, 800) : delay);
      });
    },

    live: function (file) {
      var cfg = FG.config;
      var url = (cfg.apiBase || '') + cfg.predictPath;
      var form = new FormData();
      form.append('file', file, file.name || 'fruit.jpg');

      var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var timer = setTimeout(function () {
        if (controller) controller.abort();
      }, cfg.requestTimeout);

      return fetch(url, {
        method: 'POST',
        body: form,
        headers: { Accept: 'application/json' },
        signal: controller ? controller.signal : undefined
      })
        .then(function (res) {
          clearTimeout(timer);
          return res.json().catch(function () { return null; }).then(function (body) {
            if (!res.ok || !body || body.ok === false) {
              var msg = (body && body.message) || 'Prediksi gagal. Coba lagi.';
              var code = (body && body.code) || ('HTTP_' + res.status);
              var err = new Error(msg);
              err.code = code;
              throw err;
            }
            return body;
          });
        })
        .then(function (body) {
          // Normalisasi nama field umum
          var out = {
            ok: true,
            fruit: body.fruit || body.fruit_type || body.class_fruit || null,
            freshness: body.freshness || body.status || null,
            label: body.label || body.predicted_label || null,
            confidence: typeof body.confidence === 'number' ? body.confidence : (typeof body.score === 'number' ? body.score : null),
            probabilities: Array.isArray(body.probabilities) ? body.probabilities : null,
            latency_ms: typeof body.latency_ms === 'number' ? body.latency_ms : null,
            model: body.model || (FG.config.model.name + ' ' + FG.config.model.version),
            mock: false
          };

          if (!out.fruit && out.label) {
            var match = String(out.label).toLowerCase();
            if (/apple|apel/.test(match)) out.fruit = 'apple';
            else if (/orange|jeruk/.test(match)) out.fruit = 'orange';
            else if (/banana|pisang/.test(match)) out.fruit = 'banana';
          }
          if (!out.freshness && out.label) {
            var l = String(out.label).toLowerCase();
            if (/rotten|busuk/.test(l)) out.freshness = 'rotten';
            else if (/fresh|segar/.test(l)) out.freshness = 'fresh';
          }

          if (!FG.validateResult(out)) {
            var err = new Error('Respons model tidak sesuai format.');
            err.code = 'BAD_RESPONSE';
            throw err;
          }
          return out;
        })
        .catch(function (err) {
          clearTimeout(timer);
          if (err.name === 'AbortError') {
            var e = new Error('Permintaan melebihi batas waktu. Coba lagi.');
            e.code = 'TIMEOUT';
            throw e;
          }
          throw err;
        });
    },

    /** Untuk tombol "coba contoh" di halaman upload. */
    sampleFile: function (fruitId) {
      var map = { apple: 'apple.jpg', orange: 'orange.jpg', banana: 'banana.jpg' };
      var name = map[fruitId] || 'apple.jpg';
      return fetch('assets/img/' + name)
        .then(function (r) { return r.blob(); })
        .then(function (blob) {
          return new File([blob], 'contoh-' + fruitId + '.jpg', { type: 'image/jpeg' });
        });
    }
  };
})();
