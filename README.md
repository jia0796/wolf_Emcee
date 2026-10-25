# 狼序 WolfCue｜狼人殺主持工具

真人法官 PWA，提供固定主持字幕、角色與技能標記、日夜結算、警長／放逐／PK 投票、發言計時、上一步與完整復盤；另有線上發牌（Beta 版）。

[開啟網站](https://jia0796.github.io/wolf_Emcee/) · [現行設計](DESIGN.md) · [詳細規則](docs/current-rules.md) · [本次更新報告](docs/recap-vote-refresh-report.md)

## 目前版本與維護原則

- 工作分支：`feat/eclipse-host-app`；不自動合併 main。
- 傳統主持：**29 款板子、10／12 人、33 個角色**；線上發牌支援其中 **27 款**。
- 存檔：**v22**，保留舊局相容與完整回退歷史，不補造舊存檔沒有的紀錄。
- 快取：**council-v22-24**；沿用核心優先、素材每批兩張的漸進快取。
- 規則以最新使用者裁定及 [詳細規格](docs/current-rules.md) 為準；外觀以 [DESIGN.md](DESIGN.md) 為準。歷史報告中的舊配色、版號及測試數不作現行施工要求。

## 最新更新

### 2026-10-25｜新圖鑑插畫與閱讀介面（已完成、已部署）

- 33 個現有角色換用新系列圖鑑插畫；手機三欄、單一深藍玻璃底層，減少重複框線。保留原背景、角色順序、技能原文、點開大圖、正反翻卡、長文捲動與返回操作。
- 列表使用輕量 WebP 縮圖，點開再載入大圖；原始 PNG、歷史素材與線上發牌卡保留。復盤事件與最終身分卡改用新人物，舊局不改寫，原玻璃版型／技能圖示不變。角色與板子數量不變。
- 魔術師框調整為霜藍銀色並同步替換 Drive 原檔；另將九張新圖收入 Drive，素材總數為 39 張，未實作角色僅保存美術素材。
- 混血兒圖鑑背面的分類標籤改為「好人陣營」；技能內的民位計數、跟隨榜樣勝負及原技能文字維持不變。
- 所有投票完成統計後，主持區只保留「已選」提示，修改票型按鈕與平票並列；完整票型仍保存並依原條件顯示於復盤。
- 最終身分卡插畫貼齊邊緣並淡入玻璃底，拿掉圖卡內縮感。本輪已部署：npm test **990**、復盤／投票本機及正式站各 **47 組**、正式站混血兒 **3 組**通過；8 個正式檔案與提交一致。[復盤／投票更新報告與截圖](docs/recap-vote-refresh-report.md)。
- 圖鑑前輪測試：npm test **990**、圖鑑本機／正式站各 **107 組**、全站 UI **39 組（29 板）**、線上卡 **39 組**全部通過；66 張正式圖片與 6 個發布檔案雜湊一致。發布、截圖及安全回退：[圖鑑更新報告](docs/catalog-v2-release-report.md)。真機仍待驗收。


### 2026-10-24｜巡獵規則提示與復盤精簡（已完成、已部署）

- 覺醒獵人復盤卡移除槍圖示上方「從 X 號開始巡獵、命中 X 號」小字；保留人物、座號、槍 SVG、目標及原始巡獵紀錄。「不巡獵」仍如實顯示。
- 僅「覺醒狼美人 / 覺醒獵人」設定頁，在夜間順序下方新增「覺醒獵人巡獵規則」收合區；依最新裁定使用 **App 共用冰藍液態玻璃**、編號與子層級，長句對齊文字開頭。
- 規則用詞採「未魅惑／魅惑」，分列「放逐／狼刀」情境；只呈現提示，不改遊戲結算。
- README 改為現況、使用方式與規格索引；完整定案移至 [詳細規格](docs/current-rules.md)，整理前原文留在 [歷史快照](docs/archive/README-before-recap-cleanup-20261024.md)。
- 最新 App 材質修正：完整測試 **987 項**、UI 本機／正式站各 **9 組**通過，五個發布檔案雜湊一致。前輪指定三板 **13 組**結果另保留於報告。[最新部署成功](https://github.com/jia0796/wolf_Emcee/actions/runs/40089574274) · [報告、截圖及安全回退](docs/recap-rules-readme-report.md)。真機仍待驗收。

### 2026-10-24｜覺醒狼美人／覺醒獵人（已完成、已部署）

- 新增獨立 12 人特殊板：3 普通狼＋覺醒狼美人，預言家／女巫／守衛／覺醒獵人，4 平民。
- 魅惑冷卻、一次替死、方向巡獵、死亡來源判定、遺言繼承、固定夜序與終局優先已接入；不改普通狼美人及普通獵人的原技能。
- 兩張核准覺醒紫框插畫已接入圖鑑、線上角色卡及復盤。巡獵方向按鈕為「從X號」，選定後預覽最終命中，下一步才提交。
- 當輪驗收：App 986、後端整合 43、全站 UI 39 組；部署後新功能 UI 20、12 玩家連線 14、離線 3 組通過。[完整規則](docs/current-rules.md#awb) · [當輪報告](docs/awb-implementation-report.md)。

## 目前功能

| 區域 | 已完成行為 |
| --- | --- |
| 主持流程 | 保留原主持字幕、角色身分確認、兩欄座位與既有 SVG 標記；死亡技能併入對應遺言／無遺言頁。 |
| 投票 | 一般放逐雙模式；全部逐人投票選中後往後找未投票者，尾端再回最前面；取消停留、全部完成不自動提交。原警長／PK 規則保留。 |
| 發言計時器 | 大小視窗、直接拖曳、縮小後重置並直接開始；剩餘 10 秒（含）數字顯示紅色。 |
| 復盤 | 正式事件、票型、原始身分與最終陣營；人物使用新圖鑑插畫並融入玻璃卡。帶刀狀態不顯示復盤卡。 |
| 線上發牌 Beta | QR／邀請連結、選座、一次性發牌、個人翻牌與圖鑑；主持人自動帶入已確認分配。 |
| 線上終局 | 活動房間刪除，原入座玩家進相同復盤、只留回首頁；主持頁保留原按鈕。授權復盤保留 24 小時。手動解散不補造復盤。 |
| 視覺／素材 | 冰藍液態玻璃、米白主按鈕文字、原海邊村莊背景；圖鑑採新系列 33 張插畫與三欄閱讀介面，復盤同步新人物，線上發牌卡保留既有圖源。 |
| 保存與離線 | localStorage 保存對局，sessionStorage 保存分頁畫面；支援刷新、上一步及傳統主持離線。線上發牌需要網路。 |

## 支援板子

資料以 [public/data.js](public/data.js) 為準；顯示名稱不作穩定 ID。

| 人數 | 一般 | 特殊 | 合計 |
| --- | ---: | ---: | ---: |
| 10 人 | 9 | 3 | 12 |
| 12 人 | 11 | 6 | 17 |
| 全部 | 20 | 9 | **29** |

- 10 人特殊：覺醒石像鬼／守墓人、種狼／隱狼、尋香魅影／覺醒預言家。
- 12 人特殊：上述三款，以及狼兄狼弟／黑市商人、假面／舞者、覺醒狼美人／覺醒獵人。
- 一般板「石像鬼／守墓人」與特殊板「覺醒石像鬼／守墓人」完全獨立；前者 10／12 人目前僅支援傳統主持，因此線上目錄共 27 款。
- 黑狼王、機械狼、夢魘、血月、惡靈騎士、普通狼美人及預女獵白等原配置保留。

## 使用與測試

使用 Node.js 22 以上；前端為原生 HTML／CSS／JavaScript，無獨立 build 或 TypeScript 檢查。

```sh
git switch feat/eclipse-host-app
npm start
npm test
```

本機網址：`http://localhost:5173/`。

| 檢查 | 入口 |
| --- | --- |
| 完整規則／存檔／壓力測試 | `npm test` |
| 全站主持 UI 回歸 | `node scripts/ui-regression.mjs` |
| 覺醒角色 UI | `node scripts/awb-ui.mjs` |
| 本次巡獵規則／復盤 UI | `node scripts/patrol-rules-ui.mjs` |
| 後端本機測試 | [backend/README.md](backend/README.md)；必須使用本機虛構資料。 |

瀏覽器測試需已安裝 Playwright 與瀏覽器；可用 `COUNCIL_PLAYWRIGHT_MODULE` 指定模組。每輪已執行的指令、結果與環境以該輪報告為準，不把腳本存在視為測試通過。

## 架構與規格索引

| 功能／來源 | 位置 |
| --- | --- |
| 角色、板子、房規、圖片來源 | [data.js](public/data.js) |
| 階段、合法操作、存檔與回退 | [engine.js](public/engine.js) |
| 傷害批次、防護及勝負 | [night.js](public/night.js) |
| 覺醒狼美人／覺醒獵人 | [awakening.js](public/awakening.js) · [AWB 詳細規格](docs/current-rules.md#awb) |
| 死亡技能、機通獵人手勢、狼弟房規 | [DSK／MEC／BRO](docs/current-rules.md#death-skills) |
| 四種特殊角色接刀 | [takeover.js](public/takeover.js) · [接刀規格](docs/current-rules.md#takeover) |
| 石像鬼／守墓人 | [SK-01～17](docs/current-rules.md#stone-gargoyle) |
| 計時器／主持操作 | [timer.js](public/timer.js) · [HOST-02／03](docs/current-rules.md#host-controls) |
| 投票及復盤資格 | [votes.js](public/votes.js) · [VOTE 定案與歷史](docs/vote62-spec-history.md) |
| 當時快照、日夜復盤 | [records.js](public/records.js) · [recap.js](public/recap.js) |
| 線上發牌與玩家復盤投影 | [online.js](public/online.js) · [online-state.js](public/online-state.js) · [backend](backend/README.md) |
| 介面與核准視覺 | [app.js](public/app.js) · [DESIGN.md](DESIGN.md) · [liquid-glass.css](public/liquid-glass.css) |
| 開場與漸進離線快取 | [開場定案](docs/current-rules.md#opening) · [sw.js](public/sw.js) |
| 早期遊戲完整規格 | [第 1～47 章](docs/specification.md) · [第 48～57 章](docs/specification-current.md) |

新修訂優先於舊章節；角色圖鑑指定原文、技能 SVG、原始插畫、遊戲資料與回退歷史不因文件整理而變動。

## 驗收、歷史與安全回退

- 最新已執行結果與截圖：[本次報告](docs/recap-rules-readme-report.md)；[AWB 報告](docs/awb-implementation-report.md)。
- 線上身分／玩家復盤：[報告](docs/online-host-recap-report.md)；液態玻璃／圖鑑：[報告](docs/liquid-glass-catalog-report.md)。
- 死亡技能／機通手勢／狼弟：[報告](docs/dsk-mec-bro-report.md)；石像鬼：[報告](docs/sk-gargoyle-report.md)；接刀：[報告](docs/takeover-nightknife-report.md)。
- 整理前完整 README、各輪發布 SHA／測試數／既有索引保留於 [歷史快照](docs/archive/README-before-recap-cleanup-20261024.md)，不把當時版本當成目前狀態。
- 本次修改前備份：`backup/pre-recap-readme-20261024` → `7f44a7c15f684451cd1b372847106461fec5e2cb`；AWB 基準備份仍保留。
- 回退採新 `git revert` 提交與重測，不 reset、force push 或刪除備份；各輪報告列出適用 SHA 與限制。
- **待真機驗收**：iPhone Safari、iOS PWA、Android、低階裝置、動態網址列、實際安全區與雙指縮放。桌面模擬不代表真機通過。
