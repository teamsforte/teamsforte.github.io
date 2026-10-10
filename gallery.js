/* Team Forte website gallery (hosted on teamsforte.github.io). Jobs and photos come from the Team Forte app (Google Drive).
   Options on the div: data-service, data-title, data-subtitle, data-limit, data-min (hide until this many jobs), data-replace (CSS selector of a section to hide once shown). */
/* Team Forte website gallery. Loads jobs and photos from Team Forte Photos (Google Drive). */
(function () {
  'use strict';
  if (window.TFGallery && window.TFGallery.version) { window.TFGallery.scan(); return; }

  var EXEC = 'https://script.google.com/macros/s/AKfycbyQpxQSZqBBXYN7i14FAsy23bjOoIT_F8333zYMU2JdYRL_b22SXzdS-dlWZeVhkvxA/exec';
  try {
    var cs = document.currentScript;
    if (cs && cs.src && cs.src.indexOf('/exec') > 0) EXEC = cs.src.split('?')[0];
  } catch (e) { /* use baked url */ }

  var STAGE_LABEL = { before: 'Before', during: 'During', after: 'After' };
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var dataPromise = null;

  var CSS = '' +
    '.tfg{--tfg-navy:#13202F;--tfg-red:#FF5440;--tfg-red-dk:#E23E2B;--tfg-ink:#1C2430;--tfg-muted:#5B6675;--tfg-line:#DDE2E8;--tfg-slate:#F2F4F7;--tfg-card:#fff;' +
    'font-family:Montserrat,"Segoe UI",Arial,sans-serif;color:var(--tfg-ink);text-align:left;line-height:1.45;-webkit-font-smoothing:antialiased;max-width:1180px;margin:0 auto;padding:0 16px}' +
    '.tfg *,.tfg-modal *{box-sizing:border-box}' +
    '.tfg img,.tfg-modal img{border:0!important;border-radius:0!important;box-shadow:none!important;padding:0!important;max-width:none!important}' +
    '.tfg h2,.tfg h3,.tfg p,.tfg button,.tfg a,.tfg span,.tfg-modal h3,.tfg-modal p,.tfg-modal button,.tfg-modal a,.tfg-modal span{font-family:inherit!important}' +
    '.tfg--dark{--tfg-ink:#fff;--tfg-muted:#C4CCD6;--tfg-line:rgba(255,255,255,.14);--tfg-card:#1B2B3D}' +
    '.tfg-head{text-align:center;margin:0 auto 22px;max-width:680px}' +
    '.tfg-head h2{font-size:clamp(26px,4.2vw,38px);line-height:1.15;font-weight:800;margin:0 0 8px;color:var(--tfg-ink);text-transform:none;letter-spacing:0}' +
    '.tfg-head p{margin:0;color:var(--tfg-muted);font-size:16px}' +
    '.tfg-tabs{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:0 0 22px}' +
    '@media(max-width:600px){.tfg-tabs{flex-wrap:nowrap;justify-content:flex-start;overflow-x:auto;margin-left:-16px;margin-right:-16px;padding:2px 16px;scrollbar-width:none}.tfg-tabs::-webkit-scrollbar{display:none}}' +
    '.tfg-tab{flex:none;appearance:none;border:1px solid var(--tfg-line);background:var(--tfg-card);color:var(--tfg-ink);font:inherit;font-weight:700;font-size:14px;padding:10px 18px;border-radius:999px;cursor:pointer;transition:all .15s;margin:0}' +
    '.tfg-tab:hover{border-color:var(--tfg-red)}' +
    '.tfg-tab[aria-selected="true"]{background:var(--tfg-red);border-color:var(--tfg-red);color:#fff}' +
    '.tfg-grid{display:grid;grid-template-columns:1fr;gap:18px}' +
    '@media(min-width:600px){.tfg-grid{grid-template-columns:1fr 1fr}}' +
    '@media(min-width:960px){.tfg-grid{grid-template-columns:1fr 1fr 1fr}}' +
    '.tfg-card{appearance:none;display:flex;flex-direction:column;width:100%;padding:0;margin:0;text-align:left;font:inherit;color:inherit;background:var(--tfg-card);border:1px solid var(--tfg-line);border-radius:14px;overflow:hidden;cursor:pointer;transition:transform .2s,box-shadow .2s}' +
    '.tfg-card:hover{transform:translateY(-3px);box-shadow:0 14px 30px rgba(19,32,47,.16)}' +
    '.tfg-card:focus-visible{outline:3px solid var(--tfg-red);outline-offset:2px}' +
    '.tfg-img{position:relative;aspect-ratio:4/3;background:#D9DEE4;overflow:hidden}' +
    '.tfg-img img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .5s;margin:0;max-width:none}' +
    '.tfg-card:hover .tfg-img img{transform:scale(1.04)}' +
    '.tfg-split{position:absolute;inset:0;display:grid;grid-template-columns:1fr 1fr;gap:2px;background:#fff}' +
    '.tfg-split>div{position:relative;overflow:hidden}' +
    '.tfg-split span{position:absolute;bottom:8px;left:8px;background:rgba(19,32,47,.82);color:#fff;font-size:10px;font-weight:800;letter-spacing:.1em;padding:3px 8px;border-radius:4px;text-transform:uppercase}' +
    '.tfg-badge{position:absolute;top:10px;left:10px;background:var(--tfg-red);color:#fff;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:5px 10px;border-radius:6px}' +
    '.tfg-body{padding:14px 16px 16px;display:flex;flex-direction:column;gap:4px;flex:1}' +
    '.tfg-body h3{font-size:17px;font-weight:800;margin:0;color:var(--tfg-ink);line-height:1.3;text-transform:none;letter-spacing:0}' +
    '.tfg-meta{font-size:13px;color:var(--tfg-muted);margin:0}' +
    '.tfg-view{margin-top:auto;padding-top:8px;font-size:14px;font-weight:700;color:var(--tfg-red)}' +
    '.tfg-more{text-align:center;margin-top:24px}' +
    '.tfg-btn{appearance:none;display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:0 26px;border-radius:10px;border:0;background:var(--tfg-red);color:#fff;font:inherit;font-weight:800;font-size:15px;cursor:pointer;text-decoration:none;transition:background .15s}' +
    '.tfg-btn:hover{background:var(--tfg-red-dk);color:#fff}' +
    '.tfg-btn--ghost{background:transparent;color:var(--tfg-ink);border:2px solid var(--tfg-line)}' +
    '.tfg-btn--ghost:hover{background:transparent;color:var(--tfg-ink);border-color:var(--tfg-red)}' +
    '.tfg-sk{border-radius:14px;background:linear-gradient(90deg,rgba(150,160,175,.18),rgba(150,160,175,.32),rgba(150,160,175,.18));background-size:200% 100%;animation:tfg-sh 1.3s infinite;aspect-ratio:4/3.9}' +
    '@keyframes tfg-sh{to{background-position:-200% 0}}' +
    /* modal */
    '.tfg-modal{--tfg-red:#FF5440;--tfg-red-dk:#E23E2B;position:fixed;inset:0;z-index:2147483000;background:rgba(10,16,24,.88);display:flex;align-items:center;justify-content:center;padding:16px;font-family:Montserrat,"Segoe UI",Arial,sans-serif;-webkit-font-smoothing:antialiased;animation:tfg-in .18s;text-align:left;line-height:1.45}' +
    '@keyframes tfg-in{from{opacity:0}to{opacity:1}}' +
    '.tfg-dlg{background:#fff;color:#1C2430;width:100%;max-width:980px;max-height:100%;overflow:auto;border-radius:16px;box-shadow:0 30px 80px rgba(0,0,0,.45)}' +
    '@media(max-width:600px){.tfg-modal{padding:0;align-items:stretch}.tfg-dlg{border-radius:0;max-height:none;height:100%}}' +
    '.tfg-top{position:sticky;top:0;z-index:3;display:flex;align-items:flex-start;gap:12px;padding:16px 16px 12px 20px;background:#fff;border-bottom:1px solid #DDE2E8}' +
    '.tfg-top h3{margin:0;font-size:19px;font-weight:800;line-height:1.25;color:#1C2430;text-transform:none;letter-spacing:0}' +
    '.tfg-top p{margin:2px 0 0;font-size:13px;color:#5B6675}' +
    '.tfg-x{appearance:none;margin-left:auto;flex:none;width:40px;height:40px;border-radius:50%;border:0;background:#F2F4F7;color:#1C2430;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0}' +
    '.tfg-x:hover{background:#E4E8ED}' +
    '.tfg-x svg{width:20px;height:20px}' +
    '.tfg-mtabs{display:flex;gap:6px;padding:12px 20px 0;flex-wrap:wrap}' +
    '.tfg-mtab{appearance:none;border:1px solid #DDE2E8;background:#fff;color:#1C2430;font:inherit;font-weight:700;font-size:13px;padding:8px 14px;border-radius:999px;cursor:pointer;margin:0}' +
    '.tfg-mtab[aria-selected="true"]{background:#13202F;border-color:#13202F;color:#fff}' +
    '.tfg-stage{padding:12px 20px 0}' +
    '.tfg-cmp{position:relative;width:100%;aspect-ratio:4/3;max-height:60vh;border-radius:12px;overflow:hidden;background:#0E1722;user-select:none;-webkit-user-select:none;touch-action:pan-y;cursor:ew-resize}' +
    '.tfg-cmp img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;pointer-events:none;margin:0;max-width:none}' +
    '.tfg-cmp .tfg-after{clip-path:inset(0 0 0 50%)}' +
    '.tfg-line{position:absolute;top:0;bottom:0;left:50%;width:3px;margin-left:-1.5px;background:#fff;box-shadow:0 0 10px rgba(0,0,0,.4);pointer-events:none}' +
    '.tfg-knob{position:absolute;top:50%;left:50%;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;background:#fff;box-shadow:0 4px 14px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;color:#13202F;outline:none}' +
    '.tfg-knob:focus-visible{box-shadow:0 0 0 4px #FF5440,0 4px 14px rgba(0,0,0,.35)}' +
    '.tfg-knob svg{width:24px;height:24px}' +
    '.tfg-lbl{position:absolute;top:12px;background:rgba(19,32,47,.85);color:#fff;font-size:11px;font-weight:800;letter-spacing:.12em;padding:5px 10px;border-radius:5px;pointer-events:none}' +
    '.tfg-lbl.l{left:12px}.tfg-lbl.r{right:12px;background:#FF5440}' +
    '.tfg-hint{font-size:12px;color:#5B6675;text-align:center;margin:8px 0 0}' +
    '.tfg-view2{position:relative;width:100%;aspect-ratio:4/3;max-height:60vh;border-radius:12px;overflow:hidden;background:#0E1722;touch-action:pan-y}' +
    '.tfg-view2 img{width:100%;height:100%;object-fit:contain;display:block;margin:0;max-width:none}' +
    '.tfg-nav{appearance:none;position:absolute;top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;border:0;background:rgba(255,255,255,.92);color:#13202F;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,.3);padding:0}' +
    '.tfg-nav svg{width:22px;height:22px}' +
    '.tfg-nav.p{left:10px}.tfg-nav.n{right:10px}' +
    '.tfg-nav[disabled]{opacity:0;pointer-events:none}' +
    '.tfg-tag{position:absolute;top:12px;left:12px;background:rgba(19,32,47,.85);color:#fff;font-size:11px;font-weight:800;letter-spacing:.12em;padding:5px 10px;border-radius:5px;text-transform:uppercase}' +
    '.tfg-tag.after{background:#FF5440}' +
    '.tfg-count{position:absolute;bottom:12px;right:12px;background:rgba(0,0,0,.6);color:#fff;font-size:12px;font-weight:700;padding:4px 9px;border-radius:999px}' +
    '.tfg-cap{font-size:14px;color:#1C2430;margin:10px 0 0;min-height:20px}' +
    '.tfg-thumbs{display:flex;gap:8px;overflow-x:auto;padding:12px 0 2px;scrollbar-width:thin}' +
    '.tfg-th{appearance:none;flex:none;width:76px;height:58px;border-radius:7px;overflow:hidden;border:2px solid transparent;padding:0;background:#E4E8ED;cursor:pointer;opacity:.7;position:relative;margin:0}' +
    '.tfg-th[aria-current="true"]{border-color:#FF5440;opacity:1}' +
    '.tfg-th img{width:100%;height:100%;object-fit:cover;display:block;margin:0;max-width:none}' +
    '.tfg-desc{padding:14px 20px 0;font-size:15px;color:#1C2430;margin:0}' +
    '.tfg-cta{margin:18px 20px 20px;padding:16px 18px;border-radius:12px;background:#13202F;color:#fff;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}' +
    '.tfg-cta b{font-size:16px;font-weight:800;display:block}' +
    '.tfg-cta span{font-size:13px;color:#C4CCD6}' +
    '.tfg-cta .tfg-btn{min-height:46px}' +
    '@media(max-width:600px){.tfg-cta .tfg-btn{width:100%}.tfg-stage,.tfg-mtabs{padding-left:16px;padding-right:16px}.tfg-desc{padding-left:16px;padding-right:16px}.tfg-cta{margin-left:16px;margin-right:16px}}' +
    'html.tfg-lock,html.tfg-lock body{overflow:hidden!important}';

  var ICON = {
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>',
    l: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    r: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
    lr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l-6 6 6 6M15 6l6 6-6 6"/></svg>'
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function src(id, w) { return 'https://lh3.googleusercontent.com/d/' + encodeURIComponent(id) + '=w' + w; }
  function alt(id, w) { return 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(id) + '&sz=w' + w; }
  function imgTag(id, w, altText, cls, eager) {
    return '<img' + (cls ? ' class="' + cls + '"' : '') + ' src="' + src(id, w) + '" data-alt="' + alt(id, w) + '" alt="' + esc(altText) + '"' +
      (eager ? '' : ' loading="lazy"') + ' decoding="async" onerror="if(this.dataset.alt&&this.src!==this.dataset.alt){this.src=this.dataset.alt}">';
  }
  function month(d) {
    var m = String(d || '').split('-');
    return m.length === 2 ? (MONTHS[(+m[1] || 1) - 1] + ' ' + m[0]) : '';
  }
  function meta(j) { return [j.town, month(j.date)].filter(Boolean).join(' \u00b7 '); }
  function byStage(j, s) { return j.photos.filter(function (p) { return p.stage === s; }); }
  function pairOf(j) {
    var b = byStage(j, 'before'), a = byStage(j, 'after');
    if (!b.length || !a.length) return null;
    var after = a.filter(function (p) { return p.id === j.cover; })[0] || a[0];
    return { before: b[0], after: after };
  }

  function injectCss() {
    if (document.getElementById('tfg-css')) return;
    var st = document.createElement('style');
    st.id = 'tfg-css';
    st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
  }

  function loadData() {
    if (dataPromise) return dataPromise;
    dataPromise = new Promise(function (resolve, reject) {
      var cb = '__tfg' + Date.now().toString(36) + Math.floor(Math.random() * 1e6);
      var s = document.createElement('script');
      var timer = setTimeout(function () { done(); reject(new Error('timeout')); }, 25000);
      function done() { clearTimeout(timer); try { delete window[cb]; } catch (e) { window[cb] = undefined; } if (s.parentNode) s.parentNode.removeChild(s); }
      window[cb] = function (d) { done(); resolve(d); };
      s.onerror = function () { done(); reject(new Error('load failed')); };
      s.async = true;
      s.src = EXEC + '?r=data&callback=' + cb;
      (document.head || document.documentElement).appendChild(s);
    });
    dataPromise.catch(function () { dataPromise = null; });
    return dataPromise;
  }

  /* ---------------- section ---------------- */
  function mount(el) {
    if (!el || el.getAttribute('data-tfg-ready')) return;
    el.setAttribute('data-tfg-ready', '1');
    injectCss();
    var o = {
      service: (el.getAttribute('data-service') || 'all').toLowerCase(),
      featured: el.getAttribute('data-featured') === 'true',
      limit: parseInt(el.getAttribute('data-limit'), 10) || (el.getAttribute('data-featured') === 'true' ? 6 : 9),
      tabs: el.getAttribute('data-tabs') !== 'false',
      title: el.getAttribute('data-title') || '',
      subtitle: el.getAttribute('data-subtitle') || '',
      more: el.getAttribute('data-more-href') || '',
      ctaText: el.getAttribute('data-cta-text') || 'Get a Free Inspection',
      ctaHref: el.getAttribute('data-cta-href') || 'tel:+18608549335',
      theme: el.getAttribute('data-theme') === 'dark' ? 'dark' : 'light',
      min: Math.max(1, parseInt(el.getAttribute('data-min'), 10) || 1),
      replace: el.getAttribute('data-replace') || ''
    };
    var root = document.createElement('div');
    root.className = 'tfg tfg--' + o.theme;
    el.innerHTML = '';
    el.appendChild(root);
    root.innerHTML = head(o) + '<div class="tfg-grid">' + [1, 2, 3].map(function () { return '<div class="tfg-sk"></div>'; }).join('') + '</div>';
    /* With data-min, stay hidden (and keep the page's current gallery) until the app has enough published jobs */
    if (o.min > 1) el.style.display = 'none';

    loadData().then(function (d) {
      var jobs = (d && d.jobs) || [];
      if (o.service !== 'all') jobs = jobs.filter(function (j) { return String(j.service).toLowerCase() === o.service; });
      if (o.featured) {
        var f = jobs.filter(function (j) { return j.featured; });
        if (f.length) jobs = f;
      }
      if (jobs.length < o.min) { el.style.display = 'none'; return; }
      el.style.display = '';
      if (o.replace) { try { Array.prototype.forEach.call(document.querySelectorAll(o.replace), function (x) { if (!x.contains(el)) x.style.display = 'none'; }); } catch (e) { /* bad selector */ } }
      var services = [];
      jobs.forEach(function (j) { if (services.indexOf(j.service) < 0) services.push(j.service); });
      var order = (d.services || []);
      services.sort(function (a, b) { return order.indexOf(a) - order.indexOf(b); });
      var st = { tab: 'All', shown: o.limit };
      function draw() {
        var list = st.tab === 'All' ? jobs : jobs.filter(function (j) { return j.service === st.tab; });
        var showTabs = o.tabs && o.service === 'all' && !o.featured && services.length > 1;
        var h = head(o);
        if (showTabs) {
          h += '<div class="tfg-tabs" role="tablist">' + ['All'].concat(services).map(function (s) {
            return '<button type="button" class="tfg-tab" role="tab" aria-selected="' + (st.tab === s) + '" data-tab="' + esc(s) + '">' + esc(s === 'All' ? 'All Work' : s) + '</button>';
          }).join('') + '</div>';
        }
        h += '<div class="tfg-grid">' + list.slice(0, st.shown).map(card).join('') + '</div>';
        if (list.length > st.shown) {
          h += '<div class="tfg-more"><button type="button" class="tfg-btn tfg-btn--ghost" data-more>See more work (' + (list.length - st.shown) + ')</button></div>';
        } else if (o.more) {
          h += '<div class="tfg-more"><a class="tfg-btn" href="' + esc(o.more) + '">See all our work</a></div>';
        }
        root.innerHTML = h;
      }
      root.addEventListener('click', function (e) {
        var t = e.target.closest ? e.target.closest('[data-tab],[data-more],[data-job]') : null;
        if (!t) return;
        if (t.hasAttribute('data-tab')) { st.tab = t.getAttribute('data-tab'); st.shown = o.limit; draw(); return; }
        if (t.hasAttribute('data-more')) { st.shown += o.limit; draw(); return; }
        var id = t.getAttribute('data-job');
        for (var i = 0; i < jobs.length; i++) if (jobs[i].id === id) { openJob(jobs[i], o); break; }
      });
      draw();
    }).catch(function () {
      el.style.display = 'none';
      el.setAttribute('data-tfg-ready', 'failed');
    });
  }

  function head(o) {
    if (!o.title && !o.subtitle) return '';
    return '<div class="tfg-head">' + (o.title ? '<h2>' + esc(o.title) + '</h2>' : '') + (o.subtitle ? '<p>' + esc(o.subtitle) + '</p>' : '') + '</div>';
  }

  function card(j) {
    var pair = pairOf(j);
    var visual = pair
      ? '<div class="tfg-split"><div>' + imgTag(pair.before.id, 600, 'Before: ' + j.title) + '<span>Before</span></div><div>' + imgTag(pair.after.id, 600, 'After: ' + j.title) + '<span>After</span></div></div>'
      : imgTag(j.cover, 900, j.title);
    var n = j.photos.length;
    return '<button type="button" class="tfg-card" data-job="' + esc(j.id) + '" aria-label="' + esc(j.title + (j.town ? ' in ' + j.town : '') + ', view ' + n + ' photos') + '">' +
      '<div class="tfg-img">' + visual + '<span class="tfg-badge">' + esc(j.service) + '</span></div>' +
      '<div class="tfg-body"><h3>' + esc(j.title) + '</h3>' + (meta(j) ? '<p class="tfg-meta">' + esc(meta(j)) + '</p>' : '') +
      '<span class="tfg-view">' + (pair ? 'See before &amp; after' : 'View ' + n + ' photo' + (n === 1 ? '' : 's')) + ' \u2192</span></div></button>';
  }

  /* ---------------- job viewer ---------------- */
  function openJob(j, o) {
    var pair = pairOf(j);
    var photos = j.photos.slice();
    var st = { mode: pair ? 'compare' : 'all', i: 0, pos: 50 };
    var lastFocus = document.activeElement;

    var m = document.createElement('div');
    m.className = 'tfg-modal';
    m.setAttribute('role', 'dialog');
    m.setAttribute('aria-modal', 'true');
    m.setAttribute('aria-label', j.title);
    document.body.appendChild(m);
    document.documentElement.classList.add('tfg-lock');

    function close() {
      document.removeEventListener('keydown', onKey);
      document.documentElement.classList.remove('tfg-lock');
      if (m.parentNode) m.parentNode.removeChild(m);
      if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) { /* ignore */ } }
    }
    function onKey(e) {
      if (e.key === 'Escape') close();
      else if (st.mode === 'all' && e.key === 'ArrowLeft') go(st.i - 1);
      else if (st.mode === 'all' && e.key === 'ArrowRight') go(st.i + 1);
    }
    document.addEventListener('keydown', onKey);

    function go(i) {
      if (i < 0 || i >= photos.length) return;
      st.i = i; draw();
      var cur = m.querySelector('.tfg-th[aria-current="true"]');
      if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'nearest', inline: 'center' });
    }

    function stageHtml() {
      if (st.mode === 'compare') {
        return '<div class="tfg-cmp" data-cmp>' + imgTag(pair.before.id, 1600, 'Before', '', true) + imgTag(pair.after.id, 1600, 'After', 'tfg-after', true) +
          '<div class="tfg-line"></div><div class="tfg-knob" role="slider" tabindex="0" aria-label="Drag to compare before and after" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50">' + ICON.lr + '</div>' +
          '<span class="tfg-lbl l">BEFORE</span><span class="tfg-lbl r">AFTER</span></div>' +
          '<p class="tfg-hint">Drag the slider to compare</p>';
      }
      var p = photos[st.i];
      return '<div class="tfg-view2" data-view>' + imgTag(p.id, 1600, STAGE_LABEL[p.stage] + ' photo ' + (st.i + 1) + ' of ' + photos.length, '', true) +
        '<span class="tfg-tag ' + p.stage + '">' + STAGE_LABEL[p.stage] + '</span>' +
        '<button type="button" class="tfg-nav p" data-go="-1" aria-label="Previous photo"' + (st.i === 0 ? ' disabled' : '') + '>' + ICON.l + '</button>' +
        '<button type="button" class="tfg-nav n" data-go="1" aria-label="Next photo"' + (st.i === photos.length - 1 ? ' disabled' : '') + '>' + ICON.r + '</button>' +
        '<span class="tfg-count">' + (st.i + 1) + ' / ' + photos.length + '</span></div>' +
        '<p class="tfg-cap">' + esc(p.caption || '') + '</p>' +
        '<div class="tfg-thumbs">' + photos.map(function (q, k) {
          return '<button type="button" class="tfg-th" data-i="' + k + '" aria-label="' + STAGE_LABEL[q.stage] + ' photo ' + (k + 1) + '" aria-current="' + (k === st.i) + '">' + imgTag(q.id, 200, '') + '</button>';
        }).join('') + '</div>';
    }

    function draw() {
      var tabs = '';
      if (pair) {
        tabs = '<div class="tfg-mtabs" role="tablist">' +
          '<button type="button" class="tfg-mtab" role="tab" data-mode="compare" aria-selected="' + (st.mode === 'compare') + '">Before &amp; After</button>' +
          '<button type="button" class="tfg-mtab" role="tab" data-mode="all" aria-selected="' + (st.mode === 'all') + '">All photos (' + photos.length + ')</button></div>';
      }
      var ctaHref = o.ctaHref;
      m.innerHTML = '<div class="tfg-dlg">' +
        '<div class="tfg-top"><div><h3>' + esc(j.title) + '</h3><p>' + esc([j.service, meta(j)].filter(Boolean).join(' \u00b7 ')) + '</p></div>' +
        '<button type="button" class="tfg-x" data-close aria-label="Close">' + ICON.x + '</button></div>' +
        tabs + '<div class="tfg-stage">' + stageHtml() + '</div>' +
        (j.description ? '<p class="tfg-desc">' + esc(j.description) + '</p>' : '') +
        '<div class="tfg-cta"><div><b>Want results like this?</b><span>Free inspection and a written estimate.</span></div>' +
        '<a class="tfg-btn" href="' + esc(ctaHref) + '" data-cta>' + esc(o.ctaText) + '</a></div>' +
        '</div>';
      if (st.mode === 'compare') wireCompare();
      if (st.mode === 'all') wireSwipe();
    }

    function setPos(cmp, pct) {
      st.pos = Math.max(0, Math.min(100, pct));
      cmp.querySelector('.tfg-after').style.clipPath = 'inset(0 0 0 ' + st.pos + '%)';
      cmp.querySelector('.tfg-line').style.left = st.pos + '%';
      var k = cmp.querySelector('.tfg-knob');
      k.style.left = st.pos + '%';
      k.setAttribute('aria-valuenow', Math.round(st.pos));
    }

    function wireCompare() {
      var cmp = m.querySelector('[data-cmp]');
      if (!cmp) return;
      setPos(cmp, st.pos);
      var dragging = false;
      function at(x) { var r = cmp.getBoundingClientRect(); setPos(cmp, (x - r.left) / r.width * 100); }
      cmp.addEventListener('pointerdown', function (e) { dragging = true; try { cmp.setPointerCapture(e.pointerId); } catch (er) { /* ignore */ } at(e.clientX); });
      cmp.addEventListener('pointermove', function (e) { if (dragging) { at(e.clientX); e.preventDefault(); } });
      cmp.addEventListener('pointerup', function () { dragging = false; });
      cmp.addEventListener('pointercancel', function () { dragging = false; });
      cmp.querySelector('.tfg-knob').addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') { setPos(cmp, st.pos - 5); e.preventDefault(); e.stopPropagation(); }
        if (e.key === 'ArrowRight') { setPos(cmp, st.pos + 5); e.preventDefault(); e.stopPropagation(); }
      });
    }

    function wireSwipe() {
      var v = m.querySelector('[data-view]');
      if (!v) return;
      var sx = null, sy = null;
      v.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
      v.addEventListener('touchend', function (e) {
        if (sx == null) return;
        var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(st.i + (dx < 0 ? 1 : -1));
        sx = null;
      }, { passive: true });
    }

    m.addEventListener('click', function (e) {
      if (e.target === m) { close(); return; }
      var t = e.target.closest ? e.target.closest('[data-close],[data-mode],[data-go],[data-i],[data-cta]') : null;
      if (!t) return;
      if (t.hasAttribute('data-close')) { close(); return; }
      if (t.hasAttribute('data-cta')) {
        var href = t.getAttribute('href') || '';
        if (href.charAt(0) === '#') { close(); }
        return;
      }
      if (t.hasAttribute('data-mode')) { st.mode = t.getAttribute('data-mode'); draw(); return; }
      if (t.hasAttribute('data-go')) { go(st.i + Number(t.getAttribute('data-go'))); return; }
      if (t.hasAttribute('data-i')) { go(Number(t.getAttribute('data-i'))); }
    });

    draw();
    var x = m.querySelector('[data-close]');
    if (x) x.focus();
  }

  /* ---------------- boot ---------------- */
  function scan() {
    var els = document.querySelectorAll('.tf-gallery, #tf-gallery, [data-tf-gallery]');
    for (var i = 0; i < els.length; i++) mount(els[i]);
  }

  window.TFGallery = { version: 1, scan: scan, mount: mount };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan); else scan();
  window.addEventListener('load', scan);
  if (window.MutationObserver) {
    var obs = new MutationObserver(function () { scan(); });
    obs.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(function () { obs.disconnect(); }, 15000);
  }
})();
