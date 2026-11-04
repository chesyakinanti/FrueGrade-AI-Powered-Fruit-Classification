/* ============================================================
   FruGrade — halaman Result
   Membaca hasil dari sessionStorage, merender, lalu menganimasikan
   ring confidence, bar probabilitas, dan nama buah.
   ============================================================ */
(function () {
  'use strict';

  window.FG = window.FG || {};

  var $ = FG.util.$;
  var $$ = FG.util.$$;
  var CIRC = 2 * Math.PI * 52;

  var dom = {};
  var data = null;

  function cache() {
    dom.empty = $('#result-empty');
    dom.content = $('#result-content');
    dom.image = $('#result-image');
    dom.fruitName = $('#fruit-name');
    dom.fruitLatin = $('#fruit-latin');
    dom.freshnessChip = $('#freshness-chip');
    dom.freshnessHeadline = $('#freshness-headline');
    dom.freshnessNote = $('#freshness-note');
    dom.freshnessCard = $('#freshness-card');
    dom.confidenceValue = $('#confidence-value');
    dom.confidenceRing = $('#confidence-ring');
    dom.confidenceBlock = $('#confidence-block');
    dom.confidenceNote = $('#confidence-note');
    dom.probList = $('#prob-list');
    dom.metaModel = $('#meta-model');
    dom.metaInput = $('#meta-input');
    dom.metaLatencyRow = $('#meta-latency-row');
    dom.metaLatency = $('#meta-latency');
    dom.resultTime = $('#result-time');
    dom.resultId = $('#result-id');
    dom.demoBadge = $('#result-demo-badge');
    dom.another = $('#btn-another');
    dom.copy = $('#btn-copy');
    dom.mascot = $('#result-mascot');
    dom.focusBadge = $('#focus-badge');
    dom.focusIcon = $('#focus-icon');
    dom.summary = $('#result-summary');
    dom.demoBadgeInline = $('#result-demo-badge-inline');
    dom.freshnessIcon = $('#freshness-icon');
    dom.sessionChip = $('#session-chip');
  }

  /* ---------------- helpers ---------------- */
  function fruitInfo(result) {
    var id = result.fruit;
    var cfg = FG.config.fruits[id];
    if (cfg) return cfg;
    var label = String(result.label || '');
    if (/apple|apel/i.test(label)) return FG.config.fruits.apple;
    if (/orange|jeruk/i.test(label)) return FG.config.fruits.orange;
    if (/banana|pisang/i.test(label)) return FG.config.fruits.banana;
    return { id: 'unknown', name: label || 'Tidak dikenali', latin: '', image: 'assets/img/apple.jpg' };
  }

  function labelID(label) {
    var m = /^(Fresh|Rotten)\s+(Apple|Orange|Banana)$/i.exec(String(label || '').trim());
    if (!m) return String(label || '');
    var fruit = { apple: 'Apel', orange: 'Jeruk', banana: 'Pisang' }[m[2].toLowerCase()] || m[2];
    return fruit + ' ' + (m[1].toLowerCase() === 'fresh' ? 'Segar' : 'Busuk');
  }

  function formatDate(iso) {
    var d = iso ? new Date(iso) : new Date();
    if (isNaN(d.getTime())) d = new Date();
    try {
      return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }).format(d).replace(/\./g, ':');
    } catch (e) {
      return d.toLocaleString();
    }
  }

  function makeId(iso) {
    var d = iso ? new Date(iso) : new Date();
    var t = isNaN(d.getTime()) ? Date.now() : d.getTime();
    return '#FRU-' + t.toString(36).slice(-5).toUpperCase();
  }

  /* ---------------- render ---------------- */
  function render(payload) {
    var result = payload.result;
    var fruit = fruitInfo(result);
    var fresh = result.freshness === 'fresh';
    var rotten = result.freshness === 'rotten';

    data = payload;

    if (dom.empty) { dom.empty.hidden = true; dom.empty.classList.add('is-hidden'); }
    if (dom.content) { dom.content.hidden = false; dom.content.classList.remove('is-hidden'); }

    // gambar
    if (dom.image) {
      dom.image.src = payload.image || fruit.image;
      dom.image.alt = 'Foto buah yang dianalisis: ' + fruit.name;
    }

    // nama buah
    if (dom.fruitName) dom.fruitName.textContent = fruit.name;
    if (dom.fruitLatin) dom.fruitLatin.textContent = fruit.latin ? '(' + fruit.latin + ')' : '';
    if (dom.resultId) dom.resultId.textContent = makeId(payload.at);
    if (dom.resultTime) dom.resultTime.textContent = formatDate(payload.at);

    // kesegaran
    if (dom.freshnessChip) {
      dom.freshnessChip.className = 'inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 font-label-md text-label-md shadow-sm ' +
        (fresh ? 'bg-forest-green text-warm-white' : (rotten ? 'bg-error text-on-error' : 'bg-surface-container text-on-surface-variant'));
      dom.freshnessChip.innerHTML = '<span class="icon text-[18px]">' +
        (fresh ? 'eco' : (rotten ? 'warning' : 'help')) + '</span>' +
        (fresh ? 'Segar / Fresh' : (rotten ? 'Busuk / Rotten' : 'Tidak diketahui'));
    }

    if (dom.freshnessHeadline) {
      dom.freshnessHeadline.textContent = fresh ? 'Indikasi Segar' : (rotten ? 'Terdeteksi Indikasi Pembusukan' : 'Status Kesegaran Tidak Tersedia');
    }
    if (dom.freshnessNote) {
      dom.freshnessNote.textContent = fresh
        ? 'Model memprediksi kelas segar untuk gambar ini. Kulit dan tekstur yang terlihat sesuai dengan kelas Fresh pada dataset pelatihan.'
        : (rotten
          ? 'Model memprediksi kelas busuk. Sebaiknya pisahkan buah dan gunakan foto dengan pencahayaan lebih merata untuk verifikasi ulang.'
          : 'Model tidak mengembalikan status kesegaran pada prediksi ini.');
    }

    if (dom.freshnessCard) {
      dom.freshnessCard.classList.toggle('ring-error-container', rotten);
      dom.freshnessCard.classList.toggle('bg-error-container/30', rotten);
      dom.freshnessCard.classList.toggle('bg-surface-container-low', !rotten);
    }

    if (dom.image) {
      dom.image.classList.toggle('saturate-[0.65]', rotten);
      dom.image.classList.toggle('brightness-[0.98]', rotten);
    }

    // meta model
    if (dom.metaModel) dom.metaModel.textContent = result.model || (FG.config.model.name + ' ' + FG.config.model.version);
    if (dom.metaInput) dom.metaInput.textContent = FG.config.model.input;

    if (dom.metaLatencyRow && dom.metaLatency) {
      if (typeof result.latency_ms === 'number') {
        dom.metaLatencyRow.hidden = false;
        dom.metaLatency.textContent = (result.latency_ms / 1000).toFixed(2).replace('.', ',') + ' detik';
      } else {
        dom.metaLatencyRow.hidden = true;
      }
    }

    if (dom.demoBadge) {
      dom.demoBadge.hidden = !result.mock;
      dom.demoBadge.classList.toggle('is-hidden', !result.mock);
    }
    if (dom.demoBadgeInline) {
      dom.demoBadgeInline.hidden = !result.mock;
      dom.demoBadgeInline.classList.toggle('is-hidden', !result.mock);
    }
    if (dom.sessionChip) dom.sessionChip.classList.remove('is-hidden');

    if (dom.freshnessIcon) {
      dom.freshnessIcon.textContent = fresh ? 'task_alt' : (rotten ? 'warning' : 'help');
      dom.freshnessIcon.className = 'icon text-[24px] ' + (fresh ? 'text-forest-green' : (rotten ? 'text-error' : 'text-on-surface-variant'));
    }

    if (dom.mascot) {
      var mascotType = (fruit.id === 'orange' || fruit.id === 'banana') ? fruit.id : 'apple';
      if (dom.mascot.getAttribute('data-mascot') !== mascotType) {
        dom.mascot.setAttribute('data-mascot', mascotType);
        dom.mascot.removeAttribute('data-mounted');
        dom.mascot.innerHTML = '';
        FG.fruit.mount();
      }
      FG.fruit.setMood(dom.mascot, rotten ? 'oops' : null);
    }

    if (dom.focusBadge) {
      dom.focusBadge.textContent = fresh ? 'Kualitas visual baik' : (rotten ? 'Perlu perhatian' : 'Tidak dinilai');
      dom.focusBadge.className = 'font-label-sm text-label-sm font-semibold ' +
        (fresh ? 'text-forest-green' : (rotten ? 'text-error' : 'text-on-surface-variant'));
    }
    if (dom.focusIcon) {
      dom.focusIcon.textContent = fresh ? 'verified' : (rotten ? 'warning' : 'help');
      dom.focusIcon.className = 'icon text-[16px] ' +
        (fresh ? 'text-forest-green' : (rotten ? 'text-error' : 'text-on-surface-variant'));
    }

    renderConfidence(result);
    renderProbabilities(result);
    updateSummary(result, fruit);

    animate(fresh);
  }

  function renderConfidence(result) {
    var conf = result.confidence;

    if (conf == null) {
      if (dom.confidenceBlock) dom.confidenceBlock.hidden = true;
      if (dom.confidenceNote) {
        dom.confidenceNote.hidden = false;
        dom.confidenceNote.textContent = 'Model tidak mengembalikan confidence score untuk prediksi ini.';
      }
      return;
    }

    if (dom.confidenceBlock) dom.confidenceBlock.hidden = false;
    if (dom.confidenceValue) dom.confidenceValue.textContent = FG.util.formatPercent(conf, 1);

    var ring = dom.confidenceRing;
    if (ring) {
      ring.style.strokeDasharray = CIRC;
      ring.style.strokeDashoffset = CIRC;
      ring.setAttribute('stroke', result.freshness === 'rotten' ? '#BA1A1A' : '#2E5D3A');
    }
  }

  function renderProbabilities(result) {
    if (!dom.probList) return;

    var probs = Array.isArray(result.probabilities) ? result.probabilities.slice(0, 4) : [];
    if (!probs.length) {
      dom.probList.innerHTML = '<p class="font-body-sm text-body-sm text-on-surface-variant">Probabilitas per kelas tidak tersedia.</p>';
      return;
    }

    dom.probList.innerHTML = probs.map(function (item, i) {
      var pct = Math.max(0, Math.min(1, Number(item.p) || 0));
      var isTop = i === 0;
      var color = isTop ? (result.freshness === 'rotten' ? '#BA1A1A' : '#2E5D3A') : '#C9C5BE';
      return (
        '<div class="flex flex-col gap-1.5">' +
          '<div class="flex items-center justify-between gap-3">' +
            '<span class="font-label-md text-label-md ' + (isTop ? 'font-semibold text-soft-charcoal' : 'text-on-surface-variant') + '">' +
              FG.util.escapeHtml(labelID(item.label)) +
            '</span>' +
            '<span class="font-label-sm text-label-sm ' + (isTop ? 'font-bold text-soft-charcoal' : 'text-on-surface-variant') + '">' +
              (pct * 100).toFixed(1) + '%' +
            '</span>' +
          '</div>' +
          '<div class="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">' +
            '<div class="prob-fill h-full rounded-full" data-width="' + (pct * 100).toFixed(2) + '" style="width:0%;background:' + color + '"></div>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  function updateSummary(result, fruit) {
    if (!dom.summary) return;
    var lines = [
      'FruGrade — Hasil Analisis',
      'Jenis buah: ' + fruit.name,
      'Status: ' + (result.freshness === 'fresh' ? 'Segar (Fresh)' : result.freshness === 'rotten' ? 'Busuk (Rotten)' : 'Tidak tersedia'),
      result.confidence != null ? 'Confidence: ' + FG.util.formatPercent(result.confidence, 1) : 'Confidence: tidak tersedia',
      'Model: ' + (result.model || FG.config.model.name),
      'Catatan: hasil prediksi model, bukan jaminan kualitas.'
    ];
    dom.summary.textContent = lines.join('\n');
  }

  /* ---------------- animation ---------------- */
  function animate(fresh) {
    var gsap = window.gsap;
    var reduced = FG.util.prefersReduced();
    var result = data.result;
    var conf = result.confidence;

    // nama buah: decode singkat
    if (dom.fruitName && !reduced) decodeText(dom.fruitName, fruitInfo(result).name);

    if (!gsap || reduced) {
      if (dom.confidenceRing && conf != null) {
        dom.confidenceRing.style.strokeDashoffset = CIRC * (1 - conf);
      }
      $$('.prob-fill', dom.probList).forEach(function (el) {
        el.style.width = el.getAttribute('data-width') + '%';
      });
      return;
    }

    gsap.from(dom.image, {
      scale: 1.06,
      opacity: 0,
      duration: 0.9,
      ease: 'power3.out'
    });

    if (dom.confidenceRing && conf != null) {
      gsap.to(dom.confidenceRing, {
        strokeDashoffset: CIRC * (1 - conf),
        duration: 1.35,
        ease: 'power2.out',
        delay: 0.15
      });
    }

    if (dom.confidenceValue && conf != null) {
      var stateObj = { v: 0 };
      gsap.to(stateObj, {
        v: conf * 100,
        duration: 1.35,
        ease: 'power2.out',
        delay: 0.15,
        onUpdate: function () { dom.confidenceValue.textContent = stateObj.v.toFixed(1) + '%'; }
      });
    }

    var bars = $$('.prob-fill', dom.probList);
    gsap.fromTo(bars, { width: 0 }, {
      width: function (i, el) { return el.getAttribute('data-width') + '%'; },
      duration: 0.9,
      stagger: 0.09,
      delay: 0.35,
      ease: 'power2.out'
    });

    if (fresh && dom.freshnessCard) {
      window.setTimeout(function () {
        FG.fruit.celebrate(dom.freshnessCard);
      }, 700);
    }
  }

  function decodeText(el, finalText) {
    if (FG.util.prefersReduced()) { el.textContent = finalText; return; }
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&';
    var frame = 0;
    var total = 18;
    el.classList.add('decode-text');
    var timer = window.setInterval(function () {
      frame += 1;
      var reveal = Math.floor((frame / total) * finalText.length);
      var out = '';
      for (var i = 0; i < finalText.length; i++) {
        if (i < reveal || finalText[i] === ' ') out += finalText[i];
        else out += chars[Math.floor(Math.random() * chars.length)];
      }
      el.textContent = out;
      if (frame >= total) {
        clearInterval(timer);
        el.textContent = finalText;
        el.classList.remove('decode-text');
      }
    }, 32);
  }

  /* ---------------- actions ---------------- */
  function initActions() {
    if (dom.another) {
      dom.another.addEventListener('click', function () {
        FG.store.clear();
        window.location.href = 'upload.html';
      });
    }

    if (dom.copy) {
      dom.copy.addEventListener('click', function () {
        var text = dom.summary ? dom.summary.textContent : '';
        var done = function () {
          var original = dom.copy.innerHTML;
          dom.copy.innerHTML = '<span class="icon text-[20px] text-forest-green">check</span> Tersalin!';
          FG.util.toast('Ringkasan disalin ke clipboard.', { type: 'success', duration: 2600 });
          window.setTimeout(function () { dom.copy.innerHTML = original; }, 2000);
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done).catch(function () {
            FG.util.toast('Clipboard diblokir browser. Salin manual dari halaman ini.', { type: 'error' });
          });
        } else {
          FG.util.toast('Clipboard tidak tersedia di browser ini.', { type: 'error' });
        }
      });
    }
  }

  /* ---------------- boot ---------------- */
  function init() {
    cache();
    initActions();

    var payload = FG.store.load();
    if (!payload) {
      // Tidak ada hasil di tab ini: tampilkan empty state, bukan error.
      if (dom.content) { dom.content.hidden = true; dom.content.classList.add('is-hidden'); }
      if (dom.empty) { dom.empty.hidden = false; dom.empty.classList.remove('is-hidden'); }
      if (dom.sessionChip) dom.sessionChip.classList.add('is-hidden');
      return;
    }

    render(payload);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
