/* Team Forte Instant Roof Quote, hosted on teamsforte.github.io and loaded by the GoHighLevel page
   (team-forte.com/instant-quote). Settings (key, webhook, prices) are in TFQ_CONFIG below. */
(function () {
  var s = document.currentScript, host = document.getElementById('tfq-host');
  if (document.getElementById('tfq')) return;
  var box = host || document.createElement('div');
  box.innerHTML = "<!-- Team Forte Instant Roof Quote. Edit settings (key, webhook, prices) in the first script. -->\n<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n<link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n<link href=\"https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800;900&display=swap\" rel=\"stylesheet\">\n<style>#tfq,#tfq *{box-sizing:border-box}#tfq{--tf-red: #FF5440;--tf-red-dark: #E8412E;--tf-red-soft: rgba(255, 84, 64, .1);--tf-ink: #0A0A0A;--tf-ink-2: #1E1E2A;--tf-text: #1F2430;--tf-muted: #607179;--tf-line: #E4E7EC;--tf-bg: #F4F5F7;--tf-card: #FFFFFF;--tf-green: #16A34A;font-family:Montserrat,Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:var(--tf-text);background:var(--tf-bg);min-height:100vh;line-height:1.45;-webkit-font-smoothing:antialiased}#tfq button{font-family:inherit}#tfq .tf-top{background:var(--tf-ink);color:#fff;padding:14px 16px}#tfq .tf-top-in{max-width:760px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:12px}#tfq .tf-logo{height:38px;width:auto;display:block}#tfq .tf-call{display:inline-flex;align-items:center;gap:8px;white-space:nowrap;background:var(--tf-red);color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:10px 16px;border-radius:999px}#tfq .tf-call:hover{background:var(--tf-red-dark)}#tfq .tf-call svg{width:16px;height:16px}#tfq .tf-wrap{max-width:760px;margin:0 auto;padding:20px 16px 48px}#tfq .tf-progress{height:6px;background:#e3e6ea;border-radius:99px;overflow:hidden;margin:4px 0 18px}#tfq .tf-progress>i{display:block;height:100%;background:var(--tf-red);width:0;transition:width .45s ease}#tfq .tf-card{background:var(--tf-card);border-radius:18px;box-shadow:0 1px 2px #1018280f,0 12px 32px #10182814}#tfq .tf-map{position:relative;height:320px;background:#1c2a1f;display:none;border-radius:18px 18px 0 0;overflow:hidden}#tfq .tf-pin{position:absolute;left:50%;top:50%;width:34px;height:46px;transform:translate(-50%,-100%);z-index:3;pointer-events:none;display:none;filter:drop-shadow(0 3px 4px rgba(0,0,0,.45))}#tfq .tf-pin.on{display:block}#tfq .tf-pin svg{width:100%;height:100%;display:block}#tfq .tf-map.on{display:block}#tfq .tf-map.small{height:210px}#tfq .tf-house{display:block;width:100%;height:170px;border-radius:12px;margin:4px 0 12px;background:linear-gradient(to bottom,#cfe2f1,#f1f5f8 87%,#86ad71 87%)}@media(max-width:560px){#tfq .tf-house{height:140px}}#tfq .tf-swatches{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 4px}#tfq .tf-sw{width:30px;height:30px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1.5px var(--tf-line);cursor:pointer;padding:0}#tfq .tf-sw.sel{box-shadow:0 0 0 2.5px var(--tf-red)}#tfq .tf-swname{font-size:12px;font-weight:700;color:var(--tf-muted);margin:2px 0 10px}#tfq .tf-pkg .mo{font-size:14px;font-weight:700;color:var(--tf-green);margin-top:4px}#tfq .tf-more{margin:14px 0 0;border:1.5px solid var(--tf-line);border-radius:14px;padding:4px 16px;background:#fff}#tfq .tf-more summary{cursor:pointer;font-weight:800;font-size:14px;padding:10px 0;color:var(--tf-ink)}#tfq .tf-more ul{margin:0 0 12px;padding-left:18px;font-size:13.5px;color:var(--tf-text);display:grid;gap:5px}#tfq .tf-trustbar{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 0}#tfq .tf-trustbar span{background:#fff8f7;border:1px solid #FFD9D3;color:var(--tf-ink-2);border-radius:999px;padding:6px 11px;font-size:12px;font-weight:700}#tfq .tf-trustbar b{color:#f5a623}#tfq .tf-pkg .ribbon{position:absolute;top:14px;right:-1.5px;background:#edebe8;color:var(--tf-ink-2);font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:5px 12px 5px 14px;border-radius:6px 0 0 6px}#tfq .tf-pkg.pop .ribbon{background:var(--tf-red);color:#fff}#tfq .tf-pkg .brand{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--tf-muted);margin:0 90px 2px 0}#tfq .tf-pkg-top{display:grid;grid-template-columns:44% 1fr;gap:16px;align-items:center;margin:10px 0 12px}#tfq .tf-pkg-top .tf-house{height:150px;margin:0}#tfq .tf-pkg-top .desc{margin:6px 0 0}#tfq .tf-specs{margin:0 0 14px;display:grid;gap:0;border-top:1px solid var(--tf-line)}#tfq .tf-specs div{display:grid;grid-template-columns:96px 1fr;gap:10px;padding:7px 0;border-bottom:1px solid var(--tf-line);font-size:13.5px}#tfq .tf-specs dt{font-weight:700;color:var(--tf-muted)}#tfq .tf-specs dd{margin:0;color:var(--tf-ink)}#tfq .tf-pkg .tf-swatches{gap:7px}#tfq .tf-pkg .tf-sw{width:26px;height:26px;border-radius:6px}#tfq .tf-pd{margin:4px 0 14px}#tfq .tf-pd summary{cursor:pointer;font-weight:800;font-size:14px;color:var(--tf-ink);padding:6px 0;list-style:none;display:flex;align-items:center;gap:6px}#tfq .tf-pd summary::-webkit-details-marker{display:none}#tfq .tf-pd summary:after{content:\"\";width:7px;height:7px;border-right:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(45deg);margin:-3px 0 0 4px;transition:transform .15s}#tfq .tf-pd[open] summary:after{transform:rotate(-135deg);margin-top:3px}#tfq .tf-pd h4{font-size:14px;font-weight:800;color:var(--tf-ink);margin:14px 0 6px}#tfq .tf-pd p{font-size:13.5px;color:var(--tf-text);margin:0 0 6px}#tfq .tf-pd ul{margin:0 0 6px!important;padding-left:18px!important;list-style:disc!important;display:block!important;font-size:13.5px;color:var(--tf-text)}#tfq .tf-pd li{display:list-item!important;margin:0 0 4px;font-size:13.5px}#tfq .tf-pd .grp{font-size:13.5px;margin:8px 0 4px}#tfq .tf-pd .grp b{color:var(--tf-ink);letter-spacing:.04em}@media(max-width:560px){#tfq .tf-pkg-top{grid-template-columns:1fr;gap:10px}#tfq .tf-pkg-top .tf-house{height:140px}#tfq .tf-specs div{grid-template-columns:84px 1fr}#tfq .tf-pkg .price{font-size:25px;white-space:nowrap}}#tfq .tf-rep{background:#0a0a0a;color:#fff;font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;text-align:center;padding:7px}#tfq .tf-break{font-size:12.5px;color:var(--tf-muted);background:var(--tf-bg);border-radius:10px;padding:8px 10px;margin:8px 0 0}#tfq .tf-grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}@media(max-width:560px){#tfq .tf-grid3{grid-template-columns:1fr 1fr}}#tfq .tf-map-canvas{position:absolute;inset:0}#tfq .tf-map-demo{position:absolute;inset:0;width:100%;height:100%}#tfq .tf-map-badge{position:absolute;left:12px;top:12px;z-index:2;background:#0a0a0ac7;color:#fff;font-size:12px;font-weight:600;padding:6px 10px;border-radius:999px;backdrop-filter:blur(4px)}#tfq .tf-scan{position:absolute;inset:0;pointer-events:none;z-index:2;display:none;overflow:hidden}#tfq .tf-scan.on{display:block}#tfq .tf-scan:before{content:\"\";position:absolute;left:0;right:0;height:90px;top:-90px;background:linear-gradient(to bottom,#ff544000,#ff544059 85%,#ff7864e6);animation:tfscan 1.6s linear infinite}@keyframes tfscan{to{transform:translateY(420px)}}#tfq .tf-body{padding:26px 24px 28px}#tfq h1,#tfq h2{font-weight:800;color:var(--tf-ink);margin:0 0 8px;letter-spacing:-.01em;line-height:1.15}#tfq h1{font-size:30px}#tfq h2{font-size:23px}#tfq h1 em,#tfq h2 em{font-style:normal;color:var(--tf-red)}#tfq .tf-sub{color:var(--tf-muted);font-size:15px;margin:0 0 20px}#tfq .tf-field{position:relative;margin-bottom:12px}#tfq label.tf-lbl{display:block;font-size:13px;font-weight:700;margin:0 0 6px;color:var(--tf-ink-2)}#tfq input[type=text],#tfq input[type=tel],#tfq input[type=email],#tfq input[type=number],#tfq textarea,#tfq select{width:100%;font:inherit;font-size:16px;color:var(--tf-text);padding:14px;border:1.5px solid var(--tf-line);border-radius:12px;background:#fff;outline:none}#tfq textarea{min-height:80px;resize:vertical}#tfq input:focus,#tfq textarea:focus,#tfq select:focus{border-color:var(--tf-red);box-shadow:0 0 0 4px var(--tf-red-soft)}#tfq .tf-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}#tfq .tf-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;width:100%;border:0;cursor:pointer;text-decoration:none;background:var(--tf-red);color:#fff;font-weight:800;font-size:16px;letter-spacing:.01em;padding:16px 20px;border-radius:12px;transition:background .15s,transform .05s}#tfq .tf-btn:hover{background:var(--tf-red-dark)}#tfq .tf-btn:active{transform:translateY(1px)}#tfq .tf-btn[disabled]{opacity:.55;cursor:not-allowed}#tfq .tf-btn.ghost{background:#fff;color:var(--tf-ink);border:1.5px solid var(--tf-line)}#tfq .tf-btn.ghost:hover{border-color:var(--tf-ink)}#tfq .tf-btn.dark{background:var(--tf-ink)}#tfq .tf-btn.dark:hover{background:#2a2a2a}#tfq .tf-link{background:none;border:0;color:var(--tf-muted);font-size:14px;font-weight:600;cursor:pointer;text-decoration:underline;padding:8px 0}#tfq .tf-actions{display:grid;gap:10px;margin-top:18px}#tfq .tf-err{color:#c0271b;font-size:14px;font-weight:600;margin:8px 0 0;min-height:1em}#tfq .tf-trust{display:flex;flex-wrap:wrap;gap:8px 16px;margin-top:18px;font-size:13px;color:var(--tf-muted);font-weight:600}#tfq .tf-trust span{display:inline-flex;align-items:center;gap:6px}#tfq .tf-trust svg{width:16px;height:16px;color:var(--tf-green);flex:none}#tfq .tf-sugg{position:absolute;left:0;right:0;top:calc(100% + 4px);background:#fff;border:1.5px solid var(--tf-line);border-radius:12px;box-shadow:0 12px 28px #10182824;z-index:20;overflow:hidden;display:none}#tfq .tf-sugg.on{display:block}#tfq .tf-sugg button{display:block;width:100%;text-align:left;background:#fff;border:0;padding:12px 14px;font-size:15px;cursor:pointer;border-bottom:1px solid var(--tf-line);color:var(--tf-text)}#tfq .tf-sugg button:last-child{border-bottom:0}#tfq .tf-sugg button:hover,#tfq .tf-sugg button.act{background:var(--tf-red-soft)}#tfq .tf-addr{display:flex;align-items:flex-start;gap:10px;background:var(--tf-bg);border-radius:12px;padding:12px 14px;font-weight:700;margin-bottom:4px}#tfq .tf-addr svg{width:20px;height:20px;color:var(--tf-red);flex:none;margin-top:1px}#tfq .tf-opts{display:grid;gap:10px}#tfq .tf-opts.two{grid-template-columns:1fr 1fr}#tfq .tf-opt{display:flex;align-items:center;gap:12px;text-align:left;width:100%;background:#fff;border:1.5px solid var(--tf-line);border-radius:14px;padding:15px 16px;font-size:15px;font-weight:700;color:var(--tf-ink-2);cursor:pointer;transition:border-color .15s,background .15s}#tfq .tf-opt:hover{border-color:var(--tf-red);background:#fff8f7}#tfq .tf-opt.sel{border-color:var(--tf-red);background:var(--tf-red-soft)}#tfq .tf-opt .ic{width:38px;height:38px;border-radius:10px;background:var(--tf-red-soft);color:var(--tf-red);display:grid;place-items:center;flex:none}#tfq .tf-opt .ic svg{width:20px;height:20px}#tfq .tf-opt small{display:block;font-weight:500;color:var(--tf-muted);font-size:13px;margin-top:2px}#tfq .tf-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:16px 0 6px}#tfq .tf-stat{background:var(--tf-bg);border-radius:14px;padding:14px 12px;text-align:center}#tfq .tf-stat b{display:block;font-size:24px;font-weight:800;color:var(--tf-ink);line-height:1.1}#tfq .tf-stat span{display:block;font-size:12px;font-weight:600;color:var(--tf-muted);margin-top:4px;text-transform:uppercase;letter-spacing:.04em}#tfq .tf-note{font-size:13px;color:var(--tf-muted);margin:10px 0 0}#tfq .tf-note.warn{color:#9a5b00;background:#fff6e5;border-radius:10px;padding:10px 12px}#tfq .tf-check{display:flex;gap:10px;align-items:flex-start;font-size:12px;color:var(--tf-muted);margin:10px 0 0;line-height:1.45;cursor:pointer}#tfq .tf-check input{margin-top:2px;width:18px;height:18px;accent-color:var(--tf-red);flex:none}#tfq .tf-legal{font-size:12px;color:var(--tf-muted);margin-top:12px}#tfq .tf-legal a{color:var(--tf-muted)}#tfq .tf-pkgs{display:grid;gap:14px;margin-top:18px}#tfq .tf-pkg{position:relative;border:1.5px solid var(--tf-line);border-radius:16px;padding:20px 18px 18px;background:#fff}#tfq .tf-pkg.pop{border:2px solid var(--tf-red);box-shadow:0 10px 28px #ff544024}#tfq .tf-pkg .flag{position:absolute;top:-12px;left:18px;background:var(--tf-red);color:#fff;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:4px 10px;border-radius:99px}#tfq .tf-pkg .tier{font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--tf-red)}#tfq .tf-pkg h3{margin:2px 0;font-size:19px;font-weight:800;color:var(--tf-ink)}#tfq .tf-pkg .desc{font-size:14px;color:var(--tf-muted);margin:0 0 12px}#tfq .tf-pkg .price{font-size:30px;font-weight:900;color:var(--tf-ink);letter-spacing:-.02em;line-height:1.1}#tfq .tf-pkg .price small{font-size:14px;font-weight:600;color:var(--tf-muted);letter-spacing:0}#tfq .tf-pkg ul{list-style:none;padding:0;margin:14px 0 16px;display:grid;gap:7px}#tfq .tf-pkg li{display:flex;gap:8px;font-size:14px}#tfq .tf-pkg li svg{width:17px;height:17px;color:var(--tf-green);flex:none;margin-top:2px}#tfq .tf-summary{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 0}#tfq .tf-chip{background:var(--tf-bg);border-radius:99px;padding:6px 11px;font-size:12px;font-weight:700;color:var(--tf-ink-2)}#tfq .tf-days{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}#tfq .tf-day{background:#fff;border:1.5px solid var(--tf-line);border-radius:12px;padding:10px 4px;text-align:center;cursor:pointer;font-weight:700;color:var(--tf-ink-2);font-size:14px}#tfq .tf-day small{display:block;font-size:11px;font-weight:600;color:var(--tf-muted);text-transform:uppercase;letter-spacing:.05em}#tfq .tf-day.sel,#tfq .tf-day:hover{border-color:var(--tf-red);background:var(--tf-red-soft)}#tfq .tf-done{text-align:center;padding:18px 0 6px}#tfq .tf-done .ok{width:72px;height:72px;border-radius:50%;background:#e7f6ec;color:var(--tf-green);display:grid;place-items:center;margin:0 auto 14px}#tfq .tf-done .ok svg{width:36px;height:36px}#tfq .tf-back{background:none;border:0;color:var(--tf-muted);font-weight:700;font-size:14px;cursor:pointer;padding:0;margin:0 0 12px;display:inline-flex;align-items:center;gap:4px}#tfq .tf-back:hover{color:var(--tf-ink)}#tfq .tf-spin{width:44px;height:44px;border:4px solid var(--tf-red-soft);border-top-color:var(--tf-red);border-radius:50%;animation:tfspin .9s linear infinite;margin:4px auto 14px}@keyframes tfspin{to{transform:rotate(360deg)}}#tfq .tf-steps-list{list-style:none;padding:0;margin:12px auto 0;max-width:320px;display:grid;gap:8px;text-align:left}#tfq .tf-steps-list li{display:flex;gap:10px;align-items:center;font-size:14px;font-weight:600;color:var(--tf-muted);transition:color .2s}#tfq .tf-steps-list li i{width:18px;height:18px;border-radius:50%;border:2px solid var(--tf-line);flex:none;display:grid;place-items:center}#tfq .tf-steps-list li.done{color:var(--tf-ink)}#tfq .tf-steps-list li.done i{background:var(--tf-green);border-color:var(--tf-green)}#tfq .tf-steps-list li.done i:after{content:\"\";width:5px;height:9px;border:solid #fff;border-width:0 2px 2px 0;transform:rotate(45deg) translate(-1px,-1px)}#tfq .tf-demo-bar{background:#fff6e5;color:#7a4a00;font-size:13px;font-weight:600;text-align:center;padding:8px 12px}#tfq .tf-foot{text-align:center;font-size:12px;color:var(--tf-muted);margin-top:18px}#tfq-admin{position:fixed;right:16px;bottom:16px;width:300px;max-height:80vh;overflow:auto;background:#111;color:#eee;font:13px/1.4 system-ui,sans-serif;border-radius:14px;padding:14px;z-index:9999;box-shadow:0 16px 40px #00000059}#tfq-admin h4{margin:0 0 8px;font-size:14px;color:#ff7a69}#tfq-admin label{display:flex;justify-content:space-between;align-items:center;gap:8px;margin:6px 0}#tfq-admin input[type=number]{width:92px;padding:5px 6px;border-radius:6px;border:1px solid #444;background:#222;color:#fff;font:inherit}#tfq-admin button{width:100%;margin-top:8px;padding:8px;border:0;border-radius:8px;background:#ff5440;color:#fff;font-weight:700;cursor:pointer}#tfq-admin button.alt{background:#333}#tfq-admin .min{float:right;background:none;width:auto;margin:0;padding:0 4px;color:#aaa}@media(max-width:560px){#tfq h1{font-size:25px}#tfq h2{font-size:21px}#tfq .tf-body{padding:22px 18px 24px}#tfq .tf-map{height:250px}#tfq .tf-row,#tfq .tf-opts.two{grid-template-columns:1fr}#tfq .tf-stat b{font-size:20px}#tfq .tf-logo{height:30px}#tfq .tf-call span{display:none}#tfq .tf-call{padding:10px 12px}#tfq-admin{left:16px;right:16px;width:auto}}#tfq .tf-rcards{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:12px;margin:16px 0 4px}#tfq .tf-rc,#tfq .tf-sl{min-width:0}#tfq .tf-rc{border:1.5px solid var(--tf-red);border-radius:14px;padding:14px 12px 12px;background:#fff;display:flex;flex-direction:column;gap:8px}#tfq .tf-rc.off{border-color:var(--tf-line);background:#fafafa}#tfq .tf-rc.off .tf-slopes,#tfq .tf-rc.off .tf-rc-meta{opacity:.5}#tfq .tf-rc-top{display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--tf-line);padding-bottom:8px}#tfq .tf-rc-top>svg{width:26px;height:26px;color:var(--tf-ink-2);flex:none}#tfq input.tf-rc-name{flex:1;min-width:0;border:0;background:transparent;padding:4px 2px;font:inherit;font-size:16px;font-weight:800;color:var(--tf-ink);text-align:center;border-radius:6px;margin:0;box-shadow:none;width:auto}#tfq input.tf-rc-name:focus{outline:2px solid var(--tf-red-soft);background:var(--tf-bg)}#tfq .tf-rc-pen{width:16px;height:16px;color:var(--tf-muted);flex:none}#tfq .tf-rc-pen svg{width:16px;height:16px}#tfq .tf-rc-meta{font-size:12.5px;color:var(--tf-muted);text-align:center;font-weight:600}#tfq .tf-slopes{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}#tfq .tf-sl{background:#fff;border:1.5px solid transparent;border-radius:10px;padding:6px 2px 7px;font-size:12px;font-weight:700;color:var(--tf-ink-2);cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;line-height:1.15;font-family:inherit}#tfq .tf-sl i{width:36px;height:36px;border-radius:99px;display:grid;place-items:center;box-shadow:0 1px 6px rgba(0,0,0,.12);color:var(--tf-ink-2)}#tfq .tf-sl i svg{width:22px;height:18px}#tfq .tf-sl small{font-size:10px;font-weight:600;color:var(--tf-muted)}#tfq .tf-sl:hover:not([disabled]){border-color:var(--tf-line)}#tfq .tf-sl.sel{border-color:var(--tf-red);background:var(--tf-red-soft)}#tfq .tf-sl.sel i{color:var(--tf-red)}#tfq .tf-sl[disabled]{color:#b7bec6;cursor:not-allowed}#tfq .tf-sl[disabled] i{color:#c9ced4;box-shadow:none;background:var(--tf-bg)}#tfq .tf-rc-flat{font-size:12px;color:#9a5b00;background:#fff6e5;border-radius:8px;padding:7px 9px;margin:0}#tfq .tf-rc-inc{display:flex;align-items:center;justify-content:center;gap:8px;font-size:13px;font-weight:700;color:var(--tf-ink-2);cursor:pointer;margin-top:2px}#tfq .tf-rc-inc input{width:20px;height:20px;accent-color:var(--tf-red);margin:0;flex:none}#tfq .tf-rc-inc input[disabled]{opacity:.7}#tfq .tf-rbreak{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:12.5px;color:var(--tf-muted);margin:6px 0 2px}#tfq .tf-rbreak b{color:var(--tf-ink-2);font-weight:800}@media (max-width:560px){#tfq .tf-rcards{grid-template-columns:1fr}}#tfq .tf-hp{position:absolute!important;left:-9999px!important;width:1px;height:1px;overflow:hidden}#tfq .tf-qinfo{margin:16px 0 0;padding:12px 14px;background:var(--tf-bg);border-radius:12px;font-size:13px;color:var(--tf-ink-2);line-height:1.5}#tfq .tf-qinfo b{font-weight:800}#tfq .tf-tools{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}#tfq .tf-tools .tf-btn{font-size:14px;padding:12px 10px}#tfq .tf-help{display:flex;flex-wrap:wrap;justify-content:center;gap:6px 14px;margin:14px 0 0;font-size:14px;font-weight:700}#tfq .tf-help a{color:var(--tf-ink-2)}#tfq .tf-pkg.mypick{border:2px solid var(--tf-ink)}#tfq .tf-mypick{display:inline-block;background:var(--tf-ink);color:#fff;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;border-radius:6px;padding:3px 8px;margin:0 0 6px}#tfq .tf-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:var(--tf-ink);color:#fff;font-size:14px;font-weight:700;padding:10px 16px;border-radius:10px;z-index:99999}</style>\n<div id=\"tfq\"><div class=\"tf-top\"><div class=\"tf-top-in\"><a href=\"https://team-forte.com\" aria-label=\"Team Forte home\"><img class=\"tf-logo\" id=\"tfq-logo\" alt=\"Team Forte Roofing\"></a><a class=\"tf-call\" id=\"tfq-call\" href=\"#\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z\"/></svg><span id=\"tfq-phone-txt\"></span></a></div></div><div id=\"tfq-demo\" class=\"tf-demo-bar\" hidden>Demo mode: add your Google API key in the CONFIG block to measure real roofs. Sample measurements are shown.</div><div class=\"tf-wrap\"><div class=\"tf-progress\" aria-hidden=\"true\"><i id=\"tfq-prog\"></i></div><div class=\"tf-card\"><div class=\"tf-map\" id=\"tfq-mapwrap\"><div class=\"tf-map-canvas\" id=\"tfq-map\"></div><div class=\"tf-map-badge\" id=\"tfq-mapbadge\">Satellite view</div><div class=\"tf-scan\" id=\"tfq-scan\"></div><div class=\"tf-pin\" id=\"tfq-pin\"><svg viewBox=\"0 0 34 46\"><path d=\"M17 45C17 45 33 27.5 33 17A16 16 0 0 0 1 17C1 27.5 17 45 17 45Z\" fill=\"#FF5440\" stroke=\"#fff\" stroke-width=\"2\"/><circle cx=\"17\" cy=\"17\" r=\"6\" fill=\"#fff\"/></svg></div></div><div class=\"tf-body\" id=\"tfq-step\" aria-live=\"polite\"></div></div><div class=\"tf-foot\" id=\"tfq-foot\"></div></div></div>";
  if (!host) s.parentNode.insertBefore(box, s);
})();

