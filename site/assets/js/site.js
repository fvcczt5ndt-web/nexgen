/* NEXGEN Holdings — site.js
   Progressive enhancement only: the site stays readable and navigable without JS. */
(function () {
  'use strict';

  var doc = document;
  doc.documentElement.classList.add('js');

  var mq = function (query) {
    return !!(window.matchMedia && window.matchMedia(query).matches);
  };
  /* Must match the desktop nav breakpoint in site.css (min-width: 1100px),
     otherwise the drawer and the row disagree about which mode is active. */
  var isDesktop = function () { return window.innerWidth >= 1100; };
  var reduceMotion = mq('(prefers-reduced-motion: reduce)');

  /* --- Primary navigation ------------------------------------------------- */
  var toggle = doc.querySelector('[data-nav-toggle]');
  var menu = doc.getElementById('primary-menu');

  if (toggle && menu) {
    var setNav = function (open) {
      doc.body.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    };

    toggle.addEventListener('click', function () {
      setNav(toggle.getAttribute('aria-expanded') !== 'true');
    });

    menu.addEventListener('click', function (event) {
      var link = event.target.closest('a');
      if (link) setNav(false);
    });

    doc.addEventListener('click', function (event) {
      if (!doc.body.classList.contains('nav-open')) return;
      if (event.target.closest('[data-nav-toggle]')) return;
      if (event.target.closest('.topbar__panel')) return;
      setNav(false);
    });

    doc.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape' && event.key !== 'Esc') return;
      if (doc.body.classList.contains('nav-open')) {
        setNav(false);
        toggle.focus();
      }
    });

    window.addEventListener('resize', function () {
      if (isDesktop()) setNav(false);
    });
  }

  /* --- Topbar: subtle lift once the page moves (no height change) -------- */
  var topbar = doc.querySelector('.topbar');
  if (topbar) {
    var ticking = false;
    var syncTopbar = function () {
      topbar.classList.toggle('is-stuck', window.scrollY > 8);
      ticking = false;
    };
    syncTopbar();
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(syncTopbar);
    }, { passive: true });
  }

  /* --- Mobile sticky action bar (appears once the hero scrolls away) ----- */
  var ctaBar = doc.querySelector('[data-mobile-cta]');
  var hero = doc.querySelector('.hero');

  if (ctaBar) {
    if (hero && 'IntersectionObserver' in window) {
      var heroObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var past = !entry.isIntersecting && entry.boundingClientRect.top < 0;
          ctaBar.classList.toggle('is-visible', past);
        });
      }, { threshold: 0 });
      heroObserver.observe(hero);
    } else {
      ctaBar.classList.add('is-visible');
    }
  }

  /* --- Reveal on scroll -------------------------------------------------- */
  var revealables = Array.prototype.slice.call(doc.querySelectorAll('.reveal'));

  if (!revealables.length) return;

  var showAll = function () {
    revealables.forEach(function (el) { el.classList.add('is-visible'); });
  };

  if (reduceMotion || !('IntersectionObserver' in window)) {
    showAll();
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

  revealables.forEach(function (el) { observer.observe(el); });

  /* Safety net: never leave content hidden (e.g. observer never fires). */
  window.setTimeout(function () {
    revealables.forEach(function (el) {
      var box = el.getBoundingClientRect();
      if (box.top < window.innerHeight) el.classList.add('is-visible');
    });
  }, 1200);
})();
