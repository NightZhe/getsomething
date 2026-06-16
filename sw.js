// build: 2026-06-15T12:04:13.225Z
const CACHE_NAME = "toilet-pwa-v16";

// 離線 fallback 必備資產（相對 SW 位置解析，本機 `/` 與 Pages `/toilet-pwa-app/` 皆正確）。
// 只 precache「離線 fallback 畫面 + 阿便圖」，不快取 hashed app bundle / Overpass 即時資料。
const PRECACHE = ["offline.html", "icons/icon-512.png"];

self.addEventListener("install", (e) => {
  // 不在 install 直接 skipWaiting，讓新版本先進入 waiting 狀態，由 App 送 SKIP_WAITING 才接管
  // （版本更新 Toast 依賴此 waiting 狀態，見 version-check.md）。
  // 逐一 add 並各自 catch：單一資產缺失不致 install 失敗（離線 fallback 永遠盡力 precache）。
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(PRECACHE.map((url) => cache.add(url).catch(() => undefined)))
    )
  );
});

self.addEventListener("activate", (e) =>
  e.waitUntil(
    (async () => {
      // 清掉舊版 cache，只留當前版本
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  )
);

self.addEventListener("message", (e) => {
  if (e.data === "SKIP_WAITING") self.skipWaiting();
});

// 最終純文字 HTML 後備（precache 萬一也缺時，仍不讓 respondWith reject、不出 Safari 錯誤頁）。
function offlineHtmlResponse() {
  return new Response(
    "<!doctype html><meta charset=utf-8><title>離線</title><body style=\"font-family:sans-serif;text-align:center;padding:40px;color:#e91e8c\"><h1>目前沒有網路連線</h1><p style=color:#7a5269>請重新連線後再試一次</p><button onclick=location.reload() style=\"font-size:15px;padding:10px 18px;border:none;border-radius:999px;color:#fff;background:#f687b3\">重新整理</button></body>",
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

// fetch 策略：network-first，**離線時一律回傳 Response、永不讓 respondWith reject**
// （根因：舊版 `respondWith(fetch())` 在離線時 reject → Safari「FetchEvent.respondWith received an
//  error: TypeError: Load failed」+ 白畫面）。
self.addEventListener("fetch", (e) => {
  const req = e.request;

  // iOS 安裝描述檔：強制正確 MIME（離線也不可 reject）。
  if (req.url.endsWith(".mobileconfig")) {
    e.respondWith(
      fetch(req)
        .then((res) =>
          new Response(res.body, {
            status: res.status,
            statusText: res.statusText,
            headers: { "Content-Type": "application/x-apple-aspen-config" },
          })
        )
        .catch(() => caches.match(req).then((r) => r || new Response("", { status: 504, statusText: "offline" })))
    );
    return;
  }

  // 導航請求（開啟頁面 / 重新整理）：離線時回 offline.html，不白畫面、不出 Safari 錯誤頁。
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).catch(() =>
        caches.match("offline.html").then((r) => r || offlineHtmlResponse())
      )
    );
    return;
  }

  // 其他資產（含離線頁要用的阿便圖）：network-first，失敗回 cache，再失敗回安全 504（不 throw）。
  e.respondWith(
    fetch(req).catch(() =>
      caches.match(req).then((r) => r || new Response("", { status: 504, statusText: "offline" }))
    )
  );
});