/* ==========================================================================
   CONFIG — edit these values
   ========================================================================== */
window.TFQ_CONFIG = {
  business: {
    name: "Team Forte",
    legalName: "GR Brothers LLC",
    phone: "(860) 854-9335",
    phoneHref: "tel:+18608549335",
    website: "https://team-forte.com",
    privacyUrl: "https://team-forte.com/privacy-policy",
    termsUrl: "https://team-forte.com/terms-of-service",
    serviceArea: "Connecticut",
    // Shown on the price screen. Keep these to real, verifiable facts.
    trust: ["<b>★</b> 5.0 on Google", "<b>★</b> 4.6 on Thumbtack · 38 reviews", "Thumbtack Top Pro 2024 & 2025", "GAF Master Elite®", "Owens Corning® Preferred"],
    regionCodes: ["us"],           // address suggestions limited to these countries
    searchBias: { center: { lat: 41.60, lng: -72.70 }, radius: 50000 }  // prefer Connecticut addresses
  },

  // Google Cloud API key with these APIs enabled: Maps JavaScript API,
  // Places API (New) and Solar API. Leave "" to run in demo mode.
  googleApiKey: "AIzaSyAuSuRZOOL2zEQHwk4OKxLPjD-Y45ilTS0",   // project "Team Forte Quotes" (teamforte@team-forte.com); only works on team-forte.com

  // Lowest satellite quality accepted: "HIGH", "MEDIUM" or "LOW".
  // If Google has nothing at this level the homeowner answers 3 quick questions instead.
  solarMinQuality: "LOW",

  // Sales rep mode: open the quote page with ?rep=<this code> (e.g. team-forte.com/instant-quote?rep=forte-rep).
  // Reps can adjust measurements, see the price breakdown and send the quote straight to the customer.
  repCode: "forte-rep",

  // GoHighLevel workflow "Inbound Webhook" trigger URL. Leave "" to not send leads.
  ghlWebhookUrl: "https://services.leadconnectorhq.com/hooks/ySsyazNWRWtwaoThE5Ij/webhook-trigger/8f842a81-2263-4f45-9d3e-8f4976283d4c",  // GHL workflow "Instant Quote Leads (website)"

  // GHL workflow "Unfinished Instant Quotes (website)": emails the team the address and roofs
  // when a visitor measures a roof but leaves before giving contact info. Leave "" to turn off.
  ghlUnfinishedWebhookUrl: "https://services.leadconnectorhq.com/hooks/ySsyazNWRWtwaoThE5Ij/webhook-trigger/80f63207-e35b-449d-bc1f-b9569fa44712",

  pricing: {
    // Installed price per roofing square (100 sq ft, measured area + waste), including
    // 1-layer tear-off, underlayment, ice & water shield, drip edge, ridge vent, permit and cleanup.
    // Set to typical Connecticut market prices (Sep 2026).
    tiers: [
      {
        id: "good", label: "Good", name: "Owens Corning® Oakridge®", art: "arch",
        perSquare: 565, ribbon: "Best value",
        desc: "Owens Corning's most affordable architectural shingle. A big step up from 3-tab.",
        specs: [
          ["Material", "Architectural (laminated) asphalt shingle"],
          ["Warranty", "Limited Lifetime shingle warranty*"],
          ["Wind", "110 MPH (130 MPH with special installation)*"],
          ["Algae", "StreakGuard®, 25-year algae resistance*"],
          ["Top feature", "Full double layer in the nailing zone for better holding power"]
        ],
        // Owens Corning colors listed for Oakridge® near Berlin, CT (swatch colors are approximate)
        colors: [
          { name: "Onyx Black", hex: "#33373A" }, { name: "Estate Gray", hex: "#666C6B" },
          { name: "Driftwood", hex: "#6F675C" }, { name: "Brownwood", hex: "#58413B" },
          { name: "Teak", hex: "#5B4E49" }, { name: "Desert Tan", hex: "#92715C" }
        ]
      },
      {
        id: "better", label: "Better", name: "Owens Corning® Duration®", art: "premium",
        perSquare: 655, popular: true, ribbon: "Most popular",
        desc: "Owens Corning's best-selling shingle, with TruDefinition® color and SureNail® Technology.",
        specs: [
          ["Material", "Architectural asphalt shingle, TruDefinition® color"],
          ["Warranty", "Limited Lifetime shingle warranty*"],
          ["Wind", "Up to 160 MPH with Owens Corning starter and hip & ridge*"],
          ["Impact", "Class 3 impact resistance"],
          ["Top feature", "Patented SureNail® Technology with Triple Layer Protection®"]
        ],
        // Owens Corning colors listed for Duration® near Berlin, CT
        colors: [
          { name: "Onyx Black", hex: "#2E3134" }, { name: "Estate Gray", hex: "#595F60" },
          { name: "Driftwood", hex: "#6E6961" }, { name: "Brownwood", hex: "#5C4239" },
          { name: "Teak", hex: "#5B4B43" }, { name: "Williamsburg Gray", hex: "#505155" },
          { name: "Slatestone Gray", hex: "#696D6E" }, { name: "Peppercorn", hex: "#585854" },
          { name: "Colonial Slate", hex: "#696460" }, { name: "Sierra Gray", hex: "#989995" },
          { name: "Harbor Blue", hex: "#536470" }, { name: "Chateau Green", hex: "#3B5046" },
          { name: "Midnight Plum", hex: "#4A4C55" }, { name: "Desert Rose", hex: "#755B4C" },
          { name: "Sand Castle", hex: "#9A8975" }, { name: "Terra Cotta", hex: "#8A5041" }
        ]
      },
      {
        id: "best", label: "Best", name: "Owens Corning® Duration FLEX®", art: "designer",
        perSquare: 745, ribbon: "Top protection",
        desc: "SBS-modified shingle with the highest impact rating, built for hail and New England cold.",
        specs: [
          ["Material", "SBS polymer-modified asphalt shingle, stays flexible in the cold"],
          ["Warranty", "Limited Lifetime shingle warranty*"],
          ["Wind", "Up to 160 MPH with Owens Corning starter and hip & ridge*"],
          ["Impact", "UL 2218 Class 4, the highest rating. May qualify for a home insurance discount (ask your insurer)"],
          ["Top feature", "SureNail® Technology plus SBS toughness for storms"]
        ],
        // Owens Corning colors listed for Duration FLEX® near Berlin, CT
        colors: [
          { name: "Onyx Black", hex: "#2D3033" }, { name: "Black Sable", hex: "#3B3632" },
          { name: "Estate Gray", hex: "#595F60" }, { name: "Driftwood", hex: "#6E6961" },
          { name: "Brownwood", hex: "#5A433C" }, { name: "Teak", hex: "#5B4B43" },
          { name: "Summer Harvest", hex: "#857970" }
        ]
      }
    ],
    warrantyNote: "*See the manufacturer's actual warranty for complete details, limitations and requirements. Wind and algae coverage depend on installing the required Owens Corning components. Colors on screen are approximate; we bring real samples to your inspection.",
    // Every package is installed as an Owens Corning® Total Protection Roofing System® (the SEAL / DEFEND / BREATHE groups)
    system: [
      { head: "SEAL.", sub: "Helps create a water-proof barrier", items: ["Owens Corning® ice & water barrier at eaves, valleys, chimneys and walls", "Owens Corning® synthetic underlayment over the entire roof"] },
      { head: "DEFEND.", sub: "Helps protect against nature's elements", items: ["Owens Corning® starter shingles along eaves and rakes", "Your choice of Owens Corning® shingles", "Owens Corning® hip & ridge shingles"] },
      { head: "BREATHE.", sub: "Helps balance airflow in your attic", items: ["Intake ventilation where your roof allows", "Ridge (exhaust) ventilation"] }
    ],
    // Also included in every package
    included: [
      "Tarps and protection for your landscaping and property",
      "Full tear-off down to the roof deck (1 layer)",
      "New drip edge, pipe boots and flashing where needed",
      "Building permit",
      "Magnetic nail sweep, dumpster and full cleanup",
      "Licensed & insured Connecticut crew, plus a workmanship warranty from Team Forte"
    ],
    // Not in the instant price; confirmed at the free inspection only if needed
    notIncluded: [
      "Replacing rotted or damaged roof decking",
      "Removing more than one existing layer (added if you told us there are 2+)",
      "Roof more complex than the satellite showed (extra material)",
      "Chimney or skylight re-flashing beyond normal, and replacing skylights",
      "Detached garages, barns, sheds and other roofs you didn't add to this quote"
    ],
    // Optional add-ons, priced at the inspection
    upgrades: [
      "Owens Corning® blown-in attic insulation (the \"COMFORT\" part of the system)",
      "New seamless gutters and downspouts",
      "Skylight replacement"
    ],
    // Waste factor by roof complexity (number of roof facets)
    waste: [
      { maxFacets: 4,  pct: 0.10 },
      { maxFacets: 10, pct: 0.13 },
      { maxFacets: 999, pct: 0.16 }
    ],
    // Steep-roof surcharge by predominant pitch (rise per 12")
    pitchSurcharge: [
      { maxPitch: 6,  pct: 0.00 },
      { maxPitch: 8,  pct: 0.08 },
      { maxPitch: 10, pct: 0.15 },
      { maxPitch: 12, pct: 0.25 },
      { maxPitch: 99, pct: 0.35 }
    ],
    extraLayerPerSquare: 65,       // added per square for each extra shingle layer removed
    outbuildingMinimum: 1500,      // smallest Good-tier price for a detached garage / barn / shed roof (Better/Best scale up)
    minimumJob: 8000,              // smallest Good-tier job; Better/Best minimums scale with their price
    rangeLow: 0.17,                // shown range: price −17% …
    rangeHigh: 0.17,               // … to +17%
    homeownerEstimateWiden: 0.07   // extra range width when the homeowner estimated size instead of satellite
  },

  // All roofs on the property: after measuring the house, the tool looks up the lot's property
  // lines (Connecticut statewide parcel layer, free public data) and finds every building inside
  // them: detached garage, barn, shed. Each gets its own card and is added to the price.
  // Usually 1-3 extra Solar API lookups per quote (up to ~24 if outlines are unavailable) (10,000 free per month, then about 1 cent each).
  findOtherRoofs: true,
  parcelLookup: true,
  parcelServiceUrl: "https://services3.arcgis.com/3FL1kr7L4LvwA2Kb/arcgis/rest/services/Connecticut_CAMA_and_Parcel_Layer_2024/FeatureServer/0",
  // Building outlines: Connecticut statewide 2D building footprints (2023 lidar), free public data
  footprintServiceUrl: "https://services3.arcgis.com/3FL1kr7L4LvwA2Kb/arcgis/rest/services/2D_Building_Footprints/FeatureServer/0",
  otherRoofMaxDistanceFt: 200,     // only used when property lines aren't available (then roofs start unchecked)
  otherRoofMaxShown: 6,

  // Demo roof used when there is no API key
  demoRoof: { areaSqft: 2480, pitchDeg: 26.57, facets: 8, quality: "DEMO", imageryDate: null }
};

