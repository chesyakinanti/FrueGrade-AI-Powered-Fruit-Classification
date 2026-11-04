/* ============================================================
   FruGrade — Fruit Friends
   Maskot SVG inline (bisa diakses pupilnya), eye-tracking, confetti.
   ============================================================ */
(function () {
  'use strict';

  window.FG = window.FG || {};

  var reduced = FG.util.prefersReduced();
  var isTouch = FG.util.isTouch();
  var uid = 0;

  function face(cx1, cx2, cy, mouth) {
    return (
      '<g class="eye">' +
        '<ellipse class="pupil" cx="' + cx1 + '" cy="' + cy + '" rx="3.6" ry="4.7" fill="#3D3835"/>' +
        '<circle cx="' + (cx1 + 1.2) + '" cy="' + (cy - 1.6) + '" r="1.2" fill="#FFFDF8"/>' +
      '</g>' +
      '<g class="eye">' +
        '<ellipse class="pupil" cx="' + cx2 + '" cy="' + cy + '" rx="3.6" ry="4.7" fill="#3D3835"/>' +
        '<circle cx="' + (cx2 + 1.2) + '" cy="' + (cy - 1.6) + '" r="1.2" fill="#FFFDF8"/>' +
      '</g>' +
      '<path class="mouth" d="' + mouth + '" stroke="#3D3835" stroke-width="2.6" stroke-linecap="round" fill="none"/>'
    );
  }

  var TEMPLATES = {
    apple: function (id) {
      return (
        '<svg viewBox="0 0 120 120" class="mascot-svg" aria-hidden="true" focusable="false">' +
          '<defs>' +
            '<radialGradient id="apG' + id + '" cx="34%" cy="26%" r="80%">' +
              '<stop offset="0" stop-color="#FF9C9E"/>' +
              '<stop offset=".55" stop-color="#F45155"/>' +
              '<stop offset="1" stop-color="#C42F3C"/>' +
            '</radialGradient>' +
          '</defs>' +
          '<ellipse cx="61" cy="108" rx="28" ry="5.5" fill="#3D3835" opacity=".1"/>' +
          '<path d="M60 36c-8-9-22-10-31-1C17 47 18 68 28 83c7 11 16 18 25 18 3 0 5-1 7-1s4 1 7 1c9 0 18-7 25-18 10-15 11-36-1-48-9-9-23-8-31 1z" fill="url(#apG' + id + ')"/>' +
          '<path d="M60 36c0-8 2-14 7-19" stroke="#7A4A2A" stroke-width="4.4" stroke-linecap="round" fill="none"/>' +
          '<path d="M67 19c7-8 19-9 27-3-4 9-15 13-26 8z" fill="#7BA65B"/>' +
          '<path d="M68 19c6-3 13-4 19-3" stroke="#5E8A44" stroke-width="1.3" fill="none" opacity=".65"/>' +
          '<ellipse cx="38" cy="52" rx="9" ry="5.5" fill="#FFFDF8" opacity=".2" transform="rotate(-28 38 52)"/>' +
          face(47, 73, 63, 'M54 76q6 5 12 0') +
          '<ellipse cx="33" cy="75" rx="5" ry="3" fill="#FFA45B" opacity=".32"/>' +
          '<ellipse cx="87" cy="75" rx="5" ry="3" fill="#FFA45B" opacity=".32"/>' +
        '</svg>'
      );
    },

    orange: function (id) {
      return (
        '<svg viewBox="0 0 120 120" class="mascot-svg" aria-hidden="true" focusable="false">' +
          '<defs>' +
            '<radialGradient id="orG' + id + '" cx="34%" cy="28%" r="78%">' +
              '<stop offset="0" stop-color="#FFD08F"/>' +
              '<stop offset=".5" stop-color="#FFA45B"/>' +
              '<stop offset="1" stop-color="#E07A2F"/>' +
            '</radialGradient>' +
          '</defs>' +
          '<ellipse cx="60" cy="109" rx="28" ry="5.5" fill="#3D3835" opacity=".1"/>' +
          '<circle cx="60" cy="66" r="37" fill="url(#orG' + id + ')"/>' +
          '<circle cx="60" cy="66" r="36.5" fill="none" stroke="#D4741F" stroke-width="1" opacity=".35"/>' +
          '<g fill="#C96A1C" opacity=".13">' +
            '<circle cx="42" cy="80" r="1.3"/><circle cx="50" cy="88" r="1.1"/>' +
            '<circle cx="70" cy="86" r="1.2"/><circle cx="82" cy="72" r="1.1"/>' +
            '<circle cx="36" cy="62" r="1.1"/><circle cx="78" cy="52" r="1"/>' +
          '</g>' +
          '<path d="M60 30c0-6 1-9 4-12" stroke="#7A4A2A" stroke-width="4" stroke-linecap="round" fill="none"/>' +
          '<path d="M64 21c7-8 18-8 25-2-4 9-15 12-25 6z" fill="#7BA65B"/>' +
          '<ellipse cx="43" cy="46" rx="8.5" ry="5" fill="#FFFDF8" opacity=".28" transform="rotate(-30 43 46)"/>' +
          face(48, 72, 64, 'M54 76q6 5 12 0') +
          '<ellipse cx="34" cy="76" rx="5" ry="3" fill="#F45155" opacity=".22"/>' +
          '<ellipse cx="86" cy="76" rx="5" ry="3" fill="#F45155" opacity=".22"/>' +
        '</svg>'
      );
    },

    banana: function (id) {
      return (
        '<svg viewBox="0 0 120 120" class="mascot-svg" aria-hidden="true" focusable="false">' +
          '<defs>' +
            '<linearGradient id="bnG' + id + '" x1="0" y1="0" x2="1" y2="1">' +
              '<stop offset="0" stop-color="#FFE07A"/>' +
              '<stop offset=".5" stop-color="#FFC943"/>' +
              '<stop offset="1" stop-color="#E9A823"/>' +
            '</linearGradient>' +
          '</defs>' +
          '<ellipse cx="66" cy="100" rx="32" ry="5.5" fill="#3D3835" opacity=".1"/>' +
          '<path d="M30 28c-2 28 14 52 42 58 10 2 20 0 28-6" stroke="url(#bnG' + id + ')" stroke-width="26" fill="none" stroke-linecap="round"/>' +
          '<path d="M30 28c-2 28 14 52 42 58 10 2 20 0 28-6" stroke="#FFE9A6" stroke-width="5" fill="none" stroke-linecap="round" opacity=".45" transform="translate(-3,-5)"/>' +
          '<path d="M30 28c-2 28 14 52 42 58 10 2 20 0 28-6" stroke="#DFA01C" stroke-width="5" fill="none" stroke-linecap="round" opacity=".28" transform="translate(3,7)"/>' +
          '<circle cx="30" cy="28" r="4.2" fill="#8A6234"/>' +
          '<circle cx="100" cy="80" r="3.4" fill="#8A6234"/>' +
          '<g transform="rotate(-16 41 65)">' +
            face(36, 46, 62, 'M38 70q4 4 8 0') +
            '<ellipse cx="30" cy="70" rx="3.4" ry="2.2" fill="#F45155" opacity=".25"/>' +
            '<ellipse cx="52" cy="70" rx="3.4" ry="2.2" fill="#F45155" opacity=".25"/>' +
          '</g>' +
        '</svg>'
      );
    }
  };

  /* ---------------- mount ---------------- */
  function mount() {
    FG.util.$$('[data-mascot]').forEach(function (el) {
      if (el.getAttribute('data-mounted') === '1') return;
      var type = el.getAttribute('data-mascot');
      var make = TEMPLATES[type];
      if (!make) return;

      uid += 1;
      el.classList.add('mascot');
      if (!el.style.getPropertyValue('--mascot-size') && el.getAttribute('data-size')) {
        el.style.setProperty('--mascot-size', el.getAttribute('data-size') + 'px');
      }
      el.innerHTML = make(uid);
      el.setAttribute('data-mounted', '1');
      el.setAttribute('aria-hidden', 'true');
    });
  }

  /* ---------------- eye tracking ---------------- */
  function initEyes() {
    if (reduced || isTouch) return;

    var mascots = FG.util.$$('.mascot');
    if (!mascots.length) return;

    var pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    var targets = mascots.map(function () { return { x: 0, y: 0 }; });
    var current = mascots.map(function () { return { x: 0, y: 0 }; });
    var dirty = true;

    window.addEventListener('pointermove', function (e) {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      dirty = true;
    }, { passive: true });

    function frame() {
      if (dirty) {
        mascots.forEach(function (m, i) {
          var r = m.getBoundingClientRect();
          if (!r.width) return;
          var cx = r.left + r.width / 2;
          var cy = r.top + r.height / 2;
          var dx = pointer.x - cx;
          var dy = pointer.y - cy;
          var dist = Math.max(1, Math.hypot(dx, dy));
          var max = 2.4;
          targets[i].x = (dx / dist) * max;
          targets[i].y = (dy / dist) * max;
        });
      }

      var moving = false;
      mascots.forEach(function (m, i) {
        var t = targets[i];
        var c = current[i];
        c.x += (t.x - c.x) * 0.14;
        c.y += (t.y - c.y) * 0.14;
        if (Math.abs(c.x - t.x) > 0.02 || Math.abs(c.y - t.y) > 0.02) moving = true;

        var pupils = m.querySelectorAll('.pupil');
        for (var k = 0; k < pupils.length; k++) {
          pupils[k].style.transform = 'translate(' + c.x.toFixed(2) + 'px,' + c.y.toFixed(2) + 'px)';
        }
      });

      if (!moving) dirty = false;
      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  /* ---------------- moods ---------------- */
  function setMood(selectorOrEl, mood) {
    var el = typeof selectorOrEl === 'string' ? FG.util.$(selectorOrEl) : selectorOrEl;
    if (!el) return;
    if (mood) el.setAttribute('data-mood', mood);
    else el.removeAttribute('data-mood');
  }

  /* ---------------- confetti ---------------- */
  function celebrate(originEl) {
    if (reduced || !window.gsap) return;
    var origin = originEl && originEl.getBoundingClientRect ? originEl.getBoundingClientRect() : null;
    var cx = origin ? origin.left + origin.width / 2 : window.innerWidth / 2;
    var cy = origin ? origin.top + origin.height / 2 : window.innerHeight / 2;

    var layer = document.createElement('div');
    layer.className = 'confetti-layer';
    document.body.appendChild(layer);

    var colors = ['#F45155', '#FFA45B', '#FFC943', '#7BA65B', '#2E5D3A', '#FFDAD8'];
    var pieces = 14;
    var gsap = window.gsap;
    var i;

    for (i = 0; i < pieces; i++) {
      var piece = document.createElement('span');
      piece.className = 'confetti-piece';
      var size = 6 + Math.random() * 6;
      piece.style.width = size + 'px';
      piece.style.height = (Math.random() > 0.55 ? size : size * 0.65) + 'px';
      piece.style.background = colors[i % colors.length];
      piece.style.borderRadius = i % 3 === 0 ? '50%' : '2px';
      layer.appendChild(piece);

      if (gsap) {
        gsap.fromTo(piece, {
          x: cx,
          y: cy,
          scale: 0.4,
          opacity: 1,
          rotation: 0
        }, {
          x: cx + (Math.random() - 0.5) * 280,
          y: cy + 60 + Math.random() * 190,
          scale: 1,
          opacity: 0,
          rotation: (Math.random() - 0.5) * 540,
          duration: 1.1 + Math.random() * 0.7,
          ease: 'power2.out',
          delay: Math.random() * 0.12
        });
      }
    }

    window.setTimeout(function () {
      if (layer.parentNode) layer.parentNode.removeChild(layer);
    }, 2400);
  }

  FG.fruit = {
    mount: mount,
    setMood: setMood,
    celebrate: celebrate
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      mount();
      initEyes();
    });
  } else {
    mount();
    initEyes();
  }
})();
