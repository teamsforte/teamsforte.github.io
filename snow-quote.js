/* Team Forte snow removal page with the driveway quote tool (team-forte.com/snow-removal). GoHighLevel holds only:
   <script src="https://teamsforte.github.io/snow-quote.js"></script>
   Address -> satellite photo -> the customer taps the driveway corners -> size tier -> seasonal plan first, per visit second
   -> add-ons -> contact details -> GoHighLevel "Snow Leads (website)" webhook. Prices and limits are in SNOW below.
   Built by snow/build.py (header, footer and base styles come from landing.js). */
(function () {
  'use strict';
  if (window.__tfSnow || document.querySelector('[data-tf-landing]')) return; window.__tfSnow = 1;
  var CSS = "html,body{overflow-x:clip}.c-section:has(.tfl),.fullSection:has(.tfl),.c-row:has(.tfl),.c-column:has(.tfl),.c-custom-code:has(.tfl),.inner:has(.tfl){padding:0!important;margin:0!important;max-width:none!important}.tfl{width:100vw;position:relative;left:50%;margin-left:-50vw;background:#fff}.tfl a{text-decoration:none}.tfl-tick{background:#FF5440;color:#fff;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;text-align:center;padding:8px 12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tfl-tick span{opacity:.65;margin:0 10px}.tfl-top{position:sticky;top:0;z-index:50;background:#0A0A0A;border-bottom:1px solid rgba(255,255,255,.08)}.tfl-bar{max-width:1280px;margin:0 auto;padding:12px 24px;display:flex;align-items:center;gap:18px}.tfl-logo img{height:52px;width:auto;display:block}.tfl-nav{display:flex;gap:2px;margin-left:auto;align-items:center}.tfl-nav>a,.tfl-dd>button{color:#F5F5F5;font:700 13px Montserrat,Arial,sans-serif;letter-spacing:.04em!important;text-transform:uppercase!important;padding:12px 13px;border-radius:6px;background:none;border:0;cursor:pointer}.tfl-nav>a:hover,.tfl-dd>button:hover{color:#FF5440}.tfl-nav .on{color:#FF5440!important;box-shadow:inset 0 -2px 0 #FF5440;border-radius:0}.tfl-dd{position:relative}.tfl-dd>button:after{content:\"\";display:inline-block;margin-left:6px;border:4px solid transparent;border-top-color:currentColor;vertical-align:-1px}.tfl-menu{display:none;position:absolute;left:0;top:100%;min-width:250px;background:#fff;border-radius:12px;box-shadow:0 14px 40px rgba(0,0,0,.25);padding:8px;z-index:60}.tfl-dd:hover .tfl-menu,.tfl-dd:focus-within .tfl-menu,.tfl-dd.open .tfl-menu{display:block}.tfl-menu a{display:block;color:#13202F;font-size:14px;font-weight:700;padding:10px 12px;border-radius:8px}.tfl-menu a:hover,.tfl-menu a.on{background:#FFF1EF;color:#E23E2B}.tfl-phone{background:#FF5440;color:#fff!important;font-size:14px;font-weight:800;padding:13px 20px;border-radius:8px;white-space:nowrap}.tfl-phone:hover{background:#E23E2B}.tfl-foot{background:#0D1721}.tfl-foot>div{max-width:1280px;margin:0 auto;padding:26px 24px 34px;display:flex;flex-wrap:wrap;gap:10px 22px;align-items:center;color:#9AA6B4;font-size:13px}.tfl-foot a{color:#C4CCD6}.tfl-foot a:hover{color:#fff}.tfl-foot .sp{margin-left:auto}@media(max-width:980px){.tfl-bar{flex-wrap:wrap;padding:10px 16px;gap:8px 12px}.tfl-logo img{height:42px}.tfl-phone{margin-left:auto;padding:11px 14px;font-size:13px}.tfl-nav{order:3;width:calc(100% + 32px);margin:0 -16px;padding:0 10px;flex-wrap:wrap}.tfl-nav>a,.tfl-dd>button{padding:9px 10px;font-size:12px}.tfl-menu{position:fixed;left:12px;right:12px;top:auto;min-width:0}.tfl-foot .sp{margin-left:0}.tfl-tick{font-size:11px;letter-spacing:.08em}}.tfl{font-family:Montserrat,\"Segoe UI\",Arial,sans-serif;color:#1C2430;line-height:1.5;text-align:left;-webkit-font-smoothing:antialiased}.tfl *{box-sizing:border-box}.tfl h1,.tfl h2,.tfl h3,.tfl p,.tfl a,.tfl summary{font-family:inherit!important;letter-spacing:0;text-transform:none}.tfl-w{max-width:1120px;margin:0 auto;padding:0 20px}.tfl-hero{background:#13202F;color:#fff;padding:64px 0 56px}.tfl-k{color:#FF5440;font-size:13px;font-weight:800;letter-spacing:.12em!important;text-transform:uppercase!important;margin:0 0 10px}.tfl-hero h1{font-size:clamp(32px,5vw,52px);line-height:1.1;font-weight:800;margin:0 0 16px;color:#fff;max-width:760px}.tfl-hero p.lead{font-size:clamp(16px,2vw,19px);color:#C4CCD6;max-width:680px;margin:0 0 26px}.tfl-btns{display:flex;gap:12px;flex-wrap:wrap}.tfl-btn{display:inline-block;padding:15px 24px;border-radius:10px;font-weight:800;font-size:16px;text-decoration:none!important;background:#FF5440;color:#fff!important}.tfl-btn.ghost{background:transparent;border:2px solid rgba(255,255,255,.35)}.tfl-btn:hover{filter:brightness(1.05)}.tfl-chips{display:flex;gap:10px;flex-wrap:wrap;margin-top:26px}.tfl-chips span{font-size:13px;font-weight:600;color:#C4CCD6;border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:7px 14px}.tfl-sec{padding:56px 0}.tfl-sec.alt{background:#F2F4F7}.tfl-sec h2{font-size:clamp(26px,3.6vw,36px);line-height:1.15;font-weight:800;margin:0 0 8px;color:#13202F}.tfl-sec p.sub{color:#5B6675;margin:0 0 26px;font-size:16px}.tfl-grid{display:grid;grid-template-columns:1fr;gap:14px}@media(min-width:640px){.tfl-grid{grid-template-columns:1fr 1fr}}@media(min-width:960px){.tfl-grid{grid-template-columns:1fr 1fr 1fr}}.tfl-card{background:#fff;border:1px solid #DDE2E8;border-radius:14px;padding:20px}.tfl-card h3{font-size:17px;font-weight:800;margin:0 0 6px;color:#13202F}.tfl-card p{margin:0;color:#5B6675;font-size:15px}.tfl-card i{display:block;width:28px;height:4px;border-radius:2px;background:#FF5440;margin-bottom:12px}.tfl-steps{list-style:none;margin:0;padding:0;display:grid;gap:14px;counter-reset:s}@media(min-width:900px){.tfl-steps{grid-template-columns:repeat(auto-fit,minmax(150px,1fr))}}.tfl-steps li{counter-increment:s;background:#fff;border:1px solid #DDE2E8;border-radius:14px;padding:18px}.tfl-steps li:before{content:counter(s);display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:#13202F;color:#fff;font-weight:800;margin-bottom:10px}.tfl-steps h3{font-size:16px;font-weight:800;margin:0 0 4px;color:#13202F}.tfl-steps p{margin:0;color:#5B6675;font-size:14px}.tfl-faq{max-width:820px}.tfl-faq details{background:#fff;border:1px solid #DDE2E8;border-radius:12px;margin-bottom:10px;padding:0 18px}.tfl-faq summary{cursor:pointer;font-weight:700;padding:16px 0;list-style:none;color:#13202F}.tfl-faq summary::-webkit-details-marker{display:none}.tfl-faq summary:after{content:\"+\";float:right;color:#FF5440;font-weight:800}.tfl-faq details[open] summary:after{content:\"\\2212\"}.tfl-faq details p{margin:0 0 16px;color:#5B6675}.tfl-req{display:grid;gap:28px;align-items:start}@media(min-width:900px){.tfl-req{grid-template-columns:1fr 1.1fr}}.tfl-req ul{margin:16px 0 0;padding:0;list-style:none}.tfl-req li{padding:8px 0 8px 30px;position:relative;color:#1C2430}.tfl-req li:before{content:\"\\2713\";position:absolute;left:0;color:#1F9D55;font-weight:800}.tfl-call{display:inline-block;margin-top:18px;font-weight:800;color:#FF5440!important;text-decoration:none!important;font-size:18px}.tfl-ic{display:flex;width:44px;height:44px;border-radius:12px;background:#FFF1EF;color:#FF5440;align-items:center;justify-content:center;margin-bottom:12px;flex:0 0 auto}.tfl-ic svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.tfl-trust{background:#fff;border-bottom:1px solid #DDE2E8}.tfl-trust .tfl-w{display:grid;gap:14px;padding-top:18px;padding-bottom:18px}@media(min-width:760px){.tfl-trust .tfl-w{grid-template-columns:repeat(3,1fr)}}.tfl-trust .tfl-w>div{display:flex;gap:12px;align-items:center;font-weight:700;color:#13202F;font-size:15px}.tfl-trust .tfl-ic{margin:0;width:40px;height:40px}.tfl-hi{display:none!important}.tfl-menu a.all{border-bottom:1px solid #EEF0F3;border-radius:8px 8px 0 0;margin-bottom:4px}.tfl-mbar{display:none}.tfl-fb{max-width:640px;margin:0 auto;background:#fff;border:1px solid #DDE2E8;border-radius:16px;padding:22px}.tfl-fb b{font-size:18px;color:#13202F}.tfl-fb p{margin:8px 0 0;color:#5B6675}.tfl-fb a{color:#E23E2B;font-weight:700}a.tfl-svc{display:block;color:inherit;transition:border-color .15s,box-shadow .15s}a.tfl-svc:hover{border-color:#FF5440;box-shadow:0 8px 24px rgba(19,32,47,.08)}a.tfl-svc .go{display:inline-block;margin-top:12px;font-weight:800;color:#E23E2B;font-size:14px}.tfl-roof{display:flex;flex-wrap:wrap;gap:18px 28px;align-items:center;justify-content:space-between}.tfl-btn.ghost.dark{color:#13202F!important;border-color:#13202F}.tfl-dl{margin:16px 0 0;display:grid;gap:14px}.tfl-dl dt{font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#5B6675}.tfl-dl dd{margin:2px 0 0;font-size:17px;font-weight:700;color:#13202F}.tfl-dl a{color:#E23E2B}.tfl-links{display:flex;flex-wrap:wrap;gap:8px}.tfl-links a{border:1px solid #DDE2E8;border-radius:999px;padding:8px 14px;font-weight:700;font-size:14px;color:#13202F}.tfl-links a:hover{border-color:#FF5440;color:#E23E2B}@media(max-width:980px){.tfl-dd{display:none}.tfl-hi{display:inline-block!important}.tfl-nav{flex-wrap:nowrap;justify-content:space-between;overflow-x:auto;scrollbar-width:none}.tfl-nav>a{white-space:nowrap;padding:9px 7px!important;font-size:11.5px!important}.tfl-mbar{display:flex;position:fixed;left:0;right:0;bottom:0;z-index:80;gap:8px;padding:8px 10px calc(8px + env(safe-area-inset-bottom));background:#0A0A0A;border-top:1px solid rgba(255,255,255,.12)}.tfl-mbar a{flex:1;text-align:center;padding:13px 8px;border-radius:9px;font-size:15px;font-weight:800;color:#fff!important;border:1px solid rgba(255,255,255,.3)}.tfl-mbar a.q{background:#FF5440;border-color:#FF5440}.tfl{padding-bottom:72px}}.tfx-hero{background:linear-gradient(160deg,#13202F 0%,#1d3550 100%)}.tfx-hero .tfl-w{display:grid;gap:28px;align-items:center}@media(min-width:960px){.tfx-hero .tfl-w{grid-template-columns:1.1fr .9fr;gap:44px}}.tfx-glance{background:#16283B;border:1px solid rgba(255,255,255,.16);border-radius:18px;overflow:hidden;box-shadow:0 18px 44px rgba(0,0,0,.28)}.tfx-art{display:block;width:100%;height:auto}.tfx-how{padding:16px 18px 18px;border-top:1px solid rgba(255,255,255,.14)}.tfx-how b{display:block;color:#fff;font-size:14px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;margin-bottom:10px}.tfx-how ol{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:8px 14px;counter-reset:x}.tfx-how li{counter-increment:x;display:flex;align-items:center;gap:9px;color:#E6EBF1;font-size:14px;font-weight:600;line-height:1.25}.tfx-how li::before{content:counter(x);flex:none;width:22px;height:22px;border-radius:50%;background:#FF5440;color:#fff;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center}@media(max-width:959px){.tfx-how{display:none}}.tfx-towns{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:8px}.tfx-towns li{background:#F2F4F7;border:1px solid #DDE2E8;border-radius:999px;padding:8px 14px;font-size:15px;font-weight:700;color:#13202F}.tfx-tnote{color:#5B6675;font-size:15px;margin:16px 0 0}.tfx-pm{margin-top:28px;background:#13202F;border-radius:16px;padding:24px;display:flex;flex-wrap:wrap;gap:16px 28px;align-items:center;justify-content:space-between}.tfx-pm h3{color:#fff;font-size:20px;font-weight:800;margin:0 0 6px}.tfx-pm p{color:#C4CCD6;margin:0;font-size:15px;max-width:560px}.tfx-pmb{display:flex;flex-wrap:wrap;gap:12px 18px;align-items:center}.tfx-pml{color:#fff!important;font-weight:800;text-decoration:underline!important}";
  var SNOW_CSS = ".tfs-hero{background:linear-gradient(160deg,#13202F 0%,#1d3550 100%)}.tfs-urgent{margin:22px 0 0;color:#C4CCD6;font-weight:700;font-size:15px}.tfs-spots{display:inline-block;background:#FF5440;color:#fff;border-radius:999px;padding:4px 12px;margin-right:10px;font-size:13px}.tfs{max-width:860px}.tfs-card{background:#fff;border:1px solid #DDE2E8;border-radius:16px;padding:22px;box-shadow:0 6px 24px rgba(19,32,47,.08)}.tfs label,.tfs legend{display:block;font-size:13px;font-weight:700;color:#13202F;margin:12px 0 6px}.tfs-lab{margin-top:0!important}.tfs input:not([type=checkbox]):not([type=radio]),.tfs select,.tfs textarea{width:100%;font:500 16px Montserrat,Arial,sans-serif;color:#1C2430;border:1px solid #C9D1DA;border-radius:10px;padding:12px 14px;background:#fff}.tfs textarea{min-height:84px;resize:vertical}.tfs input:focus,.tfs select:focus,.tfs textarea:focus{outline:2px solid #FF5440;outline-offset:1px;border-color:#FF5440}.tfs-row{display:flex;gap:10px;flex-wrap:wrap}.tfs-ac{position:relative;flex:1 1 320px}.tfs-sug{display:none;position:absolute;left:0;right:0;top:100%;margin-top:4px;background:#fff;border:1px solid #DDE2E8;border-radius:10px;box-shadow:0 12px 30px rgba(0,0,0,.15);z-index:30;overflow:hidden}.tfs-sug button{display:block;width:100%;text-align:left;border:0;background:#fff;padding:11px 14px;font:500 15px Montserrat,Arial,sans-serif;color:#1C2430;cursor:pointer}.tfs-sug button:hover,.tfs-sug button.on{background:#FFF1EF}.tfs-go{background:#FF5440;color:#fff;border:0;border-radius:10px;padding:13px 20px;font:800 16px Montserrat,Arial,sans-serif;cursor:pointer;white-space:nowrap}.tfs-go:hover{background:#E23E2B}.tfs-go:disabled{background:#C9D1DA;cursor:default}.tfs-wide{width:100%;margin-top:14px}.tfs-err{color:#C62828;font-weight:700;font-size:14px;margin:8px 0 0;min-height:1px}.tfs-err a{color:#C62828}.tfs-fine{color:#5B6675;font-size:13px;margin:10px 0 0}.tfs-link{background:none;border:0;padding:0;color:#E23E2B;font:700 13px Montserrat,Arial,sans-serif;cursor:pointer;text-decoration:underline}.tfs-maphead{display:flex;flex-wrap:wrap;gap:6px 14px;justify-content:space-between;align-items:baseline;margin-bottom:8px;color:#13202F}.tfs-help{color:#3A4654;font-size:15px;margin:0 0 10px}.tfs-map{height:440px;border-radius:12px;overflow:hidden;background:#223142}.tfs-tools{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.tfs-tools button{border:1px solid #C9D1DA;background:#fff;border-radius:9px;padding:9px 13px;font:700 14px Montserrat,Arial,sans-serif;color:#13202F;cursor:pointer}.tfs-tools button:disabled{opacity:.45;cursor:default}.tfs-tools button[hidden]{display:none}.tfs-areabar{display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-top:12px;padding:12px 14px;background:#F2F4F7;border-radius:12px;font-size:16px}.tfs-pick{display:grid;gap:10px}@media(min-width:640px){.tfs-pick{grid-template-columns:1fr 1fr}}.tfs-opt{text-align:left;border:1px solid #C9D1DA;background:#fff;border-radius:12px;padding:14px 16px;cursor:pointer;font-family:Montserrat,Arial,sans-serif}.tfs-opt:hover{border-color:#FF5440}.tfs-opt b{display:block;color:#13202F;font-size:16px}.tfs-opt small{color:#5B6675;font-size:14px}.tfs-size{font-size:16px;margin:0 0 14px;color:#1C2430}.tfs-plans{display:grid;gap:12px}@media(min-width:720px){.tfs-plans{grid-template-columns:1.15fr 1fr}}.tfs-plan{position:relative;display:block!important;margin:0!important;border:2px solid #DDE2E8;border-radius:14px;padding:18px 18px 16px 48px;cursor:pointer;background:#fff}.tfs-plan input{position:absolute;left:18px;top:22px;width:20px;height:20px;accent-color:#FF5440}.tfs-plan.on{border-color:#FF5440;background:#FFF8F7}.tfs-tag{display:inline-block;background:#13202F;color:#fff;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;border-radius:999px;padding:4px 10px;margin-bottom:8px}.tfs-pname{display:block;font-size:17px;font-weight:800;color:#13202F}.tfs-price{display:block;font-size:30px;font-weight:800;color:#13202F;margin:4px 0 6px}.tfs-price small{font-size:15px;font-weight:600;color:#5B6675}.tfs-pline{display:block;font-size:14px;font-weight:500;color:#3A4654;margin-top:3px}.tfs-rule{margin:12px 0 0;font-size:14px;color:#3A4654;font-weight:600}.tfs-add{border:1px solid #DDE2E8;border-radius:14px;padding:6px 16px 14px;margin:16px 0 0}.tfs-add legend{padding:0 6px;margin:0}.tfs-addrow{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #EEF0F3}.tfs-addrow:last-child{border-bottom:0}.tfs-addrow label{margin:0!important;flex:1 1 260px;font-weight:600!important}.tfs-addrow select{width:auto!important;flex:0 1 200px}.tfs-sub{padding:4px 0 10px 14px;border-left:3px solid #FFE0DB}.tfs-sub[hidden],.tfs select[hidden]{display:none}.tfs-ck{display:flex!important;gap:10px;align-items:flex-start}.tfs-ck input{margin-top:3px;width:18px;height:18px;accent-color:#FF5440;flex:none}.tfs-sms span{font-weight:500;font-size:12.5px;color:#5B6675;line-height:1.45}.tfs-sum{margin:16px 0 0;padding:14px 16px;background:#13202F;color:#fff;border-radius:12px}.tfs-sum>div{display:flex;justify-content:space-between;gap:12px;padding:3px 0;font-size:16px}.tfs-sum b{font-size:18px}.tfs-sum .tfs-fine,.tfs-sum .tfs-fine2{color:#C4CCD6;font-size:13px}.tfs-form{margin-top:18px;border-top:1px solid #EEF0F3;padding-top:6px}.tfs-form h3{font-size:18px;color:#13202F;margin:10px 0 0}.tfs-2{display:grid;gap:0 12px}@media(min-width:640px){.tfs-2{grid-template-columns:1fr 1fr}}.tfs-opt2{font-weight:500;color:#5B6675}.tfs-hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}.tfs-note{background:#FFF8F7;border:1px solid #FFD6CF;border-radius:12px;padding:14px 16px;color:#1C2430;font-size:15px}.tfs-done{text-align:center}.tfs-done h3{font-size:24px;color:#13202F;margin:8px 0}.tfs-done p{color:#3A4654}.tfs-done a{color:#E23E2B;font-weight:800}.tfs-chk{width:56px;height:56px;border-radius:50%;background:#1F9D55;color:#fff;font-size:30px;font-weight:800;display:flex;align-items:center;justify-content:center;margin:0 auto}.tfs-hero .tfl-w{display:grid;gap:28px;align-items:center}@media(min-width:960px){.tfs-hero .tfl-w{grid-template-columns:1.1fr .9fr;gap:44px}}.tfs-glance{background:#16283B;border:1px solid rgba(255,255,255,.16);border-radius:18px;overflow:hidden;box-shadow:0 18px 44px rgba(0,0,0,.28)}.tfs-art{display:block;width:100%;height:auto}.tfs-stats{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:rgba(255,255,255,.14);border-top:1px solid rgba(255,255,255,.14)}.tfs-stats div{background:#16283B;padding:14px 16px}.tfs-stats b{display:block;font-size:20px;font-weight:800;color:#fff;line-height:1.2}.tfs-stats span{display:block;font-size:13px;color:#C4CCD6;margin-top:3px;line-height:1.35}.tfs-meter{padding:14px 16px 16px;border-top:1px solid rgba(255,255,255,.14)}.tfs-meter span{display:block;font-size:14px;font-weight:800;color:#fff;margin-bottom:8px}.tfs-meter i{display:block;height:8px;border-radius:999px;background:rgba(255,255,255,.18);overflow:hidden}.tfs-meter i b{display:block;height:100%;min-width:8px;border-radius:999px;background:#FF5440}@media(max-width:959px){.tfs-art{display:none}.tfs-stats{border-top:0}}.tfs-pgrid{display:grid;gap:14px}@media(min-width:640px){.tfs-pgrid{grid-template-columns:1fr 1fr}}@media(min-width:1000px){.tfs-pgrid{grid-template-columns:repeat(4,1fr)}}.tfs-pc{background:#fff;border:1px solid #DDE2E8;border-radius:14px;padding:20px;display:flex;flex-direction:column}.tfs-pct{font-size:17px;font-weight:800;color:#13202F}.tfs-pcr{font-size:14px;color:#5B6675;margin-top:2px}.tfs-pcp{font-size:32px;font-weight:800;color:#13202F;margin-top:14px;line-height:1.1}.tfs-pcp small{font-size:14px;font-weight:600;color:#5B6675}.tfs-pcv{font-size:15px;font-weight:700;color:#3A4654;margin-top:6px}.tfs-pcs{margin-top:auto;padding-top:14px;font-size:13px;font-weight:700;color:#B3301F}.tfs-pcx{background:#13202F;border-color:#13202F}.tfs-pcx .tfs-pct,.tfs-pcx .tfs-pcp{color:#fff}.tfs-pcx .tfs-pcr{color:#C4CCD6}.tfs-pcx .tfs-pcv{color:#C4CCD6;font-weight:500;font-size:14px}.tfs-pcq{font-size:26px}.tfs-pca{margin-top:auto;padding-top:14px;color:#FF8A7A!important;font-weight:800;font-size:15px}.tfs-plist{margin:22px 0 0;padding:0 0 0 20px;color:#3A4654;font-size:15px;max-width:820px}.tfs-plist li{margin:6px 0}.tfs-pcta{margin:22px 0 0}.tfs-towns{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:8px}.tfs-towns li{background:#F2F4F7;border:1px solid #DDE2E8;border-radius:999px;padding:8px 14px;font-size:15px;font-weight:700;color:#13202F}.tfs-tnote{color:#5B6675;font-size:15px;margin:16px 0 0}.tfs-pm{margin-top:28px;background:#13202F;border-radius:16px;padding:24px;display:flex;flex-wrap:wrap;gap:16px 28px;align-items:center;justify-content:space-between}.tfs-pm h3{color:#fff;font-size:20px;font-weight:800;margin:0 0 6px}.tfs-pm p{color:#C4CCD6;margin:0;font-size:15px;max-width:560px}.tfs-pmb{display:flex;flex-wrap:wrap;gap:12px 18px;align-items:center}.tfs-pml{color:#fff!important;font-weight:800;text-decoration:underline!important}@media(max-width:640px){.tfs-card{padding:16px}.tfs-map{height:380px}.tfs-go{width:100%}.tfs-areabar .tfs-go{width:auto}.tfs-addrow select{flex:1 1 100%}.tfs-price{font-size:26px}}";
  var LOGO = "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20620%20160%22%20role%3D%22img%22%20aria-label%3D%22Team%20Forte%20Roofing%22%3E%3Cg%20fill%3D%22%23ff5147%22%3E%3Cpath%20d%3D%22M4%20116%20108%2012%20146%2050V28h28v50l32%2032v46h-28v-34L108%2052%2044%20116Z%22%2F%3E%3C%2Fg%3E%3Cg%20fill%3D%22%23fff%22%3E%3Cpath%20d%3D%22M83%20104h20v20H83zm26%200h20v20h-20zm-26%2026h20v20H83zm26%200h20v20h-20z%22%2F%3E%3Cdefs%3E%3Cpath%20id%3D%22T%22%20d%3D%22M0%200h48v12H31v48H17V12H0Z%22%2F%3E%3Cpath%20id%3D%22E%22%20d%3D%22M0%200h44v12H14v11h27v12H14v13h30v12H0Z%22%2F%3E%3Cpath%20id%3D%22A%22%20fill-rule%3D%22evenodd%22%20d%3D%22M0%2060%2020%200h17l20%2060H42l-4-13H18l-4%2013ZM22%2035h12l-6-20Z%22%2F%3E%3Cpath%20id%3D%22M%22%20d%3D%22M0%2060V0h14l18%2027L50%200h14v60H50V23L32%2049%2014%2023v37Z%22%2F%3E%3Cpath%20id%3D%22F%22%20d%3D%22M0%200h44v13H15v13h26v13H15v21H0Z%22%2F%3E%3Cpath%20id%3D%22O%22%20fill-rule%3D%22evenodd%22%20d%3D%22M28%200C9%200%200%2010%200%2030s9%2030%2028%2030%2028-10%2028-30S47%200%2028%200Zm0%2013c-9%200-13%205-13%2017s4%2017%2013%2017%2013-5%2013-17-4-17-13-17Z%22%2F%3E%3Cpath%20id%3D%22R%22%20fill-rule%3D%22evenodd%22%20d%3D%22M0%2060V0h28c17%200%2025%207%2025%2020%200%209-4%2015-12%2018l15%2022H38L25%2040H15v20ZM15%2012v16h12c7%200%2011-2%2011-8s-4-8-11-8Z%22%2F%3E%3C%2Fdefs%3E%3Cg%20transform%3D%22translate(220%2016)%20scale(.72)%22%3E%3Cuse%20href%3D%22%23T%22%2F%3E%3Cuse%20href%3D%22%23E%22%20x%3D%2262%22%2F%3E%3Cuse%20href%3D%22%23A%22%20x%3D%22121%22%2F%3E%3Cuse%20href%3D%22%23M%22%20x%3D%22192%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(220%2074)%20scale(1.32)%22%3E%3Cuse%20href%3D%22%23F%22%2F%3E%3Cuse%20href%3D%22%23O%22%20x%3D%2254%22%2F%3E%3Cuse%20href%3D%22%23R%22%20x%3D%22120%22%2F%3E%3Cuse%20href%3D%22%23T%22%20x%3D%22185%22%2F%3E%3Cuse%20href%3D%22%23E%22%20x%3D%22243%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E";
  var HEADER = "<div class=\"tfl-tick\">Snow removal<span>\u2022</span>Registered &amp; insured<span>\u2022</span>Serving Connecticut</div><header class=\"tfl-top\"><div class=\"tfl-bar\"><a class=\"tfl-logo\" href=\"/\" aria-label=\"Team Forte home\"><img src=\"%LOGO%\" alt=\"Team Forte\" width=\"186\" height=\"48\"></a><nav class=\"tfl-nav\" aria-label=\"Main\"><a href=\"/\">Roofing</a><div class=\"tfl-dd\"><button type=\"button\" aria-haspopup=\"true\" aria-expanded=\"false\">Home Improvement</button><div class=\"tfl-menu\"><a class=\"all\" href=\"/home-improvement\">All home improvement services</a><a href=\"/flooring\">Flooring</a><a href=\"/kitchens-cabinets\">Kitchens &amp; Cabinets</a><a href=\"/bathroom-shower-doors\">Bath &amp; Shower Doors</a><a href=\"/painting\">Painting</a><a href=\"/carpentry-closets\">Carpentry &amp; Closets</a><a href=\"/fences-decks-barns\">Fences, Decks &amp; Barns</a><a href=\"/handyman\">Handyman</a></div></div><a class=\"tfl-hi\" href=\"/home-improvement\">Home Improvement</a><a href=\"/gallery\">Gallery</a><a href=\"/contact\">Contact</a></nav><a class=\"tfl-phone\" href=\"tel:+18608549335\">\u260e (860) 854-9335</a></div></header>\n";
  var FOOTER = "<footer class=\"tfl-foot\"><div><span>\u00a9 2026 Team Forte \u00b7 GR Brothers LLC</span><span>Registered &amp; Insured \u00b7 CT HIC.0706595 \u00b7 Certificate of insurance on request</span><span>Based in Berlin, CT \u00b7 Serving all of Connecticut</span><a href=\"tel:+18608549335\">(860) 854-9335</a><a href=\"mailto:info@team-forte.com\">info@team-forte.com</a><a href=\"/contact\">Contact</a><span class=\"sp\"></span><a href=\"/privacy-policy\">Privacy Policy</a><a href=\"/terms-of-service\">Terms of Service</a></div></footer><div class=\"tfl-mbar\"><a href=\"tel:+18608549335\">\u260e Call</a><a class=\"q\" href=\"#quote\">Get my price</a></div>\n";
  /* ---------- settings ---------- */
  var EXEC = 'https://script.google.com/macros/s/AKfycbyQpxQSZqBBXYN7i14FAsy23bjOoIT_F8333zYMU2JdYRL_b22SXzdS-dlWZeVhkvxA/exec';
  /* ---------- region (set by build.py: central = team-forte.com/snow-removal, fairfield = team-forte.com/snow-removal-fairfield-county) ---------- */
  var REGION = ['fairfield', 'newhaven'].indexOf('central') >= 0 ? 'central' : 'central';
  var REGIONS = {
    central: {
      kicker: 'Central Connecticut', based: 'Based in Berlin, CT. This season our routes run through central Connecticut.', basedShort: 'We are based in Berlin, CT.',
      url: 'https://team-forte.com/snow-removal', area: 'Central Connecticut',
      center: { lat: 41.6215, lng: -72.7457 }, maxMiles: null, bias: { center: { lat: 41.60, lng: -72.70 }, radius: 50000 },
      towns: ['Berlin', 'Kensington', 'New Britain', 'Plainville', 'Southington', 'Meriden', 'Middletown', 'Cromwell', 'Rocky Hill', 'Newington', 'Wethersfield', 'Farmington', 'West Hartford', 'Bloomfield']
    },
    fairfield: {
      kicker: 'Fairfield County', based: 'Our Fairfield County routes are centered on Trumbull, CT and reach about 15 miles around it.', basedShort: 'Our Fairfield County routes are centered on Trumbull, CT.',
      url: 'https://team-forte.com/snow-removal-fairfield-county', area: 'Fairfield County',
      center: { lat: 41.2429, lng: -73.2007 }, maxMiles: 15, bias: { center: { lat: 41.2429, lng: -73.2007 }, radius: 30000 },
      towns: ['Trumbull', 'Bridgeport', 'Easton', 'Stratford', 'Monroe', 'Shelton', 'Milford', 'Fairfield', 'Derby', 'Orange', 'Ansonia', 'Weston', 'Redding', 'Westport', 'Seymour', 'Woodbridge', 'Wilton', 'Newtown', 'West Haven', 'Norwalk', 'Oxford', 'Bethel', 'New Haven']
    },
    newhaven: {
      kicker: 'New Haven County', based: 'Our New Haven County routes are centered on Wallingford, CT and reach about 15 miles around it.', basedShort: 'Our New Haven County routes are centered on Wallingford, CT.',
      url: 'https://team-forte.com/snow-removal-new-haven-county', area: 'New Haven County',
      center: { lat: 41.4570, lng: -72.8231 }, maxMiles: 15, bias: { center: { lat: 41.4570, lng: -72.8231 }, radius: 30000 },
      towns: ['Wallingford', 'North Haven', 'Cheshire', 'Meriden', 'Hamden', 'Middlefield', 'Durham', 'Prospect', 'North Branford', 'Bethany', 'Southington', 'Cromwell', 'Middletown', 'New Haven', 'Naugatuck', 'Berlin', 'Woodbridge', 'Branford', 'Beacon Falls', 'East Haven', 'Wolcott', 'Guilford', 'Waterbury', 'Seymour', 'West Haven', 'Killingworth']
    }
  }, RG = REGIONS[REGION];
  var SNOW = {
    // Google Maps key (project "Team Forte Quotes"; only works on team-forte.com)
    mapsKey: 'AIzaSyAuSuRZOOL2zEQHwk4OKxLPjD-Y45ilTS0',
    // GoHighLevel workflow "Snow Leads (website)", Inbound Webhook trigger URL. "" = leads are not sent.
    leadWebhook: 'https://services.leadconnectorhq.com/hooks/ySsyazNWRWtwaoThE5Ij/webhook-trigger/1651e5d3-af81-4552-9dd9-51c11aee88a2',
    season: 'December 1, 2026 to March 31, 2027',
    signupCloses: 'December 1',
    capTotal: 25,          // accounts this season (headline). null hides it.
    spotsLeft: null,       // set a number to show "X spots left"; null hides it
    exec: EXEC,            // Apps Script web app (config, sign-up, Stripe return)
    online: false,         // true once the server answered r=snowcfg
    seasonalOpen: true, canSign: false,
    triggerInches: 2,
    tiers: [
      { id: 'small', label: 'Small', max: 500, visit: 100, seasonal: 600 },
      { id: 'medium', label: 'Medium', max: 1000, visit: 125, seasonal: 750 },
      { id: 'large', label: 'Large', max: 1500, visit: 150, seasonal: 900 }
    ],
    perInch: 15, overInches: 6, storms: 8, taxRate: 0.0635,
    addons: { vehicle: 30, iceMelt: { small: 30, medium: 30, large: 45 }, walkway: 15 },
    // Service area: once the route towns are chosen, set maxMiles (straight line from Berlin, CT).
    // Addresses farther out get the waitlist instead of a price. null = all of Connecticut.
    serviceArea: { center: RG.center, maxMiles: RG.maxMiles },
    bias: RG.bias,
    // Towns named on the page and in the Google markup. Edit to match the routes.
    towns: RG.towns,
    secondPay: 'January 15, 2027'
  };
  var PHONE = '(860) 854-9335', TEL = 'tel:+18608549335';

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function $(id) { return document.getElementById(id); }
  function money(n) { return '$' + Math.round(n).toLocaleString('en-US'); }
  function sqft(n) { return Math.round(n).toLocaleString('en-US') + ' sq ft'; }
  function tierFor(area) { for (var i = 0; i < SNOW.tiers.length; i++) if (area <= SNOW.tiers[i].max) return SNOW.tiers[i]; return null; }
  function milesBetween(a, b) {
    var R = 3958.8, r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  function iceMeltPrice(t) { return t ? (SNOW.addons.iceMelt[t.id] || SNOW.addons.iceMelt.large) : 0; }

  /* ---------- page ---------- */
  var ICON = {
    drive: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11l9-7 9 7v9H3z"/><path d="M10 20v-5h4v5"/></svg>',
    blower: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2v20M4.9 7l14.2 10M4.9 17L19.1 7"/></svg>',
    ruler: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="8" width="18" height="8" rx="1"/><path d="M7 8v4M11 8v3M15 8v4M19 8v3"/></svg>',
    first: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>'
  };
  var FAQ = [
    ['When do you come?', 'We service your property after every storm that leaves 2 inches or more. Crews work by route, and seasonal customers are cleared first. We aim to finish within 12 hours after the snow stops for storms up to 12 inches, and within 24 hours for bigger storms. These are targets, not guarantees.'],
    ['What counts as one storm?', 'All the snow that falls until there is a break of 12 hours or more. The price is set by the total depth of that storm, however many trips the crew makes.'],
    ['How is the depth measured?', 'At your property, on an undisturbed flat surface, with a dated photo. Depth is rounded to the nearest inch. If no measurement is possible, we use the nearest National Weather Service report.'],
    ['Will my driveway be free of ice?', 'Clearing snow does not leave a surface ice-free. Melting, refreezing and drifting can put ice back after we leave. The ice melt add-on lowers the risk of ice, and you stay responsible for checking the property between visits.'],
    ['How does the seasonal plan work?', 'You pay the seasonal price in two parts: 50% when you sign and 50% on January 15, 2027. It covers the base price for up to 8 storms. Storms over 6 inches add the per-inch price, and storms after the 8th are charged at the per-visit price. The seasonal price is for a reserved spot on the route and is not reduced in a low-snow winter.'],
    ['How do I pay for per-visit service?', 'We save a card or bank account when you sign, and charge it after each storm is cleared. You get a receipt by email each time.'],
    ['Do you clear gravel driveways?', 'Yes. Snow blowers pick up loose stone, so on gravel we leave a thin layer of snow, and some stone movement is normal.'],
    ['When does service start?', 'After you sign, you have 3 business days to cancel. Service starts once that period ends, so sign up before the first storm.'],
    ['Is sales tax included?', 'No. Connecticut sales tax of 6.35% is added to every charge.']
  ];

  function capText() { return SNOW.capTotal ? 'Only ' + SNOW.capTotal + ' spots this season.' : 'A limited number of spots this season.'; }
  function isFull() { return SNOW.spotsLeft != null && SNOW.spotsLeft <= 0; }
  function urgentHtml() {
    var n = SNOW.spotsLeft, spots = n == null ? '' : '<span class="tfs-spots">' + (n <= 0 ? 'Season full, waitlist open' : esc(n) + (n === 1 ? ' spot left' : ' spots left')) + '</span>';
    return spots + 'Seasonal sign-up closes ' + esc(SNOW.signupCloses) + '.';
  }
  function taxPct() { return (SNOW.taxRate * 100).toFixed(2); }

  var ART = '<svg class="tfs-art" viewBox="0 0 440 250" role="img" aria-label="A house with a cleared driveway and walkway after a snowstorm">' +
    '<defs><linearGradient id="tfs-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0F1B29"/><stop offset="1" stop-color="#24405F"/></linearGradient></defs>' +
    '<rect width="440" height="250" fill="url(#tfs-sky)"/>' +
    '<g fill="#fff" opacity=".85"><circle cx="30" cy="28" r="1.6"/><circle cx="76" cy="62" r="1.2"/><circle cx="118" cy="22" r="1.4"/><circle cx="160" cy="48" r="1"/><circle cx="212" cy="18" r="1.6"/><circle cx="262" cy="40" r="1.2"/><circle cx="318" cy="24" r="1.5"/><circle cx="356" cy="58" r="1.1"/><circle cx="404" cy="30" r="1.6"/><circle cx="420" cy="84" r="1.2"/><circle cx="20" cy="96" r="1.2"/><circle cx="52" cy="120" r="1"/><circle cx="386" cy="112" r="1"/></g>' +
    '<path d="M0 168 Q110 142 220 160 T440 150 V250 H0Z" fill="#DCE6F0"/>' +
    '<g><path d="M22 168 l16 -40 16 40z" fill="#1F4A3D"/><path d="M27 150 l11 -30 11 30z" fill="#2A6352"/><path d="M30 131 l8 -11 8 11 -4 -2 -4 3 -4 -3z" fill="#fff"/><rect x="36" y="168" width="4" height="8" fill="#5B4636"/></g>' +
    '<g><path d="M388 160 l14 -36 14 36z" fill="#1F4A3D"/><path d="M392 144 l10 -27 10 27z" fill="#2A6352"/><path d="M395 126 l7 -9 7 9 -3.500 -2 -3.500 3 -3.500 -3z" fill="#fff"/><rect x="400" y="160" width="4" height="8" fill="#5B4636"/></g>' +
    '<rect x="96" y="104" width="150" height="70" fill="#F7F9FB"/><rect x="246" y="118" width="96" height="56" fill="#E9EEF3"/>' +
    '<path d="M84 108 L171 56 L258 108Z" fill="#13202F"/><path d="M84 108 L171 56 L258 108 L246 108 L171 66 L96 108Z" fill="#fff"/>' +
    '<path d="M238 122 L294 96 L350 122Z" fill="#13202F"/><path d="M238 122 L294 96 L350 122 L340 122 L294 103 L248 122Z" fill="#fff"/>' +
    '<rect x="196" y="78" width="14" height="22" fill="#13202F"/><rect x="194" y="74" width="18" height="5" fill="#fff"/>' +
    '<rect x="258" y="132" width="72" height="42" rx="2" fill="#C9D3DD"/><path d="M258 142h72M258 152h72M258 162h72" stroke="#AEBBC8" stroke-width="1.500"/>' +
    '<rect x="160" y="132" width="24" height="42" rx="2" fill="#FF5440"/><circle cx="179" cy="154" r="1.800" fill="#fff"/>' +
    '<rect x="112" y="124" width="30" height="26" rx="2" fill="#FFD9A0"/><path d="M127 124v26M112 137h30" stroke="#F7F9FB" stroke-width="2"/>' +
    '<rect x="200" y="124" width="30" height="26" rx="2" fill="#FFD9A0"/><path d="M215 124v26M200 137h30" stroke="#F7F9FB" stroke-width="2"/>' +
    '<path d="M258 174 H330 L372 250 H232Z" fill="#3A4654"/><path d="M160 174 H184 L196 204 L246 204 L242 216 L176 216Z" fill="#4A5868"/>' +
    '<path d="M330 174 L372 250 H392 Q384 214 344 172Z" fill="#fff"/><path d="M258 174 L232 250 H212 Q226 206 246 172Z" fill="#fff"/>' +
    '<g transform="translate(296 208)"><rect x="-13" y="-9" width="26" height="15" rx="3" fill="#FF5440"/><rect x="-17" y="2" width="34" height="7" rx="2" fill="#13202F"/><path d="M-11 -9 L-23 -27" stroke="#13202F" stroke-width="3" stroke-linecap="round"/><path d="M6 -9 v-9 h9" stroke="#FF5440" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="-8" cy="10" r="4.500" fill="#13202F"/><circle cx="8" cy="10" r="4.500" fill="#13202F"/></g>' +
    '<g fill="#fff"><circle cx="318" cy="186" r="2"/><circle cx="328" cy="178" r="2.400"/><circle cx="340" cy="172" r="2"/><circle cx="352" cy="170" r="2.600"/><circle cx="364" cy="174" r="2"/><circle cx="374" cy="182" r="2.400"/><circle cx="346" cy="180" r="1.500"/><circle cx="360" cy="184" r="1.500"/></g>' +
    '</svg>';

  function lowTier() { return SNOW.tiers[0] || { visit: 0, seasonal: 0 }; }
  function glanceHtml() {
    var n = SNOW.spotsLeft, cap = SNOW.capTotal, t = lowTier(), meter = '';
    if (n != null && cap) {
      var left = Math.max(0, Math.min(cap, n)), taken = cap - left, pct = Math.round(100 * taken / cap);
      if (taken > 0) meter = '<div class="tfs-meter"><span>' + (left <= 0 ? 'All ' + esc(cap) + ' spots taken. Waitlist open.' : esc(taken) + ' of ' + esc(cap) + ' spots taken') + '</span><i><b style="width:' + pct + '%"></b></i></div>';
    }
    return ART + '<div class="tfs-stats">' +
      '<div><b>From ' + money(t.seasonal) + '</b><span>Seasonal plan, up to ' + esc(SNOW.storms) + ' storms</span></div>' +
      '<div><b>From ' + money(t.visit) + '</b><span>Per visit, charged after each storm</span></div>' +
      '<div><b>' + esc(SNOW.triggerInches) + ' inches</b><span>We come after every storm this size or bigger</span></div>' +
      '<div><b>Dec 1 to Mar 31</b><span>One price for the whole season</span></div></div>' + meter;
  }
  function tierRange(i) {
    var t = SNOW.tiers[i], lo = i ? SNOW.tiers[i - 1].max + 1 : 0;
    return (lo ? lo.toLocaleString('en-US') + ' to ' : 'Up to ') + t.max.toLocaleString('en-US') + ' sq ft';
  }
  function pricesHtml() {
    var top = SNOW.tiers[SNOW.tiers.length - 1];
    return '<div class="tfs-pgrid">' + SNOW.tiers.map(function (t, i) {
      var save = t.visit * SNOW.storms - t.seasonal;
      return '<div class="tfs-pc"><span class="tfs-pct">' + esc(t.label) + ' driveway</span><span class="tfs-pcr">' + esc(tierRange(i)) + '</span>' +
        '<span class="tfs-pcp">' + money(t.seasonal) + ' <small>for the season</small></span>' +
        '<span class="tfs-pcv">or ' + money(t.visit) + ' per visit</span>' +
        (save > 0 ? '<span class="tfs-pcs">Seasonal saves up to ' + money(save) + ' over ' + esc(SNOW.storms) + ' storms</span>' : '') + '</div>';
    }).join('') +
      '<div class="tfs-pc tfs-pcx"><span class="tfs-pct">Bigger driveways and lots</span><span class="tfs-pcr">Over ' + (top ? top.max.toLocaleString('en-US') : '1,500') + ' sq ft</span>' +
        '<span class="tfs-pcp tfs-pcq">Custom price</span><span class="tfs-pcv">Shared driveways, rentals and small parking lots. We measure it and send your price.</span>' +
        '<a class="tfs-pca" href="' + TEL + '">Call ' + PHONE + '</a></div></div>' +
      '<ul class="tfs-plist">' +
        '<li>The seasonal plan covers the base price for up to ' + esc(SNOW.storms) + ' storms. You pay 50% when you sign and 50% on ' + esc(SNOW.secondPay) + '.</li>' +
        '<li>Storms over ' + esc(SNOW.overInches) + ' inches add ' + money(SNOW.perInch) + ' per extra inch, on either plan.</li>' +
        '<li>Per-visit customers pay after each storm is cleared. Seasonal customers are cleared first.</li>' +
        '<li>Prices are before ' + taxPct() + '% Connecticut sales tax.</li></ul>' +
      '<p class="tfs-pcta"><a class="tfl-btn" href="#quote">Get my exact price</a></p>';
  }
  function costAnswer() {
    var a = SNOW.tiers[0], b = SNOW.tiers[SNOW.tiers.length - 1];
    if (!a || !b) return 'Enter your address above to see your price.';
    return 'Per visit, from ' + money(a.visit) + ' for a small driveway (up to ' + a.max.toLocaleString('en-US') + ' sq ft) to ' + money(b.visit) + ' for a large one (up to ' + b.max.toLocaleString('en-US') + ' sq ft), for storms up to ' + SNOW.overInches + ' inches. The seasonal plan is ' + money(a.seasonal) + ' to ' + money(b.seasonal) + ' and covers up to ' + SNOW.storms + ' storms. Deeper storms add ' + money(SNOW.perInch) + ' per extra inch. Sales tax is added. Enter your address above to see the price for your driveway.';
  }
  function townsAnswer() {
    return RG.basedShort + ' This season our routes run through ' + SNOW.towns.slice(0, -1).join(', ') + ' and ' + SNOW.towns[SNOW.towns.length - 1] + '. Enter your address to check your home. Spots are limited, and when the season is full we open a waitlist.';
  }
  function faqList() {
    return [['How much does snow removal cost?', costAnswer()], ['Which towns do you serve?', townsAnswer()]].concat(FAQ);
  }
  function writeLd() {
    try {
      var a = SNOW.tiers[0], b = SNOW.tiers[SNOW.tiers.length - 1];
      var data = [
        { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqList().map(function (q) { return { '@type': 'Question', name: q[0], acceptedAnswer: { '@type': 'Answer', text: q[1] } }; }) },
        { '@context': 'https://schema.org', '@type': 'Service', name: 'Residential snow removal' + (REGION === 'fairfield' ? ' in Fairfield County' : ''), serviceType: 'Snow removal',
          description: 'Driveway, walkway and steps cleared with walk-behind snow blowers and shovels after every storm of ' + SNOW.triggerInches + ' inches or more. Seasonal and per-visit plans.',
          url: RG.url,
          provider: { '@type': 'HomeAndConstructionBusiness', name: 'Team Forte', url: 'https://team-forte.com', telephone: '+1-860-854-9335', areaServed: { '@type': 'State', name: 'Connecticut' } },
          areaServed: SNOW.towns.map(function (t) { return { '@type': 'City', name: t + ', CT' }; }),
          offers: a && b ? { '@type': 'AggregateOffer', priceCurrency: 'USD', lowPrice: a.visit, highPrice: b.seasonal, offerCount: SNOW.tiers.length * 2 } : undefined }
      ];
      var ld = document.getElementById('tfs-ld');
      if (!ld) { ld = document.createElement('script'); ld.type = 'application/ld+json'; ld.id = 'tfs-ld'; document.head.appendChild(ld); }
      ld.textContent = JSON.stringify(data);
    } catch (x) { /* optional */ }
  }
  function refreshInfo() {
    var g = $('tfs-glance'), pr = $('tfs-prices'), c = $('tfs-faq-cost'), tw = $('tfs-faq-towns');
    if (g) g.innerHTML = glanceHtml();
    if (pr) pr.innerHTML = pricesHtml();
    if (c) c.textContent = costAnswer();
    if (tw) tw.textContent = townsAnswer();
    writeLd();
  }

  function pageHtml() {
    return HEADER +
      '<section class="tfl-hero tfs-hero"><div class="tfl-w"><div class="tfs-htext"><p class="tfl-k">Snow removal \u00b7 ' + esc(RG.kicker) + '</p>' +
        '<h1>Your driveway, walkway and steps cleared every storm</h1>' +
        '<p class="lead" id="tfs-lead">' + esc(capText()) + ' Enter your address to see your price in under a minute.</p>' +
        '<div class="tfl-btns"><a class="tfl-btn" href="#quote">Get my price</a><a class="tfl-btn ghost" href="' + TEL + '">Call ' + PHONE + '</a></div>' +
        '<p class="tfs-urgent" id="tfs-urgent">' + urgentHtml() + '</p></div>' +
        '<div class="tfs-glance" id="tfs-glance">' + glanceHtml() + '</div></div></section>' +
      '<section class="tfl-trust"><div class="tfl-w">' +
        '<div><span class="tfl-ic">' + ICON.first + '</span><span>Seasonal customers cleared first every storm</span></div>' +
        '<div><span class="tfl-ic">' + ICON.blower + '</span><span>Snow blowers and shovels, no plow truck on your pavement</span></div>' +
        '<div><span class="tfl-ic">' + ICON.drive + '</span><span>Registered &amp; Insured \u00b7 CT HIC.0706595</span></div></div></section>' +
      '<section class="tfl-sec" id="quote"><div class="tfl-w"><h2>See your price</h2><p class="sub">Find your home, trace your driveway on the satellite photo, and pick a plan.</p>' +
        '<div id="tfs" class="tfs"></div></div></section>' +
      '<section class="tfl-sec alt" id="prices"><div class="tfl-w"><h2>Snow removal prices by driveway size</h2><p class="sub">Clear prices before you sign. Your address gives your exact size.</p><div id="tfs-prices">' + pricesHtml() + '</div></div></section>' +
      '<section class="tfl-sec"><div class="tfl-w"><h2>What is included</h2><p class="sub">Service at ' + SNOW.triggerInches + ' inches or more, all season from ' + esc(SNOW.season) + '.</p><div class="tfl-grid">' +
        [['Driveway, walkway and steps', 'The driveway you trace, one walkway to your main door, and the steps at that door.', ICON.drive],
         ['Snow blowers and shovels', 'Walk-behind snow blowers and shovels. No plow truck on your pavement.', ICON.blower],
         ['Every storm of 2 inches or more', 'We come after each storm that leaves ' + SNOW.triggerInches + ' inches or more, from December 1 to March 31.', ICON.ruler],
         ['Seasonal customers first', 'Seasonal plan customers are cleared first in every storm, then per-visit customers.', ICON.first]]
          .map(function (c) { return '<div class="tfl-card"><span class="tfl-ic">' + c[2] + '</span><h3>' + esc(c[0]) + '</h3><p>' + esc(c[1]) + '</p></div>'; }).join('') +
      '</div></div></section>' +
      '<section class="tfl-sec alt"><div class="tfl-w"><h2>How it works</h2><p class="sub">From your price to your first cleared storm.</p><ol class="tfl-steps">' +
        [['Get your price', 'Trace your driveway on the satellite photo and pick the seasonal plan or per visit.'],
         ['Sign your agreement', 'We send your agreement to sign and save a card. You have 3 business days to cancel.'],
         ['Mark your edges', 'Before the first snow, mark driveway and walkway edges and move anything snow can hide.'],
         ['We clear every storm', 'After each storm of 2 inches or more, with a dated photo of the depth at your property.']]
          .map(function (s) { return '<li><h3>' + esc(s[0]) + '</h3><p>' + esc(s[1]) + '</p></li>'; }).join('') +
      '</ol></div></section>' +
      '<section class="tfl-sec" id="area"><div class="tfl-w"><h2>Where we clear snow</h2><p class="sub">' + esc(RG.based) + '</p>' +
        '<ul class="tfs-towns">' + SNOW.towns.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' +
        '<p class="tfs-tnote">Enter your address above to check your home. Spots are limited, and when the season is full we open a waitlist.</p>' +
        '<div class="tfs-pm"><div><h3>Property managers and landlords</h3><p>Several rentals or buildings? Send us the addresses and we send back one price sheet for every property, seasonal and per visit.</p></div>' +
        '<div class="tfs-pmb"><a class="tfl-btn" href="' + TEL + '">Call ' + PHONE + '</a><a class="tfs-pml" href="mailto:info@team-forte.com?subject=Snow%20removal%20price%20sheet">Email your list</a></div></div>' +
      '</div></section>' +
      '<section class="tfl-sec alt"><div class="tfl-w tfl-faq"><h2>Questions we hear</h2><p class="sub">Straight answers before you sign up.</p>' +
        faqList().map(function (q, i) { return '<details' + (i === 0 ? ' open' : '') + '><summary>' + esc(q[0]) + '</summary><p' + (i === 0 ? ' id="tfs-faq-cost"' : i === 1 ? ' id="tfs-faq-towns"' : '') + '>' + esc(q[1]) + '</p></details>'; }).join('') +
      '</div></section>' + FOOTER;
  }

  /* ---------- quote tool ---------- */
  var st = { step: 'address', address: null, areas: [], tier: null, sqft: 0, manual: false, plan: 'seasonal', vehicles: 0, vAccess: 'start', vFreq: 'every', ice: false, iceFreq: 'every', walk: false, sent: false };
  var map = null, drawing = null, gm = null;

  function mapsReady() {
    if (window.google && google.maps && google.maps.importLibrary) return Promise.resolve();
    if (mapsReady.p) return mapsReady.p;
    mapsReady.p = new Promise(function (ok, bad) {
      window.__tfsMapsReady = function () { ok(); };
      var s = document.createElement('script');
      s.src = 'https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(SNOW.mapsKey) + '&v=weekly&loading=async&libraries=places,geometry&callback=__tfsMapsReady';
      s.async = true; s.onerror = function () { mapsReady.p = null; bad(new Error('maps-load')); };
      document.head.appendChild(s);
    });
    return mapsReady.p;
  }

  function draw() {
    var box = $('tfs'); if (!box) return;
    if (st.step === 'address') box.innerHTML = addressHtml();
    else if (st.step === 'measure') box.innerHTML = measureHtml();
    else if (st.step === 'manual') box.innerHTML = manualHtml();
    else if (st.step === 'price') box.innerHTML = priceHtml();
    else if (st.step === 'done') box.innerHTML = doneHtml();
    else if (st.step === 'sign') box.innerHTML = signHtml();
    else if (st.step === 'paid') box.innerHTML = paidHtml();
    wire();
  }

  function addressHtml() {
    return '<div class="tfs-card"><label for="tfs-addr" class="tfs-lab">Service address</label>' +
      '<div class="tfs-row"><div class="tfs-ac"><input id="tfs-addr" autocomplete="street-address" placeholder="Street, town" value="' + esc(st.address ? st.address.formatted : '') + '"><div id="tfs-sug" class="tfs-sug" role="listbox"></div></div>' +
      '<button type="button" id="tfs-find" class="tfs-go">Find my driveway</button></div><p id="tfs-err" class="tfs-err" role="alert"></p>' +
      '<p class="tfs-fine">Over 1,500 sq ft or a parking lot? Use the same steps and we will call you with a custom price.</p></div>';
  }

  function measureHtml() {
    return '<div class="tfs-card tfs-mapcard"><div class="tfs-maphead"><b>' + esc(st.address.formatted) + '</b><button type="button" class="tfs-link" id="tfs-back">Change address</button></div>' +
      '<p class="tfs-help" id="tfs-help">Tap each corner of your driveway on the photo. Tap the first point again (or press Finish shape) to close it. Leave out the walkway and steps: they are included.</p>' +
      '<div class="tfs-map" id="tfs-map"></div>' +
      '<div class="tfs-tools"><button type="button" id="tfs-undo">Undo point</button><button type="button" id="tfs-close">Finish shape</button><button type="button" id="tfs-more" hidden>Add another paved area</button><button type="button" id="tfs-clear">Start over</button></div>' +
      '<div class="tfs-areabar"><span>Measured: <b id="tfs-area">0 sq ft</b></span><button type="button" class="tfs-go" id="tfs-use" disabled>See my price</button></div>' +
      '<p class="tfs-fine"><button type="button" class="tfs-link" id="tfs-manualbtn">Can\'t see your driveway? Pick your size instead</button></p></div>';
  }

  function manualHtml() {
    var opts = [['small', '1 car or short driveway', 'up to 500 sq ft'], ['medium', '2 cars side by side', '501 to 1,000 sq ft'], ['large', '3 cars or a long driveway', '1,001 to 1,500 sq ft'], ['custom', 'Bigger, or a parking lot', 'over 1,500 sq ft, custom price']];
    return '<div class="tfs-card"><div class="tfs-maphead"><b>' + esc(st.address ? st.address.formatted : '') + '</b><button type="button" class="tfs-link" id="tfs-back">Change address</button></div>' +
      '<p class="tfs-help">Pick the size closest to your driveway. The crew confirms it on the first visit.</p><div class="tfs-pick">' +
      opts.map(function (o) { return '<button type="button" class="tfs-opt" data-size="' + o[0] + '"><b>' + esc(o[1]) + '</b><small>' + esc(o[2]) + '</small></button>'; }).join('') +
      '</div><p class="tfs-fine"><button type="button" class="tfs-link" id="tfs-tomap">Trace it on the satellite photo instead</button></p></div>';
  }

  function priceHtml() {
    var t = st.tier, sizeLine = st.manual ? (t ? t.label + ' driveway (your pick)' : 'Bigger driveway or parking lot (your pick)') : sqft(st.sqft) + (t ? ' \u00b7 ' + t.label + ' driveway' : ' \u00b7 custom size');
    var head = '<div class="tfs-maphead"><b>' + esc(st.address.formatted) + '</b><button type="button" class="tfs-link" id="tfs-remeasure">Change size</button></div>' +
      '<p class="tfs-size">Your driveway: <b>' + esc(sizeLine) + '</b></p>';
    if (outOfArea()) {
      return '<div class="tfs-card">' + head + '<div class="tfs-note">Your address is outside our snow routes this season. Send your details and we will put you on the waitlist and call you if a spot opens nearby.</div>' + contactHtml('Join the waitlist') + '</div>';
    }
    if (!t) {
      return '<div class="tfs-card">' + head + '<div class="tfs-note">Properties over 1,500 sq ft and parking lots get a custom price. Send your details and we will call you with one.</div>' + contactHtml('Request a custom price') + '</div>';
    }
    var save = t.visit * SNOW.storms - t.seasonal;
    if (SNOW.seasonalOpen === false) st.plan = 'visit';
    var plans = '<div class="tfs-plans" role="radiogroup" aria-label="Plan">' +
      (SNOW.seasonalOpen === false ? '' : '<label class="tfs-plan tfs-best' + (st.plan === 'seasonal' ? ' on' : '') + '"><input type="radio" name="tfs-plan" value="seasonal"' + (st.plan === 'seasonal' ? ' checked' : '') + '>' +
        '<span class="tfs-tag">Cleared first every storm</span><span class="tfs-pname">Seasonal plan</span>' +
        '<span class="tfs-price">' + money(t.seasonal) + ' <small>for the season</small></span>' +
        '<span class="tfs-pline">Covers ' + SNOW.storms + ' storms up to ' + SNOW.overInches + ' inches. Save up to ' + money(save) + '.</span>' +
        '<span class="tfs-pline">50% when you sign, 50% on January 15, 2027.</span></label>') +
      '<label class="tfs-plan' + (st.plan === 'visit' ? ' on' : '') + '"><input type="radio" name="tfs-plan" value="visit"' + (st.plan === 'visit' ? ' checked' : '') + '>' +
        '<span class="tfs-pname">Per visit</span><span class="tfs-price">' + money(t.visit) + ' <small>per storm</small></span>' +
        '<span class="tfs-pline">For storms up to ' + SNOW.overInches + ' inches, charged after each storm.</span></label></div>' +
      '<p class="tfs-rule">Storms over ' + SNOW.overInches + ' inches add ' + money(SNOW.perInch) + ' per inch. Prices before ' + taxPct() + '% Connecticut sales tax.</p>';
    var ice = iceMeltPrice(t);
    var addons = '<fieldset class="tfs-add"><legend>Add-ons, per storm</legend>' +
      '<div class="tfs-addrow"><label for="tfs-veh">Vehicle snow and ice clearing, ' + money(SNOW.addons.vehicle) + ' per vehicle</label>' +
        '<select id="tfs-veh">' + [0, 1, 2, 3, 4].map(function (n) { return '<option value="' + n + '"' + (st.vehicles === n ? ' selected' : '') + '>' + (n === 0 ? 'No vehicles' : n + (n === 1 ? ' vehicle' : ' vehicles')) + '</option>'; }).join('') + '</select></div>' +
      '<div class="tfs-sub" id="tfs-vehopts"' + (st.vehicles ? '' : ' hidden') + '>' +
        '<label for="tfs-vacc">How the crew gets in</label><select id="tfs-vacc">' +
          [['start', 'I start it (remote start or in person) when the crew arrives'], ['key', 'I leave a key for the crew'], ['outside', 'Outside only, no need to start it']].map(function (o) { return '<option value="' + o[0] + '"' + (st.vAccess === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>' +
        '<label for="tfs-vfreq">When</label><select id="tfs-vfreq"><option value="every"' + (st.vFreq === 'every' ? ' selected' : '') + '>Every storm</option><option value="request"' + (st.vFreq === 'request' ? ' selected' : '') + '>Only when I ask</option></select>' +
        '<p class="tfs-fine">The crew never drives or moves the vehicle and never starts one inside a garage.</p></div>' +
      '<div class="tfs-addrow"><label class="tfs-ck"><input type="checkbox" id="tfs-ice"' + (st.ice ? ' checked' : '') + '> Ice melt on driveway and walkway, ' + money(ice) + ' per application</label>' +
        '<select id="tfs-icefreq"' + (st.ice ? '' : ' hidden') + '><option value="every"' + (st.iceFreq === 'every' ? ' selected' : '') + '>Every storm</option><option value="request"' + (st.iceFreq === 'request' ? ' selected' : '') + '>Only when I ask</option></select></div>' +
      '<div class="tfs-addrow"><label class="tfs-ck"><input type="checkbox" id="tfs-walk"' + (st.walk ? ' checked' : '') + '> Extra walkway or second entry, ' + money(SNOW.addons.walkway) + '</label></div></fieldset>';
    if (isFull()) {
      return '<div class="tfs-card">' + head + '<div class="tfs-note">This season\'s spots are taken. Join the waitlist and we will call you if a spot opens.</div>' + plans + addons + '<div class="tfs-sum" id="tfs-sum">' + summaryHtml() + '</div>' + contactHtml('Join the waitlist') + '</div>';
    }
    return '<div class="tfs-card">' + head + plans + addons + '<div class="tfs-sum" id="tfs-sum">' + summaryHtml() + '</div>' + contactHtml('Reserve my spot') + '</div>';
  }

  function addonEach() {
    var t = st.tier, per = 0, list = [];
    if (st.vehicles) { per += st.vFreq === 'every' ? SNOW.addons.vehicle * st.vehicles : 0; list.push(st.vehicles + ' vehicle' + (st.vehicles > 1 ? 's' : '') + ' (' + (st.vFreq === 'every' ? 'every storm' : 'on request') + ', ' + ({ start: 'customer starts it', key: 'key left for crew', outside: 'outside only' })[st.vAccess] + ')'); }
    if (st.ice) { per += st.iceFreq === 'every' ? iceMeltPrice(t) : 0; list.push('Ice melt (' + (st.iceFreq === 'every' ? 'every storm' : 'on request') + ')'); }
    if (st.walk) { per += SNOW.addons.walkway; list.push('Extra walkway'); }
    return { per: per, list: list };
  }

  function summaryHtml() {
    var t = st.tier; if (!t) return '';
    var a = addonEach();
    var main = st.plan === 'seasonal' ? '<div><span>Seasonal plan</span><b>' + money(t.seasonal) + '</b></div><div class="tfs-fine2"><span>Due when you sign (50%)</span><span>' + money(t.seasonal / 2) + ' + tax</span></div>'
      : '<div><span>Per storm up to ' + SNOW.overInches + ' in</span><b>' + money(t.visit) + '</b></div>';
    var adds = a.per ? '<div><span>Add-ons every storm</span><b>+ ' + money(a.per) + '</b></div>' : '';
    var req = a.list.length && a.per === 0 ? '<div class="tfs-fine2"><span>Add-ons charged only when you ask</span></div>' : '';
    return main + adds + req + '<p class="tfs-fine">Plus ' + taxPct() + '% CT sales tax. Storms over ' + SNOW.overInches + ' in add ' + money(SNOW.perInch) + ' per inch.</p>';
  }

  function contactHtml(btn) {
    var wl = btn === 'Join the waitlist' && isFull();
    return '<form class="tfs-form" id="tfs-form" novalidate><h3>' + (wl ? 'Join the waitlist' : 'Your details') + '</h3>' +
      '<div class="tfs-2"><div><label for="tfs-name">Your name</label><input id="tfs-name" autocomplete="name"></div>' +
      '<div><label for="tfs-phone">Phone</label><input id="tfs-phone" type="tel" autocomplete="tel"></div></div>' +
      '<label for="tfs-email">Email</label><input id="tfs-email" type="email" autocomplete="email">' +
      '<label for="tfs-notes">About the property <span class="tfs-opt2">\u00b7 optional</span></label><textarea id="tfs-notes" maxlength="800" placeholder="Gravel or paved, steep spots, where snow can go, gate codes..."></textarea>' +
      '<label class="tfs-ck tfs-sms"><input type="checkbox" id="tfs-sms"><span>By checking this box, I consent to receive text messages from Team Forte about my snow service, storm updates and billing. Message frequency varies. Message &amp; data rates may apply. Text HELP for help, reply STOP to opt out.</span></label>' +
      '<div class="tfs-hp" aria-hidden="true"><label>Leave empty<input id="tfs-web" tabindex="-1" autocomplete="off"></label></div>' +
      '<button type="submit" class="tfs-go tfs-wide" id="tfs-send">' + esc(btn) + '</button><p id="tfs-ferr" class="tfs-err" role="alert"></p>' +
      '<p class="tfs-fine">' + (wl ? 'We will call you if a spot opens. You pay nothing to join the waitlist.' : SNOW.online && SNOW.canSign && !outOfArea() && st.tier ? 'Next you review and sign your agreement and add a card. You have 3 business days to cancel, and service starts after that period.' : 'Next we send your agreement to sign and save a card. You have 3 business days to cancel, and service starts after that period.') + '</p></form>';
  }

  function doneHtml() {
    var where = esc(st.address ? st.address.street || st.address.formatted : 'your property'), body;
    if (st.doneKind === 'waitlist') body = 'You\'re on the waitlist for ' + where + '. We will call you if a spot opens. You do not owe anything.';
    else if (st.doneKind === 'email') body = 'We got your request for ' + where + '. We\'ll email your agreement to sign. Service starts after the 3-business-day cancellation period.';
    else body = 'We got your request for ' + where + '. We will text or email your agreement to sign. Service starts after the 3-business-day cancellation period.';
    return '<div class="tfs-card tfs-done"><div class="tfs-chk">\u2713</div><h3>' + (st.doneKind === 'waitlist' ? 'You\'re on the waitlist' : 'Thanks, ' + esc(st.first || 'neighbor') + '!') + '</h3>' +
      '<p>' + body + '</p>' +
      '<p>Questions? Call <a href="' + TEL + '">' + PHONE + '</a>.</p></div>';
  }

  /* ---------- server (Apps Script): config, sign-up, Stripe return ---------- */
  function jsonp(params, ms) {
    return new Promise(function (ok, bad) {
      var cb = '__tfsJ' + Math.random().toString(36).slice(2), s = document.createElement('script'), done = false;
      function fin(v, e) { if (done) return; done = true; clearTimeout(tm); try { delete window[cb]; } catch (x) { window[cb] = undefined; } if (s.parentNode) s.parentNode.removeChild(s); if (e) bad(e); else ok(v); }
      var tm = setTimeout(function () { fin(null, new Error('timeout')); }, ms);
      window[cb] = function (v) { fin(v); };
      s.onerror = function () { fin(null, new Error('load')); };
      s.async = true;
      s.src = SNOW.exec + '?' + Object.keys(params).map(function (k) { return k + '=' + encodeURIComponent(params[k]); }).join('&') + '&callback=' + cb;
      document.head.appendChild(s);
    });
  }
  function postSnow(body, ms) {
    var ctl = window.AbortController ? new AbortController() : null, tm = ctl ? setTimeout(function () { ctl.abort(); }, ms) : 0;
    return fetch(SNOW.exec + '?r=snow', { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body), signal: ctl ? ctl.signal : undefined })
      .then(function (r) { return r.json(); }).then(function (j) { clearTimeout(tm); return j; }, function (e) { clearTimeout(tm); throw e; });
  }
  function loadConfig() {
    jsonp({ r: 'snowcfg', region: REGION }, 4000).then(function (c) {
      if (!c || c.ok === false) throw new Error('cfg');
      var okTiers = Array.isArray(c.tiers) && c.tiers.length && c.tiers.every(function (t) { return t && t.id && t.max > 0 && t.visit > 0 && t.seasonal > 0; });
      if (okTiers) SNOW.tiers = c.tiers.map(function (t) { return { id: t.id, label: t.label || t.id, max: +t.max, visit: +t.visit, seasonal: +t.seasonal }; });
      ['perInch', 'overInches', 'storms', 'taxRate'].forEach(function (k) { if (typeof c[k] === 'number' && c[k] >= 0) SNOW[k] = c[k]; });
      if (c.addons && typeof c.addons === 'object' && c.addons.iceMelt) SNOW.addons = c.addons;
      if (c.cap != null) SNOW.capTotal = c.cap;
      if (c.spotsLeft !== undefined) SNOW.spotsLeft = c.spotsLeft;
      if (c.signupCloses) SNOW.signupCloses = String(c.signupCloses);
      if (c.seasonalOpen !== undefined) SNOW.seasonalOpen = c.seasonalOpen !== false;
      SNOW.canSign = !!c.canSign; SNOW.online = true;
      var u = $('tfs-urgent'), l = $('tfs-lead'); if (u) u.innerHTML = urgentHtml(); if (l) l.textContent = capText() + ' Enter your address to see your price in under a minute.';
      refreshInfo();
      var nm = $('tfs-name');
      if (st.step === 'address' || st.step === 'manual' || (st.step === 'price' && !(nm && (nm.value || $('tfs-email').value || $('tfs-phone').value)))) draw();
    }).catch(function () { SNOW.online = false; });
  }
  function newCid() {
    var c = '';
    try { c = sessionStorage.getItem('tfs-cid') || ''; } catch (x) { c = ''; }
    if (!c) {
      try { c = crypto.randomUUID(); } catch (x) { c = 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 12); }
      try { sessionStorage.setItem('tfs-cid', c); } catch (x) { /* optional */ }
    }
    return c;
  }
  function cents(c) { return '$' + (c / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function prettyDate(v) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v || ''));
    return m ? MONTHS[+m[2] - 1] + ' ' + (+m[3]) + ', ' + m[1] : String(v || '');
  }
  function addonsObj() {
    return { vehicles: st.vehicles, vehicleMode: st.vFreq, vehicleAccess: st.vAccess, keyAt: '', ice: st.ice, iceMode: st.iceFreq, walkway: st.walk };
  }

  /* ---------- review and sign ---------- */
  function signHtml() {
    var q = (st.srv && st.srv.quote) || {}, seasonal = st.plan === 'seasonal', rows;
    if (seasonal) {
      var tot = q.seasonalTotalCents != null ? q.seasonalTotalCents : (q.dueNowCents || 0) + (q.laterCents || 0);
      rows = '<div><span>Seasonal plan, with tax</span><b>' + cents(tot) + '</b></div>' +
        '<div class="tfs-fine2"><span>Due now (card)</span><span>' + cents(q.dueNowCents || 0) + '</span></div>' +
        '<div class="tfs-fine2"><span>Due January 15, 2027</span><span>' + cents(q.laterCents || 0) + '</span></div>';
    } else {
      rows = '<div><span>Per storm up to ' + SNOW.overInches + ' in, with tax</span><b>' + (q.everyStormCents != null ? cents(q.everyStormCents) : '') + '</b></div>' +
        '<div class="tfs-fine2"><span>Due now</span><span>' + cents(q.dueNowCents || 0) + '</span></div>' +
        '<div class="tfs-fine2"><span>We save your card and charge it after each storm.</span></div>';
    }
    var link = SNOW.exec + '?r=snowcontract&id=' + encodeURIComponent(st.srv.id) + '&k=' + encodeURIComponent(st.srv.k) + '&plan=' + encodeURIComponent(st.plan) + '&adds=' + encodeURIComponent(JSON.stringify(addonsObj()));
    return '<div class="tfs-card"><div class="tfs-maphead"><b>Review and sign</b><span>' + esc(st.address.formatted) + '</span></div>' +
      '<div class="tfs-sum">' + rows + '<p class="tfs-fine">' + (seasonal ? 'Covers ' + SNOW.storms + ' storms up to ' + SNOW.overInches + ' inches. ' : '') + 'Storms over ' + SNOW.overInches + ' in add ' + money(SNOW.perInch) + ' per inch, plus tax.</p></div>' +
      '<p class="tfs-fine"><a href="' + esc(link) + '" target="_blank" rel="noopener">Read the full agreement</a></p>' +
      '<label class="tfs-ck tfs-agree"><input type="checkbox" id="tfs-agree"><span>I have read the agreement and the Notice of Cancellation</span></label>' +
      '<label for="tfs-sname">Type your full name</label><input id="tfs-sname" autocomplete="name" value="' + esc(st.fullName || '') + '">' +
      '<label for="tfs-sig">Sign with your finger or mouse</label><div class="tfs-sigwrap"><canvas id="tfs-sig" class="tfs-sig" height="150" aria-label="Signature"></canvas></div>' +
      '<p class="tfs-fine"><button type="button" class="tfs-link" id="tfs-sigclear">Clear signature</button></p>' +
      '<button type="button" class="tfs-go tfs-wide" id="tfs-signgo">' + (st.signed ? 'Add my card' : 'Sign and add my card') + '</button><p id="tfs-serr" class="tfs-err" role="alert"></p>' +
      '<p class="tfs-fine">You have 3 business days to cancel. Service starts after that period. Your card is charged on the secure Stripe page.</p></div>';
  }

  function wireSign() {
    var cv = $('tfs-sig'), ctx, drawing = false, ink = 0, last = null;
    function size() { var w = cv.clientWidth || 300, r = window.devicePixelRatio || 1; cv.width = Math.round(w * r); cv.height = Math.round(150 * r); ctx = cv.getContext('2d'); ctx.scale(r, r); ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#13202F'; }
    size(); st.sigInk = 0;
    function pt(e) { var b = cv.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; }
    cv.addEventListener('pointerdown', function (e) { drawing = true; last = pt(e); try { cv.setPointerCapture(e.pointerId); } catch (x) { /* optional */ } ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(last.x + 0.1, last.y); ctx.stroke(); e.preventDefault(); });
    cv.addEventListener('pointermove', function (e) { if (!drawing) return; var p = pt(e); ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke(); ink += Math.abs(p.x - last.x) + Math.abs(p.y - last.y); last = p; st.sigInk = ink; e.preventDefault(); });
    function up() { drawing = false; }
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up); cv.addEventListener('pointerleave', up);
    $('tfs-sigclear').onclick = function () { ctx.clearRect(0, 0, cv.width, cv.height); ink = 0; st.sigInk = 0; };
    $('tfs-signgo').onclick = function () { doSign(cv); };
  }

  async function doSign(cv) {
    var err = $('tfs-serr'), btn = $('tfs-signgo'); err.textContent = '';
    if (!st.signed) {
      var nm = $('tfs-sname').value.trim();
      if (!$('tfs-agree').checked) { err.textContent = 'Please check the box to confirm you read the agreement and the Notice of Cancellation.'; return; }
      if (nm.split(/\s+/).length < 2 || nm.length < 4) { err.textContent = 'Please type your first and last name.'; return; }
      if (!st.sigInk || st.sigInk < 20) { err.textContent = 'Please sign in the box.'; return; }
      st.fullName = nm;
    }
    btn.disabled = true; btn.textContent = 'Saving\u2026';
    try {
      if (!st.signed) {
        var q = st.srv.quote || {};
        var r = await postSnow({ action: 'sign', id: st.srv.id, k: st.srv.k, plan: st.plan, addons: addonsObj(), name: st.fullName, agree: true, signature: cv.toDataURL('image/png'), total: q.dueNowCents }, 20000);
        if (!r || !r.ok) { err.textContent = (r && r.error) || 'We could not save your signature. Please try again, or call ' + PHONE + '.'; btn.disabled = false; btn.textContent = 'Sign and add my card'; return; }
        st.signed = true; st.dates = r;
      }
      await goCheckout(st.srv.id, st.srv.k);
    } catch (x) {
      console.warn('[TFS] sign', x);
      err.textContent = st.signed ? 'Your agreement is signed, but we could not open the card page. Press the button to try again, or call ' + PHONE + '.' : 'We could not reach our server. Please try again, or call ' + PHONE + '.';
      btn.disabled = false; btn.textContent = st.signed ? 'Add my card' : 'Sign and add my card';
    }
  }
  async function goCheckout(id, k) {
    var c = await postSnow({ action: 'checkout', id: id, k: k }, 20000);
    if (!c || !c.ok || !c.url) throw new Error((c && c.error) || 'checkout');
    location.href = c.url;
  }

  /* ---------- return from Stripe ---------- */
  function paidHtml() {
    var p = st.paid || {};
    if (p.state === 'checking') return '<div class="tfs-card tfs-done"><h3>Checking your card\u2026</h3><p>One moment.</p></div>';
    if (p.state === 'ok') {
      return '<div class="tfs-card tfs-done"><div class="tfs-chk">\u2713</div><h3>You\'re set</h3>' +
        '<p>Your agreement is signed and your card is saved. We emailed you a copy.</p>' +
        (p.cancelBy ? '<p>You can cancel until <b>' + esc(prettyDate(p.cancelBy)) + '</b> with the Notice of Cancellation.</p>' : '') +
        (p.serviceFrom ? '<p>Service starts <b>' + esc(prettyDate(p.serviceFrom)) + '</b>. Before the first snow, mark your driveway and walkway edges.</p>' : '') +
        '<p>Questions? Call <a href="' + TEL + '">' + PHONE + '</a>.</p></div>';
    }
    return '<div class="tfs-card tfs-done"><h3>Your card wasn\'t saved yet</h3>' +
      '<p>Your agreement is signed, but we have not received your card. Add it now to finish.</p>' +
      '<button type="button" class="tfs-go" id="tfs-again">Add my card</button><p id="tfs-perr" class="tfs-err" role="alert"></p>' +
      '<p>Questions? Call <a href="' + TEL + '">' + PHONE + '</a>.</p></div>';
  }
  function wirePaid() {
    var b = $('tfs-again'); if (!b) return;
    b.onclick = async function () {
      b.disabled = true; b.textContent = 'One moment\u2026'; $('tfs-perr').textContent = '';
      try { await goCheckout(st.paid.id, st.paid.k); }
      catch (x) { b.disabled = false; b.textContent = 'Add my card'; $('tfs-perr').textContent = (x && x.message && x.message !== 'checkout' && x.message !== 'Failed to fetch' ? x.message : 'We could not open the card page. Please try again, or call ' + PHONE + '.'); }
    };
  }
  function checkReturn() {
    var pm = /[?&]snowpaid=(cs_[A-Za-z0-9_]+)/.exec(location.search || ''), hm = /snow=([^.&]+)\.([^&]+)/.exec(location.hash || '');
    if (!hm) return;
    var id = decodeURIComponent(hm[1]), k = decodeURIComponent(hm[2]);
    st.paid = { state: pm ? 'checking' : 'again', id: id, k: k }; st.step = 'paid';
    if (!pm) return;
    jsonp({ r: 'snowpaid', id: id, k: k, session: pm[1] }, 12000).then(function (r) {
      st.paid = r && r.ok && (r.status === 'active' || r.status === 'paid') ? { state: 'ok', id: id, k: k, cancelBy: r.cancelBy, serviceFrom: r.serviceFrom } : { state: 'again', id: id, k: k };
    }, function () { st.paid = { state: 'again', id: id, k: k }; }).then(function () { draw(); });
  }

  function outOfArea() {
    var sa = SNOW.serviceArea; if (!sa || !sa.maxMiles || !st.address || st.address.lat == null) return false;
    return milesBetween(sa.center, { lat: st.address.lat, lng: st.address.lng }) > sa.maxMiles;
  }

  /* ---------- wiring ---------- */
  function wire() {
    var b;
    if (st.step === 'address') wireAddress();
    if ((b = $('tfs-back'))) b.onclick = function () { cleanupMap(); st.step = 'address'; draw(); };
    if (st.step === 'measure') wireMeasure();
    if (st.step === 'manual') {
      Array.prototype.forEach.call(document.querySelectorAll('.tfs-opt'), function (o) {
        o.onclick = function () {
          var id = o.getAttribute('data-size'); st.manual = true; st.areas = [];
          st.tier = null; SNOW.tiers.forEach(function (t) { if (t.id === id) st.tier = t; });
          st.sqft = 0; st.step = 'price'; draw(); scrollToTool();
        };
      });
      if ((b = $('tfs-tomap'))) b.onclick = function () { st.step = 'measure'; draw(); };
    }
    if (st.step === 'price') wirePrice();
    if (st.step === 'sign') wireSign();
    if (st.step === 'paid') wirePaid();
  }

  function wireAddress() {
    var inp = $('tfs-addr'), sug = $('tfs-sug'), err = $('tfs-err'), list = [], pick = null, tok = null, timer = 0, idx = -1;
    function show() {
      sug.innerHTML = list.map(function (s, i) { return '<button type="button" role="option" class="' + (i === idx ? 'on' : '') + '" data-i="' + i + '">' + esc(s.text) + '</button>'; }).join('');
      sug.style.display = list.length ? 'block' : 'none';
    }
    async function suggest(q) {
      if (q.trim().length < 4) { list = []; show(); return; }
      try {
        await mapsReady();
        var P = await google.maps.importLibrary('places');
        tok = tok || new P.AutocompleteSessionToken();
        var r = await P.AutocompleteSuggestion.fetchAutocompleteSuggestions({ input: q, sessionToken: tok, includedRegionCodes: ['us'], locationBias: SNOW.bias, includedPrimaryTypes: ['street_address', 'premise', 'subpremise'] });
        list = (r.suggestions || []).filter(function (s) { return s.placePrediction; }).slice(0, 5).map(function (s) { return { text: s.placePrediction.text.toString(), pred: s.placePrediction }; });
        idx = -1; show();
      } catch (e) { console.warn('[TFS] suggest', e); }
    }
    inp.addEventListener('input', function () { pick = null; clearTimeout(timer); timer = setTimeout(function () { suggest(inp.value); }, 220); });
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' && list.length) { idx = (idx + 1) % list.length; show(); e.preventDefault(); }
      else if (e.key === 'ArrowUp' && list.length) { idx = (idx - 1 + list.length) % list.length; show(); e.preventDefault(); }
      else if (e.key === 'Enter') { e.preventDefault(); if (idx >= 0) choose(idx); else go(); }
    });
    inp.addEventListener('blur', function () { setTimeout(function () { list = []; show(); }, 180); });
    sug.addEventListener('mousedown', function (e) { var t = e.target.closest('button[data-i]'); if (t) { e.preventDefault(); choose(+t.getAttribute('data-i')); } });
    function choose(i) { pick = list[i]; inp.value = pick.text; list = []; show(); go(); }
    $('tfs-find').onclick = go;
    async function go() {
      err.textContent = '';
      var q = inp.value.trim();
      if (q.length < 6) { err.textContent = 'Please enter your full street address with the town.'; return; }
      var btn = $('tfs-find'); btn.disabled = true; btn.textContent = 'Finding your home\u2026';
      try {
        await mapsReady();
        var P = await google.maps.importLibrary('places'), place;
        if (pick) { place = pick.pred.toPlace(); await place.fetchFields({ fields: ['formattedAddress', 'location', 'addressComponents'] }); }
        else {
          var r = await P.Place.searchByText({ textQuery: q, fields: ['formattedAddress', 'location', 'addressComponents'], maxResultCount: 1, region: 'us', locationBias: SNOW.bias });
          place = r && r.places && r.places[0];
          if (place) {
            var fa = String(place.formattedAddress || ''), town = (fa.split(',')[1] || '').trim().toLowerCase(), lq = q.toLowerCase(), zip = (fa.match(/\b\d{5}\b/) || [''])[0];
            if (!((town && lq.indexOf(town) >= 0) || (zip && lq.indexOf(zip) >= 0))) throw new Error('need-town');
          }
        }
        if (!place || !place.location) throw new Error('not-found');
        st.address = parseAddr(place);
        if (st.address.state && st.address.state !== 'CT') { err.textContent = 'We clear snow in Connecticut only.'; btn.disabled = false; btn.textContent = 'Find my driveway'; return; }
        st.areas = []; st.manual = false; st.step = 'measure'; draw(); scrollToTool();
      } catch (e) {
        console.warn('[TFS] find', e);
        btn.disabled = false; btn.textContent = 'Find my driveway';
        if (e && e.message === 'need-town') err.textContent = 'Please add the town to your address.';
        else if (e && e.message === 'maps-load') { st.address = { formatted: q, street: q.split(',')[0], city: '', state: '', postal: '', lat: null, lng: null }; st.step = 'manual'; draw(); }
        else err.textContent = 'We could not find that address. Check the spelling and add the town.';
      }
    }
  }

  function parseAddr(p) {
    var c = p.addressComponents || [], g = function (t, s) { var x = c.find(function (k) { return k.types.indexOf(t) >= 0; }); return x ? (s ? x.shortText : x.longText) : ''; };
    var num = g('street_number'), route = g('route');
    return { formatted: String(p.formattedAddress || '').replace(/, USA$/, ''), street: (num + ' ' + route).trim(), city: g('locality') || g('postal_town') || g('sublocality'), state: g('administrative_area_level_1', true), postal: g('postal_code'), lat: p.location.lat(), lng: p.location.lng() };
  }

  function cleanupMap() { if (drawing) { drawing.markers.forEach(function (m) { m.setMap(null); }); if (drawing.line) drawing.line.setMap(null); } drawing = null; }

  function wireMeasure() {
    var el = $('tfs-map');
    $('tfs-manualbtn').onclick = function () { cleanupMap(); st.step = 'manual'; draw(); };
    mapsReady().then(async function () {
      var M = await google.maps.importLibrary('maps'); await google.maps.importLibrary('geometry');
      gm = google.maps;
      map = new M.Map(el, { center: { lat: st.address.lat, lng: st.address.lng }, zoom: 20, mapTypeId: 'satellite', tilt: 0, heading: 0, rotateControl: false, streetViewControl: false, mapTypeControl: false, fullscreenControl: false, clickableIcons: false, gestureHandling: 'greedy', draggableCursor: 'crosshair' });
      // Areas already traced (coming back from the price screen) are redrawn as editable shapes
      var old = st.areas; st.areas = [];
      old.forEach(function (a) { addPolygon(a.path); });
      startShape();
      map.addListener('click', function (e) { if (drawing) addPoint(e.latLng); });
      $('tfs-undo').onclick = undo; $('tfs-close').onclick = closeShape; $('tfs-clear').onclick = clearAll;
      $('tfs-more').onclick = function () { startShape(); refresh(); };
      $('tfs-use').onclick = useArea;
      refresh();
    }).catch(function () { st.step = 'manual'; draw(); });
  }

  function startShape() { cleanupMap(); drawing = { pts: [], markers: [], line: new gm.Polyline({ map: map, path: [], strokeColor: '#FF5440', strokeWeight: 3, clickable: false }) }; }
  function addPoint(ll) {
    var first = drawing.pts[0];
    if (first && drawing.pts.length >= 3 && gm.geometry.spherical.computeDistanceBetween(first, ll) < 1.2) { closeShape(); return; }
    drawing.pts.push(ll); drawing.line.setPath(drawing.pts);
    var mk = new gm.Marker({ map: map, position: ll, clickable: drawing.pts.length === 1, icon: { path: gm.SymbolPath.CIRCLE, scale: drawing.pts.length === 1 ? 7 : 5, fillColor: '#fff', fillOpacity: 1, strokeColor: '#FF5440', strokeWeight: 3 } });
    if (drawing.pts.length === 1) mk.addListener('click', function () { closeShape(); });
    drawing.markers.push(mk); refresh();
  }
  function undo() {
    if (drawing && drawing.pts.length) { drawing.pts.pop(); var m = drawing.markers.pop(); m.setMap(null); drawing.line.setPath(drawing.pts); }
    else if (st.areas.length) { var a = st.areas.pop(); a.poly.setMap(null); startShape(); }
    refresh();
  }
  function closeShape() {
    if (!drawing || drawing.pts.length < 3) { $('tfs-help').textContent = 'Tap at least 3 corners of your driveway, then finish the shape.'; return; }
    var path = drawing.pts.slice(); cleanupMap(); addPolygon(path); refresh();
  }
  function addPolygon(path) {
    var poly = new gm.Polygon({ map: map, paths: path, editable: true, strokeColor: '#FF5440', strokeWeight: 3, fillColor: '#FF5440', fillOpacity: 0.28 });
    var a = { poly: poly, path: path };
    var upd = function () { a.path = poly.getPath().getArray(); refresh(); };
    ['set_at', 'insert_at', 'remove_at'].forEach(function (ev) { poly.getPath().addListener(ev, upd); });
    st.areas.push(a);
  }
  function clearAll() { st.areas.forEach(function (a) { a.poly.setMap(null); }); st.areas = []; startShape(); refresh(); }
  function totalArea() {
    var m2 = 0; st.areas.forEach(function (a) { m2 += gm.geometry.spherical.computeArea(a.path); });
    return m2 * 10.7639;
  }
  function refresh() {
    var area = totalArea(), open = drawing && drawing.pts.length;
    $('tfs-area').textContent = sqft(area) + (st.areas.length > 1 ? ' (' + st.areas.length + ' areas)' : '');
    $('tfs-use').disabled = !(st.areas.length && area >= 50);
    $('tfs-close').hidden = !drawing;
    $('tfs-more').hidden = !!drawing || !st.areas.length;
    $('tfs-undo').disabled = !open && !st.areas.length;
    $('tfs-help').textContent = drawing
      ? (open ? 'Keep tapping corners. Tap the first point again, or press Finish shape, to close it.' : (st.areas.length ? 'Tap the corners of the next paved area, or press See my price.' : 'Tap each corner of your driveway on the photo. Tap the first point again (or press Finish shape) to close it. Leave out the walkway and steps: they are included.'))
      : 'Drag the white dots to fine-tune the shape. Add another paved area, or press See my price.';
  }
  function useArea() {
    st.sqft = totalArea(); st.tier = tierFor(st.sqft); st.manual = false;
    st.areas = st.areas.map(function (a) { return { path: a.path, poly: a.poly }; });
    cleanupMap(); st.step = 'price'; draw(); scrollToTool();
  }

  function wirePrice() {
    var b;
    if ((b = $('tfs-remeasure'))) b.onclick = function () { st.step = st.manual ? 'manual' : 'measure'; draw(); };
    Array.prototype.forEach.call(document.querySelectorAll('input[name="tfs-plan"]'), function (r) {
      r.onchange = function () { st.plan = r.value; Array.prototype.forEach.call(document.querySelectorAll('.tfs-plan'), function (l) { l.classList.toggle('on', l.querySelector('input').checked); }); sum(); };
    });
    var veh = $('tfs-veh');
    if (veh) {
      veh.onchange = function () { st.vehicles = +veh.value; $('tfs-vehopts').hidden = !st.vehicles; sum(); };
      $('tfs-vacc').onchange = function () { st.vAccess = this.value; sum(); };
      $('tfs-vfreq').onchange = function () { st.vFreq = this.value; sum(); };
      $('tfs-ice').onchange = function () { st.ice = this.checked; $('tfs-icefreq').hidden = !st.ice; sum(); };
      $('tfs-icefreq').onchange = function () { st.iceFreq = this.value; sum(); };
      $('tfs-walk').onchange = function () { st.walk = this.checked; sum(); };
    }
    $('tfs-form').onsubmit = submit;
  }
  function sum() { var s = $('tfs-sum'); if (s) s.innerHTML = summaryHtml(); }

  function quoteSummary() {
    var t = st.tier, a = addonEach(), parts = [];
    parts.push('Address: ' + st.address.formatted);
    parts.push('Driveway: ' + (st.manual ? 'customer picked ' + (t ? t.label : 'custom/over 1,500 sq ft') : sqft(st.sqft) + ' traced on satellite (' + st.areas.length + ' area' + (st.areas.length > 1 ? 's' : '') + ')') + (t ? ' \u00b7 ' + t.label + ' tier' : ' \u00b7 custom quote'));
    if (outOfArea()) parts.push('Outside the service area: waitlist');
    else if (t) parts.push(st.plan === 'seasonal' ? 'Plan: Seasonal ' + money(t.seasonal) + ' (8 storms up to 6 in; 50% at signing, 50% Jan 15)' : 'Plan: Per visit ' + money(t.visit) + ' per storm up to 6 in');
    if (t) parts.push('Over 6 in: ' + money(SNOW.perInch) + ' per inch');
    parts.push('Add-ons: ' + (a.list.length ? a.list.join('; ') : 'none') + (a.per ? ' = ' + money(a.per) + ' every storm' : ''));
    parts.push('Prices before ' + taxPct() + '% CT sales tax');
    return parts.join('\n');
  }

  async function submit(e) {
    e.preventDefault();
    var err = $('tfs-ferr'); err.textContent = '';
    var name = $('tfs-name').value.trim(), phone = $('tfs-phone').value.trim(), email = $('tfs-email').value.trim();
    if (name.length < 2) { err.textContent = 'Please add your name.'; return; }
    if (phone.replace(/\D/g, '').length < 10) { err.textContent = 'Please add a phone number so we can reach you about storms.'; return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { err.textContent = 'Please add your email for the agreement and receipts.'; return; }
    if ($('tfs-web').value) { st.first = name.split(' ')[0]; st.step = 'done'; draw(); return; }
    var t = st.tier, a = addonEach(), parts = name.split(/\s+/);
    var plan = outOfArea() ? 'Waitlist' : !t ? 'Custom quote' : st.plan === 'seasonal' ? 'Seasonal' : 'Per visit';
    var d = {
      source: 'Snow page', event: 'snow_quote', page_url: location.href,
      first_name: parts[0], last_name: parts.slice(1).join(' '), full_name: name, phone: phone, email: email,
      address1: st.address.street, city: st.address.city, state: st.address.state || 'CT', postal_code: st.address.postal, full_address: st.address.formatted,
      lat: st.address.lat, lng: st.address.lng,
      driveway_sqft: st.manual ? '' : Math.round(st.sqft), driveway_measured: st.manual ? 'customer picked size' : 'traced on satellite',
      driveway_path: st.manual ? '' : st.areas.map(function (ar) { return ar.path.map(function (p) { return p.lat().toFixed(6) + ',' + p.lng().toFixed(6); }).join(' '); }).join(' | '),
      snow_size_tier: t ? t.label : 'Custom', snow_plan: plan,
      snow_price: t ? (st.plan === 'seasonal' ? t.seasonal : t.visit) : '',
      snow_addons: a.list.join('; '), vehicles: st.vehicles, vehicle_access: st.vehicles ? st.vAccess : '',
      addons_per_storm: a.per, snow_quote_summary: quoteSummary(), notes: $('tfs-notes').value.trim(), sms_consent: $('tfs-sms').checked ? 'Yes' : 'No'
    };
    var btn = $('tfs-send'); btn.disabled = true; btn.textContent = 'Sending\u2026';
    try {
      if (!SNOW.leadWebhook) throw new Error('no-webhook');
      var ok = false;
      try { var r = await fetch(SNOW.leadWebhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d), keepalive: true }); ok = r.ok; } catch (x) { ok = false; }
      if (!ok) { var f = new URLSearchParams(); Object.keys(d).forEach(function (k) { f.append(k, d[k] == null ? '' : d[k]); }); await fetch(SNOW.leadWebhook, { method: 'POST', mode: 'no-cors', body: f, keepalive: true }); }
      try { if (window.fbq) window.fbq('track', 'Lead', { content_category: 'Snow' }); } catch (x) { /* optional */ }
      st.first = parts[0]; st.sent = true; st.fullName = name; st.doneKind = isFull() ? 'waitlist' : '';
      if (SNOW.online) {
        // server sign-up path: additions only, any failure leaves today's done screen
        try {
          var body = {}; Object.keys(d).forEach(function (k) { body[k] = d[k]; });
          body.action = 'lead'; body.region = REGION; body.cid = newCid(); body.plan = st.plan; body.addons = addonsObj();
          var rep = await postSnow(body, 20000);
          if (rep && rep.ok) {
            st.srv = rep;
            var wait = rep.status === 'waitlist' || isFull() || outOfArea();
            if (rep.status === 'waitlist' || isFull()) st.doneKind = 'waitlist';
            else if (rep.canSign && !wait && t && (rep.status === 'lead' || rep.status === 'quoted')) { st.signed = false; st.step = 'sign'; draw(); scrollToTool(); return; }
            else if (!rep.canSign && !wait) st.doneKind = 'email';
          }
        } catch (y) { console.warn('[TFS] server', y); }
      }
      st.step = 'done'; draw(); scrollToTool();
    } catch (x) {
      console.warn('[TFS] send', x);
      btn.disabled = false; btn.textContent = 'Try again';
      err.innerHTML = 'We could not send your request. Please call <a href="' + TEL + '">' + PHONE + '</a>.';
    }
  }

  function scrollToTool() { var q = $('quote'); if (q && q.scrollIntoView) q.scrollIntoView({ behavior: 'smooth', block: 'start' }); }

  /* ---------- start ---------- */
  var me = document.currentScript;
  var SIGN_CSS = '.tfs-sigwrap{border:1px solid #C9D1DA;border-radius:10px;background:#fff;overflow:hidden}.tfs-sig{display:block;width:100%;height:150px;touch-action:none;cursor:crosshair}.tfs-card a{color:#E23E2B;font-weight:700}.tfs-agree span{font-weight:600;font-size:14px}';
  var st0 = document.createElement('style'); st0.textContent = CSS + SNOW_CSS + SIGN_CSS; (document.head || document.documentElement).appendChild(st0);
  if (!document.querySelector('link[href*="family=Montserrat"]')) { var fl = document.createElement('link'); fl.rel = 'stylesheet'; fl.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800&display=swap'; document.head.appendChild(fl); }
  var wrap = document.createElement('div'); wrap.innerHTML = '<div class="tfl" data-tf-landing="Snow">' + pageHtml().split('%LOGO%').join(LOGO) + '</div>';
  var root = wrap.firstChild;
  if (me && me.parentNode && me.parentNode !== document.head) me.parentNode.insertBefore(root, me.nextSibling); else document.body.appendChild(root);
  var dd = root.querySelector('.tfl-dd');
  if (dd) { var ddb = dd.querySelector('button');
    ddb.addEventListener('click', function (e) { e.stopPropagation(); ddb.setAttribute('aria-expanded', dd.classList.toggle('open') ? 'true' : 'false'); });
    document.addEventListener('click', function (e) { if (!dd.contains(e.target)) { dd.classList.remove('open'); ddb.setAttribute('aria-expanded', 'false'); } }); }
  writeLd();
  try { if (!document.querySelector('link[rel="canonical"]')) { var cn = document.createElement('link'); cn.rel = 'canonical'; cn.href = RG.url; document.head.appendChild(cn); } } catch (x) { /* optional */ }
  checkReturn();
  draw();
  if (st.step !== 'paid') loadConfig();
  window.TFSnow = { state: st, settings: SNOW, quoteSummary: function () { return quoteSummary(); } };
})();