(function () {
"use strict";
if (window.__tfqStarted || !document.getElementById("tfq")) return;
window.__tfqStarted = !0;
const v = window.TFQ_CONFIG,
i = (e) => document.getElementById(e),
y = i("tfq-step"),
D = new URLSearchParams(location.search),
P = D.has("admin") || location.hash === "#admin",
z = !!v.repCode && D.get("rep") === v.repCode,
G = {
get(e) {
try {
return localStorage.getItem(e) || "";
} catch {
return "";
}
},
set(e, s) {
try {
localStorage.setItem(e, s);
} catch {}
},
},
L = !v.googleApiKey,
m = v.pricing,
te =
'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 160"><g fill="#ff5147"><path d="M4 116 108 12 146 50V28h28v50l32 32v46h-28v-34L108 52 44 116Z"/></g><g fill="#fff"><path d="M83 104h20v20H83zm26 0h20v20h-20zm-26 26h20v20H83zm26 0h20v20h-20z"/><defs><path id="T" d="M0 0h48v12H31v48H17V12H0Z"/><path id="E" d="M0 0h44v12H14v11h27v12H14v13h30v12H0Z"/><path id="A" fill-rule="evenodd" d="M0 60 20 0h17l20 60H42l-4-13H18l-4 13ZM22 35h12l-6-20Z"/><path id="M" d="M0 60V0h14l18 27L50 0h14v60H50V23L32 49 14 23v37Z"/><path id="F" d="M0 0h44v13H15v13h26v13H15v21H0Z"/><path id="O" fill-rule="evenodd" d="M28 0C9 0 0 10 0 30s9 30 28 30 28-10 28-30S47 0 28 0Zm0 13c-9 0-13 5-13 17s4 17 13 17 13-5 13-17-4-17-13-17Z"/><path id="R" fill-rule="evenodd" d="M0 60V0h28c17 0 25 7 25 20 0 9-4 15-12 18l15 22H38L25 40H15v20ZM15 12v16h12c7 0 11-2 11-8s-4-8-11-8Z"/></defs><g transform="translate(220 16) scale(.72)"><use href="#T"/><use href="#E" x="62"/><use href="#A" x="121"/><use href="#M" x="192"/></g><g transform="translate(220 74) scale(1.32)"><use href="#F"/><use href="#O" x="54"/><use href="#R" x="120"/><use href="#T" x="185"/><use href="#E" x="243"/></g></g></svg>',
w = {
pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>',
check:
'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
shield:
'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>',
drop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.7s6 6.6 6 11.3a6 6 0 0 1-12 0c0-4.7 6-11.3 6-11.3z"/></svg>',
clock:
'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
storm:
'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 16.9A5 5 0 0 0 18 7h-1.3A8 8 0 1 0 4 15.3"/><path d="m13 11-4 6h6l-4 6"/></svg>',
house:
'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>',
search:
'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
layers:
'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></svg>',
help: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>',
bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9z"/></svg>',
cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
},
o = {
step: "address",
quoteId: "TFQ-" + Date.now().toString(36).toUpperCase(),
address: null,
roof: null,
manual: { sqft: "", stories: "", slope: "" },
answers: { issue: "", layers: "", timeline: "" },
contact: {
first: "",
last: "",
phone: "",
email: "",
smsTx: !1,
smsMkt: !1,
},
quote: null,
selected: null,
appt: { day: "", window: "", notes: "" },
sendLeads: !!v.ghlWebhookUrl && !P,
rep: z ? { name: G.get("tfq-rep-name") } : null,
color: "",
extras: [],
},
Y = {};
[
"utm_source",
"utm_medium",
"utm_campaign",
"utm_term",
"utm_content",
"gclid",
"fbclid",
].forEach((e) => {
D.get(e) && (Y[e] = D.get(e));
});
const se = {
address: 8,
confirm: 18,
measuring: 28,
measured: 36,
manual: 32,
issue: 46,
layers: 54,
timeline: 62,
contact: 74,
results: 86,
schedule: 94,
done: 100,
repadjust: 50,
repsend: 92,
repdone: 100,
},
c = (e) =>
String(e == null ? "" : e).replace(
/[&<>"']/g,
(s) =>
({
"&": "&amp;",
"<": "&lt;",
">": "&gt;",
'"': "&quot;",
"'": "&#39;",
})[s],
),
C = (e) => "$" + Math.round(e).toLocaleString("en-US"),
J = (e) => Math.round(e / 100) * 100,
ae = (e) => new Promise((s) => setTimeout(s, e)),
R = (e) => Math.tan((e * Math.PI) / 180) * 12,
H = (e) => (Math.atan(e / 12) * 180) / Math.PI,
oe = 10.7639;
function _(e) {
((o.step = e), (i("tfq-prog").style.width = (se[e] || 0) + "%"));
const s =
["confirm", "measuring", "measured"].includes(e) ||
((e === "results" || e === "repadjust") &&
o.roof &&
o.roof.source !== "homeowner_estimate");
(i("tfq-mapwrap").classList.toggle("on", s),
i("tfq-mapwrap").classList.toggle(
"small",
e === "results" || e === "repadjust",
),
i("tfq-scan").classList.toggle("on", e === "measuring"),
i("tfq-pin").classList.toggle("on", e === "confirm" && !L),
(k[e] || k.address)(),
s &&
window.google &&
o.gmap &&
google.maps.event.trigger(o.gmap, "resize"));
try {
e !== "address" &&
i("tfq").scrollIntoView({ behavior: "smooth", block: "start" });
} catch {}
try {
window.parent &&
window.parent !== window &&
window.parent.postMessage(
{ tfq: "resize", h: document.body.scrollHeight },
"*",
);
} catch {}
}
function E(e) {
return '<button class="tf-back" data-back="' + e + '">&larr; Back</button>';
}
function T() {
y.querySelectorAll("[data-back]").forEach(
(e) => (e.onclick = () => _(e.dataset.back)),
);
}
function I(e, s, t) {
return (
'<div class="tf-opts ' +
(t || "") +
'">' +
e
.map(
(a) =>
'<button class="tf-opt' +
(s === a.v ? " sel" : "") +
'" data-v="' +
c(a.v) +
'"><span class="ic">' +
(a.icon || w.check) +
"</span><span>" +
c(a.t) +
(a.s ? "<small>" + c(a.s) + "</small>" : "") +
"</span></button>",
)
.join("") +
"</div>"
);
}
function ne(e) {
return (
m.waste.find((s) => e <= s.maxFacets) || m.waste[m.waste.length - 1]
).pct;
}
function re(e) {
return (
m.pitchSurcharge.find((s) => e <= s.maxPitch) ||
m.pitchSurcharge[m.pitchSurcharge.length - 1]
).pct;
}
function priceRoof(e, minJob) {
const s = ne(e.facets),
t = (e.areaSqft / 100) * (1 + s),
a = re(e.pitch12),
r = o.answers.layers === "2+" ? 1 : 0;
let n = m.rangeLow,
d = m.rangeHigh;
(e.source === "homeowner_estimate" &&
((n += m.homeownerEstimateWiden), (d += m.homeownerEstimateWiden)),
o.answers.layers === "unsure" && (d += 0.04));
const u = m.tiers.map((l) => {
const g = l.perSquare + r * m.extraLayerPerSquare;
let f = t * g * (1 + a);
const h = (minJob * l.perSquare) / m.tiers[0].perSquare;
return (
(f = Math.max(f, h)),
{
id: l.id,
label: l.label,
name: l.name,
base: Math.round(f),
low: J(Math.max(f * (1 - n), h)),
high: J(f * (1 + d)),
minimum: f <= h + 1,
}
);
});
return {
squares: Math.round(t * 10) / 10,
waste: s,
surcharge: a,
extraLayers: r,
tiers: u,
};
}
function xIncluded() {
return (o.extras || []).filter((x) => x.include);
}
function O() {
if (o.fixed) return (o.quote = o.fixed);
const q = priceRoof(o.roof, m.minimumJob),
xm = m.outbuildingMinimum != null ? m.outbuildingMinimum : 1500;
q.mainLabel = o.roof.label || ORD[0];
q.structures = xIncluded()
.filter((x) => x.roof.slope !== "flat")
.map((x) => Object.assign({ x: x, label: x.label }, priceRoof(x.roof, xm)));
// Included roofs that are flat: shingles don't apply, priced at the inspection
q.flatRoofs = xIncluded().filter((x) => x.roof.slope === "flat");
q.totalSqft = [o.roof].concat(q.structures.map((s) => s.x.roof)).reduce((a, r) => a + r.areaSqft, 0);
q.totalSquares = Math.round((q.squares + q.structures.reduce((a, s) => a + s.squares, 0)) * 10) / 10;
// Whole-property totals per package (house + every added roof)
q.totals = q.tiers.map((t, n) => {
const all = [t].concat(q.structures.map((s) => s.tiers[n]));
return {
id: t.id,
base: all.reduce((a, b) => a + b.base, 0),
low: all.reduce((a, b) => a + b.low, 0),
high: all.reduce((a, b) => a + b.high, 0),
};
});
return ((o.quote = q), q);
}
function V(e) {
const s = e && e.solarPotential,
t = (s && s.roofSegmentStats) || [];
if (!t.length) throw new Error("no-segments");
let a = (s.wholeRoofStats && s.wholeRoofStats.areaMeters2) || 0;
const r = t.reduce(
(h, p) => h + ((p.stats && p.stats.areaMeters2) || 0),
0,
);
a || (a = r);
let n = 0,
d = 0,
u = 0,
l = null;
t.forEach((h) => {
const p = (h.stats && h.stats.areaMeters2) || 0,
b = h.pitchDegrees || 0;
(b < H(2) ? (u += p) : ((n += p), (d += p * b)),
(!l || p > ((l.stats && l.stats.areaMeters2) || 0)) && (l = h));
});
const g = n ? d / n : l.pitchDegrees || 0,
f = e.imageryDate;
return {
areaSqft: Math.round(a * oe),
pitchDeg: g,
pitch12: Math.round(R(g)),
facets: t.length,
lowSlopePct: r ? Math.round((u / r) * 100) : 0,
quality: e.imageryQuality || "",
imageryDate: f
? new Date(f.year, (f.month || 1) - 1, f.day || 1).toLocaleDateString(
"en-US",
{ month: "short", year: "numeric" },
)
: "",
source: "satellite",
segments: t
.filter((h) => h.boundingBox && h.center)
.map((h) => ({
box: h.boundingBox,
center: h.center,
azimuth: h.azimuthDegrees || 0,
pitch: h.pitchDegrees || 0,
ground: (h.stats && h.stats.groundAreaMeters2) || 0,
})),
buildingBox: e.boundingBox || null,
groundSqft: Math.round(
((s.wholeRoofStats && s.wholeRoofStats.groundAreaMeters2) ||
t.reduce((h, p) => h + ((p.stats && p.stats.groundAreaMeters2) || 0), 0)) * oe,
),
name: e.name || "",
center: e.center || null,
};
}
async function ie(e, s) {
const t =
"https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=" +
e.toFixed(7) +
"&location.longitude=" +
s.toFixed(7) +
"&requiredQuality=" +
encodeURIComponent(v.solarMinQuality) +
"&key=" +
encodeURIComponent(v.googleApiKey),
a = await fetch(t);
if (!a.ok) throw new Error("solar-" + a.status);
return V(await a.json());
}
/* ---------- All roofs on the property (main house, detached garage, barn, shed) ---------- */
const XR = { lat: 110540, lng: (la) => 111320 * Math.cos((la * Math.PI) / 180) };
function xCenter(r) {
if (r.center) return { lat: r.center.latitude, lng: r.center.longitude };
if (r.buildingBox) {
const b = r.buildingBox;
return {
lat: (b.sw.latitude + b.ne.latitude) / 2,
lng: (b.sw.longitude + b.ne.longitude) / 2,
};
}
return { lat: o.address.lat, lng: o.address.lng };
}
function xDist(a, b) {
const dy = (b.lat - a.lat) * XR.lat,
dx = (b.lng - a.lng) * XR.lng(a.lat);
return { m: Math.sqrt(dx * dx + dy * dy), deg: ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360 };
}
const XDIRS = ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"],
ORD = ["Main Roof", "Second Roof", "Third Roof", "Fourth Roof", "Fifth Roof", "Sixth Roof", "Seventh Roof"];
function xKind(sqft) {
return sqft < 260 ? "Shed" : sqft < 1100 ? "Garage" : sqft < 1900 ? "Barn" : "Outbuilding";
}
// Slope categories. Homeowners see the satellite pick and may only choose a steeper one.
const SLOPES = [
{ id: "flat", t: "Flat", max: 1, rep: 1 },
{ id: "shallow", t: "Shallow", max: 4, rep: 3 },
{ id: "medium", t: "Medium", max: 8, rep: 6 },
{ id: "steep", t: "Steep", max: 99, rep: 10 },
];
function slopeOf(p12) {
return SLOPES.find((q) => p12 <= q.max).id;
}
function slopeIdx(id) {
return SLOPES.findIndex((q) => q.id === id);
}
function satInit(r) {
r.sat ||
(r.sat = {
pitch12: r.pitch12,
pitchDeg: r.pitchDeg,
areaSqft: r.areaSqft,
ground: r.groundSqft || Math.round(r.areaSqft * Math.cos((r.pitchDeg * Math.PI) / 180)),
slope: r.noSat ? "medium" : slopeOf(r.pitch12),
});
r.slope || (r.slope = r.sat.slope);
return r;
}
function setSlope(r, id) {
satInit(r);
if (!r.noSat && slopeIdx(id) < slopeIdx(r.sat.slope)) return;
r.slope = id;
if (id === r.sat.slope) {
((r.pitch12 = r.sat.pitch12), (r.pitchDeg = r.sat.pitchDeg), (r.areaSqft = r.sat.areaSqft));
return;
}
const p = SLOPES[slopeIdx(id)].rep,
d = H(p);
((r.pitch12 = p),
(r.pitchDeg = d),
(r.areaSqft = Math.max(r.sat.areaSqft, Math.round(r.sat.ground / Math.cos((d * Math.PI) / 180)))));
}
function xMake(roof, main, how) {
const d = xDist(xCenter(main), xCenter(roof));
return {
key: roof.name || "x" + Math.random().toString(36).slice(2),
roof: satInit(roof),
distFt: Math.round((d.m * 3.28084) / 5) * 5,
dir: XDIRS[Math.round(d.deg / 45) % 8],
kind: xKind(roof.areaSqft),
include: !1,
how: how,
};
}
function xNumber() {
o.extras.forEach((x, n) => {
x.num = n + 2;
x.label || (x.label = ORD[n + 1] || "Roof " + (n + 2));
});
}
// Connecticut statewide parcel (property line) layer, public ArcGIS service.
async function fetchParcel(lat, lng) {
if (v.parcelLookup === !1 || !v.parcelServiceUrl) return null;
const u =
v.parcelServiceUrl +
"/query?" +
new URLSearchParams({
geometry: lng.toFixed(7) + "," + lat.toFixed(7),
geometryType: "esriGeometryPoint",
inSR: "4326",
spatialRel: "esriSpatialRelIntersects",
outFields: "Parcel_ID",
returnGeometry: "true",
outSR: "4326",
f: "json",
});
const r = await Promise.race([fetch(u), ae(5e3).then(() => null)]);
if (!r || !r.ok) return null;
const j = await r.json(),
f = (j.features || [])[0];
if (!f || !f.geometry || !f.geometry.rings || !f.geometry.rings.length) return null;
return {
id: (f.attributes && f.attributes.Parcel_ID) || "",
rings: f.geometry.rings.map((g) => g.map((q) => ({ lat: q[1], lng: q[0] }))),
};
}
function inParcel(p, pc) {
let inside = !1;
pc.rings.forEach((g) => {
for (let a = 0, b = g.length - 1; a < g.length; b = a++) {
const A = g[a],
B = g[b];
A.lat > p.lat != B.lat > p.lat &&
p.lng < ((B.lng - A.lng) * (p.lat - A.lat)) / (B.lat - A.lat) + A.lng &&
(inside = !inside);
}
});
return inside;
}
function inBox(p, b) {
return b && p.lat >= b.sw.latitude && p.lat <= b.ne.latitude && p.lng >= b.sw.longitude && p.lng <= b.ne.longitude;
}
function ringXY(g) {
// local meters relative to the first vertex (avoids float precision loss)
const o0 = g[0],
kx = XR.lng(o0.lat);
return g.map((q) => [(q.lng - o0.lng) * kx, (q.lat - o0.lat) * XR.lat]);
}
function ringArea(g) {
const p = ringXY(g);
let A = 0;
for (let a = 0, b = p.length - 1; a < p.length; b = a++) A += p[b][0] * p[a][1] - p[a][0] * p[b][1];
return Math.abs(A / 2);
}
function ringCentroid(g) {
const p = ringXY(g),
o0 = g[0];
let x = 0,
y = 0,
A = 0;
for (let a = 0, b = p.length - 1; a < p.length; b = a++) {
const f = p[b][0] * p[a][1] - p[a][0] * p[b][1];
((A += f), (x += (p[b][0] + p[a][0]) * f), (y += (p[b][1] + p[a][1]) * f));
}
return A ? { lat: o0.lat + y / (3 * A) / XR.lat, lng: o0.lng + x / (3 * A) / XR.lng(o0.lat) } : o0;
}
// Connecticut statewide 2D building footprints (2023 lidar), public ArcGIS service.
async function fetchFootprints(pc) {
if (!v.footprintServiceUrl) return null;
const all = pc.rings.flat(),
pad = 2e-4,
env = {
xmin: Math.min(...all.map((q) => q.lng)) - pad,
ymin: Math.min(...all.map((q) => q.lat)) - pad,
xmax: Math.max(...all.map((q) => q.lng)) + pad,
ymax: Math.max(...all.map((q) => q.lat)) + pad,
spatialReference: { wkid: 4326 },
},
body = new URLSearchParams({
geometry: JSON.stringify(env),
geometryType: "esriGeometryEnvelope",
inSR: "4326",
spatialRel: "esriSpatialRelIntersects",
outFields: "OBJECTID",
returnGeometry: "true",
outSR: "4326",
f: "json",
});
const r = await Promise.race([fetch(v.footprintServiceUrl + "/query", { method: "POST", body: body }), ae(5e3).then(() => null)]);
if (!r || !r.ok) return null;
const j = await r.json();
if (!j.features) return null;
return j.features
.filter((f) => f.geometry && f.geometry.rings && f.geometry.rings.length)
.map((f) => {
const rings = f.geometry.rings.map((g) => g.map((q) => ({ lat: q[1], lng: q[0] }))),
outer = rings.reduce((a, b) => (ringArea(b) > ringArea(a) ? b : a));
return { id: f.attributes.OBJECTID, rings: rings, c: ringCentroid(outer), groundSqft: Math.round(ringArea(outer) * oe) };
});
}
function hull(pts) {
const p = pts.slice().sort((a, b) => a.lng - b.lng || a.lat - b.lat),
cr = (O2, A, B) => (A.lng - O2.lng) * (B.lat - O2.lat) - (A.lat - O2.lat) * (B.lng - O2.lng),
lo = [],
up = [];
p.forEach((q) => {
for (; lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0; ) lo.pop();
lo.push(q);
});
p.slice()
.reverse()
.forEach((q) => {
for (; up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0; ) up.pop();
up.push(q);
});
return lo.slice(0, -1).concat(up.slice(0, -1));
}
function segDistM(p, A, B) {
const kx = XR.lng(p.lat),
ax = (A.lng - p.lng) * kx,
ay = (A.lat - p.lat) * XR.lat,
bx = (B.lng - p.lng) * kx,
by = (B.lat - p.lat) * XR.lat,
dx = bx - ax,
dy = by - ay,
t = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / (dx * dx + dy * dy || 1)));
return Math.hypot(ax + t * dx, ay + t * dy);
}
// Part of the lidar building outline the satellite roof data doesn't cover
// (often an attached/adjacent garage or addition). Rasterizes the outline on a
// 0.5 m grid, removes cells under the satellite roof facets, keeps the largest
// leftover patch. Returns a roof or null.
function uncoveredPart(main, fp) {
const sg = main.groundSqft || 0;
if (!sg || fp.groundSqft - sg < 80 || !(main.segments || []).length) return null;
const outer = fp.rings.reduce((a, b) => (ringArea(b) > ringArea(a) ? b : a)),
o0 = outer[0],
kx = XR.lng(o0.lat),
P = (q) => [(q.lng - o0.lng) * kx, (q.lat - o0.lat) * XR.lat],
poly = outer.map(P),
boxes = main.segments.map((q) => {
const a = P({ lat: q.box.sw.latitude, lng: q.box.sw.longitude }),
b = P({ lat: q.box.ne.latitude, lng: q.box.ne.longitude });
return [a[0] - 0.8, a[1] - 0.8, b[0] + 0.8, b[1] + 0.8];
}),
inPoly = (x, y) => {
let c2 = !1;
for (let a = 0, b = poly.length - 1; a < poly.length; b = a++) {
const A = poly[a],
B = poly[b];
A[1] > y != B[1] > y && x < ((B[0] - A[0]) * (y - A[1])) / (B[1] - A[1]) + A[0] && (c2 = !c2);
}
return c2;
},
st = 0.5,
xs = poly.map((q) => q[0]),
ys = poly.map((q) => q[1]),
x0 = Math.min(...xs),
y0 = Math.min(...ys),
W = Math.ceil((Math.max(...xs) - x0) / st),
Hh = Math.ceil((Math.max(...ys) - y0) / st);
if (W * Hh > 4e5) return null;
const grid = new Uint8Array(W * Hh);
for (let r = 0; r < Hh; r++)
for (let q = 0; q < W; q++) {
const x = x0 + (q + 0.5) * st,
y = y0 + (r + 0.5) * st;
inPoly(x, y) && !boxes.some((b) => x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3]) && (grid[r * W + q] = 1);
}
let best = null;
const seen = new Uint8Array(W * Hh);
for (let k = 0; k < W * Hh; k++) {
if (!grid[k] || seen[k]) continue;
const stack = [k],
cells = [];
for (seen[k] = 1; stack.length; ) {
const c3 = stack.pop();
cells.push(c3);
const r = Math.floor(c3 / W),
q = c3 % W;
[
[1, 0],
[-1, 0],
[0, 1],
[0, -1],
].forEach(([dr, dq]) => {
const rr = r + dr,
qq = q + dq,
kk = rr * W + qq;
rr >= 0 && rr < Hh && qq >= 0 && qq < W && grid[kk] && !seen[kk] && ((seen[kk] = 1), stack.push(kk));
});
}
(!best || cells.length > best.length) && (best = cells);
}
if (!best) return null;
const g = Math.round(best.length * st * st * oe);
if (g < 100) return null;
const pts = [];
best.forEach((c3) => {
const r = Math.floor(c3 / W),
q = c3 % W;
[
[0, 0],
[1, 0],
[0, 1],
[1, 1],
].forEach(([a, b]) =>
pts.push({ lat: o0.lat + (y0 + (r + a) * st) / XR.lat, lng: o0.lng + (x0 + (q + b) * st) / kx }),
);
});
const h = hull(pts),
d = H(6),
cc = ringCentroid(h);
return {
areaSqft: Math.round(g / Math.cos((d * Math.PI) / 180)),
pitchDeg: d,
pitch12: 6,
facets: 2,
lowSlopePct: 0,
quality: "",
imageryDate: "",
source: "footprint",
noSat: !0,
segments: [],
footprint: { rings: [h] },
buildingBox: fpBox({ rings: [h] }),
groundSqft: g,
name: "part-" + fp.id,
center: { latitude: cc.lat, longitude: cc.lng },
};
}
function fpBox(fp) {
const all = fp.rings.flat();
return {
sw: { latitude: Math.min(...all.map((q) => q.lat)), longitude: Math.min(...all.map((q) => q.lng)) },
ne: { latitude: Math.max(...all.map((q) => q.lat)), longitude: Math.max(...all.map((q) => q.lng)) },
};
}
async function scanExtras(main) {
o.parcel = null;
if (v.findOtherRoofs === !1) return [];
if (L) {
o.parcel = { id: "demo", rings: [] };
return [
{
key: "demo-garage",
roof: satInit({ areaSqft: 610, pitchDeg: 26.57, pitch12: 6, facets: 2, lowSlopePct: 0, quality: "DEMO", imageryDate: "", source: "demo", segments: [], buildingBox: null, groundSqft: 545 }),
distFt: 55, dir: "east", kind: "Garage", include: !0, how: "parcel",
},
{
key: "demo-shed",
roof: satInit({ areaSqft: 150, pitchDeg: 18.43, pitch12: 3, facets: 2, lowSlopePct: 0, quality: "DEMO", imageryDate: "", source: "demo", segments: [], buildingBox: null, groundSqft: 142 }),
distFt: 90, dir: "southeast", kind: "Shed", include: !0, how: "parcel",
},
];
}
const c = xCenter(main);
let pc = null;
try {
// The lot must contain the measured house; the address point can land across the street.
pc = await fetchParcel(o.address.lat, o.address.lng);
(pc && inParcel(c, pc)) || (pc = await fetchParcel(c.lat, c.lng));
pc && !inParcel(c, pc) && (pc = null);
} catch (q) {
console.warn("[TFQ] parcel", q);
}
o.parcel = pc;
// 1) Best: building outlines from the state's lidar footprints inside the property lines
if (pc) {
let fps = null;
try {
fps = await fetchFootprints(pc);
} catch (q) {
console.warn("[TFQ] footprints", q);
}
if (fps && fps.length) {
const lot = fps.filter((f) => inParcel(f.c, pc) && f.groundSqft >= 60),
inside = (p, f) => inParcel(p, { rings: f.rings }),
mainFp =
lot.find((f) => inside(c, f)) ||
lot.slice().sort((a, b) => xDist(c, a.c).m - xDist(c, b.c).m).find((f) => xDist(c, f.c).m < 12);
let part = mainFp ? uncoveredPart(main, mainFp) : null;
// Outline the house with the lidar shape, unless part of it is split off as its own roof
mainFp && !part && (main.footprint = mainFp);
const others = lot.filter((f) => f !== mainFp).sort((a, b) => xDist(c, a.c).m - xDist(c, b.c).m).slice(0, v.otherRoofMaxShown || 6);
const out = await Promise.all(
others.map(async (f) => {
let r = null;
try {
r = await ie(f.c.lat, f.c.lng);
} catch (q) {}
if (!(r && r.name && r.name !== main.name && (inside(xCenter(r), f) || xDist(xCenter(r), f.c).m < 3))) {
// No satellite slope for this building: size it from the lidar outline at a typical 6/12
const d = H(6);
r = {
areaSqft: Math.round(f.groundSqft / Math.cos((d * Math.PI) / 180)),
pitchDeg: d,
pitch12: 6,
facets: 2,
lowSlopePct: 0,
quality: "",
imageryDate: "",
source: "footprint",
noSat: !0,
segments: [],
buildingBox: fpBox(f),
groundSqft: f.groundSqft,
name: "fp-" + f.id,
center: { latitude: f.c.lat, longitude: f.c.lng },
};
} else r.groundSqft = r.groundSqft || f.groundSqft;
r.footprint = f;
const x = xMake(r, main, "parcel");
return ((x.include = !0), x);
}),
);
if (part) {
// If the satellite has this section as its own building, use its real slope and size
let sp = null;
try {
sp = await ie(part.center.latitude, part.center.longitude);
} catch (q) {}
sp &&
sp.name &&
sp.name !== main.name &&
(inParcel(xCenter(sp), { rings: part.footprint.rings }) || xDist(xCenter(sp), xCenter(part)).m < 4) &&
((sp.footprint = part.footprint), (sp.groundSqft = sp.groundSqft || part.groundSqft), (part = sp));
const x = xMake(part, main, "parcel");
((x.include = !0), part.noSat && (x.kind = "Attached section"), out.unshift(x));
}
return out;
}
}
// 2) Fallback: probe around the house with the Solar API
let rad = 14;
if (main.buildingBox) {
const b = main.buildingBox;
rad = xDist({ lat: b.sw.latitude, lng: b.sw.longitude }, { lat: b.ne.latitude, lng: b.ne.longitude }).m / 2;
}
let pts = [];
if (pc) {
const all = pc.rings.flat(),
la0 = Math.min(...all.map((q) => q.lat)),
la1 = Math.max(...all.map((q) => q.lat)),
ln0 = Math.min(...all.map((q) => q.lng)),
ln1 = Math.max(...all.map((q) => q.lng)),
hM = (la1 - la0) * XR.lat,
wM = (ln1 - ln0) * XR.lng(la0);
let step = Math.max(6, Math.sqrt((hM * wM) / 40));
const grid = () => {
const g = [];
for (let y = step / 2; y < hM; y += step)
for (let x = step / 2; x < wM; x += step) {
const p = { lat: la0 + y / XR.lat, lng: ln0 + x / XR.lng(la0) };
inParcel(p, pc) && !inBox(p, main.buildingBox) && g.push(p);
}
return g;
};
pts = grid();
for (; pts.length > 24; ) ((step *= 1.2), (pts = grid()));
pts = pts.map((p) => [p.lat, p.lng]);
} else {
[rad + 12, rad + 32].forEach((dm) => {
for (let k = 0; k < 8; k++) {
const a = ((k * 45 + (dm > rad + 20 ? 22.5 : 0)) * Math.PI) / 180;
pts.push([c.lat + (dm * Math.cos(a)) / XR.lat, c.lng + (dm * Math.sin(a)) / XR.lng(c.lat)]);
}
});
}
const got = await Promise.race([
Promise.all(pts.map((p) => ie(p[0], p[1]).catch(() => null))),
ae(9e3).then(() => []),
]);
const maxM = (v.otherRoofMaxDistanceFt || 200) / 3.28084,
seen = new Set([main.name || "main"]),
out = [];
(got || []).forEach((r) => {
if (!r || !r.name || seen.has(r.name)) return;
seen.add(r.name);
if (r.areaSqft < 80) return;
const x = xMake(r, main, pc ? "parcel" : "nearby");
if (pc) {
if (!inParcel(xCenter(r), pc)) return;
x.include = !0;
} else if (x.distFt / 3.28084 > maxM) return;
out.push(x);
});
return out.sort((a, b) => a.distFt - b.distFt).slice(0, v.otherRoofMaxShown || 6);
}
function le() {
const e = parseFloat(o.manual.sqft) || 0,
s = parseFloat(o.manual.stories) || 1,
t = { low: 4, medium: 6, steep: 9 }[o.manual.slope] || 6,
a = e / s,
r = 1 / Math.cos((H(t) * Math.PI) / 180),
n = a * 1.12 * r;
return {
areaSqft: Math.round(n),
pitchDeg: H(t),
pitch12: t,
facets: o.manual.slope === "steep" ? 8 : 6,
lowSlopePct: 0,
quality: "",
imageryDate: "",
source: "homeowner_estimate",
segments: [],
buildingBox: null,
};
}
function Z(e) {
const s = o.address || {},
t = o.roof || {},
a = o.quote,
r = o.contact,
n = {
event: e,
quote_id: o.quoteId,
source: "Instant Roof Quote",
tags:
"instant-quote" +
(e === "inspection_requested" ? ",inspection-requested" : ""),
first_name: r.first,
last_name: r.last,
full_name: (r.first + " " + r.last).trim(),
phone: r.phone,
email: r.email,
sms_transactional_consent: r.smsTx ? "yes" : "no",
sms_marketing_consent: r.smsMkt ? "yes" : "no",
address: s.formatted || "",
street: s.street || "",
city: s.city || "",
state: s.state || "",
postal_code: s.postal || "",
latitude: s.lat || "",
longitude: s.lng || "",
measurement_source: t.source || "",
roof_area_sqft: t.areaSqft || "",
roof_pitch: t.pitch12 ? t.pitch12 + "/12" : "",
roof_facets: t.facets || "",
low_slope_pct: t.lowSlopePct || 0,
imagery_quality: t.quality || "",
imagery_date: t.imageryDate || "",
roof_squares_with_waste: a ? a.squares : "",
roof_issue: o.answers.issue,
shingle_layers: o.answers.layers,
timeline: o.answers.timeline,
page_url: location.href.split("#")[0],
referrer: document.referrer || "",
submitted_at: new Date().toISOString(),
};
const xs = (a && a.structures) || [],
fl = (a && a.flatRoofs) || [],
slopeTxt = (r0) =>
r0.noSat
? " (no satellite slope; homeowner picked " + r0.slope + ")"
: r0.sat && r0.slope !== r0.sat.slope
? " (homeowner picked " + r0.slope + "; satellite said " + r0.sat.slope + " " + r0.sat.pitch12 + "/12)"
: "";
if (
(a &&
a.tiers.forEach((u, k2) => {
const T2 = a.totals[k2];
// Prices as shown to the homeowner: every roof on the quote combined
((n["price_" + u.id + "_low"] = T2.low),
(n["price_" + u.id + "_high"] = T2.high),
(n[u.id + "_package"] = u.name),
(n[u.id + "_range"] = C(T2.low) + " - " + C(T2.high)),
(n["house_" + u.id + "_range"] = C(u.low) + " - " + C(u.high)));
}),
a &&
((n.roof_count = 1 + xs.length),
(n.total_roof_area_sqft = a.totalSqft),
(n.total_squares_with_waste = a.totalSquares),
(n.main_roof_slope = (t.slope || "") + slopeTxt(t)),
(n.other_roofs_count = xs.length),
(n.other_roofs_found = (o.extras || []).length),
(n.other_roofs_left_off = (o.extras || []).filter((x) => !x.include).length),
(n.property_lines_used = o.parcel ? "yes" : "no")),
(xs.length || fl.length) &&
(n.other_roofs = xs
.map(
(q) =>
q.label +
" (" +
q.x.kind.toLowerCase() +
"?): " +
q.x.roof.areaSqft.toLocaleString("en-US") +
" sq ft, " +
q.x.roof.pitch12 +
"/12" +
slopeTxt(q.x.roof) +
", " +
q.x.roof.facets +
" facets, ~" +
q.x.distFt +
" ft " +
q.x.dir +
" of house | " +
q.tiers.map((u) => u.label + " " + C(u.low) + "-" + C(u.high)).join(" | "),
)
.concat(
fl.map(
(x) =>
x.label +
": " +
x.roof.areaSqft.toLocaleString("en-US") +
" sq ft FLAT roof, not in the instant price (price at inspection)",
),
).join(`
`)),
o.color && (n.preferred_color = o.color),
(n.quote_phone = r.phone),
o.selected && (n.shingle_line = (m.tiers.find((q) => q.id === o.selected) || {}).name || ""),
(n.shingle_color = (o.selected && o.colors && o.colors[o.selected]) || o.color || ""),
a &&
(n.roofs_line = xs.length || fl.length
? [(a.mainLabel || "Main Roof") + " " + t.areaSqft.toLocaleString("en-US") + " sq ft (" + t.pitch12 + "/12)"]
.concat(xs.map((q) => q.label + " " + q.x.roof.areaSqft.toLocaleString("en-US") + " sq ft (" + q.x.roof.pitch12 + "/12)"))
.concat(fl.map((x) => x.label + " (flat, priced at inspection)"))
.join(" + ")
: t.areaSqft
? t.areaSqft.toLocaleString("en-US") + " sq ft, " + t.pitch12 + "/12 pitch"
: ""),
o.selected &&
a &&
(n.selected_roof_breakdown = [
(a.mainLabel || "Main Roof") +
": " +
t.areaSqft.toLocaleString("en-US") +
" sq ft, " +
t.pitch12 +
"/12, " +
C(a.tiers.find((q) => q.id === o.selected).low) +
"-" +
C(a.tiers.find((q) => q.id === o.selected).high),
]
.concat(
xs.map(
(q) =>
q.label +
": " +
q.x.roof.areaSqft.toLocaleString("en-US") +
" sq ft, " +
q.x.roof.pitch12 +
"/12, " +
C(q.tiers.find((u) => u.id === o.selected).low) +
"-" +
C(q.tiers.find((u) => u.id === o.selected).high),
),
)
.concat(fl.map((x) => x.label + ": flat, priced at inspection"))
.join(`
`)),
e === "quote_abandoned" && (n.tags = "instant-quote-unfinished"),
o.link && ((n.tags += ",quote-link"), (n.lead_source_detail = "Opened quote link " + (o.link.id || "")), (n.quote_url = o.linkUrl)),
o.rep &&
((n.rep_name = o.rep.name),
(n.lead_source_detail = "Sales rep quote"),
t && t.repEdits && (n.rep_measurement_edits = t.repEdits)),
o.selected && a)
) {
const u = a.tiers.find((l) => l.id === o.selected),
tt = a.totals.find((l) => l.id === o.selected);
((n.selected_package = u.name),
(n.selected_price_low = tt.low),
(n.selected_price_high = tt.high),
(n.selected_house_range = C(u.low) + " - " + C(u.high)),
xs.length &&
(n.selected_includes = [a.mainLabel].concat(xs.map((q) => q.label)).join(" + ")),
(n.opportunity_value = tt.base),
(n.opportunity_name =
(r.first + " " + r.last).trim() +
" - " +
u.name +
" (" +
(s.street || s.formatted || "") +
")"));
} else if (a) {
const u = a.totals[Math.min(1, a.totals.length - 1)];
((n.opportunity_value = u.base),
(n.opportunity_name =
(r.first + " " + r.last).trim() +
" - Instant Quote (" +
(s.street || s.formatted || "") +
")"));
}
(o.appt.day &&
((n.inspection_day = o.appt.day),
(n.inspection_window = o.appt.window),
(n.customer_notes = o.appt.notes)),
Object.assign(n, Y));
// Share the existing branded quote page without storing personal data in a query string.
if (a) {
const detail = {
v: 1, id: o.quoteId, t: (o.quoteDay || new Date()).toISOString().slice(0,10),
n: r.first || "", a: s.formatted || "",
c: s.lat && s.lng ? [Number(s.lat), Number(s.lng)] : null,
r: [{n:a.mainLabel || "Main Roof",s:t.areaSqft || 0,p:t.pitch12 ? t.pitch12 + "/12" : ""}]
.concat(xs.map(q => ({n:q.label,s:q.x.roof.areaSqft || 0,p:q.x.roof.pitch12 ? q.x.roof.pitch12 + "/12" : ""}))),
p: a.totals.map(q => [q.low,q.high]),
k: o.selected ? a.tiers.findIndex(q => q.id === o.selected) : -1,
h: n.shingle_color || ""
};
const encoded = btoa(Array.from(new TextEncoder().encode(JSON.stringify(detail)), b => String.fromCharCode(b)).join(""))
.replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
o.link || (n.quote_url = "https://team-forte.com/instant-quote#q=" + encoded);
}
const d = (u) => "$" + Number(u).toLocaleString("en-US");
return (
(n.quote_package = n.selected_package || "Not chosen yet"),
(n.quote_price_range = n.selected_package
? d(n.selected_price_low) +
" - " +
d(n.selected_price_high) +
(xs.length ? " (" + (1 + xs.length) + " roofs)" : "")
: a
? d(a.totals[0].low) +
" - " +
d(a.totals[a.totals.length - 1].high) +
" (all packages" + (xs.length ? ", " + (1 + xs.length) + " roofs" : "") + ")"
: ""),
(n.quote_summary = ce(n)),
n
);
}
function ce(e) {
const s = [];
(s.push(
"Instant quote " +
e.quote_id +
(e.event === "inspection_requested"
? " (INSPECTION REQUESTED)"
: e.event === "rep_quote"
? " (SENT BY REP: " + (e.rep_name || "") + ")"
: " (prices viewed)"),
),
s.push("Address: " + e.address),
s.push(
"Contact: " +
(e.full_name || "-") +
" | Phone: " +
(e.phone || "-") +
" | Email: " +
(e.email || "-"),
),
e.roof_area_sqft &&
s.push(
(e.other_roofs ? "Main roof: " : "Roof: ") +
Number(e.roof_area_sqft).toLocaleString() +
" sq ft, " +
e.roof_pitch +
" pitch, " +
e.roof_facets +
" facets, " +
e.roof_squares_with_waste +
" squares incl. waste (" +
(e.measurement_source === "satellite"
? "satellite" +
(e.imagery_date ? ", imagery " + e.imagery_date : "")
: e.measurement_source === "homeowner_estimate"
? "homeowner size estimate"
: e.measurement_source) +
")" +
(e.low_slope_pct >= 15
? ", ~" + e.low_slope_pct + "% low-slope"
: "") +
(e.main_roof_slope && /picked/.test(e.main_roof_slope) ? ", slope " + e.main_roof_slope : ""),
),
e.other_roofs &&
s.push(
"Other roofs on the lot" +
(e.property_lines_used === "yes" ? " (found inside the CT parcel lines)" : "") +
":\n" +
e.other_roofs,
),
s.push(
"Issue: " +
(e.roof_issue || "-") +
" | Layers: " +
(e.shingle_layers || "-") +
" | Timeline: " +
(e.timeline || "-"),
));
const t = (r) => "$" + Number(r).toLocaleString();
(e.price_good_low &&
s.push(
(e.other_roofs_count ? "Prices (all " + e.roof_count + " roofs): Good " : "Prices: Good ") +
t(e.price_good_low) +
"-" +
t(e.price_good_high) +
" | Better " +
t(e.price_better_low) +
"-" +
t(e.price_better_high) +
" | Best " +
t(e.price_best_low) +
"-" +
t(e.price_best_high),
),
e.other_roofs_count &&
s.push(
"Main roof only: Good " +
e.house_good_range +
" | Better " +
e.house_better_range +
" | Best " +
e.house_best_range,
),
e.other_roofs_left_off &&
s.push("Other roofs found but left off by the homeowner: " + e.other_roofs_left_off),
e.selected_package &&
s.push(
(e.selected_includes ? "Selected (" + e.selected_includes + "): " : "Selected: ") +
e.selected_package +
" " +
t(e.selected_price_low) +
"-" +
t(e.selected_price_high),
),
e.shingle_line &&
s.push(
"Shingle: " + e.shingle_line + (e.shingle_color ? " | Color: " + e.shingle_color : ""),
),
e.selected_roof_breakdown && e.other_roofs_count && s.push("Selected price by roof:\n" + e.selected_roof_breakdown),
!e.shingle_line && e.preferred_color && s.push("Color previewed: " + e.preferred_color),
e.rep_measurement_edits &&
s.push("Rep adjusted measurements: " + e.rep_measurement_edits),
e.inspection_day &&
s.push(
"Inspection request: " +
e.inspection_day +
", " +
e.inspection_window,
),
e.customer_notes && s.push("Notes: " + e.customer_notes),
s.push(
"SMS consent: updates " +
e.sms_transactional_consent +
", marketing " +
e.sms_marketing_consent,
));
const a = ["utm_source", "utm_medium", "utm_campaign", "gclid", "fbclid"]
.filter((r) => e[r])
.map((r) => r + "=" + e[r])
.join(" ");
return (
a && s.push("Ad source: " + a),
s.join(`
`)
);
}
const $ = {};
function j(e, s, t) {
if (!(P || o.rep) && !$[e]) {
$[e] = !0;
try {
if (typeof window.fbq != "function") return;
const a = Object.assign(
{ content_name: "Instant Roof Quote", content_category: "Roofing" },
s || {},
);
window.fbq(t ? "trackCustom" : "track", e, a, {
eventID: o.quoteId + "-" + e,
});
} catch {}
}
}
async function U(e) {
e !== "quote_abandoned" && (o.leadSent = !0);
const s = Z(e);
if (
((o.lastPayload = s),
P &&
console.log(
"[TFQ] lead payload (" + (o.sendLeads ? "sending" : "not sent") + ")",
s,
),
!(!o.sendLeads || !v.ghlWebhookUrl))
)
try {
const t = await fetch(v.ghlWebhookUrl, {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify(s),
keepalive: !0,
});
if (!t.ok) throw new Error(t.status);
} catch {
try {
const a = new URLSearchParams();
(Object.keys(s).forEach((r) => a.append(r, s[r])),
await fetch(v.ghlWebhookUrl, {
method: "POST",
mode: "no-cors",
body: a,
keepalive: !0,
}));
} catch (a) {
console.warn("[TFQ] lead send failed", a);
}
}
}
// Visitor measured a roof but left before giving contact info: send the address and
// roof/price details (no personal info) so the team sees unfinished quotes.
function sendAbandon() {
if (o.leadSent || o.abandonSent || o.rep || P || o.spam || !o.sendLeads || !v.ghlUnfinishedWebhookUrl || !o.roof || !o.address) return;
if (!["measured", "manual", "issue", "layers", "timeline", "contact"].includes(o.step)) return;
o.abandonSent = !0;
try {
o.roof.areaSqft && O();
const s = Z("quote_abandoned");
s.step_reached = o.step;
const a = new URLSearchParams();
Object.keys(s).forEach((r) => a.append(r, s[r]));
fetch(v.ghlUnfinishedWebhookUrl, { method: "POST", mode: "no-cors", body: a, keepalive: !0 });
} catch (q) {}
}
let B = null;
function N() {
return L
? Promise.resolve(!1)
: window.google && google.maps && google.maps.importLibrary && google.maps.Map
? Promise.resolve(!0)
: B ||
((B = new Promise((e, s) => {
window.__tfqMapsReady = () => e(!0);
const t = document.createElement("script");
((t.src =
"https://maps.googleapis.com/maps/api/js?key=" +
encodeURIComponent(v.googleApiKey) +
"&v=weekly&loading=async&libraries=places&callback=__tfqMapsReady"),
(t.async = !0),
(t.onerror = () => s(new Error("maps-load"))),
document.head.appendChild(t));
})),
B);
}
function de(e, s) {
if (((i("tfq-mapbadge").textContent = "Satellite view"), L)) {
X();
return;
}
const t = { lat: e, lng: s };
(o.gmap
? (o.gmap.setCenter(t), o.gmap.setZoom(20))
: ((o.gmap = new google.maps.Map(i("tfq-map"), {
center: t,
zoom: 20,
mapTypeId: "satellite",
tilt: 0,
disableDefaultUI: !0,
zoomControl: !0,
gestureHandling: "cooperative",
clickableIcons: !1,
})),
o.gmap.addListener("click", (a) => {
if (o.step !== "confirm") return;
(o.gmap.panTo(a.latLng),
(o.address.lat = a.latLng.lat()),
(o.address.lng = a.latLng.lng()),
(o.pinMoved = !0));
const r = y.querySelector("#tfq-pinmsg");
r &&
(r.textContent =
"Pin moved. We'll measure the roof under the pin.");
})),
K());
}
function K() {
((o.overlays || []).forEach((e) => e.setMap(null)), (o.overlays = []));
}
// Draws the main roof plus any other roofs (extras: [{x}]) and the property line.
function fe(e, extras, noFit) {
if (L) {
X(!0, extras);
return;
}
if (!o.gmap) return;
K();
const lw = (t) => Math.round(t.length * 7.4 + 22),
many = extras && extras.length,
l0 = many ? e.label || ORD[0] : e.areaSqft.toLocaleString() + " sq ft",
items = [{ roof: e, fill: "#E8412E", stroke: "#9E1B0F", label: l0, w: lw(l0) }];
(extras || []).forEach((q) => {
const t = q.x.label || "Roof " + q.x.num;
items.push({
roof: q.x.roof,
fill: q.x.include ? "#E8412E" : "#FFFFFF",
stroke: q.x.include ? "#9E1B0F" : "#FFFFFF",
dash: !q.x.include,
label: t,
w: lw(t),
});
});
items.forEach((it) => feOne(it));
if (many && o.parcel && o.parcel.rings && o.parcel.rings.length) {
const pl = new google.maps.Polygon({
paths: o.parcel.rings,
strokeColor: "#FFFFFF",
strokeOpacity: 0.85,
strokeWeight: 2,
fillOpacity: 0,
clickable: !1,
map: o.gmap,
});
o.overlays.push(pl);
}
if (noFit) return;
const boxes = [e].concat((extras || []).map((q) => q.x.roof)).map((r) => r.buildingBox).filter(Boolean);
if (boxes.length) {
o.gmap.fitBounds(
{
south: Math.min(...boxes.map((t) => t.sw.latitude)),
west: Math.min(...boxes.map((t) => t.sw.longitude)),
north: Math.max(...boxes.map((t) => t.ne.latitude)),
east: Math.max(...boxes.map((t) => t.ne.longitude)),
},
40,
);
}
}
function feOne(it) {
const e = it.roof;
let s = e.footprint ? e.footprint.rings : (e.segments || []).map(ue).filter(Boolean);
if (!s.length && e.buildingBox) {
const b = e.buildingBox;
s = [[{ lat: b.ne.latitude, lng: b.ne.longitude }, { lat: b.sw.latitude, lng: b.ne.longitude }, { lat: b.sw.latitude, lng: b.sw.longitude }, { lat: b.ne.latitude, lng: b.sw.longitude }]];
}
if (s.length) {
const t = new google.maps.OverlayView();
((t.onAdd = function () {
((this.div = document.createElement("div")),
(this.div.style.cssText = "position:absolute;pointer-events:none"),
this.getPanes().overlayLayer.appendChild(this.div));
}),
(t.onRemove = function () {
this.div && this.div.remove();
}),
(t.draw = function () {
const a = this.getProjection();
if (!a || !this.div) return;
const r = s.map((q) =>
q.map((S) =>
a.fromLatLngToDivPixel(new google.maps.LatLng(S.lat, S.lng)),
),
),
n = r.flat().map((q) => q.x),
d = r.flat().map((q) => q.y),
u = Math.min(...n) - 6,
l = Math.min(...d) - 6,
g = Math.max(...n) - u + 6,
f = Math.max(...d) - l + 6,
h = r
.map(
(q) =>
"M" +
q
.map(
(S) => (S.x - u).toFixed(1) + " " + (S.y - l).toFixed(1),
)
.join("L") +
"Z",
)
.join(""),
p = r.flat().reduce((q, S) => q + S.x, 0) / r.flat().length - u,
b = r.flat().reduce((q, S) => q + S.y, 0) / r.flat().length - l,
x = it.label,
W2 = it.w;
(Object.assign(this.div.style, {
left: u + "px",
top: l + "px",
width: g + "px",
height: f + "px",
}),
(this.div.innerHTML =
'<svg width="' +
g +
'" height="' +
f +
'" style="overflow:visible;display:block"><g opacity="' +
(it.dash ? ".9" : ".68") +
'"><path d="' +
h +
'" fill="none" stroke="' +
it.stroke +
'" stroke-width="' +
(it.dash ? 3 : 5) +
'" stroke-linejoin="round"' +
(it.dash ? ' stroke-dasharray="7 5"' : "") +
'/><path d="' +
h +
'" fill="' +
it.fill +
'" fill-opacity="' +
(it.dash ? ".22" : "1") +
'"/></g><g transform="translate(' +
p.toFixed(1) +
" " +
b.toFixed(1) +
')"><rect x="' +
-W2 / 2 +
'" y="-13" width="' +
W2 +
'" height="26" rx="' +
(it.dash ? 13 : 6) +
'" fill="' +
(it.dash ? "#0A0A0A" : "#fff") +
'"/><text x="0" y="5" text-anchor="middle" font-family="Montserrat,Arial,sans-serif" font-size="12.5" font-weight="800" fill="' +
(it.dash ? "#fff" : "#0A0A0A") +
'">' +
x +
"</text></g></svg>"));
}),
t.setMap(o.gmap),
o.overlays.push(t));
}
}
function ue(e) {
const s = e.box,
t = e.center.latitude,
a = e.center.longitude,
r = 110540,
n = 111320 * Math.cos((t * Math.PI) / 180),
d = (s.ne.longitude - s.sw.longitude) * n,
u = (s.ne.latitude - s.sw.latitude) * r;
if (!(d > 0 && u > 0)) return null;
const l = (e.azimuth * Math.PI) / 180,
g = Math.abs(Math.cos(l)),
f = Math.abs(Math.sin(l));
let h, p;
const b = g * g - f * f;
if (
(Math.abs(b) > 0.25 &&
((h = (d * g - u * f) / b), (p = (u * g - d * f) / b)),
!(h > 0.5 && p > 0.5))
) {
const M = e.ground || d * u * 0.6;
h = p = Math.sqrt(M);
}
if (e.ground > 0) {
const M = Math.min(1, Math.sqrt(e.ground / (h * p)));
M > 0.55 && ((h *= M), (p *= M));
}
const x = Math.sin(l),
q = Math.cos(l),
S = Math.cos(l),
W = -Math.sin(l);
return [
[1, 1],
[1, -1],
[-1, -1],
[-1, 1],
].map(([M, F]) => {
const ge = (M * S * h) / 2 + (F * x * p) / 2,
ye = (M * W * h) / 2 + (F * q * p) / 2;
return { lat: t + ye / r, lng: a + ge / n };
});
}
function X(e, extras) {
const DEMO = [
[600, 120, 100, 70],
[615, 232, 48, 34],
];
let s = e
? '<g fill="rgba(255,84,64,.22)" stroke="#FF5440" stroke-width="2.5"><polygon points="250,95 550,95 490,160 310,160"/><polygon points="250,95 310,160 310,210 250,275"/><polygon points="550,95 490,160 490,210 550,275"/><polygon points="250,275 310,210 490,210 550,275"/></g>'
: "";
(extras || []).slice(0, 2).forEach((q, n) => {
const [x0, y0, w0, h0] = DEMO[n],
on = q.x.include;
s +=
'<rect x="' + x0 + '" y="' + y0 + '" width="' + w0 + '" height="' + h0 + '" fill="#6a6e73"/><rect x="' + x0 + '" y="' + y0 + '" width="' + w0 + '" height="' + h0 + '" fill="' +
(on ? "rgba(255,84,64,.35)" : "rgba(255,255,255,.18)") + '" stroke="' + (on ? "#FF5440" : "#fff") + '" stroke-width="2.5"' + (on ? "" : ' stroke-dasharray="7 5"') +
'/><circle cx="' + (x0 + w0 / 2) + '" cy="' + (y0 + h0 / 2) + '" r="13" fill="' + (on ? "#fff" : "#0A0A0A") + '"/><text x="' + (x0 + w0 / 2) + '" y="' + (y0 + h0 / 2 + 5) +
'" text-anchor="middle" font-family="Montserrat,Arial,sans-serif" font-size="13" font-weight="800" fill="' + (on ? "#0A0A0A" : "#fff") + '">' + q.x.num + "</text>";
});
i("tfq-map").innerHTML =
'<svg class="tf-map-demo" viewBox="0 0 800 370" preserveAspectRatio="xMidYMid slice" aria-label="Sample satellite view"><defs><pattern id="tfg" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="#3d5a36"/><circle cx="6" cy="7" r="2" fill="#46663e"/><circle cx="17" cy="16" r="2.4" fill="#35502f"/></pattern></defs><rect width="800" height="370" fill="url(#tfg)"/><rect x="0" y="300" width="800" height="70" fill="#5b5f63"/><rect x="0" y="332" width="800" height="3" fill="#d8c56a" opacity=".7"/><rect x="370" y="275" width="60" height="30" fill="#9ea3a8"/><circle cx="120" cy="90" r="46" fill="#2c4428"/><circle cx="680" cy="210" r="54" fill="#2c4428"/><circle cx="700" cy="70" r="32" fill="#31492c"/><g><polygon points="250,95 550,95 490,160 310,160" fill="#5d6166"/><polygon points="250,95 310,160 310,210 250,275" fill="#4a4e53"/><polygon points="550,95 490,160 490,210 550,275" fill="#6e7378"/><polygon points="250,275 310,210 490,210 550,275" fill="#55595e"/><rect x="310" y="160" width="180" height="50" fill="#62676c"/><line x1="310" y1="185" x2="490" y2="185" stroke="#7d8287" stroke-width="3"/></g>' +
s +
(e
? ""
: '<g transform="translate(400 150)"><path d="M0 0c-11-14-18-22-18-32a18 18 0 0 1 36 0c0 10-7 18-18 32z" fill="#EA4335" stroke="#fff" stroke-width="2"/><circle cx="0" cy="-32" r="6" fill="#7a1b12"/></g>') +
"</svg>";
}
function A(e, s) {
const t = parseInt(e.slice(1), 16),
a = (r) =>
Math.max(0, Math.min(255, Math.round(r + (s < 0 ? r : 255 - r) * s)));
return (
"#" +
[a(t >> 16), a((t >> 8) & 255), a(t & 255)]
.map((r) => r.toString(16).padStart(2, "0"))
.join("")
);
}
let pe = 0;
function ee(e, s) {
const t = "tfp" + ++pe,
a = e,
r = A(a, 0.16),
n = A(a, -0.22),
d = A(a, -0.45);
let u;
return (
s === "designer"
? (u =
'<pattern id="' +
t +
'" width="18" height="22" patternUnits="userSpaceOnUse" patternTransform="scale(.62)"><rect width="18" height="22" fill="' +
n +
'"/><rect x="0.8" y="0.8" width="7.4" height="9.6" rx=".6" fill="' +
a +
'"/><rect x="9.8" y="0.8" width="7.4" height="9.6" rx=".6" fill="' +
r +
'"/><rect x="-4" y="11.8" width="7.4" height="9.6" rx=".6" fill="' +
r +
'"/><rect x="5.2" y="11.8" width="7.4" height="9.6" rx=".6" fill="' +
a +
'"/><rect x="14.2" y="11.8" width="7.4" height="9.6" rx=".6" fill="' +
A(a, -0.08) +
'"/></pattern>')
: s === "premium"
? (u =
'<pattern id="' +
t +
'" width="33" height="10" patternUnits="userSpaceOnUse" patternTransform="scale(.62)"><rect width="33" height="10" fill="' +
a +
'"/><rect x="0" y="0" width="9" height="10" fill="' +
r +
'"/><rect x="9.6" y="0" width="7" height="10" fill="' +
n +
'"/><rect x="17.2" y="0" width="10" height="10" fill="' +
A(a, 0.06) +
'"/><rect x="27.8" y="0" width="5.2" height="10" fill="' +
d +
'"/><rect x="0" y="8.6" width="33" height="1.4" fill="' +
d +
'"/></pattern>')
: (u =
'<pattern id="' +
t +
'" width="28" height="9" patternUnits="userSpaceOnUse" patternTransform="scale(.62)"><rect width="28" height="9" fill="' +
a +
'"/><rect x="0" y="0" width="12" height="9" fill="' +
r +
'"/><rect x="12.6" y="0" width="8" height="9" fill="' +
n +
'"/><rect x="0" y="7.8" width="28" height="1.2" fill="' +
d +
'"/></pattern>'),
'<svg class="tf-house" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Illustration of a house with this roof"><defs>' +
u +
'<linearGradient id="' +
t +
's" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CFE2F1"/><stop offset="1" stop-color="#F1F5F8"/></linearGradient></defs><rect width="400" height="200" fill="url(#' +
t +
's)"/><circle cx="24" cy="150" r="30" fill="#5C7F4E"/><circle cx="376" cy="146" r="34" fill="#557A48"/><circle cx="352" cy="162" r="22" fill="#6A8F5A"/><rect y="174" width="400" height="26" fill="#86AD71"/><rect x="56" y="128" width="78" height="48" fill="#E6E0D4"/><polygon points="44,131 70,100 134,100 134,131" fill="url(#' +
t +
')" stroke="' +
d +
'" stroke-width="1.5"/><rect x="120" y="106" width="180" height="70" fill="#EFEAE1"/><g stroke="#DDD5C7" stroke-width="1">' +
[114, 122, 130, 138, 146, 154, 162, 170]
.map((l) => '<line x1="120" x2="300" y1="' + l + '" y2="' + l + '"/>')
.join("") +
'</g><polygon points="104,110 210,46 316,110" fill="url(#' +
t +
')" stroke="' +
d +
'" stroke-width="1.5" stroke-linejoin="round"/><line x1="104" y1="110" x2="316" y2="110" stroke="#fff" stroke-width="3"/><line x1="44" y1="131" x2="134" y2="131" stroke="#fff" stroke-width="3"/><circle cx="210" cy="84" r="7" fill="#fff"/><circle cx="210" cy="84" r="4.5" fill="#C9D6DF"/><rect x="196" y="136" width="28" height="40" fill="#8A2F20"/><circle cx="219" cy="157" r="1.6" fill="#E9C46A"/><g fill="#A9CBE0" stroke="#fff" stroke-width="3"><rect x="138" y="124" width="36" height="28"/><rect x="246" y="124" width="36" height="28"/><rect x="72" y="142" width="44" height="22"/></g><g stroke="#fff" stroke-width="1.5"><line x1="156" y1="124" x2="156" y2="152"/><line x1="264" y1="124" x2="264" y2="152"/><line x1="94" y1="142" x2="94" y2="164"/></g><rect x="186" y="174" width="48" height="4" fill="#BDB6A8"/></svg>'
);
}
const k = {};
((k.address = function () {
y.innerHTML =
'<h1>What will a new roof <em>cost?</em></h1><p class="tf-sub">Enter your address. We measure your roof from satellite imagery and show real prices in about 30 seconds, with no salesperson visit needed.</p><div class="tf-field"><label class="tf-lbl" for="tfq-addr">Home address</label><input type="text" id="tfq-addr" autocomplete="off" placeholder="Start typing your address\u2026" value="' +
c(o.address ? o.address.formatted : "") +
'"><div class="tf-sugg" id="tfq-sugg" role="listbox"></div></div><button class="tf-btn" id="tfq-go">Get my instant quote</button><p class="tf-err" id="tfq-err"></p><div class="tf-trust"><span>' +
w.shield +
"No obligation</span><span>" +
w.shield +
"Local " +
c(v.business.serviceArea) +
" crews</span><span>" +
w.shield +
"Free inspection to confirm</span></div>";
const e = i("tfq-addr"),
s = i("tfq-sugg"),
t = i("tfq-err");
let a = [],
r = -1,
n = null,
d = null,
u = null;
function l() {
if (!a.length) {
(s.classList.remove("on"), (s.innerHTML = ""));
return;
}
((s.innerHTML = a
.map(
(p, b) =>
'<button type="button" data-i="' +
b +
'" class="' +
(b === r ? "act" : "") +
'">' +
c(p.text) +
"</button>",
)
.join("")),
s.classList.add("on"),
s.querySelectorAll("button").forEach(
(p) =>
(p.onmousedown = (b) => {
(b.preventDefault(), f(+p.dataset.i));
}),
));
}
async function g(p) {
if (L || p.trim().length < 4) {
((a = []), l());
return;
}
try {
await N();
const { AutocompleteSuggestion: b, AutocompleteSessionToken: x } =
await google.maps.importLibrary("places");
n = n || new x();
const { suggestions: q } = await b.fetchAutocompleteSuggestions({
input: p,
sessionToken: n,
includedRegionCodes: v.business.regionCodes,
locationBias: v.business.searchBias,
includedPrimaryTypes: ["street_address", "premise", "subpremise"],
});
((a = (q || [])
.filter((S) => S.placePrediction)
.slice(0, 5)
.map((S) => ({
text: S.placePrediction.text.toString(),
pred: S.placePrediction,
}))),
(r = -1),
l());
} catch (b) {
console.warn("[TFQ] autocomplete", b);
}
}
function f(p) {
((u = a[p]), (e.value = u.text), (a = []), l(), h());
}
(e.addEventListener("input", () => {
((u = null), clearTimeout(d), (d = setTimeout(() => g(e.value), 220)));
}),
e.addEventListener("keydown", (p) => {
p.key === "ArrowDown" && a.length
? ((r = (r + 1) % a.length), l(), p.preventDefault())
: p.key === "ArrowUp" && a.length
? ((r = (r - 1 + a.length) % a.length), l(), p.preventDefault())
: p.key === "Enter" && (p.preventDefault(), r >= 0 ? f(r) : h());
}),
e.addEventListener("blur", () =>
setTimeout(() => {
((a = []), l());
}, 150),
),
(i("tfq-go").onclick = h),
o.address || setTimeout(() => e.focus(), 50));
async function h() {
t.textContent = "";
const p = e.value.trim();
if (p.length < 6) {
t.textContent = "Please enter your full street address.";
return;
}
const b = i("tfq-go");
((b.disabled = !0), (b.textContent = "Finding your home\u2026"));
try {
if (L)
o.address = {
formatted: p,
street: p.split(",")[0],
city: "",
state: "",
postal: "",
lat: 41.7658,
lng: -72.6734,
};
else {
if ((await N(), !u)) {
if ((a.length || (await g(p)), !a.length))
throw new Error("not-found");
u = a[0];
}
const x = u.pred.toPlace();
(await x.fetchFields({
fields: ["formattedAddress", "location", "addressComponents"],
}),
(n = null));
const q = (S, W) => {
const M = (x.addressComponents || []).find((F) =>
F.types.includes(S),
);
return M ? (W ? M.shortText : M.longText) : "";
};
o.address = {
formatted: x.formattedAddress,
street: [q("street_number"), q("route")].filter(Boolean).join(" "),
city: q("locality") || q("sublocality") || q("postal_town"),
state: q("administrative_area_level_1", !0),
postal: q("postal_code"),
lat: x.location.lat(),
lng: x.location.lng(),
};
}
((o.roof = null),
(o.extras = []),
(o.quote = null),
(o.selected = null),
(o.pinMoved = !1),
j("QuoteStarted", {}, !0),
_("confirm"));
} catch (x) {
(console.warn("[TFQ] address", x),
(t.textContent =
"We couldn't find that address. Try picking it from the list as you type."),
(b.disabled = !1),
(b.textContent = "Get my instant quote"));
}
}
}),
(k.confirm = function () {
(de(o.address.lat, o.address.lng),
(y.innerHTML =
E("address") +
'<h2>Is this your home?</h2><div class="tf-addr">' +
w.pin +
"<span>" +
c(o.address.formatted) +
'</span></div><p class="tf-note" id="tfq-pinmsg">' +
(L
? "Sample view in demo mode."
: "Not quite right? Tap your roof on the map to move the pin.") +
'</p><div class="tf-actions"><button class="tf-btn" id="tfq-yes">Yes, measure my roof</button></div>'),
T(),
(i("tfq-yes").onclick = () => _("measuring")));
}),
(k.measuring = async function () {
i("tfq-mapbadge").textContent = "Measuring roof\u2026";
const e = [
"Locating your roof",
"Measuring every roof facet",
"Checking for garages & other roofs",
"Calculating pitch & complexity",
"Building your price options",
];
y.innerHTML =
'<div style="text-align:center"><div class="tf-spin"></div><h2>Measuring your roof\u2026</h2><ul class="tf-steps-list">' +
e
.map((n, d) => '<li id="tfq-ms' + d + '"><i></i>' + n + "</li>")
.join("") +
"</ul></div>";
const s = (n) => {
const d = i("tfq-ms" + n);
d && d.classList.add("done");
};
let t = null,
a = !1;
const r = (async () => {
if (L) {
const n = v.demoRoof;
return {
areaSqft: n.areaSqft,
pitchDeg: n.pitchDeg,
pitch12: Math.round(R(n.pitchDeg)),
facets: n.facets,
lowSlopePct: 0,
quality: "DEMO",
imageryDate: "",
source: "demo",
segments: [],
buildingBox: null,
};
}
return ie(o.address.lat, o.address.lng);
})()
.then((n) => {
t = n;
})
.catch((n) => {
(console.warn("[TFQ] solar", n), (a = !0));
});
let xp = Promise.resolve([]),
xl = [];
o.extras = [];
for (let n = 0; n < e.length; n++) {
(await ae(P ? 150 : n === 2 ? 400 : 650), n === 1 && (await r));
n === 1 && !a && t && t.areaSqft >= 300 && (xp = scanExtras(t).catch((q) => (console.warn("[TFQ] other roofs", q), [])));
n === 2 && (xl = await xp);
s(n);
}
if ((await r, o.step === "measuring")) {
if (a || !t || t.areaSqft < 300) {
_("manual");
return;
}
((o.extras = xl), xNumber(),
(t.label = t.label || ORD[0]),
(o.roof = satInit(t)),
j("RoofMeasured", { roof_sqft: t.areaSqft }, !0),
_("measured"));
}
}),
(k.measured = function () {
const e = o.roof,
xs = o.extras || [],
many = xs.length > 0,
SIC = {
flat: '<svg viewBox="0 0 32 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 9h24v11H4z"/><path d="M2 9h28"/></svg>',
shallow: '<svg viewBox="0 0 32 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M6 12v9h20v-9"/><path d="M2 13 16 6l14 7"/></svg>',
medium: '<svg viewBox="0 0 32 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M7 12v9h18v-9"/><path d="M3 13 16 3l13 10"/></svg>',
steep: '<svg viewBox="0 0 32 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M9 13v8h14v-8"/><path d="M5 15 16 1l11 14"/></svg>',
},
card = (r0, key, isMain, x) => {
satInit(r0);
const si = slopeIdx(r0.sat.slope),
on = isMain || x.include;
return (
'<div class="tf-rc' +
(on ? "" : " off") +
'" data-k="' +
c(key) +
'"><div class="tf-rc-top">' +
w.house +
'<input class="tf-rc-name" data-k="' +
c(key) +
'" value="' +
c(isMain ? r0.label || ORD[0] : x.label) +
'" maxlength="30" aria-label="Roof name"><span class="tf-rc-pen" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg></span></div><div class="tf-rc-meta">' +
r0.areaSqft.toLocaleString() +
" sq ft \xB7 " +
(r0.noSat ? "slope not measured, pick one" : r0.pitch12 + "/12 pitch") +
(isMain ? "" : " \xB7 ~" + x.distFt + " ft " + c(x.dir)) +
'</div><div class="tf-slopes" role="group" aria-label="Roof slope">' +
SLOPES.map((q, n) => {
const dis = !r0.noSat && n < si;
return (
'<button type="button" class="tf-sl' +
(r0.slope === q.id ? " sel" : "") +
'" data-k="' +
c(key) +
'" data-s="' +
q.id +
'"' +
(dis ? ' disabled title="Satellite measured this roof as ' + SLOPES[si].t.toLowerCase() + '"' : "") +
"><i>" +
SIC[q.id] +
"</i>" +
q.t +
(n === si ? "<small>" + (r0.noSat ? "Typical" : "Satellite") + "</small>" : "") +
"</button>"
);
}).join("") +
"</div>" +
(r0.slope === "flat"
? '<p class="tf-rc-flat">Flat roofs need a different material' + (isMain ? "; we'll confirm at your inspection." : ", so this one is priced at your free inspection.") + "</p>"
: "") +
'<label class="tf-rc-inc"><input type="checkbox" data-k="' +
c(key) +
'"' +
(on ? " checked" : "") +
(isMain ? " disabled" : "") +
"><span>" +
(isMain ? "Main house, always included" : "Include in my quote") +
"</span></label></div>"
);
},
paint = (noFit) => {
fe(e, xs.map((x) => ({ x: x })), noFit);
i("tfq-cards").innerHTML =
card(e, "main", !0) + xs.map((x) => card(x.roof, x.key, !1, x)).join("");
const n = xIncluded().length;
i("tfq-next").textContent = o.rep
? "Continue"
: "See my price" + (n ? " (" + (n + 1) + " roofs)" : "");
wire();
},
find = (k2) => (k2 === "main" ? { r: e } : { r: (xs.find((x) => x.key === k2) || {}).roof, x: xs.find((x) => x.key === k2) }),
wire = () => {
y.querySelectorAll(".tf-sl").forEach(
(b) =>
(b.onclick = () => {
const f = find(b.dataset.k);
f.r && (setSlope(f.r, b.dataset.s), paint(!0));
}),
);
y.querySelectorAll(".tf-rc-inc input").forEach(
(b) =>
(b.onchange = () => {
const f = find(b.dataset.k);
f.x && ((f.x.include = b.checked), paint(!0));
}),
);
y.querySelectorAll(".tf-rc-name").forEach(
(b) =>
(b.onchange = () => {
const f = find(b.dataset.k),
v2 = b.value.trim() || (f.x ? ORD[f.x.num - 1] || "Roof " + f.x.num : ORD[0]);
(f.x ? (f.x.label = v2) : (e.label = v2), paint(!0));
}),
);
};
((i("tfq-mapbadge").textContent =
e.source === "demo" ? "Sample measurement" : many ? xs.length + 1 + " roofs found" : "Roof measured"),
(y.innerHTML =
(many
? "<h2>Review your <em>roofs.</em></h2>"
: "<h2>Your roof is <em>measured.</em></h2>") +
'<p class="tf-sub" style="margin-bottom:0">' +
(many
? o.parcel
? "We found " + (xs.length + 1) + " roofs on your property at " + c(o.address.street || o.address.formatted) + ". Uncheck any you don't want priced."
: "We found roofs near " + c(o.address.street || o.address.formatted) + ". Check the ones on your property that you'd like priced."
: "Here's what we found at " + c(o.address.street || o.address.formatted) + ".") +
" Each slope was measured by satellite; if a roof is steeper than that, pick the steeper option.</p>" +
(e.lowSlopePct >= 15
? '<p class="tf-note warn">About ' +
e.lowSlopePct +
"% of the main roof looks flat or low-slope. Those sections are usually a different material; we'll confirm at your free inspection.</p>"
: "") +
'<div class="tf-rcards" id="tfq-cards"></div><p class="tf-note">' +
(e.imageryDate ? "Satellite imagery from " + c(e.imageryDate) + ". " : "") +
(many && o.parcel ? "Buildings found inside your property lines on file with the state. " : "") +
'</p><div class="tf-actions"><button class="tf-btn" id="tfq-next"></button>' +
`<button class="tf-link" id="tfq-wrong">This doesn't look right</button></div>`),
paint(),
(i("tfq-next").onclick = () => _(o.rep ? "repadjust" : "issue")),
(i("tfq-wrong").onclick = () => _("manual")));
}),
(k.manual = function () {
const e = o.manual;
((y.innerHTML =
E("address") +
'<h2>Help us size your roof</h2><p class="tf-sub">' +
(o.roof
? "No problem. "
: "Our satellite measurement isn't available for this address yet. ") +
`Answer three quick questions and we'll estimate it.</p><div class="tf-field"><label class="tf-lbl" for="tfq-sqft">Home size (living space, sq ft)</label><input type="number" inputmode="numeric" id="tfq-sqft" placeholder="e.g. 2,000" value="` +
c(e.sqft) +
'"></div><label class="tf-lbl">How many stories?</label><div class="tf-days" id="tfq-stories" style="grid-template-columns:repeat(4,1fr);margin-bottom:14px">' +
[
["1", "1"],
["1.5", "1\xBD"],
["2", "2"],
["3", "3"],
]
.map(
(s) =>
'<button class="tf-day' +
(e.stories === s[0] ? " sel" : "") +
'" data-v="' +
s[0] +
'">' +
s[1] +
"<small>" +
(s[0] === "1" ? "story" : "stories") +
"</small></button>",
)
.join("") +
'</div><label class="tf-lbl">How steep is your roof?</label><div id="tfq-slope">' +
I(
[
{
v: "low",
t: "Low / gentle",
s: "Easy to walk on",
icon: w.house,
},
{ v: "medium", t: "Medium", s: "Most common in CT", icon: w.house },
{ v: "steep", t: "Steep", s: "Hard to stand on", icon: w.house },
],
e.slope,
) +
'</div><p class="tf-err" id="tfq-err"></p><div class="tf-actions"><button class="tf-btn" id="tfq-next">Continue</button></div>'),
T(),
y.querySelectorAll("#tfq-stories .tf-day").forEach(
(s) =>
(s.onclick = () => {
((e.stories = s.dataset.v),
y
.querySelectorAll("#tfq-stories .tf-day")
.forEach((t) => t.classList.toggle("sel", t === s)));
}),
),
y.querySelectorAll("#tfq-slope .tf-opt").forEach(
(s) =>
(s.onclick = () => {
((e.slope = s.dataset.v),
y
.querySelectorAll("#tfq-slope .tf-opt")
.forEach((t) => t.classList.toggle("sel", t === s)));
}),
),
(i("tfq-next").onclick = () => {
e.sqft = i("tfq-sqft").value;
const s = parseFloat(e.sqft);
if (!s || s < 400 || s > 15e3) {
i("tfq-err").textContent =
"Please enter your home's square footage (400 \u2013 15,000).";
return;
}
if (!e.stories) {
i("tfq-err").textContent = "Please choose the number of stories.";
return;
}
if (!e.slope) {
i("tfq-err").textContent = "Please choose how steep your roof is.";
return;
}
((o.roof = le()), _(o.rep ? "repadjust" : "issue"));
}));
}));
function Q(e, s, t, a, r, n) {
((y.innerHTML =
E(r) +
"<h2>" +
s +
'</h2><p class="tf-sub">' +
t +
"</p>" +
I(a, o.answers[e])),
T(),
y.querySelectorAll(".tf-opt").forEach(
(d) =>
(d.onclick = () => {
((o.answers[e] = d.dataset.v),
y
.querySelectorAll(".tf-opt")
.forEach((u) => u.classList.toggle("sel", u === d)),
setTimeout(() => _(n), 180));
}),
));
}
const he = () =>
o.roof && o.roof.source === "homeowner_estimate"
? "manual"
: "measured";
((k.issue = () =>
Q(
"issue",
"What's going on with your roof?",
"Question 1 of 3",
[
{
v: "Leaking",
t: "It's leaking",
s: "Water stains, drips or damage",
icon: w.drop,
},
{
v: "Old / worn out",
t: "It's old or worn out",
s: "Curling, missing or granule loss",
icon: w.clock,
},
{ v: "Storm damage", t: "Storm or wind damage", icon: w.storm },
{ v: "Buying / selling", t: "Buying or selling a home", icon: w.house },
{ v: "Just planning", t: "Just planning ahead", icon: w.search },
],
he(),
"layers",
)),
(k.layers = () =>
Q(
"layers",
"How many layers of shingles are on it now?",
"Question 2 of 3 \xB7 Extra layers cost more to remove.",
[
{ v: "1", t: "One layer", icon: w.layers },
{ v: "2+", t: "Two or more layers", icon: w.layers },
{
v: "unsure",
t: "Not sure",
s: "No problem, we'll check at inspection",
icon: w.help,
},
],
"issue",
"timeline",
)),
(k.timeline = () =>
Q(
"timeline",
"When are you hoping to get it done?",
"Question 3 of 3",
[
{ v: "ASAP", t: "As soon as possible", icon: w.bolt },
{ v: "1-3 months", t: "In the next 1\u20133 months", icon: w.cal },
{ v: "3+ months", t: "3+ months from now", icon: w.cal },
{
v: "Just researching",
t: "Just researching prices",
icon: w.search,
},
],
"layers",
"contact",
)),
(k.contact = function () {
const e = o.contact,
s = v.business;
(O(),
(y.innerHTML =
E("timeline") +
`<h2>Your prices are <em>ready.</em></h2><p class="tf-sub">Where should we send your quote? You'll see all three roof options on the next screen.</p><div class="tf-row"><div class="tf-field"><label class="tf-lbl" for="tfq-first">First name</label><input type="text" id="tfq-first" autocomplete="given-name" value="` +
c(e.first) +
'"></div><div class="tf-field"><label class="tf-lbl" for="tfq-last">Last name</label><input type="text" id="tfq-last" autocomplete="family-name" value="' +
c(e.last) +
'"></div></div><div class="tf-field"><label class="tf-lbl" for="tfq-phone">Mobile phone</label><input type="tel" id="tfq-phone" autocomplete="tel" placeholder="(555) 000-0000" value="' +
c(e.phone) +
'"></div><div class="tf-field"><label class="tf-lbl" for="tfq-email">Email</label><input type="email" id="tfq-email" autocomplete="email" placeholder="you@email.com" value="' +
c(e.email) +
'"></div><div class="tf-hp" aria-hidden="true"><label>Company website<input type="text" id="tfq-hp" tabindex="-1" autocomplete="off"></label></div><label class="tf-check"><input type="checkbox" id="tfq-smstx"' +
(e.smsTx ? " checked" : "") +
"><span>By checking this box, I consent to receive text messages from " +
c(s.name) +
' about my roof quote, inspection request, scheduling and job updates. Message frequency varies. Message &amp; data rates may apply. Text HELP for help, reply STOP to opt out.</span></label><label class="tf-check"><input type="checkbox" id="tfq-smsmkt"' +
(e.smsMkt ? " checked" : "") +
"><span>By checking this box, I consent to receive marketing texts from " +
c(s.name) +
', including seasonal roof maintenance reminders and special offers, at the phone number provided. Frequency may vary. Message &amp; data rates may apply. Text HELP for help, reply STOP to opt out.</span></label><p class="tf-err" id="tfq-err"></p><div class="tf-actions"><button class="tf-btn" id="tfq-next">Show my prices</button></div><p class="tf-legal">We never sell your information. See our <a href="' +
c(s.privacyUrl) +
'" target="_blank" rel="noopener">Privacy Policy</a> and <a href="' +
c(s.termsUrl) +
'" target="_blank" rel="noopener">Terms of Service</a>.</p>'),
T());
const t = i("tfq-phone");
(t.addEventListener("input", () => {
const a = t.value.replace(/\D/g, "").replace(/^1/, "").slice(0, 10);
t.value =
a.length > 6
? "(" + a.slice(0, 3) + ") " + a.slice(3, 6) + "-" + a.slice(6)
: a.length > 3
? "(" + a.slice(0, 3) + ") " + a.slice(3)
: a;
}),
(i("tfq-next").onclick = () => {
((e.first = i("tfq-first").value.trim()),
(e.last = i("tfq-last").value.trim()),
(e.phone = t.value.trim()),
(e.email = i("tfq-email").value.trim()),
(e.smsTx = i("tfq-smstx").checked),
(e.smsMkt = i("tfq-smsmkt").checked));
const a = i("tfq-err");
if (!e.first)
return (a.textContent = "Please enter your first name.");
if (!e.last) return (a.textContent = "Please enter your last name.");
if (e.phone.replace(/\D/g, "").length !== 10)
return (a.textContent = "Please enter a 10-digit phone number.");
if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.email))
return (a.textContent = "Please enter a valid email address.");
// Spam trap: bots fill the hidden field. Show them prices but send nothing.
i("tfq-hp") && i("tfq-hp").value && ((o.spam = !0), (o.sendLeads = !1));
// The selected-package quote is sent after the homeowner chooses a system.
{
const r = o.quote.totals[Math.min(1, o.quote.totals.length - 1)];
j("Lead", { value: r.base, currency: "USD" });
}
_("results");
}));
}),
(k.results = function () {
const e = O(),
s = o.roof;
!o.link && (s.source === "satellite" || L) &&
fe(s, xIncluded().map((x) => ({ x: x })));
const many = e.structures.length + e.flatRoofs.length > 0,
rb = (q, t2, n2, minTxt) =>
q.squares +
" sq \xD7 $" +
(m.tiers[n2].perSquare + q.extraLayers * m.extraLayerPerSquare) +
"/sq" +
(q.surcharge ? " + " + Math.round(q.surcharge * 100) + "% steep" : "") +
" = " +
C(t2.base) +
(t2.minimum ? " (" + minTxt + ")" : "");
const
t = m.tiers,
a = (l) => l.colors || m.colors || [];
((o.colors = o.colors || {}),
t.forEach((l) => {
const g = a(l);
!o.colors[l.id] &&
g.length &&
(o.colors[l.id] = (g.find((f) => f.name === o.color) || g[0]).name);
}));
const r = (l, g) =>
(a(l).find((f) => f.name === g) || a(l)[0] || { hex: "#3C3E42" }).hex,
n = (v.business.trust || [])
.map((l) => "<span>" + l + "</span>")
.join(""),
d = (l) =>
"<ul>" + l.map((g) => "<li>" + c(g) + "</li>").join("") + "</ul>",
u = (l) =>
`<details class="tf-pd"><summary>See package details</summary><h4>What's included</h4>` +
(m.system
? "<p>Installed as an Owens Corning\xAE Total Protection Roofing System\xAE, which protects your home in three areas: SEAL. DEFEND. BREATHE.</p>" +
m.system
.map(
(g) =>
'<div class="grp"><b>' +
c(g.head) +
"</b> " +
c(g.sub) +
"</div>" +
d(
g.items.map((f) =>
f === "Your choice of Owens Corning\xAE shingles"
? l.name + " shingles"
: f,
),
),
)
.join("")
: "") +
(m.included
? '<div class="grp"><b>ALSO INCLUDED.</b></div>' + d(m.included)
: "") +
(m.notIncluded
? "<h4>Additional cost (only if your roof needs it)</h4><p>These aren't in the instant price. If any apply, we'll show you at the inspection and add them to your written proposal.</p>" +
d(m.notIncluded)
: "") +
(m.upgrades
? "<h4>Upgrade options</h4>" +
d(m.upgrades) +
"<p>Upgrades are priced at your free inspection.</p>"
: "") +
"</details>";
((y.innerHTML =
E(o.rep ? "repadjust" : "contact") +
"<h2>" +
(o.rep
? "Roof quote"
: c(o.contact.first ? o.contact.first + ", here" : "Here") +
"'s your <em>roof quote.</em>") +
'</h2><div class="tf-summary"><span class="tf-chip">' +
c(o.address.street || o.address.formatted) +
"</span>" +
(many
? '<span class="tf-chip">' +
(1 + e.structures.length) +
" roofs</span>" +
'<span class="tf-chip">' +
e.totalSqft.toLocaleString() +
' sq ft total</span><span class="tf-chip">' +
e.totalSquares +
" squares</span>"
: '<span class="tf-chip">' +
s.areaSqft.toLocaleString() +
' sq ft roof</span><span class="tf-chip">' +
e.squares +
' squares</span><span class="tf-chip">' +
s.pitch12 +
'/12 pitch</span><span class="tf-chip">' +
s.facets +
" facets</span>") +
(s.source === "homeowner_estimate"
? '<span class="tf-chip">Size estimated</span>'
: "") +
"</div>" +
'<div class="tf-pkgs">' +
e.tiers
.map((l, g) => {
const f = t[g],
h = a(f),
p = o.colors[f.id],
T3 = e.totals[g],
b = o.rep
? '<div class="tf-break">' +
(many ? c(e.mainLabel) + ": " : "") +
rb(e, l, g, "minimum job") +
e.structures
.map((q) => "<br>" + c(q.label) + ": " + rb(q, q.tiers[g], g, "outbuilding minimum"))
.join("") +
"</div>"
: "",
bd = many
? '<div class="tf-rbreak">' +
[
"<span>" + c(e.mainLabel) + " <b>" + C(l.low) + "\u2013" + C(l.high) + "</b></span>",
]
.concat(
e.structures.map(
(q) =>
"<span>" +
c(q.label) +
" <b>" +
C(q.tiers[g].low) +
"\u2013" +
C(q.tiers[g].high) +
"</b></span>",
),
)
.concat(e.flatRoofs.map((x) => "<span>" + c(x.label) + " <b>priced at inspection</b></span>"))
.join("") +
"</div>"
: "";
return (
'<div class="tf-pkg' +
(f.popular ? " pop" : "") +
'" data-tier="' +
c(f.id) +
'">' +
(f.ribbon
? '<span class="ribbon">' + c(f.ribbon) + "</span>"
: "") +
'<div class="brand">' +
c(f.label) +
" package</div><h3>" +
c(f.name) +
'</h3><div class="tf-pkg-top"><div class="tf-art" data-art="' +
c(f.art || "arch") +
'">' +
ee(r(f, p), f.art) +
'</div><div><div class="price">' +
C(T3.low) +
" <small>to</small> " +
C(T3.high) +
"</div>" +
bd +
b +
'<p class="desc">' +
c(f.desc) +
"</p></div></div>" +
(f.specs
? '<dl class="tf-specs">' +
f.specs
.map(
(x) =>
"<div><dt>" +
c(x[0]) +
"</dt><dd>" +
c(x[1]) +
"</dd></div>",
)
.join("") +
"</dl>"
: "") +
(h.length
? '<div class="tf-swatches">' +
h
.map(
(x) =>
'<button class="tf-sw' +
(x.name === p ? " sel" : "") +
'" style="background:' +
x.hex +
'" data-c="' +
c(x.name) +
'" title="' +
c(x.name) +
'" aria-label="' +
c(x.name) +
'"></button>',
)
.join("") +
'</div><div class="tf-swname">Color: ' +
c(p) +
" \xB7 " +
h.length +
" colors</div>"
: "") +
u(f) +
'<button class="tf-btn' +
(f.popular ? "" : " dark") +
'" data-pick="' +
c(l.id) +
'">' +
(o.rep ? "Quote " : "Choose ") +
c(f.label) +
"</button></div>"
);
})
.join("") +
"</div>" +
(n ? '<div class="tf-trustbar">' + n + "</div>" : "") +
(m.warrantyNote
? '<p class="tf-note">' + c(m.warrantyNote) + "</p>"
: "") +
'<p class="tf-note">Prices include full tear-off' +
(e.extraLayers ? " (2 layers)" : "") +
", materials, labor, permit and cleanup. Your final price is confirmed at a free on-site inspection" +
(s.lowSlopePct >= 15
? "; flat/low-slope sections are priced separately"
: "") +
".</p>" + (o.rep ? "" : extrasHtml())),
T(),
o.link && (y.querySelector(".tf-back") && y.querySelector(".tf-back").remove(), (y.querySelector(".tf-summary").innerHTML = linkChips())),
o.myPick && y.querySelectorAll(".tf-pkg").forEach((l) => { if (l.dataset.tier === o.myPick) { l.classList.add("mypick"); l.insertAdjacentHTML("afterbegin", '<span class="tf-mypick">Your pick</span>'); } }),
o.rep || wireExtras(),
y.querySelectorAll(".tf-pkg").forEach((l) => {
const g = t.find((f) => f.id === l.dataset.tier);
l.querySelectorAll(".tf-sw").forEach(
(f) =>
(f.onclick = () => {
((o.colors[g.id] = o.color = f.dataset.c),
l
.querySelectorAll(".tf-sw")
.forEach((p) => p.classList.toggle("sel", p === f)),
(l.querySelector(".tf-swname").textContent =
"Color: " +
f.dataset.c +
" \xB7 " +
a(g).length +
" colors"));
const h = l.querySelector(".tf-art");
h.innerHTML = ee(r(g, f.dataset.c), h.dataset.art);
}),
);
}),
y.querySelectorAll("[data-pick]").forEach(
(l) =>
(l.onclick = async () => {
o.selected = l.dataset.pick;
o.color = o.colors[o.selected] || o.color;
if (!o.rep && !o.link) {
const selectionKey = o.selected + "|" + o.color + "|" + JSON.stringify(o.quote.totals);
if (o.sentSelection !== selectionKey) {
l.disabled = true;
await U("quote_selected");
o.sentSelection = selectionKey;
}
}
_(o.rep ? "repsend" : "schedule");
}),
));
}),
(k.schedule = function () {
const e = o.quote,
s = e.tiers.find((n) => n.id === o.selected),
t = o.appt,
a = [],
r = new Date();
for (r.setHours(12); a.length < 8; )
(r.setDate(r.getDate() + 1), r.getDay() !== 0 && a.push(new Date(r)));
((y.innerHTML =
E("results") +
'<h2>Book your <em>free</em> inspection</h2><p class="tf-sub">You picked <b>' +
c(s.name) +
"</b> (" +
C(e.totals.find((u) => u.id === o.selected).low) +
"\u2013" +
C(e.totals.find((u) => u.id === o.selected).high) +
(e.structures.length
? " for " + [e.mainLabel].concat(e.structures.map((q) => q.label)).map(c).join(" + ")
: "") +
"). A " +
c(v.business.name) +
' pro will confirm measurements and lock in your price. No obligation.</p><label class="tf-lbl">Preferred day</label><div class="tf-days" id="tfq-days">' +
a
.map((n) => {
const d = n.toLocaleDateString("en-US", {
weekday: "long",
month: "short",
day: "numeric",
});
return (
'<button class="tf-day' +
(t.day === d ? " sel" : "") +
'" data-v="' +
c(d) +
'"><small>' +
n.toLocaleDateString("en-US", { weekday: "short" }) +
"</small>" +
n.toLocaleDateString("en-US", {
month: "short",
day: "numeric",
}) +
"</button>"
);
})
.join("") +
'</div><label class="tf-lbl" style="margin-top:14px">Time of day</label><div id="tfq-win">' +
I(
[
{
v: "Morning (8\u201312)",
t: "Morning",
s: "8 am \u2013 12 pm",
icon: w.clock,
},
{
v: "Afternoon (12\u20135)",
t: "Afternoon",
s: "12 \u2013 5 pm",
icon: w.clock,
},
],
t.window,
"two",
) +
'</div><div class="tf-field" style="margin-top:14px"><label class="tf-lbl" for="tfq-notes">Anything we should know? (optional)</label><textarea id="tfq-notes" placeholder="Gate code, leak location, best time to call\u2026">' +
c(t.notes) +
'</textarea></div>' + (o.link && !o.contact.phone ? '<div class="tf-field" style="margin-top:14px"><label class="tf-lbl" for="tfq-lphone">Best phone number to confirm</label><input type="tel" id="tfq-lphone" autocomplete="tel" placeholder="(555) 000-0000"></div>' : "") + '<p class="tf-err" id="tfq-err"></p><div class="tf-actions"><button class="tf-btn" id="tfq-book">Request my free inspection</button></div>'),
T(),
y.querySelectorAll("#tfq-days .tf-day").forEach(
(n) =>
(n.onclick = () => {
((t.day = n.dataset.v),
y
.querySelectorAll("#tfq-days .tf-day")
.forEach((d) => d.classList.toggle("sel", d === n)));
}),
),
y.querySelectorAll("#tfq-win .tf-opt").forEach(
(n) =>
(n.onclick = () => {
((t.window = n.dataset.v),
y
.querySelectorAll("#tfq-win .tf-opt")
.forEach((d) => d.classList.toggle("sel", d === n)));
}),
),
(i("tfq-book").onclick = async () => {
if (((t.notes = i("tfq-notes").value.trim()), !t.day))
return (i("tfq-err").textContent = "Please pick a day.");
if (!t.window)
return (i("tfq-err").textContent = "Please pick a time of day.");
if (i("tfq-lphone")) { const ph = i("tfq-lphone").value.replace(/\D/g, "").replace(/^1/, ""); if (ph.length !== 10) return (i("tfq-err").textContent = "Please enter a 10-digit phone number."); o.contact.phone = "(" + ph.slice(0, 3) + ") " + ph.slice(3, 6) + "-" + ph.slice(6); }
const n = i("tfq-book");
((n.disabled = !0),
(n.textContent = "Sending\u2026"),
await U("inspection_requested"));
{
const d = o.quote.totals.find((u) => u.id === o.selected);
j("Schedule", { value: d ? d.base : 0, currency: "USD" });
}
_("done");
}));
}),
(k.repadjust = function () {
const e = o.roof,
s = o.answers;
(s.layers || (s.layers = "1"),
(y.innerHTML =
E(he()) +
'<h2>Check the measurements</h2><p class="tf-sub">Adjust anything you know is different, then show prices. Changes are noted on the lead.</p><div class="tf-grid3"><div class="tf-field"><label class="tf-lbl" for="tfq-r-area">Roof sq ft</label><input type="number" id="tfq-r-area" value="' +
e.areaSqft +
'"></div><div class="tf-field"><label class="tf-lbl" for="tfq-r-pitch">Pitch (x/12)</label><input type="number" id="tfq-r-pitch" value="' +
e.pitch12 +
'"></div><div class="tf-field"><label class="tf-lbl" for="tfq-r-facets">Facets</label><input type="number" id="tfq-r-facets" value="' +
e.facets +
'"></div></div>' +
xIncluded()
.map(
(x) =>
'<label class="tf-lbl" style="margin-top:4px">' +
c(x.label) +
' (sq ft \xB7 pitch \xB7 facets)</label><div class="tf-grid3" data-x="' +
c(x.key) +
'"><div class="tf-field"><input type="number" aria-label="Roof sq ft" data-f="area" value="' +
x.roof.areaSqft +
'"></div><div class="tf-field"><input type="number" aria-label="Pitch" data-f="pitch" value="' +
x.roof.pitch12 +
'"></div><div class="tf-field"><input type="number" aria-label="Facets" data-f="facets" value="' +
x.roof.facets +
'"></div></div>',
)
.join("") +
'<label class="tf-lbl">Existing layers</label><div id="tfq-r-layers">' +
I(
[
{ v: "1", t: "One layer", icon: w.layers },
{ v: "2+", t: "Two or more", icon: w.layers },
],
s.layers,
"two",
) +
'</div><div class="tf-field" style="margin-top:12px"><label class="tf-lbl" for="tfq-r-issue">Reason for the roof (optional)</label><select id="tfq-r-issue">' +
[
"",
"Old / worn out",
"Leaking",
"Storm damage",
"Buying / selling",
"Just planning",
]
.map(
(t) =>
"<option" +
(s.issue === t ? " selected" : "") +
' value="' +
c(t) +
'">' +
(t || "Select\u2026") +
"</option>",
)
.join("") +
'</select></div><div class="tf-actions"><button class="tf-btn" id="tfq-next">Show prices</button></div>'),
T(),
y.querySelectorAll("#tfq-r-layers .tf-opt").forEach(
(t) =>
(t.onclick = () => {
((s.layers = t.dataset.v),
y
.querySelectorAll("#tfq-r-layers .tf-opt")
.forEach((a) => a.classList.toggle("sel", a === t)));
}),
),
(i("tfq-next").onclick = () => {
const t = parseInt(i("tfq-r-area").value, 10),
a = parseInt(i("tfq-r-pitch").value, 10),
r = parseInt(i("tfq-r-facets").value, 10),
n = [];
(t > 200 &&
t !== e.areaSqft &&
(n.push("area " + e.areaSqft + "\u2192" + t), (e.areaSqft = t)),
a >= 0 &&
a <= 24 &&
a !== e.pitch12 &&
(n.push("pitch " + e.pitch12 + "\u2192" + a),
(e.pitch12 = a),
(e.pitchDeg = H(a))),
r > 0 &&
r !== e.facets &&
(n.push("facets " + e.facets + "\u2192" + r), (e.facets = r)),
y.querySelectorAll("[data-x]").forEach((g) => {
const x = o.extras.find((q) => q.key === g.dataset.x);
if (!x) return;
const rf = x.roof,
val = (f) => parseInt(g.querySelector('[data-f="' + f + '"]').value, 10),
A2 = val("area"),
P2 = val("pitch"),
F2 = val("facets"),
pre = x.label + " ";
(A2 > 20 && A2 !== rf.areaSqft && (n.push(pre + "area " + rf.areaSqft + "→" + A2), (rf.areaSqft = A2)),
P2 >= 0 && P2 <= 24 && P2 !== rf.pitch12 && (n.push(pre + "pitch " + rf.pitch12 + "→" + P2), (rf.pitch12 = P2), (rf.pitchDeg = H(P2))),
F2 > 0 && F2 !== rf.facets && (n.push(pre + "facets " + rf.facets + "→" + F2), (rf.facets = F2)));
}),
n.length &&
(e.repEdits =
(e.repEdits ? e.repEdits + "; " : "") + n.join(", ")),
(s.issue = i("tfq-r-issue").value),
(s.timeline = s.timeline || "Rep quote"),
_("results"));
}));
}),
(k.repsend = function () {
const e = o.contact,
s = o.quote.tiers.find((a) => a.id === o.selected),
t = o.rep;
((y.innerHTML =
E("results") +
'<h2>Send this quote</h2><p class="tf-sub"><b>' +
c(s.name) +
"</b> \xB7 " +
(o.quote.structures.length ? 1 + o.quote.structures.length + " roofs " : "") +
C(o.quote.totals.find((a) => a.id === o.selected).low) +
"\u2013" +
C(o.quote.totals.find((a) => a.id === o.selected).high) +
" \xB7 " +
c(o.address.formatted) +
'</p><div class="tf-field"><label class="tf-lbl" for="tfq-rep">Your name (sales rep)</label><input type="text" id="tfq-rep" value="' +
c(t.name) +
'"></div><div class="tf-row"><div class="tf-field"><label class="tf-lbl" for="tfq-first">Customer first name</label><input type="text" id="tfq-first" value="' +
c(e.first) +
'"></div><div class="tf-field"><label class="tf-lbl" for="tfq-last">Customer last name</label><input type="text" id="tfq-last" value="' +
c(e.last) +
'"></div></div><div class="tf-field"><label class="tf-lbl" for="tfq-phone">Customer mobile</label><input type="tel" id="tfq-phone" value="' +
c(e.phone) +
'"></div><div class="tf-field"><label class="tf-lbl" for="tfq-email">Customer email</label><input type="email" id="tfq-email" value="' +
c(e.email) +
'"></div><label class="tf-check"><input type="checkbox" id="tfq-smstx"' +
(e.smsTx ? " checked" : "") +
`><span>I read the customer this and they agreed: "You'll receive text messages from ` +
c(v.business.name) +
' about your roof quote, scheduling and job updates. Message frequency varies. Message &amp; data rates may apply. Text HELP for help, reply STOP to opt out."</span></label><div class="tf-field" style="margin-top:12px"><label class="tf-lbl" for="tfq-notes">Notes for the office (optional)</label><textarea id="tfq-notes">' +
c(o.appt.notes) +
'</textarea></div><p class="tf-err" id="tfq-err"></p><div class="tf-actions"><button class="tf-btn" id="tfq-send">Send quote to customer</button></div><p class="tf-note">The customer gets their quote by email (and text if they agreed), and the lead goes into your Sales Pipeline.</p>'),
T(),
(i("tfq-send").onclick = async () => {
((t.name = i("tfq-rep").value.trim()),
G.set("tfq-rep-name", t.name),
(e.first = i("tfq-first").value.trim()),
(e.last = i("tfq-last").value.trim()),
(e.phone = i("tfq-phone").value.trim()),
(e.email = i("tfq-email").value.trim()),
(e.smsTx = i("tfq-smstx").checked),
(e.smsMkt = !1),
(o.appt.notes = i("tfq-notes").value.trim()));
const a = i("tfq-err");
if (!t.name) return (a.textContent = "Enter your name.");
if (!e.first || !e.last)
return (a.textContent =
"Enter the customer's first and last name.");
if (e.phone.replace(/\D/g, "").length !== 10)
return (a.textContent = "Enter a 10-digit phone number.");
if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.email))
return (a.textContent = "Enter a valid email address.");
const r = i("tfq-send");
((r.disabled = !0),
(r.textContent = "Sending\u2026"),
await U("rep_quote"),
_("repdone"));
}));
}),
(k.repdone = function () {
((y.innerHTML =
'<div class="tf-done"><div class="ok">' +
w.check +
"</div><h2>Quote sent to " +
c(o.contact.first) +
`</h2><p class="tf-sub">It's in your Sales Pipeline as a New Lead. Quote number <b>` +
c(o.quoteId) +
'</b>.</p><div class="tf-actions"><button class="tf-btn" id="tfq-new">Start a new quote</button></div></div>'),
(i("tfq-new").onclick = () => {
location.href =
location.pathname + "?rep=" + encodeURIComponent(v.repCode);
}));
}),
(k.done = function () {
const e = v.business;
y.innerHTML =
'<div class="tf-done"><div class="ok">' +
w.check +
"</div><h2>You're all set, " +
c(o.contact.first) +
`!</h2><p class="tf-sub">We've got your request for <b>` +
c(o.appt.day) +
"</b>, " +
c(o.appt.window.toLowerCase()) +
`. We'll call or text you shortly to confirm the exact time.</p><p class="tf-sub" style="margin-bottom:6px">Your quote number: <b>` +
c(o.quoteId) +
'</b></p><div class="tf-actions"><a class="tf-btn" href="' +
c(e.phoneHref) +
'">Call us now: ' +
c(e.phone) +
'</a><a class="tf-btn ghost" href="' +
c(e.website) +
'">Back to ' +
c(e.name) +
"</a></div></div>";
}));

