/* ============================================================
   FruGrade — handoff antar halaman (sessionStorage)
   MVP tidak menyimpan riwayat; data dihapus setelah "Scan Another".
   ============================================================ */
(function () {
  'use strict';

  window.FG = window.FG || {};

  // Satu-satunya "database" demo: sessionStorage milik tab yang aktif.
  var KEY = 'frugrade:last-result';

  FG.store = {
    save: function (payload) {
      try {
        sessionStorage.setItem(KEY, JSON.stringify(payload));
        return true;
      } catch (err) {
        // Kuota penuh (gambar terlalu besar) — simpan tanpa gambar.
        try {
          sessionStorage.setItem(KEY, JSON.stringify(Object.assign({}, payload, { image: null })));
          return true;
        } catch (err2) {
          return false;
        }
      }
    },

    load: function () {
      try {
        var raw = sessionStorage.getItem(KEY);
        if (!raw) return null;
        var data = JSON.parse(raw);
        if (!data || !data.result) return null;
        return data;
      } catch (err) {
        return null;
      }
    },

    clear: function () {
      try { sessionStorage.removeItem(KEY); } catch (err) { /* noop */ }
    },

    /**
     * Buat thumbnail untuk disimpan & ditampilkan di halaman hasil.
     * @param {File|Blob|string} source
     * @param {number} maxEdge
     * @returns {Promise<{dataUrl:string,width:number,height:number}>}
     */
    makeThumb: function (source, maxEdge) {
      maxEdge = maxEdge || 900;

      return new Promise(function (resolve, reject) {
        if (!source) return reject(new Error('Sumber gambar kosong.'));

        var objectUrl = null;

        function fromSrc(src, revoke) {
          var img = new Image();
          img.onload = function () {
            try {
              var scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));
              var w = Math.round(img.naturalWidth * scale);
              var h = Math.round(img.naturalHeight * scale);
              var canvas = document.createElement('canvas');
              canvas.width = w;
              canvas.height = h;
              var ctx = canvas.getContext('2d');
              ctx.imageSmoothingQuality = 'high';
              ctx.drawImage(img, 0, 0, w, h);
              var dataUrl = canvas.toDataURL('image/jpeg', 0.84);
              if (revoke && objectUrl) URL.revokeObjectURL(objectUrl);
              resolve({ dataUrl: dataUrl, width: img.naturalWidth, height: img.naturalHeight });
            } catch (err) {
              if (revoke && objectUrl) URL.revokeObjectURL(objectUrl);
              reject(err);
            }
          };
          img.onerror = function () {
            if (revoke && objectUrl) URL.revokeObjectURL(objectUrl);
            reject(new Error('Gambar tidak dapat dibaca.'));
          };
          img.src = src;
        }

        if (typeof source === 'string') {
          fromSrc(source, false);
        } else {
          objectUrl = URL.createObjectURL(source);
          fromSrc(objectUrl, true);
        }
      });
    }
  };
})();
