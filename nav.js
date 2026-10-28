/* Team Forte main-site menu add-on (team-forte.com home page and other GoHighLevel pages with the built-in menu).
   GoHighLevel holds only: <script src="https://teamsforte.github.io/nav.js"></script>
   Adds a "Home Improvement" dropdown after "Services" in the built-in Navigation Menu (desktop and the phone menu).
   Links match landing.js (one page per trade). Edit ITEMS here; no page-builder change needed. */
(function () {
  'use strict';
  if (window.__tfNav) return; window.__tfNav = 1;
  var ITEMS = [['Flooring', '/flooring'], ['Kitchens & Cabinets', '/kitchens-cabinets'], ['Bath & Shower Doors', '/bathroom-shower-doors'], ['Painting', '/painting'],
    ['Carpentry & Closets', '/carpentry-closets'], ['Fences, Decks & Barns', '/fences-decks-barns'], ['Handyman', '/handyman']];
  var LABEL = 'Home Improvement';
  var CSS = '' +
    '.tfn-dd{position:relative}' +
    '.tfn-dd>a.tfn-btn:after{content:"";display:inline-block;margin-left:6px;border:4px solid transparent;border-top-color:currentColor;vertical-align:-1px}' +
    '.tfn-menu{display:none;position:absolute;left:0;top:100%;min-width:250px;background:#fff;border-radius:12px;box-shadow:0 14px 40px rgba(0,0,0,.25);padding:8px;z-index:1000;text-align:left}' +
    '.tfn-dd:hover>.tfn-menu,.tfn-dd:focus-within>.tfn-menu,.tfn-dd.open>.tfn-menu{display:block}' +
    '.tfn-menu a{display:block!important;color:#13202F!important;font:700 14px Montserrat,Arial,sans-serif!important;letter-spacing:0!important;text-transform:none!important;padding:10px 12px!important;border-radius:8px;white-space:nowrap;text-decoration:none!important;background:none}' +
    '.tfn-menu a:hover{background:#FFF1EF!important;color:#E23E2B!important}' +
    /* phone menu (GoHighLevel opens .nav-menu-body): show the trades as an indented list under the heading */
    '.nav-menu-body .tfn-menu,.tfn-flat .tfn-menu{display:block;position:static;min-width:0;background:none;box-shadow:none;border-radius:0;padding:0 0 6px 16px}' +
    '.nav-menu-body .tfn-dd>a.tfn-btn:after,.tfn-flat>a.tfn-btn:after{display:none}' +
    '.nav-menu-body .tfn-menu a,.tfn-flat .tfn-menu a{color:inherit!important;font-weight:600!important;font-size:15px!important;padding:8px 10px!important;white-space:normal}' +
    '.nav-menu-body .tfn-menu a:hover,.tfn-flat .tfn-menu a:hover{background:none!important;color:#FF5440!important}';

  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  function build(ul) {
    var lis = ul.querySelectorAll(':scope > li');
    if (!lis.length || ul.querySelector('.tfn-dd')) return;
    var after = null;
    for (var i = 0; i < lis.length; i++) { var a = lis[i].querySelector('a'); if (a && /services/i.test(a.textContent)) { after = lis[i]; break; } }
    if (!after) after = lis[0];
    var tpl = after.querySelector('a');
    var li = document.createElement('li');
    li.className = (after.className || 'nav-menu-item') + ' tfn-dd';
    var btn = document.createElement('a');
    btn.href = '#'; btn.className = ((tpl && tpl.className) || '') + ' tfn-btn';
    btn.setAttribute('role', 'button'); btn.setAttribute('aria-haspopup', 'true'); btn.setAttribute('aria-expanded', 'false');
    btn.textContent = LABEL;
    var here = location.pathname.replace(/\/+$/, '');
    var menu = document.createElement('div'); menu.className = 'tfn-menu';
    menu.innerHTML = ITEMS.map(function (it) { return '<a href="' + it[1] + '"' + (it[1] === here ? ' aria-current="page"' : '') + '>' + esc(it[0]) + '</a>'; }).join('');
    li.appendChild(btn); li.appendChild(menu);
    if (ul.closest && ul.closest('.nav-menu-body')) li.classList.add('tfn-flat');
    btn.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      if (li.classList.contains('tfn-flat')) return;
      var on = !li.classList.contains('open'); li.classList.toggle('open', on); btn.setAttribute('aria-expanded', on ? 'true' : 'false');
    });
    after.parentNode.insertBefore(li, after.nextSibling);
  }

  function scan() { var uls = document.querySelectorAll('ul.nav-menu'); for (var i = 0; i < uls.length; i++) build(uls[i]); }

  function start() {
    if (!document.getElementById('tfn-css')) { var st = document.createElement('style'); st.id = 'tfn-css'; st.textContent = CSS; document.head.appendChild(st); }
    scan();
    document.addEventListener('click', function (e) {
      var open = document.querySelectorAll('.tfn-dd.open');
      for (var i = 0; i < open.length; i++) if (!open[i].contains(e.target)) { open[i].classList.remove('open'); open[i].querySelector('.tfn-btn').setAttribute('aria-expanded', 'false'); }
    });
    var t = 0;
    new MutationObserver(function () { if (t) return; t = setTimeout(function () { t = 0; scan(); }, 60); }).observe(document.body, { childList: true, subtree: true });
  }
  /* wait for the page to finish loading so GoHighLevel's own scripts have built the menu first */
  if (document.readyState === 'complete') setTimeout(start, 0); else window.addEventListener('load', function () { setTimeout(start, 0); });
})();
