/* ============================================================
   FruGrade — motion behavior (GSAP + IntersectionObserver)
   Semua efek di-skip otomatis saat prefers-reduced-motion.
   ============================================================ */
(function () {
  'use strict';

  window.FG = window.FG || {};

  var $ = FG.util.$;
  var $$ = FG.util.$$;
  var reduced = FG.util.prefersReduced();
  var hasGsap = typeof window.gsap !== 'undefined';

  function showEverything() {
    $$('[data-reveal]').forEach(function (el) { el.classList.add('is-in'); });
    $$('[data-hero-item]').forEach(function (el) {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    $$('.split-line > span').forEach(function (el) { el.style.transform = 'none'; });
  }

  /* ---------------- header ---------------- */
  function initHeader() {
    var header = document.getElementById('site-header');
    if (!header) return;
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------------- mode (mock / live) ---------------- */
  function initModeState() {
    if (!window.FG || !FG.config) return;
    var live = FG.config.mode === 'live';
    var label = live ? 'Model aktif' : 'Mode demo';

    $$('[data-mode-label], [data-mode-badge]').forEach(function (el) {
      el.textContent = label;
    });

    if (live) {
      $$('[data-demo-only]').forEach(function (el) {
        el.hidden = true;
        el.classList.add('is-hidden');
      });
    }
  }

  /* ---------------- active nav ---------------- */
  function initNav() {
    var page = document.body.getAttribute('data-page');
    $$('[data-nav]').forEach(function (link) {
      var key = link.getAttribute('data-nav');
      var active = (key === 'home' && page === 'home') || (key === 'scan' && page !== 'home');
      if (active) {
        link.classList.add('is-active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  /* ---------------- reveal on scroll ---------------- */
  function initReveal() {
    var els = $$('[data-reveal]');
    if (!els.length) return;

    // Stagger otomatis per grup
    $$('[data-reveal-group]').forEach(function (group) {
      $$('[data-reveal]', group).forEach(function (el, i) {
        if (!el.style.getPropertyValue('--reveal-delay')) {
          el.style.setProperty('--reveal-delay', (i * 80) + 'ms');
        }
      });
    });

    if (reduced || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------------- hero timeline ---------------- */
  function initHero() {
    var hero = $('[data-hero]');
    if (!hero) return;

    var items = $$('[data-hero-item]', hero);
    var lines = $$('.split-line > span', hero);
    var floats = $$('[data-hero-float]', hero);

    if (reduced || !hasGsap) {
      showEverything();
      return;
    }

    var tl = window.gsap.timeline({ defaults: { ease: 'power3.out' } });

    if (lines.length) {
      tl.to(lines, { y: 0, duration: 0.95, stagger: 0.09 }, 0.12);
    }
    if (items.length) {
      tl.to(items, {
        opacity: 1,
        y: 0,
        duration: 0.75,
        stagger: 0.075
      }, lines.length ? 0.3 : 0.1);
    }
    if (floats.length) {
      tl.from(floats, {
        opacity: 0,
        scale: 0.7,
        duration: 0.8,
        stagger: 0.12,
        ease: 'back.out(1.7)'
      }, 0.55);
    }

    // Jaring pengaman bila tab tidak aktif saat load: paksa terlihat.
    // Jangan mengosongkan style — itu akan mengembalikan opacity:0 dari CSS.
    window.setTimeout(function () {
      window.gsap.set(items, { opacity: 1, y: 0 });
      if (lines.length) window.gsap.set(lines, { y: 0 });
    }, 4000);
  }

  /* ---------------- count up ---------------- */
  function initCounters() {
    var els = $$('[data-count-to]');
    if (!els.length) return;

    function format(value, decimals) {
      return decimals > 0 ? value.toFixed(decimals) : String(Math.round(value));
    }

    els.forEach(function (el) {
      var to = parseFloat(el.getAttribute('data-count-to'));
      var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
      if (isNaN(to)) return;
      if (reduced || !hasGsap) {
        el.textContent = format(to, decimals);
        return;
      }
      var state = { v: 0 };
      var played = false;
      var io = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting || played) return;
        played = true;
        io.disconnect();
        window.gsap.to(state, {
          v: to,
          duration: 1.3,
          ease: 'power2.out',
          onUpdate: function () { el.textContent = format(state.v, decimals); }
        });
      }, { threshold: 0.4 });
      io.observe(el);
    });
  }

  /* ---------------- 3D tilt ---------------- */
  function initTilt() {
    if (reduced || !hasGsap || FG.util.isTouch()) return;

    $$('[data-tilt]').forEach(function (el) {
      var strength = parseFloat(el.getAttribute('data-tilt')) || 5;
      window.gsap.set(el, { transformPerspective: 1000, transformStyle: 'preserve-3d' });
      var rx = window.gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3.out' });
      var ry = window.gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3.out' });

      el.addEventListener('pointermove', function (e) {
        var rect = el.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width - 0.5;
        var py = (e.clientY - rect.top) / rect.height - 0.5;
        ry(px * strength);
        rx(-py * strength);
      });

      el.addEventListener('pointerleave', function () {
        rx(0);
        ry(0);
      });
    });
  }

  /* ---------------- magnetic buttons ---------------- */
  function initMagnetic() {
    if (reduced || !hasGsap || FG.util.isTouch()) return;

    $$('[data-magnetic]').forEach(function (el) {
      var strength = parseFloat(el.getAttribute('data-magnetic')) || 10;
      var xTo = window.gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
      var yTo = window.gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });

      el.addEventListener('pointermove', function (e) {
        var rect = el.getBoundingClientRect();
        xTo(((e.clientX - rect.left) / rect.width - 0.5) * strength);
        yTo(((e.clientY - rect.top) / rect.height - 0.5) * strength * 0.7);
      });
      el.addEventListener('pointerleave', function () {
        xTo(0);
        yTo(0);
      });
    });
  }

  /* ---------------- parallax ---------------- */
  function initParallax() {
    if (reduced || !hasGsap || typeof window.ScrollTrigger === 'undefined') return;
    window.gsap.registerPlugin(window.ScrollTrigger);

    $$('[data-parallax]').forEach(function (el) {
      var amount = parseFloat(el.getAttribute('data-parallax')) || -40;
      window.gsap.to(el, {
        y: amount,
        ease: 'none',
        scrollTrigger: {
          trigger: el.closest('[data-parallax-scope]') || el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.6
        }
      });
    });
  }

  /* ---------------- page transitions ---------------- */
  function initPageTransitions() {
    if (reduced) return;

    document.body.classList.add('page-anim');

    $$('a[href]').forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href) return;
      if (href.charAt(0) === '#' || /^(mailto:|tel:|javascript:)/.test(href)) return;
      if (link.target === '_blank' || link.hasAttribute('download')) return;
      if (link.hostname && link.hostname !== window.location.hostname) return;

      link.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        // View Transitions API menangani transisi cross-document sendiri
        if (typeof document.startViewTransition === 'function') return;

        e.preventDefault();
        document.body.classList.add('is-leaving');
        window.setTimeout(function () {
          window.location.href = link.href;
        }, 160);
      });
    });
  }

  /* ---------------- boot ---------------- */
  function init() {
    initModeState();
    initHeader();
    initNav();
    initReveal();
    initHero();
    initCounters();
    initTilt();
    initMagnetic();
    initParallax();
    initPageTransitions();

    // Bila GSAP gagal dimuat, jangan biarkan konten tak terlihat
    if (!hasGsap && !reduced) {
      window.setTimeout(showEverything, 600);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
