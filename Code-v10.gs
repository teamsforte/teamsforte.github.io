/**
 * TEAM FORTE PHOTOS
 * Phone app for website photos + gallery, website quotes, materials lists
 * and supplier orders. Everything is stored in your Google Drive.
 *
 * ONE-TIME SETUP
 *   1. Select "setup" in the function menu above and press Run. Approve access.
 *      (Setup also adds a daily 5am job that refreshes ABC Supply prices.)
 *   2. Open "Execution log" to see your passcode (change it with setPasscode).
 *   3. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone.
 *
 * The fast installed app (GitHub Pages) talks to this script through doPost ?r=api.
 *
 * Everything below this line is the app. You don't need to edit it.
 */

var CFG = {
  APP_NAME: 'Team Forte Photos',
  FOLDER_NAME: 'Team Forte Website Gallery',
  SHEET_NAME: 'Team Forte Website Gallery (data)',
  SERVICES: ['Roofing', 'Carpentry', 'Painting', 'Handyman'],
  STAGES: ['before', 'during', 'after'],
  MAX_FAILS: 8,          // wrong passcode tries before a 15 minute lockout
  CACHE_SECONDS: 21600   // public gallery cache (cleared on every change)
};

var JOB_COLS = ['id', 'title', 'service', 'town', 'address', 'date', 'description',
  'published', 'featured', 'coverId', 'folderId', 'created', 'updated'];
var PHOTO_COLS = ['id', 'jobId', 'stage', 'caption', 'order', 'width', 'height', 'created'];

/* ------------------------------------------------------------------ */
/* Setup (run from the editor)                                         */
/* ------------------------------------------------------------------ */

function setup() {
  var props = PropertiesService.getScriptProperties();

  var folder = null;
  var folderId = props.getProperty('FOLDER_ID');
  if (folderId) { try { folder = DriveApp.getFolderById(folderId); } catch (e) { folder = null; } }
  if (!folder) {
    folder = DriveApp.createFolder(CFG.FOLDER_NAME);
    props.setProperty('FOLDER_ID', folder.getId());
  }
  try {
    folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {
    Logger.log('NOTE: Could not make the gallery folder viewable by link (' + e.message + '). ' +
      'If your Google Workspace blocks link sharing, photos will not show on the website.');
  }
  CFG.SERVICES.forEach(function (s) { childFolder_(folder, s); });

  var ss = null;
  var sheetId = props.getProperty('SHEET_ID');
  if (sheetId) { try { ss = SpreadsheetApp.openById(sheetId); } catch (e) { ss = null; } }
  if (!ss) {
    ss = SpreadsheetApp.create(CFG.SHEET_NAME);
    props.setProperty('SHEET_ID', ss.getId());
    try { DriveApp.getFileById(ss.getId()).moveTo(folder); } catch (e) { /* stays in My Drive */ }
  }
  prepSheet_(ss, 'Jobs', JOB_COLS);
  prepSheet_(ss, 'Photos', PHOTO_COLS);
  setupMaterials_(ss);
  var extra = ss.getSheetByName('Sheet1');
  if (extra && ss.getSheets().length > 2) ss.deleteSheet(extra);

  if (!props.getProperty('PASSCODE')) {
    props.setProperty('PASSCODE', String(Math.floor(10000000 + Math.random() * 89999999)));
  }
  clearPublicCache_();

  Logger.log('Setup complete.');
  Logger.log('Photos folder: ' + folder.getUrl());
  Logger.log('Data sheet:    ' + ss.getUrl());
  Logger.log('YOUR PASSCODE: ' + props.getProperty('PASSCODE'));
  Logger.log('Next: Deploy > New deployment > Web app (Execute as: Me, Who has access: Anyone).');
}

/** Change the passcode: edit the value below, select setPasscode, press Run. */
function setPasscode() {
  var NEW_PASSCODE = 'change-me';
  if (!NEW_PASSCODE || NEW_PASSCODE === 'change-me' || String(NEW_PASSCODE).length < 6) {
    throw new Error('Type a new passcode (6+ characters) in the NEW_PASSCODE line first.');
  }
  PropertiesService.getScriptProperties().setProperty('PASSCODE', String(NEW_PASSCODE).trim());
  Logger.log('Passcode changed. Everyone will need to log in again with the new one.');
}

function prepSheet_(ss, name, cols) {
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  sh.getRange(1, 1, 1, cols.length).setValues([cols]).setFontWeight('bold');
  sh.getRange(1, 1, Math.max(sh.getMaxRows(), 2), cols.length).setNumberFormat('@');
  sh.setFrozenRows(1);
  return sh;
}

/* ------------------------------------------------------------------ */
/* Web entry points                                                    */
/* ------------------------------------------------------------------ */

function doGet(e) {
  var p = (e && e.parameter) || {};
  var r = p.r || 'app';
  var url = execUrl_();

  if (r === 'data') {
    var json = publicJson_();
    var cb = p.callback;
    if (cb && /^[A-Za-z_$][\w$.]{0,80}$/.test(cb)) {
      return ContentService.createTextOutput(cb + '(' + json + ');')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
  }

  if (r === 'proposal') return proposalPage_(String(p.id || ''));

  if (r === 'pricing') {
    var pj = JSON.stringify(pricing_());
    var pcb = p.callback;
    if (pcb && /^[A-Za-z_$][\w$.]{0,80}$/.test(pcb)) {
      return ContentService.createTextOutput(pcb + '(' + pj + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(pj).setMimeType(ContentService.MimeType.JSON);
  }

  if (r === 'widget.js') {
    return ContentService.createTextOutput(WIDGET_JS.split('__EXEC_URL__').join(url))
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  if (r === 'preview') {
    var svc = String(p.service || 'all').replace(/[^a-z]/gi, '');
    var html = '<!doctype html><html><head><meta charset="utf-8">' +
      '<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">' +
      '<style>body{margin:0;background:#F2F4F7;font-family:Montserrat,Arial,sans-serif}</style></head><body>' +
      '<div class="tf-gallery" data-service="' + svc + '" data-title="Our Work" ' +
      'data-subtitle="Real Team Forte jobs, start to finish. Tap a job to see the before and after."></div>' +
      '<script>' + WIDGET_JS.split('__EXEC_URL__').join(url) + '</script></body></html>';
    return HtmlService.createHtmlOutput(html).setTitle('Team Forte gallery preview')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }

  var out = HtmlService.createHtmlOutput(ADMIN_HTML.split('__EXEC_URL__').join(url))
    .setTitle(CFG.APP_NAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover');
  try { out.addMetaTag('apple-mobile-web-app-capable', 'yes'); } catch (err) { /* optional */ }
  try { out.addMetaTag('apple-mobile-web-app-title', 'TF Photos'); } catch (err) { /* optional */ }
  try { out.addMetaTag('mobile-web-app-capable', 'yes'); } catch (err) { /* optional */ }
  return out;
}

/** Called by the phone app through google.script.run. Always returns a JSON string. */
function api(reqJson) {
  var lock = null;
  try {
    var req = typeof reqJson === 'string' ? JSON.parse(reqJson) : (reqJson || {});
    CURRENT_USER_ = checkPass_(req.pass);
    var fn = API_[req.method];
    if (!fn) throw new Error('Unknown action: ' + req.method);
    allowed_(CURRENT_USER_, req.method);
    if (!READ_ONLY_[req.method]) {
      lock = LockService.getScriptLock();
      lock.waitLock(25000);
    }
    var data = fn(req.args || {});
    if (lock && /Job|Photo/.test(req.method)) { clearPublicCache_(); }
    return JSON.stringify({ ok: true, data: data === undefined ? null : data });
  } catch (err) {
    return JSON.stringify({ ok: false, error: (err && err.message) || String(err) });
  } finally {
    if (lock) { try { lock.releaseLock(); } catch (e) { /* ignore */ } }
  }
}

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

var READ_ONLY_ = { ping: 1, list: 1, matList: 1, abcTest: 1, abcBranches: 1, abcSearch: 1, measure: 1, crewJobs: 1, users: 1, ghlPipelines: 1 };

var API_ = {
  ping: function () { return { app: CFG.APP_NAME, services: CFG.SERVICES, user: { name: CURRENT_USER_.name, role: CURRENT_USER_.role } }; },

  list: function () {
    var jobs = readJobs_();
    var photos = readPhotos_();
    return { services: CFG.SERVICES, url: execUrl_(), jobs: jobs.map(function (j) { return withPhotos_(j, photos, true); }) };
  },

  saveJob: function (a) {
    var jobs = readJobs_();
    var now = new Date().toISOString();
    var job = a.id ? findById_(jobs, a.id) : null;
    var isNew = !job;
    if (isNew) {
      job = { id: newId_('j'), created: now, published: true, featured: false, coverId: '', folderId: '' };
      jobs.push(job);
    }
    var oldService = job.service;
    ['title', 'town', 'address', 'description'].forEach(function (k) {
      if (a[k] !== undefined) job[k] = clean_(a[k], k === 'description' ? 600 : 120);
    });
    if (a.service !== undefined) job.service = pickService_(a.service);
    if (a.date !== undefined) job.date = cleanMonth_(a.date);
    if (a.published !== undefined) job.published = !!a.published;
    if (a.featured !== undefined) job.featured = !!a.featured;
    if (a.coverId !== undefined) job.coverId = clean_(a.coverId, 100);
    if (!job.title) job.title = job.service ? job.service + ' job' : 'New job';
    if (!job.service) job.service = CFG.SERVICES[0];
    if (!job.date) job.date = Utilities.formatDate(new Date(), tz_(), 'yyyy-MM');
    job.updated = now;

    if (job.folderId) {
      try {
        var f = DriveApp.getFolderById(job.folderId);
        f.setName(jobFolderName_(job));
        if (oldService && oldService !== job.service) f.moveTo(childFolder_(rootFolder_(), job.service));
      } catch (e) { /* folder fixed on next upload */ }
    }
    writeJobs_(jobs);
    return withPhotos_(job, readPhotos_(), true);
  },

  deleteJob: function (a) {
    var jobs = readJobs_();
    var job = findById_(jobs, a.id);
    if (!job) throw new Error('That job was already deleted.');
    if (job.folderId) { try { DriveApp.getFolderById(job.folderId).setTrashed(true); } catch (e) { /* ignore */ } }
    var photos = readPhotos_();
    photos.filter(function (p) { return p.jobId === job.id; }).forEach(function (p) {
      try { DriveApp.getFileById(p.id).setTrashed(true); } catch (e) { /* already gone */ }
    });
    writePhotos_(photos.filter(function (p) { return p.jobId !== job.id; }));
    writeJobs_(jobs.filter(function (j) { return j.id !== job.id; }));
    return { deleted: job.id };
  },

  uploadPhoto: function (a) {
    var jobs = readJobs_();
    var job = findById_(jobs, a.jobId);
    if (!job) throw new Error('Job not found. Go back and try again.');
    if (!a.base64) throw new Error('No photo received.');
    var stage = pickStage_(a.stage);
    var mime = /^image\/(jpeg|png|webp)$/.test(a.mime) ? a.mime : 'image/jpeg';
    var ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
    var photos = readPhotos_();
    var mine = photos.filter(function (p) { return p.jobId === job.id && p.stage === stage; });
    var order = mine.reduce(function (m, p) { return Math.max(m, p.order); }, 0) + 1;
    var name = stage + '-' + pad_(order) + '-' + Utilities.formatDate(new Date(), tz_(), 'yyyyMMdd-HHmmss') + '.' + ext;
    var blob = Utilities.newBlob(Utilities.base64Decode(a.base64), mime, name);
    var file = jobFolder_(job, jobs).createFile(blob);
    try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) { /* folder sharing covers it */ }
    var photo = {
      id: file.getId(), jobId: job.id, stage: stage, caption: clean_(a.caption || '', 160),
      order: order, width: Number(a.width) || '', height: Number(a.height) || '', created: new Date().toISOString()
    };
    photos.push(photo);
    writePhotos_(photos);
    job.updated = photo.created;
    writeJobs_(jobs);
    return photo;
  },

  updatePhoto: function (a) {
    var photos = readPhotos_();
    var p = findById_(photos, a.id);
    if (!p) throw new Error('Photo not found.');
    if (a.caption !== undefined) p.caption = clean_(a.caption, 160);
    if (a.stage !== undefined && pickStage_(a.stage) !== p.stage) {
      p.stage = pickStage_(a.stage);
      p.order = photos.filter(function (x) { return x.jobId === p.jobId && x.stage === p.stage && x.id !== p.id; })
        .reduce(function (m, x) { return Math.max(m, x.order); }, 0) + 1;
    }
    writePhotos_(photos);
    return p;
  },

  movePhoto: function (a) {
    var photos = readPhotos_();
    var p = findById_(photos, a.id);
    if (!p) throw new Error('Photo not found.');
    var group = photos.filter(function (x) { return x.jobId === p.jobId && x.stage === p.stage; })
      .sort(function (x, y) { return x.order - y.order; });
    var i = group.indexOf(p);
    var j = i + (a.dir < 0 ? -1 : 1);
    if (j < 0 || j >= group.length) return p;
    var tmp = group[i]; group[i] = group[j]; group[j] = tmp;
    group.forEach(function (x, k) { x.order = k + 1; });
    writePhotos_(photos);
    return p;
  },

  deletePhoto: function (a) {
    var photos = readPhotos_();
    var p = findById_(photos, a.id);
    if (!p) return { deleted: a.id };
    try { DriveApp.getFileById(p.id).setTrashed(true); } catch (e) { /* already gone */ }
    writePhotos_(photos.filter(function (x) { return x.id !== p.id; }));
    var jobs = readJobs_();
    var job = findById_(jobs, p.jobId);
    if (job && job.coverId === p.id) { job.coverId = ''; writeJobs_(jobs); }
    return { deleted: p.id };
  }
};

/* ------------------------------------------------------------------ */
/* Public gallery data                                                 */
/* ------------------------------------------------------------------ */

function publicJson_() {
  var cache = CacheService.getScriptCache();
  var n = Number(cache.get('pub_n'));
  if (n) {
    var parts = cache.getAll(range_(n).map(function (i) { return 'pub_' + i; }));
    var s = '';
    for (var i = 0; i < n; i++) { if (parts['pub_' + i] == null) { s = null; break; } s += parts['pub_' + i]; }
    if (s) return s;
  }
  var photos = readPhotos_();
  var jobs = readJobs_().filter(function (j) { return j.published; })
    .map(function (j) { return withPhotos_(j, photos, false); })
    .filter(function (j) { return j.photos.length > 0; });
  var json = JSON.stringify({ updated: new Date().toISOString(), services: CFG.SERVICES, jobs: jobs });
  try {
    var size = 90000, chunks = {}, count = Math.ceil(json.length / size);
    for (var k = 0; k < count; k++) chunks['pub_' + k] = json.substr(k * size, size);
    chunks.pub_n = String(count);
    cache.putAll(chunks, CFG.CACHE_SECONDS);
  } catch (e) { /* cache is optional */ }
  return json;
}

function clearPublicCache_() {
  try { CacheService.getScriptCache().remove('pub_n'); } catch (e) { /* ignore */ }
}

/** Attach sorted photos and a cover to a job. Private fields are dropped for the website. */
function withPhotos_(job, allPhotos, admin) {
  var stageRank = { before: 0, during: 1, after: 2 };
  var photos = allPhotos.filter(function (p) { return p.jobId === job.id; })
    .sort(function (a, b) { return (stageRank[a.stage] - stageRank[b.stage]) || (a.order - b.order); });
  var cover = '';
  if (job.coverId && photos.some(function (p) { return p.id === job.coverId; })) cover = job.coverId;
  if (!cover) {
    var afters = photos.filter(function (p) { return p.stage === 'after'; });
    cover = afters.length ? afters[0].id : (photos.length ? photos[photos.length - 1].id : '');
  }
  var out = {
    id: job.id, title: job.title, service: job.service, town: job.town, date: job.date,
    description: job.description, featured: job.featured, cover: cover,
    photos: photos.map(function (p) {
      return { id: p.id, stage: p.stage, caption: p.caption, w: p.width || null, h: p.height || null };
    })
  };
  if (admin) {
    out.address = job.address;
    out.published = job.published;
    out.coverId = job.coverId;
    out.created = job.created;
    out.folderUrl = job.folderId ? 'https://drive.google.com/drive/folders/' + job.folderId : '';
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Sheet storage                                                       */
/* ------------------------------------------------------------------ */

function ss_() {
  var id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (!id) throw new Error('Setup has not been run yet. Open the script and run "setup".');
  return SpreadsheetApp.openById(id);
}

function readTable_(name, cols) {
  var sh = ss_().getSheetByName(name);
  if (!sh) throw new Error('Missing "' + name + '" tab in the data sheet. Run setup again.');
  var last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, cols.length).getValues()
    .filter(function (r) { return r[0] !== '' && r[0] != null; })
    .map(function (r) { var o = {}; cols.forEach(function (c, i) { o[c] = r[i]; }); return o; });
}

function writeTable_(name, cols, rows) {
  var sh = ss_().getSheetByName(name);
  var last = sh.getLastRow();
  if (last > 1) sh.getRange(2, 1, last - 1, cols.length).clearContent();
  if (!rows.length) return;
  if (sh.getMaxRows() < rows.length + 1) sh.insertRowsAfter(sh.getMaxRows(), rows.length + 1 - sh.getMaxRows());
  var range = sh.getRange(2, 1, rows.length, cols.length);
  range.setNumberFormat('@');
  range.setValues(rows.map(function (o) {
    return cols.map(function (c) { var v = o[c]; return v === undefined || v === null ? '' : String(v); });
  }));
}

function readJobs_() {
  return readTable_('Jobs', JOB_COLS).map(function (j) {
    j.id = String(j.id);
    ['title', 'service', 'town', 'address', 'description', 'coverId', 'folderId', 'created', 'updated']
      .forEach(function (k) { j[k] = j[k] instanceof Date ? j[k].toISOString() : String(j[k] == null ? '' : j[k]); });
    j.date = cleanMonth_(j.date);
    j.published = bool_(j.published);
    j.featured = bool_(j.featured);
    return j;
  }).sort(function (a, b) {
    return String(b.date).localeCompare(String(a.date)) || String(b.created).localeCompare(String(a.created));
  });
}

function readPhotos_() {
  return readTable_('Photos', PHOTO_COLS).map(function (p) {
    p.id = String(p.id); p.jobId = String(p.jobId);
    p.stage = pickStage_(p.stage);
    p.caption = String(p.caption == null ? '' : p.caption);
    p.order = Number(p.order) || 0;
    p.width = Number(p.width) || '';
    p.height = Number(p.height) || '';
    p.created = p.created instanceof Date ? p.created.toISOString() : String(p.created || '');
    return p;
  });
}

function writeJobs_(jobs) { writeTable_('Jobs', JOB_COLS, jobs); }
function writePhotos_(photos) { writeTable_('Photos', PHOTO_COLS, photos); }

/* ------------------------------------------------------------------ */
/* Drive folders                                                       */
/* ------------------------------------------------------------------ */

function rootFolder_() {
  var id = PropertiesService.getScriptProperties().getProperty('FOLDER_ID');
  if (!id) throw new Error('Setup has not been run yet. Open the script and run "setup".');
  return DriveApp.getFolderById(id);
}

function childFolder_(parent, name) {
  var it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

function jobFolderName_(job) {
  return [job.date, job.town, job.title].filter(function (x) { return x; }).join(' - ');
}

function jobFolder_(job, jobs) {
  if (job.folderId) {
    try {
      var f = DriveApp.getFolderById(job.folderId);
      if (!f.isTrashed()) return f;
    } catch (e) { /* recreate below */ }
  }
  var folder = childFolder_(childFolder_(rootFolder_(), job.service || CFG.SERVICES[0]), jobFolderName_(job) || job.id);
  job.folderId = folder.getId();
  writeJobs_(jobs);
  return folder;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

var CURRENT_USER_ = { id: 'owner', name: 'Owner', role: 'owner' };

/** Checks a passcode. The setup passcode is the owner; people added in Settings have their own PIN and role. */
function checkPass_(pass) {
  var cache = CacheService.getScriptCache();
  var fails = Number(cache.get('fails')) || 0;
  if (fails >= CFG.MAX_FAILS) throw new Error('Too many wrong passcodes. Wait 15 minutes and try again.');
  var real = PropertiesService.getScriptProperties().getProperty('PASSCODE');
  if (!real) throw new Error('Setup has not been run yet. Open the script and run "setup".');
  var p = String(pass || '').trim();
  if (p && p === String(real).trim()) return { id: 'owner', name: 'Owner', role: 'owner' };
  var users = typeof users_ === 'function' ? users_() : [];
  for (var i = 0; i < users.length; i++) {
    if (p && users[i].pin === p) return { id: users[i].id, name: users[i].name, role: users[i].role };
  }
  cache.put('fails', String(fails + 1), 900);
  throw new Error('WRONG_PASSCODE');
}

/* What each role can do. Owner: everything. Office: everything except logins and keys. Crew: jobs and photos only. */
var CREW_CAN_ = { ping: 1, list: 1, saveJob: 1, uploadPhoto: 1, updatePhoto: 1, movePhoto: 1, crewJobs: 1, addInspection: 1, crewNote: 1 };
var OWNER_ONLY_ = { users: 1, saveUsers: 1, abcRegisterWebhook: 1, useWebsiteKey: 1 };
function allowed_(u, method) {
  if (u.role === 'owner') return;
  if (u.role === 'crew' && !CREW_CAN_[method]) throw new Error('Your login can\u2019t do that. Ask the owner.');
  if (u.role === 'office' && OWNER_ONLY_[method]) throw new Error('Only the owner can do that.');
}

function execUrl_() {
  try { return ScriptApp.getService().getUrl() || ''; } catch (e) { return ''; }
}

function tz_() {
  try { return Session.getScriptTimeZone() || 'America/New_York'; } catch (e) { return 'America/New_York'; }
}

function findById_(list, id) {
  id = String(id || '');
  for (var i = 0; i < list.length; i++) if (String(list[i].id) === id) return list[i];
  return null;
}

function newId_(prefix) {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function clean_(v, max) {
  return String(v == null ? '' : v).replace(/[\u0000-\u001f]+/g, ' ').trim().slice(0, max || 200);
}

function cleanMonth_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, tz_(), 'yyyy-MM');
  var m = String(v || '').match(/^(\d{4})-(\d{1,2})/);
  return m ? m[1] + '-' + ('0' + m[2]).slice(-2) : '';
}

function pickService_(v) {
  v = String(v || '').toLowerCase();
  for (var i = 0; i < CFG.SERVICES.length; i++) if (CFG.SERVICES[i].toLowerCase() === v) return CFG.SERVICES[i];
  return CFG.SERVICES[0];
}

function pickStage_(v) {
  v = String(v || '').toLowerCase();
  return CFG.STAGES.indexOf(v) >= 0 ? v : 'after';
}

function bool_(v) { return v === true || String(v).toLowerCase() === 'true'; }
function pad_(n) { return ('00' + n).slice(-3); }
function range_(n) { var a = []; for (var i = 0; i < n; i++) a.push(i); return a; }

/* Team Forte materials takeoff (Owens Corning system). Shared by the phone app and the tests. */
var TAKEOFF = (function () {
  'use strict';

  var PACKAGES = [
    { key: 'shingle_oakridge', label: 'Oakridge' },
    { key: 'shingle_duration', label: 'Duration' },
    { key: 'shingle_flex', label: 'Duration FLEX' }
  ];

  /* Default price list. Prices are rough starting numbers until replaced by your supplier's prices. */
  var CATALOG = [
    { key: 'shingle_oakridge', cat: 'Shingles', name: 'Owens Corning Oakridge shingles', unit: 'bundle', price: 42 },
    { key: 'shingle_duration', cat: 'Shingles', name: 'Owens Corning TruDefinition Duration shingles', unit: 'bundle', price: 46 },
    { key: 'shingle_flex', cat: 'Shingles', name: 'Owens Corning Duration FLEX shingles', unit: 'bundle', price: 58 },
    { key: 'hip_ridge', cat: 'Shingles', name: 'OC ProEdge Hip & Ridge (33 LF)', unit: 'bundle', price: 76 },
    { key: 'starter', cat: 'Shingles', name: 'OC Starter Strip Plus (105 LF)', unit: 'bundle', price: 66 },
    { key: 'ice_water', cat: 'Underlayment', name: 'OC WeatherLock G ice & water barrier (2 sq)', unit: 'roll', price: 118 },
    { key: 'underlayment', cat: 'Underlayment', name: 'OC Deck Defense synthetic underlayment (10 sq)', unit: 'roll', price: 165 },
    { key: 'drip_edge', cat: 'Metal & flashing', name: 'Drip edge, aluminum, 10 ft', unit: 'piece', price: 12 },
    { key: 'step_flashing', cat: 'Metal & flashing', name: 'Step flashing 4x4x8 (100 pcs)', unit: 'bundle', price: 48 },
    { key: 'ridge_vent', cat: 'Ventilation', name: 'OC VentSure ridge vent, 4 ft', unit: 'piece', price: 14 },
    { key: 'pipe_boot', cat: 'Ventilation', name: 'Pipe boot flashing', unit: 'each', price: 18 },
    { key: 'coil_nails', cat: 'Fasteners', name: 'Coil roofing nails 1-1/4" (7,200)', unit: 'box', price: 56 },
    { key: 'cap_nails', cat: 'Fasteners', name: 'Plastic cap nails (2,000)', unit: 'box', price: 34 },
    { key: 'sealant', cat: 'Fasteners', name: 'Roof sealant, tube', unit: 'tube', price: 9 },
    { key: 'osb', cat: 'Decking', name: 'OSB roof decking 7/16" 4x8', unit: 'sheet', price: 22 }
  ];

  var DEFAULTS = { waste: 10, iceCourses: 2, pipes: 2, decking: 2, walls: 0 };

  function num(v, d) { v = Number(v); return isFinite(v) ? v : (d || 0); }
  function ceil(v) { return Math.max(0, Math.ceil(v - 1e-9)); }

  function pitchRise(p) {
    var m = String(p || '').match(/(\d+(?:\.\d+)?)\s*(?:\/\s*12)?/);
    return m ? Math.min(30, num(m[1])) : 6;
  }
  function pitchFactor(p) { var r = pitchRise(p) / 12; return Math.sqrt(1 + r * r); }

  /* Google encoded polyline -> [[lat,lng],...] */
  function decodePoly(str) {
    var pts = [], i = 0, lat = 0, lng = 0;
    str = String(str || '');
    while (i < str.length) {
      var res = [0, 0];
      for (var k = 0; k < 2; k++) {
        var shift = 0, result = 0, b;
        do { b = str.charCodeAt(i++) - 63; result |= (b & 31) << shift; shift += 5; } while (b >= 32);
        res[k] = (result & 1) ? ~(result >> 1) : (result >> 1);
      }
      lat += res[0]; lng += res[1];
      pts.push([lat / 1e6, lng / 1e6]);
    }
    return pts;
  }

  function rings(o) {
    if (!o) return [];
    if (typeof o === 'string') return [decodePoly(o)];
    if (Array.isArray(o)) {
      if (!o.length) return [];
      if (typeof o[0] === 'string') return o.map(decodePoly);
      if (Array.isArray(o[0]) && typeof o[0][0] === 'number') return [o];
      if (Array.isArray(o[0]) && Array.isArray(o[0][0])) return o;
    }
    return [];
  }

  /* Footprint area (sq ft) and perimeter (ft) of a lat/lng ring. */
  function ringStats(ring) {
    if (!ring || ring.length < 3) return { area: 0, perim: 0 };
    var lat0 = ring[0][0] * Math.PI / 180;
    var fy = 364567, fx = 364567 * Math.cos(lat0);
    var pts = ring.map(function (p) { return [p[1] * fx, p[0] * fy]; });
    var a = 0, per = 0;
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i], q = pts[(i + 1) % pts.length];
      a += p[0] * q[1] - q[0] * p[1];
      per += Math.sqrt((q[0] - p[0]) * (q[0] - p[0]) + (q[1] - p[1]) * (q[1] - p[1]));
    }
    return { area: Math.abs(a) / 2, perim: per };
  }

  /* Estimate measurements from the roofs saved with an instant quote: [{n, s, p, o}] */
  function estimate(roofs) {
    var m = { area: 0, eaves: 0, rakes: 0, ridges: 0, hips: 0, valleys: 0, pitch: '', roofs: [] };
    var biggest = 0;
    (roofs || []).forEach(function (r) {
      var s = num(r.s || r.sqft), f = pitchFactor(r.p || r.pitch);
      if (s <= 0) return;
      var fp = 0, per = 0;
      rings(r.o || r.outline).forEach(function (ring) { var st = ringStats(ring); fp += st.area; per += st.perim; });
      var surface, basis;
      if (fp > 50) {
        // Is the quoted sq ft the sloped roof area or the flat footprint? Pick whichever fits the outline.
        surface = Math.abs(s - fp * f) <= Math.abs(s - fp) ? s : s * f;
        basis = 'outline';
      } else {
        surface = s;
        per = 4 * Math.sqrt(s / f) * 1.15;
        basis = 'area';
      }
      m.area += surface;
      m.eaves += 0.55 * per;
      m.rakes += 0.45 * per * f;
      m.ridges += 0.30 * per;
      m.hips += 0.10 * per * f;
      m.valleys += 0.03 * per * f;
      m.roofs.push({ name: r.n || r.name || 'Roof', sqft: Math.round(surface), pitch: r.p || r.pitch || '', basis: basis });
      if (surface > biggest) { biggest = surface; m.pitch = r.p || r.pitch || ''; }
    });
    ['area', 'eaves', 'rakes', 'ridges', 'hips', 'valleys'].forEach(function (k) { m[k] = Math.round(m[k]); });
    m.waste = DEFAULTS.waste;
    m.iceCourses = DEFAULTS.iceCourses;
    m.pipes = DEFAULTS.pipes;
    m.decking = DEFAULTS.decking;
    m.walls = DEFAULTS.walls;
    m.est = { eaves: true, rakes: true, ridges: true, hips: true, valleys: true, walls: true, pipes: true, decking: true };
    return m;
  }

  /* Quantities for one job. pkg = 0 Oakridge, 1 Duration, 2 Duration FLEX. */
  function quantities(m, pkg) {
    var waste = num(m.waste, DEFAULTS.waste) / 100;
    var area = num(m.area), sq = area / 100;
    var eaves = num(m.eaves), rakes = num(m.rakes), ridges = num(m.ridges), hips = num(m.hips), valleys = num(m.valleys);
    var courses = num(m.iceCourses, DEFAULTS.iceCourses);
    var iceArea = Math.min(area, eaves * 3 * courses + valleys * 3);
    var shingle = (PACKAGES[pkg] || PACKAGES[1]).key;
    var q = {};
    q[shingle] = ceil(sq * (1 + waste) * 3);
    q.hip_ridge = ceil((ridges + hips) * 1.05 / 33);
    q.starter = ceil((eaves + rakes) * 1.05 / 105);
    q.ice_water = ceil(iceArea * 1.1 / 200);
    q.underlayment = ceil(Math.max(0, area - iceArea) * 1.1 / 1000);
    q.drip_edge = ceil((eaves + rakes) * 1.05 / 10);
    q.step_flashing = ceil(num(m.walls) * 12 / 5 / 100);
    q.ridge_vent = ceil(ridges * 0.8 / 4);
    q.pipe_boot = ceil(num(m.pipes));
    q.coil_nails = sq > 0 ? ceil(sq * (1 + waste) * 320 / 7200) : 0;
    q.cap_nails = sq > 0 ? Math.max(1, ceil(sq / 15)) : 0;
    q.sealant = sq > 0 ? ceil(sq / 10) + 1 : 0;
    q.osb = ceil(num(m.decking));
    return q;
  }

  /* Build material lines. prices: {key: {name, unit, price, abcItem, uom}}. Keeps manual edits from oldLines. */
  function lines(m, pkg, prices, oldLines) {
    var q = quantities(m, pkg);
    var old = {};
    (oldLines || []).forEach(function (l) { old[l.key] = l; });
    var out = [];
    CATALOG.forEach(function (c) {
      if (!(c.key in q)) return;
      var p = (prices && prices[c.key]) || c;
      var prev = old[c.key];
      var qty = prev && prev.manual ? prev.qty : q[c.key];
      if (!qty && !(prev && prev.manual)) return;
      out.push({
        key: c.key, cat: p.cat || c.cat, name: p.name || c.name, unit: p.unit || c.unit,
        qty: qty, calc: q[c.key], manual: !!(prev && prev.manual),
        price: prev && prev.priceManual ? prev.price : num(p.price, c.price), priceManual: !!(prev && prev.priceManual),
        abcItem: prev && prev.itemManual ? prev.abcItem : (p.abcItem || ''), uom: prev && prev.itemManual ? prev.uom : (p.uom || ''),
        itemManual: !!(prev && prev.itemManual)
      });
    });
    (oldLines || []).forEach(function (l) { if (l.custom) out.push(l); });
    return out;
  }

  function totals(ls, taxRate) {
    var sub = 0;
    (ls || []).forEach(function (l) { sub += num(l.qty) * num(l.price); });
    sub = Math.round(sub * 100) / 100;
    var tax = Math.round(sub * num(taxRate) / 100 * 100) / 100;
    return { subtotal: sub, tax: tax, total: Math.round((sub + tax) * 100) / 100 };
  }

  /* ---------- quote pricing (per square) ---------- */
  var PRICING = {
    packages: [{ label: 'Oakridge', perSq: 565 }, { label: 'Duration', perSq: 655 }, { label: 'Duration FLEX', perSq: 745 }],
    lowPct: 83, highPct: 117, wastePct: 13,
    steep: [{ from: 7, pct: 8 }, { from: 9, pct: 15 }, { from: 11, pct: 25 }, { from: 13, pct: 35 }],
    layerPerSq: 65, minJob: 8000, outMin: 1500, roundTo: 100
  };
  /* Same math as the website instant quote (team-forte.com/instant-quote). */
  var WASTE_BY_FACETS = [{ max: 4, pct: 10 }, { max: 10, pct: 13 }, { max: 999, pct: 16 }];

  function cleanPricing(p) {
    p = p || {};
    var d = PRICING, out = {};
    out.packages = d.packages.map(function (pk, i) {
      var x = (p.packages || [])[i] || {};
      return { label: pk.label, perSq: Math.max(0, num(x.perSq, pk.perSq)) };
    });
    ['lowPct', 'highPct', 'wastePct', 'layerPerSq', 'minJob', 'outMin', 'roundTo'].forEach(function (k) { out[k] = Math.max(0, num(p[k], d[k])); });
    if (out.highPct < 100) out.highPct = 100;
    if (out.lowPct > 100) out.lowPct = 100;
    if (!out.roundTo) out.roundTo = 1;
    out.steep = (Array.isArray(p.steep) ? p.steep : d.steep).map(function (x) { return { from: Math.max(0, num(x.from)), pct: Math.max(0, num(x.pct)) }; })
      .filter(function (x) { return x.from > 0; }).sort(function (a, b) { return a.from - b.from; }).slice(0, 6);
    out.updated = p.updated || '';
    return out;
  }

  function steepPct(pr, pitch) {
    var rise = pitchRise(pitch), pct = 0;
    (pr.steep || []).forEach(function (x) { if (rise >= x.from) pct = Math.max(pct, x.pct); });
    return pct;
  }

  function wastePctFor(pr, facets) {
    facets = num(facets);
    if (!facets) return pr.wastePct;
    for (var i = 0; i < WASTE_BY_FACETS.length; i++) if (facets <= WASTE_BY_FACETS[i].max) return WASTE_BY_FACETS[i].pct;
    return WASTE_BY_FACETS[WASTE_BY_FACETS.length - 1].pct;
  }

  /* Price ranges per package: [[low, high], ...]. roofs: [{s: sq ft (sloped), p: '7/12', f: facets}], layers: roof layers to tear off.
     Each roof is priced on its own (main roof minimum, smaller minimum for extra roofs) and the ranges are added up,
     exactly like the website instant quote. */
  function priceRanges(pr, roofs, layers) {
    pr = cleanPricing(pr);
    var extraLayers = Math.max(0, Math.round(num(layers, 1)) - 1);
    var base0 = pr.packages[0].perSq || 1, rt = pr.roundTo;
    function rnd(x) { return Math.round(x / rt) * rt; }
    return pr.packages.map(function (pk) {
      var lo = 0, hi = 0, any = false;
      (roofs || []).forEach(function (r, i) {
        var sqft = num(r.s || r.sqft);
        if (sqft <= 0) return;
        any = true;
        var sq = sqft / 100 * (1 + wastePctFor(pr, r.f) / 100);
        var f = sq * (pk.perSq + extraLayers * pr.layerPerSq) * (1 + steepPct(pr, r.p || r.pitch) / 100);
        var min = (i === 0 ? pr.minJob : pr.outMin) * pk.perSq / base0;
        f = Math.max(f, min);
        lo += rnd(Math.max(f * pr.lowPct / 100, min));
        hi += rnd(f * pr.highPct / 100);
      });
      return any ? [lo, hi] : [0, 0];
    });
  }

  function pitchFromDegrees(deg) {
    var rise = Math.round(Math.tan(num(deg) * Math.PI / 180) * 12);
    return Math.max(0, Math.min(24, rise)) + '/12';
  }

  return {
    PACKAGES: PACKAGES, CATALOG: CATALOG, DEFAULTS: DEFAULTS, PRICING: PRICING,
    cleanPricing: cleanPricing, priceRanges: priceRanges, steepPct: steepPct, pitchFromDegrees: pitchFromDegrees, pitchRise: pitchRise,
    estimate: estimate, quantities: quantities, lines: lines, totals: totals,
    decodePoly: decodePoly, ringStats: ringStats, pitchFactor: pitchFactor
  };
})();
if (typeof module !== 'undefined') module.exports = TAKEOFF;

/* ================================================================== */
/* MATERIALS: website quotes -> approved jobs -> materials -> orders   */
/* ================================================================== */

var QUOTE_COLS = ['id', 'created', 'updated', 'status', 'name', 'address', 'lat', 'lng', 'roofs', 'ranges', 'pick', 'color',
  'link', 'events', 'contractPrice', 'meas', 'lines', 'photoJobId', 'notes', 'approvedAt', 'phone', 'email', 'source', 'layers',
  'type', 'items', 'costs', 'installDate', 'crew', 'depositStatus', 'signedAt', 'signerName', 'signatureId', 'signedPdfId',
  'proposalSentAt', 'reviewAt', 'warrantyDone', 'ghlContactId', 'ghlOppId', 'ghlError', 'doneAt'];
var ORDER_COLS = ['id', 'quoteId', 'created', 'updated', 'method', 'supplier', 'status', 'po', 'deliveryDate', 'deliveryService',
  'address', 'lines', 'subtotal', 'tax', 'total', 'actualTotal', 'confirmation', 'orderNumber', 'lastEvent', 'notes'];
var PRICE_COLS = ['key', 'cat', 'name', 'unit', 'price', 'abcItem', 'uom', 'source', 'updated'];
var QUOTE_JSON = ['roofs', 'ranges', 'events', 'meas', 'lines', 'items', 'costs'];
var QUOTE_STATUSES = ['new', 'approved', 'ordered', 'done', 'archived'];
var ORDER_STATUSES = ['Sent', 'Requested', 'Scheduled', 'Partial', 'Attempted', 'Delivered', 'Pending', 'Canceled', 'Backordered', 'Picked up'];

var ABC_ENV = {
  sandbox: { auth: 'https://sandbox.auth.partners.abcsupply.com/oauth2/aus1vp07knpuqf6Xz0h8/v1/token', api: 'https://partners-sb.abcsupply.com' },
  production: { auth: 'https://auth.partners.abcsupply.com/oauth2/ausvvp0xuwGKLenYy357/v1/token', api: 'https://partners.abcsupply.com' }
};
var ABC_SCOPES = 'location.read product.read account.read pricing.read allOrder.read order.write notification.read notification.write';
var ABC_DELIVERY = { OTR: 'Roof load', OTG: 'Ground drop', CPU: 'Pick up at branch' };

/* ---------------- setup pieces (called from setup) ---------------- */

function setupMaterials_(ss) {
  prepSheet_(ss, 'Quotes', QUOTE_COLS);
  prepSheet_(ss, 'Orders', ORDER_COLS);
  prepSheet_(ss, 'Prices', PRICE_COLS);
  seedPrices_();
  var has = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'dailyRefresh'; });
  if (!has) ScriptApp.newTrigger('dailyRefresh').timeBased().everyDays(1).atHour(5).create();
}

function seedPrices_() {
  var rows = readPrices_();
  var have = {};
  rows.forEach(function (r) { have[r.key] = 1; });
  var now = new Date().toISOString();
  var added = 0;
  TAKEOFF.CATALOG.forEach(function (c) {
    if (have[c.key]) return;
    rows.push({ key: c.key, cat: c.cat, name: c.name, unit: c.unit, price: c.price, abcItem: '', uom: '', source: 'starter', updated: now });
    added++;
  });
  if (added) writeTable_('Prices', PRICE_COLS, rows);
}

/* ---------------- storage ---------------- */

function tab_(name, cols) {
  var ss = ss_();
  if (!ss.getSheetByName(name)) prepSheet_(ss, name, cols);
}

function readQuotes_() {
  tab_('Quotes', QUOTE_COLS);
  return readTable_('Quotes', QUOTE_COLS).map(function (q) {
    QUOTE_COLS.forEach(function (k) { if (q[k] instanceof Date) q[k] = q[k].toISOString(); });
    QUOTE_JSON.forEach(function (k) { q[k] = parseJson_(q[k], k === 'meas' || k === 'costs' ? null : []); });
    q.id = String(q.id);
    q.lat = Number(q.lat) || 0; q.lng = Number(q.lng) || 0;
    q.pick = q.pick === '' || q.pick == null ? -1 : Number(q.pick);
    q.contractPrice = Number(q.contractPrice) || 0;
    q.status = QUOTE_STATUSES.indexOf(String(q.status)) >= 0 ? String(q.status) : 'new';
    ['name', 'address', 'color', 'link', 'photoJobId', 'notes', 'approvedAt', 'created', 'updated', 'phone', 'email', 'source'].forEach(function (k) { q[k] = String(q[k] == null ? '' : q[k]); });
    q.layers = Number(q.layers) || 1;
    ['type', 'installDate', 'crew', 'depositStatus', 'signedAt', 'signerName', 'signatureId', 'signedPdfId', 'proposalSentAt',
      'reviewAt', 'ghlContactId', 'ghlOppId', 'ghlError', 'doneAt'].forEach(function (k) { q[k] = q[k] instanceof Date ? q[k].toISOString() : String(q[k] == null ? '' : q[k]); });
    if (q.type !== 'repair') q.type = 'replacement';
    q.warrantyDone = bool_(q.warrantyDone);
    if (!q.source) q.source = 'website';
    return q;
  }).sort(function (a, b) { return String(b.created).localeCompare(String(a.created)); });
}
function writeQuotes_(qs) {
  writeTable_('Quotes', QUOTE_COLS, qs.map(function (q) {
    var o = {}; QUOTE_COLS.forEach(function (k) { o[k] = QUOTE_JSON.indexOf(k) >= 0 ? JSON.stringify(q[k] == null ? null : q[k]) : q[k]; });
    return o;
  }));
}

function readOrders_() {
  tab_('Orders', ORDER_COLS);
  return readTable_('Orders', ORDER_COLS).map(function (o) {
    ORDER_COLS.forEach(function (k) { if (o[k] instanceof Date) o[k] = o[k].toISOString(); });
    o.id = String(o.id);
    o.lines = parseJson_(o.lines, []);
    o.address = parseJson_(o.address, {});
    ['subtotal', 'tax', 'total'].forEach(function (k) { o[k] = Number(o[k]) || 0; });
    o.actualTotal = o.actualTotal === '' || o.actualTotal == null ? '' : Number(o.actualTotal);
    ['quoteId', 'method', 'supplier', 'status', 'po', 'deliveryDate', 'deliveryService', 'confirmation', 'orderNumber', 'lastEvent', 'notes', 'created', 'updated']
      .forEach(function (k) { o[k] = String(o[k] == null ? '' : o[k]); });
    return o;
  }).sort(function (a, b) { return String(b.created).localeCompare(String(a.created)); });
}
function writeOrders_(os) {
  writeTable_('Orders', ORDER_COLS, os.map(function (o) {
    var r = {}; ORDER_COLS.forEach(function (k) { r[k] = (k === 'lines' || k === 'address') ? JSON.stringify(o[k] || null) : o[k]; });
    return r;
  }));
}

function readPrices_() {
  tab_('Prices', PRICE_COLS);
  return readTable_('Prices', PRICE_COLS).map(function (p) {
    PRICE_COLS.forEach(function (k) { if (p[k] instanceof Date) p[k] = p[k].toISOString(); });
    p.key = String(p.key);
    p.price = Number(p.price) || 0;
    ['cat', 'name', 'unit', 'abcItem', 'uom', 'source', 'updated'].forEach(function (k) { p[k] = String(p[k] == null ? '' : p[k]); });
    return p;
  });
}
function writePrices_(ps) { writeTable_('Prices', PRICE_COLS, ps); }

function parseJson_(v, d) {
  if (v === '' || v == null) return d;
  if (typeof v !== 'string') return v;
  try { var x = JSON.parse(v); return x == null ? d : x; } catch (e) { return d; }
}

function settings_() {
  var s = parseJson_(PropertiesService.getScriptProperties().getProperty('SETTINGS'), {}) || {};
  s.suppliers = Array.isArray(s.suppliers) ? s.suppliers : [];
  s.taxRate = s.taxRate === undefined ? 6.35 : Number(s.taxRate) || 0;
  s.waste = s.waste === undefined ? TAKEOFF.DEFAULTS.waste : Number(s.waste) || 0;
  s.iceCourses = s.iceCourses === undefined ? TAKEOFF.DEFAULTS.iceCourses : Number(s.iceCourses) || 0;
  s.contactName = s.contactName || '';
  s.contactPhone = s.contactPhone || '';
  s.abc = s.abc || {};
  s.abc.env = s.abc.env === 'production' ? 'production' : 'sandbox';
  return settingsExtra_(s);
}
function saveSettings_(s) { PropertiesService.getScriptProperties().setProperty('SETTINGS', JSON.stringify(s)); }
function abcSecret_() { return PropertiesService.getScriptProperties().getProperty('ABC_SECRET') || ''; }
function abcReady_(s) { s = s || settings_(); return !!(s.abc.clientId && abcSecret_() && s.abc.shipTo && s.abc.branch); }

function publicSettings_() {
  var s = settings_();
  var out = JSON.parse(JSON.stringify(s));
  out.abc.hasSecret = !!abcSecret_();
  out.abc.connected = abcReady_(s);
  out.hasMapsKey = !!mapsKey_();
  out.mapsKey = mapsKey_(); /* browser key (same one the website shows publicly) */
  out.hasGhlToken = !!ghlToken_();
  out.ghl.connected = ghlReady_(s);
  return out;
}

/* ---------------- quote links ---------------- */

function decodeQuoteLink_(link) {
  var m = String(link || '').match(/[#&?]q=([A-Za-z0-9_\-]+)/);
  if (!m) throw new Error('That isn’t a Team Forte quote link. It should look like team-forte.com/instant-quote#q=…');
  var b64 = m[1].replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  var d;
  try { d = JSON.parse(Utilities.newBlob(Utilities.base64Decode(b64)).getDataAsString('UTF-8')); } catch (e) { throw new Error('That quote link is damaged or cut off.'); }
  if (!d || d.v !== 1 || !/^TF-[A-Z0-9]{3,12}$/.test(String(d.id)) || !Array.isArray(d.r)) throw new Error('That quote link is damaged or cut off.');
  return d;
}

/* Contact details and answers sent along with a website lead (POST body, never in the link). */
function applyLead_(q, j) {
  if (!j) return;
  var nm = clean_(j.name, 60); if (nm) q.name = nm;
  var ph = clean_(j.phone, 30); if (ph && ph.replace(/\D/g, '').length >= 10) q.phone = ph;
  var em = clean_(j.email, 120); if (em && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) q.email = em;
  if (q.source !== 'app') q.source = 'website';
  var L = q.lead || {};
  ['timeline', 'layers', 'package', 'color', 'inspectionDay', 'inspectionWindow', 'notes', 'smsUpdates', 'smsMarketing', 'rep'].forEach(function (k) {
    if (j[k] != null && String(j[k]).trim()) L[k] = clean_(j[k], k === 'notes' ? 500 : 80);
  });
  if (j.event) L.last = clean_(j.event, 40);
  q.lead = L;
}

function intakeQuote_(d, link, event, lead) {
  var qs = readQuotes_();
  var now = new Date().toISOString();
  var q = findById_(qs, d.id);
  if (!q) {
    q = { id: String(d.id), created: now, status: 'new', events: [], contractPrice: 0, meas: null, lines: [], photoJobId: '', notes: '', approvedAt: '' };
    qs.push(q);
  }
  if (event) { q.events = (q.events || []).concat([{ e: clean_(event, 40), t: now }]).slice(-20); }
  if (q.status === 'new') {
    q.name = clean_(d.n, 60);
    q.address = clean_(d.a, 160);
    q.lat = Number(d.c && d.c[0]) || 0;
    q.lng = Number(d.c && d.c[1]) || 0;
    q.roofs = (d.r || []).slice(0, 20).map(function (r) {
      return { n: clean_(r.n, 40), s: Math.max(0, Math.min(200000, Number(r.s) || 0)), p: clean_(r.p, 10), o: Array.isArray(r.o) ? r.o.slice(0, 10).map(function (x) { return String(x).slice(0, 4000); }) : String(r.o || '').slice(0, 4000) };
    });
    q.ranges = (d.p || []).slice(0, 5).map(function (x) { return [Number(x[0]) || 0, Number(x[1]) || 0]; });
    q.pick = [0, 1, 2].indexOf(Number(d.k)) >= 0 ? Number(d.k) : (q.pick >= 0 ? q.pick : -1);
    q.color = clean_(d.h, 40) || q.color || '';
    q.link = String(link || '').slice(0, 6000);
  }
  applyLead_(q, lead);
  q.updated = now;
  writeQuotes_(qs);
  return q;
}

/* Website -> app. Called by the instant quote widget (navigator.sendBeacon). */
function doPost(e) {
  var p = (e && e.parameter) || {};
  var body = (e && e.postData && e.postData.contents) || '';
  if (p.r === 'api') {
    /* Installed phone app (app.html outside Google). Same rules as the Google-hosted app. */
    return ContentService.createTextOutput(api(body)).setMimeType(ContentService.MimeType.JSON);
  }
  var lock = null;
  try {
    if (p.r === 'quote') {
      var cache = CacheService.getScriptCache();
      var n = Number(cache.get('qin')) || 0;
      if (n > 150) return ContentService.createTextOutput('busy');
      cache.put('qin', String(n + 1), 3600);
      var j = parseJson_(body, {}) || {};
      var link = j.link || j.quote_url || '';
      var d = decodeQuoteLink_(link);
      lock = LockService.getScriptLock(); lock.waitLock(20000);
      intakeQuote_(d, link, j.event || 'quote', j);
    } else if (p.r === 'abc') {
      var key = PropertiesService.getScriptProperties().getProperty('ABC_HOOK_KEY');
      if (!key || p.k !== key) return ContentService.createTextOutput('no');
      lock = LockService.getScriptLock(); lock.waitLock(20000);
      abcApplyEvent_(parseJson_(body, {}));
    }
  } catch (err) {
    Logger.log('doPost ' + p.r + ': ' + err.message);
  } finally {
    if (lock) { try { lock.releaseLock(); } catch (e2) { /* ignore */ } }
  }
  return ContentService.createTextOutput('ok');
}

/* ---------------- app actions ---------------- */

API_.matList = function () {
  return {
    quotes: readQuotes_().filter(function (q) { return q.status !== 'archived'; }),
    orders: readOrders_(),
    prices: readPrices_(),
    settings: publicSettings_(),
    pricing: pricing_(),
    owner: ownerEmail_()
  };
};

API_.addQuote = function (a) {
  var d = decodeQuoteLink_(a.link);
  return intakeQuote_(d, a.link, 'added in app');
};

API_.saveQuote = function (a) {
  var qs = readQuotes_();
  var q = findById_(qs, a.id);
  if (!q) throw new Error('Quote not found.');
  var was = q.status;
  if (a.status !== undefined) {
    if (QUOTE_STATUSES.indexOf(a.status) < 0) throw new Error('Unknown status.');
    q.status = a.status;
  }
  if (a.contractPrice !== undefined) q.contractPrice = Math.max(0, Math.round(Number(a.contractPrice) * 100) / 100 || 0);
  if (a.pick !== undefined) q.pick = [0, 1, 2].indexOf(Number(a.pick)) >= 0 ? Number(a.pick) : -1;
  if (a.color !== undefined) q.color = clean_(a.color, 40);
  if (a.name !== undefined) q.name = clean_(a.name, 60);
  if (a.address !== undefined) q.address = clean_(a.address, 160);
  if (a.notes !== undefined) q.notes = clean_(a.notes, 1000);
  if (a.phone !== undefined) q.phone = clean_(a.phone, 30);
  if (a.email !== undefined) q.email = clean_(a.email, 120);
  if (a.meas !== undefined) q.meas = cleanMeas_(a.meas);
  if (a.lines !== undefined) q.lines = cleanLines_(a.lines);
  if (a.items !== undefined) q.items = cleanItems_(a.items);
  if (a.costs !== undefined) q.costs = cleanCosts_(a.costs);
  if (a.installDate !== undefined) q.installDate = cleanDate_(a.installDate);
  if (a.crew !== undefined) q.crew = clean_(a.crew, 60);
  if (a.depositStatus !== undefined) q.depositStatus = ['', 'requested', 'paid'].indexOf(a.depositStatus) >= 0 ? a.depositStatus : '';
  if (a.warrantyDone !== undefined) q.warrantyDone = !!a.warrantyDone;
  if (q.status !== was) logEvent_(q, 'status: ' + q.status);
  if (q.status === 'approved' && was === 'new') onApproved_(q);
  if (q.status === 'done' && was !== 'done') onDone_(q);
  q.updated = new Date().toISOString();
  writeQuotes_(qs);
  return q;
};

function onApproved_(q) {
  q.approvedAt = q.approvedAt || new Date().toISOString();
  if (!q.photoJobId) {
    try {
      var pkg = TAKEOFF.PACKAGES[q.pick];
      var job = API_.saveJob({
        service: 'Roofing', title: q.type === 'repair' ? 'Roof repair' : 'Roof replacement' + (pkg ? ' - OC ' + pkg.label : ''),
        town: townOf_(q.address), address: q.address, description: ''
      });
      q.photoJobId = job.id;
    } catch (e) { Logger.log('photo job: ' + e.message); }
  }
  if (!q.costs) q.costs = defaultCosts_(q);
  ghlSync_(q, 'won');
}

API_.deleteQuote = function (a) {
  var qs = readQuotes_();
  var q = findById_(qs, a.id);
  if (!q) return { deleted: a.id };
  if (q.status === 'new') qs = qs.filter(function (x) { return x.id !== q.id; });
  else q.status = 'archived';
  writeQuotes_(qs);
  return { deleted: a.id };
};

API_.savePrice = function (a) {
  var ps = readPrices_();
  var p = a.key ? findByKey_(ps, a.key) : null;
  if (!p) { p = { key: a.key || ('c' + Date.now().toString(36)), source: 'manual' }; ps.push(p); }
  if (a.name !== undefined) p.name = clean_(a.name, 120) || p.name || 'Item';
  if (a.cat !== undefined) p.cat = clean_(a.cat, 40) || 'Other';
  if (a.unit !== undefined) p.unit = clean_(a.unit, 20) || 'each';
  if (a.price !== undefined) { p.price = Math.max(0, Math.round(Number(a.price) * 100) / 100 || 0); p.source = 'manual'; }
  if (a.abcItem !== undefined) p.abcItem = clean_(a.abcItem, 40);
  if (a.uom !== undefined) p.uom = clean_(a.uom, 10);
  p.updated = new Date().toISOString();
  writePrices_(ps);
  return p;
};

API_.deletePrice = function (a) {
  if (TAKEOFF.CATALOG.some(function (c) { return c.key === a.key; })) throw new Error('Built-in items can’t be deleted. Set the price instead.');
  writePrices_(readPrices_().filter(function (p) { return p.key !== a.key; }));
  return { deleted: a.key };
};

API_.saveSettings = function (a) {
  var s = settings_();
  if (a.suppliers !== undefined) {
    s.suppliers = (a.suppliers || []).slice(0, 10).map(function (x) { return { name: clean_(x.name, 60), email: clean_(x.email, 120) }; })
      .filter(function (x) { return x.name && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x.email); });
  }
  ['taxRate', 'waste', 'iceCourses'].forEach(function (k) { if (a[k] !== undefined) s[k] = Math.max(0, Number(a[k]) || 0); });
  if (a.contactName !== undefined) s.contactName = clean_(a.contactName, 60);
  if (a.contactPhone !== undefined) s.contactPhone = clean_(a.contactPhone, 30);
  if (a.mapsKey) PropertiesService.getScriptProperties().setProperty('MAPS_KEY', checkMapsKey_(a.mapsKey));
  if (a.mapsKeyClear) PropertiesService.getScriptProperties().setProperty('MAPS_KEY', '');
  if (a.abc) {
    var b = a.abc;
    if (b.env !== undefined) s.abc.env = b.env === 'production' ? 'production' : 'sandbox';
    if (b.clientId !== undefined) s.abc.clientId = clean_(b.clientId, 120);
    if (b.shipTo !== undefined) s.abc.shipTo = clean_(b.shipTo, 30);
    if (b.branch !== undefined) s.abc.branch = clean_(b.branch, 30);
    if (b.branchName !== undefined) s.abc.branchName = clean_(b.branchName, 80);
    if (b.secret) PropertiesService.getScriptProperties().setProperty('ABC_SECRET', String(b.secret).trim());
    if (b.disconnect) {
      PropertiesService.getScriptProperties().setProperty('ABC_SECRET', '');
      s.abc = { env: s.abc.env };
    }
    try { CacheService.getScriptCache().remove('abc_tok_' + s.abc.env); } catch (e) { /* ignore */ }
  }
  saveSettings_(s);
  return publicSettings_();
};

API_.placeOrder = function (a) {
  var s = settings_();
  var qs = readQuotes_();
  var q = a.quoteId ? findById_(qs, a.quoteId) : null;
  var lines = cleanLines_(a.lines).filter(function (l) { return l.qty > 0; });
  if (!lines.length) throw new Error('Add at least one item with a quantity.');
  var t = TAKEOFF.totals(lines, s.taxRate);
  var addr = {
    line1: clean_(a.address && a.address.line1, 60), city: clean_(a.address && a.address.city, 40),
    state: clean_(a.address && a.address.state, 2).toUpperCase(), postal: clean_(a.address && a.address.postal, 10)
  };
  var now = new Date().toISOString();
  var order = {
    id: newId_('o'), quoteId: q ? q.id : '', created: now, updated: now, method: a.method === 'abc' ? 'abc' : 'email',
    status: '', po: clean_(a.po || (q ? q.id : 'TF'), 20), deliveryDate: cleanDate_(a.deliveryDate),
    deliveryService: ABC_DELIVERY[a.deliveryService] ? a.deliveryService : 'OTR', address: addr, lines: lines,
    subtotal: t.subtotal, tax: t.tax, total: t.total, actualTotal: '', confirmation: '', orderNumber: '', lastEvent: '', notes: clean_(a.notes, 255)
  };
  if (!addr.line1 || !addr.city) throw new Error('Add the delivery street and town.');

  if (order.method === 'abc') {
    if (!abcReady_(s)) throw new Error('ABC Supply isn’t connected yet. Set it up under Spending > Settings.');
    var missing = lines.filter(function (l) { return !l.abcItem; }).map(function (l) { return l.name; });
    if (missing.length) throw new Error('Link these items to an ABC item number first (Prices): ' + missing.slice(0, 4).join(', ') + (missing.length > 4 ? '…' : ''));
    var res = abcFetch_('post', '/api/order/v2/orders', [abcOrderBody_(order, q, s)]);
    var r0 = res && res.orders && res.orders[0];
    var failed = res && res.request && Number(res.request.ordersFailed);
    if (!r0 || failed || !r0.confirmationNumber) throw new Error('ABC Supply didn’t accept the order: ' + ((r0 && r0.message) || 'no confirmation returned'));
    order.confirmation = String(r0.confirmationNumber);
    order.status = 'Requested';
    order.supplier = 'ABC Supply' + (s.abc.branchName ? ' - ' + s.abc.branchName : '');
  } else {
    var sup = s.suppliers[Number(a.supplier)];
    if (!sup) throw new Error('Pick a supplier (add one under Spending > Settings).');
    sendOrderEmail_(order, q, sup, s);
    order.status = 'Sent';
    order.supplier = sup.name;
  }

  var os = readOrders_();
  os.push(order);
  writeOrders_(os);
  if (q && (q.status === 'approved' || q.status === 'new')) { q.status = 'ordered'; q.updated = now; writeQuotes_(qs); }
  return order;
};

API_.saveOrder = function (a) {
  var os = readOrders_();
  var o = findById_(os, a.id);
  if (!o) throw new Error('Order not found.');
  if (a.status !== undefined && ORDER_STATUSES.indexOf(a.status) >= 0) o.status = a.status;
  if (a.actualTotal !== undefined) o.actualTotal = a.actualTotal === '' || a.actualTotal == null ? '' : Math.max(0, Math.round(Number(a.actualTotal) * 100) / 100 || 0);
  if (a.notes !== undefined) o.notes = clean_(a.notes, 255);
  o.updated = new Date().toISOString();
  writeOrders_(os);
  return o;
};

API_.deleteOrder = function (a) {
  writeOrders_(readOrders_().filter(function (o) { return o.id !== a.id; }));
  return { deleted: a.id };
};

/* ---------------- ABC Supply ---------------- */

API_.abcTest = function () {
  var s = settings_();
  if (!s.abc.clientId || !abcSecret_()) throw new Error('Enter the ABC client ID and secret first.');
  abcToken_(true);
  return { ok: true, env: s.abc.env };
};

API_.abcBranches = function (a) {
  var q = a.lat && a.lng ? '?lat=' + Number(a.lat) + '&long=' + Number(a.lng) + '&distance=60' : '?state=' + encodeURIComponent(clean_(a.state || 'CT', 2));
  var res = abcFetch_('get', '/api/location/v1/branches' + q);
  var list = Array.isArray(res) ? res : (res && (res.branches || res.items)) || [];
  return list.slice(0, 40).map(function (b) {
    var br = b.branch || b, ad = b.address || {};
    return { number: String(br.number || ''), name: br.name || '', distance: br.distance || '', city: ad.city || '', state: ad.state || '' };
  }).filter(function (b) { return b.number; });
};

API_.abcSearch = function (a) {
  var term = clean_(a.q, 60);
  if (term.length < 2) throw new Error('Type at least 2 letters.');
  var key = /^\d{3,}$/.test(term) ? 'itemNumber' : 'itemDescription';
  var res = abcFetch_('post', '/api/product/v1/search/items', {
    filters: [{ key: key, condition: 'contains', values: [term] }],
    pagination: { itemsPerPage: 30, pageNumber: 1 }
  });
  return ((res && res.items) || []).slice(0, 30).map(function (it) {
    var uoms = (it.uoms || []);
    var stock = uoms.filter(function (u) { return /stock/i.test(u.description || ''); })[0] || uoms[0] || {};
    return { itemNumber: String(it.itemNumber || ''), description: it.itemDescription || '', uom: stock.code || '', uoms: uoms.map(function (u) { return u.code; }) };
  });
};

API_.refreshPrices = function () { return abcRefreshPrices_(); };

API_.abcRegisterWebhook = function () {
  var props = PropertiesService.getScriptProperties();
  var key = props.getProperty('ABC_HOOK_KEY');
  if (!key) { key = Utilities.getUuid().replace(/-/g, ''); props.setProperty('ABC_HOOK_KEY', key); }
  var url = execUrl_();
  if (!url) throw new Error('Deploy the app as a web app first.');
  var res = abcFetch_('post', '/api/notification/v2/webhooks', { name: 'Team Forte Photos', type: 'ORDER', events: ['ORDER_UPDATE'], url: url + '?r=abc&k=' + key });
  var s = settings_();
  s.abc.webhookId = res && res.id ? String(res.id) : 'registered';
  saveSettings_(s);
  return publicSettings_();
};

function abcToken_(fresh) {
  var s = settings_();
  var env = ABC_ENV[s.abc.env];
  var cache = CacheService.getScriptCache();
  var ck = 'abc_tok_' + s.abc.env;
  if (!fresh) { var c = cache.get(ck); if (c) return c; }
  var res = UrlFetchApp.fetch(env.auth, {
    method: 'post', muteHttpExceptions: true, contentType: 'application/x-www-form-urlencoded',
    headers: { Authorization: 'Basic ' + Utilities.base64Encode(s.abc.clientId + ':' + abcSecret_()), Accept: 'application/json' },
    payload: 'grant_type=client_credentials&scope=' + encodeURIComponent(ABC_SCOPES)
  });
  var code = res.getResponseCode();
  var j = parseJson_(res.getContentText(), {}) || {};
  if (code !== 200 || !j.access_token) {
    throw new Error('ABC Supply login failed (' + code + '). Check the client ID, secret and Sandbox/Production setting.' + (j.error_description ? ' ' + j.error_description : ''));
  }
  cache.put(ck, j.access_token, Math.min(1500, Math.max(60, (Number(j.expires_in) || 1800) - 120)));
  return j.access_token;
}

function abcFetch_(method, path, body, retried) {
  var s = settings_();
  var opts = {
    method: method, muteHttpExceptions: true,
    headers: { Authorization: 'Bearer ' + abcToken_(), Accept: 'application/json' }
  };
  if (body !== undefined) { opts.contentType = 'application/json'; opts.payload = JSON.stringify(body); }
  var res = UrlFetchApp.fetch(ABC_ENV[s.abc.env].api + path, opts);
  var code = res.getResponseCode();
  var text = res.getContentText();
  if (code === 401 && !retried) {
    CacheService.getScriptCache().remove('abc_tok_' + s.abc.env);
    return abcFetch_(method, path, body, true);
  }
  if (code >= 300) {
    var j = parseJson_(text, {}) || {};
    throw new Error('ABC Supply error ' + code + ': ' + String(j.message || j.error || text || '').slice(0, 200));
  }
  return parseJson_(text, null);
}

function abcRefreshPrices_() {
  var s = settings_();
  if (!abcReady_(s)) throw new Error('ABC Supply isn’t connected yet.');
  var ps = readPrices_();
  var linked = ps.filter(function (p) { return p.abcItem; });
  var updated = 0, failed = [];
  for (var i = 0; i < linked.length; i += 50) {
    var batch = linked.slice(i, i + 50);
    var res = abcFetch_('post', '/api/pricing/v2/prices', {
      requestId: newId_('pr'), shipToNumber: s.abc.shipTo, branchNumber: s.abc.branch, purpose: 'ordering',
      lines: batch.map(function (p, k) { var l = { id: String(k + 1), itemNumber: p.abcItem, quantity: 1 }; if (p.uom) l.uom = p.uom; return l; })
    });
    ((res && res.lines) || []).forEach(function (l) {
      var p = batch[Number(l.id) - 1];
      if (!p) return;
      var ok = l.status && String(l.status.code).toUpperCase() === 'OK';
      if (ok && typeof l.unitPrice === 'number' && l.unitPrice > 0) {
        p.price = Math.round(l.unitPrice * 100) / 100; p.source = 'abc'; p.updated = new Date().toISOString(); updated++;
      } else {
        failed.push(p.name + (l.status && l.status.message ? ' (' + l.status.message + ')' : ''));
      }
    });
  }
  writePrices_(ps);
  s.abc.lastRefresh = new Date().toISOString();
  s.abc.lastRefreshResult = updated + ' updated' + (failed.length ? ', ' + failed.length + ' failed' : '');
  saveSettings_(s);
  return { updated: updated, failed: failed, linked: linked.length };
}

function abcOrderBody_(o, q, s) {
  var contact = { name: s.contactName || 'Team Forte', functionCode: 'DC' };
  if (s.contactPhone) contact.phones = [{ number: s.contactPhone.replace(/[^\d]/g, ''), type: 'Mobile' }];
  var owner = ownerEmail_();
  if (owner) contact.email = owner;
  var body = {
    requestId: o.id, purchaseOrder: o.po, branchNumber: s.abc.branch, deliveryService: o.deliveryService, typeCode: 'SO', currency: 'USD',
    shipTo: {
      name: ('Team Forte' + (q && q.name ? ' - ' + q.name : '')).slice(0, 60), number: s.abc.shipTo,
      address: { line1: o.address.line1, city: o.address.city, state: o.address.state, postal: o.address.postal, country: 'USA' },
      contacts: [contact]
    },
    lines: o.lines.map(function (l, i) {
      var line = { id: String(i + 1), itemNumber: l.abcItem, itemDescription: l.name.slice(0, 60), orderedQty: { value: l.qty, uom: l.uom || undefined } };
      if (!l.uom) delete line.orderedQty.uom;
      return line;
    })
  };
  if (o.deliveryDate) body.dates = { deliveryRequestedFor: o.deliveryDate };
  if (o.notes) body.orderComments = [{ code: 'D', description: o.notes }];
  return body;
}

/* Order update from ABC (webhook event or Get Order response). */
function abcApplyEvent_(ev) {
  if (!ev) return false;
  var so = ev.salesOrder || ev;
  var conf = String(so.confirmationNumber || '');
  var po = String(so.purchaseOrder || '');
  var os = readOrders_();
  var o = os.filter(function (x) { return x.method === 'abc' && ((conf && x.confirmation === conf) || (!conf && po && x.po === po)); })[0];
  if (!o) return false;
  var ship = (ev.shipments && ev.shipments[0]) || null;
  var st = String((ship && ship.status) || so.status || '').trim();
  var match = ORDER_STATUSES.filter(function (x) { return x.toLowerCase() === st.toLowerCase(); })[0];
  if (match) o.status = match; else if (st) o.status = st.slice(0, 20);
  if (so.orderNumber) o.orderNumber = String(so.orderNumber);
  var amt = ev.orderAmounts || so.orderAmounts;
  if (amt && Number(amt.total) > 0) o.actualTotal = Math.round(Number(amt.total) * 100) / 100;
  o.lastEvent = new Date().toISOString();
  o.updated = o.lastEvent;
  writeOrders_(os);
  return true;
}

/** Runs every morning (installed by setup): refresh ABC prices and check open ABC orders. */
function dailyRefresh() {
  var s = settings_();
  if (!abcReady_(s)) return;
  try { abcRefreshPrices_(); } catch (e) { Logger.log('price refresh: ' + e.message); }
  readOrders_().filter(function (o) {
    return o.method === 'abc' && o.confirmation && ['Delivered', 'Canceled', 'Picked up'].indexOf(o.status) < 0;
  }).slice(0, 20).forEach(function (o) {
    try {
      var r = abcFetch_('get', '/api/order/v2/orders?confirmationNumber=' + encodeURIComponent(o.confirmation));
      if (r) abcApplyEvent_(Array.isArray(r) ? r[0] : (r.items ? r.items[0] : r));
    } catch (e) { Logger.log('order check ' + o.confirmation + ': ' + e.message); }
  });
}

/* ---------------- email orders ---------------- */

function sendOrderEmail_(o, q, sup, s) {
  var owner = ownerEmail_();
  var rows = o.lines.map(function (l) {
    return '<tr><td style="padding:6px 10px;border-bottom:1px solid #ddd">' + escHtml_(l.name) + (l.abcItem ? '<br><small style="color:#666">Item ' + escHtml_(l.abcItem) + '</small>' : '') +
      '</td><td style="padding:6px 10px;border-bottom:1px solid #ddd;text-align:right"><b>' + l.qty + '</b></td><td style="padding:6px 10px;border-bottom:1px solid #ddd">' + escHtml_(l.unit) + '</td></tr>';
  }).join('');
  var a = o.address;
  var html = '<div style="font-family:Arial,sans-serif;font-size:14px;color:#1C2430">' +
    '<p>Hi ' + escHtml_(sup.name) + ',</p><p>Please quote and schedule the following material order for Team Forte.</p>' +
    '<table style="border-collapse:collapse;margin:10px 0">' +
    '<tr><td style="padding:3px 12px 3px 0;color:#666">PO / Job</td><td><b>' + escHtml_(o.po) + '</b></td></tr>' +
    '<tr><td style="padding:3px 12px 3px 0;color:#666">Deliver to</td><td>' + escHtml_([a.line1, a.city, (a.state + ' ' + a.postal).trim()].filter(Boolean).join(', ')) + '</td></tr>' +
    '<tr><td style="padding:3px 12px 3px 0;color:#666">Delivery</td><td>' + escHtml_(ABC_DELIVERY[o.deliveryService] || '') + (o.deliveryDate ? ' on ' + escHtml_(o.deliveryDate) : '') + '</td></tr>' +
    (q && q.color ? '<tr><td style="padding:3px 12px 3px 0;color:#666">Shingle color</td><td><b>' + escHtml_(q.color) + '</b></td></tr>' : '') +
    '<tr><td style="padding:3px 12px 3px 0;color:#666">Contact</td><td>' + escHtml_([s.contactName, s.contactPhone].filter(Boolean).join(', ') || 'Team Forte') + '</td></tr>' +
    '</table>' +
    '<table style="border-collapse:collapse;min-width:420px"><tr style="background:#13202F;color:#fff"><th style="padding:8px 10px;text-align:left">Item</th><th style="padding:8px 10px;text-align:right">Qty</th><th style="padding:8px 10px;text-align:left">Unit</th></tr>' + rows + '</table>' +
    (o.notes ? '<p><b>Notes:</b> ' + escHtml_(o.notes) + '</p>' : '') +
    '<p>Please reply with pricing and the delivery confirmation. Thank you!</p><p>Team Forte</p></div>';
  var csv = 'Item,ABC item #,Qty,Unit\n' + o.lines.map(function (l) {
    return [l.name, l.abcItem || '', l.qty, l.unit].map(function (v) { v = String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(',');
  }).join('\n');
  var msg = {
    to: sup.email, subject: 'Material order ' + o.po + ' - ' + [a.line1, a.city].filter(Boolean).join(', '),
    htmlBody: html, name: 'Team Forte', attachments: [Utilities.newBlob(csv, 'text/csv', 'order-' + o.po + '.csv')]
  };
  if (owner) { msg.cc = owner; msg.replyTo = owner; }
  MailApp.sendEmail(msg);
}

/* ---------------- helpers ---------------- */

function cleanMeas_(m) {
  m = m || {};
  var out = {};
  ['area', 'eaves', 'rakes', 'ridges', 'hips', 'valleys', 'walls', 'pipes', 'decking', 'waste', 'iceCourses'].forEach(function (k) {
    out[k] = Math.max(0, Math.min(1000000, Math.round(Number(m[k]) || 0)));
  });
  out.pitch = clean_(m.pitch, 10);
  out.est = {};
  Object.keys(m.est || {}).forEach(function (k) { if (m.est[k]) out.est[clean_(k, 20)] = true; });
  out.roofs = (m.roofs || []).slice(0, 20).map(function (r) { return { name: clean_(r.name, 40), sqft: Number(r.sqft) || 0, pitch: clean_(r.pitch, 10), basis: clean_(r.basis, 10) }; });
  return out;
}

function cleanLines_(ls) {
  return (ls || []).slice(0, 99).map(function (l) {
    return {
      key: clean_(l.key, 40), cat: clean_(l.cat, 40), name: clean_(l.name, 120) || 'Item', unit: clean_(l.unit, 20) || 'each',
      qty: Math.max(0, Math.min(100000, Math.round(Number(l.qty) || 0))), calc: Number(l.calc) || 0, manual: !!l.manual,
      price: Math.max(0, Math.round(Number(l.price) * 100) / 100 || 0), priceManual: !!l.priceManual,
      abcItem: clean_(l.abcItem, 40), uom: clean_(l.uom, 10), itemManual: !!l.itemManual, custom: !!l.custom
    };
  });
}

function cleanDate_(v) { var m = String(v || '').match(/^\d{4}-\d{2}-\d{2}$/); return m ? m[0] : ''; }
function findByKey_(list, key) { for (var i = 0; i < list.length; i++) if (list[i].key === key) return list[i]; return null; }
function townOf_(addr) { var parts = String(addr || '').split(','); return parts.length >= 3 ? parts[parts.length - 2].trim() : ''; }
function escHtml_(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function ownerEmail_() { try { return Session.getEffectiveUser().getEmail() || ''; } catch (e) { return ''; } }

/* ================================================================== */
/* ESTIMATES: address -> roof size (Google Solar API) -> price ranges  */
/* ================================================================== */

var QUOTE_PAGE = 'https://team-forte.com/instant-quote'; /* one quote design: links open the website instant quote */

function pricing_() {
  var saved = parseJson_(PropertiesService.getScriptProperties().getProperty('PRICING'), null);
  /* Prices saved before the app matched the website ($650/$750/$850) are dropped so both use the website prices. */
  if (saved && saved.packages && saved.packages.length === 3 && Number(saved.packages[0].perSq) === 650 &&
      Number(saved.packages[1].perSq) === 750 && Number(saved.packages[2].perSq) === 850 && !saved.matchedWebsite) saved = null;
  return TAKEOFF.cleanPricing(saved);
}

/* Pull the key out of whatever was pasted and make sure Google accepts it. */
function checkMapsKey_(raw) {
  var m = String(raw || '').match(/AIza[0-9A-Za-z_\-]{35}/);
  if (!m) throw new Error('That isn\u2019t a Google key. A key starts with AIza and is 39 letters long. Tap \u201cUse my website\u2019s key\u201d instead.');
  var res = UrlFetchApp.fetch('https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=41.7658&location.longitude=-72.6734&requiredQuality=LOW&key=' + m[0], { muteHttpExceptions: true });
  var t = res.getContentText();
  if (/API_KEY_INVALID|API key not valid/i.test(t)) throw new Error('Google says that key is not valid. Check it was copied in full, or tap \u201cUse my website\u2019s key\u201d.');
  return m[0];
}
/* Run from the editor: copy the website's key into the app. */
function fixMapsKeyFromWebsite() {
  var html = UrlFetchApp.fetch('https://team-forte.com/instant-quote', { muteHttpExceptions: true, followRedirects: true }).getContentText();
  var k = (html.match(/AIza[0-9A-Za-z_\-]{35}/) || [])[0];
  if (!k) throw new Error('No key found on the website.');
  var old = mapsKey_();
  PropertiesService.getScriptProperties().setProperty('MAPS_KEY', checkMapsKey_(k));
  Logger.log('Saved website key ending ' + k.slice(-3) + '. Old key: ' + (old ? old.length + ' characters, ending ' + old.slice(-3) + (old === k ? ' (same)' : ' (different)') : 'none'));
}
/* Use the same key the website instant quote uses (it is in the public page). */
API_.useWebsiteKey = function () {
  var html = UrlFetchApp.fetch('https://team-forte.com/instant-quote', { muteHttpExceptions: true, followRedirects: true }).getContentText();
  var keys = (html.match(/AIza[0-9A-Za-z_\-]{35}/g) || []).filter(function (k, i, a) { return a.indexOf(k) === i; });
  if (!keys.length) throw new Error('Couldn\u2019t find a Google key on team-forte.com/instant-quote. Paste the key instead.');
  PropertiesService.getScriptProperties().setProperty('MAPS_KEY', checkMapsKey_(keys[0]));
  return publicSettings_();
};

function mapsKey_() { return PropertiesService.getScriptProperties().getProperty('MAPS_KEY') || ''; }

API_.savePricing = function (a) {
  var p = TAKEOFF.cleanPricing(a);
  p.updated = new Date().toISOString();
  p.matchedWebsite = true;
  PropertiesService.getScriptProperties().setProperty('PRICING', JSON.stringify(p));
  return p;
};

/* Address -> location + roof area and pitch. */
API_.measure = function (a) {
  var key = mapsKey_();
  if (!key) throw new Error('Add your Google Maps key under Quotes › Quote prices first, or type the roof size by hand.');
  var addr = clean_(a.address, 200);
  if (addr.length < 6) throw new Error('Type the full address (street, town).');

  var g = googleJson_('https://maps.googleapis.com/maps/api/geocode/json?address=' + encodeURIComponent(addr) + '&components=country:US&key=' + encodeURIComponent(key));
  if (g.json.status === 'ZERO_RESULTS') throw new Error('Couldn’t find that address. Check the street and town.');
  if (g.json.status !== 'OK' || !g.json.results || !g.json.results.length) {
    throw new Error('Google address lookup failed (' + (g.json.status || g.code) + '). ' + (g.json.error_message || 'Check that the Geocoding API is turned on for your key.'));
  }
  var r0 = g.json.results[0];
  var lat = Number(r0.geometry.location.lat), lng = Number(r0.geometry.location.lng);
  var out = {
    address: String(r0.formatted_address || addr).replace(/, USA$/, ''), lat: lat, lng: lng,
    roofs: [], segments: 0, source: 'none', note: '', imageryDate: '', quality: '', image: ''
  };

  var s = googleJson_('https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=' + lat.toFixed(6) +
    '&location.longitude=' + lng.toFixed(6) + '&requiredQuality=BASE&key=' + encodeURIComponent(key));
  if (s.code === 200 && s.json.solarPotential) {
    var sp = s.json.solarPotential;
    var whole = sp.wholeRoofStats || {}, bld = sp.buildingStats || {};
    var segs = sp.roofSegmentStats || [];
    var scale = 1;
    if (bld.groundAreaMeters2 && whole.groundAreaMeters2 && bld.groundAreaMeters2 > whole.groundAreaMeters2) {
      scale = Math.min(1.5, bld.groundAreaMeters2 / whole.groundAreaMeters2);
    }
    var areaM2 = Number(whole.areaMeters2) || segs.reduce(function (n, x) { return n + (Number(x.stats && x.stats.areaMeters2) || 0); }, 0);
    var wsum = 0, psum = 0, flat = 0;
    segs.forEach(function (x) {
      var ar = Number(x.stats && x.stats.areaMeters2) || 0;
      var pd = Number(x.pitchDegrees) || 0;
      wsum += ar; psum += ar * pd;
      if (pd < 9.5) flat += ar;
    });
    var sqft = Math.round(areaM2 * 10.7639 * scale);
    var pitch = TAKEOFF.pitchFromDegrees(wsum ? psum / wsum : 22.6);
    if (sqft > 0) {
      out.roofs = [{ n: 'Main Roof', s: sqft, p: pitch, f: segs.length }];
      out.segments = segs.length;
      out.source = 'solar';
      out.quality = String(s.json.imageryQuality || '');
      var d = s.json.imageryDate;
      if (d && d.year) out.imageryDate = d.year + '-' + ('0' + (d.month || 1)).slice(-2);
      var notes = [];
      if (wsum && flat / wsum > 0.15) notes.push('About ' + Math.round(flat * 10.7639 * scale / 10) * 10 + ' sq ft is low-slope or flat. Check if it needs a different roof system.');
      if (s.json.center) {
        var dist = metersBetween_(lat, lng, s.json.center.latitude, s.json.center.longitude);
        if (dist > 30) notes.push('The closest building Google found is about ' + Math.round(dist) + ' m from the address pin. Check the photo.');
        out.lat = Number(s.json.center.latitude) || lat;
        out.lng = Number(s.json.center.longitude) || lng;
      }
      out.note = notes.join(' ');
    }
  } else if (s.code === 404) {
    out.note = 'Google has no roof data for this address. Type the roof size below.';
  } else if (s.code === 403) {
    out.note = 'The Solar API isn’t turned on for your Google key. Type the roof size below, or turn it on in Google Cloud.';
  } else {
    out.note = 'Couldn’t measure the roof right now (' + s.code + '). Type the roof size below.';
  }

  try {
    var img = UrlFetchApp.fetch('https://maps.googleapis.com/maps/api/staticmap?center=' + out.lat + ',' + out.lng +
      '&zoom=20&size=600x360&scale=2&maptype=satellite&markers=color:red%7C' + out.lat + ',' + out.lng + '&key=' + encodeURIComponent(key), { muteHttpExceptions: true });
    var ct = String((img.getHeaders() || {})['Content-Type'] || (img.getHeaders() || {})['content-type'] || '');
    if (img.getResponseCode() === 200 && /^image\//.test(ct)) out.image = 'data:' + ct.split(';')[0] + ';base64,' + Utilities.base64Encode(img.getContent());
  } catch (e) { /* the photo is optional */ }
  return out;
};

/* Save an estimate as a quote. Customer details are optional. */
API_.createQuote = function (a) {
  var pr = pricing_();
  var roofs = (a.roofs || []).slice(0, 10).map(function (r) {
    return { n: clean_(r.n, 40) || 'Roof', s: Math.max(0, Math.min(200000, Math.round(Number(r.s) || 0))), p: clean_(r.p, 10) || '6/12', o: '', f: Math.max(0, Math.min(200, Math.round(Number(r.f) || 0))) };
  }).filter(function (r) { return r.s > 0; });
  if (!roofs.length) throw new Error('Enter the roof size first.');
  var address = clean_(a.address, 160);
  if (!address) throw new Error('Enter the address.');
  var layers = Math.max(1, Math.min(3, Math.round(Number(a.layers) || 1)));
  var pick = [0, 1, 2].indexOf(Number(a.pick)) >= 0 ? Number(a.pick) : -1;
  var qs = readQuotes_();
  var id;
  do { id = quoteId_(); } while (findById_(qs, id));
  var d = {
    v: 1, id: id, t: Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd'), n: clean_(a.name, 60), a: address,
    c: (Number(a.lat) && Number(a.lng)) ? [Number(Number(a.lat).toFixed(6)), Number(Number(a.lng).toFixed(6))] : null,
    r: roofs.map(function (r) { return { n: r.n, s: r.s, p: r.p, o: '' }; }), p: TAKEOFF.priceRanges(pr, roofs, layers), k: pick, h: clean_(a.color, 40)
  };
  var link = QUOTE_PAGE + '#q=' + Utilities.base64EncodeWebSafe(JSON.stringify(d), Utilities.Charset.UTF_8).replace(/=+$/, '');
  intakeQuote_(d, link, 'estimate in app');
  qs = readQuotes_();
  var q = findById_(qs, id);
  q.phone = clean_(a.phone, 30);
  q.email = clean_(a.email, 120);
  q.source = 'app';
  q.layers = layers;
  if (a.notes) q.notes = clean_(a.notes, 1000);
  writeQuotes_(qs);
  return q;
};

/* Email the branded quote link to the customer. */
API_.emailQuote = function (a) {
  var qs = readQuotes_();
  var q = findById_(qs, a.id);
  if (!q) throw new Error('Quote not found.');
  var to = clean_(a.email || q.email, 120);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) throw new Error('Add the customer’s email first.');
  var s = settings_();
  var owner = ownerEmail_();
  var pk = TAKEOFF.PACKAGES;
  var rows = (q.ranges || []).map(function (r, i) {
    if (!pk[i] || !r[1]) return '';
    return '<tr><td style="padding:8px 12px;border-bottom:1px solid #DDE2E8">Owens Corning ' + escHtml_(pk[i].label) + (i === q.pick ? ' <b style="color:#E23E2B">(recommended)</b>' : '') +
      '</td><td style="padding:8px 12px;border-bottom:1px solid #DDE2E8;text-align:right"><b>$' + r[0].toLocaleString('en-US') + ' – $' + r[1].toLocaleString('en-US') + '</b></td></tr>';
  }).join('');
  var html = '<div style="font-family:Arial,sans-serif;font-size:15px;color:#1C2430;max-width:560px">' +
    '<p>Hi' + (q.name ? ' ' + escHtml_(q.name) : '') + ',</p>' +
    '<p>Thanks for having Team Forte look at your roof at <b>' + escHtml_(q.address) + '</b>. Here is your estimate:</p>' +
    '<table style="border-collapse:collapse;width:100%;margin:12px 0">' + rows + '</table>' +
    '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0"><tr><td style="background:#FF5440;border-radius:8px">' +
    '<a href="' + escHtml_(q.link) + '" style="display:inline-block;padding:14px 22px;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none">View my quote and download the PDF</a></td></tr></table>' +
    '<p>Final pricing is confirmed after a free inspection. Questions? Just reply to this email' + (s.contactPhone ? ' or call ' + escHtml_(s.contactPhone) : '') + '.</p>' +
    '<p>Team Forte</p></div>';
  var msg = { to: to, subject: 'Your roof estimate from Team Forte', htmlBody: html, name: 'Team Forte' };
  if (owner) msg.replyTo = owner;
  MailApp.sendEmail(msg);
  q.email = to;
  q.events = (q.events || []).concat([{ e: 'emailed to customer', t: new Date().toISOString() }]).slice(-20);
  q.updated = new Date().toISOString();
  writeQuotes_(qs);
  return q;
};

function googleJson_(url) {
  var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  return { code: res.getResponseCode(), json: parseJson_(res.getContentText(), {}) || {} };
}

function quoteId_() {
  var c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = '';
  for (var i = 0; i < 5; i++) s += c.charAt(Math.floor(Math.random() * c.length));
  return 'TF-' + s;
}

function metersBetween_(a1, o1, a2, o2) {
  var R = 6371000, toR = Math.PI / 180;
  var dLat = (a2 - a1) * toR, dLng = (o2 - o1) * toR;
  var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a1 * toR) * Math.cos(a2 * toR) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/* ================================================================== */
/* EXTRAS: logins, repairs, job costs, crew, reviews, GoHighLevel,     */
/* e-signature proposals, inspection reports                           */
/* ================================================================== */

var GHL_BASE = 'https://services.leadconnectorhq.com';
var GHL_DEFAULTS = {
  enabled: true,
  locationId: 'ySsyazNWRWtwaoThE5Ij',                       // Team Forte sub-account
  pipelineId: 'ZiUxRAFfAmfjM7xan8cJ',                       // Sales Pipeline
  stageQuote: 'c8319348-a5cc-4256-935a-d6af5bab0b8e',       // Quote Sent
  stageWon: '3676fde2-decd-4fd6-8192-35a2ce6e5318'          // Won - Signed & Scheduled
};
var INSPECTION_TAGS = ['Missing or damaged shingles', 'Lifted or creased shingles', 'Granule loss / worn shingles', 'Pipe boot',
  'Flashing', 'Chimney', 'Soft or rotted decking', 'Valley', 'Ventilation', 'Gutters / drip edge', 'Leak / water stain', 'Hail or wind damage', 'Other'];
var INSP_COLS = ['id', 'quoteId', 'tag', 'note', 'order', 'created', 'by'];

var REPAIR_DEFAULTS = {
  min: 350,
  items: [
    { key: 'r_leak', name: 'Leak investigation & repair', unit: 'each', price: 450 },
    { key: 'r_boot', name: 'Pipe boot replacement', unit: 'each', price: 195 },
    { key: 'r_shingle', name: 'Shingle repair (up to 1 square)', unit: 'each', price: 450 },
    { key: 'r_shingle_sq', name: 'Additional shingle repair', unit: 'square', price: 325 },
    { key: 'r_flash', name: 'Step / wall flashing repair', unit: 'LF', price: 18 },
    { key: 'r_chimney', name: 'Chimney reflash', unit: 'each', price: 850 },
    { key: 'r_ridge', name: 'Ridge cap repair', unit: 'LF', price: 22 },
    { key: 'r_valley', name: 'Valley repair', unit: 'LF', price: 35 },
    { key: 'r_skylight', name: 'Skylight reflash', unit: 'each', price: 650 },
    { key: 'r_drip', name: 'Drip edge replacement', unit: 'LF', price: 9 },
    { key: 'r_deck', name: 'Decking replacement', unit: 'sheet', price: 110 },
    { key: 'r_vent', name: 'Roof vent replacement', unit: 'each', price: 225 },
    { key: 'r_gutter', name: 'Gutter cleanout', unit: 'each', price: 175 },
    { key: 'r_labor', name: 'Extra labor', unit: 'hour', price: 95 }
  ]
};

/* ---------------- settings defaults ---------------- */

function settingsExtra_(s) {
  s.company = s.company || {};
  var c = s.company;
  c.name = c.name || 'Team Forte';
  c.legal = c.legal || 'GR Brothers LLC d/b/a Team Forte';
  c.address = c.address || '161 Main St, East Berlin, CT 06023';
  c.phone = c.phone || '(860) 854-9335';
  c.email = c.email || 'info@team-forte.com';
  c.hic = c.hic || '';
  s.depositPct = s.depositPct === undefined ? 30 : Math.max(0, Number(s.depositPct) || 0);
  s.depositLink = s.depositLink || '';
  s.terms = s.terms || 'Price is good for 30 days. Rotted roof decking found after tear-off is replaced at the price per sheet in your proposal, only with your OK. The deposit holds your spot on the schedule; the balance is due when the job is done. Team Forte is licensed and insured in Connecticut.';
  s.crewDayRate = s.crewDayRate === undefined ? 1800 : Number(s.crewDayRate) || 0;
  s.dumpster = s.dumpster === undefined ? 450 : Number(s.dumpster) || 0;
  s.permit = s.permit === undefined ? 150 : Number(s.permit) || 0;
  s.reviewLink = s.reviewLink || '';
  s.autoReview = s.autoReview !== false;
  s.warrantyLink = s.warrantyLink || '';
  s.ghl = s.ghl || {};
  Object.keys(GHL_DEFAULTS).forEach(function (k) { if (s.ghl[k] === undefined || s.ghl[k] === '') s.ghl[k] = GHL_DEFAULTS[k]; });
  return s;
}

/* Extra settings fields (wraps the materials saveSettings). */
var saveSettingsBase_ = API_.saveSettings;
API_.saveSettings = function (a) {
  a = a || {};
  var owner = CURRENT_USER_.role === 'owner';
  if (!owner) { delete a.abc; delete a.mapsKey; delete a.ghlToken; delete a.ghl; }
  var s = settings_();
  if (a.company) ['name', 'legal', 'address', 'phone', 'email', 'hic'].forEach(function (k) { if (a.company[k] !== undefined) s.company[k] = clean_(a.company[k], 120); });
  ['depositPct', 'crewDayRate', 'dumpster', 'permit'].forEach(function (k) { if (a[k] !== undefined) s[k] = Math.max(0, Number(a[k]) || 0); });
  if (a.depositLink !== undefined) s.depositLink = /^https:\/\//.test(String(a.depositLink).trim()) ? clean_(a.depositLink, 500) : '';
  if (a.terms !== undefined) s.terms = clean_(a.terms, 2000);
  if (a.reviewLink !== undefined) s.reviewLink = /^https:\/\//.test(String(a.reviewLink).trim()) ? clean_(a.reviewLink, 500) : '';
  if (a.warrantyLink !== undefined) s.warrantyLink = /^https:\/\//.test(String(a.warrantyLink).trim()) ? clean_(a.warrantyLink, 500) : '';
  if (a.autoReview !== undefined) s.autoReview = !!a.autoReview;
  if (a.ghl) ['locationId', 'pipelineId', 'stageQuote', 'stageWon'].forEach(function (k) { if (a.ghl[k] !== undefined) s.ghl[k] = clean_(a.ghl[k], 80); });
  if (a.ghl && a.ghl.enabled !== undefined) s.ghl.enabled = !!a.ghl.enabled;
  if (a.ghlToken) PropertiesService.getScriptProperties().setProperty('GHL_TOKEN', String(a.ghlToken).trim());
  if (a.ghlTokenClear) PropertiesService.getScriptProperties().setProperty('GHL_TOKEN', '');
  saveSettings_(s);
  return saveSettingsBase_(a);
};

/* ---------------- people & logins ---------------- */

function users_() {
  var u = parseJson_(PropertiesService.getScriptProperties().getProperty('USERS'), []);
  return Array.isArray(u) ? u : [];
}

API_.users = function () { return users_(); };

API_.saveUsers = function (a) {
  var master = String(PropertiesService.getScriptProperties().getProperty('PASSCODE') || '').trim();
  var seen = {};
  var list = (a.users || []).slice(0, 25).map(function (u) {
    var pin = String(u.pin || '').trim();
    var name = clean_(u.name, 40);
    if (!name) throw new Error('Each person needs a name.');
    if (!/^[A-Za-z0-9]{4,12}$/.test(pin)) throw new Error(name + ': the PIN must be 4 to 12 letters or numbers.');
    if (pin === master) throw new Error(name + ': pick a PIN that isn’t the owner passcode.');
    if (seen[pin]) throw new Error('Two people have the same PIN (' + name + ').');
    seen[pin] = 1;
    return { id: u.id || newId_('u'), name: name, role: u.role === 'office' ? 'office' : 'crew', pin: pin };
  });
  PropertiesService.getScriptProperties().setProperty('USERS', JSON.stringify(list));
  return list;
};

/* ---------------- repairs ---------------- */

function repairs_() {
  var r = parseJson_(PropertiesService.getScriptProperties().getProperty('REPAIRS'), null);
  return cleanRepairs_(r || REPAIR_DEFAULTS);
}

function cleanRepairs_(r) {
  r = r || {};
  return {
    min: Math.max(0, Number(r.min === undefined ? REPAIR_DEFAULTS.min : r.min) || 0),
    items: (Array.isArray(r.items) ? r.items : REPAIR_DEFAULTS.items).slice(0, 60).map(function (it) {
      return { key: clean_(it.key, 40) || newId_('r'), name: clean_(it.name, 80) || 'Repair', unit: clean_(it.unit, 12) || 'each', price: Math.max(0, Math.round(Number(it.price) * 100) / 100 || 0) };
    }),
    updated: r.updated || ''
  };
}

API_.saveRepairs = function (a) {
  var r = cleanRepairs_(a);
  r.updated = new Date().toISOString();
  PropertiesService.getScriptProperties().setProperty('REPAIRS', JSON.stringify(r));
  return r;
};

function cleanItems_(items) {
  return (items || []).slice(0, 40).map(function (it) {
    return {
      key: clean_(it.key, 40), name: clean_(it.name, 80) || 'Repair', unit: clean_(it.unit, 12) || 'each',
      qty: Math.max(0, Math.min(10000, Math.round((Number(it.qty) || 0) * 100) / 100)),
      price: Math.max(0, Math.round(Number(it.price) * 100) / 100 || 0)
    };
  }).filter(function (it) { return it.qty > 0; });
}

function repairTotal_(items, min) {
  var t = (items || []).reduce(function (n, it) { return n + it.qty * it.price; }, 0);
  return Math.round(Math.max(Number(min) || 0, t) * 100) / 100;
}

function createRepair_(a) {
  var items = cleanItems_(a.items);
  if (!items.length) throw new Error('Add at least one repair item.');
  var address = clean_(a.address, 160);
  if (!address) throw new Error('Enter the address.');
  var qs = readQuotes_();
  var id;
  do { id = quoteId_(); } while (findById_(qs, id));
  var now = new Date().toISOString();
  var q = {
    id: id, created: now, updated: now, status: 'new', name: clean_(a.name, 60), address: address,
    lat: Number(a.lat) || 0, lng: Number(a.lng) || 0, roofs: [], ranges: [], pick: -1, color: '',
    link: proposalUrl_(id), events: [{ e: 'repair estimate in app', t: now }], contractPrice: repairTotal_(items, repairs_().min),
    meas: null, lines: [], photoJobId: '', notes: clean_(a.notes, 1000), approvedAt: '', phone: clean_(a.phone, 30), email: clean_(a.email, 120),
    source: 'app', layers: 1, type: 'repair', items: items, costs: null
  };
  qs.push(q);
  writeQuotes_(qs);
  return q;
}

/* App estimate: replacement (estimate-server) or repair; then sync to GoHighLevel. */
var createQuoteBase_ = API_.createQuote;
API_.createQuote = function (a) {
  var q = a.type === 'repair' ? createRepair_(a) : createQuoteBase_(a);
  return syncAndSave_(q.id, 'quote');
};

var emailQuoteBase_ = API_.emailQuote;
API_.emailQuote = function (a) {
  var qs = readQuotes_();
  var q = findById_(qs, a.id);
  if (q && q.type === 'repair') return API_.sendProposal({ id: a.id, email: a.email || q.email, send: 'email' });
  var r = emailQuoteBase_(a);
  return syncAndSave_(r.id, 'quote');
};

function syncAndSave_(id, stage) {
  var qs = readQuotes_();
  var q = findById_(qs, id);
  if (!q) return null;
  if (ghlReady_(settings_())) { ghlSync_(q, stage); writeQuotes_(qs); }
  return q;
}

/* ---------------- job costs ---------------- */

function cleanCosts_(c) {
  c = c || {};
  var n = function (v) { return Math.max(0, Math.round((Number(v) || 0) * 100) / 100); };
  return { crewDays: n(c.crewDays), crewRate: n(c.crewRate), dumpster: n(c.dumpster), permit: n(c.permit), other: n(c.other), otherNote: clean_(c.otherNote, 120) };
}

function defaultCosts_(q) {
  var s = settings_();
  var squares = (q.roofs || []).reduce(function (n, r) { return n + (Number(r.s) || 0); }, 0) / 100;
  var repl = q.type !== 'repair';
  return cleanCosts_({
    crewDays: repl ? Math.max(1, Math.round(squares / 15 * 2) / 2) : 0.5,
    crewRate: s.crewDayRate, dumpster: repl ? s.dumpster : 0, permit: repl ? s.permit : 0, other: 0
  });
}

/* ---------------- done: reviews + warranty ---------------- */

function onDone_(q) {
  q.doneAt = new Date().toISOString();
  var s = settings_();
  if (s.autoReview && s.reviewLink && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(q.email || '') && !q.reviewAt) {
    try { sendReviewEmail_(q, s); } catch (e) { Logger.log('review email: ' + e.message); }
  }
  ghlTag_(q, ['job-complete']);
}

function sendReviewEmail_(q, s) {
  var first = String(q.name || '').split(' ')[0];
  var html = '<div style="font-family:Arial,sans-serif;font-size:15px;color:#1C2430;max-width:520px">' +
    '<p>Hi' + (first ? ' ' + escHtml_(first) : '') + ',</p><p>Thank you for choosing Team Forte for your roof at ' + escHtml_(q.address) + '. ' +
    'If you’re happy with the work, a quick Google review would mean a lot to our small team.</p>' +
    '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0"><tr><td style="background:#FF5440;border-radius:8px">' +
    '<a href="' + escHtml_(s.reviewLink) + '" style="display:inline-block;padding:14px 22px;font-size:16px;font-weight:bold;color:#fff;text-decoration:none">Leave a review</a></td></tr></table>' +
    '<p>If anything isn’t right, just reply to this email and we’ll make it right.</p><p>Team Forte' + (s.company.phone ? '<br>' + escHtml_(s.company.phone) : '') + '</p></div>';
  var msg = { to: q.email, subject: 'How did we do? Team Forte', htmlBody: html, name: 'Team Forte' };
  var owner = ownerEmail_();
  if (owner) msg.replyTo = owner;
  MailApp.sendEmail(msg);
  q.reviewAt = new Date().toISOString();
  logEvent_(q, 'review request emailed');
}

API_.reviewEmail = function (a) {
  var qs = readQuotes_();
  var q = findById_(qs, a.id);
  if (!q) throw new Error('Quote not found.');
  var s = settings_();
  if (!s.reviewLink) throw new Error('Add your Google review link in Settings first.');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(q.email || '')) throw new Error('Add the customer’s email first.');
  sendReviewEmail_(q, s);
  writeQuotes_(qs);
  return q;
};

/* ---------------- crew ---------------- */

API_.crewJobs = function () {
  var pk = TAKEOFF.PACKAGES;
  var insp = readInspections_();
  return readQuotes_().filter(function (q) {
    return q.status === 'approved' || q.status === 'ordered' || (q.status === 'done' && q.doneAt && (Date.now() - new Date(q.doneAt).getTime()) < 14 * 864e5);
  }).map(function (q) {
    return {
      id: q.id, status: q.status, name: q.name, address: q.address, lat: q.lat, lng: q.lng, phone: q.phone,
      installDate: q.installDate, crew: q.crew, type: q.type, layers: q.layers,
      scope: q.type === 'repair' ? (q.items || []).map(function (it) { return it.qty + ' ' + it.unit + ' · ' + it.name; }) : ['Roof replacement' + (pk[q.pick] ? ' · OC ' + pk[q.pick].label : '') + (q.color ? ' · ' + q.color : '')],
      roofs: (q.roofs || []).map(function (r) { return { n: r.n, s: r.s, p: r.p }; }),
      materials: (q.lines || []).filter(function (l) { return l.qty > 0; }).map(function (l) { return { name: l.name, qty: l.qty, unit: l.unit }; }),
      notes: q.notes, photoJobId: q.photoJobId,
      inspections: insp.filter(function (i) { return i.quoteId === q.id; }).length,
      events: (q.events || []).filter(function (e) { return /^crew/.test(e.e); }).slice(-10)
    };
  }).sort(function (a, b) { return String(a.installDate || '9999').localeCompare(String(b.installDate || '9999')); });
};

API_.crewNote = function (a) {
  var qs = readQuotes_();
  var q = findById_(qs, a.id);
  if (!q) throw new Error('Job not found.');
  var note = clean_(a.note, 300);
  if (!note) throw new Error('Type a note.');
  logEvent_(q, 'crew: ' + note);
  writeQuotes_(qs);
  return { ok: true };
};

function logEvent_(q, text) {
  var by = CURRENT_USER_ && CURRENT_USER_.role !== 'owner' ? ' (' + CURRENT_USER_.name + ')' : '';
  q.events = (q.events || []).concat([{ e: String(text).slice(0, 200) + by, t: new Date().toISOString() }]).slice(-40);
}

/* ---------------- GoHighLevel ---------------- */

function ghlToken_() { return PropertiesService.getScriptProperties().getProperty('GHL_TOKEN') || ''; }
function ghlReady_(s) { s = s || settings_(); return !!(ghlToken_() && s.ghl && s.ghl.enabled && s.ghl.locationId && s.ghl.pipelineId); }

function ghlFetch_(method, path, body) {
  var opts = {
    method: method, muteHttpExceptions: true,
    headers: { Authorization: 'Bearer ' + ghlToken_(), Version: '2021-07-28', Accept: 'application/json' }
  };
  if (body !== undefined) { opts.contentType = 'application/json'; opts.payload = JSON.stringify(body); }
  var res = UrlFetchApp.fetch(GHL_BASE + path, opts);
  var code = res.getResponseCode();
  var j = parseJson_(res.getContentText(), {}) || {};
  if (code >= 300) {
    var m = j.message;
    if (Array.isArray(m)) m = m.join(', ');
    throw new Error('GoHighLevel ' + code + ': ' + String(m || j.error || 'request failed').slice(0, 160));
  }
  return j;
}

API_.ghlPipelines = function () {
  var s = settings_();
  if (!ghlToken_()) throw new Error('Paste your GoHighLevel private integration token first.');
  var j = ghlFetch_('get', '/opportunities/pipelines?locationId=' + encodeURIComponent(s.ghl.locationId));
  return (j.pipelines || []).map(function (p) {
    return { id: p.id, name: p.name, stages: (p.stages || []).map(function (st) { return { id: st.id, name: st.name }; }) };
  });
};

function splitName_(n) {
  var parts = String(n || '').trim().split(/\s+/);
  return { first: parts.shift() || '', last: parts.join(' ') };
}

function parseAddr_(a) {
  var p = String(a || '').split(',').map(function (x) { return x.trim(); });
  var o = { line1: p[0] || '', city: '', state: '', postal: '' };
  if (p.length >= 3) {
    o.city = p[p.length - 2];
    var m = p[p.length - 1].match(/([A-Za-z]{2})\s*(\d{5})?/);
    if (m) { o.state = m[1].toUpperCase(); o.postal = m[2] || ''; }
  }
  return o;
}

/* Upsert the GHL contact + opportunity for a quote. stage: 'quote' or 'won'. Never throws. */
function ghlSync_(q, stage) {
  var s = settings_();
  if (!ghlReady_(s)) return;
  if (!q.phone && !q.email) { q.ghlError = 'Add the customer’s phone or email to sync with GoHighLevel.'; return; }
  try {
    var nm = splitName_(q.name);
    var ad = parseAddr_(q.address);
    var contact = { locationId: s.ghl.locationId, source: 'Team Forte app', address1: ad.line1, city: ad.city, state: ad.state, postalCode: ad.postal, country: 'US' };
    if (nm.first) contact.firstName = nm.first;
    if (nm.last) contact.lastName = nm.last;
    if (q.email) contact.email = q.email;
    if (q.phone) contact.phone = q.phone;
    var c = ghlFetch_('post', '/contacts/upsert', contact);
    var cid = (c.contact && c.contact.id) || q.ghlContactId;
    if (!cid) throw new Error('GoHighLevel didn’t return a contact.');
    q.ghlContactId = cid;
    var pk = TAKEOFF.PACKAGES[q.pick];
    var value = q.contractPrice || ((q.ranges || [])[q.pick >= 0 ? q.pick : 1] ? Math.round(((q.ranges[q.pick >= 0 ? q.pick : 1][0]) + (q.ranges[q.pick >= 0 ? q.pick : 1][1])) / 2) : 0);
    var opp = {
      locationId: s.ghl.locationId, pipelineId: s.ghl.pipelineId, contactId: cid,
      name: (q.type === 'repair' ? 'Roof repair' : 'Roof replacement' + (pk ? ' (OC ' + pk.label + ')' : '')) + ' - ' + (ad.line1 || q.id),
      pipelineStageId: stage === 'won' ? s.ghl.stageWon : s.ghl.stageQuote,
      status: stage === 'won' ? 'won' : 'open'
    };
    if (value) opp.monetaryValue = value;
    if (q.ghlOppId) opp.id = q.ghlOppId;
    var o = ghlFetch_('post', '/opportunities/upsert', opp);
    if (o.opportunity && o.opportunity.id) q.ghlOppId = o.opportunity.id;
    q.ghlError = '';
    logEvent_(q, 'GoHighLevel: ' + (stage === 'won' ? 'moved to Won' : 'quote sent'));
  } catch (e) {
    q.ghlError = String(e.message || e).slice(0, 200);
  }
}

function ghlTag_(q, tags) {
  if (!ghlReady_() || !q.ghlContactId) return;
  try { ghlFetch_('post', '/contacts/' + encodeURIComponent(q.ghlContactId) + '/tags', { tags: tags }); logEvent_(q, 'GoHighLevel tag: ' + tags.join(', ')); }
  catch (e) { q.ghlError = String(e.message || e).slice(0, 200); }
}

API_.ghlSyncNow = function (a) {
  var qs = readQuotes_();
  var q = findById_(qs, a.id);
  if (!q) throw new Error('Quote not found.');
  if (!ghlReady_()) throw new Error('Connect GoHighLevel in Spending › Settings first.');
  ghlSync_(q, q.status === 'new' ? 'quote' : 'won');
  writeQuotes_(qs);
  if (q.ghlError) throw new Error(q.ghlError);
  return q;
};

/* ---------------- proposals: e-signature + deposit ---------------- */

function proposalUrl_(id) { return execUrl_() + '?r=proposal&id=' + encodeURIComponent(id); }

function proposalReady_(q) {
  if (!q || !(q.contractPrice > 0)) return false;
  return q.type === 'repair' ? (q.items || []).length > 0 : q.pick >= 0;
}

API_.sendProposal = function (a) {
  var qs = readQuotes_();
  var q = findById_(qs, a.id);
  if (!q) throw new Error('Quote not found.');
  if (a.contractPrice !== undefined) q.contractPrice = Math.max(0, Math.round(Number(a.contractPrice) * 100) / 100 || 0);
  if (a.pick !== undefined) q.pick = [0, 1, 2].indexOf(Number(a.pick)) >= 0 ? Number(a.pick) : q.pick;
  if (a.color !== undefined) q.color = clean_(a.color, 40);
  if (a.email) q.email = clean_(a.email, 120);
  if (!proposalReady_(q)) throw new Error(q.type === 'repair' ? 'Add the repair items first.' : 'Pick the package and enter the job price first.');
  if (q.signedAt) throw new Error('This proposal is already signed.');
  var s = settings_();
  var url = proposalUrl_(q.id);
  if (a.send === 'email') {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(q.email || '')) throw new Error('Add the customer’s email first.');
    var first = String(q.name || '').split(' ')[0];
    var html = '<div style="font-family:Arial,sans-serif;font-size:15px;color:#1C2430;max-width:540px">' +
      '<p>Hi' + (first ? ' ' + escHtml_(first) : '') + ',</p><p>Your Team Forte proposal for <b>' + escHtml_(q.address) + '</b> is ready: ' +
      '<b>$' + Number(q.contractPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</b>.</p>' +
      '<p>You can review it and sign online in about a minute.</p>' +
      '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0"><tr><td style="background:#FF5440;border-radius:8px">' +
      '<a href="' + escHtml_(url) + '" style="display:inline-block;padding:14px 22px;font-size:16px;font-weight:bold;color:#fff;text-decoration:none">Review &amp; sign</a></td></tr></table>' +
      '<p>Questions? Reply to this email or call ' + escHtml_(s.company.phone) + '.</p><p>Team Forte</p></div>';
    var msg = { to: q.email, subject: 'Your Team Forte proposal', htmlBody: html, name: 'Team Forte' };
    var owner = ownerEmail_();
    if (owner) msg.replyTo = owner;
    MailApp.sendEmail(msg);
    logEvent_(q, 'proposal emailed');
  } else {
    logEvent_(q, 'proposal link shared');
  }
  q.proposalSentAt = new Date().toISOString();
  ghlSync_(q, 'quote');
  q.updated = q.proposalSentAt;
  writeQuotes_(qs);
  q.proposalUrl = url;
  return q;
};

function proposalHtml_(q, s, signed) {
  var pk = TAKEOFF.PACKAGES[q.pick];
  var money = function (n) { return '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var deposit = Math.round(q.contractPrice * s.depositPct) / 100;
  var scope;
  if (q.type === 'repair') {
    scope = '<table class="t"><tr><th>Repair</th><th class="r">Qty</th><th class="r">Amount</th></tr>' + (q.items || []).map(function (it) {
      return '<tr><td>' + escHtml_(it.name) + '</td><td class="r">' + it.qty + ' ' + escHtml_(it.unit) + '</td><td class="r">' + money(it.qty * it.price) + '</td></tr>';
    }).join('') + (repairTotal_(q.items, 0) < q.contractPrice ? '<tr><td colspan="2">Minimum service charge applies</td><td class="r"></td></tr>' : '') + '</table>';
  } else {
    var roofs = (q.roofs || []).map(function (r) { return escHtml_(r.n || 'Roof') + ': ' + Number(r.s || 0).toLocaleString('en-US') + ' sq ft' + (r.p ? ', ' + escHtml_(r.p) + ' pitch' : ''); }).join('<br>');
    scope = '<p><b>Full roof replacement: Owens Corning ' + escHtml_(pk ? pk.label : '') + '</b>' + (q.color ? ' in <b>' + escHtml_(q.color) + '</b>' : '') + '</p>' +
      '<p class="m">' + roofs + (q.layers > 1 ? '<br>Tear-off: ' + q.layers + ' layers' : '') + '</p>' +
      '<ul>' + ['Tear-off and disposal of the old roofing', 'Owens Corning ice & water barrier at eaves, valleys and penetrations', 'Owens Corning synthetic underlayment',
        'Owens Corning starter strip and matching hip & ridge caps', 'Ridge vent for attic ventilation', 'New drip edge, pipe boots and flashing',
        'Magnetic nail sweep and full cleanup', 'Manufacturer warranty registration'].map(function (x) { return '<li>' + escHtml_(x) + '</li>'; }).join('') + '</ul>';
  }
  var c = s.company;
  var css = 'body{margin:0;background:#F2F4F7;font-family:Montserrat,Arial,sans-serif;color:#1C2430;line-height:1.5}' +
    '.top{background:#13202F;color:#fff;padding:18px 20px}.top b{font-size:20px;letter-spacing:.06em}.top b i{font-style:normal;color:#FF5440}.top span{float:right;font-size:12px;color:#C4CCD6;text-align:right}' +
    '.w{max-width:720px;margin:0 auto;padding:0 16px 40px}.card{background:#fff;border:1px solid #DDE2E8;border-radius:12px;padding:18px;margin-top:16px}' +
    'h1{font-size:24px;margin:20px 0 2px}h2{font-size:16px;margin:0 0 10px}.m{color:#5B6675;font-size:14px}ul{padding-left:20px;margin:8px 0}li{margin:3px 0;font-size:14px}' +
    '.t{width:100%;border-collapse:collapse;font-size:14px}.t th{text-align:left;border-bottom:2px solid #1C2430;padding:6px 4px}.t td{border-bottom:1px solid #DDE2E8;padding:7px 4px}.r{text-align:right}' +
    '.price{display:flex;justify-content:space-between;font-size:20px;font-weight:800;border-top:2px solid #1C2430;padding-top:10px;margin-top:10px}' +
    '.dep{display:flex;justify-content:space-between;font-size:14px;color:#5B6675;margin-top:4px}.terms{font-size:13px;color:#5B6675}' +
    '.btn{display:block;box-sizing:border-box;width:100%;border:0;border-radius:10px;background:#FF5440;color:#fff;font:inherit;font-weight:800;font-size:16px;padding:15px;margin-top:14px;text-align:center;text-decoration:none;cursor:pointer}' +
    '.btn[disabled]{opacity:.6}.in{width:100%;box-sizing:border-box;border:1px solid #DDE2E8;border-radius:10px;padding:12px;font:inherit;font-size:16px}' +
    'canvas{width:100%;height:160px;border:2px dashed #B9C3CE;border-radius:10px;background:#fff;touch-action:none;display:block}' +
    '.row{display:flex;justify-content:space-between;align-items:center;margin:12px 0 6px;font-size:13px;font-weight:700}.lnk{color:#5B6675;font-weight:600;background:none;border:0;font:inherit;text-decoration:underline;cursor:pointer}' +
    '.ok{background:#E5F6EC;border:1px solid #BFE6CF;color:#145C34;border-radius:12px;padding:16px;margin-top:16px}.err{color:#B3261E;font-size:14px;min-height:20px;margin-top:8px}' +
    '.sig{max-width:280px;border-bottom:1px solid #1C2430}.foot{font-size:12px;color:#5B6675;margin-top:22px}label.ck{display:flex;gap:10px;align-items:flex-start;font-size:14px;margin-top:12px}label.ck input{width:20px;height:20px;margin-top:2px;accent-color:#FF5440}';
  var head = '<div class="top"><b>TEAM <i>FORTE</i></b><span>Proposal ' + escHtml_(q.id) + '<br>' + escHtml_(Utilities.formatDate(new Date(q.created || Date.now()), tz_(), 'MMMM d, yyyy')) + '</span></div>';
  var body = '<div class="w"><h1>Proposal for ' + escHtml_(q.name || 'you') + '</h1><div class="m">' + escHtml_(q.address) + '</div>' +
    '<div class="card"><h2>Scope of work</h2>' + scope +
    '<div class="price"><span>Total</span><span>' + money(q.contractPrice) + '</span></div>' +
    (deposit > 0 ? '<div class="dep"><span>Deposit to schedule (' + s.depositPct + '%)</span><span>' + money(deposit) + '</span></div><div class="dep"><span>Balance when the job is done</span><span>' + money(q.contractPrice - deposit) + '</span></div>' : '') +
    '</div><div class="card"><h2>Terms</h2><div class="terms">' + escHtml_(s.terms) + '</div></div>';
  var foot = '<div class="foot"><b>' + escHtml_(c.legal) + '</b><br>' + escHtml_(c.address) + '<br>' + escHtml_(c.phone) + ' · ' + escHtml_(c.email) + (c.hic ? '<br>CT ' + escHtml_(c.hic) : '') + '</div></div>';
  return { css: css, head: head, body: body, foot: foot, deposit: deposit };
}

function proposalPage_(id) {
  var q = findById_(readQuotes_(), id);
  var s = settings_();
  var out;
  if (!q || q.status === 'archived' || !proposalReady_(q)) {
    out = '<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;padding:40px 20px;color:#1C2430}</style></head><body><h2>This proposal isn’t available</h2><p>Please call Team Forte at ' + escHtml_(s.company.phone) + '.</p></body></html>';
  } else {
    var p = proposalHtml_(q, s);
    var signedBlock = q.signedAt ? '<div class="ok"><b>Signed by ' + escHtml_(q.signerName) + ' on ' + escHtml_(Utilities.formatDate(new Date(q.signedAt), tz_(), 'MMMM d, yyyy')) + '.</b> Thank you! We’ll call you to schedule.' +
      (p.deposit > 0 && s.depositLink && q.depositStatus !== 'paid' ? '<a class="btn" href="' + escHtml_(s.depositLink) + '" target="_top">Pay the ' + '$' + p.deposit.toLocaleString('en-US', { minimumFractionDigits: 2 }) + ' deposit</a>' : '') + '</div>' : '';
    var form = q.signedAt ? '' :
      '<div class="card" id="signcard"><h2>Accept &amp; sign</h2><label class="row" for="nm">Your full name</label><input class="in" id="nm" autocomplete="name" value="' + escHtml_(q.name) + '">' +
      '<div class="row"><span>Sign below</span><button class="lnk" id="clr" type="button">Clear</button></div><canvas id="cv" aria-label="Signature pad"></canvas>' +
      '<label class="ck"><input type="checkbox" id="ag"> <span>I accept this proposal and the terms above, and I’m authorized to approve work at this address.</span></label>' +
      '<button class="btn" id="go" type="button">Accept &amp; sign</button><div class="err" id="er"></div></div><div id="done"></div>';
    var script = q.signedAt ? '' : '<script>(function(){var cv=document.getElementById("cv"),cx=cv.getContext("2d"),drawn=false,down=false,last=null;' +
      'function size(){var r=cv.getBoundingClientRect(),d=window.devicePixelRatio||1;cv.width=r.width*d;cv.height=r.height*d;cx.scale(d,d);cx.lineWidth=2.4;cx.lineCap="round";cx.lineJoin="round";cx.strokeStyle="#13202F";}size();' +
      'function pt(e){var r=cv.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}' +
      'cv.addEventListener("pointerdown",function(e){down=true;last=pt(e);cv.setPointerCapture(e.pointerId);e.preventDefault();});' +
      'cv.addEventListener("pointermove",function(e){if(!down)return;var p=pt(e);cx.beginPath();cx.moveTo(last.x,last.y);cx.lineTo(p.x,p.y);cx.stroke();last=p;drawn=true;e.preventDefault();});' +
      'cv.addEventListener("pointerup",function(){down=false;});' +
      'document.getElementById("clr").onclick=function(){cx.clearRect(0,0,cv.width,cv.height);drawn=false;};' +
      'document.getElementById("go").onclick=function(){var er=document.getElementById("er"),nm=document.getElementById("nm").value.trim();er.textContent="";' +
      'if(nm.length<2){er.textContent="Type your full name.";return;}if(!drawn){er.textContent="Please sign in the box.";return;}if(!document.getElementById("ag").checked){er.textContent="Check the box to accept.";return;}' +
      'var b=this;b.disabled=true;b.textContent="Saving\\u2026";' +
      'google.script.run.withSuccessHandler(function(r){r=JSON.parse(r);if(!r.ok){er.textContent=r.error;b.disabled=false;b.textContent="Accept & sign";return;}' +
      'document.getElementById("signcard").style.display="none";var h="<div class=ok><b>Thank you, "+nm.replace(/[<>&]/g,"")+"! Your proposal is signed.</b> A copy is on its way"+(r.emailed?" to your email":"")+". We\\u2019ll call you to schedule.";' +
      'if(r.depositLink)h+="<a class=btn target=_top href=\\""+r.depositLink+"\\">Pay the "+r.depositText+" deposit</a>";document.getElementById("done").innerHTML=h+"</div>";document.getElementById("done").scrollIntoView({block:"center"});})' +
      '.withFailureHandler(function(e){er.textContent="Couldn\\u2019t save. Check your connection and try again.";b.disabled=false;b.textContent="Accept & sign";})' +
      '.acceptProposal(JSON.stringify({id:' + JSON.stringify(q.id) + ',name:nm,agree:true,signature:cv.toDataURL("image/png"),ua:navigator.userAgent}));};})();</script>';
    out = '<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;800&display=swap" rel="stylesheet"><style>' + p.css + '</style></head><body>' +
      p.head + p.body.replace('<div class="w">', '<div class="w">' + signedBlock) + form + p.foot + script + '</body></html>';
  }
  return HtmlService.createHtmlOutput(out).setTitle('Team Forte proposal').addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** Called by the proposal page when the customer signs. Public on purpose (no passcode). */
function acceptProposal(json) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(25000);
    var a = typeof json === 'string' ? JSON.parse(json) : (json || {});
    CURRENT_USER_ = { id: 'customer', name: 'Customer', role: 'owner' };
    var qs = readQuotes_();
    var q = findById_(qs, String(a.id || ''));
    if (!q || q.status === 'archived' || !proposalReady_(q)) throw new Error('This proposal isn’t available. Please call us.');
    if (q.signedAt) throw new Error('This proposal is already signed. Thank you!');
    var name = clean_(a.name, 80);
    if (name.length < 2) throw new Error('Type your full name.');
    if (!a.agree) throw new Error('Check the box to accept.');
    var sig = String(a.signature || '');
    var m = sig.match(/^data:image\/png;base64,([A-Za-z0-9+\/=]+)$/);
    if (!m || m[1].length > 600000) throw new Error('Please sign again.');
    var s = settings_();
    var now = new Date();
    var folder = childFolder_(rootFolder_(), 'Signed proposals');
    var sigFile = folder.createFile(Utilities.newBlob(Utilities.base64Decode(m[1]), 'image/png', q.id + '-signature.png'));
    q.signedAt = now.toISOString();
    q.signerName = name;
    q.signatureId = sigFile.getId();
    if (s.depositPct > 0) q.depositStatus = q.depositStatus || 'requested';
    logEvent_(q, 'signed online by ' + name);
    var pdf = null;
    try {
      var p = proposalHtml_(q, s);
      var signedHtml = '<html><head><meta charset="utf-8"><style>' + p.css + ' .top span{float:none;display:block}</style></head><body>' + p.head + p.body +
        '<div class="card"><h2>Signed</h2><img class="sig" src="' + sig + '"><p><b>' + escHtml_(name) + '</b><br>' + escHtml_(Utilities.formatDate(now, tz_(), 'MMMM d, yyyy h:mm a z')) +
        '<br>Signed online at ' + escHtml_(proposalUrl_(q.id)) + '</p></div>' + p.foot + '</body></html>';
      pdf = Utilities.newBlob(signedHtml, 'text/html', q.id + '.html').getAs('application/pdf');
      pdf.setName('Team Forte proposal ' + q.id + ' (signed).pdf');
      q.signedPdfId = folder.createFile(pdf).getId();
    } catch (e) { Logger.log('signed pdf: ' + e.message); }
    // approve the job (materials list, Photos job, costs, GoHighLevel Won)
    if (q.status === 'new') {
      if (q.type !== 'repair' && !q.meas) {
        var meas = TAKEOFF.estimate(q.roofs || []);
        meas.waste = s.waste; meas.iceCourses = s.iceCourses;
        var pm = {};
        readPrices_().forEach(function (pr) { pm[pr.key] = pr; });
        q.meas = cleanMeas_(meas);
        q.lines = cleanLines_(TAKEOFF.lines(meas, q.pick, pm, []));
      }
      q.status = 'approved';
      onApproved_(q);
    }
    q.updated = now.toISOString();
    writeQuotes_(qs);
    var emailed = false;
    var owner = ownerEmail_();
    var att = pdf ? [pdf] : [];
    if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(q.email || '')) {
      try {
        MailApp.sendEmail({ to: q.email, subject: 'Your signed Team Forte proposal', name: 'Team Forte', replyTo: owner || undefined, attachments: att,
          htmlBody: '<div style="font-family:Arial,sans-serif;font-size:15px">Thank you, ' + escHtml_(name) + '! Your signed proposal for ' + escHtml_(q.address) + ' is attached. We’ll call you to schedule.' +
            (s.depositPct > 0 && s.depositLink ? '<p><a href="' + escHtml_(s.depositLink) + '">Pay your deposit here</a></p>' : '') + '<p>Team Forte<br>' + escHtml_(s.company.phone) + '</p></div>' });
        emailed = true;
      } catch (e) { Logger.log('customer copy: ' + e.message); }
    }
    if (owner) {
      try {
        MailApp.sendEmail({ to: owner, subject: 'Signed: ' + (q.name || q.id) + ' - $' + Number(q.contractPrice).toLocaleString('en-US'), name: 'Team Forte app', attachments: att,
          htmlBody: '<div style="font-family:Arial,sans-serif;font-size:15px"><b>' + escHtml_(name) + '</b> signed proposal ' + escHtml_(q.id) + ' for ' + escHtml_(q.address) + '. The job is approved and its materials list is ready in the app.</div>' });
      } catch (e) { Logger.log('owner notice: ' + e.message); }
    }
    var dep = Math.round(q.contractPrice * s.depositPct) / 100;
    return JSON.stringify({ ok: true, emailed: emailed, depositLink: dep > 0 ? s.depositLink : '', depositText: '$' + dep.toLocaleString('en-US', { minimumFractionDigits: 2 }) });
  } catch (err) {
    return JSON.stringify({ ok: false, error: err.message });
  } finally {
    try { lock.releaseLock(); } catch (e) { /* ignore */ }
  }
}

/* ---------------- inspection photos + report ---------------- */

function readInspections_() {
  tab_('Inspections', INSP_COLS);
  return readTable_('Inspections', INSP_COLS).map(function (r) {
    r.id = String(r.id); r.quoteId = String(r.quoteId); r.tag = String(r.tag || 'Other'); r.note = String(r.note || '');
    r.order = Number(r.order) || 0; r.created = r.created instanceof Date ? r.created.toISOString() : String(r.created || ''); r.by = String(r.by || '');
    return r;
  });
}
function writeInspections_(rows) { writeTable_('Inspections', INSP_COLS, rows); }

API_.addInspection = function (a) {
  var q = findById_(readQuotes_(), a.quoteId);
  if (!q) throw new Error('Quote not found.');
  if (!a.base64) throw new Error('No photo received.');
  var rows = readInspections_();
  var folder = childFolder_(childFolder_(rootFolder_(), 'Inspection photos'), q.id + (q.address ? ' - ' + String(q.address).split(',')[0] : ''));
  var order = rows.filter(function (r) { return r.quoteId === q.id; }).length + 1;
  var file = folder.createFile(Utilities.newBlob(Utilities.base64Decode(a.base64), 'image/jpeg', 'inspection-' + pad_(order) + '.jpg'));
  try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) { /* folder sharing covers it */ }
  var tag = INSPECTION_TAGS.indexOf(a.tag) >= 0 ? a.tag : 'Other';
  var row = { id: file.getId(), quoteId: q.id, tag: tag, note: clean_(a.note, 300), order: order, created: new Date().toISOString(), by: CURRENT_USER_.name };
  rows.push(row);
  writeInspections_(rows);
  return row;
};

API_.saveInspection = function (a) {
  var rows = readInspections_();
  var r = findById_(rows, a.id);
  if (!r) throw new Error('Photo not found.');
  if (a.tag !== undefined) r.tag = INSPECTION_TAGS.indexOf(a.tag) >= 0 ? a.tag : 'Other';
  if (a.note !== undefined) r.note = clean_(a.note, 300);
  writeInspections_(rows);
  return r;
};

API_.deleteInspection = function (a) {
  var rows = readInspections_();
  try { DriveApp.getFileById(a.id).setTrashed(true); } catch (e) { /* gone */ }
  writeInspections_(rows.filter(function (r) { return r.id !== a.id; }));
  return { deleted: a.id };
};

API_.inspectionReport = function (a) {
  var qs = readQuotes_();
  var q = findById_(qs, a.quoteId);
  if (!q) throw new Error('Quote not found.');
  var rows = readInspections_().filter(function (r) { return r.quoteId === q.id; }).sort(function (x, y) { return x.order - y.order; });
  if (!rows.length) throw new Error('Add inspection photos first.');
  var s = settings_();
  var counts = {};
  rows.forEach(function (r) { counts[r.tag] = (counts[r.tag] || 0) + 1; });
  var photos = rows.map(function (r) {
    var src = '';
    try { src = 'data:image/jpeg;base64,' + Utilities.base64Encode(DriveApp.getFileById(r.id).getBlob().getBytes()); } catch (e) { return ''; }
    return '<div class="ph"><img src="' + src + '"><div class="cap"><b>' + escHtml_(r.tag) + '</b>' + (r.note ? ' — ' + escHtml_(r.note) : '') + '</div></div>';
  }).join('');
  var html = '<html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;color:#1C2430;font-size:12px;margin:24px}' +
    '.top{background:#13202F;color:#fff;padding:14px 18px}.top b{font-size:18px;letter-spacing:.06em}.top i{font-style:normal;color:#FF5440}h1{font-size:20px;margin:16px 0 2px}' +
    '.m{color:#5B6675}.sum{border:1px solid #DDE2E8;padding:10px 14px;margin:12px 0}.ph{page-break-inside:avoid;margin:12px 0}.ph img{width:100%;max-height:420px;object-fit:contain;border:1px solid #DDE2E8}.cap{margin-top:4px;font-size:12px}' +
    '.foot{color:#5B6675;font-size:10px;margin-top:20px;border-top:1px solid #DDE2E8;padding-top:8px}</style></head><body>' +
    '<div class="top"><b>TEAM <i>FORTE</i></b> &nbsp; Roof inspection report</div>' +
    '<h1>' + escHtml_(q.address) + '</h1><div class="m">Prepared for ' + escHtml_(q.name || 'the homeowner') + ' · ' + escHtml_(Utilities.formatDate(new Date(), tz_(), 'MMMM d, yyyy')) + ' · ' + rows.length + ' photos</div>' +
    '<div class="sum"><b>What we found</b><br>' + Object.keys(counts).map(function (k) { return escHtml_(k) + (counts[k] > 1 ? ' (' + counts[k] + ')' : ''); }).join(' · ') + '</div>' +
    photos + '<div class="foot">' + escHtml_(s.company.legal) + ' · ' + escHtml_(s.company.address) + ' · ' + escHtml_(s.company.phone) + ' · ' + escHtml_(s.company.email) + '</div></body></html>';
  var pdf = Utilities.newBlob(html, 'text/html', 'report.html').getAs('application/pdf');
  pdf.setName('Roof inspection report - ' + String(q.address).split(',')[0] + '.pdf');
  var folder = childFolder_(childFolder_(rootFolder_(), 'Inspection photos'), q.id + (q.address ? ' - ' + String(q.address).split(',')[0] : ''));
  var file = folder.createFile(pdf);
  try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) { /* ignore */ }
  var url = 'https://drive.google.com/file/d/' + file.getId() + '/view';
  logEvent_(q, 'inspection report created');
  var emailed = '';
  if (a.email) {
    var to = clean_(a.email, 120);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) throw new Error('That email doesn’t look right.');
    var owner = ownerEmail_();
    MailApp.sendEmail({ to: to, subject: 'Your roof inspection report from Team Forte', name: 'Team Forte', replyTo: owner || undefined, attachments: [pdf],
      htmlBody: '<div style="font-family:Arial,sans-serif;font-size:15px">Hi' + (q.name ? ' ' + escHtml_(String(q.name).split(' ')[0]) : '') + ',<p>Here are the photos and notes from our inspection of your roof at ' + escHtml_(q.address) + '.</p><p>Questions? Reply here or call ' + escHtml_(s.company.phone) + '.</p><p>Team Forte</p></div>' });
    if (!q.email) q.email = to;
    emailed = to;
    logEvent_(q, 'inspection report emailed');
  }
  writeQuotes_(qs);
  return { url: url, id: file.getId(), emailed: emailed };
};

/* ---------------- list everything the office app needs ---------------- */

var matListBase_ = API_.matList;
API_.matList = function () {
  var d = matListBase_();
  d.repairs = repairs_();
  d.inspections = readInspections_();
  d.tags = INSPECTION_TAGS;
  d.user = { name: CURRENT_USER_.name, role: CURRENT_USER_.role };
  d.execUrl = execUrl_();
  return d;
};

/* ------------------------------------------------------------------ */
/* Built-in pages (generated, do not edit)                             */
/* ------------------------------------------------------------------ */

/* ---------------- installed app: one-call startup ---------------- */
API_.boot = function () {
  var out = { ping: API_.ping(), list: API_.list() };
  if (CURRENT_USER_.role === 'crew') out.crew = API_.crewJobs({});
  else out.mat = API_.matList({});
  return out;
};
READ_ONLY_.boot = 1;
CREW_CAN_.boot = 1;

var ADMIN_HTML = "<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\">\n<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n<link href=\"https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap\" rel=\"stylesheet\">\n<style>\n:root{--navy:#13202F;--navy2:#1B2B3D;--red:#FF5440;--red-dk:#E23E2B;--ink:#1C2430;--muted:#5B6675;--line:#DDE2E8;--slate:#F2F4F7;--white:#fff;--green:#1F9D55;--green-bg:#E5F6EC;--r:12px}\n*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}\nhtml,body{margin:0;padding:0}\nbody{font-family:Montserrat,\"Segoe UI\",Arial,sans-serif;background:var(--slate);color:var(--ink);font-size:15px;line-height:1.45;-webkit-font-smoothing:antialiased;min-height:100vh}\nbutton,input,select,textarea{font:inherit;color:inherit}\nbutton{cursor:pointer;border:0;background:none;padding:0}\n.wrap{max-width:640px;margin:0 auto;padding:0 16px calc(32px + env(safe-area-inset-bottom))}\n.bar{position:sticky;top:0;z-index:20;background:var(--navy);color:#fff;padding:calc(10px + env(safe-area-inset-top)) 0 10px}\n.bar .wrap{display:flex;align-items:center;gap:10px;padding-bottom:0;min-height:40px}\n.brand{font-weight:800;letter-spacing:.06em;font-size:16px;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.brand b{color:var(--red)}\n.bar .link{color:#C4CCD6;font-size:13px;font-weight:600;padding:8px 4px}\n.back{display:flex;align-items:center;gap:4px;color:#fff;font-weight:700;font-size:15px;padding:8px 8px 8px 0}\n.back svg{width:20px;height:20px}\n.bar-title{flex:1;font-weight:700;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center;margin-right:48px}\n.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:0 20px;border-radius:10px;font-weight:700;font-size:15px;background:var(--red);color:#fff;transition:background .15s}\n.btn:active{background:var(--red-dk)}\n.btn.block{width:100%}\na.btn{text-decoration:none}\n.btn.ghost{background:#fff;color:var(--ink);border:1px solid var(--line)}\n.btn.dark{background:var(--navy);color:#fff}\n.btn.danger{background:#fff;color:#C62828;border:1px solid #F3C4C4}\n.btn[disabled]{opacity:.55;pointer-events:none}\n.btn svg{width:18px;height:18px}\nh1{font-size:22px;font-weight:800;margin:20px 0 4px}\n.sub{color:var(--muted);font-size:14px;margin:0 0 16px}\n.card{background:#fff;border:1px solid var(--line);border-radius:var(--r);padding:16px;margin:14px 0}\n.card h2{font-size:16px;font-weight:800;margin:0 0 12px;display:flex;align-items:center;justify-content:space-between;gap:8px}\n.card h2 small{font-weight:600;color:var(--muted);font-size:13px}\n.chips{display:flex;gap:8px;overflow-x:auto;padding:4px 0 2px;margin:0 -16px;padding-left:16px;padding-right:16px;scrollbar-width:none}\n.chips::-webkit-scrollbar{display:none}\n.chip{flex:none;padding:8px 14px;border-radius:999px;border:1px solid var(--line);background:#fff;font-weight:600;font-size:14px;color:var(--ink)}\n.chip.on{background:var(--navy);border-color:var(--navy);color:#fff}\n.seg{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;background:var(--slate);border:1px solid var(--line);border-radius:10px;padding:3px;gap:3px}\n.seg button{min-height:40px;border-radius:8px;font-weight:700;font-size:14px;color:var(--muted)}\n.seg button.on{background:#fff;color:var(--ink);box-shadow:0 1px 3px rgba(19,32,47,.15)}\n.stats{display:flex;gap:10px;margin:14px 0 6px}\n.stat{flex:1;background:#fff;border:1px solid var(--line);border-radius:var(--r);padding:12px}\n.stat b{display:block;font-size:22px;font-weight:800}\n.stat span{font-size:12px;white-space:nowrap;color:var(--muted);font-weight:600}\n.jobs{display:flex;flex-direction:column;gap:10px;margin-top:12px}\n.job{display:flex;gap:12px;align-items:center;background:#fff;border:1px solid var(--line);border-radius:var(--r);padding:10px;text-align:left;width:100%}\n.job .th{width:76px;height:76px;border-radius:9px;background:var(--slate) center/cover no-repeat;flex:none;display:flex;align-items:center;justify-content:center;color:#9AA5B1}\n.job .th svg{width:28px;height:28px}\n.job .info{flex:1;min-width:0}\n.job .t{font-weight:700;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.job .m{color:var(--muted);font-size:13px;margin:2px 0 6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.pills{display:flex;flex-wrap:wrap;gap:5px}\n.pill{font-size:11px;font-weight:700;padding:3px 8px;border-radius:999px;background:var(--slate);color:var(--muted);letter-spacing:.02em}\n.pill.live{background:var(--green-bg);color:var(--green)}\n.pill.home{background:#FFE9E5;color:var(--red-dk)}\n.chev{color:#9AA5B1;flex:none}\n.empty{text-align:center;color:var(--muted);padding:40px 16px;background:#fff;border:1px dashed var(--line);border-radius:var(--r);margin-top:12px}\n.empty b{display:block;color:var(--ink);font-size:16px;margin-bottom:4px}\n.toggle{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0;border-top:1px solid var(--line)}\n.toggle:first-of-type{border-top:0;padding-top:0}\n.toggle .tl b{display:block;font-size:15px}\n.toggle .tl span{font-size:13px;color:var(--muted)}\n.sw{position:relative;width:52px;height:32px;flex:none;border-radius:999px;background:#C9D1DA;transition:background .2s}\n.sw::after{content:\"\";position:absolute;top:3px;left:3px;width:26px;height:26px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25);transition:transform .2s}\n.sw.on{background:var(--green)}\n.sw.on::after{transform:translateX(20px)}\n.stage{margin-top:16px}\n.stage:first-of-type{margin-top:0}\n.stage-h{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:8px}\n.stage-h b{font-size:14px;text-transform:uppercase;letter-spacing:.08em}\n.stage-h span{font-size:12px;color:var(--muted);font-weight:600}\n.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}\n.ph{position:relative;aspect-ratio:1;border-radius:9px;overflow:hidden;background:var(--slate)}\n.ph img{width:100%;height:100%;object-fit:cover;display:block}\n.ph .star{position:absolute;left:6px;top:6px;background:var(--red);color:#fff;border-radius:999px;font-size:10px;font-weight:800;padding:2px 7px;letter-spacing:.04em}\n.ph .cap{position:absolute;left:0;right:0;bottom:0;padding:14px 6px 5px;font-size:11px;color:#fff;background:linear-gradient(transparent,rgba(0,0,0,.65));white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.add{aspect-ratio:1;border-radius:9px;border:2px dashed #B9C3CE;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;color:var(--muted);font-weight:700;font-size:12px;background:#FAFBFC}\n.add svg{width:26px;height:26px;color:var(--red)}\nlabel.f{display:block;font-size:13px;font-weight:700;margin:14px 0 6px}\nlabel.f:first-child{margin-top:0}\nlabel.f small{font-weight:500;color:var(--muted)}\n.in{width:100%;min-height:46px;border:1px solid var(--line);border-radius:10px;padding:10px 12px;background:#fff;font-size:16px;-webkit-appearance:none;appearance:none}\n.in:focus{outline:2px solid rgba(255,84,64,.35);border-color:var(--red)}\ntextarea.in{min-height:84px;resize:vertical}\n.row{display:flex;gap:10px}\n.row>*{flex:1}\n.mt{margin-top:16px}\n.drive{display:flex;align-items:center;gap:8px;color:var(--navy);font-weight:700;font-size:14px;text-decoration:none;padding:12px 0}\n.drive svg{width:18px;height:18px}\n/* sheets */\n.ov{position:fixed;inset:0;z-index:50;background:rgba(19,32,47,.55);display:flex;align-items:flex-end;justify-content:center;animation:fade .15s}\n.sheet{background:#fff;width:100%;max-width:640px;max-height:94vh;overflow:auto;border-radius:18px 18px 0 0;padding:8px 16px calc(20px + env(safe-area-inset-bottom));animation:up .2s ease-out}\n.grab{width:40px;height:5px;border-radius:3px;background:#D0D6DD;margin:4px auto 12px}\n.sheet h3{font-size:18px;font-weight:800;margin:0 0 14px;display:flex;justify-content:space-between;align-items:center}\n.x{width:36px;height:36px;border-radius:50%;background:var(--slate);display:flex;align-items:center;justify-content:center}\n.x svg{width:18px;height:18px}\n.big{width:100%;border-radius:12px;background:var(--slate);display:block;max-height:52vh;object-fit:contain}\n.acts{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px}\n.acts .btn{min-height:44px;font-size:14px;padding:0 10px}\n.cgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:10px}\n.ctile{display:block;text-align:left;min-width:0}\n.ctile img{width:100%;aspect-ratio:1;border-radius:10px;display:block;background:#333}\n.ctile span{display:block;font-size:12px;font-weight:700;margin-top:5px;line-height:1.25}\n.ctile.on img{outline:3px solid var(--red);outline-offset:2px}\n.cbig{aspect-ratio:1;object-fit:cover;max-height:none}\n.vizov{position:fixed;inset:0;z-index:60;background:#fff;overflow:auto;-webkit-overflow-scrolling:touch}\n.vizbar{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:8px;padding:calc(10px + env(safe-area-inset-top)) 14px 10px;background:var(--navy);color:#fff}\n.vizbar span{flex:1;font-size:12px;opacity:.75}\n.vizbody{padding:0 8px calc(16px + env(safe-area-inset-bottom))}\n#visualizer iframe{width:100% !important;border:0}\n.shov{flex-direction:column;overflow:hidden}\n.ocf{flex:1;width:100%;border:0;min-height:0;background:#fff}\n@keyframes up{from{transform:translateY(40px);opacity:.6}to{transform:none;opacity:1}}\n@keyframes fade{from{opacity:0}to{opacity:1}}\n/* progress + toast */\n.prog{position:fixed;left:0;right:0;bottom:0;z-index:40;background:var(--navy);color:#fff;padding:12px 16px calc(12px + env(safe-area-inset-bottom))}\n.prog .wrap{padding-bottom:0}\n.prog .l{display:flex;justify-content:space-between;font-size:14px;font-weight:700;margin-bottom:8px}\n.prog .track{height:6px;border-radius:3px;background:rgba(255,255,255,.18);overflow:hidden}\n.prog .fill{height:100%;background:var(--red);transition:width .3s}\n.toast{position:fixed;left:50%;bottom:calc(24px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:60;background:var(--ink);color:#fff;padding:12px 18px;border-radius:10px;font-size:14px;font-weight:600;max-width:calc(100% - 32px);box-shadow:0 8px 24px rgba(0,0,0,.25);animation:fade .2s}\n.toast.err{background:#B3261E}\n/* login */\n.login{min-height:100vh;display:flex;flex-direction:column;justify-content:center;background:var(--navy);color:#fff;padding:24px}\n.login .box{max-width:380px;margin:0 auto;width:100%}\n.login .logo{font-weight:800;font-size:28px;letter-spacing:.08em;margin-bottom:4px}\n.login .logo b{color:var(--red)}\n.login p{color:#C4CCD6;margin:0 0 28px}\n.login .in{background:#fff;color:var(--ink);text-align:center;font-size:20px;letter-spacing:.2em;font-weight:700}\n.login .remember{display:flex;align-items:center;gap:8px;color:#C4CCD6;font-size:14px;margin:14px 0 18px}\n.login .remember input{width:18px;height:18px;accent-color:var(--red)}\n.login .err{color:#FFB4A8;font-size:14px;min-height:20px;margin-top:10px;text-align:center}\n.spin{width:22px;height:22px;border:3px solid rgba(255,255,255,.35);border-top-color:#fff;border-radius:50%;animation:rot .8s linear infinite}\n.spin.dk{border-color:rgba(19,32,47,.15);border-top-color:var(--red)}\n@keyframes rot{to{transform:rotate(360deg)}}\n.loading{display:flex;justify-content:center;padding:60px 0}\n.foot{text-align:center;margin-top:26px}\n.foot a{color:var(--navy);font-weight:700;font-size:14px}\n.hint{font-size:12px;color:var(--muted);margin-top:6px}\n.vh{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}\n/* bottom tabs */\nbody.has-tabs .wrap{padding-bottom:calc(100px + env(safe-area-inset-bottom))}\nbody.has-tabs .bar .wrap,body.has-tabs .prog .wrap{padding-bottom:0}\n.row{align-items:flex-end}\nbody.has-tabs .prog{bottom:calc(62px + env(safe-area-inset-bottom))}\nbody.has-tabs .toast{bottom:calc(80px + env(safe-area-inset-bottom))}\n.tabs{position:fixed;left:0;right:0;bottom:0;z-index:30;background:#fff;border-top:1px solid var(--line);display:flex;justify-content:center;padding:0 0 env(safe-area-inset-bottom)}\n.tabs .in2{display:flex;width:100%;max-width:640px}\n.tab{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:9px 0 8px;font-size:11px;font-weight:700;color:#7A8594;position:relative}\n.tab svg{width:24px;height:24px}\n.tab.on{color:var(--red)}\n.tab .dot{position:absolute;top:5px;left:calc(50% + 8px);min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:var(--red);color:#fff;font-size:11px;line-height:18px;text-align:center}\n/* materials */\n.money{font-variant-numeric:tabular-nums}\n.q{display:block;width:100%;text-align:left;background:#fff;border:1px solid var(--line);border-radius:var(--r);padding:14px;margin-top:10px}\n.q .top{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}\n.q .nm{font-weight:800;font-size:16px}\n.q .ad{color:var(--muted);font-size:13px;margin:2px 0 8px}\n.q .rg{font-weight:800;font-size:15px;white-space:nowrap}\n.pill.new{background:#FFE9E5;color:var(--red-dk)}\n.pill.approved{background:#E7EEFF;color:#2B4FC7}\n.pill.ordered,.pill.Sent,.pill.Requested,.pill.Scheduled,.pill.Pending{background:#FFF4D6;color:#8A5A00}\n.pill.done,.pill.Delivered,.pill.Picked{background:var(--green-bg);color:var(--green)}\n.pill.Canceled,.pill.Backordered,.pill.Attempted{background:#FDE7E7;color:#B3261E}\n.kv{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-top:1px solid var(--line);font-size:14px}\n.kv:first-of-type{border-top:0}\n.kv span{color:var(--muted)}\n.kv b{text-align:right}\n.big-n{font-size:28px;font-weight:800;line-height:1.1}\n.pkg{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}\n.pkg button{border:2px solid var(--line);border-radius:10px;padding:10px 6px;text-align:center;background:#fff}\n.pkg button b{display:block;font-size:14px}\n.pkg button span{display:block;font-size:11px;color:var(--muted);margin-top:2px}\n.pkg button.on{border-color:var(--red);background:#FFF6F4}\n.meas{display:grid;grid-template-columns:1fr 1fr;gap:10px}\n.meas label{display:block;font-size:12px;font-weight:700;margin-bottom:4px}\n.meas label i{font-style:normal;font-weight:700;font-size:10px;color:#8A5A00;background:#FFF4D6;border-radius:4px;padding:1px 5px;margin-left:4px}\n.meas .in{min-height:42px;padding:8px 10px}\n.ln{display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:10px 0;border-top:1px solid var(--line)}\n.ln:first-child{border-top:0}\n.ln .l1{flex:1;min-width:0}\n.ln .l1 b{display:block;font-size:14px;font-weight:700}\n.ln .l1 span{font-size:12px;color:var(--muted)}\n.ln .l1 em{font-style:normal;font-size:10px;font-weight:800;color:#8A5A00;background:#FFF4D6;border-radius:4px;padding:1px 5px;margin-left:4px}\n.ln .l2{text-align:right;font-weight:800;font-size:14px;white-space:nowrap}\n.ln .l2 span{display:block;font-weight:600;font-size:12px;color:var(--muted)}\n.cat{font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin:14px 0 2px}\n.cat:first-child{margin-top:0}\n.tot{border-top:2px solid var(--ink);margin-top:8px;padding-top:8px}\n.tot .kv{border:0;padding:3px 0}\n.tot .kv.grand{font-size:17px;font-weight:800}\n.src{font-size:10px;font-weight:800;border-radius:4px;padding:2px 6px;letter-spacing:.03em}\n.src.abc{background:var(--green-bg);color:var(--green)}\n.src.manual{background:#E7EEFF;color:#2B4FC7}\n.src.starter{background:#FFF4D6;color:#8A5A00}\n.note{background:#FFF8E6;border:1px solid #F3DFA8;border-radius:10px;padding:10px 12px;font-size:13px;color:#5C4400;margin:10px 0}\n.note.ok{background:var(--green-bg);border-color:#BFE6CF;color:#145C34}\n.res{display:block;width:100%;text-align:left;padding:10px 0;border-top:1px solid var(--line);font-size:14px}\n.res b{display:block}\n.res span{font-size:12px;color:var(--muted)}\n.icon-btn{display:inline-flex;align-items:center;gap:6px;color:#fff;font-weight:700;font-size:14px;padding:8px 2px}\n.icon-btn svg{width:20px;height:20px}\n.meter{height:8px;border-radius:4px;background:var(--slate);overflow:hidden;margin-top:8px}\n.meter div{height:100%;background:var(--red)}\n</style>\n</head>\n<body>\n<div id=\"app\"></div>\n<input type=\"file\" id=\"picker\" accept=\"image/*\" multiple class=\"vh\" aria-hidden=\"true\" tabindex=\"-1\">\n<script>\n/* Team Forte materials takeoff (Owens Corning system). Shared by the phone app and the tests. */\nvar TAKEOFF = (function () {\n  'use strict';\n\n  var PACKAGES = [\n    { key: 'shingle_oakridge', label: 'Oakridge' },\n    { key: 'shingle_duration', label: 'Duration' },\n    { key: 'shingle_flex', label: 'Duration FLEX' }\n  ];\n\n  /* Default price list. Prices are rough starting numbers until replaced by your supplier's prices. */\n  var CATALOG = [\n    { key: 'shingle_oakridge', cat: 'Shingles', name: 'Owens Corning Oakridge shingles', unit: 'bundle', price: 42 },\n    { key: 'shingle_duration', cat: 'Shingles', name: 'Owens Corning TruDefinition Duration shingles', unit: 'bundle', price: 46 },\n    { key: 'shingle_flex', cat: 'Shingles', name: 'Owens Corning Duration FLEX shingles', unit: 'bundle', price: 58 },\n    { key: 'hip_ridge', cat: 'Shingles', name: 'OC ProEdge Hip & Ridge (33 LF)', unit: 'bundle', price: 76 },\n    { key: 'starter', cat: 'Shingles', name: 'OC Starter Strip Plus (105 LF)', unit: 'bundle', price: 66 },\n    { key: 'ice_water', cat: 'Underlayment', name: 'OC WeatherLock G ice & water barrier (2 sq)', unit: 'roll', price: 118 },\n    { key: 'underlayment', cat: 'Underlayment', name: 'OC Deck Defense synthetic underlayment (10 sq)', unit: 'roll', price: 165 },\n    { key: 'drip_edge', cat: 'Metal & flashing', name: 'Drip edge, aluminum, 10 ft', unit: 'piece', price: 12 },\n    { key: 'step_flashing', cat: 'Metal & flashing', name: 'Step flashing 4x4x8 (100 pcs)', unit: 'bundle', price: 48 },\n    { key: 'ridge_vent', cat: 'Ventilation', name: 'OC VentSure ridge vent, 4 ft', unit: 'piece', price: 14 },\n    { key: 'pipe_boot', cat: 'Ventilation', name: 'Pipe boot flashing', unit: 'each', price: 18 },\n    { key: 'coil_nails', cat: 'Fasteners', name: 'Coil roofing nails 1-1/4\" (7,200)', unit: 'box', price: 56 },\n    { key: 'cap_nails', cat: 'Fasteners', name: 'Plastic cap nails (2,000)', unit: 'box', price: 34 },\n    { key: 'sealant', cat: 'Fasteners', name: 'Roof sealant, tube', unit: 'tube', price: 9 },\n    { key: 'osb', cat: 'Decking', name: 'OSB roof decking 7/16\" 4x8', unit: 'sheet', price: 22 }\n  ];\n\n  var DEFAULTS = { waste: 10, iceCourses: 2, pipes: 2, decking: 2, walls: 0 };\n\n  function num(v, d) { v = Number(v); return isFinite(v) ? v : (d || 0); }\n  function ceil(v) { return Math.max(0, Math.ceil(v - 1e-9)); }\n\n  function pitchRise(p) {\n    var m = String(p || '').match(/(\\d+(?:\\.\\d+)?)\\s*(?:\\/\\s*12)?/);\n    return m ? Math.min(30, num(m[1])) : 6;\n  }\n  function pitchFactor(p) { var r = pitchRise(p) / 12; return Math.sqrt(1 + r * r); }\n\n  /* Google encoded polyline -> [[lat,lng],...] */\n  function decodePoly(str) {\n    var pts = [], i = 0, lat = 0, lng = 0;\n    str = String(str || '');\n    while (i < str.length) {\n      var res = [0, 0];\n      for (var k = 0; k < 2; k++) {\n        var shift = 0, result = 0, b;\n        do { b = str.charCodeAt(i++) - 63; result |= (b & 31) << shift; shift += 5; } while (b >= 32);\n        res[k] = (result & 1) ? ~(result >> 1) : (result >> 1);\n      }\n      lat += res[0]; lng += res[1];\n      pts.push([lat / 1e6, lng / 1e6]);\n    }\n    return pts;\n  }\n\n  function rings(o) {\n    if (!o) return [];\n    if (typeof o === 'string') return [decodePoly(o)];\n    if (Array.isArray(o)) {\n      if (!o.length) return [];\n      if (typeof o[0] === 'string') return o.map(decodePoly);\n      if (Array.isArray(o[0]) && typeof o[0][0] === 'number') return [o];\n      if (Array.isArray(o[0]) && Array.isArray(o[0][0])) return o;\n    }\n    return [];\n  }\n\n  /* Footprint area (sq ft) and perimeter (ft) of a lat/lng ring. */\n  function ringStats(ring) {\n    if (!ring || ring.length < 3) return { area: 0, perim: 0 };\n    var lat0 = ring[0][0] * Math.PI / 180;\n    var fy = 364567, fx = 364567 * Math.cos(lat0);\n    var pts = ring.map(function (p) { return [p[1] * fx, p[0] * fy]; });\n    var a = 0, per = 0;\n    for (var i = 0; i < pts.length; i++) {\n      var p = pts[i], q = pts[(i + 1) % pts.length];\n      a += p[0] * q[1] - q[0] * p[1];\n      per += Math.sqrt((q[0] - p[0]) * (q[0] - p[0]) + (q[1] - p[1]) * (q[1] - p[1]));\n    }\n    return { area: Math.abs(a) / 2, perim: per };\n  }\n\n  /* Estimate measurements from the roofs saved with an instant quote: [{n, s, p, o}] */\n  function estimate(roofs) {\n    var m = { area: 0, eaves: 0, rakes: 0, ridges: 0, hips: 0, valleys: 0, pitch: '', roofs: [] };\n    var biggest = 0;\n    (roofs || []).forEach(function (r) {\n      var s = num(r.s || r.sqft), f = pitchFactor(r.p || r.pitch);\n      if (s <= 0) return;\n      var fp = 0, per = 0;\n      rings(r.o || r.outline).forEach(function (ring) { var st = ringStats(ring); fp += st.area; per += st.perim; });\n      var surface, basis;\n      if (fp > 50) {\n        // Is the quoted sq ft the sloped roof area or the flat footprint? Pick whichever fits the outline.\n        surface = Math.abs(s - fp * f) <= Math.abs(s - fp) ? s : s * f;\n        basis = 'outline';\n      } else {\n        surface = s;\n        per = 4 * Math.sqrt(s / f) * 1.15;\n        basis = 'area';\n      }\n      m.area += surface;\n      m.eaves += 0.55 * per;\n      m.rakes += 0.45 * per * f;\n      m.ridges += 0.30 * per;\n      m.hips += 0.10 * per * f;\n      m.valleys += 0.03 * per * f;\n      m.roofs.push({ name: r.n || r.name || 'Roof', sqft: Math.round(surface), pitch: r.p || r.pitch || '', basis: basis });\n      if (surface > biggest) { biggest = surface; m.pitch = r.p || r.pitch || ''; }\n    });\n    ['area', 'eaves', 'rakes', 'ridges', 'hips', 'valleys'].forEach(function (k) { m[k] = Math.round(m[k]); });\n    m.waste = DEFAULTS.waste;\n    m.iceCourses = DEFAULTS.iceCourses;\n    m.pipes = DEFAULTS.pipes;\n    m.decking = DEFAULTS.decking;\n    m.walls = DEFAULTS.walls;\n    m.est = { eaves: true, rakes: true, ridges: true, hips: true, valleys: true, walls: true, pipes: true, decking: true };\n    return m;\n  }\n\n  /* Quantities for one job. pkg = 0 Oakridge, 1 Duration, 2 Duration FLEX. */\n  function quantities(m, pkg) {\n    var waste = num(m.waste, DEFAULTS.waste) / 100;\n    var area = num(m.area), sq = area / 100;\n    var eaves = num(m.eaves), rakes = num(m.rakes), ridges = num(m.ridges), hips = num(m.hips), valleys = num(m.valleys);\n    var courses = num(m.iceCourses, DEFAULTS.iceCourses);\n    var iceArea = Math.min(area, eaves * 3 * courses + valleys * 3);\n    var shingle = (PACKAGES[pkg] || PACKAGES[1]).key;\n    var q = {};\n    q[shingle] = ceil(sq * (1 + waste) * 3);\n    q.hip_ridge = ceil((ridges + hips) * 1.05 / 33);\n    q.starter = ceil((eaves + rakes) * 1.05 / 105);\n    q.ice_water = ceil(iceArea * 1.1 / 200);\n    q.underlayment = ceil(Math.max(0, area - iceArea) * 1.1 / 1000);\n    q.drip_edge = ceil((eaves + rakes) * 1.05 / 10);\n    q.step_flashing = ceil(num(m.walls) * 12 / 5 / 100);\n    q.ridge_vent = ceil(ridges * 0.8 / 4);\n    q.pipe_boot = ceil(num(m.pipes));\n    q.coil_nails = sq > 0 ? ceil(sq * (1 + waste) * 320 / 7200) : 0;\n    q.cap_nails = sq > 0 ? Math.max(1, ceil(sq / 15)) : 0;\n    q.sealant = sq > 0 ? ceil(sq / 10) + 1 : 0;\n    q.osb = ceil(num(m.decking));\n    return q;\n  }\n\n  /* Build material lines. prices: {key: {name, unit, price, abcItem, uom}}. Keeps manual edits from oldLines. */\n  function lines(m, pkg, prices, oldLines) {\n    var q = quantities(m, pkg);\n    var old = {};\n    (oldLines || []).forEach(function (l) { old[l.key] = l; });\n    var out = [];\n    CATALOG.forEach(function (c) {\n      if (!(c.key in q)) return;\n      var p = (prices && prices[c.key]) || c;\n      var prev = old[c.key];\n      var qty = prev && prev.manual ? prev.qty : q[c.key];\n      if (!qty && !(prev && prev.manual)) return;\n      out.push({\n        key: c.key, cat: p.cat || c.cat, name: p.name || c.name, unit: p.unit || c.unit,\n        qty: qty, calc: q[c.key], manual: !!(prev && prev.manual),\n        price: prev && prev.priceManual ? prev.price : num(p.price, c.price), priceManual: !!(prev && prev.priceManual),\n        abcItem: prev && prev.itemManual ? prev.abcItem : (p.abcItem || ''), uom: prev && prev.itemManual ? prev.uom : (p.uom || ''),\n        itemManual: !!(prev && prev.itemManual)\n      });\n    });\n    (oldLines || []).forEach(function (l) { if (l.custom) out.push(l); });\n    return out;\n  }\n\n  function totals(ls, taxRate) {\n    var sub = 0;\n    (ls || []).forEach(function (l) { sub += num(l.qty) * num(l.price); });\n    sub = Math.round(sub * 100) / 100;\n    var tax = Math.round(sub * num(taxRate) / 100 * 100) / 100;\n    return { subtotal: sub, tax: tax, total: Math.round((sub + tax) * 100) / 100 };\n  }\n\n  /* ---------- quote pricing (per square) ---------- */\n  var PRICING = {\n    packages: [{ label: 'Oakridge', perSq: 565 }, { label: 'Duration', perSq: 655 }, { label: 'Duration FLEX', perSq: 745 }],\n    lowPct: 83, highPct: 117, wastePct: 13,\n    steep: [{ from: 7, pct: 8 }, { from: 9, pct: 15 }, { from: 11, pct: 25 }, { from: 13, pct: 35 }],\n    layerPerSq: 65, minJob: 8000, outMin: 1500, roundTo: 100\n  };\n  /* Same math as the website instant quote (team-forte.com/instant-quote). */\n  var WASTE_BY_FACETS = [{ max: 4, pct: 10 }, { max: 10, pct: 13 }, { max: 999, pct: 16 }];\n\n  function cleanPricing(p) {\n    p = p || {};\n    var d = PRICING, out = {};\n    out.packages = d.packages.map(function (pk, i) {\n      var x = (p.packages || [])[i] || {};\n      return { label: pk.label, perSq: Math.max(0, num(x.perSq, pk.perSq)) };\n    });\n    ['lowPct', 'highPct', 'wastePct', 'layerPerSq', 'minJob', 'outMin', 'roundTo'].forEach(function (k) { out[k] = Math.max(0, num(p[k], d[k])); });\n    if (out.highPct < 100) out.highPct = 100;\n    if (out.lowPct > 100) out.lowPct = 100;\n    if (!out.roundTo) out.roundTo = 1;\n    out.steep = (Array.isArray(p.steep) ? p.steep : d.steep).map(function (x) { return { from: Math.max(0, num(x.from)), pct: Math.max(0, num(x.pct)) }; })\n      .filter(function (x) { return x.from > 0; }).sort(function (a, b) { return a.from - b.from; }).slice(0, 6);\n    out.updated = p.updated || '';\n    return out;\n  }\n\n  function steepPct(pr, pitch) {\n    var rise = pitchRise(pitch), pct = 0;\n    (pr.steep || []).forEach(function (x) { if (rise >= x.from) pct = Math.max(pct, x.pct); });\n    return pct;\n  }\n\n  function wastePctFor(pr, facets) {\n    facets = num(facets);\n    if (!facets) return pr.wastePct;\n    for (var i = 0; i < WASTE_BY_FACETS.length; i++) if (facets <= WASTE_BY_FACETS[i].max) return WASTE_BY_FACETS[i].pct;\n    return WASTE_BY_FACETS[WASTE_BY_FACETS.length - 1].pct;\n  }\n\n  /* Price ranges per package: [[low, high], ...]. roofs: [{s: sq ft (sloped), p: '7/12', f: facets}], layers: roof layers to tear off.\n     Each roof is priced on its own (main roof minimum, smaller minimum for extra roofs) and the ranges are added up,\n     exactly like the website instant quote. */\n  function priceRanges(pr, roofs, layers) {\n    pr = cleanPricing(pr);\n    var extraLayers = Math.max(0, Math.round(num(layers, 1)) - 1);\n    var base0 = pr.packages[0].perSq || 1, rt = pr.roundTo;\n    function rnd(x) { return Math.round(x / rt) * rt; }\n    return pr.packages.map(function (pk) {\n      var lo = 0, hi = 0, any = false;\n      (roofs || []).forEach(function (r, i) {\n        var sqft = num(r.s || r.sqft);\n        if (sqft <= 0) return;\n        any = true;\n        var sq = sqft / 100 * (1 + wastePctFor(pr, r.f) / 100);\n        var f = sq * (pk.perSq + extraLayers * pr.layerPerSq) * (1 + steepPct(pr, r.p || r.pitch) / 100);\n        var min = (i === 0 ? pr.minJob : pr.outMin) * pk.perSq / base0;\n        f = Math.max(f, min);\n        lo += rnd(Math.max(f * pr.lowPct / 100, min));\n        hi += rnd(f * pr.highPct / 100);\n      });\n      return any ? [lo, hi] : [0, 0];\n    });\n  }\n\n  function pitchFromDegrees(deg) {\n    var rise = Math.round(Math.tan(num(deg) * Math.PI / 180) * 12);\n    return Math.max(0, Math.min(24, rise)) + '/12';\n  }\n\n  return {\n    PACKAGES: PACKAGES, CATALOG: CATALOG, DEFAULTS: DEFAULTS, PRICING: PRICING,\n    cleanPricing: cleanPricing, priceRanges: priceRanges, steepPct: steepPct, pitchFromDegrees: pitchFromDegrees, pitchRise: pitchRise,\n    estimate: estimate, quantities: quantities, lines: lines, totals: totals,\n    decodePoly: decodePoly, ringStats: ringStats, pitchFactor: pitchFactor\n  };\n})();\nif (typeof module !== 'undefined') module.exports = TAKEOFF;\n\n(function(){\n'use strict';\nvar EXEC_URL='__EXEC_URL__';\nvar SERVICES=['Roofing','Carpentry','Painting','Handyman'];\nvar STAGES=[['before','Before'],['during','During'],['after','After']];\nvar TITLES={Roofing:['Full roof replacement','Roof repair','Leak repair','Shingle replacement','Flat roof','Chimney flashing','Gutters','Skylight'],Carpentry:['Deck build','Deck repair','Trim & molding','Framing','Door install','Stairs & railings'],Painting:['Exterior painting','Interior painting','Deck staining','Cabinet painting'],Handyman:['General repairs','Drywall repair','Fixture install','Siding repair']};\nvar ICON={\n  back:'<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M15 18l-6-6 6-6\"/></svg>',\n  chev:'<svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\"><path d=\"M9 6l6 6-6 6\"/></svg>',\n  plus:'<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\"><path d=\"M12 5v14M5 12h14\"/></svg>',\n  cam:'<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z\"/><circle cx=\"12\" cy=\"13\" r=\"4\"/></svg>',\n  x:'<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\"><path d=\"M18 6L6 18M6 6l12 12\"/></svg>',\n  folder:'<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\"><path d=\"M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z\"/></svg>',\n  eye:'<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/></svg>'\n};\n\nvar S={pass:'',jobs:[],view:'login',jobId:null,filter:'All',busy:false,prev:{},upload:null,tab:load('tfp_tab')||'quotes'};\nvar app=document.getElementById('app');\nvar picker=document.getElementById('picker');\nvar pickStage='after';\n\n/* ---------- helpers ---------- */\nfunction esc(s){return String(s==null?'':s).replace(/[&<>\"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'}[c];});}\nfunction img(id,w){return S.prev[id]||('https://lh3.googleusercontent.com/d/'+encodeURIComponent(id)+'=w'+(w||400));}\nfunction store(k,v){try{if(v==null)localStorage.removeItem(k);else localStorage.setItem(k,v);}catch(e){}}\nfunction load(k){try{return localStorage.getItem(k);}catch(e){return null;}}\nfunction month(d){if(!d)return'';var m=String(d).split('-');var names=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];return (names[(+m[1]||1)-1]||'')+' '+m[0];}\nfunction thisMonth(){var d=new Date();return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2);}\nfunction job(){for(var i=0;i<S.jobs.length;i++)if(S.jobs[i].id===S.jobId)return S.jobs[i];return null;}\nfunction sortJobs(){S.jobs.sort(function(a,b){return String(b.date).localeCompare(String(a.date))||String(b.created||'').localeCompare(String(a.created||''));});}\nfunction coverOf(j){\n  if(j.coverId&&j.photos.some(function(p){return p.id===j.coverId;}))return j.coverId;\n  var a=j.photos.filter(function(p){return p.stage==='after';});\n  return a.length?a[0].id:(j.photos.length?j.photos[j.photos.length-1].id:'');\n}\nfunction photosOf(j,stage){return j.photos.filter(function(p){return p.stage===stage;});}\n\nfunction call(method,args){\n  return new Promise(function(res,rej){\n    if(!(window.google&&google.script&&google.script.run)){rej(new Error('Open this app from its Google link.'));return;}\n    google.script.run\n      .withSuccessHandler(function(s){var r;try{r=JSON.parse(s);}catch(e){rej(new Error('Unexpected reply from Google.'));return;}\n        if(r.ok)res(r.data);else if(r.error==='WRONG_PASSCODE'){logout('That passcode didn\u2019t work.');rej(new Error('Wrong passcode'));}else rej(new Error(r.error));})\n      .withFailureHandler(function(e){rej(new Error((e&&e.message)||'No connection. Check your signal and try again.'));})\n      .api(JSON.stringify({pass:S.pass,method:method,args:args||{}}));\n  });\n}\n\nvar toastT;\nfunction toast(msg,err){\n  var old=document.querySelector('.toast');if(old)old.remove();\n  var t=document.createElement('div');t.className='toast'+(err?' err':'');t.textContent=msg;document.body.appendChild(t);\n  clearTimeout(toastT);toastT=setTimeout(function(){t.remove();},err?4500:2200);\n}\n\n/* ---------- views ---------- */\nfunction render(){\n  document.body.classList.remove('has-tabs');\n  if(S.view==='login')return renderLogin();\n  if(S.view==='loading'){app.innerHTML=bar('<div class=\"brand\">TEAM <b>FORTE</b></div>')+'<div class=\"loading\"><div class=\"spin dk\"></div></div>';return;}\n  if(S.tab!=='photos'){MAT.render();drawTabs();return;}\n  if(S.view==='job'&&job()){renderJob();drawTabs();return;}\n  S.view='home';renderHome();drawTabs();\n}\n\nvar TAB_ICONS={\n  jobs:'<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3\" y=\"4\" width=\"18\" height=\"18\" rx=\"2\"/><path d=\"M16 2v4M8 2v4M3 10h18\"/></svg>',\n  quotes:'<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z\"/><path d=\"M14 2v6h6M9 13h6M9 17h6\"/></svg>',\n  photos:ICON.cam,\n  money:'<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6\"/></svg>'\n};\nfunction drawTabs(){\n  document.body.classList.add('has-tabs');\n  var n=MAT.newCount();\n  var tabs=isCrew()?[['jobs','Jobs'],['photos','Photos']]:[['quotes','Quotes'],['photos','Photos'],['money','Spending']];\n  app.insertAdjacentHTML('beforeend','<nav class=\"tabs\" aria-label=\"Sections\"><div class=\"in2\">'+\n    tabs.map(function(t){\n      return '<button class=\"tab'+(S.tab===t[0]?' on':'')+'\" data-act=\"tab\" data-v=\"'+t[0]+'\"'+(S.tab===t[0]?' aria-current=\"page\"':'')+'>'+TAB_ICONS[t[0]]+t[1]+(t[0]==='quotes'&&n?'<span class=\"dot\">'+n+'</span>':'')+'</button>';\n    }).join('')+'</div></nav>');\n}\n\nfunction bar(inner){return '<div class=\"bar\"><div class=\"wrap\">'+inner+'</div></div>';}\n\nfunction renderLogin(msg){\n  app.innerHTML='<div class=\"login\"><div class=\"box\">'+\n    '<div class=\"logo\">TEAM <b>FORTE</b></div><p>Quotes, materials &amp; website photos</p>'+\n    '<form id=\"lf\"><input class=\"in\" id=\"pc\" type=\"password\" inputmode=\"text\" autocomplete=\"current-password\" placeholder=\"Passcode\" aria-label=\"Passcode\" required>'+\n    '<label class=\"remember\"><input type=\"checkbox\" id=\"rm\" checked> Keep me logged in on this phone</label>'+\n    '<button class=\"btn block\" id=\"lb\" type=\"submit\">Log in</button><div class=\"err\" id=\"le\">'+esc(msg||'')+'</div></form></div></div>';\n  var f=document.getElementById('lf');\n  f.onsubmit=function(e){e.preventDefault();\n    var pc=document.getElementById('pc').value.trim();if(!pc)return;\n    var b=document.getElementById('lb');b.disabled=true;b.innerHTML='<div class=\"spin\"></div>';\n    S.pass=pc;\n    call('ping').then(function(){\n      if(document.getElementById('rm').checked)store('tfp_pass',pc);\n      boot();\n    }).catch(function(err){\n      if(err.message!=='Wrong passcode')renderLogin(err.message);\n    });\n  };\n}\n\nfunction logout(msg){S.pass='';store('tfp_pass',null);S.view='login';MAT.reset();render();if(msg){var le=document.getElementById('le');if(le)le.textContent=msg;}}\n\nfunction isCrew(){return S.user&&S.user.role==='crew';}\nfunction boot(){\n  S.view='loading';render();\n  return call('ping').then(function(p){\n    S.user=p.user||{name:'Owner',role:'owner'};\n    var ok=isCrew()?['jobs','photos']:['quotes','photos','money'];\n    if(ok.indexOf(S.tab)<0)S.tab=ok[0];\n    return Promise.all([call('list'),isCrew()?MAT.loadCrew():MAT.load()]);\n  }).then(function(r){var d=r[0];S.jobs=d.jobs||[];if(d.url)EXEC_URL=d.url;sortJobs();if(S.view==='loading')S.view='home';render();})\n    .catch(function(e){if(S.view!=='login'){S.view='home';render();toast(e.message,true);}});\n}\n\nfunction renderHome(){\n  var list=S.jobs.filter(function(j){return S.filter==='All'||j.service===S.filter;});\n  var live=S.jobs.filter(function(j){return j.published&&j.photos.length;}).length;\n  var home=S.jobs.filter(function(j){return j.published&&j.featured&&j.photos.length;}).length;\n  var photos=S.jobs.reduce(function(n,j){return n+j.photos.length;},0);\n  var h=bar('<div class=\"brand\">TEAM <b>FORTE</b> PHOTOS</div><button class=\"link\" data-act=\"logout\">Log out</button>')+\n    '<div class=\"wrap\">'+\n    '<div class=\"stats\"><div class=\"stat\"><b>'+live+'</b><span>On website</span></div><div class=\"stat\"><b>'+home+'</b><span>On homepage</span></div><div class=\"stat\"><b>'+photos+'</b><span>Photos</span></div></div>'+\n    '<button class=\"btn block mt\" data-act=\"new\">'+ICON.plus+'New job</button>'+\n    '<div class=\"chips mt\">'+['All'].concat(SERVICES).map(function(s){return '<button class=\"chip'+(S.filter===s?' on':'')+'\" data-act=\"filter\" data-v=\"'+s+'\">'+s+'</button>';}).join('')+'</div>';\n  if(!list.length){\n    h+='<div class=\"empty\"><b>'+(S.jobs.length?'No '+esc(S.filter.toLowerCase())+' jobs yet':'No jobs yet')+'</b>Tap \u201cNew job\u201d, then add before, during and after photos.</div>';\n  }else{\n    h+='<div class=\"jobs\">'+list.map(function(j){\n      var c=coverOf(j);\n      var meta=[j.service,j.town,month(j.date)].filter(Boolean).join(' \u00b7 ');\n      var pills=(j.published&&j.photos.length?'<span class=\"pill live\">On website</span>':'<span class=\"pill\">'+(j.photos.length?'Hidden':'No photos yet')+'</span>')+\n        (j.featured?'<span class=\"pill home\">\u2605 Homepage</span>':'')+'<span class=\"pill\">'+j.photos.length+' photo'+(j.photos.length===1?'':'s')+'</span>';\n      return '<button class=\"job\" data-act=\"open\" data-id=\"'+esc(j.id)+'\"><div class=\"th\"'+(c?' style=\"background-image:url(\\''+esc(img(c,300))+'\\')\"':'')+'>'+(c?'':ICON.cam)+'</div>'+\n        '<div class=\"info\"><div class=\"t\">'+esc(j.title)+'</div><div class=\"m\">'+esc(meta)+'</div><div class=\"pills\">'+pills+'</div></div><span class=\"chev\">'+ICON.chev+'</span></button>';\n    }).join('')+'</div>';\n  }\n  if(EXEC_URL&&EXEC_URL.indexOf('__')!==0)h+='<div class=\"foot\"><a href=\"'+esc(EXEC_URL)+'?r=preview\" target=\"_blank\" rel=\"noopener\">See the website gallery \u2192</a></div>';\n  h+='</div>';\n  app.innerHTML=h;\n}\n\nfunction renderJob(){\n  var j=job();\n  var c=coverOf(j);\n  var h=bar('<button class=\"back\" data-act=\"home\">'+ICON.back+'Jobs</button><div class=\"bar-title\">'+esc(j.title)+'</div>')+'<div class=\"wrap\">';\n  h+='<div class=\"card\">'+\n    tog('published','Show on website',j.photos.length?'Appears in the Our Work gallery':'Add a photo first. Then it will appear',j.published)+\n    tog('featured','Show on homepage','Also appears in the homepage gallery',j.featured)+\n    '</div>';\n  h+='<div class=\"card\"><h2>Photos <small>Tap a photo to edit</small></h2>';\n  STAGES.forEach(function(st){\n    var list=photosOf(j,st[0]);\n    h+='<div class=\"stage\"><div class=\"stage-h\"><b>'+st[1]+'</b><span>'+list.length+' photo'+(list.length===1?'':'s')+'</span></div><div class=\"grid\">'+\n      list.map(function(p){return '<button class=\"ph\" data-act=\"photo\" data-id=\"'+esc(p.id)+'\" aria-label=\"'+st[1]+' photo\"><img loading=\"lazy\" src=\"'+esc(img(p.id,400))+'\" alt=\"\">'+(p.id===c?'<span class=\"star\">COVER</span>':'')+(p.caption?'<span class=\"cap\">'+esc(p.caption)+'</span>':'')+'</button>';}).join('')+\n      '<button class=\"add\" data-act=\"add\" data-stage=\"'+st[0]+'\">'+ICON.cam+'Add '+st[1].toLowerCase()+'</button></div></div>';\n  });\n  h+='</div>';\n  h+='<div class=\"card\"><h2>Job details</h2><form id=\"jf\">'+detailFields(j)+\n    '<button class=\"btn dark block mt\" type=\"submit\">Save details</button></form></div>';\n  if(j.folderUrl)h+='<a class=\"drive\" href=\"'+esc(j.folderUrl)+'\" target=\"_blank\" rel=\"noopener\">'+ICON.folder+'Open this job\u2019s folder in Google Drive</a>';\n  if(!isCrew())h+='<button class=\"btn danger block mt\" data-act=\"deljob\">Delete this job</button>';\n  h+='</div>';\n  app.innerHTML=h;\n  document.getElementById('jf').onsubmit=function(e){e.preventDefault();saveDetails(this);};\n  wireService(document.getElementById('jf'));\n}\n\nfunction tog(key,title,sub,on){\n  return '<div class=\"toggle\"><div class=\"tl\"><b>'+title+'</b><span>'+sub+'</span></div><button class=\"sw'+(on?' on':'')+'\" role=\"switch\" aria-checked=\"'+(on?'true':'false')+'\" aria-label=\"'+title+'\" data-act=\"tog\" data-k=\"'+key+'\"></button></div>';\n}\n\nfunction detailFields(j){\n  j=j||{service:S.filter!=='All'?S.filter:'Roofing',date:thisMonth()};\n  var svc=j.service||'Roofing';\n  return '<label class=\"f\">Service</label><div class=\"seg\" id=\"svc\">'+SERVICES.map(function(s){return '<button type=\"button\" class=\"'+(s===svc?'on':'')+'\" data-svc=\"'+s+'\">'+s+'</button>';}).join('')+'</div>'+\n    '<input type=\"hidden\" name=\"service\" value=\"'+esc(svc)+'\">'+\n    '<label class=\"f\">What was the job?</label><input class=\"in\" name=\"title\" list=\"titles\" maxlength=\"120\" placeholder=\"e.g. Full roof replacement\" value=\"'+esc(j.title||'')+'\" required>'+\n    '<datalist id=\"titles\">'+(TITLES[svc]||[]).map(function(t){return '<option value=\"'+esc(t)+'\">';}).join('')+'</datalist>'+\n    '<div class=\"row\"><div><label class=\"f\">Town</label><input class=\"in\" name=\"town\" maxlength=\"60\" placeholder=\"e.g. Hartford\" value=\"'+esc(j.town||'')+'\"></div>'+\n    '<div><label class=\"f\">Month</label><input class=\"in\" type=\"month\" name=\"date\" value=\"'+esc(j.date||thisMonth())+'\"></div></div>'+\n    '<label class=\"f\">Street address <small>(private, never shown on the website)</small></label><input class=\"in\" name=\"address\" maxlength=\"120\" placeholder=\"Optional\" value=\"'+esc(j.address||'')+'\">'+\n    '<label class=\"f\">Short description <small>(optional, shown on the website)</small></label><textarea class=\"in\" name=\"description\" maxlength=\"600\" placeholder=\"e.g. Tore off two layers, replaced rotted decking, new architectural shingles and ridge vent.\">'+esc(j.description||'')+'</textarea>';\n}\n\nfunction wireService(form){\n  var seg=form.querySelector('#svc');if(!seg)return;\n  seg.onclick=function(e){var b=e.target.closest('button[data-svc]');if(!b)return;\n    seg.querySelectorAll('button').forEach(function(x){x.classList.toggle('on',x===b);});\n    form.elements.service.value=b.getAttribute('data-svc');\n    var dl=form.querySelector('#titles');if(dl)dl.innerHTML=(TITLES[b.getAttribute('data-svc')]||[]).map(function(t){return '<option value=\"'+esc(t)+'\">';}).join('');\n  };\n}\n\nfunction formData(f){return{service:f.elements.service.value,title:f.elements.title.value,town:f.elements.town.value,date:f.elements.date.value,address:f.elements.address.value,description:f.elements.description.value};}\n\nfunction saveDetails(f){\n  var j=job();var b=f.querySelector('button[type=submit]');b.disabled=true;b.textContent='Saving\u2026';\n  var d=formData(f);d.id=j.id;\n  call('saveJob',d).then(function(r){merge(r);toast('Saved');render();})\n    .catch(function(e){b.disabled=false;b.textContent='Save details';toast(e.message,true);});\n}\n\nfunction merge(r){\n  for(var i=0;i<S.jobs.length;i++)if(S.jobs[i].id===r.id){S.jobs[i]=r;sortJobs();return;}\n  S.jobs.push(r);sortJobs();\n}\n\n/* ---------- sheets ---------- */\nfunction sheet(html,onClose){\n  closeSheet();\n  var ov=document.createElement('div');ov.className='ov';ov.id='ov';\n  ov.innerHTML='<div class=\"sheet\" role=\"dialog\" aria-modal=\"true\"><div class=\"grab\"></div>'+html+'</div>';\n  ov.addEventListener('click',function(e){if(e.target===ov||e.target.closest('[data-close]')){closeSheet();if(onClose)onClose();}});\n  document.body.appendChild(ov);document.body.style.overflow='hidden';\n  return ov;\n}\nfunction closeSheet(){var o=document.getElementById('ov');if(o)o.remove();document.body.style.overflow='';}\nfunction closeBtn(){return '<button class=\"x\" data-close aria-label=\"Close\">'+ICON.x+'</button>';}\n\nfunction confirmBox(title,text,okLabel){\n  return new Promise(function(res){\n    var ov=sheet('<h3>'+esc(title)+closeBtn()+'</h3><p class=\"sub\">'+esc(text)+'</p><div class=\"acts\"><button class=\"btn ghost\" data-close>Cancel</button><button class=\"btn\" id=\"cok\" style=\"background:#C62828\">'+esc(okLabel)+'</button></div>',function(){res(false);});\n    ov.querySelector('#cok').onclick=function(){closeSheet();res(true);};\n  });\n}\n\nfunction newJobSheet(){\n  var ov=sheet('<h3>New job'+closeBtn()+'</h3><form id=\"nf\">'+detailFields(null)+'<button class=\"btn block mt\" type=\"submit\">Create job &amp; add photos</button></form>');\n  var f=ov.querySelector('#nf');wireService(f);\n  f.onsubmit=function(e){e.preventDefault();\n    var b=f.querySelector('button[type=submit]');b.disabled=true;b.textContent='Creating\u2026';\n    call('saveJob',formData(f)).then(function(r){merge(r);closeSheet();S.jobId=r.id;S.view='job';render();window.scrollTo(0,0);toast('Job created. Now add photos.');})\n      .catch(function(err){b.disabled=false;b.textContent='Create job & add photos';toast(err.message,true);});\n  };\n}\n\nfunction photoSheet(id){\n  var j=job();var p=null;j.photos.forEach(function(x){if(x.id===id)p=x;});if(!p)return;\n  var group=photosOf(j,p.stage);var idx=group.indexOf(p);\n  var isCover=coverOf(j)===p.id;\n  var ov=sheet('<h3>Photo'+closeBtn()+'</h3>'+\n    '<img class=\"big\" src=\"'+esc(img(p.id,1200))+'\" alt=\"\">'+\n    '<label class=\"f mt\">Stage</label><div class=\"seg\" id=\"stg\">'+STAGES.map(function(s){return '<button type=\"button\" class=\"'+(s[0]===p.stage?'on':'')+'\" data-st=\"'+s[0]+'\">'+s[1]+'</button>';}).join('')+'</div>'+\n    '<label class=\"f\">Caption <small>(optional)</small></label><div class=\"row\"><input class=\"in\" id=\"cap\" maxlength=\"160\" placeholder=\"e.g. Rotted decking found under old shingles\" value=\"'+esc(p.caption||'')+'\"><button class=\"btn dark\" id=\"capb\" style=\"flex:0 0 auto\">Save</button></div>'+\n    '<div class=\"acts\">'+\n      '<button class=\"btn ghost\" id=\"mvl\"'+(idx<=0?' disabled':'')+'>\u2190 Move earlier</button>'+\n      '<button class=\"btn ghost\" id=\"mvr\"'+(idx>=group.length-1?' disabled':'')+'>Move later \u2192</button>'+\n      '<button class=\"btn ghost\" id=\"cov\"'+(isCover?' disabled':'')+'>'+(isCover?'\u2605 Cover photo':'\u2605 Make cover photo')+'</button>'+\n      (isCrew()?'<span></span>':'<button class=\"btn danger\" id=\"del\">Delete photo</button>')+\n    '</div><p class=\"hint\">The cover photo is the one shown on the website card for this job.</p>');\n  function after(r,msg){var k=j.photos.indexOf(p);if(r&&k>=0)j.photos[k]=Object.assign(p,{stage:r.stage||p.stage,caption:r.caption!=null?r.caption:p.caption});resort(j);render();if(msg)toast(msg);}\n  ov.querySelector('#stg').onclick=function(e){var b=e.target.closest('button[data-st]');if(!b||b.classList.contains('on'))return;\n    var st=b.getAttribute('data-st');\n    call('updatePhoto',{id:p.id,stage:st}).then(function(r){p.stage=r.stage;p._o=Date.now();after(r,'Moved to '+st);photoSheet(p.id);}).catch(function(e2){toast(e2.message,true);});\n  };\n  ov.querySelector('#capb').onclick=function(){var v=ov.querySelector('#cap').value;\n    call('updatePhoto',{id:p.id,caption:v}).then(function(r){closeSheet();after(r,'Caption saved');}).catch(function(e2){toast(e2.message,true);});\n  };\n  function mv(dir){call('movePhoto',{id:p.id,dir:dir}).then(function(){\n      var g=photosOf(j,p.stage);var i=g.indexOf(p),k=i+dir;if(k<0||k>=g.length)return;\n      var a=j.photos.indexOf(g[i]),b2=j.photos.indexOf(g[k]);var t=j.photos[a];j.photos[a]=j.photos[b2];j.photos[b2]=t;\n      render();photoSheet(p.id);\n    }).catch(function(e2){toast(e2.message,true);});}\n  ov.querySelector('#mvl').onclick=function(){mv(-1);};\n  ov.querySelector('#mvr').onclick=function(){mv(1);};\n  ov.querySelector('#cov').onclick=function(){\n    call('saveJob',{id:j.id,coverId:p.id}).then(function(r){merge(r);closeSheet();render();toast('Cover photo set');}).catch(function(e2){toast(e2.message,true);});\n  };\n  if(ov.querySelector('#del'))ov.querySelector('#del').onclick=function(){\n    confirmBox('Delete this photo?','It will be removed from the website and moved to the trash in Google Drive.','Delete').then(function(ok){\n      if(!ok){photoSheet(p.id);return;}\n      call('deletePhoto',{id:p.id}).then(function(){j.photos=j.photos.filter(function(x){return x.id!==p.id;});if(j.coverId===p.id)j.coverId='';render();toast('Photo deleted');})\n        .catch(function(e2){toast(e2.message,true);});\n    });\n  };\n}\n\nfunction resort(j){\n  var rank={before:0,during:1,after:2};\n  j.photos.forEach(function(p,i){p._i=p._o?1e9+p._o:i;});\n  j.photos.sort(function(a,b){return (rank[a.stage]-rank[b.stage])||(a._i-b._i);});\n  j.photos.forEach(function(p){delete p._i;delete p._o;});\n}\n\n/* ---------- uploads ---------- */\nfunction shrink(file){\n  return new Promise(function(res,rej){\n    var url=URL.createObjectURL(file);var im=new Image();\n    im.onload=function(){\n      try{\n        var w=im.naturalWidth,h=im.naturalHeight,max=2000,s=Math.min(1,max/Math.max(w,h));\n        var cw=Math.round(w*s),ch=Math.round(h*s);\n        var cv=document.createElement('canvas');cv.width=cw;cv.height=ch;\n        var cx=cv.getContext('2d');cx.fillStyle='#fff';cx.fillRect(0,0,cw,ch);cx.drawImage(im,0,0,cw,ch);\n        var full=cv.toDataURL('image/jpeg',0.82);\n        var ts=Math.min(1,500/Math.max(cw,ch));var tv=document.createElement('canvas');tv.width=Math.round(cw*ts);tv.height=Math.round(ch*ts);\n        tv.getContext('2d').drawImage(cv,0,0,tv.width,tv.height);\n        URL.revokeObjectURL(url);\n        res({base64:full.split(',')[1],width:cw,height:ch,thumb:tv.toDataURL('image/jpeg',0.8)});\n      }catch(e){URL.revokeObjectURL(url);rej(e);}\n    };\n    im.onerror=function(){URL.revokeObjectURL(url);rej(new Error('Couldn\u2019t read '+(file.name||'that photo')+'. Try a JPG.'));};\n    im.src=url;\n  });\n}\n\nfunction upload(files,stage){\n  var j=job();if(!j||!files.length)return;\n  var list=Array.prototype.slice.call(files,0,30);\n  S.upload={total:list.length,done:0,failed:0};drawProg();\n  var errs=[];\n  var seq=Promise.resolve();\n  list.forEach(function(file){\n    seq=seq.then(function(){\n      return shrink(file).then(function(sh){\n        return call('uploadPhoto',{jobId:j.id,stage:stage,base64:sh.base64,mime:'image/jpeg',width:sh.width,height:sh.height}).then(function(p){\n          S.prev[p.id]=sh.thumb;\n          j.photos.push({id:p.id,stage:p.stage,caption:p.caption,w:p.width,h:p.height});resort(j);\n        });\n      }).catch(function(e){S.upload.failed++;errs.push(e.message);})\n      .then(function(){S.upload.done++;drawProg();if(S.view==='job')renderKeepScroll();});\n    });\n  });\n  seq.then(function(){\n    var u=S.upload;S.upload=null;drawProg();\n    if(u.failed)toast(u.failed+' of '+u.total+' didn\u2019t upload: '+errs[0],true);\n    else toast(u.total+' photo'+(u.total===1?'':'s')+' added'+(j.published?'. Live on the website.':'.'));\n  });\n}\n\nfunction renderKeepScroll(){var y=window.scrollY;render();window.scrollTo(0,y);}\n\nfunction drawProg(){\n  var el=document.getElementById('prog');\n  if(!S.upload){if(el)el.remove();return;}\n  if(!el){el=document.createElement('div');el.id='prog';el.className='prog';document.body.appendChild(el);}\n  var u=S.upload,n=Math.min(u.done+1,u.total);\n  el.innerHTML='<div class=\"wrap\"><div class=\"l\"><span>'+(u.done<u.total?'Uploading '+n+' of '+u.total+'\u2026':'Finishing\u2026')+'</span><span>'+Math.round(u.done/u.total*100)+'%</span></div><div class=\"track\"><div class=\"fill\" style=\"width:'+Math.max(4,u.done/u.total*100)+'%\"></div></div></div>';\n}\n\npicker.addEventListener('change',function(){var f=picker.files;if(f&&f.length)upload(f,pickStage);picker.value='';});\n\n/* ---------- events ---------- */\napp.addEventListener('click',function(e){\n  var m=e.target.closest('[data-m]');if(m){MAT.click(m,e);return;}\n  var t=e.target.closest('[data-act]');if(!t)return;\n  var a=t.getAttribute('data-act');\n  if(a==='tab'){S.tab=t.getAttribute('data-v');store('tfp_tab',S.tab);if(S.tab==='photos')S.view='home';MAT.home();render();window.scrollTo(0,0);return;}\n  if(a==='logout'){logout('');return;}\n  if(a==='new'){newJobSheet();return;}\n  if(a==='filter'){S.filter=t.getAttribute('data-v');render();return;}\n  if(a==='open'){S.jobId=t.getAttribute('data-id');S.view='job';render();window.scrollTo(0,0);return;}\n  if(a==='home'){S.view='home';render();window.scrollTo(0,0);return;}\n  if(a==='photo'){photoSheet(t.getAttribute('data-id'));return;}\n  if(a==='add'){if(S.upload){toast('Wait for the current upload to finish.');return;}pickStage=t.getAttribute('data-stage');picker.click();return;}\n  if(a==='tog'){\n    var j=job(),k=t.getAttribute('data-k'),v=!j[k],d={id:j.id};d[k]=v;\n    if(k==='featured'&&v&&!j.published){d.published=true;}\n    t.classList.toggle('on',v);\n    call('saveJob',d).then(function(r){merge(r);render();\n      toast(k==='published'?(v?'Showing on the website':'Hidden from the website'):(v?'Showing on the homepage':'Removed from the homepage'));\n    }).catch(function(err){t.classList.toggle('on',!v);toast(err.message,true);});\n    return;\n  }\n  if(a==='deljob'){\n    var jj=job();\n    confirmBox('Delete \u201c'+jj.title+'\u201d?','This removes the job and its '+jj.photos.length+' photo'+(jj.photos.length===1?'':'s')+' from the website and moves them to the trash in Google Drive.','Delete job').then(function(ok){\n      if(!ok)return;\n      call('deleteJob',{id:jj.id}).then(function(){S.jobs=S.jobs.filter(function(x){return x.id!==jj.id;});S.view='home';render();toast('Job deleted');})\n        .catch(function(err){toast(err.message,true);});\n    });\n  }\n});\n\n/* ================= Quotes, materials, orders, spending ================= */\nvar MAT=(function(){\n  var M={pricing:TAKEOFF.cleanPricing(null),est:null,repairs:{min:0,items:[]},inspections:[],tags:[],crewJobs:[],crewLoaded:false,execUrl:'',loaded:false,quotes:[],orders:[],prices:[],settings:{suppliers:[],abc:{}},owner:'',\n    view:'list',qid:null,qfilter:'new',money:'orders',mview:'home',draft:null};\n  var PK=TAKEOFF.PACKAGES;\n  var ST_LABEL={new:'New',approved:'Approved',ordered:'Ordered',done:'Done',archived:'Archived'};\n  var DELIVERY=[['OTR','Roof load'],['OTG','Ground drop'],['CPU','Pick up']];\n  var GEAR='<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z\"/></svg>';\n\n  /* ---------- helpers ---------- */\n  function money(n,cents){n=Number(n)||0;if(n<0)return '\\u2212'+money(-n,cents);return '$'+n.toLocaleString('en-US',{minimumFractionDigits:cents===false?0:2,maximumFractionDigits:cents===false?0:2});}\n  function k(n){n=Number(n)||0;return n>=1000?'$'+(Math.round(n/100)/10).toString().replace(/\\.0$/,'')+'k':money(n,false);}\n  function q(){for(var i=0;i<M.quotes.length;i++)if(M.quotes[i].id===M.qid)return M.quotes[i];return null;}\n  function priceMap(){var o={};M.prices.forEach(function(p){o[p.key]=p;});return o;}\n  function dateStr(iso){if(!iso)return'';var d=new Date(iso);if(isNaN(d))return String(iso).slice(0,10);return d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:d.getFullYear()===new Date().getFullYear()?undefined:'numeric'});}\n  function sqft(qq){return (qq.roofs||[]).reduce(function(n,r){return n+(Number(r.s)||0);},0);}\n  function range(qq,i){var r=(qq.ranges||[])[i];return r&&r[1]?money(r[0],false)+'\u2013'+money(r[1],false):'';}\n  function mid(qq,i){var r=(qq.ranges||[])[i];return r&&r[1]?Math.round((r[0]+r[1])/2/100)*100:0;}\n  function townOf(a){var p=String(a||'').split(',');return p.length>=3?p[p.length-2].trim():'';}\n  function parseAddr(a){var p=String(a||'').split(',').map(function(x){return x.trim();});var o={line1:p[0]||'',city:'',state:'CT',postal:''};\n    if(p.length>=3){o.city=p[p.length-2];var m=p[p.length-1].match(/([A-Z]{2})\\s*(\\d{5})?/i);if(m){o.state=m[1].toUpperCase();o.postal=m[2]||'';}}else if(p.length===2){o.city=p[1];}\n    return o;}\n  function orderSpend(o){return o.status==='Canceled'?0:(o.actualTotal!==''&&o.actualTotal!=null?Number(o.actualTotal):Number(o.total)||0);}\n  function lineTotal(l){return (Number(l.qty)||0)*(Number(l.price)||0);}\n  function addDays(n){var d=new Date();var added=0;while(added<n){d.setDate(d.getDate()+1);if(d.getDay()!==0&&d.getDay()!==6)added++;}return d.toISOString().slice(0,10);}\n  function mergeQ(r){for(var i=0;i<M.quotes.length;i++)if(M.quotes[i].id===r.id){M.quotes[i]=r;return r;}M.quotes.unshift(r);return r;}\n  function fresh(qq){\n    // keep line prices in step with the price list unless you typed a price for that job\n    var pm=priceMap();\n    return (qq.lines||[]).map(function(l){var p=pm[l.key];var c=Object.assign({},l);\n      if(p&&!l.custom){if(!l.priceManual)c.price=p.price;if(!l.itemManual){c.abcItem=p.abcItem;c.uom=p.uom;}c.name=p.name;c.unit=p.unit;}return c;});\n  }\n  function err(e){toast(e.message||String(e),true);}\n  function units(u,n){u=String(u||'');if(n===1||u==='each'||!u||/^[A-Z]+$/.test(u))return u;if(/(x|ch|sh|s)$/.test(u))return u+'es';return u+'s';}\n\n  function load(){return call('matList').then(function(d){M.quotes=d.quotes||[];M.orders=d.orders||[];M.prices=d.prices||[];M.settings=d.settings||M.settings;M.pricing=d.pricing||TAKEOFF.cleanPricing(null);M.owner=d.owner||'';M.repairs=d.repairs||M.repairs;M.inspections=d.inspections||[];M.tags=d.tags||[];M.execUrl=d.execUrl||'';M.loaded=true;})\n    .catch(function(e){M.loaded=false;toast(e.message,true);});}\n\n  /* ---------- router ---------- */\n  function renderMat(){\n    if(S.tab==='jobs')return renderCrew();\n    if(!M.loaded){\n      if(M.failed){app.innerHTML=bar('<div class=\"brand\">TEAM <b>FORTE</b></div>')+'<div class=\"wrap\"><div class=\"empty\"><b>Couldn\\u2019t load</b>Check your signal and try again.<div class=\"mt\"><button class=\"btn ghost\" data-m=\"retry\">Try again</button></div></div></div>';return;}\n      app.innerHTML=bar('<div class=\"brand\">TEAM <b>FORTE</b></div>')+'<div class=\"loading\"><div class=\"spin dk\"></div></div>';\n      if(!M.loading){M.loading=true;load().then(function(){M.loading=false;M.failed=!M.loaded;render();});}\n      return;\n    }\n    if(S.tab==='quotes'){if(M.view==='quote'&&q())return renderQuote();if(M.view==='new')return renderNew();if(M.view==='pricing')return renderPricing();M.view='list';return renderQuotes();}\n    if(M.mview==='settings')return renderSettings();\n    return renderMoney();\n  }\n\n  /* ---------- quotes list ---------- */\n  function renderQuotes(){\n    var counts={new:0,approved:0,ordered:0,done:0};\n    M.quotes.forEach(function(x){if(counts[x.status]!=null)counts[x.status]++;});\n    var list=M.quotes.filter(function(x){return x.status===M.qfilter;});\n    var warr=M.quotes.filter(function(x){return x.status==='done'&&!x.warrantyDone&&x.type!=='repair';}).length;\n    var dep=M.quotes.filter(function(x){return x.signedAt&&x.depositStatus==='requested';}).length;\n    var h=bar('<div class=\"brand\">QUOTES</div><button class=\"icon-btn\" data-m=\"pricing\" aria-label=\"Quote prices\">'+GEAR+'</button><button class=\"icon-btn\" data-m=\"newest\" style=\"margin-left:10px\">'+ICON.plus+'New estimate</button>')+'<div class=\"wrap\">'+\n      '<div class=\"chips mt\">'+[['new','New'],['approved','Approved'],['ordered','Ordered'],['done','Done']].map(function(f){\n        return '<button class=\"chip'+(M.qfilter===f[0]?' on':'')+'\" data-m=\"qf\" data-v=\"'+f[0]+'\">'+f[1]+(counts[f[0]]?' ('+counts[f[0]]+')':'')+'</button>';}).join('')+'<button class=\"chip\" data-m=\"colors\">Shingle colors</button></div>'+\n      (warr?'<div class=\"note\">'+warr+' finished job'+(warr===1?'':'s')+' still need'+(warr===1?'s':'')+' the warranty registered. See Done.</div>':'')+\n      (dep?'<div class=\"note\">'+dep+' signed job'+(dep===1?' is':'s are')+' waiting on a deposit.</div>':'');\n    if(!list.length){\n      h+='<div class=\"empty\"><b>'+(M.qfilter==='new'?'No new quotes':'Nothing here yet')+'</b>'+\n        (M.qfilter==='new'?'Quotes from the website\u2019s instant quote show up here on their own. You can also paste a quote link.':'Approve a quote to start its materials list.')+\n        (M.qfilter==='new'?'<div class=\"mt\"><button class=\"btn ghost\" data-m=\"addlink\">Paste a quote link</button></div>':'')+'</div>';\n    }else{\n      h+=list.map(function(x){\n        var pk=PK[x.pick];var pr=x.contractPrice?money(x.contractPrice,false):(x.pick>=0?range(x,x.pick):range(x,0));\n        return '<button class=\"q\" data-m=\"openq\" data-id=\"'+esc(x.id)+'\"><div class=\"top\"><div style=\"min-width:0\"><div class=\"nm\">'+esc(x.name||(x.source==='app'?'Customer':'Website visitor'))+'</div>'+\n          '<div class=\"ad\">'+esc(x.address||'')+'</div></div><div class=\"rg money\">'+esc(pr)+'</div></div>'+\n          '<div class=\"pills\"><span class=\"pill '+x.status+'\">'+ST_LABEL[x.status]+'</span>'+\n          (x.type==='repair'?'<span class=\"pill\">Repair \u00b7 '+(x.items||[]).length+' item'+((x.items||[]).length===1?'':'s')+'</span>':'<span class=\"pill\">'+Math.round(sqft(x)).toLocaleString()+' sq ft</span>')+\n          (x.signedAt?'<span class=\"pill done\">\u2713 Signed</span>':x.proposalSentAt?'<span class=\"pill\">Sent for signature</span>':'')+\n          (pk?'<span class=\"pill\">OC '+esc(pk.label)+(x.color?' \u00b7 '+esc(x.color):'')+'</span>':'')+\n          (x.lead&&x.lead.inspectionDay?'<span class=\"pill\" style=\"background:#FFE8E3;color:#B4321F\">Inspection requested</span>':'')+\n          '<span class=\"pill\">'+(x.source==='app'?'App estimate \u00b7 ':x.source==='website'?'Website \u00b7 ':'')+esc(x.id)+' \u00b7 '+dateStr(x.created)+'</span></div></button>';\n      }).join('');\n    }\n    app.innerHTML=h+'</div>';\n  }\n\n  function addLinkSheet(){\n    var ov=sheet('<h3>Add a quote'+closeBtn()+'</h3><p class=\"sub\">Paste the quote link from the customer\u2019s GoHighLevel contact (Quote Link field) or the quote email.</p>'+\n      '<textarea class=\"in\" id=\"ql\" placeholder=\"https://team-forte.com/quote#q=\u2026\" style=\"min-height:110px\"></textarea><button class=\"btn block mt\" id=\"qlb\">Add quote</button>');\n    ov.querySelector('#qlb').onclick=function(){var b=this;var v=ov.querySelector('#ql').value.trim();if(!v)return;b.disabled=true;b.textContent='Adding\u2026';\n      call('addQuote',{link:v}).then(function(r){mergeQ(r);closeSheet();M.qid=r.id;M.view='quote';M.qfilter=r.status;render();window.scrollTo(0,0);toast('Quote added');})\n        .catch(function(e){b.disabled=false;b.textContent='Add quote';err(e);});};\n  }\n\n  /* ---------- quote detail ---------- */\n  function renderQuote(){\n    var x=q();\n    var h=bar('<button class=\"back\" data-m=\"back\">'+ICON.back+'Quotes</button><div class=\"bar-title\">'+esc(x.name||x.id)+'</div>')+'<div class=\"wrap\">';\n    var rep=x.type==='repair';\n    h+='<div class=\"card\"><h2>'+esc(x.name||(x.source==='app'?'Customer':'Website visitor'))+' <span><span class=\"pill '+x.status+'\">'+ST_LABEL[x.status]+'</span> <button class=\"link\" style=\"color:var(--navy);font-size:13px;font-weight:700;padding:4px\" data-m=\"editcust\">Edit</button></span></h2>'+\n      (x.phone?kv('Phone','<a href=\"tel:'+esc(x.phone.replace(/[^\\d+]/g,''))+'\" target=\"_top\">'+esc(x.phone)+'</a>'):'')+\n      (x.email?kv('Email','<a href=\"mailto:'+esc(x.email)+'\" target=\"_top\">'+esc(x.email)+'</a>'):'')+\n      kv('Address','<a href=\"https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(x.address||(x.lat+','+x.lng))+'\" target=\"_blank\" rel=\"noopener\">'+esc(x.address||'Map')+'</a>')+\n      (x.lead?(x.lead.inspectionDay?kv('Inspection request','<b>'+esc(x.lead.inspectionDay+(x.lead.inspectionWindow?', '+x.lead.inspectionWindow:''))+'</b>'):'')+\n        (x.lead.package?kv('Picked',esc(x.lead.package+(x.lead.color?' \u00b7 '+x.lead.color:''))):'')+\n        (x.lead.timeline?kv('Timeline',esc(x.lead.timeline)):'')+(x.lead.layers?kv('Shingle layers',esc(x.lead.layers)):'')+\n        (x.lead.notes?kv('Notes',esc(x.lead.notes)):'')+(x.lead.smsUpdates?kv('Texts OK',esc(x.lead.smsUpdates)):''):'')+\n      kv('Quote',esc(x.id)+' \u00b7 '+dateStr(x.created))+\n      (x.roofs||[]).map(function(r){return kv(esc(r.n||'Roof'),Math.round(r.s).toLocaleString()+' sq ft \u00b7 '+esc(r.p||'pitch ?'));}).join('')+\n      (x.layers>1?kv('Layers to tear off',String(x.layers)):'')+\n      (x.link&&!rep?'<div class=\"acts\"><button class=\"btn\" data-m=\"share\">Send quote</button><a class=\"btn ghost\" href=\"'+esc(x.link)+'\" target=\"_blank\" rel=\"noopener\">View quote page</a></div>':'')+\n      ghlLine(x)+'</div>';\n    if(rep)h+=repairCard(x);\n    h+=proposalCard(x);\n    if(x.status==='new')h+=rep?approveRepairCard(x):approveCard(x);\n    else h+=scheduleCard(x)+profitCard(x)+jobCards(x);\n    h+=inspectionCard(x);\n    if(x.status==='done')h+=wrapCard(x);\n    h+='</div>';\n    app.innerHTML=h;\n    wireQuote(x);\n    var ds=document.getElementById('depseg');\n    if(ds)ds.onclick=function(e){var b=e.target.closest('[data-dep]');if(!b||b.classList.contains('on'))return;saveQ({depositStatus:b.getAttribute('data-dep')},b.getAttribute('data-dep')==='paid'?'Deposit marked paid':'Saved');};\n  }\n\n  function kv(a,b){return '<div class=\"kv\"><span>'+a+'</span><b>'+b+'</b></div>';}\n\n  function approveCard(x){\n    var pick=M.draft&&M.draft.id===x.id?M.draft.pick:(x.pick>=0?x.pick:1);\n    var price=M.draft&&M.draft.id===x.id?M.draft.price:(x.contractPrice||mid(x,pick));\n    return '<div class=\"card\"><h2>Approve job</h2>'+\n      '<label class=\"f\">Package</label><div class=\"pkg\" id=\"pkg\">'+PK.map(function(p,i){return '<button type=\"button\" class=\"'+(i===pick?'on':'')+'\" data-pk=\"'+i+'\"><b>'+p.label+'</b><span>'+(range(x,i)||'\u00a0')+'</span></button>';}).join('')+'</div>'+\n      '<div class=\"row\"><div><label class=\"f\">Color</label><input class=\"in\" id=\"qc\" maxlength=\"40\" value=\"'+esc(x.color||'')+'\" placeholder=\"e.g. Estate Gray\"></div>'+\n      '<div><label class=\"f\">Job price</label><input class=\"in money\" id=\"qp\" inputmode=\"decimal\" value=\"'+(price||'')+'\" placeholder=\"$\"></div></div>'+\n      '<p class=\"hint\">Approving builds the materials list from the quote\u2019s roof measurements and adds the job to Photos.</p>'+\n      '<button class=\"btn block mt\" data-m=\"approve\">Approve job &amp; build materials list</button>'+\n      '<button class=\"btn ghost block mt\" data-m=\"archive\">Not going ahead</button></div>';\n  }\n\n  function jobCards(x){\n    var ls=fresh(x);\n    var t=TAKEOFF.totals(ls,M.settings.taxRate);\n    var mine=M.orders.filter(function(o){return o.quoteId===x.id;});\n    var spent=mine.reduce(function(n,o){return n+orderSpend(o);},0);\n    var pct=x.contractPrice?Math.round(t.total/x.contractPrice*100):0;\n    var h='<div class=\"card\"><h2>Job <small>'+(x.type==='repair'?'Repair':'OC '+esc((PK[x.pick]||{}).label||'')+(x.color?' \u00b7 '+esc(x.color):''))+'</small></h2>'+\n      '<div class=\"row\"><div><span class=\"hint\">Job price</span><div class=\"big-n money\">'+(x.contractPrice?money(x.contractPrice,false):'\u2014')+'</div></div>'+\n      '<div><span class=\"hint\">Materials (est.)</span><div class=\"big-n money\">'+money(t.total,false)+'</div></div></div>'+\n      (x.contractPrice?'<div class=\"meter\" aria-label=\"Materials are '+pct+'% of the job price\"><div style=\"width:'+Math.min(100,pct)+'%\"></div></div><p class=\"hint\">Materials are about '+pct+'% of the job price'+(spent?' \u00b7 ordered so far: '+money(spent,false):'')+'</p>':'')+\n      '<div class=\"acts\"><button class=\"btn ghost\" data-m=\"editjob\">Edit price</button>'+\n      (x.photoJobId?'<button class=\"btn ghost\" data-m=\"photos\">Job photos</button>':'<span></span>')+'</div></div>';\n\n    var m=x.meas||{};var est=m.est||{};var skipMeas=x.type==='repair';\n    function f(key,label,unit){return '<div><label for=\"m_'+key+'\">'+label+(est[key]?'<i>est.</i>':'')+'</label><input class=\"in money\" id=\"m_'+key+'\" data-meas=\"'+key+'\" inputmode=\"numeric\" value=\"'+(m[key]!=null?m[key]:'')+'\"'+(unit?' aria-label=\"'+label+' in '+unit+'\"':'')+'></div>';}\n    if(!skipMeas)h+='<div class=\"card\"><h2>Roof measurements <small>'+(Object.keys(est).length?'Check the est. numbers on site':'')+'</small></h2><div class=\"meas\">'+\n      f('area','Roof area (sq ft)')+'<div><label>Pitch</label><input class=\"in\" data-meas=\"pitch\" value=\"'+esc(m.pitch||'')+'\"></div>'+\n      f('eaves','Eaves (ft)')+f('rakes','Rakes (ft)')+f('ridges','Ridges (ft)')+f('hips','Hips (ft)')+f('valleys','Valleys (ft)')+f('walls','Wall flashing (ft)')+\n      f('pipes','Pipe boots')+f('decking','Decking sheets')+f('waste','Waste %')+f('iceCourses','Ice & water rows at eaves')+'</div>'+\n      '<button class=\"btn dark block mt\" data-m=\"recalc\">Update materials list</button></div>';\n\n    h+='<div class=\"card\"><h2>Materials <small>'+ls.length+' items</small></h2><div id=\"lines\">';\n    var lastCat='';\n    ls.forEach(function(l,i){\n      if(l.cat!==lastCat){h+='<div class=\"cat\">'+esc(l.cat||'Other')+'</div>';lastCat=l.cat;}\n      h+='<button class=\"ln\" data-m=\"line\" data-i=\"'+i+'\"><div class=\"l1\"><b>'+esc(l.name)+(l.manual?'<em>edited</em>':'')+'</b><span class=\"money\">'+l.qty+' '+esc(units(l.unit,l.qty))+' \u00d7 '+money(l.price)+(l.abcItem?' \u00b7 #'+esc(l.abcItem):'')+'</span></div><div class=\"l2 money\">'+money(lineTotal(l))+'</div></button>';\n    });\n    h+='</div><button class=\"btn ghost block mt\" data-m=\"addline\">'+ICON.plus+'Add item</button>'+\n      '<div class=\"tot\">'+kv('Subtotal','<span class=\"money\">'+money(t.subtotal)+'</span>')+kv('Sales tax ('+(M.settings.taxRate||0)+'%)','<span class=\"money\">'+money(t.tax)+'</span>')+\n      '<div class=\"kv grand\"><span>Total</span><b class=\"money\">'+money(t.total)+'</b></div></div>'+\n      (M.prices.some(function(p){return p.source==='starter';})?'<div class=\"note\">Some prices are starter estimates. Update them under Spending \u203a Prices, or connect ABC Supply for your account prices.</div>':'')+\n      '<button class=\"btn block mt\" data-m=\"order\" data-v=\"abc\"'+(M.settings.abc&&M.settings.abc.connected?'':' disabled')+'>Order from ABC Supply</button>'+\n      (M.settings.abc&&M.settings.abc.connected?'':'<p class=\"hint\" style=\"text-align:center\">Connect ABC Supply in Spending \u203a Settings to order here.</p>')+\n      '<button class=\"btn ghost block mt\" data-m=\"order\" data-v=\"email\">Send order by email</button></div>';\n\n    if(mine.length){\n      h+='<div class=\"card\"><h2>Orders for this job</h2>'+mine.map(orderRow).join('')+'</div>';\n    }\n    h+='<div class=\"card\">'+kv('Status','<span class=\"pill '+x.status+'\">'+ST_LABEL[x.status]+'</span>')+\n      '<div class=\"acts\">'+(x.status!=='done'?'<button class=\"btn ghost\" data-m=\"status\" data-v=\"done\">Mark job done</button>':'<button class=\"btn ghost\" data-m=\"status\" data-v=\"approved\">Reopen</button>')+\n      '<button class=\"btn danger\" data-m=\"archive\">Archive</button></div></div>';\n    return h;\n  }\n\n  function wireQuote(x){\n    var pk=document.getElementById('pkg');\n    if(pk)pk.onclick=function(e){var b=e.target.closest('[data-pk]');if(!b)return;var i=+b.getAttribute('data-pk');\n      var priceEl=document.getElementById('qp');var cur=Number(priceEl.value)||0;var old=M.draft&&M.draft.id===x.id?M.draft.pick:(x.pick>=0?x.pick:1);\n      M.draft={id:x.id,pick:i,price:(!cur||cur===mid(x,old))?mid(x,i):cur};\n      var c=document.getElementById('qc').value;x.color=c;render();};\n  }\n\n  function readMeas(x){\n    var m=Object.assign({},x.meas||{});var est=Object.assign({},m.est||{});\n    document.querySelectorAll('[data-meas]').forEach(function(el){\n      var key=el.getAttribute('data-meas');\n      if(key==='pitch'){m.pitch=el.value.trim();return;}\n      var v=Number(String(el.value).replace(/[^\\d.]/g,''))||0;\n      if(m[key]!==v)delete est[key];\n      m[key]=v;\n    });\n    m.est=est;return m;\n  }\n\n  function saveQ(args,msg){\n    args.id=M.qid;\n    return call('saveQuote',args).then(function(r){mergeQ(r);render();if(msg)toast(msg);return r;}).catch(function(e){err(e);throw e;});\n  }\n\n  function approve(){\n    var x=q();var pick=M.draft&&M.draft.id===x.id?M.draft.pick:(x.pick>=0?x.pick:1);\n    var price=Number(String(document.getElementById('qp').value).replace(/[^\\d.]/g,''))||0;\n    var color=document.getElementById('qc').value.trim();\n    var m=TAKEOFF.estimate(x.roofs||[]);\n    m.waste=M.settings.waste!=null?M.settings.waste:m.waste;m.iceCourses=M.settings.iceCourses!=null?M.settings.iceCourses:m.iceCourses;\n    var ls=TAKEOFF.lines(m,pick,priceMap(),[]);\n    var b=document.querySelector('[data-m=approve]');if(b){b.disabled=true;b.textContent='Approving\u2026';}\n    saveQ({status:'approved',pick:pick,color:color,contractPrice:price,meas:m,lines:ls}).then(function(r){\n      M.draft=null;M.qfilter='approved';toast('Approved. Materials list is ready.');\n      call('list').then(function(d){S.jobs=d.jobs||[];}).catch(function(){});\n      return r;\n    }).catch(function(){if(b){b.disabled=false;b.textContent='Approve job & build materials list';}});\n  }\n\n  function recalc(){\n    var x=q();var m=readMeas(x);\n    var ls=TAKEOFF.lines(m,x.pick,priceMap(),x.lines);\n    saveQ({meas:m,lines:ls},'Materials list updated');\n  }\n\n  function lineSheet(i){\n    var x=q();var ls=fresh(x);var l=ls[i];if(!l)return;\n    var ov=sheet('<h3>'+esc(l.name)+closeBtn()+'</h3>'+\n      '<div class=\"row\"><div><label class=\"f\">Quantity ('+esc(units(l.unit,2))+')</label><input class=\"in money\" id=\"lq\" inputmode=\"numeric\" value=\"'+l.qty+'\"></div>'+\n      '<div><label class=\"f\">Price per '+esc(l.unit)+'</label><input class=\"in money\" id=\"lp\" inputmode=\"decimal\" value=\"'+l.price+'\"></div></div>'+\n      (l.calc!=null&&!l.custom?'<p class=\"hint\">Calculated: '+l.calc+' '+esc(l.unit)+'s from the roof measurements.</p>':'')+\n      '<p class=\"hint\">Changing the price here only affects this job. To change it for every job, edit it in Spending \u203a Prices.</p>'+\n      '<label class=\"f\">ABC item # for this job <small>(e.g. the shingle color)</small></label><div class=\"row\"><input class=\"in\" id=\"li\" maxlength=\"40\" value=\"'+esc(l.abcItem||'')+'\"><input class=\"in\" id=\"lu\" maxlength=\"10\" style=\"flex:0 0 84px\" placeholder=\"UOM\" value=\"'+esc(l.uom||'')+'\"></div>'+\n      (M.settings.abc&&M.settings.abc.connected?'<div class=\"row\" style=\"margin-top:8px\"><input class=\"in\" id=\"lsq\" value=\"'+esc(((x.color?x.color+' ':'')+(/^shingle_/.test(l.key)?((PK.filter(function(p){return p.key===l.key;})[0]||{}).label||''):l.key==='hip_ridge'?'ProEdge':l.name)).trim())+'\"><button class=\"btn dark\" id=\"lsb\" style=\"flex:0 0 auto\">Search ABC</button></div><div id=\"lsr\"></div>':'')+\n      '<div class=\"acts\">'+(l.manual||l.priceManual?'<button class=\"btn ghost\" id=\"lr\">Reset to calculated</button>':'<span></span>')+'<button class=\"btn danger\" id=\"ld\">Remove</button></div>'+\n      '<button class=\"btn block mt\" id=\"ls\">Save</button>');\n    ov.querySelector('#ls').onclick=function(){\n      var qty=Math.max(0,Math.round(Number(ov.querySelector('#lq').value)||0));var price=Math.max(0,Number(ov.querySelector('#lp').value)||0);\n      var nl=fresh(x);var it=nl[i];\n      if(qty!==it.qty){it.qty=qty;it.manual=!it.custom;}\n      if(price!==it.price){it.price=price;it.priceManual=true;}\n      var ni=ov.querySelector('#li').value.trim(),nu=ov.querySelector('#lu').value.trim();\n      if(ni!==(it.abcItem||'')||nu!==(it.uom||'')){it.abcItem=ni;it.uom=nu;it.itemManual=true;}\n      closeSheet();saveQ({lines:nl},'Saved');\n    };\n    var sb=ov.querySelector('#lsb');if(sb)sb.onclick=function(){\n      var r=ov.querySelector('#lsr');r.innerHTML='<div class=\"loading\" style=\"padding:16px\"><div class=\"spin dk\"></div></div>';\n      call('abcSearch',{q:ov.querySelector('#lsq').value}).then(function(items){\n        r.innerHTML=items.length?items.map(function(it){return '<button class=\"res\" data-it=\"'+esc(it.itemNumber)+'\" data-u=\"'+esc(it.uom)+'\"><b>'+esc(it.description)+'</b><span>#'+esc(it.itemNumber)+(it.uom?' \u00b7 '+esc(it.uom):'')+'</span></button>';}).join(''):'<p class=\"hint\">No matches.</p>';\n      }).catch(function(e){r.innerHTML='';err(e);});\n    };\n    ov.addEventListener('click',function(e){var b=e.target.closest('[data-it]');if(!b)return;ov.querySelector('#li').value=b.getAttribute('data-it');ov.querySelector('#lu').value=b.getAttribute('data-u');ov.querySelector('#lsr').innerHTML='';toast('Picked. Tap Save.');});\n    var r=ov.querySelector('#lr');if(r)r.onclick=function(){var nl=fresh(x);nl[i].manual=false;nl[i].priceManual=false;nl[i].itemManual=false;nl[i].qty=nl[i].calc;\n      var pm=priceMap();if(pm[nl[i].key])nl[i].price=pm[nl[i].key].price;closeSheet();saveQ({lines:TAKEOFF.lines(x.meas||{},x.pick,pm,nl)},'Reset');};\n    ov.querySelector('#ld').onclick=function(){var nl=fresh(x);\n      if(nl[i].custom)nl.splice(i,1);else{nl[i].qty=0;nl[i].manual=true;}\n      closeSheet();saveQ({lines:nl},'Removed');};\n  }\n\n  function addLineSheet(){\n    var x=q();var used={};(x.lines||[]).forEach(function(l){if(l.qty)used[l.key]=1;});\n    var opts=M.prices.filter(function(p){return !used[p.key];});\n    var ov=sheet('<h3>Add item'+closeBtn()+'</h3>'+\n      '<label class=\"f\">From your price list</label><select class=\"in\" id=\"ap\"><option value=\"\">Custom item\u2026</option>'+opts.map(function(p){return '<option value=\"'+esc(p.key)+'\">'+esc(p.name)+' ('+money(p.price)+'/'+esc(p.unit)+')</option>';}).join('')+'</select>'+\n      '<div id=\"cust\"><label class=\"f\">Item name</label><input class=\"in\" id=\"an\" maxlength=\"120\" placeholder=\"e.g. Skylight flashing kit\">'+\n      '<div class=\"row\"><div><label class=\"f\">Unit</label><input class=\"in\" id=\"au\" value=\"each\" maxlength=\"20\"></div><div><label class=\"f\">Price</label><input class=\"in money\" id=\"apr\" inputmode=\"decimal\" placeholder=\"0.00\"></div></div></div>'+\n      '<label class=\"f\">Quantity</label><input class=\"in money\" id=\"aq\" inputmode=\"numeric\" value=\"1\">'+\n      '<button class=\"btn block mt\" id=\"ab\">Add to list</button>');\n    var sel=ov.querySelector('#ap');sel.onchange=function(){ov.querySelector('#cust').style.display=sel.value?'none':'';};\n    ov.querySelector('#ab').onclick=function(){\n      var qty=Math.max(1,Math.round(Number(ov.querySelector('#aq').value)||1));var nl=fresh(x);var p=priceMap()[sel.value];\n      if(p){var ex=nl.filter(function(l){return l.key===p.key;})[0];\n        if(ex){ex.qty=qty;ex.manual=true;}else nl.push({key:p.key,cat:p.cat,name:p.name,unit:p.unit,qty:qty,calc:0,manual:true,price:p.price,abcItem:p.abcItem,uom:p.uom,custom:true});}\n      else{var nm=ov.querySelector('#an').value.trim();if(!nm){toast('Type the item name.',true);return;}\n        nl.push({key:'x'+Date.now().toString(36),cat:'Other',name:nm,unit:ov.querySelector('#au').value.trim()||'each',qty:qty,calc:0,manual:true,price:Number(ov.querySelector('#apr').value)||0,priceManual:true,abcItem:'',uom:'',custom:true});}\n      closeSheet();saveQ({lines:nl},'Item added');\n    };\n  }\n\n  function editJobSheet(){\n    var x=q();\n    var ov=sheet('<h3>Job'+closeBtn()+'</h3><label class=\"f\">Job price</label><input class=\"in money\" id=\"jp\" inputmode=\"decimal\" value=\"'+(x.contractPrice||'')+'\">'+\n      '<label class=\"f\">Shingle color</label><input class=\"in\" id=\"jc\" value=\"'+esc(x.color||'')+'\">'+\n      '<label class=\"f\">Package</label><div class=\"pkg\" id=\"jpk\">'+PK.map(function(p,i){return '<button type=\"button\" class=\"'+(i===x.pick?'on':'')+'\" data-pk=\"'+i+'\"><b>'+p.label+'</b></button>';}).join('')+'</div>'+\n      '<label class=\"f\">Notes</label><textarea class=\"in\" id=\"jn\">'+esc(x.notes||'')+'</textarea><button class=\"btn block mt\" id=\"js\">Save</button>');\n    var pick=x.pick;\n    ov.querySelector('#jpk').onclick=function(e){var b=e.target.closest('[data-pk]');if(!b)return;pick=+b.getAttribute('data-pk');ov.querySelectorAll('#jpk button').forEach(function(z){z.classList.toggle('on',z===b);});};\n    ov.querySelector('#js').onclick=function(){\n      var args={contractPrice:Number(ov.querySelector('#jp').value)||0,color:ov.querySelector('#jc').value,notes:ov.querySelector('#jn').value};\n      if(pick!==x.pick){\n        // swap the shingle line to the new package\n        var nl=(x.lines||[]).filter(function(l){return !/^shingle_/.test(l.key)||l.custom;});\n        args.pick=pick;args.lines=TAKEOFF.lines(x.meas||{},pick,priceMap(),nl);\n      }\n      closeSheet();saveQ(args,'Saved');\n    };\n  }\n\n  /* ---------- ordering ---------- */\n  function orderSheet(method){\n    var x=q();var ls=fresh(x).filter(function(l){return l.qty>0;});\n    var s=M.settings;var t=TAKEOFF.totals(ls,s.taxRate);var ad=parseAddr(x.address);\n    if(method==='email'&&!(s.suppliers||[]).length){toast('Add a supplier email first (Spending \u203a Settings).',true);return;}\n    var missing=method==='abc'?ls.filter(function(l){return !l.abcItem;}):[];\n    var ov=sheet('<h3>'+(method==='abc'?'Order from ABC Supply':'Send order by email')+closeBtn()+'</h3>'+\n      (method==='abc'?'<p class=\"sub\">'+esc(s.abc.branchName||('Branch '+s.abc.branch))+' \u00b7 account '+esc(s.abc.shipTo)+(s.abc.env==='sandbox'?' \u00b7 <b>TEST MODE</b>':'')+'</p>':\n        '<label class=\"f\">Supplier</label><select class=\"in\" id=\"os\">'+s.suppliers.map(function(p,i){return '<option value=\"'+i+'\">'+esc(p.name)+' ('+esc(p.email)+')</option>';}).join('')+'</select>')+\n      (method==='abc'&&x.color&&!missing.length?'<div class=\"note\">Check that the shingle and ridge cap item numbers are for <b>'+esc(x.color)+'</b>. You can set them per job by tapping the item.</div>':'')+\n      (missing.length?'<div class=\"note\">These items aren\u2019t linked to an ABC item number yet: '+esc(missing.map(function(l){return l.name;}).join(', '))+'. Link them in Spending \u203a Prices first.</div>':'')+\n      '<label class=\"f\">Delivery</label><div class=\"seg\" id=\"odl\">'+DELIVERY.map(function(d,i){return '<button type=\"button\" class=\"'+(i===0?'on':'')+'\" data-d=\"'+d[0]+'\">'+d[1]+'</button>';}).join('')+'</div>'+\n      '<div class=\"row\"><div><label class=\"f\">Date</label><input class=\"in\" type=\"date\" id=\"odd\" value=\"'+addDays(2)+'\"></div><div><label class=\"f\">PO</label><input class=\"in\" id=\"opo\" maxlength=\"20\" value=\"'+esc(x.id)+'\"></div></div>'+\n      '<label class=\"f\">Street</label><input class=\"in\" id=\"oa1\" value=\"'+esc(ad.line1)+'\">'+\n      '<div class=\"row\"><div style=\"flex:2\"><label class=\"f\">Town</label><input class=\"in\" id=\"oac\" value=\"'+esc(ad.city)+'\"></div><div><label class=\"f\">State</label><input class=\"in\" id=\"oas\" maxlength=\"2\" value=\"'+esc(ad.state)+'\"></div><div><label class=\"f\">ZIP</label><input class=\"in\" id=\"oaz\" inputmode=\"numeric\" maxlength=\"10\" value=\"'+esc(ad.postal)+'\"></div></div>'+\n      '<label class=\"f\">Notes for the driver <small>(optional)</small></label><input class=\"in\" id=\"on\" maxlength=\"255\" placeholder=\"e.g. Driveway on left, no roof load on garage\">'+\n      '<div class=\"tot mt\">'+kv(ls.length+' items','')+kv('Estimated total','<span class=\"money\">'+money(t.total)+'</span>')+'</div>'+\n      '<button class=\"btn block mt\" id=\"ogo\"'+(missing.length?' disabled':'')+'>'+(method==='abc'?'Place order with ABC':'Send order email')+'</button>');\n    var del='OTR';\n    ov.querySelector('#odl').onclick=function(e){var b=e.target.closest('[data-d]');if(!b)return;del=b.getAttribute('data-d');ov.querySelectorAll('#odl button').forEach(function(z){z.classList.toggle('on',z===b);});};\n    ov.querySelector('#ogo').onclick=function(){\n      var b=this;\n      var args={quoteId:x.id,method:method,lines:ls,deliveryService:del,deliveryDate:ov.querySelector('#odd').value,po:ov.querySelector('#opo').value,\n        address:{line1:ov.querySelector('#oa1').value,city:ov.querySelector('#oac').value,state:ov.querySelector('#oas').value,postal:ov.querySelector('#oaz').value},notes:ov.querySelector('#on').value};\n      if(method==='email')args.supplier=ov.querySelector('#os').value;\n      b.disabled=true;b.textContent=method==='abc'?'Placing order\u2026':'Sending\u2026';\n      call('placeOrder',args).then(function(o){\n        M.orders.unshift(o);if(x.status==='approved'||x.status==='new')x.status='ordered';closeSheet();render();\n        toast(method==='abc'?'Order sent to ABC. Confirmation '+o.confirmation:'Order emailed to '+o.supplier);\n      }).catch(function(e){b.disabled=false;b.textContent=method==='abc'?'Place order with ABC':'Send order email';err(e);});\n    };\n  }\n\n  function orderRow(o){\n    var qq=M.quotes.filter(function(x){return x.id===o.quoteId;})[0];\n    var actual=o.actualTotal!==''&&o.actualTotal!=null;\n    return '<button class=\"ln\" data-m=\"openo\" data-id=\"'+esc(o.id)+'\"><div class=\"l1\"><b>'+esc(qq?(qq.name||qq.id)+' \u00b7 '+townOf(qq.address):o.po)+'</b><span>'+esc(o.supplier)+' \u00b7 '+dateStr(o.created)+'</span></div>'+\n      '<div class=\"l2 money\">'+money(orderSpend(o))+(actual?'':'<small style=\"font-weight:600;color:var(--muted)\"> est.</small>')+'<span style=\"margin-top:4px\"><span class=\"pill '+esc(o.status.split(' ')[0])+'\">'+esc(o.status)+'</span></span></div></button>';\n  }\n\n  function orderDetail(id){\n    var o=M.orders.filter(function(z){return z.id===id;})[0];if(!o)return;\n    var statuses=['Sent','Requested','Scheduled','Delivered','Picked up','Backordered','Canceled'];\n    if(statuses.indexOf(o.status)<0)statuses.unshift(o.status);\n    var ov=sheet('<h3>Order '+esc(o.po)+closeBtn()+'</h3>'+\n      kv('Supplier',esc(o.supplier))+kv('Placed',dateStr(o.created))+(o.confirmation?kv('ABC confirmation',esc(o.confirmation)):'')+(o.orderNumber?kv('ABC order #',esc(o.orderNumber)):'')+\n      kv('Delivery',esc((DELIVERY.filter(function(d){return d[0]===o.deliveryService;})[0]||['',''])[1])+(o.deliveryDate?' \u00b7 '+esc(o.deliveryDate):''))+\n      kv('Estimated total','<span class=\"money\">'+money(o.total)+'</span>')+\n      '<div class=\"cat mt\">Items</div>'+o.lines.map(function(l){return '<div class=\"kv\"><span>'+esc(l.name)+'</span><b class=\"money\">'+l.qty+' '+esc(units(l.unit,l.qty))+'</b></div>';}).join('')+\n      '<label class=\"f\">Status</label><select class=\"in\" id=\"ost\">'+statuses.map(function(s){return '<option'+(s===o.status?' selected':'')+'>'+esc(s)+'</option>';}).join('')+'</select>'+\n      '<label class=\"f\">Invoice total <small>(what you actually paid, if different)</small></label><input class=\"in money\" id=\"oat\" inputmode=\"decimal\" placeholder=\"'+money(o.total)+'\" value=\"'+(o.actualTotal===''?'':o.actualTotal)+'\">'+\n      (o.method==='abc'?'<p class=\"hint\">ABC orders update on their own when the branch confirms, schedules or delivers.</p>':'')+\n      '<button class=\"btn block mt\" id=\"osv\">Save</button><button class=\"btn danger block mt\" id=\"odel\">Delete order record</button>');\n    ov.querySelector('#osv').onclick=function(){\n      call('saveOrder',{id:o.id,status:ov.querySelector('#ost').value,actualTotal:ov.querySelector('#oat').value}).then(function(r){\n        for(var i=0;i<M.orders.length;i++)if(M.orders[i].id===r.id)M.orders[i]=r;closeSheet();render();toast('Saved');}).catch(err);\n    };\n    ov.querySelector('#odel').onclick=function(){\n      confirmBox('Delete this order record?','This only removes it from your spending. It does not cancel the order with the supplier.','Delete').then(function(ok){\n        if(!ok)return;call('deleteOrder',{id:o.id}).then(function(){M.orders=M.orders.filter(function(z){return z.id!==o.id;});render();toast('Deleted');}).catch(err);});\n    };\n  }\n\n  /* ---------- spending ---------- */\n  function renderMoney(){\n    var now=new Date();var ym=now.toISOString().slice(0,7);var prev=new Date(now.getFullYear(),now.getMonth()-1,1);var pym=prev.getFullYear()+'-'+('0'+(prev.getMonth()+1)).slice(-2);\n    var sums={m:0,p:0,y:0};\n    M.orders.forEach(function(o){var c=String(o.created);var v=orderSpend(o);if(c.slice(0,7)===ym)sums.m+=v;if(c.slice(0,7)===pym)sums.p+=v;if(c.slice(0,4)===String(now.getFullYear()))sums.y+=v;});\n    var h=bar('<div class=\"brand\">SPENDING</div><button class=\"icon-btn\" data-m=\"settings\" aria-label=\"Settings\">'+GEAR+'</button>')+'<div class=\"wrap\">'+\n      '<div class=\"stats\"><div class=\"stat\"><b class=\"money\">'+k(sums.m)+'</b><span>This month</span></div><div class=\"stat\"><b class=\"money\">'+k(sums.p)+'</b><span>Last month</span></div><div class=\"stat\"><b class=\"money\">'+k(sums.y)+'</b><span>This year</span></div></div>'+\n      '<div class=\"seg mt\">'+[['orders','Orders'],['jobs','Jobs'],['prices','Prices']].map(function(t){return '<button class=\"'+(M.money===t[0]?'on':'')+'\" data-m=\"mtab\" data-v=\"'+t[0]+'\">'+t[1]+'</button>';}).join('')+'</div>';\n    if(M.money==='jobs'){h+=moneyJobs();}\n    else if(M.money==='orders'){\n      h+=M.orders.length?'<div class=\"card\">'+M.orders.map(orderRow).join('')+'</div>':'<div class=\"empty\"><b>No orders yet</b>Approve a quote, then order its materials from the Quotes tab.</div>';\n    }else{\n      var s=M.settings.abc||{};\n      h+=s.connected?'<div class=\"note ok\">ABC Supply prices'+(s.lastRefresh?' updated '+dateStr(s.lastRefresh)+' ('+esc(s.lastRefreshResult||'')+')':' not refreshed yet')+'. They refresh every morning.<div class=\"mt\"><button class=\"btn ghost\" data-m=\"refresh\">Refresh now</button></div></div>':\n        '<div class=\"note\">Prices marked <b>Starter</b> are rough estimates. Tap an item to enter your supplier\u2019s price, or connect ABC Supply (Settings) to keep prices updated on their own.</div>';\n      h+='<p class=\"hint\">Shingle and ridge cap item numbers depend on the color. Link your most common color here, and change it per job on the materials list.</p>';\n      var lastCat='';h+='<div class=\"card\">';\n      M.prices.slice().sort(function(a,b){return String(a.cat).localeCompare(String(b.cat));}).forEach(function(p){\n        if(p.cat!==lastCat){h+='<div class=\"cat\">'+esc(p.cat||'Other')+'</div>';lastCat=p.cat;}\n        var src=p.source==='abc'?'<span class=\"src abc\">ABC</span>':p.source==='starter'?'<span class=\"src starter\">Starter</span>':'<span class=\"src manual\">Yours</span>';\n        h+='<button class=\"ln\" data-m=\"price\" data-k=\"'+esc(p.key)+'\"><div class=\"l1\"><b>'+esc(p.name)+'</b><span>'+src+(p.abcItem?' \u00b7 ABC #'+esc(p.abcItem):'')+' \u00b7 '+dateStr(p.updated)+'</span></div><div class=\"l2 money\">'+money(p.price)+'<span>per '+esc(p.unit)+'</span></div></button>';\n      });\n      h+='</div><button class=\"btn ghost block\" data-m=\"price\" data-k=\"\">'+ICON.plus+'Add item</button>';\n    }\n    app.innerHTML=h+'</div>';\n  }\n\n  function priceSheet(key){\n    var p=M.prices.filter(function(z){return z.key===key;})[0]||{key:'',name:'',unit:'each',price:'',cat:'Other',abcItem:'',uom:''};\n    var conn=M.settings.abc&&M.settings.abc.connected;\n    var ov=sheet('<h3>'+(p.key?'Edit item':'New item')+closeBtn()+'</h3>'+\n      '<label class=\"f\">Name</label><input class=\"in\" id=\"pn\" maxlength=\"120\" value=\"'+esc(p.name)+'\">'+\n      '<div class=\"row\"><div><label class=\"f\">Price</label><input class=\"in money\" id=\"pp\" inputmode=\"decimal\" value=\"'+p.price+'\"></div><div><label class=\"f\">Per</label><input class=\"in\" id=\"pu\" maxlength=\"20\" value=\"'+esc(p.unit)+'\"></div></div>'+\n      '<label class=\"f\">Category</label><input class=\"in\" id=\"pc2\" maxlength=\"40\" value=\"'+esc(p.cat)+'\">'+\n      '<label class=\"f\">ABC Supply item # <small>(for ordering and live prices)</small></label><div class=\"row\"><input class=\"in\" id=\"pa\" maxlength=\"40\" value=\"'+esc(p.abcItem)+'\"><input class=\"in\" id=\"pum\" maxlength=\"10\" style=\"flex:0 0 84px\" placeholder=\"UOM\" value=\"'+esc(p.uom)+'\"></div>'+\n      (conn?'<label class=\"f\">Find in ABC catalog</label><div class=\"row\"><input class=\"in\" id=\"psq\" placeholder=\"e.g. Oakridge Estate Gray\"><button class=\"btn dark\" id=\"psb\" style=\"flex:0 0 auto\">Search</button></div><div id=\"psr\"></div>':'')+\n      '<button class=\"btn block mt\" id=\"psv\">Save</button>'+(p.key&&!TAKEOFF.CATALOG.some(function(c){return c.key===p.key;})?'<button class=\"btn danger block mt\" id=\"pdel\">Delete item</button>':''));\n    if(conn)ov.querySelector('#psb').onclick=function(){\n      var r=ov.querySelector('#psr');r.innerHTML='<div class=\"loading\" style=\"padding:16px\"><div class=\"spin dk\"></div></div>';\n      call('abcSearch',{q:ov.querySelector('#psq').value}).then(function(items){\n        r.innerHTML=items.length?items.map(function(it){return '<button class=\"res\" data-it=\"'+esc(it.itemNumber)+'\" data-u=\"'+esc(it.uom)+'\"><b>'+esc(it.description)+'</b><span>#'+esc(it.itemNumber)+(it.uom?' \u00b7 '+esc(it.uom):'')+'</span></button>';}).join(''):'<p class=\"hint\">No matches.</p>';\n      }).catch(function(e){r.innerHTML='';err(e);});\n    };\n    ov.addEventListener('click',function(e){var b=e.target.closest('[data-it]');if(!b)return;ov.querySelector('#pa').value=b.getAttribute('data-it');ov.querySelector('#pum').value=b.getAttribute('data-u');toast('Linked. Save to keep it.');});\n    ov.querySelector('#psv').onclick=function(){\n      var args={key:p.key||undefined,name:ov.querySelector('#pn').value,unit:ov.querySelector('#pu').value,cat:ov.querySelector('#pc2').value,abcItem:ov.querySelector('#pa').value,uom:ov.querySelector('#pum').value};\n      var np=Number(ov.querySelector('#pp').value);if(String(np)!==String(p.price))args.price=np;\n      call('savePrice',args).then(function(r){var f=false;for(var i=0;i<M.prices.length;i++)if(M.prices[i].key===r.key){M.prices[i]=r;f=true;}if(!f)M.prices.push(r);closeSheet();render();toast('Saved');}).catch(err);\n    };\n    var d=ov.querySelector('#pdel');if(d)d.onclick=function(){call('deletePrice',{key:p.key}).then(function(){M.prices=M.prices.filter(function(z){return z.key!==p.key;});closeSheet();render();toast('Deleted');}).catch(err);};\n  }\n\n  /* ---------- settings ---------- */\n  function renderSettings(){\n    var s=M.settings;var a=s.abc||{};\n    var h=bar('<button class=\"back\" data-m=\"mhome\">'+ICON.back+'Spending</button><div class=\"bar-title\">Settings</div>')+'<div class=\"wrap\"><form id=\"sf\">'+\n      '<div class=\"card\"><h2>Orders</h2>'+\n      '<div class=\"row\"><div><label class=\"f\">Delivery contact</label><input class=\"in\" name=\"contactName\" value=\"'+esc(s.contactName||'')+'\" placeholder=\"Your name\"></div>'+\n      '<div><label class=\"f\">Phone</label><input class=\"in\" name=\"contactPhone\" inputmode=\"tel\" value=\"'+esc(s.contactPhone||'')+'\" placeholder=\"(860) 854-9335\"></div></div>'+\n      '<div class=\"row\"><div><label class=\"f\">Sales tax %</label><input class=\"in money\" name=\"taxRate\" inputmode=\"decimal\" value=\"'+(s.taxRate!=null?s.taxRate:6.35)+'\"></div>'+\n      '<div><label class=\"f\">Waste %</label><input class=\"in money\" name=\"waste\" inputmode=\"numeric\" value=\"'+(s.waste!=null?s.waste:10)+'\"></div>'+\n      '<div><label class=\"f\">Ice &amp; water rows</label><input class=\"in money\" name=\"iceCourses\" inputmode=\"numeric\" value=\"'+(s.iceCourses!=null?s.iceCourses:2)+'\"></div></div>'+\n      '<p class=\"hint\">Ice &amp; water rows: how many 3 ft rows go along the eaves (2 rows = 6 ft).</p></div>'+\n      '<div class=\"card\"><h2>Supplier emails <small>for \u201cSend order by email\u201d</small></h2><div id=\"sups\">'+\n      (s.suppliers.length?s.suppliers:[{name:'',email:''}]).map(supRow).join('')+'</div><button type=\"button\" class=\"btn ghost block mt\" data-m=\"addsup\">'+ICON.plus+'Add supplier</button></div>'+\n      (isOwner()?'':'<!--')+'<div class=\"card\"><h2>ABC Supply <small>'+(a.connected?'<span class=\"pill done\">Connected</span>':'<span class=\"pill\">Not connected</span>')+'</small></h2>'+\n      '<p class=\"hint\">Get these from the ABC Supply developer portal (Individual Business). Start in Test (Sandbox), then switch to Live once ABC approves production access.</p>'+\n      '<label class=\"f\">Mode</label><div class=\"seg\" id=\"aenv\"><button type=\"button\" data-env=\"sandbox\" class=\"'+(a.env!=='production'?'on':'')+'\">Test (Sandbox)</button><button type=\"button\" data-env=\"production\" class=\"'+(a.env==='production'?'on':'')+'\">Live</button></div>'+\n      '<label class=\"f\">Client ID</label><input class=\"in\" name=\"clientId\" autocomplete=\"off\" value=\"'+esc(a.clientId||'')+'\">'+\n      '<label class=\"f\">Client secret</label><input class=\"in\" name=\"secret\" type=\"password\" autocomplete=\"new-password\" placeholder=\"'+(a.hasSecret?'Saved. Type to replace':'')+'\">'+\n      '<div class=\"row\"><div><label class=\"f\">Ship-to account #</label><input class=\"in\" name=\"shipTo\" value=\"'+esc(a.shipTo||'')+'\"></div>'+\n      '<div><label class=\"f\">Branch #</label><input class=\"in\" name=\"branch\" value=\"'+esc(a.branch||'')+'\"></div></div>'+\n      '<input type=\"hidden\" name=\"branchName\" value=\"'+esc(a.branchName||'')+'\">'+\n      (a.branchName?'<p class=\"hint\">Branch: '+esc(a.branchName)+'</p>':'')+\n      '<div class=\"acts\"><button type=\"button\" class=\"btn ghost\" data-m=\"abctest\">Test login</button><button type=\"button\" class=\"btn ghost\" data-m=\"branches\">Find CT branches</button></div><div id=\"brs\"></div>'+\n      (a.connected?'<div class=\"acts\"><button type=\"button\" class=\"btn ghost\" data-m=\"hook\"'+(a.webhookId?' disabled':'')+'>'+(a.webhookId?'Order updates on':'Turn on order updates')+'</button><button type=\"button\" class=\"btn danger\" data-m=\"disc\">Disconnect</button></div>':'')+\n      '</div>'+(isOwner()?'':'-->')+settingsExtraCards()+'<button class=\"btn block\" type=\"submit\">Save settings</button></form></div>';\n    app.innerHTML=h;\n    var env=a.env||'sandbox';\n    document.getElementById('sf').addEventListener('click',function(e){var b=e.target.closest('[data-sw]');if(!b)return;b.classList.toggle('on');b.setAttribute('aria-checked',b.classList.contains('on'));});\n    if(isOwner())loadPeople();\n    if(document.getElementById('aenv'))document.getElementById('aenv').onclick=function(e){var b=e.target.closest('[data-env]');if(!b)return;env=b.getAttribute('data-env');this.querySelectorAll('button').forEach(function(z){z.classList.toggle('on',z===b);});};\n    document.getElementById('sf').onsubmit=function(e){e.preventDefault();saveSettings(this,env);};\n  }\n  function supRow(p){return '<div class=\"row sup\" style=\"margin-top:8px\"><input class=\"in\" placeholder=\"Supplier name\" data-sn value=\"'+esc(p.name)+'\"><input class=\"in\" placeholder=\"orders@supplier.com\" type=\"email\" data-se value=\"'+esc(p.email)+'\"></div>';}\n  function saveSettings(f,env){\n    var sups=[];f.querySelectorAll('.sup').forEach(function(r){var n=r.querySelector('[data-sn]').value.trim(),e=r.querySelector('[data-se]').value.trim();if(n||e)sups.push({name:n,email:e});});\n    var bad=sups.filter(function(x){return !x.name||!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(x.email);});\n    if(bad.length){toast('Each supplier needs a name and a valid email.',true);return Promise.reject(new Error('bad'));}\n    var el=f.elements;\n    var args={contactName:el.contactName.value,contactPhone:el.contactPhone.value,taxRate:el.taxRate.value,waste:el.waste.value,iceCourses:el.iceCourses.value,suppliers:sups};\n    if(el.clientId)args.abc={env:env,clientId:el.clientId.value,shipTo:el.shipTo.value,branch:el.branch.value,branchName:el.branchName.value,secret:el.secret.value};\n    if(el.co_name)Object.assign(args,extraSettingsArgs(f));\n    return call('saveSettings',args).then(function(r){M.settings=r;render();toast('Settings saved');return r;}).catch(function(e){err(e);throw e;});\n  }\n\n  /* ---------- new estimate (address only) ---------- */\n    /* ----- Shingle color book: drawn samples of each Owens Corning color we offer (approximate on screen) ----- */\n  var COLOR_BOOK=[\n    {pkg:0,name:'Oakridge',colors:['Onyx Black','Estate Gray','Driftwood','Brownwood','Teak','Desert Tan']},\n    {pkg:1,name:'Duration',colors:['Onyx Black','Estate Gray','Driftwood','Brownwood','Teak','Williamsburg Gray','Slatestone Gray','Peppercorn','Colonial Slate','Sierra Gray','Harbor Blue','Chateau Green','Midnight Plum','Desert Rose','Sand Castle','Terra Cotta']},\n    {pkg:2,name:'Duration FLEX',colors:['Onyx Black','Black Sable','Estate Gray','Driftwood','Brownwood','Teak','Summer Harvest']}\n  ];\n  /* granule blends per color: main tones first, accent tones last */\n  var COLOR_TONES={\n    'Onyx Black':['#1c1e20','#25272a','#2e3033','#3a3c3f','#46484b'],\n    'Black Sable':['#24211e','#2f2b27','#3b3530','#4a4239','#5a4e42'],\n    'Estate Gray':['#3a3d3e','#4b4f50','#5d6162','#707475','#858989','#2f3132'],\n    'Driftwood':['#3a3631','#4f4740','#665a4e','#7d6e5d','#94846f','#5e4436','#6c6e6c'],\n    'Brownwood':['#2f2420','#3f2f28','#523c32','#664a3c','#7a5a47','#3b3330'],\n    'Teak':['#352c27','#463a33','#58493f','#6b594c','#7e6a5a','#3e3836'],\n    'Desert Tan':['#5d4c3f','#73604f','#8a7460','#a08872','#b59d85','#655a52'],\n    'Williamsburg Gray':['#36383c','#45474c','#55585d','#66696e','#787b80','#4d4746'],\n    'Slatestone Gray':['#464b4c','#575d5e','#696f70','#7c8282','#8f9494','#4f4b48'],\n    'Peppercorn':['#2e2e2b','#3d3d39','#4d4d48','#5f5f59','#73736c','#3a3532'],\n    'Colonial Slate':['#3f3a37','#514a46','#645b56','#776d66','#5a453d','#8a817a'],\n    'Sierra Gray':['#6b6c68','#7d7e7a','#90918c','#a2a39e','#b5b6b0','#5d5b57'],\n    'Harbor Blue':['#2c363e','#3a4650','#495762','#5a6974','#6d7c86','#3d3f43'],\n    'Chateau Green':['#26332c','#33433a','#41544a','#50655a','#62776b','#3a3a34'],\n    'Midnight Plum':['#2f2e35','#3d3b44','#4c4954','#5c5864','#4a3a43','#6c6873'],\n    'Desert Rose':['#4f3a31','#644a3f','#7a5b4d','#8f6d5d','#a4806e','#5a4a44'],\n    'Sand Castle':['#706352','#857765','#998b78','#ad9f8b','#c1b39e','#655e57'],\n    'Terra Cotta':['#5c3328','#723f32','#88503f','#9c604d','#b0725d','#4a3a33'],\n    'Summer Harvest':['#54473e','#6a5b4f','#807061','#968574','#ac9a87','#6b4c3e']\n  };\n  var swatchCache={};\n  function seedRand(str){var h=1779033703^str.length;for(var i=0;i<str.length;i++){h=Math.imul(h^str.charCodeAt(i),3432918353);h=h<<13|h>>>19;}\n    return function(){h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);var t=(h^=h>>>16)>>>0;return t/4294967296;};}\n  function hexRgb(hx){var n=parseInt(hx.slice(1),16);return [n>>16&255,n>>8&255,n&255];}\n  /* Draws laminated architectural shingles: 5 courses of random-width tabs, each tab a blend of the color's granules */\n  function drawShingles(name,w,h){\n    var key=name+'|'+w+'x'+h;if(swatchCache[key])return swatchCache[key];\n    var tones=(COLOR_TONES[name]||COLOR_TONES['Estate Gray']).map(hexRgb),rnd=seedRand(name);\n    var cv=document.createElement('canvas');cv.width=w;cv.height=h;var ctx=cv.getContext('2d');var im=ctx.createImageData(w,h),d=im.data;\n    var rows=5,rh=h/rows,courses=[];\n    for(var r=0;r<rows;r++){var x=-Math.round(rnd()*w*0.12),tabs=[];\n      while(x<w){var tw=Math.round(w*(0.11+rnd()*0.14));var t=Math.floor(rnd()*(tones.length));if(rnd()<0.12)t=tones.length-1-Math.floor(rnd()*2);\n        tabs.push({x0:x,x1:x+tw,tone:t,lean:(rnd()-0.5)*0.12,band:rnd()<0.45?0.25+rnd()*0.3:0,bandTone:Math.floor(rnd()*2),mix:rnd()});x+=tw;}\n      courses.push(tabs);}\n    for(var y=0;y<h;y++){var r2=Math.min(rows-1,Math.floor(y/rh)),ty=(y-r2*rh)/rh,tabs2=courses[r2];\n      for(var xx=0;xx<w;xx++){\n        var tab=null,edge=99;\n        for(var k=0;k<tabs2.length;k++){var tb=tabs2[k],off=tb.lean*ty*rh,a=tb.x0+off,b=tb.x1+(k+1<tabs2.length?tabs2[k+1].lean*ty*rh:0);\n          if(xx>=a&&xx<b){tab=tb;edge=Math.min(xx-a,b-xx);break;}}\n        if(!tab)tab=tabs2[tabs2.length-1];\n        var base=tones[tab.tone];\n        /* lamination shadow band at the top of some tabs */\n        if(tab.band&&ty<tab.band)base=tones[tab.bandTone];\n        var c0=base;\n        /* granule speckle from the other tones */\n        var rr=rnd();\n        if(rr<0.10)c0=tones[Math.floor(rnd()*tones.length)];\n        var n=(rnd()-0.5)*26,shade=1;\n        if(ty>0.93)shade=0.45;               /* course shadow line */\n        else if(ty<0.06)shade=0.82;          /* overlap shade */\n        if(edge<1.2)shade*=0.55;             /* gap between tabs */\n        shade*=1-0.10*ty*tab.mix;            /* slight blend down each tab */\n        var p=(y*w+xx)*4;\n        d[p]=Math.max(0,Math.min(255,(c0[0]+n)*shade));d[p+1]=Math.max(0,Math.min(255,(c0[1]+n)*shade));d[p+2]=Math.max(0,Math.min(255,(c0[2]+n)*shade));d[p+3]=255;\n      }}\n    ctx.putImageData(im,0,0);\n    var url=cv.toDataURL('image/jpeg',0.86);swatchCache[key]=url;return url;\n  }\n\n\n  /* Owens Corning's free Design EyeQ\u00ae widget (owenscorning.com/roofing/widgets/designeyeq) */\n  var vizCtx=null,vizGuess='';\n  /* If the visualizer ever reports a color to this page, remember it to suggest it */\n  window.addEventListener('message',function(ev){\n    var host='';try{host=new URL(ev.origin).hostname;}catch(e){return;}\n    if(!/(^|\\.)owenscorning\\.com$/.test(host))return;\n    var s='';try{s=typeof ev.data==='string'?ev.data:JSON.stringify(ev.data);}catch(e){return;}\n    COLORS.forEach(function(c){if(s.indexOf(c)>=0)vizGuess=c;});\n  });\n  /* After the visualizer: one tap to put the customer's color on the estimate */\n  function askVizColor(pkg,onPick){\n    var cur=COLOR_BOOK[pkg]?pkg:1,ov=sheet('');\n    function draw(){\n      var b=COLOR_BOOK[cur];\n      ov.querySelector('.sheet').innerHTML='<div class=\"grab\"></div><h3>Which color did they like?'+closeBtn()+'</h3>'+\n        '<div class=\"seg\" id=\"vbk\">'+COLOR_BOOK.map(function(x,i){return '<button type=\"button\" class=\"'+(i===cur?'on':'')+'\" data-cb=\"'+i+'\">'+esc(x.name)+'</button>';}).join('')+'</div>'+\n        (vizGuess?'<p class=\"hint\">The visualizer showed <b>'+esc(vizGuess)+'</b>.</p>':'<p class=\"hint\">Tap the color to put it on the estimate.</p>')+\n        '<div class=\"cgrid\">'+b.colors.map(function(n){return '<button type=\"button\" class=\"ctile'+(n===vizGuess?' on':'')+'\" data-vpick=\"'+esc(n)+'\"><img src=\"'+drawShingles(n,240,240)+'\" alt=\"\"><span>'+esc(n)+'</span></button>';}).join('')+'</div>'+\n        '<button type=\"button\" class=\"btn ghost block mt\" data-close>Skip</button>';\n    }\n    draw();\n    ov.addEventListener('click',function(ev){\n      var t=ev.target.closest('[data-cb],[data-vpick]');if(!t)return;\n      if(t.hasAttribute('data-cb')){cur=+t.getAttribute('data-cb');draw();return;}\n      var n=t.getAttribute('data-vpick');closeSheet();onPick(n,cur);toast('Color set: '+n);\n    });\n  }\n  /* Owens Corning's free Shingle Widget (owenscorning.com/roofing/widgets/shingle-widget): real color photos */\n  var OC_LINES=['oakridge','trudefinition-duration','trudefinition-duration-flex'];\n  function ocSite(){return 'sitedomain='+encodeURIComponent(location.hostname)+'&sitepath='+encodeURIComponent(location.pathname)+'&siteurl='+encodeURIComponent(location.origin+location.pathname);}\n  function openShinglePhotos(pkg,onPick){\n    var cur=COLOR_BOOK[pkg]?pkg:1;\n    vizCtx=onPick?{pkg:cur,onPick:onPick}:null;\n    var ov=document.getElementById('shov');\n    if(!ov){ov=document.createElement('div');ov.id='shov';ov.className='vizov shov';document.body.appendChild(ov);}\n    function draw(){\n      ov.innerHTML='<div class=\"vizbar\"><b>Color photos</b><span>by Owens Corning</span><button class=\"x\" id=\"shx\" aria-label=\"Close\">'+ICON.x+'</button></div>'+\n        '<div class=\"seg\" id=\"shk\" style=\"margin:8px 8px 0\">'+COLOR_BOOK.map(function(x,i){return '<button type=\"button\" class=\"'+(i===cur?'on':'')+'\" data-sk=\"'+i+'\">'+esc(x.name)+'</button>';}).join('')+'</div>'+\n        '<iframe class=\"ocf\" title=\"Owens Corning '+esc(COLOR_BOOK[cur].name)+' colors\" src=\"https://www.owenscorning.com/public_widgets/shingle/'+OC_LINES[cur]+'?view=shingle&style=default&layout=stacked&allowedcolors=&widget=true&'+ocSite()+'\"></iframe>';\n      ov.querySelector('#shk').onclick=function(ev){var b=ev.target.closest('[data-sk]');if(!b)return;cur=+b.getAttribute('data-sk');if(vizCtx)vizCtx.pkg=cur;draw();};\n      ov.querySelector('#shx').onclick=function(){ov.style.display='none';ov.innerHTML='';document.body.style.overflow='';if(vizCtx){var c=vizCtx;vizCtx=null;askVizColor(c.pkg,c.onPick);}};\n    }\n    draw();ov.style.display='flex';document.body.style.overflow='hidden';\n  }\n  function openVisualizer(pkg,onPick){\n    vizCtx=onPick?{pkg:pkg,onPick:onPick}:null;\n    var zip=((M.est&&M.est.address||'').match(/\\b(\\d{5})\\b/)||[])[1]||'06037';\n    var ov=document.getElementById('vizov');\n    if(!ov){\n      ov=document.createElement('div');ov.id='vizov';ov.className='vizov';\n      ov.innerHTML='<div class=\"vizbar\"><b>Roof visualizer</b><span>Design EyeQ\u00ae by Owens Corning</span><button class=\"x\" id=\"vizx\" aria-label=\"Close\">'+ICON.x+'</button></div>'+\n        '<div class=\"vizbody\"><p class=\"hint\" style=\"margin:10px 2px\">Take or upload a photo of the customer\u2019s house, or pick a sample home, then try Owens Corning colors.</p><div id=\"visualizer\" data-zip=\"'+zip+'\"></div><p class=\"hint\" id=\"vizerr\" style=\"display:none\">The visualizer didn\u2019t load. Check your signal and try again.</p></div>';\n      document.body.appendChild(ov);\n      var s=document.createElement('script');s.src='https://apis.owenscorning.com/client/widget.js';s.async=true;\n      s.onerror=function(){var e=document.getElementById('vizerr');if(e)e.style.display='block';ov.remove();toast('The visualizer didn\u2019t load. Check your signal and try again.',true);document.body.style.overflow='';};\n      document.body.appendChild(s);\n      ov.querySelector('#vizx').onclick=function(){ov.style.display='none';document.body.style.overflow='';if(vizCtx){var c=vizCtx;vizCtx=null;askVizColor(c.pkg,c.onPick);}};\n    }\n    ov.style.display='block';ov.scrollTop=0;document.body.style.overflow='hidden';\n  }\n  function colorBook(pkg,onPick,current){\n    var cur=COLOR_BOOK[pkg]?pkg:1,ov=null;\n    function list(){\n      var b=COLOR_BOOK[cur];\n      ov.querySelector('.sheet').innerHTML='<div class=\"grab\"></div><h3>Shingle colors'+closeBtn()+'</h3>'+\n        '<div class=\"seg\" id=\"cbk\">'+COLOR_BOOK.map(function(x,i){return '<button type=\"button\" class=\"'+(i===cur?'on':'')+'\" data-cb=\"'+i+'\">'+esc(x.name)+'</button>';}).join('')+'</div>'+\n        '<div class=\"acts\" style=\"margin-top:4px\"><button type=\"button\" class=\"btn ghost\" data-ocp>Real color photos</button><button type=\"button\" class=\"btn ghost\" data-viz>See it on a house</button></div>'+\n        '<p class=\"hint\">Owens Corning '+esc(b.name)+' \u00b7 '+b.colors.length+' colors. Tap one to show it big.</p>'+\n        '<div class=\"cgrid\">'+b.colors.map(function(n){return '<button type=\"button\" class=\"ctile'+(n===current?' on':'')+'\" data-cn=\"'+esc(n)+'\"><img src=\"'+drawShingles(n,240,240)+'\" alt=\"\"><span>'+esc(n)+'</span></button>';}).join('')+'</div>'+\n        '<p class=\"hint mt\">Drawn samples are close, not exact. Confirm with the real sample board.</p>';\n    }\n    function big(n){\n      var b=COLOR_BOOK[cur],i=b.colors.indexOf(n),prev=b.colors[(i+b.colors.length-1)%b.colors.length],next=b.colors[(i+1)%b.colors.length];\n      ov.querySelector('.sheet').innerHTML='<div class=\"grab\"></div><h3>'+esc(n)+closeBtn()+'</h3>'+\n        '<img class=\"big cbig\" src=\"'+drawShingles(n,720,720)+'\" alt=\"'+esc(n)+' shingle sample\">'+\n        '<p class=\"hint\">Owens Corning '+esc(b.name)+' \u00b7 '+esc(n)+'. Colors on screen are close, not exact.</p>'+\n        '<div class=\"acts\"><button type=\"button\" class=\"btn ghost\" data-cn=\"'+esc(prev)+'\">\u2039 '+esc(prev)+'</button><button type=\"button\" class=\"btn ghost\" data-cn=\"'+esc(next)+'\">'+esc(next)+' \u203a</button></div>'+\n        '<div class=\"acts\"><button type=\"button\" class=\"btn ghost\" data-cball>All colors</button>'+(onPick?'<button type=\"button\" class=\"btn\" data-cuse=\"'+esc(n)+'\">Use this color</button>':'<button type=\"button\" class=\"btn\" data-close>Done</button>')+'</div>';\n    }\n    ov=sheet('');list();\n    ov.addEventListener('click',function(ev){\n      var t=ev.target.closest('[data-cb],[data-cn],[data-cball],[data-cuse],[data-viz],[data-ocp]');if(!t)return;\n      if(t.hasAttribute('data-ocp')){closeSheet();openShinglePhotos(cur,onPick);return;}\n      if(t.hasAttribute('data-viz')){closeSheet();openVisualizer(cur,onPick);return;}\n      if(t.hasAttribute('data-cb')){cur=+t.getAttribute('data-cb');list();return;}\n      if(t.hasAttribute('data-cn')){big(t.getAttribute('data-cn'));ov.querySelector('.sheet').scrollTop=0;return;}\n      if(t.hasAttribute('data-cball')){list();return;}\n      if(t.hasAttribute('data-cuse')){var n=t.getAttribute('data-cuse');closeSheet();if(onPick)onPick(n,cur);}\n    });\n  }\n  var COLORS=COLOR_BOOK.reduce(function(a,b){b.colors.forEach(function(c){if(a.indexOf(c)<0)a.push(c);});return a;},[]);\n  var PITCHES=['2/12','3/12','4/12','5/12','6/12','7/12','8/12','9/12','10/12','11/12','12/12','14/12','16/12'];\n  function newEst(){M.est={type:(M.est&&M.est.type)||'replacement',items:[],address:'',name:'',phone:'',email:'',lat:0,lng:0,roofs:[],layers:1,pick:1,color:'',m:null,busy:false};}\n  function typeSeg(e){return '<div class=\"seg mt\" id=\"etype\">'+[['replacement','Replacement'],['repair','Repair']].map(function(t){return '<button type=\"button\" class=\"'+(e.type===t[0]?'on':'')+'\" data-et=\"'+t[0]+'\">'+t[1]+'</button>';}).join('')+'</div>';}\n  function renderNewRepair(){\n    var e=M.est;\n    var h=bar('<button class=\"back\" data-m=\"back\">'+ICON.back+'Quotes</button><div class=\"bar-title\">New estimate</div>')+'<div class=\"wrap\" id=\"ew\">'+typeSeg(e);\n    h+='<div class=\"card\"><h2>Address</h2><textarea class=\"in\" id=\"ea\" rows=\"2\" placeholder=\"45 Woodin St, Hamden, CT\" style=\"min-height:64px\">'+esc(e.address)+'</textarea></div>';\n    h+='<div class=\"card\"><h2>Repairs <small>tap \u2699 Quote prices to change prices</small></h2><div id=\"ers\"></div>'+addRepairSelect('es')+'<div class=\"tot mt\" id=\"ert\"></div></div>';\n    h+='<div class=\"card\"><h2>Customer <small>optional</small></h2>'+\n      '<label class=\"f\">Name</label><input class=\"in\" data-ef=\"name\" value=\"'+esc(e.name)+'\" autocomplete=\"off\">'+\n      '<div class=\"row\"><div><label class=\"f\">Phone</label><input class=\"in\" data-ef=\"phone\" inputmode=\"tel\" value=\"'+esc(e.phone)+'\"></div><div><label class=\"f\">Email</label><input class=\"in\" data-ef=\"email\" type=\"email\" value=\"'+esc(e.email)+'\"></div></div></div>'+\n      '<button class=\"btn block\" data-m=\"saveest\">Save quote</button>'+\n      '<button class=\"btn ghost block mt\" data-m=\"saveest\" data-v=\"email\">Save &amp; send for signature</button></div>';\n    app.innerHTML=h;\n    var root=document.getElementById('ew');\n    function draw(soft){if(!soft)document.getElementById('ers').innerHTML=e.items.length?itemRows(e.items,'es'):'<p class=\"hint\">Add the repairs from the list below.</p>';\n      var sub=e.items.reduce(function(n,it){return n+(Number(it.qty)||0)*(Number(it.price)||0);},0);var tot=repairTotal(e.items);\n      document.getElementById('ert').innerHTML=(tot>sub&&e.items.length?kv('Minimum service charge applies',''):'')+'<div class=\"kv grand\"><span>Total</span><b class=\"money\">'+money(e.items.length?tot:0)+'</b></div>';}\n    draw();wireItems(root,e.items,'es',draw);\n    root.addEventListener('input',function(ev){var t=ev.target;if(t.id==='ea')e.address=t.value;if(t.hasAttribute('data-ef'))e[t.getAttribute('data-ef')]=t.value;});\n    document.getElementById('etype').onclick=function(ev){var b=ev.target.closest('[data-et]');if(!b)return;e.type=b.getAttribute('data-et');render();};\n  }\n  function estRanges(){return TAKEOFF.priceRanges(M.pricing,M.est.roofs,M.est.layers);}\n  function renderNew(){\n    var e=M.est;var hasKey=M.settings.hasMapsKey;\n    if(e.type==='repair')return renderNewRepair();\n    var h=bar('<button class=\"back\" data-m=\"back\">'+ICON.back+'Quotes</button><div class=\"bar-title\">New estimate</div>')+'<div class=\"wrap\" id=\"ew\">'+typeSeg(e);\n    h+='<div class=\"card\"><h2>Address</h2><textarea class=\"in\" id=\"ea\" rows=\"2\" placeholder=\"45 Woodin St, Hamden, CT\" style=\"min-height:64px\">'+esc(e.address)+'</textarea>'+\n      (hasKey?'<button class=\"btn block mt\" data-m=\"measure\"'+(e.busy?' disabled':'')+'>'+(e.busy?'Measuring\u2026':'Measure roof')+'</button>':\n        '<div class=\"note\">Automatic roof measuring needs a Google Maps key (Quotes \u203a \u2699 Quote prices). For now, type the roof size below.</div>')+\n      (e.m&&e.m.image?'<img class=\"big mt\" src=\"'+e.m.image+'\" alt=\"Satellite view of '+esc(e.m.address)+'\">':(e.m&&e.m.map?'<div id=\"emap\" class=\"mt\" style=\"height:240px;border-radius:12px;overflow:hidden;background:#dde2e8\" role=\"img\" aria-label=\"Satellite view of '+esc(e.m.address)+'\"></div>':''))+\n      (e.m?'<p class=\"hint\">'+(e.m.source==='solar'?'Measured by Google: '+e.m.segments+' roof sections'+(e.m.imageryDate?' \u00b7 imagery '+esc(month(e.m.imageryDate)):''):'Address found. Enter the roof size.')+'</p>':'')+\n      (e.m&&e.m.extras&&e.m.extras.length?'<div class=\"note\">Also on the property and added below: '+e.m.extras.map(function(x){return '<b>'+esc(x.n)+'</b> '+x.s.toLocaleString()+' sq ft'+(x.est?' (size from the building outline, pitch estimated)':'')+', ~'+x.dist+' ft '+esc(x.dir);}).join('; ')+'. Remove any you\u2019re not quoting.</div>':'')+\n      (e.m&&e.m.flat&&e.m.flat.length?'<div class=\"note\">Flat roof'+(e.m.flat.length>1?'s':'')+' on the lot, not priced: '+e.m.flat.map(function(x){return esc(x.n)+' '+x.s.toLocaleString()+' sq ft';}).join('; ')+'.</div>':'')+\n      (e.m&&e.m.nearby&&e.m.nearby.length?'<p class=\"hint\">Nearby roofs (property lines unknown):</p>'+e.m.nearby.map(function(x,i){return '<button class=\"btn ghost block mt\" data-m=\"addnear\" data-i=\"'+i+'\">'+ICON.plus+'Add '+esc(x.n)+' \u00b7 '+x.s.toLocaleString()+' sq ft, ~'+x.dist+' ft '+esc(x.dir)+'</button>';}).join(''):'')+\n      (e.m&&e.m.note?'<div class=\"note\">'+esc(e.m.note)+'</div>':'')+'</div>';\n    h+='<div class=\"card\"><h2>Roof <small>sloped area, not footprint</small></h2><div id=\"eroofs\">'+\n      (e.roofs.length?e.roofs:[{n:'Main Roof',s:'',p:'6/12'}]).map(function(r,i){\n        return '<div class=\"row\" style=\"margin-top:'+(i?10:0)+'px\"><div style=\"flex:2\"><label class=\"f\">'+esc(r.n||'Roof')+' (sq ft)</label><input class=\"in money\" inputmode=\"numeric\" data-er=\"s\" data-i=\"'+i+'\" value=\"'+(r.s||'')+'\" placeholder=\"e.g. 2000\"></div>'+\n          '<div><label class=\"f\">Pitch</label><select class=\"in\" data-er=\"p\" data-i=\"'+i+'\">'+PITCHES.map(function(p){return '<option'+(p===r.p?' selected':'')+'>'+p+'</option>';}).join('')+(PITCHES.indexOf(r.p)<0&&r.p?'<option selected>'+esc(r.p)+'</option>':'')+'</select></div>'+\n          (i?'<button type=\"button\" class=\"x\" style=\"flex:0 0 36px;margin-bottom:5px\" data-m=\"rmroof\" data-i=\"'+i+'\" aria-label=\"Remove section\">'+ICON.x+'</button>':'')+'</div>';\n      }).join('')+'</div><button class=\"btn ghost block mt\" data-m=\"addroof\">'+ICON.plus+'Add a section (garage, porch\u2026)</button>'+\n      '<label class=\"f\">Layers to tear off</label><div class=\"seg\" id=\"elay\">'+[1,2,3].map(function(n){return '<button type=\"button\" class=\"'+(e.layers===n?'on':'')+'\" data-ly=\"'+n+'\">'+n+'</button>';}).join('')+'</div></div>';\n    h+='<div class=\"card\" id=\"eprice\"></div>';\n    h+='<div class=\"card\"><h2>Customer <small>optional</small></h2>'+\n      '<label class=\"f\">Name</label><input class=\"in\" data-ef=\"name\" value=\"'+esc(e.name)+'\" autocomplete=\"off\">'+\n      '<div class=\"row\"><div><label class=\"f\">Phone</label><input class=\"in\" data-ef=\"phone\" inputmode=\"tel\" value=\"'+esc(e.phone)+'\"></div><div><label class=\"f\">Email</label><input class=\"in\" data-ef=\"email\" type=\"email\" value=\"'+esc(e.email)+'\"></div></div></div>'+\n      '<button class=\"btn block\" data-m=\"saveest\">Save quote</button>'+\n      '<button class=\"btn ghost block mt\" data-m=\"saveest\" data-v=\"email\">Save &amp; email to customer</button>'+\n      '<p class=\"hint\" style=\"text-align:center;margin-top:14px\"><a href=\"#\" data-m=\"addlink\">Have a website quote link? Paste it instead</a></p></div>';\n    app.innerHTML=h;\n    drawEstPrices();drawEstMap();\n    if(!e.roofs.length)e.roofs=[{n:'Main Roof',s:0,p:'6/12'}];\n    var wrapEl=document.getElementById('ew');\n    wrapEl.addEventListener('input',function(ev){var t=ev.target;\n      if(t.id==='ea'){e.address=t.value;return;}\n      if(t.hasAttribute('data-ef')){e[t.getAttribute('data-ef')]=t.value;return;}\n      if(t.hasAttribute('data-er')){var r=e.roofs[+t.getAttribute('data-i')];if(!r)return;var k2=t.getAttribute('data-er');r[k2]=k2==='s'?(Number(String(t.value).replace(/[^\\d.]/g,''))||0):t.value;drawEstPrices();}\n      if(t.id==='ec'){e.color=t.value;}\n    });\n    wrapEl.addEventListener('change',function(ev){var t=ev.target;if(t.hasAttribute('data-er')){var r=e.roofs[+t.getAttribute('data-i')];if(r){r[t.getAttribute('data-er')]=t.value;drawEstPrices();}}});\n    document.getElementById('etype').onclick=function(ev){var b=ev.target.closest('[data-et]');if(!b)return;e.type=b.getAttribute('data-et');render();};\n    document.getElementById('elay').onclick=function(ev){var b=ev.target.closest('[data-ly]');if(!b)return;e.layers=+b.getAttribute('data-ly');this.querySelectorAll('button').forEach(function(z){z.classList.toggle('on',z===b);});drawEstPrices();};\n  }\n  function drawEstPrices(){\n    var e=M.est;var el=document.getElementById('eprice');if(!el)return;\n    var rg=estRanges();var total=e.roofs.reduce(function(n,r){return n+(Number(r.s)||0);},0);\n    el.innerHTML='<h2>Price <small>'+(total?Math.round(total).toLocaleString()+' sq ft \u00b7 '+(total/100).toFixed(1)+' squares':'enter the roof size')+'</small></h2>'+\n      '<div class=\"pkg\" id=\"epk\">'+PK.map(function(p,i){var r=rg[i]||[0,0];return '<button type=\"button\" class=\"'+(i===e.pick?'on':'')+'\" data-pk=\"'+i+'\"><b>'+p.label+'</b><span class=\"money\">'+(r[1]?money(r[0],false)+'\u2013'+money(r[1],false):'\u2014')+'</span></button>';}).join('')+'</div>'+\n      '<label class=\"f\">Color</label><div class=\"row\"><div style=\"flex:2\"><input class=\"in\" id=\"ec\" list=\"ecl\" maxlength=\"40\" value=\"'+esc(e.color)+'\" placeholder=\"e.g. Estate Gray\"></div><div><button type=\"button\" class=\"btn ghost block\" id=\"ecb\" style=\"min-height:44px\">'+(e.color&&COLOR_TONES[e.color]?'<img src=\"'+drawShingles(e.color,60,60)+'\" alt=\"\" style=\"width:22px;height:22px;border-radius:5px;margin-right:6px;vertical-align:middle\">':'')+'Show colors</button></div></div><datalist id=\"ecl\">'+COLORS.map(function(c){return '<option value=\"'+c+'\">';}).join('')+'</datalist>'+\n      (M.pricing.updated?'':'<div class=\"note\">These use starter prices per square. Set your own under \u2699 Quote prices.</div>');\n    document.getElementById('epk').onclick=function(ev){var b=ev.target.closest('[data-pk]');if(!b)return;e.pick=+b.getAttribute('data-pk');this.querySelectorAll('button').forEach(function(z){z.classList.toggle('on',z===b);});};\n    document.getElementById('ecb').onclick=function(){colorBook(e.pick,function(n,pk){e.color=n;e.pick=pk;drawEstPrices();},e.color);};\n  }\n  /* ----- roof measuring on the phone (same method as the website instant quote) ----- */\n  var mapsP=null;\n  function canMeasureHere(){return !!(M.settings&&M.settings.mapsKey)&&!/googleusercontent\\.com$|script\\.google\\.com$/.test(location.hostname);}\n  function loadMaps(){\n    if(window.google&&google.maps&&google.maps.importLibrary)return Promise.resolve();\n    if(mapsP)return mapsP;\n    mapsP=new Promise(function(ok,bad){\n      window.__tfAppMaps=function(){ok();};\n      window.gm_authFailure=function(){bad(new Error('KEY_BLOCKED'));};\n      var s=document.createElement('script');\n      s.src='https://maps.googleapis.com/maps/api/js?key='+encodeURIComponent(M.settings.mapsKey)+'&v=weekly&loading=async&callback=__tfAppMaps';\n      s.async=true;s.onerror=function(){mapsP=null;bad(new Error('No signal. Try again when you have signal.'));};\n      document.head.appendChild(s);\n    });\n    return mapsP;\n  }\n  function findPlace(address){\n    return google.maps.importLibrary('places').then(function(lib){\n      return lib.Place.searchByText({textQuery:address,fields:['location','formattedAddress'],maxResultCount:1,region:'us'})\n        .then(function(r){var p=r&&r.places&&r.places[0];if(p&&p.location)return p;throw 0;})\n        .catch(function(){\n          return lib.AutocompleteSuggestion.fetchAutocompleteSuggestions({input:address,includedRegionCodes:['us']}).then(function(r){\n            var s=r&&r.suggestions&&r.suggestions[0];if(!s||!s.placePrediction)throw new Error('Couldn\u2019t find that address. Check the street and town.');\n            var p=s.placePrediction.toPlace();return p.fetchFields({fields:['location','formattedAddress']}).then(function(){return p;});\n          });\n        });\n    });\n  }\n  function parseSolar(j){\n    var sp=j&&j.solarPotential,segs=(sp&&sp.roofSegmentStats)||[];\n    if(!segs.length)return null;\n    var sum=segs.reduce(function(h,p){return h+((p.stats&&p.stats.areaMeters2)||0);},0);\n    var area=(sp.wholeRoofStats&&sp.wholeRoofStats.areaMeters2)||sum;\n    var flatLim=Math.atan(2/12)*180/Math.PI,n=0,d=0,low=0,big=null;\n    segs.forEach(function(h){var a=(h.stats&&h.stats.areaMeters2)||0,b=h.pitchDegrees||0;\n      if(b<flatLim)low+=a;else{n+=a;d+=a*b;}\n      if(!big||a>((big.stats&&big.stats.areaMeters2)||0))big=h;});\n    var deg=n?d/n:(big.pitchDegrees||0);\n    var dt=j.imageryDate;\n    return {s:Math.round(area*10.7639),p:Math.round(Math.tan(deg*Math.PI/180)*12)+'/12',f:segs.length,\n      lowPct:sum?Math.round(low/sum*100):0,date:dt&&dt.year?dt.year+'-'+('0'+(dt.month||1)).slice(-2):'',quality:j.imageryQuality||''};\n  }\n\n  /* ----- all roofs on the property: same code as the website instant quote (team-forte.com/instant-quote) ----- */\n  function TFRoofScan(key){\n    const v = { googleApiKey: key, solarMinQuality: \"LOW\", findOtherRoofs: true, parcelLookup: true,\n      parcelServiceUrl: \"https://services3.arcgis.com/3FL1kr7L4LvwA2Kb/arcgis/rest/services/Connecticut_CAMA_and_Parcel_Layer_2024/FeatureServer/0\",\n      footprintServiceUrl: \"https://services3.arcgis.com/3FL1kr7L4LvwA2Kb/arcgis/rest/services/2D_Building_Footprints/FeatureServer/0\",\n      otherRoofMaxDistanceFt: 200, otherRoofMaxShown: 6 };\n    const L = false, oe = 10.7639,\n      ae = (e) => new Promise((s) => setTimeout(s, e)),\n      R = (e) => Math.tan((e * Math.PI) / 180) * 12,\n      H = (e) => (Math.atan(e / 12) * 180) / Math.PI;\n    const o = { address: null, parcel: null, extras: [] };\nfunction V(e) {\nconst s = e && e.solarPotential,\nt = (s && s.roofSegmentStats) || [];\nif (!t.length) throw new Error(\"no-segments\");\nlet a = (s.wholeRoofStats && s.wholeRoofStats.areaMeters2) || 0;\nconst r = t.reduce(\n(h, p) => h + ((p.stats && p.stats.areaMeters2) || 0),\n0,\n);\na || (a = r);\nlet n = 0,\nd = 0,\nu = 0,\nl = null;\nt.forEach((h) => {\nconst p = (h.stats && h.stats.areaMeters2) || 0,\nb = h.pitchDegrees || 0;\n(b < H(2) ? (u += p) : ((n += p), (d += p * b)),\n(!l || p > ((l.stats && l.stats.areaMeters2) || 0)) && (l = h));\n});\nconst g = n ? d / n : l.pitchDegrees || 0,\nf = e.imageryDate;\nreturn {\nareaSqft: Math.round(a * oe),\npitchDeg: g,\npitch12: Math.round(R(g)),\nfacets: t.length,\nlowSlopePct: r ? Math.round((u / r) * 100) : 0,\nquality: e.imageryQuality || \"\",\nimageryDate: f\n? new Date(f.year, (f.month || 1) - 1, f.day || 1).toLocaleDateString(\n\"en-US\",\n{ month: \"short\", year: \"numeric\" },\n)\n: \"\",\nsource: \"satellite\",\nsegments: t\n.filter((h) => h.boundingBox && h.center)\n.map((h) => ({\nbox: h.boundingBox,\ncenter: h.center,\nazimuth: h.azimuthDegrees || 0,\npitch: h.pitchDegrees || 0,\nground: (h.stats && h.stats.groundAreaMeters2) || 0,\n})),\nbuildingBox: e.boundingBox || null,\ngroundSqft: Math.round(\n((s.wholeRoofStats && s.wholeRoofStats.groundAreaMeters2) ||\nt.reduce((h, p) => h + ((p.stats && p.stats.groundAreaMeters2) || 0), 0)) * oe,\n),\nname: e.name || \"\",\ncenter: e.center || null,\n};\n}\nasync function ie(e, s) {\nconst t =\n\"https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=\" +\ne.toFixed(7) +\n\"&location.longitude=\" +\ns.toFixed(7) +\n\"&requiredQuality=\" +\nencodeURIComponent(v.solarMinQuality) +\n\"&key=\" +\nencodeURIComponent(v.googleApiKey),\na = await fetch(t);\nif (!a.ok) throw new Error(\"solar-\" + a.status);\nreturn V(await a.json());\n}\n/* ---------- All roofs on the property (main house, detached garage, barn, shed) ---------- */\nconst XR = { lat: 110540, lng: (la) => 111320 * Math.cos((la * Math.PI) / 180) };\nfunction xCenter(r) {\nif (r.center) return { lat: r.center.latitude, lng: r.center.longitude };\nif (r.buildingBox) {\nconst b = r.buildingBox;\nreturn {\nlat: (b.sw.latitude + b.ne.latitude) / 2,\nlng: (b.sw.longitude + b.ne.longitude) / 2,\n};\n}\nreturn { lat: o.address.lat, lng: o.address.lng };\n}\nfunction xDist(a, b) {\nconst dy = (b.lat - a.lat) * XR.lat,\ndx = (b.lng - a.lng) * XR.lng(a.lat);\nreturn { m: Math.sqrt(dx * dx + dy * dy), deg: ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360 };\n}\nconst XDIRS = [\"north\", \"northeast\", \"east\", \"southeast\", \"south\", \"southwest\", \"west\", \"northwest\"],\nORD = [\"Main Roof\", \"Second Roof\", \"Third Roof\", \"Fourth Roof\", \"Fifth Roof\", \"Sixth Roof\", \"Seventh Roof\"];\nfunction xKind(sqft) {\nreturn sqft < 260 ? \"Shed\" : sqft < 1100 ? \"Garage\" : sqft < 1900 ? \"Barn\" : \"Outbuilding\";\n}\n// Slope categories. Homeowners see the satellite pick and may only choose a steeper one.\nconst SLOPES = [\n{ id: \"flat\", t: \"Flat\", max: 1, rep: 1 },\n{ id: \"shallow\", t: \"Shallow\", max: 4, rep: 3 },\n{ id: \"medium\", t: \"Medium\", max: 8, rep: 6 },\n{ id: \"steep\", t: \"Steep\", max: 99, rep: 10 },\n];\nfunction slopeOf(p12) {\nreturn SLOPES.find((q) => p12 <= q.max).id;\n}\nfunction slopeIdx(id) {\nreturn SLOPES.findIndex((q) => q.id === id);\n}\nfunction satInit(r) {\nr.sat ||\n(r.sat = {\npitch12: r.pitch12,\npitchDeg: r.pitchDeg,\nareaSqft: r.areaSqft,\nground: r.groundSqft || Math.round(r.areaSqft * Math.cos((r.pitchDeg * Math.PI) / 180)),\nslope: r.noSat ? \"medium\" : slopeOf(r.pitch12),\n});\nr.slope || (r.slope = r.sat.slope);\nreturn r;\n}\nfunction setSlope(r, id) {\nsatInit(r);\nif (!r.noSat && slopeIdx(id) < slopeIdx(r.sat.slope)) return;\nr.slope = id;\nif (id === r.sat.slope) {\n((r.pitch12 = r.sat.pitch12), (r.pitchDeg = r.sat.pitchDeg), (r.areaSqft = r.sat.areaSqft));\nreturn;\n}\nconst p = SLOPES[slopeIdx(id)].rep,\nd = H(p);\n((r.pitch12 = p),\n(r.pitchDeg = d),\n(r.areaSqft = Math.max(r.sat.areaSqft, Math.round(r.sat.ground / Math.cos((d * Math.PI) / 180)))));\n}\nfunction xMake(roof, main, how) {\nconst d = xDist(xCenter(main), xCenter(roof));\nreturn {\nkey: roof.name || \"x\" + Math.random().toString(36).slice(2),\nroof: satInit(roof),\ndistFt: Math.round((d.m * 3.28084) / 5) * 5,\ndir: XDIRS[Math.round(d.deg / 45) % 8],\nkind: xKind(roof.areaSqft),\ninclude: !1,\nhow: how,\n};\n}\nfunction xNumber() {\no.extras.forEach((x, n) => {\nx.num = n + 2;\nx.label || (x.label = ORD[n + 1] || \"Roof \" + (n + 2));\n});\n}\n// Connecticut statewide parcel (property line) layer, public ArcGIS service.\nasync function fetchParcel(lat, lng) {\nif (v.parcelLookup === !1 || !v.parcelServiceUrl) return null;\nconst u =\nv.parcelServiceUrl +\n\"/query?\" +\nnew URLSearchParams({\ngeometry: lng.toFixed(7) + \",\" + lat.toFixed(7),\ngeometryType: \"esriGeometryPoint\",\ninSR: \"4326\",\nspatialRel: \"esriSpatialRelIntersects\",\noutFields: \"Parcel_ID\",\nreturnGeometry: \"true\",\noutSR: \"4326\",\nf: \"json\",\n});\nconst r = await Promise.race([fetch(u), ae(5e3).then(() => null)]);\nif (!r || !r.ok) return null;\nconst j = await r.json(),\nf = (j.features || [])[0];\nif (!f || !f.geometry || !f.geometry.rings || !f.geometry.rings.length) return null;\nreturn {\nid: (f.attributes && f.attributes.Parcel_ID) || \"\",\nrings: f.geometry.rings.map((g) => g.map((q) => ({ lat: q[1], lng: q[0] }))),\n};\n}\nfunction inParcel(p, pc) {\nlet inside = !1;\npc.rings.forEach((g) => {\nfor (let a = 0, b = g.length - 1; a < g.length; b = a++) {\nconst A = g[a],\nB = g[b];\nA.lat > p.lat != B.lat > p.lat &&\np.lng < ((B.lng - A.lng) * (p.lat - A.lat)) / (B.lat - A.lat) + A.lng &&\n(inside = !inside);\n}\n});\nreturn inside;\n}\nfunction inBox(p, b) {\nreturn b && p.lat >= b.sw.latitude && p.lat <= b.ne.latitude && p.lng >= b.sw.longitude && p.lng <= b.ne.longitude;\n}\nfunction ringXY(g) {\n// local meters relative to the first vertex (avoids float precision loss)\nconst o0 = g[0],\nkx = XR.lng(o0.lat);\nreturn g.map((q) => [(q.lng - o0.lng) * kx, (q.lat - o0.lat) * XR.lat]);\n}\nfunction ringArea(g) {\nconst p = ringXY(g);\nlet A = 0;\nfor (let a = 0, b = p.length - 1; a < p.length; b = a++) A += p[b][0] * p[a][1] - p[a][0] * p[b][1];\nreturn Math.abs(A / 2);\n}\nfunction ringCentroid(g) {\nconst p = ringXY(g),\no0 = g[0];\nlet x = 0,\ny = 0,\nA = 0;\nfor (let a = 0, b = p.length - 1; a < p.length; b = a++) {\nconst f = p[b][0] * p[a][1] - p[a][0] * p[b][1];\n((A += f), (x += (p[b][0] + p[a][0]) * f), (y += (p[b][1] + p[a][1]) * f));\n}\nreturn A ? { lat: o0.lat + y / (3 * A) / XR.lat, lng: o0.lng + x / (3 * A) / XR.lng(o0.lat) } : o0;\n}\n// Connecticut statewide 2D building footprints (2023 lidar), public ArcGIS service.\nasync function fetchFootprints(pc) {\nif (!v.footprintServiceUrl) return null;\nconst all = pc.rings.flat(),\npad = 2e-4,\nenv = {\nxmin: Math.min(...all.map((q) => q.lng)) - pad,\nymin: Math.min(...all.map((q) => q.lat)) - pad,\nxmax: Math.max(...all.map((q) => q.lng)) + pad,\nymax: Math.max(...all.map((q) => q.lat)) + pad,\nspatialReference: { wkid: 4326 },\n},\nbody = new URLSearchParams({\ngeometry: JSON.stringify(env),\ngeometryType: \"esriGeometryEnvelope\",\ninSR: \"4326\",\nspatialRel: \"esriSpatialRelIntersects\",\noutFields: \"OBJECTID\",\nreturnGeometry: \"true\",\noutSR: \"4326\",\nf: \"json\",\n});\nconst r = await Promise.race([fetch(v.footprintServiceUrl + \"/query\", { method: \"POST\", body: body }), ae(5e3).then(() => null)]);\nif (!r || !r.ok) return null;\nconst j = await r.json();\nif (!j.features) return null;\nreturn j.features\n.filter((f) => f.geometry && f.geometry.rings && f.geometry.rings.length)\n.map((f) => {\nconst rings = f.geometry.rings.map((g) => g.map((q) => ({ lat: q[1], lng: q[0] }))),\nouter = rings.reduce((a, b) => (ringArea(b) > ringArea(a) ? b : a));\nreturn { id: f.attributes.OBJECTID, rings: rings, c: ringCentroid(outer), groundSqft: Math.round(ringArea(outer) * oe) };\n});\n}\nfunction hull(pts) {\nconst p = pts.slice().sort((a, b) => a.lng - b.lng || a.lat - b.lat),\ncr = (O2, A, B) => (A.lng - O2.lng) * (B.lat - O2.lat) - (A.lat - O2.lat) * (B.lng - O2.lng),\nlo = [],\nup = [];\np.forEach((q) => {\nfor (; lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0; ) lo.pop();\nlo.push(q);\n});\np.slice()\n.reverse()\n.forEach((q) => {\nfor (; up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0; ) up.pop();\nup.push(q);\n});\nreturn lo.slice(0, -1).concat(up.slice(0, -1));\n}\nfunction segDistM(p, A, B) {\nconst kx = XR.lng(p.lat),\nax = (A.lng - p.lng) * kx,\nay = (A.lat - p.lat) * XR.lat,\nbx = (B.lng - p.lng) * kx,\nby = (B.lat - p.lat) * XR.lat,\ndx = bx - ax,\ndy = by - ay,\nt = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / (dx * dx + dy * dy || 1)));\nreturn Math.hypot(ax + t * dx, ay + t * dy);\n}\n// Part of the lidar building outline the satellite roof data doesn't cover\n// (often an attached/adjacent garage or addition). Rasterizes the outline on a\n// 0.5 m grid, removes cells under the satellite roof facets, keeps the largest\n// leftover patch. Returns a roof or null.\nfunction uncoveredPart(main, fp) {\nconst sg = main.groundSqft || 0;\nif (!sg || fp.groundSqft - sg < 80 || !(main.segments || []).length) return null;\nconst outer = fp.rings.reduce((a, b) => (ringArea(b) > ringArea(a) ? b : a)),\no0 = outer[0],\nkx = XR.lng(o0.lat),\nP = (q) => [(q.lng - o0.lng) * kx, (q.lat - o0.lat) * XR.lat],\npoly = outer.map(P),\nboxes = main.segments.map((q) => {\nconst a = P({ lat: q.box.sw.latitude, lng: q.box.sw.longitude }),\nb = P({ lat: q.box.ne.latitude, lng: q.box.ne.longitude });\nreturn [a[0] - 0.8, a[1] - 0.8, b[0] + 0.8, b[1] + 0.8];\n}),\ninPoly = (x, y) => {\nlet c2 = !1;\nfor (let a = 0, b = poly.length - 1; a < poly.length; b = a++) {\nconst A = poly[a],\nB = poly[b];\nA[1] > y != B[1] > y && x < ((B[0] - A[0]) * (y - A[1])) / (B[1] - A[1]) + A[0] && (c2 = !c2);\n}\nreturn c2;\n},\nst = 0.5,\nxs = poly.map((q) => q[0]),\nys = poly.map((q) => q[1]),\nx0 = Math.min(...xs),\ny0 = Math.min(...ys),\nW = Math.ceil((Math.max(...xs) - x0) / st),\nHh = Math.ceil((Math.max(...ys) - y0) / st);\nif (W * Hh > 4e5) return null;\nconst grid = new Uint8Array(W * Hh);\nfor (let r = 0; r < Hh; r++)\nfor (let q = 0; q < W; q++) {\nconst x = x0 + (q + 0.5) * st,\ny = y0 + (r + 0.5) * st;\ninPoly(x, y) && !boxes.some((b) => x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3]) && (grid[r * W + q] = 1);\n}\nlet best = null;\nconst seen = new Uint8Array(W * Hh);\nfor (let k = 0; k < W * Hh; k++) {\nif (!grid[k] || seen[k]) continue;\nconst stack = [k],\ncells = [];\nfor (seen[k] = 1; stack.length; ) {\nconst c3 = stack.pop();\ncells.push(c3);\nconst r = Math.floor(c3 / W),\nq = c3 % W;\n[\n[1, 0],\n[-1, 0],\n[0, 1],\n[0, -1],\n].forEach(([dr, dq]) => {\nconst rr = r + dr,\nqq = q + dq,\nkk = rr * W + qq;\nrr >= 0 && rr < Hh && qq >= 0 && qq < W && grid[kk] && !seen[kk] && ((seen[kk] = 1), stack.push(kk));\n});\n}\n(!best || cells.length > best.length) && (best = cells);\n}\nif (!best) return null;\nconst g = Math.round(best.length * st * st * oe);\nif (g < 100) return null;\nconst pts = [];\nbest.forEach((c3) => {\nconst r = Math.floor(c3 / W),\nq = c3 % W;\n[\n[0, 0],\n[1, 0],\n[0, 1],\n[1, 1],\n].forEach(([a, b]) =>\npts.push({ lat: o0.lat + (y0 + (r + a) * st) / XR.lat, lng: o0.lng + (x0 + (q + b) * st) / kx }),\n);\n});\nconst h = hull(pts),\nd = H(6),\ncc = ringCentroid(h);\nreturn {\nareaSqft: Math.round(g / Math.cos((d * Math.PI) / 180)),\npitchDeg: d,\npitch12: 6,\nfacets: 2,\nlowSlopePct: 0,\nquality: \"\",\nimageryDate: \"\",\nsource: \"footprint\",\nnoSat: !0,\nsegments: [],\nfootprint: { rings: [h] },\nbuildingBox: fpBox({ rings: [h] }),\ngroundSqft: g,\nname: \"part-\" + fp.id,\ncenter: { latitude: cc.lat, longitude: cc.lng },\n};\n}\nfunction fpBox(fp) {\nconst all = fp.rings.flat();\nreturn {\nsw: { latitude: Math.min(...all.map((q) => q.lat)), longitude: Math.min(...all.map((q) => q.lng)) },\nne: { latitude: Math.max(...all.map((q) => q.lat)), longitude: Math.max(...all.map((q) => q.lng)) },\n};\n}\nasync function scanExtras(main) {\no.parcel = null;\nif (v.findOtherRoofs === !1) return [];\nif (L) {\no.parcel = { id: \"demo\", rings: [] };\nreturn [\n{\nkey: \"demo-garage\",\nroof: satInit({ areaSqft: 610, pitchDeg: 26.57, pitch12: 6, facets: 2, lowSlopePct: 0, quality: \"DEMO\", imageryDate: \"\", source: \"demo\", segments: [], buildingBox: null, groundSqft: 545 }),\ndistFt: 55, dir: \"east\", kind: \"Garage\", include: !0, how: \"parcel\",\n},\n{\nkey: \"demo-shed\",\nroof: satInit({ areaSqft: 150, pitchDeg: 18.43, pitch12: 3, facets: 2, lowSlopePct: 0, quality: \"DEMO\", imageryDate: \"\", source: \"demo\", segments: [], buildingBox: null, groundSqft: 142 }),\ndistFt: 90, dir: \"southeast\", kind: \"Shed\", include: !0, how: \"parcel\",\n},\n];\n}\nconst c = xCenter(main);\nlet pc = null;\ntry {\n// The lot must contain the measured house; the address point can land across the street.\npc = await fetchParcel(o.address.lat, o.address.lng);\n(pc && inParcel(c, pc)) || (pc = await fetchParcel(c.lat, c.lng));\npc && !inParcel(c, pc) && (pc = null);\n} catch (q) {\nconsole.warn(\"[TFQ] parcel\", q);\n}\no.parcel = pc;\n// 1) Best: building outlines from the state's lidar footprints inside the property lines\nif (pc) {\nlet fps = null;\ntry {\nfps = await fetchFootprints(pc);\n} catch (q) {\nconsole.warn(\"[TFQ] footprints\", q);\n}\nif (fps && fps.length) {\nconst lot = fps.filter((f) => inParcel(f.c, pc) && f.groundSqft >= 60),\ninside = (p, f) => inParcel(p, { rings: f.rings }),\nmainFp =\nlot.find((f) => inside(c, f)) ||\nlot.slice().sort((a, b) => xDist(c, a.c).m - xDist(c, b.c).m).find((f) => xDist(c, f.c).m < 12);\nlet part = mainFp ? uncoveredPart(main, mainFp) : null;\n// Outline the house with the lidar shape, unless part of it is split off as its own roof\nmainFp && !part && (main.footprint = mainFp);\nconst others = lot.filter((f) => f !== mainFp).sort((a, b) => xDist(c, a.c).m - xDist(c, b.c).m).slice(0, v.otherRoofMaxShown || 6);\nconst out = await Promise.all(\nothers.map(async (f) => {\nlet r = null;\ntry {\nr = await ie(f.c.lat, f.c.lng);\n} catch (q) {}\nif (!(r && r.name && r.name !== main.name && (inside(xCenter(r), f) || xDist(xCenter(r), f.c).m < 3))) {\n// No satellite slope for this building: size it from the lidar outline at a typical 6/12\nconst d = H(6);\nr = {\nareaSqft: Math.round(f.groundSqft / Math.cos((d * Math.PI) / 180)),\npitchDeg: d,\npitch12: 6,\nfacets: 2,\nlowSlopePct: 0,\nquality: \"\",\nimageryDate: \"\",\nsource: \"footprint\",\nnoSat: !0,\nsegments: [],\nbuildingBox: fpBox(f),\ngroundSqft: f.groundSqft,\nname: \"fp-\" + f.id,\ncenter: { latitude: f.c.lat, longitude: f.c.lng },\n};\n} else r.groundSqft = r.groundSqft || f.groundSqft;\nr.footprint = f;\nconst x = xMake(r, main, \"parcel\");\nreturn ((x.include = !0), x);\n}),\n);\nif (part) {\n// If the satellite has this section as its own building, use its real slope and size\nlet sp = null;\ntry {\nsp = await ie(part.center.latitude, part.center.longitude);\n} catch (q) {}\nsp &&\nsp.name &&\nsp.name !== main.name &&\n(inParcel(xCenter(sp), { rings: part.footprint.rings }) || xDist(xCenter(sp), xCenter(part)).m < 4) &&\n((sp.footprint = part.footprint), (sp.groundSqft = sp.groundSqft || part.groundSqft), (part = sp));\nconst x = xMake(part, main, \"parcel\");\n((x.include = !0), part.noSat && (x.kind = \"Attached section\"), out.unshift(x));\n}\nreturn out;\n}\n}\n// 2) Fallback: probe around the house with the Solar API\nlet rad = 14;\nif (main.buildingBox) {\nconst b = main.buildingBox;\nrad = xDist({ lat: b.sw.latitude, lng: b.sw.longitude }, { lat: b.ne.latitude, lng: b.ne.longitude }).m / 2;\n}\nlet pts = [];\nif (pc) {\nconst all = pc.rings.flat(),\nla0 = Math.min(...all.map((q) => q.lat)),\nla1 = Math.max(...all.map((q) => q.lat)),\nln0 = Math.min(...all.map((q) => q.lng)),\nln1 = Math.max(...all.map((q) => q.lng)),\nhM = (la1 - la0) * XR.lat,\nwM = (ln1 - ln0) * XR.lng(la0);\nlet step = Math.max(6, Math.sqrt((hM * wM) / 40));\nconst grid = () => {\nconst g = [];\nfor (let y = step / 2; y < hM; y += step)\nfor (let x = step / 2; x < wM; x += step) {\nconst p = { lat: la0 + y / XR.lat, lng: ln0 + x / XR.lng(la0) };\ninParcel(p, pc) && !inBox(p, main.buildingBox) && g.push(p);\n}\nreturn g;\n};\npts = grid();\nfor (; pts.length > 24; ) ((step *= 1.2), (pts = grid()));\npts = pts.map((p) => [p.lat, p.lng]);\n} else {\n[rad + 12, rad + 32].forEach((dm) => {\nfor (let k = 0; k < 8; k++) {\nconst a = ((k * 45 + (dm > rad + 20 ? 22.5 : 0)) * Math.PI) / 180;\npts.push([c.lat + (dm * Math.cos(a)) / XR.lat, c.lng + (dm * Math.sin(a)) / XR.lng(c.lat)]);\n}\n});\n}\nconst got = await Promise.race([\nPromise.all(pts.map((p) => ie(p[0], p[1]).catch(() => null))),\nae(9e3).then(() => []),\n]);\nconst maxM = (v.otherRoofMaxDistanceFt || 200) / 3.28084,\nseen = new Set([main.name || \"main\"]),\nout = [];\n(got || []).forEach((r) => {\nif (!r || !r.name || seen.has(r.name)) return;\nseen.add(r.name);\nif (r.areaSqft < 80) return;\nconst x = xMake(r, main, pc ? \"parcel\" : \"nearby\");\nif (pc) {\nif (!inParcel(xCenter(r), pc)) return;\nx.include = !0;\n} else if (x.distFt / 3.28084 > maxM) return;\nout.push(x);\n});\nreturn out.sort((a, b) => a.distFt - b.distFt).slice(0, v.otherRoofMaxShown || 6);\n}\n\n    return {\n      solar: ie,\n      scan: async function (main, address) { o.address = address; const x = await scanExtras(main); return { extras: x, parcel: o.parcel }; }\n    };\n  }\n  function roofName(kind, used){ var n=kind||'Roof'; used[n]=(used[n]||0)+1; return used[n]>1?n+' '+used[n]:n; }\n  function measureHere(address){\n    var scan=null;\n    return loadMaps().then(function(){return findPlace(address);}).then(function(p){\n      var lat=p.location.lat(),lng=p.location.lng();\n      var out={address:String(p.formattedAddress||address).replace(/, USA$/,''),lat:lat,lng:lng,roofs:[],segments:0,source:'none',note:'',imageryDate:'',quality:'',image:'',map:true,extras:[],nearby:[],flat:[],shapes:[],parcel:null};\n      scan=TFRoofScan(M.settings.mapsKey);\n      return scan.solar(lat,lng).then(function(main){\n        if(!main||!main.areaSqft){out.note='Google has no roof sections for this address. Type the roof size below.';return out;}\n        var sum=(main.segments||[]).length;\n        out.roofs=[{n:'Main Roof',s:main.areaSqft,p:Math.round(main.pitch12)+'/12',f:main.facets}];out.segments=main.facets;out.source='solar';\n        out.imageryDate=main.imageryDate||'';out.quality=main.quality||'';\n        if(main.lowSlopePct>15)out.note='About '+main.lowSlopePct+'% of this roof is low-slope or flat. Check if it needs a different roof system.';\n        if(main.center){var dLat=(main.center.latitude-lat)*111320,dLng=(main.center.longitude-lng)*111320*Math.cos(lat*Math.PI/180);\n          if(Math.sqrt(dLat*dLat+dLng*dLng)>30)out.note=(out.note?out.note+' ':'')+'The closest building Google found is not right at the address pin. Check the map.';\n          out.lat=main.center.latitude;out.lng=main.center.longitude;}\n        if(main.areaSqft<300)return out;\n        // Other roofs on the lot (detached garage, barn, shed, attached section), like the website\n        return scan.scan(main,{lat:lat,lng:lng}).then(function(res){\n          var used={};\n          out.parcel=res.parcel&&res.parcel.rings&&res.parcel.rings.length?res.parcel.rings:null;\n          if(main.footprint&&main.footprint.rings)out.shapes.push({rings:main.footprint.rings,label:'Main Roof',main:true});\n          (res.extras||[]).forEach(function(x){\n            var r=x.roof,name=roofName(x.kind,used),row={n:name,s:r.areaSqft,p:Math.round(r.pitch12)+'/12',f:r.facets||2};\n            var info={n:name,s:r.areaSqft,p:row.p,dist:x.distFt,dir:x.dir,est:!!r.noSat,row:row};\n            if(r.footprint&&r.footprint.rings)out.shapes.push({rings:r.footprint.rings,label:name});\n            if(r.slope==='flat'||r.pitch12<=1){out.flat.push(info);return;}\n            if(x.include){out.roofs.push(row);out.extras.push(info);}else out.nearby.push(info);\n          });\n          return out;\n        }).catch(function(){return out;});\n      }).catch(function(er){\n        var st=/solar-(\\d+)/.exec(String(er&&er.message||''));\n        if(st&&st[1]==='404'){out.note='Google has no roof data for this address. Type the roof size below.';return out;}\n        if(st&&st[1]==='403'){out.note='Google blocked roof measuring for this key on the app. In Google Cloud, add teamsforte.github.io/* to the key\u2019s website restrictions.';return out;}\n        if(st){out.note='Couldn\u2019t measure the roof right now ('+st[1]+'). Type the roof size below.';return out;}\n        throw er;\n      });\n    }).catch(function(er){\n      if(er&&/API key not valid|API_KEY_INVALID|InvalidKey/i.test(String(er.message||er)))throw new Error('The saved Google key isn\u2019t right. Go to Quote prices and tap \u201cUse my website\u2019s key\u201d.');\n      if(er&&er.message==='KEY_BLOCKED')throw new Error('Google turned down the Maps key on the app. Under Quote prices, tap \u201cUse my website\u2019s key\u201d. If it still fails, add teamsforte.github.io/* to that key\u2019s website restrictions in Google Cloud.');\n      throw er;\n    });\n  }\n  function drawEstMap(){\n    var e=M.est,el=document.getElementById('emap');\n    if(!el||!e.m||!(window.google&&google.maps&&google.maps.Map))return;\n    var c={lat:+e.m.lat,lng:+e.m.lng};\n    var map=new google.maps.Map(el,{mapTypeId:'satellite',center:c,zoom:20,tilt:0,disableDefaultUI:true,zoomControl:true,gestureHandling:'cooperative'});\n    var b=new google.maps.LatLngBounds(),any=false;\n    if(e.m.parcel){new google.maps.Polygon({map:map,paths:e.m.parcel,strokeColor:'#FFFFFF',strokeOpacity:.9,strokeWeight:2,fillOpacity:0,clickable:false});}\n    (e.m.shapes||[]).forEach(function(sh){new google.maps.Polygon({map:map,paths:sh.rings,strokeColor:sh.main?'#9E1B0F':'#FFB020',strokeWeight:2,fillColor:sh.main?'#E8412E':'#FFB020',fillOpacity:.35,clickable:false});\n      sh.rings.forEach(function(g){g.forEach(function(q){b.extend(q);any=true;});});});\n    if(any){b.extend(c);map.fitBounds(b,30);google.maps.event.addListenerOnce(map,'idle',function(){if(map.getZoom()>20)map.setZoom(20);});}\n    else new google.maps.Marker({map:map,position:c});\n  }\n  function measure(){\n    var e=M.est;if(!e.address.trim()){toast('Type the address first.',true);return;}\n    e.busy=true;render();\n    (canMeasureHere()?measureHere(e.address):call('measure',{address:e.address})).then(function(m){\n      e.busy=false;e.m=m;e.address=m.address;e.lat=m.lat;e.lng=m.lng;\n      if(m.roofs&&m.roofs.length)e.roofs=m.roofs.map(function(r){return {n:r.n,s:r.s,p:r.p,f:r.f};});\n      render();\n    }).catch(function(er){e.busy=false;render();err(er);});\n  }\n  function saveEst(alsoEmail){\n    var e=M.est;\n    if(e.type==='repair')return saveRepairEst(alsoEmail);\n    var roofs=e.roofs.filter(function(r){return Number(r.s)>0;});\n    if(!e.address.trim()){toast('Type the address first.',true);return;}\n    if(!roofs.length){toast('Enter the roof size (or tap Measure roof).',true);return;}\n    if(alsoEmail&&!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(e.email)){toast('Add the customer\u2019s email to send it.',true);return;}\n    var btns=app.querySelectorAll('[data-m=saveest]');btns.forEach(function(b){b.disabled=true;});\n    call('createQuote',{address:e.address,lat:e.lat,lng:e.lng,roofs:roofs,layers:e.layers,pick:e.pick,color:e.color,name:e.name,phone:e.phone,email:e.email})\n      .then(function(r){mergeQ(r);\n        if(alsoEmail)return call('emailQuote',{id:r.id}).then(function(r2){mergeQ(r2);return {r:r2,mailed:true};});\n        return {r:r};})\n      .then(function(o){M.qid=o.r.id;M.view='quote';M.qfilter='new';newEst();render();window.scrollTo(0,0);toast(o.mailed?'Quote saved and emailed':'Quote saved');})\n      .catch(function(er){btns.forEach(function(b){b.disabled=false;});err(er);});\n  }\n\n  function saveRepairEst(send){\n    var e=M.est;var items=e.items.filter(function(it){return (Number(it.qty)||0)>0&&String(it.name||'').trim();});\n    if(!e.address.trim()){toast('Type the address first.',true);return;}\n    if(!items.length){toast('Add at least one repair.',true);return;}\n    if(send&&!validEmail(e.email)){toast('Add the customer\\u2019s email to send it.',true);return;}\n    var btns=app.querySelectorAll('[data-m=saveest]');btns.forEach(function(b){b.disabled=true;});\n    call('createQuote',{type:'repair',address:e.address,items:items,name:e.name,phone:e.phone,email:e.email})\n      .then(function(r){mergeQ(r);if(send)return call('sendProposal',{id:r.id,send:'email',email:e.email}).then(function(r2){mergeQ(r2);return {r:r2,mailed:true};});return {r:r};})\n      .then(function(o){M.qid=o.r.id;M.view='quote';M.qfilter='new';newEst();render();window.scrollTo(0,0);toast(o.mailed?'Saved and sent for signature':'Quote saved');})\n      .catch(function(er){btns.forEach(function(b){b.disabled=false;});err(er);});\n  }\n\n  /* ---------- quote prices ---------- */\n  function renderPricing(){\n    var p=M.pricing;var st=(p.steep||[]).slice();while(st.length<3)st.push({from:'',pct:''});\n    function num(name,val,label,pre,suf){return '<div><label class=\"f\">'+label+'</label><input class=\"in money\" inputmode=\"decimal\" name=\"'+name+'\" value=\"'+(val===''||val==null?'':val)+'\"'+(pre?' placeholder=\"'+pre+'\"':'')+'>'+(suf?'<span class=\"hint\">'+suf+'</span>':'')+'</div>';}\n    var h=bar('<button class=\"back\" data-m=\"back\">'+ICON.back+'Quotes</button><div class=\"bar-title\">Quote prices</div>')+'<div class=\"wrap\"><form id=\"pf\">'+\n      '<div class=\"card\"><h2>Price per square <small>installed, before range</small></h2><div class=\"row\">'+\n      p.packages.map(function(pk,i){return num('pk'+i,pk.perSq,pk.label,'$');}).join('')+'</div></div>'+\n      '<div class=\"card\"><h2>Range shown to customers</h2><div class=\"row\">'+num('lowPct',p.lowPct,'Low end %')+num('highPct',p.highPct,'High end %')+'</div>'+\n      '<p class=\"hint\">A $10,000 job shows as $'+(100*p.lowPct).toLocaleString()+'\u2013$'+(100*p.highPct).toLocaleString()+' with these numbers.</p></div>'+\n      '<div class=\"card\"><h2>Adjustments</h2><div class=\"row\">'+num('wastePct',p.wastePct,'Waste %')+num('layerPerSq',p.layerPerSq,'Extra layer $/sq')+'</div>'+\n      '<div class=\"row\">'+num('minJob',p.minJob,'Minimum job $')+num('roundTo',p.roundTo,'Round to $')+'</div>'+\n      '<label class=\"f\">Steep roof charge</label>'+st.map(function(x,i){return '<div class=\"row\" style=\"margin-top:6px\"><div><input class=\"in money\" inputmode=\"numeric\" name=\"sf'+i+'\" value=\"'+(x.from||'')+'\" placeholder=\"from (e.g. 8)\"><span class=\"hint\">pitch /12 and up</span></div><div><input class=\"in money\" inputmode=\"decimal\" name=\"sp'+i+'\" value=\"'+(x.pct||'')+'\" placeholder=\"+ %\"><span class=\"hint\">% more</span></div></div>';}).join('')+'</div>'+\n      '<div class=\"card\" id=\"pex\"></div>'+repairBookCard()+\n      '<div class=\"card\"><h2>Google Maps key <small>'+(M.settings.hasMapsKey?'<span class=\"pill done\">Saved</span>':'for measuring roofs')+'</small></h2>'+\n      '<input class=\"in\" name=\"mapsKey\" autocomplete=\"off\" placeholder=\"'+(M.settings.hasMapsKey?'Saved. Paste to replace':'Paste your API key')+'\">'+\n      '<button type=\"button\" class=\"btn ghost mt\" id=\"webkey\" style=\"width:100%\">Use my website\u2019s key</button>'+\n      '<p class=\"hint\">In Google Cloud console: APIs &amp; Services \u203a Credentials \u203a Create API key. Paste the same key your website\u2019s instant quote uses, and in Google Cloud add <b>teamsforte.github.io/*</b> to that key\u2019s website restrictions. The app then measures roofs on your phone exactly like the website does.</p></div>'+\n      '<div class=\"note\">Your website\u2019s instant quote still uses its own prices for now.</div>'+\n      '<button class=\"btn block\" type=\"submit\">Save prices</button></form></div>';\n    app.innerHTML=h;\n    var f=document.getElementById('pf');\n    function read(){var el=f.elements;var o={packages:p.packages.map(function(pk,i){return {perSq:el['pk'+i].value};}),lowPct:el.lowPct.value,highPct:el.highPct.value,wastePct:el.wastePct.value,layerPerSq:el.layerPerSq.value,minJob:el.minJob.value,roundTo:el.roundTo.value,steep:[]};\n      for(var i=0;i<3;i++){if(el['sf'+i].value)o.steep.push({from:el['sf'+i].value,pct:el['sp'+i].value||0});}return o;}\n    function ex(){var o=TAKEOFF.cleanPricing(read());var a=TAKEOFF.priceRanges(o,[{s:2000,p:'6/12'}],1),b=TAKEOFF.priceRanges(o,[{s:2000,p:'10/12'}],2);\n      document.getElementById('pex').innerHTML='<h2>Example</h2>'+kv('2,000 sq ft, 6/12, 1 layer','')+o.packages.map(function(pk,i){return kv(esc(pk.label),'<span class=\"money\">'+money(a[i][0],false)+'\u2013'+money(a[i][1],false)+'</span>');}).join('')+\n        kv('2,000 sq ft, 10/12, 2 layers','')+o.packages.map(function(pk,i){return kv(esc(pk.label),'<span class=\"money\">'+money(b[i][0],false)+'\u2013'+money(b[i][1],false)+'</span>');}).join('');}\n    ex();f.addEventListener('input',ex);\n    f.onsubmit=function(ev){ev.preventDefault();var b=f.querySelector('button[type=submit]');b.disabled=true;\n      var key=f.elements.mapsKey.value.trim();\n      call('savePricing',read()).then(function(np){M.pricing=np;return call('saveRepairs',readRepairBook());}).then(function(rb){M.repairs=rb;return key?call('saveSettings',{mapsKey:key}).then(function(s){M.settings=s;}):null;})\n        .then(function(){render();toast('Prices saved');if(key)setTimeout(function(){location.reload();},900);}).catch(function(er){b.disabled=false;err(er);});};\n    var wk=document.getElementById('webkey');if(wk)wk.onclick=function(){wk.disabled=true;wk.textContent='Getting the key\u2026';\n      call('useWebsiteKey',{}).then(function(s){M.settings=s;toast('Key saved. Roof measuring is ready.');setTimeout(function(){location.reload();},900);})\n        .catch(function(er){wk.disabled=false;wk.textContent='Use my website\u2019s key';err(er);});};\n  }\n\n  /* ---------- share a quote ---------- */\n  function shareSheet(){\n    var x=q();var digits=String(x.phone||'').replace(/[^\\d+]/g,'');\n    var msg='Hi'+(x.name?' '+x.name:'')+', here is your roof estimate from Team Forte: '+x.link;\n    var ov=sheet('<h3>Send quote'+closeBtn()+'</h3>'+\n      '<a class=\"btn block\" href=\"sms:'+esc(digits)+'?&body='+encodeURIComponent(msg)+'\" target=\"_top\">Text it'+(x.phone?' to '+esc(x.phone):'')+'</a>'+\n      '<label class=\"f\">Email</label><div class=\"row\"><input class=\"in\" id=\"sem\" type=\"email\" value=\"'+esc(x.email||'')+'\" placeholder=\"customer@email.com\"><button class=\"btn dark\" id=\"sesend\" style=\"flex:0 0 auto\">Email</button></div>'+\n      '<label class=\"f\">Quote link</label><textarea class=\"in\" id=\"slink\" readonly style=\"min-height:70px;font-size:13px\">'+esc(x.link)+'</textarea>'+\n      '<div class=\"acts\"><button class=\"btn ghost\" id=\"scopy\">Copy link</button><a class=\"btn ghost\" href=\"'+esc(x.link)+'\" target=\"_blank\" rel=\"noopener\">Open quote page</a></div>');\n    ov.querySelector('#scopy').onclick=function(){var t=ov.querySelector('#slink');t.focus();t.select();\n      var done=function(){toast('Link copied');};\n      try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(x.link).then(done,function(){document.execCommand('copy');done();});}else{document.execCommand('copy');done();}}catch(e){toast('Press and hold the link to copy it.');}};\n    ov.querySelector('#sesend').onclick=function(){var b=this;var em=ov.querySelector('#sem').value.trim();b.disabled=true;\n      call('emailQuote',{id:x.id,email:em}).then(function(r){mergeQ(r);closeSheet();render();toast('Quote emailed to '+em);}).catch(function(er){b.disabled=false;err(er);});};\n  }\n\n  /* =================== EXTRAS (repairs, proposals, schedule, profit, inspections, wrap-up, crew) =================== */\n  function role(){return (S.user&&S.user.role)||'owner';}\n  function isOwner(){return role()==='owner';}\n  function proposalUrl(x){return (M.execUrl||EXEC_URL)+'?r=proposal&id='+encodeURIComponent(x.id);}\n  function repairTotal(items){var t=(items||[]).reduce(function(n,it){return n+(Number(it.qty)||0)*(Number(it.price)||0);},0);return Math.round(Math.max(Number(M.repairs.min)||0,t)*100)/100;}\n  function inspOf(x){return (M.inspections||[]).filter(function(i){return i.quoteId===x.id;}).sort(function(a,b){return a.order-b.order;});}\n  function validEmail(e){return /^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(String(e||''));}\n  function smsHref(phone,body){return 'sms:'+String(phone||'').replace(/[^\\d+]/g,'')+'?&body='+encodeURIComponent(body);}\n  function jobProfit(x){\n    var c=x.costs||{};var mine=M.orders.filter(function(o){return o.quoteId===x.id;});\n    var mat=mine.length?mine.reduce(function(n,o){return n+orderSpend(o);},0):TAKEOFF.totals(fresh(x),M.settings.taxRate).total;\n    var labor=(Number(c.crewDays)||0)*(Number(c.crewRate)||0);var other=(Number(c.dumpster)||0)+(Number(c.permit)||0)+(Number(c.other)||0);\n    var rev=Number(x.contractPrice)||0;var profit=rev-mat-labor-other;\n    return {rev:rev,mat:mat,matOrdered:mine.length>0,labor:labor,other:other,profit:profit,margin:rev?Math.round(profit/rev*100):0};\n  }\n\n  /* ----- repair item rows (new estimate + edit sheet) ----- */\n  function itemRows(items,prefix){\n    return items.map(function(it,i){\n      return '<div class=\"ln\" style=\"cursor:default\"><div class=\"l1\">'+(it.custom?'<input class=\"in\" data-'+prefix+'=\"name\" data-i=\"'+i+'\" value=\"'+esc(it.name)+'\" placeholder=\"Describe the repair\" style=\"min-height:38px;margin-bottom:6px\">':'<b>'+esc(it.name)+'</b>')+\n        '<div class=\"row\" style=\"gap:6px\"><input class=\"in money\" style=\"min-height:38px\" inputmode=\"decimal\" data-'+prefix+'=\"qty\" data-i=\"'+i+'\" value=\"'+it.qty+'\" aria-label=\"Quantity\"><span class=\"hint\" style=\"flex:0 0 auto;align-self:center\">'+esc(it.unit)+' \u00d7</span>'+\n        '<input class=\"in money\" style=\"min-height:38px\" inputmode=\"decimal\" data-'+prefix+'=\"price\" data-i=\"'+i+'\" value=\"'+it.price+'\" aria-label=\"Price\"></div></div>'+\n        '<div class=\"l2 money\">'+money((Number(it.qty)||0)*(Number(it.price)||0))+'<span><button type=\"button\" class=\"x\" style=\"width:30px;height:30px;margin-left:auto;margin-top:6px\" data-m=\"'+prefix+'rm\" data-i=\"'+i+'\" aria-label=\"Remove\">'+ICON.x+'</button></span></div></div>';\n    }).join('');\n  }\n  function addRepairSelect(prefix){\n    return '<select class=\"in mt\" data-'+prefix+'add><option value=\"\">+ Add a repair\u2026</option>'+(M.repairs.items||[]).map(function(it){return '<option value=\"'+esc(it.key)+'\">'+esc(it.name)+' \u00b7 '+money(it.price,false)+'/'+esc(it.unit)+'</option>';}).join('')+'<option value=\"__custom\">Custom item\u2026</option></select>';\n  }\n  function bookItem(key){if(key==='__custom')return {key:'c'+Date.now().toString(36),name:'',unit:'each',qty:1,price:0,custom:true};\n    var b=(M.repairs.items||[]).filter(function(it){return it.key===key;})[0];return b?{key:b.key,name:b.name,unit:b.unit,qty:1,price:b.price}:null;}\n  function wireItems(root,list,prefix,redraw){\n    root.addEventListener('input',function(e){var t=e.target;var k2=t.getAttribute('data-'+prefix);if(!k2)return;var it=list[+t.getAttribute('data-i')];if(!it)return;\n      it[k2]=k2==='name'?t.value:(Number(String(t.value).replace(/[^\\d.]/g,''))||0);redraw(true);});\n    root.addEventListener('change',function(e){var t=e.target;if(!t.hasAttribute('data-'+prefix+'add'))return;var it=bookItem(t.value);if(it){list.push(it);redraw();}t.value='';});\n    root.addEventListener('click',function(e){var b=e.target.closest('[data-m=\"'+prefix+'rm\"]');if(!b)return;e.stopPropagation();list.splice(+b.getAttribute('data-i'),1);redraw();});\n  }\n\n  /* ----- repair parts of the quote page ----- */\n  function repairCard(x){\n    var items=x.items||[];var sub=items.reduce(function(n,it){return n+it.qty*it.price;},0);\n    return '<div class=\"card\"><h2>Repairs <small>'+items.length+' item'+(items.length===1?'':'s')+'</small></h2>'+\n      items.map(function(it){return kv(esc(it.name)+'<br><small class=\"hint\">'+it.qty+' '+esc(units(it.unit,it.qty))+' \u00d7 '+money(it.price)+'</small>','<span class=\"money\">'+money(it.qty*it.price)+'</span>');}).join('')+\n      (sub<x.contractPrice?kv('Minimum service charge',''):'')+\n      '<div class=\"tot\"><div class=\"kv grand\"><span>Total</span><b class=\"money\">'+money(x.contractPrice)+'</b></div></div>'+\n      (x.status==='new'&&!x.signedAt?'<button class=\"btn ghost block mt\" data-m=\"edititems\">Edit repairs</button>':'')+'</div>';\n  }\n  function approveRepairCard(x){\n    return '<div class=\"card\"><h2>Approve job</h2><p class=\"sub\">Approving adds the job to Photos and starts its materials list and job costs. If the customer signs online, this happens on its own.</p>'+\n      '<button class=\"btn block\" data-m=\"approverep\">Approve repair job</button><button class=\"btn ghost block mt\" data-m=\"archive\">Not going ahead</button></div>';\n  }\n  function editItemsSheet(){\n    var x=q();var list=(x.items||[]).map(function(it){return Object.assign({},it);});\n    var ov=sheet('<h3>Edit repairs'+closeBtn()+'</h3><div id=\"eis\"></div>'+addRepairSelect('ei')+'<div class=\"tot mt\" id=\"eit\"></div><button class=\"btn block mt\" id=\"eisv\">Save</button>');\n    function draw(soft){if(!soft)ov.querySelector('#eis').innerHTML=itemRows(list,'ei');ov.querySelector('#eit').innerHTML='<div class=\"kv grand\"><span>Total</span><b class=\"money\">'+money(repairTotal(list))+'</b></div>';}\n    draw();wireItems(ov.querySelector('.sheet'),list,'ei',draw);\n    ov.querySelector('#eisv').onclick=function(){var items=list.filter(function(it){return it.qty>0&&(it.name||'').trim();});if(!items.length){toast('Add at least one repair.',true);return;}\n      closeSheet();saveQ({items:items,contractPrice:repairTotal(items)},'Repairs saved');};\n  }\n\n  /* ----- customer + GoHighLevel ----- */\n  function ghlLine(x){\n    if(!(M.settings.ghl&&M.settings.ghl.connected))return '';\n    if(x.ghlError)return '<div class=\"note\">GoHighLevel: '+esc(x.ghlError)+'<div class=\"mt\"><button class=\"btn ghost\" data-m=\"ghlsync\">Try again</button></div></div>';\n    if(x.ghlOppId)return '<p class=\"hint\">\u2713 In GoHighLevel (Sales Pipeline)</p>';\n    return '<p class=\"hint\">Not in GoHighLevel yet. <a href=\"#\" data-m=\"ghlsync\">Sync now</a></p>';\n  }\n  function editCustSheet(){\n    var x=q();\n    var ov=sheet('<h3>Customer'+closeBtn()+'</h3><label class=\"f\">Name</label><input class=\"in\" id=\"cn\" value=\"'+esc(x.name)+'\">'+\n      '<div class=\"row\"><div><label class=\"f\">Phone</label><input class=\"in\" id=\"cp\" inputmode=\"tel\" value=\"'+esc(x.phone)+'\"></div><div><label class=\"f\">Email</label><input class=\"in\" id=\"ce\" type=\"email\" value=\"'+esc(x.email)+'\"></div></div>'+\n      '<label class=\"f\">Address</label><input class=\"in\" id=\"cad\" value=\"'+esc(x.address)+'\"><button class=\"btn block mt\" id=\"csv\">Save</button>');\n    ov.querySelector('#csv').onclick=function(){var em=ov.querySelector('#ce').value.trim();if(em&&!validEmail(em)){toast('That email doesn\u2019t look right.',true);return;}\n      closeSheet();saveQ({name:ov.querySelector('#cn').value,phone:ov.querySelector('#cp').value,email:em,address:ov.querySelector('#cad').value},'Saved');};\n  }\n\n  /* ----- proposal / e-signature ----- */\n  function proposalCard(x){\n    var s=M.settings;\n    if(x.signedAt){\n      var dep=Math.round((x.contractPrice||0)*(s.depositPct||0))/100;\n      return '<div class=\"card\"><h2>Signed <span class=\"pill done\">\u2713 '+dateStr(x.signedAt)+'</span></h2>'+kv('Signed by',esc(x.signerName))+kv('Price','<span class=\"money\">'+money(x.contractPrice)+'</span>')+\n        (dep>0?'<label class=\"f\">Deposit '+money(dep)+'</label><div class=\"seg\" id=\"depseg\">'+[['requested','Waiting'],['paid','Paid']].map(function(d){return '<button type=\"button\" class=\"'+((x.depositStatus||'requested')===d[0]?'on':'')+'\" data-dep=\"'+d[0]+'\">'+d[1]+'</button>';}).join('')+'</div>':'')+\n        '<div class=\"acts\">'+(x.signedPdfId?'<a class=\"btn ghost\" href=\"https://drive.google.com/file/d/'+esc(x.signedPdfId)+'/view\" target=\"_blank\" rel=\"noopener\">Signed copy</a>':'<span></span>')+\n        '<a class=\"btn ghost\" href=\"'+esc(proposalUrl(x))+'\" target=\"_blank\" rel=\"noopener\">Proposal page</a></div></div>';\n    }\n    if(x.status==='done'||x.status==='archived')return '';\n    return '<div class=\"card\"><h2>Online signature</h2><p class=\"sub\" style=\"margin:0\">Send a firm-price proposal the customer can sign on their phone. When they sign, the job is approved for you'+(s.depositPct?' and they can pay the '+s.depositPct+'% deposit':'')+'.</p>'+\n      (x.proposalSentAt?'<p class=\"hint\">Sent '+dateStr(x.proposalSentAt)+'</p>':'')+\n      '<button class=\"btn block mt\" data-m=\"propose\">'+(x.proposalSentAt?'Send again':'Send for signature')+'</button></div>';\n  }\n  function proposeSheet(){\n    var x=q();var rep=x.type==='repair';var pick=x.pick>=0?x.pick:1;\n    var ov=sheet('<h3>Send for signature'+closeBtn()+'</h3>'+\n      (rep?kv('Repair total','<span class=\"money\">'+money(x.contractPrice)+'</span>'):\n        '<label class=\"f\">Package</label><div class=\"pkg\" id=\"ppk\">'+PK.map(function(p,i){return '<button type=\"button\" class=\"'+(i===pick?'on':'')+'\" data-pk=\"'+i+'\"><b>'+p.label+'</b><span>'+(range(x,i)||'\u00a0')+'</span></button>';}).join('')+'</div>'+\n        '<div class=\"row\"><div><label class=\"f\">Color</label><input class=\"in\" id=\"pcl\" value=\"'+esc(x.color||'')+'\" placeholder=\"Estate Gray\"></div><div><label class=\"f\">Firm price</label><input class=\"in money\" id=\"ppr\" inputmode=\"decimal\" value=\"'+(x.contractPrice||mid(x,pick)||'')+'\"></div></div>')+\n      '<label class=\"f\">Customer email</label><input class=\"in\" id=\"pem\" type=\"email\" value=\"'+esc(x.email||'')+'\" placeholder=\"customer@email.com\">'+\n      '<div class=\"acts\"><button class=\"btn\" id=\"pemail\">Email it</button><button class=\"btn ghost\" id=\"plink\">Text or copy link</button></div><div id=\"pout\"></div>');\n    if(!rep)ov.querySelector('#ppk').onclick=function(e){var b=e.target.closest('[data-pk]');if(!b)return;var old=pick;pick=+b.getAttribute('data-pk');ov.querySelectorAll('#ppk button').forEach(function(z){z.classList.toggle('on',z===b);});\n      var pr=ov.querySelector('#ppr');if(!Number(pr.value)||Number(pr.value)===mid(x,old))pr.value=mid(x,pick)||'';};\n    function args(send){var a={id:x.id,send:send,email:ov.querySelector('#pem').value.trim()};if(!rep){a.pick=pick;a.color=ov.querySelector('#pcl').value;a.contractPrice=Number(ov.querySelector('#ppr').value)||0;}return a;}\n    ov.querySelector('#pemail').onclick=function(){var b=this;var a=args('email');if(!validEmail(a.email)){toast('Add the customer\u2019s email.',true);return;}b.disabled=true;\n      call('sendProposal',a).then(function(r){mergeQ(r);closeSheet();render();toast('Proposal emailed to '+a.email);}).catch(function(e){b.disabled=false;err(e);});};\n    ov.querySelector('#plink').onclick=function(){var b=this;b.disabled=true;\n      call('sendProposal',args('none')).then(function(r){mergeQ(r);var url=r.proposalUrl;var msg='Hi'+(r.name?' '+r.name.split(' ')[0]:'')+', here is your Team Forte proposal. You can review and sign it here: '+url;\n        ov.querySelector('#pout').innerHTML='<a class=\"btn block mt\" href=\"'+esc(smsHref(r.phone,msg))+'\" target=\"_top\">Text it'+(r.phone?' to '+esc(r.phone):'')+'</a><textarea class=\"in mt\" readonly style=\"min-height:64px;font-size:13px\">'+esc(url)+'</textarea>';\n        render();}).catch(function(e){b.disabled=false;err(e);});};\n  }\n\n  /* ----- schedule + profit ----- */\n  function scheduleCard(x){\n    return '<div class=\"card\"><h2>Schedule</h2><div class=\"row\"><div><label class=\"f\">Install date</label><input class=\"in\" type=\"date\" id=\"sd\" value=\"'+esc(x.installDate||'')+'\"></div>'+\n      '<div><label class=\"f\">Crew</label><input class=\"in\" id=\"sc\" value=\"'+esc(x.crew||'')+'\" placeholder=\"e.g. Luis + 3\"></div></div><button class=\"btn dark block mt\" data-m=\"savesched\">Save schedule</button></div>';\n  }\n  function profitCard(x){\n    if(!x.contractPrice)return '';\n    var p=jobProfit(x);\n    return '<div class=\"card\"><h2>Profit <small>'+(p.matOrdered?'materials from orders':'materials estimated')+'</small></h2>'+\n      kv('Job price','<span class=\"money\">'+money(p.rev,false)+'</span>')+kv('Materials','<span class=\"money\">\u2212'+money(p.mat,false)+'</span>')+\n      kv('Labor','<span class=\"money\">\u2212'+money(p.labor,false)+'</span>')+kv('Dumpster, permit &amp; other','<span class=\"money\">\u2212'+money(p.other,false)+'</span>')+\n      '<div class=\"tot\"><div class=\"kv grand\"><span>Profit</span><b class=\"money\" style=\"color:'+(p.profit<0?'#B3261E':'var(--green)')+'\">'+money(p.profit,false)+' \u00b7 '+p.margin+'%</b></div></div>'+\n      '<button class=\"btn ghost block mt\" data-m=\"editcosts\">Edit job costs</button></div>';\n  }\n  function costsSheet(){\n    var x=q();var c=x.costs||{crewDays:0,crewRate:M.settings.crewDayRate,dumpster:0,permit:0,other:0,otherNote:''};\n    var ov=sheet('<h3>Job costs'+closeBtn()+'</h3><div class=\"row\"><div><label class=\"f\">Crew days</label><input class=\"in money\" id=\"kd\" inputmode=\"decimal\" value=\"'+c.crewDays+'\"></div><div><label class=\"f\">Cost per crew day</label><input class=\"in money\" id=\"kr\" inputmode=\"decimal\" value=\"'+c.crewRate+'\"></div></div>'+\n      '<div class=\"row\"><div><label class=\"f\">Dumpster</label><input class=\"in money\" id=\"kdu\" inputmode=\"decimal\" value=\"'+c.dumpster+'\"></div><div><label class=\"f\">Permit</label><input class=\"in money\" id=\"kp\" inputmode=\"decimal\" value=\"'+c.permit+'\"></div></div>'+\n      '<div class=\"row\"><div><label class=\"f\">Other</label><input class=\"in money\" id=\"ko\" inputmode=\"decimal\" value=\"'+c.other+'\"></div><div><label class=\"f\">What for</label><input class=\"in\" id=\"kon\" value=\"'+esc(c.otherNote||'')+'\"></div></div>'+\n      '<button class=\"btn block mt\" id=\"ksv\">Save</button>');\n    ov.querySelector('#ksv').onclick=function(){var g=function(id){return Number(ov.querySelector(id).value)||0;};\n      closeSheet();saveQ({costs:{crewDays:g('#kd'),crewRate:g('#kr'),dumpster:g('#kdu'),permit:g('#kp'),other:g('#ko'),otherNote:ov.querySelector('#kon').value}},'Costs saved');};\n  }\n\n  /* ----- inspection photos ----- */\n  function inspectionCard(x){\n    var list=inspOf(x);\n    return '<div class=\"card\"><h2>Inspection photos <small>'+list.length+'</small></h2>'+\n      (list.length?'<div class=\"grid\">'+list.map(function(r){return '<button class=\"ph\" data-m=\"insp\" data-id=\"'+esc(r.id)+'\"><img loading=\"lazy\" src=\"'+esc(img(r.id,400))+'\" alt=\"\"><span class=\"cap\">'+esc(r.tag)+'</span></button>';}).join('')+'</div>':\n        '<p class=\"hint\">Take photos of what you find and tag each one. Turn them into a PDF report for the homeowner.</p>')+\n      '<div class=\"acts\"><button class=\"btn ghost\" data-m=\"addinsp\">'+ICON.cam+'Add photos</button><button class=\"btn ghost\" data-m=\"report\"'+(list.length?'':' disabled')+'>Create report</button></div></div>';\n  }\n  var inspPicker=null;\n  function addInspSheet(quoteId){\n    var ov=sheet('<h3>Inspection photos'+closeBtn()+'</h3><label class=\"f\">What do they show?</label><select class=\"in\" id=\"it\">'+(M.tags||[]).map(function(t){return '<option>'+esc(t)+'</option>';}).join('')+'</select>'+\n      '<label class=\"f\">Note <small>(optional)</small></label><input class=\"in\" id=\"inote\" maxlength=\"300\" placeholder=\"e.g. Cracked boot over bathroom\"><button class=\"btn block mt\" id=\"igo\">'+ICON.cam+'Take or choose photos</button>');\n    ov.querySelector('#igo').onclick=function(){\n      if(!inspPicker){inspPicker=document.createElement('input');inspPicker.type='file';inspPicker.accept='image/*';inspPicker.multiple=true;inspPicker.className='vh';document.body.appendChild(inspPicker);}\n      var tag=ov.querySelector('#it').value,note=ov.querySelector('#inote').value;\n      inspPicker.onchange=function(){var files=Array.prototype.slice.call(inspPicker.files||[],0,20);inspPicker.value='';if(!files.length)return;closeSheet();uploadInsp(quoteId,files,tag,note);};\n      inspPicker.click();\n    };\n  }\n  function uploadInsp(quoteId,files,tag,note){\n    S.upload={total:files.length,done:0,failed:0};drawProg();var errs=[];var seq=Promise.resolve();\n    files.forEach(function(file){seq=seq.then(function(){return shrink(file).then(function(sh){\n      return call('addInspection',{quoteId:quoteId,base64:sh.base64,tag:tag,note:note}).then(function(r){S.prev[r.id]=sh.thumb;(M.inspections=M.inspections||[]).push(r);});\n    }).catch(function(e){S.upload.failed++;errs.push(e.message);}).then(function(){S.upload.done++;drawProg();});});});\n    seq.then(function(){var u=S.upload;S.upload=null;drawProg();render();toast(u.failed?u.failed+' didn\u2019t upload: '+errs[0]:u.total+' photo'+(u.total===1?'':'s')+' added',!!u.failed);});\n  }\n  function inspSheet(id){\n    var r=(M.inspections||[]).filter(function(z){return z.id===id;})[0];if(!r)return;\n    var ov=sheet('<h3>'+esc(r.tag)+closeBtn()+'</h3><img class=\"big\" src=\"'+esc(img(r.id,1200))+'\" alt=\"\">'+\n      '<label class=\"f\">Tag</label><select class=\"in\" id=\"it2\">'+(M.tags||[]).map(function(t){return '<option'+(t===r.tag?' selected':'')+'>'+esc(t)+'</option>';}).join('')+'</select>'+\n      '<label class=\"f\">Note</label><input class=\"in\" id=\"in2\" maxlength=\"300\" value=\"'+esc(r.note||'')+'\">'+\n      '<div class=\"acts\"><button class=\"btn danger\" id=\"idel\">Delete</button><button class=\"btn\" id=\"isv\">Save</button></div>');\n    ov.querySelector('#isv').onclick=function(){call('saveInspection',{id:r.id,tag:ov.querySelector('#it2').value,note:ov.querySelector('#in2').value}).then(function(n){Object.assign(r,n);closeSheet();render();toast('Saved');}).catch(err);};\n    ov.querySelector('#idel').onclick=function(){call('deleteInspection',{id:r.id}).then(function(){M.inspections=M.inspections.filter(function(z){return z.id!==r.id;});closeSheet();render();toast('Deleted');}).catch(err);};\n  }\n  function reportSheet(){\n    var x=q();\n    var ov=sheet('<h3>Inspection report'+closeBtn()+'</h3><p class=\"sub\">Makes a PDF with all '+inspOf(x).length+' photos and notes, saved in Google Drive.</p>'+\n      '<label class=\"f\">Email it to <small>(optional)</small></label><input class=\"in\" id=\"rem\" type=\"email\" value=\"'+esc(x.email||'')+'\" placeholder=\"customer@email.com\">'+\n      '<div class=\"acts\"><button class=\"btn ghost\" id=\"rmk\">Create PDF</button><button class=\"btn\" id=\"rme\">Create &amp; email</button></div><div id=\"rout\"></div>');\n    function go(withEmail,b){var em=ov.querySelector('#rem').value.trim();if(withEmail&&!validEmail(em)){toast('Add a valid email.',true);return;}\n      b.disabled=true;b.textContent='Making PDF\u2026';\n      call('inspectionReport',{quoteId:x.id,email:withEmail?em:''}).then(function(r){\n        var msg='Here are the photos from your roof inspection: '+r.url;\n        ov.querySelector('#rout').innerHTML='<div class=\"note ok mt\">Report ready'+(r.emailed?' and emailed to '+esc(r.emailed):'')+'.</div><div class=\"acts\"><a class=\"btn ghost\" href=\"'+esc(r.url)+'\" target=\"_blank\" rel=\"noopener\">Open PDF</a><a class=\"btn ghost\" href=\"'+esc(smsHref(x.phone,msg))+'\" target=\"_top\">Text link</a></div>';\n        b.textContent='Done';}).catch(function(e){b.disabled=false;b.textContent=withEmail?'Create & email':'Create PDF';err(e);});}\n    ov.querySelector('#rmk').onclick=function(){go(false,this);};\n    ov.querySelector('#rme').onclick=function(){go(true,this);};\n  }\n\n  /* ----- wrap-up: review + warranty ----- */\n  function wrapCard(x){\n    var s=M.settings;var msg='Thanks for choosing Team Forte! If you\u2019re happy with your roof, would you leave us a quick Google review? '+(s.reviewLink||'');\n    return '<div class=\"card\"><h2>Wrap-up</h2>'+\n      kv('Review request',x.reviewAt?'Sent '+dateStr(x.reviewAt):'Not sent')+\n      (s.reviewLink?'<div class=\"acts\">'+(validEmail(x.email)?'<button class=\"btn ghost\" data-m=\"revmail\">Email request</button>':'<span></span>')+'<a class=\"btn ghost\" href=\"'+esc(smsHref(x.phone,msg))+'\" target=\"_top\">Text request</a></div>':'<p class=\"hint\">Add your Google review link in Spending \u203a Settings to send review requests.</p>')+\n      '<div class=\"toggle\" style=\"margin-top:12px\"><div class=\"tl\"><b>Warranty registered</b><span>Owens Corning registration for this roof</span></div><button class=\"sw'+(x.warrantyDone?' on':'')+'\" role=\"switch\" aria-checked=\"'+(x.warrantyDone?'true':'false')+'\" aria-label=\"Warranty registered\" data-m=\"warranty\"></button></div>'+\n      (s.warrantyLink?'<a class=\"drive\" href=\"'+esc(s.warrantyLink)+'\" target=\"_blank\" rel=\"noopener\">'+ICON.eye+'Open warranty registration</a>':'')+'</div>';\n  }\n\n  /* ----- crew ----- */\n  function loadCrew(){return call('crewJobs').then(function(j){M.crewJobs=j||[];M.tags=M.tags&&M.tags.length?M.tags:['Missing or damaged shingles','Lifted or creased shingles','Pipe boot','Flashing','Chimney','Soft or rotted decking','Valley','Ventilation','Gutters / drip edge','Leak / water stain','Other'];M.crewLoaded=true;}).catch(function(e){toast(e.message,true);});}\n  function renderCrew(){\n    if(!M.crewLoaded){app.innerHTML=bar('<div class=\"brand\">JOBS</div>')+'<div class=\"loading\"><div class=\"spin dk\"></div></div>';loadCrew().then(render);return;}\n    if(M.view==='crewjob'){var j=M.crewJobs.filter(function(z){return z.id===M.qid;})[0];if(j)return renderCrewJob(j);M.view='list';}\n    var h=bar('<div class=\"brand\">JOBS</div><button class=\"link\" data-m=\"crewreload\">Refresh</button><button class=\"link\" data-act=\"logout\">Log out</button>')+'<div class=\"wrap\">'+\n      '<p class=\"sub mt\">Hi '+esc(S.user.name)+'. Upcoming jobs, soonest first.</p>';\n    if(!M.crewJobs.length)h+='<div class=\"empty\"><b>No jobs scheduled</b>Approved jobs show up here.</div>';\n    h+=M.crewJobs.map(function(j){\n      return '<button class=\"q\" data-m=\"crewopen\" data-id=\"'+esc(j.id)+'\"><div class=\"top\"><div><div class=\"nm\">'+esc(j.installDate?dateStr(j.installDate):'Not scheduled')+'</div><div class=\"ad\">'+esc(j.address)+'</div></div><span class=\"pill '+j.status+'\">'+ST_LABEL[j.status]+'</span></div>'+\n        '<div class=\"pills\">'+j.scope.slice(0,2).map(function(s){return '<span class=\"pill\">'+esc(s)+'</span>';}).join('')+(j.crew?'<span class=\"pill\">'+esc(j.crew)+'</span>':'')+'</div></button>';\n    }).join('');\n    app.innerHTML=h+'</div>';\n  }\n  function renderCrewJob(j){\n    var h=bar('<button class=\"back\" data-m=\"crewback\">'+ICON.back+'Jobs</button><div class=\"bar-title\">'+esc(String(j.address).split(',')[0])+'</div>')+'<div class=\"wrap\">';\n    h+='<div class=\"card\"><h2>'+esc(j.installDate?dateStr(j.installDate):'Not scheduled')+(j.crew?' <small>'+esc(j.crew)+'</small>':'')+'</h2>'+\n      kv('Address','<a href=\"https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(j.address)+'\" target=\"_blank\" rel=\"noopener\">'+esc(j.address)+'</a>')+\n      (j.name?kv('Customer',esc(j.name)):'')+(j.phone?kv('Phone','<a href=\"tel:'+esc(String(j.phone).replace(/[^\\d+]/g,''))+'\" target=\"_top\">'+esc(j.phone)+'</a>'):'')+\n      j.scope.map(function(s){return kv('Work',esc(s));}).join('')+\n      (j.roofs||[]).map(function(r){return kv(esc(r.n||'Roof'),Number(r.s||0).toLocaleString()+' sq ft \u00b7 '+esc(r.p||''));}).join('')+\n      (j.layers>1?kv('Layers to tear off',String(j.layers)):'')+\n      (j.notes?'<div class=\"note\">'+esc(j.notes)+'</div>':'')+'</div>';\n    if(j.materials.length)h+='<div class=\"card\"><h2>Materials</h2>'+j.materials.map(function(m){return kv(esc(m.name),'<span class=\"money\">'+m.qty+' '+esc(units(m.unit,m.qty))+'</span>');}).join('')+'</div>';\n    h+='<div class=\"card\"><h2>Photos &amp; notes</h2><div class=\"acts\">'+(j.photoJobId?'<button class=\"btn\" data-m=\"crewphotos\">Job photos</button>':'<span></span>')+'<button class=\"btn ghost\" data-m=\"crewinsp\">Problem photo</button></div>'+\n      '<label class=\"f\">Note for the office</label><div class=\"row\"><input class=\"in\" id=\"cnote\" maxlength=\"300\" placeholder=\"e.g. Need 2 more sheets of decking\"><button class=\"btn dark\" data-m=\"crewnote\" style=\"flex:0 0 auto\">Send</button></div>'+\n      (j.events||[]).slice().reverse().map(function(e){return '<p class=\"hint\">'+esc(e.e.replace(/^crew: /,''))+' \u00b7 '+dateStr(e.t)+'</p>';}).join('')+'</div>';\n    app.innerHTML=h+'</div>';\n  }\n\n  /* ----- spending: jobs ----- */\n  function moneyJobs(){\n    var jobs=M.quotes.filter(function(x){return (x.status==='approved'||x.status==='ordered'||x.status==='done')&&x.contractPrice;});\n    if(!jobs.length)return '<div class=\"empty\"><b>No jobs yet</b>Approved jobs with a price show their profit here.</div>';\n    var ym=new Date().toISOString().slice(0,7);var mon={rev:0,profit:0};\n    var rows=jobs.map(function(x){var p=jobProfit(x);if(String(x.approvedAt||x.created).slice(0,7)===ym){mon.rev+=p.rev;mon.profit+=p.profit;}\n      return '<button class=\"ln\" data-m=\"openjobq\" data-id=\"'+esc(x.id)+'\"><div class=\"l1\"><b>'+esc(x.name||x.id)+' \u00b7 '+esc(townOf(x.address)||'')+'</b><span>'+(x.type==='repair'?'Repair':'Replacement')+' \u00b7 '+ST_LABEL[x.status]+' \u00b7 '+money(p.rev,false)+'</span></div>'+\n        '<div class=\"l2 money\" style=\"color:'+(p.profit<0?'#B3261E':'var(--green)')+'\">'+money(p.profit,false)+'<span>'+p.margin+'% margin</span></div></button>';}).join('');\n    return '<div class=\"stats\"><div class=\"stat\"><b class=\"money\">'+k(mon.rev)+'</b><span>Sold this month</span></div><div class=\"stat\"><b class=\"money\">'+k(mon.profit)+'</b><span>Profit (est.)</span></div><div class=\"stat\"><b>'+(mon.rev?Math.round(mon.profit/mon.rev*100):0)+'%</b><span>Margin</span></div></div><div class=\"card\">'+rows+'</div>';\n  }\n\n  /* ----- settings: extra cards ----- */\n  function settingsExtraCards(){\n    var s=M.settings;var c=s.company||{};var g=s.ghl||{};\n    var h='<div class=\"card\"><h2>Company <small>shown on proposals</small></h2>'+\n      '<div class=\"row\"><div><label class=\"f\">Name</label><input class=\"in\" name=\"co_name\" value=\"'+esc(c.name)+'\"></div><div><label class=\"f\">Legal name</label><input class=\"in\" name=\"co_legal\" value=\"'+esc(c.legal)+'\"></div></div>'+\n      '<label class=\"f\">Address</label><input class=\"in\" name=\"co_address\" value=\"'+esc(c.address)+'\">'+\n      '<div class=\"row\"><div><label class=\"f\">Phone</label><input class=\"in\" name=\"co_phone\" value=\"'+esc(c.phone)+'\"></div><div><label class=\"f\">Email</label><input class=\"in\" name=\"co_email\" value=\"'+esc(c.email)+'\"></div></div>'+\n      '<label class=\"f\">CT HIC registration #</label><input class=\"in\" name=\"co_hic\" value=\"'+esc(c.hic)+'\" placeholder=\"HIC.0000000\"></div>'+\n      '<div class=\"card\"><h2>Proposals &amp; deposits</h2><div class=\"row\"><div><label class=\"f\">Deposit %</label><input class=\"in money\" name=\"depositPct\" inputmode=\"decimal\" value=\"'+(s.depositPct!=null?s.depositPct:30)+'\"></div></div>'+\n      '<label class=\"f\">Deposit payment link <small>(GoHighLevel payment link)</small></label><input class=\"in\" name=\"depositLink\" value=\"'+esc(s.depositLink||'')+'\" placeholder=\"https://\u2026\">'+\n      '<p class=\"hint\">In GoHighLevel: Payments \u203a Payment Links. Make a link where the customer types the amount (or one per deposit size) and paste it here.</p>'+\n      '<label class=\"f\">Terms</label><textarea class=\"in\" name=\"terms\" style=\"min-height:110px\">'+esc(s.terms||'')+'</textarea></div>'+\n      '<div class=\"card\"><h2>Job cost defaults</h2><div class=\"row\"><div><label class=\"f\">Cost per crew day</label><input class=\"in money\" name=\"crewDayRate\" inputmode=\"decimal\" value=\"'+s.crewDayRate+'\"></div>'+\n      '<div><label class=\"f\">Dumpster</label><input class=\"in money\" name=\"dumpster\" inputmode=\"decimal\" value=\"'+s.dumpster+'\"></div><div><label class=\"f\">Permit</label><input class=\"in money\" name=\"permit\" inputmode=\"decimal\" value=\"'+s.permit+'\"></div></div></div>'+\n      '<div class=\"card\"><h2>Reviews &amp; warranty</h2><label class=\"f\">Google review link</label><input class=\"in\" name=\"reviewLink\" value=\"'+esc(s.reviewLink||'')+'\" placeholder=\"https://g.page/r/\u2026/review\">'+\n      '<div class=\"toggle\" style=\"margin-top:12px\"><div class=\"tl\"><b>Email a review request automatically</b><span>When a job is marked done and the customer has an email</span></div><button type=\"button\" class=\"sw'+(s.autoReview!==false?' on':'')+'\" role=\"switch\" data-sw=\"autoReview\" aria-checked=\"'+(s.autoReview!==false)+'\" aria-label=\"Automatic review email\"></button></div>'+\n      '<label class=\"f\">Warranty registration link <small>(optional)</small></label><input class=\"in\" name=\"warrantyLink\" value=\"'+esc(s.warrantyLink||'')+'\" placeholder=\"https://\u2026\"></div>';\n    if(isOwner()){\n      h+='<div class=\"card\"><h2>GoHighLevel <small>'+(g.connected?'<span class=\"pill done\">Connected</span>':'<span class=\"pill\">Not connected</span>')+'</small></h2>'+\n        '<p class=\"hint\">GoHighLevel \u203a Settings \u203a Private Integrations \u203a Create. Give it Contacts and Opportunities access (view and edit) and paste the token here.</p>'+\n        '<label class=\"f\">Private integration token</label><input class=\"in\" name=\"ghlToken\" autocomplete=\"off\" placeholder=\"'+(s.hasGhlToken?'Saved. Paste to replace':'pit-\u2026')+'\">'+\n        '<div id=\"ghlsel\">'+kv('Pipeline','Sales Pipeline')+kv('When a quote is sent','Quote Sent')+kv('When a job is approved','Won - Signed &amp; Scheduled')+'</div>'+\n        '<div class=\"toggle\" style=\"margin-top:8px\"><div class=\"tl\"><b>Sync quotes and jobs</b><span>Contacts and deals in your Sales Pipeline</span></div><button type=\"button\" class=\"sw'+(g.enabled!==false?' on':'')+'\" role=\"switch\" data-sw=\"ghlEnabled\" aria-checked=\"'+(g.enabled!==false)+'\" aria-label=\"Sync with GoHighLevel\"></button></div>'+\n        '<button type=\"button\" class=\"btn ghost block mt\" data-m=\"ghltest\">Check connection</button></div>';\n      h+='<div class=\"card\"><h2>People &amp; logins</h2><p class=\"hint\">Your setup passcode is the owner login. Office: everything except logins and keys. Crew: their jobs and photos only, no prices.</p><div id=\"people\"><div class=\"loading\" style=\"padding:12px\"><div class=\"spin dk\"></div></div></div>'+\n        '<div class=\"acts\"><button type=\"button\" class=\"btn ghost\" data-m=\"addperson\">'+ICON.plus+'Add person</button><button type=\"button\" class=\"btn dark\" data-m=\"savepeople\">Save people</button></div></div>';\n    }\n    return h;\n  }\n  function personRow(u){return '<div class=\"row person\" style=\"margin-top:8px\" data-id=\"'+esc(u.id||'')+'\"><input class=\"in\" data-pn placeholder=\"Name\" value=\"'+esc(u.name||'')+'\"><select class=\"in\" data-pr style=\"flex:0 0 96px\"><option value=\"crew\"'+(u.role!=='office'?' selected':'')+'>Crew</option><option value=\"office\"'+(u.role==='office'?' selected':'')+'>Office</option></select><input class=\"in\" data-pp placeholder=\"PIN\" style=\"flex:0 0 96px\" value=\"'+esc(u.pin||'')+'\"></div>';}\n  function loadPeople(){var box=document.getElementById('people');if(!box)return;call('users').then(function(list){box=document.getElementById('people');if(box)box.innerHTML=list.length?list.map(personRow).join(''):'<p class=\"hint\" id=\"nopeople\">No one yet.</p>';}).catch(err);}\n  function extraSettingsArgs(f){\n    var el=f.elements;var sw=function(n){var b=f.querySelector('[data-sw=\"'+n+'\"]');return b?b.classList.contains('on'):undefined;};\n    var a={company:{name:el.co_name.value,legal:el.co_legal.value,address:el.co_address.value,phone:el.co_phone.value,email:el.co_email.value,hic:el.co_hic.value},\n      depositPct:el.depositPct.value,depositLink:el.depositLink.value,terms:el.terms.value,crewDayRate:el.crewDayRate.value,dumpster:el.dumpster.value,permit:el.permit.value,\n      reviewLink:el.reviewLink.value,warrantyLink:el.warrantyLink.value,autoReview:sw('autoReview')};\n    if(el.ghlToken){if(el.ghlToken.value.trim())a.ghlToken=el.ghlToken.value.trim();a.ghl={enabled:sw('ghlEnabled')};\n      ['pipelineId','stageQuote','stageWon'].forEach(function(k2){if(el['g_'+k2])a.ghl[k2]=el['g_'+k2].value;});}\n    return a;\n  }\n\n  /* ----- repair book on the Quote prices screen ----- */\n  function repairBookCard(){\n    var r=M.repairs;\n    return '<div class=\"card\"><h2>Repair prices</h2><div class=\"row\"><div><label class=\"f\">Minimum service charge</label><input class=\"in money\" id=\"rbmin\" inputmode=\"decimal\" value=\"'+r.min+'\"></div></div>'+\n      '<div id=\"rbrows\">'+r.items.map(rbRow).join('')+'</div><button type=\"button\" class=\"btn ghost block mt\" data-m=\"rbadd\">'+ICON.plus+'Add repair</button></div>';\n  }\n  function rbRow(it){return '<div class=\"row rb\" style=\"margin-top:8px\" data-key=\"'+esc(it.key||'')+'\"><input class=\"in\" data-rn value=\"'+esc(it.name||'')+'\" placeholder=\"Repair\"><input class=\"in\" data-ru style=\"flex:0 0 70px\" value=\"'+esc(it.unit||'each')+'\"><input class=\"in money\" data-rp style=\"flex:0 0 84px\" inputmode=\"decimal\" value=\"'+(it.price!=null?it.price:'')+'\" placeholder=\"$\"></div>';}\n  function readRepairBook(){\n    var items=[];document.querySelectorAll('#rbrows .rb').forEach(function(r){var n=r.querySelector('[data-rn]').value.trim();if(!n)return;items.push({key:r.getAttribute('data-key')||'',name:n,unit:r.querySelector('[data-ru]').value.trim()||'each',price:Number(r.querySelector('[data-rp]').value)||0});});\n    return {min:Number((document.getElementById('rbmin')||{}).value)||0,items:items};\n  }\n\n  /* ---------- clicks ---------- */\n  function click(t,ev){\n    if(ev&&t.tagName==='A'&&t.getAttribute('href')==='#')ev.preventDefault();\n    var a=t.getAttribute('data-m');\n    if(a==='retry'){M.failed=false;render();return;}\n    if(a==='editcust'){editCustSheet();return;}\n    if(a==='ghlsync'){call('ghlSyncNow',{id:M.qid}).then(function(r){mergeQ(r);render();toast('Synced to GoHighLevel');}).catch(function(e){load().then(render);err(e);});return;}\n    if(a==='edititems'){editItemsSheet();return;}\n    if(a==='approverep'){t.disabled=true;saveQ({status:'approved'},'Approved').then(function(){M.qfilter='approved';call('list').then(function(d){S.jobs=d.jobs||[];});}).catch(function(){t.disabled=false;});return;}\n    if(a==='propose'){proposeSheet();return;}\n    if(a==='savesched'){saveQ({installDate:document.getElementById('sd').value,crew:document.getElementById('sc').value},'Schedule saved');return;}\n    if(a==='editcosts'){costsSheet();return;}\n    if(a==='addinsp'){addInspSheet(M.qid);return;}\n    if(a==='insp'){inspSheet(t.getAttribute('data-id'));return;}\n    if(a==='report'){reportSheet();return;}\n    if(a==='revmail'){t.disabled=true;call('reviewEmail',{id:M.qid}).then(function(r){mergeQ(r);render();toast('Review request sent');}).catch(function(e){t.disabled=false;err(e);});return;}\n    if(a==='warranty'){var wx=q();saveQ({warrantyDone:!wx.warrantyDone},!wx.warrantyDone?'Warranty marked registered':'Saved');return;}\n    if(a==='openjobq'){S.tab='quotes';store('tfp_tab','quotes');M.qid=t.getAttribute('data-id');M.view='quote';render();window.scrollTo(0,0);return;}\n    if(a==='crewopen'){M.qid=t.getAttribute('data-id');M.view='crewjob';render();window.scrollTo(0,0);return;}\n    if(a==='crewback'){M.view='list';render();window.scrollTo(0,0);return;}\n    if(a==='crewreload'){M.crewLoaded=false;render();return;}\n    if(a==='crewphotos'){var cj=M.crewJobs.filter(function(z){return z.id===M.qid;})[0];S.tab='photos';store('tfp_tab','photos');S.jobId=cj.photoJobId;S.view='job';\n      if(!S.jobs.some(function(j){return j.id===cj.photoJobId;}))call('list').then(function(d){S.jobs=d.jobs||[];render();});render();window.scrollTo(0,0);return;}\n    if(a==='crewinsp'){addInspSheet(M.qid);return;}\n    if(a==='crewnote'){var ni=document.getElementById('cnote');var nv=ni.value.trim();if(!nv)return;t.disabled=true;\n      call('crewNote',{id:M.qid,note:nv}).then(function(){var cj2=M.crewJobs.filter(function(z){return z.id===M.qid;})[0];cj2.events=(cj2.events||[]).concat([{e:'crew: '+nv+' ('+S.user.name+')',t:new Date().toISOString()}]);render();toast('Sent to the office');}).catch(function(e){t.disabled=false;err(e);});return;}\n    if(a==='ghltest'){var gf=document.getElementById('sf');t.disabled=true;\n      saveSettings(gf,(document.querySelector('#aenv .on')||{getAttribute:function(){return 'sandbox';}}).getAttribute('data-env')).then(function(){return call('ghlPipelines');}).then(function(list){\n        var g=M.settings.ghl||{};var box=document.getElementById('ghlsel');\n        function sel(name,opts,cur){return '<select class=\"in\" name=\"'+name+'\">'+opts.map(function(o){return '<option value=\"'+esc(o.id)+'\"'+(o.id===cur?' selected':'')+'>'+esc(o.name)+'</option>';}).join('')+'</select>';}\n        var pl=list.filter(function(x){return x.id===g.pipelineId;})[0]||list[0];\n        if(box&&pl)box.innerHTML='<label class=\"f\">Pipeline</label>'+sel('g_pipelineId',list,g.pipelineId)+'<label class=\"f\">When a quote is sent</label>'+sel('g_stageQuote',pl.stages,g.stageQuote)+'<label class=\"f\">When a job is approved</label>'+sel('g_stageWon',pl.stages,g.stageWon);\n        toast('GoHighLevel is connected');}).catch(function(e){if(e.message!=='bad')err(e);}).then(function(){var b=document.querySelector('[data-m=ghltest]');if(b)b.disabled=false;});return;}\n    if(a==='addperson'){var pb=document.getElementById('people');var np=document.getElementById('nopeople');if(np)np.remove();pb.insertAdjacentHTML('beforeend',personRow({role:'crew'}));return;}\n    if(a==='savepeople'){var ppl=[];document.querySelectorAll('#people .person').forEach(function(r){var nm=r.querySelector('[data-pn]').value.trim(),pn=r.querySelector('[data-pp]').value.trim();if(!nm&&!pn)return;ppl.push({id:r.getAttribute('data-id')||undefined,name:nm,role:r.querySelector('[data-pr]').value,pin:pn});});\n      t.disabled=true;call('saveUsers',{users:ppl}).then(function(){loadPeople();toast('People saved');}).catch(err).then(function(){t.disabled=false;});return;}\n    if(a==='rbadd'){document.getElementById('rbrows').insertAdjacentHTML('beforeend',rbRow({unit:'each'}));return;}\n    if(a==='newest'){newEst();M.view='new';render();window.scrollTo(0,0);var ea=document.getElementById('ea');if(ea)ea.focus();return;}\n    if(a==='pricing'){M.view='pricing';render();window.scrollTo(0,0);return;}\n    if(a==='measure'){measure();return;}\n    if(a==='colors'){colorBook(1,null,'');return;}\n    if(a==='addroof'){M.est.roofs.push({n:M.est.roofs.length===1?'Garage':'Section '+(M.est.roofs.length+1),s:0,p:'4/12'});render();return;}\n    if(a==='rmroof'){M.est.roofs.splice(+t.getAttribute('data-i'),1);render();return;}\n    if(a==='addnear'){var nx=M.est.m&&M.est.m.nearby&&M.est.m.nearby[+t.getAttribute('data-i')];if(nx){M.est.roofs.push({n:nx.row.n,s:nx.row.s,p:nx.row.p,f:nx.row.f});M.est.m.nearby.splice(+t.getAttribute('data-i'),1);}render();return;}\n    if(a==='saveest'){saveEst(t.getAttribute('data-v')==='email');return;}\n    if(a==='share'){shareSheet();return;}\n    if(a==='qf'){M.qfilter=t.getAttribute('data-v');render();return;}\n    if(a==='addlink'){addLinkSheet();return;}\n    if(a==='openq'){M.qid=t.getAttribute('data-id');M.view='quote';M.draft=null;render();window.scrollTo(0,0);return;}\n    if(a==='back'){M.view='list';render();window.scrollTo(0,0);return;}\n    if(a==='approve'){approve();return;}\n    if(a==='archive'){confirmBox('Archive this quote?','It will be hidden from your Quotes list. Orders already placed are kept.','Archive').then(function(ok){if(!ok)return;\n      call('deleteQuote',{id:M.qid}).then(function(){M.quotes=M.quotes.filter(function(x){return x.id!==M.qid;});M.view='list';render();toast('Archived');}).catch(err);});return;}\n    if(a==='recalc'){recalc();return;}\n    if(a==='line'){lineSheet(+t.getAttribute('data-i'));return;}\n    if(a==='addline'){addLineSheet();return;}\n    if(a==='editjob'){editJobSheet();return;}\n    if(a==='status'){saveQ({status:t.getAttribute('data-v')},t.getAttribute('data-v')==='done'?'Marked done':'Reopened');return;}\n    if(a==='photos'){var x=q();S.tab='photos';store('tfp_tab','photos');S.jobId=x.photoJobId;S.view='job';\n      if(!S.jobs.some(function(j){return j.id===x.photoJobId;}))call('list').then(function(d){S.jobs=d.jobs||[];render();});render();window.scrollTo(0,0);return;}\n    if(a==='order'){orderSheet(t.getAttribute('data-v'));return;}\n    if(a==='openo'){orderDetail(t.getAttribute('data-id'));return;}\n    if(a==='mtab'){M.money=t.getAttribute('data-v');render();return;}\n    if(a==='price'){priceSheet(t.getAttribute('data-k'));return;}\n    if(a==='refresh'){t.disabled=true;t.textContent='Refreshing\u2026';call('refreshPrices').then(function(r){return load().then(function(){render();toast(r.updated+' prices updated'+(r.failed.length?', '+r.failed.length+' failed':''));});}).catch(function(e){render();err(e);});return;}\n    if(a==='settings'){M.mview='settings';render();window.scrollTo(0,0);return;}\n    if(a==='mhome'){M.mview='home';render();window.scrollTo(0,0);return;}\n    if(a==='addsup'){document.getElementById('sups').insertAdjacentHTML('beforeend',supRow({name:'',email:''}));return;}\n    if(a==='abctest'){var f=document.getElementById('sf');t.disabled=true;\n      saveSettings(f,document.querySelector('#aenv .on').getAttribute('data-env')).then(function(){return call('abcTest');}).then(function(r){toast('ABC login works ('+(r.env==='production'?'Live':'Test')+')');})\n        .catch(function(e){if(e.message!=='bad')err(e);}).then(function(){var b=document.querySelector('[data-m=abctest]');if(b)b.disabled=false;});return;}\n    if(a==='branches'){var box=document.getElementById('brs');box.innerHTML='<div class=\"loading\" style=\"padding:16px\"><div class=\"spin dk\"></div></div>';\n      saveSettings(document.getElementById('sf'),document.querySelector('#aenv .on').getAttribute('data-env')).then(function(){return call('abcBranches',{state:'CT'});}).then(function(list){\n        box=document.getElementById('brs');\n        box.innerHTML=list.length?list.map(function(b){return '<button type=\"button\" class=\"res\" data-m=\"pickbr\" data-n=\"'+esc(b.number)+'\" data-nm=\"'+esc(b.name||b.city)+'\"><b>'+esc(b.name||'Branch '+b.number)+'</b><span>#'+esc(b.number)+' \u00b7 '+esc(b.city)+'</span></button>';}).join(''):'<p class=\"hint\">No branches found.</p>';\n      }).catch(function(e){var bx=document.getElementById('brs');if(bx)bx.innerHTML='';if(e.message!=='bad')err(e);});return;}\n    if(a==='pickbr'){var fm=document.getElementById('sf');fm.elements.branch.value=t.getAttribute('data-n');fm.elements.branchName.value=t.getAttribute('data-nm');document.getElementById('brs').innerHTML='';toast('Branch picked. Tap Save settings.');return;}\n    if(a==='hook'){t.disabled=true;call('abcRegisterWebhook').then(function(r){M.settings=r;render();toast('Order updates turned on');}).catch(function(e){t.disabled=false;err(e);});return;}\n    if(a==='disc'){confirmBox('Disconnect ABC Supply?','Your ABC login is removed from the app. Prices and past orders stay.','Disconnect').then(function(ok){if(!ok)return;\n      call('saveSettings',{abc:{disconnect:true}}).then(function(r){M.settings=r;render();toast('Disconnected');}).catch(err);});return;}\n  }\n\n  return {\n    render:renderMat, click:click, load:load, loadCrew:loadCrew,\n    reset:function(){M.loaded=false;M.quotes=[];M.orders=[];M.prices=[];M.view='list';M.mview='home';},\n    home:function(){M.view='list';M.mview='home';},\n    newCount:function(){return M.quotes.filter(function(x){return x.status==='new';}).length;}\n  };\n})();\n\n\n/* ---------- start ---------- */\nvar saved=load('tfp_pass');\nif(saved){S.pass=saved;boot();}else{render();}\n})();\n</script>\n</body>\n</html>\n";

var WIDGET_JS = "/* Team Forte website gallery. Loads jobs and photos from Team Forte Photos (Google Drive). */\n(function () {\n  'use strict';\n  if (window.TFGallery && window.TFGallery.version) { window.TFGallery.scan(); return; }\n\n  var EXEC = '__EXEC_URL__';\n  try {\n    var cs = document.currentScript;\n    if (cs && cs.src && cs.src.indexOf('/exec') > 0) EXEC = cs.src.split('?')[0];\n  } catch (e) { /* use baked url */ }\n\n  var STAGE_LABEL = { before: 'Before', during: 'During', after: 'After' };\n  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];\n  var dataPromise = null;\n\n  var CSS = '' +\n    '.tfg{--tfg-navy:#13202F;--tfg-red:#FF5440;--tfg-red-dk:#E23E2B;--tfg-ink:#1C2430;--tfg-muted:#5B6675;--tfg-line:#DDE2E8;--tfg-slate:#F2F4F7;--tfg-card:#fff;' +\n    'font-family:Montserrat,\"Segoe UI\",Arial,sans-serif;color:var(--tfg-ink);text-align:left;line-height:1.45;-webkit-font-smoothing:antialiased;max-width:1180px;margin:0 auto;padding:0 16px}' +\n    '.tfg *,.tfg-modal *{box-sizing:border-box}' +\n    '.tfg img,.tfg-modal img{border:0!important;border-radius:0!important;box-shadow:none!important;padding:0!important;max-width:none!important}' +\n    '.tfg h2,.tfg h3,.tfg p,.tfg button,.tfg a,.tfg span,.tfg-modal h3,.tfg-modal p,.tfg-modal button,.tfg-modal a,.tfg-modal span{font-family:inherit!important}' +\n    '.tfg--dark{--tfg-ink:#fff;--tfg-muted:#C4CCD6;--tfg-line:rgba(255,255,255,.14);--tfg-card:#1B2B3D}' +\n    '.tfg-head{text-align:center;margin:0 auto 22px;max-width:680px}' +\n    '.tfg-head h2{font-size:clamp(26px,4.2vw,38px);line-height:1.15;font-weight:800;margin:0 0 8px;color:var(--tfg-ink);text-transform:none;letter-spacing:0}' +\n    '.tfg-head p{margin:0;color:var(--tfg-muted);font-size:16px}' +\n    '.tfg-tabs{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:0 0 22px}' +\n    '@media(max-width:600px){.tfg-tabs{flex-wrap:nowrap;justify-content:flex-start;overflow-x:auto;margin-left:-16px;margin-right:-16px;padding:2px 16px;scrollbar-width:none}.tfg-tabs::-webkit-scrollbar{display:none}}' +\n    '.tfg-tab{flex:none;appearance:none;border:1px solid var(--tfg-line);background:var(--tfg-card);color:var(--tfg-ink);font:inherit;font-weight:700;font-size:14px;padding:10px 18px;border-radius:999px;cursor:pointer;transition:all .15s;margin:0}' +\n    '.tfg-tab:hover{border-color:var(--tfg-red)}' +\n    '.tfg-tab[aria-selected=\"true\"]{background:var(--tfg-red);border-color:var(--tfg-red);color:#fff}' +\n    '.tfg-grid{display:grid;grid-template-columns:1fr;gap:18px}' +\n    '@media(min-width:600px){.tfg-grid{grid-template-columns:1fr 1fr}}' +\n    '@media(min-width:960px){.tfg-grid{grid-template-columns:1fr 1fr 1fr}}' +\n    '.tfg-card{appearance:none;display:flex;flex-direction:column;width:100%;padding:0;margin:0;text-align:left;font:inherit;color:inherit;background:var(--tfg-card);border:1px solid var(--tfg-line);border-radius:14px;overflow:hidden;cursor:pointer;transition:transform .2s,box-shadow .2s}' +\n    '.tfg-card:hover{transform:translateY(-3px);box-shadow:0 14px 30px rgba(19,32,47,.16)}' +\n    '.tfg-card:focus-visible{outline:3px solid var(--tfg-red);outline-offset:2px}' +\n    '.tfg-img{position:relative;aspect-ratio:4/3;background:#D9DEE4;overflow:hidden}' +\n    '.tfg-img img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .5s;margin:0;max-width:none}' +\n    '.tfg-card:hover .tfg-img img{transform:scale(1.04)}' +\n    '.tfg-split{position:absolute;inset:0;display:grid;grid-template-columns:1fr 1fr;gap:2px;background:#fff}' +\n    '.tfg-split>div{position:relative;overflow:hidden}' +\n    '.tfg-split span{position:absolute;bottom:8px;left:8px;background:rgba(19,32,47,.82);color:#fff;font-size:10px;font-weight:800;letter-spacing:.1em;padding:3px 8px;border-radius:4px;text-transform:uppercase}' +\n    '.tfg-badge{position:absolute;top:10px;left:10px;background:var(--tfg-red);color:#fff;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:5px 10px;border-radius:6px}' +\n    '.tfg-body{padding:14px 16px 16px;display:flex;flex-direction:column;gap:4px;flex:1}' +\n    '.tfg-body h3{font-size:17px;font-weight:800;margin:0;color:var(--tfg-ink);line-height:1.3;text-transform:none;letter-spacing:0}' +\n    '.tfg-meta{font-size:13px;color:var(--tfg-muted);margin:0}' +\n    '.tfg-view{margin-top:auto;padding-top:8px;font-size:14px;font-weight:700;color:var(--tfg-red)}' +\n    '.tfg-more{text-align:center;margin-top:24px}' +\n    '.tfg-btn{appearance:none;display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:0 26px;border-radius:10px;border:0;background:var(--tfg-red);color:#fff;font:inherit;font-weight:800;font-size:15px;cursor:pointer;text-decoration:none;transition:background .15s}' +\n    '.tfg-btn:hover{background:var(--tfg-red-dk);color:#fff}' +\n    '.tfg-btn--ghost{background:transparent;color:var(--tfg-ink);border:2px solid var(--tfg-line)}' +\n    '.tfg-btn--ghost:hover{background:transparent;color:var(--tfg-ink);border-color:var(--tfg-red)}' +\n    '.tfg-sk{border-radius:14px;background:linear-gradient(90deg,rgba(150,160,175,.18),rgba(150,160,175,.32),rgba(150,160,175,.18));background-size:200% 100%;animation:tfg-sh 1.3s infinite;aspect-ratio:4/3.9}' +\n    '@keyframes tfg-sh{to{background-position:-200% 0}}' +\n    /* modal */\n    '.tfg-modal{--tfg-red:#FF5440;--tfg-red-dk:#E23E2B;position:fixed;inset:0;z-index:2147483000;background:rgba(10,16,24,.88);display:flex;align-items:center;justify-content:center;padding:16px;font-family:Montserrat,\"Segoe UI\",Arial,sans-serif;-webkit-font-smoothing:antialiased;animation:tfg-in .18s;text-align:left;line-height:1.45}' +\n    '@keyframes tfg-in{from{opacity:0}to{opacity:1}}' +\n    '.tfg-dlg{background:#fff;color:#1C2430;width:100%;max-width:980px;max-height:100%;overflow:auto;border-radius:16px;box-shadow:0 30px 80px rgba(0,0,0,.45)}' +\n    '@media(max-width:600px){.tfg-modal{padding:0;align-items:stretch}.tfg-dlg{border-radius:0;max-height:none;height:100%}}' +\n    '.tfg-top{position:sticky;top:0;z-index:3;display:flex;align-items:flex-start;gap:12px;padding:16px 16px 12px 20px;background:#fff;border-bottom:1px solid #DDE2E8}' +\n    '.tfg-top h3{margin:0;font-size:19px;font-weight:800;line-height:1.25;color:#1C2430;text-transform:none;letter-spacing:0}' +\n    '.tfg-top p{margin:2px 0 0;font-size:13px;color:#5B6675}' +\n    '.tfg-x{appearance:none;margin-left:auto;flex:none;width:40px;height:40px;border-radius:50%;border:0;background:#F2F4F7;color:#1C2430;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0}' +\n    '.tfg-x:hover{background:#E4E8ED}' +\n    '.tfg-x svg{width:20px;height:20px}' +\n    '.tfg-mtabs{display:flex;gap:6px;padding:12px 20px 0;flex-wrap:wrap}' +\n    '.tfg-mtab{appearance:none;border:1px solid #DDE2E8;background:#fff;color:#1C2430;font:inherit;font-weight:700;font-size:13px;padding:8px 14px;border-radius:999px;cursor:pointer;margin:0}' +\n    '.tfg-mtab[aria-selected=\"true\"]{background:#13202F;border-color:#13202F;color:#fff}' +\n    '.tfg-stage{padding:12px 20px 0}' +\n    '.tfg-cmp{position:relative;width:100%;aspect-ratio:4/3;max-height:60vh;border-radius:12px;overflow:hidden;background:#0E1722;user-select:none;-webkit-user-select:none;touch-action:pan-y;cursor:ew-resize}' +\n    '.tfg-cmp img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;pointer-events:none;margin:0;max-width:none}' +\n    '.tfg-cmp .tfg-after{clip-path:inset(0 0 0 50%)}' +\n    '.tfg-line{position:absolute;top:0;bottom:0;left:50%;width:3px;margin-left:-1.5px;background:#fff;box-shadow:0 0 10px rgba(0,0,0,.4);pointer-events:none}' +\n    '.tfg-knob{position:absolute;top:50%;left:50%;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;background:#fff;box-shadow:0 4px 14px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;color:#13202F;outline:none}' +\n    '.tfg-knob:focus-visible{box-shadow:0 0 0 4px #FF5440,0 4px 14px rgba(0,0,0,.35)}' +\n    '.tfg-knob svg{width:24px;height:24px}' +\n    '.tfg-lbl{position:absolute;top:12px;background:rgba(19,32,47,.85);color:#fff;font-size:11px;font-weight:800;letter-spacing:.12em;padding:5px 10px;border-radius:5px;pointer-events:none}' +\n    '.tfg-lbl.l{left:12px}.tfg-lbl.r{right:12px;background:#FF5440}' +\n    '.tfg-hint{font-size:12px;color:#5B6675;text-align:center;margin:8px 0 0}' +\n    '.tfg-view2{position:relative;width:100%;aspect-ratio:4/3;max-height:60vh;border-radius:12px;overflow:hidden;background:#0E1722;touch-action:pan-y}' +\n    '.tfg-view2 img{width:100%;height:100%;object-fit:contain;display:block;margin:0;max-width:none}' +\n    '.tfg-nav{appearance:none;position:absolute;top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;border:0;background:rgba(255,255,255,.92);color:#13202F;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,.3);padding:0}' +\n    '.tfg-nav svg{width:22px;height:22px}' +\n    '.tfg-nav.p{left:10px}.tfg-nav.n{right:10px}' +\n    '.tfg-nav[disabled]{opacity:0;pointer-events:none}' +\n    '.tfg-tag{position:absolute;top:12px;left:12px;background:rgba(19,32,47,.85);color:#fff;font-size:11px;font-weight:800;letter-spacing:.12em;padding:5px 10px;border-radius:5px;text-transform:uppercase}' +\n    '.tfg-tag.after{background:#FF5440}' +\n    '.tfg-count{position:absolute;bottom:12px;right:12px;background:rgba(0,0,0,.6);color:#fff;font-size:12px;font-weight:700;padding:4px 9px;border-radius:999px}' +\n    '.tfg-cap{font-size:14px;color:#1C2430;margin:10px 0 0;min-height:20px}' +\n    '.tfg-thumbs{display:flex;gap:8px;overflow-x:auto;padding:12px 0 2px;scrollbar-width:thin}' +\n    '.tfg-th{appearance:none;flex:none;width:76px;height:58px;border-radius:7px;overflow:hidden;border:2px solid transparent;padding:0;background:#E4E8ED;cursor:pointer;opacity:.7;position:relative;margin:0}' +\n    '.tfg-th[aria-current=\"true\"]{border-color:#FF5440;opacity:1}' +\n    '.tfg-th img{width:100%;height:100%;object-fit:cover;display:block;margin:0;max-width:none}' +\n    '.tfg-desc{padding:14px 20px 0;font-size:15px;color:#1C2430;margin:0}' +\n    '.tfg-cta{margin:18px 20px 20px;padding:16px 18px;border-radius:12px;background:#13202F;color:#fff;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}' +\n    '.tfg-cta b{font-size:16px;font-weight:800;display:block}' +\n    '.tfg-cta span{font-size:13px;color:#C4CCD6}' +\n    '.tfg-cta .tfg-btn{min-height:46px}' +\n    '@media(max-width:600px){.tfg-cta .tfg-btn{width:100%}.tfg-stage,.tfg-mtabs{padding-left:16px;padding-right:16px}.tfg-desc{padding-left:16px;padding-right:16px}.tfg-cta{margin-left:16px;margin-right:16px}}' +\n    'html.tfg-lock,html.tfg-lock body{overflow:hidden!important}';\n\n  var ICON = {\n    x: '<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\"><path d=\"M18 6L6 18M6 6l12 12\"/></svg>',\n    l: '<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M15 18l-6-6 6-6\"/></svg>',\n    r: '<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M9 6l6 6-6 6\"/></svg>',\n    lr: '<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M9 6l-6 6 6 6M15 6l6 6-6 6\"/></svg>'\n  };\n\n  function esc(s) {\n    return String(s == null ? '' : s).replace(/[&<>\"']/g, function (c) {\n      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', \"'\": '&#39;' }[c];\n    });\n  }\n  function src(id, w) { return 'https://lh3.googleusercontent.com/d/' + encodeURIComponent(id) + '=w' + w; }\n  function alt(id, w) { return 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(id) + '&sz=w' + w; }\n  function imgTag(id, w, altText, cls, eager) {\n    return '<img' + (cls ? ' class=\"' + cls + '\"' : '') + ' src=\"' + src(id, w) + '\" data-alt=\"' + alt(id, w) + '\" alt=\"' + esc(altText) + '\"' +\n      (eager ? '' : ' loading=\"lazy\"') + ' decoding=\"async\" onerror=\"if(this.dataset.alt&&this.src!==this.dataset.alt){this.src=this.dataset.alt}\">';\n  }\n  function month(d) {\n    var m = String(d || '').split('-');\n    return m.length === 2 ? (MONTHS[(+m[1] || 1) - 1] + ' ' + m[0]) : '';\n  }\n  function meta(j) { return [j.town, month(j.date)].filter(Boolean).join(' \\u00b7 '); }\n  function byStage(j, s) { return j.photos.filter(function (p) { return p.stage === s; }); }\n  function pairOf(j) {\n    var b = byStage(j, 'before'), a = byStage(j, 'after');\n    if (!b.length || !a.length) return null;\n    var after = a.filter(function (p) { return p.id === j.cover; })[0] || a[0];\n    return { before: b[0], after: after };\n  }\n\n  function injectCss() {\n    if (document.getElementById('tfg-css')) return;\n    var st = document.createElement('style');\n    st.id = 'tfg-css';\n    st.textContent = CSS;\n    (document.head || document.documentElement).appendChild(st);\n  }\n\n  function loadData() {\n    if (dataPromise) return dataPromise;\n    dataPromise = new Promise(function (resolve, reject) {\n      var cb = '__tfg' + Date.now().toString(36) + Math.floor(Math.random() * 1e6);\n      var s = document.createElement('script');\n      var timer = setTimeout(function () { done(); reject(new Error('timeout')); }, 25000);\n      function done() { clearTimeout(timer); try { delete window[cb]; } catch (e) { window[cb] = undefined; } if (s.parentNode) s.parentNode.removeChild(s); }\n      window[cb] = function (d) { done(); resolve(d); };\n      s.onerror = function () { done(); reject(new Error('load failed')); };\n      s.async = true;\n      s.src = EXEC + '?r=data&callback=' + cb;\n      (document.head || document.documentElement).appendChild(s);\n    });\n    dataPromise.catch(function () { dataPromise = null; });\n    return dataPromise;\n  }\n\n  /* ---------------- section ---------------- */\n  function mount(el) {\n    if (!el || el.getAttribute('data-tfg-ready')) return;\n    el.setAttribute('data-tfg-ready', '1');\n    injectCss();\n    var o = {\n      service: (el.getAttribute('data-service') || 'all').toLowerCase(),\n      featured: el.getAttribute('data-featured') === 'true',\n      limit: parseInt(el.getAttribute('data-limit'), 10) || (el.getAttribute('data-featured') === 'true' ? 6 : 9),\n      tabs: el.getAttribute('data-tabs') !== 'false',\n      title: el.getAttribute('data-title') || '',\n      subtitle: el.getAttribute('data-subtitle') || '',\n      more: el.getAttribute('data-more-href') || '',\n      ctaText: el.getAttribute('data-cta-text') || 'Get a Free Inspection',\n      ctaHref: el.getAttribute('data-cta-href') || 'tel:+18608549335',\n      theme: el.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'\n    };\n    var root = document.createElement('div');\n    root.className = 'tfg tfg--' + o.theme;\n    el.innerHTML = '';\n    el.appendChild(root);\n    root.innerHTML = head(o) + '<div class=\"tfg-grid\">' + [1, 2, 3].map(function () { return '<div class=\"tfg-sk\"></div>'; }).join('') + '</div>';\n\n    loadData().then(function (d) {\n      var jobs = (d && d.jobs) || [];\n      if (o.service !== 'all') jobs = jobs.filter(function (j) { return String(j.service).toLowerCase() === o.service; });\n      if (o.featured) {\n        var f = jobs.filter(function (j) { return j.featured; });\n        if (f.length) jobs = f;\n      }\n      if (!jobs.length) { el.style.display = 'none'; return; }\n      var services = [];\n      jobs.forEach(function (j) { if (services.indexOf(j.service) < 0) services.push(j.service); });\n      var order = (d.services || []);\n      services.sort(function (a, b) { return order.indexOf(a) - order.indexOf(b); });\n      var st = { tab: 'All', shown: o.limit };\n      function draw() {\n        var list = st.tab === 'All' ? jobs : jobs.filter(function (j) { return j.service === st.tab; });\n        var showTabs = o.tabs && o.service === 'all' && !o.featured && services.length > 1;\n        var h = head(o);\n        if (showTabs) {\n          h += '<div class=\"tfg-tabs\" role=\"tablist\">' + ['All'].concat(services).map(function (s) {\n            return '<button type=\"button\" class=\"tfg-tab\" role=\"tab\" aria-selected=\"' + (st.tab === s) + '\" data-tab=\"' + esc(s) + '\">' + esc(s === 'All' ? 'All Work' : s) + '</button>';\n          }).join('') + '</div>';\n        }\n        h += '<div class=\"tfg-grid\">' + list.slice(0, st.shown).map(card).join('') + '</div>';\n        if (list.length > st.shown) {\n          h += '<div class=\"tfg-more\"><button type=\"button\" class=\"tfg-btn tfg-btn--ghost\" data-more>See more work (' + (list.length - st.shown) + ')</button></div>';\n        } else if (o.more) {\n          h += '<div class=\"tfg-more\"><a class=\"tfg-btn\" href=\"' + esc(o.more) + '\">See all our work</a></div>';\n        }\n        root.innerHTML = h;\n      }\n      root.addEventListener('click', function (e) {\n        var t = e.target.closest ? e.target.closest('[data-tab],[data-more],[data-job]') : null;\n        if (!t) return;\n        if (t.hasAttribute('data-tab')) { st.tab = t.getAttribute('data-tab'); st.shown = o.limit; draw(); return; }\n        if (t.hasAttribute('data-more')) { st.shown += o.limit; draw(); return; }\n        var id = t.getAttribute('data-job');\n        for (var i = 0; i < jobs.length; i++) if (jobs[i].id === id) { openJob(jobs[i], o); break; }\n      });\n      draw();\n    }).catch(function () {\n      el.style.display = 'none';\n      el.setAttribute('data-tfg-ready', 'failed');\n    });\n  }\n\n  function head(o) {\n    if (!o.title && !o.subtitle) return '';\n    return '<div class=\"tfg-head\">' + (o.title ? '<h2>' + esc(o.title) + '</h2>' : '') + (o.subtitle ? '<p>' + esc(o.subtitle) + '</p>' : '') + '</div>';\n  }\n\n  function card(j) {\n    var pair = pairOf(j);\n    var visual = pair\n      ? '<div class=\"tfg-split\"><div>' + imgTag(pair.before.id, 600, 'Before: ' + j.title) + '<span>Before</span></div><div>' + imgTag(pair.after.id, 600, 'After: ' + j.title) + '<span>After</span></div></div>'\n      : imgTag(j.cover, 900, j.title);\n    var n = j.photos.length;\n    return '<button type=\"button\" class=\"tfg-card\" data-job=\"' + esc(j.id) + '\" aria-label=\"' + esc(j.title + (j.town ? ' in ' + j.town : '') + ', view ' + n + ' photos') + '\">' +\n      '<div class=\"tfg-img\">' + visual + '<span class=\"tfg-badge\">' + esc(j.service) + '</span></div>' +\n      '<div class=\"tfg-body\"><h3>' + esc(j.title) + '</h3>' + (meta(j) ? '<p class=\"tfg-meta\">' + esc(meta(j)) + '</p>' : '') +\n      '<span class=\"tfg-view\">' + (pair ? 'See before &amp; after' : 'View ' + n + ' photo' + (n === 1 ? '' : 's')) + ' \\u2192</span></div></button>';\n  }\n\n  /* ---------------- job viewer ---------------- */\n  function openJob(j, o) {\n    var pair = pairOf(j);\n    var photos = j.photos.slice();\n    var st = { mode: pair ? 'compare' : 'all', i: 0, pos: 50 };\n    var lastFocus = document.activeElement;\n\n    var m = document.createElement('div');\n    m.className = 'tfg-modal';\n    m.setAttribute('role', 'dialog');\n    m.setAttribute('aria-modal', 'true');\n    m.setAttribute('aria-label', j.title);\n    document.body.appendChild(m);\n    document.documentElement.classList.add('tfg-lock');\n\n    function close() {\n      document.removeEventListener('keydown', onKey);\n      document.documentElement.classList.remove('tfg-lock');\n      if (m.parentNode) m.parentNode.removeChild(m);\n      if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) { /* ignore */ } }\n    }\n    function onKey(e) {\n      if (e.key === 'Escape') close();\n      else if (st.mode === 'all' && e.key === 'ArrowLeft') go(st.i - 1);\n      else if (st.mode === 'all' && e.key === 'ArrowRight') go(st.i + 1);\n    }\n    document.addEventListener('keydown', onKey);\n\n    function go(i) {\n      if (i < 0 || i >= photos.length) return;\n      st.i = i; draw();\n      var cur = m.querySelector('.tfg-th[aria-current=\"true\"]');\n      if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'nearest', inline: 'center' });\n    }\n\n    function stageHtml() {\n      if (st.mode === 'compare') {\n        return '<div class=\"tfg-cmp\" data-cmp>' + imgTag(pair.before.id, 1600, 'Before', '', true) + imgTag(pair.after.id, 1600, 'After', 'tfg-after', true) +\n          '<div class=\"tfg-line\"></div><div class=\"tfg-knob\" role=\"slider\" tabindex=\"0\" aria-label=\"Drag to compare before and after\" aria-valuemin=\"0\" aria-valuemax=\"100\" aria-valuenow=\"50\">' + ICON.lr + '</div>' +\n          '<span class=\"tfg-lbl l\">BEFORE</span><span class=\"tfg-lbl r\">AFTER</span></div>' +\n          '<p class=\"tfg-hint\">Drag the slider to compare</p>';\n      }\n      var p = photos[st.i];\n      return '<div class=\"tfg-view2\" data-view>' + imgTag(p.id, 1600, STAGE_LABEL[p.stage] + ' photo ' + (st.i + 1) + ' of ' + photos.length, '', true) +\n        '<span class=\"tfg-tag ' + p.stage + '\">' + STAGE_LABEL[p.stage] + '</span>' +\n        '<button type=\"button\" class=\"tfg-nav p\" data-go=\"-1\" aria-label=\"Previous photo\"' + (st.i === 0 ? ' disabled' : '') + '>' + ICON.l + '</button>' +\n        '<button type=\"button\" class=\"tfg-nav n\" data-go=\"1\" aria-label=\"Next photo\"' + (st.i === photos.length - 1 ? ' disabled' : '') + '>' + ICON.r + '</button>' +\n        '<span class=\"tfg-count\">' + (st.i + 1) + ' / ' + photos.length + '</span></div>' +\n        '<p class=\"tfg-cap\">' + esc(p.caption || '') + '</p>' +\n        '<div class=\"tfg-thumbs\">' + photos.map(function (q, k) {\n          return '<button type=\"button\" class=\"tfg-th\" data-i=\"' + k + '\" aria-label=\"' + STAGE_LABEL[q.stage] + ' photo ' + (k + 1) + '\" aria-current=\"' + (k === st.i) + '\">' + imgTag(q.id, 200, '') + '</button>';\n        }).join('') + '</div>';\n    }\n\n    function draw() {\n      var tabs = '';\n      if (pair) {\n        tabs = '<div class=\"tfg-mtabs\" role=\"tablist\">' +\n          '<button type=\"button\" class=\"tfg-mtab\" role=\"tab\" data-mode=\"compare\" aria-selected=\"' + (st.mode === 'compare') + '\">Before &amp; After</button>' +\n          '<button type=\"button\" class=\"tfg-mtab\" role=\"tab\" data-mode=\"all\" aria-selected=\"' + (st.mode === 'all') + '\">All photos (' + photos.length + ')</button></div>';\n      }\n      var ctaHref = o.ctaHref;\n      m.innerHTML = '<div class=\"tfg-dlg\">' +\n        '<div class=\"tfg-top\"><div><h3>' + esc(j.title) + '</h3><p>' + esc([j.service, meta(j)].filter(Boolean).join(' \\u00b7 ')) + '</p></div>' +\n        '<button type=\"button\" class=\"tfg-x\" data-close aria-label=\"Close\">' + ICON.x + '</button></div>' +\n        tabs + '<div class=\"tfg-stage\">' + stageHtml() + '</div>' +\n        (j.description ? '<p class=\"tfg-desc\">' + esc(j.description) + '</p>' : '') +\n        '<div class=\"tfg-cta\"><div><b>Want results like this?</b><span>Free inspection and a written estimate.</span></div>' +\n        '<a class=\"tfg-btn\" href=\"' + esc(ctaHref) + '\" data-cta>' + esc(o.ctaText) + '</a></div>' +\n        '</div>';\n      if (st.mode === 'compare') wireCompare();\n      if (st.mode === 'all') wireSwipe();\n    }\n\n    function setPos(cmp, pct) {\n      st.pos = Math.max(0, Math.min(100, pct));\n      cmp.querySelector('.tfg-after').style.clipPath = 'inset(0 0 0 ' + st.pos + '%)';\n      cmp.querySelector('.tfg-line').style.left = st.pos + '%';\n      var k = cmp.querySelector('.tfg-knob');\n      k.style.left = st.pos + '%';\n      k.setAttribute('aria-valuenow', Math.round(st.pos));\n    }\n\n    function wireCompare() {\n      var cmp = m.querySelector('[data-cmp]');\n      if (!cmp) return;\n      setPos(cmp, st.pos);\n      var dragging = false;\n      function at(x) { var r = cmp.getBoundingClientRect(); setPos(cmp, (x - r.left) / r.width * 100); }\n      cmp.addEventListener('pointerdown', function (e) { dragging = true; try { cmp.setPointerCapture(e.pointerId); } catch (er) { /* ignore */ } at(e.clientX); });\n      cmp.addEventListener('pointermove', function (e) { if (dragging) { at(e.clientX); e.preventDefault(); } });\n      cmp.addEventListener('pointerup', function () { dragging = false; });\n      cmp.addEventListener('pointercancel', function () { dragging = false; });\n      cmp.querySelector('.tfg-knob').addEventListener('keydown', function (e) {\n        if (e.key === 'ArrowLeft') { setPos(cmp, st.pos - 5); e.preventDefault(); e.stopPropagation(); }\n        if (e.key === 'ArrowRight') { setPos(cmp, st.pos + 5); e.preventDefault(); e.stopPropagation(); }\n      });\n    }\n\n    function wireSwipe() {\n      var v = m.querySelector('[data-view]');\n      if (!v) return;\n      var sx = null, sy = null;\n      v.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });\n      v.addEventListener('touchend', function (e) {\n        if (sx == null) return;\n        var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;\n        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(st.i + (dx < 0 ? 1 : -1));\n        sx = null;\n      }, { passive: true });\n    }\n\n    m.addEventListener('click', function (e) {\n      if (e.target === m) { close(); return; }\n      var t = e.target.closest ? e.target.closest('[data-close],[data-mode],[data-go],[data-i],[data-cta]') : null;\n      if (!t) return;\n      if (t.hasAttribute('data-close')) { close(); return; }\n      if (t.hasAttribute('data-cta')) {\n        var href = t.getAttribute('href') || '';\n        if (href.charAt(0) === '#') { close(); }\n        return;\n      }\n      if (t.hasAttribute('data-mode')) { st.mode = t.getAttribute('data-mode'); draw(); return; }\n      if (t.hasAttribute('data-go')) { go(st.i + Number(t.getAttribute('data-go'))); return; }\n      if (t.hasAttribute('data-i')) { go(Number(t.getAttribute('data-i'))); }\n    });\n\n    draw();\n    var x = m.querySelector('[data-close]');\n    if (x) x.focus();\n  }\n\n  /* ---------------- boot ---------------- */\n  function scan() {\n    var els = document.querySelectorAll('.tf-gallery, #tf-gallery, [data-tf-gallery]');\n    for (var i = 0; i < els.length; i++) mount(els[i]);\n  }\n\n  window.TFGallery = { version: 1, scan: scan, mount: mount };\n  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan); else scan();\n  window.addEventListener('load', scan);\n  if (window.MutationObserver) {\n    var obs = new MutationObserver(function () { scan(); });\n    obs.observe(document.documentElement, { childList: true, subtree: true });\n    setTimeout(function () { obs.disconnect(); }, 15000);\n  }\n})();\n";
