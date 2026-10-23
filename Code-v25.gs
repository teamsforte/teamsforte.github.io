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
  'published', 'featured', 'coverId', 'folderId', 'created', 'updated', 'kind'];
/* Job types: the filter buttons on the website gallery (roofing jobs). Blank = guessed from the title. */
var JOB_KINDS = { replacement: 'Roof Replacement', repair: 'Roof Repair', flat: 'Flat Roof', flashing: 'Chimney & Flashing', gutters: 'Gutters', skylight: 'Skylights' };
function guessKind_(title, service) {
  if (service && service !== 'Roofing') return '';
  var t = String(title || '').toLowerCase();
  if (/flat|rubber|epdm|tpo|membrane/.test(t)) return 'flat';
  if (/gutter/.test(t)) return 'gutters';
  if (/chimney|flashing/.test(t)) return 'flashing';
  if (/skylight/.test(t)) return 'skylight';
  if (/repair|leak|patch|boot/.test(t)) return 'repair';
  if (/replac|new roof|re-?roof|tear/.test(t)) return 'replacement';
  return '';
}
function kindOf_(job) {
  if (job.service && job.service !== 'Roofing') return '';
  return JOB_KINDS[job.kind] ? job.kind : guessKind_(job.title, job.service);
}
var PHOTO_COLS = ['id', 'jobId', 'stage', 'caption', 'order', 'width', 'height', 'created', 'src'];

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

  if (r === 'stop') return stopPage_(String(p.id || ''), String(p.k || ''));

  if (r === 'paid') {
    var pr2;
    try { pr2 = stripeConfirm_(String(p.id || ''), String(p.session || '')); } catch (err) { pr2 = { ok: false, error: err.message }; }
    var prj = JSON.stringify(pr2), prcb = p.callback;
    if (prcb && /^[A-Za-z_$][\w$.]{0,80}$/.test(prcb)) return ContentService.createTextOutput(prcb + '(' + prj + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
    return ContentService.createTextOutput(prj).setMimeType(ContentService.MimeType.JSON);
  }

  if (r === 'pdata') {
    var pd;
    try { pd = proposalData_(String(p.id || ''), p.v !== '0'); } catch (err) { pd = { ok: false, error: 'Something went wrong. Please call Team Forte.' }; }
    var pdj = JSON.stringify(pd), pdcb = p.callback;
    if (pdcb && /^[A-Za-z_$][\w$.]{0,80}$/.test(pdcb)) return ContentService.createTextOutput(pdcb + '(' + pdj + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
    return ContentService.createTextOutput(pdj).setMimeType(ContentService.MimeType.JSON);
  }

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
    CURRENT_USER_ = checkPass_(req.pass, req.tok);
    var tokOut = ('tok' in req) ? issueTok_(req.tok, CURRENT_USER_) : '';
    var fn = API_[req.method];
    if (!fn) throw new Error('Unknown action: ' + req.method);
    allowed_(CURRENT_USER_, req.method);
    if (!READ_ONLY_[req.method]) {
      lock = LockService.getScriptLock();
      lock.waitLock(25000); TBL_ = {};
    }
    var data = fn(req.args || {});
    flushAudit_();
    if (lock && /Job|Photo/.test(req.method)) { clearPublicCache_(); }
    var res = { ok: true, data: data === undefined ? null : data };
    if (tokOut) res.tok = tokOut;
    return JSON.stringify(res);
  } catch (err) {
    AUDIT_BUF_ = [];
    return JSON.stringify({ ok: false, error: (err && err.message) || String(err) });
  } finally {
    if (lock) { try { lock.releaseLock(); } catch (e) { /* ignore */ } }
  }
}

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

var READ_ONLY_ = { driveBrowse: 1, driveThumbs: 1, stripeTest: 1, ping: 1, list: 1, matList: 1, abcTest: 1, abcBranches: 1, abcSearch: 1, measure: 1, crewJobs: 1, users: 1, ghlPipelines: 1 };

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
    if (!isNew) checkBase_(job, a.base, 'job');
    var jobBefore = JSON.parse(JSON.stringify(job));
    var oldService = job.service;
    ['title', 'town', 'address', 'description'].forEach(function (k) {
      if (a[k] !== undefined) job[k] = clean_(a[k], k === 'description' ? 600 : 120);
    });
    if (a.service !== undefined) job.service = pickService_(a.service);
    if (a.date !== undefined) job.date = cleanMonth_(a.date);
    if (a.published !== undefined) job.published = !!a.published;
    if (a.featured !== undefined) job.featured = !!a.featured;
    if (a.coverId !== undefined) job.coverId = clean_(a.coverId, 100);
    if (a.kind !== undefined) job.kind = JOB_KINDS[a.kind] ? a.kind : '';
    if (!job.title) job.title = job.service ? job.service + ' job' : 'New job';
    if (!job.service) job.service = CFG.SERVICES[0];
    if (!job.date) job.date = Utilities.formatDate(new Date(), tz_(), 'yyyy-MM');
    job.updated = now;
    if (!isNew) auditDiff_('photoJob', jobBefore, job, Object.keys(a));
    else audit_('photoJob', job.id, 'created', '', job.title);

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

  /* Google Drive import (owner only): browse, thumbnails, copy into the job folder. */
  driveBrowse: function (a) { return driveBrowse_(a || {}); },
  driveThumbs: function (a) { return driveThumbs_(a || {}); },
  importDrivePhotos: function (a) { return importDrivePhotos_(a || {}); },

  /* New order for a job's photos after a drag: { jobId, stages: { before: [ids], during: [ids], after: [ids] } } */
  reorderPhotos: function (a) {
    var photos = readPhotos_(), mine = {}, seen = {};
    photos.forEach(function (p) { if (p.jobId === String(a.jobId)) mine[p.id] = p; });
    if (!Object.keys(mine).length) throw new Error('Job not found. Go back and try again.');
    var st = a.stages || {};
    ['before', 'during', 'after'].forEach(function (stage) {
      (Array.isArray(st[stage]) ? st[stage] : []).forEach(function (id, k) {
        var p = mine[String(id)];
        if (!p || seen[p.id]) return;
        seen[p.id] = 1; p.stage = stage; p.order = k + 1;
      });
    });
    /* photos the phone didn't know about (added elsewhere meanwhile) keep their place at the end */
    Object.keys(mine).forEach(function (id) {
      var p = mine[id]; if (seen[id]) return;
      p.order = 1000 + p.order;
    });
    writePhotos_(photos);
    var stageRank = { before: 0, during: 1, after: 2 };
    return Object.keys(mine).map(function (id) { return mine[id]; })
      .sort(function (x, y) { return (stageRank[x.stage] - stageRank[y.stage]) || (x.order - y.order); })
      .map(function (p) { return { id: p.id, stage: p.stage, order: p.order }; });
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
/* Google Drive import                                                 */
/* ------------------------------------------------------------------ */

var DRIVE_IMG_Q_ = "mimeType contains 'image/' and trashed = false";
function driveQ_(s) { return String(s || '').trim().slice(0, 80).replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }

/* Fast path: one Drive API request returns the folder's subfolders and photos with names, dates and
   ready-made thumbnail links, so the phone loads every thumbnail at once (no per-file server lookups). */
var DRIVE_FOLDER_MIME_ = 'application/vnd.google-apps.folder';
function driveApi_(params) {
  var qs = Object.keys(params).filter(function (k) { return params[k] !== '' && params[k] != null; })
    .map(function (k) { return k + '=' + encodeURIComponent(params[k]); }).join('&');
  var res = UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/files?' + qs, {
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true
  });
  if (res.getResponseCode() !== 200) throw new Error('Drive list failed (' + res.getResponseCode() + ')');
  return JSON.parse(res.getContentText());
}
function drivePath_(folderId) {
  var path = [], rootId = DriveApp.getRootFolder().getId();
  var cur = folderId === 'root' ? DriveApp.getRootFolder() : DriveApp.getFolderById(folderId), guard = 0;
  while (cur && guard++ < 12) {
    var isRoot = cur.getId() === rootId;
    path.unshift({ id: isRoot ? 'root' : cur.getId(), name: isRoot ? 'My Drive' : cur.getName() });
    if (isRoot) break;
    var ps = cur.getParents(); cur = ps.hasNext() ? ps.next() : null;
  }
  return path;
}
function driveBrowseFast_(a) {
  var mode = { shared: 1, search: 1, recent: 1 }[a.mode] ? a.mode : 'folder';
  var both = " and trashed = false and (mimeType = '" + DRIVE_FOLDER_MIME_ + "' or mimeType contains 'image/')";
  var q, order, path = [], cont = null;
  if (a.token) {
    if (!/^v3:/.test(String(a.token))) return null;
    cont = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(String(a.token).slice(3))).getDataAsString());
    q = cont.q; order = cont.o; mode = cont.m || mode;
  } else if (mode === 'folder') {
    var fid = a.folder && a.folder !== 'root' ? String(a.folder) : 'root';
    if (!/^[\w-]+$/.test(fid)) throw new Error('Folder not found.');
    path = drivePath_(fid);
    q = "'" + fid + "' in parents" + both; order = 'folder,name_natural';
  } else if (mode === 'shared') {
    q = 'sharedWithMe' + both; order = 'folder,modifiedTime desc';
  } else if (mode === 'search') {
    var s = driveQ_(a.q);
    if (!s) return { mode: mode, path: [], folders: [], files: [], token: '' };
    q = "name contains '" + s + "'" + both; order = 'folder,name_natural';
  } else {
    var since = new Date(Date.now() - 45 * 86400000).toISOString();
    q = "modifiedTime > '" + since + "' and mimeType contains 'image/' and trashed = false"; order = 'modifiedTime desc';
  }
  var r = driveApi_({ q: q, orderBy: order, pageSize: 100, spaces: 'drive', pageToken: cont ? cont.t : '',
    fields: 'nextPageToken,files(id,name,mimeType,size,modifiedTime,thumbnailLink)' });
  var folders = [], files = [];
  (r.files || []).forEach(function (f) {
    if (f.mimeType === DRIVE_FOLDER_MIME_) { if (!cont) folders.push({ id: f.id, name: f.name }); return; }
    var t = f.thumbnailLink ? (/=s\d+$/.test(f.thumbnailLink) ? f.thumbnailLink.replace(/=s\d+$/, '=s400') : f.thumbnailLink) : '';
    files.push({ id: f.id, name: f.name, size: Number(f.size) || 0, date: f.modifiedTime, thumb: t });
  });
  var token = r.nextPageToken ? 'v3:' + Utilities.base64EncodeWebSafe(JSON.stringify({ q: q, o: order, m: mode, t: r.nextPageToken })) : '';
  return { mode: mode, path: path, folders: folders, files: files, token: token };
}

function driveBrowse_(a) {
  try { var fast = driveBrowseFast_(a); if (fast) return fast; }
  catch (e) {
    if (a.token && /^v3:/.test(String(a.token))) throw new Error('Could not load more photos. Go back and open the folder again.');
    if (/Folder not found/.test(e.message)) throw e;
    Logger.log('drive fast list: ' + e.message);
  }
  var mode = { shared: 1, search: 1, recent: 1 }[a.mode] ? a.mode : 'folder';
  var folders = [], files = [], path = [], fit = null, iter, PAGE = 60;
  if (a.token) {
    iter = DriveApp.continueFileIterator(String(a.token));
  } else if (mode === 'folder') {
    var rootId = DriveApp.getRootFolder().getId();
    var f = a.folder && a.folder !== 'root' ? DriveApp.getFolderById(String(a.folder)) : DriveApp.getRootFolder();
    var cur = f, guard = 0;
    while (cur && guard++ < 12) {
      var isRoot = cur.getId() === rootId;
      path.unshift({ id: isRoot ? 'root' : cur.getId(), name: isRoot ? 'My Drive' : cur.getName() });
      if (isRoot) break;
      var ps = cur.getParents(); cur = ps.hasNext() ? ps.next() : null;
    }
    fit = f.searchFolders('trashed = false');
    iter = f.searchFiles(DRIVE_IMG_Q_);
  } else if (mode === 'shared') {
    fit = DriveApp.searchFolders('sharedWithMe and trashed = false');
    iter = DriveApp.searchFiles('sharedWithMe and ' + DRIVE_IMG_Q_);
  } else if (mode === 'search') {
    var q = driveQ_(a.q);
    if (!q) return { mode: mode, path: [], folders: [], files: [], token: '' };
    fit = DriveApp.searchFolders("title contains '" + q + "' and trashed = false");
    iter = DriveApp.searchFiles("title contains '" + q + "' and " + DRIVE_IMG_Q_);
  } else {
    var since = Utilities.formatDate(new Date(Date.now() - 45 * 86400000), 'UTC', "yyyy-MM-dd'T'HH:mm:ss");
    iter = DriveApp.searchFiles("modifiedDate > '" + since + "' and " + DRIVE_IMG_Q_);
  }
  if (fit) {
    while (fit.hasNext() && folders.length < 300) { var d = fit.next(); folders.push({ id: d.getId(), name: d.getName() }); }
    folders.sort(function (x, y) { return x.name.localeCompare(y.name, undefined, { numeric: true }); });
  }
  while (iter.hasNext() && files.length < PAGE) {
    var fl = iter.next();
    files.push({ id: fl.getId(), name: fl.getName(), size: fl.getSize(), date: fl.getLastUpdated().toISOString() });
  }
  var token = iter.hasNext() ? iter.getContinuationToken() : '';
  if (mode === 'folder' || mode === 'search') files.sort(function (x, y) { return x.name.localeCompare(y.name, undefined, { numeric: true }); });
  else files.sort(function (x, y) { return x.date < y.date ? 1 : -1; });
  return { mode: mode, path: path, folders: folders, files: files, token: token };
}

function driveThumbs_(a) {
  var out = {};
  (a.ids || []).slice(0, 12).forEach(function (id) {
    id = String(id);
    try {
      var b = DriveApp.getFileById(id).getThumbnail();
      out[id] = b ? 'data:' + (b.getContentType() || 'image/png') + ';base64,' + Utilities.base64Encode(b.getBytes()) : '';
    } catch (e) { out[id] = ''; }
  });
  return { thumbs: out };
}

/* Copies (never moves) up to 6 Drive photos into the job's folder and adds them to the job. */
function importDrivePhotos_(a) {
  var ids = (a.ids || []).map(String).filter(function (x) { return /^[\w-]{10,}$/.test(x); }).slice(0, 6);
  if (!ids.length) throw new Error('Pick at least one photo.');
  var jobs = readJobs_(), job = findById_(jobs, a.jobId);
  if (!job) throw new Error('Job not found. Go back and try again.');
  var stage = pickStage_(a.stage), photos = readPhotos_(), have = {};
  photos.forEach(function (p) { if (p.jobId === job.id && p.src) have[p.src] = p.id; });
  var folder = jobFolder_(job, jobs);
  var order = photos.filter(function (p) { return p.jobId === job.id && p.stage === stage; })
    .reduce(function (m, p) { return Math.max(m, p.order); }, 0);
  var stamp = Utilities.formatDate(new Date(), tz_(), 'yyyyMMdd-HHmmss');
  var added = [], skipped = [], failed = [];
  ids.forEach(function (id) {
    if (have[id]) { skipped.push(id); return; }
    try {
      var src = DriveApp.getFileById(id), mime = src.getMimeType();
      if (!/^image\//.test(mime)) { failed.push({ id: id, error: src.getName() + ' is not a photo' }); return; }
      order++;
      var m = /\.([a-z0-9]{2,5})$/i.exec(src.getName());
      var ext = (m ? m[1] : (mime.split('/')[1] || 'jpg')).toLowerCase();
      var copy = src.makeCopy(stage + '-' + pad_(order) + '-' + stamp + '-drive.' + ext, folder);
      try { copy.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) { /* folder sharing covers it */ }
      var p = { id: copy.getId(), jobId: job.id, stage: stage, caption: '', order: order, width: '', height: '', created: new Date().toISOString(), src: id };
      photos.push(p); added.push(p); have[id] = p.id;
    } catch (e) { failed.push({ id: id, error: e.message }); }
  });
  if (added.length) { writePhotos_(photos); job.updated = new Date().toISOString(); writeJobs_(jobs); }
  return { added: added, skipped: skipped, failed: failed };
}

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
    description: job.description, featured: job.featured, cover: cover, kind: kindOf_(job),
    photos: photos.map(function (p) {
      return { id: p.id, stage: p.stage, caption: p.caption, w: p.width || null, h: p.height || null };
    })
  };
  if (admin) {
    out.kindSet = JOB_KINDS[job.kind] ? job.kind : '';
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

/* Per-request caches: the spreadsheet is opened once, each tab is read once, and writes only touch rows that changed. */
var SS_ = null, TBL_ = {};
function ss_() {
  if (SS_) return SS_;
  var id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (!id) throw new Error('Setup has not been run yet. Open the script and run "setup".');
  SS_ = SpreadsheetApp.openById(id);
  return SS_;
}
function tbl_(name) { return TBL_[name] || (TBL_[name] = {}); }
function sheet_(name) { var t = tbl_(name); if (!t.sh) t.sh = ss_().getSheetByName(name); return t.sh; }
function cellStr_(v) { return v === undefined || v === null ? '' : (v instanceof Date ? v.toISOString() : String(v)); }

function fitCols_(sh, cols) {
  if (sh.getMaxColumns() < cols.length) sh.insertColumnsAfter(sh.getMaxColumns(), cols.length - sh.getMaxColumns());
  var head = sh.getRange(1, 1, 1, cols.length).getValues()[0];
  for (var i = 0; i < cols.length; i++) if (head[i] === '' || head[i] == null) sh.getRange(1, i + 1).setValue(cols[i]).setFontWeight('bold');
}

/* Raw rows of a tab, read from the sheet once per request. */
function tableRaw_(name, cols) {
  var t = tbl_(name);
  if (t.raw && t.n === cols.length) return t.raw;
  var sh = sheet_(name);
  if (!sh) throw new Error('Missing "' + name + '" tab in the data sheet. Run setup again.');
  if (sh.getMaxColumns() < cols.length) fitCols_(sh, cols);
  var last = sh.getLastRow();
  t.raw = last < 2 ? [] : sh.getRange(2, 1, last - 1, cols.length).getValues();
  t.n = cols.length;
  return t.raw;
}

function readTable_(name, cols) {
  return tableRaw_(name, cols)
    .filter(function (r) { return r[0] !== '' && r[0] != null; })
    .map(function (r) { var o = {}; cols.forEach(function (c, i) { o[c] = r[i]; }); return o; });
}

function writeTable_(name, cols, rows) {
  var sh = sheet_(name), t = tbl_(name), n = cols.length;
  if (!t.fitted) { fitCols_(sh, cols); t.fitted = true; }
  var out = rows.map(function (o) { return cols.map(function (c) { return cellStr_(o[c]); }); });
  var prev = t.raw && t.n === n ? t.raw : null;
  if (!(prev && writeChanged_(sh, n, prev, out))) writeAll_(sh, n, out);
  t.raw = out; t.n = n;
}

/* Rewrites the whole tab: new rows first, then clears leftovers (a failed write can't empty a tab). */
function writeAll_(sh, n, out) {
  var last = sh.getLastRow();
  if (out.length) {
    if (sh.getMaxRows() < out.length + 1) sh.insertRowsAfter(sh.getMaxRows(), out.length + 1 - sh.getMaxRows());
    sh.getRange(2, 1, out.length, n).setNumberFormat('@').setValues(out);
  }
  if (last > out.length + 1) sh.getRange(out.length + 2, 1, last - out.length - 1, n).clearContent();
}

/* Writes only changed and new rows. Returns false (caller rewrites everything) when rows were
   removed or reordered, or when the tab no longer matches what this request read. */
function writeChanged_(sh, n, prev, out) {
  if (out.length < prev.length) return false;
  for (var i = 0; i < prev.length; i++) {
    if (prev[i][0] === '' || prev[i][0] == null || cellStr_(prev[i][0]) !== out[i][0]) return false;
  }
  var changed = [];
  for (i = 0; i < out.length; i++) {
    if (i >= prev.length) { changed.push(i); continue; }
    for (var j = 0; j < n; j++) if (cellStr_(prev[i][j]) !== out[i][j]) { changed.push(i); break; }
  }
  if (!changed.length) return true;
  /* someone else may have changed the tab since we read it: check the ids are still where we left them */
  if (sh.getLastRow() !== prev.length + 1) return false;
  if (prev.length) {
    var ids = sh.getRange(2, 1, prev.length, 1).getValues();
    for (i = 0; i < prev.length; i++) if (cellStr_(ids[i][0]) !== out[i][0]) return false;
  }
  var blocks = [], s = changed[0], e = s;
  for (i = 1; i < changed.length; i++) {
    if (changed[i] === e + 1) e = changed[i]; else { blocks.push([s, e]); s = e = changed[i]; }
  }
  blocks.push([s, e]);
  if (blocks.length > 6) blocks = [[changed[0], changed[changed.length - 1]]];
  if (sh.getMaxRows() < out.length + 1) sh.insertRowsAfter(sh.getMaxRows(), out.length + 1 - sh.getMaxRows());
  blocks.forEach(function (b) {
    sh.getRange(b[0] + 2, 1, b[1] - b[0] + 1, n).setNumberFormat('@').setValues(out.slice(b[0], b[1] + 1));
  });
  return true;
}

function readJobs_() {
  return readTable_('Jobs', JOB_COLS).map(function (j) {
    j.id = String(j.id);
    ['title', 'service', 'town', 'address', 'description', 'coverId', 'folderId', 'created', 'updated', 'kind']
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
    p.src = String(p.src || '');
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
function checkPass_(pass, tok) {
  var cache = CacheService.getScriptCache();
  var fails = Number(cache.get('fails')) || 0;
  var locked = fails >= CFG.MAX_FAILS;
  var real = PropertiesService.getScriptProperties().getProperty('PASSCODE');
  if (!real) throw new Error('Setup has not been run yet. Open the script and run "setup".');
  var p = String(pass || '').trim(), who = null;
  if (p && p === String(real).trim()) who = { id: 'owner', name: 'Owner', role: 'owner' };
  if (!who) {
    var users = typeof users_ === 'function' ? users_() : [];
    for (var i = 0; i < users.length; i++) {
      if (p && users[i].pin === p) { who = { id: users[i].id, name: users[i].name, role: users[i].role }; break; }
    }
  }
  /* A phone that already logged in carries a device key, so strangers guessing can't lock it out. */
  if (who && (!locked || devTokOk_(tok, who))) return who;
  if (locked) throw new Error('Too many wrong passcodes. Wait 15 minutes and try again.');
  cache.put('fails', String(fails + 1), 900);
  throw new Error('WRONG_PASSCODE');
}

function devToks_() { try { return JSON.parse(PropertiesService.getScriptProperties().getProperty('DEVTOK') || '{}') || {}; } catch (e) { return {}; } }
function devTokOk_(tok, who) { var m = tok ? devToks_()[String(tok)] : null; return !!(m && m.u === who.id); }
/* Returns a new device key for a phone that doesn't have a valid one yet ('' otherwise). */
function issueTok_(tok, who) {
  if (devTokOk_(tok, who)) return '';
  var m = devToks_(), t = Utilities.getUuid();
  m[t] = { u: who.id, t: Date.now() };
  var keys = Object.keys(m).sort(function (a, b) { return m[b].t - m[a].t; });
  keys.slice(60).forEach(function (k) { delete m[k]; });
  try { PropertiesService.getScriptProperties().setProperty('DEVTOK', JSON.stringify(m)); } catch (e) { return ''; }
  return t;
}

/* What each role can do. Owner: everything. Office: everything except logins and keys. Crew: jobs and photos only. */
var CREW_CAN_ = { ping: 1, list: 1, saveJob: 1, uploadPhoto: 1, updatePhoto: 1, movePhoto: 1, reorderPhotos: 1, crewJobs: 1, addInspection: 1, crewNote: 1 };
var OWNER_ONLY_ = { driveBrowse: 1, driveThumbs: 1, importDrivePhotos: 1, users: 1, saveUsers: 1, abcRegisterWebhook: 1, useWebsiteKey: 1, stripeTest: 1 };
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
  'proposalSentAt', 'reviewAt', 'warrantyDone', 'ghlContactId', 'ghlOppId', 'ghlError', 'doneAt', 'lead', 'offers', 'payments', 'payReq',
  'startDate', 'endDate', 'cancelBy', 'cancelledAt', 'changeOrders', 'addons', 'chosen', 'basePrice', 'followups', 'followOff', 'orderPrepared'];
var ORDER_COLS = ['id', 'quoteId', 'created', 'updated', 'method', 'supplier', 'status', 'po', 'deliveryDate', 'deliveryService',
  'address', 'lines', 'subtotal', 'tax', 'total', 'actualTotal', 'confirmation', 'orderNumber', 'lastEvent', 'notes'];
var PRICE_COLS = ['key', 'cat', 'name', 'unit', 'price', 'abcItem', 'uom', 'source', 'updated'];
var QUOTE_JSON = ['roofs', 'ranges', 'events', 'meas', 'lines', 'items', 'costs', 'lead', 'offers', 'payments', 'payReq', 'changeOrders', 'addons', 'chosen', 'followups', 'orderPrepared'];
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

/* ---------------- safe saves: conflict check + audit log ---------------- */
var AUDIT_COLS = ['t', 'user', 'role', 'kind', 'recId', 'field', 'old', 'new'];
var AUDIT_BUF_ = [];
function auditVal_(v) {
  if (v === undefined || v === null) return '';
  var s = typeof v === 'string' ? v : JSON.stringify(v);
  return s.length > 500 ? s.slice(0, 497) + '...' : s;
}
function audit_(kind, id, field, oldV, newV) {
  if (auditVal_(oldV) === auditVal_(newV)) return;
  var u = CURRENT_USER_ || {};
  AUDIT_BUF_.push([new Date().toISOString(), String(u.name || ''), String(u.role || ''), kind, String(id || ''), field, auditVal_(oldV), auditVal_(newV)]);
}
function flushAudit_() {
  if (!AUDIT_BUF_.length) return;
  var rows = AUDIT_BUF_; AUDIT_BUF_ = [];
  try {
    tab_('Audit', AUDIT_COLS);
    var sh = sheet_('Audit');
    sh.getRange(sh.getLastRow() + 1, 1, rows.length, AUDIT_COLS.length).setNumberFormat('@').setValues(rows);
  } catch (e) { Logger.log('audit: ' + e.message); }
}
/* Same value, ignoring how it was stored (number vs text, empty vs missing). */
function sameVal_(a, b) {
  var n = function (v) {
    if (v === undefined || v === null || v === '') return '';
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    if (typeof v === 'string') return /^-?\d+(\.\d+)?$/.test(v) ? String(Number(v)) : v;
    return JSON.stringify(v);
  };
  return n(a) === n(b);
}
/* The app sends the values it loaded for each field it changes. If the sheet has a different value,
   someone else saved in between: stop instead of silently overwriting their change. */
function checkBase_(rec, base, label) {
  if (!rec || !base || typeof base !== 'object') return;
  var changed = Object.keys(base).filter(function (k) { return !sameVal_(rec[k], base[k]); });
  if (changed.length) throw new Error('CONFLICT: This ' + label + ' was changed on another phone (' + changed.join(', ') + '). Reload to see the latest, then make your change again.');
}
function auditDiff_(kind, before, after, keys) {
  keys.forEach(function (k) { if (k !== 'id' && k !== 'base') audit_(kind, after.id, k, before[k], after[k]); });
}

/* ---------------- storage ---------------- */

function tab_(name, cols) {
  if (sheet_(name)) return;
  prepSheet_(ss_(), name, cols);
  TBL_[name] = {};
}

function readQuotes_() {
  tab_('Quotes', QUOTE_COLS);
  return readTable_('Quotes', QUOTE_COLS).map(function (q) {
    QUOTE_COLS.forEach(function (k) { if (q[k] instanceof Date) q[k] = q[k].toISOString(); });
    QUOTE_JSON.forEach(function (k) { q[k] = parseJson_(q[k], k === 'meas' || k === 'costs' || k === 'lead' || k === 'offers' || k === 'payReq' || k === 'orderPrepared' ? null : []); });
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
    q.startDate = cleanYmd_(q.startDate); q.endDate = cleanYmd_(q.endDate); q.cancelBy = cleanYmd_(q.cancelBy);
    q.cancelledAt = q.cancelledAt instanceof Date ? q.cancelledAt.toISOString() : String(q.cancelledAt == null ? '' : q.cancelledAt);
    q.basePrice = Number(q.basePrice) || 0;
    q.followOff = bool_(q.followOff);
    if (!Array.isArray(q.followups)) q.followups = [];
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
  out.hasStripe = !!stripeKey_();
  out.stripeMode = /_test_/.test(stripeKey_()) ? 'test' : (stripeKey_() ? 'live' : '');
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
  if (p.r === 'pay') {
    /* Proposal / invoice page: start a Stripe Checkout for the amount the server says is due */
    var payOut;
    try { payOut = payStart_(parseJson_(body, {}) || {}); } catch (err) { payOut = { ok: false, error: err.message }; }
    return ContentService.createTextOutput(JSON.stringify(payOut)).setMimeType(ContentService.MimeType.JSON);
  }
  if (p.r === 'sign') {
    /* Proposal presentation (team-forte.com/quote#p=...) */
    return ContentService.createTextOutput(acceptProposal(body)).setMimeType(ContentService.MimeType.JSON);
  }
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
      lock = LockService.getScriptLock(); lock.waitLock(20000); TBL_ = {};
      intakeQuote_(d, link, j.event || 'quote', j);
    } else if (p.r === 'abc') {
      var key = PropertiesService.getScriptProperties().getProperty('ABC_HOOK_KEY');
      if (!key || p.k !== key) return ContentService.createTextOutput('no');
      lock = LockService.getScriptLock(); lock.waitLock(20000); TBL_ = {};
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
  checkBase_(q, a.base, 'job');
  var before0 = JSON.parse(JSON.stringify(q));
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
  if (a.startDate !== undefined && !q.signedAt) q.startDate = cleanYmd_(a.startDate);
  if (a.endDate !== undefined && !q.signedAt) q.endDate = cleanYmd_(a.endDate);
  if (a.followOff !== undefined) q.followOff = !!a.followOff;
  if (a.crew !== undefined) q.crew = clean_(a.crew, 60);
  if (a.depositStatus !== undefined) q.depositStatus = ['', 'requested', 'paid'].indexOf(a.depositStatus) >= 0 ? a.depositStatus : '';
  if (a.warrantyDone !== undefined) q.warrantyDone = !!a.warrantyDone;
  if (q.status !== was) logEvent_(q, 'status: ' + q.status);
  if (q.status === 'approved' && was === 'new') onApproved_(q);
  if (q.status === 'done' && was !== 'done') onDone_(q);
  q.updated = new Date().toISOString();
  auditDiff_('quote', before0, q, Object.keys(a));
  writeQuotes_(qs);
  return q;
};

function onApproved_(q) {
  q.approvedAt = q.approvedAt || new Date().toISOString();
  if (!q.photoJobId) {
    try {
      var pkg = TAKEOFF.PACKAGES[q.pick];
      var job = API_.saveJob({
        service: 'Roofing', kind: q.type === 'repair' ? 'repair' : 'replacement', title: q.type === 'repair' ? 'Roof repair' : 'Roof replacement' + (pkg ? ' - OC ' + pkg.label : ''),
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
  q.status = 'archived';
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
  var types = ['ridge', 'hip', 'valley', 'eave', 'rake'];
  out.traced = (Array.isArray(m.traced) ? m.traced : []).slice(0, 80).map(function (l) {
    l = l || {};
    var pts = (Array.isArray(l.pts) ? l.pts : []).slice(0, 40).map(function (p) {
      return [Math.round(Number(p && p[0]) * 1e7) / 1e7, Math.round(Number(p && p[1]) * 1e7) / 1e7];
    }).filter(function (p) { return isFinite(p[0]) && isFinite(p[1]) && Math.abs(p[0]) <= 90 && Math.abs(p[1]) <= 180 && (p[0] || p[1]); });
    return {
      t: types.indexOf(l.t) >= 0 ? l.t : 'ridge', pts: pts,
      plan: Math.max(0, Math.min(100000, Math.round((Number(l.plan) || 0) * 10) / 10)),
      len: Math.max(0, Math.min(100000, Math.round((Number(l.len) || 0) * 10) / 10)),
      pitch: clean_(l.pitch, 10)
    };
  }).filter(function (l) { return l.pts.length >= 2; });
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
  c.address = c.address || 'East Berlin, CT';
  if (/161\s+Main/i.test(c.address)) c.address = 'East Berlin, CT'; // street address kept private
  c.phone = c.phone || '(860) 854-9335';
  c.email = c.email || 'info@team-forte.com';
  c.hic = c.hic || 'HIC.0706595';
  c.mailing = c.mailing || '';
  contractDefaults_(s);
  addonsBook_(s);
  followDefaults_(s);
  s.proposalBase = s.proposalBase || 'https://team-forte.com/quote';   // customer link: <base>#p=TF-XXXXX
  s.presentBase = s.presentBase || 'https://teamsforte.github.io/p.html'; // full-screen presentation
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
  if (!owner) { delete a.abc; delete a.mapsKey; delete a.ghlToken; delete a.ghl; delete a.stripeKey; delete a.stripeKeyClear; delete a.contract; delete a.contractSig; if (a.company) delete a.company.mailing; }
  var s = settings_();
  if (a.company) ['name', 'legal', 'address', 'phone', 'email', 'hic', 'mailing'].forEach(function (k) { if (a.company[k] !== undefined) s.company[k] = clean_(a.company[k], 160); });
  if (a.contract) {
    var ck = contractDefaults_(s);
    ['cleanup', 'permit', 'decking'].forEach(function (k) { if (a.contract[k] !== undefined) ck[k] = clean_(a.contract[k], 600); });
    ['signerName', 'signerTitle'].forEach(function (k) { if (a.contract[k] !== undefined) ck[k] = clean_(a.contract[k], 80); });
    if (a.contract.deckPrice !== undefined) ck.deckPrice = Math.max(0, money2_(a.contract.deckPrice));
  }
  if (a.contractSig) saveContractSig_(a.contractSig, s);
  if (a.addons !== undefined) s.addons = cleanAddonBook_(a.addons);
  if (a.follow) { var fl = followDefaults_(s); ['on', 'hot', 'tags'].forEach(function (k) { if (a.follow[k] !== undefined) fl[k] = !!a.follow[k]; }); if (fl.on) { try { ensureFollowTrigger_(); } catch (e) { Logger.log('follow trigger: ' + e.message); } } }
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
  if (a.stripeKey) {
    var sk = String(a.stripeKey).trim();
    if (/^pk_/.test(sk)) throw new Error('That’s the publishable key. Paste the secret or restricted key (starts with rk_ or sk_).');
    if (!/^(rk|sk)_(live|test)_[A-Za-z0-9]{10,}$/.test(sk)) throw new Error('That doesn’t look like a Stripe key. It starts with rk_live_ or sk_live_.');
    PropertiesService.getScriptProperties().setProperty('STRIPE_KEY', sk);
    try { ensureStripeSweep_(); } catch (e) { Logger.log('stripe sweep trigger: ' + e.message); }
  }
  if (a.stripeKeyClear) PropertiesService.getScriptProperties().setProperty('STRIPE_KEY', '');
  saveSettings_(s);
  try { ensureOrderSweep_(); } catch (e) { /* optional */ }
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
  var mailErr = '';
  /* "Save & email" in one trip: email first, then a single GoHighLevel sync */
  if (a.alsoEmail && q.type !== 'repair') { try { emailQuoteBase_({ id: q.id }); } catch (e) { mailErr = e.message; } }
  var r = syncAndSave_(q.id, 'quote');
  if (a.alsoEmail) { r.mailed = !mailErr; if (mailErr) r.emailError = mailErr; }
  return r;
};

var emailQuoteBase_ = API_.emailQuote;
API_.emailQuote = function (a) {
  var qs = readQuotes_();
  var q = findById_(qs, a.id);
  if (q && q.type === 'repair') return API_.sendProposal({ id: a.id, email: a.email || q.email, send: 'email' });
  var r = emailQuoteBase_(a);
  return syncAndSave_(r.id, 'quote');
};

/* Synced as a sent quote in the last 10 minutes? Then GoHighLevel already has it. */
function ghlFresh_(q, stage) {
  if (stage !== 'quote' || !q.ghlOppId || q.ghlError) return false;
  var ev = (q.events || []).filter(function (e) { return /^GoHighLevel: quote sent/.test(e.e); }).pop();
  return !!(ev && Date.now() - new Date(ev.t).getTime() < 10 * 60000);
}

function syncAndSave_(id, stage) {
  var qs = readQuotes_();
  var q = findById_(qs, id);
  if (!q) return null;
  if (ghlReady_(settings_()) && !ghlFresh_(q, stage)) { ghlSync_(q, stage); writeQuotes_(qs); }
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

function proposalUrl_(id) { return settings_().proposalBase + '#p=' + encodeURIComponent(id); }
function presentUrl_(id) { return settings_().presentBase + '#p=' + encodeURIComponent(id) + '&present=1'; }
function cleanOffers_(o) {
  if (!Array.isArray(o) || o.length !== 3) return null;
  var out = o.map(function (n) { return Math.max(0, Math.round(Number(String(n == null ? '' : n).replace(/[^\d.]/g, '')) * 100) / 100 || 0); });
  return out.some(function (n) { return n > 0; }) ? out : null;
}

function proposalReady_(q) {
  if (!q || !(q.contractPrice > 0)) return false;
  return q.type === 'repair' ? (q.items || []).length > 0 : q.pick >= 0;
}

API_.sendProposal = function (a) {
  var qs = readQuotes_();
  var q = findById_(qs, a.id);
  if (!q) throw new Error('Quote not found.');
  checkBase_(q, a.base, 'job');
  var sendBefore = JSON.parse(JSON.stringify(q));
  if (a.contractPrice !== undefined) q.contractPrice = Math.max(0, Math.round(Number(a.contractPrice) * 100) / 100 || 0);
  if (a.pick !== undefined) q.pick = [0, 1, 2].indexOf(Number(a.pick)) >= 0 ? Number(a.pick) : q.pick;
  if (a.color !== undefined) q.color = clean_(a.color, 40);
  if (a.email) q.email = clean_(a.email, 120);
  if (a.offers !== undefined) q.offers = q.type === 'repair' ? null : cleanOffers_(a.offers);
  if (q.offers && q.pick >= 0) {
    if (!(q.offers[q.pick] > 0)) q.offers[q.pick] = q.contractPrice;
    q.contractPrice = q.offers[q.pick];
  }
  if (!proposalReady_(q)) throw new Error(q.type === 'repair' ? 'Add the repair items first.' : 'Pick the package and enter the job price first.');
  if (q.signedAt) throw new Error('This proposal is already signed.');
  var s = settings_();
  if (a.startDate !== undefined) q.startDate = cleanYmd_(a.startDate);
  if (a.endDate !== undefined) q.endDate = cleanYmd_(a.endDate);
  if (a.addons !== undefined) q.addons = cleanOffered_(a.addons, s);
  needContract_(q, s);
  var url = proposalUrl_(q.id);
  if (a.send === 'email') {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(q.email || '')) throw new Error('Add the customer’s email first.');
    var first = String(q.name || '').split(' ')[0];
    var html = '<div style="font-family:Arial,sans-serif;font-size:15px;color:#1C2430;max-width:540px">' +
      '<p>Hi' + (first ? ' ' + escHtml_(first) : '') + ',</p><p>Your Team Forte roof plan for <b>' + escHtml_(q.address) + '</b> is ready.</p>' +
      '<p>It has the photos from your inspection, ' + (q.offers ? 'your options and prices' : 'your price') + ', and answers to the questions homeowners ask most. When you’re ready, you can sign online.</p>' +
      '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0"><tr><td style="background:#FF5440;border-radius:8px">' +
      '<a href="' + escHtml_(url) + '" style="display:inline-block;padding:14px 22px;font-size:16px;font-weight:bold;color:#fff;text-decoration:none">See my roof plan</a></td></tr></table>' +
      '<p>Questions? Reply to this email or call ' + escHtml_(s.company.phone) + '.</p><p>Team Forte</p></div>';
    var msg = { to: q.email, subject: 'Your Team Forte roof plan', htmlBody: html, name: 'Team Forte' };
    var owner = ownerEmail_();
    if (owner) msg.replyTo = owner;
    MailApp.sendEmail(msg);
    logEvent_(q, 'proposal emailed');
  } else if (a.send === 'present') {
    logEvent_(q, 'proposal presented');
  } else {
    logEvent_(q, 'proposal link shared');
  }
  q.proposalSentAt = new Date().toISOString();
  if (followDefaults_(s).on) { try { ensureFollowTrigger_(); } catch (e) { Logger.log('follow trigger: ' + e.message); } }
  auditDiff_('quote', sendBefore, q, ['contractPrice', 'pick', 'color', 'email', 'offers', 'startDate', 'endDate', 'addons']);
  audit_('quote', q.id, 'proposal sent', '', a.send || 'link');
  ghlSync_(q, 'quote');
  q.updated = q.proposalSentAt;
  writeQuotes_(qs);
  q.proposalUrl = url;
  q.presentUrl = presentUrl_(q.id);
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
    }).join('') + (repairTotal_(q.items, 0) < (q.basePrice || q.contractPrice) ? '<tr><td colspan="2">Minimum service charge applies</td><td class="r"></td></tr>' : '') + '</table>';
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
    ((q.chosen || []).length ? '<div class="dep"><span>' + (q.type === 'repair' ? 'Repair' : 'Roof') + '</span><span>' + money(q.basePrice || q.contractPrice) + '</span></div>' + q.chosen.map(function (x) { return '<div class="dep"><span>Added: ' + escHtml_(x.name) + ' (' + x.qty + ' ' + escHtml_(x.unit) + ')</span><span>' + money(x.total) + '</span></div>'; }).join('') : '') +
    '<div class="price"><span>Total</span><span>' + money(q.contractPrice) + '</span></div>' +
    (deposit > 0 ? '<div class="dep"><span>Deposit to schedule (' + s.depositPct + '%)</span><span>' + money(deposit) + '</span></div><div class="dep"><span>Balance when the job is done</span><span>' + money(q.contractPrice - deposit) + '</span></div>' : '') +
    '</div><div class="card"><h2>Terms</h2><div class="terms">' + escHtml_(s.terms) + '</div></div>';
  var foot = '<div class="foot"><b>' + escHtml_(c.legal) + '</b><br>' + escHtml_(c.address) + '<br>' + escHtml_(c.phone) + ' · ' + escHtml_(c.email) + (c.hic ? '<br>CT ' + escHtml_(c.hic) : '') + '</div></div>';
  return { css: css, head: head, body: body, foot: foot, deposit: deposit };
}

/* ---------------- Connecticut contract: required parts, cancel window, change orders ---------------- */
/* Research notes, not legal advice: the contract template should be reviewed by a Connecticut attorney. */
function ymd_(d) { return Utilities.formatDate(d, tz_(), 'yyyy-MM-dd'); }
function cleanYmd_(v) { var s = v instanceof Date ? ymd_(v) : String(v == null ? '' : v).slice(0, 10); return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : ''; }
function prettyYmd_(s) { if (!s) return ''; var p = s.split('-'); return Utilities.formatDate(new Date(Date.UTC(+p[0], +p[1] - 1, +p[2], 12)), 'UTC', 'EEEE, MMMM d, yyyy'); }
function utcYmd_(d) { return d.toISOString().slice(0, 10); }
function nthDow_(y, m, dow, n) { var d = new Date(Date.UTC(y, m, 1)); return new Date(Date.UTC(y, m, 1 + (dow - d.getUTCDay() + 7) % 7 + (n - 1) * 7)); }
function lastDow_(y, m, dow) { var d = new Date(Date.UTC(y, m + 1, 0)); return new Date(Date.UTC(y, m, d.getUTCDate() - (d.getUTCDay() - dow + 7) % 7)); }
function easter_(y) {
  var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3),
    h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
    mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(y, mo - 1, da));
}
/* Days that are not business days for the cancel window. On purpose this is a superset of the legal holidays
   (federal + Connecticut, the Monday after a Sunday holiday and the Friday before a Saturday one), so the customer always gets at least the time the law gives. */
function holidays_(y) {
  var list = [new Date(Date.UTC(y, 0, 1)), nthDow_(y, 0, 1, 3), new Date(Date.UTC(y, 1, 12)), nthDow_(y, 1, 1, 3),
    new Date(easter_(y).getTime() - 2 * 86400000), lastDow_(y, 4, 1), new Date(Date.UTC(y, 5, 19)), new Date(Date.UTC(y, 6, 4)),
    nthDow_(y, 8, 1, 1), nthDow_(y, 9, 1, 2), new Date(Date.UTC(y, 10, 11)), nthDow_(y, 10, 4, 4), new Date(Date.UTC(y, 11, 25))];
  var out = {};
  list.forEach(function (d) {
    out[utcYmd_(d)] = 1;
    if (d.getUTCDay() === 0) out[utcYmd_(new Date(d.getTime() + 86400000))] = 1;
    if (d.getUTCDay() === 6) out[utcYmd_(new Date(d.getTime() - 86400000))] = 1;
  });
  return out;
}
/* Last day the customer can cancel (until midnight): the third business day after the signing day.
   Business day = every day except Sunday and holidays (Saturday counts). */
function cancelBy_(signed) {
  var p = ymd_(signed instanceof Date ? signed : new Date(signed)).split('-');
  var d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])), n = 0, hol = {};
  while (n < 3) {
    d = new Date(d.getTime() + 86400000);
    var y = d.getUTCFullYear(); if (!hol[y]) hol[y] = holidays_(y);
    if (d.getUTCDay() !== 0 && !hol[y][utcYmd_(d)]) n++;
  }
  return utcYmd_(d);
}
function inCancelWindow_(q) { return !!(q.signedAt && q.cancelBy && !q.cancelledAt && ymd_(new Date()) <= q.cancelBy); }

function contractDefaults_(s) {
  var k = s.contract = s.contract || {};
  if (k.cleanup === undefined || k.cleanup === '') k.cleanup = 'Team Forte removes all job debris, uses a magnetic nail sweep around the house, and leaves the property broom-clean.';
  if (k.permit === undefined || k.permit === '') k.permit = 'Team Forte applies for the building permit when the town requires one. The permit fee is included in the price.';
  if (k.deckPrice === undefined || k.deckPrice === '') k.deckPrice = 110;
  if (k.decking === undefined || k.decking === '') k.decking = 'Rotted roof decking found after tear-off is replaced at {price} per 4x8 sheet, only after we show you and you approve it in writing (a change order).';
  k.signerName = k.signerName || '';
  k.signerTitle = k.signerTitle || 'Owner';
  k.sigId = k.sigId || '';
  return k;
}

/* What a Connecticut home improvement contract needs before it can go out for signature. */
function contractMissing_(q, s) {
  var c = s.company || {}, k = contractDefaults_(s), miss = [];
  if (!c.legal) miss.push('your legal business name (Settings)');
  if (!c.hic) miss.push('your CT HIC registration number (Settings)');
  if (!c.mailing) miss.push('the contract mailing address (Settings)');
  if (!k.signerName || !k.sigId) miss.push('your signature for contracts (Settings)');
  if (!q.name) miss.push('the customer’s name');
  if (!q.address) miss.push('the job address');
  if (!q.startDate) miss.push('a start date');
  if (!q.endDate) miss.push('a completion date');
  if (q.startDate && q.endDate && q.endDate < q.startDate) miss.push('a completion date on or after the start date');
  if (q.type === 'repair' ? !(q.items || []).length : q.pick < 0) miss.push(q.type === 'repair' ? 'the repair items' : 'the shingle package');
  if (!(q.contractPrice > 0)) miss.push('the price');
  return miss;
}
function contractorMissing_(s) {
  var c = s.company || {}, k = contractDefaults_(s), miss = [];
  if (!c.legal) miss.push('your legal business name (Settings)');
  if (!c.hic) miss.push('your CT HIC registration number (Settings)');
  if (!c.mailing) miss.push('the contract mailing address (Settings)');
  if (!k.signerName || !k.sigId) miss.push('your signature for contracts (Settings)');
  return miss;
}
function needContract_(q, s) {
  var miss = contractMissing_(q, s);
  if (miss.length) throw new Error('Before this can be signed, add ' + miss.join(', ') + '.');
}

function coTotal_(co) { return money2_((co.items || []).reduce(function (n, it) { return n + (Number(it.qty) || 0) * (Number(it.price) || 0); }, 0)); }
function signedCoTotal_(q) { return money2_((q.changeOrders || []).filter(function (co) { return co.status === 'signed'; }).reduce(function (n, co) { return n + coTotal_(co); }, 0)); }
function jobTotal_(q) { return money2_((Number(q.contractPrice) || 0) + signedCoTotal_(q)); }

function contractSigUri_(s) {
  var id = contractDefaults_(s).sigId;
  if (!id) return '';
  try { return 'data:image/png;base64,' + Utilities.base64Encode(DriveApp.getFileById(id).getBlob().getBytes()); } catch (e) { Logger.log('contractor signature: ' + e.message); return ''; }
}

function paymentSchedule_(q, s) {
  var total = Number(q.contractPrice) || 0, dep = money2_(total * s.depositPct / 100);
  var m = function (n) { return '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  if (!(dep > 0)) return 'Full price of ' + m(total) + ' due when the job is done.';
  return 'Deposit of ' + m(dep) + ' (' + s.depositPct + '%) at signing. It is refunded in full if you cancel within the cancellation period. It is refunded in full if you cancel within the cancellation period, and is non-refundable after that. Balance of ' + m(total - dep) + ' due when the job is done.';
}

/* The contract terms shown before signing (proposal page) and printed in the signed copy. */
function contractTerms_(q, s) {
  var c = s.company, k = contractDefaults_(s);
  var m = function (n) { return '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var pk = TAKEOFF.PACKAGES[q.pick];
  var materials = q.type === 'repair' ? 'Materials to match the existing roof as closely as available.' :
    'Owens Corning ' + (pk ? pk.label : '') + ' shingles' + (q.color ? ' in ' + q.color : ' (color chosen with you before materials are ordered)') + ', with the Owens Corning underlayment, starter, ice & water barrier, hip & ridge and ventilation listed in the scope.';
  return {
    contractor: c.legal, mailing: c.mailing, phone: c.phone, email: c.email, hic: c.hic,
    start: prettyYmd_(q.startDate), end: prettyYmd_(q.endDate),
    materials: materials, payment: paymentSchedule_(q, s),
    decking: q.type === 'repair' ? '' : String(k.decking).replace('{price}', m(k.deckPrice)),
    cleanup: k.cleanup, permit: k.permit,
    changes: 'Any change to this work or price must be in a written change order signed by you and by Team Forte.',
    whole: 'This contract, its scope of work and any signed change orders are the entire agreement between you and ' + c.legal + '.',
    cancelLine: 'You, the buyer, may cancel this transaction at any time prior to midnight of the third business day after the date of this transaction. See the attached notice of cancellation form for an explanation of this right.'
  };
}

function contractHtml_(q, s, t) {
  t = t || contractTerms_(q, s);
  var e = escHtml_;
  var addl = (q.chosen || []).length ? '<p><b>Added options you picked:</b> ' + q.chosen.map(function (a) { return e(a.name) + ' ($' + Number(a.total).toLocaleString('en-US', { minimumFractionDigits: 2 }) + ')'; }).join(', ') + '</p>' : '';
  return '<div class="card"><h2>Contract</h2><div class="terms" style="font-size:13px;color:#1C2430">' +
    '<p><b>Contractor:</b> ' + e(t.contractor) + ', ' + e(t.mailing) + ' · ' + e(t.phone) + ' · ' + e(t.email) + ' · CT Home Improvement Contractor Registration ' + e(t.hic) + '</p>' +
    '<p><b>Owner:</b> ' + e(q.name) + ', ' + e(q.address) + '</p>' +
    '<p><b>Start date:</b> ' + e(t.start) + ' &nbsp; <b>Completion date:</b> ' + e(t.end) + ' (weather permitting; we will tell you before any change)</p>' +
    '<p><b>Materials:</b> ' + e(t.materials) + '</p>' + addl +
    '<p><b>Price and payment:</b> ' + e(t.payment) + '</p>' +
    (t.decking ? '<p><b>Roof decking:</b> ' + e(t.decking) + '</p>' : '') +
    '<p><b>Cleanup:</b> ' + e(t.cleanup) + '</p><p><b>Permit:</b> ' + e(t.permit) + '</p>' +
    '<p><b>Changes:</b> ' + e(t.changes) + ' ' + e(t.whole) + '</p>' +
    '<p style="font-size:14px;font-weight:bold;border:2px solid #1C2430;padding:8px">' + e(t.cancelLine) + '</p></div></div>';
}

function noticeHtml_(q, s) {
  var c = s.company, signed = q.signedAt ? new Date(q.signedAt) : new Date();
  var e = escHtml_, by = prettyYmd_(q.cancelBy || cancelBy_(signed));
  var one = '<div class="card" style="page-break-inside:avoid"><h2 style="text-align:center">NOTICE OF CANCELLATION</h2><div style="font-size:12.5px;line-height:1.5">' +
    '<p>' + e(Utilities.formatDate(signed, tz_(), 'MMMM d, yyyy')) + ' (date of transaction)</p>' +
    '<p>You may cancel this transaction, without any penalty or obligation, within three business days from the above date.</p>' +
    '<p>If you cancel, any property traded in, any payments made by you under the contract or sale, and any negotiable instrument executed by you will be returned within ten business days following receipt by the seller of your cancellation notice, and any security interest arising out of the transaction will be cancelled.</p>' +
    '<p>If you cancel, you must make available to the seller at your residence, in substantially as good condition as when received, any goods delivered to you under this contract or sale; or you may, if you wish, comply with the instructions of the seller regarding the return shipment of the goods at the seller’s expense and risk.</p>' +
    '<p>If you do make the goods available to the seller and the seller does not pick them up within twenty days of the date of your notice of cancellation, you may retain or dispose of them without any further obligation. If you fail to make the goods available to the seller, or if you agree to return them to the seller and fail to do so, then you remain liable for performance of all obligations under the contract.</p>' +
    '<p>To cancel this transaction, mail or deliver a signed and dated copy of this cancellation notice or any other written notice, or send a telegram, to <b>' + e(c.legal) + '</b>, at <b>' + e(c.mailing) + '</b>' + (c.email ? ' (or email ' + e(c.email) + ')' : '') + ', not later than midnight of <b>' + e(by) + '</b>.</p>' +
    '<p>I hereby cancel this transaction.</p><p style="margin-top:22px">Date: ______________________ &nbsp;&nbsp; Buyer’s signature: ______________________________</p></div></div>';
  return one + one;
}

/* Signature block: owner (customer) and contractor. */
function signaturesHtml_(name, sig, when, s) {
  var k = contractDefaults_(s), csig = contractSigUri_(s), e = escHtml_;
  return '<div class="card"><h2>Signatures</h2><table style="width:100%;font-size:13px"><tr>' +
    '<td style="width:50%;vertical-align:top;padding-right:10px"><b>Owner</b><br><img class="sig" src="' + sig + '"><br>' + e(name) + '<br>' + e(Utilities.formatDate(when, tz_(), 'MMMM d, yyyy h:mm a z')) + '</td>' +
    '<td style="vertical-align:top"><b>Contractor</b><br>' + (csig ? '<img class="sig" src="' + csig + '">' : '<div style="height:60px"></div>') + '<br>' + e(k.signerName) + ', ' + e(k.signerTitle) + '<br>' + e(s.company.legal) + '<br>' + e(Utilities.formatDate(when, tz_(), 'MMMM d, yyyy')) + '</td>' +
    '</tr></table></div>';
}

/* Owner: the customer cancelled. Refunds Stripe payments; cash/check refunds are listed to do by hand. */
API_.cancelContract = function (a) {
  var qs = readQuotes_(), q = findById_(qs, a.id);
  if (!q) throw new Error('Quote not found.');
  if (!q.signedAt) throw new Error('This proposal isn’t signed, so there is nothing to cancel. Use Archive instead.');
  if (q.cancelledAt) throw new Error('Already marked cancelled.');
  if (CURRENT_USER_.role !== 'owner') throw new Error('Only the owner can cancel a signed contract.');
  var notes = [], inWindow = inCancelWindow_(q);
  (q.payments || []).forEach(function (p) {
    if (!inWindow) return; // after the 3 business days: payments are non-refundable
    if (p.status === 'pending' && p.processing) { notes.push('A $' + p.amount + ' bank payment is still clearing. Once it clears (Stripe emails you), refund it in your Stripe dashboard.'); return; }
    if (p.status !== 'paid' || p.refunded) return;
    if (p.kind === 'manual') { notes.push('Refund $' + p.amount + ' paid by ' + (p.method || 'cash/check') + ' yourself.'); return; }
    if (!stripeKey_()) { notes.push('Refund the $' + p.amount + ' card/bank payment in Stripe.'); return; }
    try {
      var sess = stripe_('get', '/checkout/sessions/' + encodeURIComponent(p.id));
      if (!sess.payment_intent) throw new Error('no payment found');
      var rf = stripe_('post', '/refunds', { payment_intent: sess.payment_intent, metadata: { quote: q.id, reason: 'customer cancelled' } });
      p.refunded = true; p.refundId = rf.id; p.refundedAt = new Date().toISOString();
      logEvent_(q, 'refunded $' + p.amount + ' in Stripe');
    } catch (e) {
      notes.push('Stripe didn’t refund the $' + p.amount + ' payment automatically (' + String(e.message || e).slice(0, 120) + '). Refund it in your Stripe dashboard. If the key lacks permission, add “Refunds: Write” to the restricted key.');
    }
  });
  var before = q.status, within = inCancelWindow_(q);
  q.cancelledAt = new Date().toISOString();
  q.status = 'archived';
  logEvent_(q, 'customer cancelled' + (a.reason ? ': ' + clean_(a.reason, 200) : '') + (within ? ' (within the cancellation period)' : ''));
  audit_('quote', q.id, 'cancelled', before, 'archived');
  q.updated = q.cancelledAt;
  writeQuotes_(qs);
  q.refundNotes = notes;
  return q;
};

/* ----- change orders ----- */
function cleanCoItems_(items) {
  return (Array.isArray(items) ? items : []).slice(0, 30).map(function (it) {
    return { name: clean_(it.name, 120), qty: Math.round((Number(it.qty) || 0) * 100) / 100, unit: clean_(it.unit, 20) || 'each', price: money2_(it.price) };
  }).filter(function (it) { return it.name && it.qty; });
}
function coUrl_(id, coId) { return settings_().proposalBase + '#p=' + encodeURIComponent(id) + '&co=' + encodeURIComponent(coId); }

API_.saveChangeOrder = function (a) {
  var qs = readQuotes_(), q = findById_(qs, a.id);
  if (!q) throw new Error('Quote not found.');
  if (!q.signedAt) throw new Error('Change orders are for signed jobs. Change the proposal instead.');
  q.changeOrders = q.changeOrders || [];
  var co = a.co || {}, cur = co.id ? q.changeOrders.filter(function (x) { return x.id === co.id; })[0] : null;
  if (cur && (cur.status === 'signed' || cur.status === 'void')) throw new Error('This change order is ' + cur.status + ' and can’t be edited. Make a new one.');
  if (!cur) {
    var n = q.changeOrders.length + 1;
    cur = { id: 'CO' + n, n: n, status: 'draft', created: new Date().toISOString(), by: CURRENT_USER_.name || '' };
    q.changeOrders.push(cur);
  }
  var before = JSON.stringify(cur);
  cur.title = clean_(co.title, 100) || ('Change order ' + cur.n);
  cur.note = clean_(co.note, 600);
  cur.items = cleanCoItems_(co.items);
  cur.total = coTotal_(cur);
  if (!cur.items.length) throw new Error('Add at least one line (e.g. 6 sheets of decking at $110).');
  if (cur.status === 'sent') cur.status = 'draft';
  audit_('quote', q.id, 'change order ' + cur.id, before, JSON.stringify(cur));
  q.updated = new Date().toISOString();
  writeQuotes_(qs);
  return q;
};

API_.sendChangeOrder = function (a) {
  var qs = readQuotes_(), q = findById_(qs, a.id);
  if (!q) throw new Error('Quote not found.');
  var co = (q.changeOrders || []).filter(function (x) { return x.id === a.coId; })[0];
  if (!co) throw new Error('Change order not found.');
  if (co.status === 'signed' || co.status === 'void') throw new Error('This change order is already ' + co.status + '.');
  var s = settings_();
  var cmiss = contractorMissing_(s);
  if (cmiss.length) throw new Error('Before this can be signed, add ' + cmiss.join(', ') + '.');
  var url = coUrl_(q.id, co.id);
  if (a.send === 'email') {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(q.email || '')) throw new Error('Add the customer’s email first.');
    var first = String(q.name || '').split(' ')[0];
    MailApp.sendEmail({ to: q.email, name: 'Team Forte', replyTo: ownerEmail_() || undefined, subject: 'Change order to approve: ' + co.title,
      htmlBody: '<div style="font-family:Arial,sans-serif;font-size:15px;color:#1C2430;max-width:540px"><p>Hi' + (first ? ' ' + escHtml_(first) : '') + ',</p>' +
        '<p>Here is the change order we went over for <b>' + escHtml_(q.address) + '</b>: <b>' + escHtml_(co.title) + '</b>, ' + (co.total < 0 ? 'a credit of ' : '') + '<b>$' + Math.abs(co.total).toLocaleString('en-US', { minimumFractionDigits: 2 }) + '</b>.</p>' +
        '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0"><tr><td style="background:#FF5440;border-radius:8px"><a href="' + escHtml_(url) + '" style="display:inline-block;padding:14px 22px;font-size:16px;font-weight:bold;color:#fff;text-decoration:none">Review and sign</a></td></tr></table>' +
        '<p>Questions? Reply to this email or call ' + escHtml_(s.company.phone) + '.</p><p>Team Forte</p></div>' });
    logEvent_(q, 'change order ' + co.id + ' emailed');
  } else logEvent_(q, 'change order ' + co.id + ' shared');
  co.status = 'sent'; co.sentAt = new Date().toISOString();
  q.updated = co.sentAt;
  writeQuotes_(qs);
  q.coUrl = url;
  return q;
};

API_.voidChangeOrder = function (a) {
  var qs = readQuotes_(), q = findById_(qs, a.id);
  if (!q) throw new Error('Quote not found.');
  var co = (q.changeOrders || []).filter(function (x) { return x.id === a.coId; })[0];
  if (!co) throw new Error('Change order not found.');
  if (co.status === 'signed' && CURRENT_USER_.role !== 'owner') throw new Error('Only the owner can void a signed change order.');
  audit_('quote', q.id, 'change order ' + co.id, co.status, 'void');
  co.status = 'void'; co.voidAt = new Date().toISOString();
  logEvent_(q, 'change order ' + co.id + ' voided');
  q.updated = co.voidAt;
  writeQuotes_(qs);
  return q;
};

function publicChangeOrders_(q) {
  return (q.changeOrders || []).filter(function (co) { return co.status === 'sent' || co.status === 'signed'; }).map(function (co) {
    return { id: co.id, n: co.n, title: co.title, note: co.note || '', items: co.items, total: co.total, status: co.status,
      signed: co.signedAt ? { name: co.signerName, date: Utilities.formatDate(new Date(co.signedAt), tz_(), 'MMMM d, yyyy') } : null };
  });
}

/* Customer signs a change order on the proposal page (r=sign with co). Runs inside acceptProposal's lock. */
function signChangeOrder_(qs, q, a, s) {
  var co = (q.changeOrders || []).filter(function (x) { return x.id === a.co; })[0];
  if (!co || co.status === 'void' || co.status === 'draft') throw new Error('This change order isn’t available. Please call us.');
  if (co.status === 'signed') throw new Error('This change order is already signed. Thank you!');
  if (a.total !== undefined && Math.abs(Number(a.total) - co.total) > 0.5) throw new Error('This change order was just updated. Please refresh the page and sign again.');
  var name = clean_(a.name, 80);
  if (name.length < 2) throw new Error('Type your full name.');
  if (!a.agree) throw new Error('Check the box to approve.');
  var sig = String(a.signature || ''), m = sig.match(/^data:image\/png;base64,([A-Za-z0-9+\/=]+)$/);
  if (!m || m[1].length > 600000) throw new Error('Please sign again.');
  var now = new Date(), folder = childFolder_(rootFolder_(), 'Signed proposals');
  co.signatureId = folder.createFile(Utilities.newBlob(Utilities.base64Decode(m[1]), 'image/png', q.id + '-' + co.id + '-signature.png')).getId();
  co.status = 'signed'; co.signedAt = now.toISOString(); co.signerName = name;
  logEvent_(q, 'change order ' + co.id + ' signed online by ' + name + ' ($' + co.total + ')');
  var pdf = null;
  try {
    var mny = function (n) { return '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    var p = proposalHtml_(q, s);
    var html = '<html><head><meta charset="utf-8"><style>' + p.css + ' .top span{float:none;display:block}</style></head><body>' + p.head +
      '<div class="w"><h1>Change order ' + escHtml_(co.id) + ': ' + escHtml_(co.title) + '</h1><div class="m">Proposal ' + escHtml_(q.id) + ' · ' + escHtml_(q.address) + '</div>' +
      '<div class="card"><table class="t"><tr><th>Item</th><th class="r">Qty</th><th class="r">Price</th><th class="r">Amount</th></tr>' + co.items.map(function (it) {
        return '<tr><td>' + escHtml_(it.name) + '</td><td class="r">' + it.qty + ' ' + escHtml_(it.unit) + '</td><td class="r">' + mny(it.price) + '</td><td class="r">' + mny(it.qty * it.price) + '</td></tr>';
      }).join('') + '</table>' + (co.note ? '<p class="m">' + escHtml_(co.note) + '</p>' : '') +
      '<div class="price"><span>Change order total</span><span>' + mny(co.total) + '</span></div>' +
      '<div class="dep"><span>Original contract price</span><span>' + mny(q.contractPrice) + '</span></div><div class="dep"><span>New job total</span><span>' + mny(jobTotal_(q)) + '</span></div></div>' +
      '<div class="card"><div class="terms">This change order amends the contract signed ' + escHtml_(Utilities.formatDate(new Date(q.signedAt), tz_(), 'MMMM d, yyyy')) + '. All other terms stay the same.</div></div>' +
      signaturesHtml_(name, sig, now, s) + p.foot + '</body></html>';
    pdf = Utilities.newBlob(html, 'text/html', q.id + co.id + '.html').getAs('application/pdf');
    pdf.setName('Team Forte change order ' + q.id + ' ' + co.id + ' (signed).pdf');
    co.pdfId = folder.createFile(pdf).getId();
  } catch (e) { Logger.log('change order pdf: ' + e.message); }
  q.updated = now.toISOString();
  writeQuotes_(qs);
  var att = pdf ? [pdf] : [], owner = ownerEmail_(), emailed = false;
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(q.email || '')) {
    try { MailApp.sendEmail({ to: q.email, name: 'Team Forte', replyTo: owner || undefined, attachments: att, subject: 'Your signed change order ' + co.id,
      htmlBody: '<div style="font-family:Arial,sans-serif;font-size:15px">Thank you, ' + escHtml_(name) + '. Your signed change order for ' + escHtml_(q.address) + ' is attached.<p>Team Forte<br>' + escHtml_(s.company.phone) + '</p></div>' }); emailed = true; } catch (e) { Logger.log('co copy: ' + e.message); }
  }
  if (owner) {
    try { MailApp.sendEmail({ to: owner, name: 'Team Forte app', attachments: att, subject: 'Change order signed: ' + (q.name || q.id) + ' ' + co.id + ' ($' + co.total + ')',
      htmlBody: '<div style="font-family:Arial,sans-serif;font-size:15px"><b>' + escHtml_(name) + '</b> signed change order ' + escHtml_(co.id) + ' (' + escHtml_(co.title) + ') for ' + escHtml_(q.address) + '. New job total: $' + jobTotal_(q).toLocaleString('en-US', { minimumFractionDigits: 2 }) + '.</div>' }); } catch (e) { Logger.log('co owner: ' + e.message); }
  }
  return JSON.stringify({ ok: true, emailed: emailed, co: co.id, total: co.total, jobTotal: jobTotal_(q), balance: balanceOf_(q) });
}

/* Contractor signature drawn once in Settings. */
function saveContractSig_(png, s) {
  var m = String(png || '').match(/^data:image\/png;base64,([A-Za-z0-9+\/=]+)$/);
  if (!m || m[1].length > 600000) throw new Error('Please sign again.');
  var k = contractDefaults_(s);
  var f = childFolder_(rootFolder_(), 'Signed proposals').createFile(Utilities.newBlob(Utilities.base64Decode(m[1]), 'image/png', 'contractor-signature.png'));
  if (k.sigId) { try { DriveApp.getFileById(k.sigId).setTrashed(true); } catch (e) { /* old one gone */ } }
  k.sigId = f.getId();
}

/* ---------------- optional add-ons the customer ticks on the proposal ---------------- */
var ADDON_BASES = ['eaves', 'rakes', 'eaves+rakes', 'ridges', 'area', 'downspouts', 'one', 'manual'];
var ADDON_DEFAULTS = [
  { key: 'gutters', name: 'Seamless aluminum gutters', unit: 'LF', price: 12, basis: 'eaves' },
  { key: 'guards', name: 'Gutter guards', unit: 'LF', price: 8, basis: 'eaves' },
  { key: 'downspouts', name: 'Downspouts', unit: 'each', price: 150, basis: 'downspouts' },
  { key: 'trim', name: 'Fascia & trim repaint', unit: 'LF', price: 4, basis: 'eaves+rakes' },
  { key: 'icewater', name: 'Full ice & water barrier upgrade', unit: 'sq ft', price: 1.25, basis: 'area' },
  { key: 'ridgevent', name: 'Ridge vent upgrade', unit: 'LF', price: 10, basis: 'ridges' },
  { key: 'warranty', name: 'Extended workmanship warranty (+5 years)', unit: 'each', price: 750, basis: 'one' }
];
function addonsBook_(s) { if (!Array.isArray(s.addons)) s.addons = JSON.parse(JSON.stringify(ADDON_DEFAULTS)); return s.addons; }
function addonKey_(name) { return String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 24); }
function cleanAddonBook_(list) {
  var seen = {};
  return (Array.isArray(list) ? list : []).slice(0, 20).map(function (x) {
    var name = clean_(x.name, 80), key = clean_(x.key, 30).replace(/[^a-z0-9_]/gi, '') || addonKey_(name);
    while (seen[key]) key += '2';
    seen[key] = 1;
    return { key: key, name: name, unit: clean_(x.unit, 20) || 'each', price: money2_(x.price), basis: ADDON_BASES.indexOf(x.basis) >= 0 ? x.basis : 'manual' };
  }).filter(function (x) { return x.name && x.price > 0; });
}
/* The add-ons offered on one proposal, with their quantities (set in the app from the roof measurements). */
function cleanOffered_(list, s) {
  var book = {};
  addonsBook_(s).forEach(function (b) { book[b.key] = b; });
  var seen = {};
  return (Array.isArray(list) ? list : []).slice(0, 20).map(function (x) {
    var b = book[x.key] || {}, qty = Math.max(0, Math.round((Number(x.qty) || 0) * 100) / 100);
    var price = money2_(x.price !== undefined && x.price !== '' && x.price !== null ? x.price : b.price);
    return { key: clean_(x.key, 30), name: clean_(x.name || b.name, 80), unit: clean_(x.unit || b.unit, 20) || 'each', qty: qty, price: price, total: money2_(qty * price) };
  }).filter(function (x) { if (!x.key || !x.name || !(x.total > 0) || seen[x.key]) return false; seen[x.key] = 1; return true; });
}

/* ---------------- automatic follow-ups (hourly) ---------------- */
var FOLLOW_LABEL = { unopened: 'Not opened reminder', opened: 'Opened, not signed reminder', final: 'Last reminder', deposit: 'Deposit reminder', unpaid: 'Balance reminder' };
function followDefaults_(s) {
  var f = s.follow = s.follow || {};
  if (f.on === undefined) f.on = true;
  if (f.hot === undefined) f.hot = true;
  if (f.tags === undefined) f.tags = true;
  return f;
}
function tms_(v) { var t = new Date(v || 0).getTime(); return isNaN(t) ? 0 : t; }
function opensOf_(q) { return (q.events || []).filter(function (e) { return /^proposal opened/.test(e.e); }); }
function seenOf_(q) { return (q.events || []).filter(function (e) { return /^proposal (opened|presented)/.test(e.e); }); }
/* Which reminder (if any) this quote should get now. One step per run; each step is sent once. */
function followDue_(q, s, now) {
  if (q.followOff || q.cancelledAt || q.status === 'archived') return '';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(q.email || '')) return '';
  var D = 86400000, done = {}, last = 0;
  (q.followups || []).forEach(function (f) { done[f.k] = 1; last = Math.max(last, tms_(f.t)); });
  if (last && now - last < 2 * D) return '';
  if (!q.signedAt) {
    if (q.status !== 'new' || !q.proposalSentAt) return '';
    var sent = tms_(q.proposalSentAt), opens = seenOf_(q);
    if (!opens.length && !done.unopened && now - sent >= D && now - sent < 6 * D) return 'unopened';
    if (opens.length && !done.opened && now - tms_(opens[0].t) >= 2 * D && now - sent < 8 * D) return 'opened';
    if (!done.final && now - sent >= 8 * D && now - sent < 21 * D) return 'final';
    return '';
  }
  var payable = !!stripeKey_() || !!s.depositLink;
  if (s.depositPct > 0 && q.depositStatus !== 'paid' && depositDue_(q, s) > 0 && payable && !done.deposit && now - tms_(q.signedAt) >= D && now - tms_(q.signedAt) < 10 * D) return 'deposit';
  if (q.status === 'done' && balanceOf_(q) > 0 && stripeKey_() && !done.unpaid && q.doneAt && now - tms_(q.doneAt) >= 7 * D && now - tms_(q.doneAt) < 60 * D) return 'unpaid';
  return '';
}
function stopSecret_() {
  var p = PropertiesService.getScriptProperties(), k = p.getProperty('STOP_SECRET');
  if (!k) { k = Utilities.getUuid(); p.setProperty('STOP_SECRET', k); }
  return k;
}
function stopToken_(id) {
  return Utilities.computeHmacSha256Signature(String(id), stopSecret_()).slice(0, 9).map(function (b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join('');
}
function stopUrl_(id) { return execUrl_() + '?r=stop&id=' + encodeURIComponent(id) + '&k=' + stopToken_(id); }
function stopPage_(id, k) {
  var good = !!(id && k === stopToken_(id));
  var page = good ? '<p>Stop reminder emails about your Team Forte proposal?</p><button id="b" style="font:inherit;font-weight:bold;background:#FF5440;color:#fff;border:0;border-radius:8px;padding:12px 20px;cursor:pointer">Yes, stop reminders</button><p id="m"></p>' +
    '<script>document.getElementById("b").onclick=function(){var b=this;b.disabled=true;google.script.run.withSuccessHandler(function(ok){document.getElementById("m").textContent=ok?"Done. You won\u2019t get any more reminder emails about this proposal.":"That didn\u2019t work. Reply to our email and we\u2019ll stop them.";b.style.display="none";}).withFailureHandler(function(){b.disabled=false;document.getElementById("m").textContent="Couldn\u2019t save. Try again.";}).stopReminders(' + JSON.stringify(id) + ',' + JSON.stringify(k) + ');};</script>'
    : '<p>That link didn’t work. Reply to our email and we’ll stop the reminders.</p>';
  return HtmlService.createHtmlOutput('<div style="font-family:Arial,sans-serif;font-size:17px;padding:40px 20px;color:#1C2430;max-width:520px;margin:0 auto"><b>Team Forte</b>' + page + '</div>').setTitle('Team Forte').addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
/** Called by the stop page's button (public on purpose; the token is the key). */
function stopReminders(id, k) {
  id = String(id || ''); k = String(k || '');
  if (!id || k !== stopToken_(id)) return false;
  var lock = LockService.getScriptLock(), ok = false;
  if (!lock.tryLock(15000)) return false;
  try { TBL_ = {}; var qs = readQuotes_(), q = findById_(qs, id); if (q) { q.followOff = true; logEvent_(q, 'customer turned off reminders'); writeQuotes_(qs); ok = true; } }
  finally { lock.releaseLock(); }
  return ok;
}
function followEmail_(q, s, key) {
  var first = String(q.name || '').split(' ')[0], hi = 'Hi' + (first ? ' ' + escHtml_(first) : '') + ',';
  var lock = validUntil_(q, s), m = function (n) { return '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var btn = function (url, label) { return '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0"><tr><td style="background:#FF5440;border-radius:8px"><a href="' + escHtml_(url) + '" style="display:inline-block;padding:14px 22px;font-size:16px;font-weight:bold;color:#fff;text-decoration:none">' + label + '</a></td></tr></table>'; };
  var subj, body;
  if (key === 'unopened') { subj = 'Your Team Forte roof plan is ready'; body = '<p>' + hi + '</p><p>Just making sure you got your roof plan for <b>' + escHtml_(q.address) + '</b>. It has the photos from your inspection and your price.</p>' + btn(proposalUrl_(q.id), 'See my roof plan'); }
  else if (key === 'opened') { subj = 'Any questions about your roof plan?'; body = '<p>' + hi + '</p><p>Thanks for looking over your roof plan. Is there anything I can answer for you?' + (lock ? ' Your price is locked until <b>' + escHtml_(lock) + '</b>.' : '') + '</p>' + btn(proposalUrl_(q.id), 'Review and sign'); }
  else if (key === 'final') { subj = 'Your roof plan price' + (lock ? ' is locked until ' + lock : ''); body = '<p>' + hi + '</p><p>A last note about your roof plan for <b>' + escHtml_(q.address) + '</b>.' + (lock ? ' Your price is locked until <b>' + escHtml_(lock) + '</b>.' : '') + ' If you’ve decided to go another way, no problem. Just reply and let us know, and we’ll stop reminding you.</p>' + btn(proposalUrl_(q.id), 'See my roof plan'); }
  else if (key === 'deposit') { subj = 'Lock in your install date'; var dl = stripeKey_() ? payUrl_(q.id) : s.depositLink; body = '<p>' + hi + '</p><p>Thanks again for choosing Team Forte. Your ' + m(depositDue_(q, s)) + ' deposit holds your spot on our schedule.</p>' + btn(dl, 'Pay the deposit'); }
  else { subj = 'Team Forte invoice: ' + m(balanceOf_(q)) + ' due'; body = '<p>' + hi + '</p><p>Thank you for having us at <b>' + escHtml_(q.address) + '</b>. Your balance of <b>' + m(balanceOf_(q)) + '</b> is due.</p>' + btn(payUrl_(q.id), 'Pay the balance'); }
  var html = '<div style="font-family:Arial,sans-serif;font-size:15px;color:#1C2430;max-width:540px">' + body +
    '<p>Questions? Reply to this email or call ' + escHtml_(s.company.phone) + '.</p><p>Team Forte</p>' +
    '<p style="font-size:12px;color:#5B6675;margin-top:24px">' + escHtml_(s.company.legal) + (s.company.mailing ? ', ' + escHtml_(s.company.mailing) : '') + '. <a href="' + escHtml_(stopUrl_(q.id)) + '" style="color:#5B6675">Stop these reminders</a></p></div>';
  return { subject: subj, html: html };
}
/* Hourly. Sends at most one reminder per quote per run, only between 9 a.m. and 8 p.m. Connecticut time. */
function followupSweep() {
  var s = settings_(), f = followDefaults_(s);
  if (!f.on) return;
  var hour = Number(Utilities.formatDate(new Date(), tz_(), 'H'));
  if (hour < 9 || hour >= 20) return;
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return;
  try {
    TBL_ = {};
    var qs = readQuotes_(), now = Date.now(), sent = 0, owner = ownerEmail_();
    qs.forEach(function (q) {
      if (sent >= 25) return;
      var key = followDue_(q, s, now);
      if (!key) return;
      try {
        var em = followEmail_(q, s, key);
        MailApp.sendEmail({ to: q.email, subject: em.subject, htmlBody: em.html, name: 'Team Forte', replyTo: owner || undefined });
        q.followups = (q.followups || []).concat([{ k: key, t: new Date().toISOString(), via: 'email' }]);
        logEvent_(q, 'reminder emailed: ' + FOLLOW_LABEL[key]);
        if (f.tags && ghlReady_(s) && q.ghlContactId) ghlTag_(q, ['tf-reminder-' + key]);
        sent++;
      } catch (e) { Logger.log('follow ' + q.id + ': ' + e.message); }
    });
    if (sent) writeQuotes_(qs);
  } finally { lock.releaseLock(); }
}
function ensureFollowTrigger_() {
  var has = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'followupSweep'; });
  if (!has) ScriptApp.newTrigger('followupSweep').timeBased().everyHours(1).create();
}
/* Owner alert when a customer keeps coming back to an unsigned proposal (2+ separate opens in a day). */
function hotAlert_(q, s) {
  if (q.signedAt || !followDefaults_(s).hot) return;
  var today = ymd_(new Date());
  var opensToday = opensOf_(q).filter(function (e) { return ymd_(new Date(e.t)) === today; }).length;
  var alerted = (q.events || []).some(function (e) { return /^hot alert/.test(e.e) && ymd_(new Date(e.t)) === today; });
  if (opensToday < 2 || alerted) return;
  var owner = ownerEmail_();
  if (!owner) return;
  try {
    MailApp.sendEmail({ to: owner, name: 'Team Forte app', subject: 'Hot lead: ' + (q.name || q.id) + ' opened their roof plan ' + opensToday + ' times today',
      htmlBody: '<div style="font-family:Arial,sans-serif;font-size:15px"><b>' + escHtml_(q.name || 'A customer') + '</b> (' + escHtml_(q.address) + ') just opened proposal ' + escHtml_(q.id) + ' again. Good time to call' + (q.phone ? ': <a href="tel:' + escHtml_(q.phone.replace(/[^\d+]/g, '')) + '">' + escHtml_(q.phone) + '</a>' : '') + '.</div>' });
    logEvent_(q, 'hot alert sent');
  } catch (e) { Logger.log('hot alert: ' + e.message); }
}

/* ---------------- payments (Stripe Checkout + cash/check records) ---------------- */

function stripeKey_() { return PropertiesService.getScriptProperties().getProperty('STRIPE_KEY') || ''; }
function money2_(n) { return Math.round((Number(n) || 0) * 100) / 100; }
function paidTotal_(q) { return money2_((q.payments || []).filter(function (p) { return p.status === 'paid'; }).reduce(function (n, p) { return n + (Number(p.amount) || 0); }, 0)); }
function balanceOf_(q) { return Math.max(0, money2_(jobTotal_(q) - paidTotal_(q))); }
function depositDue_(q, s) { var dep = money2_((Number(q.contractPrice) || 0) * (s || settings_()).depositPct / 100); return Math.max(0, Math.min(balanceOf_(q), money2_(dep - paidTotal_(q)))); }
function publicPayments_(q) {
  return (q.payments || []).filter(function (p) { return p.status === 'paid'; }).map(function (p) {
    return { amount: p.amount, label: p.label || '', date: Utilities.formatDate(new Date(p.paidAt || p.created || Date.now()), tz_(), 'MMM d, yyyy') };
  });
}
function stripeForm_(obj, prefix, out) {
  out = out || [];
  Object.keys(obj).forEach(function (k) {
    var v = obj[k]; if (v === undefined || v === null || v === '') return;
    var key = prefix ? prefix + '[' + k + ']' : k;
    if (typeof v === 'object') stripeForm_(v, key, out); else out.push(encodeURIComponent(key) + '=' + encodeURIComponent(String(v)));
  });
  return out;
}
function stripe_(method, path, params) {
  var key = stripeKey_();
  if (!key) throw new Error('Online payments aren’t set up yet. Please call us to pay.');
  var opt = { method: method, muteHttpExceptions: true, headers: { Authorization: 'Bearer ' + key } };
  var url = 'https://api.stripe.com/v1' + path;
  if (params && method === 'get') url += (url.indexOf('?') < 0 ? '?' : '&') + stripeForm_(params).join('&');
  else if (params) { opt.payload = stripeForm_(params).join('&'); opt.contentType = 'application/x-www-form-urlencoded'; }
  var res = UrlFetchApp.fetch(url, opt), code = res.getResponseCode(), body = parseJson_(res.getContentText(), {}) || {};
  if (code >= 300) throw new Error('Stripe: ' + ((body.error && body.error.message) || ('error ' + code)));
  return body;
}

/** Customer pressed Pay. The amount always comes from the server, never from the page. */
function payStart_(a) {
  var s = settings_(), lock = LockService.getScriptLock();
  lock.waitLock(20000); TBL_ = {};
  try {
    var qs = readQuotes_(), q = findById_(qs, String(a.id || ''));
    if (!q || q.status === 'archived' || !proposalReady_(q)) throw new Error('This invoice isn’t available. Please call us.');
    if (!q.signedAt && !q.payReq) throw new Error('Please sign the proposal first.');
    var kind = a.kind === 'deposit' ? 'deposit' : 'request', amount, label;
    if (kind === 'deposit') { amount = depositDue_(q, s); label = 'Deposit'; }
    else { amount = q.payReq && q.payReq.amount > 0 ? Math.min(q.payReq.amount, balanceOf_(q)) : balanceOf_(q); label = (q.payReq && q.payReq.label) || 'Balance'; }
    amount = money2_(amount);
    if (!(amount >= 1)) throw new Error('Nothing is due right now. Thank you!');
    var where = String(q.address || '').split(',')[0];
    var base = s.proposalBase;
    var sess = stripe_('post', '/checkout/sessions', {
      mode: 'payment', client_reference_id: q.id,
      customer_email: /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(q.email || '') ? q.email : undefined,
      line_items: { 0: { quantity: 1, price_data: { currency: 'usd', unit_amount: Math.round(amount * 100), product_data: { name: 'Team Forte ' + label.toLowerCase() + (where ? ' · ' + where : ''), description: 'Proposal ' + q.id + (q.address ? ' · ' + q.address : '') } } } },
      success_url: base + '?paid={CHECKOUT_SESSION_ID}#p=' + encodeURIComponent(q.id) + (kind === 'request' ? '&pay=1' : ''),
      cancel_url: base + '#p=' + encodeURIComponent(q.id) + (kind === 'request' ? '&pay=1' : ''),
      metadata: { quote: q.id, kind: kind },
      payment_intent_data: { description: 'Team Forte ' + label + ' · ' + q.id, metadata: { quote: q.id, kind: kind }, receipt_email: /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(q.email || '') ? q.email : undefined }
    });
    q.payments = (q.payments || []).filter(function (p) { return !(p.status === 'pending' && Date.now() - new Date(p.created).getTime() > 2 * 86400000 && !p.processing); });
    q.payments.push({ id: sess.id, kind: kind, label: label, amount: amount, status: 'pending', created: new Date().toISOString() });
    logEvent_(q, 'checkout opened: ' + label.toLowerCase() + ' $' + amount.toLocaleString('en-US', { minimumFractionDigits: 2 }));
    writeQuotes_(qs);
    return { ok: true, url: sess.url };
  } finally { lock.releaseLock(); }
}

/** Ask Stripe what happened to a checkout and record it. Safe to call any number of times. */
function stripeSync_(q, p, sess, s) {
  if (!sess || !p || p.status === 'paid') return p ? p.status : '';
  var meta = sess.metadata || {};
  if (meta.quote !== q.id && sess.client_reference_id !== q.id) throw new Error('That payment belongs to a different proposal.');
  if (sess.payment_status === 'paid' || sess.payment_status === 'no_payment_required') {
    p.status = 'paid'; p.processing = false; p.paidAt = new Date().toISOString(); p.amount = money2_((sess.amount_total || 0) / 100) || p.amount; p.method = 'Stripe';
    logEvent_(q, 'paid online: ' + (p.label || 'payment').toLowerCase() + ' $' + p.amount.toLocaleString('en-US', { minimumFractionDigits: 2 }));
    if (paidTotal_(q) + 0.005 >= money2_(q.contractPrice * s.depositPct / 100)) q.depositStatus = 'paid';
    if (q.payReq && (p.kind === 'request' || balanceOf_(q) <= 0)) q.payReq = null;
    var owner = ownerEmail_();
    if (owner) {
      try {
        MailApp.sendEmail({ to: owner, name: 'Team Forte app', subject: 'Payment received: $' + p.amount.toLocaleString('en-US', { minimumFractionDigits: 2 }) + ' from ' + (q.name || q.id),
          htmlBody: '<div style="font-family:Arial,sans-serif;font-size:15px"><b>' + escHtml_(q.name || 'A customer') + '</b> paid <b>$' + p.amount.toLocaleString('en-US', { minimumFractionDigits: 2 }) + '</b> (' + escHtml_(p.label || 'payment') + ') for ' + escHtml_(q.address || q.id) + ' through Stripe.<br>Balance left: $' + balanceOf_(q).toLocaleString('en-US', { minimumFractionDigits: 2 }) + '.</div>' });
      } catch (e) { Logger.log('payment notice: ' + e.message); }
    }
    return 'paid';
  }
  if (sess.status === 'complete') { if (!p.processing) { p.processing = true; logEvent_(q, 'bank payment processing: $' + p.amount); } return 'processing'; }
  if (sess.status === 'expired') { p.status = 'expired'; return 'expired'; }
  return 'open';
}

/** The page came back from Stripe with ?paid=cs_... */
function stripeConfirm_(id, sessionId) {
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return { ok: false, error: 'Missing payment reference.' };
  var s = settings_(), sess = stripe_('get', '/checkout/sessions/' + encodeURIComponent(sessionId));
  var lock = LockService.getScriptLock(); lock.waitLock(20000); TBL_ = {};
  try {
    var qs = readQuotes_(), q = findById_(qs, id);
    if (!q) return { ok: false, error: 'Proposal not found.' };
    var p = (q.payments || []).filter(function (x) { return x.id === sessionId; })[0];
    if (!p) { p = { id: sessionId, kind: (sess.metadata || {}).kind || 'request', label: 'Payment', amount: money2_((sess.amount_total || 0) / 100), status: 'pending', created: new Date().toISOString() }; q.payments = (q.payments || []).concat([p]); }
    var status = p.status === 'paid' ? 'paid' : stripeSync_(q, p, sess, s);
    writeQuotes_(qs);
    return { ok: true, status: status, amount: p.amount, paid: paidTotal_(q), balance: balanceOf_(q), depositDue: depositDue_(q, s), payments: publicPayments_(q),
      payReq: q.payReq && q.payReq.amount > 0 ? { amount: Math.min(q.payReq.amount, balanceOf_(q)), label: q.payReq.label || '' } : null };
  } finally { lock.releaseLock(); }
}

/** Every 30 minutes: catch payments where the customer closed the page, and bank payments that cleared later. */
function stripeSweep() {
  if (!stripeKey_()) return;
  var qs0 = readQuotes_(), todo = [];
  qs0.forEach(function (q) { (q.payments || []).forEach(function (p) { if (p.status === 'pending' && Date.now() - new Date(p.created).getTime() < 10 * 86400000) todo.push([q.id, p.id]); }); });
  if (!todo.length) return;
  var found = {};
  todo.slice(0, 40).forEach(function (t) { try { found[t[1]] = stripe_('get', '/checkout/sessions/' + encodeURIComponent(t[1])); } catch (e) { Logger.log('sweep ' + t[1] + ': ' + e.message); } });
  var lock = LockService.getScriptLock(); lock.waitLock(25000); TBL_ = {};
  try {
    var s = settings_(), qs = readQuotes_(), changed = false;
    todo.forEach(function (t) {
      var q = findById_(qs, t[0]), sess = found[t[1]]; if (!q || !sess) return;
      var p = (q.payments || []).filter(function (x) { return x.id === t[1]; })[0];
      var before = JSON.stringify(p); stripeSync_(q, p, sess, s); if (JSON.stringify(p) !== before) changed = true;
    });
    if (changed) writeQuotes_(qs);
  } finally { lock.releaseLock(); }
}
/* ----- auto-prep materials: nothing is sent to a supplier until you press Send ----- */
function bizShift_(ymdStr, n) {
  var p = ymdStr.split('-'), d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])), dir = n < 0 ? -1 : 1, k = Math.abs(n), hol = {};
  while (k > 0) {
    d = new Date(d.getTime() + dir * 86400000);
    var y = d.getUTCFullYear(); if (!hol[y]) hol[y] = holidays_(y);
    if (d.getUTCDay() !== 0 && !hol[y][utcYmd_(d)]) k--;
  }
  return utcYmd_(d);
}
/* Ready when: signed, not cancelled, the cancellation period is over, the deposit has cleared (no bank payment still clearing),
   the job has materials, and no order exists yet. */
function orderReady_(q, s, today, orders) {
  if (!q.signedAt || q.cancelledAt || q.status === 'archived' || q.orderPrepared || !q.cancelBy) return false;
  if (today <= q.cancelBy) return false;
  if ((q.payments || []).some(function (p) { return p.status === 'pending' || p.processing; })) return false;
  if (s.depositPct > 0 && depositDue_(q, s) > 0) return false;
  if (!(q.lines || []).some(function (l) { return Number(l.qty) > 0; })) return false;
  return !orders.some(function (o) { return o.quoteId === q.id; });
}
function suggestDelivery_(q, today) {
  var d = q.startDate ? bizShift_(q.startDate, -1) : '';
  return d && d > today ? d : bizShift_(today, 1);
}
function orderSweep() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return;
  try {
    TBL_ = {};
    var s = settings_(), qs = readQuotes_(), orders = readOrders_(), today = ymd_(new Date()), owner = ownerEmail_(), changed = false;
    qs.forEach(function (q) {
      if (!orderReady_(q, s, today, orders)) return;
      q.orderPrepared = { at: new Date().toISOString(), delivery: suggestDelivery_(q, today) };
      q.updated = q.orderPrepared.at;
      logEvent_(q, 'materials ready to order (deposit cleared, cancellation period over)');
      changed = true;
      if (owner) {
        try {
          var n = (q.lines || []).filter(function (l) { return Number(l.qty) > 0; }).length;
          MailApp.sendEmail({ to: owner, subject: 'Ready to order: ' + (q.name || q.id), name: 'Team Forte app',
            htmlBody: '<div style="font-family:Arial,sans-serif;font-size:15px"><b>' + escHtml_(q.name || q.id) + '</b>, ' + escHtml_(q.address) + '. The deposit has cleared and the cancellation period is over.' +
              '<p>' + n + ' materials item' + (n === 1 ? '' : 's') + ' ready. Suggested delivery: <b>' + escHtml_(prettyYmd_(q.orderPrepared.delivery)) + '</b>.</p>' +
              '<p>Open the app, check the list, and press Send. Nothing is ordered until you do.</p></div>' });
        } catch (e) { Logger.log('order ready email: ' + e.message); }
      }
    });
    if (changed) writeQuotes_(qs);
  } finally { lock.releaseLock(); }
}
function ensureOrderSweep_() {
  var has = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'orderSweep'; });
  if (!has) ScriptApp.newTrigger('orderSweep').timeBased().everyHours(1).create();
}
function ensureStripeSweep_() {
  var has = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'stripeSweep'; });
  if (!has) ScriptApp.newTrigger('stripeSweep').timeBased().everyMinutes(30).create();
}

API_.stripeTest = function () {
  var r = stripe_('get', '/checkout/sessions', { limit: 1 });
  try { ensureStripeSweep_(); } catch (e) { /* optional */ }
  return { ok: true, mode: /_test_/.test(stripeKey_()) ? 'test' : 'live', count: (r.data || []).length };
};

function payUrl_(id) { return settings_().proposalBase + '#p=' + encodeURIComponent(id) + '&pay=1'; }

/** Office asks for a payment: sets the amount the invoice link shows, optionally emails it. */
API_.requestPayment = function (a) {
  var qs = readQuotes_(), q = findById_(qs, a.id);
  if (!q) throw new Error('Quote not found.');
  if (!(q.contractPrice > 0) || !proposalReady_(q)) throw new Error('Set the job price first (send or approve the proposal).');
  var bal = balanceOf_(q), amt = money2_(String(a.amount == null ? '' : a.amount).replace(/[^\d.]/g, ''));
  if (!(amt >= 1)) throw new Error('Enter the amount to request.');
  if (amt > bal + 0.005) throw new Error('That’s more than the balance ($' + bal.toLocaleString('en-US', { minimumFractionDigits: 2 }) + ').');
  q.payReq = { amount: amt, label: clean_(a.label, 60) || (amt >= bal ? 'Balance' : 'Payment'), at: new Date().toISOString() };
  var url = payUrl_(q.id), s = settings_();
  if (a.send === 'email') {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(q.email || '')) throw new Error('Add the customer’s email first.');
    var first = String(q.name || '').split(' ')[0];
    MailApp.sendEmail({ to: q.email, name: 'Team Forte', replyTo: ownerEmail_() || undefined, subject: 'Team Forte invoice: $' + amt.toLocaleString('en-US', { minimumFractionDigits: 2 }) + ' due',
      htmlBody: '<div style="font-family:Arial,sans-serif;font-size:15px;color:#1C2430;max-width:540px"><p>Hi' + (first ? ' ' + escHtml_(first) : '') + ',</p>' +
        '<p>Here is your invoice for <b>' + escHtml_(q.address) + '</b>: <b>$' + amt.toLocaleString('en-US', { minimumFractionDigits: 2 }) + '</b> (' + escHtml_(q.payReq.label) + ').</p>' +
        '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0"><tr><td style="background:#FF5440;border-radius:8px"><a href="' + escHtml_(url) + '" style="display:inline-block;padding:14px 22px;font-size:16px;font-weight:bold;color:#fff;text-decoration:none">View &amp; pay invoice</a></td></tr></table>' +
        '<p>You can pay by card or bank account. Questions? Reply to this email or call ' + escHtml_(s.company.phone) + '.</p><p>Thank you,<br>Team Forte</p></div>' });
    logEvent_(q, 'invoice emailed: $' + amt);
  } else logEvent_(q, 'payment requested: $' + amt);
  q.updated = new Date().toISOString();
  writeQuotes_(qs);
  q.payUrl = url;
  return q;
};

/** Cash, check or anything paid outside Stripe. */
API_.recordPayment = function (a) {
  var qs = readQuotes_(), q = findById_(qs, a.id);
  if (!q) throw new Error('Quote not found.');
  var amt = money2_(String(a.amount == null ? '' : a.amount).replace(/[^\d.]/g, ''));
  if (!(amt > 0)) throw new Error('Enter the amount received.');
  var method = ['Cash', 'Check', 'Zelle', 'Financing', 'Other'].indexOf(a.method) >= 0 ? a.method : 'Other';
  q.payments = (q.payments || []).concat([{ id: 'm' + Date.now().toString(36), kind: 'manual', label: method + (a.note ? ' ' + clean_(a.note, 40) : ''), amount: amt, status: 'paid', method: method, created: new Date().toISOString(), paidAt: new Date().toISOString(), by: CURRENT_USER_.name }]);
  var s = settings_();
  if (paidTotal_(q) + 0.005 >= money2_(q.contractPrice * s.depositPct / 100)) q.depositStatus = 'paid';
  if (q.payReq && paidTotal_(q) + 0.005 >= jobTotal_(q)) q.payReq = null;
  logEvent_(q, method.toLowerCase() + ' received: $' + amt);
  audit_('quote', q.id, 'payment', '', method + ' $' + amt);
  q.updated = new Date().toISOString();
  writeQuotes_(qs);
  return q;
};

API_.deletePayment = function (a) {
  var qs = readQuotes_(), q = findById_(qs, a.id);
  if (!q) throw new Error('Quote not found.');
  var p = (q.payments || []).filter(function (x) { return x.id === a.paymentId; })[0];
  if (!p || p.kind !== 'manual') throw new Error('Only cash/check entries can be removed here. Refund card payments in Stripe.');
  q.payments = q.payments.filter(function (x) { return x !== p; });
  logEvent_(q, 'removed ' + (p.label || 'payment') + ' $' + p.amount);
  audit_('quote', q.id, 'payment removed', (p.label || 'payment') + ' $' + p.amount, '');
  writeQuotes_(qs);
  return q;
};

/** Everything the proposal presentation shows. Public on purpose (the link is the key), so only proposal-ready quotes. */
function proposalData_(id, countView) {
  var s = settings_();
  var q = findById_(readQuotes_(), id);
  if (!q || q.status === 'archived' || !proposalReady_(q)) return { ok: false, error: 'This proposal isn’t available anymore. Please call Team Forte at ' + s.company.phone + '.' };
  if (countView) {
    var lock = LockService.getScriptLock();
    if (lock.tryLock(4000)) { TBL_ = {};
      try {
        var qs = readQuotes_(), qq = findById_(qs, id), now = Date.now();
        var last = (qq.events || []).filter(function (e) { return /^proposal opened/.test(e.e); }).pop();
        if (!q.signedAt && (!last || now - new Date(last.t).getTime() > 30 * 60000)) { logEvent_(qq, 'proposal opened'); hotAlert_(qq, s); writeQuotes_(qs); }
      } catch (e) { Logger.log('view log: ' + e.message); } finally { lock.releaseLock(); }
    }
  }
  var fmt = function (d) { return Utilities.formatDate(new Date(d || Date.now()), tz_(), 'MMMM d, yyyy'); };
  var insp = readInspections_().filter(function (r) { return r.quoteId === q.id; }).sort(function (a, b) { return a.order - b.order; })
    .map(function (r) { return { id: r.id, tag: r.tag, note: r.note }; });
  var jobs = [];
  try {
    jobs = (parseJson_(publicJson_(), {}).jobs || []).filter(function (j) { return j.service === 'Roofing' && j.cover; })
      .sort(function (a, b) { return (b.featured ? 1 : 0) - (a.featured ? 1 : 0); }).slice(0, 3)
      .map(function (j) { return { title: j.title, town: j.town, date: j.date, cover: j.cover }; });
  } catch (e) { /* gallery is optional */ }
  var offers = q.type !== 'repair' ? cleanOffers_(q.offers) : null;
  var c = s.company;
  return {
    ok: true, id: q.id, type: q.type, name: q.name, first: String(q.name || '').split(' ')[0], address: q.address,
    date: fmt(q.proposalSentAt || q.created),
    roofs: (q.roofs || []).map(function (r) { return { n: r.n || 'Roof', s: Number(r.s) || 0, p: r.p || '', o: Array.isArray(r.o) ? r.o.slice(0, 10) : (r.o ? [String(r.o)] : []) }; }),
    lat: Number(q.lat) || null, lng: Number(q.lng) || null, mapsKey: mapsKey_(), validUntil: validUntil_(q, s),
    layers: q.layers || 1, pick: q.pick, color: q.color, offers: offers, price: q.contractPrice,
    items: q.type === 'repair' ? (q.items || []).map(function (it) { return { name: it.name, qty: Number(it.qty) || 0, unit: it.unit, price: Number(it.price) || 0 }; }) : [],
    depositPct: s.depositPct, terms: s.terms,
    signed: q.signedAt ? { name: q.signerName, date: fmt(q.signedAt) } : null,
    depositLink: q.signedAt && s.depositPct > 0 && q.depositStatus !== 'paid' ? s.depositLink : '',
    company: { legal: c.legal, phone: c.phone, email: c.email, hic: c.hic, town: c.address },
    insp: insp, jobs: jobs,
    stripe: !!stripeKey_(), paid: paidTotal_(q), balance: balanceOf_(q), depositDue: q.signedAt ? depositDue_(q, s) : 0,
    payReq: q.payReq && q.payReq.amount > 0 ? { amount: Math.min(q.payReq.amount, balanceOf_(q)), label: q.payReq.label || '' } : null,
    payments: publicPayments_(q),
    contract: contractTerms_(q, s), cancelBy: q.cancelBy ? prettyYmd_(q.cancelBy) : '', cancelled: !!q.cancelledAt,
    addons: q.signedAt ? [] : (q.addons || []).map(function (x) { return { key: x.key, name: x.name, unit: x.unit, qty: x.qty, price: x.price, total: x.total }; }),
    chosen: (q.chosen || []).map(function (x) { return { key: x.key, name: x.name, qty: x.qty, unit: x.unit, total: x.total }; }), basePrice: q.basePrice || 0,
    changeOrders: publicChangeOrders_(q), jobTotal: jobTotal_(q)
  };
}

function validUntil_(q, s) {
  var m = /good for (\d+) days/i.exec(String(s.terms || '')), days = m ? Number(m[1]) : 30;
  var t = new Date(q.proposalSentAt || q.created || Date.now()).getTime();
  if (!t || isNaN(t)) return '';
  return Utilities.formatDate(new Date(t + days * 86400000), tz_(), 'MMMM d, yyyy');
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
    lock.waitLock(25000); TBL_ = {};
    var a = typeof json === 'string' ? JSON.parse(json) : (json || {});
    CURRENT_USER_ = { id: 'customer', name: 'Customer', role: 'owner' };
    var qs = readQuotes_();
    var q = findById_(qs, String(a.id || ''));
    if (!q || q.status === 'archived' || !proposalReady_(q)) throw new Error('This proposal isn’t available. Please call us.');
    var s = settings_();
    if (a.co) return signChangeOrder_(qs, q, a, s);
    if (q.signedAt) throw new Error('This proposal is already signed. Thank you!');
    if (contractMissing_(q, s).length) throw new Error('This proposal needs a quick update from Team Forte before it can be signed. Please call ' + s.company.phone + '.');
    var offers = q.type !== 'repair' ? cleanOffers_(q.offers) : null;
    if (offers && a.pick !== undefined && a.pick !== null) {
      var pi = Number(a.pick);
      if ([0, 1, 2].indexOf(pi) < 0 || !(offers[pi] > 0)) throw new Error('Please pick one of the options.');
      q.pick = pi; q.contractPrice = offers[pi];
    }
    if (a.price !== undefined && Math.abs(Number(a.price) - q.contractPrice) > 0.5) throw new Error('This proposal was just updated. Please refresh the page and sign again.');
    var picked = Array.isArray(a.addons) ? a.addons.map(String) : [];
    q.basePrice = q.contractPrice;
    q.chosen = (q.addons || []).filter(function (x) { return picked.indexOf(x.key) >= 0; });
    q.contractPrice = money2_(q.basePrice + q.chosen.reduce(function (n, x) { return n + (Number(x.total) || 0); }, 0));
    if (a.total !== undefined && Math.abs(Number(a.total) - q.contractPrice) > 0.5) throw new Error('This proposal was just updated. Please refresh the page and sign again.');
    if (a.color && q.type !== 'repair') q.color = clean_(a.color, 40);
    var name = clean_(a.name, 80);
    if (name.length < 2) throw new Error('Type your full name.');
    if (!a.agree) throw new Error('Check the box to accept.');
    var sig = String(a.signature || '');
    var m = sig.match(/^data:image\/png;base64,([A-Za-z0-9+\/=]+)$/);
    if (!m || m[1].length > 600000) throw new Error('Please sign again.');
    var now = new Date();
    var folder = childFolder_(rootFolder_(), 'Signed proposals');
    var sigFile = folder.createFile(Utilities.newBlob(Utilities.base64Decode(m[1]), 'image/png', q.id + '-signature.png'));
    q.signedAt = now.toISOString();
    q.signerName = name;
    q.signatureId = sigFile.getId();
    q.cancelBy = cancelBy_(now);
    if (s.depositPct > 0) q.depositStatus = q.depositStatus || 'requested';
    logEvent_(q, 'signed online by ' + name + (offers ? ' (' + TAKEOFF.PACKAGES[q.pick].label + (q.color ? ', ' + q.color : '') + ')' : ''));
    var pdf = null;
    try {
      var p = proposalHtml_(q, s);
      var signedHtml = '<html><head><meta charset="utf-8"><style>' + p.css + ' .top span{float:none;display:block}</style></head><body>' + p.head + p.body +
        contractHtml_(q, s) + signaturesHtml_(name, sig, now, s) +
        '<div class="card"><p class="m">Signed online at ' + escHtml_(proposalUrl_(q.id)) + '. Cancel by midnight of ' + escHtml_(prettyYmd_(q.cancelBy)) + '.</p></div>' +
        noticeHtml_(q, s) + p.foot.replace('<div class="foot"><b>', '<div class="foot"><b>') + '</body></html>';
      pdf = Utilities.newBlob(signedHtml, 'text/html', q.id + '.html').getAs('application/pdf');
      pdf.setName('Team Forte proposal ' + q.id + ' (signed).pdf');
      q.signedPdfId = folder.createFile(pdf).getId();
    } catch (e) { Logger.log('signed pdf: ' + e.message); }
    // approve the job (materials list, Photos job, costs, GoHighLevel Won)
    if (q.status === 'new') {
      if (q.type !== 'repair' && !(q.lines || []).length) {
        var meas = q.meas && q.meas.area ? JSON.parse(JSON.stringify(q.meas)) : TAKEOFF.estimate(q.roofs || []);
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
          htmlBody: '<div style="font-family:Arial,sans-serif;font-size:15px">Thank you, ' + escHtml_(name) + '! Your signed contract for ' + escHtml_(q.address) + ' is attached, with the notice of cancellation. You may cancel until midnight of ' + escHtml_(prettyYmd_(q.cancelBy)) + '. We’ll call you to schedule.' +
            (s.depositPct > 0 && stripeKey_() ? '<p><a href="' + escHtml_(proposalUrl_(q.id)) + '">Pay your deposit online</a> (card or bank account)</p>' : (s.depositPct > 0 && s.depositLink ? '<p><a href="' + escHtml_(s.depositLink) + '">Pay your deposit here</a></p>' : '')) + '<p>Team Forte<br>' + escHtml_(s.company.phone) + '</p></div>' });
        emailed = true;
      } catch (e) { Logger.log('customer copy: ' + e.message); }
    }
    if (owner) {
      try {
        MailApp.sendEmail({ to: owner, subject: 'Signed: ' + (q.name || q.id) + ' - $' + Number(q.contractPrice).toLocaleString('en-US'), name: 'Team Forte app', attachments: att,
          htmlBody: '<div style="font-family:Arial,sans-serif;font-size:15px"><b>' + escHtml_(name) + '</b> signed proposal ' + escHtml_(q.id) + ' for ' + escHtml_(q.address) + '. The job is approved and its materials list is ready in the app.' +
            '<p>Cancellation period: until midnight of <b>' + escHtml_(prettyYmd_(q.cancelBy)) + '</b>. Don’t order materials until then. Once the deposit clears and the period ends, you’ll get a “Ready to order” email.</p>' +
            (emailed ? '' : '<p style="color:#B3261E"><b>The customer has no email, so they didn’t get their copy.</b> Print the attached signed contract (it includes the notice of cancellation) and hand or mail it to them.</p>') + '</div>' });
      } catch (e) { Logger.log('owner notice: ' + e.message); }
    }
    var dep = Math.round(q.contractPrice * s.depositPct) / 100;
    return JSON.stringify({ ok: true, emailed: emailed, cancelBy: prettyYmd_(q.cancelBy), total: q.contractPrice, depositLink: dep > 0 ? s.depositLink : '', depositText: '$' + dep.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      stripe: !!stripeKey_(), depositDue: depositDue_(q, s), balance: balanceOf_(q) });
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

var ADMIN_HTML = "<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\">\n<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n<link href=\"https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap\" rel=\"stylesheet\">\n<style>\n:root{--navy:#13202F;--navy2:#1B2B3D;--red:#FF5440;--red-dk:#E23E2B;--ink:#1C2430;--muted:#5B6675;--line:#DDE2E8;--slate:#F2F4F7;--white:#fff;--green:#1F9D55;--green-bg:#E5F6EC;--r:12px}\n*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}\nhtml,body{margin:0;padding:0}\nbody{font-family:Montserrat,\"Segoe UI\",Arial,sans-serif;background:var(--slate);color:var(--ink);font-size:15px;line-height:1.45;-webkit-font-smoothing:antialiased;min-height:100vh}\nbutton,input,select,textarea{font:inherit;color:inherit}\nbutton{cursor:pointer;border:0;background:none;padding:0}\n.wrap{max-width:640px;margin:0 auto;padding:0 16px calc(32px + env(safe-area-inset-bottom))}\n.bar{position:sticky;top:0;z-index:20;background:var(--navy);color:#fff;padding:calc(10px + env(safe-area-inset-top)) 0 10px}\n.bar .wrap{display:flex;align-items:center;gap:10px;padding-bottom:0;min-height:40px}\n.brand{font-weight:800;letter-spacing:.06em;font-size:16px;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.brand b{color:var(--red)}\n.bar .link{color:#C4CCD6;font-size:13px;font-weight:600;padding:8px 4px}\n.back{display:flex;align-items:center;gap:4px;color:#fff;font-weight:700;font-size:15px;padding:8px 8px 8px 0}\n.back svg{width:20px;height:20px}\n.bar-title{flex:1;font-weight:700;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center;margin-right:48px}\n.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:0 20px;border-radius:10px;font-weight:700;font-size:15px;background:var(--red);color:#fff;transition:background .15s}\n.btn:active{background:var(--red-dk)}\n.btn.block{width:100%}\na.btn{text-decoration:none}\n.btn.ghost{background:#fff;color:var(--ink);border:1px solid var(--line)}\n.btn.dark{background:var(--navy);color:#fff}\n.btn.danger{background:#fff;color:#C62828;border:1px solid #F3C4C4}\n.btn[disabled]{opacity:.55;pointer-events:none}\n.btn svg{width:18px;height:18px}\nh1{font-size:22px;font-weight:800;margin:20px 0 4px}\n.sub{color:var(--muted);font-size:14px;margin:0 0 16px}\n.card{background:#fff;border:1px solid var(--line);border-radius:var(--r);padding:16px;margin:14px 0}\n.card h2{font-size:16px;font-weight:800;margin:0 0 12px;display:flex;align-items:center;justify-content:space-between;gap:8px}\n.card h2 small{font-weight:600;color:var(--muted);font-size:13px}\n.chips{display:flex;gap:8px;overflow-x:auto;padding:4px 0 2px;margin:0 -16px;padding-left:16px;padding-right:16px;scrollbar-width:none}\n.chips::-webkit-scrollbar{display:none}\n.chip{flex:none;padding:8px 14px;border-radius:999px;border:1px solid var(--line);background:#fff;font-weight:600;font-size:14px;color:var(--ink)}\n.chip.on{background:var(--navy);border-color:var(--navy);color:#fff}\n.seg{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;background:var(--slate);border:1px solid var(--line);border-radius:10px;padding:3px;gap:3px}\n.seg button{min-height:40px;border-radius:8px;font-weight:700;font-size:14px;color:var(--muted)}\n.seg button.on{background:#fff;color:var(--ink);box-shadow:0 1px 3px rgba(19,32,47,.15)}\n.stats{display:flex;gap:10px;margin:14px 0 6px}\n.stat{flex:1;background:#fff;border:1px solid var(--line);border-radius:var(--r);padding:12px}\n.stat b{display:block;font-size:22px;font-weight:800}\n.stat span{font-size:12px;white-space:nowrap;color:var(--muted);font-weight:600}\n.jobs{display:flex;flex-direction:column;gap:10px;margin-top:12px}\n.job{display:flex;gap:12px;align-items:center;background:#fff;border:1px solid var(--line);border-radius:var(--r);padding:10px;text-align:left;width:100%}\n.job .th{width:76px;height:76px;border-radius:9px;background:var(--slate) center/cover no-repeat;flex:none;display:flex;align-items:center;justify-content:center;color:#9AA5B1}\n.job .th svg{width:28px;height:28px}\n.job .info{flex:1;min-width:0}\n.job .t{font-weight:700;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.job .m{color:var(--muted);font-size:13px;margin:2px 0 6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.pills{display:flex;flex-wrap:wrap;gap:5px}\n.pill{font-size:11px;font-weight:700;padding:3px 8px;border-radius:999px;background:var(--slate);color:var(--muted);letter-spacing:.02em}\n.pill.live{background:var(--green-bg);color:var(--green)}\n.pill.home{background:#FFE9E5;color:var(--red-dk)}\n.chev{color:#9AA5B1;flex:none}\n.empty{text-align:center;color:var(--muted);padding:40px 16px;background:#fff;border:1px dashed var(--line);border-radius:var(--r);margin-top:12px}\n.empty b{display:block;color:var(--ink);font-size:16px;margin-bottom:4px}\n.toggle{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0;border-top:1px solid var(--line)}\n.toggle:first-of-type{border-top:0;padding-top:0}\n.toggle .tl b{display:block;font-size:15px}\n.toggle .tl span{font-size:13px;color:var(--muted)}\n.sw{position:relative;width:52px;height:32px;flex:none;border-radius:999px;background:#C9D1DA;transition:background .2s}\n.sw::after{content:\"\";position:absolute;top:3px;left:3px;width:26px;height:26px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25);transition:transform .2s}\n.sw.on{background:var(--green)}\n.sw.on::after{transform:translateX(20px)}\n.stage{margin-top:16px}\n.stage:first-of-type{margin-top:0}\n.stage-h{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:8px}\n.stage-h b{font-size:14px;text-transform:uppercase;letter-spacing:.08em}\n.stage-h span{font-size:12px;color:var(--muted);font-weight:600}\n.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}\n.ph{position:relative;aspect-ratio:1;border-radius:9px;overflow:hidden;background:var(--slate)}\n.ph img{width:100%;height:100%;object-fit:cover;display:block}\n.ph .star{position:absolute;left:6px;top:6px;background:var(--red);color:#fff;border-radius:999px;font-size:10px;font-weight:800;padding:2px 7px;letter-spacing:.04em}\n.ph .cap{position:absolute;left:0;right:0;bottom:0;padding:14px 6px 5px;font-size:11px;color:#fff;background:linear-gradient(transparent,rgba(0,0,0,.65));white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.add{aspect-ratio:1;border-radius:9px;border:2px dashed #B9C3CE;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;color:var(--muted);font-weight:700;font-size:12px;background:#FAFBFC}\n.add svg{width:26px;height:26px;color:var(--red)}\nlabel.f{display:block;font-size:13px;font-weight:700;margin:14px 0 6px}\nlabel.f:first-child{margin-top:0}\nlabel.f small{font-weight:500;color:var(--muted)}\n.in{width:100%;min-height:46px;border:1px solid var(--line);border-radius:10px;padding:10px 12px;background:#fff;font-size:16px;-webkit-appearance:none;appearance:none}\n.in:focus{outline:2px solid rgba(255,84,64,.35);border-color:var(--red)}\ntextarea.in{min-height:84px;resize:vertical}\n.row{display:flex;gap:10px}\n.row>*{flex:1}\n.mt{margin-top:16px}\n.drive{display:flex;align-items:center;gap:8px;color:var(--navy);font-weight:700;font-size:14px;text-decoration:none;padding:12px 0}\n.drive svg{width:18px;height:18px}\n/* sheets */\n.ov{position:fixed;inset:0;z-index:50;background:rgba(19,32,47,.55);display:flex;align-items:flex-end;justify-content:center;animation:fade .15s}\n.sheet{background:#fff;width:100%;max-width:640px;max-height:94vh;overflow:auto;border-radius:18px 18px 0 0;padding:8px 16px calc(20px + env(safe-area-inset-bottom));animation:up .2s ease-out}\n.grab{width:40px;height:5px;border-radius:3px;background:#D0D6DD;margin:4px auto 12px}\n.sheet h3{font-size:18px;font-weight:800;margin:0 0 14px;display:flex;justify-content:space-between;align-items:center}\n.x{width:42px;height:42px;border-radius:50%;background:var(--slate);display:flex;align-items:center;justify-content:center}\n.x svg{width:18px;height:18px}\n.big{width:100%;border-radius:12px;background:var(--slate);display:block;max-height:52vh;object-fit:contain}\n.acts{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px}\n.acts .btn{min-height:44px;font-size:14px;padding:0 10px}\n.cgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:10px}\n.ctile{display:block;text-align:left;min-width:0}\n.ctile img{width:100%;aspect-ratio:1;border-radius:10px;display:block;background:#333}\n.ctile span{display:block;font-size:12px;font-weight:700;margin-top:5px;line-height:1.25}\n.ctile.on img{outline:3px solid var(--red);outline-offset:2px}\n.cbig{aspect-ratio:1;object-fit:cover;max-height:none}\n.vizov{position:fixed;inset:0;z-index:60;background:#fff;overflow:auto;-webkit-overflow-scrolling:touch}\n.vizbar{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:8px;padding:calc(10px + env(safe-area-inset-top)) 14px 10px;background:var(--navy);color:#fff}\n.vizbar span{flex:1;font-size:12px;opacity:.75}\n.vizbody{padding:0 8px calc(16px + env(safe-area-inset-bottom))}\n#visualizer iframe{width:100% !important;border:0}\n.shov{flex-direction:column;overflow:hidden}\n.ocf{flex:1;width:100%;border:0;min-height:0;background:#fff}\n@keyframes up{from{transform:translateY(40px);opacity:.6}to{transform:none;opacity:1}}\n@keyframes fade{from{opacity:0}to{opacity:1}}\n/* progress + toast */\n.prog{position:fixed;left:0;right:0;bottom:0;z-index:40;background:var(--navy);color:#fff;padding:12px 16px calc(12px + env(safe-area-inset-bottom))}\n.prog .wrap{padding-bottom:0}\n.prog .l{display:flex;justify-content:space-between;font-size:14px;font-weight:700;margin-bottom:8px}\n.prog .track{height:6px;border-radius:3px;background:rgba(255,255,255,.18);overflow:hidden}\n.prog .fill{height:100%;background:var(--red);transition:width .3s}\n.toast{pointer-events:none;position:fixed;left:50%;bottom:calc(24px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:60;background:var(--ink);color:#fff;padding:12px 18px;border-radius:10px;font-size:14px;font-weight:600;max-width:calc(100% - 32px);box-shadow:0 8px 24px rgba(0,0,0,.25);animation:fade .2s}\n.toast.err{background:#B3261E}\n/* login */\n.login{min-height:100vh;display:flex;flex-direction:column;justify-content:center;background:var(--navy);color:#fff;padding:24px}\n.login .box{max-width:380px;margin:0 auto;width:100%}\n.login .logo{font-weight:800;font-size:28px;letter-spacing:.08em;margin-bottom:4px}\n.login .logo b{color:var(--red)}\n.login p{color:#C4CCD6;margin:0 0 28px}\n.login .in{background:#fff;color:var(--ink);text-align:center;font-size:20px;letter-spacing:.2em;font-weight:700}\n.login .remember{display:flex;align-items:center;gap:8px;color:#C4CCD6;font-size:14px;margin:14px 0 18px}\n.login .remember input{width:18px;height:18px;accent-color:var(--red)}\n.login .err{color:#FFB4A8;font-size:14px;min-height:20px;margin-top:10px;text-align:center}\n.spin{width:22px;height:22px;border:3px solid rgba(255,255,255,.35);border-top-color:#fff;border-radius:50%;animation:rot .8s linear infinite}\n.spin.dk{border-color:rgba(19,32,47,.15);border-top-color:var(--red)}\n@keyframes rot{to{transform:rotate(360deg)}}\n.loading{display:flex;justify-content:center;padding:60px 0}\n.foot{text-align:center;margin-top:26px}\n.foot a{color:var(--navy);font-weight:700;font-size:14px}\n.hint{font-size:12px;color:var(--muted);margin-top:6px}\n.vh{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}\n/* bottom tabs */\nbody.has-tabs .wrap{padding-bottom:calc(100px + env(safe-area-inset-bottom))}\nbody.has-tabs .bar .wrap,body.has-tabs .prog .wrap{padding-bottom:0}\n.row{align-items:flex-end}\nbody.has-tabs .prog{bottom:calc(62px + env(safe-area-inset-bottom))}\nbody.has-tabs .toast{bottom:calc(80px + env(safe-area-inset-bottom))}\n.tabs{position:fixed;left:0;right:0;bottom:0;z-index:30;background:#fff;border-top:1px solid var(--line);display:flex;justify-content:center;padding:0 0 env(safe-area-inset-bottom)}\n.tabs .in2{display:flex;width:100%;max-width:640px}\n.tab{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:9px 0 8px;font-size:11px;font-weight:700;color:#7A8594;position:relative}\n.tab svg{width:24px;height:24px}\n.tab.on{color:var(--red)}\n.tab .dot{position:absolute;top:5px;left:calc(50% + 8px);min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:var(--red);color:#fff;font-size:11px;line-height:18px;text-align:center}\n/* materials */\n.money{font-variant-numeric:tabular-nums}\n.q{display:block;width:100%;text-align:left;background:#fff;border:1px solid var(--line);border-radius:var(--r);padding:14px;margin-top:10px}\n.q .top{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}\n.q .nm{font-weight:800;font-size:16px}\n.q .ad{color:var(--muted);font-size:13px;margin:2px 0 8px}\n.q .rg{font-weight:800;font-size:15px;white-space:nowrap}\n.pill.new{background:#FFE9E5;color:var(--red-dk)}\n.pill.approved{background:#E7EEFF;color:#2B4FC7}\n.pill.ordered,.pill.Sent,.pill.Requested,.pill.Scheduled,.pill.Pending{background:#FFF4D6;color:#8A5A00}\n.pill.done,.pill.Delivered,.pill.Picked{background:var(--green-bg);color:var(--green)}\n.pill.Canceled,.pill.Backordered,.pill.Attempted{background:#FDE7E7;color:#B3261E}\n.kv{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-top:1px solid var(--line);font-size:14px}\n.kv:first-of-type{border-top:0}\n.kv span{color:var(--muted)}\n.kv b{text-align:right}\n.big-n{font-size:28px;font-weight:800;line-height:1.1}\n.pkg{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}\n.pkg button{border:2px solid var(--line);border-radius:10px;padding:10px 6px;text-align:center;background:#fff}\n.pkg button b{display:block;font-size:14px}\n.pkg button span{display:block;font-size:11px;color:var(--muted);margin-top:2px}\n.pkg button.on{border-color:var(--red);background:#FFF6F4}\n.meas{display:grid;grid-template-columns:1fr 1fr;gap:10px}\n.meas label{display:block;font-size:12px;font-weight:700;margin-bottom:4px}\n.meas label i{font-style:normal;font-weight:700;font-size:10px;color:#8A5A00;background:#FFF4D6;border-radius:4px;padding:1px 5px;margin-left:4px}\n.meas .in{min-height:42px;padding:8px 10px}\n.ln{display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:10px 0;border-top:1px solid var(--line)}\n.ln:first-child{border-top:0}\n.ln .l1{flex:1;min-width:0}\n.ln .l1 b{display:block;font-size:14px;font-weight:700}\n.ln .l1 span{font-size:12px;color:var(--muted)}\n.ln .l1 em{font-style:normal;font-size:10px;font-weight:800;color:#8A5A00;background:#FFF4D6;border-radius:4px;padding:1px 5px;margin-left:4px}\n.ln .l2{text-align:right;font-weight:800;font-size:14px;white-space:nowrap}\n.ln .l2 span{display:block;font-weight:600;font-size:12px;color:var(--muted)}\n.cat{font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin:14px 0 2px}\n.cat:first-child{margin-top:0}\n.tot{border-top:2px solid var(--ink);margin-top:8px;padding-top:8px}\n.tot .kv{border:0;padding:3px 0}\n.tot .kv.grand{font-size:17px;font-weight:800}\n.src{font-size:10px;font-weight:800;border-radius:4px;padding:2px 6px;letter-spacing:.03em}\n.src.abc{background:var(--green-bg);color:var(--green)}\n.src.manual{background:#E7EEFF;color:#2B4FC7}\n.src.starter{background:#FFF4D6;color:#8A5A00}\n.note{background:#FFF8E6;border:1px solid #F3DFA8;border-radius:10px;padding:10px 12px;font-size:13px;color:#5C4400;margin:10px 0}\n.note.warn{background:#FFF1EF;border-color:#F6C7BF;color:#7A2316}\n.co{border-top:1px solid var(--line);padding:8px 0 4px}\n.co:first-of-type{border-top:0}\n.adds{display:grid;gap:6px}\n.add{display:flex;align-items:center;gap:8px;border:1px solid var(--line);border-radius:10px;padding:8px 10px}\n.add label{flex:1;display:flex;align-items:center;gap:10px;font-size:14px;font-weight:600;min-width:0}\n.add label input{width:20px;height:20px;accent-color:var(--red);flex:none}\n.add label small{display:block;font-weight:500;color:var(--muted);font-size:12px}\n.add .in{flex:0 0 76px;min-height:38px;padding:6px 8px}\n.add i{font-style:normal;font-size:12px;color:var(--muted);flex:0 0 36px}\n.sigpad{width:100%;height:120px;border:2px dashed #B9C3CE;border-radius:10px;background:#fff;touch-action:none;display:block;margin-top:6px}\n.note.ok{background:var(--green-bg);border-color:#BFE6CF;color:#145C34}\n.res{display:block;width:100%;text-align:left;padding:10px 0;border-top:1px solid var(--line);font-size:14px}\n.res b{display:block}\n.res span{font-size:12px;color:var(--muted)}\n.icon-btn{display:inline-flex;align-items:center;gap:6px;color:#fff;font-weight:700;font-size:14px;padding:8px 2px}\n.icon-btn svg{width:20px;height:20px}\n.meter{height:8px;border-radius:4px;background:var(--slate);overflow:hidden;margin-top:8px}\n.meter div{height:100%;background:var(--red)}\nbutton,a,.btn,[data-act],[data-m],input,select,label{touch-action:manipulation}\nbutton,.btn,.job,.chip,.tab,.add,.ph,[data-act],[data-m]{transition:transform .08s ease,filter .08s ease,opacity .08s}\nbutton:active,.btn:active,.job:active,.chip:active,.tab:active,.add:active,.ph:active,[data-act]:active,[data-m]:active{transform:scale(.97);filter:brightness(.93)}\n.busy{position:relative;pointer-events:none;opacity:.8}\n.busy::after{content:\"\";position:absolute;right:10px;top:50%;width:16px;height:16px;margin-top:-8px;border-radius:50%;border:2.5px solid rgba(128,128,128,.3);border-top-color:#FF5440;animation:rot .7s linear infinite}\n.add.drv{border-style:solid;border-color:#D5DDE6;background:#fff}\n.dv .sheet{max-width:760px}\n.dv-tabs{display:flex;gap:6px;margin:0 0 10px;overflow-x:auto}\n.dv-tabs button{flex:none;padding:9px 14px;border-radius:99px;background:var(--slate);font-weight:700;font-size:13px;color:var(--ink)}\n.dv-tabs button.on{background:var(--ink);color:#fff}\n.dv-search{margin:0 0 10px}\n.dv-path{display:flex;flex-wrap:wrap;gap:2px;align-items:center;font-size:13px;margin:0 0 8px;color:var(--muted)}\n.dv-path button{padding:6px 6px;font-weight:700;color:var(--ink);border-radius:6px}\n.dv-path i{font-style:normal;opacity:.5}\n.dv-fl{display:flex;flex-direction:column;gap:6px;margin:0 0 12px}\n.dv-f{display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:12px;border-radius:10px;background:#FAFBFC;border:1px solid #E3E8EE;font-weight:700;font-size:14px;color:var(--ink);min-height:48px}\n.dv-f svg{width:20px;height:20px;flex:none;color:#7A8899}\n.dv-f span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.dv-bar{display:flex;justify-content:space-between;align-items:center;margin:4px 0 8px;font-size:13px;color:var(--muted)}\n.dv-bar button{font-weight:800;color:#FF5440;padding:8px 4px}\n.dv-g{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}\n@media(min-width:560px){.dv-g{grid-template-columns:repeat(5,1fr)}}\n.dv-p{position:relative;aspect-ratio:1;border-radius:8px;overflow:hidden;background:var(--slate)}\n.dv-p img{width:100%;height:100%;object-fit:cover;display:block}\n.dv-p .nm{position:absolute;left:4px;right:4px;bottom:4px;font-size:10px;color:#fff;background:rgba(0,0,0,.5);border-radius:4px;padding:2px 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.dv-p .ck{position:absolute;top:6px;right:6px;width:24px;height:24px;border-radius:50%;border:2px solid #fff;background:rgba(0,0,0,.25);box-shadow:0 1px 3px rgba(0,0,0,.3)}\n.dv-p.on{outline:3px solid #FF5440;outline-offset:-3px}\n.dv-p.on .ck{background:#FF5440}\n.dv-p.on .ck::after{content:\"\";position:absolute;left:6px;top:2px;width:6px;height:11px;border:solid #fff;border-width:0 2.5px 2.5px 0;transform:rotate(45deg)}\n.dv-empty{padding:28px 10px;text-align:center;color:var(--muted);font-size:14px}\n.dv-foot{position:sticky;bottom:0;background:#fff;margin:12px -16px 0;padding:12px 16px calc(14px + env(safe-area-inset-bottom));border-top:1px solid #E3E8EE}\n.dv-st{display:flex;gap:6px;margin:0 0 10px}\n.dv-st button{flex:1;padding:10px 0;border-radius:10px;background:var(--slate);font-weight:800;font-size:13px;color:var(--ink)}\n.dv-st button.on{background:var(--ink);color:#fff}\n.dv-more{display:block;margin:12px auto 0}\n.ph{-webkit-touch-callout:none;-webkit-user-select:none;user-select:none}\n.ph img{-webkit-user-drag:none;pointer-events:none}\n.ph.ghost{opacity:.25;outline:2px dashed #FF5440;outline-offset:-2px}\n.grid.drop{background:#FFF4F2;border-radius:10px;box-shadow:0 0 0 6px #FFF4F2}\n.dragfly{position:fixed;z-index:80;pointer-events:none;border-radius:10px;overflow:hidden;box-shadow:0 14px 34px rgba(0,0,0,.35);transform:scale(1.08) rotate(-2deg);opacity:.95;transition:transform .12s}\n.dragfly img{width:100%;height:100%;object-fit:cover;display:block}\nbody.dragging,body.dragging *{cursor:grabbing!important;-webkit-user-select:none;user-select:none}\n.fv{position:fixed;inset:0;z-index:90;background:#000;display:flex;flex-direction:column;touch-action:none;animation:fade .15s;-webkit-user-select:none;user-select:none}\n.fv-stage{position:relative;flex:1;overflow:hidden}\n.fv-track{position:absolute;inset:0;display:flex;will-change:transform}\n.fv-slide{flex:0 0 100%;height:100%;display:flex;align-items:center;justify-content:center;overflow:hidden}\n.fv-slide img{width:100%;height:100%;object-fit:contain;transform-origin:0 0;will-change:transform;-webkit-user-drag:none;pointer-events:none}\n.fv-top,.fv-bot{position:absolute;left:0;right:0;z-index:2;display:flex;align-items:center;gap:10px;padding:10px 12px;color:#fff;transition:opacity .2s}\n.fv-top{top:0;padding-top:calc(10px + env(safe-area-inset-top));background:linear-gradient(rgba(0,0,0,.6),transparent)}\n.fv-bot{bottom:0;padding-bottom:calc(14px + env(safe-area-inset-bottom));background:linear-gradient(transparent,rgba(0,0,0,.65));justify-content:space-between}\n.fv.bare .fv-top,.fv.bare .fv-bot,.fv.bare .fv-nav{opacity:0;pointer-events:none}\n.fv-t{flex:1;font-weight:700;font-size:15px;line-height:1.2}.fv-t small{display:block;font-weight:500;opacity:.8;font-size:12px;margin-top:2px}\n.fv button{color:#fff}\n.fv-x{width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.16);display:flex;align-items:center;justify-content:center;font-size:22px}\n.fv-edit{padding:11px 18px;border-radius:999px;background:rgba(255,255,255,.18);font-weight:800;font-size:14px}\n.fv-cap{flex:1;font-size:14px;opacity:.95;margin-right:10px}\n.fv-nav{position:absolute;top:50%;z-index:2;width:48px;height:48px;margin-top:-24px;border-radius:50%;background:rgba(255,255,255,.16);display:none;align-items:center;justify-content:center;font-size:26px}\n.fv-nav.p{left:14px}.fv-nav.n{right:14px}\n@media(hover:hover){.fv-nav{display:flex}}\n.seg.kinds{grid-auto-flow:row;grid-template-columns:repeat(3,1fr)}\n.seg.kinds button{font-size:13px;line-height:1.15;padding:4px 6px}\n.mtag{font-style:normal;font-size:10.5px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:#9A6A00;background:#FFF4D6;border-radius:5px;padding:1px 5px;margin-left:6px;vertical-align:1px}\n.mtag.ok{color:var(--green);background:var(--green-bg)}\n.mz{position:fixed;inset:0;z-index:45;background:var(--navy);display:flex;flex-direction:column}\n.mz-top{display:flex;align-items:center;gap:10px;color:#fff;padding:calc(8px + env(safe-area-inset-top)) 10px 8px}\n.mz-top b{flex:1;text-align:center;font-size:16px}\n.mz-btn{color:#fff;min-width:44px;min-height:40px;display:flex;align-items:center;justify-content:center;border-radius:9px}\n.mz-btn svg{width:22px;height:22px}\n.mz-save{background:var(--red);font-weight:800;padding:0 16px}\n.mz-save[disabled]{opacity:.6}\n.mz-map{flex:1;min-height:200px;position:relative;background:#1c2a1f}\n.mz-load{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#C4CCD6;font-weight:600;padding:20px;text-align:center}\n.mz-panel{background:#fff;border-radius:16px 16px 0 0;padding:12px 14px calc(12px + env(safe-area-inset-bottom));max-height:44vh;overflow:auto}\n.mz-types{display:flex;gap:6px;overflow-x:auto;padding-bottom:2px}\n.mz-types button{flex:1 1 0;min-width:0;display:flex;align-items:center;gap:5px;justify-content:center;border:1.5px solid var(--line);border-radius:999px;padding:8px 4px;font-weight:700;font-size:13px;background:#fff;white-space:nowrap}\n.mz-types button i{width:9px;height:9px;border-radius:50%;flex:none}\n.mz-types button.on{border-color:var(--navy);background:var(--navy);color:#fff}\n.mz-read{font-size:14px;color:var(--ink);margin:10px 0 8px;min-height:20px}\n.mz-read span{color:var(--muted)}\n.mz-acts{display:grid;grid-template-columns:1fr 1fr;gap:8px}\n.mz-acts .btn{min-height:44px}\n.mz-pitch{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;margin:10px 0 0}\n.mz-pitch select{border:1.5px solid var(--line);border-radius:8px;padding:6px 8px;font-weight:700;background:#fff}\n.mz-pitch span{font-weight:500;color:var(--muted);font-size:12px}\n.mz-ls{margin:10px 0 0;border-top:1px solid var(--line)}\n.mz-li{display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--line);font-size:14px}\n.mz-li i{width:10px;height:10px;border-radius:50%;flex:none}\n.mz-li span{flex:1}\n.mz-li button{width:32px;height:32px;display:flex;align-items:center;justify-content:center;color:var(--muted)}\n.mz-li button svg{width:16px;height:16px}\n.mz-tot{font-size:13.5px;margin:8px 0 0;color:var(--ink)}\n.mz-lbl{background:rgba(19,32,47,.85);padding:2px 6px;border-radius:6px;transform:translateY(-14px)}\n</style>\n</head>\n<body>\n<div id=\"app\"></div>\n<input type=\"file\" id=\"picker\" accept=\"image/*\" multiple class=\"vh\" aria-hidden=\"true\" tabindex=\"-1\">\n<script>\n/* Team Forte materials takeoff (Owens Corning system). Shared by the phone app and the tests. */\nvar TAKEOFF = (function () {\n  'use strict';\n\n  var PACKAGES = [\n    { key: 'shingle_oakridge', label: 'Oakridge' },\n    { key: 'shingle_duration', label: 'Duration' },\n    { key: 'shingle_flex', label: 'Duration FLEX' }\n  ];\n\n  /* Default price list. Prices are rough starting numbers until replaced by your supplier's prices. */\n  var CATALOG = [\n    { key: 'shingle_oakridge', cat: 'Shingles', name: 'Owens Corning Oakridge shingles', unit: 'bundle', price: 42 },\n    { key: 'shingle_duration', cat: 'Shingles', name: 'Owens Corning TruDefinition Duration shingles', unit: 'bundle', price: 46 },\n    { key: 'shingle_flex', cat: 'Shingles', name: 'Owens Corning Duration FLEX shingles', unit: 'bundle', price: 58 },\n    { key: 'hip_ridge', cat: 'Shingles', name: 'OC ProEdge Hip & Ridge (33 LF)', unit: 'bundle', price: 76 },\n    { key: 'starter', cat: 'Shingles', name: 'OC Starter Strip Plus (105 LF)', unit: 'bundle', price: 66 },\n    { key: 'ice_water', cat: 'Underlayment', name: 'OC WeatherLock G ice & water barrier (2 sq)', unit: 'roll', price: 118 },\n    { key: 'underlayment', cat: 'Underlayment', name: 'OC Deck Defense synthetic underlayment (10 sq)', unit: 'roll', price: 165 },\n    { key: 'drip_edge', cat: 'Metal & flashing', name: 'Drip edge, aluminum, 10 ft', unit: 'piece', price: 12 },\n    { key: 'step_flashing', cat: 'Metal & flashing', name: 'Step flashing 4x4x8 (100 pcs)', unit: 'bundle', price: 48 },\n    { key: 'ridge_vent', cat: 'Ventilation', name: 'OC VentSure ridge vent, 4 ft', unit: 'piece', price: 14 },\n    { key: 'pipe_boot', cat: 'Ventilation', name: 'Pipe boot flashing', unit: 'each', price: 18 },\n    { key: 'coil_nails', cat: 'Fasteners', name: 'Coil roofing nails 1-1/4\" (7,200)', unit: 'box', price: 56 },\n    { key: 'cap_nails', cat: 'Fasteners', name: 'Plastic cap nails (2,000)', unit: 'box', price: 34 },\n    { key: 'sealant', cat: 'Fasteners', name: 'Roof sealant, tube', unit: 'tube', price: 9 },\n    { key: 'osb', cat: 'Decking', name: 'OSB roof decking 7/16\" 4x8', unit: 'sheet', price: 22 }\n  ];\n\n  var DEFAULTS = { waste: 10, iceCourses: 2, pipes: 2, decking: 2, walls: 0 };\n\n  function num(v, d) { v = Number(v); return isFinite(v) ? v : (d || 0); }\n  function ceil(v) { return Math.max(0, Math.ceil(v - 1e-9)); }\n\n  function pitchRise(p) {\n    var m = String(p || '').match(/(\\d+(?:\\.\\d+)?)\\s*(?:\\/\\s*12)?/);\n    return m ? Math.min(30, num(m[1])) : 6;\n  }\n  function pitchFactor(p) { var r = pitchRise(p) / 12; return Math.sqrt(1 + r * r); }\n\n  /* Google encoded polyline -> [[lat,lng],...] */\n  function decodePoly(str) {\n    var pts = [], i = 0, lat = 0, lng = 0;\n    str = String(str || '');\n    while (i < str.length) {\n      var res = [0, 0];\n      for (var k = 0; k < 2; k++) {\n        var shift = 0, result = 0, b;\n        do { b = str.charCodeAt(i++) - 63; result |= (b & 31) << shift; shift += 5; } while (b >= 32);\n        res[k] = (result & 1) ? ~(result >> 1) : (result >> 1);\n      }\n      lat += res[0]; lng += res[1];\n      pts.push([lat / 1e6, lng / 1e6]);\n    }\n    return pts;\n  }\n\n  function rings(o) {\n    if (!o) return [];\n    if (typeof o === 'string') return [decodePoly(o)];\n    if (Array.isArray(o)) {\n      if (!o.length) return [];\n      if (typeof o[0] === 'string') return o.map(decodePoly);\n      if (Array.isArray(o[0]) && typeof o[0][0] === 'number') return [o];\n      if (Array.isArray(o[0]) && Array.isArray(o[0][0])) return o;\n    }\n    return [];\n  }\n\n  /* Footprint area (sq ft) and perimeter (ft) of a lat/lng ring. */\n  function ringStats(ring) {\n    if (!ring || ring.length < 3) return { area: 0, perim: 0 };\n    var lat0 = ring[0][0] * Math.PI / 180;\n    var fy = 364567, fx = 364567 * Math.cos(lat0);\n    var pts = ring.map(function (p) { return [p[1] * fx, p[0] * fy]; });\n    var a = 0, per = 0;\n    for (var i = 0; i < pts.length; i++) {\n      var p = pts[i], q = pts[(i + 1) % pts.length];\n      a += p[0] * q[1] - q[0] * p[1];\n      per += Math.sqrt((q[0] - p[0]) * (q[0] - p[0]) + (q[1] - p[1]) * (q[1] - p[1]));\n    }\n    return { area: Math.abs(a) / 2, perim: per };\n  }\n\n  /* Estimate measurements from the roofs saved with an instant quote: [{n, s, p, o}] */\n  function estimate(roofs) {\n    var m = { area: 0, eaves: 0, rakes: 0, ridges: 0, hips: 0, valleys: 0, pitch: '', roofs: [] };\n    var biggest = 0;\n    (roofs || []).forEach(function (r) {\n      var s = num(r.s || r.sqft), f = pitchFactor(r.p || r.pitch);\n      if (s <= 0) return;\n      var fp = 0, per = 0;\n      rings(r.o || r.outline).forEach(function (ring) { var st = ringStats(ring); fp += st.area; per += st.perim; });\n      var surface, basis;\n      if (fp > 50) {\n        // Is the quoted sq ft the sloped roof area or the flat footprint? Pick whichever fits the outline.\n        surface = Math.abs(s - fp * f) <= Math.abs(s - fp) ? s : s * f;\n        basis = 'outline';\n      } else {\n        surface = s;\n        per = 4 * Math.sqrt(s / f) * 1.15;\n        basis = 'area';\n      }\n      m.area += surface;\n      m.eaves += 0.55 * per;\n      m.rakes += 0.45 * per * f;\n      m.ridges += 0.30 * per;\n      m.hips += 0.10 * per * f;\n      m.valleys += 0.03 * per * f;\n      m.roofs.push({ name: r.n || r.name || 'Roof', sqft: Math.round(surface), pitch: r.p || r.pitch || '', basis: basis });\n      if (surface > biggest) { biggest = surface; m.pitch = r.p || r.pitch || ''; }\n    });\n    ['area', 'eaves', 'rakes', 'ridges', 'hips', 'valleys'].forEach(function (k) { m[k] = Math.round(m[k]); });\n    m.waste = DEFAULTS.waste;\n    m.iceCourses = DEFAULTS.iceCourses;\n    m.pipes = DEFAULTS.pipes;\n    m.decking = DEFAULTS.decking;\n    m.walls = DEFAULTS.walls;\n    m.est = { eaves: true, rakes: true, ridges: true, hips: true, valleys: true, walls: true, pipes: true, decking: true };\n    return m;\n  }\n\n  /* Quantities for one job. pkg = 0 Oakridge, 1 Duration, 2 Duration FLEX. */\n  function quantities(m, pkg) {\n    var waste = num(m.waste, DEFAULTS.waste) / 100;\n    var area = num(m.area), sq = area / 100;\n    var eaves = num(m.eaves), rakes = num(m.rakes), ridges = num(m.ridges), hips = num(m.hips), valleys = num(m.valleys);\n    var courses = num(m.iceCourses, DEFAULTS.iceCourses);\n    var iceArea = Math.min(area, eaves * 3 * courses + valleys * 3);\n    var shingle = (PACKAGES[pkg] || PACKAGES[1]).key;\n    var q = {};\n    q[shingle] = ceil(sq * (1 + waste) * 3);\n    q.hip_ridge = ceil((ridges + hips) * 1.05 / 33);\n    q.starter = ceil((eaves + rakes) * 1.05 / 105);\n    q.ice_water = ceil(iceArea * 1.1 / 200);\n    q.underlayment = ceil(Math.max(0, area - iceArea) * 1.1 / 1000);\n    q.drip_edge = ceil((eaves + rakes) * 1.05 / 10);\n    q.step_flashing = ceil(num(m.walls) * 12 / 5 / 100);\n    q.ridge_vent = ceil(ridges * 0.8 / 4);\n    q.pipe_boot = ceil(num(m.pipes));\n    q.coil_nails = sq > 0 ? ceil(sq * (1 + waste) * 320 / 7200) : 0;\n    q.cap_nails = sq > 0 ? Math.max(1, ceil(sq / 15)) : 0;\n    q.sealant = sq > 0 ? ceil(sq / 10) + 1 : 0;\n    q.osb = ceil(num(m.decking));\n    return q;\n  }\n\n  /* Build material lines. prices: {key: {name, unit, price, abcItem, uom}}. Keeps manual edits from oldLines. */\n  function lines(m, pkg, prices, oldLines) {\n    var q = quantities(m, pkg);\n    var old = {};\n    (oldLines || []).forEach(function (l) { old[l.key] = l; });\n    var out = [];\n    CATALOG.forEach(function (c) {\n      if (!(c.key in q)) return;\n      var p = (prices && prices[c.key]) || c;\n      var prev = old[c.key];\n      var qty = prev && prev.manual ? prev.qty : q[c.key];\n      if (!qty && !(prev && prev.manual)) return;\n      out.push({\n        key: c.key, cat: p.cat || c.cat, name: p.name || c.name, unit: p.unit || c.unit,\n        qty: qty, calc: q[c.key], manual: !!(prev && prev.manual),\n        price: prev && prev.priceManual ? prev.price : num(p.price, c.price), priceManual: !!(prev && prev.priceManual),\n        abcItem: prev && prev.itemManual ? prev.abcItem : (p.abcItem || ''), uom: prev && prev.itemManual ? prev.uom : (p.uom || ''),\n        itemManual: !!(prev && prev.itemManual)\n      });\n    });\n    (oldLines || []).forEach(function (l) { if (l.custom) out.push(l); });\n    return out;\n  }\n\n  function totals(ls, taxRate) {\n    var sub = 0;\n    (ls || []).forEach(function (l) { sub += num(l.qty) * num(l.price); });\n    sub = Math.round(sub * 100) / 100;\n    var tax = Math.round(sub * num(taxRate) / 100 * 100) / 100;\n    return { subtotal: sub, tax: tax, total: Math.round((sub + tax) * 100) / 100 };\n  }\n\n  /* ---------- quote pricing (per square) ---------- */\n  var PRICING = {\n    packages: [{ label: 'Oakridge', perSq: 565 }, { label: 'Duration', perSq: 655 }, { label: 'Duration FLEX', perSq: 745 }],\n    lowPct: 83, highPct: 117, wastePct: 13,\n    steep: [{ from: 7, pct: 8 }, { from: 9, pct: 15 }, { from: 11, pct: 25 }, { from: 13, pct: 35 }],\n    layerPerSq: 65, minJob: 8000, outMin: 1500, roundTo: 100\n  };\n  /* Same math as the website instant quote (team-forte.com/instant-quote). */\n  var WASTE_BY_FACETS = [{ max: 4, pct: 10 }, { max: 10, pct: 13 }, { max: 999, pct: 16 }];\n\n  function cleanPricing(p) {\n    p = p || {};\n    var d = PRICING, out = {};\n    out.packages = d.packages.map(function (pk, i) {\n      var x = (p.packages || [])[i] || {};\n      return { label: pk.label, perSq: Math.max(0, num(x.perSq, pk.perSq)) };\n    });\n    ['lowPct', 'highPct', 'wastePct', 'layerPerSq', 'minJob', 'outMin', 'roundTo'].forEach(function (k) { out[k] = Math.max(0, num(p[k], d[k])); });\n    if (out.highPct < 100) out.highPct = 100;\n    if (out.lowPct > 100) out.lowPct = 100;\n    if (!out.roundTo) out.roundTo = 1;\n    out.steep = (Array.isArray(p.steep) ? p.steep : d.steep).map(function (x) { return { from: Math.max(0, num(x.from)), pct: Math.max(0, num(x.pct)) }; })\n      .filter(function (x) { return x.from > 0; }).sort(function (a, b) { return a.from - b.from; }).slice(0, 6);\n    out.updated = p.updated || '';\n    return out;\n  }\n\n  function steepPct(pr, pitch) {\n    var rise = pitchRise(pitch), pct = 0;\n    (pr.steep || []).forEach(function (x) { if (rise >= x.from) pct = Math.max(pct, x.pct); });\n    return pct;\n  }\n\n  function wastePctFor(pr, facets) {\n    facets = num(facets);\n    if (!facets) return pr.wastePct;\n    for (var i = 0; i < WASTE_BY_FACETS.length; i++) if (facets <= WASTE_BY_FACETS[i].max) return WASTE_BY_FACETS[i].pct;\n    return WASTE_BY_FACETS[WASTE_BY_FACETS.length - 1].pct;\n  }\n\n  /* Price ranges per package: [[low, high], ...]. roofs: [{s: sq ft (sloped), p: '7/12', f: facets}], layers: roof layers to tear off.\n     Each roof is priced on its own (main roof minimum, smaller minimum for extra roofs) and the ranges are added up,\n     exactly like the website instant quote. */\n  function priceRanges(pr, roofs, layers) {\n    pr = cleanPricing(pr);\n    var extraLayers = Math.max(0, Math.round(num(layers, 1)) - 1);\n    var base0 = pr.packages[0].perSq || 1, rt = pr.roundTo;\n    function rnd(x) { return Math.round(x / rt) * rt; }\n    return pr.packages.map(function (pk) {\n      var lo = 0, hi = 0, any = false;\n      (roofs || []).forEach(function (r, i) {\n        var sqft = num(r.s || r.sqft);\n        if (sqft <= 0) return;\n        any = true;\n        var sq = sqft / 100 * (1 + wastePctFor(pr, r.f) / 100);\n        var f = sq * (pk.perSq + extraLayers * pr.layerPerSq) * (1 + steepPct(pr, r.p || r.pitch) / 100);\n        var min = (i === 0 ? pr.minJob : pr.outMin) * pk.perSq / base0;\n        f = Math.max(f, min);\n        lo += rnd(Math.max(f * pr.lowPct / 100, min));\n        hi += rnd(f * pr.highPct / 100);\n      });\n      return any ? [lo, hi] : [0, 0];\n    });\n  }\n\n  function pitchFromDegrees(deg) {\n    var rise = Math.round(Math.tan(num(deg) * Math.PI / 180) * 12);\n    return Math.max(0, Math.min(24, rise)) + '/12';\n  }\n\n  return {\n    PACKAGES: PACKAGES, CATALOG: CATALOG, DEFAULTS: DEFAULTS, PRICING: PRICING,\n    cleanPricing: cleanPricing, priceRanges: priceRanges, steepPct: steepPct, pitchFromDegrees: pitchFromDegrees, pitchRise: pitchRise,\n    estimate: estimate, quantities: quantities, lines: lines, totals: totals,\n    decodePoly: decodePoly, ringStats: ringStats, pitchFactor: pitchFactor\n  };\n})();\nif (typeof module !== 'undefined') module.exports = TAKEOFF;\n\n(function(){\n'use strict';\nvar EXEC_URL='__EXEC_URL__';\nvar SERVICES=['Roofing','Carpentry','Painting','Handyman'];\nvar STAGES=[['before','Before'],['during','During'],['after','After']];\nvar KINDS=[['replacement','Replacement'],['repair','Repair'],['flat','Flat roof'],['flashing','Chimney & flashing'],['gutters','Gutters'],['skylight','Skylights']];\nvar TITLES={Roofing:['Full roof replacement','Roof repair','Leak repair','Shingle replacement','Flat roof','Chimney flashing','Gutters','Skylight'],Carpentry:['Deck build','Deck repair','Trim & molding','Framing','Door install','Stairs & railings'],Painting:['Exterior painting','Interior painting','Deck staining','Cabinet painting'],Handyman:['General repairs','Drywall repair','Fixture install','Siding repair']};\nvar ICON={\n  back:'<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M15 18l-6-6 6-6\"/></svg>',\n  chev:'<svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\"><path d=\"M9 6l6 6-6 6\"/></svg>',\n  plus:'<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\"><path d=\"M12 5v14M5 12h14\"/></svg>',\n  cam:'<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z\"/><circle cx=\"12\" cy=\"13\" r=\"4\"/></svg>',\n  x:'<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\"><path d=\"M18 6L6 18M6 6l12 12\"/></svg>',\n  folder:'<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\"><path d=\"M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z\"/></svg>',\n  eye:'<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/></svg>'\n};\n\nvar S={pass:'',jobs:[],view:'login',jobId:null,filter:'All',busy:false,prev:{},upload:null,tab:load('tfp_tab')||'quotes'};\nvar app=document.getElementById('app');\nvar picker=document.getElementById('picker');\nvar pickStage='after';\n\n/* ---------- helpers ---------- */\nfunction esc(s){return String(s==null?'':s).replace(/[&<>\"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'}[c];});}\nfunction img(id,w){return S.prev[id]||('https://lh3.googleusercontent.com/d/'+encodeURIComponent(id)+'=w'+(w||400));}\nfunction store(k,v){try{if(v==null)localStorage.removeItem(k);else localStorage.setItem(k,v);}catch(e){}}\nfunction load(k){try{return localStorage.getItem(k);}catch(e){return null;}}\nfunction month(d){if(!d)return'';var m=String(d).split('-');var names=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];return (names[(+m[1]||1)-1]||'')+' '+m[0];}\nfunction thisMonth(){var d=new Date();return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2);}\nfunction job(){for(var i=0;i<S.jobs.length;i++)if(S.jobs[i].id===S.jobId)return S.jobs[i];return null;}\nfunction sortJobs(){S.jobs.sort(function(a,b){return String(b.date).localeCompare(String(a.date))||String(b.created||'').localeCompare(String(a.created||''));});}\nfunction coverOf(j){\n  if(j.coverId&&j.photos.some(function(p){return p.id===j.coverId;}))return j.coverId;\n  var a=j.photos.filter(function(p){return p.stage==='after';});\n  return a.length?a[0].id:(j.photos.length?j.photos[j.photos.length-1].id:'');\n}\nfunction photosOf(j,stage){return j.photos.filter(function(p){return p.stage===stage;});}\n\nfunction call(method,args){\n  return new Promise(function(res,rej){\n    if(!(window.google&&google.script&&google.script.run)){rej(new Error('Open this app from its Google link.'));return;}\n    google.script.run\n      .withSuccessHandler(function(s){var r;try{r=JSON.parse(s);}catch(e){rej(new Error('Unexpected reply from Google.'));return;}\n        if(r.ok)res(r.data);else if(r.error==='WRONG_PASSCODE'){logout('That passcode didn\u2019t work.');rej(new Error('Wrong passcode'));}else rej(new Error(r.error));})\n      .withFailureHandler(function(e){rej(new Error((e&&e.message)||'No connection. Check your signal and try again.'));})\n      .api(JSON.stringify({pass:S.pass,method:method,args:args||{}}));\n  });\n}\n\nvar toastT;\nfunction toast(msg,err){\n  var old=document.querySelector('.toast');if(old)old.remove();\n  var t=document.createElement('div');t.className='toast'+(err?' err':'');t.textContent=msg;document.body.appendChild(t);\n  clearTimeout(toastT);toastT=setTimeout(function(){t.remove();},err?4500:2200);\n}\n\n/* ---------- views ---------- */\nfunction render(){\n  document.body.classList.remove('has-tabs');\n  if(S.view==='login')return renderLogin();\n  if(S.view==='loading'){app.innerHTML=bar('<div class=\"brand\">TEAM <b>FORTE</b></div>')+'<div class=\"loading\"><div class=\"spin dk\"></div></div>';return;}\n  if(S.tab!=='photos'){MAT.render();drawTabs();return;}\n  if(S.view==='job'&&job()){renderJob();drawTabs();return;}\n  if(S.view==='job'&&S.jobWait){app.innerHTML=bar('<div class=\"brand\">TEAM <b>FORTE</b></div>')+'<div class=\"loading\"><div class=\"spin dk\"></div></div>';drawTabs();return;}\n  S.view='home';renderHome();drawTabs();\n}\n\nvar TAB_ICONS={\n  jobs:'<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3\" y=\"4\" width=\"18\" height=\"18\" rx=\"2\"/><path d=\"M16 2v4M8 2v4M3 10h18\"/></svg>',\n  quotes:'<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z\"/><path d=\"M14 2v6h6M9 13h6M9 17h6\"/></svg>',\n  photos:ICON.cam,\n  money:'<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6\"/></svg>'\n};\nfunction drawTabs(){\n  document.body.classList.add('has-tabs');\n  var n=MAT.newCount();\n  var tabs=isCrew()?[['jobs','Jobs'],['photos','Photos']]:[['quotes','Quotes'],['photos','Photos'],['money','Spending']];\n  app.insertAdjacentHTML('beforeend','<nav class=\"tabs\" aria-label=\"Sections\"><div class=\"in2\">'+\n    tabs.map(function(t){\n      return '<button class=\"tab'+(S.tab===t[0]?' on':'')+'\" data-act=\"tab\" data-v=\"'+t[0]+'\"'+(S.tab===t[0]?' aria-current=\"page\"':'')+'>'+TAB_ICONS[t[0]]+t[1]+(t[0]==='quotes'&&n?'<span class=\"dot\">'+n+'</span>':'')+'</button>';\n    }).join('')+'</div></nav>');\n}\n\nfunction bar(inner){return '<div class=\"bar\"><div class=\"wrap\">'+inner+'</div></div>';}\n\nfunction renderLogin(msg){\n  app.innerHTML='<div class=\"login\"><div class=\"box\">'+\n    '<div class=\"logo\">TEAM <b>FORTE</b></div><p>Quotes, materials &amp; website photos</p>'+\n    '<form id=\"lf\"><input class=\"in\" id=\"pc\" type=\"password\" inputmode=\"text\" autocomplete=\"current-password\" placeholder=\"Passcode\" aria-label=\"Passcode\" required>'+\n    '<label class=\"remember\"><input type=\"checkbox\" id=\"rm\" checked> Keep me logged in on this phone</label>'+\n    '<button class=\"btn block\" id=\"lb\" type=\"submit\">Log in</button><div class=\"err\" id=\"le\">'+esc(msg||'')+'</div></form></div></div>';\n  var f=document.getElementById('lf');\n  f.onsubmit=function(e){e.preventDefault();\n    var pc=document.getElementById('pc').value.trim();if(!pc)return;\n    var b=document.getElementById('lb');b.disabled=true;b.innerHTML='<div class=\"spin\"></div>';\n    S.pass=pc;\n    call('ping').then(function(){\n      if(document.getElementById('rm').checked)store('tfp_pass',pc);\n      boot();\n    }).catch(function(err){\n      if(err.message!=='Wrong passcode')renderLogin(err.message);\n    });\n  };\n}\n\nfunction logout(msg){S.pass='';store('tfp_pass',null);S.view='login';MAT.reset();render();if(msg){var le=document.getElementById('le');if(le)le.textContent=msg;}}\n\nfunction isCrew(){return S.user&&S.user.role==='crew';}\nfunction boot(){\n  S.view='loading';render();\n  return call('ping').then(function(p){\n    S.user=p.user||{name:'Owner',role:'owner'};\n    var ok=isCrew()?['jobs','photos']:['quotes','photos','money'];\n    if(ok.indexOf(S.tab)<0)S.tab=ok[0];\n    return Promise.all([call('list'),isCrew()?MAT.loadCrew():MAT.load()]);\n  }).then(function(r){var d=r[0];S.jobs=d.jobs||[];if(d.url)EXEC_URL=d.url;sortJobs();if(S.view==='loading')S.view='home';render();})\n    .catch(function(e){if(S.view!=='login'){S.view='home';render();toast(e.message,true);}});\n}\n\nfunction renderHome(){\n  var list=S.jobs.filter(function(j){return S.filter==='All'||j.service===S.filter;});\n  var live=S.jobs.filter(function(j){return j.published&&j.photos.length;}).length;\n  var home=S.jobs.filter(function(j){return j.published&&j.featured&&j.photos.length;}).length;\n  var photos=S.jobs.reduce(function(n,j){return n+j.photos.length;},0);\n  var h=bar('<div class=\"brand\">TEAM <b>FORTE</b> PHOTOS</div><button class=\"link\" data-act=\"logout\">Log out</button>')+\n    '<div class=\"wrap\">'+\n    '<div class=\"stats\"><div class=\"stat\"><b>'+live+'</b><span>On website</span></div><div class=\"stat\"><b>'+home+'</b><span>On homepage</span></div><div class=\"stat\"><b>'+photos+'</b><span>Photos</span></div></div>'+\n    '<button class=\"btn block mt\" data-act=\"new\">'+ICON.plus+'New job</button>'+\n    '<div class=\"chips mt\">'+['All'].concat(SERVICES).map(function(s){return '<button class=\"chip'+(S.filter===s?' on':'')+'\" data-act=\"filter\" data-v=\"'+s+'\">'+s+'</button>';}).join('')+'</div>';\n  if(!list.length){\n    h+='<div class=\"empty\"><b>'+(S.jobs.length?'No '+esc(S.filter.toLowerCase())+' jobs yet':'No jobs yet')+'</b>Tap \u201cNew job\u201d, then add before, during and after photos.</div>';\n  }else{\n    h+='<div class=\"jobs\">'+list.map(function(j){\n      var c=coverOf(j);\n      var meta=[j.service,j.town,month(j.date)].filter(Boolean).join(' \u00b7 ');\n      var pills=(j.published&&j.photos.length?'<span class=\"pill live\">On website</span>':'<span class=\"pill\">'+(j.photos.length?'Hidden':'No photos yet')+'</span>')+\n        (j.featured?'<span class=\"pill home\">\u2605 Homepage</span>':'')+'<span class=\"pill\">'+j.photos.length+' photo'+(j.photos.length===1?'':'s')+'</span>';\n      return '<button class=\"job\" data-act=\"open\" data-id=\"'+esc(j.id)+'\"><div class=\"th\"'+(c?' style=\"background-image:url(\\''+esc(img(c,300))+'\\')\"':'')+'>'+(c?'':ICON.cam)+'</div>'+\n        '<div class=\"info\"><div class=\"t\">'+esc(j.title)+'</div><div class=\"m\">'+esc(meta)+'</div><div class=\"pills\">'+pills+'</div></div><span class=\"chev\">'+ICON.chev+'</span></button>';\n    }).join('')+'</div>';\n  }\n  if(EXEC_URL&&EXEC_URL.indexOf('__')!==0)h+='<div class=\"foot\"><a href=\"'+esc(EXEC_URL)+'?r=preview\" target=\"_blank\" rel=\"noopener\">See the website gallery \u2192</a></div>';\n  h+='</div>';\n  app.innerHTML=h;\n}\n\nfunction renderJob(){\n  var j=job();\n  var c=coverOf(j);\n  var h=bar('<button class=\"back\" data-act=\"home\">'+ICON.back+'Jobs</button><div class=\"bar-title\">'+esc(j.title)+'</div>')+'<div class=\"wrap\">';\n  h+='<div class=\"card\">'+\n    tog('published','Show on website',j.photos.length?'Appears in the Our Work gallery':'Add a photo first. Then it will appear',j.published)+\n    tog('featured','Show on homepage','Also appears in the homepage gallery',j.featured)+\n    '</div>';\n  h+='<div class=\"card\"><h2>Photos <small>Tap to view \u00b7 hold &amp; drag to move</small></h2>';\n  STAGES.forEach(function(st){\n    var list=photosOf(j,st[0]);\n    h+='<div class=\"stage\"><div class=\"stage-h\"><b>'+st[1]+'</b><span>'+list.length+' photo'+(list.length===1?'':'s')+'</span></div><div class=\"grid\" data-stg=\"'+st[0]+'\">'+\n      list.map(function(p){return '<button class=\"ph\" data-act=\"photo\" data-id=\"'+esc(p.id)+'\" aria-label=\"'+st[1]+' photo\"><img loading=\"lazy\" draggable=\"false\" src=\"'+esc(img(p.id,400))+'\" alt=\"\">'+(p.id===c?'<span class=\"star\">COVER</span>':'')+(p.caption?'<span class=\"cap\">'+esc(p.caption)+'</span>':'')+'</button>';}).join('')+\n      '<button class=\"add\" data-act=\"add\" data-stage=\"'+st[0]+'\">'+ICON.cam+'Add '+st[1].toLowerCase()+'</button>'+\n      (S.user&&S.user.role==='owner'?'<button class=\"add drv\" data-act=\"drive\" data-stage=\"'+st[0]+'\">'+ICON.folder+'From Drive</button>':'')+'</div></div>';\n  });\n  h+='</div>';\n  h+='<div class=\"card\"><h2>Job details</h2><form id=\"jf\">'+detailFields(j)+\n    '<button class=\"btn dark block mt\" type=\"submit\">Save details</button></form></div>';\n  if(j.folderUrl)h+='<a class=\"drive\" href=\"'+esc(j.folderUrl)+'\" target=\"_blank\" rel=\"noopener\">'+ICON.folder+'Open this job\u2019s folder in Google Drive</a>';\n  if(!isCrew())h+='<button class=\"btn danger block mt\" data-act=\"deljob\">Delete this job</button>';\n  h+='</div>';\n  app.innerHTML=h;\n  document.getElementById('jf').onsubmit=function(e){e.preventDefault();saveDetails(this);};\n  wireService(document.getElementById('jf'));\n}\n\nfunction tog(key,title,sub,on){\n  return '<div class=\"toggle\"><div class=\"tl\"><b>'+title+'</b><span>'+sub+'</span></div><button class=\"sw'+(on?' on':'')+'\" role=\"switch\" aria-checked=\"'+(on?'true':'false')+'\" aria-label=\"'+title+'\" data-act=\"tog\" data-k=\"'+key+'\"></button></div>';\n}\n\nfunction detailFields(j){\n  j=j||{service:S.filter!=='All'?S.filter:'Roofing',date:thisMonth()};\n  var svc=j.service||'Roofing';\n  return '<label class=\"f\">Service</label><div class=\"seg\" id=\"svc\">'+SERVICES.map(function(s){return '<button type=\"button\" class=\"'+(s===svc?'on':'')+'\" data-svc=\"'+s+'\">'+s+'</button>';}).join('')+'</div>'+\n    '<input type=\"hidden\" name=\"service\" value=\"'+esc(svc)+'\">'+\n    '<div id=\"kindw\"'+(svc==='Roofing'?'':' hidden')+'><label class=\"f\">Job type <small>(sets the filter on the website gallery)</small></label><div class=\"seg kinds\" id=\"kind\">'+\n      KINDS.map(function(k){var on=(j.kindSet||j.kind||'')===k[0];return '<button type=\"button\" class=\"'+(on?'on':'')+'\" data-kind=\"'+k[0]+'\" aria-pressed=\"'+on+'\">'+k[1]+'</button>';}).join('')+'</div>'+\n    '<input type=\"hidden\" name=\"kind\" value=\"'+esc(j.kindSet||j.kind||'')+'\"></div>'+\n    '<label class=\"f\">What was the job?</label><input class=\"in\" name=\"title\" list=\"titles\" maxlength=\"120\" placeholder=\"e.g. Full roof replacement\" value=\"'+esc(j.title||'')+'\" required>'+\n    '<datalist id=\"titles\">'+(TITLES[svc]||[]).map(function(t){return '<option value=\"'+esc(t)+'\">';}).join('')+'</datalist>'+\n    '<div class=\"row\"><div><label class=\"f\">Town</label><input class=\"in\" name=\"town\" maxlength=\"60\" placeholder=\"e.g. Hartford\" value=\"'+esc(j.town||'')+'\"></div>'+\n    '<div><label class=\"f\">Month</label><input class=\"in\" type=\"month\" name=\"date\" value=\"'+esc(j.date||thisMonth())+'\"></div></div>'+\n    '<label class=\"f\">Street address <small>(private, never shown on the website)</small></label><input class=\"in\" name=\"address\" maxlength=\"120\" placeholder=\"Optional\" value=\"'+esc(j.address||'')+'\">'+\n    '<label class=\"f\">Short description <small>(optional, shown on the website)</small></label><textarea class=\"in\" name=\"description\" maxlength=\"600\" placeholder=\"e.g. Tore off two layers, replaced rotted decking, new architectural shingles and ridge vent.\">'+esc(j.description||'')+'</textarea>';\n}\n\nfunction wireService(form){\n  var ks=form.querySelector('#kind');\n  if(ks)ks.onclick=function(e){var b=e.target.closest('button[data-kind]');if(!b)return;\n    var on=!b.classList.contains('on');\n    ks.querySelectorAll('button').forEach(function(x){var y=x===b&&on;x.classList.toggle('on',y);x.setAttribute('aria-pressed',y);});\n    form.elements.kind.value=on?b.getAttribute('data-kind'):'';};\n  var seg=form.querySelector('#svc');if(!seg)return;\n  seg.onclick=function(e){var b=e.target.closest('button[data-svc]');if(!b)return;\n    seg.querySelectorAll('button').forEach(function(x){x.classList.toggle('on',x===b);});\n    form.elements.service.value=b.getAttribute('data-svc');\n    var kw=form.querySelector('#kindw');if(kw)kw.hidden=b.getAttribute('data-svc')!=='Roofing';\n    var dl=form.querySelector('#titles');if(dl)dl.innerHTML=(TITLES[b.getAttribute('data-svc')]||[]).map(function(t){return '<option value=\"'+esc(t)+'\">';}).join('');\n  };\n}\n\nfunction formData(f){return{kind:f.elements.service.value==='Roofing'&&f.elements.kind?f.elements.kind.value:'',service:f.elements.service.value,title:f.elements.title.value,town:f.elements.town.value,date:f.elements.date.value,address:f.elements.address.value,description:f.elements.description.value};}\n\nfunction saveDetails(f){\n  var j=job();var b=f.querySelector('button[type=submit]');b.disabled=true;b.textContent='Saving\u2026';\n  var d=formData(f);d.id=j.id;d.base={title:j.title,town:j.town,address:j.address,description:j.description,date:j.date};\n  call('saveJob',d).then(function(r){merge(r);toast('Saved');render();})\n    .catch(function(e){b.disabled=false;b.textContent='Save details';if(isConflict(e))conflictBox(e,reloadJobs);else toast(e.message,true);});\n}\n\nfunction merge(r){\n  for(var i=0;i<S.jobs.length;i++)if(S.jobs[i].id===r.id){S.jobs[i]=r;sortJobs();return;}\n  S.jobs.push(r);sortJobs();\n}\n\n/* ---------- taps ---------- */\ndocument.addEventListener('touchstart',function(){},{passive:true});\nvar PTR={down:false,t:0},TAP={el:null,t:0};\ndocument.addEventListener('pointerdown',function(){PTR.down=true;PTR.t=Date.now();},true);\n['pointerup','pointercancel'].forEach(function(ev){document.addEventListener(ev,function(){PTR.down=false;PTR.t=Date.now();},true);});\ndocument.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('button,.btn,a.btn');if(b){TAP.el=b;TAP.t=Date.now();}},true);\n/* Run fn once the finger is up (a redraw mid-tap swallows the tap). */\nfunction whenIdle(fn){(function w(){if(PTR.down||Date.now()-PTR.t<300)return setTimeout(w,100);fn();})();}\nfunction isTyping(){var a=document.activeElement;return !!(a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)&&a.type!=='checkbox'&&a.type!=='radio'&&a.type!=='file');}\nvar BG_CALLS={boot:1,list:1,matList:1,crewJobs:1,driveThumbs:1,ping:1};\n(function(){var raw=call;call=function(m,a){var p=raw(m,a),b=TAP.el;\n  if(b&&!BG_CALLS[m]&&Date.now()-TAP.t<600&&document.contains(b)&&!b.classList.contains('busy')){\n    b.classList.add('busy');b.setAttribute('aria-busy','true');var off=function(){b.classList.remove('busy');b.removeAttribute('aria-busy');};p.then(off,off);}\n  return p;};})();\n/* Money and number boxes: \"12,500\" or \"$12,500.00\" means 12500 */\ndocument.addEventListener('input',function(e){var t=e.target;if(!t||t.tagName!=='INPUT')return;var im=t.getAttribute('inputmode');\n  if(im!=='decimal'&&im!=='numeric')return;var v=t.value,c=v.replace(im==='numeric'?/[^\\d]/g:/[^\\d.]/g,'');if(c!==v)t.value=c;},true);\n\n/* ---------- sheets ---------- */\nfunction sheet(html,onClose){\n  closeSheet();\n  var ov=document.createElement('div');ov.className='ov';ov.id='ov';\n  ov.innerHTML='<div class=\"sheet\" role=\"dialog\" aria-modal=\"true\"><div class=\"grab\"></div>'+html+'</div>';\n  ov.addEventListener('click',function(e){\n    if(e.target===ov&&sheetDirty(ov)){if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();toast('Tap \u2715 to close without saving');return;}\n    if(e.target===ov||e.target.closest('[data-close]')){closeSheet();if(onClose)onClose();}});\n  document.body.appendChild(ov);document.body.style.overflow='hidden';\n  return ov;\n}\nfunction sheetDirty(ov){return Array.prototype.some.call(ov.querySelectorAll('input,textarea'),function(i){\n  if(i.type==='checkbox'||i.type==='radio')return i.checked!==i.defaultChecked;if(i.type==='file'||i.type==='search')return false;return i.value!==i.defaultValue;});}\nfunction closeSheet(){var o=document.getElementById('ov');if(o)o.remove();document.body.style.overflow='';}\nfunction closeBtn(){return '<button class=\"x\" data-close aria-label=\"Close\">'+ICON.x+'</button>';}\n\nfunction isConflict(x){return /^CONFLICT/.test((x&&x.message)||'');}\nfunction conflictBox(x,reload){\n  confirmBox('Changed on another phone',String(x.message).replace(/^CONFLICT:\\s*/,''),'Reload').then(function(ok){if(ok)reload();});\n}\nfunction reloadJobs(){return call('list').then(function(d){S.jobs=d.jobs||[];render();toast('Reloaded');}).catch(function(x){toast(x.message,true);});}\n\nfunction confirmBox(title,text,okLabel){\n  return new Promise(function(res){\n    var ov=sheet('<h3>'+esc(title)+closeBtn()+'</h3><p class=\"sub\">'+esc(text)+'</p><div class=\"acts\"><button class=\"btn ghost\" data-close>Cancel</button><button class=\"btn\" id=\"cok\" style=\"background:#C62828\">'+esc(okLabel)+'</button></div>',function(){res(false);});\n    ov.querySelector('#cok').onclick=function(){closeSheet();res(true);};\n  });\n}\n\nfunction newJobSheet(){\n  var ov=sheet('<h3>New job'+closeBtn()+'</h3><form id=\"nf\">'+detailFields(null)+'<button class=\"btn block mt\" type=\"submit\">Create job &amp; add photos</button></form>');\n  var f=ov.querySelector('#nf');wireService(f);\n  f.onsubmit=function(e){e.preventDefault();\n    var b=f.querySelector('button[type=submit]');b.disabled=true;b.textContent='Creating\u2026';\n    call('saveJob',formData(f)).then(function(r){merge(r);closeSheet();S.jobId=r.id;S.view='job';render();window.scrollTo(0,0);toast('Job created. Now add photos.');})\n      .catch(function(err){b.disabled=false;b.textContent='Create job & add photos';toast(err.message,true);});\n  };\n}\n\nfunction photoSheet(id){\n  var j=job();var p=null;j.photos.forEach(function(x){if(x.id===id)p=x;});if(!p)return;\n  var group=photosOf(j,p.stage);var idx=group.indexOf(p);\n  var isCover=coverOf(j)===p.id;\n  var ov=sheet('<h3>Photo'+closeBtn()+'</h3>'+\n    '<img class=\"big\" src=\"'+esc(img(p.id,1200))+'\" alt=\"\">'+\n    '<label class=\"f mt\">Stage</label><div class=\"seg\" id=\"stg\">'+STAGES.map(function(s){return '<button type=\"button\" class=\"'+(s[0]===p.stage?'on':'')+'\" data-st=\"'+s[0]+'\">'+s[1]+'</button>';}).join('')+'</div>'+\n    '<label class=\"f\">Caption <small>(optional)</small></label><div class=\"row\"><input class=\"in\" id=\"cap\" maxlength=\"160\" placeholder=\"e.g. Rotted decking found under old shingles\" value=\"'+esc(p.caption||'')+'\"><button class=\"btn dark\" id=\"capb\" style=\"flex:0 0 auto\">Save</button></div>'+\n    '<div class=\"acts\">'+\n      '<button class=\"btn ghost\" id=\"mvl\"'+(idx<=0?' disabled':'')+'>\u2190 Move earlier</button>'+\n      '<button class=\"btn ghost\" id=\"mvr\"'+(idx>=group.length-1?' disabled':'')+'>Move later \u2192</button>'+\n      '<button class=\"btn ghost\" id=\"cov\"'+(isCover?' disabled':'')+'>'+(isCover?'\u2605 Cover photo':'\u2605 Make cover photo')+'</button>'+\n      (isCrew()?'<span></span>':'<button class=\"btn danger\" id=\"del\">Delete photo</button>')+\n    '</div><p class=\"hint\">The cover photo is the one shown on the website card for this job.</p>');\n  function after(r,msg){var k=j.photos.indexOf(p);if(r&&k>=0)j.photos[k]=Object.assign(p,{stage:r.stage||p.stage,caption:r.caption!=null?r.caption:p.caption});resort(j);render();if(msg)toast(msg);}\n  ov.querySelector('#stg').onclick=function(e){var b=e.target.closest('button[data-st]');if(!b||b.classList.contains('on'))return;\n    var st=b.getAttribute('data-st');\n    call('updatePhoto',{id:p.id,stage:st}).then(function(r){p.stage=r.stage;p._o=Date.now();after(r,'Moved to '+st);photoSheet(p.id);}).catch(function(e2){toast(e2.message,true);});\n  };\n  ov.querySelector('#capb').onclick=function(){var v=ov.querySelector('#cap').value;\n    call('updatePhoto',{id:p.id,caption:v}).then(function(r){closeSheet();after(r,'Caption saved');}).catch(function(e2){toast(e2.message,true);});\n  };\n  function mv(dir){call('movePhoto',{id:p.id,dir:dir}).then(function(){\n      var g=photosOf(j,p.stage);var i=g.indexOf(p),k=i+dir;if(k<0||k>=g.length)return;\n      var a=j.photos.indexOf(g[i]),b2=j.photos.indexOf(g[k]);var t=j.photos[a];j.photos[a]=j.photos[b2];j.photos[b2]=t;\n      render();photoSheet(p.id);\n    }).catch(function(e2){toast(e2.message,true);});}\n  ov.querySelector('#mvl').onclick=function(){mv(-1);};\n  ov.querySelector('#mvr').onclick=function(){mv(1);};\n  ov.querySelector('#cov').onclick=function(){\n    call('saveJob',{id:j.id,coverId:p.id}).then(function(r){merge(r);closeSheet();render();toast('Cover photo set');}).catch(function(e2){toast(e2.message,true);});\n  };\n  if(ov.querySelector('#del'))ov.querySelector('#del').onclick=function(){\n    confirmBox('Delete this photo?','It will be removed from the website and moved to the trash in Google Drive.','Delete').then(function(ok){\n      if(!ok){photoSheet(p.id);return;}\n      call('deletePhoto',{id:p.id}).then(function(){j.photos=j.photos.filter(function(x){return x.id!==p.id;});if(j.coverId===p.id)j.coverId='';render();toast('Photo deleted');})\n        .catch(function(e2){toast(e2.message,true);});\n    });\n  };\n}\n\nfunction resort(j){\n  var rank={before:0,during:1,after:2};\n  j.photos.forEach(function(p,i){p._i=p._o?1e9+p._o:i;});\n  j.photos.sort(function(a,b){return (rank[a.stage]-rank[b.stage])||(a._i-b._i);});\n  j.photos.forEach(function(p){delete p._i;delete p._o;});\n}\n\n/* ---------- uploads ---------- */\nfunction shrink(file){\n  return new Promise(function(res,rej){\n    var url=URL.createObjectURL(file);var im=new Image();\n    im.onload=function(){\n      try{\n        var w=im.naturalWidth,h=im.naturalHeight,max=2000,s=Math.min(1,max/Math.max(w,h));\n        var cw=Math.round(w*s),ch=Math.round(h*s);\n        var cv=document.createElement('canvas');cv.width=cw;cv.height=ch;\n        var cx=cv.getContext('2d');cx.fillStyle='#fff';cx.fillRect(0,0,cw,ch);cx.drawImage(im,0,0,cw,ch);\n        var full=cv.toDataURL('image/jpeg',0.82);\n        var ts=Math.min(1,500/Math.max(cw,ch));var tv=document.createElement('canvas');tv.width=Math.round(cw*ts);tv.height=Math.round(ch*ts);\n        tv.getContext('2d').drawImage(cv,0,0,tv.width,tv.height);\n        URL.revokeObjectURL(url);\n        res({base64:full.split(',')[1],width:cw,height:ch,thumb:tv.toDataURL('image/jpeg',0.8)});\n      }catch(e){URL.revokeObjectURL(url);rej(e);}\n    };\n    im.onerror=function(){URL.revokeObjectURL(url);rej(new Error('Couldn\u2019t read '+(file.name||'that photo')+'. Try a JPG.'));};\n    im.src=url;\n  });\n}\n\nfunction upload(files,stage){\n  var j=job();if(!j||!files.length)return;\n  var list=Array.prototype.slice.call(files,0,30);\n  S.upload={total:list.length,done:0,failed:0};drawProg();\n  var errs=[];\n  var seq=Promise.resolve();\n  list.forEach(function(file){\n    seq=seq.then(function(){\n      return shrink(file).then(function(sh){\n        return call('uploadPhoto',{jobId:j.id,stage:stage,base64:sh.base64,mime:'image/jpeg',width:sh.width,height:sh.height}).then(function(p){\n          S.prev[p.id]=sh.thumb;var jl=liveJob(j);\n          jl.photos.push({id:p.id,stage:p.stage,caption:p.caption,w:p.width,h:p.height});resort(jl);\n        });\n      }).catch(function(e){S.upload.failed++;errs.push(e.message);})\n      .then(function(){S.upload.done++;drawProg();if(S.view==='job'&&!isTyping())whenIdle(renderKeepScroll);});\n    });\n  });\n  seq.then(function(){\n    var u=S.upload;S.upload=null;drawProg();\n    if(u.failed)toast(u.failed+' of '+u.total+' didn\u2019t upload: '+errs[0],true);\n    else toast(u.total+' photo'+(u.total===1?'':'s')+' added'+(j.published?'. Live on the website.':'.'));\n  });\n}\n\nfunction liveJob(j){for(var i=0;i<S.jobs.length;i++)if(S.jobs[i].id===j.id)return S.jobs[i];return j;}\n/* ---------- Google Drive picker ---------- */\nvar DRV={thumbs:{},sel:[],data:null,cur:null,stage:'before',jobId:''};\nfunction driveSheet(stage){\n  var j=job();if(!j)return;\n  DRV.stage=stage;DRV.sel=[];DRV.jobId=j.id;DRV.data=null;\n  var ov=sheet('<h3>Photos from Google Drive'+closeBtn()+'</h3>'+\n    '<div class=\"dv-tabs\"><button data-dv=\"folder\" class=\"on\">My Drive</button><button data-dv=\"shared\">Shared with me</button><button data-dv=\"recent\">Recent</button></div>'+\n    '<form class=\"dv-search\" id=\"dvs\"><input class=\"in\" id=\"dvq\" type=\"search\" placeholder=\"Search Drive (folder or file name)\" enterkeyhint=\"search\" autocomplete=\"off\" autocapitalize=\"off\"></form>'+\n    '<div id=\"dvb\"></div>'+\n    '<div class=\"dv-foot\"><div class=\"dv-st\">'+STAGES.map(function(s){return '<button type=\"button\" data-dvst=\"'+s[0]+'\"'+(s[0]===stage?' class=\"on\"':'')+'>'+s[1]+'</button>';}).join('')+'</div>'+\n    '<button class=\"btn block\" id=\"dvgo\" disabled>Tap photos to pick them</button></div>');\n  ov.classList.add('dv');\n  ov.querySelector('#dvs').onsubmit=function(e){e.preventDefault();var v=ov.querySelector('#dvq').value.trim();if(!v)return;ov.querySelector('#dvq').blur();tabsOn(null);driveGo({mode:'search',q:v});};\n  function tabsOn(m){ov.querySelectorAll('[data-dv]').forEach(function(b){b.classList.toggle('on',b.getAttribute('data-dv')===m);});}\n  ov.addEventListener('click',function(e){\n    var b=e.target.closest('[data-dv]');if(b){var m=b.getAttribute('data-dv');tabsOn(m);driveGo(m==='folder'?{mode:'folder',folder:'root'}:{mode:m});return;}\n    b=e.target.closest('[data-dvf]');if(b){tabsOn('folder');driveGo({mode:'folder',folder:b.getAttribute('data-dvf')});return;}\n    b=e.target.closest('[data-dvp]');if(b){var id=b.getAttribute('data-dvp'),k=DRV.sel.indexOf(id);if(k>=0)DRV.sel.splice(k,1);else DRV.sel.push(id);b.classList.toggle('on',k<0);driveFoot();return;}\n    b=e.target.closest('[data-dvall]');if(b){var ids=(DRV.data&&DRV.data.files||[]).map(function(f){return f.id;});var all=ids.every(function(i){return DRV.sel.indexOf(i)>=0;});\n      ids.forEach(function(i){var k2=DRV.sel.indexOf(i);if(all&&k2>=0)DRV.sel.splice(k2,1);if(!all&&k2<0)DRV.sel.push(i);});driveDraw();return;}\n    b=e.target.closest('[data-dvmore]');if(b){driveGo({token:DRV.data.token},true);return;}\n    b=e.target.closest('[data-dvst]');if(b){DRV.stage=b.getAttribute('data-dvst');ov.querySelectorAll('[data-dvst]').forEach(function(z){z.classList.toggle('on',z===b);});driveFoot();return;}\n    if(e.target.closest('#dvgo'))driveImport();\n  });\n  driveGo({mode:'folder',folder:'root'});\n}\nfunction driveGo(args,more){\n  var body=document.getElementById('dvb');if(!body)return;\n  if(!more){DRV.cur=args;body.innerHTML='<div class=\"loading\" style=\"padding:40px 0\"><div class=\"spin dk\"></div></div>';}\n  else{var mb=body.querySelector('[data-dvmore]');if(mb){mb.disabled=true;mb.textContent='Loading\u2026';}}\n  var me=DRV.cur;\n  call('driveBrowse',args).then(function(d){\n    if(DRV.cur!==me||!document.getElementById('dvb'))return;\n    (d.files||[]).forEach(function(f){if(f.thumb&&DRV.thumbs[f.id]===undefined)DRV.thumbs[f.id]=f.thumb;});\n    if(more&&DRV.data){DRV.data.files=DRV.data.files.concat(d.files);DRV.data.token=d.token;}else DRV.data=d;\n    driveDraw();\n  }).catch(function(e){var b2=document.getElementById('dvb');if(b2&&DRV.cur===me)b2.innerHTML='<div class=\"dv-empty\">'+esc(e.message)+'</div>';});\n}\nfunction driveDraw(){\n  var body=document.getElementById('dvb'),d=DRV.data;if(!body||!d)return;\n  var h='';\n  if(d.mode==='folder'&&d.path.length)h+='<div class=\"dv-path\">'+d.path.map(function(p,i){return (i?'<i>\u203a</i>':'')+'<button type=\"button\" data-dvf=\"'+esc(p.id)+'\">'+esc(p.name)+'</button>';}).join('')+'</div>';\n  if(d.mode==='search')h+='<div class=\"dv-path\">Results for \u201c'+esc(DRV.cur.q||'')+'\u201d</div>';\n  if(d.mode==='recent')h+='<div class=\"dv-path\">Photos changed in the last 45 days</div>';\n  if(d.folders.length)h+='<div class=\"dv-fl\">'+d.folders.map(function(f){return '<button type=\"button\" class=\"dv-f\" data-dvf=\"'+esc(f.id)+'\">'+ICON.folder+'<span>'+esc(f.name)+'</span></button>';}).join('')+'</div>';\n  if(d.files.length){\n    var all=d.files.every(function(f){return DRV.sel.indexOf(f.id)>=0;});\n    h+='<div class=\"dv-bar\"><span>'+d.files.length+(d.token?'+':'')+' photo'+(d.files.length===1?'':'s')+'</span><button type=\"button\" data-dvall>'+(all?'Clear all':'Select all')+'</button></div>';\n    h+='<div class=\"dv-g\">'+d.files.map(function(f){var t=DRV.thumbs[f.id];\n      return '<button type=\"button\" class=\"dv-p'+(DRV.sel.indexOf(f.id)>=0?' on':'')+'\" data-dvp=\"'+esc(f.id)+'\" aria-label=\"'+esc(f.name)+'\">'+(t?'<img src=\"'+esc(t)+'\" alt=\"\" loading=\"lazy\" decoding=\"async\">':'')+'<span class=\"nm\">'+esc(f.name)+'</span><span class=\"ck\"></span></button>';}).join('')+'</div>';\n    if(d.token)h+='<button type=\"button\" class=\"btn ghost dv-more\" data-dvmore>Show more photos</button>';\n  }\n  if(!d.folders.length&&!d.files.length)h+='<div class=\"dv-empty\">'+(d.mode==='search'?'Nothing found. Try another word.':'No folders or photos here.')+'</div>';\n  body.innerHTML=h;\n  Array.prototype.forEach.call(body.querySelectorAll('.dv-p img'),function(im){im.onerror=function(){driveThumbFail(im);};});\n  driveFoot();driveThumbs();\n}\nfunction driveThumbs(){\n  if(DRV.tBusy)return;var d=DRV.data;if(!d)return;\n  var need=d.files.filter(function(f){return DRV.thumbs[f.id]===undefined;}).slice(0,12).map(function(f){return f.id;});\n  if(!need.length||!document.getElementById('dvb'))return;\n  DRV.tBusy=true;\n  call('driveThumbs',{ids:need}).then(function(r){\n    need.forEach(function(id){DRV.thumbs[id]=(r.thumbs||{})[id]||'';var b=document.querySelector('[data-dvp=\"'+id+'\"]');var t=DRV.thumbs[id];\n      if(b&&t&&!b.querySelector('img'))b.insertAdjacentHTML('afterbegin','<img src=\"'+esc(t)+'\" alt=\"\">');});\n  }).catch(function(){need.forEach(function(id){DRV.thumbs[id]='';});}).then(function(){DRV.tBusy=false;driveThumbs();});\n}\nfunction driveThumbFail(im){\n  var b=im.closest('[data-dvp]');if(!b)return;var id=b.getAttribute('data-dvp');im.remove();\n  if(DRV.failed&&DRV.failed[id])return;DRV.failed=DRV.failed||{};DRV.failed[id]=1;delete DRV.thumbs[id];driveThumbs();\n}\nfunction driveFoot(){\n  var b=document.getElementById('dvgo');if(!b||DRV.busy)return;var n=DRV.sel.length,st=STAGES.filter(function(s){return s[0]===DRV.stage;})[0][1];\n  b.disabled=!n;b.textContent=n?'Add '+n+' photo'+(n===1?'':'s')+' to '+st:'Tap photos to pick them';\n}\nfunction driveImport(){\n  var ids=DRV.sel.slice(),jobId=DRV.jobId,stage=DRV.stage;if(!ids.length||DRV.busy)return;\n  DRV.busy=true;var b=document.getElementById('dvgo');\n  var res={added:[],skipped:0,failed:[]},chunks=[];for(var i=0;i<ids.length;i+=5)chunks.push(ids.slice(i,i+5));\n  var seq=Promise.resolve();\n  chunks.forEach(function(c,k){seq=seq.then(function(){\n    var bb=document.getElementById('dvgo');if(bb){bb.disabled=true;bb.textContent='Copying '+Math.min(ids.length,(k+1)*5)+' of '+ids.length+'\u2026';}\n    return call('importDrivePhotos',{jobId:jobId,stage:stage,ids:c}).then(function(r){\n      res.added=res.added.concat(r.added||[]);res.skipped+=(r.skipped||[]).length;res.failed=res.failed.concat(r.failed||[]);\n      var jl=null;for(var i2=0;i2<S.jobs.length;i2++)if(S.jobs[i2].id===jobId)jl=S.jobs[i2];\n      if(jl)(r.added||[]).forEach(function(p){if(DRV.thumbs[p.src])S.prev[p.id]=DRV.thumbs[p.src];jl.photos.push({id:p.id,stage:p.stage,caption:'',w:null,h:null});});\n      if(jl)resort(jl);\n    },function(e){c.forEach(function(id){res.failed.push({id:id,error:e.message});});});\n  });});\n  seq.then(function(){\n    DRV.busy=false;DRV.sel=[];closeSheet();if(S.view==='job')whenIdle(renderKeepScroll);\n    var n=res.added.length,msg=n+' photo'+(n===1?'':'s')+' added';\n    if(res.skipped)msg+=', '+res.skipped+' already in this job';\n    if(res.failed.length)toast(msg+'. '+res.failed.length+' didn\\u2019t copy: '+res.failed[0].error,true);else toast(msg+'.');\n  });\n}\n/* ---------- hold & drag to rearrange photos ---------- */\nvar DRAG={on:false,t:null,justDropped:0};\nfunction dragStart(ph,x,y){\n  var j=job();if(!j)return;\n  var r=ph.getBoundingClientRect();\n  DRAG.on=true;DRAG.ph=ph;DRAG.j=j;DRAG.dx=x-r.left;DRAG.dy=y-r.top;DRAG.moved=false;\n  DRAG.before=JSON.stringify(dragOrder());\n  var fly=document.createElement('div');fly.className='dragfly';fly.style.width=r.width+'px';fly.style.height=r.height+'px';\n  fly.innerHTML='<img src=\"'+esc(ph.querySelector('img').src)+'\" alt=\"\">';document.body.appendChild(fly);DRAG.fly=fly;\n  ph.classList.add('ghost');document.body.classList.add('dragging');\n  if(navigator.vibrate)try{navigator.vibrate(15);}catch(e){}\n  dragMove(x,y);\n}\nfunction dragMove(x,y){\n  if(!DRAG.on)return;\n  DRAG.fly.style.left=(x-DRAG.dx)+'px';DRAG.fly.style.top=(y-DRAG.dy)+'px';DRAG.x=x;DRAG.y=y;\n  var el=document.elementFromPoint(x,y);if(!el)return;\n  var grid=el.closest('.grid[data-stg]');\n  document.querySelectorAll('.grid.drop').forEach(function(g){if(g!==grid)g.classList.remove('drop');});\n  if(!grid)return;grid.classList.add('drop');\n  var over=el.closest('.ph');\n  if(over&&over!==DRAG.ph){\n    var r=over.getBoundingClientRect(),after=x>r.left+r.width/2;\n    var ref=after?over.nextSibling:over;if(ref!==DRAG.ph&&!(DRAG.ph.parentNode===grid&&DRAG.ph.nextSibling===ref)){grid.insertBefore(DRAG.ph,ref);DRAG.moved=true;}\n  }else if(!over){\n    /* empty space or the Add tiles: go to the end of that stage */\n    var firstAdd=grid.querySelector('.add');\n    if(DRAG.ph.parentNode!==grid||DRAG.ph.nextSibling!==firstAdd){grid.insertBefore(DRAG.ph,firstAdd);DRAG.moved=true;}\n  }\n}\nfunction dragOrder(){var o={};document.querySelectorAll('.grid[data-stg]').forEach(function(g){o[g.getAttribute('data-stg')]=Array.prototype.map.call(g.querySelectorAll('.ph[data-id]'),function(p){return p.getAttribute('data-id');});});return o;}\nfunction dragEnd(cancel){\n  if(!DRAG.on)return;\n  DRAG.on=false;DRAG.justDropped=Date.now();\n  if(DRAG.fly)DRAG.fly.remove();DRAG.ph.classList.remove('ghost');document.body.classList.remove('dragging');\n  document.querySelectorAll('.grid.drop').forEach(function(g){g.classList.remove('drop');});\n  var order=dragOrder(),j=DRAG.j;\n  if(cancel||JSON.stringify(order)===DRAG.before){renderKeepScroll();return;}\n  /* apply on the phone right away, then save */\n  var prev=j.photos.map(function(p){return [p,p.stage];});\n  var byId={};j.photos.forEach(function(p){byId[p.id]=p;});\n  var list=[];STAGES.forEach(function(s){(order[s[0]]||[]).forEach(function(id){var p=byId[id];if(p){p.stage=s[0];list.push(p);delete byId[id];}});});\n  Object.keys(byId).forEach(function(id){list.push(byId[id]);});\n  j.photos=list;renderKeepScroll();\n  call('reorderPhotos',{jobId:j.id,stages:order}).then(function(){toast(j.published?'Order saved. Live on the website.':'Order saved');})\n    .catch(function(e){j.photos=prev.map(function(x){x[0].stage=x[1];return x[0];});renderKeepScroll();toast('Couldn\\u2019t save the new order: '+e.message,true);});\n}\nfunction dragAutoScroll(){\n  if(!DRAG.on)return;var y=DRAG.y,h=window.innerHeight,edge=70,v=0;\n  if(y<edge)v=-Math.ceil((edge-y)/5);else if(y>h-edge)v=Math.ceil((y-(h-edge))/5);\n  if(v){window.scrollBy(0,v);dragMove(DRAG.x,DRAG.y);}\n  requestAnimationFrame(dragAutoScroll);\n}\n(function(){\n  var st=null;\n  function clear(){if(st&&st.timer)clearTimeout(st.timer);st=null;}\n  app.addEventListener('pointerdown',function(e){\n    var ph=e.target.closest&&e.target.closest('.grid[data-stg] .ph');if(!ph||S.upload||e.button>0)return;\n    clear();st={ph:ph,x:e.clientX,y:e.clientY,touch:e.pointerType!=='mouse',id:e.pointerId};\n    if(st.touch)st.timer=setTimeout(function(){if(st){dragStart(st.ph,st.x,st.y);requestAnimationFrame(dragAutoScroll);}},380);\n  });\n  document.addEventListener('pointermove',function(e){\n    if(DRAG.on){e.preventDefault();dragMove(e.clientX,e.clientY);return;}\n    if(!st)return;var d=Math.abs(e.clientX-st.x)+Math.abs(e.clientY-st.y);\n    if(st.touch){if(d>10)clear();else{st.x=e.clientX;st.y=e.clientY;}}\n    else if(d>6){var s0=st;clear();dragStart(s0.ph,s0.x,s0.y);dragMove(e.clientX,e.clientY);requestAnimationFrame(dragAutoScroll);}\n  },{passive:false});\n  document.addEventListener('touchmove',function(e){if(DRAG.on)e.preventDefault();},{passive:false});\n  document.addEventListener('pointerup',function(){clear();if(DRAG.on)dragEnd(false);});\n  document.addEventListener('pointercancel',function(){clear();if(DRAG.on)dragEnd(false);});\n  document.addEventListener('contextmenu',function(e){if(DRAG.on||(e.target.closest&&e.target.closest('.grid[data-stg] .ph')))e.preventDefault();});\n  document.addEventListener('keydown',function(e){if(DRAG.on&&e.key==='Escape')dragEnd(true);});\n})();\n/* ---------- full-screen photo viewer ---------- */\nfunction photoViewer(id){\n  var j=job();if(!j||!j.photos.length)return;\n  var list=j.photos.slice(),i=0;list.forEach(function(p,k){if(p.id===id)i=k;});\n  var ov=document.createElement('div');ov.className='fv';ov.setAttribute('role','dialog');ov.setAttribute('aria-label','Photo viewer');\n  ov.innerHTML='<div class=\"fv-stage\"><div class=\"fv-track\">'+list.map(function(p){return '<div class=\"fv-slide\"><img alt=\"\" draggable=\"false\" data-src=\"'+esc(img(p.id,2000))+'\"></div>';}).join('')+'</div></div>'+\n    '<div class=\"fv-top\"><button class=\"fv-x\" data-fv=\"x\" aria-label=\"Close\">'+ICON.x+'</button><div class=\"fv-t\"></div></div>'+\n    '<button class=\"fv-nav p\" data-fv=\"p\" aria-label=\"Previous\">\u2039</button><button class=\"fv-nav n\" data-fv=\"n\" aria-label=\"Next\">\u203a</button>'+\n    '<div class=\"fv-bot\"><div class=\"fv-cap\"></div><button class=\"fv-edit\" data-fv=\"e\">Edit</button></div>';\n  document.body.appendChild(ov);document.body.style.overflow='hidden';\n  var track=ov.querySelector('.fv-track'),stage=ov.querySelector('.fv-stage'),imgs=ov.querySelectorAll('.fv-slide img');\n  var z={s:1,x:0,y:0},W=function(){return stage.clientWidth;};\n  try{history.pushState({fv:1},'');}catch(e){}\n  function load(k){var im=imgs[k];if(im&&!im.src){var s=im.getAttribute('data-src');im.src=s;var low=S.prev[list[k].id];if(low&&!im.complete){im.src=low;var hi=new Image();hi.onload=function(){im.src=s;};hi.src=s;}}}\n  function applyZ(){var im=imgs[i];if(im)im.style.transform='translate('+z.x+'px,'+z.y+'px) scale('+z.s+')';}\n  function resetZ(){z={s:1,x:0,y:0};imgs.forEach(function(im){im.style.transform='';});}\n  function show(k,anim){\n    i=Math.max(0,Math.min(list.length-1,k));resetZ();\n    track.style.transition=anim===false?'none':'transform .25s ease';track.style.transform='translateX('+(-i*100)+'%)';\n    load(i);load(i+1);load(i-1);\n    var p=list[i],st=STAGES.filter(function(s){return s[0]===p.stage;})[0];\n    ov.querySelector('.fv-t').innerHTML=esc(j.title)+'<small>'+(i+1)+' of '+list.length+' \u00b7 '+(st?st[1]:'')+(coverOf(j)===p.id?' \u00b7 Cover':'')+'</small>';\n    ov.querySelector('.fv-cap').textContent=p.caption||'';\n    ov.querySelector('[data-fv=\"p\"]').style.visibility=i>0?'':'hidden';ov.querySelector('[data-fv=\"n\"]').style.visibility=i<list.length-1?'':'hidden';\n  }\n  function close(fromPop){ov.remove();document.body.style.overflow='';document.removeEventListener('keydown',key);window.removeEventListener('popstate',pop);if(!fromPop){try{if(history.state&&history.state.fv)history.back();}catch(e){}}}\n  function pop(){close(true);}\n  function key(e){if(e.key==='Escape')close();else if(e.key==='ArrowRight')show(i+1);else if(e.key==='ArrowLeft')show(i-1);}\n  document.addEventListener('keydown',key);window.addEventListener('popstate',pop);\n  ov.addEventListener('click',function(e){var b=e.target.closest('[data-fv]');if(!b)return;var a=b.getAttribute('data-fv');\n    if(a==='x')close();else if(a==='p')show(i-1);else if(a==='n')show(i+1);else if(a==='e'){var pid=list[i].id;close();setTimeout(function(){photoSheet(pid);},60);}});\n  /* gestures: swipe to change photo, pinch or double-tap to zoom, drag to pan when zoomed, tap to hide the bars */\n  var pts={},g=null,lastTap=0;\n  function two(){var k=Object.keys(pts);return k.length>=2?[pts[k[0]],pts[k[1]]]:null;}\n  stage.addEventListener('pointerdown',function(e){\n    pts[e.pointerId]={x:e.clientX,y:e.clientY};try{stage.setPointerCapture(e.pointerId);}catch(er){}\n    var t=two();\n    if(t){var r=imgs[i].getBoundingClientRect(),bl=r.left-z.x,bt=r.top-z.y,cx=(t[0].x+t[1].x)/2,cy=(t[0].y+t[1].y)/2;\n      g={pinch:true,d0:Math.hypot(t[0].x-t[1].x,t[0].y-t[1].y)||1,s0:z.s,bl:bl,bt:bt,lx:(cx-bl-z.x)/z.s,ly:(cy-bt-z.y)/z.s};track.style.transform='translateX('+(-i*100)+'%)';return;}\n    g={x:e.clientX,y:e.clientY,t:Date.now(),zx:z.x,zy:z.y,moved:false};track.style.transition='none';\n  });\n  stage.addEventListener('pointermove',function(e){\n    if(!pts[e.pointerId]||!g)return;pts[e.pointerId]={x:e.clientX,y:e.clientY};\n    if(g.pinch){var t=two();if(!t)return;var d=Math.hypot(t[0].x-t[1].x,t[0].y-t[1].y),s=Math.max(1,Math.min(5,g.s0*d/g.d0));\n      var cx=(t[0].x+t[1].x)/2,cy=(t[0].y+t[1].y)/2;\n      /* keep the point between the fingers in place */\n      z.x=cx-g.bl-s*g.lx;z.y=cy-g.bt-s*g.ly;z.s=s;applyZ();return;}\n    var dx=e.clientX-g.x,dy=e.clientY-g.y;if(Math.abs(dx)+Math.abs(dy)>8)g.moved=true;\n    if(z.s>1){z.x=g.zx+dx;z.y=g.zy+dy;applyZ();}\n    else track.style.transform='translateX(calc('+(-i*100)+'% + '+dx+'px))';\n  });\n  function up(e){\n    var wasPinch=g&&g.pinch;delete pts[e.pointerId];\n    if(!g)return;\n    if(wasPinch){if(Object.keys(pts).length===0){if(z.s<1.05)resetZ();g=null;}else{var k=Object.keys(pts)[0];g={x:pts[k].x,y:pts[k].y,t:Date.now(),zx:z.x,zy:z.y,moved:true};}return;}\n    var dx=e.clientX-g.x,moved=g.moved,dt=Date.now()-g.t;g=null;\n    if(z.s>1){if(!moved)tap(e);return;}\n    if(moved&&Math.abs(dx)>Math.min(80,W()*0.18)||moved&&dt<250&&Math.abs(dx)>30)show(i+(dx<0?1:-1));else show(i);\n    if(!moved)tap(e);\n  }\n  function tap(e){\n    var now=Date.now();\n    if(now-lastTap<300){lastTap=0;clearTimeout(ov._tt);\n      if(z.s>1)resetZ();else{var s=2.5,im=imgs[i].getBoundingClientRect(),ox=e.clientX-im.left,oy=e.clientY-im.top;\n        z.s=s;z.x=ox*(1-s);z.y=oy*(1-s);applyZ();}\n      return;}\n    lastTap=now;ov._tt=setTimeout(function(){ov.classList.toggle('bare');},310);\n  }\n  stage.addEventListener('pointerup',up);stage.addEventListener('pointercancel',function(e){delete pts[e.pointerId];g=null;show(i);});\n  stage.addEventListener('wheel',function(e){if(!e.ctrlKey)return;e.preventDefault();z.s=Math.max(1,Math.min(5,z.s*(e.deltaY<0?1.1:0.9)));if(z.s===1)resetZ();else applyZ();},{passive:false});\n  show(i,false);\n}\n\nfunction renderKeepScroll(){var y=window.scrollY;render();window.scrollTo(0,y);}\n\nfunction drawProg(){\n  var el=document.getElementById('prog');\n  if(!S.upload){if(el)el.remove();return;}\n  if(!el){el=document.createElement('div');el.id='prog';el.className='prog';document.body.appendChild(el);}\n  var u=S.upload,n=Math.min(u.done+1,u.total);\n  el.innerHTML='<div class=\"wrap\"><div class=\"l\"><span>'+(u.done<u.total?'Uploading '+n+' of '+u.total+'\u2026':'Finishing\u2026')+'</span><span>'+Math.round(u.done/u.total*100)+'%</span></div><div class=\"track\"><div class=\"fill\" style=\"width:'+Math.max(4,u.done/u.total*100)+'%\"></div></div></div>';\n}\n\npicker.addEventListener('change',function(){var f=picker.files;if(f&&f.length)upload(f,pickStage);picker.value='';});\n\n/* ---------- events ---------- */\napp.addEventListener('click',function(e){\n  var m=e.target.closest('[data-m]');if(m){MAT.click(m,e);return;}\n  var t=e.target.closest('[data-act]');if(!t)return;\n  var a=t.getAttribute('data-act');\n  if(a==='tab'){S.tab=t.getAttribute('data-v');store('tfp_tab',S.tab);if(S.tab==='photos')S.view='home';MAT.home();render();window.scrollTo(0,0);return;}\n  if(a==='logout'){logout('');return;}\n  if(a==='new'){newJobSheet();return;}\n  if(a==='filter'){S.filter=t.getAttribute('data-v');render();return;}\n  if(a==='open'){S.jobId=t.getAttribute('data-id');S.view='job';render();window.scrollTo(0,0);return;}\n  if(a==='home'){S.view='home';render();window.scrollTo(0,0);return;}\n  if(a==='photo'){if(Date.now()-DRAG.justDropped<500)return;photoViewer(t.getAttribute('data-id'));return;}\n  if(a==='add'){if(S.upload){toast('Wait for the current upload to finish.');return;}pickStage=t.getAttribute('data-stage');picker.click();return;}\n  if(a==='drive'){if(S.upload){toast('Wait for the current upload to finish.');return;}driveSheet(t.getAttribute('data-stage'));return;}\n  if(a==='tog'){\n    var j=job(),k=t.getAttribute('data-k'),v=!j[k],d={id:j.id,base:{}};d[k]=v;d.base[k]=j[k];\n    if(k==='featured'&&v&&!j.published){d.published=true;}\n    t.classList.toggle('on',v);\n    call('saveJob',d).then(function(r){merge(r);render();\n      toast(k==='published'?(v?'Showing on the website':'Hidden from the website'):(v?'Showing on the homepage':'Removed from the homepage'));\n    }).catch(function(err){t.classList.toggle('on',!v);if(isConflict(err))conflictBox(err,reloadJobs);else toast(err.message,true);});\n    return;\n  }\n  if(a==='deljob'){\n    var jj=job();\n    confirmBox('Delete \u201c'+jj.title+'\u201d?','This removes the job and its '+jj.photos.length+' photo'+(jj.photos.length===1?'':'s')+' from the website and moves them to the trash in Google Drive.','Delete job').then(function(ok){\n      if(!ok)return;\n      call('deleteJob',{id:jj.id}).then(function(){S.jobs=S.jobs.filter(function(x){return x.id!==jj.id;});S.view='home';render();toast('Job deleted');})\n        .catch(function(err){toast(err.message,true);});\n    });\n  }\n});\n\n/* ================= Quotes, materials, orders, spending ================= */\nvar MAT=(function(){\n  var M={pricing:TAKEOFF.cleanPricing(null),est:null,repairs:{min:0,items:[]},inspections:[],tags:[],crewJobs:[],crewLoaded:false,execUrl:'',loaded:false,quotes:[],orders:[],prices:[],settings:{suppliers:[],abc:{}},owner:'',\n    view:'list',qid:null,qfilter:'new',money:'orders',mview:'home',draft:null};\n  var PK=TAKEOFF.PACKAGES;\n  var ST_LABEL={new:'New',approved:'Approved',ordered:'Ordered',done:'Done',archived:'Archived'};\n  var DELIVERY=[['OTR','Roof load'],['OTG','Ground drop'],['CPU','Pick up']];\n  var GEAR='<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z\"/></svg>';\n\n  /* ---------- helpers ---------- */\n  function money(n,cents){n=Number(n)||0;if(n<0)return '\\u2212'+money(-n,cents);return '$'+n.toLocaleString('en-US',{minimumFractionDigits:cents===false?0:2,maximumFractionDigits:cents===false?0:2});}\n  function k(n){n=Number(n)||0;return n>=1000?'$'+(Math.round(n/100)/10).toString().replace(/\\.0$/,'')+'k':money(n,false);}\n  function q(){for(var i=0;i<M.quotes.length;i++)if(M.quotes[i].id===M.qid)return M.quotes[i];return null;}\n  function priceMap(){var o={};M.prices.forEach(function(p){o[p.key]=p;});return o;}\n  function dateStr(iso){if(!iso)return'';var d=new Date(iso);if(isNaN(d))return String(iso).slice(0,10);return d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:d.getFullYear()===new Date().getFullYear()?undefined:'numeric'});}\n  function sqft(qq){return (qq.roofs||[]).reduce(function(n,r){return n+(Number(r.s)||0);},0);}\n  function range(qq,i){var r=(qq.ranges||[])[i];return r&&r[1]?money(r[0],false)+'\u2013'+money(r[1],false):'';}\n  function mid(qq,i){var r=(qq.ranges||[])[i];return r&&r[1]?Math.round((r[0]+r[1])/2/100)*100:0;}\n  function townOf(a){var p=String(a||'').split(',');return p.length>=3?p[p.length-2].trim():'';}\n  function parseAddr(a){var p=String(a||'').split(',').map(function(x){return x.trim();});var o={line1:p[0]||'',city:'',state:'CT',postal:''};\n    if(p.length>=3){o.city=p[p.length-2];var m=p[p.length-1].match(/([A-Z]{2})\\s*(\\d{5})?/i);if(m){o.state=m[1].toUpperCase();o.postal=m[2]||'';}}else if(p.length===2){o.city=p[1];}\n    return o;}\n  function orderSpend(o){return o.status==='Canceled'?0:(o.actualTotal!==''&&o.actualTotal!=null?Number(o.actualTotal):Number(o.total)||0);}\n  function lineTotal(l){return (Number(l.qty)||0)*(Number(l.price)||0);}\n  function addDays(n){var d=new Date();var added=0;while(added<n){d.setDate(d.getDate()+1);if(d.getDay()!==0&&d.getDay()!==6)added++;}return d.toISOString().slice(0,10);}\n  function mergeQ(r){for(var i=0;i<M.quotes.length;i++)if(M.quotes[i].id===r.id){M.quotes[i]=r;return r;}M.quotes.unshift(r);return r;}\n  function fresh(qq){\n    // keep line prices in step with the price list unless you typed a price for that job\n    var pm=priceMap();\n    return (qq.lines||[]).map(function(l){var p=pm[l.key];var c=Object.assign({},l);\n      if(p&&!l.custom){if(!l.priceManual)c.price=p.price;if(!l.itemManual){c.abcItem=p.abcItem;c.uom=p.uom;}c.name=p.name;c.unit=p.unit;}return c;});\n  }\n  function err(e){toast(e.message||String(e),true);}\n  function units(u,n){u=String(u||'');if(n===1||u==='each'||!u||/^[A-Z]+$/.test(u))return u;if(/(x|ch|sh|s)$/.test(u))return u+'es';return u+'s';}\n\n  function load(){return call('matList').then(function(d){M.quotes=d.quotes||[];M.orders=d.orders||[];M.prices=d.prices||[];M.settings=d.settings||M.settings;M.pricing=d.pricing||TAKEOFF.cleanPricing(null);M.owner=d.owner||'';M.repairs=d.repairs||M.repairs;M.inspections=d.inspections||[];M.tags=d.tags||[];M.execUrl=d.execUrl||'';M.loaded=true;})\n    .catch(function(e){M.loaded=false;toast(e.message,true);});}\n\n  /* ---------- router ---------- */\n  function renderMat(){\n    if(S.tab==='jobs')return renderCrew();\n    if(!M.loaded){\n      if(M.failed){app.innerHTML=bar('<div class=\"brand\">TEAM <b>FORTE</b></div>')+'<div class=\"wrap\"><div class=\"empty\"><b>Couldn\\u2019t load</b>Check your signal and try again.<div class=\"mt\"><button class=\"btn ghost\" data-m=\"retry\">Try again</button></div></div></div>';return;}\n      app.innerHTML=bar('<div class=\"brand\">TEAM <b>FORTE</b></div>')+'<div class=\"loading\"><div class=\"spin dk\"></div></div>';\n      if(!M.loading){M.loading=true;load().then(function(){M.loading=false;M.failed=!M.loaded;render();});}\n      return;\n    }\n    if(S.tab==='quotes'){if(M.view==='quote'&&q())return renderQuote();if(M.view==='new')return renderNew();if(M.view==='pricing')return renderPricing();M.view='list';return renderQuotes();}\n    if(M.mview==='settings')return renderSettings();\n    return renderMoney();\n  }\n\n  /* ---------- quotes list ---------- */\n  function renderQuotes(){\n    var counts={new:0,approved:0,ordered:0,done:0};\n    M.quotes.forEach(function(x){if(counts[x.status]!=null)counts[x.status]++;});\n    var list=M.quotes.filter(function(x){return x.status===M.qfilter;});\n    var warr=M.quotes.filter(function(x){return x.status==='done'&&!x.warrantyDone&&x.type!=='repair';}).length;\n    var dep=M.quotes.filter(function(x){return x.signedAt&&x.depositStatus==='requested';}).length;\n    var h=bar('<div class=\"brand\">QUOTES</div><button class=\"icon-btn\" data-m=\"pricing\" aria-label=\"Quote prices\">'+GEAR+'</button><button class=\"icon-btn\" data-m=\"newest\" style=\"margin-left:10px\">'+ICON.plus+'New estimate</button>')+'<div class=\"wrap\">'+\n      '<div class=\"chips mt\">'+[['new','New'],['approved','Approved'],['ordered','Ordered'],['done','Done']].map(function(f){\n        return '<button class=\"chip'+(M.qfilter===f[0]?' on':'')+'\" data-m=\"qf\" data-v=\"'+f[0]+'\">'+f[1]+(counts[f[0]]?' ('+counts[f[0]]+')':'')+'</button>';}).join('')+'<button class=\"chip\" data-m=\"colors\">Shingle colors</button></div>'+\n      (warr?'<div class=\"note\">'+warr+' finished job'+(warr===1?'':'s')+' still need'+(warr===1?'s':'')+' the warranty registered. See Done.</div>':'')+\n      (dep?'<div class=\"note\">'+dep+' signed job'+(dep===1?' is':'s are')+' waiting on a deposit.</div>':'');\n    if(!list.length){\n      h+='<div class=\"empty\"><b>'+(M.qfilter==='new'?'No new quotes':'Nothing here yet')+'</b>'+\n        (M.qfilter==='new'?'Quotes from the website\u2019s instant quote show up here on their own. You can also paste a quote link.':'Approve a quote to start its materials list.')+\n        (M.qfilter==='new'?'<div class=\"mt\"><button class=\"btn ghost\" data-m=\"addlink\">Paste a quote link</button></div>':'')+'</div>';\n    }else{\n      h+=list.map(function(x){\n        var pk=PK[x.pick];var pr=x.contractPrice?money(x.contractPrice,false):(x.pick>=0?range(x,x.pick):range(x,0));\n        return '<button class=\"q\" data-m=\"openq\" data-id=\"'+esc(x.id)+'\"><div class=\"top\"><div style=\"min-width:0\"><div class=\"nm\">'+esc(x.name||(x.source==='app'?'Customer':'Website visitor'))+'</div>'+\n          '<div class=\"ad\">'+esc(x.address||'')+'</div></div><div class=\"rg money\">'+esc(pr)+'</div></div>'+\n          '<div class=\"pills\"><span class=\"pill '+x.status+'\">'+ST_LABEL[x.status]+'</span>'+\n          (x.type==='repair'?'<span class=\"pill\">Repair \u00b7 '+(x.items||[]).length+' item'+((x.items||[]).length===1?'':'s')+'</span>':'<span class=\"pill\">'+(sqft(x)>0?Math.round(sqft(x)).toLocaleString()+' sq ft':'Measure needed')+'</span>')+\n          (x.signedAt?'<span class=\"pill done\">\u2713 Signed</span>':x.proposalSentAt?'<span class=\"pill\">Sent for signature</span>':'')+\n          (pk?'<span class=\"pill\">OC '+esc(pk.label)+(x.color?' \u00b7 '+esc(x.color):'')+'</span>':'')+\n          (x.lead&&x.lead.inspectionDay?'<span class=\"pill\" style=\"background:#FFE8E3;color:#B4321F\">Inspection requested</span>':'')+\n          '<span class=\"pill\">'+(x.source==='app'?'App estimate \u00b7 ':x.source==='website'?'Website \u00b7 ':'')+esc(x.id)+' \u00b7 '+dateStr(x.created)+'</span></div></button>';\n      }).join('');\n    }\n    app.innerHTML=h+'</div>';\n  }\n\n  function addLinkSheet(){\n    var ov=sheet('<h3>Add a quote'+closeBtn()+'</h3><p class=\"sub\">Paste the quote link from the customer\u2019s GoHighLevel contact (Quote Link field) or the quote email.</p>'+\n      '<textarea class=\"in\" id=\"ql\" placeholder=\"https://team-forte.com/quote#q=\u2026\" style=\"min-height:110px\"></textarea><button class=\"btn block mt\" id=\"qlb\">Add quote</button>');\n    ov.querySelector('#qlb').onclick=function(){var b=this;var v=ov.querySelector('#ql').value.trim();if(!v)return;b.disabled=true;b.textContent='Adding\u2026';\n      call('addQuote',{link:v}).then(function(r){mergeQ(r);closeSheet();M.qid=r.id;M.view='quote';M.qfilter=r.status;render();window.scrollTo(0,0);toast('Quote added');})\n        .catch(function(e){b.disabled=false;b.textContent='Add quote';err(e);});};\n  }\n\n  /* ---------- quote detail ---------- */\n  function renderQuote(){\n    var x=q();\n    var h=bar('<button class=\"back\" data-m=\"back\">'+ICON.back+'Quotes</button><div class=\"bar-title\">'+esc(x.name||x.id)+'</div>')+'<div class=\"wrap\">';\n    var rep=x.type==='repair';\n    h+='<div class=\"card\"><h2>'+esc(x.name||(x.source==='app'?'Customer':'Website visitor'))+' <span><span class=\"pill '+x.status+'\">'+ST_LABEL[x.status]+'</span> <button class=\"link\" style=\"color:var(--navy);font-size:13px;font-weight:700;padding:4px\" data-m=\"editcust\">Edit</button></span></h2>'+\n      (x.phone?kv('Phone','<a href=\"tel:'+esc(x.phone.replace(/[^\\d+]/g,''))+'\" target=\"_top\">'+esc(x.phone)+'</a>'):'')+\n      (x.email?kv('Email','<a href=\"mailto:'+esc(x.email)+'\" target=\"_top\">'+esc(x.email)+'</a>'):'')+\n      kv('Address','<a href=\"https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(x.address||(x.lat+','+x.lng))+'\" target=\"_blank\" rel=\"noopener\">'+esc(x.address||'Map')+'</a>')+\n      (x.lead?(x.lead.inspectionDay?kv('Inspection request','<b>'+esc(x.lead.inspectionDay+(x.lead.inspectionWindow?', '+x.lead.inspectionWindow:''))+'</b>'):'')+\n        (x.lead.package?kv('Picked',esc(x.lead.package+(x.lead.color?' \u00b7 '+x.lead.color:''))):'')+\n        (x.lead.timeline?kv('Timeline',esc(x.lead.timeline)):'')+(x.lead.layers?kv('Shingle layers',esc(x.lead.layers)):'')+\n        (x.lead.notes?kv('Notes',esc(x.lead.notes)):'')+(x.lead.smsUpdates?kv('Texts OK',esc(x.lead.smsUpdates)):''):'')+\n      kv('Quote',esc(x.id)+' \u00b7 '+dateStr(x.created))+\n      (x.roofs||[]).map(function(r){return kv(esc(r.n||'Roof'),Math.round(r.s).toLocaleString()+' sq ft \u00b7 '+esc(r.p||'pitch ?'));}).join('')+\n      (x.layers>1?kv('Layers to tear off',String(x.layers)):'')+\n      (x.link&&!rep?'<div class=\"acts\"><button class=\"btn\" data-m=\"share\">Send quote</button><a class=\"btn ghost\" href=\"'+esc(x.link)+'\" target=\"_blank\" rel=\"noopener\">View quote page</a></div>':'')+\n      ghlLine(x)+'</div>';\n    if(x.status==='new'){\n      h+=measCard(x);\n      if(rep)h+=repairCard(x);\n      h+=proposalCard(x)+changeOrdersCard(x)+paymentsCard(x);\n      h+=rep?approveRepairCard(x):approveCard(x);\n      h+=inspectionCard(x);\n    }else{\n      var jobTabs=[['money','Money'],['roof','Roof & materials'],['photos','Photos']];\n      var curTab=jobTabs.some(function(t){return t[0]===M.jobTab;})?M.jobTab:'money';\n      h+='<div class=\"seg\" style=\"margin:12px 0\" role=\"tablist\">'+jobTabs.map(function(t){return '<button type=\"button\" class=\"'+(t[0]===curTab?'on':'')+'\" data-m=\"jtab\" data-v=\"'+t[0]+'\">'+t[1]+'</button>';}).join('')+'</div>';\n      if(curTab==='money')h+=proposalCard(x)+changeOrdersCard(x)+paymentsCard(x)+scheduleCard(x)+profitCard(x);\n      else if(curTab==='roof')h+=(rep?measCard(x)+repairCard(x):'')+jobCards(x);\n      else h+=inspectionCard(x)+(x.status==='done'?wrapCard(x):'');\n      if(isOwner()&&x.signedAt&&!x.cancelledAt)h+='<details class=\"card more\"><summary>Other actions</summary><p class=\"hint\">Only if the customer has cancelled in writing. This archives the job.</p><button class=\"btn danger block mt\" data-m=\"cxl\">Customer cancelled</button></details>';\n    }\n    h+='</div>';\n    app.innerHTML=h;\n    wireQuote(x);\n    var ds=document.getElementById('depseg');\n    if(ds)ds.onclick=function(e){var b=e.target.closest('[data-dep]');if(!b||b.classList.contains('on'))return;saveQ({depositStatus:b.getAttribute('data-dep')},b.getAttribute('data-dep')==='paid'?'Deposit marked paid':'Saved');};\n  }\n\n  /* ----- roof measurements without approving + tap-to-measure on the satellite photo ----- */\n  var MT_TYPES=[['ridge','Ridge','#FF5440'],['hip','Hip','#FFB020'],['valley','Valley','#3DA5FF'],['eave','Eave','#35C46A'],['rake','Rake','#C77DFF']];\n  var MT_KEY={ridge:'ridges',hip:'hips',valley:'valleys',eave:'eaves',rake:'rakes'};\n  function mtColor(t){for(var i=0;i<MT_TYPES.length;i++)if(MT_TYPES[i][0]===t)return MT_TYPES[i][2];return '#fff';}\n  function mtLabel(t){for(var i=0;i<MT_TYPES.length;i++)if(MT_TYPES[i][0]===t)return MT_TYPES[i][1];return t;}\n  function mtRise(p){return TAKEOFF.pitchRise(p)||0;}\n  /* Ridges and eaves are level, so the photo length is the real length. Hips and valleys run diagonally down the slope; rakes run straight down it. */\n  function mtTrue(t,plan,pitch){var r=mtRise(pitch)/12;if(t==='hip'||t==='valley')return plan*Math.sqrt(1+r*r/2);if(t==='rake')return plan*Math.sqrt(1+r*r);return plan;}\n  function mtFeet(pts){var ft=0,R=20902231,rad=Math.PI/180;\n    for(var i=1;i<pts.length;i++){var a=pts[i-1],b=pts[i],dLat=(b[0]-a[0])*rad,dLng=(b[1]-a[1])*rad;\n      var h=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(a[0]*rad)*Math.cos(b[0]*rad)*Math.sin(dLng/2)*Math.sin(dLng/2);\n      ft+=2*R*Math.asin(Math.min(1,Math.sqrt(h)));}\n    return ft;}\n  function mtTotals(lines){var t={};(lines||[]).forEach(function(l){t[l.t]=(t[l.t]||0)+(Number(l.len)||0);});return t;}\n  function applyTraced(m,lines){\n    var t=mtTotals(lines);m.est=Object.assign({},m.est||{});\n    Object.keys(MT_KEY).forEach(function(k){if(t[k]>0){m[MT_KEY[k]]=Math.round(t[k]);delete m.est[MT_KEY[k]];}});\n    m.traced=lines||[];return m;}\n  function emptyMeas(){return {area:0,eaves:0,rakes:0,ridges:0,hips:0,valleys:0,pitch:'',roofs:[],est:{}};}\n  /* Measurements for a quote: saved numbers once approved, otherwise the estimate from the roof outline, with any lines measured on the photo on top */\n  function measFor(x){\n    var saved=x.meas||{},m;\n    if(x.status!=='new'&&saved.area)m=JSON.parse(JSON.stringify(saved));\n    else m=(x.roofs&&x.roofs.length)?TAKEOFF.estimate(x.roofs):emptyMeas();\n    if(!m.pitch&&saved.pitch)m.pitch=saved.pitch;\n    return applyTraced(m,saved.traced||[]);\n  }\n  function capBundles(m){var lf=(Number(m.ridges)||0)+(Number(m.hips)||0);return {lf:Math.round(lf),bundles:Math.ceil(lf*1.05/33)};}\n  function measCard(x){\n    var m=measFor(x),est=m.est||{},tr=m.traced||[],hasRoof=!!m.area;\n    function tag(k){return est[k]?'<i class=\"mtag\">est.</i>':(m[k]&&tr.some(function(l){return MT_KEY[l.t]===k;})?'<i class=\"mtag ok\">measured</i>':'');}\n    function row(k,label){if(!hasRoof&&!m[k])return '';return kv(label+tag(k),m[k]?Math.round(m[k]).toLocaleString()+' ft':'\u2014');}\n    var cap=capBundles(m);\n    var h='<div class=\"card\"><h2>Roof measurements <small>no approval needed</small></h2>';\n    if(hasRoof){\n      h+=kv('Roof area',Math.round(m.area).toLocaleString()+' sq ft \u00b7 '+(Math.round(m.area/10)/10)+' squares');\n      (m.roofs||[]).length>1&&(m.roofs||[]).forEach(function(r){h+=kv('&nbsp;&nbsp;'+esc(r.name),Math.round(r.sqft).toLocaleString()+' sq ft \u00b7 '+esc(r.pitch||'pitch ?'));});\n      h+=kv('Main pitch',esc(m.pitch||'?'));\n    }\n    h+=row('ridges','Ridges')+row('hips','Hips')+row('valleys','Valleys')+row('eaves','Eaves')+row('rakes','Rakes');\n    if(cap.lf)h+=kv('Hip &amp; ridge cap','<span class=\"money\">'+cap.bundles+' bundle'+(cap.bundles===1?'':'s')+'</span> <span class=\"hint\">('+cap.lf+' LF + 5%, 33 LF each)</span>');\n    if(['ridges','hips','valleys','eaves','rakes'].some(function(k){return est[k]&&m[k];}))\n      h+='<p class=\"hint\"><b>est.</b> = rough guess from the roof outline, not measured. For a repair, measure it on the satellite photo.</p>';\n    if(!hasRoof&&!tr.length)h+='<p class=\"hint\">Measure the ridges, hips or other lines you need on the satellite photo.</p>';\n    h+='<button class=\"btn dark block mt\" data-m=\"measuretool\">'+(tr.length?'Edit measured lines ('+tr.length+')':'Measure on satellite photo')+'</button>';\n    if(!canMeasureHere())h+='<p class=\"hint\">Needs the Google Maps key (Quotes \u203a Quote prices).</p>';\n    return h+'</div>';\n  }\n  function measureTool(){\n    var x=q();\n    if(!canMeasureHere()){toast('Add the Google Maps key under Quote prices first.',true);return;}\n    var base=measFor(x);\n    var st={type:'ridge',pitch:base.pitch||'6/12',lines:JSON.parse(JSON.stringify((x.meas&&x.meas.traced)||[])),cur:[],dirty:false,map:null,objs:[],curObjs:[]};\n    var pitches=[];for(var p=0;p<=18;p++)pitches.push(p+'/12');\n    if(pitches.indexOf(st.pitch)<0)pitches.push(st.pitch);\n    var ov=document.createElement('div');ov.className='mz';ov.id='mz';\n    ov.innerHTML='<div class=\"mz-top\"><button type=\"button\" class=\"mz-btn\" data-z=\"close\" aria-label=\"Close\">'+ICON.x+'</button><b>Measure roof</b><button type=\"button\" class=\"mz-btn mz-save\" data-z=\"save\">Save</button></div>'+\n      '<div class=\"mz-map\" id=\"mzmap\"><div class=\"mz-load\">Loading satellite photo\u2026</div></div>'+\n      '<div class=\"mz-panel\"><div class=\"mz-types\" id=\"mztypes\">'+MT_TYPES.map(function(t){return '<button type=\"button\" data-zt=\"'+t[0]+'\"><i style=\"background:'+t[2]+'\"></i>'+t[1]+'</button>';}).join('')+'</div>'+\n      '<div class=\"mz-read\" id=\"mzread\"></div>'+\n      '<div class=\"mz-acts\"><button type=\"button\" class=\"btn ghost\" data-z=\"undo\">Undo point</button><button type=\"button\" class=\"btn\" data-z=\"finish\">Finish line</button></div>'+\n      '<label class=\"mz-pitch\">Pitch <select id=\"mzpitch\">'+pitches.map(function(v){return '<option'+(v===st.pitch?' selected':'')+'>'+esc(v)+'</option>';}).join('')+'</select><span>used for hips, valleys and rakes</span></label>'+\n      '<div id=\"mzlist\"></div></div>';\n    document.body.appendChild(ov);document.body.style.overflow='hidden';\n    function g(id){return ov.querySelector('#'+id);}\n    function clearObjs(a){a.forEach(function(o){o.setMap(null);});a.length=0;}\n    function ll(p){return {lat:p[0],lng:p[1]};}\n    function label(map,pos,text,color){return new google.maps.Marker({map:map,position:pos,clickable:false,icon:{path:google.maps.SymbolPath.CIRCLE,scale:0},label:{text:text,color:'#fff',fontSize:'12px',fontWeight:'800',className:'mz-lbl'}});}\n    function drawLines(){\n      if(!st.map)return;clearObjs(st.objs);\n      st.lines.forEach(function(l,i){\n        var c=mtColor(l.t);\n        st.objs.push(new google.maps.Polyline({map:st.map,path:l.pts.map(ll),strokeColor:c,strokeWeight:4,strokeOpacity:.95,clickable:false}));\n        var mid=l.pts[Math.floor((l.pts.length-1)/2)],nxt=l.pts[Math.floor((l.pts.length-1)/2)+1]||mid;\n        st.objs.push(label(st.map,{lat:(mid[0]+nxt[0])/2,lng:(mid[1]+nxt[1])/2},Math.round(l.len)+' ft',c));\n      });\n    }\n    function drawCur(){\n      if(!st.map)return;clearObjs(st.curObjs);\n      var c=mtColor(st.type);\n      if(st.cur.length>1)st.curObjs.push(new google.maps.Polyline({map:st.map,path:st.cur.map(ll),strokeColor:c,strokeWeight:3,strokeOpacity:0,clickable:false,\n        icons:[{icon:{path:'M 0,-1 0,1',strokeOpacity:1,strokeColor:c,scale:3},offset:'0',repeat:'12px'}]}));\n      st.cur.forEach(function(p,i){\n        var mk=new google.maps.Marker({map:st.map,position:ll(p),draggable:true,icon:{path:google.maps.SymbolPath.CIRCLE,scale:7,fillColor:'#fff',fillOpacity:1,strokeColor:c,strokeWeight:3}});\n        mk.addListener('drag',function(e){st.cur[i]=[e.latLng.lat(),e.latLng.lng()];readout();});\n        mk.addListener('dragend',function(){drawCur();});\n        st.curObjs.push(mk);\n      });\n    }\n    function readout(){\n      var plan=mtFeet(st.cur),len=mtTrue(st.type,plan,st.pitch);\n      g('mzread').innerHTML=st.cur.length?'<b>'+mtLabel(st.type)+':</b> '+st.cur.length+' point'+(st.cur.length===1?'':'s')+(st.cur.length>1?' \u00b7 <b>'+Math.round(len*10)/10+' ft</b>'+(Math.abs(len-plan)>.05?' <span>('+Math.round(plan*10)/10+' ft on the photo)</span>':''):' \u00b7 tap the other end'):\n        'Pick a type, then tap each end of the line on the photo. Tap more points to follow a bend. Drag a point to fine-tune it.';\n      Array.prototype.forEach.call(g('mztypes').children,function(b){b.classList.toggle('on',b.getAttribute('data-zt')===st.type);});\n    }\n    function list(){\n      var t=mtTotals(st.lines),m=applyTraced(JSON.parse(JSON.stringify(base)),st.lines),cap=capBundles(m);\n      var h=st.lines.length?'<div class=\"mz-ls\">'+st.lines.map(function(l,i){return '<div class=\"mz-li\"><i style=\"background:'+mtColor(l.t)+'\"></i><span>'+mtLabel(l.t)+'</span><b>'+Math.round(l.len*10)/10+' ft</b><button type=\"button\" data-zd=\"'+i+'\" aria-label=\"Delete line\">'+ICON.x+'</button></div>';}).join('')+'</div>':'';\n      var tot=MT_TYPES.filter(function(k){return t[k[0]];}).map(function(k){return k[1]+'s '+Math.round(t[k[0]])+' ft';}).join(' \u00b7 ');\n      if(tot)h+='<p class=\"mz-tot\">'+tot+'</p>';\n      if(cap.lf)h+='<p class=\"mz-tot\"><b>Hip &amp; ridge cap: '+cap.bundles+' bundle'+(cap.bundles===1?'':'s')+'</b> ('+cap.lf+' LF + 5%)'+(function(){var e=m.est||{},w=[];if(e.ridges&&m.ridges)w.push('ridges');if(e.hips&&m.hips)w.push('hips');return w.length?' \u00b7 '+w.join(' &amp; ')+' still estimated':'';})()+'</p>';\n      g('mzlist').innerHTML=h;\n    }\n    function refresh(){readout();list();drawCur();drawLines();}\n    function finish(){\n      if(st.cur.length<2){toast('Tap both ends of the line first.',true);return false;}\n      var plan=mtFeet(st.cur);\n      st.lines.push({t:st.type,pts:st.cur.map(function(p){return [Math.round(p[0]*1e7)/1e7,Math.round(p[1]*1e7)/1e7];}),plan:Math.round(plan*10)/10,len:Math.round(mtTrue(st.type,plan,st.pitch)*10)/10,pitch:st.pitch});\n      st.cur=[];st.dirty=true;refresh();return true;\n    }\n    function close(){ov.remove();document.body.style.overflow='';}\n    function save(){\n      if(st.cur.length>1)finish();\n      var x2=q(),saved=x2.meas||{},m,args;\n      if(x2.status!=='new'&&x2.type!=='repair'&&saved.area){\n        m=applyTraced(JSON.parse(JSON.stringify(saved)),st.lines);\n        args={meas:m,lines:TAKEOFF.lines(m,x2.pick,priceMap(),x2.lines)};\n      }else{\n        m=applyTraced(measFor(Object.assign({},x2,{meas:{}})),st.lines);\n        if(!m.pitch)m.pitch=st.pitch;\n        args={meas:m};\n      }\n      var b=ov.querySelector('[data-z=save]');b.disabled=true;b.textContent='Saving\u2026';\n      saveQ(args,args.lines?'Saved. Materials list updated.':'Measurements saved').then(close).catch(function(){b.disabled=false;b.textContent='Save';});\n    }\n    ov.addEventListener('click',function(e){\n      var tb=e.target.closest('[data-zt]');if(tb){if(st.cur.length>1&&tb.getAttribute('data-zt')!==st.type)finish();st.type=tb.getAttribute('data-zt');refresh();return;}\n      var d=e.target.closest('[data-zd]');if(d){st.lines.splice(+d.getAttribute('data-zd'),1);st.dirty=true;refresh();return;}\n      var z=e.target.closest('[data-z]');if(!z)return;var a=z.getAttribute('data-z');\n      if(a==='undo'){if(st.cur.length)st.cur.pop();else if(st.lines.length){st.cur=st.lines.pop().pts;st.dirty=true;}refresh();return;}\n      if(a==='finish'){finish();return;}\n      if(a==='save'){save();return;}\n      if(a==='close'){if(!st.dirty&&!st.cur.length){close();return;}\n        confirmBox('Close without saving?','The lines you measured will be lost.','Close').then(function(ok){if(ok)close();});return;}\n    });\n    g('mzpitch').onchange=function(){st.pitch=this.value;st.lines.forEach(function(l){l.pitch=st.pitch;l.len=Math.round(mtTrue(l.t,l.plan||mtFeet(l.pts),st.pitch)*10)/10;});st.dirty=true;refresh();};\n    readout();list();\n    loadMaps().then(function(){\n      if(x.lat&&x.lng)return {lat:+x.lat,lng:+x.lng};\n      if(!x.address)throw new Error('This quote has no address.');\n      return findPlace(x.address).then(function(p){return {lat:p.location.lat(),lng:p.location.lng()};});\n    }).then(function(c){\n      if(!document.getElementById('mz'))return;\n      var el=g('mzmap');el.innerHTML='';\n      var map=new google.maps.Map(el,{mapTypeId:'satellite',center:c,zoom:21,tilt:0,heading:0,disableDefaultUI:true,zoomControl:true,gestureHandling:'greedy',clickableIcons:false,draggableCursor:'crosshair'});\n      st.map=map;\n      (x.roofs||[]).forEach(function(r){\n        var o=r.o||r.outline,rs=[];\n        if(typeof o==='string')rs=[TAKEOFF.decodePoly(o)];else if(Array.isArray(o)&&o.length)rs=typeof o[0]==='string'?o.map(TAKEOFF.decodePoly):(Array.isArray(o[0])&&typeof o[0][0]==='number'?[o]:o);\n        rs.forEach(function(ring){if(ring&&ring.length>2)new google.maps.Polygon({map:map,paths:ring.map(ll),strokeColor:'#FFFFFF',strokeOpacity:.7,strokeWeight:1.5,fillOpacity:0,clickable:false});});\n      });\n      map.addListener('click',function(e){st.cur.push([e.latLng.lat(),e.latLng.lng()]);readout();drawCur();});\n      if(st.lines.length){var b=new google.maps.LatLngBounds();st.lines.forEach(function(l){l.pts.forEach(function(p){b.extend(ll(p));});});map.fitBounds(b,60);\n        google.maps.event.addListenerOnce(map,'idle',function(){if(map.getZoom()>21)map.setZoom(21);});}\n      refresh();\n    }).catch(function(er){var el=g('mzmap');if(el)el.innerHTML='<div class=\"mz-load\">'+esc((er&&er.message)||'Couldn\u2019t load the satellite photo.')+'</div>';});\n  }\n\n  /* ----- Connecticut contract: dates, cancel window, change orders, add-ons, reminders ----- */\n  function coSigned(x){return (x.changeOrders||[]).filter(function(c){return c.status==='signed';}).reduce(function(n,c){return n+(Number(c.total)||0);},0);}\n  function jobTotal(x){return Math.round(((Number(x.contractPrice)||0)+coSigned(x))*100)/100;}\n  function ymdOf(d){return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);}\n  function todayYmd(){return ymdOf(new Date());}\n  function addDaysYmd(ymd,n){var p=String(ymd).split('-');return ymdOf(new Date(+p[0],+p[1]-1,+p[2]+n));}\n  function prettyDay(ymd){if(!ymd)return '';var p=String(ymd).split('-');return new Date(+p[0],+p[1]-1,+p[2]).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});}\n  function inCancel(x){return !!(x.signedAt&&x.cancelBy&&!x.cancelledAt&&todayYmd()<=x.cancelBy);}\n  function contractGaps(){var s=M.settings||{},c=s.company||{},k=s.contract||{},m=[];if(!c.legal)m.push('legal name');if(!c.hic)m.push('HIC number');if(!c.mailing)m.push('mailing address');if(!k.signerName||!k.sigId)m.push('your signature');return m;}\n  function contractLines(x){\n    var h='';\n    if(x.startDate||x.endDate)h+=kv('Contract dates',esc(prettyDay(x.startDate))+' \u2192 '+esc(prettyDay(x.endDate)));\n    (x.chosen||[]).forEach(function(a){h+=kv('Added: '+esc(a.name),'<span class=\"money\">'+money(a.total)+'</span>');});\n    if(x.cancelledAt)h+='<div class=\"note warn\">Customer cancelled '+dateStr(x.cancelledAt)+'.</div>';\n    else if(x.cancelBy)h+=inCancel(x)?'<div class=\"note warn\"><b>Cancellation period:</b> the customer can cancel until midnight '+esc(prettyDay(x.cancelBy))+'. Wait until after that to order materials.</div>':kv('Cancellation period','ended '+esc(prettyDay(x.cancelBy)));\n    return h;\n  }\n  function changeOrdersCard(x){\n    if(!x.signedAt||x.cancelledAt)return '';\n    var cos=(x.changeOrders||[]).filter(function(c){return c.status!=='void';}),add=coSigned(x);\n    var h='<div class=\"card\"><h2>Change orders <small>'+(add?(add>0?'+':'')+money(add)+' signed':'extra work the customer signs')+'</small></h2>';\n    if(!cos.length)h+='<p class=\"hint\">Found rotten decking or other extra work? Write it up here. The customer signs it on their phone and the job total updates.</p>';\n    cos.forEach(function(c){\n      var st={draft:'Draft',sent:'Waiting for signature',signed:'Signed '+dateStr(c.signedAt)+' by '+esc(c.signerName||'')}[c.status]||c.status;\n      h+='<div class=\"co\"><div class=\"kv\" style=\"border-top:0\"><span><b style=\"color:var(--ink)\">'+esc(c.id)+' \u00b7 '+esc(c.title)+'</b><br>'+st+'</span><b class=\"money\">'+money(c.total)+'</b></div><div class=\"acts\">'+\n        (c.status==='signed'?(c.pdfId?'<a class=\"btn ghost\" href=\"https://drive.google.com/file/d/'+esc(c.pdfId)+'/view\" target=\"_blank\" rel=\"noopener\">Signed copy</a>':'')+'<span></span>':\n          '<button class=\"btn ghost\" data-m=\"coedit\" data-co=\"'+esc(c.id)+'\">Edit</button><button class=\"btn\" data-m=\"cosend\" data-co=\"'+esc(c.id)+'\">'+(c.status==='sent'?'Send again':'Send to sign')+'</button>')+'</div></div>';\n    });\n    if(add)h+=kv('Job total with change orders','<span class=\"money\">'+money(jobTotal(x))+'</span>');\n    return h+'<button class=\"btn ghost block mt\" data-m=\"conew\">'+ICON.plus+'New change order</button></div>';\n  }\n  function coRow(it){return '<div class=\"row coi\" style=\"margin-top:8px\"><input class=\"in\" data-cn placeholder=\"What\" value=\"'+esc(it.name||'')+'\"><input class=\"in money\" data-cq inputmode=\"decimal\" placeholder=\"Qty\" value=\"'+(it.qty!=null?it.qty:'')+'\" style=\"flex:0 0 64px\"><input class=\"in\" data-cu placeholder=\"Unit\" value=\"'+esc(it.unit||'each')+'\" style=\"flex:0 0 70px\"><input class=\"in money\" data-cp inputmode=\"decimal\" placeholder=\"$ each\" value=\"'+(it.price!=null?it.price:'')+'\" style=\"flex:0 0 86px\"></div>';}\n  function coSheet(coId){\n    var x=q(),c=coId?(x.changeOrders||[]).filter(function(z){return z.id===coId;})[0]:null,k=M.settings.contract||{};\n    var ov=sheet('<h3>'+(c?'Change order '+esc(c.id):'New change order')+closeBtn()+'</h3>'+\n      '<label class=\"f\">Title</label><input class=\"in\" id=\"cot\" maxlength=\"100\" value=\"'+esc(c?c.title:'')+'\" placeholder=\"Rotted decking replaced\">'+\n      '<label class=\"f\">Lines <span class=\"hint\" style=\"font-weight:500\">\u00b7 a negative price is a credit</span></label><div id=\"coitems\">'+((c&&c.items.length?c.items:[{}]).map(coRow).join(''))+'</div>'+\n      '<div class=\"acts\"><button type=\"button\" class=\"btn ghost\" id=\"coadd\">'+ICON.plus+'Add line</button><button type=\"button\" class=\"btn ghost\" id=\"codeck\">+ Decking sheet'+(k.deckPrice?' ('+money(k.deckPrice)+')':'')+'</button></div>'+\n      '<label class=\"f\">Note for the customer <small>(optional)</small></label><textarea class=\"in\" id=\"con\" maxlength=\"600\" placeholder=\"Found at tear-off over the back bedroom. Photos in your job folder.\">'+esc(c?c.note||'':'')+'</textarea>'+\n      '<p class=\"hint\" id=\"cotot\"></p><button class=\"btn block mt\" id=\"cosave\">Save change order</button>'+(c?'<button class=\"btn danger block mt\" id=\"covoid\">Void it</button>':''));\n    function items(){var out=[];ov.querySelectorAll('.coi').forEach(function(r){var n=r.querySelector('[data-cn]').value.trim(),qq=Number(String(r.querySelector('[data-cq]').value).replace(/[^\\d.-]/g,''))||0,p=Number(String(r.querySelector('[data-cp]').value).replace(/[^\\d.-]/g,''))||0;if(n&&qq)out.push({name:n,qty:qq,unit:r.querySelector('[data-cu]').value.trim()||'each',price:p});});return out;}\n    function tot(){var t=items().reduce(function(n,it){return n+it.qty*it.price;},0);ov.querySelector('#cotot').textContent='Total: '+money(t)+' \u00b7 new job total '+money(jobTotal(x)+t);}\n    ov.addEventListener('input',tot);tot();\n    ov.querySelector('#coadd').onclick=function(){ov.querySelector('#coitems').insertAdjacentHTML('beforeend',coRow({}));};\n    ov.querySelector('#codeck').onclick=function(){ov.querySelector('#coitems').insertAdjacentHTML('beforeend',coRow({name:'Roof decking replacement (4x8 sheet)',qty:1,unit:'sheet',price:k.deckPrice||110}));if(!ov.querySelector('#cot').value)ov.querySelector('#cot').value='Rotted decking replaced';tot();};\n    ov.querySelector('#cosave').onclick=function(){var b=this,its=items();if(!its.length){toast('Add at least one line with a quantity.',true);return;}b.disabled=true;\n      call('saveChangeOrder',{id:x.id,co:{id:c?c.id:'',title:ov.querySelector('#cot').value,note:ov.querySelector('#con').value,items:its}}).then(function(r){mergeQ(r);closeSheet();render();\n        var last=c?c.id:r.changeOrders[r.changeOrders.length-1].id;coSendSheet(last);}).catch(function(e){b.disabled=false;err(e);});};\n    if(c)ov.querySelector('#covoid').onclick=function(){confirmBox('Void this change order?','It stays in the record but the customer can\u2019t sign it.','Void').then(function(ok){if(!ok)return;\n      call('voidChangeOrder',{id:x.id,coId:c.id}).then(function(r){mergeQ(r);closeSheet();render();toast('Voided');}).catch(err);});};\n  }\n  function coSendSheet(coId){\n    var x=q(),c=(x.changeOrders||[]).filter(function(z){return z.id===coId;})[0];if(!c)return;\n    var ov=sheet('<h3>Send '+esc(c.id)+' to sign'+closeBtn()+'</h3>'+kv(esc(c.title),'<span class=\"money\">'+money(c.total)+'</span>')+\n      '<p class=\"hint\">Connecticut needs extra work in writing, signed by the customer. They sign on their phone; you get a copy by email.</p>'+\n      '<label class=\"f\">Customer email</label><input class=\"in\" id=\"coem\" type=\"email\" value=\"'+esc(x.email||'')+'\">'+\n      '<button class=\"btn block mt\" id=\"conow\">Sign on this device now</button><div class=\"acts\"><button class=\"btn ghost\" id=\"coemail\">Email it</button><button class=\"btn ghost\" id=\"colink\">Text or copy link</button></div><div id=\"coout\"></div>');\n    function send(how){return call('sendChangeOrder',{id:x.id,coId:c.id,send:how}).then(function(r){mergeQ(r);render();return r;});}\n    ov.querySelector('#conow').onclick=function(){var b=this,w=null;b.disabled=true;try{w=window.open('about:blank','_blank');}catch(e){}\n      send('present').then(function(r){if(w&&!w.closed)w.location.href=r.coUrl;else location.href=r.coUrl;closeSheet();}).catch(function(e){if(w)try{w.close();}catch(z){}b.disabled=false;err(e);});};\n    ov.querySelector('#coemail').onclick=function(){var b=this,em=ov.querySelector('#coem').value.trim();if(!validEmail(em)){toast('Add the customer\u2019s email.',true);return;}b.disabled=true;\n      (em!==x.email?call('saveQuote',{id:x.id,email:em}).then(mergeQ):Promise.resolve()).then(function(){return send('email');}).then(function(){closeSheet();toast('Change order emailed to '+em);}).catch(function(e){b.disabled=false;err(e);});};\n    ov.querySelector('#colink').onclick=function(){var b=this;b.disabled=true;send('none').then(function(r){var msg='Hi'+(r.name?' '+r.name.split(' ')[0]:'')+', here is the change order we talked about ('+c.title+', '+money(c.total)+'). You can review and sign it here: '+r.coUrl;\n      ov.querySelector('#coout').innerHTML='<a class=\"btn block mt\" href=\"'+esc(smsHref(r.phone,msg))+'\" target=\"_top\">Text it'+(r.phone?' to '+esc(r.phone):'')+'</a><textarea class=\"in mt\" readonly style=\"min-height:64px;font-size:13px\">'+esc(r.coUrl)+'</textarea>';}).catch(function(e){b.disabled=false;err(e);});};\n  }\n  function cancelContract(){\n    var x=q();\n    confirmBox('Customer cancelled?',(inCancel(x)?'They are within the cancellation period, so their deposit must be refunded within 10 business days. ':'')+'The job is archived. Card and bank payments made through Stripe are refunded automatically; cash and check refunds you do yourself.','Mark cancelled').then(function(ok){if(!ok)return;\n      call('cancelContract',{id:x.id}).then(function(r){mergeQ(r);M.view='list';render();\n        if(r.refundNotes&&r.refundNotes.length)sheet('<h3>Refunds to finish'+closeBtn()+'</h3>'+r.refundNotes.map(function(n){return '<p>'+esc(n)+'</p>';}).join('')+'<button class=\"btn block mt\" data-close>OK</button>');else toast('Marked cancelled');}).catch(err);});\n  }\n  /* add-ons offered on a proposal: quantity from the roof measurements */\n  function addonQty(b,m){var e=Number(m.eaves)||0,r=Number(m.rakes)||0;\n    if(b==='eaves')return e;if(b==='rakes')return r;if(b==='eaves+rakes')return e+r;if(b==='ridges')return Number(m.ridges)||0;if(b==='area')return Number(m.area)||0;\n    if(b==='downspouts')return e?Math.max(2,Math.ceil(e/35)):0;if(b==='one')return 1;return 0;}\n  function addonsBlock(x){\n    var book=M.settings.addons||[];if(!book.length)return '';var m=measFor(x),offered={};(x.addons||[]).forEach(function(a){offered[a.key]=a;});\n    return '<label class=\"f\">Optional add-ons <span class=\"hint\" style=\"font-weight:500\">\u00b7 tick the ones to offer; the customer chooses before signing</span></label><div class=\"adds\">'+book.map(function(b){\n      var o=offered[b.key],qty=o?o.qty:Math.round(addonQty(b.basis,m));\n      return '<div class=\"add\"><label><input type=\"checkbox\" data-ad=\"'+esc(b.key)+'\"'+(o?' checked':'')+'><span>'+esc(b.name)+'<small>'+money(b.price)+' / '+esc(b.unit)+'</small></span></label><input class=\"in money\" data-adq=\"'+esc(b.key)+'\" inputmode=\"decimal\" value=\"'+(qty||'')+'\" aria-label=\"Quantity ('+esc(b.unit)+')\"><i>'+esc(b.unit)+'</i></div>';}).join('')+'</div>';\n  }\n  function addonsIn(ov){var out=[];ov.querySelectorAll('[data-ad]').forEach(function(cb){if(!cb.checked)return;var k=cb.getAttribute('data-ad');var qty=Number(String(ov.querySelector('[data-adq=\"'+k+'\"]').value).replace(/[^\\d.]/g,''))||0;out.push({key:k,qty:qty});});return out;}\n  var FOLLOW_NAME={unopened:'not opened',opened:'opened, not signed',final:'last reminder',deposit:'deposit',unpaid:'balance'};\n  function remindLine(x){\n    var f=M.settings.follow||{};if(f.on===false)return '';var sent=x.followups||[];\n    return '<div class=\"toggle\" style=\"margin-top:10px\"><div class=\"tl\"><b>Automatic reminders</b><span>'+(x.followOff?'Off for this customer':(sent.length?'Sent: '+sent.map(function(s){return (FOLLOW_NAME[s.k]||s.k)+' '+dateStr(s.t);}).join(', '):'Emails if they don\u2019t open or sign, then for the deposit'))+'</span></div>'+\n      '<button type=\"button\" class=\"sw'+(x.followOff?'':' on')+'\" data-m=\"followtog\" role=\"switch\" aria-checked=\"'+(!x.followOff)+'\" aria-label=\"Automatic reminders\"></button></div>';\n  }\n  /* settings: contract, add-ons, reminders */\n  var ADDON_BASIS=[['eaves','Eaves length'],['rakes','Rakes length'],['eaves+rakes','Eaves + rakes'],['ridges','Ridge length'],['area','Roof area'],['downspouts','1 per 35 ft of eaves'],['one','One'],['manual','I type it']];\n  function adRow(a){return '<div class=\"row adr\" style=\"margin-top:8px\"><input class=\"in\" data-an placeholder=\"Add-on\" value=\"'+esc(a.name||'')+'\"><input class=\"in money\" data-ap inputmode=\"decimal\" placeholder=\"$\" value=\"'+(a.price!=null?a.price:'')+'\" style=\"flex:0 0 76px\"><input class=\"in\" data-au placeholder=\"Unit\" value=\"'+esc(a.unit||'each')+'\" style=\"flex:0 0 64px\"><select class=\"in\" data-ab style=\"flex:0 0 120px\">'+ADDON_BASIS.map(function(b){return '<option value=\"'+b[0]+'\"'+(a.basis===b[0]?' selected':'')+'>'+b[1]+'</option>';}).join('')+'</select><input type=\"hidden\" data-ak value=\"'+esc(a.key||'')+'\"><button type=\"button\" class=\"lnk\" data-m=\"adrm\" aria-label=\"Remove\">\u2715</button></div>';}\n  function contractCards(){\n    var s=M.settings,c=s.company||{},k=s.contract||{},f=s.follow||{};\n    return '<div class=\"card\"><h2>Contract <small>Connecticut home improvement</small></h2>'+\n      '<p class=\"hint\">Proposals can\u2019t be sent for signature until this is filled in. Research notes, not legal advice: have a Connecticut attorney review your contract once.</p>'+\n      '<label class=\"f\">Mailing address for contracts</label><input class=\"in\" name=\"co_mailing\" value=\"'+esc(c.mailing||'')+'\" placeholder=\"PO Box 123, Berlin, CT 06037\">'+\n      '<p class=\"hint\">Printed on signed contracts and the cancellation notice only, not on the website.</p>'+\n      '<div class=\"row\"><div><label class=\"f\">Signs contracts</label><input class=\"in\" name=\"k_signer\" value=\"'+esc(k.signerName||'')+'\" placeholder=\"Your full name\"></div><div><label class=\"f\">Title</label><input class=\"in\" name=\"k_title\" value=\"'+esc(k.signerTitle||'Owner')+'\"></div></div>'+\n      '<div class=\"row\" style=\"margin-top:12px\"><label class=\"f\" style=\"margin:0\">Your signature '+(k.sigId?'<span class=\"pill done\">Saved</span>':'<span class=\"pill\">Needed</span>')+'</label><button type=\"button\" class=\"lnk\" data-m=\"sigclr\">Clear</button></div>'+\n      '<canvas id=\"csig\" class=\"sigpad\" aria-label=\"Draw your signature\"></canvas><p class=\"hint\">'+(k.sigId?'Draw here only to replace it.':'Draw it once; it goes on every contract you send.')+'</p>'+\n      '<div class=\"row\"><div><label class=\"f\">Decking price per sheet</label><input class=\"in money\" name=\"k_deck\" inputmode=\"decimal\" value=\"'+(k.deckPrice!=null?k.deckPrice:110)+'\"></div></div>'+\n      '<label class=\"f\">Decking clause</label><textarea class=\"in\" name=\"k_decking\" style=\"min-height:64px\">'+esc(k.decking||'')+'</textarea>'+\n      '<label class=\"f\">Cleanup</label><textarea class=\"in\" name=\"k_cleanup\" style=\"min-height:56px\">'+esc(k.cleanup||'')+'</textarea>'+\n      '<label class=\"f\">Permit</label><textarea class=\"in\" name=\"k_permit\" style=\"min-height:56px\">'+esc(k.permit||'')+'</textarea></div>'+\n      '<div class=\"card\"><h2>Proposal add-ons <small>the customer ticks them before signing</small></h2><div id=\"adrows\">'+(s.addons||[]).map(adRow).join('')+'</div>'+\n      '<button type=\"button\" class=\"btn ghost block mt\" data-m=\"adadd\">'+ICON.plus+'Add an add-on</button><p class=\"hint\">\u201cEaves length\u201d and the others fill in the quantity from the roof measurements; you can change it on each proposal.</p></div>'+\n      '<div class=\"card\"><h2>Reminders</h2>'+\n      '<div class=\"toggle\" style=\"border-top:0\"><div class=\"tl\"><b>Automatic reminder emails</b><span>Not opened after a day, opened but not signed after 2 days, a last one around day 8, then the deposit and any unpaid balance. Stops when they sign or pay. Sent 9 a.m. to 8 p.m.</span></div><button type=\"button\" class=\"sw'+(f.on!==false?' on':'')+'\" role=\"switch\" data-sw=\"followOn\" aria-checked=\"'+(f.on!==false)+'\" aria-label=\"Automatic reminders\"></button></div>'+\n      '<div class=\"toggle\"><div class=\"tl\"><b>Hot lead alert</b><span>Email me when a customer opens their proposal twice in a day</span></div><button type=\"button\" class=\"sw'+(f.hot!==false?' on':'')+'\" role=\"switch\" data-sw=\"followHot\" aria-checked=\"'+(f.hot!==false)+'\" aria-label=\"Hot lead alert\"></button></div>'+\n      '<div class=\"toggle\"><div class=\"tl\"><b>Tag in GoHighLevel</b><span>Adds tf-reminder-\u2026 tags, so you can add texts there later</span></div><button type=\"button\" class=\"sw'+(f.tags!==false?' on':'')+'\" role=\"switch\" data-sw=\"followTags\" aria-checked=\"'+(f.tags!==false)+'\" aria-label=\"GoHighLevel tags\"></button></div></div>';\n  }\n  function wireContractSig(){\n    var cv=document.getElementById('csig');if(!cv)return;var cx=cv.getContext('2d'),down=false,last=null;\n    function size(){var r=cv.getBoundingClientRect();if(!r.width)return;var d=window.devicePixelRatio||1;cv.width=r.width*d;cv.height=r.height*d;cx.setTransform(d,0,0,d,0,0);cx.lineWidth=2.4;cx.lineCap='round';cx.lineJoin='round';cx.strokeStyle='#13202F';}\n    size();\n    function pt(e){var r=cv.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};}\n    cv.addEventListener('pointerdown',function(e){down=true;last=pt(e);try{cv.setPointerCapture(e.pointerId);}catch(z){}e.preventDefault();});\n    cv.addEventListener('pointermove',function(e){if(!down)return;var p=pt(e);cx.beginPath();cx.moveTo(last.x,last.y);cx.lineTo(p.x,p.y);cx.stroke();last=p;cv.setAttribute('data-drawn','1');e.preventDefault();});\n    cv.addEventListener('pointerup',function(){down=false;});\n  }\n  function contractArgs(f,a){\n    var el=f.elements;if(!el.co_mailing)return a;\n    a.company=a.company||{};a.company.mailing=el.co_mailing.value;\n    a.contract={signerName:el.k_signer.value,signerTitle:el.k_title.value,deckPrice:el.k_deck.value,decking:el.k_decking.value,cleanup:el.k_cleanup.value,permit:el.k_permit.value};\n    var cv=document.getElementById('csig');if(cv&&cv.getAttribute('data-drawn')==='1')a.contractSig=cv.toDataURL('image/png');\n    var ads=[];f.querySelectorAll('.adr').forEach(function(r){var n=r.querySelector('[data-an]').value.trim();if(!n)return;ads.push({key:r.querySelector('[data-ak]').value,name:n,price:r.querySelector('[data-ap]').value,unit:r.querySelector('[data-au]').value,basis:r.querySelector('[data-ab]').value});});\n    a.addons=ads;\n    var sw=function(n){var b=f.querySelector('[data-sw=\"'+n+'\"]');return b?b.classList.contains('on'):undefined;};\n    a.follow={on:sw('followOn'),hot:sw('followHot'),tags:sw('followTags')};\n    return a;\n  }\n\n  function kv(a,b){return '<div class=\"kv\"><span>'+a+'</span><b>'+b+'</b></div>';}\n\n  function approveCard(x){\n    var pick=M.draft&&M.draft.id===x.id?M.draft.pick:(x.pick>=0?x.pick:1);\n    var price=M.draft&&M.draft.id===x.id?M.draft.price:(x.contractPrice||mid(x,pick));\n    return '<div class=\"card\"><h2>Approve job</h2>'+\n      '<label class=\"f\">Package</label><div class=\"pkg\" id=\"pkg\">'+PK.map(function(p,i){return '<button type=\"button\" class=\"'+(i===pick?'on':'')+'\" data-pk=\"'+i+'\"><b>'+p.label+'</b><span>'+(range(x,i)||'\u00a0')+'</span></button>';}).join('')+'</div>'+\n      '<div class=\"row\"><div><label class=\"f\">Color</label><input class=\"in\" id=\"qc\" maxlength=\"40\" value=\"'+esc(x.color||'')+'\" placeholder=\"e.g. Estate Gray\"></div>'+\n      '<div><label class=\"f\">Job price</label><input class=\"in money\" id=\"qp\" inputmode=\"decimal\" value=\"'+(price||'')+'\" placeholder=\"$\"></div></div>'+\n      '<p class=\"hint\">Approving builds the materials list from the quote\u2019s roof measurements and adds the job to Photos.</p>'+\n      '<button class=\"btn block mt\" data-m=\"approve\">Approve job &amp; build materials list</button>'+\n      '<button class=\"btn ghost block mt\" data-m=\"archive\">Not going ahead</button></div>';\n  }\n\n  function jobCards(x){\n    var ls=fresh(x);\n    var t=TAKEOFF.totals(ls,M.settings.taxRate);\n    var mine=M.orders.filter(function(o){return o.quoteId===x.id;});\n    var spent=mine.reduce(function(n,o){return n+orderSpend(o);},0);\n    var pct=x.contractPrice?Math.round(t.total/x.contractPrice*100):0;\n    var h='<div class=\"card\"><h2>Job <small>'+(x.type==='repair'?'Repair':'OC '+esc((PK[x.pick]||{}).label||'')+(x.color?' \u00b7 '+esc(x.color):''))+'</small></h2>'+\n      '<div class=\"row\"><div><span class=\"hint\">Job price'+(coSigned(x)?' incl. change orders':'')+'</span><div class=\"big-n money\">'+(x.contractPrice?money(jobTotal(x),false):'\u2014')+'</div></div>'+\n      '<div><span class=\"hint\">Materials (est.)</span><div class=\"big-n money\">'+money(t.total,false)+'</div></div></div>'+\n      (x.contractPrice?'<div class=\"meter\" aria-label=\"Materials are '+pct+'% of the job price\"><div style=\"width:'+Math.min(100,pct)+'%\"></div></div><p class=\"hint\">Materials are about '+pct+'% of the job price'+(spent?' \u00b7 ordered so far: '+money(spent,false):'')+'</p>':'')+\n      '<div class=\"acts\"><button class=\"btn ghost\" data-m=\"editjob\">Edit price</button>'+\n      (x.photoJobId?'<button class=\"btn ghost\" data-m=\"photos\">Job photos</button>':'<span></span>')+'</div></div>';\n\n    var m=x.meas||{};var est=m.est||{};var skipMeas=x.type==='repair';\n    function f(key,label,unit){return '<div><label for=\"m_'+key+'\">'+label+(est[key]?'<i>est.</i>':'')+'</label><input class=\"in money\" id=\"m_'+key+'\" data-meas=\"'+key+'\" inputmode=\"numeric\" value=\"'+(m[key]!=null?m[key]:'')+'\"'+(unit?' aria-label=\"'+label+' in '+unit+'\"':'')+'></div>';}\n    if(!skipMeas)h+='<div class=\"card\"><h2>Roof measurements <small>'+(Object.keys(est).length?'Check the est. numbers on site':'')+'</small></h2><div class=\"meas\">'+\n      f('area','Roof area (sq ft)')+'<div><label>Pitch</label><input class=\"in\" data-meas=\"pitch\" value=\"'+esc(m.pitch||'')+'\"></div>'+\n      f('eaves','Eaves (ft)')+f('rakes','Rakes (ft)')+f('ridges','Ridges (ft)')+f('hips','Hips (ft)')+f('valleys','Valleys (ft)')+f('walls','Wall flashing (ft)')+\n      f('pipes','Pipe boots')+f('decking','Decking sheets')+f('waste','Waste %')+f('iceCourses','Ice & water rows at eaves')+'</div>'+\n      '<button class=\"btn dark block mt\" data-m=\"recalc\">Update materials list</button>'+\n      '<button class=\"btn ghost block mt\" data-m=\"measuretool\">'+((m.traced||[]).length?'Edit measured lines ('+m.traced.length+')':'Measure on satellite photo')+'</button></div>';\n\n    h+='<div class=\"card\"><h2>Materials <small>'+ls.length+' items</small></h2><div id=\"lines\">';\n    var lastCat='';\n    ls.forEach(function(l,i){\n      if(l.cat!==lastCat){h+='<div class=\"cat\">'+esc(l.cat||'Other')+'</div>';lastCat=l.cat;}\n      h+='<button class=\"ln\" data-m=\"line\" data-i=\"'+i+'\"><div class=\"l1\"><b>'+esc(l.name)+(l.manual?'<em>edited</em>':'')+'</b><span class=\"money\">'+l.qty+' '+esc(units(l.unit,l.qty))+' \u00d7 '+money(l.price)+(l.abcItem?' \u00b7 #'+esc(l.abcItem):'')+'</span></div><div class=\"l2 money\">'+money(lineTotal(l))+'</div></button>';\n    });\n    h+='</div><button class=\"btn ghost block mt\" data-m=\"addline\">'+ICON.plus+'Add item</button>'+\n      '<div class=\"tot\">'+kv('Subtotal','<span class=\"money\">'+money(t.subtotal)+'</span>')+kv('Sales tax ('+(M.settings.taxRate||0)+'%)','<span class=\"money\">'+money(t.tax)+'</span>')+\n      '<div class=\"kv grand\"><span>Total</span><b class=\"money\">'+money(t.total)+'</b></div></div>'+\n      (M.prices.some(function(p){return p.source==='starter';})?'<div class=\"note\">Some prices are starter estimates. Update them under Spending \u203a Prices, or connect ABC Supply for your account prices.</div>':'')+\n      (x.orderPrepared&&!M.orders.some(function(o){return o.quoteId===x.id;})?'<div class=\"note\"><b>Ready to order.</b> The deposit cleared and the cancellation period is over. Suggested delivery '+esc(dateStr(x.orderPrepared.delivery+'T12:00:00'))+'. Check the list, then send it below.</div>':'')+\n      '<button class=\"btn block mt\" data-m=\"order\" data-v=\"abc\"'+(M.settings.abc&&M.settings.abc.connected?'':' disabled')+'>Order from ABC Supply</button>'+\n      (M.settings.abc&&M.settings.abc.connected?'':'<p class=\"hint\" style=\"text-align:center\">Connect ABC Supply in Spending \u203a Settings to order here.</p>')+\n      '<button class=\"btn ghost block mt\" data-m=\"order\" data-v=\"email\">Send order by email</button></div>';\n\n    if(mine.length){\n      h+='<div class=\"card\"><h2>Orders for this job</h2>'+mine.map(orderRow).join('')+'</div>';\n    }\n    h+='<div class=\"card\">'+kv('Status','<span class=\"pill '+x.status+'\">'+ST_LABEL[x.status]+'</span>')+\n      '<div class=\"acts\">'+(x.status!=='done'?'<button class=\"btn ghost\" data-m=\"status\" data-v=\"done\">Mark job done</button>':'<button class=\"btn ghost\" data-m=\"status\" data-v=\"approved\">Reopen</button>')+\n      '<button class=\"btn danger\" data-m=\"archive\">Archive</button></div></div>';\n    return h;\n  }\n\n  function wireQuote(x){\n    var pk=document.getElementById('pkg');\n    if(pk)pk.onclick=function(e){var b=e.target.closest('[data-pk]');if(!b)return;var i=+b.getAttribute('data-pk');\n      var priceEl=document.getElementById('qp');var cur=Number(priceEl.value)||0;var old=M.draft&&M.draft.id===x.id?M.draft.pick:(x.pick>=0?x.pick:1);\n      M.draft={id:x.id,pick:i,price:(!cur||cur===mid(x,old))?mid(x,i):cur};\n      var c=document.getElementById('qc').value;x.color=c;render();};\n  }\n\n  function readMeas(x){\n    var m=Object.assign({},x.meas||{});var est=Object.assign({},m.est||{});\n    document.querySelectorAll('[data-meas]').forEach(function(el){\n      var key=el.getAttribute('data-meas');\n      if(key==='pitch'){m.pitch=el.value.trim();return;}\n      var v=Number(String(el.value).replace(/[^\\d.]/g,''))||0;\n      if(m[key]!==v)delete est[key];\n      m[key]=v;\n    });\n    m.est=est;return m;\n  }\n\n  /* base = the values this phone loaded for each field it changes; the server refuses the save if someone else changed them since */\n  function baseOf(x,args){var b={};if(!x)return b;Object.keys(args).forEach(function(k){if(k!=='id'&&k!=='base'&&k!=='send')b[k]=x[k]===undefined?null:x[k];});return b;}\n  function saveQ(args,msg){\n    args.id=M.qid;if(!args.base)args.base=baseOf(q(),args);\n    return call('saveQuote',args).then(function(r){mergeQ(r);render();if(msg)toast(msg);return r;}).catch(function(e){if(isConflict(e))conflictBox(e,function(){load().then(render).then(function(){toast('Reloaded');}).catch(err);});else err(e);throw e;});\n  }\n\n  function approve(){\n    var x=q();var pick=M.draft&&M.draft.id===x.id?M.draft.pick:(x.pick>=0?x.pick:1);\n    var price=Number(String(document.getElementById('qp').value).replace(/[^\\d.]/g,''))||0;\n    var color=document.getElementById('qc').value.trim();\n    var m=measFor(x);\n    m.waste=M.settings.waste!=null?M.settings.waste:m.waste;m.iceCourses=M.settings.iceCourses!=null?M.settings.iceCourses:m.iceCourses;\n    var ls=TAKEOFF.lines(m,pick,priceMap(),[]);\n    var b=document.querySelector('[data-m=approve]');if(b){b.disabled=true;b.textContent='Approving\u2026';}\n    saveQ({status:'approved',pick:pick,color:color,contractPrice:price,meas:m,lines:ls}).then(function(r){\n      M.draft=null;M.qfilter='approved';toast('Approved. Materials list is ready.');\n      call('list').then(function(d){S.jobs=d.jobs||[];}).catch(function(){});\n      return r;\n    }).catch(function(){if(b){b.disabled=false;b.textContent='Approve job & build materials list';}});\n  }\n\n  function recalc(){\n    var x=q();var m=readMeas(x);\n    var ls=TAKEOFF.lines(m,x.pick,priceMap(),x.lines);\n    saveQ({meas:m,lines:ls},'Materials list updated');\n  }\n\n  function lineSheet(i){\n    var x=q();var ls=fresh(x);var l=ls[i];if(!l)return;\n    var ov=sheet('<h3>'+esc(l.name)+closeBtn()+'</h3>'+\n      '<div class=\"row\"><div><label class=\"f\">Quantity ('+esc(units(l.unit,2))+')</label><input class=\"in money\" id=\"lq\" inputmode=\"numeric\" value=\"'+l.qty+'\"></div>'+\n      '<div><label class=\"f\">Price per '+esc(l.unit)+'</label><input class=\"in money\" id=\"lp\" inputmode=\"decimal\" value=\"'+l.price+'\"></div></div>'+\n      (l.calc!=null&&!l.custom?'<p class=\"hint\">Calculated: '+l.calc+' '+esc(l.unit)+'s from the roof measurements.</p>':'')+\n      '<p class=\"hint\">Changing the price here only affects this job. To change it for every job, edit it in Spending \u203a Prices.</p>'+\n      '<label class=\"f\">ABC item # for this job <small>(e.g. the shingle color)</small></label><div class=\"row\"><input class=\"in\" id=\"li\" maxlength=\"40\" value=\"'+esc(l.abcItem||'')+'\"><input class=\"in\" id=\"lu\" maxlength=\"10\" style=\"flex:0 0 84px\" placeholder=\"UOM\" value=\"'+esc(l.uom||'')+'\"></div>'+\n      (M.settings.abc&&M.settings.abc.connected?'<div class=\"row\" style=\"margin-top:8px\"><input class=\"in\" id=\"lsq\" value=\"'+esc(((x.color?x.color+' ':'')+(/^shingle_/.test(l.key)?((PK.filter(function(p){return p.key===l.key;})[0]||{}).label||''):l.key==='hip_ridge'?'ProEdge':l.name)).trim())+'\"><button class=\"btn dark\" id=\"lsb\" style=\"flex:0 0 auto\">Search ABC</button></div><div id=\"lsr\"></div>':'')+\n      '<div class=\"acts\">'+(l.manual||l.priceManual?'<button class=\"btn ghost\" id=\"lr\">Reset to calculated</button>':'<span></span>')+'<button class=\"btn danger\" id=\"ld\">Remove</button></div>'+\n      '<button class=\"btn block mt\" id=\"ls\">Save</button>');\n    ov.querySelector('#ls').onclick=function(){\n      var qty=Math.max(0,Math.round(Number(ov.querySelector('#lq').value)||0));var price=Math.max(0,Number(ov.querySelector('#lp').value)||0);\n      var nl=fresh(x);var it=nl[i];\n      if(qty!==it.qty){it.qty=qty;it.manual=!it.custom;}\n      if(price!==it.price){it.price=price;it.priceManual=true;}\n      var ni=ov.querySelector('#li').value.trim(),nu=ov.querySelector('#lu').value.trim();\n      if(ni!==(it.abcItem||'')||nu!==(it.uom||'')){it.abcItem=ni;it.uom=nu;it.itemManual=true;}\n      closeSheet();saveQ({lines:nl},'Saved');\n    };\n    var sb=ov.querySelector('#lsb');if(sb)sb.onclick=function(){\n      var r=ov.querySelector('#lsr');r.innerHTML='<div class=\"loading\" style=\"padding:16px\"><div class=\"spin dk\"></div></div>';\n      call('abcSearch',{q:ov.querySelector('#lsq').value}).then(function(items){\n        r.innerHTML=items.length?items.map(function(it){return '<button class=\"res\" data-it=\"'+esc(it.itemNumber)+'\" data-u=\"'+esc(it.uom)+'\"><b>'+esc(it.description)+'</b><span>#'+esc(it.itemNumber)+(it.uom?' \u00b7 '+esc(it.uom):'')+'</span></button>';}).join(''):'<p class=\"hint\">No matches.</p>';\n      }).catch(function(e){r.innerHTML='';err(e);});\n    };\n    ov.addEventListener('click',function(e){var b=e.target.closest('[data-it]');if(!b)return;ov.querySelector('#li').value=b.getAttribute('data-it');ov.querySelector('#lu').value=b.getAttribute('data-u');ov.querySelector('#lsr').innerHTML='';toast('Picked. Tap Save.');});\n    var r=ov.querySelector('#lr');if(r)r.onclick=function(){var nl=fresh(x);nl[i].manual=false;nl[i].priceManual=false;nl[i].itemManual=false;nl[i].qty=nl[i].calc;\n      var pm=priceMap();if(pm[nl[i].key])nl[i].price=pm[nl[i].key].price;closeSheet();saveQ({lines:TAKEOFF.lines(x.meas||{},x.pick,pm,nl)},'Reset');};\n    ov.querySelector('#ld').onclick=function(){var nl=fresh(x);\n      if(nl[i].custom)nl.splice(i,1);else{nl[i].qty=0;nl[i].manual=true;}\n      closeSheet();saveQ({lines:nl},'Removed');};\n  }\n\n  function addLineSheet(){\n    var x=q();var used={};(x.lines||[]).forEach(function(l){if(l.qty)used[l.key]=1;});\n    var opts=M.prices.filter(function(p){return !used[p.key];});\n    var ov=sheet('<h3>Add item'+closeBtn()+'</h3>'+\n      '<label class=\"f\">From your price list</label><select class=\"in\" id=\"ap\"><option value=\"\">Custom item\u2026</option>'+opts.map(function(p){return '<option value=\"'+esc(p.key)+'\">'+esc(p.name)+' ('+money(p.price)+'/'+esc(p.unit)+')</option>';}).join('')+'</select>'+\n      '<div id=\"cust\"><label class=\"f\">Item name</label><input class=\"in\" id=\"an\" maxlength=\"120\" placeholder=\"e.g. Skylight flashing kit\">'+\n      '<div class=\"row\"><div><label class=\"f\">Unit</label><input class=\"in\" id=\"au\" value=\"each\" maxlength=\"20\"></div><div><label class=\"f\">Price</label><input class=\"in money\" id=\"apr\" inputmode=\"decimal\" placeholder=\"0.00\"></div></div></div>'+\n      '<label class=\"f\">Quantity</label><input class=\"in money\" id=\"aq\" inputmode=\"numeric\" value=\"1\">'+\n      '<button class=\"btn block mt\" id=\"ab\">Add to list</button>');\n    var sel=ov.querySelector('#ap');sel.onchange=function(){ov.querySelector('#cust').style.display=sel.value?'none':'';};\n    ov.querySelector('#ab').onclick=function(){\n      var qty=Math.max(1,Math.round(Number(ov.querySelector('#aq').value)||1));var nl=fresh(x);var p=priceMap()[sel.value];\n      if(p){var ex=nl.filter(function(l){return l.key===p.key;})[0];\n        if(ex){ex.qty=qty;ex.manual=true;}else nl.push({key:p.key,cat:p.cat,name:p.name,unit:p.unit,qty:qty,calc:0,manual:true,price:p.price,abcItem:p.abcItem,uom:p.uom,custom:true});}\n      else{var nm=ov.querySelector('#an').value.trim();if(!nm){toast('Type the item name.',true);return;}\n        nl.push({key:'x'+Date.now().toString(36),cat:'Other',name:nm,unit:ov.querySelector('#au').value.trim()||'each',qty:qty,calc:0,manual:true,price:Number(ov.querySelector('#apr').value)||0,priceManual:true,abcItem:'',uom:'',custom:true});}\n      closeSheet();saveQ({lines:nl},'Item added');\n    };\n  }\n\n  function editJobSheet(){\n    var x=q();\n    var ov=sheet('<h3>Job'+closeBtn()+'</h3><label class=\"f\">Job price</label><input class=\"in money\" id=\"jp\" inputmode=\"decimal\" value=\"'+(x.contractPrice||'')+'\">'+\n      '<label class=\"f\">Shingle color</label><input class=\"in\" id=\"jc\" value=\"'+esc(x.color||'')+'\">'+\n      '<label class=\"f\">Package</label><div class=\"pkg\" id=\"jpk\">'+PK.map(function(p,i){return '<button type=\"button\" class=\"'+(i===x.pick?'on':'')+'\" data-pk=\"'+i+'\"><b>'+p.label+'</b></button>';}).join('')+'</div>'+\n      '<label class=\"f\">Notes</label><textarea class=\"in\" id=\"jn\">'+esc(x.notes||'')+'</textarea><button class=\"btn block mt\" id=\"js\">Save</button>');\n    var pick=x.pick;\n    ov.querySelector('#jpk').onclick=function(e){var b=e.target.closest('[data-pk]');if(!b)return;pick=+b.getAttribute('data-pk');ov.querySelectorAll('#jpk button').forEach(function(z){z.classList.toggle('on',z===b);});};\n    ov.querySelector('#js').onclick=function(){\n      var args={contractPrice:Number(ov.querySelector('#jp').value)||0,color:ov.querySelector('#jc').value,notes:ov.querySelector('#jn').value};\n      if(pick!==x.pick){\n        // swap the shingle line to the new package\n        var nl=(x.lines||[]).filter(function(l){return !/^shingle_/.test(l.key)||l.custom;});\n        args.pick=pick;args.lines=TAKEOFF.lines(x.meas||{},pick,priceMap(),nl);\n      }\n      closeSheet();saveQ(args,'Saved');\n    };\n  }\n\n  /* ---------- ordering ---------- */\n  function orderSheet(method){\n    var x=q();var ls=fresh(x).filter(function(l){return l.qty>0;});\n    var s=M.settings;var t=TAKEOFF.totals(ls,s.taxRate);var ad=parseAddr(x.address);\n    if(method==='email'&&!(s.suppliers||[]).length){toast('Add a supplier email first (Spending \u203a Settings).',true);return;}\n    var missing=method==='abc'?ls.filter(function(l){return !l.abcItem;}):[];\n    var ov=sheet('<h3>'+(method==='abc'?'Order from ABC Supply':'Send order by email')+closeBtn()+'</h3>'+\n      (method==='abc'?'<p class=\"sub\">'+esc(s.abc.branchName||('Branch '+s.abc.branch))+' \u00b7 account '+esc(s.abc.shipTo)+(s.abc.env==='sandbox'?' \u00b7 <b>TEST MODE</b>':'')+'</p>':\n        '<label class=\"f\">Supplier</label><select class=\"in\" id=\"os\">'+s.suppliers.map(function(p,i){return '<option value=\"'+i+'\">'+esc(p.name)+' ('+esc(p.email)+')</option>';}).join('')+'</select>')+\n      (method==='abc'&&x.color&&!missing.length?'<div class=\"note\">Check that the shingle and ridge cap item numbers are for <b>'+esc(x.color)+'</b>. You can set them per job by tapping the item.</div>':'')+\n      (missing.length?'<div class=\"note\">These items aren\u2019t linked to an ABC item number yet: '+esc(missing.map(function(l){return l.name;}).join(', '))+'. Link them in Spending \u203a Prices first.</div>':'')+\n      '<label class=\"f\">Delivery</label><div class=\"seg\" id=\"odl\">'+DELIVERY.map(function(d,i){return '<button type=\"button\" class=\"'+(i===0?'on':'')+'\" data-d=\"'+d[0]+'\">'+d[1]+'</button>';}).join('')+'</div>'+\n      '<div class=\"row\"><div><label class=\"f\">Date</label><input class=\"in\" type=\"date\" id=\"odd\" value=\"'+esc((x.orderPrepared&&x.orderPrepared.delivery)||addDays(2))+'\"></div><div><label class=\"f\">PO</label><input class=\"in\" id=\"opo\" maxlength=\"20\" value=\"'+esc(x.id)+'\"></div></div>'+\n      '<label class=\"f\">Street</label><input class=\"in\" id=\"oa1\" value=\"'+esc(ad.line1)+'\">'+\n      '<div class=\"row\"><div style=\"flex:2\"><label class=\"f\">Town</label><input class=\"in\" id=\"oac\" value=\"'+esc(ad.city)+'\"></div><div><label class=\"f\">State</label><input class=\"in\" id=\"oas\" maxlength=\"2\" value=\"'+esc(ad.state)+'\"></div><div><label class=\"f\">ZIP</label><input class=\"in\" id=\"oaz\" inputmode=\"numeric\" maxlength=\"10\" value=\"'+esc(ad.postal)+'\"></div></div>'+\n      '<label class=\"f\">Notes for the driver <small>(optional)</small></label><input class=\"in\" id=\"on\" maxlength=\"255\" placeholder=\"e.g. Driveway on left, no roof load on garage\">'+\n      '<div class=\"tot mt\">'+kv(ls.length+' items','')+kv('Estimated total','<span class=\"money\">'+money(t.total)+'</span>')+'</div>'+\n      '<button class=\"btn block mt\" id=\"ogo\"'+(missing.length?' disabled':'')+'>'+(method==='abc'?'Place order with ABC':'Send order email')+'</button>');\n    var del='OTR';\n    ov.querySelector('#odl').onclick=function(e){var b=e.target.closest('[data-d]');if(!b)return;del=b.getAttribute('data-d');ov.querySelectorAll('#odl button').forEach(function(z){z.classList.toggle('on',z===b);});};\n    ov.querySelector('#ogo').onclick=function(){\n      var b=this;\n      var args={quoteId:x.id,method:method,lines:ls,deliveryService:del,deliveryDate:ov.querySelector('#odd').value,po:ov.querySelector('#opo').value,\n        address:{line1:ov.querySelector('#oa1').value,city:ov.querySelector('#oac').value,state:ov.querySelector('#oas').value,postal:ov.querySelector('#oaz').value},notes:ov.querySelector('#on').value};\n      if(method==='email')args.supplier=ov.querySelector('#os').value;\n      b.disabled=true;b.textContent=method==='abc'?'Placing order\u2026':'Sending\u2026';\n      call('placeOrder',args).then(function(o){\n        M.orders.unshift(o);if(x.status==='approved'||x.status==='new')x.status='ordered';closeSheet();render();\n        toast(method==='abc'?'Order sent to ABC. Confirmation '+o.confirmation:'Order emailed to '+o.supplier);\n      }).catch(function(e){b.disabled=false;b.textContent=method==='abc'?'Place order with ABC':'Send order email';err(e);});\n    };\n  }\n\n  function orderRow(o){\n    var qq=M.quotes.filter(function(x){return x.id===o.quoteId;})[0];\n    var actual=o.actualTotal!==''&&o.actualTotal!=null;\n    return '<button class=\"ln\" data-m=\"openo\" data-id=\"'+esc(o.id)+'\"><div class=\"l1\"><b>'+esc(qq?(qq.name||qq.id)+' \u00b7 '+townOf(qq.address):o.po)+'</b><span>'+esc(o.supplier)+' \u00b7 '+dateStr(o.created)+'</span></div>'+\n      '<div class=\"l2 money\">'+money(orderSpend(o))+(actual?'':'<small style=\"font-weight:600;color:var(--muted)\"> est.</small>')+'<span style=\"margin-top:4px\"><span class=\"pill '+esc(o.status.split(' ')[0])+'\">'+esc(o.status)+'</span></span></div></button>';\n  }\n\n  function orderDetail(id){\n    var o=M.orders.filter(function(z){return z.id===id;})[0];if(!o)return;\n    var statuses=['Sent','Requested','Scheduled','Delivered','Picked up','Backordered','Canceled'];\n    if(statuses.indexOf(o.status)<0)statuses.unshift(o.status);\n    var ov=sheet('<h3>Order '+esc(o.po)+closeBtn()+'</h3>'+\n      kv('Supplier',esc(o.supplier))+kv('Placed',dateStr(o.created))+(o.confirmation?kv('ABC confirmation',esc(o.confirmation)):'')+(o.orderNumber?kv('ABC order #',esc(o.orderNumber)):'')+\n      kv('Delivery',esc((DELIVERY.filter(function(d){return d[0]===o.deliveryService;})[0]||['',''])[1])+(o.deliveryDate?' \u00b7 '+esc(o.deliveryDate):''))+\n      kv('Estimated total','<span class=\"money\">'+money(o.total)+'</span>')+\n      '<div class=\"cat mt\">Items</div>'+o.lines.map(function(l){return '<div class=\"kv\"><span>'+esc(l.name)+'</span><b class=\"money\">'+l.qty+' '+esc(units(l.unit,l.qty))+'</b></div>';}).join('')+\n      '<label class=\"f\">Status</label><select class=\"in\" id=\"ost\">'+statuses.map(function(s){return '<option'+(s===o.status?' selected':'')+'>'+esc(s)+'</option>';}).join('')+'</select>'+\n      '<label class=\"f\">Invoice total <small>(what you actually paid, if different)</small></label><input class=\"in money\" id=\"oat\" inputmode=\"decimal\" placeholder=\"'+money(o.total)+'\" value=\"'+(o.actualTotal===''?'':o.actualTotal)+'\">'+\n      (o.method==='abc'?'<p class=\"hint\">ABC orders update on their own when the branch confirms, schedules or delivers.</p>':'')+\n      '<button class=\"btn block mt\" id=\"osv\">Save</button><button class=\"btn danger block mt\" id=\"odel\">Delete order record</button>');\n    ov.querySelector('#osv').onclick=function(){\n      call('saveOrder',{id:o.id,status:ov.querySelector('#ost').value,actualTotal:ov.querySelector('#oat').value}).then(function(r){\n        for(var i=0;i<M.orders.length;i++)if(M.orders[i].id===r.id)M.orders[i]=r;closeSheet();render();toast('Saved');}).catch(err);\n    };\n    ov.querySelector('#odel').onclick=function(){\n      confirmBox('Delete this order record?','This only removes it from your spending. It does not cancel the order with the supplier.','Delete').then(function(ok){\n        if(!ok)return;call('deleteOrder',{id:o.id}).then(function(){M.orders=M.orders.filter(function(z){return z.id!==o.id;});render();toast('Deleted');}).catch(err);});\n    };\n  }\n\n  /* ---------- spending ---------- */\n  function renderMoney(){\n    var now=new Date();var ym=now.toISOString().slice(0,7);var prev=new Date(now.getFullYear(),now.getMonth()-1,1);var pym=prev.getFullYear()+'-'+('0'+(prev.getMonth()+1)).slice(-2);\n    var sums={m:0,p:0,y:0};\n    M.orders.forEach(function(o){var c=String(o.created);var v=orderSpend(o);if(c.slice(0,7)===ym)sums.m+=v;if(c.slice(0,7)===pym)sums.p+=v;if(c.slice(0,4)===String(now.getFullYear()))sums.y+=v;});\n    var h=bar('<div class=\"brand\">SPENDING</div><button class=\"icon-btn\" data-m=\"settings\" aria-label=\"Settings\">'+GEAR+'</button>')+'<div class=\"wrap\">'+\n      '<div class=\"stats\"><div class=\"stat\"><b class=\"money\">'+k(sums.m)+'</b><span>This month</span></div><div class=\"stat\"><b class=\"money\">'+k(sums.p)+'</b><span>Last month</span></div><div class=\"stat\"><b class=\"money\">'+k(sums.y)+'</b><span>This year</span></div></div>'+\n      '<div class=\"seg mt\">'+[['orders','Orders'],['jobs','Jobs'],['prices','Prices']].map(function(t){return '<button class=\"'+(M.money===t[0]?'on':'')+'\" data-m=\"mtab\" data-v=\"'+t[0]+'\">'+t[1]+'</button>';}).join('')+'</div>';\n    if(M.money==='jobs'){h+=moneyJobs();}\n    else if(M.money==='orders'){\n      h+=M.orders.length?'<div class=\"card\">'+M.orders.map(orderRow).join('')+'</div>':'<div class=\"empty\"><b>No orders yet</b>Approve a quote, then order its materials from the Quotes tab.</div>';\n    }else{\n      var s=M.settings.abc||{};\n      h+=s.connected?'<div class=\"note ok\">ABC Supply prices'+(s.lastRefresh?' updated '+dateStr(s.lastRefresh)+' ('+esc(s.lastRefreshResult||'')+')':' not refreshed yet')+'. They refresh every morning.<div class=\"mt\"><button class=\"btn ghost\" data-m=\"refresh\">Refresh now</button></div></div>':\n        '<div class=\"note\">Prices marked <b>Starter</b> are rough estimates. Tap an item to enter your supplier\u2019s price, or connect ABC Supply (Settings) to keep prices updated on their own.</div>';\n      h+='<p class=\"hint\">Shingle and ridge cap item numbers depend on the color. Link your most common color here, and change it per job on the materials list.</p>';\n      var lastCat='';h+='<div class=\"card\">';\n      M.prices.slice().sort(function(a,b){return String(a.cat).localeCompare(String(b.cat));}).forEach(function(p){\n        if(p.cat!==lastCat){h+='<div class=\"cat\">'+esc(p.cat||'Other')+'</div>';lastCat=p.cat;}\n        var src=p.source==='abc'?'<span class=\"src abc\">ABC</span>':p.source==='starter'?'<span class=\"src starter\">Starter</span>':'<span class=\"src manual\">Yours</span>';\n        h+='<button class=\"ln\" data-m=\"price\" data-k=\"'+esc(p.key)+'\"><div class=\"l1\"><b>'+esc(p.name)+'</b><span>'+src+(p.abcItem?' \u00b7 ABC #'+esc(p.abcItem):'')+' \u00b7 '+dateStr(p.updated)+'</span></div><div class=\"l2 money\">'+money(p.price)+'<span>per '+esc(p.unit)+'</span></div></button>';\n      });\n      h+='</div><button class=\"btn ghost block\" data-m=\"price\" data-k=\"\">'+ICON.plus+'Add item</button>';\n    }\n    app.innerHTML=h+'</div>';\n  }\n\n  function priceSheet(key){\n    var p=M.prices.filter(function(z){return z.key===key;})[0]||{key:'',name:'',unit:'each',price:'',cat:'Other',abcItem:'',uom:''};\n    var conn=M.settings.abc&&M.settings.abc.connected;\n    var ov=sheet('<h3>'+(p.key?'Edit item':'New item')+closeBtn()+'</h3>'+\n      '<label class=\"f\">Name</label><input class=\"in\" id=\"pn\" maxlength=\"120\" value=\"'+esc(p.name)+'\">'+\n      '<div class=\"row\"><div><label class=\"f\">Price</label><input class=\"in money\" id=\"pp\" inputmode=\"decimal\" value=\"'+p.price+'\"></div><div><label class=\"f\">Per</label><input class=\"in\" id=\"pu\" maxlength=\"20\" value=\"'+esc(p.unit)+'\"></div></div>'+\n      '<label class=\"f\">Category</label><input class=\"in\" id=\"pc2\" maxlength=\"40\" value=\"'+esc(p.cat)+'\">'+\n      '<label class=\"f\">ABC Supply item # <small>(for ordering and live prices)</small></label><div class=\"row\"><input class=\"in\" id=\"pa\" maxlength=\"40\" value=\"'+esc(p.abcItem)+'\"><input class=\"in\" id=\"pum\" maxlength=\"10\" style=\"flex:0 0 84px\" placeholder=\"UOM\" value=\"'+esc(p.uom)+'\"></div>'+\n      (conn?'<label class=\"f\">Find in ABC catalog</label><div class=\"row\"><input class=\"in\" id=\"psq\" placeholder=\"e.g. Oakridge Estate Gray\"><button class=\"btn dark\" id=\"psb\" style=\"flex:0 0 auto\">Search</button></div><div id=\"psr\"></div>':'')+\n      '<button class=\"btn block mt\" id=\"psv\">Save</button>'+(p.key&&!TAKEOFF.CATALOG.some(function(c){return c.key===p.key;})?'<button class=\"btn danger block mt\" id=\"pdel\">Delete item</button>':''));\n    if(conn)ov.querySelector('#psb').onclick=function(){\n      var r=ov.querySelector('#psr');r.innerHTML='<div class=\"loading\" style=\"padding:16px\"><div class=\"spin dk\"></div></div>';\n      call('abcSearch',{q:ov.querySelector('#psq').value}).then(function(items){\n        r.innerHTML=items.length?items.map(function(it){return '<button class=\"res\" data-it=\"'+esc(it.itemNumber)+'\" data-u=\"'+esc(it.uom)+'\"><b>'+esc(it.description)+'</b><span>#'+esc(it.itemNumber)+(it.uom?' \u00b7 '+esc(it.uom):'')+'</span></button>';}).join(''):'<p class=\"hint\">No matches.</p>';\n      }).catch(function(e){r.innerHTML='';err(e);});\n    };\n    ov.addEventListener('click',function(e){var b=e.target.closest('[data-it]');if(!b)return;ov.querySelector('#pa').value=b.getAttribute('data-it');ov.querySelector('#pum').value=b.getAttribute('data-u');toast('Linked. Save to keep it.');});\n    ov.querySelector('#psv').onclick=function(){\n      var args={key:p.key||undefined,name:ov.querySelector('#pn').value,unit:ov.querySelector('#pu').value,cat:ov.querySelector('#pc2').value,abcItem:ov.querySelector('#pa').value,uom:ov.querySelector('#pum').value};\n      var np=Number(ov.querySelector('#pp').value);if(String(np)!==String(p.price))args.price=np;\n      call('savePrice',args).then(function(r){var f=false;for(var i=0;i<M.prices.length;i++)if(M.prices[i].key===r.key){M.prices[i]=r;f=true;}if(!f)M.prices.push(r);closeSheet();render();toast('Saved');}).catch(err);\n    };\n    var d=ov.querySelector('#pdel');if(d)d.onclick=function(){call('deletePrice',{key:p.key}).then(function(){M.prices=M.prices.filter(function(z){return z.key!==p.key;});closeSheet();render();toast('Deleted');}).catch(err);};\n  }\n\n  /* ---------- settings ---------- */\n  function renderSettings(){\n    var s=M.settings;var a=s.abc||{};\n    var h=bar('<button class=\"back\" data-m=\"mhome\">'+ICON.back+'Spending</button><div class=\"bar-title\">Settings</div>')+'<div class=\"wrap\"><form id=\"sf\">'+\n      '<div class=\"card\"><h2>Orders</h2>'+\n      '<div class=\"row\"><div><label class=\"f\">Delivery contact</label><input class=\"in\" name=\"contactName\" value=\"'+esc(s.contactName||'')+'\" placeholder=\"Your name\"></div>'+\n      '<div><label class=\"f\">Phone</label><input class=\"in\" name=\"contactPhone\" inputmode=\"tel\" value=\"'+esc(s.contactPhone||'')+'\" placeholder=\"(860) 854-9335\"></div></div>'+\n      '<div class=\"row\"><div><label class=\"f\">Sales tax %</label><input class=\"in money\" name=\"taxRate\" inputmode=\"decimal\" value=\"'+(s.taxRate!=null?s.taxRate:6.35)+'\"></div>'+\n      '<div><label class=\"f\">Waste %</label><input class=\"in money\" name=\"waste\" inputmode=\"numeric\" value=\"'+(s.waste!=null?s.waste:10)+'\"></div>'+\n      '<div><label class=\"f\">Ice &amp; water rows</label><input class=\"in money\" name=\"iceCourses\" inputmode=\"numeric\" value=\"'+(s.iceCourses!=null?s.iceCourses:2)+'\"></div></div>'+\n      '<p class=\"hint\">Ice &amp; water rows: how many 3 ft rows go along the eaves (2 rows = 6 ft).</p></div>'+\n      '<div class=\"card\"><h2>Supplier emails <small>for \u201cSend order by email\u201d</small></h2><div id=\"sups\">'+\n      (s.suppliers.length?s.suppliers:[{name:'',email:''}]).map(supRow).join('')+'</div><button type=\"button\" class=\"btn ghost block mt\" data-m=\"addsup\">'+ICON.plus+'Add supplier</button></div>'+\n      (isOwner()?'':'<!--')+'<div class=\"card\"><h2>ABC Supply <small>'+(a.connected?'<span class=\"pill done\">Connected</span>':'<span class=\"pill\">Not connected</span>')+'</small></h2>'+\n      '<p class=\"hint\">Get these from the ABC Supply developer portal (Individual Business). Start in Test (Sandbox), then switch to Live once ABC approves production access.</p>'+\n      '<label class=\"f\">Mode</label><div class=\"seg\" id=\"aenv\"><button type=\"button\" data-env=\"sandbox\" class=\"'+(a.env!=='production'?'on':'')+'\">Test (Sandbox)</button><button type=\"button\" data-env=\"production\" class=\"'+(a.env==='production'?'on':'')+'\">Live</button></div>'+\n      '<label class=\"f\">Client ID</label><input class=\"in\" name=\"clientId\" autocomplete=\"off\" value=\"'+esc(a.clientId||'')+'\">'+\n      '<label class=\"f\">Client secret</label><input class=\"in\" name=\"secret\" type=\"password\" autocomplete=\"new-password\" placeholder=\"'+(a.hasSecret?'Saved. Type to replace':'')+'\">'+\n      '<div class=\"row\"><div><label class=\"f\">Ship-to account #</label><input class=\"in\" name=\"shipTo\" value=\"'+esc(a.shipTo||'')+'\"></div>'+\n      '<div><label class=\"f\">Branch #</label><input class=\"in\" name=\"branch\" value=\"'+esc(a.branch||'')+'\"></div></div>'+\n      '<input type=\"hidden\" name=\"branchName\" value=\"'+esc(a.branchName||'')+'\">'+\n      (a.branchName?'<p class=\"hint\">Branch: '+esc(a.branchName)+'</p>':'')+\n      '<div class=\"acts\"><button type=\"button\" class=\"btn ghost\" data-m=\"abctest\">Test login</button><button type=\"button\" class=\"btn ghost\" data-m=\"branches\">Find CT branches</button></div><div id=\"brs\"></div>'+\n      (a.connected?'<div class=\"acts\"><button type=\"button\" class=\"btn ghost\" data-m=\"hook\"'+(a.webhookId?' disabled':'')+'>'+(a.webhookId?'Order updates on':'Turn on order updates')+'</button><button type=\"button\" class=\"btn danger\" data-m=\"disc\">Disconnect</button></div>':'')+\n      '</div>'+(isOwner()?'':'-->')+settingsExtraCards()+(isOwner()?contractCards():'')+'<button class=\"btn block\" type=\"submit\">Save settings</button></form></div>';\n    app.innerHTML=h;\n    wireContractSig();\n    var env=a.env||'sandbox';\n    document.getElementById('sf').addEventListener('click',function(e){var b=e.target.closest('[data-sw]');if(!b)return;b.classList.toggle('on');b.setAttribute('aria-checked',b.classList.contains('on'));});\n    if(isOwner())loadPeople();\n    if(document.getElementById('aenv'))document.getElementById('aenv').onclick=function(e){var b=e.target.closest('[data-env]');if(!b)return;env=b.getAttribute('data-env');this.querySelectorAll('button').forEach(function(z){z.classList.toggle('on',z===b);});};\n    document.getElementById('sf').onsubmit=function(e){e.preventDefault();saveSettings(this,env);};\n  }\n  function supRow(p){return '<div class=\"row sup\" style=\"margin-top:8px\"><input class=\"in\" placeholder=\"Supplier name\" data-sn value=\"'+esc(p.name)+'\"><input class=\"in\" placeholder=\"orders@supplier.com\" type=\"email\" data-se value=\"'+esc(p.email)+'\"></div>';}\n  function saveSettings(f,env){\n    var sups=[];f.querySelectorAll('.sup').forEach(function(r){var n=r.querySelector('[data-sn]').value.trim(),e=r.querySelector('[data-se]').value.trim();if(n||e)sups.push({name:n,email:e});});\n    var bad=sups.filter(function(x){return !x.name||!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(x.email);});\n    if(bad.length){toast('Each supplier needs a name and a valid email.',true);return Promise.reject(new Error('bad'));}\n    var el=f.elements;\n    var args={contactName:el.contactName.value,contactPhone:el.contactPhone.value,taxRate:el.taxRate.value,waste:el.waste.value,iceCourses:el.iceCourses.value,suppliers:sups};\n    if(el.clientId)args.abc={env:env,clientId:el.clientId.value,shipTo:el.shipTo.value,branch:el.branch.value,branchName:el.branchName.value,secret:el.secret.value};\n    if(el.co_name)Object.assign(args,extraSettingsArgs(f));\n    contractArgs(f,args);\n    return call('saveSettings',args).then(function(r){M.settings=r;render();toast('Settings saved');return r;}).catch(function(e){err(e);throw e;});\n  }\n\n  /* ---------- new estimate (address only) ---------- */\n    /* ----- Shingle color book: drawn samples of each Owens Corning color we offer (approximate on screen) ----- */\n  var COLOR_BOOK=[\n    {pkg:0,name:'Oakridge',colors:['Onyx Black','Estate Gray','Driftwood','Brownwood','Teak','Desert Tan']},\n    {pkg:1,name:'Duration',colors:['Onyx Black','Estate Gray','Driftwood','Brownwood','Teak','Williamsburg Gray','Slatestone Gray','Peppercorn','Colonial Slate','Sierra Gray','Harbor Blue','Chateau Green','Midnight Plum','Desert Rose','Sand Castle','Terra Cotta']},\n    {pkg:2,name:'Duration FLEX',colors:['Onyx Black','Black Sable','Estate Gray','Driftwood','Brownwood','Teak','Summer Harvest']}\n  ];\n  /* granule blends per color: main tones first, accent tones last */\n  var COLOR_TONES={\n    'Onyx Black':['#1c1e20','#25272a','#2e3033','#3a3c3f','#46484b'],\n    'Black Sable':['#24211e','#2f2b27','#3b3530','#4a4239','#5a4e42'],\n    'Estate Gray':['#3a3d3e','#4b4f50','#5d6162','#707475','#858989','#2f3132'],\n    'Driftwood':['#3a3631','#4f4740','#665a4e','#7d6e5d','#94846f','#5e4436','#6c6e6c'],\n    'Brownwood':['#2f2420','#3f2f28','#523c32','#664a3c','#7a5a47','#3b3330'],\n    'Teak':['#352c27','#463a33','#58493f','#6b594c','#7e6a5a','#3e3836'],\n    'Desert Tan':['#5d4c3f','#73604f','#8a7460','#a08872','#b59d85','#655a52'],\n    'Williamsburg Gray':['#36383c','#45474c','#55585d','#66696e','#787b80','#4d4746'],\n    'Slatestone Gray':['#464b4c','#575d5e','#696f70','#7c8282','#8f9494','#4f4b48'],\n    'Peppercorn':['#2e2e2b','#3d3d39','#4d4d48','#5f5f59','#73736c','#3a3532'],\n    'Colonial Slate':['#3f3a37','#514a46','#645b56','#776d66','#5a453d','#8a817a'],\n    'Sierra Gray':['#6b6c68','#7d7e7a','#90918c','#a2a39e','#b5b6b0','#5d5b57'],\n    'Harbor Blue':['#2c363e','#3a4650','#495762','#5a6974','#6d7c86','#3d3f43'],\n    'Chateau Green':['#26332c','#33433a','#41544a','#50655a','#62776b','#3a3a34'],\n    'Midnight Plum':['#2f2e35','#3d3b44','#4c4954','#5c5864','#4a3a43','#6c6873'],\n    'Desert Rose':['#4f3a31','#644a3f','#7a5b4d','#8f6d5d','#a4806e','#5a4a44'],\n    'Sand Castle':['#706352','#857765','#998b78','#ad9f8b','#c1b39e','#655e57'],\n    'Terra Cotta':['#5c3328','#723f32','#88503f','#9c604d','#b0725d','#4a3a33'],\n    'Summer Harvest':['#54473e','#6a5b4f','#807061','#968574','#ac9a87','#6b4c3e']\n  };\n  var swatchCache={};\n  function seedRand(str){var h=1779033703^str.length;for(var i=0;i<str.length;i++){h=Math.imul(h^str.charCodeAt(i),3432918353);h=h<<13|h>>>19;}\n    return function(){h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);var t=(h^=h>>>16)>>>0;return t/4294967296;};}\n  function hexRgb(hx){var n=parseInt(hx.slice(1),16);return [n>>16&255,n>>8&255,n&255];}\n  /* Draws laminated architectural shingles: 5 courses of random-width tabs, each tab a blend of the color's granules */\n  function drawShingles(name,w,h){\n    var key=name+'|'+w+'x'+h;if(swatchCache[key])return swatchCache[key];\n    var tones=(COLOR_TONES[name]||COLOR_TONES['Estate Gray']).map(hexRgb),rnd=seedRand(name);\n    var cv=document.createElement('canvas');cv.width=w;cv.height=h;var ctx=cv.getContext('2d');var im=ctx.createImageData(w,h),d=im.data;\n    var rows=5,rh=h/rows,courses=[];\n    for(var r=0;r<rows;r++){var x=-Math.round(rnd()*w*0.12),tabs=[];\n      while(x<w){var tw=Math.round(w*(0.11+rnd()*0.14));var t=Math.floor(rnd()*(tones.length));if(rnd()<0.12)t=tones.length-1-Math.floor(rnd()*2);\n        tabs.push({x0:x,x1:x+tw,tone:t,lean:(rnd()-0.5)*0.12,band:rnd()<0.45?0.25+rnd()*0.3:0,bandTone:Math.floor(rnd()*2),mix:rnd()});x+=tw;}\n      courses.push(tabs);}\n    for(var y=0;y<h;y++){var r2=Math.min(rows-1,Math.floor(y/rh)),ty=(y-r2*rh)/rh,tabs2=courses[r2];\n      for(var xx=0;xx<w;xx++){\n        var tab=null,edge=99;\n        for(var k=0;k<tabs2.length;k++){var tb=tabs2[k],off=tb.lean*ty*rh,a=tb.x0+off,b=tb.x1+(k+1<tabs2.length?tabs2[k+1].lean*ty*rh:0);\n          if(xx>=a&&xx<b){tab=tb;edge=Math.min(xx-a,b-xx);break;}}\n        if(!tab)tab=tabs2[tabs2.length-1];\n        var base=tones[tab.tone];\n        /* lamination shadow band at the top of some tabs */\n        if(tab.band&&ty<tab.band)base=tones[tab.bandTone];\n        var c0=base;\n        /* granule speckle from the other tones */\n        var rr=rnd();\n        if(rr<0.10)c0=tones[Math.floor(rnd()*tones.length)];\n        var n=(rnd()-0.5)*26,shade=1;\n        if(ty>0.93)shade=0.45;               /* course shadow line */\n        else if(ty<0.06)shade=0.82;          /* overlap shade */\n        if(edge<1.2)shade*=0.55;             /* gap between tabs */\n        shade*=1-0.10*ty*tab.mix;            /* slight blend down each tab */\n        var p=(y*w+xx)*4;\n        d[p]=Math.max(0,Math.min(255,(c0[0]+n)*shade));d[p+1]=Math.max(0,Math.min(255,(c0[1]+n)*shade));d[p+2]=Math.max(0,Math.min(255,(c0[2]+n)*shade));d[p+3]=255;\n      }}\n    ctx.putImageData(im,0,0);\n    var url=cv.toDataURL('image/jpeg',0.86);swatchCache[key]=url;return url;\n  }\n\n\n  /* Owens Corning's free Design EyeQ\u00ae widget (owenscorning.com/roofing/widgets/designeyeq) */\n  var vizCtx=null,vizGuess='';\n  /* If the visualizer ever reports a color to this page, remember it to suggest it */\n  window.addEventListener('message',function(ev){\n    var host='';try{host=new URL(ev.origin).hostname;}catch(e){return;}\n    if(!/(^|\\.)owenscorning\\.com$/.test(host))return;\n    var s='';try{s=typeof ev.data==='string'?ev.data:JSON.stringify(ev.data);}catch(e){return;}\n    COLORS.forEach(function(c){if(s.indexOf(c)>=0)vizGuess=c;});\n  });\n  /* After the visualizer: one tap to put the customer's color on the estimate */\n  function askVizColor(pkg,onPick){\n    var cur=COLOR_BOOK[pkg]?pkg:1,ov=sheet('');\n    function draw(){\n      var b=COLOR_BOOK[cur];\n      ov.querySelector('.sheet').innerHTML='<div class=\"grab\"></div><h3>Which color did they like?'+closeBtn()+'</h3>'+\n        '<div class=\"seg\" id=\"vbk\">'+COLOR_BOOK.map(function(x,i){return '<button type=\"button\" class=\"'+(i===cur?'on':'')+'\" data-cb=\"'+i+'\">'+esc(x.name)+'</button>';}).join('')+'</div>'+\n        (vizGuess?'<p class=\"hint\">The visualizer showed <b>'+esc(vizGuess)+'</b>.</p>':'<p class=\"hint\">Tap the color to put it on the estimate.</p>')+\n        '<div class=\"cgrid\">'+b.colors.map(function(n){return '<button type=\"button\" class=\"ctile'+(n===vizGuess?' on':'')+'\" data-vpick=\"'+esc(n)+'\"><img src=\"'+drawShingles(n,240,240)+'\" alt=\"\"><span>'+esc(n)+'</span></button>';}).join('')+'</div>'+\n        '<button type=\"button\" class=\"btn ghost block mt\" data-close>Skip</button>';\n    }\n    draw();\n    ov.addEventListener('click',function(ev){\n      var t=ev.target.closest('[data-cb],[data-vpick]');if(!t)return;\n      if(t.hasAttribute('data-cb')){cur=+t.getAttribute('data-cb');draw();return;}\n      var n=t.getAttribute('data-vpick');closeSheet();onPick(n,cur);toast('Color set: '+n);\n    });\n  }\n  /* Owens Corning's free Shingle Widget (owenscorning.com/roofing/widgets/shingle-widget): real color photos */\n  var OC_LINES=['oakridge','trudefinition-duration','trudefinition-duration-flex'];\n  function ocSite(){return 'sitedomain='+encodeURIComponent(location.hostname)+'&sitepath='+encodeURIComponent(location.pathname)+'&siteurl='+encodeURIComponent(location.origin+location.pathname);}\n  function openShinglePhotos(pkg,onPick){\n    var cur=COLOR_BOOK[pkg]?pkg:1;\n    vizCtx=onPick?{pkg:cur,onPick:onPick}:null;\n    var ov=document.getElementById('shov');\n    if(!ov){ov=document.createElement('div');ov.id='shov';ov.className='vizov shov';document.body.appendChild(ov);}\n    function draw(){\n      ov.innerHTML='<div class=\"vizbar\"><b>Color photos</b><span>by Owens Corning</span><button class=\"x\" id=\"shx\" aria-label=\"Close\">'+ICON.x+'</button></div>'+\n        '<div class=\"seg\" id=\"shk\" style=\"margin:8px 8px 0\">'+COLOR_BOOK.map(function(x,i){return '<button type=\"button\" class=\"'+(i===cur?'on':'')+'\" data-sk=\"'+i+'\">'+esc(x.name)+'</button>';}).join('')+'</div>'+\n        '<iframe class=\"ocf\" title=\"Owens Corning '+esc(COLOR_BOOK[cur].name)+' colors\" src=\"https://www.owenscorning.com/public_widgets/shingle/'+OC_LINES[cur]+'?view=shingle&style=default&layout=stacked&allowedcolors=&widget=true&'+ocSite()+'\"></iframe>';\n      ov.querySelector('#shk').onclick=function(ev){var b=ev.target.closest('[data-sk]');if(!b)return;cur=+b.getAttribute('data-sk');if(vizCtx)vizCtx.pkg=cur;draw();};\n      ov.querySelector('#shx').onclick=function(){ov.style.display='none';ov.innerHTML='';document.body.style.overflow='';if(vizCtx){var c=vizCtx;vizCtx=null;askVizColor(c.pkg,c.onPick);}};\n    }\n    draw();ov.style.display='flex';document.body.style.overflow='hidden';\n  }\n  function openVisualizer(pkg,onPick){\n    vizCtx=onPick?{pkg:pkg,onPick:onPick}:null;\n    var zip=((M.est&&M.est.address||'').match(/\\b(\\d{5})\\b/)||[])[1]||'06037';\n    var ov=document.getElementById('vizov');\n    if(!ov){\n      ov=document.createElement('div');ov.id='vizov';ov.className='vizov';\n      ov.innerHTML='<div class=\"vizbar\"><b>Roof visualizer</b><span>Design EyeQ\u00ae by Owens Corning</span><button class=\"x\" id=\"vizx\" aria-label=\"Close\">'+ICON.x+'</button></div>'+\n        '<div class=\"vizbody\"><p class=\"hint\" style=\"margin:10px 2px\">Take or upload a photo of the customer\u2019s house, or pick a sample home, then try Owens Corning colors.</p><div id=\"visualizer\" data-zip=\"'+zip+'\"></div><p class=\"hint\" id=\"vizerr\" style=\"display:none\">The visualizer didn\u2019t load. Check your signal and try again.</p></div>';\n      document.body.appendChild(ov);\n      var s=document.createElement('script');s.src='https://apis.owenscorning.com/client/widget.js';s.async=true;\n      s.onerror=function(){var e=document.getElementById('vizerr');if(e)e.style.display='block';ov.remove();toast('The visualizer didn\u2019t load. Check your signal and try again.',true);document.body.style.overflow='';};\n      document.body.appendChild(s);\n      ov.querySelector('#vizx').onclick=function(){ov.style.display='none';document.body.style.overflow='';if(vizCtx){var c=vizCtx;vizCtx=null;askVizColor(c.pkg,c.onPick);}};\n    }\n    ov.style.display='block';ov.scrollTop=0;document.body.style.overflow='hidden';\n  }\n  function colorBook(pkg,onPick,current){\n    var cur=COLOR_BOOK[pkg]?pkg:1,ov=null;\n    function list(){\n      var b=COLOR_BOOK[cur];\n      ov.querySelector('.sheet').innerHTML='<div class=\"grab\"></div><h3>Shingle colors'+closeBtn()+'</h3>'+\n        '<div class=\"seg\" id=\"cbk\">'+COLOR_BOOK.map(function(x,i){return '<button type=\"button\" class=\"'+(i===cur?'on':'')+'\" data-cb=\"'+i+'\">'+esc(x.name)+'</button>';}).join('')+'</div>'+\n        '<div class=\"acts\" style=\"margin-top:4px\"><button type=\"button\" class=\"btn ghost\" data-ocp>Real color photos</button><button type=\"button\" class=\"btn ghost\" data-viz>See it on a house</button></div>'+\n        '<p class=\"hint\">Owens Corning '+esc(b.name)+' \u00b7 '+b.colors.length+' colors. Tap one to show it big.</p>'+\n        '<div class=\"cgrid\">'+b.colors.map(function(n){return '<button type=\"button\" class=\"ctile'+(n===current?' on':'')+'\" data-cn=\"'+esc(n)+'\"><img src=\"'+drawShingles(n,240,240)+'\" alt=\"\"><span>'+esc(n)+'</span></button>';}).join('')+'</div>'+\n        '<p class=\"hint mt\">Drawn samples are close, not exact. Confirm with the real sample board.</p>';\n    }\n    function big(n){\n      var b=COLOR_BOOK[cur],i=b.colors.indexOf(n),prev=b.colors[(i+b.colors.length-1)%b.colors.length],next=b.colors[(i+1)%b.colors.length];\n      ov.querySelector('.sheet').innerHTML='<div class=\"grab\"></div><h3>'+esc(n)+closeBtn()+'</h3>'+\n        '<img class=\"big cbig\" src=\"'+drawShingles(n,720,720)+'\" alt=\"'+esc(n)+' shingle sample\">'+\n        '<p class=\"hint\">Owens Corning '+esc(b.name)+' \u00b7 '+esc(n)+'. Colors on screen are close, not exact.</p>'+\n        '<div class=\"acts\"><button type=\"button\" class=\"btn ghost\" data-cn=\"'+esc(prev)+'\">\u2039 '+esc(prev)+'</button><button type=\"button\" class=\"btn ghost\" data-cn=\"'+esc(next)+'\">'+esc(next)+' \u203a</button></div>'+\n        '<div class=\"acts\"><button type=\"button\" class=\"btn ghost\" data-cball>All colors</button>'+(onPick?'<button type=\"button\" class=\"btn\" data-cuse=\"'+esc(n)+'\">Use this color</button>':'<button type=\"button\" class=\"btn\" data-close>Done</button>')+'</div>';\n    }\n    ov=sheet('');list();\n    ov.addEventListener('click',function(ev){\n      var t=ev.target.closest('[data-cb],[data-cn],[data-cball],[data-cuse],[data-viz],[data-ocp]');if(!t)return;\n      if(t.hasAttribute('data-ocp')){closeSheet();openShinglePhotos(cur,onPick);return;}\n      if(t.hasAttribute('data-viz')){closeSheet();openVisualizer(cur,onPick);return;}\n      if(t.hasAttribute('data-cb')){cur=+t.getAttribute('data-cb');list();return;}\n      if(t.hasAttribute('data-cn')){big(t.getAttribute('data-cn'));ov.querySelector('.sheet').scrollTop=0;return;}\n      if(t.hasAttribute('data-cball')){list();return;}\n      if(t.hasAttribute('data-cuse')){var n=t.getAttribute('data-cuse');closeSheet();if(onPick)onPick(n,cur);}\n    });\n  }\n  var COLORS=COLOR_BOOK.reduce(function(a,b){b.colors.forEach(function(c){if(a.indexOf(c)<0)a.push(c);});return a;},[]);\n  var PITCHES=['2/12','3/12','4/12','5/12','6/12','7/12','8/12','9/12','10/12','11/12','12/12','14/12','16/12'];\n  function newEst(){M.est={type:(M.est&&M.est.type)||'replacement',items:[],address:'',name:'',phone:'',email:'',lat:0,lng:0,roofs:[],layers:1,pick:1,color:'',m:null,busy:false};}\n  function typeSeg(e){return '<div class=\"seg mt\" id=\"etype\">'+[['replacement','Replacement'],['repair','Repair']].map(function(t){return '<button type=\"button\" class=\"'+(e.type===t[0]?'on':'')+'\" data-et=\"'+t[0]+'\">'+t[1]+'</button>';}).join('')+'</div>';}\n  function renderNewRepair(){\n    var e=M.est;\n    var h=bar('<button class=\"back\" data-m=\"back\">'+ICON.back+'Quotes</button><div class=\"bar-title\">New estimate</div>')+'<div class=\"wrap\" id=\"ew\">'+typeSeg(e);\n    h+='<div class=\"card\"><h2>Address</h2><textarea class=\"in\" id=\"ea\" rows=\"2\" placeholder=\"45 Woodin St, Hamden, CT\" style=\"min-height:64px\">'+esc(e.address)+'</textarea></div>';\n    h+='<div class=\"card\"><h2>Repairs <small>tap \u2699 Quote prices to change prices</small></h2><div id=\"ers\"></div>'+addRepairSelect('es')+'<div class=\"tot mt\" id=\"ert\"></div></div>';\n    h+='<div class=\"card\"><h2>Customer <small>optional</small></h2>'+\n      '<label class=\"f\">Name</label><input class=\"in\" data-ef=\"name\" value=\"'+esc(e.name)+'\" autocomplete=\"off\">'+\n      '<div class=\"row\"><div><label class=\"f\">Phone</label><input class=\"in\" data-ef=\"phone\" inputmode=\"tel\" value=\"'+esc(e.phone)+'\"></div><div><label class=\"f\">Email</label><input class=\"in\" data-ef=\"email\" type=\"email\" value=\"'+esc(e.email)+'\"></div></div></div>'+\n      '<button class=\"btn block\" data-m=\"saveest\">Save quote</button>'+\n      '<button class=\"btn ghost block mt\" data-m=\"saveest\" data-v=\"email\">Save &amp; send for signature</button></div>';\n    app.innerHTML=h;\n    var root=document.getElementById('ew');\n    function draw(soft){if(!soft)document.getElementById('ers').innerHTML=e.items.length?itemRows(e.items,'es'):'<p class=\"hint\">Add the repairs from the list below.</p>';\n      var sub=e.items.reduce(function(n,it){return n+(Number(it.qty)||0)*(Number(it.price)||0);},0);var tot=repairTotal(e.items);\n      document.getElementById('ert').innerHTML=(tot>sub&&e.items.length?kv('Minimum service charge applies',''):'')+'<div class=\"kv grand\"><span>Total</span><b class=\"money\">'+money(e.items.length?tot:0)+'</b></div>';}\n    draw();wireItems(root,e.items,'es',draw);\n    root.addEventListener('input',function(ev){var t=ev.target;if(t.id==='ea')e.address=t.value;if(t.hasAttribute('data-ef'))e[t.getAttribute('data-ef')]=t.value;});\n    document.getElementById('etype').onclick=function(ev){var b=ev.target.closest('[data-et]');if(!b)return;e.type=b.getAttribute('data-et');render();};\n  }\n  function estRanges(){return TAKEOFF.priceRanges(M.pricing,M.est.roofs,M.est.layers);}\n  function renderNew(){\n    var e=M.est;var hasKey=M.settings.hasMapsKey;\n    if(e.type==='repair')return renderNewRepair();\n    var h=bar('<button class=\"back\" data-m=\"back\">'+ICON.back+'Quotes</button><div class=\"bar-title\">New estimate</div>')+'<div class=\"wrap\" id=\"ew\">'+typeSeg(e);\n    h+='<div class=\"card\"><h2>Address</h2><textarea class=\"in\" id=\"ea\" rows=\"2\" placeholder=\"45 Woodin St, Hamden, CT\" style=\"min-height:64px\">'+esc(e.address)+'</textarea>'+\n      (hasKey?'<button class=\"btn block mt\" data-m=\"measure\"'+(e.busy?' disabled':'')+'>'+(e.busy?'Measuring\u2026':'Measure roof')+'</button>':\n        '<div class=\"note\">Automatic roof measuring needs a Google Maps key (Quotes \u203a \u2699 Quote prices). For now, type the roof size below.</div>')+\n      (e.m&&e.m.image?'<img class=\"big mt\" src=\"'+e.m.image+'\" alt=\"Satellite view of '+esc(e.m.address)+'\">':(e.m&&e.m.map?'<div id=\"emap\" class=\"mt\" style=\"height:240px;border-radius:12px;overflow:hidden;background:#dde2e8\" role=\"img\" aria-label=\"Satellite view of '+esc(e.m.address)+'\"></div>':''))+\n      (e.m?'<p class=\"hint\">'+(e.m.source==='solar'?'Measured by Google: '+e.m.segments+' roof sections'+(e.m.imageryDate?' \u00b7 imagery '+esc(month(e.m.imageryDate)):''):'Address found. Enter the roof size.')+'</p>':'')+\n      (e.m&&e.m.extras&&e.m.extras.length?'<div class=\"note\">Also on the property and added below: '+e.m.extras.map(function(x){return '<b>'+esc(x.n)+'</b> '+x.s.toLocaleString()+' sq ft'+(x.est?' (size from the building outline, pitch estimated)':'')+', ~'+x.dist+' ft '+esc(x.dir);}).join('; ')+'. Remove any you\u2019re not quoting.</div>':'')+\n      (e.m&&e.m.flat&&e.m.flat.length?'<div class=\"note\">Flat roof'+(e.m.flat.length>1?'s':'')+' on the lot, not priced: '+e.m.flat.map(function(x){return esc(x.n)+' '+x.s.toLocaleString()+' sq ft';}).join('; ')+'.</div>':'')+\n      (e.m&&e.m.nearby&&e.m.nearby.length?'<p class=\"hint\">Nearby roofs (property lines unknown):</p>'+e.m.nearby.map(function(x,i){return '<button class=\"btn ghost block mt\" data-m=\"addnear\" data-i=\"'+i+'\">'+ICON.plus+'Add '+esc(x.n)+' \u00b7 '+x.s.toLocaleString()+' sq ft, ~'+x.dist+' ft '+esc(x.dir)+'</button>';}).join(''):'')+\n      (e.m&&e.m.note?'<div class=\"note\">'+esc(e.m.note)+'</div>':'')+'</div>';\n    h+='<div class=\"card\"><h2>Roof <small>sloped area, not footprint</small></h2><div id=\"eroofs\">'+\n      (e.roofs.length?e.roofs:[{n:'Main Roof',s:'',p:'6/12'}]).map(function(r,i){\n        return '<div class=\"row\" style=\"margin-top:'+(i?10:0)+'px\"><div style=\"flex:2\"><label class=\"f\">'+esc(r.n||'Roof')+' (sq ft)</label><input class=\"in money\" inputmode=\"numeric\" data-er=\"s\" data-i=\"'+i+'\" value=\"'+(r.s||'')+'\" placeholder=\"e.g. 2000\"></div>'+\n          '<div><label class=\"f\">Pitch</label><select class=\"in\" data-er=\"p\" data-i=\"'+i+'\">'+PITCHES.map(function(p){return '<option'+(p===r.p?' selected':'')+'>'+p+'</option>';}).join('')+(PITCHES.indexOf(r.p)<0&&r.p?'<option selected>'+esc(r.p)+'</option>':'')+'</select></div>'+\n          (i?'<button type=\"button\" class=\"x\" style=\"flex:0 0 36px;margin-bottom:5px\" data-m=\"rmroof\" data-i=\"'+i+'\" aria-label=\"Remove section\">'+ICON.x+'</button>':'')+'</div>';\n      }).join('')+'</div><button class=\"btn ghost block mt\" data-m=\"addroof\">'+ICON.plus+'Add a section (garage, porch\u2026)</button>'+\n      '<label class=\"f\">Layers to tear off</label><div class=\"seg\" id=\"elay\">'+[1,2,3].map(function(n){return '<button type=\"button\" class=\"'+(e.layers===n?'on':'')+'\" data-ly=\"'+n+'\">'+n+'</button>';}).join('')+'</div></div>';\n    h+='<div class=\"card\" id=\"eprice\"></div>';\n    h+='<div class=\"card\"><h2>Customer <small>optional</small></h2>'+\n      '<label class=\"f\">Name</label><input class=\"in\" data-ef=\"name\" value=\"'+esc(e.name)+'\" autocomplete=\"off\">'+\n      '<div class=\"row\"><div><label class=\"f\">Phone</label><input class=\"in\" data-ef=\"phone\" inputmode=\"tel\" value=\"'+esc(e.phone)+'\"></div><div><label class=\"f\">Email</label><input class=\"in\" data-ef=\"email\" type=\"email\" value=\"'+esc(e.email)+'\"></div></div></div>'+\n      '<button class=\"btn block\" data-m=\"saveest\">Save quote</button>'+\n      '<button class=\"btn ghost block mt\" data-m=\"saveest\" data-v=\"email\">Save &amp; email to customer</button>'+\n      '<p class=\"hint\" style=\"text-align:center;margin-top:14px\"><a href=\"#\" data-m=\"addlink\">Have a website quote link? Paste it instead</a></p></div>';\n    app.innerHTML=h;\n    drawEstPrices();drawEstMap();\n    if(!e.roofs.length)e.roofs=[{n:'Main Roof',s:0,p:'6/12'}];\n    var wrapEl=document.getElementById('ew');\n    wrapEl.addEventListener('input',function(ev){var t=ev.target;\n      if(t.id==='ea'){e.address=t.value;return;}\n      if(t.hasAttribute('data-ef')){e[t.getAttribute('data-ef')]=t.value;return;}\n      if(t.hasAttribute('data-er')){var r=e.roofs[+t.getAttribute('data-i')];if(!r)return;var k2=t.getAttribute('data-er');r[k2]=k2==='s'?(Number(String(t.value).replace(/[^\\d.]/g,''))||0):t.value;drawEstPrices();}\n      if(t.id==='ec'){e.color=t.value;}\n    });\n    wrapEl.addEventListener('change',function(ev){var t=ev.target;if(t.hasAttribute('data-er')){var r=e.roofs[+t.getAttribute('data-i')];if(r){var k3=t.getAttribute('data-er'),v3=k3==='s'?(Number(String(t.value).replace(/[^\\d.]/g,''))||0):t.value;if(r[k3]!==v3){r[k3]=v3;drawEstPrices();}}}});\n    document.getElementById('etype').onclick=function(ev){var b=ev.target.closest('[data-et]');if(!b)return;e.type=b.getAttribute('data-et');render();};\n    document.getElementById('elay').onclick=function(ev){var b=ev.target.closest('[data-ly]');if(!b)return;e.layers=+b.getAttribute('data-ly');this.querySelectorAll('button').forEach(function(z){z.classList.toggle('on',z===b);});drawEstPrices();};\n  }\n  function drawEstPrices(){\n    var e=M.est;var el=document.getElementById('eprice');if(!el)return;\n    var rg=estRanges();var total=e.roofs.reduce(function(n,r){return n+(Number(r.s)||0);},0);\n    el.innerHTML='<h2>Price <small>'+(total?Math.round(total).toLocaleString()+' sq ft \u00b7 '+(total/100).toFixed(1)+' squares':'enter the roof size')+'</small></h2>'+\n      '<div class=\"pkg\" id=\"epk\">'+PK.map(function(p,i){var r=rg[i]||[0,0];return '<button type=\"button\" class=\"'+(i===e.pick?'on':'')+'\" data-pk=\"'+i+'\"><b>'+p.label+'</b><span class=\"money\">'+(r[1]?money(r[0],false)+'\u2013'+money(r[1],false):'\u2014')+'</span></button>';}).join('')+'</div>'+\n      '<label class=\"f\">Color</label><div class=\"row\"><div style=\"flex:2\"><input class=\"in\" id=\"ec\" list=\"ecl\" maxlength=\"40\" value=\"'+esc(e.color)+'\" placeholder=\"e.g. Estate Gray\"></div><div><button type=\"button\" class=\"btn ghost block\" id=\"ecb\" style=\"min-height:44px\">'+(e.color&&COLOR_TONES[e.color]?'<img src=\"'+drawShingles(e.color,60,60)+'\" alt=\"\" style=\"width:22px;height:22px;border-radius:5px;margin-right:6px;vertical-align:middle\">':'')+'Show colors</button></div></div><datalist id=\"ecl\">'+COLORS.map(function(c){return '<option value=\"'+c+'\">';}).join('')+'</datalist>'+\n      (M.pricing.updated?'':'<div class=\"note\">These use starter prices per square. Set your own under \u2699 Quote prices.</div>');\n    document.getElementById('epk').onclick=function(ev){var b=ev.target.closest('[data-pk]');if(!b)return;e.pick=+b.getAttribute('data-pk');this.querySelectorAll('button').forEach(function(z){z.classList.toggle('on',z===b);});};\n    document.getElementById('ecb').onclick=function(){colorBook(e.pick,function(n,pk){e.color=n;e.pick=pk;drawEstPrices();},e.color);};\n  }\n  /* ----- roof measuring on the phone (same method as the website instant quote) ----- */\n  var mapsP=null;\n  function canMeasureHere(){return !!(M.settings&&M.settings.mapsKey)&&!/googleusercontent\\.com$|script\\.google\\.com$/.test(location.hostname);}\n  function loadMaps(){\n    if(window.google&&google.maps&&google.maps.importLibrary)return Promise.resolve();\n    if(mapsP)return mapsP;\n    mapsP=new Promise(function(ok,bad){\n      window.__tfAppMaps=function(){ok();};\n      window.gm_authFailure=function(){bad(new Error('KEY_BLOCKED'));};\n      var s=document.createElement('script');\n      s.src='https://maps.googleapis.com/maps/api/js?key='+encodeURIComponent(M.settings.mapsKey)+'&v=weekly&loading=async&callback=__tfAppMaps';\n      s.async=true;s.onerror=function(){mapsP=null;bad(new Error('No signal. Try again when you have signal.'));};\n      document.head.appendChild(s);\n    });\n    return mapsP;\n  }\n  function findPlace(address){\n    return google.maps.importLibrary('places').then(function(lib){\n      return lib.Place.searchByText({textQuery:address,fields:['location','formattedAddress'],maxResultCount:1,region:'us'})\n        .then(function(r){var p=r&&r.places&&r.places[0];if(p&&p.location)return p;throw 0;})\n        .catch(function(){\n          return lib.AutocompleteSuggestion.fetchAutocompleteSuggestions({input:address,includedRegionCodes:['us']}).then(function(r){\n            var s=r&&r.suggestions&&r.suggestions[0];if(!s||!s.placePrediction)throw new Error('Couldn\u2019t find that address. Check the street and town.');\n            var p=s.placePrediction.toPlace();return p.fetchFields({fields:['location','formattedAddress']}).then(function(){return p;});\n          });\n        });\n    });\n  }\n  function parseSolar(j){\n    var sp=j&&j.solarPotential,segs=(sp&&sp.roofSegmentStats)||[];\n    if(!segs.length)return null;\n    var sum=segs.reduce(function(h,p){return h+((p.stats&&p.stats.areaMeters2)||0);},0);\n    var area=(sp.wholeRoofStats&&sp.wholeRoofStats.areaMeters2)||sum;\n    var flatLim=Math.atan(2/12)*180/Math.PI,n=0,d=0,low=0,big=null;\n    segs.forEach(function(h){var a=(h.stats&&h.stats.areaMeters2)||0,b=h.pitchDegrees||0;\n      if(b<flatLim)low+=a;else{n+=a;d+=a*b;}\n      if(!big||a>((big.stats&&big.stats.areaMeters2)||0))big=h;});\n    var deg=n?d/n:(big.pitchDegrees||0);\n    var dt=j.imageryDate;\n    return {s:Math.round(area*10.7639),p:Math.round(Math.tan(deg*Math.PI/180)*12)+'/12',f:segs.length,\n      lowPct:sum?Math.round(low/sum*100):0,date:dt&&dt.year?dt.year+'-'+('0'+(dt.month||1)).slice(-2):'',quality:j.imageryQuality||''};\n  }\n\n  /* ----- all roofs on the property: same code as the website instant quote (team-forte.com/instant-quote) ----- */\n  function TFRoofScan(key){\n    const v = { googleApiKey: key, solarMinQuality: \"LOW\", findOtherRoofs: true, parcelLookup: true,\n      parcelServiceUrl: \"https://services3.arcgis.com/3FL1kr7L4LvwA2Kb/arcgis/rest/services/Connecticut_CAMA_and_Parcel_Layer_2024/FeatureServer/0\",\n      footprintServiceUrl: \"https://services3.arcgis.com/3FL1kr7L4LvwA2Kb/arcgis/rest/services/2D_Building_Footprints/FeatureServer/0\",\n      otherRoofMaxDistanceFt: 200, otherRoofMaxShown: 6 };\n    const L = false, oe = 10.7639,\n      ae = (e) => new Promise((s) => setTimeout(s, e)),\n      R = (e) => Math.tan((e * Math.PI) / 180) * 12,\n      H = (e) => (Math.atan(e / 12) * 180) / Math.PI;\n    const o = { address: null, parcel: null, extras: [] };\nfunction V(e) {\nconst s = e && e.solarPotential,\nt = (s && s.roofSegmentStats) || [];\nif (!t.length) throw new Error(\"no-segments\");\nlet a = (s.wholeRoofStats && s.wholeRoofStats.areaMeters2) || 0;\nconst r = t.reduce(\n(h, p) => h + ((p.stats && p.stats.areaMeters2) || 0),\n0,\n);\na || (a = r);\nlet n = 0,\nd = 0,\nu = 0,\nl = null;\nt.forEach((h) => {\nconst p = (h.stats && h.stats.areaMeters2) || 0,\nb = h.pitchDegrees || 0;\n(b < H(2) ? (u += p) : ((n += p), (d += p * b)),\n(!l || p > ((l.stats && l.stats.areaMeters2) || 0)) && (l = h));\n});\nconst g = n ? d / n : l.pitchDegrees || 0,\nf = e.imageryDate;\nreturn {\nareaSqft: Math.round(a * oe),\npitchDeg: g,\npitch12: Math.round(R(g)),\nfacets: t.length,\nlowSlopePct: r ? Math.round((u / r) * 100) : 0,\nquality: e.imageryQuality || \"\",\nimageryDate: f\n? new Date(f.year, (f.month || 1) - 1, f.day || 1).toLocaleDateString(\n\"en-US\",\n{ month: \"short\", year: \"numeric\" },\n)\n: \"\",\nsource: \"satellite\",\nsegments: t\n.filter((h) => h.boundingBox && h.center)\n.map((h) => ({\nbox: h.boundingBox,\ncenter: h.center,\nazimuth: h.azimuthDegrees || 0,\npitch: h.pitchDegrees || 0,\nground: (h.stats && h.stats.groundAreaMeters2) || 0,\n})),\nbuildingBox: e.boundingBox || null,\ngroundSqft: Math.round(\n((s.wholeRoofStats && s.wholeRoofStats.groundAreaMeters2) ||\nt.reduce((h, p) => h + ((p.stats && p.stats.groundAreaMeters2) || 0), 0)) * oe,\n),\nname: e.name || \"\",\ncenter: e.center || null,\n};\n}\nasync function ie(e, s) {\nconst t =\n\"https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=\" +\ne.toFixed(7) +\n\"&location.longitude=\" +\ns.toFixed(7) +\n\"&requiredQuality=\" +\nencodeURIComponent(v.solarMinQuality) +\n\"&key=\" +\nencodeURIComponent(v.googleApiKey),\na = await fetch(t);\nif (!a.ok) throw new Error(\"solar-\" + a.status);\nreturn V(await a.json());\n}\n/* ---------- All roofs on the property (main house, detached garage, barn, shed) ---------- */\nconst XR = { lat: 110540, lng: (la) => 111320 * Math.cos((la * Math.PI) / 180) };\nfunction xCenter(r) {\nif (r.center) return { lat: r.center.latitude, lng: r.center.longitude };\nif (r.buildingBox) {\nconst b = r.buildingBox;\nreturn {\nlat: (b.sw.latitude + b.ne.latitude) / 2,\nlng: (b.sw.longitude + b.ne.longitude) / 2,\n};\n}\nreturn { lat: o.address.lat, lng: o.address.lng };\n}\nfunction xDist(a, b) {\nconst dy = (b.lat - a.lat) * XR.lat,\ndx = (b.lng - a.lng) * XR.lng(a.lat);\nreturn { m: Math.sqrt(dx * dx + dy * dy), deg: ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360 };\n}\nconst XDIRS = [\"north\", \"northeast\", \"east\", \"southeast\", \"south\", \"southwest\", \"west\", \"northwest\"],\nORD = [\"Main Roof\", \"Second Roof\", \"Third Roof\", \"Fourth Roof\", \"Fifth Roof\", \"Sixth Roof\", \"Seventh Roof\"];\nfunction xKind(sqft) {\nreturn sqft < 260 ? \"Shed\" : sqft < 1100 ? \"Garage\" : sqft < 1900 ? \"Barn\" : \"Outbuilding\";\n}\n// Slope categories. Homeowners see the satellite pick and may only choose a steeper one.\nconst SLOPES = [\n{ id: \"flat\", t: \"Flat\", max: 1, rep: 1 },\n{ id: \"shallow\", t: \"Shallow\", max: 4, rep: 3 },\n{ id: \"medium\", t: \"Medium\", max: 8, rep: 6 },\n{ id: \"steep\", t: \"Steep\", max: 99, rep: 10 },\n];\nfunction slopeOf(p12) {\nreturn SLOPES.find((q) => p12 <= q.max).id;\n}\nfunction slopeIdx(id) {\nreturn SLOPES.findIndex((q) => q.id === id);\n}\nfunction satInit(r) {\nr.sat ||\n(r.sat = {\npitch12: r.pitch12,\npitchDeg: r.pitchDeg,\nareaSqft: r.areaSqft,\nground: r.groundSqft || Math.round(r.areaSqft * Math.cos((r.pitchDeg * Math.PI) / 180)),\nslope: r.noSat ? \"medium\" : slopeOf(r.pitch12),\n});\nr.slope || (r.slope = r.sat.slope);\nreturn r;\n}\nfunction setSlope(r, id) {\nsatInit(r);\nif (!r.noSat && slopeIdx(id) < slopeIdx(r.sat.slope)) return;\nr.slope = id;\nif (id === r.sat.slope) {\n((r.pitch12 = r.sat.pitch12), (r.pitchDeg = r.sat.pitchDeg), (r.areaSqft = r.sat.areaSqft));\nreturn;\n}\nconst p = SLOPES[slopeIdx(id)].rep,\nd = H(p);\n((r.pitch12 = p),\n(r.pitchDeg = d),\n(r.areaSqft = Math.max(r.sat.areaSqft, Math.round(r.sat.ground / Math.cos((d * Math.PI) / 180)))));\n}\nfunction xMake(roof, main, how) {\nconst d = xDist(xCenter(main), xCenter(roof));\nreturn {\nkey: roof.name || \"x\" + Math.random().toString(36).slice(2),\nroof: satInit(roof),\ndistFt: Math.round((d.m * 3.28084) / 5) * 5,\ndir: XDIRS[Math.round(d.deg / 45) % 8],\nkind: xKind(roof.areaSqft),\ninclude: !1,\nhow: how,\n};\n}\nfunction xNumber() {\no.extras.forEach((x, n) => {\nx.num = n + 2;\nx.label || (x.label = ORD[n + 1] || \"Roof \" + (n + 2));\n});\n}\n// Connecticut statewide parcel (property line) layer, public ArcGIS service.\nasync function fetchParcel(lat, lng) {\nif (v.parcelLookup === !1 || !v.parcelServiceUrl) return null;\nconst u =\nv.parcelServiceUrl +\n\"/query?\" +\nnew URLSearchParams({\ngeometry: lng.toFixed(7) + \",\" + lat.toFixed(7),\ngeometryType: \"esriGeometryPoint\",\ninSR: \"4326\",\nspatialRel: \"esriSpatialRelIntersects\",\noutFields: \"Parcel_ID\",\nreturnGeometry: \"true\",\noutSR: \"4326\",\nf: \"json\",\n});\nconst r = await Promise.race([fetch(u), ae(5e3).then(() => null)]);\nif (!r || !r.ok) return null;\nconst j = await r.json(),\nf = (j.features || [])[0];\nif (!f || !f.geometry || !f.geometry.rings || !f.geometry.rings.length) return null;\nreturn {\nid: (f.attributes && f.attributes.Parcel_ID) || \"\",\nrings: f.geometry.rings.map((g) => g.map((q) => ({ lat: q[1], lng: q[0] }))),\n};\n}\nfunction inParcel(p, pc) {\nlet inside = !1;\npc.rings.forEach((g) => {\nfor (let a = 0, b = g.length - 1; a < g.length; b = a++) {\nconst A = g[a],\nB = g[b];\nA.lat > p.lat != B.lat > p.lat &&\np.lng < ((B.lng - A.lng) * (p.lat - A.lat)) / (B.lat - A.lat) + A.lng &&\n(inside = !inside);\n}\n});\nreturn inside;\n}\nfunction inBox(p, b) {\nreturn b && p.lat >= b.sw.latitude && p.lat <= b.ne.latitude && p.lng >= b.sw.longitude && p.lng <= b.ne.longitude;\n}\nfunction ringXY(g) {\n// local meters relative to the first vertex (avoids float precision loss)\nconst o0 = g[0],\nkx = XR.lng(o0.lat);\nreturn g.map((q) => [(q.lng - o0.lng) * kx, (q.lat - o0.lat) * XR.lat]);\n}\nfunction ringArea(g) {\nconst p = ringXY(g);\nlet A = 0;\nfor (let a = 0, b = p.length - 1; a < p.length; b = a++) A += p[b][0] * p[a][1] - p[a][0] * p[b][1];\nreturn Math.abs(A / 2);\n}\nfunction ringCentroid(g) {\nconst p = ringXY(g),\no0 = g[0];\nlet x = 0,\ny = 0,\nA = 0;\nfor (let a = 0, b = p.length - 1; a < p.length; b = a++) {\nconst f = p[b][0] * p[a][1] - p[a][0] * p[b][1];\n((A += f), (x += (p[b][0] + p[a][0]) * f), (y += (p[b][1] + p[a][1]) * f));\n}\nreturn A ? { lat: o0.lat + y / (3 * A) / XR.lat, lng: o0.lng + x / (3 * A) / XR.lng(o0.lat) } : o0;\n}\n// Connecticut statewide 2D building footprints (2023 lidar), public ArcGIS service.\nasync function fetchFootprints(pc) {\nif (!v.footprintServiceUrl) return null;\nconst all = pc.rings.flat(),\npad = 2e-4,\nenv = {\nxmin: Math.min(...all.map((q) => q.lng)) - pad,\nymin: Math.min(...all.map((q) => q.lat)) - pad,\nxmax: Math.max(...all.map((q) => q.lng)) + pad,\nymax: Math.max(...all.map((q) => q.lat)) + pad,\nspatialReference: { wkid: 4326 },\n},\nbody = new URLSearchParams({\ngeometry: JSON.stringify(env),\ngeometryType: \"esriGeometryEnvelope\",\ninSR: \"4326\",\nspatialRel: \"esriSpatialRelIntersects\",\noutFields: \"OBJECTID\",\nreturnGeometry: \"true\",\noutSR: \"4326\",\nf: \"json\",\n});\nconst r = await Promise.race([fetch(v.footprintServiceUrl + \"/query\", { method: \"POST\", body: body }), ae(5e3).then(() => null)]);\nif (!r || !r.ok) return null;\nconst j = await r.json();\nif (!j.features) return null;\nreturn j.features\n.filter((f) => f.geometry && f.geometry.rings && f.geometry.rings.length)\n.map((f) => {\nconst rings = f.geometry.rings.map((g) => g.map((q) => ({ lat: q[1], lng: q[0] }))),\nouter = rings.reduce((a, b) => (ringArea(b) > ringArea(a) ? b : a));\nreturn { id: f.attributes.OBJECTID, rings: rings, c: ringCentroid(outer), groundSqft: Math.round(ringArea(outer) * oe) };\n});\n}\nfunction hull(pts) {\nconst p = pts.slice().sort((a, b) => a.lng - b.lng || a.lat - b.lat),\ncr = (O2, A, B) => (A.lng - O2.lng) * (B.lat - O2.lat) - (A.lat - O2.lat) * (B.lng - O2.lng),\nlo = [],\nup = [];\np.forEach((q) => {\nfor (; lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0; ) lo.pop();\nlo.push(q);\n});\np.slice()\n.reverse()\n.forEach((q) => {\nfor (; up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0; ) up.pop();\nup.push(q);\n});\nreturn lo.slice(0, -1).concat(up.slice(0, -1));\n}\nfunction segDistM(p, A, B) {\nconst kx = XR.lng(p.lat),\nax = (A.lng - p.lng) * kx,\nay = (A.lat - p.lat) * XR.lat,\nbx = (B.lng - p.lng) * kx,\nby = (B.lat - p.lat) * XR.lat,\ndx = bx - ax,\ndy = by - ay,\nt = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / (dx * dx + dy * dy || 1)));\nreturn Math.hypot(ax + t * dx, ay + t * dy);\n}\n// Part of the lidar building outline the satellite roof data doesn't cover\n// (often an attached/adjacent garage or addition). Rasterizes the outline on a\n// 0.5 m grid, removes cells under the satellite roof facets, keeps the largest\n// leftover patch. Returns a roof or null.\nfunction uncoveredPart(main, fp) {\nconst sg = main.groundSqft || 0;\nif (!sg || fp.groundSqft - sg < 80 || !(main.segments || []).length) return null;\nconst outer = fp.rings.reduce((a, b) => (ringArea(b) > ringArea(a) ? b : a)),\no0 = outer[0],\nkx = XR.lng(o0.lat),\nP = (q) => [(q.lng - o0.lng) * kx, (q.lat - o0.lat) * XR.lat],\npoly = outer.map(P),\nboxes = main.segments.map((q) => {\nconst a = P({ lat: q.box.sw.latitude, lng: q.box.sw.longitude }),\nb = P({ lat: q.box.ne.latitude, lng: q.box.ne.longitude });\nreturn [a[0] - 0.8, a[1] - 0.8, b[0] + 0.8, b[1] + 0.8];\n}),\ninPoly = (x, y) => {\nlet c2 = !1;\nfor (let a = 0, b = poly.length - 1; a < poly.length; b = a++) {\nconst A = poly[a],\nB = poly[b];\nA[1] > y != B[1] > y && x < ((B[0] - A[0]) * (y - A[1])) / (B[1] - A[1]) + A[0] && (c2 = !c2);\n}\nreturn c2;\n},\nst = 0.5,\nxs = poly.map((q) => q[0]),\nys = poly.map((q) => q[1]),\nx0 = Math.min(...xs),\ny0 = Math.min(...ys),\nW = Math.ceil((Math.max(...xs) - x0) / st),\nHh = Math.ceil((Math.max(...ys) - y0) / st);\nif (W * Hh > 4e5) return null;\nconst grid = new Uint8Array(W * Hh);\nfor (let r = 0; r < Hh; r++)\nfor (let q = 0; q < W; q++) {\nconst x = x0 + (q + 0.5) * st,\ny = y0 + (r + 0.5) * st;\ninPoly(x, y) && !boxes.some((b) => x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3]) && (grid[r * W + q] = 1);\n}\nlet best = null;\nconst seen = new Uint8Array(W * Hh);\nfor (let k = 0; k < W * Hh; k++) {\nif (!grid[k] || seen[k]) continue;\nconst stack = [k],\ncells = [];\nfor (seen[k] = 1; stack.length; ) {\nconst c3 = stack.pop();\ncells.push(c3);\nconst r = Math.floor(c3 / W),\nq = c3 % W;\n[\n[1, 0],\n[-1, 0],\n[0, 1],\n[0, -1],\n].forEach(([dr, dq]) => {\nconst rr = r + dr,\nqq = q + dq,\nkk = rr * W + qq;\nrr >= 0 && rr < Hh && qq >= 0 && qq < W && grid[kk] && !seen[kk] && ((seen[kk] = 1), stack.push(kk));\n});\n}\n(!best || cells.length > best.length) && (best = cells);\n}\nif (!best) return null;\nconst g = Math.round(best.length * st * st * oe);\nif (g < 100) return null;\nconst pts = [];\nbest.forEach((c3) => {\nconst r = Math.floor(c3 / W),\nq = c3 % W;\n[\n[0, 0],\n[1, 0],\n[0, 1],\n[1, 1],\n].forEach(([a, b]) =>\npts.push({ lat: o0.lat + (y0 + (r + a) * st) / XR.lat, lng: o0.lng + (x0 + (q + b) * st) / kx }),\n);\n});\nconst h = hull(pts),\nd = H(6),\ncc = ringCentroid(h);\nreturn {\nareaSqft: Math.round(g / Math.cos((d * Math.PI) / 180)),\npitchDeg: d,\npitch12: 6,\nfacets: 2,\nlowSlopePct: 0,\nquality: \"\",\nimageryDate: \"\",\nsource: \"footprint\",\nnoSat: !0,\nsegments: [],\nfootprint: { rings: [h] },\nbuildingBox: fpBox({ rings: [h] }),\ngroundSqft: g,\nname: \"part-\" + fp.id,\ncenter: { latitude: cc.lat, longitude: cc.lng },\n};\n}\nfunction fpBox(fp) {\nconst all = fp.rings.flat();\nreturn {\nsw: { latitude: Math.min(...all.map((q) => q.lat)), longitude: Math.min(...all.map((q) => q.lng)) },\nne: { latitude: Math.max(...all.map((q) => q.lat)), longitude: Math.max(...all.map((q) => q.lng)) },\n};\n}\nasync function scanExtras(main) {\no.parcel = null;\nif (v.findOtherRoofs === !1) return [];\nif (L) {\no.parcel = { id: \"demo\", rings: [] };\nreturn [\n{\nkey: \"demo-garage\",\nroof: satInit({ areaSqft: 610, pitchDeg: 26.57, pitch12: 6, facets: 2, lowSlopePct: 0, quality: \"DEMO\", imageryDate: \"\", source: \"demo\", segments: [], buildingBox: null, groundSqft: 545 }),\ndistFt: 55, dir: \"east\", kind: \"Garage\", include: !0, how: \"parcel\",\n},\n{\nkey: \"demo-shed\",\nroof: satInit({ areaSqft: 150, pitchDeg: 18.43, pitch12: 3, facets: 2, lowSlopePct: 0, quality: \"DEMO\", imageryDate: \"\", source: \"demo\", segments: [], buildingBox: null, groundSqft: 142 }),\ndistFt: 90, dir: \"southeast\", kind: \"Shed\", include: !0, how: \"parcel\",\n},\n];\n}\nconst c = xCenter(main);\nlet pc = null;\ntry {\n// The lot must contain the measured house; the address point can land across the street.\npc = await fetchParcel(o.address.lat, o.address.lng);\n(pc && inParcel(c, pc)) || (pc = await fetchParcel(c.lat, c.lng));\npc && !inParcel(c, pc) && (pc = null);\n} catch (q) {\nconsole.warn(\"[TFQ] parcel\", q);\n}\no.parcel = pc;\n// 1) Best: building outlines from the state's lidar footprints inside the property lines\nif (pc) {\nlet fps = null;\ntry {\nfps = await fetchFootprints(pc);\n} catch (q) {\nconsole.warn(\"[TFQ] footprints\", q);\n}\nif (fps && fps.length) {\nconst lot = fps.filter((f) => inParcel(f.c, pc) && f.groundSqft >= 60),\ninside = (p, f) => inParcel(p, { rings: f.rings }),\nmainFp =\nlot.find((f) => inside(c, f)) ||\nlot.slice().sort((a, b) => xDist(c, a.c).m - xDist(c, b.c).m).find((f) => xDist(c, f.c).m < 12);\nlet part = mainFp ? uncoveredPart(main, mainFp) : null;\n// Outline the house with the lidar shape, unless part of it is split off as its own roof\nmainFp && !part && (main.footprint = mainFp);\nconst others = lot.filter((f) => f !== mainFp).sort((a, b) => xDist(c, a.c).m - xDist(c, b.c).m).slice(0, v.otherRoofMaxShown || 6);\nconst out = await Promise.all(\nothers.map(async (f) => {\nlet r = null;\ntry {\nr = await ie(f.c.lat, f.c.lng);\n} catch (q) {}\nif (!(r && r.name && r.name !== main.name && (inside(xCenter(r), f) || xDist(xCenter(r), f.c).m < 3))) {\n// No satellite slope for this building: size it from the lidar outline at a typical 6/12\nconst d = H(6);\nr = {\nareaSqft: Math.round(f.groundSqft / Math.cos((d * Math.PI) / 180)),\npitchDeg: d,\npitch12: 6,\nfacets: 2,\nlowSlopePct: 0,\nquality: \"\",\nimageryDate: \"\",\nsource: \"footprint\",\nnoSat: !0,\nsegments: [],\nbuildingBox: fpBox(f),\ngroundSqft: f.groundSqft,\nname: \"fp-\" + f.id,\ncenter: { latitude: f.c.lat, longitude: f.c.lng },\n};\n} else r.groundSqft = r.groundSqft || f.groundSqft;\nr.footprint = f;\nconst x = xMake(r, main, \"parcel\");\nreturn ((x.include = !0), x);\n}),\n);\nif (part) {\n// If the satellite has this section as its own building, use its real slope and size\nlet sp = null;\ntry {\nsp = await ie(part.center.latitude, part.center.longitude);\n} catch (q) {}\nsp &&\nsp.name &&\nsp.name !== main.name &&\n(inParcel(xCenter(sp), { rings: part.footprint.rings }) || xDist(xCenter(sp), xCenter(part)).m < 4) &&\n((sp.footprint = part.footprint), (sp.groundSqft = sp.groundSqft || part.groundSqft), (part = sp));\nconst x = xMake(part, main, \"parcel\");\n((x.include = !0), part.noSat && (x.kind = \"Attached section\"), out.unshift(x));\n}\nreturn out;\n}\n}\n// 2) Fallback: probe around the house with the Solar API\nlet rad = 14;\nif (main.buildingBox) {\nconst b = main.buildingBox;\nrad = xDist({ lat: b.sw.latitude, lng: b.sw.longitude }, { lat: b.ne.latitude, lng: b.ne.longitude }).m / 2;\n}\nlet pts = [];\nif (pc) {\nconst all = pc.rings.flat(),\nla0 = Math.min(...all.map((q) => q.lat)),\nla1 = Math.max(...all.map((q) => q.lat)),\nln0 = Math.min(...all.map((q) => q.lng)),\nln1 = Math.max(...all.map((q) => q.lng)),\nhM = (la1 - la0) * XR.lat,\nwM = (ln1 - ln0) * XR.lng(la0);\nlet step = Math.max(6, Math.sqrt((hM * wM) / 40));\nconst grid = () => {\nconst g = [];\nfor (let y = step / 2; y < hM; y += step)\nfor (let x = step / 2; x < wM; x += step) {\nconst p = { lat: la0 + y / XR.lat, lng: ln0 + x / XR.lng(la0) };\ninParcel(p, pc) && !inBox(p, main.buildingBox) && g.push(p);\n}\nreturn g;\n};\npts = grid();\nfor (; pts.length > 24; ) ((step *= 1.2), (pts = grid()));\npts = pts.map((p) => [p.lat, p.lng]);\n} else {\n[rad + 12, rad + 32].forEach((dm) => {\nfor (let k = 0; k < 8; k++) {\nconst a = ((k * 45 + (dm > rad + 20 ? 22.5 : 0)) * Math.PI) / 180;\npts.push([c.lat + (dm * Math.cos(a)) / XR.lat, c.lng + (dm * Math.sin(a)) / XR.lng(c.lat)]);\n}\n});\n}\nconst got = await Promise.race([\nPromise.all(pts.map((p) => ie(p[0], p[1]).catch(() => null))),\nae(9e3).then(() => []),\n]);\nconst maxM = (v.otherRoofMaxDistanceFt || 200) / 3.28084,\nseen = new Set([main.name || \"main\"]),\nout = [];\n(got || []).forEach((r) => {\nif (!r || !r.name || seen.has(r.name)) return;\nseen.add(r.name);\nif (r.areaSqft < 80) return;\nconst x = xMake(r, main, pc ? \"parcel\" : \"nearby\");\nif (pc) {\nif (!inParcel(xCenter(r), pc)) return;\nx.include = !0;\n} else if (x.distFt / 3.28084 > maxM) return;\nout.push(x);\n});\nreturn out.sort((a, b) => a.distFt - b.distFt).slice(0, v.otherRoofMaxShown || 6);\n}\n\n    return {\n      solar: ie,\n      scan: async function (main, address) { o.address = address; const x = await scanExtras(main); return { extras: x, parcel: o.parcel }; }\n    };\n  }\n  function roofName(kind, used){ var n=kind||'Roof'; used[n]=(used[n]||0)+1; return used[n]>1?n+' '+used[n]:n; }\n  function measureHere(address){\n    var scan=null;\n    return loadMaps().then(function(){return findPlace(address);}).then(function(p){\n      var lat=p.location.lat(),lng=p.location.lng();\n      var out={address:String(p.formattedAddress||address).replace(/, USA$/,''),lat:lat,lng:lng,roofs:[],segments:0,source:'none',note:'',imageryDate:'',quality:'',image:'',map:true,extras:[],nearby:[],flat:[],shapes:[],parcel:null};\n      scan=TFRoofScan(M.settings.mapsKey);\n      return scan.solar(lat,lng).then(function(main){\n        if(!main||!main.areaSqft){out.note='Google has no roof sections for this address. Type the roof size below.';return out;}\n        var sum=(main.segments||[]).length;\n        out.roofs=[{n:'Main Roof',s:main.areaSqft,p:Math.round(main.pitch12)+'/12',f:main.facets}];out.segments=main.facets;out.source='solar';\n        out.imageryDate=main.imageryDate||'';out.quality=main.quality||'';\n        if(main.lowSlopePct>15)out.note='About '+main.lowSlopePct+'% of this roof is low-slope or flat. Check if it needs a different roof system.';\n        if(main.center){var dLat=(main.center.latitude-lat)*111320,dLng=(main.center.longitude-lng)*111320*Math.cos(lat*Math.PI/180);\n          if(Math.sqrt(dLat*dLat+dLng*dLng)>30)out.note=(out.note?out.note+' ':'')+'The closest building Google found is not right at the address pin. Check the map.';\n          out.lat=main.center.latitude;out.lng=main.center.longitude;}\n        if(main.areaSqft<300)return out;\n        // Other roofs on the lot (detached garage, barn, shed, attached section), like the website\n        return scan.scan(main,{lat:lat,lng:lng}).then(function(res){\n          var used={};\n          out.parcel=res.parcel&&res.parcel.rings&&res.parcel.rings.length?res.parcel.rings:null;\n          if(main.footprint&&main.footprint.rings)out.shapes.push({rings:main.footprint.rings,label:'Main Roof',main:true});\n          (res.extras||[]).forEach(function(x){\n            var r=x.roof,name=roofName(x.kind,used),row={n:name,s:r.areaSqft,p:Math.round(r.pitch12)+'/12',f:r.facets||2};\n            var info={n:name,s:r.areaSqft,p:row.p,dist:x.distFt,dir:x.dir,est:!!r.noSat,row:row};\n            if(r.footprint&&r.footprint.rings)out.shapes.push({rings:r.footprint.rings,label:name});\n            if(r.slope==='flat'||r.pitch12<=1){out.flat.push(info);return;}\n            if(x.include){out.roofs.push(row);out.extras.push(info);}else out.nearby.push(info);\n          });\n          return out;\n        }).catch(function(){return out;});\n      }).catch(function(er){\n        var st=/solar-(\\d+)/.exec(String(er&&er.message||''));\n        if(st&&st[1]==='404'){out.note='Google has no roof data for this address. Type the roof size below.';return out;}\n        if(st&&st[1]==='403'){out.note='Google blocked roof measuring for this key on the app. In Google Cloud, add teamsforte.github.io/* to the key\u2019s website restrictions.';return out;}\n        if(st){out.note='Couldn\u2019t measure the roof right now ('+st[1]+'). Type the roof size below.';return out;}\n        throw er;\n      });\n    }).catch(function(er){\n      if(er&&/API key not valid|API_KEY_INVALID|InvalidKey/i.test(String(er.message||er)))throw new Error('The saved Google key isn\u2019t right. Go to Quote prices and tap \u201cUse my website\u2019s key\u201d.');\n      if(er&&er.message==='KEY_BLOCKED')throw new Error('Google turned down the Maps key on the app. Under Quote prices, tap \u201cUse my website\u2019s key\u201d. If it still fails, add teamsforte.github.io/* to that key\u2019s website restrictions in Google Cloud.');\n      throw er;\n    });\n  }\n  function drawEstMap(){\n    var e=M.est,el=document.getElementById('emap');\n    if(!el||!e.m||!(window.google&&google.maps&&google.maps.Map))return;\n    var c={lat:+e.m.lat,lng:+e.m.lng};\n    var map=new google.maps.Map(el,{mapTypeId:'satellite',center:c,zoom:20,tilt:0,disableDefaultUI:true,zoomControl:true,gestureHandling:'cooperative'});\n    var b=new google.maps.LatLngBounds(),any=false;\n    if(e.m.parcel){new google.maps.Polygon({map:map,paths:e.m.parcel,strokeColor:'#FFFFFF',strokeOpacity:.9,strokeWeight:2,fillOpacity:0,clickable:false});}\n    (e.m.shapes||[]).forEach(function(sh){new google.maps.Polygon({map:map,paths:sh.rings,strokeColor:sh.main?'#9E1B0F':'#FFB020',strokeWeight:2,fillColor:sh.main?'#E8412E':'#FFB020',fillOpacity:.35,clickable:false});\n      sh.rings.forEach(function(g){g.forEach(function(q){b.extend(q);any=true;});});});\n    if(any){b.extend(c);map.fitBounds(b,30);google.maps.event.addListenerOnce(map,'idle',function(){if(map.getZoom()>20)map.setZoom(20);});}\n    else new google.maps.Marker({map:map,position:c});\n  }\n  function measure(){\n    var e=M.est;if(!e.address.trim()){toast('Type the address first.',true);return;}\n    e.busy=true;render();\n    (canMeasureHere()?measureHere(e.address):call('measure',{address:e.address})).then(function(m){\n      e.busy=false;e.m=m;e.address=m.address;e.lat=m.lat;e.lng=m.lng;\n      if(m.roofs&&m.roofs.length)e.roofs=m.roofs.map(function(r){return {n:r.n,s:r.s,p:r.p,f:r.f};});\n      render();\n    }).catch(function(er){e.busy=false;render();err(er);});\n  }\n  function saveEst(alsoEmail){\n    var e=M.est;\n    if(e.type==='repair')return saveRepairEst(alsoEmail);\n    var roofs=e.roofs.filter(function(r){return Number(r.s)>0;});\n    if(!e.address.trim()){toast('Type the address first.',true);return;}\n    if(!roofs.length){toast('Enter the roof size (or tap Measure roof).',true);return;}\n    if(alsoEmail&&!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(e.email)){toast('Add the customer\u2019s email to send it.',true);return;}\n    var btns=app.querySelectorAll('[data-m=saveest]');btns.forEach(function(b){b.disabled=true;});\n    call('createQuote',{address:e.address,lat:e.lat,lng:e.lng,roofs:roofs,layers:e.layers,pick:e.pick,color:e.color,name:e.name,phone:e.phone,email:e.email,alsoEmail:!!alsoEmail})\n      .then(function(r){var bad=r.emailError;delete r.mailed;delete r.emailError;mergeQ(r);return {r:r,mailed:alsoEmail&&!bad,bad:bad};})\n      .then(function(o){M.qid=o.r.id;M.view='quote';M.qfilter='new';newEst();render();window.scrollTo(0,0);\n        if(o.bad)toast('Quote saved, but the email didn\\u2019t send: '+o.bad,true);else toast(o.mailed?'Quote saved and emailed':'Quote saved');})\n      .catch(function(er){btns.forEach(function(b){b.disabled=false;});err(er);});\n  }\n\n  function saveRepairEst(send){\n    var e=M.est;var items=e.items.filter(function(it){return (Number(it.qty)||0)>0&&String(it.name||'').trim();});\n    if(!e.address.trim()){toast('Type the address first.',true);return;}\n    if(!items.length){toast('Add at least one repair.',true);return;}\n    if(send&&!validEmail(e.email)){toast('Add the customer\\u2019s email to send it.',true);return;}\n    var btns=app.querySelectorAll('[data-m=saveest]');btns.forEach(function(b){b.disabled=true;});\n    call('createQuote',{type:'repair',address:e.address,items:items,name:e.name,phone:e.phone,email:e.email})\n      .then(function(r){mergeQ(r);if(send)return call('sendProposal',{id:r.id,send:'email',email:e.email}).then(function(r2){mergeQ(r2);return {r:r2,mailed:true};});return {r:r};})\n      .then(function(o){M.qid=o.r.id;M.view='quote';M.qfilter='new';newEst();render();window.scrollTo(0,0);toast(o.mailed?'Saved and sent for signature':'Quote saved');})\n      .catch(function(er){btns.forEach(function(b){b.disabled=false;});err(er);});\n  }\n\n  /* ---------- quote prices ---------- */\n  function renderPricing(){\n    var p=M.pricing;var st=(p.steep||[]).slice();while(st.length<3)st.push({from:'',pct:''});\n    function num(name,val,label,pre,suf){return '<div><label class=\"f\">'+label+'</label><input class=\"in money\" inputmode=\"decimal\" name=\"'+name+'\" value=\"'+(val===''||val==null?'':val)+'\"'+(pre?' placeholder=\"'+pre+'\"':'')+'>'+(suf?'<span class=\"hint\">'+suf+'</span>':'')+'</div>';}\n    var h=bar('<button class=\"back\" data-m=\"back\">'+ICON.back+'Quotes</button><div class=\"bar-title\">Quote prices</div>')+'<div class=\"wrap\"><form id=\"pf\">'+\n      '<div class=\"card\"><h2>Price per square <small>installed, before range</small></h2><div class=\"row\">'+\n      p.packages.map(function(pk,i){return num('pk'+i,pk.perSq,pk.label,'$');}).join('')+'</div></div>'+\n      '<div class=\"card\"><h2>Range shown to customers</h2><div class=\"row\">'+num('lowPct',p.lowPct,'Low end %')+num('highPct',p.highPct,'High end %')+'</div>'+\n      '<p class=\"hint\">A $10,000 job shows as $'+(100*p.lowPct).toLocaleString()+'\u2013$'+(100*p.highPct).toLocaleString()+' with these numbers.</p></div>'+\n      '<div class=\"card\"><h2>Adjustments</h2><div class=\"row\">'+num('wastePct',p.wastePct,'Waste %')+num('layerPerSq',p.layerPerSq,'Extra layer $/sq')+'</div>'+\n      '<div class=\"row\">'+num('minJob',p.minJob,'Minimum job $')+num('roundTo',p.roundTo,'Round to $')+'</div>'+\n      '<label class=\"f\">Steep roof charge</label>'+st.map(function(x,i){return '<div class=\"row\" style=\"margin-top:6px\"><div><input class=\"in money\" inputmode=\"numeric\" name=\"sf'+i+'\" value=\"'+(x.from||'')+'\" placeholder=\"from (e.g. 8)\"><span class=\"hint\">pitch /12 and up</span></div><div><input class=\"in money\" inputmode=\"decimal\" name=\"sp'+i+'\" value=\"'+(x.pct||'')+'\" placeholder=\"+ %\"><span class=\"hint\">% more</span></div></div>';}).join('')+'</div>'+\n      '<div class=\"card\" id=\"pex\"></div>'+repairBookCard()+\n      '<div class=\"card\"><h2>Google Maps key <small>'+(M.settings.hasMapsKey?'<span class=\"pill done\">Saved</span>':'for measuring roofs')+'</small></h2>'+\n      '<input class=\"in\" name=\"mapsKey\" autocomplete=\"off\" placeholder=\"'+(M.settings.hasMapsKey?'Saved. Paste to replace':'Paste your API key')+'\">'+\n      '<button type=\"button\" class=\"btn ghost mt\" id=\"webkey\" style=\"width:100%\">Use my website\u2019s key</button>'+\n      '<p class=\"hint\">In Google Cloud console: APIs &amp; Services \u203a Credentials \u203a Create API key. Paste the same key your website\u2019s instant quote uses, and in Google Cloud add <b>teamsforte.github.io/*</b> to that key\u2019s website restrictions. The app then measures roofs on your phone exactly like the website does.</p></div>'+\n      '<div class=\"note\">Your website\u2019s instant quote still uses its own prices for now.</div>'+\n      '<button class=\"btn block\" type=\"submit\">Save prices</button></form></div>';\n    app.innerHTML=h;\n    var f=document.getElementById('pf');\n    function read(){var el=f.elements;var o={packages:p.packages.map(function(pk,i){return {perSq:el['pk'+i].value};}),lowPct:el.lowPct.value,highPct:el.highPct.value,wastePct:el.wastePct.value,layerPerSq:el.layerPerSq.value,minJob:el.minJob.value,roundTo:el.roundTo.value,steep:[]};\n      for(var i=0;i<3;i++){if(el['sf'+i].value)o.steep.push({from:el['sf'+i].value,pct:el['sp'+i].value||0});}return o;}\n    function ex(){var o=TAKEOFF.cleanPricing(read());var a=TAKEOFF.priceRanges(o,[{s:2000,p:'6/12'}],1),b=TAKEOFF.priceRanges(o,[{s:2000,p:'10/12'}],2);\n      document.getElementById('pex').innerHTML='<h2>Example</h2>'+kv('2,000 sq ft, 6/12, 1 layer','')+o.packages.map(function(pk,i){return kv(esc(pk.label),'<span class=\"money\">'+money(a[i][0],false)+'\u2013'+money(a[i][1],false)+'</span>');}).join('')+\n        kv('2,000 sq ft, 10/12, 2 layers','')+o.packages.map(function(pk,i){return kv(esc(pk.label),'<span class=\"money\">'+money(b[i][0],false)+'\u2013'+money(b[i][1],false)+'</span>');}).join('');}\n    ex();f.addEventListener('input',ex);\n    f.onsubmit=function(ev){ev.preventDefault();var b=f.querySelector('button[type=submit]');b.disabled=true;\n      var key=f.elements.mapsKey.value.trim();\n      call('savePricing',read()).then(function(np){M.pricing=np;return call('saveRepairs',readRepairBook());}).then(function(rb){M.repairs=rb;return key?call('saveSettings',{mapsKey:key}).then(function(s){M.settings=s;}):null;})\n        .then(function(){render();toast('Prices saved');if(key)setTimeout(function(){location.reload();},900);}).catch(function(er){b.disabled=false;err(er);});};\n    var wk=document.getElementById('webkey');if(wk)wk.onclick=function(){wk.disabled=true;wk.textContent='Getting the key\u2026';\n      call('useWebsiteKey',{}).then(function(s){M.settings=s;toast('Key saved. Roof measuring is ready.');setTimeout(function(){location.reload();},900);})\n        .catch(function(er){wk.disabled=false;wk.textContent='Use my website\u2019s key';err(er);});};\n  }\n\n  /* ---------- share a quote ---------- */\n  function shareSheet(){\n    var x=q();var digits=String(x.phone||'').replace(/[^\\d+]/g,'');\n    var msg='Hi'+(x.name?' '+x.name:'')+', here is your roof estimate from Team Forte: '+x.link;\n    var ov=sheet('<h3>Send quote'+closeBtn()+'</h3>'+\n      '<a class=\"btn block\" href=\"sms:'+esc(digits)+'?&body='+encodeURIComponent(msg)+'\" target=\"_top\">Text it'+(x.phone?' to '+esc(x.phone):'')+'</a>'+\n      '<label class=\"f\">Email</label><div class=\"row\"><input class=\"in\" id=\"sem\" type=\"email\" value=\"'+esc(x.email||'')+'\" placeholder=\"customer@email.com\"><button class=\"btn dark\" id=\"sesend\" style=\"flex:0 0 auto\">Email</button></div>'+\n      '<label class=\"f\">Quote link</label><textarea class=\"in\" id=\"slink\" readonly style=\"min-height:70px;font-size:13px\">'+esc(x.link)+'</textarea>'+\n      '<div class=\"acts\"><button class=\"btn ghost\" id=\"scopy\">Copy link</button><a class=\"btn ghost\" href=\"'+esc(x.link)+'\" target=\"_blank\" rel=\"noopener\">Open quote page</a></div>');\n    ov.querySelector('#scopy').onclick=function(){var t=ov.querySelector('#slink');t.focus();t.select();\n      var done=function(){toast('Link copied');};\n      try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(x.link).then(done,function(){document.execCommand('copy');done();});}else{document.execCommand('copy');done();}}catch(e){toast('Press and hold the link to copy it.');}};\n    ov.querySelector('#sesend').onclick=function(){var b=this;var em=ov.querySelector('#sem').value.trim();b.disabled=true;\n      call('emailQuote',{id:x.id,email:em}).then(function(r){mergeQ(r);closeSheet();render();toast('Quote emailed to '+em);}).catch(function(er){b.disabled=false;err(er);});};\n  }\n\n  /* =================== EXTRAS (repairs, proposals, schedule, profit, inspections, wrap-up, crew) =================== */\n  function role(){return (S.user&&S.user.role)||'owner';}\n  function isOwner(){return role()==='owner';}\n  function proposalUrl(x){return (M.settings.proposalBase||'https://team-forte.com/quote')+'#p='+encodeURIComponent(x.id);}\n  function presentUrl(x){return (M.settings.presentBase||'https://teamsforte.github.io/p.html')+'#p='+encodeURIComponent(x.id)+'&present=1';}\n  function opens(x){var ev=(x.events||[]).filter(function(e){return /^proposal opened/.test(e.e);});return {n:ev.length,last:ev.length?ev[ev.length-1].t:''};}\n  function repairTotal(items){var t=(items||[]).reduce(function(n,it){return n+(Number(it.qty)||0)*(Number(it.price)||0);},0);return Math.round(Math.max(Number(M.repairs.min)||0,t)*100)/100;}\n  function inspOf(x){return (M.inspections||[]).filter(function(i){return i.quoteId===x.id;}).sort(function(a,b){return a.order-b.order;});}\n  function validEmail(e){return /^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(String(e||''));}\n  function smsHref(phone,body){return 'sms:'+String(phone||'').replace(/[^\\d+]/g,'')+'?&body='+encodeURIComponent(body);}\n  function jobProfit(x){\n    var c=x.costs||{};var mine=M.orders.filter(function(o){return o.quoteId===x.id;});\n    var mat=mine.length?mine.reduce(function(n,o){return n+orderSpend(o);},0):TAKEOFF.totals(fresh(x),M.settings.taxRate).total;\n    var labor=(Number(c.crewDays)||0)*(Number(c.crewRate)||0);var other=(Number(c.dumpster)||0)+(Number(c.permit)||0)+(Number(c.other)||0);\n    var rev=jobTotal(x);var profit=rev-mat-labor-other;\n    return {rev:rev,mat:mat,matOrdered:mine.length>0,labor:labor,other:other,profit:profit,margin:rev?Math.round(profit/rev*100):0};\n  }\n\n  /* ----- repair item rows (new estimate + edit sheet) ----- */\n  function itemRows(items,prefix){\n    return items.map(function(it,i){\n      return '<div class=\"ln\" style=\"cursor:default\"><div class=\"l1\">'+(it.custom?'<input class=\"in\" data-'+prefix+'=\"name\" data-i=\"'+i+'\" value=\"'+esc(it.name)+'\" placeholder=\"Describe the repair\" style=\"min-height:38px;margin-bottom:6px\">':'<b>'+esc(it.name)+'</b>')+\n        '<div class=\"row\" style=\"gap:6px\"><input class=\"in money\" style=\"min-height:38px\" inputmode=\"decimal\" data-'+prefix+'=\"qty\" data-i=\"'+i+'\" value=\"'+it.qty+'\" aria-label=\"Quantity\"><span class=\"hint\" style=\"flex:0 0 auto;align-self:center\">'+esc(it.unit)+' \u00d7</span>'+\n        '<input class=\"in money\" style=\"min-height:38px\" inputmode=\"decimal\" data-'+prefix+'=\"price\" data-i=\"'+i+'\" value=\"'+it.price+'\" aria-label=\"Price\"></div></div>'+\n        '<div class=\"l2 money\">'+money((Number(it.qty)||0)*(Number(it.price)||0))+'<span><button type=\"button\" class=\"x\" style=\"width:30px;height:30px;margin-left:auto;margin-top:6px\" data-m=\"'+prefix+'rm\" data-i=\"'+i+'\" aria-label=\"Remove\">'+ICON.x+'</button></span></div></div>';\n    }).join('');\n  }\n  function addRepairSelect(prefix){\n    return '<select class=\"in mt\" data-'+prefix+'add><option value=\"\">+ Add a repair\u2026</option>'+(M.repairs.items||[]).map(function(it){return '<option value=\"'+esc(it.key)+'\">'+esc(it.name)+' \u00b7 '+money(it.price,false)+'/'+esc(it.unit)+'</option>';}).join('')+'<option value=\"__custom\">Custom item\u2026</option></select>';\n  }\n  function bookItem(key){if(key==='__custom')return {key:'c'+Date.now().toString(36),name:'',unit:'each',qty:1,price:0,custom:true};\n    var b=(M.repairs.items||[]).filter(function(it){return it.key===key;})[0];return b?{key:b.key,name:b.name,unit:b.unit,qty:1,price:b.price}:null;}\n  function wireItems(root,list,prefix,redraw){\n    root.addEventListener('input',function(e){var t=e.target;var k2=t.getAttribute('data-'+prefix);if(!k2)return;var it=list[+t.getAttribute('data-i')];if(!it)return;\n      it[k2]=k2==='name'?t.value:(Number(String(t.value).replace(/[^\\d.]/g,''))||0);redraw(true);});\n    root.addEventListener('change',function(e){var t=e.target;if(!t.hasAttribute('data-'+prefix+'add'))return;var it=bookItem(t.value);if(it){list.push(it);redraw();}t.value='';});\n    root.addEventListener('click',function(e){var b=e.target.closest('[data-m=\"'+prefix+'rm\"]');if(!b)return;e.stopPropagation();list.splice(+b.getAttribute('data-i'),1);redraw();});\n  }\n\n  /* ----- repair parts of the quote page ----- */\n  function repairCard(x){\n    var items=x.items||[];var sub=items.reduce(function(n,it){return n+it.qty*it.price;},0);\n    return '<div class=\"card\"><h2>Repairs <small>'+items.length+' item'+(items.length===1?'':'s')+'</small></h2>'+\n      items.map(function(it){return kv(esc(it.name)+'<br><small class=\"hint\">'+it.qty+' '+esc(units(it.unit,it.qty))+' \u00d7 '+money(it.price)+'</small>','<span class=\"money\">'+money(it.qty*it.price)+'</span>');}).join('')+\n      (sub<(x.basePrice||x.contractPrice)?kv('Minimum service charge',''):'')+\n      '<div class=\"tot\"><div class=\"kv grand\"><span>'+((x.chosen||[]).length?'Repairs total':'Total')+'</span><b class=\"money\">'+money(x.basePrice||x.contractPrice)+'</b></div></div>'+\n      (x.status==='new'&&!x.signedAt?'<button class=\"btn ghost block mt\" data-m=\"edititems\">Edit repairs</button>':'')+'</div>';\n  }\n  function approveRepairCard(x){\n    return '<div class=\"card\"><h2>Approve job</h2><p class=\"sub\">Approving adds the job to Photos and starts its materials list and job costs. If the customer signs online, this happens on its own.</p>'+\n      '<button class=\"btn block\" data-m=\"approverep\">Approve repair job</button><button class=\"btn ghost block mt\" data-m=\"archive\">Not going ahead</button></div>';\n  }\n  function editItemsSheet(){\n    var x=q();var list=(x.items||[]).map(function(it){return Object.assign({},it);});\n    var ov=sheet('<h3>Edit repairs'+closeBtn()+'</h3><div id=\"eis\"></div>'+addRepairSelect('ei')+'<div class=\"tot mt\" id=\"eit\"></div><button class=\"btn block mt\" id=\"eisv\">Save</button>');\n    function draw(soft){if(!soft)ov.querySelector('#eis').innerHTML=itemRows(list,'ei');ov.querySelector('#eit').innerHTML='<div class=\"kv grand\"><span>Total</span><b class=\"money\">'+money(repairTotal(list))+'</b></div>';}\n    draw();wireItems(ov.querySelector('.sheet'),list,'ei',draw);\n    ov.querySelector('#eisv').onclick=function(){var items=list.filter(function(it){return it.qty>0&&(it.name||'').trim();});if(!items.length){toast('Add at least one repair.',true);return;}\n      closeSheet();saveQ({items:items,contractPrice:repairTotal(items)},'Repairs saved');};\n  }\n\n  /* ----- customer + GoHighLevel ----- */\n  function ghlLine(x){\n    if(!(M.settings.ghl&&M.settings.ghl.connected))return '';\n    if(x.ghlError)return '<div class=\"note\">GoHighLevel: '+esc(x.ghlError)+'<div class=\"mt\"><button class=\"btn ghost\" data-m=\"ghlsync\">Try again</button></div></div>';\n    if(x.ghlOppId)return '<p class=\"hint\">\u2713 In GoHighLevel (Sales Pipeline)</p>';\n    return '<p class=\"hint\">Not in GoHighLevel yet. <a href=\"#\" data-m=\"ghlsync\">Sync now</a></p>';\n  }\n  function editCustSheet(){\n    var x=q();\n    var ov=sheet('<h3>Customer'+closeBtn()+'</h3><label class=\"f\">Name</label><input class=\"in\" id=\"cn\" value=\"'+esc(x.name)+'\">'+\n      '<div class=\"row\"><div><label class=\"f\">Phone</label><input class=\"in\" id=\"cp\" inputmode=\"tel\" value=\"'+esc(x.phone)+'\"></div><div><label class=\"f\">Email</label><input class=\"in\" id=\"ce\" type=\"email\" value=\"'+esc(x.email)+'\"></div></div>'+\n      '<label class=\"f\">Address</label><input class=\"in\" id=\"cad\" value=\"'+esc(x.address)+'\"><button class=\"btn block mt\" id=\"csv\">Save</button>');\n    ov.querySelector('#csv').onclick=function(){var em=ov.querySelector('#ce').value.trim();if(em&&!validEmail(em)){toast('That email doesn\u2019t look right.',true);return;}\n      closeSheet();saveQ({name:ov.querySelector('#cn').value,phone:ov.querySelector('#cp').value,email:em,address:ov.querySelector('#cad').value},'Saved');};\n  }\n\n  /* ----- payments ----- */\n  function paidOf(x){return (x.payments||[]).filter(function(p){return p.status==='paid';}).reduce(function(n,p){return n+(Number(p.amount)||0);},0);}\n  function payUrl(x){return (M.settings.proposalBase||'https://team-forte.com/quote')+'#p='+encodeURIComponent(x.id)+'&pay=1';}\n  function paymentsCard(x){\n    if(!(x.contractPrice>0)||!(x.signedAt||x.status!=='new'))return '';\n    var paid=Math.round(paidOf(x)*100)/100,bal=Math.max(0,Math.round((jobTotal(x)-paid)*100)/100),s=M.settings;\n    var list=(x.payments||[]).filter(function(p){return p.status==='paid'||p.processing;});\n    return '<div class=\"card\"><h2>Payments '+(bal<=0?'<span class=\"pill done\">Paid in full</span>':(paid>0?'<span class=\"pill\">'+money(paid)+' paid</span>':''))+'</h2>'+\n      kv('Job price',money(x.contractPrice))+(coSigned(x)?kv('Change orders',money(coSigned(x))):'')+list.map(function(p){return '<div class=\"kv\"><span>'+(p.status==='paid'?'\u2713 ':'\u2026 ')+esc(p.label||'Payment')+' \u00b7 '+dateStr(p.paidAt||p.created)+(p.status!=='paid'?' (bank payment clearing)':'')+'</span><b>'+money(p.amount)+(p.kind==='manual'?' <button class=\"lnk\" data-m=\"delpay\" data-pid=\"'+esc(p.id)+'\" aria-label=\"Remove\">\u2715</button>':'')+'</b></div>';}).join('')+\n      kv('Balance','<span class=\"money\">'+money(bal)+'</span>')+\n      (x.payReq&&x.payReq.amount>0?'<p class=\"hint\">Requested '+money(x.payReq.amount)+' ('+esc(x.payReq.label||'')+') '+dateStr(x.payReq.at)+'</p>':'')+\n      (!s.hasStripe?'<p class=\"hint\">Turn on card and bank payments: Spending \u203a Settings \u203a Online payments (Stripe).</p>':'')+\n      '<div class=\"acts\">'+(bal>0?'<button class=\"btn\" data-m=\"reqpay\">Request payment</button>':'')+'<button class=\"btn ghost\" data-m=\"recpay\">Record cash/check</button></div></div>';\n  }\n  function reqPaySheet(){\n    var x=q();var paid=paidOf(x),bal=Math.max(0,Math.round((jobTotal(x)-paid)*100)/100),dep=Math.max(0,Math.round(((x.contractPrice||0)*(M.settings.depositPct||0)/100-paid)*100)/100);\n    var def=dep>0?dep:bal,lab=dep>0?'Deposit':'Balance';\n    var ov=sheet('<h3>Request payment'+closeBtn()+'</h3>'+kv('Balance',money(bal))+\n      '<div class=\"row\"><div><label class=\"f\">Amount</label><input class=\"in money\" id=\"rpa\" inputmode=\"decimal\" value=\"'+def+'\"></div><div><label class=\"f\">For</label><input class=\"in\" id=\"rpl\" value=\"'+lab+'\" placeholder=\"Balance\"></div></div>'+\n      '<div class=\"pkg\" id=\"rpq\" style=\"margin-top:10px\">'+(dep>0?'<button type=\"button\" data-a=\"'+dep+'\" data-l=\"Deposit\"><b>Deposit</b><span>'+money(dep)+'</span></button>':'')+'<button type=\"button\" data-a=\"'+bal+'\" data-l=\"Balance\"><b>Balance</b><span>'+money(bal)+'</span></button></div>'+\n      '<label class=\"f\">Customer email</label><input class=\"in\" id=\"rpe\" type=\"email\" value=\"'+esc(x.email||'')+'\" placeholder=\"customer@email.com\">'+\n      (M.settings.hasStripe?'':'<div class=\"note\">Stripe isn\u2019t connected yet, so the invoice will show your phone number instead of a Pay button.</div>')+\n      '<button class=\"btn block mt\" id=\"rpnow\">Collect now on this device</button><div class=\"acts\"><button class=\"btn ghost\" id=\"rpem\">Email invoice</button><button class=\"btn ghost\" id=\"rptx\">Text or copy link</button></div><div id=\"rpout\"></div>');\n    ov.querySelector('#rpq').onclick=function(e){var b=e.target.closest('[data-a]');if(!b)return;ov.querySelector('#rpa').value=b.getAttribute('data-a');ov.querySelector('#rpl').value=b.getAttribute('data-l');};\n    function args(send){return {id:x.id,amount:String(ov.querySelector('#rpa').value).replace(/[^\\d.]/g,''),label:ov.querySelector('#rpl').value.trim(),send:send};}\n    ov.querySelector('#rpnow').onclick=function(){var b=this;b.disabled=true;var w=null;try{w=window.open('about:blank','_blank');}catch(e){}\n      call('requestPayment',args('none')).then(function(r){mergeQ(r);var u=r.payUrl||payUrl(r);if(w&&!w.closed)w.location.href=u;else location.href=u;closeSheet();render();}).catch(function(e){if(w)try{w.close();}catch(z){}b.disabled=false;err(e);});};\n    ov.querySelector('#rpem').onclick=function(){var b=this;var a=args('email');var em=ov.querySelector('#rpe').value.trim();if(!validEmail(em)){toast('Add the customer\u2019s email.',true);return;}b.disabled=true;\n      (em!==x.email?call('saveQuote',{id:x.id,email:em}).then(mergeQ):Promise.resolve()).then(function(){return call('requestPayment',a);}).then(function(r){mergeQ(r);closeSheet();render();toast('Invoice emailed to '+em);}).catch(function(e){b.disabled=false;err(e);});};\n    ov.querySelector('#rptx').onclick=function(){var b=this;b.disabled=true;call('requestPayment',args('none')).then(function(r){mergeQ(r);var u=r.payUrl||payUrl(r);var amt=money(r.payReq&&r.payReq.amount);\n      var msg='Hi'+(r.name?' '+r.name.split(' ')[0]:'')+', here is your Team Forte invoice for '+amt+'. You can pay by card or bank here: '+u;\n      ov.querySelector('#rpout').innerHTML='<a class=\"btn block mt\" href=\"'+esc(smsHref(r.phone,msg))+'\" target=\"_top\">Text it'+(r.phone?' to '+esc(r.phone):'')+'</a><textarea class=\"in mt\" readonly style=\"min-height:64px;font-size:13px\">'+esc(u)+'</textarea>';render();}).catch(function(e){b.disabled=false;err(e);});};\n  }\n  function recPaySheet(){\n    var x=q();var bal=Math.max(0,Math.round((jobTotal(x)-paidOf(x))*100)/100);\n    var ov=sheet('<h3>Record a payment'+closeBtn()+'</h3><p class=\"sub\">For cash, checks, Zelle or a financing payout. Card and bank payments through Stripe are recorded automatically.</p>'+\n      '<div class=\"row\"><div><label class=\"f\">Amount</label><input class=\"in money\" id=\"mpa\" inputmode=\"decimal\" value=\"'+(bal||'')+'\"></div><div><label class=\"f\">How</label><select class=\"in\" id=\"mpm\">'+['Check','Cash','Zelle','Financing','Other'].map(function(m){return '<option>'+m+'</option>';}).join('')+'</select></div></div>'+\n      '<label class=\"f\">Note <small>(check #, optional)</small></label><input class=\"in\" id=\"mpn\" placeholder=\"#1042\">'+\n      '<button class=\"btn block mt\" id=\"mpsave\">Save payment</button>');\n    ov.querySelector('#mpsave').onclick=function(){var b=this;b.disabled=true;call('recordPayment',{id:x.id,amount:ov.querySelector('#mpa').value,method:ov.querySelector('#mpm').value,note:ov.querySelector('#mpn').value}).then(function(r){mergeQ(r);closeSheet();render();toast('Payment saved');}).catch(function(e){b.disabled=false;err(e);});};\n  }\n\n  /* ----- proposal / e-signature ----- */\n  function proposalCard(x){\n    var s=M.settings;\n    if(x.signedAt){\n      var dep=Math.round((x.contractPrice||0)*(s.depositPct||0))/100;\n      return '<div class=\"card\"><h2>Signed <span class=\"pill done\">\u2713 '+dateStr(x.signedAt)+'</span></h2>'+kv('Signed by',esc(x.signerName))+kv('Price','<span class=\"money\">'+money(x.contractPrice)+'</span>')+contractLines(x)+\n        (dep>0?'<label class=\"f\">Deposit '+money(dep)+'</label><div class=\"seg\" id=\"depseg\">'+[['requested','Waiting'],['paid','Paid']].map(function(d){return '<button type=\"button\" class=\"'+((x.depositStatus||'requested')===d[0]?'on':'')+'\" data-dep=\"'+d[0]+'\">'+d[1]+'</button>';}).join('')+'</div>':'')+\n        '<div class=\"acts\">'+(x.signedPdfId?'<a class=\"btn ghost\" href=\"https://drive.google.com/file/d/'+esc(x.signedPdfId)+'/view\" target=\"_blank\" rel=\"noopener\">Signed copy</a>':'<span></span>')+\n        '<a class=\"btn ghost\" href=\"'+esc(proposalUrl(x))+'&v=0\" target=\"_blank\" rel=\"noopener\">Proposal page</a></div>'+\n        '</div>';\n    }\n    if(x.status==='done'||x.status==='archived')return '';\n    return '<div class=\"card\"><h2>Roof plan & signature</h2><p class=\"sub\" style=\"margin:0\">A presentation with their roof, your inspection photos, the options and prices. Show it at the table or send it, and they can sign on the spot. When they sign, the job is approved for you'+(s.depositPct?' and they can pay the '+s.depositPct+'% deposit':'')+'.</p>'+\n      (x.proposalSentAt?'<p class=\"hint\">Sent '+dateStr(x.proposalSentAt)+(function(o){return o.n?' \u00b7 opened '+o.n+'\u00d7, last '+dateStr(o.last)+' '+new Date(o.last).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}):' \u00b7 not opened yet';})(opens(x))+'</p>':'')+\n      (contractGaps().length?'<div class=\"note\">Before proposals can be signed, finish the contract setup ('+esc(contractGaps().join(', '))+') in Spending \u203a Settings \u203a Contract.</div>':'')+\n      '<button class=\"btn block mt\" data-m=\"propose\">'+(x.proposalSentAt?'Send again or present':'Present or send for signature')+'</button>'+\n      (x.proposalSentAt?'<a class=\"btn ghost block mt\" href=\"'+esc(proposalUrl(x))+'&v=0\" target=\"_blank\" rel=\"noopener\">See what the customer sees</a>'+remindLine(x):'')+'</div>';\n  }\n  function proposeSheet(){\n    var x=q();var rep=x.type==='repair';var pick=x.pick>=0?x.pick:1;\n    var sd0=addDaysYmd(todayYmd(),14),ed0=addDaysYmd(x.startDate||sd0,rep?0:2);\n    function ofv(i){if(x.offers&&x.offers[i]>0)return x.offers[i];if(i===x.pick&&x.contractPrice>0)return x.contractPrice;return mid(x,i)||'';}\n    var ov=sheet('<h3>Roof plan & signature'+closeBtn()+'</h3>'+\n      (rep?kv('Repair total','<span class=\"money\">'+money(x.contractPrice)+'</span>'):\n        '<label class=\"f\">Firm prices <span class=\"hint\" style=\"font-weight:500\">\u00b7 the customer picks one. Clear a box to leave that option out.</span></label>'+\n        '<div class=\"row\">'+PK.map(function(p,i){return '<div><label class=\"f\" style=\"margin-top:0;font-size:12px\">'+p.label+'</label><input class=\"in money\" data-of=\"'+i+'\" inputmode=\"decimal\" value=\"'+ofv(i)+'\"><span class=\"hint\" style=\"font-size:11px\">'+(range(x,i)||' ')+'</span></div>';}).join('')+'</div>'+\n        '<label class=\"f\">Recommend</label><div class=\"pkg\" id=\"ppk\">'+PK.map(function(p,i){return '<button type=\"button\" class=\"'+(i===pick?'on':'')+'\" data-pk=\"'+i+'\"><b>'+p.label+'</b><span>'+(i===pick?'Recommended':' ')+'</span></button>';}).join('')+'</div>'+\n        '<label class=\"f\">Color <span class=\"hint\" style=\"font-weight:500\">\u00b7 optional, they can pick it in the plan</span></label><input class=\"in\" id=\"pcl\" value=\"'+esc(x.color||'')+'\" placeholder=\"Estate Gray\">')+\n      '<div class=\"row\"><div><label class=\"f\">Start date</label><input class=\"in\" type=\"date\" id=\"psd\" value=\"'+esc(x.startDate||sd0)+'\"></div><div><label class=\"f\">Completion date</label><input class=\"in\" type=\"date\" id=\"ped\" value=\"'+esc(x.endDate||ed0)+'\"></div></div>'+\n      '<p class=\"hint\">Connecticut contracts need both dates. Your best estimate; the contract says weather permitting.</p>'+\n      addonsBlock(x)+\n      (contractGaps().length?'<div class=\"note\">Finish the contract setup first ('+esc(contractGaps().join(', '))+'): Spending \u203a Settings \u203a Contract.</div>':'')+\n      '<label class=\"f\">Customer email</label><input class=\"in\" id=\"pem\" type=\"email\" value=\"'+esc(x.email||'')+'\" placeholder=\"customer@email.com\">'+\n      '<button class=\"btn block mt\" id=\"ppres\">Present now on this device</button>'+\n      '<div class=\"acts\"><button class=\"btn ghost\" id=\"pemail\">Email it</button><button class=\"btn ghost\" id=\"plink\">Text or copy link</button></div><div id=\"pout\"></div>');\n    if(!rep)ov.querySelector('#ppk').onclick=function(e){var b=e.target.closest('[data-pk]');if(!b)return;pick=+b.getAttribute('data-pk');ov.querySelectorAll('#ppk button').forEach(function(z){var on=z===b;z.classList.toggle('on',on);z.querySelector('span').textContent=on?'Recommended':' ';});};\n    function offersIn(){return [0,1,2].map(function(i){return Number(String(ov.querySelector('[data-of=\"'+i+'\"]').value).replace(/[^\\d.]/g,''))||0;});}\n    function args(send){var a={id:x.id,send:send,email:ov.querySelector('#pem').value.trim(),startDate:ov.querySelector('#psd').value,endDate:ov.querySelector('#ped').value,addons:addonsIn(ov)};if(!rep){var of=offersIn();a.offers=of;a.pick=pick;a.color=ov.querySelector('#pcl').value;a.contractPrice=of[pick];}return a;}\n    function okPrices(a){if(!a.startDate||!a.endDate){toast('Add the start and completion dates.',true);return false;}if(a.endDate<a.startDate){toast('The completion date is before the start date.',true);return false;}if(rep)return true;if(!(a.contractPrice>0)){toast('Enter a price for the recommended option ('+PK[pick].label+').',true);return false;}return true;}\n    ov.querySelector('#ppres').onclick=function(){var b=this;var a=args('present');if(!okPrices(a))return;b.disabled=true;var w=null;try{w=window.open('about:blank','_blank');}catch(e){}\n      call('sendProposal',a).then(function(r){mergeQ(r);var u=r.presentUrl||presentUrl(r);if(w&&!w.closed)w.location.href=u;else location.href=u;closeSheet();render();}).catch(function(e){if(w)try{w.close();}catch(z){}b.disabled=false;err(e);});};\n    ov.querySelector('#pemail').onclick=function(){var b=this;var a=args('email');if(!okPrices(a))return;if(!validEmail(a.email)){toast('Add the customer\u2019s email.',true);return;}b.disabled=true;\n      call('sendProposal',a).then(function(r){mergeQ(r);closeSheet();render();toast('Proposal emailed to '+a.email);}).catch(function(e){b.disabled=false;err(e);});};\n    ov.querySelector('#plink').onclick=function(){var b=this;var a=args('none');if(!okPrices(a))return;b.disabled=true;\n      call('sendProposal',a).then(function(r){mergeQ(r);var url=r.proposalUrl;var msg='Hi'+(r.name?' '+r.name.split(' ')[0]:'')+', here is your Team Forte roof plan with the photos from today, your options and prices. You can review and sign it here: '+url;\n        ov.querySelector('#pout').innerHTML='<a class=\"btn block mt\" href=\"'+esc(smsHref(r.phone,msg))+'\" target=\"_top\">Text it'+(r.phone?' to '+esc(r.phone):'')+'</a><textarea class=\"in mt\" readonly style=\"min-height:64px;font-size:13px\">'+esc(url)+'</textarea>';\n        render();}).catch(function(e){b.disabled=false;err(e);});};\n  }\n\n  /* ----- schedule + profit ----- */\n  function scheduleCard(x){\n    return '<div class=\"card\"><h2>Schedule</h2><div class=\"row\"><div><label class=\"f\">Install date</label><input class=\"in\" type=\"date\" id=\"sd\" value=\"'+esc(x.installDate||'')+'\"></div>'+\n      '<div><label class=\"f\">Crew</label><input class=\"in\" id=\"sc\" value=\"'+esc(x.crew||'')+'\" placeholder=\"e.g. Luis + 3\"></div></div><button class=\"btn dark block mt\" data-m=\"savesched\">Save schedule</button></div>';\n  }\n  function profitCard(x){\n    if(!x.contractPrice)return '';\n    var p=jobProfit(x);\n    return '<div class=\"card\"><h2>Profit <small>'+(p.matOrdered?'materials from orders':'materials estimated')+'</small></h2>'+\n      kv('Job price','<span class=\"money\">'+money(p.rev,false)+'</span>')+kv('Materials','<span class=\"money\">\u2212'+money(p.mat,false)+'</span>')+\n      kv('Labor','<span class=\"money\">\u2212'+money(p.labor,false)+'</span>')+kv('Dumpster, permit &amp; other','<span class=\"money\">\u2212'+money(p.other,false)+'</span>')+\n      '<div class=\"tot\"><div class=\"kv grand\"><span>Profit</span><b class=\"money\" style=\"color:'+(p.profit<0?'#B3261E':'var(--green)')+'\">'+money(p.profit,false)+((p.mat||p.matOrdered)?' \u00b7 '+p.margin+'%':'')+'</b></div></div>'+(p.mat||p.matOrdered?'':'<p class=\"hint\">Add materials to see your real margin.</p>')+\n      '<button class=\"btn ghost block mt\" data-m=\"editcosts\">Edit job costs</button></div>';\n  }\n  function costsSheet(){\n    var x=q();var c=x.costs||{crewDays:0,crewRate:M.settings.crewDayRate,dumpster:0,permit:0,other:0,otherNote:''};\n    var ov=sheet('<h3>Job costs'+closeBtn()+'</h3><div class=\"row\"><div><label class=\"f\">Crew days</label><input class=\"in money\" id=\"kd\" inputmode=\"decimal\" value=\"'+c.crewDays+'\"></div><div><label class=\"f\">Cost per crew day</label><input class=\"in money\" id=\"kr\" inputmode=\"decimal\" value=\"'+c.crewRate+'\"></div></div>'+\n      '<div class=\"row\"><div><label class=\"f\">Dumpster</label><input class=\"in money\" id=\"kdu\" inputmode=\"decimal\" value=\"'+c.dumpster+'\"></div><div><label class=\"f\">Permit</label><input class=\"in money\" id=\"kp\" inputmode=\"decimal\" value=\"'+c.permit+'\"></div></div>'+\n      '<div class=\"row\"><div><label class=\"f\">Other</label><input class=\"in money\" id=\"ko\" inputmode=\"decimal\" value=\"'+c.other+'\"></div><div><label class=\"f\">What for</label><input class=\"in\" id=\"kon\" value=\"'+esc(c.otherNote||'')+'\"></div></div>'+\n      '<button class=\"btn block mt\" id=\"ksv\">Save</button>');\n    ov.querySelector('#ksv').onclick=function(){var g=function(id){return Number(ov.querySelector(id).value)||0;};\n      closeSheet();saveQ({costs:{crewDays:g('#kd'),crewRate:g('#kr'),dumpster:g('#kdu'),permit:g('#kp'),other:g('#ko'),otherNote:ov.querySelector('#kon').value}},'Costs saved');};\n  }\n\n  /* ----- inspection photos ----- */\n  function inspectionCard(x){\n    var list=inspOf(x);\n    return '<div class=\"card\"><h2>Inspection photos <small>'+list.length+'</small></h2>'+\n      (list.length?'<div class=\"grid\">'+list.map(function(r){return '<button class=\"ph\" data-m=\"insp\" data-id=\"'+esc(r.id)+'\"><img loading=\"lazy\" src=\"'+esc(img(r.id,400))+'\" alt=\"\"><span class=\"cap\">'+esc(r.tag)+'</span></button>';}).join('')+'</div>':\n        '<p class=\"hint\">Take photos of what you find and tag each one. Turn them into a PDF report for the homeowner.</p>')+\n      '<div class=\"acts\"><button class=\"btn ghost\" data-m=\"addinsp\">'+ICON.cam+'Add photos</button><button class=\"btn ghost\" data-m=\"report\"'+(list.length?'':' disabled')+'>Create report</button></div></div>';\n  }\n  var inspPicker=null;\n  function addInspSheet(quoteId){\n    var ov=sheet('<h3>Inspection photos'+closeBtn()+'</h3><label class=\"f\">What do they show?</label><select class=\"in\" id=\"it\">'+(M.tags||[]).map(function(t){return '<option>'+esc(t)+'</option>';}).join('')+'</select>'+\n      '<label class=\"f\">Note <small>(optional)</small></label><input class=\"in\" id=\"inote\" maxlength=\"300\" placeholder=\"e.g. Cracked boot over bathroom\"><button class=\"btn block mt\" id=\"igo\">'+ICON.cam+'Take or choose photos</button>');\n    ov.querySelector('#igo').onclick=function(){\n      if(!inspPicker){inspPicker=document.createElement('input');inspPicker.type='file';inspPicker.accept='image/*';inspPicker.multiple=true;inspPicker.className='vh';document.body.appendChild(inspPicker);}\n      var tag=ov.querySelector('#it').value,note=ov.querySelector('#inote').value;\n      inspPicker.onchange=function(){var files=Array.prototype.slice.call(inspPicker.files||[],0,20);inspPicker.value='';if(!files.length)return;closeSheet();uploadInsp(quoteId,files,tag,note);};\n      inspPicker.click();\n    };\n  }\n  function uploadInsp(quoteId,files,tag,note){\n    S.upload={total:files.length,done:0,failed:0};drawProg();var errs=[];var seq=Promise.resolve();\n    files.forEach(function(file){seq=seq.then(function(){return shrink(file).then(function(sh){\n      return call('addInspection',{quoteId:quoteId,base64:sh.base64,tag:tag,note:note}).then(function(r){S.prev[r.id]=sh.thumb;(M.inspections=M.inspections||[]).push(r);});\n    }).catch(function(e){S.upload.failed++;errs.push(e.message);}).then(function(){S.upload.done++;drawProg();});});});\n    seq.then(function(){var u=S.upload;S.upload=null;drawProg();render();toast(u.failed?u.failed+' didn\u2019t upload: '+errs[0]:u.total+' photo'+(u.total===1?'':'s')+' added',!!u.failed);});\n  }\n  function inspSheet(id){\n    var r=(M.inspections||[]).filter(function(z){return z.id===id;})[0];if(!r)return;\n    var ov=sheet('<h3>'+esc(r.tag)+closeBtn()+'</h3><img class=\"big\" src=\"'+esc(img(r.id,1200))+'\" alt=\"\">'+\n      '<label class=\"f\">Tag</label><select class=\"in\" id=\"it2\">'+(M.tags||[]).map(function(t){return '<option'+(t===r.tag?' selected':'')+'>'+esc(t)+'</option>';}).join('')+'</select>'+\n      '<label class=\"f\">Note</label><input class=\"in\" id=\"in2\" maxlength=\"300\" value=\"'+esc(r.note||'')+'\">'+\n      '<div class=\"acts\"><button class=\"btn danger\" id=\"idel\">Delete</button><button class=\"btn\" id=\"isv\">Save</button></div>');\n    ov.querySelector('#isv').onclick=function(){call('saveInspection',{id:r.id,tag:ov.querySelector('#it2').value,note:ov.querySelector('#in2').value}).then(function(n){Object.assign(r,n);closeSheet();render();toast('Saved');}).catch(err);};\n    ov.querySelector('#idel').onclick=function(){call('deleteInspection',{id:r.id}).then(function(){M.inspections=M.inspections.filter(function(z){return z.id!==r.id;});closeSheet();render();toast('Deleted');}).catch(err);};\n  }\n  function reportSheet(){\n    var x=q();\n    var ov=sheet('<h3>Inspection report'+closeBtn()+'</h3><p class=\"sub\">Makes a PDF with all '+inspOf(x).length+' photos and notes, saved in Google Drive.</p>'+\n      '<label class=\"f\">Email it to <small>(optional)</small></label><input class=\"in\" id=\"rem\" type=\"email\" value=\"'+esc(x.email||'')+'\" placeholder=\"customer@email.com\">'+\n      '<div class=\"acts\"><button class=\"btn ghost\" id=\"rmk\">Create PDF</button><button class=\"btn\" id=\"rme\">Create &amp; email</button></div><div id=\"rout\"></div>');\n    function go(withEmail,b){var em=ov.querySelector('#rem').value.trim();if(withEmail&&!validEmail(em)){toast('Add a valid email.',true);return;}\n      b.disabled=true;b.textContent='Making PDF\u2026';\n      call('inspectionReport',{quoteId:x.id,email:withEmail?em:''}).then(function(r){\n        var msg='Here are the photos from your roof inspection: '+r.url;\n        ov.querySelector('#rout').innerHTML='<div class=\"note ok mt\">Report ready'+(r.emailed?' and emailed to '+esc(r.emailed):'')+'.</div><div class=\"acts\"><a class=\"btn ghost\" href=\"'+esc(r.url)+'\" target=\"_blank\" rel=\"noopener\">Open PDF</a><a class=\"btn ghost\" href=\"'+esc(smsHref(x.phone,msg))+'\" target=\"_top\">Text link</a></div>';\n        b.textContent='Done';}).catch(function(e){b.disabled=false;b.textContent=withEmail?'Create & email':'Create PDF';err(e);});}\n    ov.querySelector('#rmk').onclick=function(){go(false,this);};\n    ov.querySelector('#rme').onclick=function(){go(true,this);};\n  }\n\n  /* ----- wrap-up: review + warranty ----- */\n  function wrapCard(x){\n    var s=M.settings;var msg='Thanks for choosing Team Forte! If you\u2019re happy with your roof, would you leave us a quick Google review? '+(s.reviewLink||'');\n    return '<div class=\"card\"><h2>Wrap-up</h2>'+\n      kv('Review request',x.reviewAt?'Sent '+dateStr(x.reviewAt):'Not sent')+\n      (s.reviewLink?'<div class=\"acts\">'+(validEmail(x.email)?'<button class=\"btn ghost\" data-m=\"revmail\">Email request</button>':'<span></span>')+'<a class=\"btn ghost\" href=\"'+esc(smsHref(x.phone,msg))+'\" target=\"_top\">Text request</a></div>':'<p class=\"hint\">Add your Google review link in Spending \u203a Settings to send review requests.</p>')+\n      '<div class=\"toggle\" style=\"margin-top:12px\"><div class=\"tl\"><b>Warranty registered</b><span>Owens Corning registration for this roof</span></div><button class=\"sw'+(x.warrantyDone?' on':'')+'\" role=\"switch\" aria-checked=\"'+(x.warrantyDone?'true':'false')+'\" aria-label=\"Warranty registered\" data-m=\"warranty\"></button></div>'+\n      (s.warrantyLink?'<a class=\"drive\" href=\"'+esc(s.warrantyLink)+'\" target=\"_blank\" rel=\"noopener\">'+ICON.eye+'Open warranty registration</a>':'')+'</div>';\n  }\n\n  /* ----- crew ----- */\n  function loadCrew(){return call('crewJobs').then(function(j){M.crewJobs=j||[];M.tags=M.tags&&M.tags.length?M.tags:['Missing or damaged shingles','Lifted or creased shingles','Pipe boot','Flashing','Chimney','Soft or rotted decking','Valley','Ventilation','Gutters / drip edge','Leak / water stain','Other'];M.crewLoaded=true;}).catch(function(e){toast(e.message,true);});}\n  function renderCrew(){\n    if(!M.crewLoaded&&M.crewFailed){app.innerHTML=bar('<div class=\"brand\">JOBS</div>')+'<div class=\"wrap\"><div class=\"empty\"><b>Couldn\\u2019t load jobs</b>Check your signal and try again.<div class=\"mt\"><button class=\"btn ghost\" data-m=\"crewreload\">Try again</button></div></div></div>';return;}\n    if(!M.crewLoaded){app.innerHTML=bar('<div class=\"brand\">JOBS</div>')+'<div class=\"loading\"><div class=\"spin dk\"></div></div>';if(!M.crewBusy){M.crewBusy=true;loadCrew().then(function(){M.crewBusy=false;M.crewFailed=!M.crewLoaded;render();});}return;}\n    if(M.view==='crewjob'){var j=M.crewJobs.filter(function(z){return z.id===M.qid;})[0];if(j)return renderCrewJob(j);M.view='list';}\n    var h=bar('<div class=\"brand\">JOBS</div><button class=\"link\" data-m=\"crewreload\">Refresh</button><button class=\"link\" data-act=\"logout\">Log out</button>')+'<div class=\"wrap\">'+\n      '<p class=\"sub mt\">Hi '+esc(S.user.name)+'. Upcoming jobs, soonest first.</p>';\n    if(!M.crewJobs.length)h+='<div class=\"empty\"><b>No jobs scheduled</b>Approved jobs show up here.</div>';\n    h+=M.crewJobs.map(function(j){\n      return '<button class=\"q\" data-m=\"crewopen\" data-id=\"'+esc(j.id)+'\"><div class=\"top\"><div><div class=\"nm\">'+esc(j.installDate?dateStr(j.installDate):'Not scheduled')+'</div><div class=\"ad\">'+esc(j.address)+'</div></div><span class=\"pill '+j.status+'\">'+ST_LABEL[j.status]+'</span></div>'+\n        '<div class=\"pills\">'+j.scope.slice(0,2).map(function(s){return '<span class=\"pill\">'+esc(s)+'</span>';}).join('')+(j.crew?'<span class=\"pill\">'+esc(j.crew)+'</span>':'')+'</div></button>';\n    }).join('');\n    app.innerHTML=h+'</div>';\n  }\n  function renderCrewJob(j){\n    var h=bar('<button class=\"back\" data-m=\"crewback\">'+ICON.back+'Jobs</button><div class=\"bar-title\">'+esc(String(j.address).split(',')[0])+'</div>')+'<div class=\"wrap\">';\n    h+='<div class=\"card\"><h2>'+esc(j.installDate?dateStr(j.installDate):'Not scheduled')+(j.crew?' <small>'+esc(j.crew)+'</small>':'')+'</h2>'+\n      kv('Address','<a href=\"https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(j.address)+'\" target=\"_blank\" rel=\"noopener\">'+esc(j.address)+'</a>')+\n      (j.name?kv('Customer',esc(j.name)):'')+(j.phone?kv('Phone','<a href=\"tel:'+esc(String(j.phone).replace(/[^\\d+]/g,''))+'\" target=\"_top\">'+esc(j.phone)+'</a>'):'')+\n      j.scope.map(function(s){return kv('Work',esc(s));}).join('')+\n      (j.roofs||[]).map(function(r){return kv(esc(r.n||'Roof'),Number(r.s||0).toLocaleString()+' sq ft \u00b7 '+esc(r.p||''));}).join('')+\n      (j.layers>1?kv('Layers to tear off',String(j.layers)):'')+\n      (j.notes?'<div class=\"note\">'+esc(j.notes)+'</div>':'')+'</div>';\n    if(j.materials.length)h+='<div class=\"card\"><h2>Materials</h2>'+j.materials.map(function(m){return kv(esc(m.name),'<span class=\"money\">'+m.qty+' '+esc(units(m.unit,m.qty))+'</span>');}).join('')+'</div>';\n    h+='<div class=\"card\"><h2>Photos &amp; notes</h2><div class=\"acts\">'+(j.photoJobId?'<button class=\"btn\" data-m=\"crewphotos\">Job photos</button>':'<span></span>')+'<button class=\"btn ghost\" data-m=\"crewinsp\">Problem photo</button></div>'+\n      '<label class=\"f\">Note for the office</label><div class=\"row\"><input class=\"in\" id=\"cnote\" maxlength=\"300\" placeholder=\"e.g. Need 2 more sheets of decking\"><button class=\"btn dark\" data-m=\"crewnote\" style=\"flex:0 0 auto\">Send</button></div>'+\n      (j.events||[]).slice().reverse().map(function(e){return '<p class=\"hint\">'+esc(e.e.replace(/^crew: /,''))+' \u00b7 '+dateStr(e.t)+'</p>';}).join('')+'</div>';\n    app.innerHTML=h+'</div>';\n  }\n\n  /* ----- spending: jobs ----- */\n  function moneyJobs(){\n    var jobs=M.quotes.filter(function(x){return (x.status==='approved'||x.status==='ordered'||x.status==='done')&&x.contractPrice;});\n    if(!jobs.length)return '<div class=\"empty\"><b>No jobs yet</b>Approved jobs with a price show their profit here.</div>';\n    var ym=new Date().toISOString().slice(0,7);var mon={rev:0,profit:0};\n    var rows=jobs.map(function(x){var p=jobProfit(x);if(String(x.approvedAt||x.created).slice(0,7)===ym){mon.rev+=p.rev;mon.profit+=p.profit;}\n      return '<button class=\"ln\" data-m=\"openjobq\" data-id=\"'+esc(x.id)+'\"><div class=\"l1\"><b>'+esc(x.name||x.id)+' \u00b7 '+esc(townOf(x.address)||'')+'</b><span>'+(x.type==='repair'?'Repair':'Replacement')+' \u00b7 '+ST_LABEL[x.status]+' \u00b7 '+money(p.rev,false)+'</span></div>'+\n        '<div class=\"l2 money\" style=\"color:'+(p.profit<0?'#B3261E':'var(--green)')+'\">'+money(p.profit,false)+'<span>'+p.margin+'% margin</span></div></button>';}).join('');\n    return '<div class=\"stats\"><div class=\"stat\"><b class=\"money\">'+k(mon.rev)+'</b><span>Sold this month</span></div><div class=\"stat\"><b class=\"money\">'+k(mon.profit)+'</b><span>Profit (est.)</span></div><div class=\"stat\"><b>'+(mon.rev?Math.round(mon.profit/mon.rev*100):0)+'%</b><span>Margin</span></div></div><div class=\"card\">'+rows+'</div>';\n  }\n\n  /* ----- settings: extra cards ----- */\n  function settingsExtraCards(){\n    var s=M.settings;var c=s.company||{};var g=s.ghl||{};\n    var h='<div class=\"card\"><h2>Company <small>shown on proposals</small></h2>'+\n      '<div class=\"row\"><div><label class=\"f\">Name</label><input class=\"in\" name=\"co_name\" value=\"'+esc(c.name)+'\"></div><div><label class=\"f\">Legal name</label><input class=\"in\" name=\"co_legal\" value=\"'+esc(c.legal)+'\"></div></div>'+\n      '<label class=\"f\">Address</label><input class=\"in\" name=\"co_address\" value=\"'+esc(c.address)+'\">'+\n      '<div class=\"row\"><div><label class=\"f\">Phone</label><input class=\"in\" name=\"co_phone\" value=\"'+esc(c.phone)+'\"></div><div><label class=\"f\">Email</label><input class=\"in\" name=\"co_email\" value=\"'+esc(c.email)+'\"></div></div>'+\n      '<label class=\"f\">CT HIC registration #</label><input class=\"in\" name=\"co_hic\" value=\"'+esc(c.hic)+'\" placeholder=\"HIC.0000000\"></div>'+\n      '<div class=\"card\"><h2>Proposals &amp; deposits</h2><div class=\"row\"><div><label class=\"f\">Deposit %</label><input class=\"in money\" name=\"depositPct\" inputmode=\"decimal\" value=\"'+(s.depositPct!=null?s.depositPct:30)+'\"></div></div>'+\n      '<label class=\"f\">Deposit payment link <small>(GoHighLevel payment link)</small></label><input class=\"in\" name=\"depositLink\" value=\"'+esc(s.depositLink||'')+'\" placeholder=\"https://\u2026\">'+\n      '<p class=\"hint\">In GoHighLevel: Payments \u203a Payment Links. Make a link where the customer types the amount (or one per deposit size) and paste it here.</p>'+\n      '<label class=\"f\">Terms</label><textarea class=\"in\" name=\"terms\" style=\"min-height:110px\">'+esc(s.terms||'')+'</textarea></div>'+\n      '<div class=\"card\"><h2>Job cost defaults</h2><div class=\"row\"><div><label class=\"f\">Cost per crew day</label><input class=\"in money\" name=\"crewDayRate\" inputmode=\"decimal\" value=\"'+s.crewDayRate+'\"></div>'+\n      '<div><label class=\"f\">Dumpster</label><input class=\"in money\" name=\"dumpster\" inputmode=\"decimal\" value=\"'+s.dumpster+'\"></div><div><label class=\"f\">Permit</label><input class=\"in money\" name=\"permit\" inputmode=\"decimal\" value=\"'+s.permit+'\"></div></div></div>'+\n      '<div class=\"card\"><h2>Reviews &amp; warranty</h2><label class=\"f\">Google review link</label><input class=\"in\" name=\"reviewLink\" value=\"'+esc(s.reviewLink||'')+'\" placeholder=\"https://g.page/r/\u2026/review\">'+\n      '<div class=\"toggle\" style=\"margin-top:12px\"><div class=\"tl\"><b>Email a review request automatically</b><span>When a job is marked done and the customer has an email</span></div><button type=\"button\" class=\"sw'+(s.autoReview!==false?' on':'')+'\" role=\"switch\" data-sw=\"autoReview\" aria-checked=\"'+(s.autoReview!==false)+'\" aria-label=\"Automatic review email\"></button></div>'+\n      '<label class=\"f\">Warranty registration link <small>(optional)</small></label><input class=\"in\" name=\"warrantyLink\" value=\"'+esc(s.warrantyLink||'')+'\" placeholder=\"https://\u2026\"></div>';\n    if(isOwner()){\n      h+='<div class=\"card\"><h2>GoHighLevel <small>'+(g.connected?'<span class=\"pill done\">Connected</span>':'<span class=\"pill\">Not connected</span>')+'</small></h2>'+\n        '<p class=\"hint\">GoHighLevel \u203a Settings \u203a Private Integrations \u203a Create. Give it Contacts and Opportunities access (view and edit) and paste the token here.</p>'+\n        '<label class=\"f\">Private integration token</label><input class=\"in\" name=\"ghlToken\" autocomplete=\"off\" placeholder=\"'+(s.hasGhlToken?'Saved. Paste to replace':'pit-\u2026')+'\">'+\n        '<div id=\"ghlsel\">'+kv('Pipeline','Sales Pipeline')+kv('When a quote is sent','Quote Sent')+kv('When a job is approved','Won - Signed &amp; Scheduled')+'</div>'+\n        '<div class=\"toggle\" style=\"margin-top:8px\"><div class=\"tl\"><b>Sync quotes and jobs</b><span>Contacts and deals in your Sales Pipeline</span></div><button type=\"button\" class=\"sw'+(g.enabled!==false?' on':'')+'\" role=\"switch\" data-sw=\"ghlEnabled\" aria-checked=\"'+(g.enabled!==false)+'\" aria-label=\"Sync with GoHighLevel\"></button></div>'+\n        '<button type=\"button\" class=\"btn ghost block mt\" data-m=\"ghltest\">Check connection</button></div>';\n      h+='<div class=\"card\"><h2>Online payments (Stripe) <small>'+(s.hasStripe?'<span class=\"pill done\">Connected'+(s.stripeMode==='test'?' \u00b7 test mode':'')+'</span>':'<span class=\"pill\">Not connected</span>')+'</small></h2>'+\n        '<p class=\"hint\">Customers pay the deposit right after signing, and you can send invoices for the balance. Card or bank account (ACH). Money goes straight to your Stripe account.</p>'+\n        '<p class=\"hint\">Stripe \u203a Developers \u203a API keys \u203a <b>Create restricted key</b>. Name it \u201cTeam Forte app\u201d and set <b>Checkout Sessions: Write</b> (everything else None). Paste it here. Never paste the publishable key.</p>'+\n        '<label class=\"f\">Restricted key</label><input class=\"in\" name=\"stripeKey\" autocomplete=\"off\" placeholder=\"'+(s.hasStripe?'Saved. Paste to replace':'rk_live_\u2026')+'\">'+\n        '<button type=\"button\" class=\"btn ghost block mt\" data-m=\"stripetest\">Check connection</button></div>';\n      h+='<div class=\"card\"><h2>People &amp; logins</h2><p class=\"hint\">Your setup passcode is the owner login. Office: everything except logins and keys. Crew: their jobs and photos only, no prices.</p><div id=\"people\"><div class=\"loading\" style=\"padding:12px\"><div class=\"spin dk\"></div></div></div>'+\n        '<div class=\"acts\"><button type=\"button\" class=\"btn ghost\" data-m=\"addperson\">'+ICON.plus+'Add person</button><button type=\"button\" class=\"btn dark\" data-m=\"savepeople\">Save people</button></div></div>';\n    }\n    return h;\n  }\n  function personRow(u){return '<div class=\"row person\" style=\"margin-top:8px\" data-id=\"'+esc(u.id||'')+'\"><input class=\"in\" data-pn placeholder=\"Name\" value=\"'+esc(u.name||'')+'\"><select class=\"in\" data-pr style=\"flex:0 0 96px\"><option value=\"crew\"'+(u.role!=='office'?' selected':'')+'>Crew</option><option value=\"office\"'+(u.role==='office'?' selected':'')+'>Office</option></select><input class=\"in\" data-pp placeholder=\"PIN\" style=\"flex:0 0 96px\" value=\"'+esc(u.pin||'')+'\"></div>';}\n  function loadPeople(){var box=document.getElementById('people');if(!box)return;call('users').then(function(list){box=document.getElementById('people');if(box)box.innerHTML=list.length?list.map(personRow).join(''):'<p class=\"hint\" id=\"nopeople\">No one yet.</p>';}).catch(err);}\n  function extraSettingsArgs(f){\n    var el=f.elements;var sw=function(n){var b=f.querySelector('[data-sw=\"'+n+'\"]');return b?b.classList.contains('on'):undefined;};\n    var a={company:{name:el.co_name.value,legal:el.co_legal.value,address:el.co_address.value,phone:el.co_phone.value,email:el.co_email.value,hic:el.co_hic.value},\n      depositPct:el.depositPct.value,depositLink:el.depositLink.value,terms:el.terms.value,crewDayRate:el.crewDayRate.value,dumpster:el.dumpster.value,permit:el.permit.value,\n      reviewLink:el.reviewLink.value,warrantyLink:el.warrantyLink.value,autoReview:sw('autoReview')};\n    if(el.stripeKey&&el.stripeKey.value.trim())a.stripeKey=el.stripeKey.value.trim();\n    if(el.ghlToken){if(el.ghlToken.value.trim())a.ghlToken=el.ghlToken.value.trim();a.ghl={enabled:sw('ghlEnabled')};\n      ['pipelineId','stageQuote','stageWon'].forEach(function(k2){if(el['g_'+k2])a.ghl[k2]=el['g_'+k2].value;});}\n    return a;\n  }\n\n  /* ----- repair book on the Quote prices screen ----- */\n  function repairBookCard(){\n    var r=M.repairs;\n    return '<div class=\"card\"><h2>Repair prices</h2><div class=\"row\"><div><label class=\"f\">Minimum service charge</label><input class=\"in money\" id=\"rbmin\" inputmode=\"decimal\" value=\"'+r.min+'\"></div></div>'+\n      '<div id=\"rbrows\">'+r.items.map(rbRow).join('')+'</div><button type=\"button\" class=\"btn ghost block mt\" data-m=\"rbadd\">'+ICON.plus+'Add repair</button></div>';\n  }\n  function rbRow(it){return '<div class=\"row rb\" style=\"margin-top:8px\" data-key=\"'+esc(it.key||'')+'\"><input class=\"in\" data-rn value=\"'+esc(it.name||'')+'\" placeholder=\"Repair\"><input class=\"in\" data-ru style=\"flex:0 0 70px\" value=\"'+esc(it.unit||'each')+'\"><input class=\"in money\" data-rp style=\"flex:0 0 84px\" inputmode=\"decimal\" value=\"'+(it.price!=null?it.price:'')+'\" placeholder=\"$\"></div>';}\n  function readRepairBook(){\n    var items=[];document.querySelectorAll('#rbrows .rb').forEach(function(r){var n=r.querySelector('[data-rn]').value.trim();if(!n)return;items.push({key:r.getAttribute('data-key')||'',name:n,unit:r.querySelector('[data-ru]').value.trim()||'each',price:Number(r.querySelector('[data-rp]').value)||0});});\n    return {min:Number((document.getElementById('rbmin')||{}).value)||0,items:items};\n  }\n\n  /* ---------- clicks ---------- */\n  function click(t,ev){\n    if(ev&&t.tagName==='A'&&t.getAttribute('href')==='#')ev.preventDefault();\n    var a=t.getAttribute('data-m');\n    if(a==='retry'){M.failed=false;render();return;}\n    if(a==='editcust'){editCustSheet();return;}\n    if(a==='ghlsync'){call('ghlSyncNow',{id:M.qid}).then(function(r){mergeQ(r);render();toast('Synced to GoHighLevel');}).catch(function(e){load().then(render);err(e);});return;}\n    if(a==='edititems'){editItemsSheet();return;}\n    if(a==='approverep'){t.disabled=true;saveQ({status:'approved'},'Approved').then(function(){M.qfilter='approved';call('list').then(function(d){S.jobs=d.jobs||[];});}).catch(function(){t.disabled=false;});return;}\n    if(a==='propose'){proposeSheet();return;}\n    if(a==='conew'){coSheet('');return;}\n    if(a==='coedit'){coSheet(t.getAttribute('data-co'));return;}\n    if(a==='cosend'){coSendSheet(t.getAttribute('data-co'));return;}\n    if(a==='jtab'){M.jobTab=t.getAttribute('data-v');render();return;}\n    if(a==='cxl'){cancelContract();return;}\n    if(a==='followtog'){var xf=q();saveQ({followOff:!xf.followOff},xf.followOff?'Reminders on':'Reminders off for this customer').catch(function(){});return;}\n    if(a==='adadd'){document.getElementById('adrows').insertAdjacentHTML('beforeend',adRow({unit:'each',basis:'manual'}));return;}\n    if(a==='adrm'){var ar=t.closest('.adr');if(ar)ar.remove();return;}\n    if(a==='sigclr'){var cv=document.getElementById('csig');if(cv){cv.getContext('2d').clearRect(0,0,cv.width,cv.height);cv.removeAttribute('data-drawn');}return;}\n    if(a==='reqpay'){reqPaySheet();return;}\n    if(a==='recpay'){recPaySheet();return;}\n    if(a==='delpay'){if(!confirm('Remove this payment record?'))return;call('deletePayment',{id:q().id,paymentId:t.getAttribute('data-pid')}).then(function(r){mergeQ(r);render();toast('Removed');}).catch(err);return;}\n    if(a==='savesched'){saveQ({installDate:document.getElementById('sd').value,crew:document.getElementById('sc').value},'Schedule saved');return;}\n    if(a==='editcosts'){costsSheet();return;}\n    if(a==='addinsp'){addInspSheet(M.qid);return;}\n    if(a==='insp'){inspSheet(t.getAttribute('data-id'));return;}\n    if(a==='report'){reportSheet();return;}\n    if(a==='revmail'){t.disabled=true;call('reviewEmail',{id:M.qid}).then(function(r){mergeQ(r);render();toast('Review request sent');}).catch(function(e){t.disabled=false;err(e);});return;}\n    if(a==='warranty'){var wx=q();saveQ({warrantyDone:!wx.warrantyDone},!wx.warrantyDone?'Warranty marked registered':'Saved');return;}\n    if(a==='openjobq'){S.tab='quotes';store('tfp_tab','quotes');M.qid=t.getAttribute('data-id');M.view='quote';render();window.scrollTo(0,0);return;}\n    if(a==='crewopen'){M.qid=t.getAttribute('data-id');M.view='crewjob';render();window.scrollTo(0,0);return;}\n    if(a==='crewback'){M.view='list';render();window.scrollTo(0,0);return;}\n    if(a==='crewreload'){M.crewLoaded=false;M.crewFailed=false;render();return;}\n    if(a==='crewphotos'){var cj=M.crewJobs.filter(function(z){return z.id===M.qid;})[0];S.tab='photos';store('tfp_tab','photos');S.jobId=cj.photoJobId;S.view='job';\n      if(!S.jobs.some(function(j){return j.id===cj.photoJobId;})){S.jobWait=true;call('list').then(function(d){S.jobs=d.jobs||[];S.jobWait=false;render();},function(e){S.jobWait=false;render();toast(e.message,true);});}render();window.scrollTo(0,0);return;}\n    if(a==='crewinsp'){addInspSheet(M.qid);return;}\n    if(a==='crewnote'){var ni=document.getElementById('cnote');var nv=ni.value.trim();if(!nv)return;t.disabled=true;\n      call('crewNote',{id:M.qid,note:nv}).then(function(){var cj2=M.crewJobs.filter(function(z){return z.id===M.qid;})[0];cj2.events=(cj2.events||[]).concat([{e:'crew: '+nv+' ('+S.user.name+')',t:new Date().toISOString()}]);render();toast('Sent to the office');}).catch(function(e){t.disabled=false;err(e);});return;}\n    if(a==='stripetest'){var sf2=document.getElementById('sf');t.disabled=true;\n      saveSettings(sf2,(document.querySelector('#aenv .on')||{getAttribute:function(){return 'sandbox';}}).getAttribute('data-env')).then(function(){return call('stripeTest');}).then(function(r){toast('Stripe is connected ('+r.mode+' mode)');})\n        .catch(function(e){if(e.message!=='bad')err(e);}).then(function(){var b=document.querySelector('[data-m=stripetest]');if(b)b.disabled=false;});return;}\n    if(a==='ghltest'){var gf=document.getElementById('sf');t.disabled=true;\n      saveSettings(gf,(document.querySelector('#aenv .on')||{getAttribute:function(){return 'sandbox';}}).getAttribute('data-env')).then(function(){return call('ghlPipelines');}).then(function(list){\n        var g=M.settings.ghl||{};var box=document.getElementById('ghlsel');\n        function sel(name,opts,cur){return '<select class=\"in\" name=\"'+name+'\">'+opts.map(function(o){return '<option value=\"'+esc(o.id)+'\"'+(o.id===cur?' selected':'')+'>'+esc(o.name)+'</option>';}).join('')+'</select>';}\n        var pl=list.filter(function(x){return x.id===g.pipelineId;})[0]||list[0];\n        if(box&&pl)box.innerHTML='<label class=\"f\">Pipeline</label>'+sel('g_pipelineId',list,g.pipelineId)+'<label class=\"f\">When a quote is sent</label>'+sel('g_stageQuote',pl.stages,g.stageQuote)+'<label class=\"f\">When a job is approved</label>'+sel('g_stageWon',pl.stages,g.stageWon);\n        toast('GoHighLevel is connected');}).catch(function(e){if(e.message!=='bad')err(e);}).then(function(){var b=document.querySelector('[data-m=ghltest]');if(b)b.disabled=false;});return;}\n    if(a==='addperson'){var pb=document.getElementById('people');var np=document.getElementById('nopeople');if(np)np.remove();pb.insertAdjacentHTML('beforeend',personRow({role:'crew'}));return;}\n    if(a==='savepeople'){var ppl=[];document.querySelectorAll('#people .person').forEach(function(r){var nm=r.querySelector('[data-pn]').value.trim(),pn=r.querySelector('[data-pp]').value.trim();if(!nm&&!pn)return;ppl.push({id:r.getAttribute('data-id')||undefined,name:nm,role:r.querySelector('[data-pr]').value,pin:pn});});\n      t.disabled=true;call('saveUsers',{users:ppl}).then(function(){loadPeople();toast('People saved');}).catch(err).then(function(){t.disabled=false;});return;}\n    if(a==='rbadd'){document.getElementById('rbrows').insertAdjacentHTML('beforeend',rbRow({unit:'each'}));return;}\n    if(a==='newest'){newEst();M.view='new';render();window.scrollTo(0,0);var ea=document.getElementById('ea');if(ea)ea.focus();return;}\n    if(a==='pricing'){M.view='pricing';render();window.scrollTo(0,0);return;}\n    if(a==='measure'){measure();return;}\n    if(a==='colors'){colorBook(1,null,'');return;}\n    if(a==='addroof'){M.est.roofs.push({n:M.est.roofs.length===1?'Garage':'Section '+(M.est.roofs.length+1),s:0,p:'4/12'});render();return;}\n    if(a==='rmroof'){M.est.roofs.splice(+t.getAttribute('data-i'),1);render();return;}\n    if(a==='addnear'){var nx=M.est.m&&M.est.m.nearby&&M.est.m.nearby[+t.getAttribute('data-i')];if(nx){M.est.roofs.push({n:nx.row.n,s:nx.row.s,p:nx.row.p,f:nx.row.f});M.est.m.nearby.splice(+t.getAttribute('data-i'),1);}render();return;}\n    if(a==='saveest'){saveEst(t.getAttribute('data-v')==='email');return;}\n    if(a==='share'){shareSheet();return;}\n    if(a==='qf'){M.qfilter=t.getAttribute('data-v');render();return;}\n    if(a==='addlink'){addLinkSheet();return;}\n    if(a==='openq'){M.qid=t.getAttribute('data-id');M.view='quote';M.draft=null;render();window.scrollTo(0,0);return;}\n    if(a==='back'){M.view='list';render();window.scrollTo(0,0);return;}\n    if(a==='approve'){approve();return;}\n    if(a==='archive'){confirmBox('Archive this quote?','It will be hidden from your Quotes list. Orders already placed are kept.','Archive').then(function(ok){if(!ok)return;\n      call('deleteQuote',{id:M.qid}).then(function(){M.quotes=M.quotes.filter(function(x){return x.id!==M.qid;});M.view='list';render();toast('Archived');}).catch(err);});return;}\n    if(a==='recalc'){recalc();return;}\n    if(a==='measuretool'){measureTool();return;}\n    if(a==='line'){lineSheet(+t.getAttribute('data-i'));return;}\n    if(a==='addline'){addLineSheet();return;}\n    if(a==='editjob'){editJobSheet();return;}\n    if(a==='status'){var sv=t.getAttribute('data-v'),go=function(){saveQ({status:sv},sv==='done'?'Marked done':'Reopened');};\n      if(sv!=='done')return go();var xs=q(),st2=M.settings||{},mails=st2.autoReview&&st2.reviewLink&&/@/.test(xs.email||'')&&!xs.reviewAt;\n      confirmBox('Mark this job done?',mails?'We\\u2019ll email '+(xs.name||'the customer')+' a review request.':'You can reopen it later.','Mark done').then(function(ok){if(ok)go();});return;}\n    if(a==='photos'){var x=q();S.tab='photos';store('tfp_tab','photos');S.jobId=x.photoJobId;S.view='job';\n      if(!S.jobs.some(function(j){return j.id===x.photoJobId;})){S.jobWait=true;call('list').then(function(d){S.jobs=d.jobs||[];S.jobWait=false;render();},function(e){S.jobWait=false;render();toast(e.message,true);});}render();window.scrollTo(0,0);return;}\n    if(a==='order'){var xo=q(),ov0=t.getAttribute('data-v');\n      if(inCancel(xo)){confirmBox('Cancellation period still open','The customer can cancel until midnight '+prettyDay(xo.cancelBy)+'. If you order now and they cancel, you may be stuck with the materials.','Order anyway').then(function(ok){if(ok)orderSheet(ov0);});return;}\n      orderSheet(ov0);return;}\n    if(a==='openo'){orderDetail(t.getAttribute('data-id'));return;}\n    if(a==='mtab'){M.money=t.getAttribute('data-v');render();return;}\n    if(a==='price'){priceSheet(t.getAttribute('data-k'));return;}\n    if(a==='refresh'){t.disabled=true;t.textContent='Refreshing\u2026';call('refreshPrices').then(function(r){return load().then(function(){render();toast(r.updated+' prices updated'+(r.failed.length?', '+r.failed.length+' failed':''));});}).catch(function(e){render();err(e);});return;}\n    if(a==='settings'){M.mview='settings';render();window.scrollTo(0,0);return;}\n    if(a==='mhome'){M.mview='home';render();window.scrollTo(0,0);return;}\n    if(a==='addsup'){document.getElementById('sups').insertAdjacentHTML('beforeend',supRow({name:'',email:''}));return;}\n    if(a==='abctest'){var f=document.getElementById('sf');t.disabled=true;\n      saveSettings(f,document.querySelector('#aenv .on').getAttribute('data-env')).then(function(){return call('abcTest');}).then(function(r){toast('ABC login works ('+(r.env==='production'?'Live':'Test')+')');})\n        .catch(function(e){if(e.message!=='bad')err(e);}).then(function(){var b=document.querySelector('[data-m=abctest]');if(b)b.disabled=false;});return;}\n    if(a==='branches'){var box=document.getElementById('brs');box.innerHTML='<div class=\"loading\" style=\"padding:16px\"><div class=\"spin dk\"></div></div>';\n      saveSettings(document.getElementById('sf'),document.querySelector('#aenv .on').getAttribute('data-env')).then(function(){return call('abcBranches',{state:'CT'});}).then(function(list){\n        box=document.getElementById('brs');\n        box.innerHTML=list.length?list.map(function(b){return '<button type=\"button\" class=\"res\" data-m=\"pickbr\" data-n=\"'+esc(b.number)+'\" data-nm=\"'+esc(b.name||b.city)+'\"><b>'+esc(b.name||'Branch '+b.number)+'</b><span>#'+esc(b.number)+' \u00b7 '+esc(b.city)+'</span></button>';}).join(''):'<p class=\"hint\">No branches found.</p>';\n      }).catch(function(e){var bx=document.getElementById('brs');if(bx)bx.innerHTML='';if(e.message!=='bad')err(e);});return;}\n    if(a==='pickbr'){var fm=document.getElementById('sf');fm.elements.branch.value=t.getAttribute('data-n');fm.elements.branchName.value=t.getAttribute('data-nm');document.getElementById('brs').innerHTML='';toast('Branch picked. Tap Save settings.');return;}\n    if(a==='hook'){t.disabled=true;call('abcRegisterWebhook').then(function(r){M.settings=r;render();toast('Order updates turned on');}).catch(function(e){t.disabled=false;err(e);});return;}\n    if(a==='disc'){confirmBox('Disconnect ABC Supply?','Your ABC login is removed from the app. Prices and past orders stay.','Disconnect').then(function(ok){if(!ok)return;\n      call('saveSettings',{abc:{disconnect:true}}).then(function(r){M.settings=r;render();toast('Disconnected');}).catch(err);});return;}\n  }\n\n  return {\n    render:renderMat, click:click, load:load, loadCrew:loadCrew,\n    reset:function(){M.loaded=false;M.quotes=[];M.orders=[];M.prices=[];M.view='list';M.mview='home';},\n    home:function(){M.view='list';M.mview='home';},\n    newCount:function(){return M.quotes.filter(function(x){return x.status==='new';}).length;}\n  };\n})();\n\n\n/* ---------- start ---------- */\nvar saved=load('tfp_pass');\nif(saved){S.pass=saved;boot();}else{render();}\n})();\n</script>\n</body>\n</html>\n";

var WIDGET_JS = "/* Team Forte website gallery. Loads jobs and photos from Team Forte Photos (Google Drive). */\n(function () {\n  'use strict';\n  if (window.TFGallery && window.TFGallery.version) { window.TFGallery.scan(); return; }\n\n  var EXEC = '__EXEC_URL__';\n  try {\n    var cs = document.currentScript;\n    if (cs && cs.src && cs.src.indexOf('/exec') > 0) EXEC = cs.src.split('?')[0];\n  } catch (e) { /* use baked url */ }\n\n  var STAGE_LABEL = { before: 'Before', during: 'During', after: 'After' };\n  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];\n  var dataPromise = null;\n\n  var CSS = '' +\n    '.tfg{--tfg-navy:#13202F;--tfg-red:#FF5440;--tfg-red-dk:#E23E2B;--tfg-ink:#1C2430;--tfg-muted:#5B6675;--tfg-line:#DDE2E8;--tfg-slate:#F2F4F7;--tfg-card:#fff;' +\n    'font-family:Montserrat,\"Segoe UI\",Arial,sans-serif;color:var(--tfg-ink);text-align:left;line-height:1.45;-webkit-font-smoothing:antialiased;max-width:1180px;margin:0 auto;padding:0 16px}' +\n    '.tfg *,.tfg-modal *{box-sizing:border-box}' +\n    '.tfg img,.tfg-modal img{border:0!important;border-radius:0!important;box-shadow:none!important;padding:0!important;max-width:none!important}' +\n    '.tfg h2,.tfg h3,.tfg p,.tfg button,.tfg a,.tfg span,.tfg-modal h3,.tfg-modal p,.tfg-modal button,.tfg-modal a,.tfg-modal span{font-family:inherit!important}' +\n    '.tfg--dark{--tfg-ink:#fff;--tfg-muted:#C4CCD6;--tfg-line:rgba(255,255,255,.14);--tfg-card:#1B2B3D}' +\n    '.tfg-head{text-align:center;margin:0 auto 22px;max-width:680px}' +\n    '.tfg-head h2{font-size:clamp(26px,4.2vw,38px);line-height:1.15;font-weight:800;margin:0 0 8px;color:var(--tfg-ink);text-transform:none;letter-spacing:0}' +\n    '.tfg-head p{margin:0;color:var(--tfg-muted);font-size:16px}' +\n    '.tfg-tabs{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:0 0 22px}' +\n    '@media(max-width:600px){.tfg-tabs{flex-wrap:nowrap;justify-content:flex-start;overflow-x:auto;margin-left:-16px;margin-right:-16px;padding:2px 16px;scrollbar-width:none}.tfg-tabs::-webkit-scrollbar{display:none}}' +\n    '.tfg-tab{flex:none;appearance:none;border:1px solid var(--tfg-line);background:var(--tfg-card);color:var(--tfg-ink);font:inherit;font-weight:700;font-size:14px;padding:10px 18px;border-radius:999px;cursor:pointer;transition:all .15s;margin:0}' +\n    '.tfg-tab:hover{border-color:var(--tfg-red)}' +\n    '.tfg-tab[aria-selected=\"true\"]{background:var(--tfg-red);border-color:var(--tfg-red);color:#fff}' +\n    '.tfg-grid{display:grid;grid-template-columns:1fr;gap:18px}' +\n    '@media(min-width:600px){.tfg-grid{grid-template-columns:1fr 1fr}}' +\n    '@media(min-width:960px){.tfg-grid{grid-template-columns:1fr 1fr 1fr}}' +\n    '.tfg-card{appearance:none;display:flex;flex-direction:column;width:100%;padding:0;margin:0;text-align:left;font:inherit;color:inherit;background:var(--tfg-card);border:1px solid var(--tfg-line);border-radius:14px;overflow:hidden;cursor:pointer;transition:transform .2s,box-shadow .2s}' +\n    '.tfg-card:hover{transform:translateY(-3px);box-shadow:0 14px 30px rgba(19,32,47,.16)}' +\n    '.tfg-card:focus-visible{outline:3px solid var(--tfg-red);outline-offset:2px}' +\n    '.tfg-img{position:relative;aspect-ratio:4/3;background:#D9DEE4;overflow:hidden}' +\n    '.tfg-img img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .5s;margin:0;max-width:none}' +\n    '.tfg-card:hover .tfg-img img{transform:scale(1.04)}' +\n    '.tfg-split{position:absolute;inset:0;display:grid;grid-template-columns:1fr 1fr;gap:2px;background:#fff}' +\n    '.tfg-split>div{position:relative;overflow:hidden}' +\n    '.tfg-split span{position:absolute;bottom:8px;left:8px;background:rgba(19,32,47,.82);color:#fff;font-size:10px;font-weight:800;letter-spacing:.1em;padding:3px 8px;border-radius:4px;text-transform:uppercase}' +\n    '.tfg-badge{position:absolute;top:10px;left:10px;background:var(--tfg-red);color:#fff;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:5px 10px;border-radius:6px}' +\n    '.tfg-body{padding:14px 16px 16px;display:flex;flex-direction:column;gap:4px;flex:1}' +\n    '.tfg-body h3{font-size:17px;font-weight:800;margin:0;color:var(--tfg-ink);line-height:1.3;text-transform:none;letter-spacing:0}' +\n    '.tfg-meta{font-size:13px;color:var(--tfg-muted);margin:0}' +\n    '.tfg-view{margin-top:auto;padding-top:8px;font-size:14px;font-weight:700;color:var(--tfg-red)}' +\n    '.tfg-card.tfg-hasba{cursor:default}.tfg-card.tfg-hasba:hover .tfg-img img{transform:none}' +\n    'button.tfg-view{appearance:none;-webkit-appearance:none;background:none;border:0;margin:auto 0 0;padding:10px 0 2px;text-align:left;font:inherit;font-size:14px;font-weight:700;color:var(--tfg-red);cursor:pointer;align-self:flex-start}' +\n    'button.tfg-view:hover{text-decoration:underline}button.tfg-view:focus-visible{outline:2px solid var(--tfg-red);outline-offset:3px;border-radius:4px}' +\n    '.tfg-ba{--p:50%;position:absolute;inset:0;touch-action:pan-y;cursor:ew-resize;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;outline:none}' +\n    '.tfg-ba img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;-webkit-user-drag:none}' +\n    '.tfg-ba .tfg-ba-b{clip-path:inset(0 calc(100% - var(--p)) 0 0);-webkit-clip-path:inset(0 calc(100% - var(--p)) 0 0)}' +\n    '.tfg-ba-h{position:absolute;top:0;bottom:0;left:var(--p);width:3px;margin-left:-1.5px;background:#fff;box-shadow:0 0 6px rgba(0,0,0,.35);pointer-events:none}' +\n    '.tfg-ba-k{position:absolute;top:50%;left:clamp(23px,var(--p),calc(100% - 23px));width:42px;height:42px;margin:-21px 0 0 -21px;pointer-events:none;border-radius:50%;background:#fff;box-shadow:0 3px 12px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;color:var(--tfg-red)}' +\n    '.tfg-ba-k svg{width:22px;height:22px}' +\n    '.tfg-ba:focus-visible .tfg-ba-k{box-shadow:0 0 0 3px var(--tfg-red),0 3px 12px rgba(0,0,0,.35)}' +\n    '.tfg-ba-l{position:absolute;bottom:10px;background:rgba(19,32,47,.82);color:#fff;font-size:10px;font-weight:800;letter-spacing:.1em;padding:4px 9px;border-radius:4px;text-transform:uppercase;pointer-events:none;transition:opacity .2s}' +\n    '.tfg-ba-l.b{left:10px}.tfg-ba-l.a{right:10px;background:var(--tfg-red)}' +\n    '.tfg-ba.lo .tfg-ba-l.b,.tfg-ba.hi .tfg-ba-l.a{opacity:0}' +\n    '.tfg-more{text-align:center;margin-top:24px}' +\n    '.tfg-btn{appearance:none;display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:0 26px;border-radius:10px;border:0;background:var(--tfg-red);color:#fff;font:inherit;font-weight:800;font-size:15px;cursor:pointer;text-decoration:none;transition:background .15s}' +\n    '.tfg-btn:hover{background:var(--tfg-red-dk);color:#fff}' +\n    '.tfg-btn--ghost{background:transparent;color:var(--tfg-ink);border:2px solid var(--tfg-line)}' +\n    '.tfg-btn--ghost:hover{background:transparent;color:var(--tfg-ink);border-color:var(--tfg-red)}' +\n    '.tfg-sk{border-radius:14px;background:linear-gradient(90deg,rgba(150,160,175,.18),rgba(150,160,175,.32),rgba(150,160,175,.18));background-size:200% 100%;animation:tfg-sh 1.3s infinite;aspect-ratio:4/3.9}' +\n    '@keyframes tfg-sh{to{background-position:-200% 0}}' +\n    /* modal */\n    '.tfg-modal{--tfg-red:#FF5440;--tfg-red-dk:#E23E2B;position:fixed;inset:0;z-index:2147483000;background:rgba(10,16,24,.88);display:flex;align-items:center;justify-content:center;padding:16px;font-family:Montserrat,\"Segoe UI\",Arial,sans-serif;-webkit-font-smoothing:antialiased;animation:tfg-in .18s;text-align:left;line-height:1.45}' +\n    '@keyframes tfg-in{from{opacity:0}to{opacity:1}}' +\n    '.tfg-dlg{background:#fff;color:#1C2430;width:100%;max-width:980px;max-height:100%;overflow:auto;border-radius:16px;box-shadow:0 30px 80px rgba(0,0,0,.45)}' +\n    '@media(max-width:600px){.tfg-modal{padding:0;align-items:stretch}.tfg-dlg{border-radius:0;max-height:none;height:100%}}' +\n    '.tfg-top{position:sticky;top:0;z-index:3;display:flex;align-items:flex-start;gap:12px;padding:16px 16px 12px 20px;background:#fff;border-bottom:1px solid #DDE2E8}' +\n    '.tfg-top h3{margin:0;font-size:19px;font-weight:800;line-height:1.25;color:#1C2430;text-transform:none;letter-spacing:0}' +\n    '.tfg-top p{margin:2px 0 0;font-size:13px;color:#5B6675}' +\n    '.tfg-x{appearance:none;margin-left:auto;flex:none;width:40px;height:40px;border-radius:50%;border:0;background:#F2F4F7;color:#1C2430;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0}' +\n    '.tfg-x:hover{background:#E4E8ED}' +\n    '.tfg-x svg{width:20px;height:20px}' +\n    '.tfg-mtabs{display:flex;gap:6px;padding:12px 20px 0;flex-wrap:wrap}' +\n    '.tfg-mtab{appearance:none;border:1px solid #DDE2E8;background:#fff;color:#1C2430;font:inherit;font-weight:700;font-size:13px;padding:8px 14px;border-radius:999px;cursor:pointer;margin:0}' +\n    '.tfg-mtab[aria-selected=\"true\"]{background:#13202F;border-color:#13202F;color:#fff}' +\n    '.tfg-stage{padding:12px 20px 0}' +\n    '.tfg-cmp{position:relative;width:100%;aspect-ratio:4/3;max-height:70vh;border-radius:12px;overflow:hidden;background:#0E1722;user-select:none;-webkit-user-select:none;touch-action:pan-y;cursor:ew-resize}' +\n    '.tfg-cmp img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;pointer-events:none;margin:0;max-width:none}' +\n    '.tfg-cmp .tfg-after{clip-path:inset(0 0 0 50%)}' +\n    '.tfg-line{position:absolute;top:0;bottom:0;left:50%;width:3px;margin-left:-1.5px;background:#fff;box-shadow:0 0 10px rgba(0,0,0,.4);pointer-events:none}' +\n    '.tfg-knob{position:absolute;top:50%;left:50%;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;background:#fff;box-shadow:0 4px 14px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;color:#13202F;outline:none}' +\n    '.tfg-knob:focus-visible{box-shadow:0 0 0 4px #FF5440,0 4px 14px rgba(0,0,0,.35)}' +\n    '.tfg-knob svg{width:24px;height:24px}' +\n    '.tfg-lbl{position:absolute;top:12px;background:rgba(19,32,47,.85);color:#fff;font-size:11px;font-weight:800;letter-spacing:.12em;padding:5px 10px;border-radius:5px;pointer-events:none}' +\n    '.tfg-lbl.l{left:12px}.tfg-lbl.r{right:12px;background:#FF5440}' +\n    '.tfg-hint{font-size:12px;color:#5B6675;text-align:center;margin:8px 0 0}' +\n    '.tfg-view2{position:relative;width:100%;aspect-ratio:4/3;max-height:70vh;border-radius:12px;overflow:hidden;background:#0E1722;touch-action:pan-y}' +\n    '.tfg-view2 img{width:100%;height:100%;object-fit:contain;display:block;margin:0;max-width:none}' +\n    '.tfg-nav{appearance:none;position:absolute;top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;border:0;background:rgba(255,255,255,.92);color:#13202F;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,.3);padding:0}' +\n    '.tfg-nav svg{width:22px;height:22px}' +\n    '.tfg-nav.p{left:10px}.tfg-nav.n{right:10px}' +\n    '.tfg-nav[disabled]{opacity:0;pointer-events:none}' +\n    '.tfg-tag{position:absolute;top:12px;left:12px;background:rgba(19,32,47,.85);color:#fff;font-size:11px;font-weight:800;letter-spacing:.12em;padding:5px 10px;border-radius:5px;text-transform:uppercase}' +\n    '.tfg-tag.after{background:#FF5440}' +\n    '.tfg-count{position:absolute;bottom:12px;right:12px;background:rgba(0,0,0,.6);color:#fff;font-size:12px;font-weight:700;padding:4px 9px;border-radius:999px}' +\n    '.tfg-fsb{appearance:none;position:absolute;right:10px;top:10px;z-index:2;width:40px;height:40px;border-radius:10px;border:0;background:rgba(0,0,0,.55);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;margin:0}' +\n    '.tfg-fsb svg{width:20px;height:20px}.tfg-fsb:hover{background:rgba(0,0,0,.75)}' +\n    '.tfg-view2{cursor:zoom-in}.tfg-view2 .tfg-count{right:auto;left:12px;top:auto}' +\n    '.tfg-fs{--tfg-red:#FF5440;position:fixed;inset:0;z-index:2147483001;background:#000;touch-action:none;-webkit-user-select:none;user-select:none;animation:tfg-in .15s;font-family:Montserrat,\"Segoe UI\",Arial,sans-serif}' +\n    '.tfg-fs-st{position:absolute;inset:0;overflow:hidden}' +\n    '.tfg-fs-tr{position:absolute;inset:0;display:flex;will-change:transform}' +\n    '.tfg-fs-sl{flex:0 0 100%;height:100%;overflow:hidden;position:relative}' +\n    '.tfg-fs-sl img{position:absolute;inset:0;width:100%!important;height:100%!important;object-fit:contain;transform-origin:0 0;pointer-events:none;-webkit-user-drag:none;margin:0;max-width:none}' +\n    '.tfg-fs-cmp{position:absolute;inset:0;touch-action:none;cursor:ew-resize}' +\n    '.tfg-fs-cmp img{position:absolute;inset:0;width:100%!important;height:100%!important;object-fit:contain;pointer-events:none;margin:0;max-width:none}' +\n    '.tfg-fs-bar{position:absolute;left:0;right:0;z-index:3;display:flex;align-items:center;gap:10px;padding:12px 14px;color:#fff;transition:opacity .2s}' +\n    '.tfg-fs-bar.t{top:0;padding-top:calc(12px + env(safe-area-inset-top));background:linear-gradient(rgba(0,0,0,.65),transparent)}' +\n    '.tfg-fs-bar.b{bottom:0;padding-bottom:calc(16px + env(safe-area-inset-bottom));background:linear-gradient(transparent,rgba(0,0,0,.65));justify-content:center}' +\n    '.tfg-fs-t{flex:1;font-size:15px;font-weight:700;line-height:1.25;color:#fff}.tfg-fs-t small{display:block;font-weight:500;font-size:12px;opacity:.8;margin-top:2px}' +\n    '.tfg-fs-x,.tfg-fs-n{appearance:none;border:0;cursor:pointer;color:#fff;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;padding:0;margin:0}' +\n    '.tfg-fs-x{width:44px;height:44px;border-radius:50%}.tfg-fs-x svg{width:22px;height:22px}' +\n    '.tfg-fs-n{position:absolute;top:50%;z-index:3;width:50px;height:50px;margin-top:-25px;border-radius:50%}.tfg-fs-n svg{width:26px;height:26px}' +\n    '.tfg-fs-n.p{left:14px}.tfg-fs-n.n{right:14px}.tfg-fs-n[disabled]{opacity:0;pointer-events:none}' +\n    '@media(hover:none){.tfg-fs-n{display:none}}' +\n    '.tfg-fs-cap{font-size:14px;color:#fff;text-align:center;max-width:700px}' +\n    '.tfg-fs.bare .tfg-fs-bar,.tfg-fs.bare .tfg-fs-n{opacity:0;pointer-events:none}' +\n    '.tfg-cap{font-size:14px;color:#1C2430;margin:10px 0 0;min-height:20px}' +\n    '.tfg-thumbs{display:flex;gap:8px;overflow-x:auto;padding:12px 0 2px;scrollbar-width:thin}' +\n    '.tfg-th{appearance:none;flex:none;width:76px;height:58px;border-radius:7px;overflow:hidden;border:2px solid transparent;padding:0;background:#E4E8ED;cursor:pointer;opacity:.7;position:relative;margin:0}' +\n    '.tfg-th[aria-current=\"true\"]{border-color:#FF5440;opacity:1}' +\n    '.tfg-th img{width:100%;height:100%;object-fit:cover;display:block;margin:0;max-width:none}' +\n    '.tfg-desc{padding:14px 20px 0;font-size:15px;color:#1C2430;margin:0}' +\n    '.tfg-cta{margin:18px 20px 20px;padding:16px 18px;border-radius:12px;background:#13202F;color:#fff;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}' +\n    '.tfg-cta b{font-size:16px;font-weight:800;display:block}' +\n    '.tfg-cta span{font-size:13px;color:#C4CCD6}' +\n    '.tfg-cta .tfg-btn{min-height:46px}' +\n    '@media(max-width:600px){.tfg-cta .tfg-btn{width:100%}.tfg-stage,.tfg-mtabs{padding-left:16px;padding-right:16px}.tfg-desc{padding-left:16px;padding-right:16px}.tfg-cta{margin-left:16px;margin-right:16px}}' +\n    'html.tfg-lock,html.tfg-lock body{overflow:hidden!important}' +\n    /* showcase layout (data-layout=\"showcase\"): dark section, filter chips with icons, wide before & after cards, trust bar */\n    '.tfg--show{--tfg-ink:#fff;--tfg-muted:#B9C3CF;--tfg-line:rgba(255,255,255,.13);--tfg-card:#16212E;position:relative;isolation:isolate;max-width:1280px;padding:52px 28px 28px;border-radius:20px;background:#0D1721;overflow:hidden}' +\n    '.tfg-bg{position:absolute;inset:0;z-index:-1;background-size:cover;background-position:center;opacity:.22;filter:saturate(.7)}' +\n    '.tfg-bg:after{content:\"\";position:absolute;inset:0;background:linear-gradient(180deg,rgba(13,23,33,.55),#0D1721 72%)}' +\n    '.tfg--show .tfg-head{text-align:left;margin:0 0 26px;max-width:920px}' +\n    '.tfg-eye{display:block;color:var(--tfg-red);font-size:14px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;margin:0 0 8px}' +\n    '.tfg--show .tfg-head h2{font-size:clamp(30px,5vw,50px);line-height:1.08;margin:0 0 12px;color:#fff}' +\n    '.tfg--show .tfg-head p{font-size:17px;color:#D5DCE4}' +\n    '.tfg--show .tfg-tabs{justify-content:flex-start;margin:0 0 22px}' +\n    '.tfg--show .tfg-tab{display:inline-flex;align-items:center;gap:9px;background:rgba(255,255,255,.04);border-color:rgba(255,255,255,.22);color:#fff;border-radius:10px;padding:11px 18px}' +\n    '.tfg--show .tfg-tab svg{width:18px;height:18px;flex:none}' +\n    '.tfg--show .tfg-tab[aria-selected=\"true\"]{background:var(--tfg-red);border-color:var(--tfg-red)}' +\n    '.tfg--show .tfg-tab .tfg-n{font-size:12px;font-weight:700;opacity:.7}' +\n    '.tfg--show .tfg-grid{grid-auto-flow:row dense;gap:14px;grid-template-columns:repeat(2,1fr)}.tfg--show .tfg-wide{grid-column:span 2}' +\n    '@media(min-width:1000px){.tfg--show .tfg-grid{grid-template-columns:repeat(4,1fr)}}' +\n    '.tfg--show .tfg-card{border-radius:12px;background:var(--tfg-card);border-color:rgba(255,255,255,.1);cursor:default}' +\n    '.tfg--show .tfg-card:hover{transform:none;box-shadow:0 14px 34px rgba(0,0,0,.4);border-color:rgba(255,255,255,.22)}' +\n    '.tfg--show .tfg-img{aspect-ratio:auto;height:clamp(210px,19vw,250px);background:#223142}' +\n    'button.tfg-imgb{appearance:none;display:block;width:100%;border:0;padding:0;margin:0;cursor:zoom-in;font:inherit}' +\n    '.tfg--show .tfg-card:hover button.tfg-imgb img{transform:scale(1.04)}' +\n    '.tfg--show .tfg-ba-l{top:12px;bottom:auto;font-size:12px;padding:6px 11px;border-radius:6px}' +\n    '.tfg--show .tfg-fsb{top:auto;bottom:10px}' +\n    '.tfg-sc{appearance:none;display:flex;align-items:center;gap:13px;width:100%;margin:0;padding:13px 16px;background:none;border:0;border-top:1px solid rgba(255,255,255,.08);color:#fff;text-align:left;font:inherit;cursor:pointer;flex:1}' +\n    '.tfg-sc:hover b{color:var(--tfg-red)}.tfg-sc:focus-visible{outline:2px solid var(--tfg-red);outline-offset:-2px}' +\n    '.tfg-sci{flex:none;width:26px;height:26px;color:#fff;display:flex}.tfg-sci svg{width:26px;height:26px}' +\n    '.tfg-sct{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}' +\n    '.tfg-sct b{font-size:15px;font-weight:800;line-height:1.25;transition:color .15s;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +\n    '.tfg-sct small{font-size:13px;color:var(--tfg-muted);line-height:1.2}' +\n    '.tfg-scn{flex:none;font-size:12px;font-weight:700;color:var(--tfg-muted);white-space:nowrap}' +\n    '.tfg--show .tfg-more{margin-top:20px}' +\n    '.tfg--show .tfg-btn--ghost{color:#fff;border-color:rgba(255,255,255,.3)}.tfg--show .tfg-btn--ghost:hover{color:#fff}' +\n    '.tfg-trust{display:flex;align-items:center;gap:18px 34px;flex-wrap:wrap;margin:28px -28px -28px;padding:20px 28px;background:rgba(0,0,0,.28);border-top:1px solid rgba(255,255,255,.08)}' +\n    '.tfg-ti{display:flex;align-items:center;gap:12px;color:#fff}.tfg-ti svg{width:30px;height:30px;flex:none}' +\n    '.tfg-ti b{display:block;font-size:14px;font-weight:800}.tfg-ti small{display:block;font-size:12px;color:var(--tfg-muted)}' +\n    '.tfg-trust .tfg-btn{margin-left:auto;min-height:56px;flex-direction:column;align-items:flex-start;gap:1px;padding:8px 22px}' +\n    '.tfg-trust .tfg-btn small{font-size:12px;font-weight:600;opacity:.9}' +\n    '@media(max-width:599px){.tfg--show .tfg-grid{gap:10px}.tfg--show .tfg-img{height:150px}.tfg--show .tfg-wide .tfg-img{height:230px}.tfg--show .tfg-card:not(.tfg-wide) .tfg-scn{display:none}.tfg--show .tfg-card:not(.tfg-wide) .tfg-sc{padding:10px 11px;gap:9px}.tfg--show .tfg-card:not(.tfg-wide) .tfg-sci,.tfg--show .tfg-card:not(.tfg-wide) .tfg-sci svg{width:20px;height:20px}.tfg--show .tfg-card:not(.tfg-wide) .tfg-sct b{font-size:13px;white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}.tfg--show .tfg-card:not(.tfg-wide) .tfg-sct small{font-size:12px}}' +\n    '@media(max-width:700px){.tfg--show{padding:34px 16px 16px;border-radius:0}.tfg-trust{margin:22px -16px -16px;padding:18px 16px}.tfg-trust .tfg-btn{margin-left:0;width:100%;align-items:center}.tfg--show .tfg-head p{font-size:15px}}';\n\n  var ICON = {\n    x: '<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\"><path d=\"M18 6L6 18M6 6l12 12\"/></svg>',\n    l: '<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M15 18l-6-6 6-6\"/></svg>',\n    r: '<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M9 6l6 6-6 6\"/></svg>',\n    full: '<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5\"/></svg>',\n    lr: '<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M9 6l-6 6 6 6M15 6l6 6-6 6\"/></svg>'\n  };\n\n  var KI = function (d) { return '<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\">' + d + '</svg>'; };\n  var KICON = {\n    replacement: KI('<path d=\"M3 11.5L12 4l9 7.5\"/><path d=\"M5.5 9.5V20h13V9.5\"/><path d=\"M10 20v-5h4v5\"/>'),\n    repair: KI('<path d=\"M14.7 6.3a4 4 0 0 0-5.4 5.4L3.5 17.5a1.8 1.8 0 0 0 2.5 2.5l5.8-5.8a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.3-.6-.6-2.3z\"/>'),\n    flat: KI('<path d=\"M3 9h18v6H3z\"/><path d=\"M6 15v4M18 15v4M7 6h10\"/>'),\n    gutters: KI('<path d=\"M3 6h18\"/><path d=\"M4 6v3a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V6\"/><path d=\"M15 12v8\"/>'),\n    flashing: KI('<path d=\"M8 3h5v7\"/><path d=\"M8 3v9\"/><path d=\"M3 21l9-8 9 8\"/><path d=\"M6 18.5h12\"/>'),\n    skylight: KI('<path d=\"M4 4h16v16H4z\"/><path d=\"M4 12h16M12 4v16\"/>'),\n    carpentry: KI('<path d=\"M14 4l6 6-3 3-6-6z\"/><path d=\"M11 7l-8 8 3 3 8-8\"/>'),\n    painting: KI('<path d=\"M4 4h13v5H4z\"/><path d=\"M17 6.5h3V12h-8v3\"/><path d=\"M11 15h2v6h-2z\"/>'),\n    handyman: KI('<path d=\"M4 20l7-7\"/><path d=\"M13 5l6 6-2 2-6-6z\"/><path d=\"M15 3l6 6\"/>'),\n    ba: KI('<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><path d=\"M12 3.5v17\"/><path d=\"M12 3.5a8.5 8.5 0 0 1 0 17z\" fill=\"currentColor\" stroke=\"none\"/>'),\n    shield: KI('<path d=\"M12 3l7.5 3v5.5c0 4.6-3.2 8.2-7.5 9.5-4.3-1.3-7.5-4.9-7.5-9.5V6z\"/><path d=\"M8.7 12l2.3 2.3 4.5-4.6\"/>'),\n    doc: KI('<path d=\"M7 3h7l4 4v14H7z\"/><path d=\"M14 3v4h4\"/><path d=\"M10 12h5M10 16h5\"/>'),\n    pin: KI('<path d=\"M12 21s-6.5-6.1-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 14.9 12 21 12 21z\"/><circle cx=\"12\" cy=\"9.8\" r=\"2.3\"/>'),\n    star: KI('<path d=\"M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z\"/>'),\n    phone: KI('<path d=\"M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2\"/>')\n  };\n  var KIND_LABEL = { replacement: 'Roof Replacements', repair: 'Roof Repairs', flat: 'Flat Roofs', gutters: 'Gutters', flashing: 'Chimney & Flashing', skylight: 'Skylights' };\n  var KIND_ORDER = ['replacement', 'repair', 'flat', 'flashing', 'gutters', 'skylight'];\n  /* The app sends each job's type; older data falls back to a guess from the title. */\n  function kindOf(j) {\n    if (j.kind && KIND_LABEL[j.kind]) return j.kind;\n    if (j.service && j.service !== 'Roofing') return '';\n    var t = String(j.title || '').toLowerCase();\n    if (/flat|rubber|epdm|tpo|membrane/.test(t)) return 'flat';\n    if (/gutter/.test(t)) return 'gutters';\n    if (/chimney|flashing/.test(t)) return 'flashing';\n    if (/skylight/.test(t)) return 'skylight';\n    if (/repair|leak|patch|boot/.test(t)) return 'repair';\n    if (/replac|new roof|re-?roof|tear/.test(t)) return 'replacement';\n    return '';\n  }\n  function iconOf(j) { var k = kindOf(j); return KICON[k] || KICON[String(j.service || '').toLowerCase()] || KICON.replacement; }\n\n  function esc(s) {\n    return String(s == null ? '' : s).replace(/[&<>\"']/g, function (c) {\n      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', \"'\": '&#39;' }[c];\n    });\n  }\n  function src(id, w) { return 'https://lh3.googleusercontent.com/d/' + encodeURIComponent(id) + '=w' + w; }\n  function alt(id, w) { return 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(id) + '&sz=w' + w; }\n  function imgTag(id, w, altText, cls, eager) {\n    return '<img' + (cls ? ' class=\"' + cls + '\"' : '') + ' src=\"' + src(id, w) + '\" data-alt=\"' + alt(id, w) + '\" alt=\"' + esc(altText) + '\"' +\n      (eager ? '' : ' loading=\"lazy\"') + ' decoding=\"async\" onerror=\"if(this.dataset.alt&&this.src!==this.dataset.alt){this.src=this.dataset.alt}\">';\n  }\n  function month(d) {\n    var m = String(d || '').split('-');\n    return m.length === 2 ? (MONTHS[(+m[1] || 1) - 1] + ' ' + m[0]) : '';\n  }\n  function meta(j) { return [j.town, month(j.date)].filter(Boolean).join(' \\u00b7 '); }\n  function byStage(j, s) { return j.photos.filter(function (p) { return p.stage === s; }); }\n  function pairOf(j) {\n    var b = byStage(j, 'before'), a = byStage(j, 'after');\n    if (!b.length || !a.length) return null;\n    var after = a.filter(function (p) { return p.id === j.cover; })[0] || a[0];\n    return { before: b[0], after: after };\n  }\n\n  function injectCss() {\n    if (document.getElementById('tfg-css')) return;\n    var st = document.createElement('style');\n    st.id = 'tfg-css';\n    st.textContent = CSS;\n    (document.head || document.documentElement).appendChild(st);\n  }\n\n  function loadData() {\n    if (dataPromise) return dataPromise;\n    dataPromise = new Promise(function (resolve, reject) {\n      var cb = '__tfg' + Date.now().toString(36) + Math.floor(Math.random() * 1e6);\n      var s = document.createElement('script');\n      var timer = setTimeout(function () { done(); reject(new Error('timeout')); }, 25000);\n      function done() { clearTimeout(timer); try { delete window[cb]; } catch (e) { window[cb] = undefined; } if (s.parentNode) s.parentNode.removeChild(s); }\n      window[cb] = function (d) { done(); resolve(d); };\n      s.onerror = function () { done(); reject(new Error('load failed')); };\n      s.async = true;\n      s.src = EXEC + '?r=data&callback=' + cb;\n      (document.head || document.documentElement).appendChild(s);\n    });\n    dataPromise.catch(function () { dataPromise = null; });\n    return dataPromise;\n  }\n\n  /* ---------------- section ---------------- */\n  function mount(el) {\n    if (!el || el.getAttribute('data-tfg-ready')) return;\n    el.setAttribute('data-tfg-ready', '1');\n    injectCss();\n    var o = {\n      service: (el.getAttribute('data-service') || 'all').toLowerCase(),\n      featured: el.getAttribute('data-featured') === 'true',\n      limit: parseInt(el.getAttribute('data-limit'), 10) || (el.getAttribute('data-featured') === 'true' ? 6 : 9),\n      tabs: el.getAttribute('data-tabs') !== 'false',\n      title: el.getAttribute('data-title') || '',\n      subtitle: (el.getAttribute('data-subtitle') || '').replace(/Tap a job to see the before and after\\.?/i, 'Slide any photo to see the before and after.'),\n      more: el.getAttribute('data-more-href') || '',\n      ctaText: el.getAttribute('data-cta-text') || 'Get a Free Inspection',\n      ctaHref: el.getAttribute('data-cta-href') || 'tel:+18608549335',\n      theme: el.getAttribute('data-theme') === 'dark' ? 'dark' : 'light',\n      min: Math.max(1, parseInt(el.getAttribute('data-min'), 10) || 1),\n      replace: el.getAttribute('data-replace') || '',\n      layout: el.getAttribute('data-layout') === 'cards' ? 'cards' : 'showcase',\n      eyebrow: el.getAttribute('data-eyebrow') || 'Our Work',\n      trust: el.getAttribute('data-trust'),\n      phone: el.getAttribute('data-phone') || '(860) 854-9335'\n    };\n    if (o.layout === 'showcase') o.theme = 'show';\n    var root = document.createElement('div');\n    root.className = 'tfg tfg--' + o.theme;\n    el.innerHTML = '';\n    el.appendChild(root);\n    root.innerHTML = head(o) + '<div class=\"tfg-grid\">' + [1, 2, 3].map(function () { return '<div class=\"tfg-sk\"></div>'; }).join('') + '</div>';\n    /* Hide the page's old gallery right away (no flash of old photos while the jobs load); it comes back only if the app can't show enough jobs */\n    var old = [];\n    if (o.replace) { try { Array.prototype.forEach.call(document.querySelectorAll(o.replace), function (x) { if (!x.contains(el)) { old.push([x, x.style.display]); x.style.display = 'none'; } }); } catch (e) { /* bad selector */ } }\n    function restoreOld() { old.forEach(function (p) { p[0].style.display = p[1]; }); }\n    var shownSig = '';\n\n    function show(d) {\n      var sig = JSON.stringify(d && d.jobs || []);\n      if (sig === shownSig) return;\n      shownSig = sig;\n      var r2 = document.createElement('div'); r2.className = root.className; el.replaceChild(r2, root); root = r2;\n      var jobs = (d && d.jobs) || [];\n      if (o.service !== 'all') jobs = jobs.filter(function (j) { return String(j.service).toLowerCase() === o.service; });\n      if (o.featured) {\n        var f = jobs.filter(function (j) { return j.featured; });\n        if (f.length) jobs = f;\n      }\n      if (jobs.length < o.min) { el.style.display = 'none'; restoreOld(); return; }\n      el.style.display = '';\n      old.forEach(function (p) { p[0].style.display = 'none'; });\n      var services = [];\n      jobs.forEach(function (j) { if (services.indexOf(j.service) < 0) services.push(j.service); });\n      var order = (d.services || []);\n      services.sort(function (a, b) { return order.indexOf(a) - order.indexOf(b); });\n      var st = { tab: 'All', shown: o.limit };\n      if (o.layout === 'showcase') {\n        var cover = (jobs.filter(function (j) { return j.featured; })[0] || jobs[0] || {}).cover;\n        var filters = [{ key: 'All', label: 'All', icon: '' }];\n        KIND_ORDER.forEach(function (k) {\n          var n = jobs.filter(function (j) { return kindOf(j) === k; }).length;\n          if (n) filters.push({ key: 'k:' + k, label: KIND_LABEL[k], icon: KICON[k], n: n });\n        });\n        services.forEach(function (s) {\n          if (s === 'Roofing') return;\n          var n = jobs.filter(function (j) { return j.service === s; }).length;\n          if (n) filters.push({ key: 's:' + s, label: s, icon: KICON[s.toLowerCase()] || KICON.handyman, n: n });\n        });\n        var nba = jobs.filter(function (j) { return pairOf(j); }).length;\n        if (nba && nba < jobs.length) filters.push({ key: 'ba', label: 'Before & After', icon: KICON.ba, n: nba });\n        var pick = function (key) {\n          if (key === 'All') return jobs;\n          if (key === 'ba') return jobs.filter(function (j) { return pairOf(j); });\n          if (key.indexOf('k:') === 0) return jobs.filter(function (j) { return kindOf(j) === key.slice(2); });\n          return jobs.filter(function (j) { return j.service === key.slice(2); });\n        };\n        var draw = function () {\n          var list = pick(st.tab);\n          var h = (cover ? '<div class=\"tfg-bg\" style=\"background-image:url(&quot;' + src(cover, 1600) + '&quot;)\"></div>' : '') +\n            '<div class=\"tfg-head\"><span class=\"tfg-eye\">' + esc(o.eyebrow) + '</span>' + (o.title ? '<h2>' + esc(o.title) + '</h2>' : '') + (o.subtitle ? '<p>' + esc(o.subtitle) + '</p>' : '') + '</div>';\n          if (o.tabs && filters.length > 2) {\n            h += '<div class=\"tfg-tabs\" role=\"tablist\">' + filters.map(function (f) {\n              return '<button type=\"button\" class=\"tfg-tab\" role=\"tab\" aria-selected=\"' + (st.tab === f.key) + '\" data-tab=\"' + esc(f.key) + '\">' + f.icon + esc(f.label) + '</button>';\n            }).join('') + '</div>';\n          }\n          h += '<div class=\"tfg-grid\">' + list.slice(0, st.shown).map(showCard).join('') + '</div>';\n          if (list.length > st.shown) {\n            h += '<div class=\"tfg-more\"><button type=\"button\" class=\"tfg-btn tfg-btn--ghost\" data-more>See more work (' + (list.length - st.shown) + ')</button></div>';\n          } else if (o.more) {\n            h += '<div class=\"tfg-more\"><a class=\"tfg-btn tfg-btn--ghost\" href=\"' + esc(o.more) + '\">See all our work \\u2192</a></div>';\n          }\n          h += trustBar(o);\n          root.innerHTML = h;\n          baHint(root);\n        };\n      } else var draw = function () {\n        var list = st.tab === 'All' ? jobs : jobs.filter(function (j) { return j.service === st.tab; });\n        var showTabs = o.tabs && o.service === 'all' && !o.featured && services.length > 1;\n        var h = head(o);\n        if (showTabs) {\n          h += '<div class=\"tfg-tabs\" role=\"tablist\">' + ['All'].concat(services).map(function (s) {\n            return '<button type=\"button\" class=\"tfg-tab\" role=\"tab\" aria-selected=\"' + (st.tab === s) + '\" data-tab=\"' + esc(s) + '\">' + esc(s === 'All' ? 'All Work' : s) + '</button>';\n          }).join('') + '</div>';\n        }\n        h += '<div class=\"tfg-grid\">' + list.slice(0, st.shown).map(card).join('') + '</div>';\n        if (list.length > st.shown) {\n          h += '<div class=\"tfg-more\"><button type=\"button\" class=\"tfg-btn tfg-btn--ghost\" data-more>See more work (' + (list.length - st.shown) + ')</button></div>';\n        } else if (o.more) {\n          h += '<div class=\"tfg-more\"><a class=\"tfg-btn\" href=\"' + esc(o.more) + '\">See all our work</a></div>';\n        }\n        root.innerHTML = h;\n        baHint(root);\n      };\n      baWire(root);\n      root.addEventListener('click', function (e) {\n        var fj = e.target.closest ? e.target.closest('[data-fsj]') : null;\n        if (fj) {\n          var ba0 = fj.parentNode.querySelector('.tfg-ba');\n          for (var q = 0; q < jobs.length; q++) if (jobs[q].id === fj.getAttribute('data-fsj')) fullCompare(jobs[q], pairOf(jobs[q]), ba0 && ba0._p != null ? ba0._p : 50);\n          return;\n        }\n        var t = e.target.closest ? e.target.closest('[data-tab],[data-more],[data-job]') : null;\n        if (!t) return;\n        if (t.hasAttribute('data-tab')) { st.tab = t.getAttribute('data-tab'); st.shown = o.limit; draw(); return; }\n        if (t.hasAttribute('data-more')) { st.shown += o.limit; draw(); return; }\n        var id = t.getAttribute('data-job');\n        for (var i = 0; i < jobs.length; i++) if (jobs[i].id === id) { openJob(jobs[i], o); break; }\n      });\n      draw();\n    }\n\n    var cached = readCache();\n    if (cached) show(cached);\n    loadData().then(function (d) { writeCache(d); show(d); }).catch(function () {\n      if (shownSig) return;\n      el.style.display = 'none';\n      restoreOld();\n      el.setAttribute('data-tfg-ready', 'failed');\n    });\n  }\n\n  /* Last good data, so return visits show the jobs instantly while fresh data loads */\n  var CACHE_KEY = 'tfg_data_v1';\n  function readCache() {\n    try { var c = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); if (c && c.d && Date.now() - c.t < 7 * 864e5) return c.d; } catch (e) { /* no storage */ }\n    return null;\n  }\n  function writeCache(d) { try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), d: d })); } catch (e) { /* full or blocked */ } }\n\n  function head(o) {\n    if (!o.title && !o.subtitle) return '';\n    return '<div class=\"tfg-head\">' + (o.title ? '<h2>' + esc(o.title) + '</h2>' : '') + (o.subtitle ? '<p>' + esc(o.subtitle) + '</p>' : '') + '</div>';\n  }\n\n  function showCard(j) {\n    var pair = pairOf(j), n = j.photos.length;\n    var cap = '<button type=\"button\" class=\"tfg-sc\" data-job=\"' + esc(j.id) + '\" aria-label=\"' + esc(j.title + (j.town ? ', ' + j.town : '') + '. View ' + n + ' photos') + '\">' +\n      '<span class=\"tfg-sci\">' + iconOf(j) + '</span><span class=\"tfg-sct\"><b>' + esc(j.title) + '</b>' + (j.town ? '<small>' + esc(j.town) + '</small>' : '') + '</span>' +\n      '<span class=\"tfg-scn\">' + n + ' photo' + (n === 1 ? '' : 's') + ' \\u2192</span></button>';\n    if (pair) {\n      return '<div class=\"tfg-card tfg-hasba tfg-wide\">' +\n        '<div class=\"tfg-img\"><div class=\"tfg-ba\" role=\"slider\" tabindex=\"0\" aria-label=\"' + esc('Before and after: ' + j.title + '. Drag or use arrow keys to compare.') + '\" aria-valuemin=\"0\" aria-valuemax=\"100\" aria-valuenow=\"50\" aria-valuetext=\"50% before\">' +\n          imgTag(pair.after.id, 1200, 'After: ' + j.title, 'tfg-ba-a') + imgTag(pair.before.id, 1200, 'Before: ' + j.title, 'tfg-ba-b') +\n          '<span class=\"tfg-ba-l b\">Before</span><span class=\"tfg-ba-l a\">After</span>' +\n          '<span class=\"tfg-ba-h\"></span><span class=\"tfg-ba-k\">' + ICON.lr + '</span></div>' +\n          '<button type=\"button\" class=\"tfg-fsb\" data-fsj=\"' + esc(j.id) + '\" aria-label=\"' + esc('Full screen: ' + j.title) + '\">' + ICON.full + '</button></div>' +\n        cap + '</div>';\n    }\n    return '<div class=\"tfg-card\"><button type=\"button\" class=\"tfg-img tfg-imgb\" data-job=\"' + esc(j.id) + '\" tabindex=\"-1\" aria-hidden=\"true\">' + imgTag(j.cover, 900, j.title) + '</button>' + cap + '</div>';\n  }\n  function trustBar(o) {\n    if (o.trust === 'none') return '';\n    var items = (o.trust || 'Free Inspections|No cost, no obligation;Written Estimates|With photos of what we find;Serving Connecticut|Local and responsive').split(';')\n      .map(function (x) { return x.split('|'); }).filter(function (x) { return x[0]; }).slice(0, 3);\n    var icons = [KICON.shield, KICON.doc, KICON.pin];\n    var tel = 'tel:+1' + String(o.phone).replace(/\\D/g, '').slice(-10);\n    return '<div class=\"tfg-trust\">' + items.map(function (x, i) {\n      return '<div class=\"tfg-ti\">' + icons[i] + '<div><b>' + esc(x[0]) + '</b>' + (x[1] ? '<small>' + esc(x[1]) + '</small>' : '') + '</div></div>';\n    }).join('') +\n      '<a class=\"tfg-btn\" href=\"' + esc(o.ctaHref || tel) + '\">' + esc(o.ctaText) + ' \\u2192<small>Call ' + esc(o.phone) + '</small></a></div>';\n  }\n  function card(j) {\n    var pair = pairOf(j);\n    if (pair) return baCard(j, pair);\n    var visual = pair\n      ? '<div class=\"tfg-split\"><div>' + imgTag(pair.before.id, 600, 'Before: ' + j.title) + '<span>Before</span></div><div>' + imgTag(pair.after.id, 600, 'After: ' + j.title) + '<span>After</span></div></div>'\n      : imgTag(j.cover, 900, j.title);\n    var n = j.photos.length;\n    return '<button type=\"button\" class=\"tfg-card\" data-job=\"' + esc(j.id) + '\" aria-label=\"' + esc(j.title + (j.town ? ' in ' + j.town : '') + ', view ' + n + ' photos') + '\">' +\n      '<div class=\"tfg-img\">' + visual + '<span class=\"tfg-badge\">' + esc(j.service) + '</span></div>' +\n      '<div class=\"tfg-body\"><h3>' + esc(j.title) + '</h3>' + (meta(j) ? '<p class=\"tfg-meta\">' + esc(meta(j)) + '</p>' : '') +\n      '<span class=\"tfg-view\">' + (pair ? 'See before &amp; after' : 'View ' + n + ' photo' + (n === 1 ? '' : 's')) + ' \\u2192</span></div></button>';\n  }\n\n  /* Before & after right on the card: drag (or use the arrow keys) to compare. \"View all photos\" opens the viewer. */\n  function baCard(j, pair) {\n    var n = j.photos.length;\n    var arrows = '<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M9 6l-6 6 6 6M15 6l6 6-6 6\"/></svg>';\n    return '<div class=\"tfg-card tfg-hasba\">' +\n      '<div class=\"tfg-img\"><div class=\"tfg-ba\" role=\"slider\" tabindex=\"0\" aria-label=\"' + esc('Before and after: ' + j.title + '. Drag or use arrow keys to compare.') + '\" aria-valuemin=\"0\" aria-valuemax=\"100\" aria-valuenow=\"50\" aria-valuetext=\"50% before\">' +\n        imgTag(pair.after.id, 900, 'After: ' + j.title, 'tfg-ba-a') + imgTag(pair.before.id, 900, 'Before: ' + j.title, 'tfg-ba-b') +\n        '<span class=\"tfg-ba-l b\">Before</span><span class=\"tfg-ba-l a\">After</span>' +\n        '<span class=\"tfg-ba-h\"></span><span class=\"tfg-ba-k\">' + arrows + '</span></div>' +\n        '<span class=\"tfg-badge\">' + esc(j.service) + '</span>' +\n        '<button type=\"button\" class=\"tfg-fsb\" data-fsj=\"' + esc(j.id) + '\" aria-label=\"' + esc('Full screen: ' + j.title) + '\">' + ICON.full + '</button></div>' +\n      '<div class=\"tfg-body\"><h3>' + esc(j.title) + '</h3>' + (meta(j) ? '<p class=\"tfg-meta\">' + esc(meta(j)) + '</p>' : '') +\n      '<button type=\"button\" class=\"tfg-view\" data-job=\"' + esc(j.id) + '\">View all ' + n + ' photo' + (n === 1 ? '' : 's') + ' \u2192</button></div></div>';\n  }\n  function baSet(ba, p) {\n    p = Math.max(0, Math.min(100, p));\n    ba.style.setProperty('--p', p + '%');\n    ba.setAttribute('aria-valuenow', String(Math.round(p)));\n    ba.setAttribute('aria-valuetext', Math.round(p) + '% before');\n    ba.classList.toggle('lo', p < 12); ba.classList.toggle('hi', p > 88);\n    ba._p = p;\n  }\n  function baWire(root) {\n    var drag = null;\n    function posOf(ba, x) { var r = ba.getBoundingClientRect(); return (x - r.left) / r.width * 100; }\n    root.addEventListener('pointerdown', function (e) {\n      var ba = e.target.closest ? e.target.closest('.tfg-ba') : null;\n      if (!ba || e.button > 0) return;\n      ba._stop = true;\n      drag = { ba: ba, x: e.clientX, y: e.clientY, id: e.pointerId, live: e.pointerType === 'mouse' };\n      if (drag.live) { try { ba.setPointerCapture(e.pointerId); } catch (er) { /* ok */ } baSet(ba, posOf(ba, e.clientX)); e.preventDefault(); }\n    });\n    root.addEventListener('pointermove', function (e) {\n      if (!drag || e.pointerId !== drag.id) return;\n      if (!drag.live) {\n        /* touch: only take over once the finger moves sideways; up/down stays a page scroll */\n        var dx = Math.abs(e.clientX - drag.x), dy = Math.abs(e.clientY - drag.y);\n        if (dx < 6 && dy < 6) return;\n        if (dy > dx) { drag = null; return; }\n        drag.live = true; try { drag.ba.setPointerCapture(e.pointerId); } catch (er) { /* ok */ }\n      }\n      baSet(drag.ba, posOf(drag.ba, e.clientX));\n    });\n    function end(e) { if (drag && (!e || e.pointerId === drag.id)) { if (!drag.live && e && e.type === 'pointerup') baSet(drag.ba, posOf(drag.ba, e.clientX)); drag = null; } }\n    root.addEventListener('pointerup', end);\n    root.addEventListener('pointercancel', function () { drag = null; });\n    root.addEventListener('keydown', function (e) {\n      var ba = e.target.closest ? e.target.closest('.tfg-ba') : null; if (!ba) return;\n      var p = ba._p == null ? 50 : ba._p, k = e.key;\n      if (k === 'ArrowLeft' || k === 'ArrowDown') p -= 5; else if (k === 'ArrowRight' || k === 'ArrowUp') p += 5;\n      else if (k === 'Home') p = 0; else if (k === 'End') p = 100; else return;\n      e.preventDefault(); ba._stop = true; baSet(ba, p);\n    });\n    root.addEventListener('dragstart', function (e) { if (e.target.closest && e.target.closest('.tfg-ba')) e.preventDefault(); });\n  }\n  /* A small one-time nudge when a slider first scrolls into view, so visitors see it moves. */\n  function baHint(root) {\n    var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;\n    var list = root.querySelectorAll('.tfg-ba');\n    Array.prototype.forEach.call(list, function (ba) { baSet(ba, 50); });\n    if (calm || !('IntersectionObserver' in window)) return;\n    var io = new IntersectionObserver(function (es) {\n      es.forEach(function (en) {\n        if (!en.isIntersecting) return; io.unobserve(en.target);\n        var ba = en.target, t0 = null;\n        setTimeout(function () {\n          function step(t) {\n            if (ba._stop) return; if (t0 === null) t0 = t;\n            var k = (t - t0) / 1400; if (k >= 1) { baSet(ba, 50); return; }\n            baSet(ba, 50 - 18 * Math.sin(k * Math.PI * 2)); requestAnimationFrame(step);\n          }\n          requestAnimationFrame(step);\n        }, 350);\n      });\n    }, { threshold: 0.6 });\n    Array.prototype.forEach.call(list, function (ba) { io.observe(ba); });\n  }\n\n  /* ---------------- full screen ---------------- */\n  function fsShell(j) {\n    var f = document.createElement('div');\n    f.className = 'tfg-fs'; f.setAttribute('role', 'dialog'); f.setAttribute('aria-modal', 'true'); f.setAttribute('aria-label', j.title + ' photos');\n    document.body.appendChild(f);\n    var pushed = false;\n    try { history.pushState({ tfgfs: 1 }, ''); pushed = true; } catch (e) { /* ignore */ }\n    f._close = function (fromPop) {\n      if (!f.parentNode) return;\n      f.parentNode.removeChild(f); document.removeEventListener('keydown', f._key); window.removeEventListener('popstate', f._pop);\n      if (!fromPop && pushed) { try { if (history.state && history.state.tfgfs) history.back(); } catch (e) { /* ignore */ } }\n      if (f._done) f._done();\n    };\n    f._pop = function () { f._close(true); };\n    window.addEventListener('popstate', f._pop);\n    return f;\n  }\n  function fullPhotos(j, photos, start, onDone) {\n    var f = fsShell(j), i = start;\n    f.innerHTML = '<div class=\"tfg-fs-st\"><div class=\"tfg-fs-tr\">' + photos.map(function (p) {\n      return '<div class=\"tfg-fs-sl\"><img alt=\"' + esc(STAGE_LABEL[p.stage] + ' photo') + '\" draggable=\"false\" data-src=\"' + src(p.id, 2400) + '\" data-alt=\"' + alt(p.id, 2400) + '\"></div>';\n    }).join('') + '</div></div>' +\n      '<div class=\"tfg-fs-bar t\"><div class=\"tfg-fs-t\"></div><button type=\"button\" class=\"tfg-fs-x\" data-fx aria-label=\"Close full screen\">' + ICON.x + '</button></div>' +\n      '<button type=\"button\" class=\"tfg-fs-n p\" data-fd=\"-1\" aria-label=\"Previous photo\">' + ICON.l + '</button><button type=\"button\" class=\"tfg-fs-n n\" data-fd=\"1\" aria-label=\"Next photo\">' + ICON.r + '</button>' +\n      '<div class=\"tfg-fs-bar b\"><div class=\"tfg-fs-cap\"></div></div>';\n    var stg = f.querySelector('.tfg-fs-st'), tr = f.querySelector('.tfg-fs-tr'), imgs = f.querySelectorAll('.tfg-fs-sl img');\n    var z = { s: 1, x: 0, y: 0 };\n    function load(k) { var im = imgs[k]; if (im && !im.getAttribute('src')) { im.onerror = function () { if (im.dataset.alt && im.src !== im.dataset.alt) im.src = im.dataset.alt; }; im.src = im.getAttribute('data-src'); } }\n    function applyZ() { imgs[i].style.transform = 'translate(' + z.x + 'px,' + z.y + 'px) scale(' + z.s + ')'; }\n    function resetZ() { z = { s: 1, x: 0, y: 0 }; Array.prototype.forEach.call(imgs, function (im) { im.style.transform = ''; }); }\n    function show(k, anim) {\n      i = Math.max(0, Math.min(photos.length - 1, k)); resetZ();\n      tr.style.transition = anim === false ? 'none' : 'transform .25s ease'; tr.style.transform = 'translateX(' + (-i * 100) + '%)';\n      load(i); load(i + 1); load(i - 1);\n      var p = photos[i];\n      f.querySelector('.tfg-fs-t').innerHTML = esc(j.title) + '<small>' + (i + 1) + ' of ' + photos.length + ' \\u00b7 ' + STAGE_LABEL[p.stage] + '</small>';\n      f.querySelector('.tfg-fs-cap').textContent = p.caption || '';\n      f.querySelector('[data-fd=\"-1\"]').disabled = i === 0; f.querySelector('[data-fd=\"1\"]').disabled = i === photos.length - 1;\n    }\n    f._done = function () { if (onDone) onDone(i); };\n    f._key = function (e) { if (e.key === 'Escape') f._close(); else if (e.key === 'ArrowRight') show(i + 1); else if (e.key === 'ArrowLeft') show(i - 1); };\n    document.addEventListener('keydown', f._key);\n    f.addEventListener('click', function (e) {\n      var b = e.target.closest ? e.target.closest('[data-fx],[data-fd]') : null; if (!b) return;\n      if (b.hasAttribute('data-fx')) f._close(); else show(i + Number(b.getAttribute('data-fd')));\n    });\n    /* swipe to change photo, pinch or double-tap to zoom, drag to look around, tap to hide the bars */\n    var pts = {}, g = null, lastTap = 0, tapT = null;\n    function two() { var k = Object.keys(pts); return k.length >= 2 ? [pts[k[0]], pts[k[1]]] : null; }\n    stg.addEventListener('pointerdown', function (e) {\n      pts[e.pointerId] = { x: e.clientX, y: e.clientY }; try { stg.setPointerCapture(e.pointerId); } catch (er) { /* ignore */ }\n      var t = two();\n      if (t) {\n        var r = imgs[i].getBoundingClientRect(), bl = r.left - z.x, bt = r.top - z.y, cx = (t[0].x + t[1].x) / 2, cy = (t[0].y + t[1].y) / 2;\n        g = { pinch: true, d0: Math.hypot(t[0].x - t[1].x, t[0].y - t[1].y) || 1, s0: z.s, bl: bl, bt: bt, lx: (cx - bl - z.x) / z.s, ly: (cy - bt - z.y) / z.s };\n        tr.style.transform = 'translateX(' + (-i * 100) + '%)'; return;\n      }\n      g = { x: e.clientX, y: e.clientY, t: Date.now(), zx: z.x, zy: z.y, moved: false }; tr.style.transition = 'none';\n    });\n    stg.addEventListener('pointermove', function (e) {\n      if (!pts[e.pointerId] || !g) return; pts[e.pointerId] = { x: e.clientX, y: e.clientY };\n      if (g.pinch) {\n        var t = two(); if (!t) return;\n        var s = Math.max(1, Math.min(5, g.s0 * Math.hypot(t[0].x - t[1].x, t[0].y - t[1].y) / g.d0)), cx = (t[0].x + t[1].x) / 2, cy = (t[0].y + t[1].y) / 2;\n        z.x = cx - g.bl - s * g.lx; z.y = cy - g.bt - s * g.ly; z.s = s; applyZ(); return;\n      }\n      var dx = e.clientX - g.x, dy = e.clientY - g.y; if (Math.abs(dx) + Math.abs(dy) > 8) g.moved = true;\n      if (z.s > 1) { z.x = g.zx + dx; z.y = g.zy + dy; applyZ(); }\n      else tr.style.transform = 'translateX(calc(' + (-i * 100) + '% + ' + dx + 'px))';\n    });\n    function tap(e) {\n      var now = Date.now();\n      if (now - lastTap < 300) {\n        lastTap = 0; clearTimeout(tapT);\n        if (z.s > 1) resetZ(); else { var r = imgs[i].getBoundingClientRect(), s = 2.5, ox = e.clientX - r.left, oy = e.clientY - r.top; z = { s: s, x: ox * (1 - s), y: oy * (1 - s) }; applyZ(); }\n        return;\n      }\n      lastTap = now; tapT = setTimeout(function () { f.classList.toggle('bare'); }, 310);\n    }\n    stg.addEventListener('pointerup', function (e) {\n      var wasPinch = g && g.pinch; delete pts[e.pointerId];\n      if (!g) return;\n      if (wasPinch) { if (!Object.keys(pts).length) { if (z.s < 1.05) resetZ(); g = null; } else { var k = Object.keys(pts)[0]; g = { x: pts[k].x, y: pts[k].y, t: Date.now(), zx: z.x, zy: z.y, moved: true }; } return; }\n      var dx = e.clientX - g.x, moved = g.moved, dt = Date.now() - g.t; g = null;\n      if (z.s > 1) { if (!moved) tap(e); return; }\n      if (moved && (Math.abs(dx) > Math.min(80, stg.clientWidth * 0.18) || (dt < 250 && Math.abs(dx) > 30))) show(i + (dx < 0 ? 1 : -1)); else show(i);\n      if (!moved) tap(e);\n    });\n    stg.addEventListener('pointercancel', function (e) { delete pts[e.pointerId]; g = null; show(i); });\n    stg.addEventListener('wheel', function (e) { if (!e.ctrlKey) return; e.preventDefault(); z.s = Math.max(1, Math.min(5, z.s * (e.deltaY < 0 ? 1.1 : 0.9))); if (z.s === 1) resetZ(); else applyZ(); }, { passive: false });\n    show(i, false);\n  }\n  function fullCompare(j, pair, pos) {\n    var f = fsShell(j);\n    f.innerHTML = '<div class=\"tfg-fs-st\"><div class=\"tfg-fs-cmp tfg-ba\" style=\"touch-action:none\" role=\"slider\" tabindex=\"0\" aria-label=\"Drag to compare before and after\" aria-valuemin=\"0\" aria-valuemax=\"100\" aria-valuenow=\"50\">' +\n      '<img class=\"tfg-ba-a\" alt=\"After\" src=\"' + src(pair.after.id, 2400) + '\"><img class=\"tfg-ba-b\" alt=\"Before\" src=\"' + src(pair.before.id, 2400) + '\">' +\n      '<span class=\"tfg-ba-l b\" style=\"top:auto;bottom:calc(20px + env(safe-area-inset-bottom))\">Before</span><span class=\"tfg-ba-l a\" style=\"top:auto;bottom:calc(20px + env(safe-area-inset-bottom))\">After</span>' +\n      '<span class=\"tfg-ba-h\"></span><span class=\"tfg-ba-k\">' + ICON.lr + '</span></div></div>' +\n      '<div class=\"tfg-fs-bar t\"><div class=\"tfg-fs-t\">' + esc(j.title) + '<small>Before &amp; after \\u00b7 drag to compare</small></div><button type=\"button\" class=\"tfg-fs-x\" data-fx aria-label=\"Close full screen\">' + ICON.x + '</button></div>';\n    var ba = f.querySelector('.tfg-ba'); baSet(ba, pos == null ? 50 : pos);\n    var dragging = false;\n    function at(x) { var r = ba.getBoundingClientRect(); baSet(ba, (x - r.left) / r.width * 100); }\n    ba.addEventListener('pointerdown', function (e) { dragging = true; try { ba.setPointerCapture(e.pointerId); } catch (er) { /* ignore */ } at(e.clientX); });\n    ba.addEventListener('pointermove', function (e) { if (dragging) at(e.clientX); });\n    ba.addEventListener('pointerup', function () { dragging = false; });\n    ba.addEventListener('pointercancel', function () { dragging = false; });\n    f._key = function (e) {\n      if (e.key === 'Escape') f._close();\n      else if (e.key === 'ArrowLeft') baSet(ba, (ba._p || 50) - 5); else if (e.key === 'ArrowRight') baSet(ba, (ba._p || 50) + 5);\n    };\n    document.addEventListener('keydown', f._key);\n    f.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('[data-fx]')) f._close(); });\n    ba.focus();\n  }\n\n  /* ---------------- job viewer ---------------- */\n  function openJob(j, o) {\n    var pair = pairOf(j);\n    var photos = j.photos.slice();\n    var st = { mode: pair ? 'compare' : 'all', i: 0, pos: 50 };\n    var lastFocus = document.activeElement, swiped = false;\n\n    var m = document.createElement('div');\n    m.className = 'tfg-modal';\n    m.setAttribute('role', 'dialog');\n    m.setAttribute('aria-modal', 'true');\n    m.setAttribute('aria-label', j.title);\n    document.body.appendChild(m);\n    document.documentElement.classList.add('tfg-lock');\n\n    function close() {\n      document.removeEventListener('keydown', onKey);\n      document.documentElement.classList.remove('tfg-lock');\n      if (m.parentNode) m.parentNode.removeChild(m);\n      if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) { /* ignore */ } }\n    }\n    function onKey(e) {\n      if (document.querySelector('.tfg-fs')) return;\n      if (e.key === 'Escape') close();\n      else if (st.mode === 'all' && e.key === 'ArrowLeft') go(st.i - 1);\n      else if (st.mode === 'all' && e.key === 'ArrowRight') go(st.i + 1);\n    }\n    document.addEventListener('keydown', onKey);\n\n    function go(i) {\n      if (i < 0 || i >= photos.length) return;\n      st.i = i; draw();\n      var cur = m.querySelector('.tfg-th[aria-current=\"true\"]');\n      if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'nearest', inline: 'center' });\n    }\n\n    function stageHtml() {\n      if (st.mode === 'compare') {\n        return '<div class=\"tfg-cmp\" data-cmp>' + imgTag(pair.before.id, 1600, 'Before', '', true) + imgTag(pair.after.id, 1600, 'After', 'tfg-after', true) +\n          '<div class=\"tfg-line\"></div><div class=\"tfg-knob\" role=\"slider\" tabindex=\"0\" aria-label=\"Drag to compare before and after\" aria-valuemin=\"0\" aria-valuemax=\"100\" aria-valuenow=\"50\">' + ICON.lr + '</div>' +\n          '<span class=\"tfg-lbl l\">BEFORE</span><span class=\"tfg-lbl r\">AFTER</span>' +\n          '<button type=\"button\" class=\"tfg-fsb\" data-fs=\"cmp\" aria-label=\"Full screen\">' + ICON.full + '</button></div>' +\n          '<p class=\"tfg-hint\">Drag the slider to compare</p>';\n      }\n      var p = photos[st.i];\n      return '<div class=\"tfg-view2\" data-view>' + imgTag(p.id, 1600, STAGE_LABEL[p.stage] + ' photo ' + (st.i + 1) + ' of ' + photos.length, '', true) +\n        '<span class=\"tfg-tag ' + p.stage + '\">' + STAGE_LABEL[p.stage] + '</span>' +\n        '<button type=\"button\" class=\"tfg-nav p\" data-go=\"-1\" aria-label=\"Previous photo\"' + (st.i === 0 ? ' disabled' : '') + '>' + ICON.l + '</button>' +\n        '<button type=\"button\" class=\"tfg-nav n\" data-go=\"1\" aria-label=\"Next photo\"' + (st.i === photos.length - 1 ? ' disabled' : '') + '>' + ICON.r + '</button>' +\n        '<span class=\"tfg-count\">' + (st.i + 1) + ' / ' + photos.length + '</span>' +\n        '<button type=\"button\" class=\"tfg-fsb\" data-fs=\"photo\" aria-label=\"Full screen\">' + ICON.full + '</button></div>' +\n        '<p class=\"tfg-cap\">' + esc(p.caption || '') + '</p>' +\n        '<div class=\"tfg-thumbs\">' + photos.map(function (q, k) {\n          return '<button type=\"button\" class=\"tfg-th\" data-i=\"' + k + '\" aria-label=\"' + STAGE_LABEL[q.stage] + ' photo ' + (k + 1) + '\" aria-current=\"' + (k === st.i) + '\">' + imgTag(q.id, 200, '') + '</button>';\n        }).join('') + '</div>';\n    }\n\n    function draw() {\n      var tabs = '';\n      if (pair) {\n        tabs = '<div class=\"tfg-mtabs\" role=\"tablist\">' +\n          '<button type=\"button\" class=\"tfg-mtab\" role=\"tab\" data-mode=\"compare\" aria-selected=\"' + (st.mode === 'compare') + '\">Before &amp; After</button>' +\n          '<button type=\"button\" class=\"tfg-mtab\" role=\"tab\" data-mode=\"all\" aria-selected=\"' + (st.mode === 'all') + '\">All photos (' + photos.length + ')</button></div>';\n      }\n      var ctaHref = o.ctaHref;\n      m.innerHTML = '<div class=\"tfg-dlg\">' +\n        '<div class=\"tfg-top\"><div><h3>' + esc(j.title) + '</h3><p>' + esc([j.service, meta(j)].filter(Boolean).join(' \\u00b7 ')) + '</p></div>' +\n        '<button type=\"button\" class=\"tfg-x\" data-close aria-label=\"Close\">' + ICON.x + '</button></div>' +\n        tabs + '<div class=\"tfg-stage\">' + stageHtml() + '</div>' +\n        (j.description ? '<p class=\"tfg-desc\">' + esc(j.description) + '</p>' : '') +\n        '<div class=\"tfg-cta\"><div><b>Want results like this?</b><span>Free inspection and a written estimate.</span></div>' +\n        '<a class=\"tfg-btn\" href=\"' + esc(ctaHref) + '\" data-cta>' + esc(o.ctaText) + '</a></div>' +\n        '</div>';\n      if (st.mode === 'compare') wireCompare();\n      if (st.mode === 'all') wireSwipe();\n    }\n\n    function setPos(cmp, pct) {\n      st.pos = Math.max(0, Math.min(100, pct));\n      cmp.querySelector('.tfg-after').style.clipPath = 'inset(0 0 0 ' + st.pos + '%)';\n      cmp.querySelector('.tfg-line').style.left = st.pos + '%';\n      var k = cmp.querySelector('.tfg-knob');\n      k.style.left = st.pos + '%';\n      k.setAttribute('aria-valuenow', Math.round(st.pos));\n    }\n\n    function wireCompare() {\n      var cmp = m.querySelector('[data-cmp]');\n      if (!cmp) return;\n      setPos(cmp, st.pos);\n      var dragging = false;\n      function at(x) { var r = cmp.getBoundingClientRect(); setPos(cmp, (x - r.left) / r.width * 100); }\n      cmp.addEventListener('pointerdown', function (e) { dragging = true; try { cmp.setPointerCapture(e.pointerId); } catch (er) { /* ignore */ } at(e.clientX); });\n      cmp.addEventListener('pointermove', function (e) { if (dragging) { at(e.clientX); e.preventDefault(); } });\n      cmp.addEventListener('pointerup', function () { dragging = false; });\n      cmp.addEventListener('pointercancel', function () { dragging = false; });\n      cmp.querySelector('.tfg-knob').addEventListener('keydown', function (e) {\n        if (e.key === 'ArrowLeft') { setPos(cmp, st.pos - 5); e.preventDefault(); e.stopPropagation(); }\n        if (e.key === 'ArrowRight') { setPos(cmp, st.pos + 5); e.preventDefault(); e.stopPropagation(); }\n      });\n    }\n\n    function wireSwipe() {\n      var v = m.querySelector('[data-view]');\n      if (!v) return;\n      var sx = null, sy = null;\n      v.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; swiped = false; }, { passive: true });\n      v.addEventListener('touchend', function (e) {\n        if (sx == null) return;\n        var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;\n        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { swiped = true; setTimeout(function () { swiped = false; }, 400); go(st.i + (dx < 0 ? 1 : -1)); }\n        sx = null;\n      }, { passive: true });\n    }\n\n    m.addEventListener('click', function (e) {\n      if (e.target === m) { close(); return; }\n      var fsb = e.target.closest ? e.target.closest('[data-fs]') : null;\n      if (fsb) { if (fsb.getAttribute('data-fs') === 'cmp') fullCompare(j, pair, st.pos); else fullPhotos(j, photos, st.i, function (k) { go(k); }); return; }\n      var t = e.target.closest ? e.target.closest('[data-close],[data-mode],[data-go],[data-i],[data-cta]') : null;\n      if (!t && e.target.closest && e.target.closest('[data-view]') && !swiped) { fullPhotos(j, photos, st.i, function (k) { go(k); }); return; }\n      if (!t) return;\n      if (t.hasAttribute('data-close')) { close(); return; }\n      if (t.hasAttribute('data-cta')) {\n        var href = t.getAttribute('href') || '';\n        if (href.charAt(0) === '#') { close(); }\n        return;\n      }\n      if (t.hasAttribute('data-mode')) { st.mode = t.getAttribute('data-mode'); draw(); return; }\n      if (t.hasAttribute('data-go')) { go(st.i + Number(t.getAttribute('data-go'))); return; }\n      if (t.hasAttribute('data-i')) { go(Number(t.getAttribute('data-i'))); }\n    });\n\n    draw();\n    var x = m.querySelector('[data-close]');\n    if (x) x.focus();\n  }\n\n  /* ---------------- boot ---------------- */\n  function scan() {\n    var els = document.querySelectorAll('.tf-gallery, #tf-gallery, [data-tf-gallery]');\n    for (var i = 0; i < els.length; i++) mount(els[i]);\n  }\n\n  window.TFGallery = { version: 1, scan: scan, mount: mount };\n  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan); else scan();\n  window.addEventListener('load', scan);\n  if (window.MutationObserver) {\n    var obs = new MutationObserver(function () { scan(); });\n    obs.observe(document.documentElement, { childList: true, subtree: true });\n    setTimeout(function () { obs.disconnect(); }, 15000);\n  }\n})();\n";
