# 冷啟動舊背景閃現修正

2026-10-21。程式提交 `d40260d5ae04440bde0dd3682417070d4166c9fa`；從線上版本 `3c519f280cda4fb2c2a4210e2c1be83711ebfb6a` 獨立修正，沒有帶入尚在開發的石像鬼板子。

## 原因與修正

新圖沒有覆寫舊圖片檔案。舊的 `art/backgrounds/shared.png` 仍被 `style.css` 設成 `body::before` 的預設底圖；在 `app.js` 尚未初始化、`data-screen` 還未設定時，就先顯示舊月亮城堡。新版背景圖層載入後才覆蓋它。

前一輪只檢查進入線上頁後的畫格，未涵蓋這段 pre-JS 冷啟動。本輪以舊版 HTML/CSS 與延遲 app.js 重現，確認舊背景出現在沒有任何 UI 的時候。

| 檔案 | 修改 |
|---|---|
| `public/style.css` | 移除固定 shared.png 底圖，改由目前畫面的 `--page-background` 決定，未初始化時為 none |
| `public/index.html` | 加入啟動關鍵樣式；即使收到舊 CSS，尚無 data-screen 時仍只呈現深藍底色 |
| `public/sw.js` | 快取版本由 council-v22-12 升到 council-v22-13，策略及資產清單不變 |
| `scripts/cold-start-background-ui.mjs` | 補上 pre-JS、弱網／圖片失敗、四種寬度、主持日夜／回退／刷新、SW 啟用與離線測試 |

圖片原檔、遊戲引擎、技能、存檔、回退、投票、計時器及 Supabase 均未修改。歷史背景檔案仍保留。

## 驗證

- `npm test`：824 通過、0 失敗、0 跳過，含原有全部板子回歸。
- 本機 Edge：24 項通過，completed=true，含一次舊版本問題重現。[結果](cold-start-evidence/local.json)。
- GitHub Pages：[部署成功](https://github.com/jia0796/wolf_Emcee/actions/runs/39554246439)。正式站 SW 已確認為 council-v22-13。
- 正式站 Edge：23 項通過、0 失敗，completed=true；相同測試排除舊版重現那一項。[結果](cold-start-evidence/live.json) · [正式站首頁截圖](cold-start-evidence/live-home.png)。

瀏覽器測試使用 `COUNCIL_PLAYWRIGHT_MODULE` 指定已安裝的 Playwright、`PW_TEST_SCREENSHOT_NO_FONTS_READY=1` 擷取刻意阻塞腳本的畫面。正式站使用 `COUNCIL_URL=https://jia0796.github.io/wolf_Emcee/` 與 `COUNCIL_BASELINE=0`。沒有建立線上房間或操作雲端後端。

測試過程：第一次截圖因等待字型而超時；第二次執行發現本機伺服器未啟動。均未列通過。補測離線時，剛取得 controller 後立即離線重載曾失敗；改為等待 SW 完整 activated 並完成受控頁面載入後，重跑完整測試通過。未變更 SW 策略，也不宣稱已驗證安裝過渡瞬間的離線切換。

額外檢查 `update-cache-manifest.mjs --check` 未通過：既有 manifest 比目前資產清單多一筆歷史 `online-coastal-v2.png`，沒有遺漏現用資產，所有記錄中的檔案雜湊與原檔一致。本輪不擴大修改歷史資產清單。

## 限制與真機驗收

上述為桌面 Edge 及手機 viewport 模擬，iPhone Safari／iOS PWA 真機首幀、系統啟動畫面、弱網及切回前景仍待驗收。系統保留的 App 快照不等同網頁繪製，本輪沒有證據判定手機是否也有此情況。

未收到新版 HTML/CSS 的舊離線安裝無法自行得到修正；需連線取得更新，再重新開啟。不要求清除網站資料，以免刪除現有主持存檔。

## 安全回退

原版本保留於 `backup/pre-sk-online-20261021`（`3c519f280cda4fb2c2a4210e2c1be83711ebfb6a`）。如要撤回本次程式，在最新發布分支執行 `git revert d40260d5ae04440bde0dd3682417070d4166c9fa`，檢查差異、測試後正常推送；不 reset、不 force push，不影響後續提交。
