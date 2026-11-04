/* ============================================================
   FruGrade — Upload & Camera Capture Page
   Shared Flow: Device Upload OR Camera Capture
   → Image Validation → Image Preview → User Confirmation
   → Analyze Fruit → Processing → Prediction Result
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
    activeTab: 'upload', // 'upload' | 'camera'
    stageTimers: [],
    progressTimer: null
  };

  function t(key, fallback) {
    if (FG.i18n && typeof FG.i18n.t === 'function') {
      return FG.i18n.t(key, fallback);
    }
    return fallback != null ? fallback : key;
  }

  /* ---------------- Camera State & Controller ---------------- */
  var camera = {
    stream: null,
    facingMode: 'environment', // prefer rear camera on mobile
    isOpen: false,

    open: function () {
      setTab('camera');

      // Check secure context
      if (typeof window.isSecureContext !== 'undefined' && !window.isSecureContext) {
        camera.showError('INSECURE_CONTEXT', t('msg.cameraInsecure', 'Camera access requires a secure connection (HTTPS or localhost). Please upload an image instead.'));
        return;
      }

      // Check browser MediaDevices support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        camera.showError('NOT_SUPPORTED', t('msg.cameraUnsupported', 'Live camera preview is not supported in this browser. Please use the device camera upload option or select a file.'));
        return;
      }

      camera.isOpen = true;
      camera.hideError();
      if (dom.cameraLoading) dom.cameraLoading.classList.remove('hidden');

      camera.startStream();
    },

    startStream: function () {
      camera.stopStream();

      var constraints = {
        audio: false, // Video only; never request audio
        video: {
          facingMode: { ideal: camera.facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      navigator.mediaDevices.getUserMedia(constraints)
        .catch(function () {
          // Fallback without width/height constraints if device is strict
          return navigator.mediaDevices.getUserMedia({
            audio: false,
            video: { facingMode: { ideal: camera.facingMode } }
          });
        })
        .catch(function () {
          // Broadest fallback: any video device
          return navigator.mediaDevices.getUserMedia({ audio: false, video: true });
        })
        .then(function (stream) {
          camera.stream = stream;
          if (dom.cameraVideo) {
            dom.cameraVideo.srcObject = stream;
            dom.cameraVideo.onloadedmetadata = function () {
              dom.cameraVideo.play().catch(function () {});
              if (dom.cameraLoading) dom.cameraLoading.classList.add('hidden');
            };
          }
        })
        .catch(function (err) {
          console.error('Camera access error:', err);
          camera.handleError(err);
        });
    },

    handleError: function (err) {
      if (dom.cameraLoading) dom.cameraLoading.classList.add('hidden');
      var name = (err && err.name) || '';
      var message = t('msg.cameraNotFound', 'Unable to access camera. Please upload an image instead.');

      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        message = t('msg.cameraPermissionDenied', 'Camera permission was denied. Please allow camera access in your browser settings or use Upload Image.');
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        message = t('msg.cameraNotFound', 'No camera detected on this device. Please use Upload Image instead.');
      } else if (name === 'NotReadableError' || name === 'TrackStartError') {
        message = t('msg.cameraInUse', 'Camera is currently in use by another application. Please close other camera apps and try again.');
      } else if (name === 'OverconstrainedError') {
        message = t('msg.cameraUnsupported', 'The requested camera mode is not supported by your device hardware.');
      }

      camera.showError(name || 'CAMERA_ERROR', message);
    },

    showError: function (code, message) {
      if (dom.cameraError) {
        dom.cameraError.hidden = false;
        dom.cameraError.classList.remove('hidden');
      }
      if (dom.cameraErrorMsg) {
        dom.cameraErrorMsg.textContent = message;
      }
      FG.util.toast(message, { type: 'error', duration: 5000 });
    },

    hideError: function () {
      if (dom.cameraError) {
        dom.cameraError.hidden = true;
        dom.cameraError.classList.add('hidden');
      }
    },

    stopStream: function () {
      if (camera.stream) {
        camera.stream.getTracks().forEach(function (track) {
          try { track.stop(); } catch (e) {}
        });
        camera.stream = null;
      }
      if (dom.cameraVideo) {
        dom.cameraVideo.srcObject = null;
      }
    },

    close: function () {
      camera.stopStream();
      camera.isOpen = false;
      camera.hideError();
      setTab('upload');
    },

    flip: function () {
      camera.facingMode = (camera.facingMode === 'environment') ? 'user' : 'environment';
      camera.startStream();
      FG.util.toast(t('msg.cameraSwitched', 'Camera switched: ') + (camera.facingMode === 'user' ? 'Front' : 'Rear'), { duration: 1800 });
    },

    capture: function () {
      if (!dom.cameraVideo || !camera.stream) return;

      // Visual flash feedback
      if (dom.cameraFlash) {
        dom.cameraFlash.classList.remove('opacity-0');
        dom.cameraFlash.classList.add('opacity-80');
        window.setTimeout(function () {
          dom.cameraFlash.classList.remove('opacity-80');
          dom.cameraFlash.classList.add('opacity-0');
        }, 160);
      }

      var vw = dom.cameraVideo.videoWidth || 640;
      var vh = dom.cameraVideo.videoHeight || 480;

      if (dom.cameraCanvas) {
        dom.cameraCanvas.width = vw;
        dom.cameraCanvas.height = vh;
        var ctx = dom.cameraCanvas.getContext('2d');
        ctx.drawImage(dom.cameraVideo, 0, 0, vw, vh);

        dom.cameraCanvas.toBlob(function (blob) {
          if (!blob) {
            FG.util.toast(t('msg.cameraCaptureFailed', 'Failed to capture frame from camera.'), { type: 'error' });
            return;
          }

          var filename = 'camera-fruit-' + Date.now() + '.jpg';
          var file;
          try {
            file = new File([blob], filename, { type: 'image/jpeg', lastModified: Date.now() });
          } catch (e) {
            blob.name = filename;
            file = blob;
          }

          // Stop all camera tracks immediately after capturing
          camera.stopStream();
          camera.isOpen = false;

          // Route through the EXACT same handleFile() function
          handleFile(file).then(function (ok) {
            if (ok) {
              FG.util.toast(t('msg.cameraCaptured', 'Photo captured successfully from camera!'), { duration: 2500 });
            }
          });
        }, 'image/jpeg', 0.92);
      }
    }
  };

  /* ---------------- DOM Cache ---------------- */
  function cache() {
    dom.input = $('#file-input');
    dom.cameraInput = $('#camera-input');
    dom.tabUpload = $('#tab-upload');
    dom.tabCamera = $('#tab-camera');
    dom.viewUpload = $('#view-upload');
    dom.viewCamera = $('#view-camera');
    dom.dropzone = $('#dropzone');
    dom.btnBrowse = $('#btn-browse-file');

    dom.cameraVideo = $('#camera-video');
    dom.cameraCanvas = $('#camera-canvas');
    dom.cameraFlash = $('#camera-flash');
    dom.cameraLoading = $('#camera-loading');
    dom.cameraError = $('#camera-error');
    dom.cameraErrorMsg = $('#camera-error-msg');
    dom.btnCameraFallback = $('#btn-camera-fallback');
    dom.btnCameraSwitchUpload = $('#btn-camera-switch-upload');
    dom.btnCancelCamera = $('#btn-cancel-camera');
    dom.btnCaptureCamera = $('#btn-capture-camera');
    dom.btnFlipCamera = $('#btn-flip-camera');

    dom.previewCard = $('#preview-card');
    dom.previewEmpty = $('#preview-empty');
    dom.previewFilled = $('#preview-filled');
    dom.image = $('#preview-image');
    dom.fileName = $('#file-name');
    dom.fileMeta = $('#file-meta');
    dom.fileDims = $('#file-dims');
    dom.replace = $('#btn-replace');
    dom.retakeCamera = $('#btn-retake-camera');
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
    dom.statusChipText = $('#upload-status-text');
    dom.stageList = $('#stage-list');
    dom.scanOverlay = $('#preview-scan');
    dom.mascot = $('#upload-mascot');
  }

  /* ---------------- Tab Switching ---------------- */
  function setTab(tab) {
    state.activeTab = tab;

    if (tab === 'upload') {
      if (dom.tabUpload) {
        dom.tabUpload.setAttribute('aria-selected', 'true');
        dom.tabUpload.className = 'flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-3 py-2 font-label-md text-label-md font-semibold transition-all duration-200 bg-surface-container-lowest text-forest-green shadow-soft';
      }
      if (dom.tabCamera) {
        dom.tabCamera.setAttribute('aria-selected', 'false');
        dom.tabCamera.className = 'flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-3 py-2 font-label-md text-label-md font-medium text-on-surface-variant transition-all duration-200 hover:text-soft-charcoal';
      }
      if (dom.viewUpload) {
        dom.viewUpload.hidden = false;
        dom.viewUpload.classList.remove('hidden');
      }
      if (dom.viewCamera) {
        dom.viewCamera.hidden = true;
        dom.viewCamera.classList.add('hidden');
      }
      camera.stopStream();
      camera.isOpen = false;
    } else if (tab === 'camera') {
      if (dom.tabCamera) {
        dom.tabCamera.setAttribute('aria-selected', 'true');
        dom.tabCamera.className = 'flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-3 py-2 font-label-md text-label-md font-semibold transition-all duration-200 bg-surface-container-lowest text-forest-green shadow-soft';
      }
      if (dom.tabUpload) {
        dom.tabUpload.setAttribute('aria-selected', 'false');
        dom.tabUpload.className = 'flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-3 py-2 font-label-md text-label-md font-medium text-on-surface-variant transition-all duration-200 hover:text-soft-charcoal';
      }
      if (dom.viewCamera) {
        dom.viewCamera.hidden = false;
        dom.viewCamera.classList.remove('hidden');
      }
      if (dom.viewUpload) {
        dom.viewUpload.hidden = true;
        dom.viewUpload.classList.add('hidden');
      }
    }
  }

  /* ---------------- Helpers ---------------- */
  function setAnalyzeEnabled(on) {
    if (!dom.analyze) return;
    dom.analyze.disabled = !on;
    dom.analyze.setAttribute('aria-disabled', on ? 'false' : 'true');
    dom.analyze.classList.toggle('is-ready', !!on);
    if (dom.analyzeHint) {
      dom.analyzeHint.textContent = on
        ? t('upload.hintReady', 'Image ready to be processed by CNN model.')
        : t('upload.hintEmpty', 'Choose or capture an image first to enable analysis.');
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
    if (!file) return { ok: false, code: 'NO_FILE', message: t('msg.noFile', 'No image selected.') };

    var ext = FG.util.ext(file.name);
    var mimeOk = file.type && cfg.acceptedTypes.indexOf(file.type) !== -1;
    var extOk = cfg.acceptedExt.indexOf(ext) !== -1;

    // Allow image/jpeg or image/png blobs
    if (!mimeOk && !extOk && file.type && file.type.indexOf('image/') === 0) {
      mimeOk = true;
    }

    if (!mimeOk && !extOk) {
      return {
        ok: false,
        code: 'INVALID_FORMAT',
        message: t('msg.invalidFormat', 'Unsupported format. Please use JPG, JPEG, or PNG images.')
      };
    }
    if (file.size === 0) {
      return { ok: false, code: 'EMPTY_FILE', message: t('msg.emptyFile', 'File is empty or cannot be read.') };
    }
    if (file.size > cfg.maxFileMB * 1024 * 1024) {
      return {
        ok: false,
        code: 'FILE_TOO_LARGE',
        message: t('msg.fileTooLarge', 'File size exceeds ' + cfg.maxFileMB + ' MB. Please compress your image.')
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
        reject(new Error(t('msg.unreadableImage', 'Image could not be read as a valid picture.')));
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

  /* ---------------- Preview ---------------- */
  function renderPreview(file, info) {
    releasePreview();
    state.previewUrl = info.url;

    dom.image.src = info.url;
    dom.image.alt = 'Fruit photo preview: ' + (file.name || 'Captured photo');

    if (dom.fileName) dom.fileName.textContent = file.name || 'camera-capture.jpg';
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
      dom.statusChip.innerHTML = '<span class="icon text-[15px]">check_circle</span> <span id="upload-status-text">' + FG.util.escapeHtml(t('upload.readyStatus', 'Ready to analyze')) + '</span>';
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
    if (dom.cameraInput) dom.cameraInput.value = '';
    if (dom.image) dom.image.removeAttribute('src');

    dom.previewFilled.hidden = true;
    dom.previewFilled.classList.add('is-hidden');
    dom.previewEmpty.hidden = false;
    dom.previewEmpty.classList.remove('is-hidden');

    var media = dom.previewFilled.querySelector('.preview-media');
    if (media) media.classList.remove('is-shown');

    if (dom.statusChip) {
      dom.statusChip.className = 'chip chip-neutral';
      dom.statusChip.innerHTML = '<span class="dot"></span> <span id="upload-status-text">' + FG.util.escapeHtml(t('upload.waitingStatus', 'Waiting for image')) + '</span>';
    }

    hideProcessing();
    clearError();
    setAnalyzeEnabled(false);

    if (dom.mascot) FG.fruit.setMood(dom.mascot, null);
  }

  /* ---------------- Processing ---------------- */
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

  function stageLabel(idx) {
    return [
      t('upload.stage1', 'Validating format & readability…'),
      t('upload.stage2', 'Preprocessing 224 × 224 RGB…'),
      t('upload.stage3', 'Running CNN inference (TensorFlow / Keras)…'),
      t('upload.stage4', 'Computing 12-class confidence scores…')
    ][idx] || t('upload.processingTitle', 'Processing…');
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
    if (dom.progressLabel) dom.progressLabel.textContent = t('upload.stageDone', 'Done. Opening results…');
    clearInterval(state.progressTimer);
  }

  /* ---------------- Shared File Handling ---------------- */
  // Unified flow: Device Upload OR Camera Capture passes through here
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

    if (dom.input) dom.input.value = '';
    if (dom.cameraInput) dom.cameraInput.value = '';

    return decode(file)
      .then(function (info) {
        if (info.width < FG.config.minDimension || info.height < FG.config.minDimension) {
          URL.revokeObjectURL(info.url);
          showError(
            'IMAGE_TOO_SMALL',
            t('msg.imageTooSmall', 'Image resolution is too small (' + info.width + ' × ' + info.height + ' px). Minimum is ' + FG.config.minDimension + ' px.')
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
        showError('UNREADABLE_IMAGE', t('msg.unreadableImage', 'Image cannot be decoded. Please try another JPG or PNG file.'));
        return false;
      });
  }

  /* ---------------- Analyze Flow ---------------- */
  function analyze() {
    if (state.busy || !state.file) return;
    state.busy = true;
    setAnalyzeEnabled(false);
    if (dom.analyzeHint) dom.analyzeHint.textContent = t('upload.hintBusy', 'Model is processing the image. Please keep this page open.');
    clearError();
    startProcessing();

    if (dom.analyze) {
      dom.analyze.classList.remove('is-ready');
      dom.analyze.innerHTML = '<span class="icon animate-spin" aria-hidden="true">progress_activity</span><span>' + FG.util.escapeHtml(t('upload.analyzingBtn', 'Analyzing…')) + '</span>';
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
            name: state.file.name || 'camera-capture.jpg',
            size: state.file.size,
            width: payload.thumb.width,
            height: payload.thumb.height
          },
          at: new Date().toISOString()
        });

        if (!saved) {
          throw new Error('Could not persist result in this session. Please try again.');
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
          dom.analyze.innerHTML = '<span class="icon" aria-hidden="true">auto_awesome</span><span>' + FG.util.escapeHtml(t('upload.analyzeBtn', 'Analisis Buah')) + '</span>';
        }
        showError(err.code || 'PREDICTION_FAILED', err.message || t('msg.predictionFailed', 'Prediction failed. Please try again with another image.'));
      });
  }

  /* ---------------- Demo Scenarios ---------------- */
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
            FG.util.toast(t('msg.sampleLoadFailed', 'Failed to load sample. Run via local server (npm run dev).'), { type: 'error' });
          })
          .then(function () {
            btn.removeAttribute('aria-busy');
          });
      });
    });
  }

  /* ---------------- Language Change Observer ---------------- */
  function onLanguageChange() {
    if (state.file) {
      if (dom.statusChip) {
        dom.statusChip.innerHTML = '<span class="icon text-[15px]">check_circle</span> <span id="upload-status-text">' + FG.util.escapeHtml(t('upload.readyStatus', 'Ready to analyze')) + '</span>';
      }
      if (dom.analyzeHint) {
        dom.analyzeHint.textContent = state.busy ? t('upload.hintBusy', 'Model is processing the image. Please keep this page open.') : t('upload.hintReady', 'Image ready to be processed by CNN model.');
      }
    } else {
      if (dom.statusChip) {
        dom.statusChip.innerHTML = '<span class="dot"></span> <span id="upload-status-text">' + FG.util.escapeHtml(t('upload.waitingStatus', 'Waiting for image')) + '</span>';
      }
      if (dom.analyzeHint) {
        dom.analyzeHint.textContent = t('upload.hintEmpty', 'Choose or capture an image first to enable analysis.');
      }
    }
  }

  /* ---------------- Events Binding ---------------- */
  function bind() {
    // Normal file input
    if (dom.input) {
      dom.input.addEventListener('change', function (e) {
        if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
      });
    }

    // Camera mobile fallback file input
    if (dom.cameraInput) {
      dom.cameraInput.addEventListener('change', function (e) {
        if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
      });
    }

    // Tabs
    if (dom.tabUpload) {
      dom.tabUpload.addEventListener('click', function () {
        setTab('upload');
      });
    }

    if (dom.tabCamera) {
      dom.tabCamera.addEventListener('click', function () {
        camera.open();
      });
    }

    // Camera action buttons
    if (dom.btnCancelCamera) dom.btnCancelCamera.addEventListener('click', camera.close);
    if (dom.btnCaptureCamera) dom.btnCaptureCamera.addEventListener('click', camera.capture);
    if (dom.btnFlipCamera) dom.btnFlipCamera.addEventListener('click', camera.flip);

    if (dom.btnCameraFallback) {
      dom.btnCameraFallback.addEventListener('click', function () {
        if (dom.cameraInput) dom.cameraInput.click();
      });
    }

    if (dom.btnCameraSwitchUpload) {
      dom.btnCameraSwitchUpload.addEventListener('click', function () {
        setTab('upload');
      });
    }

    // Retake from preview
    if (dom.retakeCamera) {
      dom.retakeCamera.addEventListener('click', function () {
        camera.open();
        if (dom.viewCamera && window.innerWidth < 1024) {
          dom.viewCamera.scrollIntoView({ behavior: FG.util.prefersReduced() ? 'auto' : 'smooth', block: 'center' });
        }
      });
    }

    // Dropzone interactions
    if (dom.dropzone) {
      dom.dropzone.addEventListener('click', function () {
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

    // Change image / Browse button
    if (dom.replace) {
      dom.replace.addEventListener('click', function () {
        setTab('upload');
        dom.input.click();
      });
    }

    // Remove image
    if (dom.remove) {
      dom.remove.addEventListener('click', function () {
        resetPreview();
        FG.util.toast(t('msg.imageRemoved', 'Image removed.'), { duration: 2200 });
      });
    }

    // Analyze Fruit & Retry
    if (dom.analyze) dom.analyze.addEventListener('click', analyze);
    if (dom.retry) dom.retry.addEventListener('click', analyze);

    // Keyboard controls when camera is active (Escape: Cancel, Space/Enter: Shutter)
    window.addEventListener('keydown', function (e) {
      if (!camera.isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        camera.close();
      } else if (e.key === ' ' || e.key === 'Enter') {
        if (document.activeElement && document.activeElement.tagName === 'BUTTON') return;
        e.preventDefault();
        camera.capture();
      }
    });

    // Cleanup resources when navigating away from the page
    window.addEventListener('beforeunload', camera.stopStream);
    window.addEventListener('pagehide', camera.stopStream);

    // Listen to language changes
    document.addEventListener('fg:langchange', onLanguageChange);
  }

  /* ---------------- Initialization ---------------- */
  function init() {
    cache();
    bind();
    resetPreview();
    setTab('upload');
    initDemo();

    var scenario = FG.config.scenario;
    if (scenario) {
      FG.api.forcedScenario = scenario;
      if (dom.statusChip) {
        dom.statusChip.className = 'chip chip-demo';
        dom.statusChip.innerHTML = '<span class="icon text-[15px]">science</span> Scenario: ' + FG.util.escapeHtml(scenario);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
