/* ============================================================
   FruGrade — config & utilities
   Konfigurasi terpusat untuk model CNN, dataset, dan mode API.
   Spesifikasi model:
     - Model: Custom CNN
     - Framework: TensorFlow / Keras
     - Input shape: 224 × 224 × 3
     - Classes: 12 kelas (6 jenis buah × 2 kondisi: Fresh / Rotten)
     - Checkpoint: .keras
   ============================================================ */
(function () {
  'use strict';

  window.FG = window.FG || {};

  var params = new URLSearchParams(window.location.search);

  FG.config = {
    /**
     * 'mock'  -> prediksi disimulasikan di browser (untuk demo / pengujian frontend)
     * 'live'  -> kirim multipart ke Flask (POST {apiBase}{predictPath})
     */
    mode: 'mock',

    apiBase: '',
    predictPath: '/predict',
    requestTimeout: 30000,

    // Validasi input klien (file sebelum diproses & di-resize ke 224x224 oleh backend)
    maxFileMB: 10,
    minDimension: 64,
    acceptedTypes: ['image/jpeg', 'image/png'],
    acceptedExt: ['jpg', 'jpeg', 'png'],
    maxSendEdge: 1024,

    // Demo scenario: ?scenario=fresh|rotten|error|slow
    scenario: params.get('scenario') || null,
    demo: params.get('demo') === '1',

    // Spesifikasi Model CNN (TensorFlow / Keras)
    model: {
      name: 'Custom CNN',
      framework: 'TensorFlow / Keras',
      input: '224 × 224 × 3',
      inputShape: [224, 224, 3],
      classesCount: 12,
      checkpoint: 'frugrade_model.keras',
      version: 'v1.0'
    },

    // 12 Kelas Dataset FruGrade (6 Buah × 2 Kondisi)
    classes: [
      'FreshApple', 'FreshBanana', 'FreshMango', 'FreshOrange', 'FreshStrawberry', 'FreshTomato',
      'RottenApple', 'RottenBanana', 'RottenMango', 'RottenOrange', 'RottenStrawberry', 'RottenTomato'
    ],

    // Mapping 6 jenis buah
    fruits: {
      apple: { id: 'apple', nameId: 'Apel', nameEn: 'Apple', latin: 'Malus domestica', image: 'assets/img/apple.jpg' },
      banana: { id: 'banana', nameId: 'Pisang', nameEn: 'Banana', latin: 'Musa × paradisiaca', image: 'assets/img/banana.jpg' },
      mango: { id: 'mango', nameId: 'Mangga', nameEn: 'Mango', latin: 'Mangifera indica', image: 'assets/img/hero-fruit.jpg' },
      orange: { id: 'orange', nameId: 'Jeruk', nameEn: 'Orange', latin: 'Citrus × sinensis', image: 'assets/img/orange.jpg' },
      strawberry: { id: 'strawberry', nameId: 'Stroberi', nameEn: 'Strawberry', latin: 'Fragaria × ananassa', image: 'assets/img/hero-fruit.jpg' },
      tomato: { id: 'tomato', nameId: 'Tomat', nameEn: 'Tomato', latin: 'Solanum lycopersicum', image: 'assets/img/hero-fruit.jpg' }
    },

    labels: {
      fresh: 'Segar',
      rotten: 'Busuk',
      freshEn: 'Fresh',
      rottenEn: 'Rotten'
    }
  };

  /**
   * Helper untuk mengurai label kelas teknis (misal 'FreshApple', 'RottenTomato', 'fresh_mango')
   * menjadi komponen terstruktur tanpa mengubah label asli dan tanpa asumsi Apple sebagai fallback.
   */
  FG.parseClass = function (rawLabel) {
    if (!rawLabel) {
      return {
        fruit: 'unknown',
        freshness: 'unknown',
        nameId: 'Tidak Dikenali',
        nameEn: 'Unknown',
        latin: '',
        image: 'assets/img/hero-fruit.jpg',
        raw: ''
      };
    }

    var str = String(rawLabel).trim();

    // 1. Coba pola [Kondisi][Jenis] seperti 'FreshApple', 'RottenBanana', 'fresh_orange'
    var match = /^(fresh|rotten)[_\s-]?([a-z]+)$/i.exec(str);
    if (match) {
      var freshness = match[1].toLowerCase();
      var rawFruit = match[2].toLowerCase();
      // Standarisasi plural bila ada (apples -> apple, tomatoes -> tomato)
      var fruitKey = rawFruit.replace(/s$/, '');
      if (fruitKey === 'tomatoe') fruitKey = 'tomato';
      if (!FG.config.fruits[fruitKey] && FG.config.fruits[rawFruit]) fruitKey = rawFruit;

      var fInfo = FG.config.fruits[fruitKey];
      return {
        fruit: fruitKey,
        freshness: freshness,
        nameId: fInfo ? fInfo.nameId : match[2],
        nameEn: fInfo ? fInfo.nameEn : match[2],
        latin: fInfo ? fInfo.latin : '',
        image: fInfo ? fInfo.image : 'assets/img/hero-fruit.jpg',
        raw: str
      };
    }

    // 2. Coba cari kata kunci buah di dalam string
    var lower = str.toLowerCase();
    for (var k in FG.config.fruits) {
      var item = FG.config.fruits[k];
      if (lower.indexOf(k) !== -1 || (item.nameId && lower.indexOf(item.nameId.toLowerCase()) !== -1)) {
        var fr = (lower.indexOf('rotten') !== -1 || lower.indexOf('busuk') !== -1) ? 'rotten' : 'fresh';
        return {
          fruit: k,
          freshness: fr,
          nameId: item.nameId,
          nameEn: item.nameEn,
          latin: item.latin,
          image: item.image,
          raw: str
        };
      }
    }

    // 3. Fallback: tampilkan label asli apa adanya tanpa menebak atau berasumsi Apple
    return {
      fruit: 'unknown',
      freshness: 'unknown',
      nameId: str,
      nameEn: str,
      latin: '',
      image: 'assets/img/hero-fruit.jpg',
      raw: str
    };
  };

  FG.util = {
    $: function (sel, ctx) { return (ctx || document).querySelector(sel); },
    $$: function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); },

    prefersReduced: function () {
      return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },

    isTouch: function () {
      return window.matchMedia && window.matchMedia('(hover: none)').matches;
    },

    formatBytes: function (bytes) {
      if (!bytes && bytes !== 0) return '—';
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    },

    formatPercent: function (value, digits) {
      if (typeof value !== 'number' || isNaN(value)) return '—';
      return (value * 100).toFixed(digits == null ? 1 : digits) + '%';
    },

    clamp: function (v, min, max) { return Math.min(max, Math.max(min, v)); },

    ext: function (name) {
      var parts = String(name || '').toLowerCase().split('.');
      return parts.length > 1 ? parts.pop() : '';
    },

    escapeHtml: function (str) {
      return String(str == null ? '' : str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    /** Tampilkan toast global dengan dukungan i18n */
    toast: function (message, opts) {
      opts = opts || {};
      var text = (window.FG && window.FG.i18n && typeof window.FG.i18n.t === 'function')
        ? window.FG.i18n.t(message, message)
        : message;

      var el = document.getElementById('toast');
      if (!el) {
        el = document.createElement('div');
        el.id = 'toast';
        el.className = 'toast';
        el.setAttribute('role', 'status');
        el.setAttribute('aria-live', 'polite');
        document.body.appendChild(el);
      }
      var icon = opts.type === 'error' ? 'error' : (opts.type === 'success' ? 'check_circle' : 'info');
      el.className = 'toast' + (opts.type === 'error' ? ' is-error' : '');
      el.innerHTML = '<span class="icon" aria-hidden="true">' + icon + '</span><span>' + FG.util.escapeHtml(text) + '</span>';
      void el.offsetWidth;
      el.classList.add('is-visible');
      clearTimeout(el._timer);
      el._timer = setTimeout(function () { el.classList.remove('is-visible'); }, opts.duration || 3600);
    }
  };

  // Validasi ringan untuk kontrak API
  FG.validateResult = function (data) {
    if (!data || typeof data !== 'object') return false;
    if (!data.fruit && !data.label) return false;
    if (data.confidence != null && (typeof data.confidence !== 'number' || data.confidence < 0 || data.confidence > 1)) {
      return false;
    }
    if (data.freshness && data.freshness !== 'fresh' && data.freshness !== 'rotten' && data.freshness !== 'unknown') {
      return false;
    }
    return true;
  };
})();
