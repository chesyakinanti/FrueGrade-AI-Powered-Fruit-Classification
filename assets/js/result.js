/* ============================================================
   FruGrade — Halaman Result
   Membaca hasil analisis dari sessionStorage, merender hasil 12 kelas,
   menganimasikan confidence ring & bar probabilitas, serta mendukung i18n ID/EN.
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
    dom.metaOutput = $('#meta-output');
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

  /* ---------------- Helpers ---------------- */
  function getLang() {
    return (window.FG && window.FG.i18n && typeof window.FG.i18n.getLang === 'function')
      ? window.FG.i18n.getLang()
      : 'id';
  }

  function t(key, fallback) {
    return (window.FG && window.FG.i18n && typeof window.FG.i18n.t === 'function')
      ? window.FG.i18n.t(key, fallback)
      : (fallback || key);
  }

  function resolveFruitDetails(result) {
    var parsed = FG.parseClass(result.label || result.fruit);
    var lang = getLang();
    var displayName = lang === 'en' ? parsed.nameEn : parsed.nameId;
    return {
      fruitKey: parsed.fruit,
      freshness: parsed.freshness || result.freshness,
      name: displayName,
      latin: parsed.latin,
      image: parsed.image,
      raw: parsed.raw
    };
  }

  function formatDisplayLabel(rawLabel) {
    var parsed = FG.parseClass(rawLabel);
    if (parsed.fruit === 'unknown') return parsed.raw;

    var lang = getLang();
    var fName = lang === 'en' ? parsed.nameEn : parsed.nameId;
    var state = parsed.freshness === 'fresh' ? t('fruit.fresh', 'Segar') : t('fruit.rotten', 'Busuk');

    return lang === 'en' ? (state + ' ' + fName) : (fName + ' ' + state);
  }

  function formatDate(iso) {
    var d = iso ? new Date(iso) : new Date();
    if (isNaN(d.getTime())) d = new Date();
    var lang = getLang();
    try {
      return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'id-ID', {
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

  /* ---------------- Render ---------------- */
  function render(payload) {
    data = payload;
    var result = payload.result;
    var details = resolveFruitDetails(result);
    var isFresh = details.freshness === 'fresh';
    var isRotten = details.freshness === 'rotten';

    if (dom.empty) { dom.empty.hidden = true; dom.empty.classList.add('is-hidden'); }
    if (dom.content) { dom.content.hidden = false; dom.content.classList.remove('is-hidden'); }

    // Gambar hasil analisis
    if (dom.image) {
      dom.image.src = payload.image || details.image;
      dom.image.alt = details.name;
      dom.image.classList.toggle('saturate-[0.70]', isRotten);
      dom.image.classList.toggle('brightness-[0.98]', isRotten);
    }

    // Nama buah & taksonomi latin
    if (dom.fruitName) dom.fruitName.textContent = details.name;
    if (dom.fruitLatin) dom.fruitLatin.textContent = details.latin ? '(' + details.latin + ')' : '';
    if (dom.resultId) dom.resultId.textContent = makeId(payload.at);
    if (dom.resultTime) dom.resultTime.textContent = formatDate(payload.at);

    // Badge status kesegaran
    if (dom.freshnessChip) {
      dom.freshnessChip.className = 'inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 font-label-md text-label-md shadow-sm ' +
        (isFresh ? 'bg-forest-green text-warm-white' : (isRotten ? 'bg-error text-on-error' : 'bg-surface-container text-on-surface-variant'));

      var badgeText = isFresh ? t('result.freshBadge') : (isRotten ? t('result.rottenBadge') : t('result.unknownBadge'));
      var badgeIcon = isFresh ? 'eco' : (isRotten ? 'warning' : 'help');
      dom.freshnessChip.innerHTML = '<span class="icon text-[18px]">' + badgeIcon + '</span><span>' + badgeText + '</span>';
    }

    // Headline & penjelasan kesegaran
    if (dom.freshnessHeadline) {
      dom.freshnessHeadline.textContent = isFresh
        ? t('result.freshHeadline')
        : (isRotten ? t('result.rottenHeadline') : t('result.unknownHeadline'));
    }
    if (dom.freshnessNote) {
      dom.freshnessNote.textContent = isFresh
        ? t('result.freshNote')
        : (isRotten ? t('result.rottenNote') : t('result.unknownNote'));
    }

    if (dom.freshnessCard) {
      dom.freshnessCard.classList.toggle('ring-error-container', isRotten);
      dom.freshnessCard.classList.toggle('bg-error-container/30', isRotten);
      dom.freshnessCard.classList.toggle('bg-surface-container-low', !isRotten);
    }

    if (dom.freshnessIcon) {
      dom.freshnessIcon.textContent = isFresh ? 'task_alt' : (isRotten ? 'warning' : 'help');
      dom.freshnessIcon.className = 'icon text-[24px] ' + (isFresh ? 'text-forest-green' : (isRotten ? 'text-error' : 'text-on-surface-variant'));
    }

    // Metadata model konsisten (TensorFlow / Keras 224x224x3, 12 kelas)
    if (dom.metaModel) dom.metaModel.textContent = FG.config.model.name + ' (' + FG.config.model.framework + ')';
    if (dom.metaInput) dom.metaInput.textContent = FG.config.model.input;
    if (dom.metaOutput) dom.metaOutput.textContent = t('result.outputVal');

    if (dom.metaLatencyRow && dom.metaLatency) {
      if (typeof result.latency_ms === 'number') {
        dom.metaLatencyRow.hidden = false;
        var s = (result.latency_ms / 1000).toFixed(2);
        dom.metaLatency.textContent = getLang() === 'en' ? (s + ' s') : (s.replace('.', ',') + ' detik');
      } else {
        dom.metaLatencyRow.hidden = true;
      }
    }

    // Badge Demo Mode
    if (dom.demoBadge) {
      dom.demoBadge.hidden = !result.mock;
      dom.demoBadge.classList.toggle('is-hidden', !result.mock);
    }
    if (dom.demoBadgeInline) {
      dom.demoBadgeInline.hidden = !result.mock;
      dom.demoBadgeInline.classList.toggle('is-hidden', !result.mock);
    }
    if (dom.sessionChip) dom.sessionChip.classList.remove('is-hidden');

    // Mascot reaksi
    if (dom.mascot) {
      var mascotKey = (details.fruitKey === 'orange' || details.fruitKey === 'banana') ? details.fruitKey : 'apple';
      if (dom.mascot.getAttribute('data-mascot') !== mascotKey) {
        dom.mascot.setAttribute('data-mascot', mascotKey);
        dom.mascot.removeAttribute('data-mounted');
        dom.mascot.innerHTML = '';
        if (FG.fruit && typeof FG.fruit.mount === 'function') FG.fruit.mount();
      }
      if (FG.fruit && typeof FG.fruit.setMood === 'function') {
        FG.fruit.setMood(dom.mascot, isRotten ? 'oops' : null);
      }
    }

    // Badge kualitas fokus
    if (dom.focusBadge) {
      dom.focusBadge.textContent = isFresh ? t('result.qualityGood') : (isRotten ? t('result.qualityNotice') : t('result.qualityUnassessed'));
      dom.focusBadge.className = 'font-label-sm text-label-sm font-semibold ' +
        (isFresh ? 'text-forest-green' : (isRotten ? 'text-error' : 'text-on-surface-variant'));
    }
    if (dom.focusIcon) {
      dom.focusIcon.textContent = isFresh ? 'verified' : (isRotten ? 'warning' : 'help');
      dom.focusIcon.className = 'icon text-[16px] ' +
        (isFresh ? 'text-forest-green' : (isRotten ? 'text-error' : 'text-on-surface-variant'));
    }

    renderConfidence(result);
    renderProbabilities(result);
    updateSummary(result, details);

    animate(isFresh);
  }

  function renderConfidence(result) {
    var conf = result.confidence;

    if (conf == null) {
      if (dom.confidenceBlock) dom.confidenceBlock.hidden = true;
      if (dom.confidenceNote) {
        dom.confidenceNote.hidden = false;
        dom.confidenceNote.textContent = t('result.confMissing');
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

    var probs = Array.isArray(result.probabilities) ? result.probabilities.slice(0, 5) : [];
    if (!probs.length) {
      dom.probList.innerHTML = '<p class="font-body-sm text-body-sm text-on-surface-variant">' + t('result.probMissing') + '</p>';
      return;
    }

    dom.probList.innerHTML = probs.map(function (item, i) {
      var pct = Math.max(0, Math.min(1, Number(item.p) || 0));
      var isTop = i === 0;
      var color = isTop ? (result.freshness === 'rotten' ? '#BA1A1A' : '#2E5D3A') : '#C9C5BE';
      var formattedLabel = formatDisplayLabel(item.label);

      return (
        '<div class="flex flex-col gap-1.5">' +
          '<div class="flex items-center justify-between gap-3">' +
            '<span class="font-label-md text-label-md ' + (isTop ? 'font-semibold text-soft-charcoal' : 'text-on-surface-variant') + '">' +
              FG.util.escapeHtml(formattedLabel) +
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

  function updateSummary(result, details) {
    if (!dom.summary) return;
    var lang = getLang();
    var isFresh = details.freshness === 'fresh';
    var isRotten = details.freshness === 'rotten';

    var lines = [
      'FruGrade — ' + t('result.breadcrumbTitle'),
      (lang === 'en' ? 'Fruit Type: ' : 'Jenis buah: ') + details.name,
      (lang === 'en' ? 'Status: ' : 'Status: ') + (isFresh ? t('result.freshBadge') : (isRotten ? t('result.rottenBadge') : t('result.unknownBadge'))),
      result.confidence != null ? ('Confidence: ' + FG.util.formatPercent(result.confidence, 1)) : ('Confidence: ' + t('result.unknownBadge')),
      'Model: ' + FG.config.model.name + ' (' + FG.config.model.framework + ')',
      'Input: ' + FG.config.model.input,
      t('footer.tagline')
    ];
    dom.summary.textContent = lines.join('\n');
  }

  /* ---------------- Animation ---------------- */
  function animate(isFresh) {
    var gsap = window.gsap;
    var reduced = FG.util.prefersReduced();
    var result = data.result;
    var conf = result.confidence;

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
      scale: 1.05,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out'
    });

    if (dom.confidenceRing && conf != null) {
      gsap.to(dom.confidenceRing, {
        strokeDashoffset: CIRC * (1 - conf),
        duration: 1.2,
        ease: 'power2.out',
        delay: 0.1
      });
    }

    if (dom.confidenceValue && conf != null) {
      var stateObj = { v: 0 };
      gsap.to(stateObj, {
        v: conf * 100,
        duration: 1.2,
        ease: 'power2.out',
        delay: 0.1,
        onUpdate: function () { dom.confidenceValue.textContent = stateObj.v.toFixed(1) + '%'; }
      });
    }

    var bars = $$('.prob-fill', dom.probList);
    gsap.fromTo(bars, { width: 0 }, {
      width: function (i, el) { return el.getAttribute('data-width') + '%'; },
      duration: 0.85,
      stagger: 0.08,
      delay: 0.25,
      ease: 'power2.out'
    });

    if (isFresh && dom.freshnessCard && FG.fruit && typeof FG.fruit.celebrate === 'function') {
      window.setTimeout(function () {
        FG.fruit.celebrate(dom.freshnessCard);
      }, 600);
    }
  }

  /* ---------------- Actions ---------------- */
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
          dom.copy.innerHTML = '<span class="icon text-[20px] text-forest-green">check</span> ' + t('result.copied');
          FG.util.toast(t('result.copySuccess'), { type: 'success', duration: 2600 });
          window.setTimeout(function () { dom.copy.innerHTML = original; }, 2000);
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done).catch(function () {
            FG.util.toast('Clipboard blocked. Please copy manually.', { type: 'error' });
          });
        } else {
          FG.util.toast('Clipboard is not supported in this browser.', { type: 'error' });
        }
      });
    }

    // Re-render dinamik saat pengguna mengubah bahasa
    document.addEventListener('fg:langchange', function () {
      if (data) render(data);
    });
  }

  /* ---------------- Boot ---------------- */
  function init() {
    cache();
    initActions();

    var payload = FG.store.load();
    if (!payload) {
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
