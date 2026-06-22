# 廁所咧 (toilet-pwa-app)

> 整合全台廁所、尿布台、醫療院所、親子景點與交通站點的家庭生活地圖。定位即用、免安裝，帶孩子出門找最近站點與導航。

本 repo 為原始專案 [rockerwei/toilet-pwa-app](https://github.com/rockerwei/toilet-pwa-app) 的 fork，部署於 GitHub Pages。

**線上網址:** https://nightzhe.github.io/getsomething/

---

## 系統架構

### 整體架構圖

```
┌─────────────────────────────────────────────────────┐
│                    瀏覽器 / 手機                       │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │           React SPA (Vite 打包)              │   │
│  │                                             │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  │   │
│  │  │  廁所地圖  │  │  醫療地圖  │  │  親子地圖  │  │   │
│  │  └──────────┘  └──────────┘  └──────────┘  │   │
│  │         ↓             ↓             ↓       │   │
│  │        Leaflet.js 地圖渲染引擎                │   │
│  │         ↓                                   │   │
│  │   Geolocation API (定位)                    │   │
│  └─────────────────────────────────────────────┘   │
│                        ↓                           │
│  ┌─────────────────────────────────────────────┐   │
│  │         Service Worker (sw.js)               │   │
│  │    Network-First → Cache → Offline Fallback  │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
         ↓                          ↓
┌─────────────────┐      ┌──────────────────────┐
│   本地 JSON 資料  │      │  OpenStreetMap 瓦片   │
│  data/**/*.json │      │  (地圖底圖，即時載入)  │
│  (~68 MB)       │      └──────────────────────┘
└─────────────────┘
```

### 技術棧

| 層級 | 技術 |
|------|------|
| 前端框架 | React（SPA，從 bundle 推斷） |
| 打包工具 | Vite（hashed bundle：`index-C8LJGa6d.js`） |
| 地圖引擎 | Leaflet.js（含 marker clustering） |
| 樣式 | CSS bundle（`index-SorpUbP0.css`，含 Leaflet CSS） |
| PWA | Service Worker + Web App Manifest |
| 資料格式 | 靜態 JSON（預先抓取，無後端） |
| 部署 | GitHub Pages |

---

## 目錄結構

```
getsomething/
├── index.html                  # 主頁面入口
├── manifest.json               # PWA 設定（圖示、主題色、安裝設定）
├── sw.js                       # Service Worker（快取策略、離線支援）
├── offline.html                # 無網路時的 fallback 頁面
├── og-image.png                # 社群分享預覽圖
├── robots.txt                  # SEO 爬蟲設定
├── install.mobileconfig        # iOS Safari 安裝描述檔（MIME 設定於 _headers）
├── _headers                    # Cloudflare/Netlify HTTP headers 設定
│
├── assets/
│   ├── index-C8LJGa6d.js      # 主應用 JS bundle（852 KB，minified）
│   └── index-SorpUbP0.css     # 主應用 CSS bundle（16 KB）
│
├── icons/
│   ├── icon-192.png            # Android 主畫面圖示
│   ├── icon-512.png            # PWA splash screen / 大圖示
│   └── muxi-loading-ip.png    # 載入動畫吉祥物（阿便）
│
├── data/                       # 所有地點資料（JSON，共 ~80,000 筆）
│   ├── toilets/                # 廁所、尿布台（45,928 筆）
│   ├── medical/                # 藥局、診所、醫院（7,127 筆）
│   ├── family/                 # 親子景點、公園、商場（7,581 筆）
│   └── transport/              # 公車站、捷運站、火車站（19,526 筆）
│       └── .github/workflows/
│           └── trigger-deploy.yml  # 資料更新自動觸發前端重新部署
│
└── overrides/                  # 人工修正 OSM 資料的覆蓋層
    ├── manifest.json           # 已修正清單
    ├── category-overrides.json # 設施類型標籤覆蓋（20.9 KB）
    ├── address-overrides.json  # 地址修正
    ├── deletions.json          # 標記刪除的設施 ID（699 KB）
    ├── toilets/                # 新增/修正的廁所資料
    └── transport/              # 新增/修正的交通站資料
```

---

## 資料結構

### 地理覆蓋範圍

全台 22 縣市，每個縣市按行政區劃分成獨立 JSON 檔案，App 按需載入（不一次性下載全部）。

| 類別 | 總筆數 | 最後更新 |
|------|--------|---------|
| 廁所 / 尿布台 | 45,928 | 2026-06-12 |
| 交通站點 | 19,526 | 2026-06-11 |
| 親子友善設施 | 7,581 | 2026-06-15 |
| 醫療設施 | 7,127 | 2026-06-12 |
| **合計** | **~80,162** | — |

### JSON Schema

每個地區的 JSON 檔案格式如下（以廁所為例）：

```json
{
  "city": "台北市",
  "district": "中正區",
  "category": "toilets",
  "updatedAt": "2026-06-10T15:41:05.166Z",
  "rev": 1,
  "count": 505,
  "bbox": [24.96, 121.46, 25.19, 121.66],
  "items": [
    {
      "id": 469812997,             // OpenStreetMap node/way ID
      "name": "星巴克 重慶門市",
      "lat": 25.0424,
      "lng": 121.5130319,
      "address": "台北市中正區重慶南路一段104號",
      "facilityType": "starbucks", // 設施子類型（見下方列表）
      "facilityLabel": "☕ 星巴克", // UI 顯示標籤
      "hasBabyChanging": false,    // 尿布台
      "hasAccessible": true,       // 無障礙廁所
      "changingTable": false,
      "wheelchair": true,
      "openingHours": "Mo-Su 07:00-22:00", // OSM 開放時間格式
      "source": "OpenStreetMap",
      "updatedAt": "2026-06-10T15:41:05.166Z",
      "needsAddr": false           // 是否缺少完整地址（資料品質標記）
    }
  ]
}
```

### facilityType 完整列表

**廁所 (toilets)**
| facilityType | 說明 |
|---|---|
| `toilets` | 公廁 |
| `starbucks` | 星巴克 |
| `convenience` | 超商（7-11、全家） |
| `supermarket` | 超市 |
| `department` | 百貨公司 |
| `mall` | 商場 |
| `bank` | 銀行 |
| `atm` | ATM |

**醫療 (medical)**
| facilityType | 說明 |
|---|---|
| `pharmacy` | 藥局 |
| `clinic` | 診所 |
| `hospital` | 醫院 |
| `dentist` | 牙科 |

**親子 (family)**
| facilityType | 說明 |
|---|---|
| `park` | 公園 |
| `water` | 戲水親水 |
| `mall` | 商場親子區 |
| `kids` | 親子館 |
| `science` | 科學館 |
| `farm` | 農場 |
| `theme_park` | 遊樂場 |

**交通 (transport)**
| facilityType / type | 說明 |
|---|---|
| `bus` | 公車站 |
| `subway` | 捷運站 |
| `train` | 火車站 |
| `ferry` | 渡輪碼頭 |

---

## 外部 API 與整合

### 目前已接入

| API / 服務 | 用途 | 使用方式 |
|---|---|---|
| **OpenStreetMap** | 地圖底圖瓦片 | Leaflet.js 即時載入 OSM tile server |
| **OpenStreetMap (OSM)** | 所有地點的原始資料來源 | 預先抓取，存成靜態 JSON |
| **GTFS（公共交通通用格式）** | 公車/捷運/火車路線資料 | 預先整合進 transport/*.json |
| **Browser Geolocation API** | 取得使用者當前位置 | `navigator.geolocation.getCurrentPosition()` |
| **Apple Maps** | 導航跳轉 | `maps.apple.com/?daddr=...` 連結 |
| **Google Maps** | 導航跳轉（備用） | `maps.google.com/?daddr=...` 連結 |

### 資料更新流程（無後端架構）

```
OpenStreetMap API
      ↓ (定期抓取，非即時)
資料處理腳本（另一個 repo: rockerwei/toilet-pwa-app-source-）
      ↓
生成 JSON 檔案 → 推送至資料 repo 的 data/ 目錄
      ↓
trigger-deploy.yml 自動觸發
      ↓
前端 repo 重新打包 → 部署至 GitHub Pages
```

> **重要**: 此 App 不做即時 API 查詢，所有地點資料均為**靜態預處理 JSON**，因此完全免後端、可離線使用。

---

## Service Worker 快取策略

```javascript
// sw.js
const CACHE_NAME = "toilet-pwa-v16";
const PRECACHE = ["offline.html", "icons/icon-512.png"];
```

**三層降級策略：**

```
使用者請求
    ↓
① 嘗試 Network Fetch
    ↓ 失敗 / 離線
② 查找本地 Cache
    ↓ 無 cache
③ 返回安全 Fallback
   - 頁面導航 → offline.html
   - 其他資源 → HTTP 504
```

**版本更新流程：**
1. 新版 SW 安裝後進入 `waiting` 狀態（不立即接管）
2. App 偵測到 waiting SW → 顯示「有新版本」Toast
3. 使用者點擊更新 → App 發送 `SKIP_WAITING` 訊息
4. SW 接管，清除舊版 cache

---

## 可擴充點

### 1. 新增資料類別

在 `data/` 下新增目錄，並遵循現有 JSON schema：

```
data/
└── hotels/              # 新類別：親子友善飯店
    ├── manifest.json    # 類別元資料
    └── 台北市/
        └── 中正區.json  # 地區資料
```

新的 `facilityType` 需同步更新 `overrides/category-overrides.json`。

### 2. 擴充設施屬性

現有 JSON schema 可直接新增欄位（向後相容），例如：

```json
{
  "id": 123,
  "name": "某廁所",
  "parkingAvailable": true,     // 新增：停車場
  "nursingRoom": true,          // 新增：哺乳室
  "operatorPhone": "02-12345678" // 新增：管理員電話
}
```

### 3. 接入即時 Overpass API

目前資料為靜態快照，若要取得即時 OSM 資料，可擴充如下：

```javascript
// 即時查詢最近 500m 內的廁所
const query = `
  [out:json][timeout:10];
  (
    node["amenity"="toilets"](around:500, ${lat}, ${lng});
    way["amenity"="toilets"](around:500, ${lat}, ${lng});
  );
  out body;
`;
const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
const res = await fetch(url);
```

**注意**: Overpass API 有 rate limit，建議搭配 cache 機制。

### 4. 接入政府開放資料

台灣政府資料開放平台提供可直接整合的資料集：

| 資料集 | API 端點 | 用途 |
|---|---|---|
| 公共廁所 | `data.gov.tw` | 補充 OSM 未收錄的政府廁所 |
| 醫事機構 | 衛福部健保署 API | 診所/醫院詳細資訊 |
| 公車路線 | 交通部 TDX API | 即時公車到站時間 |
| 親子館 | 各縣市社會局 | 補充親子場所資訊 |

### 5. 擴充 PWA 功能

**manifest.json** 可新增 Shortcuts（長按圖示快捷方式）：

```json
{
  "shortcuts": [
    {
      "name": "找廁所",
      "url": "/?category=toilets",
      "icons": [{"src": "./icons/toilet-shortcut.png", "sizes": "96x96"}]
    },
    {
      "name": "找醫療",
      "url": "/?category=medical",
      "icons": [{"src": "./icons/medical-shortcut.png", "sizes": "96x96"}]
    }
  ]
}
```

### 6. overrides 人工修正機制

針對 OSM 資料錯誤或缺漏，可透過 overrides 目錄修正，**不需動到原始資料**：

```json
// overrides/category-overrides.json
{
  "family:123456789": {
    "facilityType": "farm",
    "facilityLabel": "🌾 農場"
  }
}
```

```json
// overrides/deletions.json
[987654321, 111222333]  // 標記已關閉/不存在的設施 ID
```

---

## PWA 安裝說明

### Android / Chrome
1. 開啟網站後點選瀏覽器右上角選單
2. 選擇「新增至主畫面」
3. 即可像 App 一樣使用

### iOS / Safari
**方法一（建議）：** 下載 `install.mobileconfig` 描述檔安裝  
**方法二：** Safari → 分享 → 加入主畫面

---

## 資料授權

地圖底圖與設施位置資料來源：[OpenStreetMap](https://www.openstreetmap.org/)，授權為 [ODbL](https://opendatacommons.org/licenses/odbl/)。

公共交通路線資料來源：各縣市交通局 GTFS 開放資料。

---

## 相關連結

- 原始專案：https://github.com/rockerwei/toilet-pwa-app
- 原始線上版：https://rockerwei.github.io/toilet-pwa-app/
- 本 fork 線上版：https://nightzhe.github.io/getsomething/
