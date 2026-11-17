(function () {
  'use strict';

  var PHONE_WA = '381638836376';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Godina u footeru
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Loader: sunce izlazi iza brda, iskra prati liniju, naziv se "pali"
  var loaderEl = document.getElementById('loader');
  var ldRidge = document.getElementById('ldRidge');
  var ldLitRect = document.getElementById('ldLitRect');
  var ldSpark = document.getElementById('ldSpark');
  var ldSun = document.getElementById('ldSun');
  var ldFillSolid = document.getElementById('ldFillSolid');
  var ldFillEdge = document.getElementById('ldFillEdge');
  var ldLen = (ldRidge && ldRidge.getTotalLength) ? ldRidge.getTotalLength() : 0;
  var pageLoaded = document.readyState === 'complete';
  var loaderDone = false;
  var ldStart = performance.now();
  var LD_MIN = reduceMotion ? 900 : 3000; // minimalno trajanje (ms), promeni ako želiš brže/sporije
  document.body.style.overflow = 'hidden';

  function ldSet(p) {
    loaderEl.style.setProperty('--p', p.toFixed(4));
    if (!ldLen) return;
    var pt = ldRidge.getPointAtLength(p * ldLen);
    var x = pt.x;
    ldLitRect.setAttribute('width', Math.max(0, x + 400));
    ldSpark.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + pt.y.toFixed(1) + ')');
    var mx = x + 90 * p;                       // meka ivica svetla ispod linije
    ldFillSolid.setAttribute('width', Math.max(0, mx - 90 + 400));
    ldFillEdge.setAttribute('x', (mx - 90).toFixed(1));
    var e = p * p * (3 - 2 * p);               // izlazak sunca (smoothstep)
    ldSun.setAttribute('transform', 'translate(0 ' + (-112 * e).toFixed(1) + ')');
  }
  ldSet(0);

  function hideLoader() {
    if (loaderDone) return;
    loaderDone = true;
    if (loaderEl) loaderEl.classList.add('hide');
    document.body.style.overflow = '';
  }
  window.addEventListener('load', function () { pageLoaded = true; });

  function ldTick(now) {
    if (loaderDone) return;
    var t = Math.min((now - ldStart) / LD_MIN, 1);
    var p = 1 - Math.pow(1 - t, 2.2);
    // ne ide preko 96% dok se stranica ne učita
    if (!pageLoaded && p > 0.96) p = 0.96;
    ldSet(p);
    if (t >= 1 && pageLoaded) {
      ldSet(1);
      loaderEl.classList.add('is-done');
      setTimeout(hideLoader, 750);
      return;
    }
    requestAnimationFrame(ldTick);
  }
  requestAnimationFrame(ldTick);
  setTimeout(hideLoader, 8000); // sigurnosni rok

  // Hero pozadina: koristi sliku ako postoji
  (function () {
    var bg = document.getElementById('heroBg');
    if (!bg) return;
    // Probaj redom: images/hero.jpg, pa images/spoljasnjost-2.jpg
    var candidates = ['6.png', 'images/6.png', 'images/hero.jpg', 'images/hero.png', 'images/spoljasnjost-2.jpg'];
    (function tryNext(i) {
      if (i >= candidates.length) return;
      var img = new Image();
      img.onload = function () {
        bg.style.setProperty('--hero-img', 'url("' + candidates[i] + '")');
        bg.classList.add('has-img');
      };
      img.onerror = function () { tryNext(i + 1); };
      img.src = candidates[i];
    })(0);
  })();

  // Navigacija
  var nav = document.getElementById('nav');
  var burger = document.getElementById('burger');
  var menu = document.getElementById('menu');
  var menuOpen = false;
  var MOBILE_MAX = 820;                          // isto kao breakpoint u style.css

  function onScroll() {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function setMenu(open) {
    menuOpen = open;
    menu.classList.toggle('open', open);
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', function () { setMenu(!menuOpen); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menuOpen) setMenu(false);
  });
  window.addEventListener('resize', function () {
    if (menuOpen && window.innerWidth > MOBILE_MAX) setMenu(false);
  });

  // Glatko skrolovanje do sekcije (umesto "teleportovanja")
  // Cilj se računa u svakom frejmu, pa slike koje se tek učitavaju ne mogu da pomere odredište.
  var scrollAnim = null;
  function absTop(el) { var y = 0; while (el) { y += el.offsetTop; el = el.offsetParent; } return y; }
  function cancelScroll() { if (scrollAnim) { cancelAnimationFrame(scrollAnim.raf); scrollAnim = null; } }
  ['wheel', 'touchstart', 'mousedown', 'keydown'].forEach(function (ev) {
    window.addEventListener(ev, cancelScroll, { passive: true });
  });

  function scrollToEl(el, offset, done) {
    cancelScroll();
    function target() { return Math.max(0, absTop(el) - offset); }
    var from = window.scrollY;
    var dist = Math.abs(target() - from);
    if (reduceMotion || dist < 4) { window.scrollTo(0, target()); if (done) done(); return; }
    var dur = Math.min(1500, Math.max(600, 380 + dist * 0.22));
    var t0 = performance.now();
    var anim = { raf: 0 };
    scrollAnim = anim;
    (function step(now) {
      var k = Math.min((now - t0) / dur, 1);
      var e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;   // easeInOutCubic
      window.scrollTo(0, from + (target() - from) * e);
      if (k < 1) { anim.raf = requestAnimationFrame(step); }
      else { scrollAnim = null; if (done) done(); }
    })(t0);
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) return;
    var hash = a.getAttribute('href');
    if (!hash || hash.length < 2) return;
    var el = document.getElementById(hash.slice(1));
    if (!el) return;
    e.preventDefault();
    if (menuOpen) setMenu(false);
    var isBooking = el.id === 'booking';
    var offset = el.id === 'top' ? 0 : (isBooking ? 92 : 0);
    scrollToEl(el, offset, isBooking ? function () {
      el.classList.remove('ping');
      void el.offsetWidth;                       // restart animacije
      el.classList.add('ping');
      setTimeout(function () { el.classList.remove('ping'); }, 1800);
    } : null);
  });

  // Reveal animacije
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var el = en.target;
          var sibs = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
          el.style.transitionDelay = Math.min(sibs, 6) * 80 + 'ms';
          el.classList.add('in');
          io.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  // Sjajne čestice (zlatni sparkle)
  (function () {
    var canvas = document.getElementById('sparkles');
    if (!canvas || reduceMotion) return;
    var ctx = canvas.getContext('2d');
    var w, h, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var parts = [];
    var count = window.innerWidth < 700 ? 28 : 55;

    function resize() {
      w = canvas.width = window.innerWidth * dpr;
      h = canvas.height = window.innerHeight * dpr;
    }
    function make() {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        r: (Math.random() * 1.8 + 0.4) * dpr,
        vy: -(Math.random() * 0.25 + 0.05) * dpr,
        vx: (Math.random() - 0.5) * 0.15 * dpr,
        a: Math.random(),
        da: (Math.random() * 0.012 + 0.004) * (Math.random() < 0.5 ? -1 : 1)
      };
    }
    resize();
    for (var i = 0; i < count; i++) parts.push(make());
    window.addEventListener('resize', resize);

    var running = true;
    document.addEventListener('visibilitychange', function () {
      running = !document.hidden;
      if (running) requestAnimationFrame(draw);
    });

    function draw() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.x += p.vx; p.y += p.vy; p.a += p.da;
        if (p.a <= 0.05 || p.a >= 1) p.da *= -1;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6);
        g.addColorStop(0, 'rgba(255,230,150,' + (p.a * 0.9) + ')');
        g.addColorStop(1, 'rgba(217,171,79,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 6, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(draw);
    }
    draw();
  })();

  // Zlatne pahuljice preko hero slike
  (function () {
    var canvas = document.getElementById('heroSparkles');
    if (!canvas || reduceMotion) return;
    var hero = canvas.parentElement;
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, parts = [];
    var small = window.innerWidth < 700;
    var count = small ? 45 : 90;
    var visible = true;

    function resize() {
      w = canvas.width = hero.clientWidth * dpr;
      h = canvas.height = hero.clientHeight * dpr;
    }
    function make(initial) {
      var big = Math.random() < 0.18;   // veće "bokeh" pahuljice
      return {
        x: Math.random() * w,
        y: initial ? Math.random() * h : h + 20 * dpr,
        r: (big ? Math.random() * 3 + 2.2 : Math.random() * 1.6 + 0.5) * dpr,
        vy: -(Math.random() * 0.45 + 0.12) * dpr * (big ? 0.6 : 1),
        sway: Math.random() * 1.2 + 0.3,
        ph: Math.random() * Math.PI * 2,
        a: Math.random(),
        da: (Math.random() * 0.018 + 0.006) * (Math.random() < 0.5 ? -1 : 1),
        big: big
      };
    }
    resize();
    for (var i = 0; i < count; i++) parts.push(make(true));
    window.addEventListener('resize', function () { resize(); });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        var was = visible;
        visible = en[0].isIntersecting;
        if (visible && !was) requestAnimationFrame(draw);
      }).observe(hero);
    }
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && visible) requestAnimationFrame(draw);
    });

    var t = 0;
    function draw() {
      if (!visible || document.hidden) return;
      t += 0.01;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.y += p.vy;
        p.x += Math.sin(t * p.sway + p.ph) * 0.35 * dpr;
        p.a += p.da;
        if (p.a <= 0.08) { p.a = 0.08; p.da = Math.abs(p.da); }
        if (p.a >= 1) { p.a = 1; p.da = -Math.abs(p.da); }
        if (p.y < -20 * dpr) { parts[i] = make(false); continue; }
        var rad = p.r * (p.big ? 5 : 6);
        var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);
        g.addColorStop(0, 'rgba(255,240,180,' + (p.a * (p.big ? 0.55 : 0.95)) + ')');
        g.addColorStop(0.35, 'rgba(244,200,90,' + (p.a * 0.35) + ')');
        g.addColorStop(1, 'rgba(217,171,79,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      requestAnimationFrame(draw);
    }
    draw();
  })();

  // Glow koji prati kursor (desktop)
  (function () {
    var glow = document.getElementById('cursorGlow');
    if (!glow || !window.matchMedia('(hover: hover)').matches) return;
    window.addEventListener('mousemove', function (e) {
      glow.style.opacity = 1;
      glow.style.left = e.clientX + 'px';
      glow.style.top = e.clientY + 'px';
    }, { passive: true });
    document.addEventListener('mouseleave', function () { glow.style.opacity = 0; });
  })();

  // Parallax hero
  (function () {
    var bg = document.getElementById('heroBg');
    if (!bg || reduceMotion) return;
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        if (y < window.innerHeight * 1.2) bg.style.transform = 'translateY(' + (y * 0.25) + 'px)';
        ticking = false;
      });
    }, { passive: true });
  })();

  // Galerija: filteri
  var items = Array.prototype.slice.call(document.querySelectorAll('.g-item'));

  // Okvir preuzima proporcije slike čim se učita
  items.forEach(function (it) {
    var img = it.querySelector('img');
    if (!img) return;
    var ph = img.parentElement;
    function ok() { ph.classList.add('has-photo'); }
    if (img.complete && img.naturalWidth) ok();
    else img.addEventListener('load', ok);
  });
  document.getElementById('filters').addEventListener('click', function (e) {
    var btn = e.target.closest('.chip');
    if (!btn) return;
    document.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('active'); });
    btn.classList.add('active');
    var f = btn.getAttribute('data-f');
    items.forEach(function (it) {
      var show = f === 'all' || it.getAttribute('data-cat') === f;
      it.classList.toggle('hidden', !show);
    });
  });

  // Lightbox
  var lb = document.getElementById('lightbox');
  var stage = document.getElementById('lbStage');
  var cap = document.getElementById('lbCap');
  var current = 0;

  function visibleItems() { return items.filter(function (i) { return !i.classList.contains('hidden'); }); }

  function show(idx) {
    var list = visibleItems();
    if (!list.length) return;
    current = (idx + list.length) % list.length;
    var item = list[current];
    var ph = item.querySelector('.ph');
    var img = item.querySelector('img');
    stage.innerHTML = '';
    var wrap = document.createElement('div');
    wrap.className = 'ph';
    wrap.setAttribute('data-label', ph.getAttribute('data-label'));
    if (img) {
      var big = document.createElement('img');
      big.onload = function () { wrap.classList.add('has-photo'); };
      big.onerror = function () { big.remove(); };
      big.alt = img.alt;
      big.src = img.src;
      wrap.appendChild(big);
    }
    stage.appendChild(wrap);
    cap.textContent = item.querySelector('figcaption').textContent;
  }
  function open(item) {
    var list = visibleItems();
    lb.classList.add('open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    show(list.indexOf(item));
  }
  function close() {
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  items.forEach(function (it) {
    it.setAttribute('tabindex', '0');
    it.addEventListener('click', function () { open(it); });
    it.addEventListener('keydown', function (e) { if (e.key === 'Enter') open(it); });
  });
  document.getElementById('lbClose').addEventListener('click', close);
  document.getElementById('lbPrev').addEventListener('click', function () { show(current - 1); });
  document.getElementById('lbNext').addEventListener('click', function () { show(current + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });
  // Swipe na telefonu
  var sx = 0;
  stage.addEventListener('touchstart', function (e) { sx = e.changedTouches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
  }, { passive: true });
})();