/* ---------- Quote links (#q=...) from the app or GHL open here, in the same design ---------- */
const VALID_DAYS = 30;
function tfToast(t) { const d = document.createElement("div"); d.className = "tf-toast"; d.textContent = t; document.body.appendChild(d); setTimeout(() => d.remove(), 2600); }
function b64urlDec(x) { x = x.replace(/-/g, "+").replace(/_/g, "/"); while (x.length % 4) x += "="; const b = atob(x), u = new Uint8Array(b.length); for (let n = 0; n < b.length; n++) u[n] = b.charCodeAt(n); return new TextDecoder().decode(u); }
function readLink() {
  const mm = (location.hash || "").match(/[#&]q=([^&]+)/) || (location.search || "").match(/[?&]q=([^&]+)/);
  if (!mm) return null;
  try { const q = JSON.parse(b64urlDec(decodeURIComponent(mm[1]))); if (q && Array.isArray(q.p) && q.p.length && Array.isArray(q.r) && q.r.length) return q; } catch (e) {}
  return null;
}
function fmtDay(d) { return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }); }
function quoteDate() { const t = o.link && o.link.t ? new Date(o.link.t + "T12:00:00") : o.quoteDay || (o.quoteDay = new Date()); return isNaN(t) ? new Date() : t; }
function validUntil() { const d = new Date(quoteDate()); d.setDate(d.getDate() + VALID_DAYS); return d; }
function linkInit(q) {
  const roofs = q.r.map((r, n) => ({ n: r.n || ORD[n] || "Roof " + (n + 1), s: Math.max(0, Math.round(+r.s || 0)), p: String(r.p || "") }));
  const total = roofs.reduce((a, r) => a + r.s, 0), pit = parseInt(roofs[0].p, 10);
  const parts = String(q.a || "").split(","), name = String(q.n || "").trim().split(/\s+/);
  o.link = q; o.linkUrl = location.href; o.linkRoofs = roofs;
  o.quoteId = q.id || o.quoteId;
  o.address = { formatted: q.a || "", street: (parts[0] || "").trim(), city: (parts[1] || "").trim(), state: ((parts[2] || "").trim().split(" ")[0]) || "", postal: ((parts[2] || "").trim().split(" ")[1]) || "",
    lat: q.c && q.c.length === 2 ? +q.c[0] : "", lng: q.c && q.c.length === 2 ? +q.c[1] : "" };
  o.roof = { areaSqft: roofs[0].s, pitch12: isNaN(pit) ? "" : pit, facets: "", lowSlopePct: 0, quality: "", imageryDate: "", source: "link", segments: [], label: roofs[0].n };
  o.contact.first = name[0] || ""; o.contact.last = name.slice(1).join(" ");
  o.answers.layers = o.answers.layers || "";
  const tiers = m.tiers.map((t, g) => { const pr = q.p[g] || q.p[q.p.length - 1]; return { id: t.id, label: t.label, name: t.name, low: pr[0], high: pr[1], base: Math.round((pr[0] + pr[1]) / 2), minimum: !1 }; });
  o.fixed = { tiers: tiers, totals: tiers.map((t) => ({ id: t.id, low: t.low, high: t.high, base: t.base })), structures: [], flatRoofs: [],
    squares: "", waste: 0, surcharge: 0, extraLayers: 0, mainLabel: roofs[0].n, totalSqft: total, totalSquares: "" };
  const pk = m.tiers[q.k];
  if (pk) { o.myPick = pk.id; if (q.h) { o.color = q.h; o.colors = {}; o.colors[pk.id] = q.h; } }
  o.sendLeads = !!v.ghlWebhookUrl && !P;
}
// Satellite map with a pin for a quote link (finds the house by address when the link has no location)
async function linkMap() {
  const hide = () => i("tfq-mapwrap").classList.remove("on");
  if (L) return hide();
  try {
    await N();
    let lat = o.address.lat, lng = o.address.lng;
    if (!(lat && lng)) {
      const lib = await google.maps.importLibrary("places");
      const r = await lib.Place.searchByText({ textQuery: o.address.formatted, fields: ["location"], maxResultCount: 1, region: "us" });
      const p = r && r.places && r.places[0];
      if (!p || !p.location) return hide();
      lat = o.address.lat = p.location.lat(); lng = o.address.lng = p.location.lng();
    }
    de(lat, lng);
    o.gmap.setZoom(19);
    o.linkPin && o.linkPin.setMap(null);
    o.linkPin = new google.maps.Marker({ map: o.gmap, position: { lat: lat, lng: lng } });
    i("tfq-mapbadge").textContent = "Your home";
  } catch (e) { hide(); }
}
// Link to this quote (same format the app uses), so it can be shared or reopened
function quoteUrl() {
  if (o.link) return o.linkUrl;
  const pl = Z("share");
  return pl.quote_url || location.href.split("#")[0];
}
function linkChips() {
  const rs = o.linkRoofs, tot = rs.reduce((a, r) => a + r.s, 0);
  return '<span class="tf-chip">' + c(o.address.street || o.address.formatted) + "</span>" +
    (rs.length > 1
      ? '<span class="tf-chip">' + rs.length + ' roofs</span><span class="tf-chip">' + tot.toLocaleString() + " sq ft total</span>" +
        rs.map((r) => '<span class="tf-chip">' + c(r.n) + ": " + r.s.toLocaleString() + " sq ft" + (r.p ? ", " + c(r.p) : "") + "</span>").join("")
      : '<span class="tf-chip">' + tot.toLocaleString() + ' sq ft roof</span>' + (rs[0].p ? '<span class="tf-chip">' + c(rs[0].p) + " pitch</span>" : ""));
}
function extrasHtml() {
  const b = v.business, sms = "sms:" + String(b.phoneHref || "").replace(/^tel:/, "");
  return '<div class="tf-qinfo">Quote <b>' + c(o.quoteId) + "</b> \xB7 " + c(fmtDay(quoteDate())) + "<br>Prices are valid until <b>" + c(fmtDay(validUntil())) + "</b>.</div>" +
    '<div class="tf-tools"><button class="tf-btn ghost" id="tfq-pdf" type="button">Download PDF</button><button class="tf-btn ghost" id="tfq-share" type="button">Share this quote</button></div>' +
    '<div class="tf-help"><span>Questions?</span><a href="' + c(b.phoneHref) + '">Call ' + c(b.phone) + '</a><a href="' + c(sms) + '">Text us</a></div>';
}
function wireExtras() {
  const sh = i("tfq-share"), pd = i("tfq-pdf");
  sh && (sh.onclick = () => {
    const url = quoteUrl();
    if (navigator.share) navigator.share({ title: v.business.name + " roof quote", url: url }).catch(() => {});
    else if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => tfToast("Link copied"), () => tfToast("Couldn't copy the link"));
    else tfToast("Couldn't copy the link");
  });
  pd && (pd.onclick = () => {
    pd.disabled = !0; pd.textContent = "Building PDF…";
    loadPdfLib().then(buildPdf).then((bytes) => {
      const blob = new Blob([bytes], { type: "application/pdf" }), url = URL.createObjectURL(blob), a = document.createElement("a");
      a.href = url; a.download = "Team-Forte-Roof-Quote-" + (o.quoteId || "quote") + ".pdf"; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    }).catch((e) => { console.warn("[TFQ] pdf", e); tfToast("PDF didn't build. Use Print, then Save as PDF."); })
      .then(() => { pd.disabled = !1; pd.textContent = "Download PDF"; });
  });
}
function loadPdfLib() {
  return new Promise((ok, bad) => { if (window.PDFLib) return ok(); const t = document.createElement("script"); t.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js"; t.onload = ok; t.onerror = bad; document.head.appendChild(t); });
}
// Two-page PDF: roofs + three packages, then what's in the price
async function buildPdf() {
  const Lb = window.PDFLib, doc = await Lb.PDFDocument.create(), b = v.business, q = O();
  const roofs = o.link ? o.linkRoofs : [{ n: q.mainLabel || ORD[0], s: o.roof.areaSqft, p: o.roof.pitch12 ? o.roof.pitch12 + "/12" : "" }]
    .concat(q.structures.map((x) => ({ n: x.label, s: x.x.roof.areaSqft, p: x.x.roof.pitch12 ? x.x.roof.pitch12 + "/12" : "" })));
  const pickId = o.selected || o.myPick || "";
  doc.setTitle(b.name + " roof quote " + o.quoteId); doc.setAuthor(b.legalName + " d/b/a " + b.name);
  const R = await doc.embedFont(Lb.StandardFonts.Helvetica), B = await doc.embedFont(Lb.StandardFonts.HelveticaBold);
  const rgb = (h) => { const n = parseInt(String(h || "#666").replace("#", ""), 16); return Lb.rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255); };
  const INK = rgb("#1E1E2A"), RED = rgb("#FF5440"), MUTED = rgb("#607179"), LINE = rgb("#E4E7EC"), BG = rgb("#F4F5F7"), DARK = rgb("#0A0A0A"), WHITE = Lb.rgb(1, 1, 1), PALE = rgb("#C4CCD6");
  const W = 612, H = 792, M = 40;
  const clean = (t) => String(t == null ? "" : t).replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[^\x20-\x7E -ÿ–—•…]/g, "");
  const T = (pg, t, x, yy, op) => { op = op || {}; pg.drawText(clean(t), { x: x, y: yy, size: op.size || 10, font: op.font || R, color: op.color || INK }); };
  const wrap = (t, f, sz, mw) => { const ws = clean(t).split(/\s+/), out = []; let cur = ""; ws.forEach((w2) => { const tt = cur ? cur + " " + w2 : w2; if (f.widthOfTextAtSize(tt, sz) > mw && cur) { out.push(cur); cur = w2; } else cur = tt; }); cur && out.push(cur); return out; };
  const TW = (pg, t, x, yy, mw, op) => { op = op || {}; const f = op.font || R, sz = op.size || 10, lh = op.lh || sz * 1.35, ls = wrap(t, f, sz, mw); ls.forEach((l, n) => T(pg, l, x, yy - n * lh, op)); return ls.length * lh; };
  const right = (pg, t, xr, yy, op) => { op = op || {}; T(pg, t, xr - (op.font || R).widthOfTextAtSize(clean(t), op.size || 10), yy, op); };
  const link = (pg, url, x, yy, w2, h2) => { const ctx = doc.context; pg.node.addAnnot(ctx.register(ctx.obj({ Type: "Annot", Subtype: "Link", Rect: [x, yy, x + w2, yy + h2], Border: [0, 0, 0], A: { Type: "Action", S: "URI", URI: Lb.PDFString.of(url) } }))); };
  const header = (pg, sub) => { pg.drawRectangle({ x: 0, y: H - 78, width: W, height: 78, color: DARK }); T(pg, "TEAM FORTE", M, H - 48, { font: B, size: 20, color: WHITE }); pg.drawRectangle({ x: M, y: H - 58, width: 40, height: 3, color: RED });
    right(pg, sub, W - M, H - 38, { font: B, size: 11, color: WHITE }); right(pg, "Quote " + o.quoteId + "   " + fmtDay(quoteDate()), W - M, H - 54, { size: 9, color: PALE }); };
  const footer = (pg, n) => { pg.drawLine({ start: { x: M, y: 46 }, end: { x: W - M, y: 46 }, thickness: 0.7, color: LINE });
    T(pg, b.legalName + " d/b/a " + b.name + "   " + b.phone + "   " + String(b.website || "").replace(/^https?:\/\//, ""), M, 32, { size: 7.5, color: MUTED }); right(pg, "Page " + n + " of 2", W - M, 32, { size: 7.5, color: MUTED }); };
  // page 1
  const p = doc.addPage([W, H]); header(p, "Roof replacement quote");
  let y = H - 112;
  T(p, "Prepared for " + ((o.contact.first + " " + o.contact.last).trim() || "you"), M, y, { font: B, size: 17 }); y -= 18;
  T(p, o.address.formatted || "", M, y, { size: 10.5, color: MUTED }); y -= 26;
  T(p, "Roofs on this quote", M, y, { font: B, size: 11 }); y -= 16;
  const tot = roofs.reduce((a, r) => a + (+r.s || 0), 0);
  roofs.forEach((r) => { p.drawRectangle({ x: M, y: y - 1, width: 7, height: 7, color: RED }); T(p, r.n + ":  " + (+r.s || 0).toLocaleString("en-US") + " sq ft" + (r.p ? ", " + r.p + " pitch" : ""), M + 13, y, { size: 10 }); y -= 15; });
  roofs.length > 1 && (T(p, "Total: " + tot.toLocaleString("en-US") + " sq ft", M + 13, y, { font: B, size: 10 }), (y -= 15));
  y -= 14;
  T(p, "Your three options", M, y, { font: B, size: 15 }); y -= 15;
  T(p, "Prices cover every roof listed above. Your exact price is confirmed at a free inspection.", M, y, { size: 9, color: MUTED }); y -= 14;
  const gap = 12, cw = (W - 2 * M - 2 * gap) / 3, top = y;
  const ch = Math.min(top - 150, 30 + Math.max(...m.tiers.map((t) => 150 + (t.specs || []).reduce((a, sp) => a + 15 + wrap(sp[1], B, 8, cw - 24).length * 10, 0) + wrap(t.name, B, 12, cw - 24).length * 14)));
  m.tiers.forEach((t, n) => {
    const tt = q.totals[n]; if (!tt) return;
    const cx = M + n * (cw + gap), pick = pickId === t.id, cols = t.colors || m.colors || [];
    const colName = (o.colors && o.colors[t.id]) || (cols[0] && cols[0].name) || "", col = cols.find((x) => x.name === colName) || cols[0] || { hex: "#3C3E42" };
    p.drawRectangle({ x: cx, y: top - ch, width: cw, height: ch, color: WHITE, borderColor: pick ? RED : LINE, borderWidth: pick ? 2 : 1 });
    let yy = top - 18;
    t.ribbon && T(p, t.ribbon.toUpperCase(), cx + 12, yy, { font: B, size: 7.5, color: RED });
    pick && right(p, "YOUR PICK", cx + cw - 12, yy, { font: B, size: 7.5, color: RED });
    yy -= 18; T(p, t.label + " package", cx + 12, yy, { size: 8.5, color: MUTED }); yy -= 4;
    yy -= TW(p, t.name.replace(/^Owens Corning®\s*/, "Owens Corning® "), cx + 12, yy - 10, cw - 24, { font: B, size: 12, lh: 14 }) + 8;
    T(p, C(tt.low) + " – " + C(tt.high), cx + 12, yy - 6, { font: B, size: 13 }); yy -= 18;
    T(p, "Installed, estimated range", cx + 12, yy, { size: 7.5, color: MUTED }); yy -= 12;
    p.drawRectangle({ x: cx + 12, y: yy - 40, width: cw - 24, height: 40, color: rgb(col.hex) });
    for (let sy = yy - 40 + 10; sy < yy; sy += 10) p.drawLine({ start: { x: cx + 12, y: sy }, end: { x: cx + cw - 12, y: sy }, thickness: 0.8, color: Lb.rgb(0, 0, 0), opacity: 0.25 });
    yy -= 54;
    colName && (p.drawCircle({ x: cx + 17, y: yy + 3, size: 5, color: rgb(col.hex) }), T(p, "Color: " + colName, cx + 27, yy, { size: 8.5, font: B }), (yy -= 16));
    (t.specs || []).forEach((sp) => { p.drawLine({ start: { x: cx + 12, y: yy + 10 }, end: { x: cx + cw - 12, y: yy + 10 }, thickness: 0.5, color: LINE });
      T(p, sp[0], cx + 12, yy, { size: 7.5, color: MUTED }); yy -= 10; yy -= TW(p, sp[1], cx + 12, yy, cw - 24, { font: B, size: 8, lh: 10 }) + 5; });
  });
  y = top - ch - 20;
  p.drawRectangle({ x: M, y: y - 62, width: W - 2 * M, height: 70, color: DARK });
  T(p, "Next step: a free inspection", M + 16, y - 16, { font: B, size: 13, color: WHITE });
  T(p, "We confirm your exact price in writing after checking the deck, flashing and ventilation in person.", M + 16, y - 32, { size: 8.5, color: PALE });
  const callTxt = "Call or text " + b.phone, sep = "   |   ", onTxt = "View this quote online";
  T(p, callTxt + sep + onTxt, M + 16, y - 50, { font: B, size: 10, color: WHITE });
  link(p, b.phoneHref, M + 16, y - 53, B.widthOfTextAtSize(clean(callTxt), 10), 13);
  link(p, quoteUrl(), M + 16 + B.widthOfTextAtSize(clean(callTxt + sep), 10), y - 53, B.widthOfTextAtSize(onTxt, 10), 13);
  footer(p, 1);
  // page 2
  const p2 = doc.addPage([W, H]); header(p2, "What's in the price");
  let y2 = H - 112;
  const list = (title, items, x, ys, w2, dot) => { T(p2, title, x, ys, { font: B, size: 12 }); let yy = ys - 18; items.forEach((it) => { p2.drawRectangle({ x: x, y: yy + 1, width: 5, height: 5, color: dot }); yy -= TW(p2, it, x + 12, yy, w2 - 12, { size: 9.5, lh: 12.5 }) + 4; }); return yy; };
  T(p2, "Every option is installed as an Owens Corning® roofing system.", M, y2, { size: 10, color: MUTED }); y2 -= 26;
  const inc = [].concat(...(m.system || []).map((g) => g.items.map((f) => (f === "Your choice of Owens Corning® shingles" ? "Owens Corning® shingles (the package you choose)" : f)))).concat(m.included || []);
  const colW = (W - 2 * M - 24) / 2;
  const yl = list("Included in every option", inc, M, y2, colW, RED);
  let yr = list("Priced separately if needed", m.notIncluded || [], M + colW + 24, y2, colW, PALE);
  yr = list("Popular upgrades", m.upgrades || [], M + colW + 24, yr - 14, colW, PALE);
  y2 = Math.min(yl, yr) - 24;
  p2.drawRectangle({ x: M, y: y2 - 96, width: W - 2 * M, height: 96, color: BG });
  T(p2, "About this estimate", M + 14, y2 - 18, { font: B, size: 11 });
  TW(p2, "This estimate is based on satellite measurements of your property and the answers you gave us. Your final price is confirmed in writing after a free on-site inspection. Prices are valid until " + fmtDay(validUntil()) + ". " + (m.warrantyNote || ""), M + 14, y2 - 34, W - 2 * M - 28, { size: 8.5, lh: 11.5 });
  footer(p2, 2);
  return await doc.save();
}

function me() {
const e = document.createElement("div");
e.id = "tfq-admin";
const s = (t, a, r, n) =>
"<label>" +
t +
'<input type="number" step="' +
(n || 1) +
'" data-path="' +
a +
'" value="' +
r +
'"></label>';
((e.innerHTML =
'<button class="min" id="tfqa-min" title="Hide">&times;</button><h4>Pricing test panel</h4>' +
m.tiers
.map((t, a) =>
s(t.label + " $/square", "tiers." + a + ".perSquare", t.perSquare),
)
.join("") +
s("Minimum job $", "minimumJob", m.minimumJob, 100) +
s("Extra layer $/sq", "extraLayerPerSquare", m.extraLayerPerSquare) +
s("Range low %", "rangeLow", m.rangeLow * 100, 0.5) +
s("Range high %", "rangeHigh", m.rangeHigh * 100, 0.5) +
'<label>Send leads to GHL<input type="checkbox" id="tfqa-send"' +
(o.sendLeads ? " checked" : "") +
'></label><button id="tfqa-sample">Jump to prices (sample roof)</button><button class="alt" id="tfqa-copy">Copy pricing for CONFIG</button><div id="tfqa-msg" style="margin-top:6px;color:#9f9"></div>'),
document.body.appendChild(e),
e.querySelectorAll("input[data-path]").forEach((t) =>
t.addEventListener("input", () => {
const a = t.dataset.path.split(".");
let r = m;
for (; a.length > 1; ) r = r[a.shift()];
const n = a[0];
let d = parseFloat(t.value) || 0;
((n === "rangeLow" || n === "rangeHigh") && (d = d / 100),
(r[n] = d),
o.step === "results" && k.results());
}),
),
(i("tfqa-send").onchange = (t) => {
((o.sendLeads = t.target.checked && !!v.ghlWebhookUrl),
(i("tfqa-msg").textContent = v.ghlWebhookUrl
? ""
: "Add ghlWebhookUrl in CONFIG first."));
}),
(i("tfqa-min").onclick = () => e.remove()),
(i("tfqa-sample").onclick = () => {
if (
((o.address = o.address || {
formatted: "123 Sample St, Hartford, CT 06103",
street: "123 Sample St",
city: "Hartford",
state: "CT",
postal: "06103",
lat: 41.7658,
lng: -72.6734,
}),
!o.roof)
) {
const t = v.demoRoof;
o.roof = {
areaSqft: t.areaSqft,
pitchDeg: t.pitchDeg,
pitch12: Math.round(R(t.pitchDeg)),
facets: t.facets,
lowSlopePct: 0,
quality: "DEMO",
imageryDate: "",
source: "demo",
segments: [],
};
}
((o.answers.layers = o.answers.layers || "1"),
(o.contact.first = o.contact.first || "Test"),
_("results"));
}),
(i("tfqa-copy").onclick = async () => {
const t = JSON.stringify(
{
tiers: m.tiers.map((a) => ({ id: a.id, perSquare: a.perSquare })),
minimumJob: m.minimumJob,
extraLayerPerSquare: m.extraLayerPerSquare,
rangeLow: m.rangeLow,
rangeHigh: m.rangeHigh,
},
null,
2,
);
try {
(await navigator.clipboard.writeText(t),
(i("tfqa-msg").textContent =
"Copied. Update these numbers in CONFIG.pricing."));
} catch {
(console.log(t),
(i("tfqa-msg").textContent = "Printed to browser console."));
}
}));
}
if (
((i("tfq-logo").src = "data:image/svg+xml," + encodeURIComponent(te)),
(i("tfq-call").href = v.business.phoneHref),
(i("tfq-phone-txt").textContent = v.business.phone),
(i("tfq-foot").textContent =
"\xA9 " +
new Date().getFullYear() +
" " +
v.business.name +
" \xB7 " +
v.business.legalName +
". Instant quotes are estimates based on satellite measurements and are confirmed at a free inspection."),
L && (i("tfq-demo").hidden = !1),
z)
) {
const e = document.createElement("div");
((e.className = "tf-rep"),
(e.textContent = "Sales rep mode \xB7 not shown to customers"),
i("tfq").insertBefore(e, i("tfq").children[1]));
}
(P && me(),
L ||
N().catch((e) =>
console.warn(
"[TFQ] Google Maps failed to load. Check the API key and its website restrictions.",
e,
),
),
window.addEventListener("pagehide", sendAbandon),
(window.TFQ = {
state: o,
computeQuote: O,
processSolar: V,
leadPayload: Z,
go: _,
}),
(function () { const lq = readLink(); if (lq) { linkInit(lq); _("results"); linkMap(); } else _("address"); })());
})();
