# 2026-10-24 液態玻璃與角色圖鑑發布報告

本輪已將核准的預覽接入並發布正式 App。保留原背景、按鍵大小、行距與操作流程；31 個角色的圖鑑清單及翻卡正面使用框外透明衍生圖。以下數字均為實際完成的測試。

## Git 與回退保護

- 工作分支：`feat/eclipse-host-app`，未合併 main。
- 施工前本機 HEAD：`4ea1fe934d7ac6f5b15b2ea738e707c2a1dad38f`。
- 施工前遠端／線上基準：`063c432b3a98eb202823d8aa3e5f0c050afff90f`。
- 遠端備份 `backup/pre-liquid-glass-catalog-20261024` 指向本機基準。
- 遠端備份 `backup/live-before-liquid-glass-20261024` 指向線上基準。兩者均以 `git ls-remote` 核對，未覆寫舊分支。
- 完整本機備份：專案父目錄 `wolfcue-before-liquid-glass-20261024.bundle`，包含備份當時全部 Git refs／歷史。
- 本次發布包含兩筆原本只在本機的材質提交 `04c48ed80614313ddbc358ae5ec76f8b7c7a788e`、`4ea1fe934d7ac6f5b15b2ea738e707c2a1dad38f`。被否決的 v4 線上背景已取消引用，使用原 `online-plaza-v3.png`；v4 歷史檔不刪除。
- 本輪整合 Commit：`2b07b7ae49829f155b4647f677a0d3366dccd23a`。

## 修改檔案與用途

| 檔案 | 修改 |
|---|---|
| `public/liquid-glass.css` | 新增獨立材質層：冰藍玻璃、透光漸層、高光、陰影、圓角、焦點與降級樣式；不設定幾何尺寸或行距 |
| `public/index.html` | 啟用玻璃 class，最後載入材質 CSS |
| `public/catalog-art.js` | 31 角色衍生圖映射、載入失敗回原圖 |
| `public/app.js` | 僅圖鑑清單與翻卡正面的圖片來源改用映射，保留懶載入及原操作 |
| `public/art/catalog-clear/*.png` | 31 張核准衍生圖；不覆寫原圖，保留完整卡框及框內內容 |
| `public/b3-ui.js` | 線上房間改回核准的 v3 原背景 |
| `public/sw.js`、`public/cache-manifest.js` | 登記新核心 CSS／JS、選用 PNG，更新資源雜湊及快取版號 |
| `test/catalog-clear.test.js` | 新增角色覆蓋、PNG／雜湊、fallback 及快取分級的三項測試 |
| `test/b3-ui.test.js` | 背景斷言對應使用者指定保留的 v3；未調整遊戲斷言 |
| `scripts/liquid-glass-ui.mjs` | 可重跑本機／正式站的尺寸、角色卡、失敗回復及離線測試 |
| `scripts/liquid-glass-assets.mjs` | 正式站 19 個程式／背景檔與本機發布版本核對 |
| `scripts/glass-vote-online-ui.mjs` | 歷史腳本中背景測試來源同步改為 v3 |
| `docs/catalog-clear-assets.json` | 31 張圖的原圖對應、檔案大小及 SHA256 |
| `README.md`、`DESIGN.md` | 統整現行設計，移除衝突舊視覺及過期待施工敘述，保留遊戲規格 |
| `docs/archive/*-pre-liquid-glass-20261024.md` | README／DESIGN 修改前完整副本，只作歷史與回退參考 |
| `docs/liquid-glass-evidence/` | 實際測試結果及截圖 |

與施工前線上基準比較，另包含先前兩筆提交的 `public/b3.css`、`public/online.css` 材質修飾及其歷史報告。它們沒有更改遊戲資料或座位幾何。

## 實際測試

| 指令／範圍 | 結果 |
|---|---|
| `npm test`（新增測試後完整重跑） | **949 通過、0 失敗、0 跳過、0 取消** |
| `node scripts/ui-regression.mjs` | **38 組通過、0 頁面錯誤**；28 款板子完整對局、共 2,536 次操作，包含重整／回退／重新開局、圖鑑、響應式及 56 資產離線檢查 |
| `node scripts/liquid-glass-ui.mjs` | **47 組通過、0 失敗、0 頁面錯誤** |
| `node scripts/glass-vote-online-ui.mjs release` | **30 組通過、0 失敗、0 頁面錯誤**；20 組四類投票＋10 組模擬主持／玩家房間 |
| `node scripts/update-cache-manifest.mjs --check` | 128 項資源版本核對通過 |
| `git diff --check` | 通過 |

47 組專項包括：42 個畫面／尺寸組合、1,179 個元素的寬高／位置／字體／行距／內外距比較（**0 差異**）；320／390px 下各 31 角色清單與正反翻卡；全部 PNG SHA256 一致；圖片失敗回原圖；31 圖快取後離線開啟 App 與圖鑑。畫面寬度涵蓋 320、375、390、430、844px，完整回歸另含平板與桌面。

數量按每支腳本的檢查群組記錄，不把角色數、操作次數與測試數相加。投票／線上測試使用虛構本機 API 與 Realtime adapter，**不是本輪真人連線或後端安全測試**。

初次 UI 啟動有兩項環境問題：Windows ESM 模組路徑缺少 `file:///`、本機伺服器與瀏覽器程序的網路隔離。修正執行路徑及由測試自行啟動伺服器後已完整重跑；中斷嘗試未列為通過。原 946 項測試先跑成功一次，增加三項測試後再完整跑到 949 項，不重複累計。

結果檔：`liquid-glass-evidence/regression/council-ui-results.json`、`liquid-glass-evidence/local/results.json`、`liquid-glass-evidence/vote-online/release/results.json`。

