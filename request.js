/* Team Forte "Request a visit" form. Put <div data-tf-request data-trade="Flooring"></div> on a page and load this script.
   The request goes straight into the Team Forte app as a new quote for that category. */
(function () {
  'use strict';
  var EXEC = 'https://script.google.com/macros/s/AKfycbyQpxQSZqBBXYN7i14FAsy23bjOoIT_F8333zYMU2JdYRL_b22SXzdS-dlWZeVhkvxA/exec';
  var PHONE = '(860) 854-9335';
  var CATS = [['Roofing', 'Roof repair or replacement'], ['Flooring', 'Flooring'], ['Kitchens', 'Kitchens & cabinets'], ['Bathrooms', 'Bath & shower doors'],
    ['Painting', 'Painting'], ['Carpentry', 'Carpentry & closets'], ['Outdoor', 'Fences, decks & barns'], ['Handyman', 'Handyman']];
  var HINT = {
    Roofing: 'Leak, missing shingles, or a new roof? Tell us what you see.',
    Flooring: 'Which rooms, about how big, and what floor you have in mind.',
    Kitchens: 'Cabinets, countertops, backsplash or the whole kitchen?',
    Bathrooms: 'Shower door, tile, vanity or a full bathroom? Opening size helps for doors.',
    Painting: 'Which rooms or the outside, and roughly how big.',
    Carpentry: 'Trim, built-ins, closets, doors... what are you picturing?',
    Outdoor: 'Fence (about how long), deck (about how big), or a barn or shed, new or repair.',
    Handyman: 'List the small jobs: TV mount, repairs, drywall, moving furniture...'
  };
  var TIMING = ['As soon as possible', 'Within a month', 'In 1 to 3 months', 'Just getting prices'];
  var CSS = '.tfr{font-family:Montserrat,Arial,sans-serif;color:#1C2430;max-width:640px;margin:0 auto;background:#fff;border:1px solid #DDE2E8;border-radius:16px;padding:22px;box-shadow:0 6px 24px rgba(19,32,47,.08);text-align:left}' +
    '.tfr h3{margin:0 0 4px;font-size:22px;font-weight:800;color:#13202F}.tfr .sub{margin:0 0 14px;color:#5B6675;font-size:14px}' +
    '.tfr label{display:block;font-size:13px;font-weight:700;margin:12px 0 5px}.tfr .opt{font-weight:500;color:#5B6675}' +
    '.tfr input,.tfr select,.tfr textarea{box-sizing:border-box;width:100%;font:inherit;font-size:16px;padding:11px 12px;border:1px solid #C9D0D8;border-radius:10px;background:#fff;color:#1C2430}' +
    '.tfr textarea{min-height:96px;resize:vertical}.tfr input:focus,.tfr select:focus,.tfr textarea:focus{outline:2px solid #FF5440;outline-offset:0;border-color:#FF5440}' +
    '.tfr .row{display:flex;gap:10px}.tfr .row>div{flex:1;min-width:0}@media(max-width:520px){.tfr .row{display:block}}' +
    '.tfr .ph{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}.tfr .ph div{position:relative;width:72px;height:72px;border-radius:10px;overflow:hidden;background:#F2F4F7}' +
    '.tfr .ph img{width:100%;height:100%;object-fit:cover}.tfr .ph button{position:absolute;top:2px;right:2px;width:22px;height:22px;border-radius:50%;border:0;background:rgba(19,32,47,.75);color:#fff;font-size:14px;line-height:22px;padding:0;cursor:pointer}' +
    '.tfr .add{display:inline-flex;align-items:center;gap:8px;padding:10px 14px;border:1px dashed #9AA5B1;border-radius:10px;cursor:pointer;font-size:14px;font-weight:600;color:#13202F;background:#F7F9FB}' +
    '.tfr .add input{display:none}.tfr .ck{display:flex;gap:10px;align-items:flex-start;font-weight:500;font-size:13px;color:#5B6675;margin-top:12px}.tfr .ck input{width:18px;height:18px;flex:none;margin-top:1px;accent-color:#FF5440}' +
    '.tfr .go{display:block;width:100%;margin-top:16px;padding:15px;border:0;border-radius:10px;background:#FF5440;color:#fff;font:inherit;font-size:16px;font-weight:800;cursor:pointer}.tfr .go:disabled{opacity:.6;cursor:wait}' +
    '.tfr .err{color:#B3261E;font-size:14px;margin-top:10px;min-height:1px}.tfr .fine{font-size:12px;color:#5B6675;margin:10px 0 0;text-align:center;line-height:1.7}.tfr .fine a{color:#5B6675}' +
    '.tfr .hp{position:absolute;left:-5000px;width:1px;height:1px;overflow:hidden}' +
    '.tfr .ok{text-align:center;padding:12px 0}.tfr .ok b{display:block;font-size:22px;color:#13202F;margin:8px 0}.tfr .ok .chk{width:54px;height:54px;border-radius:50%;background:#E5F6EC;color:#1F9D55;font-size:30px;line-height:54px;margin:0 auto}' +
    '.tfr .ok a{display:inline-block;margin-top:14px;padding:12px 18px;border-radius:10px;border:1px solid #DDE2E8;color:#13202F;font-weight:700;text-decoration:none}';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function style() { if (document.getElementById('tfr-css')) return; var st = document.createElement('style'); st.id = 'tfr-css'; st.textContent = CSS; document.head.appendChild(st); }
  /* shrink a photo in the browser so the upload stays small */
  function shrink(file) {
    return new Promise(function (ok, bad) {
      var fr = new FileReader();
      fr.onload = function () {
        var im = new Image();
        im.onload = function () {
          var max = 1600, w = im.width, h = im.height, k = Math.min(1, max / Math.max(w, h));
          var cv = document.createElement('canvas'); cv.width = Math.round(w * k); cv.height = Math.round(h * k);
          cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
          ok(cv.toDataURL('image/jpeg', 0.8));
        };
        im.onerror = function () { bad(new Error('That photo could not be read.')); };
        im.src = fr.result;
      };
      fr.onerror = function () { bad(new Error('That photo could not be read.')); };
      fr.readAsDataURL(file);
    });
  }
  function mount(el) {
    if (el.getAttribute('data-tf-ready')) return;
    el.setAttribute('data-tf-ready', '1');
    var pre = el.getAttribute('data-trade') || '', title = el.getAttribute('data-title') || 'Request a visit';
    var photos = [], t0 = Date.now();
    el.innerHTML = '<form class="tfr" novalidate><h3>' + esc(title) + '</h3><p class="sub">Tell us about the project. We\u2019ll get back to you to set up a time.</p>' +
      '<label for="tfr-c">What do you need?</label><select id="tfr-c" name="trade">' + CATS.map(function (c) { return '<option value="' + c[0] + '"' + (c[0] === pre ? ' selected' : '') + '>' + esc(c[1]) + '</option>'; }).join('') + '</select>' +
      '<label for="tfr-d">Tell us a bit more</label><textarea id="tfr-d" name="details" maxlength="1000"></textarea>' +
      '<label>Photos <span class="opt">\u00b7 optional, up to 4</span></label><div class="ph"></div><label class="add" style="margin-top:8px">+ Add photos<input type="file" accept="image/*" multiple></label>' +
      '<label for="tfr-a">Project address</label><input id="tfr-a" name="address" autocomplete="street-address" placeholder="Street, town">' +
      '<div class="row"><div><label for="tfr-n">Your name</label><input id="tfr-n" name="name" autocomplete="name"></div><div><label for="tfr-p">Phone</label><input id="tfr-p" name="phone" type="tel" autocomplete="tel"></div></div>' +
      '<div class="row"><div><label for="tfr-e">Email <span class="opt">\u00b7 optional</span></label><input id="tfr-e" name="email" type="email" autocomplete="email"></div><div><label for="tfr-t">When</label><select id="tfr-t" name="timing">' + TIMING.map(function (t) { return '<option>' + t + '</option>'; }).join('') + '</select></div></div>' +
      '<label class="ck"><input type="checkbox" name="texts"><span>By checking this box, I consent to receive text messages from Team Forte about my request, scheduling and job updates. Message frequency varies. Message &amp; data rates may apply. Text HELP for help, reply STOP to opt out.</span></label>' +
      '<div class="hp" aria-hidden="true"><label>Leave empty<input name="website" tabindex="-1" autocomplete="off"></label></div>' +
      '<button class="go" type="submit">Send my request</button><div class="err" role="alert"></div>' +
      '<p class="fine"><a href="https://team-forte.com/privacy-policy" target="_blank" rel="noopener">Privacy Policy</a> | <a href="https://team-forte.com/terms-of-service" target="_blank" rel="noopener">Terms of Service</a><br>Registered &amp; Insured \u00b7 CT HIC.0706595 \u00b7 Or call <a href="tel:+18608549335">' + PHONE + '</a></p></form>';
    var f = el.querySelector('form'), ph = el.querySelector('.ph'), er = el.querySelector('.err'), ta = el.querySelector('#tfr-d'), cat = el.querySelector('#tfr-c');
    function hint() { ta.placeholder = HINT[cat.value] || ''; }
    hint(); cat.onchange = hint;
    function drawPhotos() { ph.innerHTML = photos.map(function (u, i) { return '<div><img alt="" src="' + u + '"><button type="button" data-i="' + i + '" aria-label="Remove photo">\u00d7</button></div>'; }).join(''); }
    ph.onclick = function (e) { var b = e.target.closest('button[data-i]'); if (!b) return; photos.splice(+b.getAttribute('data-i'), 1); drawPhotos(); };
    el.querySelector('.add input').onchange = function () {
      var files = Array.prototype.slice.call(this.files || []).slice(0, 4 - photos.length); this.value = '';
      Promise.all(files.map(shrink)).then(function (list) { photos = photos.concat(list).slice(0, 4); drawPhotos(); }).catch(function (e) { er.textContent = e.message; });
    };
    f.onsubmit = function (e) {
      e.preventDefault(); er.textContent = '';
      var v = function (n) { var x = f.elements[n]; return x ? (x.type === 'checkbox' ? x.checked : String(x.value || '').trim()) : ''; };
      var d = { trade: v('trade'), details: v('details'), address: v('address'), name: v('name'), phone: v('phone'), email: v('email'), timing: v('timing'), texts: v('texts'), hp: v('website'), photos: photos, page: location.pathname, secs: Math.round((Date.now() - t0) / 1000) };
      if (d.name.length < 2) { er.textContent = 'Please add your name.'; return; }
      if (d.phone.replace(/\D/g, '').length < 10 && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) { er.textContent = 'Please add a phone number or email so we can reach you.'; return; }
      if (d.address.length < 5) { er.textContent = 'Please add the address of the project.'; return; }
      var b = f.querySelector('.go'); b.disabled = true; b.textContent = 'Sending\u2026';
      fetch(EXEC + '?r=request', { method: 'POST', body: JSON.stringify(d) }).then(function (r) { return r.json(); }).then(function (r) {
        if (!r || !r.ok) throw new Error((r && r.error) || 'Something went wrong.');
        try { if (window.fbq) window.fbq('track', 'Lead', { content_category: d.trade }); } catch (x) { /* optional */ }
        el.innerHTML = '<div class="tfr"><div class="ok"><div class="chk">\u2713</div><b>Thanks, ' + esc(d.name.split(' ')[0]) + '!</b>We got your request and will be in touch soon to set up a visit.' + (d.email ? ' A copy is on its way to your email.' : '') + '<br><a href="tel:+18608549335">Call ' + PHONE + '</a></div></div>';
      }).catch(function (x) { b.disabled = false; b.textContent = 'Send my request'; er.innerHTML = esc(x.message || 'Something went wrong.') + ' You can also call <a href="tel:+18608549335">' + PHONE + '</a>.'; });
    };
  }
  function scan() { style(); Array.prototype.forEach.call(document.querySelectorAll('[data-tf-request]'), mount); }
  window.TFRequest = { scan: scan, version: 1 };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan); else scan();
  /* page builders sometimes add the block after the page loads */
  try { new MutationObserver(function () { if (document.querySelector('[data-tf-request]:not([data-tf-ready])')) scan(); }).observe(document.documentElement, { childList: true, subtree: true }); } catch (e) { /* old browsers */ }
})();
