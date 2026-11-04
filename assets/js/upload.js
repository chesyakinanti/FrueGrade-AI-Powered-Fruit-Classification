/* ============================================================
   FruGrade — halaman Upload
   State: empty → ready → loading → (result | error)
   ============================================================ */
(function () {
  'use strict';

  window.FG = window.FG || {};

  var $ = FG.util.$;
  var $$ = FG.util.$$;

  var dom = {};
  var state = {
    file: null,
    dims: null,
    previewUrl: null,
    busy: false,
    stageTimers: [],
    progressTimer: null
  };

  function cache() {
    dom.input = $('#file-input');
    dom.dropzone = $('#dropzone');
    dom.previewEmpty = $('#preview-empty');
    dom.previewFilled = $('#preview-filled');
    dom.previewCard = $('#preview-card');
    dom.image = $('#preview-image');
    dom.fileName = $('#file-name');
    dom.fileMeta = $('#file-meta');
    dom.fileDims = $('#file-dims');
    dom.replace = $('#btn-replace');
    dom.remove = $('#btn-remove');
    dom.analyze = $('#analyze-btn');
    dom.analyzeHint = $('#analyze-hint');
    dom.processing = $('#processing');
    dom.progressFill = $('#progress-fill');
    dom.progressPct = $('#progress-pct');
    dom.progressLabel = $('#progress-label');
    dom.errorPanel = $('#error-panel');
    dom.errorCode = $('#error-code');
    dom.errorMessage = $('#error-message');
    dom.retry = $('#error-retry');
    dom.statusChip = $('#upload-status');
    dom.stageList = $('#stage-list');
    dom.scanOverlay = $('#preview-scan');
    dom.mascot = $('#upload-mascot');
  }

  /* ---------------- helpers ---------------- */
  function setAnalyzeEnabled(on) {
    if (!dom.analyze) return;
    dom.analyze.disabled = !on;
    dom.analyze.setAttribute('aria-disabled', on ? 'false' : 'true');
    dom.analyze.classList.toggle('is-ready', !!on);
    if (dom.analyzeHint) {
      dom.analyzeHint.textContent = on
        ? 'Gambar siap diproses oleh model CNN.'
        : 'Pilih gambar terlebih dahulu untuk mengaktifkan analisis.';
    }
  }

  function clearError() {
    if (!dom.errorPanel) return;
    dom.errorPanel.hidden = true;
    dom.errorPanel.classList.add('is-hidden');
  }

  function showError(code, message) {
    if (!dom.errorPanel) return;
    dom.errorPanel.hidden = false;
    dom.errorPanel.classList.remove('is-hidden');
    if (dom.errorCode) dom.errorCode.textContent = code || 'ERROR';
    if (dom.errorMessage) dom.errorMessage.textContent = message;
    FG.util.toast(message, { type: 'error', duration: 5000 });
    if (dom.mascot) FG.fruit.setMood(dom.mascot, 'oops');
    window.setTimeout(function () { if (dom.mascot) FG.fruit.setMood(dom.mascot, null); }, 1800);
    if (!/^(NO_FILE|INVALID_FORMAT|EMPTY_FILE|FILE_TOO_LARGE|DECODE_FAILED)$/.test(code || '')) {
      window.setTimeout(function () {
        dom.errorPanel.scrollIntoView({ behavior: FG.util.prefersReduced() ? 'auto' : 'smooth', block: 'nearest' });
      }, 80);
    }
  }

  function validate(file) {
    var cfg = FG.config;
    if (!file) return { ok: false, code: 'NO_FILE', message: 'Tidak ada gambar yang dipilih.' };

    var ext = FG.util.ext(file.name);
    var mimeOk = file.type && cfg.acceptedTypes.indexOf(file.type) !== -1;
    var extOk = cfg.acceptedExt.indexOf(ext) !== -1;

    if (!mimeOk && !extOk) {
      return {
        ok: false,
        code: 'INVALID_FORMAT',
        message: 'Format tidak didukung. Gunakan gambar JPG, JPEG, atau PNG.'
      };
    }
    if (file.size === 0) {
      return { ok: false, code: 'EMPTY_FILE', message: 'File kosong atau tidak dapat dibaca.' };
    }
    if (file.size > cfg.maxFileMB * 1024 * 1024) {
      return {
        ok: false,
        code: 'FILE_TOO_LARGE',
        message: 'Ukuran file melebihi ' + cfg.maxFileMB + ' MB. Kompres gambar terlebih dahulu.'
      };
    }
    return { ok: true };
  }

  function decode(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        resolve({ url: url, width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error('Gambar tidak dapat dibaca sebagai citra.'));
      };
      img.src = url;
    });
  }

  function releasePreview() {
    if (state.previewUrl) {
      URL.revokeObjectURL(state.previewUrl);
      state.previewUrl = null;
    }
  }

  /* ---------------- preview ---------------- */
  function renderPreview(file, info) {
    releasePreview();
    state.previewUrl = info.url;

    dom.image.src = info.url;
    dom.image.alt = 'Pratinjau foto buah: ' + file.name;

    if (dom.fileName) dom.fileName.textContent = file.name;
    if (dom.fileMeta) dom.fileMeta.textContent = FG.util.formatBytes(file.size) + ' • ' + info.width + ' × ' + info.height + ' px';
    if (dom.fileDims) dom.fileDims.textContent = info.width + ' × ' + info.height;

    dom.previewEmpty.classList.add('is-hidden');
    dom.previewEmpty.hidden = true;
    dom.previewFilled.hidden = false;
    dom.previewFilled.classList.remove('is-hidden');

    var media = dom.previewFilled.querySelector('.preview-media');
    if (media && !FG.util.prefersReduced()) {
      media.classList.add('is-wiping');
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          media.classList.remove('is-wiping');
          media.classList.add('is-shown');
        });
      });
    } else if (media) {
      media.classList.add('is-shown');
    }

    if (dom.statusChip) {
      dom.statusChip.className = 'chip chip-fresh';
      dom.statusChip.innerHTML = '<span class="icon text-[15px]">check_circle</span> Siap dianalisis';
    }

    setAnalyzeEnabled(true);
    clearError();

    if (dom.mascot) {
      FG.fruit.setMood(dom.mascot, 'excited');
      window.setTimeout(function () { if (dom.mascot) FG.fruit.setMood(dom.mascot, null); }, 1200);
    }
  }

  function resetPreview() {
    releasePreview();
    state.file = null;
    state.dims = null;

    if (dom.input) dom.input.value = '';
    if (dom.image) dom.image.removeAttribute('src');

    dom.previewFilled.hidden = true;
    dom.previewFilled.classList.add('is-hidden');
    dom.previewEmpty.hidden = false;
    dom.previewEmpty.classList.remove('is-hidden');

    var media = dom.previewFilled.querySelector('.preview-media');
    if (media) media.classList.remove('is-shown');

    if (dom.statusChip) {
      dom.statusChip.className = 'chip chip-neutral';
      dom.statusChip.innerHTML = '<span class="dot"></span> Menunggu gambar';
    }

    hideProcessing();
    clearError();
    setAnalyzeEnabled(false);

    if (dom.mascot) FG.fruit.setMood(dom.mascot, null);
  }

  /* ---------------- processing ---------------- */
  function setProgress(pct) {
    var p = FG.util.clamp(pct, 0, 100);
    if (dom.progressFill) dom.progressFill.style.width = p + '%';
    if (dom.progressPct) dom.progressPct.textContent = Math.round(p) + '%';
  }

  function resetStages() {
    if (!dom.stageList) return;
    $$('[data-stage]', dom.stageList).forEach(function (el, i) {
      el.classList.remove('is-active', 'is-done');
      var icon = el.querySelector('.stage-icon');
      if (icon) {
        icon.classList.remove('icon');
        icon.textContent = String(i + 1);
      }
    });
  }

  function markStage(index, done) {
    if (!dom.stageList) return;
    var stages = $$('[data-stage]', dom.stageList);
    stages.forEach(function (el, i) {
      if (i < index) el.classList.add('is-done');
      el.classList.toggle('is-active', i === index && !done);
      if (i === index && done) {
        el.classList.remove('is-active');
        el.classList.add('is-done');
      }
    });
    stages.forEach(function (el, i) {
      var icon = el.querySelector('.stage-icon');
      if (!icon) return;
      if (el.classList.contains('is-done')) {
        icon.classList.add('icon');
        icon.textContent = 'check';
      } else if (!el.classList.contains('is-active')) {
        icon.classList.remove('icon');
        icon.textContent = String(i + 1);
      }
    });
  }

  function completeStages() {
    if (!dom.stageList) return;
    $$('[data-stage]', dom.stageList).forEach(function (el, i) {
      el.classList.remove('is-active');
      el.classList.add('is-done');
      var icon = el.querySelector('.stage-icon');
      if (icon) {
        icon.classList.add('icon');
        icon.textContent = 'check';
      }
    });
  }

  function startProcessing() {
    if (!dom.processing) return;
    dom.processing.hidden = false;
    dom.processing.classList.remove('is-hidden');
    resetStages();
    setProgress(4);
    if (dom.progressFill) dom.progressFill.classList.remove('is-error');
    if (dom.scanOverlay) dom.scanOverlay.classList.remove('is-hidden');

    window.setTimeout(function () {
      dom.processing.scrollIntoView({ behavior: FG.util.prefersReduced() ? 'auto' : 'smooth', block: 'nearest' });
    }, 120);
    var slow = (FG.api.forcedScenario || FG.config.scenario) === 'slow';
    var factor = slow ? 2.7 : 1;
    var stageOffsets = [0, 620 * factor, 1320 * factor, 2050 * factor];

    state.stageTimers.forEach(clearTimeout);
    state.stageTimers = [];

    stageOffsets.forEach(function (delay, idx) {
      state.stageTimers.push(window.setTimeout(function () {
        markStage(idx, false);
        if (dom.progressLabel) dom.progressLabel.textContent = stageLabel(idx);
      }, delay));
    });

    clearInterval(state.progressTimer);
    state.progressTimer = window.setInterval(function () {
      var current = parseFloat(dom.progressFill ? dom.progressFill.style.width : '0') || 0;
      if (current >= 92) return;
      setProgress(current + (92 - current) * 0.09 + 0.4);
    }, 180);
  }

  function stageLabel(idx) {
    return [
      'Memeriksa format & keterbacaan gambar…',
      'Menyiapkan citra 128 × 128 (RGB)…',
      'Menjalankan inferensi CNN…',
      'Menghitung confidence score…'
    ][idx] || 'Memproses…';
  }

  function hideProcessing() {
    state.stageTimers.forEach(clearTimeout);
    state.stageTimers = [];
    clearInterval(state.progressTimer);
    if (!dom.processing) return;
    dom.processing.hidden = true;
    dom.processing.classList.add('is-hidden');
    if (dom.scanOverlay) dom.scanOverlay.classList.add('is-hidden');
    setProgress(0);
  }

  function finishProcessing() {
    completeStages();
    setProgress(100);
    if (dom.progressLabel) dom.progressLabel.textContent = 'Selesai. Membuka hasil…';
    clearInterval(state.progressTimer);
  }

  /* ---------------- file handling ---------------- */
  function handleFile(file) {
    if (state.busy) return Promise.resolve(false);

    var check = validate(file);
    if (!check.ok) {
      if (dom.dropzone) {
        dom.dropzone.classList.add('is-invalid');
        window.setTimeout(function () { dom.dropzone.classList.remove('is-invalid'); }, 700);
      }
      showError(check.code, check.message);
      return Promise.resolve(false);
    }

    // Kosongkan input agar file yang sama bisa dipilih ulang.
    if (dom.input) dom.input.value = '';

    return decode(file)
      .then(function (info) {
        if (info.width < FG.config.minDimension || info.height < FG.config.minDimension) {
          URL.revokeObjectURL(info.url);
          showError(
            'IMAGE_TOO_SMALL',
            'Resolusi gambar terlalu kecil (' + info.width + ' × ' + info.height + '). Minimal ' + FG.config.minDimension + ' px.'
          );
          return false;
        }
        state.file = file;
        state.dims = { width: info.width, height: info.height };
        renderPreview(file, info);
        if (dom.previewCard && window.innerWidth < 1024) {
          dom.previewCard.scrollIntoView({ behavior: FG.util.prefersReduced() ? 'auto' : 'smooth', block: 'center' });
        }
        return true;
      })
      .catch(function () {
        showError('UNREADABLE_IMAGE', 'Gambar tidak dapat dibaca. Coba file lain dengan format JPG atau PNG.');
        return false;
      });
  }

  /* ---------------- analyze ---------------- */
  // Alur utama: file sudah tervalidasi -> proses -> simpan -> pindah ke Result.
  function analyze() {
    if (state.busy || !state.file) return;
    state.busy = true;
    setAnalyzeEnabled(false);
    if (dom.analyzeHint) dom.analyzeHint.textContent = 'Model sedang memproses gambar. Jangan tutup halaman ini.';
    clearError();
    startProcessing();

    if (dom.analyze) {
      dom.analyze.classList.remove('is-ready');
      dom.analyze.innerHTML = '<span class="icon animate-spin" aria-hidden="true">progress_activity</span><span>Menganalisis…</span>';
    }

    FG.api
      .predict(state.file)
      .then(function (result) {
        return FG.store.makeThumb(state.file, 900).then(function (thumb) {
          return { result: result, thumb: thumb };
        });
      })
      .then(function (payload) {
        finishProcessing();
        var saved = FG.store.save({
          result: payload.result,
          image: payload.thumb.dataUrl,
          file: {
            name: state.file.name,
            size: state.file.size,
            width: payload.thumb.width,
            height: payload.thumb.height
          },
          at: new Date().toISOString()
        });

        if (!saved) {
          throw new Error('Hasil tidak dapat disimpan di sesi ini. Coba lagi.');
        }

        window.setTimeout(function () {
          window.location.href = 'result.html';
        }, 520);
      })
      .catch(function (err) {
        state.busy = false;
        hideProcessing();
        if (dom.progressFill) dom.progressFill.classList.add('is-error');
        setAnalyzeEnabled(true);
        if (dom.analyze) {
          dom.analyze.innerHTML = '<span class="icon" aria-hidden="true">auto_awesome</span><span>Analyze Fruit</span>';
        }
        showError(err.code || 'PREDICTION_FAILED', err.message || 'Prediksi gagal. Coba lagi dengan gambar lain.');
      });
  }

  /* ---------------- demo chips ---------------- */
  function initDemo() {
    $$('[data-demo]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (state.busy) return;
        var scenario = btn.getAttribute('data-demo');
        var fruit = btn.getAttribute('data-fruit') || 'apple';
        FG.api.forcedScenario = scenario;

        btn.setAttribute('aria-busy', 'true');
        FG.api.sampleFile(fruit)
          .then(function (file) {
            return handleFile(file).then(function (ok) {
              if (ok) window.setTimeout(analyze, 600);
            });
          })
          .catch(function () {
            FG.util.toast('Gagal memuat contoh. Jalankan lewat server lokal (npm run dev).', { type: 'error' });
          })
          .then(function () {
            btn.removeAttribute('aria-busy');
          });
      });
    });
  }

  /* ---------------- events ---------------- */
  function bind() {
    if (dom.input) {
      dom.input.addEventListener('change', function (e) {
        if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
      });
    }

    if (dom.dropzone) {
      dom.dropzone.addEventListener('click', function (e) {
        if (e.target.closest('button')) return;
        dom.input.click();
      });
      dom.dropzone.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          dom.input.click();
        }
      });

      var dragDepth = 0;
      ['dragenter', 'dragover'].forEach(function (type) {
        dom.dropzone.addEventListener(type, function (e) {
          e.preventDefault();
          if (type === 'dragenter') dragDepth += 1;
          dom.dropzone.classList.add('is-dragging');
          if (dom.mascot) FG.fruit.setMood(dom.mascot, 'excited');
        });
      });
      dom.dropzone.addEventListener('dragleave', function (e) {
        e.preventDefault();
        dragDepth = Math.max(0, dragDepth - 1);
        if (dragDepth === 0) {
          dom.dropzone.classList.remove('is-dragging');
          if (dom.mascot) FG.fruit.setMood(dom.mascot, null);
        }
      });
      dom.dropzone.addEventListener('drop', function (e) {
        e.preventDefault();
        dragDepth = 0;
        dom.dropzone.classList.remove('is-dragging');
        if (dom.mascot) FG.fruit.setMood(dom.mascot, null);
        var files = e.dataTransfer && e.dataTransfer.files;
        if (files && files[0]) handleFile(files[0]);
      });
    }

    if (dom.replace) {
      dom.replace.addEventListener('click', function () { dom.input.click(); });
    }

    if (dom.remove) {
      dom.remove.addEventListener('click', function () {
        resetPreview();
        FG.util.toast('Gambar dihapus.', { duration: 2200 });
      });
    }

    if (dom.analyze) dom.analyze.addEventListener('click', analyze);
    if (dom.retry) dom.retry.addEventListener('click', analyze);
  }

  function init() {
    cache();
    bind();
    resetPreview();
    initDemo();

    // Tampilkan skenario demo yang aktif dari URL
    var scenario = FG.config.scenario;
    if (scenario) {
      FG.api.forcedScenario = scenario;
      if (dom.statusChip) {
        dom.statusChip.className = 'chip chip-demo';
        dom.statusChip.innerHTML = '<span class="icon text-[15px]">science</span> Skenario: ' + FG.util.escapeHtml(scenario);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
