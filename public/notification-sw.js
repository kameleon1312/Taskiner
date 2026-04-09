'use strict';

const _scheduled = new Map();

function _scheduleAll(notifications) {
  _scheduled.forEach(function(id) { clearTimeout(id); });
  _scheduled.clear();

  var now = Date.now();

  for (var i = 0; i < notifications.length; i++) {
    var n = notifications[i];
    var delay = n.fireAt - now;

    if (delay < 0 || delay > 7 * 24 * 60 * 60 * 1000) continue;

    (function(notif, d) {
      var id = setTimeout(function() {
        self.registration.showNotification(notif.title, {
          body:              notif.body,
          icon:              notif.icon  || '/icons/icon-192x192.png',
          badge:             notif.badge || '/icons/icon-32x32.png',
          vibrate:           [200, 100, 200],
          tag:               notif.tag,
          requireInteraction: notif.requireInteraction || false,
          data:              { url: '/' },
        });
        _scheduled.delete(notif.tag);
      }, d);

      _scheduled.set(notif.tag, id);
    })(n, delay);
  }
}

self.addEventListener('message', function(event) {
  var data = event.data || {};

  if (data.type === 'SCHEDULE_NOTIFICATIONS') {
    _scheduleAll(data.notifications || []);
  }

  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  var urlToOpen = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clients) {
        for (var i = 0; i < clients.length; i++) {
          var c = clients[i];
          if ('focus' in c) return c.focus();
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});
