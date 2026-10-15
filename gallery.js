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
    '.tfg-card.tfg-hasba{cursor:default}.tfg-card.tfg-hasba:hover .tfg-img img{transform:none}' +
    'button.tfg-view{appearance:none;-webkit-appearance:none;background:none;border:0;margin:auto 0 0;padding:10px 0 2px;text-align:left;font:inherit;font-size:14px;font-weight:700;color:var(--tfg-red);cursor:pointer;align-self:flex-start}' +
    'button.tfg-view:hover{text-decoration:underline}button.tfg-view:focus-visible{outline:2px solid var(--tfg-red);outline-offset:3px;border-radius:4px}' +
    '.tfg-ba{--p:50%;position:absolute;inset:0;touch-action:pan-y;cursor:ew-resize;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;outline:none}' +
    '.tfg-ba img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;-webkit-user-drag:none}' +
    '.tfg-ba .tfg-ba-b{clip-path:inset(0 calc(100% - var(--p)) 0 0);-webkit-clip-path:inset(0 calc(100% - var(--p)) 0 0)}' +
    '.tfg-ba-h{position:absolute;top:0;bottom:0;left:var(--p);width:3px;margin-left:-1.5px;background:#fff;box-shadow:0 0 6px rgba(0,0,0,.35);pointer-events:none}' +
    '.tfg-ba-k{position:absolute;top:50%;left:clamp(23px,var(--p),calc(100% - 23px));width:42px;height:42px;margin:-21px 0 0 -21px;pointer-events:none;border-radius:50%;background:#fff;box-shadow:0 3px 12px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;color:var(--tfg-red)}' +
    '.tfg-ba-k svg{width:22px;height:22px}' +
    '.tfg-ba:focus-visible .tfg-ba-k{box-shadow:0 0 0 3px var(--tfg-red),0 3px 12px rgba(0,0,0,.35)}' +
    '.tfg-ba-l{position:absolute;bottom:10px;background:rgba(19,32,47,.82);color:#fff;font-size:10px;font-weight:800;letter-spacing:.1em;padding:4px 9px;border-radius:4px;text-transform:uppercase;pointer-events:none;transition:opacity .2s}' +
    '.tfg-ba-l.b{left:10px}.tfg-ba-l.a{right:10px;background:var(--tfg-red)}' +
    '.tfg-ba.lo .tfg-ba-l.b,.tfg-ba.hi .tfg-ba-l.a{opacity:0}' +
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
    '.tfg-cmp{position:relative;width:100%;aspect-ratio:4/3;max-height:70vh;border-radius:12px;overflow:hidden;background:#0E1722;user-select:none;-webkit-user-select:none;touch-action:pan-y;cursor:ew-resize}' +
    '.tfg-cmp img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;pointer-events:none;margin:0;max-width:none}' +
    '.tfg-cmp .tfg-after{clip-path:inset(0 0 0 50%)}' +
    '.tfg-line{position:absolute;top:0;bottom:0;left:50%;width:3px;margin-left:-1.5px;background:#fff;box-shadow:0 0 10px rgba(0,0,0,.4);pointer-events:none}' +
    '.tfg-knob{position:absolute;top:50%;left:50%;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;background:#fff;box-shadow:0 4px 14px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;color:#13202F;outline:none}' +
    '.tfg-knob:focus-visible{box-shadow:0 0 0 4px #FF5440,0 4px 14px rgba(0,0,0,.35)}' +
    '.tfg-knob svg{width:24px;height:24px}' +
    '.tfg-lbl{position:absolute;top:12px;background:rgba(19,32,47,.85);color:#fff;font-size:11px;font-weight:800;letter-spacing:.12em;padding:5px 10px;border-radius:5px;pointer-events:none}' +
    '.tfg-lbl.l{left:12px}.tfg-lbl.r{right:12px;background:#FF5440}' +
    '.tfg-hint{font-size:12px;color:#5B6675;text-align:center;margin:8px 0 0}' +
    '.tfg-view2{position:relative;width:100%;aspect-ratio:4/3;max-height:70vh;border-radius:12px;overflow:hidden;background:#0E1722;touch-action:pan-y}' +
    '.tfg-view2 img{width:100%;height:100%;object-fit:contain;display:block;margin:0;max-width:none}' +
    '.tfg-nav{appearance:none;position:absolute;top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;border:0;background:rgba(255,255,255,.92);color:#13202F;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,.3);padding:0}' +
    '.tfg-nav svg{width:22px;height:22px}' +
    '.tfg-nav.p{left:10px}.tfg-nav.n{right:10px}' +
    '.tfg-nav[disabled]{opacity:0;pointer-events:none}' +
    '.tfg-tag{position:absolute;top:12px;left:12px;background:rgba(19,32,47,.85);color:#fff;font-size:11px;font-weight:800;letter-spacing:.12em;padding:5px 10px;border-radius:5px;text-transform:uppercase}' +
    '.tfg-tag.after{background:#FF5440}' +
    '.tfg-count{position:absolute;bottom:12px;right:12px;background:rgba(0,0,0,.6);color:#fff;font-size:12px;font-weight:700;padding:4px 9px;border-radius:999px}' +
    '.tfg-fsb{appearance:none;position:absolute;right:10px;top:10px;z-index:2;width:40px;height:40px;border-radius:10px;border:0;background:rgba(0,0,0,.55);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;margin:0}' +
    '.tfg-fsb svg{width:20px;height:20px}.tfg-fsb:hover{background:rgba(0,0,0,.75)}' +
    '.tfg-view2{cursor:zoom-in}.tfg-view2 .tfg-count{right:auto;left:12px;top:auto}' +
    '.tfg-fs{--tfg-red:#FF5440;position:fixed;inset:0;z-index:2147483001;background:#000;touch-action:none;-webkit-user-select:none;user-select:none;animation:tfg-in .15s;font-family:Montserrat,"Segoe UI",Arial,sans-serif}' +
    '.tfg-fs-st{position:absolute;inset:0;overflow:hidden}' +
    '.tfg-fs-tr{position:absolute;inset:0;display:flex;will-change:transform}' +
    '.tfg-fs-sl{flex:0 0 100%;height:100%;overflow:hidden;position:relative}' +
    '.tfg-fs-sl img{position:absolute;inset:0;width:100%!important;height:100%!important;object-fit:contain;transform-origin:0 0;pointer-events:none;-webkit-user-drag:none;margin:0;max-width:none}' +
    '.tfg-fs-cmp{position:absolute;inset:0;touch-action:none;cursor:ew-resize}' +
    '.tfg-fs-cmp img{position:absolute;inset:0;width:100%!important;height:100%!important;object-fit:contain;pointer-events:none;margin:0;max-width:none}' +
    '.tfg-fs-bar{position:absolute;left:0;right:0;z-index:3;display:flex;align-items:center;gap:10px;padding:12px 14px;color:#fff;transition:opacity .2s}' +
    '.tfg-fs-bar.t{top:0;padding-top:calc(12px + env(safe-area-inset-top));background:linear-gradient(rgba(0,0,0,.65),transparent)}' +
    '.tfg-fs-bar.b{bottom:0;padding-bottom:calc(16px + env(safe-area-inset-bottom));background:linear-gradient(transparent,rgba(0,0,0,.65));justify-content:center}' +
    '.tfg-fs-t{flex:1;font-size:15px;font-weight:700;line-height:1.25;color:#fff}.tfg-fs-t small{display:block;font-weight:500;font-size:12px;opacity:.8;margin-top:2px}' +
    '.tfg-fs-x,.tfg-fs-n{appearance:none;border:0;cursor:pointer;color:#fff;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;padding:0;margin:0}' +
    '.tfg-fs-x{width:44px;height:44px;border-radius:50%}.tfg-fs-x svg{width:22px;height:22px}' +
    '.tfg-fs-n{position:absolute;top:50%;z-index:3;width:50px;height:50px;margin-top:-25px;border-radius:50%}.tfg-fs-n svg{width:26px;height:26px}' +
    '.tfg-fs-n.p{left:14px}.tfg-fs-n.n{right:14px}.tfg-fs-n[disabled]{opacity:0;pointer-events:none}' +
    '@media(hover:none){.tfg-fs-n{display:none}}' +
    '.tfg-fs-cap{font-size:14px;color:#fff;text-align:center;max-width:700px}' +
    '.tfg-fs.bare .tfg-fs-bar,.tfg-fs.bare .tfg-fs-n{opacity:0;pointer-events:none}' +
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
    full: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
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
      subtitle: (el.getAttribute('data-subtitle') || '').replace(/Tap a job to see the before and after\.?/i, 'Slide any photo to see the before and after.'),
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
    /* Hide the page's old gallery right away (no flash of old photos while the jobs load); it comes back only if the app can't show enough jobs */
    var old = [];
    if (o.replace) { try { Array.prototype.forEach.call(document.querySelectorAll(o.replace), function (x) { if (!x.contains(el)) { old.push([x, x.style.display]); x.style.display = 'none'; } }); } catch (e) { /* bad selector */ } }
    function restoreOld() { old.forEach(function (p) { p[0].style.display = p[1]; }); }
    var shownSig = '';

    function show(d) {
      var sig = JSON.stringify(d && d.jobs || []);
      if (sig === shownSig) return;
      shownSig = sig;
      var r2 = document.createElement('div'); r2.className = root.className; el.replaceChild(r2, root); root = r2;
      var jobs = (d && d.jobs) || [];
      if (o.service !== 'all') jobs = jobs.filter(function (j) { return String(j.service).toLowerCase() === o.service; });
      if (o.featured) {
        var f = jobs.filter(function (j) { return j.featured; });
        if (f.length) jobs = f;
      }
      if (jobs.length < o.min) { el.style.display = 'none'; restoreOld(); return; }
      el.style.display = '';
      old.forEach(function (p) { p[0].style.display = 'none'; });
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
        baHint(root);
      }
      baWire(root);
      root.addEventListener('click', function (e) {
        var fj = e.target.closest ? e.target.closest('[data-fsj]') : null;
        if (fj) {
          var ba0 = fj.parentNode.querySelector('.tfg-ba');
          for (var q = 0; q < jobs.length; q++) if (jobs[q].id === fj.getAttribute('data-fsj')) fullCompare(jobs[q], pairOf(jobs[q]), ba0 && ba0._p != null ? ba0._p : 50);
          return;
        }
        var t = e.target.closest ? e.target.closest('[data-tab],[data-more],[data-job]') : null;
        if (!t) return;
        if (t.hasAttribute('data-tab')) { st.tab = t.getAttribute('data-tab'); st.shown = o.limit; draw(); return; }
        if (t.hasAttribute('data-more')) { st.shown += o.limit; draw(); return; }
        var id = t.getAttribute('data-job');
        for (var i = 0; i < jobs.length; i++) if (jobs[i].id === id) { openJob(jobs[i], o); break; }
      });
      draw();
    }

    var cached = readCache();
    if (cached) show(cached);
    loadData().then(function (d) { writeCache(d); show(d); }).catch(function () {
      if (shownSig) return;
      el.style.display = 'none';
      restoreOld();
      el.setAttribute('data-tfg-ready', 'failed');
    });
  }

  /* Last good data, so return visits show the jobs instantly while fresh data loads */
  var CACHE_KEY = 'tfg_data_v1';
  function readCache() {
    try { var c = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); if (c && c.d && Date.now() - c.t < 7 * 864e5) return c.d; } catch (e) { /* no storage */ }
    return null;
  }
  function writeCache(d) { try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), d: d })); } catch (e) { /* full or blocked */ } }

  function head(o) {
    if (!o.title && !o.subtitle) return '';
    return '<div class="tfg-head">' + (o.title ? '<h2>' + esc(o.title) + '</h2>' : '') + (o.subtitle ? '<p>' + esc(o.subtitle) + '</p>' : '') + '</div>';
  }

  function card(j) {
    var pair = pairOf(j);
    if (pair) return baCard(j, pair);
    var visual = pair
      ? '<div class="tfg-split"><div>' + imgTag(pair.before.id, 600, 'Before: ' + j.title) + '<span>Before</span></div><div>' + imgTag(pair.after.id, 600, 'After: ' + j.title) + '<span>After</span></div></div>'
      : imgTag(j.cover, 900, j.title);
    var n = j.photos.length;
    return '<button type="button" class="tfg-card" data-job="' + esc(j.id) + '" aria-label="' + esc(j.title + (j.town ? ' in ' + j.town : '') + ', view ' + n + ' photos') + '">' +
      '<div class="tfg-img">' + visual + '<span class="tfg-badge">' + esc(j.service) + '</span></div>' +
      '<div class="tfg-body"><h3>' + esc(j.title) + '</h3>' + (meta(j) ? '<p class="tfg-meta">' + esc(meta(j)) + '</p>' : '') +
      '<span class="tfg-view">' + (pair ? 'See before &amp; after' : 'View ' + n + ' photo' + (n === 1 ? '' : 's')) + ' \u2192</span></div></button>';
  }

  /* Before & after right on the card: drag (or use the arrow keys) to compare. "View all photos" opens the viewer. */
  function baCard(j, pair) {
    var n = j.photos.length;
    var arrows = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l-6 6 6 6M15 6l6 6-6 6"/></svg>';
    return '<div class="tfg-card tfg-hasba">' +
      '<div class="tfg-img"><div class="tfg-ba" role="slider" tabindex="0" aria-label="' + esc('Before and after: ' + j.title + '. Drag or use arrow keys to compare.') + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50" aria-valuetext="50% before">' +
        imgTag(pair.after.id, 900, 'After: ' + j.title, 'tfg-ba-a') + imgTag(pair.before.id, 900, 'Before: ' + j.title, 'tfg-ba-b') +
        '<span class="tfg-ba-l b">Before</span><span class="tfg-ba-l a">After</span>' +
        '<span class="tfg-ba-h"></span><span class="tfg-ba-k">' + arrows + '</span></div>' +
        '<span class="tfg-badge">' + esc(j.service) + '</span>' +
        '<button type="button" class="tfg-fsb" data-fsj="' + esc(j.id) + '" aria-label="' + esc('Full screen: ' + j.title) + '">' + ICON.full + '</button></div>' +
      '<div class="tfg-body"><h3>' + esc(j.title) + '</h3>' + (meta(j) ? '<p class="tfg-meta">' + esc(meta(j)) + '</p>' : '') +
      '<button type="button" class="tfg-view" data-job="' + esc(j.id) + '">View all ' + n + ' photo' + (n === 1 ? '' : 's') + ' →</button></div></div>';
  }
  function baSet(ba, p) {
    p = Math.max(0, Math.min(100, p));
    ba.style.setProperty('--p', p + '%');
    ba.setAttribute('aria-valuenow', String(Math.round(p)));
    ba.setAttribute('aria-valuetext', Math.round(p) + '% before');
    ba.classList.toggle('lo', p < 12); ba.classList.toggle('hi', p > 88);
    ba._p = p;
  }
  function baWire(root) {
    var drag = null;
    function posOf(ba, x) { var r = ba.getBoundingClientRect(); return (x - r.left) / r.width * 100; }
    root.addEventListener('pointerdown', function (e) {
      var ba = e.target.closest ? e.target.closest('.tfg-ba') : null;
      if (!ba || e.button > 0) return;
      ba._stop = true;
      drag = { ba: ba, x: e.clientX, y: e.clientY, id: e.pointerId, live: e.pointerType === 'mouse' };
      if (drag.live) { try { ba.setPointerCapture(e.pointerId); } catch (er) { /* ok */ } baSet(ba, posOf(ba, e.clientX)); e.preventDefault(); }
    });
    root.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.live) {
        /* touch: only take over once the finger moves sideways; up/down stays a page scroll */
        var dx = Math.abs(e.clientX - drag.x), dy = Math.abs(e.clientY - drag.y);
        if (dx < 6 && dy < 6) return;
        if (dy > dx) { drag = null; return; }
        drag.live = true; try { drag.ba.setPointerCapture(e.pointerId); } catch (er) { /* ok */ }
      }
      baSet(drag.ba, posOf(drag.ba, e.clientX));
    });
    function end(e) { if (drag && (!e || e.pointerId === drag.id)) { if (!drag.live && e && e.type === 'pointerup') baSet(drag.ba, posOf(drag.ba, e.clientX)); drag = null; } }
    root.addEventListener('pointerup', end);
    root.addEventListener('pointercancel', function () { drag = null; });
    root.addEventListener('keydown', function (e) {
      var ba = e.target.closest ? e.target.closest('.tfg-ba') : null; if (!ba) return;
      var p = ba._p == null ? 50 : ba._p, k = e.key;
      if (k === 'ArrowLeft' || k === 'ArrowDown') p -= 5; else if (k === 'ArrowRight' || k === 'ArrowUp') p += 5;
      else if (k === 'Home') p = 0; else if (k === 'End') p = 100; else return;
      e.preventDefault(); ba._stop = true; baSet(ba, p);
    });
    root.addEventListener('dragstart', function (e) { if (e.target.closest && e.target.closest('.tfg-ba')) e.preventDefault(); });
  }
  /* A small one-time nudge when a slider first scrolls into view, so visitors see it moves. */
  function baHint(root) {
    var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var list = root.querySelectorAll('.tfg-ba');
    Array.prototype.forEach.call(list, function (ba) { baSet(ba, 50); });
    if (calm || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return; io.unobserve(en.target);
        var ba = en.target, t0 = null;
        setTimeout(function () {
          function step(t) {
            if (ba._stop) return; if (t0 === null) t0 = t;
            var k = (t - t0) / 1400; if (k >= 1) { baSet(ba, 50); return; }
            baSet(ba, 50 - 18 * Math.sin(k * Math.PI * 2)); requestAnimationFrame(step);
          }
          requestAnimationFrame(step);
        }, 350);
      });
    }, { threshold: 0.6 });
    Array.prototype.forEach.call(list, function (ba) { io.observe(ba); });
  }

  /* ---------------- full screen ---------------- */
  function fsShell(j) {
    var f = document.createElement('div');
    f.className = 'tfg-fs'; f.setAttribute('role', 'dialog'); f.setAttribute('aria-modal', 'true'); f.setAttribute('aria-label', j.title + ' photos');
    document.body.appendChild(f);
    var pushed = false;
    try { history.pushState({ tfgfs: 1 }, ''); pushed = true; } catch (e) { /* ignore */ }
    f._close = function (fromPop) {
      if (!f.parentNode) return;
      f.parentNode.removeChild(f); document.removeEventListener('keydown', f._key); window.removeEventListener('popstate', f._pop);
      if (!fromPop && pushed) { try { if (history.state && history.state.tfgfs) history.back(); } catch (e) { /* ignore */ } }
      if (f._done) f._done();
    };
    f._pop = function () { f._close(true); };
    window.addEventListener('popstate', f._pop);
    return f;
  }
  function fullPhotos(j, photos, start, onDone) {
    var f = fsShell(j), i = start;
    f.innerHTML = '<div class="tfg-fs-st"><div class="tfg-fs-tr">' + photos.map(function (p) {
      return '<div class="tfg-fs-sl"><img alt="' + esc(STAGE_LABEL[p.stage] + ' photo') + '" draggable="false" data-src="' + src(p.id, 2400) + '" data-alt="' + alt(p.id, 2400) + '"></div>';
    }).join('') + '</div></div>' +
      '<div class="tfg-fs-bar t"><div class="tfg-fs-t"></div><button type="button" class="tfg-fs-x" data-fx aria-label="Close full screen">' + ICON.x + '</button></div>' +
      '<button type="button" class="tfg-fs-n p" data-fd="-1" aria-label="Previous photo">' + ICON.l + '</button><button type="button" class="tfg-fs-n n" data-fd="1" aria-label="Next photo">' + ICON.r + '</button>' +
      '<div class="tfg-fs-bar b"><div class="tfg-fs-cap"></div></div>';
    var stg = f.querySelector('.tfg-fs-st'), tr = f.querySelector('.tfg-fs-tr'), imgs = f.querySelectorAll('.tfg-fs-sl img');
    var z = { s: 1, x: 0, y: 0 };
    function load(k) { var im = imgs[k]; if (im && !im.getAttribute('src')) { im.onerror = function () { if (im.dataset.alt && im.src !== im.dataset.alt) im.src = im.dataset.alt; }; im.src = im.getAttribute('data-src'); } }
    function applyZ() { imgs[i].style.transform = 'translate(' + z.x + 'px,' + z.y + 'px) scale(' + z.s + ')'; }
    function resetZ() { z = { s: 1, x: 0, y: 0 }; Array.prototype.forEach.call(imgs, function (im) { im.style.transform = ''; }); }
    function show(k, anim) {
      i = Math.max(0, Math.min(photos.length - 1, k)); resetZ();
      tr.style.transition = anim === false ? 'none' : 'transform .25s ease'; tr.style.transform = 'translateX(' + (-i * 100) + '%)';
      load(i); load(i + 1); load(i - 1);
      var p = photos[i];
      f.querySelector('.tfg-fs-t').innerHTML = esc(j.title) + '<small>' + (i + 1) + ' of ' + photos.length + ' \u00b7 ' + STAGE_LABEL[p.stage] + '</small>';
      f.querySelector('.tfg-fs-cap').textContent = p.caption || '';
      f.querySelector('[data-fd="-1"]').disabled = i === 0; f.querySelector('[data-fd="1"]').disabled = i === photos.length - 1;
    }
    f._done = function () { if (onDone) onDone(i); };
    f._key = function (e) { if (e.key === 'Escape') f._close(); else if (e.key === 'ArrowRight') show(i + 1); else if (e.key === 'ArrowLeft') show(i - 1); };
    document.addEventListener('keydown', f._key);
    f.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-fx],[data-fd]') : null; if (!b) return;
      if (b.hasAttribute('data-fx')) f._close(); else show(i + Number(b.getAttribute('data-fd')));
    });
    /* swipe to change photo, pinch or double-tap to zoom, drag to look around, tap to hide the bars */
    var pts = {}, g = null, lastTap = 0, tapT = null;
    function two() { var k = Object.keys(pts); return k.length >= 2 ? [pts[k[0]], pts[k[1]]] : null; }
    stg.addEventListener('pointerdown', function (e) {
      pts[e.pointerId] = { x: e.clientX, y: e.clientY }; try { stg.setPointerCapture(e.pointerId); } catch (er) { /* ignore */ }
      var t = two();
      if (t) {
        var r = imgs[i].getBoundingClientRect(), bl = r.left - z.x, bt = r.top - z.y, cx = (t[0].x + t[1].x) / 2, cy = (t[0].y + t[1].y) / 2;
        g = { pinch: true, d0: Math.hypot(t[0].x - t[1].x, t[0].y - t[1].y) || 1, s0: z.s, bl: bl, bt: bt, lx: (cx - bl - z.x) / z.s, ly: (cy - bt - z.y) / z.s };
        tr.style.transform = 'translateX(' + (-i * 100) + '%)'; return;
      }
      g = { x: e.clientX, y: e.clientY, t: Date.now(), zx: z.x, zy: z.y, moved: false }; tr.style.transition = 'none';
    });
    stg.addEventListener('pointermove', function (e) {
      if (!pts[e.pointerId] || !g) return; pts[e.pointerId] = { x: e.clientX, y: e.clientY };
      if (g.pinch) {
        var t = two(); if (!t) return;
        var s = Math.max(1, Math.min(5, g.s0 * Math.hypot(t[0].x - t[1].x, t[0].y - t[1].y) / g.d0)), cx = (t[0].x + t[1].x) / 2, cy = (t[0].y + t[1].y) / 2;
        z.x = cx - g.bl - s * g.lx; z.y = cy - g.bt - s * g.ly; z.s = s; applyZ(); return;
      }
      var dx = e.clientX - g.x, dy = e.clientY - g.y; if (Math.abs(dx) + Math.abs(dy) > 8) g.moved = true;
      if (z.s > 1) { z.x = g.zx + dx; z.y = g.zy + dy; applyZ(); }
      else tr.style.transform = 'translateX(calc(' + (-i * 100) + '% + ' + dx + 'px))';
    });
    function tap(e) {
      var now = Date.now();
      if (now - lastTap < 300) {
        lastTap = 0; clearTimeout(tapT);
        if (z.s > 1) resetZ(); else { var r = imgs[i].getBoundingClientRect(), s = 2.5, ox = e.clientX - r.left, oy = e.clientY - r.top; z = { s: s, x: ox * (1 - s), y: oy * (1 - s) }; applyZ(); }
        return;
      }
      lastTap = now; tapT = setTimeout(function () { f.classList.toggle('bare'); }, 310);
    }
    stg.addEventListener('pointerup', function (e) {
      var wasPinch = g && g.pinch; delete pts[e.pointerId];
      if (!g) return;
      if (wasPinch) { if (!Object.keys(pts).length) { if (z.s < 1.05) resetZ(); g = null; } else { var k = Object.keys(pts)[0]; g = { x: pts[k].x, y: pts[k].y, t: Date.now(), zx: z.x, zy: z.y, moved: true }; } return; }
      var dx = e.clientX - g.x, moved = g.moved, dt = Date.now() - g.t; g = null;
      if (z.s > 1) { if (!moved) tap(e); return; }
      if (moved && (Math.abs(dx) > Math.min(80, stg.clientWidth * 0.18) || (dt < 250 && Math.abs(dx) > 30))) show(i + (dx < 0 ? 1 : -1)); else show(i);
      if (!moved) tap(e);
    });
    stg.addEventListener('pointercancel', function (e) { delete pts[e.pointerId]; g = null; show(i); });
    stg.addEventListener('wheel', function (e) { if (!e.ctrlKey) return; e.preventDefault(); z.s = Math.max(1, Math.min(5, z.s * (e.deltaY < 0 ? 1.1 : 0.9))); if (z.s === 1) resetZ(); else applyZ(); }, { passive: false });
    show(i, false);
  }
  function fullCompare(j, pair, pos) {
    var f = fsShell(j);
    f.innerHTML = '<div class="tfg-fs-st"><div class="tfg-fs-cmp tfg-ba" style="touch-action:none" role="slider" tabindex="0" aria-label="Drag to compare before and after" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50">' +
      '<img class="tfg-ba-a" alt="After" src="' + src(pair.after.id, 2400) + '"><img class="tfg-ba-b" alt="Before" src="' + src(pair.before.id, 2400) + '">' +
      '<span class="tfg-ba-l b" style="top:auto;bottom:calc(20px + env(safe-area-inset-bottom))">Before</span><span class="tfg-ba-l a" style="top:auto;bottom:calc(20px + env(safe-area-inset-bottom))">After</span>' +
      '<span class="tfg-ba-h"></span><span class="tfg-ba-k">' + ICON.lr + '</span></div></div>' +
      '<div class="tfg-fs-bar t"><div class="tfg-fs-t">' + esc(j.title) + '<small>Before &amp; after \u00b7 drag to compare</small></div><button type="button" class="tfg-fs-x" data-fx aria-label="Close full screen">' + ICON.x + '</button></div>';
    var ba = f.querySelector('.tfg-ba'); baSet(ba, pos == null ? 50 : pos);
    var dragging = false;
    function at(x) { var r = ba.getBoundingClientRect(); baSet(ba, (x - r.left) / r.width * 100); }
    ba.addEventListener('pointerdown', function (e) { dragging = true; try { ba.setPointerCapture(e.pointerId); } catch (er) { /* ignore */ } at(e.clientX); });
    ba.addEventListener('pointermove', function (e) { if (dragging) at(e.clientX); });
    ba.addEventListener('pointerup', function () { dragging = false; });
    ba.addEventListener('pointercancel', function () { dragging = false; });
    f._key = function (e) {
      if (e.key === 'Escape') f._close();
      else if (e.key === 'ArrowLeft') baSet(ba, (ba._p || 50) - 5); else if (e.key === 'ArrowRight') baSet(ba, (ba._p || 50) + 5);
    };
    document.addEventListener('keydown', f._key);
    f.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('[data-fx]')) f._close(); });
    ba.focus();
  }

  /* ---------------- job viewer ---------------- */
  function openJob(j, o) {
    var pair = pairOf(j);
    var photos = j.photos.slice();
    var st = { mode: pair ? 'compare' : 'all', i: 0, pos: 50 };
    var lastFocus = document.activeElement, swiped = false;

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
      if (document.querySelector('.tfg-fs')) return;
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
          '<span class="tfg-lbl l">BEFORE</span><span class="tfg-lbl r">AFTER</span>' +
          '<button type="button" class="tfg-fsb" data-fs="cmp" aria-label="Full screen">' + ICON.full + '</button></div>' +
          '<p class="tfg-hint">Drag the slider to compare</p>';
      }
      var p = photos[st.i];
      return '<div class="tfg-view2" data-view>' + imgTag(p.id, 1600, STAGE_LABEL[p.stage] + ' photo ' + (st.i + 1) + ' of ' + photos.length, '', true) +
        '<span class="tfg-tag ' + p.stage + '">' + STAGE_LABEL[p.stage] + '</span>' +
        '<button type="button" class="tfg-nav p" data-go="-1" aria-label="Previous photo"' + (st.i === 0 ? ' disabled' : '') + '>' + ICON.l + '</button>' +
        '<button type="button" class="tfg-nav n" data-go="1" aria-label="Next photo"' + (st.i === photos.length - 1 ? ' disabled' : '') + '>' + ICON.r + '</button>' +
        '<span class="tfg-count">' + (st.i + 1) + ' / ' + photos.length + '</span>' +
        '<button type="button" class="tfg-fsb" data-fs="photo" aria-label="Full screen">' + ICON.full + '</button></div>' +
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
      v.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; swiped = false; }, { passive: true });
      v.addEventListener('touchend', function (e) {
        if (sx == null) return;
        var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { swiped = true; setTimeout(function () { swiped = false; }, 400); go(st.i + (dx < 0 ? 1 : -1)); }
        sx = null;
      }, { passive: true });
    }

    m.addEventListener('click', function (e) {
      if (e.target === m) { close(); return; }
      var fsb = e.target.closest ? e.target.closest('[data-fs]') : null;
      if (fsb) { if (fsb.getAttribute('data-fs') === 'cmp') fullCompare(j, pair, st.pos); else fullPhotos(j, photos, st.i, function (k) { go(k); }); return; }
      var t = e.target.closest ? e.target.closest('[data-close],[data-mode],[data-go],[data-i],[data-cta]') : null;
      if (!t && e.target.closest && e.target.closest('[data-view]') && !swiped) { fullPhotos(j, photos, st.i, function (k) { go(k); }); return; }
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
