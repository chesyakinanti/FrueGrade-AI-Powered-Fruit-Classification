/* ============================================================
   FruGrade — API layer
   Mendukung Mode Mock (Demo) & Mode Live (Flask /predict).
   Dataset 12 kelas:
     FreshApple, FreshBanana, FreshMango, FreshOrange, FreshStrawberry, FreshTomato,
     RottenApple, RottenBanana, RottenMango, RottenOrange, RottenStrawberry, RottenTomato.
   ============================================================ */
(function () {
  'use strict';

  window.FG = window.FG || {};

  function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function classTechnicalLabel(fruitKey, freshness) {
    var capFruit = {
      apple: 'Apple',
      banana: 'Banana',
      mango: 'Mango',
      orange: 'Orange',
      strawberry: 'Strawberry',
      tomato: 'Tomato'
    }[fruitKey] || capitalize(fruitKey);

    return (freshness === 'rotten' ? 'Rotten' : 'Fresh') + capFruit;
  }

  function mock12ClassDistribution(selectedFruit, selectedFreshness, topConfidence) {
    var topLabel = classTechnicalLabel(selectedFruit, selectedFreshness);
    var list = [{ label: topLabel, p: topConfidence }];

    var remaining = Math.max(0, 1 - topConfidence);
    var otherClasses = [];

    var fruits = ['apple', 'banana', 'mango', 'orange', 'strawberry', 'tomato'];
    var states = ['fresh', 'rotten'];

    fruits.forEach(function (f) {
      states.forEach(function (s) {
        var lbl = classTechnicalLabel(f, s);
        if (lbl !== topLabel) {
          otherClasses.push(lbl);
        }
      });
    });

    // Bobot probabilitas menurun untuk kelas lain
    var weights = [0.45, 0.25, 0.14, 0.08, 0.04, 0.02, 0.01, 0.005, 0.003, 0.001, 0.001];
    otherClasses.slice(0, 11).forEach(function (lbl, idx) {
      var w = weights[idx] || 0.001;
      list.push({ label: lbl, p: +(remaining * w).toFixed(4) });
    });

    return list.sort(function (a, b) { return b.p - a.p; });
  }

  function guessFruit(name) {
    var n = String(name || '').toLowerCase();
    if (/apel|apple|malus/.test(n)) return 'apple';
    if (/pisang|banana|musa/.test(n)) return 'banana';
    if (/mangga|mango|mangifera/.test(n)) return 'mango';
    if (/jeruk|orange|citrus/.test(n)) return 'orange';
    if (/stroberi|strawberry|fragaria/.test(n)) return 'strawberry';
    if (/tomat|tomato|solanum/.test(n)) return 'tomato';
    return null;
  }

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function mockPayload(file, scenario) {
    var guess = guessFruit(file && file.name);
    var availableFruits = ['apple', 'banana', 'orange', 'mango', 'strawberry', 'tomato'];

    if (scenario === 'rotten') {
      var rottenFruit = guess || pick(availableFruits);
      var confR = 0.924;
      return {
        ok: true,
        fruit: rottenFruit,
        freshness: 'rotten',
        label: classTechnicalLabel(rottenFruit, 'rotten'),
        confidence: confR,
        probabilities: mock12ClassDistribution(rottenFruit, 'rotten', confR),
        latency_ms: 280,
        model: FG.config.model.name + ' (' + FG.config.model.framework + ')',
        mock: true
      };
    }

    if (scenario === 'fresh' || !scenario) {
      var freshFruit = guess || pick(availableFruits);
      var confF = freshFruit === 'apple' ? 0.952 : (freshFruit === 'orange' ? 0.938 : 0.945);
      return {
        ok: true,
        fruit: freshFruit,
        freshness: 'fresh',
        label: classTechnicalLabel(freshFruit, 'fresh'),
        confidence: confF,
        probabilities: mock12ClassDistribution(freshFruit, 'fresh', confF),
        latency_ms: 240,
        model: FG.config.model.name + ' (' + FG.config.model.framework + ')',
        mock: true
      };
    }

    return null;
  }

  FG.api = {
    forcedScenario: null,

    /** @param {File} file */
    predict: function (file) {
      if (FG.config.mode === 'live') return this.live(file);

      var scenario = this.forcedScenario || FG.config.scenario || null;
      var delay = scenario === 'slow' ? 6200 : 1800 + Math.random() * 600;

      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          if (scenario === 'error') {
            var err = new Error(window.FG.i18n ? window.FG.i18n.t('msg.predictionFailed') : 'Model failed to process image. Try another photo.');
            err.code = 'PREDICTION_FAILED';
            reject(err);
            return;
          }
          var payload = mockPayload(file, scenario === 'slow' ? 'fresh' : scenario);
          if (!payload) {
            var e2 = new Error('Unknown scenario.');
            e2.code = 'BAD_SCENARIO';
            reject(e2);
            return;
          }
          resolve(payload);
        }, FG.util.prefersReduced() ? Math.min(delay, 700) : delay);
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
              var msg = (body && body.message) || 'Prediction failed. Please try again.';
              var code = (body && body.code) || ('HTTP_' + res.status);
              var err = new Error(msg);
              err.code = code;
              throw err;
            }
            return body;
          });
        })
        .then(function (body) {
          // Gunakan parser universal FG.parseClass agar 12 kelas tertangani dengan baik
          var parsed = FG.parseClass(body.label || body.predicted_label || body.class || '');

          var out = {
            ok: true,
            fruit: body.fruit || body.fruit_type || parsed.fruit,
            freshness: body.freshness || body.status || parsed.freshness,
            label: body.label || body.predicted_label || parsed.raw,
            confidence: typeof body.confidence === 'number' ? body.confidence : (typeof body.score === 'number' ? body.score : null),
            probabilities: Array.isArray(body.probabilities) ? body.probabilities : null,
            latency_ms: typeof body.latency_ms === 'number' ? body.latency_ms : null,
            model: body.model || (FG.config.model.name + ' (' + FG.config.model.framework + ')'),
            mock: false
          };

          if (!FG.validateResult(out)) {
            var err = new Error('Model response does not match the expected contract.');
            err.code = 'BAD_RESPONSE';
            throw err;
          }
          return out;
        })
        .catch(function (err) {
          clearTimeout(timer);
          if (err.name === 'AbortError') {
            var e = new Error('Request timed out. Please try again.');
            e.code = 'TIMEOUT';
            throw e;
          }
          throw err;
        });
    },

    /** Untuk tombol coba contoh di halaman upload */
    sampleFile: function (fruitId) {
      var map = {
        apple: 'apple.jpg',
        orange: 'orange.jpg',
        banana: 'banana.jpg',
        mango: 'hero-fruit.jpg',
        strawberry: 'hero-fruit.jpg',
        tomato: 'hero-fruit.jpg'
      };
      var name = map[fruitId] || 'apple.jpg';
      return fetch('assets/img/' + name)
        .then(function (r) { return r.blob(); })
        .then(function (blob) {
          return new File([blob], 'sample-' + fruitId + '.jpg', { type: 'image/jpeg' });
        });
    }
  };
})();
