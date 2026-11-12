// Офлайн-оболочка приложения. Данные всегда берутся с сервера.
// Быстрый старт: страницу ждём из сети не дольше 1,5 с, иначе открываем сохранённую; картинки и файлы — сразу из кэша с фоновым обновлением.
const CACHE = 'ramossitto-v1794479043';
const SHELL = ['./', './index.html', './config.js', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request, u = new URL(req.url);
  if (req.method !== 'GET' || u.origin !== location.origin) return; // запросы к Google не трогаем
  const cached = () => caches.match(req, {ignoreSearch: true}).then(r => r || caches.match('./index.html'));
  const net = fetch(req).then(r => { if (r && r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req.mode === 'navigate' ? './index.html' : req, copy)); } return r; });
  e.waitUntil(net.catch(() => {}));
  if (req.mode === 'navigate') {
    e.respondWith(new Promise(res => {
      let done = false;
      const finish = r => { if (!done && r) { done = true; res(r); } };
      const t = setTimeout(() => cached().then(finish), 1500);
      net.then(r => { clearTimeout(t); finish(r); }).catch(() => { clearTimeout(t); cached().then(r => finish(r || Response.error())); });
    }));
    return;
  }
  e.respondWith(caches.match(req, {ignoreSearch: true}).then(r => r || net.catch(cached)));
});
