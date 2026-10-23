/* Team Forte proposal presentation.
   Customer link: team-forte.com/quote#p=TF-XXXXX (instant-quote.js hands the page to this file)
   Present at the kitchen table: teamsforte.github.io/p.html#p=TF-XXXXX&present=1
   Data and signing go through the Team Forte app (Apps Script). Texts below can be edited freely. */
(function () {
  'use strict';
  if (window.__tfp) return; window.__tfp = 1;

  var EXEC = 'https://script.google.com/macros/s/AKfycbyQpxQSZqBBXYN7i14FAsy23bjOoIT_F8333zYMU2JdYRL_b22SXzdS-dlWZeVhkvxA/exec';
  var LOGO = 'https://teamsforte.github.io/email-logo.png?v=2';

  /* ------------------------------------------------------------------ copy (edit freely) */
  var COPY = {
    phone: '(860) 854-9335',
    /* Financing. Until a lender is set up this shows "ask us about financing".
       When you have one: lender: 'Name', applyUrl: 'https://...', plans: [{ apr: 9.99, months: 120 }, { label: '12 months same as cash' }] */
    finance: { on: true, lender: '', applyUrl: '', plans: [] },
    /* Only list certifications you hold today; they appear on a signed proposal. Example: 'Owens Corning® Preferred Contractor' */
    certs: [],
    reviews: {
      summary: ['4.6 out of 5 on Thumbtack', '38 reviews · 76 hires', 'Thumbtack Top Pro 2024 & 2025'],
      link: 'https://www.thumbtack.com/ct/east-berlin/handyman/team-forte/service/492393865040117772',
      quotes: [
        { who: 'Julie G.', job: 'Handyman', text: 'Very communicative, reliable, smart, efficient, experienced, and a complete doer.' },
        { who: 'ErikaRaquel F.', job: 'Assembly', text: 'They worked diligently, fairly quietly, efficiently, and masterfully.' },
        { who: 'Angie P.', job: 'Renovation', text: 'Junior was incredibly hard working.' }
      ]
    },
    why: [
      ['Licensed & insured', 'Full credentials on file, so you know exactly who is working on your roof.'],
      ['Honest advice', 'Free inspection, written estimate, and we will not push a replacement you do not need.'],
      ['Built for Connecticut weather', 'Local crews who know ice dams, nor’easters, and the materials that actually last here.'],
      ['Clear communication', 'From the first inspection to the final walkthrough, you are never left guessing.'],
      ['Help with insurance claims', 'We document storm damage with photos and work directly with your adjuster.']
    ],
    system: [
      ['Full tear-off to the wood', 'We strip the old roofing so we can see and fix the deck instead of covering problems up.'],
      ['Ice & water barrier', 'Owens Corning WeatherLock® at the eaves, valleys and around every opening. This is what stops ice-dam leaks.'],
      ['Synthetic underlayment', 'Owens Corning Deck Defense® under every shingle: a second waterproof layer.'],
      ['Matching starter & ridge caps', 'Owens Corning starter strip and hip & ridge shingles, so the whole roof reaches its full wind rating.'],
      ['Ridge vent', 'Owens Corning VentSure® lets the attic breathe, so shingles last longer and ice dams are less likely.'],
      ['New metal and seals', 'New drip edge, flashing and pipe boots. The places most roofs leak are replaced, not reused.'],
      ['Permit', 'We pull the building permit and handle the inspection.'],
      ['Daily cleanup & nail sweep', 'We clean up every day and run a magnet over your yard and driveway before we leave.'],
      ['Warranty registration', 'Your Owens Corning shingle warranty, registered in your name.']
    ],
    steps: [
      ['Sign & deposit', 'Your deposit holds your spot on the schedule.'],
      ['Permit & materials', 'We pull the permit and order your Owens Corning materials.'],
      ['Install', 'Tear-off and new roof. Most homes take 1 to 3 days, weather permitting.'],
      ['Cleanup & walkthrough', 'We clean up and walk the finished roof with you before we call it done.'],
      ['Warranty', 'Registered in your name. You get the paperwork.']
    ],
    faq: [
      ['Why might your price be higher than another quote?', 'Most price gaps come from what’s left out. Ask the other contractor if their price includes a full tear-off, ice & water barrier at the eaves and valleys, new drip edge and flashing (not reused), new pipe boots, ridge ventilation, the building permit, and a licensed and insured crew. Every one of those is in this price, in writing. It’s the difference between a roof that leaks in year 5 and one that lasts.'],
      ['What if you find rotted wood under the old roof?', 'We show you first. Soft or rotted decking is replaced only with your OK, at the per-sheet price in your terms, so there are no surprise bills.'],
      ['How long will it take?', 'Most homes are done in 1 to 3 days, depending on size and weather. We give you a date when you sign.'],
      ['What warranty comes with the roof?', 'Your Owens Corning shingles carry a limited lifetime shingle warranty, and we register it in your name. Ask us about our workmanship warranty; we put it in writing before work starts.'],
      ['Do you offer financing?', '__FINANCE__'],
      ['Do you help with insurance claims?', 'Yes. If storm damage is involved, we document it with photos and work directly with your adjuster.'],
      ['What do I pay, and when?', '__DEPOSIT__'],
      ['Will you protect my yard and house?', 'We clean up every day and run a magnetic nail sweep over the yard and driveway before we leave. Tell us about anything delicate near the house and we’ll protect it.']
    ]
  };

  /* Inspection photo tags (from the app) explained in plain English */
  var TAG_INFO = {
    'Missing or damaged shingles': 'Open spots let water reach the wood underneath, and the damage spreads with every storm.',
    'Lifted or creased shingles': 'Wind has broken the seal. These are the next shingles to blow off.',
    'Granule loss / worn shingles': 'Granules shield shingles from the sun. Once they wash off, shingles dry out, crack and curl.',
    'Pipe boot': 'Rubber pipe boots crack with age and are one of the most common sources of leaks.',
    'Flashing': 'Flashing seals where the roof meets walls and chimneys. Gaps here let water run inside the walls.',
    'Chimney': 'If the chimney isn’t sealed right, water runs down it into the attic.',
    'Soft or rotted decking': 'Soft wood won’t hold nails. It has to be replaced so the new roof stays put.',
    'Valley': 'Valleys carry the most water on a roof, so worn valleys leak first.',
    'Ventilation': 'Poor attic airflow bakes shingles from below in summer and causes ice dams in winter.',
    'Gutters / drip edge': 'Without a proper drip edge, water wicks under the shingles and rots the roof edge.',
    'Leak / water stain': 'Water is already getting in, and every rain adds to the damage inside.',
    'Hail or wind damage': 'Storm damage weakens shingles, and it may be covered by homeowner’s insurance.'
  };

  /* What happens if a problem is left alone (shown under each inspection photo) */
  var WAIT_INFO = {
    'Missing or damaged shingles': 'Water reaches the wood deck. Rotted decking turns a roof job into a bigger repair.',
    'Lifted or creased shingles': 'The next strong wind can tear them off and open the roof to rain.',
    'Granule loss / worn shingles': 'Shingles get brittle and start to curl and crack. Leaks usually follow.',
    'Pipe boot': 'Water runs down the pipe into the attic and ceiling, often unnoticed for months.',
    'Flashing': 'Water gets behind walls and siding, where rot and mold grow out of sight.',
    'Chimney': 'Leaks around the chimney can stain ceilings and rot the framing around it.',
    'Soft or rotted decking': 'The soft area spreads, and it can sag or fail under snow load.',
    'Valley': 'Valley leaks get worse fast because so much water runs through them.',
    'Ventilation': 'Shingles age years faster, and winter ice dams can push water under the roof.',
    'Gutters / drip edge': 'The roof edge and fascia boards rot, and water spills behind the gutters.',
    'Leak / water stain': 'Insulation, drywall and framing keep soaking up water with every storm.',
    'Hail or wind damage': 'Insurance claims have deadlines, and damaged shingles keep breaking down.'
  };
  /* Talking points shown only in presenter mode (Notes button or N key) */
  var NOTES = {
    cover: 'Thank them for their time. “Before we talk numbers, let me show you what we found and exactly how we’d do the job.”',
    today: 'Walk through size, pitch and layers. Point out the garage or extra roofs. “This is measured from satellite and checked on your roof today.”',
    found: 'Go photo by photo and let them react. Tie each one to what happens if they wait.',
    work: '“These are recent jobs by the same crew that would do your roof.”',
    why: 'Licensed and insured, honest advice, real reviews. Keep it short.',
    system: 'This answers “why are you more?” Ask: “Did the other quote include ice & water, new flashing, ridge vent and the permit?”',
    compare: 'Point to the middle column: “Most homeowners pick this one. It’s the best value for the money.”',
    price: 'Show the price, then stop talking. Ask: “Which one feels right for your home?” Mention the price-lock date.',
    color: 'Let them pick. Offer to bring real samples before ordering.',
    steps: 'Explain what happens after they say yes, and give them a realistic install window.',
    faq: 'Answer anything open. Offer to text the link so a spouse can see it too.',
    sign: '“If everything looks right, I can lock this in today.” Hand them the tablet to sign.'
  };

  /* Owens Corning packages (same as the website instant quote) */
  var PKGS = [
    { label: 'Good', name: 'Owens Corning® Oakridge®', ribbon: 'Best value',
      desc: 'Owens Corning’s most affordable architectural shingle. A big step up from 3-tab.',
      specs: ['Limited Lifetime shingle warranty*', 'Wind: 110 MPH (130 MPH with special installation)*', 'StreakGuard® algae resistance*'],
      colors: ['Onyx Black', 'Estate Gray', 'Driftwood', 'Brownwood', 'Teak', 'Desert Tan'],
      cmp: { wind: '110 MPH (130 with special install)*', impact: '—', look: 'Classic architectural', cold: '—', best: 'Best value' } },
    { label: 'Better', name: 'Owens Corning® Duration®', ribbon: 'Most popular',
      desc: 'Owens Corning’s best-selling shingle, with TruDefinition® color and SureNail® Technology.',
      specs: ['Limited Lifetime shingle warranty*', 'Wind: up to 160 MPH with OC starter and hip & ridge*', 'Class 3 impact resistance'],
      colors: ['Onyx Black', 'Estate Gray', 'Driftwood', 'Brownwood', 'Teak', 'Williamsburg Gray', 'Slatestone Gray', 'Peppercorn', 'Colonial Slate', 'Sierra Gray', 'Harbor Blue', 'Chateau Green', 'Midnight Plum', 'Desert Rose', 'Sand Castle', 'Terra Cotta'],
      cmp: { wind: 'Up to 160 MPH*', impact: 'Class 3', look: 'TruDefinition® color', cold: '—', best: 'Most homes' } },
    { label: 'Best', name: 'Owens Corning® Duration FLEX®', ribbon: 'Top protection',
      desc: 'SBS-modified shingle that stays flexible in the cold, with the highest impact rating.',
      specs: ['Limited Lifetime shingle warranty*', 'Wind: up to 160 MPH with OC starter and hip & ridge*', 'UL 2218 Class 4 impact rating. May qualify for an insurance discount'],
      colors: ['Onyx Black', 'Black Sable', 'Estate Gray', 'Driftwood', 'Brownwood', 'Teak', 'Summer Harvest'],
      cmp: { wind: 'Up to 160 MPH*', impact: 'Class 4 (highest)', look: 'TruDefinition® color', cold: 'Stays flexible (SBS)', best: 'Hail & harsh winters' } }
  ];

  /* ------------------------------------------------------------------ shingle swatches (drawn, approximate) */
  var TONES = {
    'Onyx Black': ['#1c1e20', '#25272a', '#2e3033', '#3a3c3f', '#46484b'],
    'Black Sable': ['#24211e', '#2f2b27', '#3b3530', '#4a4239', '#5a4e42'],
    'Estate Gray': ['#3a3d3e', '#4b4f50', '#5d6162', '#707475', '#858989', '#2f3132'],
    'Driftwood': ['#3a3631', '#4f4740', '#665a4e', '#7d6e5d', '#94846f', '#5e4436', '#6c6e6c'],
    'Brownwood': ['#2f2420', '#3f2f28', '#523c32', '#664a3c', '#7a5a47', '#3b3330'],
    'Teak': ['#352c27', '#463a33', '#58493f', '#6b594c', '#7e6a5a', '#3e3836'],
    'Desert Tan': ['#5d4c3f', '#73604f', '#8a7460', '#a08872', '#b59d85', '#655a52'],
    'Williamsburg Gray': ['#36383c', '#45474c', '#55585d', '#66696e', '#787b80', '#4d4746'],
    'Slatestone Gray': ['#464b4c', '#575d5e', '#696f70', '#7c8282', '#8f9494', '#4f4b48'],
    'Peppercorn': ['#2e2e2b', '#3d3d39', '#4d4d48', '#5f5f59', '#73736c', '#3a3532'],
    'Colonial Slate': ['#3f3a37', '#514a46', '#645b56', '#776d66', '#5a453d', '#8a817a'],
    'Sierra Gray': ['#6b6c68', '#7d7e7a', '#90918c', '#a2a39e', '#b5b6b0', '#5d5b57'],
    'Harbor Blue': ['#2c363e', '#3a4650', '#495762', '#5a6974', '#6d7c86', '#3d3f43'],
    'Chateau Green': ['#26332c', '#33433a', '#41544a', '#50655a', '#62776b', '#3a3a34'],
    'Midnight Plum': ['#2f2e35', '#3d3b44', '#4c4954', '#5c5864', '#4a3a43', '#6c6873'],
    'Desert Rose': ['#4f3a31', '#644a3f', '#7a5b4d', '#8f6d5d', '#a4806e', '#5a4a44'],
    'Sand Castle': ['#706352', '#857765', '#998b78', '#ad9f8b', '#c1b39e', '#655e57'],
    'Terra Cotta': ['#5c3328', '#723f32', '#88503f', '#9c604d', '#b0725d', '#4a3a33'],
    'Summer Harvest': ['#54473e', '#6a5b4f', '#807061', '#968574', '#ac9a87', '#6b4c3e']
  };
  var swCache = {};
  function seedRand(str) {
    var h = 1779033703 ^ str.length;
    for (var i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; }
    return function () { h = Math.imul(h ^ h >>> 16, 2246822507); h = Math.imul(h ^ h >>> 13, 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
  }
  function hexRgb(hx) { var n = parseInt(hx.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function swatch(name, w, h) {
    var key = name + w + 'x' + h; if (swCache[key]) return swCache[key];
    try {
      var tones = (TONES[name] || TONES['Estate Gray']).map(hexRgb), rnd = seedRand(name);
      var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      var ctx = cv.getContext('2d'), im = ctx.createImageData(w, h), d = im.data, rows = 4, rh = h / rows, courses = [];
      for (var r = 0; r < rows; r++) {
        var x = -Math.round(rnd() * w * 0.12), tabs = [];
        while (x < w) { var tw = Math.round(w * (0.12 + rnd() * 0.14)); var t = Math.floor(rnd() * tones.length); if (rnd() < 0.12) t = tones.length - 1 - Math.floor(rnd() * 2);
          tabs.push({ x0: x, x1: x + tw, tone: t, band: rnd() < 0.45 ? 0.25 + rnd() * 0.3 : 0, bt: Math.floor(rnd() * 2) }); x += tw; }
        courses.push(tabs);
      }
      for (var y = 0; y < h; y++) {
        var ri = Math.min(rows - 1, Math.floor(y / rh)), ty = (y - ri * rh) / rh, tb = courses[ri];
        for (var xx = 0; xx < w; xx++) {
          var tab = tb[tb.length - 1], edge = 99;
          for (var k = 0; k < tb.length; k++) { if (xx >= tb[k].x0 && xx < tb[k].x1) { tab = tb[k]; edge = Math.min(xx - tab.x0, tab.x1 - xx); break; } }
          var c0 = tab.band && ty < tab.band ? tones[tab.bt] : tones[tab.tone];
          if (rnd() < 0.1) c0 = tones[Math.floor(rnd() * tones.length)];
          var n = (rnd() - 0.5) * 26, sh = ty > 0.93 ? 0.45 : (ty < 0.06 ? 0.82 : 1); if (edge < 1.2) sh *= 0.55;
          var p = (y * w + xx) * 4;
          d[p] = Math.max(0, Math.min(255, (c0[0] + n) * sh)); d[p + 1] = Math.max(0, Math.min(255, (c0[1] + n) * sh)); d[p + 2] = Math.max(0, Math.min(255, (c0[2] + n) * sh)); d[p + 3] = 255;
        }
      }
      ctx.putImageData(im, 0, 0);
      return (swCache[key] = cv.toDataURL('image/jpeg', 0.85));
    } catch (e) { return ''; }
  }

  /* ------------------------------------------------------------------ helpers */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function money(n, cents) { return '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 }); }
  function img(id, w, alt, cls) {
    var a = 'https://lh3.googleusercontent.com/d/' + encodeURIComponent(id) + '=w' + w, b = 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(id) + '&sz=w' + w;
    return '<img' + (cls ? ' class="' + cls + '"' : '') + ' src="' + a + '" alt="' + esc(alt || '') + '" loading="lazy" onerror="this.onerror=null;this.src=\'' + b + '\'">';
  }
  function params() {
    var o = {}, src = (location.search.slice(1) + '&' + location.hash.slice(1)).split('&');
    src.forEach(function (kv) { var i = kv.indexOf('='); if (i > 0) o[decodeURIComponent(kv.slice(0, i))] = decodeURIComponent(kv.slice(i + 1)); });
    return o;
  }
  function jsonp(url, ms) {
    return new Promise(function (ok, bad) {
      var cb = '__tfp' + Date.now() + Math.floor(Math.random() * 1e4), s = document.createElement('script'), done = false;
      var t = setTimeout(function () { if (done) return; done = true; cleanup(); bad(new Error('timeout')); }, ms || 25000);
      function cleanup() { try { delete window[cb]; } catch (e) { window[cb] = undefined; } if (s.parentNode) s.parentNode.removeChild(s); }
      window[cb] = function (d) { if (done) return; done = true; clearTimeout(t); cleanup(); ok(d); };
      s.onerror = function () { if (done) return; done = true; clearTimeout(t); cleanup(); bad(new Error('load')); };
      s.src = url + (url.indexOf('?') < 0 ? '?' : '&') + 'callback=' + cb; document.head.appendChild(s);
    });
  }
  var ICON = {
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>'
  };

  /* ------------------------------------------------------------------ styles */
  var CSS = '#tfp,#tfp *{box-sizing:border-box}#tfp{--navy:#13202F;--navy2:#1B2B3D;--red:#FF5440;--red2:#E8412E;--ink:#1C2430;--muted:#5B6675;--line:#DDE2E8;--bg:#F2F4F7;--green:#16A34A;' +
    'font-family:Montserrat,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:var(--ink);background:var(--bg);line-height:1.5;-webkit-font-smoothing:antialiased;min-height:100vh}' +
    '#tfp button{font-family:inherit;cursor:pointer}#tfp a{color:inherit}' +
    '#tfp .bar{position:sticky;top:0;z-index:20;background:var(--navy);color:#fff}#tfp .bar-in{max-width:980px;margin:0 auto;padding:10px 16px;display:flex;align-items:center;justify-content:space-between;gap:10px}' +
    '#tfp .bar img{height:34px;width:auto;display:block}#tfp .call{display:inline-flex;align-items:center;gap:7px;background:var(--red);color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:9px 14px;border-radius:999px;white-space:nowrap}#tfp .call svg{width:16px;height:16px}' +
    '#tfp .prog{height:4px;background:#2a3a4d}#tfp .prog i{display:block;height:100%;width:0;background:var(--red);transition:width .3s}' +
    '#tfp .s{max-width:980px;margin:0 auto;padding:44px 16px}#tfp .s+.s{border-top:1px solid var(--line)}' +
    '#tfp .k{font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--red2);margin:0 0 8px}' +
    '#tfp h1,#tfp h2{font-weight:800;line-height:1.15;margin:0 0 12px;color:var(--navy)}#tfp h1{font-size:40px}#tfp h2{font-size:30px}#tfp h3{font-size:17px;margin:0 0 4px;color:var(--navy)}' +
    '#tfp .lead{font-size:17px;color:var(--muted);max-width:640px;margin:0 0 22px}#tfp .m{color:var(--muted);font-size:14px}' +
    '#tfp .hero{position:relative;background:var(--navy);color:#fff;overflow:hidden}#tfp .hero .bgi{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.35}' +
    '#tfp .hero .s{position:relative;padding:72px 16px 64px}#tfp .hero h1{color:#fff;font-size:46px}#tfp .hero .lead{color:#dbe2eb}#tfp .hero .k{color:#ff8274}' +
    '#tfp .chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}#tfp .chip{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);border-radius:999px;padding:6px 12px;font-size:13px;font-weight:600}' +
    '#tfp .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}#tfp .stat{background:#fff;border:1px solid var(--line);border-radius:14px;padding:18px 16px}' +
    '#tfp .stat b{display:block;font-size:34px;font-weight:800;color:var(--navy);line-height:1.1}#tfp .stat span{font-size:13px;color:var(--muted);font-weight:600}' +
    '#tfp .roofs{margin-top:14px;font-size:14px;color:var(--muted)}' +
    '#tfp .grid2{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}#tfp .grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}' +
    '#tfp .card{background:#fff;border:1px solid var(--line);border-radius:14px;overflow:hidden}#tfp .card .in{padding:14px 16px}' +
    '#tfp .ph img{width:100%;height:240px;object-fit:cover;display:block;background:#dde2e8}#tfp .tag{display:inline-block;background:#FFEDEA;color:#B42318;font-weight:700;font-size:12px;border-radius:999px;padding:3px 10px;margin-bottom:6px}' +
    '#tfp .note{font-size:14px;margin:4px 0 0}#tfp .why{font-size:13px;color:var(--muted);margin:6px 0 0}' +
    '#tfp .job img{width:100%;height:200px;object-fit:cover;display:block;background:#dde2e8}' +
    '#tfp .list{display:grid;grid-template-columns:repeat(2,1fr);gap:12px 22px}#tfp .li{display:flex;gap:12px;align-items:flex-start}' +
    '#tfp .li i{flex:none;width:26px;height:26px;border-radius:50%;background:var(--red);color:#fff;display:flex;align-items:center;justify-content:center;margin-top:2px}#tfp .li i svg{width:15px;height:15px}' +
    '#tfp .li p{margin:2px 0 0;font-size:14px;color:var(--muted)}' +
    '#tfp .revs{display:grid;grid-template-columns:1fr 2fr;gap:14px;margin-top:22px}#tfp .rate{background:var(--navy);color:#fff;border-radius:14px;padding:18px}' +
    '#tfp .rate .st{color:#FDB022;display:flex;gap:2px}#tfp .rate .st svg{width:20px;height:20px}#tfp .rate div{font-size:14px;margin-top:6px}#tfp .rate b{font-size:22px}' +
    '#tfp .q{background:#fff;border:1px solid var(--line);border-radius:14px;padding:14px 16px;font-size:15px}#tfp .q small{display:block;color:var(--muted);font-size:12px;margin-top:6px}' +
    '#tfp .qs{display:grid;gap:10px}#tfp .certs{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}#tfp .certs span{background:#fff;border:1px solid var(--line);border-radius:999px;padding:6px 12px;font-size:13px;font-weight:700}' +
    '#tfp .tl{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(5,1fr);gap:12px;counter-reset:st}#tfp .tl li{background:#fff;border:1px solid var(--line);border-radius:14px;padding:16px 14px;counter-increment:st}' +
    '#tfp .tl li:before{content:counter(st);display:flex;width:30px;height:30px;border-radius:50%;background:var(--navy);color:#fff;font-weight:800;align-items:center;justify-content:center;margin-bottom:10px}#tfp .tl p{margin:4px 0 0;font-size:13px;color:var(--muted)}' +
    '#tfp .opts{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;align-items:stretch}#tfp .opt{position:relative;background:#fff;border:2px solid var(--line);border-radius:16px;padding:20px 16px 16px;display:flex;flex-direction:column;text-align:left}' +
    '#tfp .opt.on{border-color:var(--red);box-shadow:0 10px 30px rgba(255,84,64,.18)}#tfp .opt .rib{position:absolute;top:-12px;left:16px;background:var(--navy);color:#fff;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;border-radius:999px;padding:4px 10px}' +
    '#tfp .opt .rib.rec{background:var(--red)}#tfp .opt .lv{font-size:12px;font-weight:800;color:var(--muted);letter-spacing:.1em;text-transform:uppercase}#tfp .opt h3{font-size:18px;margin:2px 0 8px}' +
    '#tfp .opt .pr{font-size:32px;font-weight:800;color:var(--navy);margin:2px 0 6px}#tfp .opt ul{margin:8px 0 14px;padding-left:18px;font-size:13px;color:var(--muted)}#tfp .opt ul li{margin:3px 0}' +
    '#tfp .opt .pick{margin-top:auto;border:0;border-radius:10px;padding:12px;font-weight:800;font-size:15px;background:var(--bg);color:var(--navy)}#tfp .opt.on .pick{background:var(--red);color:#fff}' +
    '#tfp .fin{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px 18px;background:#fff;border:1px solid var(--line);border-left:4px solid var(--red);border-radius:14px;padding:16px 18px;margin-top:18px}' +
    '#tfp .fin-mo{font-size:22px;color:var(--navy)}#tfp .fin-mo b{font-size:30px;font-weight:800}#tfp .fin .btn{padding:13px 18px;font-size:15px}' +
    '#tfp .dep{margin-top:14px;font-size:14px;color:var(--muted)}#tfp .fine{font-size:11px;color:var(--muted);margin-top:8px}' +
    '#tfp .sws{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:12px}#tfp .sw{background:#fff;border:2px solid var(--line);border-radius:12px;padding:0;overflow:hidden;text-align:left}' +
    '#tfp .sw img{display:block;width:100%;height:80px;object-fit:cover;background:#ccc}#tfp .sw span{display:block;padding:7px 9px;font-size:13px;font-weight:700}#tfp .sw.on{border-color:var(--red);box-shadow:0 6px 18px rgba(255,84,64,.22)}' +
    '#tfp .viz{margin-top:14px;font-size:14px}#tfp .faq details{background:#fff;border:1px solid var(--line);border-radius:12px;margin-bottom:10px}#tfp .faq summary{list-style:none;padding:15px 16px;font-weight:700;color:var(--navy);display:flex;justify-content:space-between;gap:12px}' +
    '#tfp .faq summary::-webkit-details-marker{display:none}#tfp .faq summary:after{content:"+";font-size:22px;line-height:1;color:var(--red)}#tfp .faq details[open] summary:after{content:"–"}#tfp .faq p{margin:0;padding:0 16px 16px;color:var(--muted);font-size:15px}' +
    '#tfp .ask{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}#tfp .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:0;border-radius:12px;background:var(--red);color:#fff;font-weight:800;font-size:16px;padding:15px 20px;text-decoration:none}' +
    '#tfp .btn.ghost{background:#fff;color:var(--navy);border:2px solid var(--line)}#tfp .btn svg{width:18px;height:18px}#tfp .btn[disabled]{opacity:.6}#tfp .btn.block{width:100%}' +
    '#tfp .sum{background:#fff;border:1px solid var(--line);border-radius:14px;padding:16px;margin-bottom:14px}#tfp .sum .r{display:flex;justify-content:space-between;gap:10px;padding:6px 0;font-size:15px}#tfp .sum .r+.r{border-top:1px solid var(--line)}' +
    '#tfp .sum .tot{font-size:22px;font-weight:800;color:var(--navy)}#tfp .terms{font-size:13px;color:var(--muted);background:#fff;border:1px solid var(--line);border-radius:14px;padding:14px 16px;margin-bottom:14px}' +
    '#tfp label.f{display:block;font-size:13px;font-weight:700;margin:12px 0 6px}#tfp .inp{width:100%;border:1px solid var(--line);border-radius:10px;padding:13px;font:inherit;font-size:16px;background:#fff}' +
    '#tfp canvas.sig{width:100%;height:170px;border:2px dashed #B9C3CE;border-radius:12px;background:#fff;touch-action:none;display:block}#tfp .row{display:flex;justify-content:space-between;align-items:center}' +
    '#tfp .lnk{background:none;border:0;color:var(--muted);text-decoration:underline;font-weight:600;font-size:13px}#tfp .ck{display:flex;gap:10px;align-items:flex-start;font-size:14px;margin:14px 0}#tfp .ck input{width:20px;height:20px;margin-top:2px;accent-color:#FF5440}' +
    '#tfp .err{color:#B42318;font-size:14px;min-height:20px;margin-top:8px}#tfp .ok{background:#E5F6EC;border:1px solid #BFE6CF;color:#145C34;border-radius:14px;padding:18px;font-size:16px}#tfp .ok .btn{margin-top:12px}' +
    '#tfp .foot{background:var(--navy);color:#c4ccd6;font-size:13px}#tfp .foot .s{padding:24px 16px}#tfp .foot b{color:#fff}' +
    '#tfp .load{max-width:520px;margin:0 auto;padding:90px 20px;text-align:center;color:var(--muted)}#tfp .spin{width:38px;height:38px;border:4px solid #dde2e8;border-top-color:var(--red);border-radius:50%;margin:0 auto 14px;animation:tfpspin 1s linear infinite}' +
    '@keyframes tfpspin{to{transform:rotate(360deg)}}' +
    /* animations */
    '#tfp .rv{opacity:0;transform:translateY(22px);transition:opacity .6s ease,transform .7s cubic-bezier(.2,.75,.2,1)}#tfp .rv.in{opacity:1;transform:none}' +
    '#tfp .hero .bgi{animation:tfpkb 16s ease-out both}@keyframes tfpkb{from{transform:scale(1.14)}to{transform:scale(1)}}' +
    '#tfp .hero .s>*{animation:tfpup .8s cubic-bezier(.2,.75,.2,1) both}#tfp .hero .s>*:nth-child(2){animation-delay:.12s}#tfp .hero .s>*:nth-child(3){animation-delay:.24s}#tfp .hero .s>*:nth-child(4){animation-delay:.36s}#tfp .hero .s>*:nth-child(5){animation-delay:.5s}' +
    '@keyframes tfpup{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:none}}' +
    '#tfp .li i,#tfp .tl li:before{transition:transform .5s cubic-bezier(.3,1.6,.5,1) .15s}#tfp .rv:not(.in) .li i,#tfp .li.rv:not(.in) i,#tfp .tl li.rv:not(.in):before{transform:scale(0)}' +
    '#tfp .opt{transition:border-color .25s,box-shadow .25s,transform .25s}#tfp .opt.pop{animation:tfppop .45s cubic-bezier(.3,1.5,.5,1)}@keyframes tfppop{0%{transform:scale(.97)}60%{transform:scale(1.03)}100%{transform:scale(1)}}' +
    '#tfp .sw{transition:transform .2s,border-color .2s,box-shadow .2s}#tfp .sw:hover{transform:translateY(-3px)}#tfp .sw.on{transform:translateY(-3px)}' +
    '#tfp .btn{transition:transform .15s,box-shadow .2s,background .2s}#tfp .btn:active{transform:scale(.97)}#tfp .btn:not(.ghost):hover{box-shadow:0 8px 22px rgba(255,84,64,.35)}' +
    '#tfp .card.ph img,#tfp .card.job img{transition:transform .6s ease}#tfp .card.ph:hover img,#tfp .card.job:hover img{transform:scale(1.04)}#tfp .card{overflow:hidden}' +
    '#tfp .ok{animation:tfpup .6s cubic-bezier(.2,.75,.2,1) both}#tfp .okchk{width:44px;height:44px;border-radius:50%;background:var(--green);color:#fff;display:flex;align-items:center;justify-content:center;margin-bottom:10px;animation:tfppop .6s cubic-bezier(.3,1.6,.5,1) both}' +
    '#tfp .okchk svg{width:24px;height:24px;stroke-dasharray:30;stroke-dashoffset:30;animation:tfpdraw .5s .25s ease forwards}@keyframes tfpdraw{to{stroke-dashoffset:0}}' +
    '#tfp .faq details p{animation:tfpup .35s ease both}' +
    '#tfp .layers .lay{animation:tfpdrop .6s cubic-bezier(.2,.75,.2,1) both}@keyframes tfpdrop{from{opacity:0;transform:translateY(-26px)}to{opacity:1;transform:none}}' +
    '@media (prefers-reduced-motion:reduce){#tfp .rv{opacity:1;transform:none;transition:none}#tfp *{animation:none!important;transition:none!important}}' +
    /* v2: magazine layouts */
    '#tfp .split{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:32px;align-items:center}#tfp .split.rev{grid-template-columns:minmax(0,1fr) minmax(0,1.15fr)}' +
    '#tfp .media{position:relative;border-radius:20px;overflow:hidden;background:#cfd6de;min-height:360px;box-shadow:0 20px 50px rgba(19,32,47,.18)}#tfp .media>.mapbox,#tfp .media>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}' +
    '#tfp .media .cap{position:absolute;left:12px;bottom:12px;background:rgba(19,32,47,.82);color:#fff;font-size:12px;font-weight:700;border-radius:999px;padding:6px 12px;z-index:2}' +
    '#tfp .cover{background:var(--navy);color:#fff}#tfp .cover .s{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.2fr);gap:36px;align-items:center;padding-top:56px;padding-bottom:56px}' +
    '#tfp .cover h1{color:#fff;font-size:clamp(34px,4.6vw,60px)}#tfp .cover .lead{color:#dbe2eb}#tfp .cover .k{color:#ff8274}#tfp .cover .media{min-height:420px;box-shadow:0 30px 60px rgba(0,0,0,.35)}' +
    '#tfp .cover .s>div:first-child>*{animation:tfpup .8s cubic-bezier(.2,.75,.2,1) both}#tfp .cover .s>div:first-child>*:nth-child(2){animation-delay:.1s}#tfp .cover .s>div:first-child>*:nth-child(3){animation-delay:.2s}#tfp .cover .s>div:first-child>*:nth-child(4){animation-delay:.3s}#tfp .cover .s>div:first-child>*:nth-child(5){animation-delay:.4s}' +
    '#tfp .cover .media{animation:tfpin2 1s cubic-bezier(.2,.75,.2,1) .15s both}@keyframes tfpin2{from{opacity:0;transform:scale(.96) translateY(14px)}to{opacity:1;transform:none}}' +
    '#tfp .stats.two{grid-template-columns:repeat(2,1fr)}#tfp .rlist{margin-top:14px;display:grid;gap:8px}#tfp .rlist div{display:flex;justify-content:space-between;gap:10px;background:#fff;border:1px solid var(--line);border-radius:12px;padding:10px 14px;font-size:14px}' +
    '#tfp .rlist i{display:inline-block;width:12px;height:12px;border-radius:3px;margin-right:8px;vertical-align:-1px}' +
    '#tfp .wait{font-size:13px;color:#B42318;margin:8px 0 0;padding-top:8px;border-top:1px dashed #F3C1BA}#tfp .wait b{font-weight:800}' +
    '#tfp .find{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}#tfp .find .card.ph img{height:260px}' +
    '#tfp .mag{display:grid;grid-template-columns:2fr 1fr;grid-template-rows:1fr 1fr;gap:14px;height:440px}#tfp .mag .card{position:relative}#tfp .mag .card:first-child{grid-row:1/3}#tfp .mag .card img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}' +
    '#tfp .mag .card .in{position:absolute;left:0;right:0;bottom:0;background:linear-gradient(to top,rgba(10,16,24,.85),transparent);color:#fff;padding:30px 16px 14px}#tfp .mag .card .in h3{color:#fff}#tfp .mag .card .in .m{color:#dbe2eb}' +
    '#tfp .plus{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}#tfp .plus span{display:inline-flex;align-items:center;gap:6px;background:#fff;border:1px solid var(--line);border-radius:99px;padding:7px 12px;font-size:13px;font-weight:700;color:var(--navy)}#tfp .plus svg{width:14px;height:14px;color:var(--green)}' +
    '#tfp.pres .cover.slide>.s{display:grid;align-content:center}@media(min-width:861px){#tfp.pres .sys{grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);align-items:center}}#tfp .sys .layers{max-width:460px;margin:0 auto}#tfp.pres .numl{gap:8px}#tfp.pres .numl .li p{font-size:13.5px}' +
    '#tfp .swipe{display:none;font-size:13px;color:var(--muted);margin:-6px 0 8px}@media(max-width:600px){#tfp .swipe{display:block}}#tfp .cmpw{overflow-x:auto;-webkit-overflow-scrolling:touch;border-radius:16px}@media(max-width:600px){#tfp .cmp{min-width:500px;font-size:13px}#tfp .cmp th:first-child,#tfp .cmp td:first-child{width:92px}#tfp .cmp th,#tfp .cmp td{padding:10px 8px}#tfp .cmp th:first-child,#tfp .cmp td:first-child{position:sticky;left:0;background:#fff;z-index:1}#tfp .nav .dots{gap:4px;flex-wrap:nowrap}#tfp .nav .dots i{width:6px;height:6px}#tfp .nav .dots i.on{width:14px}}' +
    '#tfp .layers{width:100%;height:auto;display:block}#tfp .numl{counter-reset:nl;display:grid;gap:10px}#tfp .numl .li i{background:var(--navy);font-style:normal;font-weight:800;font-size:13px}' +
    '#tfp .cmp{width:100%;border-collapse:separate;border-spacing:0;background:#fff;border:1px solid var(--line);border-radius:16px;overflow:hidden;font-size:15px}' +
    '#tfp .cmp th,#tfp .cmp td{padding:13px 14px;text-align:center;border-bottom:1px solid var(--line)}#tfp .cmp th:first-child,#tfp .cmp td:first-child{text-align:left;color:var(--muted);font-weight:600;width:26%}' +
    '#tfp .cmp thead th{background:var(--bg);font-size:13px;color:var(--navy)}#tfp .cmp thead th b{display:block;font-size:16px}#tfp .cmp .rec{background:#FFF4F2}#tfp .cmp thead .rec{background:var(--red);color:#fff}' +
    '#tfp .cmp tr:last-child td{border-bottom:0}#tfp .cmp .pr2{font-size:22px;font-weight:800;color:var(--navy)}#tfp .cmp .yes{color:var(--green);font-weight:800}' +
    '#tfp .lock{display:inline-flex;align-items:center;gap:8px;background:#FFF4F2;border:1px solid #FFD3CC;color:#B42318;font-weight:700;font-size:14px;border-radius:999px;padding:7px 14px;margin:0 0 16px}' +
    /* presenter mode */
    '#tfp .ptools{display:none}#tfp.pres .ptools{display:flex;gap:8px}#tfp .ptools button{border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:#fff;border-radius:999px;padding:8px 14px;font-weight:700;font-size:13px}' +
    '#tfp .notes{position:fixed;left:16px;bottom:78px;max-width:min(560px,calc(100vw - 32px));background:rgba(19,32,47,.95);color:#fff;border-radius:16px;padding:14px 18px 16px;font-size:16px;line-height:1.5;z-index:40;box-shadow:0 20px 50px rgba(0,0,0,.35);display:none}' +
    '#tfp .notes.on{display:block;animation:tfpup .25s ease both}#tfp .notes small{display:block;color:#ff8274;font-weight:800;letter-spacing:.12em;font-size:11px;margin-bottom:4px}' +
    '#tfp .menu{position:fixed;inset:0;background:rgba(10,16,24,.75);z-index:50;display:none;align-items:center;justify-content:center;padding:20px}#tfp .menu.on{display:flex}' +
    '#tfp .menu>div{background:#fff;border-radius:20px;padding:18px;max-width:760px;width:100%;display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px}' +
    '#tfp .menu button{text-align:left;border:1px solid var(--line);background:var(--bg);border-radius:12px;padding:12px 14px;font-weight:700;color:var(--navy)}#tfp .menu button span{display:block;font-size:11px;color:var(--muted);font-weight:800;letter-spacing:.1em}' +
    '#tfp .menu button.on{border-color:var(--red);background:#FFF4F2}' +
    /* bigger type when presenting */
    '#tfp.pres .s{max-width:1240px;padding:40px 32px}#tfp.pres h2{font-size:clamp(30px,3.3vw,50px)}#tfp.pres .lead{font-size:clamp(17px,1.5vw,22px)}#tfp.pres .li h3{font-size:clamp(16px,1.35vw,20px)}#tfp.pres .li p{font-size:clamp(14px,1.1vw,17px)}' +
    '#tfp.pres .stat b{font-size:clamp(34px,3.6vw,56px)}#tfp.pres .opt .pr{font-size:clamp(30px,3vw,46px)}#tfp.pres .cmp{font-size:clamp(14px,1.2vw,18px)}#tfp.pres .media{min-height:min(62vh,560px)}#tfp.pres .mag{height:min(64vh,560px)}' +
    '#tfp.pres .cover .s{min-height:100%;padding:40px 32px}#tfp.pres .cover.slide.on{display:flex;align-items:center}#tfp.pres .cover .media{min-height:min(66vh,600px)}' +
    '@media(max-width:860px){#tfp .split,#tfp .split.rev,#tfp .cover .s{grid-template-columns:1fr}#tfp .media{min-height:260px}#tfp .cover .media{min-height:280px;order:-1}#tfp .find{grid-template-columns:1fr}#tfp .mag{grid-template-columns:1fr;grid-template-rows:none;height:auto}#tfp .mag .card{height:220px}#tfp .mag .card:first-child{grid-row:auto;height:260px}#tfp .cmp th,#tfp .cmp td{padding:10px 8px;font-size:13px}}' +
    /* payments */
    '#tfp .paybar{max-width:980px;margin:16px auto 0;padding:0 16px}#tfp .paybar>div{border-radius:14px;padding:16px 18px;font-size:15px}#tfp .paybar .good{background:#E5F6EC;border:1px solid #BFE6CF;color:#145C34}#tfp .paybar .wait{background:#FFF7E6;border:1px solid #FDE3A7;color:#7A4B00}' +
    '#tfp .adl{display:flex;gap:12px;align-items:center;background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin-bottom:8px;font-size:15px;cursor:pointer}#tfp .adl input{width:20px;height:20px;accent-color:#FF5440;flex:none}#tfp .adl span{flex:1}#tfp .adl small{display:block;color:var(--muted);font-size:13px}#tfp .adl b{white-space:nowrap}' +
    '#tfp .cancelbox{border:2px solid var(--navy);border-radius:10px;padding:10px 12px;font-weight:800;font-size:14px;margin:10px 0 4px;color:var(--navy)}#tfp details.terms summary{cursor:pointer;font-weight:700;color:var(--navy)}#tfp .terms p{margin:6px 0}#tfp .terms dl{margin:8px 0 0}#tfp .terms dt{font-weight:700;color:var(--ink);margin-top:8px}#tfp .terms dd{margin:2px 0 0}' +
    '#tfp .inv{max-width:620px;margin:0 auto;padding:36px 16px 60px}#tfp .inv .sum .r.due{font-size:18px}#tfp .paid-ln{color:var(--green);font-weight:700}#tfp .secure{font-size:12px;color:var(--muted);text-align:center;margin-top:10px}' +
    /* present mode: one slide at a time */
    '#tfp.pres{height:100vh;height:100dvh;overflow:hidden;display:flex;flex-direction:column}#tfp.pres .deck{flex:1;position:relative;overflow:hidden}' +
    '#tfp.pres .slide{position:absolute;inset:0;overflow-y:auto;display:none;-webkit-overflow-scrolling:touch}#tfp.pres .slide.on{display:block;animation:tfpin .25s ease}' +
    '#tfp.pres .slide>.s{min-height:100%;display:flex;flex-direction:column;justify-content:center;border:0}#tfp.pres .hero.slide{display:none}#tfp.pres .hero.slide.on{display:flex;align-items:center}#tfp.pres .hero .s{width:100%}#tfp.pres .cover.slide{display:none}#tfp.pres .cover .s{width:100%}' +
    '#tfp.pres .foot{display:none}@keyframes tfpin{from{opacity:0;transform:translateX(18px)}to{opacity:1;transform:none}}' +
    '#tfp .nav{display:none}#tfp.pres .nav{display:flex;align-items:center;justify-content:space-between;gap:10px;background:#fff;border-top:1px solid var(--line);padding:10px 14px}' +
    '#tfp .nav button{border:0;border-radius:12px;padding:12px 18px;font-weight:800;font-size:15px;display:inline-flex;align-items:center;gap:6px}#tfp .nav .pv{background:var(--bg);color:var(--navy)}#tfp .nav .nx{background:var(--red);color:#fff}' +
    '#tfp .nav button svg{width:18px;height:18px}#tfp .nav button[disabled]{visibility:hidden}#tfp .dots{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}#tfp .dots i{width:8px;height:8px;border-radius:50%;background:#cfd6de}#tfp .dots i.on{background:var(--red);width:22px;border-radius:99px}' +
    '@media(max-width:860px){#tfp .stats{grid-template-columns:repeat(2,1fr)}#tfp .grid3,#tfp .opts{grid-template-columns:1fr}#tfp .tl{grid-template-columns:1fr}#tfp .revs{grid-template-columns:1fr}#tfp .opt{margin-top:8px}}' +
    '@media(max-width:600px){#tfp h1{font-size:30px}#tfp .hero h1{font-size:34px}#tfp h2{font-size:24px}#tfp .grid2,#tfp .list{grid-template-columns:1fr}#tfp .s{padding:34px 16px}#tfp .stat b{font-size:28px}#tfp .ph img{height:210px}#tfp .bar img{height:28px}#tfp .call span{display:none}}';

  /* ------------------------------------------------------------------ mount */
  var P = params(), ID = String(P.p || P.proposal || '').trim(), PRESENT = P.present === '1', INVOICE = P.pay === '1', CO = String(P.co || '').trim(), PAID = /^cs_[A-Za-z0-9_]+$/.test(P.paid || '') ? P.paid : '';
  var CALM = false; try { CALM = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var host = document.getElementById('tfp-host') || document.getElementById('tfq-host');
  var cur = document.currentScript;
  var root = document.createElement('div'); root.id = 'tfp';
  if (host) { host.innerHTML = ''; host.appendChild(root); }
  else if (cur && cur.parentNode && cur.parentNode !== document.head) cur.parentNode.insertBefore(root, cur);
  else document.body.appendChild(root);
  var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  if (!document.querySelector('link[href*="Montserrat"]')) {
    var fl = document.createElement('link'); fl.rel = 'stylesheet'; fl.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800&display=swap'; document.head.appendChild(fl);
  }
  if (PRESENT) root.className = 'pres';

  var D = null, S = { pick: 1, color: '', slide: 0 };
  function phoneHref() { return 'tel:+1' + COPY.phone.replace(/\D/g, ''); }
  function smsHref(body) { return 'sms:+1' + COPY.phone.replace(/\D/g, '') + '?&body=' + encodeURIComponent(body); }

  function showMsg(title, text) {
    root.innerHTML = bar() + '<div class="load"><h2>' + esc(title) + '</h2><p>' + text + '</p><p><a class="btn" href="' + phoneHref() + '">' + ICON.phone + 'Call ' + esc(COPY.phone) + '</a></p></div>';
  }
  function bar() {
    return '<div class="bar"><div class="bar-in"><img src="' + LOGO + '" alt="Team Forte"><a class="call" href="' + phoneHref() + '">' + ICON.phone + '<span>' + esc(COPY.phone) + '</span></a></div><div class="prog"><i id="tfp-prog"></i></div></div>';
  }

  if (!/^TF-[A-Z0-9]{3,12}$/.test(ID)) { showMsg('Proposal not found', 'This link looks incomplete. Please check the link we sent you, or give us a call.'); return; }
  root.innerHTML = bar() + '<div class="load"><div class="spin"></div>Loading your roof plan…</div>';

  jsonp(EXEC + '?r=pdata&id=' + encodeURIComponent(ID) + (PRESENT || P.v === '0' ? '&v=0' : ''), 30000).then(function (d) {
    if (!d || !d.ok) { showMsg('This proposal isn’t available', esc((d && d.error) || 'Please give us a call and we’ll sort it out.')); return; }
    D = d;
    S.pick = D.offers ? (D.pick >= 0 ? D.pick : 1) : D.pick;
    S.color = D.color || '';
    S.add = {};
    if (CO) buildCo(); else if (INVOICE && D.signed) buildInvoice(); else build();
    if (PAID) checkPaid();
  }).catch(function () { showMsg('We couldn’t load your proposal', 'Please check your connection and refresh the page, or give us a call.'); });

  /* ------------------------------------------------------------------ payments */
  function payBtn(kind, amount, label) {
    return '<button class="btn block" type="button" data-pay="' + kind + '">' + esc(label || ('Pay ' + money(amount, true) + ' now')) + '</button><p class="secure">Secure checkout by Stripe. Card or bank account.</p>';
  }
  function payNow(kind, btn) {
    var old = btn.innerHTML; btn.disabled = true; btn.textContent = 'Opening secure checkout…';
    fetch(EXEC + '?r=pay', { method: 'POST', body: JSON.stringify({ id: D.id, kind: kind }), headers: { 'Content-Type': 'text/plain;charset=utf-8' } })
      .then(function (r) { return r.text(); }).then(function (t) {
        var r; try { r = JSON.parse(t); } catch (e) { throw new Error('bad'); }
        if (!r.ok || !r.url) throw new Error(r.error || 'Payment isn’t available right now.');
        location.href = r.url;
      }).catch(function (e) {
        btn.disabled = false; btn.innerHTML = old;
        var m = document.createElement('div'); m.className = 'err'; m.textContent = (e && e.message && e.message !== 'bad' ? e.message : 'Couldn’t open checkout. Check your connection and try again, or call ' + COPY.phone + '.');
        btn.insertAdjacentElement('afterend', m); setTimeout(function () { if (m.parentNode) m.parentNode.removeChild(m); }, 8000);
      });
  }
  function checkPaid() {
    try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) {}
    showPayBar('wait', 'Confirming your payment…');
    jsonp(EXEC + '?r=paid&id=' + encodeURIComponent(ID) + '&session=' + encodeURIComponent(PAID), 30000).then(function (r) {
      if (!r || !r.ok) { showPayBar('wait', 'We couldn’t confirm your payment yet. If you were charged, you’ll get a receipt by email from Stripe, and we’ll confirm it shortly.'); return; }
      var kind = 'wait', msg;
      if (r.status === 'paid') { kind = 'good'; msg = '<b>Payment received. Thank you!</b> ' + money(r.amount, true) + ' was paid' + (r.balance > 0 ? '. Remaining balance: ' + money(r.balance, true) + '.' : '. Your account is paid in full.') + ' A receipt is on its way to your email.'; }
      else if (r.status === 'processing') msg = '<b>Thank you!</b> Your bank payment of ' + money(r.amount, true) + ' is processing. Bank payments take a few business days to clear, and we’ll confirm when it does.';
      else msg = 'Your payment wasn’t completed. You can try again below, or call us at ' + esc(COPY.phone) + '.';
      D.paid = r.paid; D.balance = r.balance; D.depositDue = r.depositDue; D.payments = r.payments || D.payments; if (r.status === 'paid') D.payReq = r.payReq || null;
      if (INVOICE && D.signed) buildInvoice(); else if (root.querySelector('#tfp-signbox')) renderSign();
      showPayBar(kind, msg);
      if (r.status === 'paid' && !CALM) confetti();
    }).catch(function () { showPayBar('wait', 'We couldn’t confirm your payment yet. If you were charged, you’ll get a receipt by email from Stripe.'); });
  }
  function showPayBar(kind, html) {
    var b = root.querySelector('.paybar'); if (!b) { b = document.createElement('div'); b.className = 'paybar'; var bar0 = root.querySelector('.bar'); if (bar0) bar0.insertAdjacentElement('afterend', b); else root.insertBefore(b, root.firstChild); }
    b.innerHTML = '<div class="' + kind + '">' + html + '</div>';
  }
  function buildInvoice() {
    var keepBar = root.querySelector('.paybar'), barHtml = keepBar ? keepBar.outerHTML : '';
    var due = D.payReq && D.payReq.amount > 0 ? Math.min(D.payReq.amount, D.balance) : D.balance;
    var label = D.payReq && D.payReq.label ? D.payReq.label : (D.depositDue > 0 ? 'Deposit' : 'Balance due');
    var p = PKGS[D.pick];
    var h = '<div class="inv"><p class="k">Invoice · ' + esc(D.id) + '</p><h1 style="font-size:32px">' + (due > 0 ? 'Amount due: ' + money(due, true) : 'Paid in full') + '</h1><p class="lead">' + esc(D.address) + '</p>' +
      '<div class="sum"><div class="r"><span>' + (D.type === 'repair' ? 'Roof repair' : esc(p ? p.name : 'New roof') + (D.color ? ', ' + esc(D.color) : '')) + '</span><span>' + money(D.price, true) + '</span></div>' +
      (D.changeOrders || []).filter(function (c) { return c.status === 'signed'; }).map(function (c) { return '<div class="r"><span>Change order ' + esc(c.id) + ': ' + esc(c.title) + '</span><span>' + money(c.total, true) + '</span></div>'; }).join('') +
      (D.payments || []).map(function (x) { return '<div class="r"><span class="paid-ln">Paid ' + esc(x.date) + (x.label ? ' · ' + esc(x.label) : '') + '</span><span class="paid-ln">−' + money(x.amount, true) + '</span></div>'; }).join('') +
      '<div class="r"><span>Balance</span><span class="tot">' + money(D.balance, true) + '</span></div></div>' +
      (due > 0 ? (D.stripe ? '<div class="sum"><div class="r due"><span><b>' + esc(label) + '</b></span><span class="tot">' + money(due, true) + '</span></div></div>' + payBtn('request', due, 'Pay ' + money(due, true) + ' now') :
        '<p class="m">To pay, call us at ' + esc(COPY.phone) + '.</p>') : '<div class="ok"><div class="okchk">' + ICON.check + '</div><b>Paid in full. Thank you!</b></div>') +
      (FIN && FIN.on && due >= 1000 ? '<p class="m" style="margin-top:14px">Prefer monthly payments? <a href="' + esc(FIN.applyUrl || smsHref('Hi Team Forte, I’d like to hear about financing for ' + D.id + '.')) + '">' + (FIN.applyUrl ? 'Check your financing options' : 'Ask us about financing') + '</a>.</p>' : '') +
      '<p class="m" style="margin-top:22px;text-align:center"><a href="#p=' + encodeURIComponent(D.id) + '" data-full="1">View your full roof plan</a> · Questions? <a href="' + esc(smsHref('Hi Team Forte, about invoice ' + D.id + ': ')) + '">Text us</a></p></div>' +
      '<div class="foot"><div class="s"><b>' + esc(D.company.legal || 'Team Forte') + '</b><br>' + esc([D.company.town, D.company.phone, D.company.email].filter(Boolean).join(' · ')) + (D.company.hic ? '<br>CT ' + esc(D.company.hic) : '') + '</div></div>';
    root.className = ''; root.innerHTML = bar() + barHtml + h;
    if (!S.wired) wire();
  }

  /* ------------------------------------------------------------------ their house: Street View + satellite */
  function loadMaps() {
    if (window.google && google.maps && google.maps.StreetViewService) return Promise.resolve();
    if (S.mapsP) return S.mapsP;
    if (!D.mapsKey || !(D.lat && D.lng)) return Promise.reject(new Error('nomap'));
    S.mapsP = new Promise(function (ok, bad) {
      var cb = '__tfpMaps' + Date.now(); window[cb] = function () { ok(); };
      var sc = document.createElement('script'); sc.async = true; sc.onerror = function () { bad(new Error('maps')); };
      sc.src = 'https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(D.mapsKey) + '&v=weekly&libraries=geometry&callback=' + cb;
      document.head.appendChild(sc); setTimeout(function () { bad(new Error('maps timeout')); }, 15000);
    });
    return S.mapsP;
  }
  function decodePoly(str) {
    var pts = [], i = 0, lat = 0, lng = 0; str = String(str || '');
    while (i < str.length) { var r = [0, 0]; for (var k = 0; k < 2; k++) { var sh = 0, res = 0, b; do { b = str.charCodeAt(i++) - 63; res |= (b & 31) << sh; sh += 5; } while (b >= 32 && i <= str.length); r[k] = (res & 1) ? ~(res >> 1) : (res >> 1); } lat += r[0]; lng += r[1]; pts.push({ lat: lat / 1e5, lng: lng / 1e5 }); }
    return pts;
  }
  var ROOF_COLORS = ['#FF5440', '#FDB022', '#38BDF8', '#A78BFA', '#34D399', '#F472B6'];
  function initCover() {
    var el = root.querySelector('#tfp-sv'); if (!el || el.__done) return; el.__done = true;
    loadMaps().then(function () {
      var house = new google.maps.LatLng(D.lat, D.lng);
      new google.maps.StreetViewService().getPanorama({ location: house, radius: 70, source: google.maps.StreetViewSource.OUTDOOR, preference: google.maps.StreetViewPreference.NEAREST }, function (data, st) {
        if (st === 'OK' && data && data.location) {
          var heading = google.maps.geometry.spherical.computeHeading(data.location.latLng, house);
          el.innerHTML = ''; var box = document.createElement('div'); box.className = 'mapbox'; el.appendChild(box);
          new google.maps.StreetViewPanorama(box, { pano: data.location.pano, pov: { heading: heading, pitch: 6 }, zoom: 0.6, disableDefaultUI: true, clickToGo: false, scrollwheel: false, linksControl: false, panControl: false, addressControl: false, motionTracking: false, showRoadLabels: false });
          el.insertAdjacentHTML('beforeend', '<span class="cap">Your home</span>');
        } else satellite(el, 20, false);
      });
    }).catch(function () { /* keep the photo */ });
  }
  function initRoofMap() {
    var el = root.querySelector('#tfp-map'); if (!el || el.__done) return; el.__done = true;
    loadMaps().then(function () { satellite(el, 20, true); }).catch(function () {});
  }
  function satellite(el, zoom, outlines) {
    el.innerHTML = ''; var box = document.createElement('div'); box.className = 'mapbox'; el.appendChild(box);
    var c = { lat: D.lat, lng: D.lng };
    var map = new google.maps.Map(box, { center: c, zoom: zoom, mapTypeId: 'satellite', tilt: 0, disableDefaultUI: true, gestureHandling: 'cooperative', keyboardShortcuts: false });
    var b = new google.maps.LatLngBounds(), any = false;
    if (outlines) D.roofs.forEach(function (r, i) {
      var rings = Array.isArray(r.o) ? r.o : (r.o ? [r.o] : []);
      rings.forEach(function (enc) { var path = decodePoly(enc); if (path.length < 3) return; path.forEach(function (p) { b.extend(p); any = true; });
        new google.maps.Polygon({ map: map, paths: path, strokeColor: ROOF_COLORS[i % 6], strokeWeight: 3, fillColor: ROOF_COLORS[i % 6], fillOpacity: 0.28, clickable: false }); });
    });
    if (any) { map.fitBounds(b, 40); google.maps.event.addListenerOnce(map, 'idle', function () { if (map.getZoom() > 21) map.setZoom(21); }); }
    else new google.maps.Marker({ map: map, position: c });
    el.insertAdjacentHTML('beforeend', '<span class="cap">' + (outlines ? (any ? 'Measured roof areas' : 'Your roof from above') : 'Your home from above') + '</span>');
  }
  function initMapsFor(sec) { if (sec === 'cover') initCover(); if (sec === 'today') initRoofMap(); }

  /* Layered roof illustration for "what's included" */
  function layersSvg() {
    var L = [['#C9A574', 'Wood deck'], ['#2B3440', 'Ice & water barrier'], ['#9FB2C4', 'Synthetic underlayment'], ['#B8BEC4', 'Drip edge & flashing'], ['#4A4F55', 'Owens Corning shingles'], ['#1F252B', 'Ridge vent & caps']];
    var h = '<svg class="layers" viewBox="0 0 620 400" role="img" aria-label="Layers of your new roof">';
    L.forEach(function (l, i) {
      var y = 330 - i * 46, x = 30 + i * 22, w = 300 - (i === 5 ? 170 : 0), xs = i === 5 ? x + 85 : x;
      h += '<g class="lay" style="animation-delay:' + (i * 0.12) + 's"><polygon points="' + [xs, y, xs + w, y, xs + w + 110, y - 70, xs + 110, y - 70].join(',') + '" fill="' + l[0] + '" stroke="#fff" stroke-width="2" opacity="0.97"/>' +
        (i === 4 ? '<path d="M' + (xs + 20) + ' ' + (y - 14) + ' h' + (w + 60) + ' M' + (xs + 38) + ' ' + (y - 32) + ' h' + (w + 60) + ' M' + (xs + 56) + ' ' + (y - 50) + ' h' + (w + 60) + '" stroke="#6B7178" stroke-width="2"/>' : '') +
        '<circle cx="' + (xs + w + 132) + '" cy="' + (y - 34) + '" r="15" fill="#FF5440"/><text x="' + (xs + w + 132) + '" y="' + (y - 29) + '" text-anchor="middle" font-size="15" font-weight="800" fill="#fff" font-family="Montserrat,Arial">' + (i + 1) + '</text></g>';
    });
    return h + '</svg>';
  }

  /* ------------------------------------------------------------------ presenter mode */
  function presenterTools() {
    if (!PRESENT) return;
    var bar0 = root.querySelector('.bar-in'); if (!bar0 || bar0.querySelector('.ptools')) return;
    bar0.insertAdjacentHTML('beforeend', '<div class="ptools"><button type="button" data-ui="menu">Slides</button><button type="button" data-ui="notes">Notes</button></div>');
    root.insertAdjacentHTML('beforeend', '<div class="notes" id="tfp-notes"></div><div class="menu" id="tfp-menu"><div></div></div>');
  }
  function syncPresenter() {
    if (!PRESENT) return;
    var n = root.querySelector('#tfp-notes'), sec = S.secs[S.slide];
    if (n) n.innerHTML = '<small>NOTES · ' + (S.slide + 1) + '/' + S.secs.length + '</small>' + esc(NOTES[sec] || 'Let them look, and ask what questions they have.');
    var m = root.querySelector('#tfp-menu>div');
    if (m) m.innerHTML = root.querySelectorAll('.slide').length ? Array.prototype.map.call(root.querySelectorAll('.slide'), function (sl, i) {
      return '<button type="button" data-goto="' + i + '"' + (i === S.slide ? ' class="on"' : '') + '><span>' + (i + 1) + '</span>' + esc(sl.getAttribute('data-t') || '') + '</button>'; }).join('') : '';
  }

  /* ------------------------------------------------------------------ animation */
  var RV_SEL = '.slide .k,.slide h2,.slide .lead,.stat,.roofs,.rlist,.card,.li,.tl li,.opt,.dep,.fin,.sw,.viz,.rate,.q,.faq details,.ask,.sum,.terms,.certs,.media,.cmp,.lock';
  function markRv(scope, done) {
    (scope || root).querySelectorAll(RV_SEL).forEach(function (el) { if (el.closest('.hero') || el.closest('.cover')) return; el.classList.add('rv'); if (done || CALM) el.classList.add('in'); });
  }
  function reveal(els) {
    var k = 0;
    els.forEach(function (el) {
      if (el.classList.contains('in')) return;
      el.style.transitionDelay = Math.min(k++, 12) * 65 + 'ms'; el.classList.add('in');
      el.querySelectorAll('[data-count]').forEach(countUp); if (el.hasAttribute('data-count')) countUp(el);
      setTimeout(function () { el.style.transitionDelay = ''; }, 1600);
    });
  }
  function countUp(el) {
    if (CALM || el.__counted) return; el.__counted = true;
    var fin = el.textContent, m = fin.match(/^(\$?)([\d,]+)(.*)$/); if (!m) return;
    var target = Number(m[2].replace(/,/g, '')), t0 = null, dur = 900;
    if (!(target > 9)) return;
    function step(ts) { if (!t0) t0 = ts; var x = Math.min(1, (ts - t0) / dur), e = 1 - Math.pow(1 - x, 3);
      el.textContent = m[1] + Math.round(target * e).toLocaleString('en-US') + m[3]; if (x < 1) requestAnimationFrame(step); else el.textContent = fin; }
    requestAnimationFrame(step);
  }
  function tagCounts(scope) { (scope || root).querySelectorAll('.stat b,.opt .pr').forEach(function (el) { el.setAttribute('data-count', '1'); }); }
  function watch() {
    if (CALM) return;
    if (!('IntersectionObserver' in window)) { reveal(root.querySelectorAll('.rv')); return; }
    var io = new IntersectionObserver(function (ents) {
      var batch = ents.filter(function (e) { return e.isIntersecting; }).map(function (e) { io.unobserve(e.target); return e.target; });
      if (batch.length) reveal(batch);
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    root.querySelectorAll('.rv:not(.in)').forEach(function (el) { io.observe(el); });
  }
  function confetti() {
    try {
      var cv = document.createElement('canvas'), W = innerWidth, H = innerHeight, d = window.devicePixelRatio || 1;
      cv.width = W * d; cv.height = H * d; cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:99999';
      document.body.appendChild(cv); var cx = cv.getContext('2d'); cx.scale(d, d);
      var cols = ['#FF5440', '#13202F', '#FDB022', '#16A34A', '#ffffff'], ps = [];
      for (var i = 0; i < 140; i++) ps.push({ x: W / 2 + (Math.random() - 0.5) * 120, y: H * 0.35, vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 13 - 4, r: Math.random() * 6 + 4, c: cols[i % cols.length], a: Math.random() * 6, va: (Math.random() - 0.5) * 0.4 });
      var t0 = performance.now();
      (function fr(t) {
        var el = t - t0; cx.clearRect(0, 0, W, H);
        ps.forEach(function (p) { p.vy += 0.38; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.a += p.va; cx.save(); cx.translate(p.x, p.y); cx.rotate(p.a); cx.globalAlpha = Math.max(0, 1 - el / 2200); cx.fillStyle = p.c; cx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); cx.restore(); });
        if (el < 2200) requestAnimationFrame(fr); else cv.parentNode && cv.parentNode.removeChild(cv);
      })(t0);
    } catch (e) {}
  }

  /* ------------------------------------------------------------------ build */
  function price(i) { return D.offers ? Number(D.offers[i]) || 0 : D.price; }
  function chosenPrice() { return D.type === 'repair' ? D.price : (D.offers ? price(S.pick) : D.price); }
  var FIN = window.TFP_FINANCE || COPY.finance;
  function monthly(p, apr, n) { var r = (Number(apr) || 0) / 1200; n = Number(n) || 0; if (!(p > 0) || !(n > 0)) return 0; return r ? p * r / (1 - Math.pow(1 + r, -n)) : p / n; }
  function amortPlan() { return (FIN.plans || []).filter(function (x) { return x.months > 0 && x.apr != null; }).sort(function (a, b) { return b.months - a.months; })[0]; }
  function planLabel(x) { return x.label || ((Number(x.apr) === 0 ? '0% APR' : x.apr + '% APR') + ' for ' + x.months + ' months'); }
  function financeAnswer() {
    if (FIN.lender) return 'Yes. We offer financing through ' + FIN.lender + ', on approved credit.' + ((FIN.plans || []).length ? ' Plans include ' + FIN.plans.map(planLabel).join(', ') + '.' : '') + (FIN.applyUrl ? ' You can check your options online in a few minutes with the button on the price page.' : ' Ask us and we’ll walk you through it.');
    return 'Yes. Ask us about monthly payment options for your roof and we’ll walk you through them.';
  }
  function financeBox() {
    if (!FIN || !FIN.on || (D.type === 'repair' && !(D.price >= 1000))) return '';
    var pr = chosenPrice(), pl = amortPlan(), mo = pl ? monthly(pr, pl.apr, pl.months) : 0;
    var h = '<div class="fin"><div><p class="k" style="margin:0 0 4px">Prefer monthly payments?</p>';
    if (mo > 0) h += '<div class="fin-mo">About <b>' + money(Math.ceil(mo)) + '/mo</b>*</div><div class="m">for the ' + (D.type === 'repair' ? 'repair' : esc((PKGS[S.pick] || {}).label || '') + ' option') + '</div>';
    else h += '<h3 style="margin:0">Financing is available</h3><div class="m">' + (FIN.lender ? 'Through ' + esc(FIN.lender) + ', on approved credit.' : 'Ask us about monthly payment options for your roof.') + '</div>';
    h += '</div><div class="fin-act">' + (FIN.applyUrl ? '<a class="btn" href="' + esc(FIN.applyUrl) + '" target="_blank" rel="noopener">Check my options</a>' :
      '<a class="btn ghost" href="' + esc(smsHref('Hi Team Forte, I’d like to hear about financing for proposal ' + D.id + '.')) + '">' + ICON.chat + 'Ask about financing</a>') + '</div>';
    if (mo > 0) h += '<p class="fine" style="flex-basis:100%;margin:0">*Estimate only, based on ' + esc(planLabel(pl)) + ' on the full price, on approved credit through ' + esc(FIN.lender || 'our lender') + '. Not a loan offer; your rate, term and payment depend on your application.' + (FIN.plans.length > 1 ? ' Other plans: ' + FIN.plans.filter(function (x) { return x !== pl; }).map(planLabel).join(', ') + '.' : '') + '</p>';
    return h + '</div>';
  }
  function depositText(p) { return D.depositPct > 0 ? money(Math.round(p * D.depositPct) / 100, true) : ''; }

  function build() {
    var secs = [], first = esc(D.first || '');
    var hero = D.insp.length ? D.insp[0].id : (D.jobs.length ? D.jobs[0].cover : '');
    var house = D.mapsKey && D.lat && D.lng;
    /* 1. cover: their house */
    secs.push(['cover', '<section class="cover slide" data-t="Welcome"><div class="s"><div>' +
      '<p class="k">' + (D.type === 'repair' ? 'Your repair plan' : 'Your roof plan') + '</p><h1>' + (first ? 'Prepared for ' + first : 'Your Team Forte proposal') + '</h1>' +
      '<p class="lead">' + esc(D.address) + '</p>' +
      '<div class="chips"><span class="chip">' + esc(D.date) + '</span><span class="chip">Proposal ' + esc(D.id) + '</span><span class="chip">Registered & insured' + (D.company.hic ? ' · CT ' + esc(D.company.hic) : '') + '</span></div>' +
      (PRESENT ? '' : '<p style="margin-top:26px"><a class="btn" href="#tfp-sign" data-go="sign">' + (D.signed ? 'See your signed proposal' : 'Skip to my price') + '</a></p>') + '</div>' +
      '<div class="media" id="' + (house ? 'tfp-sv' : 'tfp-hero') + '">' + (hero ? img(hero, 1600, '') : '') + '</div></div></section>']);
    /* 2. roof today: satellite + stats */
    if (D.type !== 'repair' && D.roofs.length) {
      var area = D.roofs.reduce(function (n, r) { return n + (Number(r.s) || 0); }, 0);
      var problems = {}; D.insp.forEach(function (x) { if (x.tag && x.tag !== 'Other') problems[x.tag] = 1; });
      var np = Object.keys(problems).length;
      var tiles = [[area.toLocaleString('en-US'), 'sq ft of roof'], [String(Math.ceil(area / 100 * 1.1)), 'squares to install (with waste)'],
        [esc(D.roofs[0].p || '–'), 'main roof pitch'], [String(D.layers || 1), (D.layers > 1 ? 'layers' : 'layer') + ' to tear off']];
      if (np) tiles[1] = [String(np), np === 1 ? 'problem found' : 'problems found'];
      var statsHtml = '<div class="stats two">' + tiles.map(function (t) { return '<div class="stat"><b>' + t[0] + '</b><span>' + t[1] + '</span></div>'; }).join('') + '</div>' +
        '<div class="rlist">' + D.roofs.map(function (r, k) { return '<div><span><i style="background:' + ROOF_COLORS[k % 6] + '"></i><b>' + esc(r.n) + '</b></span><span>' + Number(r.s).toLocaleString('en-US') + ' sq ft' + (r.p ? ' · ' + esc(r.p) : '') + '</span></div>'; }).join('') + '</div>';
      secs.push(['today', '<section class="slide" data-t="Your roof"><div class="s"><p class="k">Your roof today</p><h2>What we measured</h2>' +
        (house ? '<div class="split"><div class="media" id="tfp-map"></div><div>' + statsHtml + '</div></div>' : statsHtml) + '</div></section>']);
    }
    /* 3. what we found + what happens if you wait */
    if (D.insp.length) {
      var shown = D.insp.slice(0, 8);
      secs.push(['found', '<section class="slide" data-t="What we found"><div class="s"><p class="k">From your inspection</p><h2>What we found on your roof</h2>' +
        '<p class="lead">' + D.insp.length + ' photo' + (D.insp.length > 1 ? 's' : '') + ' from our visit, what they mean, and what happens if they’re left alone.</p><div class="find">' +
        shown.map(function (x) {
          var info = TAG_INFO[x.tag] || '', wait = WAIT_INFO[x.tag] || '';
          var body = (x.tag && x.tag !== 'Other' ? '<span class="tag">' + esc(x.tag) + '</span>' : '') + (x.note ? '<p class="note">' + esc(x.note) + '</p>' : '') + (info ? '<p class="why">' + esc(info) + '</p>' : '') +
            (wait ? '<p class="wait"><b>If you wait:</b> ' + esc(wait) + '</p>' : '');
          return '<div class="card ph">' + img(x.id, 1000, x.tag) + (body ? '<div class="in">' + body + '</div>' : '') + '</div>';
        }).join('') + '</div>' + (D.insp.length > shown.length ? '<p class="m" style="margin-top:12px">+ ' + (D.insp.length - shown.length) + ' more photos in your inspection report.</p>' : '') + '</div></section>']);
    }
    /* 4. recent work: magazine layout */
    if (D.jobs.length) {
      var js = D.jobs.slice(0, 3);
      secs.push(['work', '<section class="slide" data-t="Our work"><div class="s"><p class="k">Our work</p><h2>Recent Team Forte roofs</h2><p class="lead">Real jobs by our crews, start to finish.</p>' +
        '<div class="' + (js.length === 3 ? 'mag' : 'grid' + Math.max(2, js.length)) + '">' +
        js.map(function (j) { return '<div class="card job">' + img(j.cover, 1200, j.title) + '<div class="in"><h3>' + esc(j.title) + '</h3><div class="m">' + esc([j.town, j.date].filter(Boolean).join(' · ')) + '</div></div></div>'; }).join('') +
        '</div></div></section>']);
    }
    /* 5. why us + reviews */
    secs.push(['why', '<section class="slide" data-t="Why Team Forte"><div class="s"><p class="k">Why Team Forte</p><h2>Why Connecticut homeowners choose us</h2>' +
      '<div class="split"><div class="list" style="grid-template-columns:1fr">' + COPY.why.map(function (w) { return '<div class="li"><i>' + ICON.check + '</i><div><h3>' + esc(w[0]) + '</h3><p>' + esc(w[1]) + '</p></div></div>'; }).join('') +
      (COPY.certs.length ? '<div class="certs">' + COPY.certs.map(function (c) { return '<span>' + esc(c) + '</span>'; }).join('') + '</div>' : '') + '</div>' +
      '<div><div class="rate"><div class="st">' + ICON.star + ICON.star + ICON.star + ICON.star + ICON.star + '</div>' + COPY.reviews.summary.map(function (x, i) { return i ? '<div>' + esc(x) + '</div>' : '<div><b>' + esc(x) + '</b></div>'; }).join('') +
      '<div style="margin-top:10px"><a href="' + esc(COPY.reviews.link) + '" target="_blank" rel="noopener" style="color:#fff">Read the reviews ↗</a></div></div>' +
      '<div class="qs" style="margin-top:12px">' + COPY.reviews.quotes.map(function (r) { return '<div class="q">“' + esc(r.text) + '”<small>' + esc(r.who) + ' · ' + esc(r.job) + ' · Thumbtack</small></div>'; }).join('') + '</div></div></div></div></section>']);
    /* 6. what's included: layered roof */
    if (D.type !== 'repair') {
      secs.push(['system', '<section class="slide" data-t="What’s included"><div class="s"><p class="k">What’s included</p><h2>A complete roof system, not just shingles</h2>' +
        '<p class="lead">When quotes differ, this is usually why. Everything below is included in your price, in writing.</p>' +
        '<div class="split sys"><div>' + layersSvg() + '</div><div><div class="list numl" style="grid-template-columns:1fr">' +
        [0, 1, 2, 5, 3, 4].map(function (k, n) { var w = COPY.system[k]; return w ? '<div class="li"><i>' + (n + 1) + '</i><div><h3>' + esc(w[0]) + '</h3><p>' + esc(w[1]) + '</p></div></div>' : ''; }).join('') + '</div>' +
        '<div class="plus">' + COPY.system.slice(6).map(function (w) { return '<span title="' + esc(w[1]) + '">' + ICON.check + esc(w[0]) + '</span>'; }).join('') + '</div></div></div></div></section>']);
    }
    /* 7. compare the options */
    if (D.offers) {
      secs.push(['compare', '<section class="slide" data-t="Compare options"><div class="s" id="tfp-compare"></div></section>']);
    }
    /* 8. options / price */
    secs.push(['price', '<section class="slide" data-t="Your investment"><div class="s" id="tfp-price"></div></section>']);
    /* 9. color */
    if (D.type !== 'repair') secs.push(['color', '<section class="slide" data-t="Your color"><div class="s" id="tfp-color"></div></section>']);
    /* 10. timeline */
    secs.push(['steps', '<section class="slide" data-t="What happens next"><div class="s"><p class="k">What happens next</p><h2>From yes to done</h2><ol class="tl">' +
      COPY.steps.map(function (w) { return '<li><h3>' + esc(w[0]) + '</h3><p>' + esc(w[1]) + '</p></li>'; }).join('') + '</ol></div></section>']);
    /* 11. questions */
    var dep = D.depositPct > 0 ? 'A ' + D.depositPct + '% deposit holds your spot on the schedule. The balance is due when the job is done.' : 'Nothing until the job is scheduled. We’ll go over payment when you sign.';
    secs.push(['faq', '<section class="slide" data-t="Questions"><div class="s faq"><p class="k">Questions</p><h2>What homeowners ask us</h2>' +
      COPY.faq.filter(function (f) { return f[1] !== '__FINANCE__' || (FIN && FIN.on); }).map(function (f, i) { return '<details' + (i === 0 ? ' open' : '') + '><summary>' + esc(f[0]) + '</summary><p>' + esc(f[1] === '__DEPOSIT__' ? dep : f[1] === '__FINANCE__' ? financeAnswer() : f[1]) + '</p></details>'; }).join('') +
      '<p class="m" style="margin-top:16px">Something else on your mind?</p><div class="ask"><a class="btn ghost" href="' + esc(smsHref('Hi Team Forte, I have a question about proposal ' + D.id + ': ')) + '">' + ICON.chat + 'Text us a question</a><a class="btn ghost" href="' + phoneHref() + '">' + ICON.phone + 'Call ' + esc(COPY.phone) + '</a></div></div></section>']);
    /* 12. sign */
    secs.push(['sign', '<section class="slide" id="tfp-sign" data-t="Accept & sign"><div class="s" id="tfp-signbox"></div></section>']);

    S.secs = secs.map(function (x) { return x[0]; });
    root.innerHTML = bar() + '<div class="deck">' + secs.map(function (x) { return x[1]; }).join('') + '</div>' +
      '<div class="nav"><button class="pv" type="button">' + ICON.left + 'Back</button><div class="dots">' + secs.map(function () { return '<i></i>'; }).join('') + '</div><button class="nx" type="button">Next' + ICON.right + '</button></div>' +
      '<div class="foot"><div class="s"><b>' + esc(D.company.legal || 'Team Forte') + '</b><br>' + esc([D.company.town, D.company.phone, D.company.email].filter(Boolean).join(' · ')) + (D.company.hic ? '<br>CT ' + esc(D.company.hic) : '') +
      '<br><span style="font-size:11px">*Warranty and wind ratings per Owens Corning’s terms and installation requirements.</span></div></div>';
    renderCompare(); renderPrice(); if (D.type !== 'repair') renderColor(); renderSign();
    presenterTools();
    tagCounts(); markRv(); wire(); S.built = true;
    if (PRESENT) go(0); else { watch(); initCover(); initRoofMap(); }
  }

  function lockLine() { return D.validUntil && !D.signed ? '<div class="lock">🔒 Your price is locked until ' + esc(D.validUntil) + '</div>' : ''; }
  function renderCompare() {
    var box = root.querySelector('#tfp-compare'); if (!box) return;
    var rec = D.pick >= 0 ? D.pick : 1, idx = [0, 1, 2].filter(function (i) { return price(i) > 0; });
    var pl = amortPlan();
    var rows = [['Shingle', function (p) { return esc(p.name.replace('Owens Corning® ', '')); }], ['Wind rating', function (p) { return esc(p.cmp.wind); }], ['Impact rating', function (p) { return esc(p.cmp.impact); }],
      ['Color', function (p) { return esc(p.cmp.look); }], ['Cold weather', function (p) { return esc(p.cmp.cold); }], ['Shingle warranty', function () { return 'Limited Lifetime*'; }],
      ['Full system, permit & cleanup', function () { return '<span class="yes">✓</span>'; }], ['Best for', function (p) { return esc(p.cmp.best); }]];
    var h = '<p class="k">Compare</p><h2>Your three options side by side</h2><p class="lead">Same crew, same full roof system, same cleanup. Here is what changes.</p><p class="swipe">Swipe the table to see all three →</p><div class="cmpw"><table class="cmp"><thead><tr><th></th>' +
      idx.map(function (i) { return '<th' + (i === rec ? ' class="rec"' : '') + '>' + esc(PKGS[i].label) + (i === rec ? ' · Recommended' : '') + '<b>' + esc(PKGS[i].name.replace('Owens Corning® ', '')) + '</b></th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function (r) { return '<tr><td>' + r[0] + '</td>' + idx.map(function (i) { return '<td' + (i === rec ? ' class="rec"' : '') + '>' + r[1](PKGS[i]) + '</td>'; }).join('') + '</tr>'; }).join('') +
      '<tr><td>Price</td>' + idx.map(function (i) { return '<td' + (i === rec ? ' class="rec"' : '') + '><span class="pr2">' + money(price(i)) + '</span></td>'; }).join('') + '</tr>' +
      (pl ? '<tr><td>Monthly, about*</td>' + idx.map(function (i) { return '<td' + (i === rec ? ' class="rec"' : '') + '>' + money(Math.ceil(monthly(price(i), pl.apr, pl.months))) + '/mo</td>'; }).join('') + '</tr>' : '') +
      '</tbody></table></div>';
    box.innerHTML = h;
  }

  function renderPrice() {
    var box = root.querySelector('#tfp-price'), h;
    if (D.type === 'repair') {
      h = '<p class="k">Your investment</p><h2>Your repair</h2><div class="sum">' + D.items.map(function (it) {
        return '<div class="r"><span>' + esc(it.name) + (it.qty > 1 ? ' × ' + it.qty : '') + '</span><span>' + money(it.qty * it.price, true) + '</span></div>';
      }).join('') + '<div class="r"><span><b>Total</b></span><span class="tot">' + money(D.signed && D.basePrice ? D.basePrice : D.price, true) + '</span></div></div>' +
        (D.depositPct > 0 ? '<div class="dep">' + D.depositPct + '% deposit (' + depositText(D.price) + ') to schedule · balance when the job is done</div>' : '');
    } else if (D.offers) {
      var rec = D.pick >= 0 ? D.pick : 1;
      h = '<p class="k">Your investment</p><h2>Three ways to do this roof</h2>' + lockLine() + '<p class="lead">Same crew, same full system and cleanup. The difference is the shingle. Tap the one you want.</p><div class="opts">' +
        PKGS.map(function (p, i) {
          if (!(price(i) > 0)) return '';
          return '<div class="opt' + (i === S.pick ? ' on' : '') + '" data-pk="' + i + '"><span class="rib' + (i === rec ? ' rec' : '') + '">' + (i === rec ? 'Recommended' : esc(p.ribbon)) + '</span>' +
            '<span class="lv">' + esc(p.label) + '</span><h3>' + esc(p.name) + '</h3><div class="pr">' + money(price(i)) + '</div><div class="m">' + esc(p.desc) + '</div>' +
            '<ul>' + p.specs.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
            (D.signed ? '' : '<button class="pick" type="button" data-pk="' + i + '">' + (i === S.pick ? '✓ Selected' : 'Choose ' + esc(p.label)) + '</button>') + '</div>';
        }).join('') + '</div>' +
        (D.depositPct > 0 ? '<div class="dep">' + D.depositPct + '% deposit holds your install date. Balance when the job is done. Price includes permit, tear-off, disposal and cleanup.</div>' : '');
    } else {
      var p = PKGS[D.pick] || PKGS[1];
      h = '<p class="k">Your investment</p><h2>Your new roof</h2><div class="opts" style="grid-template-columns:minmax(0,460px)"><div class="opt on"><span class="rib rec">Your roof</span><span class="lv">' + esc(p.label) + '</span><h3>' + esc(p.name) + '</h3>' +
        '<div class="pr">' + money(D.signed && D.basePrice ? D.basePrice : D.price) + '</div><div class="m">' + esc(p.desc) + '</div><ul>' + p.specs.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div></div>' +
        (D.depositPct > 0 ? '<div class="dep">' + D.depositPct + '% deposit holds your install date. Balance when the job is done.</div>' : '');
    }
    box.innerHTML = h + financeBox();
    if (S.built) { markRv(box, true); var on = box.querySelector('.opt.on'); if (on && !CALM) { on.classList.add('pop'); } }
  }

  function renderColor() {
    var box = root.querySelector('#tfp-color'), p = PKGS[S.pick] || PKGS[1];
    if (S.color && p.colors.indexOf(S.color) < 0) { var hit = p.colors.filter(function (c) { return c.toLowerCase() === S.color.toLowerCase(); })[0]; if (hit) S.color = hit; }
    box.innerHTML = '<p class="k">Your color</p><h2>' + (D.signed ? 'Your color' : 'Pick your color') + '</h2><p class="lead">' + esc(p.name) + ' colors. Swatches are drawn to give you the idea; we bring real samples to confirm before we order.</p>' +
      '<div class="sws">' + p.colors.map(function (c) { return '<button type="button" class="sw' + (c === S.color ? ' on' : '') + '" data-cl="' + esc(c) + '"' + (D.signed ? ' disabled' : '') + '><img alt="" data-swatch="' + esc(c) + '"><span>' + esc(c) + '</span></button>'; }).join('') + '</div>' +
      '<p class="viz"><a href="https://www.owenscorning.com/en-us/roofing/design-eyeq" target="_blank" rel="noopener">See these colors on a house with Owens Corning’s visualizer ↗</a></p>' +
      (S.color ? '' : '<p class="m">Not sure yet? You can sign now and pick the color with us later.</p>');
    if (S.built) markRv(box, true);
    var imgs = box.querySelectorAll('img[data-swatch]'), k = 0;
    (function next() { if (k >= imgs.length) return; var el = imgs[k++]; el.src = swatch(el.getAttribute('data-swatch'), 180, 100); setTimeout(next, 0); })();
  }

  function pickedAdds() { return D.signed ? (D.chosen || []) : (D.addons || []).filter(function (a) { return S.add[a.key]; }); }
  function grandTotal() { var base = D.signed ? (D.basePrice || D.price) : chosenPrice(); return D.signed ? D.price : base + pickedAdds().reduce(function (n, a) { return n + (Number(a.total) || 0); }, 0); }
  function sumHtml() {
    var p = PKGS[S.pick], base = D.signed ? (D.basePrice || D.price) : chosenPrice(), adds = pickedAdds(), tot = grandTotal();
    return '<div class="sum" id="tfp-sum">' + (D.type === 'repair' ? '<div class="r"><span>Repair</span><span>' + D.items.length + ' item' + (D.items.length > 1 ? 's' : '') + '</span></div>' :
      '<div class="r"><span>Roof</span><span><b>' + esc(p ? p.name : '') + '</b></span></div><div class="r"><span>Color</span><span>' + (S.color ? esc(S.color) : '<span class="m">Choose later</span>') + '</span></div>') +
      (adds.length ? '<div class="r"><span>' + (D.type === 'repair' ? 'Repair' : 'Roof') + ' price</span><span>' + money(base, true) + '</span></div>' + adds.map(function (a) { return '<div class="r"><span>+ ' + esc(a.name) + '</span><span>' + money(a.total, true) + '</span></div>'; }).join('') : '') +
      '<div class="r"><span>' + (adds.length ? 'Total' : 'Price') + '</span><span class="tot">' + money(tot, true) + '</span></div>' +
      (D.depositPct > 0 ? '<div class="r"><span>Deposit to schedule (' + D.depositPct + '%)</span><span>' + depositText(tot) + '</span></div>' : '') + '</div>';
  }
  function addsHtml() {
    if (D.signed || !(D.addons || []).length) return '';
    return '<p class="k" style="margin-top:6px">Add to your project <span class="m" style="text-transform:none;letter-spacing:0;font-weight:500">· optional</span></p>' + D.addons.map(function (a) {
      return '<label class="adl"><input type="checkbox" data-add="' + esc(a.key) + '"' + (S.add[a.key] ? ' checked' : '') + '><span>' + esc(a.name) + '<small>' + esc(String(a.qty)) + ' ' + esc(a.unit) + (a.qty > 1 ? ' × ' + money(a.price, true) : '') + '</small></span><b>+' + money(a.total) + '</b></label>';
    }).join('');
  }
  /* the contract lines that change with the customer's choices on this page */
  function liveMaterials() {
    var c = D.contract || {}, p = PKGS[S.pick];
    if (D.type === 'repair' || !p) return c.materials || '';
    return 'Owens Corning ' + p.label + ' shingles' + (S.color ? ' in ' + S.color : ' (color chosen with you before materials are ordered)') + ', with the Owens Corning underlayment, starter, ice & water barrier, hip & ridge and ventilation listed in the scope.';
  }
  function livePayment() {
    var t = grandTotal(), dep = D.depositPct > 0 ? Math.round(t * D.depositPct) / 100 : 0;
    if (!(dep > 0)) return 'Full price of ' + money(t, true) + ' due when the job is done.';
    return 'Deposit of ' + money(dep, true) + ' (' + D.depositPct + '%) at signing. It is refunded in full if you cancel within the cancellation period, and is non-refundable after that. Balance of ' + money(t - dep, true) + ' due when the job is done.';
  }
  function contractHtml() {
    var c = D.contract; if (!c) return '';
    var dl = [['Contractor', c.contractor + ' · CT HIC ' + c.hic + '<br>' + c.mailing + ' · ' + c.phone], ['Start date', c.start], ['Completion date', c.end + ' (weather permitting)'], ['Materials', liveMaterials()], ['Payment', livePayment()]];
    if (c.decking) dl.push(['Roof decking', c.decking]);
    dl.push(['Cleanup', c.cleanup], ['Permit', c.permit], ['Changes', c.changes + ' ' + c.whole]);
    return '<details class="terms"><summary>Contract details</summary><dl>' + dl.map(function (r) { return '<dt>' + esc(r[0]) + '</dt><dd' + (r[0] === 'Payment' ? ' id="tfp-cpay"' : r[0] === 'Materials' ? ' id="tfp-cmat"' : '') + '>' + (r[0] === 'Contractor' ? r[1].split('<br>').map(esc).join('<br>') : esc(r[1])) + '</dd>'; }).join('') + '</dl></details>' +
      '<details class="terms"><summary>Notice of cancellation</summary><p>You may cancel this transaction, without any penalty or obligation, within three business days from the date you sign. If you cancel, any payments you made will be returned within ten business days after we receive your cancellation notice.</p>' +
      '<p>To cancel, mail or deliver a signed and dated cancellation notice, or any other written notice, to ' + esc(c.contractor) + ', ' + esc(c.mailing) + (c.email ? ', or email ' + esc(c.email) : '') + ', no later than midnight of the third business day after you sign. Your signed copy includes two cancellation forms and the exact date.</p></details>';
  }
  function renderSign() {
    var box = root.querySelector('#tfp-signbox'), pr = grandTotal(), p = PKGS[S.pick];
    var sum = sumHtml();
    if (D.signed) {
      var payPart = '';
      if (D.stripe && D.depositDue > 0) payPart = '<div style="margin-top:14px">' + payBtn('deposit', D.depositDue, 'Pay the ' + money(D.depositDue, true) + ' deposit now') + '</div>';
      else if (D.stripe && D.paid > 0) payPart = '<p style="margin:10px 0 0"><b>✓ ' + money(D.paid, true) + ' received.</b>' + (D.balance > 0 ? ' Balance of ' + money(D.balance, true) + ' is due when the job is done.' : ' Paid in full.') + '</p>';
      else if (D.depositLink) payPart = '<br><a class="btn" href="' + esc(D.depositLink) + '" target="_top">Pay the ' + depositText(pr) + ' deposit</a>';
      box.innerHTML = '<p class="k">Signed</p><h2>Thank you, ' + esc(D.signed.name) + '!</h2>' + sum +
        '<div class="ok"><div class="okchk">' + ICON.check + '</div><b>Signed on ' + esc(D.signed.date) + '.</b> We’ll call you to schedule.' + payPart + '</div>' +
        (D.cancelBy ? '<p class="m" style="margin-top:12px">You can cancel until midnight of ' + esc(D.cancelBy) + '. The cancellation form is in your signed copy.</p>' : '');
      if (S.built) markRv(box, true);
      return;
    }
    box.innerHTML = '<p class="k">Ready when you are</p><h2>Accept & sign</h2>' + lockLine() + addsHtml() + sum +
      (D.terms ? '<div class="terms"><b>Terms.</b> ' + esc(D.terms) + '</div>' : '') + contractHtml() +
      '<label class="f" for="tfp-nm">Your full name</label><input class="inp" id="tfp-nm" autocomplete="name" value="' + esc(D.name || '') + '">' +
      '<div class="row"><label class="f">Sign below</label><button class="lnk" id="tfp-clr" type="button">Clear</button></div><canvas class="sig" id="tfp-cv" aria-label="Signature pad"></canvas>' +
      (D.contract ? '<div class="cancelbox">' + esc(D.contract.cancelLine) + '</div>' : '') +
      '<label class="ck"><input type="checkbox" id="tfp-ag"><span>I accept this proposal and contract, and I’m authorized to approve work at this address.</span></label>' +
      (FIN && FIN.on && D.type !== 'repair' ? '<p class="m" style="margin:0 0 10px">Planning to use financing? You can still sign now to hold your spot, and we’ll help you with the application.</p>' : '') +
      '<button class="btn block" id="tfp-go" type="button">Accept & sign</button><div class="err" id="tfp-er"></div><div id="tfp-done"></div>' +
      '<p class="m" style="margin-top:14px;text-align:center">Not ready? <a href="' + esc(smsHref('Hi Team Forte, about proposal ' + D.id + ': ')) + '">Text us</a> or call ' + esc(COPY.phone) + '.</p>';
    sigPad();
    box.querySelectorAll('[data-add]').forEach(function (cb) { cb.onchange = function () { S.add[cb.getAttribute('data-add')] = cb.checked; var s0 = box.querySelector('#tfp-sum'); if (s0) s0.outerHTML = sumHtml(); var cp = box.querySelector('#tfp-cpay'); if (cp) cp.textContent = livePayment(); }; });
    if (S.built) markRv(box, true);
  }

  function footHtml() {
    return '<div class="foot"><div class="s"><b>' + esc(D.company.legal || 'Team Forte') + '</b><br>' + esc([D.company.town, D.company.phone, D.company.email].filter(Boolean).join(' · ')) + (D.company.hic ? '<br>CT ' + esc(D.company.hic) : '') + '</div></div>';
  }
  /* A change order to sign: #p=TF-XXXXX&co=CO1 */
  function buildCo() {
    var co = (D.changeOrders || []).filter(function (c) { return c.id === CO; })[0];
    if (!co) { showMsg('This change order isn’t available', 'It may have been updated or replaced. Please check the newest link we sent you, or give us a call.'); return; }
    var signed = co.status === 'signed', newTotal = D.jobTotal + (signed ? 0 : co.total);
    var h = '<div class="inv"><p class="k">Change order ' + esc(co.id) + ' · Proposal ' + esc(D.id) + '</p><h1 style="font-size:30px">' + esc(co.title) + '</h1><p class="lead">' + esc(D.address) + '</p>' +
      '<div class="sum">' + co.items.map(function (it) { return '<div class="r"><span>' + esc(it.name) + '<br><span class="m">' + esc(String(it.qty)) + ' ' + esc(it.unit) + ' × ' + money(it.price, true) + '</span></span><span>' + money(it.qty * it.price, true) + '</span></div>'; }).join('') +
      '<div class="r"><span><b>Change order total</b></span><span class="tot">' + money(co.total, true) + '</span></div></div>' +
      (co.note ? '<div class="terms">' + esc(co.note) + '</div>' : '') +
      '<div class="sum"><div class="r"><span>Your contract price</span><span>' + money(D.price, true) + '</span></div><div class="r"><span>New job total' + (signed ? '' : ' when you approve') + '</span><span><b>' + money(newTotal, true) + '</b></span></div></div>' +
      '<div class="terms">This change order amends the contract you signed' + (D.signed ? ' on ' + esc(D.signed.date) : '') + '. All other terms stay the same. Team Forte signs it too, and you get a copy by email.</div>';
    if (signed) h += '<div class="ok"><div class="okchk">' + ICON.check + '</div><b>Signed by ' + esc(co.signed.name) + ' on ' + esc(co.signed.date) + '.</b> Thank you!</div>';
    else h += '<label class="f" for="tfp-nm">Your full name</label><input class="inp" id="tfp-nm" autocomplete="name" value="' + esc(D.name || '') + '">' +
      '<div class="row"><label class="f">Sign below</label><button class="lnk" id="tfp-clr" type="button">Clear</button></div><canvas class="sig" id="tfp-cv" aria-label="Signature pad"></canvas>' +
      '<label class="ck"><input type="checkbox" id="tfp-ag"><span>I approve this change to my contract.</span></label>' +
      '<button class="btn block" id="tfp-go" type="button">Approve & sign</button><div class="err" id="tfp-er"></div>';
    h += '<p class="m" style="margin-top:18px;text-align:center">Questions? <a href="' + esc(smsHref('Hi Team Forte, about change order ' + co.id + ' on ' + D.id + ': ')) + '">Text us</a> or call ' + esc(COPY.phone) + '.</p></div>' + footHtml();
    root.className = ''; root.innerHTML = bar() + h;
    if (!signed) { sigPad(); root.querySelector('#tfp-go').onclick = function () { submitCo(co); }; }
  }
  function submitCo(co) {
    var b = root.querySelector('#tfp-go'), er = root.querySelector('#tfp-er'), nm = root.querySelector('#tfp-nm').value.trim();
    er.textContent = '';
    if (nm.length < 2) { er.textContent = 'Type your full name.'; return; }
    if (!S.drawn) { er.textContent = 'Please sign in the box.'; return; }
    if (!root.querySelector('#tfp-ag').checked) { er.textContent = 'Check the box to approve.'; return; }
    b.disabled = true; b.textContent = 'Saving…';
    var body = JSON.stringify({ id: D.id, co: co.id, name: nm, agree: true, signature: root.querySelector('#tfp-cv').toDataURL('image/png'), total: co.total, ua: navigator.userAgent });
    fetch(EXEC + '?r=sign', { method: 'POST', body: body, headers: { 'Content-Type': 'text/plain;charset=utf-8' } })
      .then(function (r) { return r.text(); }).then(function (t) {
        var r; try { r = JSON.parse(t); } catch (e) { throw new Error('bad'); }
        if (!r.ok) { er.textContent = r.error || 'Couldn’t save. Please try again.'; b.disabled = false; b.textContent = 'Approve & sign'; return; }
        co.status = 'signed'; co.signed = { name: nm, date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) };
        D.jobTotal = Number(r.jobTotal) || D.jobTotal + co.total;
        if (!CALM) confetti();
        buildCo();
      }).catch(function () { er.textContent = 'Couldn’t save. Check your connection and try again.'; b.disabled = false; b.textContent = 'Approve & sign'; });
  }

  function sigPad() {
    var cv = root.querySelector('#tfp-cv'); if (!cv) return;
    var cx = cv.getContext('2d'), down = false, last = null; S.drawn = false;
    function size() { var r = cv.getBoundingClientRect(); if (!r.width) return; var d = window.devicePixelRatio || 1; cv.width = r.width * d; cv.height = r.height * d; cx.setTransform(d, 0, 0, d, 0, 0); cx.lineWidth = 2.6; cx.lineCap = 'round'; cx.lineJoin = 'round'; cx.strokeStyle = '#13202F'; S.drawn = false; }
    S.sizeSig = size; size();
    function pt(e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    cv.addEventListener('pointerdown', function (e) { if (!cv.width) size(); down = true; last = pt(e); try { cv.setPointerCapture(e.pointerId); } catch (x) {} e.preventDefault(); });
    cv.addEventListener('pointermove', function (e) { if (!down) return; var p = pt(e); cx.beginPath(); cx.moveTo(last.x, last.y); cx.lineTo(p.x, p.y); cx.stroke(); last = p; S.drawn = true; e.preventDefault(); });
    cv.addEventListener('pointerup', function () { down = false; });
    root.querySelector('#tfp-clr').onclick = function () { cx.clearRect(0, 0, cv.width, cv.height); S.drawn = false; };
    root.querySelector('#tfp-go').onclick = submit;
  }

  function submit() {
    var b = root.querySelector('#tfp-go'), er = root.querySelector('#tfp-er'), nm = root.querySelector('#tfp-nm').value.trim();
    er.textContent = '';
    if (nm.length < 2) { er.textContent = 'Type your full name.'; return; }
    if (!S.drawn) { er.textContent = 'Please sign in the box.'; return; }
    if (!root.querySelector('#tfp-ag').checked) { er.textContent = 'Check the box to accept.'; return; }
    b.disabled = true; b.textContent = 'Saving…';
    var adds = pickedAdds(), total = grandTotal();
    var body = JSON.stringify({ id: D.id, name: nm, agree: true, signature: root.querySelector('#tfp-cv').toDataURL('image/png'), pick: D.offers ? S.pick : undefined, color: S.color || undefined, price: chosenPrice(), addons: adds.map(function (a) { return a.key; }), total: total, ua: navigator.userAgent });
    fetch(EXEC + '?r=sign', { method: 'POST', body: body, headers: { 'Content-Type': 'text/plain;charset=utf-8' } })
      .then(function (r) { return r.text(); }).then(function (t) {
        var r; try { r = JSON.parse(t); } catch (e) { throw new Error('bad'); }
        if (!r.ok) { er.textContent = r.error || 'Couldn’t save. Please try again.'; b.disabled = false; b.textContent = 'Accept & sign'; return; }
        D.signed = { name: nm, date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) };
        D.depositLink = r.depositLink || ''; D.stripe = !!r.stripe; D.depositDue = Number(r.depositDue) || 0; D.paid = 0; D.balance = Number(r.balance) || 0;
        if (!CALM) confetti();
        D.basePrice = chosenPrice(); D.chosen = adds; D.price = Number(r.total) || total; D.cancelBy = r.cancelBy || '';
        renderPrice(); if (D.type !== 'repair') renderColor(); renderSign();
        var ok = root.querySelector('#tfp-signbox .ok');
        if (ok) ok.insertAdjacentHTML('afterbegin', '<b>Your proposal is signed.</b> A copy is on its way' + (r.emailed ? ' to your email' : '') + '. ');
        try { (PRESENT ? root.querySelector('#tfp-sign') : root.querySelector('#tfp-signbox')).scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (e) {}
      }).catch(function () { er.textContent = 'Couldn’t save. Check your connection and try again.'; b.disabled = false; b.textContent = 'Accept & sign'; });
  }

  /* ------------------------------------------------------------------ interaction */
  function wire() {
    if (S.wired) return wireNav();
    S.wired = true;
    root.addEventListener('click', function (e) {
      var ui = e.target.closest('[data-ui]');
      if (ui) { var w = ui.getAttribute('data-ui'); if (w === 'notes') root.querySelector('#tfp-notes').classList.toggle('on'); if (w === 'menu') { syncPresenter(); root.querySelector('#tfp-menu').classList.toggle('on'); } return; }
      var gt = e.target.closest('[data-goto]');
      if (gt) { root.querySelector('#tfp-menu').classList.remove('on'); go(+gt.getAttribute('data-goto')); return; }
      if (e.target.id === 'tfp-menu') { e.target.classList.remove('on'); return; }
      var pb = e.target.closest('[data-pay]');
      if (pb) { e.preventDefault(); if (!pb.disabled) payNow(pb.getAttribute('data-pay'), pb); return; }
      var fl = e.target.closest('[data-full]');
      if (fl) { e.preventDefault(); INVOICE = false; try { history.replaceState(null, '', location.pathname + '#p=' + encodeURIComponent(D.id)); } catch (x) {} S.built = false; build(); scrollTo(0, 0); return; }
      var pk = e.target.closest('[data-pk]');
      if (pk && !D.signed && D.offers && root.querySelector('#tfp-price').contains(pk)) {
        var i = +pk.getAttribute('data-pk'); if (i !== S.pick) { S.pick = i; renderPrice(); if (D.type !== 'repair') renderColor(); var nm = root.querySelector('#tfp-nm'), keep = nm ? nm.value : ''; renderSign(); if (nm) root.querySelector('#tfp-nm').value = keep; } return;
      }
      var cl = e.target.closest('[data-cl]');
      if (cl && !D.signed) { S.color = cl.getAttribute('data-cl'); root.querySelectorAll('.sw').forEach(function (z) { z.classList.toggle('on', z === cl); }); var nm2 = root.querySelector('#tfp-nm'), keep2 = nm2 ? nm2.value : ''; renderSign(); if (nm2) root.querySelector('#tfp-nm').value = keep2; return; }
      var g = e.target.closest('[data-go]');
      if (g) { e.preventDefault(); var t = S.secs.indexOf(g.getAttribute('data-go')); if (PRESENT) go(t); else root.querySelector('#tfp-sign').scrollIntoView({ behavior: 'smooth' }); return; }
      if (e.target.closest('.nav .nx')) { go(S.slide + 1); return; }
      if (e.target.closest('.nav .pv')) { go(S.slide - 1); return; }
    });
    wireNav();
  }
  function wireNav() {
    if (!D || !root.querySelector('.deck') || S.navWired) return;
    S.navWired = true;
    if (PRESENT) {
      document.addEventListener('keydown', function (e) {
        if (/input|textarea/i.test((e.target && e.target.tagName) || '')) return;
        if (e.key === 'ArrowRight' || e.key === 'PageDown') { go(S.slide + 1); e.preventDefault(); }
        if (e.key === 'ArrowLeft' || e.key === 'PageUp') { go(S.slide - 1); e.preventDefault(); }
        if (e.key === 'n' || e.key === 'N') { var nn = root.querySelector('#tfp-notes'); if (nn) nn.classList.toggle('on'); }
        if (e.key === 'm' || e.key === 'M') { syncPresenter(); var mm = root.querySelector('#tfp-menu'); if (mm) mm.classList.toggle('on'); }
        if (e.key === 'Escape') { var m2 = root.querySelector('#tfp-menu'); if (m2) m2.classList.remove('on'); }
      });
      var sx = null, sy = null;
      root.addEventListener('touchstart', function (e) { if (e.target.closest('canvas,.sws,.opts')) { sx = null; return; } sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
      root.addEventListener('touchend', function (e) { if (sx == null) return; var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) go(S.slide + (dx < 0 ? 1 : -1)); sx = null; }, { passive: true });
    } else {
      var prog = root.querySelector('#tfp-prog');
      var onScroll = function () { var h = document.documentElement.scrollHeight - innerHeight; if (prog) prog.style.width = Math.max(0, Math.min(100, h > 0 ? scrollY / h * 100 : 100)) + '%'; };
      addEventListener('scroll', onScroll, { passive: true }); onScroll();
    }
  }

  function go(i) {
    var sl = root.querySelectorAll('.slide'); if (!sl.length) return;
    i = Math.max(0, Math.min(sl.length - 1, i)); S.slide = i;
    sl.forEach(function (s, k) { s.classList.toggle('on', k === i); if (k === i) s.scrollTop = 0; });
    root.querySelectorAll('.dots i').forEach(function (d, k) { d.classList.toggle('on', k === i); });
    root.querySelector('.nav .pv').disabled = i === 0;
    var nx = root.querySelector('.nav .nx'); nx.disabled = i === sl.length - 1;
    var prog = root.querySelector('#tfp-prog'); if (prog) prog.style.width = ((i + 1) / sl.length * 100) + '%';
    if (S.secs[i] === 'sign' && S.sizeSig) setTimeout(S.sizeSig, 30);
    initMapsFor(S.secs[i]); syncPresenter();
    if (!CALM) {
      var cur = sl[i];
      cur.querySelectorAll('.rv').forEach(function (el) { el.classList.remove('in'); el.style.transitionDelay = ''; });
      cur.querySelectorAll('[data-count]').forEach(function (el) { el.__counted = false; });
      requestAnimationFrame(function () { requestAnimationFrame(function () { reveal(cur.querySelectorAll('.rv')); }); });
    }
  }
})();
