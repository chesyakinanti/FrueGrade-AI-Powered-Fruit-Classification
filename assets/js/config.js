/* ============================================================
   FruGrade — config & utilities
   Satu-satunya tempat untuk mode API dan semua klaim yang belum
   tervalidasi. Jangan menampilkan angka yang tidak dihasilkan model.
   ============================================================ */
(function () {
  'use strict';

  window.FG = window.FG || {};

  var params = new URLSearchParams(window.location.search);

  FG.config = {
    /**
     * 'mock'  -> prediksi disimulasikan di browser (untuk demo / sidang)
     * 'live'  -> kirim multipart ke Flask  (POST {apiBase}{predictPath})
     */
    mode: 'mock',

    apiBase: '',
    predictPath: '/predict',
    requestTimeout: 30000,

    // Validasi klien (batas final mengikuti backend)
    maxFileMB: 10,
    minDimension: 64,
    acceptedTypes: ['image/jpeg', 'image/png'],
    acceptedExt: ['jpg', 'jpeg', 'png'],
    maxSendEdge: 1024,

    // Demo scenario: ?scenario=fresh|rotten|error|slow
    scenario: params.get('scenario') || null,
    demo: params.get('demo') === '1',

    model: {
      name: 'Custom CNN',
      framework: 'PyTorch',
      input: '128 × 128',
      version: 'v0.1'
    },

    // Angka di bawah BELUM divalidasi — tampil sebagai placeholder.
    // Isi setelah pengujian model selesai.
    claims: {
      accuracy: '[XX%]',
      latency: '[X,X s]',
      dataset: '[XX.XXX]'
    },

    // Data contoh untuk mock / demo. Bukan daftar kelas final dataset.
    fruits: {
      apple: { id: 'apple', name: 'Apel', latin: 'Malus domestica', image: 'assets/img/apple.jpg' },
      orange: { id: 'orange', name: 'Jeruk', latin: 'Citrus × sinensis', image: 'assets/img/orange.jpg' },
      banana: { id: 'banana', name: 'Pisang', latin: 'Musa × paradisiaca', image: 'assets/img/banana.jpg' }
    },

    labels: {
      fresh: 'Segar',
      rotten: 'Busuk',
      freshEn: 'Fresh',
      rottenEn: 'Rotten'
    }
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

    /** Tampilkan toast global. */
    toast: function (message, opts) {
      opts = opts || {};
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
      el.innerHTML = '<span class="icon" aria-hidden="true">' + icon + '</span><span>' + FG.util.escapeHtml(message) + '</span>';
      // paksa reflow agar transisi masuk tetap jalan
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
    if (data.freshness && data.freshness !== 'fresh' && data.freshness !== 'rotten') {
      return false;
    }
    return true;
  };
})();
