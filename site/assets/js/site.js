/* NEXGEN Holdings — site.js
   Progressive enhancement only: the site stays readable and navigable without JS. */
(function () {
  'use strict';

  var doc = document;
  doc.documentElement.classList.add('js');

  var mq = function (query) {
    return !!(window.matchMedia && window.matchMedia(query).matches);
  };
  var isDesktop = function () { return window.innerWidth > 900; };
  var reduceMotion = mq('(prefers-reduced-motion: reduce)');

  /* --- Primary navigation + Companies dropdown -------------------------- */
  var toggle = doc.querySelector('[data-nav-toggle]');
  var menu = doc.getElementById('primary-menu');
  var drop = doc.querySelector('[data-drop-toggle]');
  var dropWrap = drop ? drop.closest('[data-drop]') : null;

  var setDrop = function (open) {
    if (!drop || !dropWrap) return;
    dropWrap.classList.toggle('is-open', open);
    drop.setAttribute('aria-expanded', open ? 'true' : 'false');
  };
  var dropIsOpen = function () {
    return !!(dropWrap && dropWrap.classList.contains('is-open'));
  };
  /* On small screens the Companies group is expanded by default; the toggle
     collapses it. Kept in CSS so it also works without JS. */
  var setDropCollapsed = function (collapsed) {
    if (!drop || !dropWrap) return;
    dropWrap.classList.toggle('is-collapsed', collapsed);
    drop.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  };
  var dropIsCollapsed = function () {
    return !!(dropWrap && dropWrap.classList.contains('is-collapsed'));
  };

  if (toggle && menu) {
    var setNav = function (open) {
      doc.body.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
      if (!open && isDesktop()) setDrop(false);
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
      if (dropIsOpen()) {
        setDrop(false);
        drop.focus();
        return;
      }
      if (doc.body.classList.contains('nav-open')) {
        setNav(false);
        toggle.focus();
      }
    });

    window.addEventListener('resize', function () {
      if (isDesktop()) setNav(false);
    });
  }

  if (drop && dropWrap) {
    /* Disclosure pattern: the button owns the open/closed state, so a click or
       Enter/Space never fights an automatic focus/hover open. */
    drop.addEventListener('click', function () {
      if (isDesktop()) setDrop(!dropIsOpen());
      else setDropCollapsed(!dropIsCollapsed());
    });

    /* Tabbing out of the group closes it; moving focus inside keeps it open. */
    dropWrap.addEventListener('focusout', function () {
      window.setTimeout(function () {
        if (isDesktop() && !dropWrap.contains(doc.activeElement)) setDrop(false);
      }, 0);
    });

    var syncDropAria = function () {
      if (isDesktop()) drop.setAttribute('aria-expanded', dropIsOpen() ? 'true' : 'false');
      else drop.setAttribute('aria-expanded', dropIsCollapsed() ? 'false' : 'true');
    };
    syncDropAria();
    window.addEventListener('resize', syncDropAria);

    /* Crossing the breakpoint must not leave either mode half-applied. */
    var wasDesktop = isDesktop();
    window.addEventListener('resize', function () {
      var nowDesktop = isDesktop();
      if (nowDesktop === wasDesktop) return;
      wasDesktop = nowDesktop;
      setDrop(false);
      setDropCollapsed(false);
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
