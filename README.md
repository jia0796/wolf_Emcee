# 狼序 WolfCue｜狼人殺主持工具

真人法官 PWA，提供固定主持字幕、角色與技能標記、日夜結算、警長／放逐／PK 投票、發言計時、上一步與完整復盤；另有線上發牌（Beta 版）。

[開啟網站](https://jia0796.github.io/wolf_Emcee/) · [現行設計](DESIGN.md) · [詳細規則](docs/current-rules.md) · [本次更新報告](docs/wolf-gun-chain-report.md)

## 目前版本與維護原則

- 工作分支：`feat/eclipse-host-app`；不自動合併 main。
- 傳統主持：**30 款板子、10／12 人、35 個角色**；線上發牌支援其中 **28 款**。
- 存檔：**v22**，保留舊局相容與完整回退歷史，不補造舊存檔沒有的紀錄。
- 快取：**council-v22-31**；沿用核心優先、素材每批兩張的漸進快取。
- 規則以最新使用者裁定及 [詳細規格](docs/current-rules.md) 為準；外觀以 [DESIGN.md](DESIGN.md) 為準。歷史報告中的舊配色、版號及測試數不作現行施工要求。

## 最新修正｜2026-10-26 狼槍接續（已部署）

- 已依後續裁定：覺醒黑狼王與狼槍繼承者被獵人或其他狼槍帶走後，仍可按剩餘次數接續開槍；親傳一把後本人保留一把。普通黑狼王原本即支援，這次補齊完整回歸。
- 原先卡在「淘汰，沒有遺言」的待處理存檔，重新整理或上一步返回後可正確恢復狼槍操作，使用／明確不使用僅扣本次額度。已完成的死亡與復盤不重算、不補造。
- 毒殺、自爆、既有禁技與正式終局停止仍保留；給完兩把後不憑空恢復本人槍。
- 圖鑑技能文字、[AKW 現行規格](docs/akw-spec.md)同步更新；存檔仍為 v22，快取更新為 council-v22-31。本輪不修改 Supabase、Drive 或 main。
- 本機與部署後完整測試皆 **1178 通過／0 失敗／0 跳過**；正式站槍殺接續 14 組、原新板 UI 13 組及離線 3 組全通過，四個發布檔案雜湊一致。真機仍待驗收。
- 功能提交 `0738fd17e298bfe67e2ec3e5dc10e3dd56afbec5`；[Pages 發布成功](https://github.com/jia0796/wolf_Emcee/actions/runs/40304368662)。遠端備份 `backup/pre-wolf-gun-chain-20261026` → `2e2171020a9435c2fc866d176e43e08135961f7a` 已核對。
- 測試、發布、截圖及回退：[狼槍接續修正報告](docs/wolf-gun-chain-report.md)。

## 前輪新板與圖示更新｜2026-10-26（已部署）

- 新增 12 人特殊板「覺醒黑狼王／覺醒女巫」，同步支援線上發牌。親傳當晚生效、逐次狼槍、三次調毒、自選協助者、選填完整表決、存檔與回退見 [AKW 現行規格](docs/akw-spec.md)。
- 主持標記、操作及復盤採已核准第二版 28 SVG；原 26 SVG 全數保留。依技能／施術者選色，不更改存檔技能 ID、順序或結果；缺圖只退回一次原版。
- 調毒單卡保留毒藥圖示，上方「成功／失敗」，下方正式協助者與有效 O／X（皆冰藍色系）；不記錄的票型不補造。
- 身分回顧直接展開，下方「完整復盤」長條按鈕另開視窗；天數固定橫列、事件單獨捲動。
- 兩名新角色採正式核准插畫與逐字核准圖鑑文字。其餘角色、背景、投票規則及按鈕幾何尺寸不變。
- 已發布網站與 Supabase 新板目錄；部署後 `npm test` **1154／0 失敗／0 跳過**，正式站新板 UI 13 組、復盤 13 組、圖鑑 111 組、線上卡 41 組、真實十二玩家 21 組、離線 3 組全部通過，49 個發布檔案雜湊一致。iPhone Safari／PWA、Android、低階裝置仍待真機驗收。
- 功能提交 `519441ef59ae2359dfb415cf214788c3dc195a07`；SVG 位元組保護／發布版本 `6296ca75160fc03cb6b4d06bd5c13edd5b546291`；[Pages 成功紀錄](https://github.com/jia0796/wolf_Emcee/actions/runs/40286756367)。
- 本輪實測、發布狀態、截圖、問題與回退：[更新報告](docs/akw-release-report.md)。過去部署紀錄及已被取代的樣式移至 [歷史快照](docs/archive/README-before-akw-20261026.md)，不作現行施工指示。

## 目前功能

| 區域 | 已完成行為 |
| --- | --- |
| 主持流程 | 保留原主持字幕、角色身分確認、兩欄座位與既有 SVG 標記；死亡技能併入對應遺言／無遺言頁。 |
| 投票 | 一般放逐雙模式；全部逐人投票選中後往後找未投票者，尾端再回最前面；取消停留、全部完成不自動提交。原警長／PK 規則保留。 |
| 發言計時器 | 大小視窗、直接拖曳、縮小後重置並直接開始；剩餘 10 秒（含）數字顯示紅色。 |
| 復盤 | 勝利陣營與原因、固定展開四欄身分回顧、正式死因；完整復盤另開視窗，以橫列天數切換，固定標題，事件單獨捲動。人物融入玻璃卡，帶刀狀態不顯示復盤卡。 |
| 線上發牌 Beta | QR／邀請連結、選座、一次性發牌、個人翻牌與圖鑑；主持人自動帶入已確認分配。 |
| 線上終局 | 活動房間刪除，原入座玩家進相同復盤、只留回首頁；主持頁保留原按鈕。授權復盤保留 24 小時。手動解散不補造復盤。 |
| 視覺／素材 | 冰藍液態玻璃、米白主按鈕文字、原海邊村莊背景；圖鑑、復盤與線上卡正面共用新系列 35 張插畫。圖鑑三欄、復盤融合及線上原卡框／卡背各自保留。 |
| 保存與離線 | localStorage 保存對局，sessionStorage 保存分頁畫面；支援刷新、上一步及傳統主持離線。線上發牌需要網路。 |

## 支援板子

資料以 [public/data.js](public/data.js) 為準；顯示名稱不作穩定 ID。

| 人數 | 一般 | 特殊 | 合計 |
| --- | ---: | ---: | ---: |
| 10 人 | 9 | 3 | 12 |
| 12 人 | 11 | 7 | 18 |
| 全部 | 20 | 10 | **30** |

- 10 人特殊：覺醒石像鬼／守墓人、種狼／隱狼、尋香魅影／覺醒預言家。
- 12 人特殊：上述三款，以及狼兄狼弟／黑市商人、假面／舞者、覺醒狼美人／覺醒獵人、覺醒黑狼王／覺醒女巫。
- 一般板「石像鬼／守墓人」與特殊板「覺醒石像鬼／守墓人」完全獨立；前者 10／12 人目前僅支援傳統主持，因此線上目錄共 28 款。
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
| 新板親傳／調毒／復盤 UI | `node scripts/akw-ui.mjs` |
| 覺醒角色 UI | `node scripts/awb-ui.mjs` |
| 本次復盤視窗／天數頁籤 UI | `node scripts/recap-identity-days-ui.mjs` |
| 覺醒狼美人單狼狼刀 UI | `node scripts/awb-solo-knife-ui.mjs` |
| 線上角色卡新版插畫／隱私狀態 | `node scripts/online-card-art-ui.mjs` |
| 圖鑑固定工具列／翻卡 | `node scripts/catalog-v2-ui.mjs` |
| 後端本機測試 | [backend/README.md](backend/README.md)；必須使用本機虛構資料。 |

瀏覽器測試需已安裝 Playwright 與瀏覽器；可用 `COUNCIL_PLAYWRIGHT_MODULE` 指定模組。每輪已執行的指令、結果與環境以該輪報告為準，不把腳本存在視為測試通過。

## 架構與規格索引

| 功能／來源 | 位置 |
| --- | --- |
| 角色、板子、房規、圖片來源 | [data.js](public/data.js) |
| 階段、合法操作、存檔與回退 | [engine.js](public/engine.js) |
| 傷害批次、防護及勝負 | [night.js](public/night.js) |
| 覺醒黑狼王／覺醒女巫 | [akw.js](public/akw.js) · [AKW 現行規格](docs/akw-spec.md) |
| 技能素材解析 | [skill-art.js](public/skill-art.js) · [28 SVG 清單](docs/skill-v2-assets.json) |
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

- 本輪基準：`backup/pre-skill-v2-awakened-20261026` → `375ae3c9af23cdf9f4395c829f94e99f2fa79657`；規格備份 `backup/pre-akw-spec-20261026` → `6e369159df420b9831bb4f29b236328ec94aa875`，均已推送並核對遠端。
- 新板完整規則保存在 [AKW 規格](docs/akw-spec.md)，已移除被後續裁定取代的「女巫不可自選／兩行調毒復盤／待確認線上發牌」指示。

- 最新已執行結果與截圖：[線上卡新版插畫](docs/online-card-v2-report.md)；[狼刀修復報告](docs/awb-solo-knife-report.md)；[復盤精修報告](docs/recap-tabs-report.md)。
- 線上身分／玩家復盤：[報告](docs/online-host-recap-report.md)；液態玻璃／圖鑑：[報告](docs/liquid-glass-catalog-report.md)。
- 死亡技能／機通手勢／狼弟：[報告](docs/dsk-mec-bro-report.md)；石像鬼：[報告](docs/sk-gargoyle-report.md)；接刀：[報告](docs/takeover-nightknife-report.md)。
- 整理前完整 README、各輪發布 SHA／測試數／既有索引保留於 [歷史快照](docs/archive/README-before-recap-cleanup-20261024.md)，不把當時版本當成目前狀態。
- 本次修改前備份：`backup/pre-online-card-v2-20261026` → `2875b9b485bf904b20ee4b89d86d1ae3b9482c00`，已核對遠端；功能提交 `673ca6e9bfd6c64b59747d4f8c30b3acfc92ad1a`。前輪 `backup/pre-awb-solo-knife-20261025`、`backup/pre-recap-tabs-20261025`、`backup/pre-recap-identity-days-20261025` 與全部功能／精修提交仍保留；各輪報告列出對應 SHA。
- 先前 `backup/pre-recap-readme-20261024`、`backup/pre-catalog-ui-20261025` 與 AWB 等全部基準備份仍保留，未覆寫。
- 回退採新 `git revert` 提交與重測，不 reset、force push 或刪除備份；各輪報告列出適用 SHA 與限制。
- **待真機驗收**：iPhone Safari、iOS PWA、Android、低階裝置、動態網址列、實際安全區與雙指縮放。桌面模擬不代表真機通過。
