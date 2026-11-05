/* Taskiner — background reminder engine (imported into the Workbox service worker).
 *
 * The page sends the full reminder schedule; it is persisted in IndexedDB so it
 * survives the service worker being stopped by the browser. Every time the SW
 * wakes up (page heartbeat, periodic background sync, fetch, notification
 * interaction, activation) due reminders are delivered exactly once.
 */
'use strict';

var DB_NAME = 'taskiner-sw';
var STORE = 'kv';
var GRACE_MS = 6 * 60 * 60 * 1000;          // deliver late reminders up to 6h after due
var DELIVERED_TTL = 10 * 24 * 60 * 60 * 1000;
var MAX_TIMER_MS = 2147483000;
var SNOOZE_DEFAULT_MIN = 10;

var _timer = null;
var _lastCheck = 0;

/* ── tiny IndexedDB key/value helper ───────────────────────────────────── */

function openDb() {
  return new Promise(function (resolve, reject) {
    var req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = function () { req.result.createObjectStore(STORE); };
    req.onsuccess = function () { resolve(req.result); };
    req.onerror = function () { reject(req.error); };
  });
}

function idbGet(key) {
  return openDb().then(function (db) {
    return new Promise(function (resolve) {
      var tx = db.transaction(STORE, 'readonly');
      var r = tx.objectStore(STORE).get(key);
      r.onsuccess = function () { resolve(r.result); };
      r.onerror = function () { resolve(undefined); };
    });
  }).catch(function () { return undefined; });
}

function idbSet(key, value) {
  return openDb().then(function (db) {
    return new Promise(function (resolve) {
      var tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(value, key);
      tx.oncomplete = function () { resolve(); };
      tx.onerror = function () { resolve(); };
    });
  }).catch(function () {});
}

/* ── helpers ───────────────────────────────────────────────────────────── */

function minutesOfDay(hhmm) {
  var p = String(hhmm || '00:00').split(':');
  return (+p[0] || 0) * 60 + (+p[1] || 0);
}

function inQuietHours(prefs, ts) {
  if (!prefs || !prefs.quietHours || !prefs.quietHours.enabled) return false;
  var d = new Date(ts);
  var m = d.getHours() * 60 + d.getMinutes();
  var s = minutesOfDay(prefs.quietHours.start);
  var e = minutesOfDay(prefs.quietHours.end);
  return s <= e ? (m >= s && m < e) : (m >= s || m < e);
}

function windowClients() {
  return self.clients.matchAll({ type: 'window', includeUncontrolled: true });
}

function broadcast(msg) {
  return windowClients().then(function (list) {
    list.forEach(function (c) { c.postMessage(msg); });
    return list;
  });
}

function loadState() {
  return Promise.all([
    idbGet('schedule'), idbGet('prefs'), idbGet('delivered'), idbGet('snoozes'),
  ]).then(function (r) {
    return {
      schedule: r[0] || [],
      prefs: r[1] || {},
      delivered: r[2] || {},
      snoozes: r[3] || [],
    };
  });
}

/* ── delivery ──────────────────────────────────────────────────────────── */