重跑瀏覽器測試需 Node.js 22+、Playwright 與 Edge。可在既有 Playwright 環境執行；本輪 Windows 使用 `COUNCIL_PLAYWRIGHT_MODULE=file:///C:/Users/laptop/.codex/.chatgpt-projects/g-p-6ab7d6c1ce448191aa4864889419a846/wolfcue-supabase-draft/node_modules/playwright/index.mjs`。本機專項自行啟動 5386 埠；正式站專項設定 `UI_BASE=https://jia0796.github.io/wolf_Emcee/` 及 `UI_OUTPUT=../docs/liquid-glass-evidence/live/` 後執行同一腳本。全回歸與模擬房間測試的詳細資料存於上述 JSON。

## 保留、限制及待驗收

- 相對施工前線上基準，`engine.js`、`data.js`、`night.js`、`identity.js`、`takeover.js`、`records.js`、`recap.js`、`online.js`、原角色圖及 26 技能 SVG 無差異；Supabase／Realtime／Edge Functions 不修改。
- 復盤與線上角色卡使用原圖；沒有套用圖鑑去背衍生圖。
- 原背景內容不修改。首頁、主持白天／夜晚及線上村莊皆使用既有素材。
- 存檔版本仍 **v22**，儲存鍵與回退歷史不變；Service Worker 資源版號 **council-v22-16**，使新核心檔案可更新。原先 CORE 優先、每批兩張漸進下載策略保留。
- 新 PNG 共 **69,953,682 bytes（66.7 MiB）**，首次下載／離線儲存成本增加。新圖非啟動阻塞資源，失敗可回原圖；未實測低階手機全部快取時的記憶體與效能。
- 衍生圖是已核准的生成式圖像，不能宣稱逐像素無損；部分畫布解析度不同，原圖完整保留。圖鑑仍用既有 contain 與 5:7 框顯示。
- **待真機驗收**：iPhone Safari、iOS 安裝 PWA、Android、低階裝置、實體雙指縮放、系統放大字體及動態網址列。桌面 Edge 模擬不代表真機通過。
- 正式站首輪曾出現一次圖片回原圖的斷言失敗，後續獨立檢查未重現；原因與重跑結果見下節。不宣稱所有裝置與所有網路條件皆無缺陷。

## 部署與部署後驗證

- 正式網址：https://jia0796.github.io/wolf_Emcee/
- 發布 SHA：`2b07b7ae49829f155b4647f677a0d3366dccd23a`。
- [GitHub Pages 發布成功](https://github.com/jia0796/wolf_Emcee/actions/runs/39999799560)；build 的 Verify host rules 及 deploy 均成功。
- [獨立 Host flow tests 成功](https://github.com/jia0796/wolf_Emcee/actions/runs/39999799521)。
- 正式站 **19 個程式／背景檔一致**；文字僅正規化 CRLF／LF 後比對 SHA256，圖片按原始 bytes 比對。
- 全部 **31 張新 PNG HTTP 200，大小及 SHA256 一致**，見 `live/png-diagnostic.json`。
- 首輪正式站專項完成 40 組尺寸檢查後，遇到一張圖回原圖而中止；沒有判為完整通過。當時尚未記錄該請求錯誤，不能確定原因。後續獨立瀏覽器完整 31 角色載入與翻卡成功，無 requestfailed；見 `live/browser-diagnostic.json`。新增失敗請求／角色診斷後，完整重跑結果另外記錄。未更動 App 或放寬斷言。
- 首次失敗保留於 `live/initial-catalog-failure.json`。
- **正式站完整重跑：47 組通過、0 失敗、0 頁面例外**，包含 42 組幾何比較、320／390px 全31角色、PNG雜湊、原圖 fallback 及離線。結果 `live/results.json`；未將首次中止列為通過。
- 重跑記錄中的兩次 seer `ERR_FAILED` 是故意攔截新圖以驗證 fallback；三次 host-night `ERR_ABORTED` 發生於測試切換／重新載入畫面。無其他失敗請求。獨立圖鑑診斷沒有失敗請求；首次退回原圖的根因仍無法從當時有限紀錄確定。
- 正式站截圖：[首頁](liquid-glass-evidence/live/home.png)、[主持](liquid-glass-evidence/live/host.png)、[圖鑑](liquid-glass-evidence/live/library.png)、[預言家翻卡](liquid-glass-evidence/live/seer-card.png)。
- 最終文件更新不變更已發布 App；README／DESIGN 已整理為現行規格，舊版全文在 archive 與兩個遠端備份。

## 安全回退

保留所有歷史，使用反向提交，不使用 reset／force push。回退前先確認工作樹乾淨；若之後已有其他修改，逐項解決衝突，不覆蓋後續功能。

只撤銷本輪整合：`git revert 2b07b7ae49829f155b4647f677a0d3366dccd23a`。這會回到本機預覽基準，包含當時未發布的 v4 背景引用，並非原線上版本。

回到本輪之前的線上 UI，需依新到舊撤銷本輪整合與先前兩筆未發布材質提交：

```sh
git switch feat/eclipse-host-app
git status --short
git revert 2b07b7ae49829f155b4647f677a0d3366dccd23a
git revert 4ea1fe934d7ac6f5b15b2ea738e707c2a1dad38f
git revert 04c48ed80614313ddbc358ae5ec76f8b7c7a788e
npm test
# 測試及差異檢查完成後，再依發布需要推送。
git push origin feat/eclipse-host-app
```

發布後的報告提交可另行保留，或再獨立 revert；不影響 App。備份分支與 bundle 供取回原檔，不直接覆寫工作分支。回退時應另以新提交更新快取資源版號，避免已安裝 PWA 使用相同歷史快取名稱；不要清除玩家 localStorage。
