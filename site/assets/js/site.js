/* NEXGEN Holdings — site.js
   Progressive enhancement only: the site stays readable and navigable without JS. */
(function () {
  'use strict';

  var doc = document;
  doc.documentElement.classList.add('js');

  var mq = function (query) {
    return !!(window.matchMedia && window.matchMedia(query).matches);
  };
  /* Must match the desktop nav breakpoint in site.css (min-width: 940px),
     otherwise the drawer and the row disagree about which mode is active. */
  var isDesktop = function () { return window.innerWidth >= 940; };
  var reduceMotion = mq('(prefers-reduced-motion: reduce)');

  /* --- Primary navigation ------------------------------------------------- */
  var toggle = doc.querySelector('[data-nav-toggle]');
  var menu = doc.getElementById('primary-menu');
  /* Each Companies group registers a state-sync here, so opening or closing the
     drawer can put the carets back in the state that mode expects. */
  var dropSyncers = [];

  if (toggle && menu) {
    var setNav = function (open) {
      doc.body.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
      /* Touching the bar always leaves it on screen, and forgets the previous
         scroll direction, so opening or closing the drawer is never a fight
         with the hide rule. */
      if (topbarApi) { topbarApi.pin(); topbarApi.sync(); }
      dropSyncers.forEach(function (fn) { fn(); });
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
      /* Any click inside the drawer is navigation, not dismissal. This guard
         used to name a class that does not exist, so a tap on the group's
         caret both toggled the list and closed the drawer. */
      if (event.target.closest('.topbar__nav')) return;
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

  /* --- Companies disclosure ------------------------------------------------
     The group is a link plus a caret button. On desktop the caret opens a
     panel below; in the drawer it folds a list that starts folded once JS runs
     and stays open without it, so the links work with no JS at all. */
  var drops = Array.prototype.slice.call(doc.querySelectorAll('[data-drop]'));

  drops.forEach(function (wrap) {
    var caret = wrap.querySelector('[data-drop-toggle]');
    if (!caret) return;

    var dropOpen = function () { return wrap.classList.contains('is-open'); };
    var dropCollapsed = function () { return wrap.classList.contains('is-collapsed'); };

    var setDrop = function (open) {
      wrap.classList.toggle('is-open', open);
      caret.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    var setCollapsed = function (collapsed) {
      wrap.classList.toggle('is-collapsed', collapsed);
      caret.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    };

    caret.addEventListener('click', function (event) {
      /* Stop the document listener above from also closing the drawer. */
      event.stopPropagation();
      if (isDesktop()) setDrop(!dropOpen());
      else setCollapsed(!dropCollapsed());
    });

    /* Tabbing out of the group closes the panel; moving focus within keeps it. */
    wrap.addEventListener('focusout', function () {
      window.setTimeout(function () {
        if (isDesktop() && !wrap.contains(doc.activeElement)) setDrop(false);
      }, 0);
    });

    wrap.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape' && event.key !== 'Esc') return;
      if (!isDesktop() || !dropOpen()) return;
      setDrop(false);
      caret.focus();
    });

    var syncCaret = function () {
      caret.setAttribute('aria-expanded', isDesktop()
        ? (dropOpen() ? 'true' : 'false')
        : (dropCollapsed() ? 'false' : 'true'));
    };
    /* In the drawer the list starts folded so the menu reads Home, About,
       Companies. It is only folded here, not in the markup, so a visitor with
       scripting off still gets every company link. */
    if (!isDesktop()) setCollapsed(true);
    syncCaret();
    dropSyncers.push(syncCaret);

    /* Crossing the breakpoint must not leave either mode half applied. */
    var wasDesktop = isDesktop();
    window.addEventListener('resize', function () {
      var nowDesktop = isDesktop();
      if (nowDesktop === wasDesktop) return;
      wasDesktop = nowDesktop;
      setDrop(false);
      /* Desktop shows the panel via .is-open, so nothing may stay folded there;
         the drawer folds again on the way back down. */
      setCollapsed(!nowDesktop);
      syncCaret();
    });
  });

  /* A click anywhere else closes an open desktop panel. In the drawer there is
     nothing to close this way, and touching the caret's aria here would
     contradict the list's expanded-by-default state. */
  if (drops.length) {
    doc.addEventListener('click', function (event) {
      if (!isDesktop()) return;
      drops.forEach(function (wrap) {
        if (wrap.contains(event.target)) return;
        wrap.classList.remove('is-open');
        var c = wrap.querySelector('[data-drop-toggle]');
        if (c) c.setAttribute('aria-expanded', 'false');
      });
    });

    /* Escape closes the open panel wherever focus sits, not only inside the
       group: clicking the caret does not always move focus onto it. */
    doc.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape' && event.key !== 'Esc') return;
      drops.forEach(function (wrap) {
        if (!wrap.classList.contains('is-open')) return;
        wrap.classList.remove('is-open');
        var c = wrap.querySelector('[data-drop-toggle]');
        if (c) { c.setAttribute('aria-expanded', 'false'); c.focus(); }
      });
    });
  }

  /* --- Topbar: lift once the page moves, retire on the way down ----------- */
  var topbar = doc.querySelector('.topbar');
  var topbarApi = null;
  if (topbar) {
    var ticking = false;
    var lastY = Math.max(0, window.scrollY);
    /* Don't hide in the opening stretch of the page: at that point the bar is
       still the page's header, not a way back. */
    var KEEP_VISIBLE_UNTIL = 140;
    /* Ignore sub-pixel and rubber-band noise, and iOS' scroll bounce. */
    var HYSTERESIS = 6;

    var syncTopbar = function () {
      var y = Math.max(0, window.scrollY);
      var dy = y - lastY;
      topbar.classList.toggle('is-stuck', y > 8);

      if (doc.body.classList.contains('nav-open') || topbar.contains(doc.activeElement)) {
        /* Never retire the bar out from under an open drawer or a focused link. */
        topbar.classList.remove('is-hidden');
      } else if (y < KEEP_VISIBLE_UNTIL) {
        topbar.classList.remove('is-hidden');
      } else if (dy > HYSTERESIS) {
        topbar.classList.add('is-hidden');
      } else if (dy < -HYSTERESIS) {
        topbar.classList.remove('is-hidden');
      }

      lastY = y;
      ticking = false;
    };
    topbarApi = {
      sync: syncTopbar,
      pin: function () {
        topbar.classList.remove('is-hidden');
        lastY = Math.max(0, window.scrollY);
      }
    };
    syncTopbar();
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(syncTopbar);
    }, { passive: true });
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