function deliver(item, prefs) {
  var quiet = inQuietHours(prefs, Date.now());
  var wantSound = prefs.soundEnabled !== false && !quiet;

  return windowClients().then(function (list) {
    var visible = list.filter(function (c) { return c.visibilityState === 'visible'; });
    var focused = visible.filter(function (c) { return c.focused; });

    // A visible page plays the chosen custom tone; otherwise the system sound is used
    if (wantSound && list.length) {
      list.forEach(function (c) { c.postMessage({ type: 'PLAY_SOUND', sound: item.sound || prefs.soundId, kind: item.kind }); });
    }
    list.forEach(function (c) { c.postMessage({ type: 'NOTIFICATION_DELIVERED', item: item, inApp: focused.length > 0 }); });

    // Page is in front of the user → it shows an in-app toast instead of a system banner
    if (focused.length && prefs.inAppWhenFocused !== false) return;

    var actions = [];
    if (item.taskId && item.kind !== 'focus') {
      actions = [
        { action: 'complete', title: '✔ Ukończ' },
        { action: 'snooze', title: '⏰ Za ' + (prefs.snoozeMinutes || SNOOZE_DEFAULT_MIN) + ' min' },
      ];
    }

    return self.registration.showNotification(item.title, {
      body: item.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-32x32.png',
      tag: item.tag || item.key,
      renotify: true,
      silent: !wantSound || visible.length > 0,
      vibrate: quiet || prefs.vibrate === false ? [] : (item.vibrate || [180, 90, 180]),
      requireInteraction: !!item.requireInteraction,
      timestamp: item.fireAt,
      actions: actions,
      data: { url: item.url || '/tasks', taskId: item.taskId || null, key: item.key, kind: item.kind },
    });
  });
}

function checkDue() {
  _lastCheck = Date.now();
  return loadState().then(function (st) {
    var now = Date.now();
    var all = st.schedule.concat(st.snoozes);
    var due = [];
    var nextAt = Infinity;
    var changed = false;

    all.forEach(function (item) {
      if (st.delivered[item.key]) return;
      if (item.fireAt <= now) {
        var grace = item.grace || GRACE_MS;
        if (now - item.fireAt <= grace) due.push(item);
        st.delivered[item.key] = now; // too old → silently mark as handled
        changed = true;
      } else if (item.fireAt < nextAt) {
        nextAt = item.fireAt;
      }
    });

    // Prune bookkeeping
    Object.keys(st.delivered).forEach(function (k) {
      if (now - st.delivered[k] > DELIVERED_TTL) { delete st.delivered[k]; changed = true; }
    });
    var liveSnoozes = st.snoozes.filter(function (s) { return !st.delivered[s.key]; });

    // Collapse a burst (e.g. device was asleep) into individual notifications, max 5
    due.sort(function (a, b) { return a.fireAt - b.fireAt; });
    var batch = due.slice(-5);

    var p = Promise.resolve();
    batch.forEach(function (item) { p = p.then(function () { return deliver(item, st.prefs); }); });

    return p.then(function () {
      var writes = [];
      if (changed) writes.push(idbSet('delivered', st.delivered));
      if (liveSnoozes.length !== st.snoozes.length) writes.push(idbSet('snoozes', liveSnoozes));
      return Promise.all(writes);
    }).then(function () { arm(nextAt); });
  });
}

function arm(nextAt) {
  if (_timer) { clearTimeout(_timer); _timer = null; }
  if (!isFinite(nextAt)) return;
  var delay = Math.max(0, Math.min(nextAt - Date.now(), MAX_TIMER_MS));
  // A live SW keeps this timer; if the browser stops the SW, the next wake-up catches up.
  _timer = setTimeout(function () { checkDue(); }, delay + 50);
}

function snooze(data, minutes) {
  var mins = minutes || SNOOZE_DEFAULT_MIN;
  return idbGet('snoozes').then(function (list) {
    list = (list || []).filter(function (s) { return s.taskId !== data.taskId; });
    return idbGet('schedule').then(function (schedule) {
      var src = (schedule || []).filter(function (s) { return s.key === data.key; })[0] || {};
      var at = Date.now() + mins * 60000;
      list.push({
        key: 'snooze-' + data.taskId + '-' + at,
        fireAt: at,
        kind: 'snooze',
        taskId: data.taskId,
        title: '⏰ Przypomnienie (odłożone)',
        body: src.taskText || src.body || 'Zadanie czeka na Ciebie',
        taskText: src.taskText,
        url: data.url,
        requireInteraction: true,
      });
      return idbSet('snoozes', list);
    });
  }).then(checkDue);
}

