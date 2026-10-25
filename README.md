# 狼序 WolfCue｜狼人殺主持工具

真人法官 PWA，提供固定主持字幕、角色與技能標記、日夜結算、警長／放逐／PK 投票、發言計時、上一步與完整復盤；另有線上發牌（Beta 版）。

[開啟網站](https://jia0796.github.io/wolf_Emcee/) · [現行設計](DESIGN.md) · [詳細規則](docs/current-rules.md) · [本次更新報告](docs/recap-tabs-report.md)

## 目前版本與維護原則

- 工作分支：`feat/eclipse-host-app`；不自動合併 main。
- 傳統主持：**29 款板子、10／12 人、33 個角色**；線上發牌支援其中 **27 款**。
- 存檔：**v22**，保留舊局相容與完整回退歷史，不補造舊存檔沒有的紀錄。
- 快取：**council-v22-26**；沿用核心優先、素材每批兩張的漸進快取。
- 規則以最新使用者裁定及 [詳細規格](docs/current-rules.md) 為準；外觀以 [DESIGN.md](DESIGN.md) 為準。歷史報告中的舊配色、版號及測試數不作現行施工要求。

## 最新更新

### 2026-10-25｜完整復盤視窗、橫列天數與投票配色

- 完整復盤改為內嵌玻璃視窗，「完整復盤」標題及天數列固定，只有下方事件內容捲動。第一天、第二天、第三天同列，超出可左右滑動；一次顯示一天，預設首個真實紀錄日，支援方向鍵／Home／End。
- 身分回顧可點標題收合，預設展開；四欄、勝方在前、死因與人物融合維持不變。
- 復盤警長／放逐／PK 投票紀錄改用冰藍／深藍玻璃及白色系文字，最高票移除舊紫色填色；不改票權、結果或編輯介面。
- 覺醒獵人命中覺醒狼美人並觸發替死時，依保存的相遇座號及替死快照分成「獵人 → 覺醒狼美人」及「覺醒狼美人替死 → XX號」兩卡。實際死者、結算、回退及存檔不改；舊局缺資料不補造。
- 本輪本機完整測試 **1041／0 失敗／0 跳過**；復盤 UI **13 組**、全站 UI **39 組（29 板）**通過。部署後結果另見本輪報告，真機待驗收。
- [實作、測試、截圖、部署及回退報告](docs/recap-tabs-report.md)。前輪「每天分別展開」已由本輪同列頁籤取代。

### 2026-10-25｜身分回顧四欄、每日復盤與固定圖鑑工具列（已完成、已部署）

- 頂部只保留「XX陣營獲勝」及勝利原因；身分回顧先於完整復盤顯示，勝利陣營在前，好人內神職先、平民後，各組按座號遞增。
- 身分回顧是完整展開的玻璃背景區塊，不設獨立捲軸。四欄卡片縮小間距、加長比例；圓框座號、直排職業、頂部存活／死因，角色背景延伸鋪滿全卡。死亡只弱化人物與背景，文字保留清晰。
- 死因依正式保存的來源顯示；獵魔人區分「獵魔狩獵／狩獵失敗」，覺醒獵人統一「獵人開槍」。守衛或無敵盾＋解藥致死顯示「奶穿」。缺資料標「死因未記錄」，不重算傷害或補造歷史。
- 完整復盤按「第一天、第二天…」分別展開；同一天保留夜晚／白天順序，左側月亮／太陽代表時段，移除重複的第幾晚／第幾天文字。整個復盤頁一起捲動。
- 圖鑑標題、返回及陣營切換固定在上方，列表獨立捲動；保留三欄、既有插畫與正反翻卡。
- 本輪完整測試 **1033／0 失敗／0 跳過**；本機全站 UI **39 組（29 板）**。正式站復盤 **10 組**、圖鑑 **107 組**全部通過，8 個發布檔案雜湊一致；未操作真實房間。真機仍待驗收。
- [本輪修改、死因表、測試、截圖與回退](docs/recap-identity-days-report.md)。


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

## 近期部署紀錄（已核對並補齊）

以下核對 2026-10-21～25 本分支近期的 16 次成功 Pages 發布，時間為台北時間；每列為實際發布的提交，包含先前未集中記錄的項目。歷史樣式已明列取代關係，不作現行設計指示。各輪測試數仍以各自報告為準，不視為本輪重測。

| 發布時間 | 更新內容與目前狀態 | 發布提交 | Pages |
| --- | --- | --- | --- |
| 2026-10-25 20:32 | 身分四欄、死因、每日收合與圖鑑固定工具列（現行） | [`7b2451a`](https://github.com/jia0796/wolf_Emcee/commit/7b2451aea77ce6508b76f0d726e3fb5112583004) | [成功](https://github.com/jia0796/wolf_Emcee/actions/runs/40193578038) |
| 2026-10-25 14:59 | 新插畫同步復盤、投票完成提示精簡；兩欄身分樣式已由本輪四欄取代 | [`b7dd81f`](https://github.com/jia0796/wolf_Emcee/commit/b7dd81f8f7eedf6cb6a6bf619ee7564529143d01) | [成功](https://github.com/jia0796/wolf_Emcee/actions/runs/40171112946) |
| 2026-10-25 14:43 | 混血兒圖鑑分類顯示「好人陣營」 | [`5ea393e`](https://github.com/jia0796/wolf_Emcee/commit/5ea393ec12d98444344993ae399982066e77e332) | [成功](https://github.com/jia0796/wolf_Emcee/actions/runs/40170085763) |
| 2026-10-25 14:30 | 33 角色新圖鑑與三欄介面、魔術師霜藍銀框 | [`ff0522d`](https://github.com/jia0796/wolf_Emcee/commit/ff0522d726c7c2220b60461eddb66c099fab45f8) | [成功](https://github.com/jia0796/wolf_Emcee/actions/runs/40169346518) |
| 2026-10-24 19:21 | 巡獵規則改用 App 共用冰藍玻璃（現行） | [`24c4512`](https://github.com/jia0796/wolf_Emcee/commit/24c4512f0ca221ec1335ffc0afea306cd28c21f7) | [成功](https://github.com/jia0796/wolf_Emcee/actions/runs/40089574274) |
| 2026-10-24 19:10 | 巡獵規則初版、復盤小字移除；初版紫色書頁樣式已被取代 | [`7c01ba2`](https://github.com/jia0796/wolf_Emcee/commit/7c01ba2a564d9326c4ab9f04c3159bec94d2ec2f) | [成功](https://github.com/jia0796/wolf_Emcee/actions/runs/40088864385) |
| 2026-10-24 18:20 | 覺醒狼美人／覺醒獵人板、替死與巡獵 | [`940acf4`](https://github.com/jia0796/wolf_Emcee/commit/940acf4a27a384f59a2076e07737f5d53b723819) | [成功](https://github.com/jia0796/wolf_Emcee/actions/runs/40085542457) |
| 2026-10-24 16:26 | 主持人帶入線上發牌身分、玩家終局共用復盤 | [`aa88927`](https://github.com/jia0796/wolf_Emcee/commit/aa889271302418a2f74116e2ca558145be6772ee) | [成功](https://github.com/jia0796/wolf_Emcee/actions/runs/40078066699) |
| 2026-10-24 02:28 | 線上原卡片保留、內部人物換成透明底圖鑑素材 | [`14986af`](https://github.com/jia0796/wolf_Emcee/commit/14986af7a80ddf47d1a01a1cd1db97925cd84530) | [成功](https://github.com/jia0796/wolf_Emcee/actions/runs/40003558663) |
| 2026-10-24 02:00 | 核准液態玻璃與透明底圖鑑框；背景保留原村莊版本 | [`2b07b7a`](https://github.com/jia0796/wolf_Emcee/commit/2b07b7ae49829f155b4647f677a0d3366dccd23a) | [成功](https://github.com/jia0796/wolf_Emcee/actions/runs/39999799560) |
| 2026-10-23 11:10 | 第二天起多人死亡技能字幕修正 | [`7ebb9e3`](https://github.com/jia0796/wolf_Emcee/commit/7ebb9e3b331a82d27b68cfc12bff2283ab96ffcc) | [成功](https://github.com/jia0796/wolf_Emcee/actions/runs/39893615825) |
| 2026-10-23 10:27 | 死亡技能整合、12 人機通手勢、狼弟房規、縮小計時器直接拖曳／重置後開始 | [`83fd353`](https://github.com/jia0796/wolf_Emcee/commit/83fd353f2efa272ba50f8f69388893b8d9aebf83) | [成功](https://github.com/jia0796/wolf_Emcee/actions/runs/39889689411) |
| 2026-10-22 18:51 | 縮小計時器 0.25 秒長按拖曳；已由直接拖曳取代 | [`f920dd0`](https://github.com/jia0796/wolf_Emcee/commit/f920dd0ba9dddd9eb41e04b892658ada028bd277) | [成功](https://github.com/jia0796/wolf_Emcee/actions/runs/39766258443) |
| 2026-10-22 08:40 | 撤回 HOST-01 座位樣式，保留 HOST-02／03 | [`4b6497a`](https://github.com/jia0796/wolf_Emcee/commit/4b6497a0e54bcfea1a034dfe54d16ef553571aa2) | [成功](https://github.com/jia0796/wolf_Emcee/actions/runs/39701046852) |
| 2026-10-22 08:18 | HOST-01～03 初版；HOST-01 已撤回，計時器後續已優化 | [`c87e0ae`](https://github.com/jia0796/wolf_Emcee/commit/c87e0ae97febf8e06afaad00ee7b7212e8061c04) | [成功](https://github.com/jia0796/wolf_Emcee/actions/runs/39698872094) |
| 2026-10-21 20:18 | 手動解散清除房間並退出玩家；正式終局後續改為玩家復盤 | [`4b06eb3`](https://github.com/jia0796/wolf_Emcee/commit/4b06eb3288262966ba81f1f5d8d0f931363bf196) | [成功](https://github.com/jia0796/wolf_Emcee/actions/runs/39598524191) |

液態玻璃初期的 `04c48ed`、`4ea1fe9` 隨 `2b07b7a` 一併發布；死亡技能等功能提交 `af34f20` 隨 `83fd353` 發布，不另宣稱獨立部署。以上為可查證的近期紀錄，更早歷史保留於既有報告與 README 歷史快照。

## 目前功能

| 區域 | 已完成行為 |
| --- | --- |
| 主持流程 | 保留原主持字幕、角色身分確認、兩欄座位與既有 SVG 標記；死亡技能併入對應遺言／無遺言頁。 |
| 投票 | 一般放逐雙模式；全部逐人投票選中後往後找未投票者，尾端再回最前面；取消停留、全部完成不自動提交。原警長／PK 規則保留。 |
| 發言計時器 | 大小視窗、直接拖曳、縮小後重置並直接開始；剩餘 10 秒（含）數字顯示紅色。 |
| 復盤 | 勝利陣營與原因、可收合四欄身分回顧、正式死因；完整復盤視窗內以橫列天數切換，固定標題，事件單獨捲動。人物融入玻璃卡，帶刀狀態不顯示復盤卡。 |
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
| 本次身分／每日復盤 UI | `node scripts/recap-identity-days-ui.mjs` |
| 圖鑑固定工具列／翻卡 | `node scripts/catalog-v2-ui.mjs` |
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

- 最新已執行結果與截圖：[本次報告](docs/recap-tabs-report.md)；[AWB 報告](docs/awb-implementation-report.md)。
- 線上身分／玩家復盤：[報告](docs/online-host-recap-report.md)；液態玻璃／圖鑑：[報告](docs/liquid-glass-catalog-report.md)。
- 死亡技能／機通手勢／狼弟：[報告](docs/dsk-mec-bro-report.md)；石像鬼：[報告](docs/sk-gargoyle-report.md)；接刀：[報告](docs/takeover-nightknife-report.md)。
- 整理前完整 README、各輪發布 SHA／測試數／既有索引保留於 [歷史快照](docs/archive/README-before-recap-cleanup-20261024.md)，不把當時版本當成目前狀態。
- 本次修改前備份：`backup/pre-recap-tabs-20261025` → `3d0089e9ef5a15d07cd6ea8190ca58b933b82e0d`，已核對遠端。前輪 `backup/pre-recap-identity-days-20261025` 與功能提交 `7b2451aea77ce6508b76f0d726e3fb5112583004` 仍保留。
- 先前 `backup/pre-recap-readme-20261024`、`backup/pre-catalog-ui-20261025` 與 AWB 等全部基準備份仍保留，未覆寫。
- 回退採新 `git revert` 提交與重測，不 reset、force push 或刪除備份；各輪報告列出適用 SHA 與限制。
- **待真機驗收**：iPhone Safari、iOS PWA、Android、低階裝置、動態網址列、實際安全區與雙指縮放。桌面模擬不代表真機通過。
