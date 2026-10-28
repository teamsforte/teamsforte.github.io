/* Team Forte "Our Work" page (team-forte.com/gallery). GoHighLevel embeds only:
   <script src="https://teamsforte.github.io/page-gallery.js"></script>
   This file draws the header, the full gallery and the footer, so the page can be updated here without the page builder. */
(function () {
  'use strict';
  if (window.__tfPage) return; window.__tfPage = 1;
  var LOGO = 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20620%20160%22%20role%3D%22img%22%20aria-label%3D%22Team%20Forte%20Roofing%22%3E%3Cg%20fill%3D%22%23ff5147%22%3E%3Cpath%20d%3D%22M4%20116%20108%2012%20146%2050V28h28v50l32%2032v46h-28v-34L108%2052%2044%20116Z%22%2F%3E%3C%2Fg%3E%3Cg%20fill%3D%22%23fff%22%3E%3Cpath%20d%3D%22M83%20104h20v20H83zm26%200h20v20h-20zm-26%2026h20v20H83zm26%200h20v20h-20z%22%2F%3E%3Cdefs%3E%3Cpath%20id%3D%22T%22%20d%3D%22M0%200h48v12H31v48H17V12H0Z%22%2F%3E%3Cpath%20id%3D%22E%22%20d%3D%22M0%200h44v12H14v11h27v12H14v13h30v12H0Z%22%2F%3E%3Cpath%20id%3D%22A%22%20fill-rule%3D%22evenodd%22%20d%3D%22M0%2060%2020%200h17l20%2060H42l-4-13H18l-4%2013ZM22%2035h12l-6-20Z%22%2F%3E%3Cpath%20id%3D%22M%22%20d%3D%22M0%2060V0h14l18%2027L50%200h14v60H50V23L32%2049%2014%2023v37Z%22%2F%3E%3Cpath%20id%3D%22F%22%20d%3D%22M0%200h44v13H15v13h26v13H15v21H0Z%22%2F%3E%3Cpath%20id%3D%22O%22%20fill-rule%3D%22evenodd%22%20d%3D%22M28%200C9%200%200%2010%200%2030s9%2030%2028%2030%2028-10%2028-30S47%200%2028%200Zm0%2013c-9%200-13%205-13%2017s4%2017%2013%2017%2013-5%2013-17-4-17-13-17Z%22%2F%3E%3Cpath%20id%3D%22R%22%20fill-rule%3D%22evenodd%22%20d%3D%22M0%2060V0h28c17%200%2025%207%2025%2020%200%209-4%2015-12%2018l15%2022H38L25%2040H15v20ZM15%2012v16h12c7%200%2011-2%2011-8s-4-8-11-8Z%22%2F%3E%3C%2Fdefs%3E%3Cg%20transform%3D%22translate(220%2016)%20scale(.72)%22%3E%3Cuse%20href%3D%22%23T%22%2F%3E%3Cuse%20href%3D%22%23E%22%20x%3D%2262%22%2F%3E%3Cuse%20href%3D%22%23A%22%20x%3D%22121%22%2F%3E%3Cuse%20href%3D%22%23M%22%20x%3D%22192%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(220%2074)%20scale(1.32)%22%3E%3Cuse%20href%3D%22%23F%22%2F%3E%3Cuse%20href%3D%22%23O%22%20x%3D%2254%22%2F%3E%3Cuse%20href%3D%22%23R%22%20x%3D%22120%22%2F%3E%3Cuse%20href%3D%22%23T%22%20x%3D%22185%22%2F%3E%3Cuse%20href%3D%22%23E%22%20x%3D%22243%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';
  var PHONE = '(860) 854-9335', TEL = 'tel:+18608549335';
  var HI = [['Flooring', '/flooring'], ['Kitchens & Cabinets', '/kitchens-cabinets'], ['Bath & Shower Doors', '/bathroom-shower-doors'], ['Painting', '/painting'], ['Carpentry & Closets', '/carpentry-closets'], ['Fences, Decks & Barns', '/fences-decks-barns'], ['Handyman', '/handyman']];
  var NAV = [['Roofing', '/'], ['Home Improvement', HI], ['Gallery', '/gallery'], ['Contact', '/#section-Fhm6moNOnG']];
  var CSS = '' +
    'html,body{background:#0D1721!important;overflow-x:clip}' +
    '.tfp,.tfp *{box-sizing:border-box}.tfp{font-family:Montserrat,"Segoe UI",Arial,sans-serif;color:#fff;-webkit-font-smoothing:antialiased;width:100vw;position:relative;left:50%;margin-left:-50vw;background:#0D1721}' +
    '.tfp a{text-decoration:none}' +
    '.tfp-tick{background:#FF5440;color:#fff;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;text-align:center;padding:8px 12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.tfp-tick span{opacity:.65;margin:0 10px}' +
    '.tfp-top{position:sticky;top:0;z-index:50;background:#0A0A0A;border-bottom:1px solid rgba(255,255,255,.08)}' +
    '.tfp-bar{max-width:1280px;margin:0 auto;padding:12px 24px;display:flex;align-items:center;gap:18px}' +
    '.tfp-logo img{height:52px;width:auto;display:block}' +
    '.tfp-nav{display:flex;gap:2px;margin-left:auto}' +
    '.tfp-nav a{color:#F5F5F5;font-size:13px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:12px 13px;border-radius:6px}' +
    '.tfp-nav a:hover{color:#FF5440}.tfp-nav a.on{color:#FF5440;box-shadow:inset 0 -2px 0 #FF5440;border-radius:0}' +
    '.tfp-dd{position:relative}.tfp-dd>button{color:#F5F5F5;font:700 13px Montserrat,"Segoe UI",Arial,sans-serif;letter-spacing:.04em;text-transform:uppercase;padding:12px 13px;border-radius:6px;background:none;border:0;cursor:pointer}' +
    '.tfp-dd>button:hover{color:#FF5440}.tfp-dd>button:after{content:"";display:inline-block;margin-left:6px;border:4px solid transparent;border-top-color:currentColor;vertical-align:-1px}' +
    '.tfp-menu{display:none;position:absolute;left:0;top:100%;min-width:250px;background:#fff;border-radius:12px;box-shadow:0 14px 40px rgba(0,0,0,.25);padding:8px;z-index:60}' +
    '.tfp-dd:hover .tfp-menu,.tfp-dd:focus-within .tfp-menu,.tfp-dd.open .tfp-menu{display:block}.tfp-nav .tfp-menu a{display:block;color:#13202F;font-size:14px;font-weight:700;letter-spacing:0;text-transform:none;padding:10px 12px;border-radius:8px}.tfp-nav .tfp-menu a:hover{background:#FFF1EF;color:#E23E2B}' +
    '.tfp-call{background:#FF5440;color:#fff!important;font-size:14px;font-weight:800;padding:13px 20px;border-radius:8px;white-space:nowrap}.tfp-call:hover{background:#E23E2B}' +
    '.tfp-main{padding:28px 0 8px}.tfp-main .tfg--show{border-radius:0;max-width:none;padding-left:max(24px,calc((100vw - 1232px)/2));padding-right:max(24px,calc((100vw - 1232px)/2))}' +
    '.tfp-main .tfg-trust{margin-left:min(-24px,calc((1232px - 100vw)/2));margin-right:min(-24px,calc((1232px - 100vw)/2));padding-left:max(24px,calc((100vw - 1232px)/2));padding-right:max(24px,calc((100vw - 1232px)/2))}' +
    '.tfp-foot{max-width:1280px;margin:0 auto;padding:26px 24px 34px;display:flex;flex-wrap:wrap;gap:10px 22px;align-items:center;color:#9AA6B4;font-size:13px}' +
    '.tfp-foot a{color:#C4CCD6}.tfp-foot a:hover{color:#fff}.tfp-foot .sp{margin-left:auto}' +
    '@media(max-width:980px){.tfp-bar{flex-wrap:wrap;padding:10px 16px;gap:8px 12px}.tfp-logo img{height:42px}.tfp-call{margin-left:auto;padding:11px 14px;font-size:13px}' +
      '.tfp-nav{order:3;width:100%;margin:0 -16px;padding:0 10px;flex-wrap:wrap;width:calc(100% + 32px)}.tfp-dd>button{padding:9px 10px;font-size:12px}.tfp-menu{position:fixed;left:12px;right:12px;top:auto;min-width:0}.tfp-nav::-webkit-scrollbar{display:none}.tfp-nav a{flex:none;padding:9px 10px;font-size:12px}' +
      '.tfp-main{padding-top:0}.tfp-foot .sp{margin-left:0}.tfp-tick{font-size:11px;letter-spacing:.08em}}' +
    '@media(max-width:700px){.tfp-main .tfg--show{padding-left:16px;padding-right:16px}.tfp-main .tfg-trust{margin-left:-16px;margin-right:-16px;padding-left:16px;padding-right:16px}}';

  var me = document.currentScript;
  var st = document.createElement('style'); st.textContent = CSS; (document.head || document.documentElement).appendChild(st);
  var root = document.createElement('div'); root.className = 'tfp';
  var here = location.pathname.replace(/\/+$/, '') || '/';
  root.innerHTML =
    '<div class="tfp-tick">Free roof inspections<span>•</span>24/7 emergency repairs<span>•</span>Serving Connecticut</div>' +
    '<header class="tfp-top"><div class="tfp-bar"><a class="tfp-logo" href="/" aria-label="Team Forte home"><img src="' + LOGO + '" alt="Team Forte Roofing" width="186" height="48"></a>' +
      '<nav class="tfp-nav" aria-label="Main">' + NAV.map(function (n) { if (typeof n[1] !== 'string') return '<div class="tfp-dd"><button type="button" aria-haspopup="true">' + n[0] + '</button><div class="tfp-menu">' + n[1].map(function (c) { return '<a href="' + c[1] + '">' + c[0].replace('&', '&amp;') + '</a>'; }).join('') + '</div></div>'; return '<a href="' + n[1] + '"' + (n[1] === here ? ' class="on" aria-current="page"' : '') + '>' + n[0] + '</a>'; }).join('') + '</nav>' +
      '<a class="tfp-call" href="' + TEL + '">☎ ' + PHONE + '</a></div></header>' +
    '<main class="tfp-main"><div class="tf-gallery" data-theme="dark" data-eyebrow="Our Work" data-title="Real Projects. Happy Homeowners." ' +
      'data-subtitle="Take a look at our recent roofing and home improvement projects across Connecticut. Quality work, clean finishes, and lasting results — that’s the Team Forte difference." data-limit="24"></div></main>' +
    '<footer class="tfp-foot"><span>© ' + new Date().getFullYear() + ' Team Forte · GR Brothers LLC</span><span>Serving Connecticut</span>' +
      '<a href="' + TEL + '">' + PHONE + '</a><a href="mailto:info@team-forte.com">info@team-forte.com</a>' +
      '<span class="sp"></span><a href="/privacy-policy">Privacy Policy</a><a href="/terms-of-service">Terms of Service</a></footer>';
  if (me && me.parentNode) me.parentNode.insertBefore(root, me.nextSibling); else document.body.appendChild(root);
  var dd = root.querySelector('.tfp-dd');
  if (dd) { dd.querySelector('button').addEventListener('click', function (e) { e.stopPropagation(); dd.classList.toggle('open'); });
    document.addEventListener('click', function (e) { if (!dd.contains(e.target)) dd.classList.remove('open'); }); }
  if (window.TFGallery && window.TFGallery.scan) { window.TFGallery.scan(); return; }
  var s = document.createElement('script'); s.src = 'https://teamsforte.github.io/gallery.js?v=1'; s.async = true; document.body.appendChild(s);
})();