function queueAction(action) {
  return idbGet('pendingActions').then(function (list) {
    list = list || [];
    list.push(action);
    return idbSet('pendingActions', list);
  });
}

/* ── events ────────────────────────────────────────────────────────────── */

self.addEventListener('message', function (event) {
  var data = event.data || {};

  if (data.type === 'SYNC_SCHEDULE') {
    var activeIds = data.activeTaskIds || null;
    // Deliver anything that became due under the OLD schedule first (the SW may
    // have been asleep) — the page only sends future reminders.
    event.waitUntil(
      checkDue().then(function () { return Promise.all([
        idbSet('schedule', data.items || []),
        idbSet('prefs', data.prefs || {}),
        idbGet('snoozes').then(function (list) {
          if (!activeIds) return;
          var keep = (list || []).filter(function (s) { return activeIds.indexOf(s.taskId) !== -1; });
          return idbSet('snoozes', keep);
        }),
      ]); }).then(checkDue)
    );
  }

  if (data.type === 'FIRE_NOW' && data.item) {
    // Foreground engine asks to deliver right now (dedup with the schedule)
    event.waitUntil(idbGet('delivered').then(function (d) {
      d = d || {};
      if (d[data.item.key]) return;
      d[data.item.key] = Date.now();
      return idbSet('delivered', d).then(function () {
        return idbGet('prefs').then(function (prefs) { return deliver(data.item, prefs || {}); });
      });
    }));
  }

  if (data.type === 'TICK') {
    event.waitUntil(checkDue());
  }

  if (data.type === 'SNOOZE' && data.taskId) {
    event.waitUntil(snooze({ taskId: data.taskId, key: data.key, url: data.url }, data.minutes));
  }

  if (data.type === 'GET_PENDING_ACTIONS') {
    var port = event.ports && event.ports[0];
    event.waitUntil(idbGet('pendingActions').then(function (list) {
      return idbSet('pendingActions', []).then(function () {
        if (port) port.postMessage(list || []);
        else if (event.source) event.source.postMessage({ type: 'PENDING_ACTIONS', actions: list || [] });
      });
    }));
  }

  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('notificationclick', function (event) {
  var n = event.notification;
  var data = n.data || {};
  n.close();

  if (event.action === 'snooze' && data.taskId) {
    event.waitUntil(idbGet('prefs').then(function (prefs) {
      return snooze(data, (prefs && prefs.snoozeMinutes) || SNOOZE_DEFAULT_MIN);
    }));
    return;
  }

  if (event.action === 'complete' && data.taskId) {
    var action = { type: 'complete', taskId: data.taskId, at: Date.now() };
    event.waitUntil(windowClients().then(function (list) {
      if (list.length) {
        list[0].postMessage({ type: 'TASK_ACTION', action: action });
        return;
      }
      return queueAction(action);
    }));
    return;
  }

  var url = data.url || '/tasks';
  event.waitUntil(windowClients().then(function (list) {
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if ('focus' in c) {
        c.postMessage({ type: 'NAVIGATE', url: url });
        return c.focus();
      }
    }
    if (self.clients.openWindow) return self.clients.openWindow(url);
  }));
});

// Wake-ups → catch up on anything that became due while the SW was stopped
self.addEventListener('periodicsync', function (event) {
  if (event.tag === 'taskiner-reminders') event.waitUntil(checkDue());
});

self.addEventListener('sync', function (event) {
  if (event.tag === 'taskiner-reminders') event.waitUntil(checkDue());
});

self.addEventListener('activate', function (event) {
  event.waitUntil(checkDue());
});

self.addEventListener('fetch', function (event) {
  // Never responds — Workbox handles caching. We only piggy-back on the wake-up.
  if (Date.now() - _lastCheck > 60000) {
    event.waitUntil(checkDue());
  }
});

self.addEventListener('push', function (event) {
  // Ready for a future push backend: a push simply triggers a schedule check.
  event.waitUntil(checkDue());
});
