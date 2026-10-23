# 玻璃介面第二階段：首頁與主持畫面

日期：2026-10-23。本輪接續使用者確認的元件預覽，僅套用首頁及主持畫面的玻璃材質。這是本機審閱版本，尚未推送或部署正式網站。

## 回退基準

- 工作分支：`feat/eclipse-host-app`。
- 修改前 HEAD：`063c432b3a98eb202823d8aa3e5f0c050afff90f`。
- 已建立並核對的本機備份分支：`backup/pre-glass-home-host-20261023-01`，指向上述完整 SHA。
- 沒有修改既有遠端備份、main 或 Git 歷史。

## 實際修改

| 檔案 | 用途 |
| --- | --- |
| `public/b3.css` | 僅以 `#home`／`#host` 為範圍，加入材質用變數與視覺覆寫。 |
| 本報告 | 保存本輪範圍、驗證與回退方式。 |

首頁保留冰藍主操作、原按鈕文字及排列；將大面積高光改為柔和斜向漸層、細頂邊高光與低強度內緣，沒有點狀裝飾。主持資訊、座位及工具／流程按鈕沿用同一材質，選中框保留完整冰藍輪廓。座位按壓不位移。

未調整元素尺寸、座位排列、技能圖示大小或原字級。背景 fill 的 computed alpha 仍為首頁 0.20、座位 0.48、主持資訊 0.68；文字及 SVG 並未套用整體透明度。既有禁用條件、死亡／警上／退水等狀態仍由原程式控制。

沒有修改 HTML、App JavaScript、引擎、投票、計時器、復盤、存檔、Service Worker、背景圖片、人物原畫或 26 個技能 SVG。存檔與快取版本均未調整。原本無 blur 的降級 CSS 保留；本輪未宣稱 Safari 降級真機驗收。

## 驗證

本機 Edge／Chromium 自動化結果，不代表 iPhone Safari、iOS PWA、Android 或低階裝置真機通過。

| 指令／檢查 | 實際結果 |
| --- | --- |
| `npm test` | 946 通過、0 失敗、0 跳過；含既有 28 板子的模擬對局。 |
| `node scripts/host01-03-ui.mjs` | 41 組通過、0 失敗；主持合法選人、迷你計時器、投票、刷新與縮放模擬。 |
| `node scripts/dsk-mec-bro-ui.mjs` | 30 組通過、0 失敗；死亡技能、機械狼固定字幕、房規保存。 |
| `node scripts/ui-regression.mjs` | 38 組通過、0 失敗；28 板子完整流程、刷新／回退／重開、四種響應式情境、圖鑑素材及離線讀取。最終 `council-ui-results.json` 已產生，errors 為空。離線檢查包含原腳本指定的 56 個資源。 |
| `node actual-app-check.mjs before`／`after` | 各 15 組通過、0 失敗；五種 viewport × 首頁／夜間／白天。修改前後座位、流程按鈕、操作按鈕與主持資訊區 bounding box 完全一致，沒有橫向溢出或 pageerror。 |
| `git diff --check` | 通過。 |

尺寸：320×568、375×667、390×844、430×932、844×390；既有 HOST 回歸另含 768×1024、200% root 字級、Reduced Motion、觸控／縮放與安全區模擬。

本輪補充檢查、原始結果與截圖保存在專案外同層資料夾 `../wolfcue-ui-review-20261023/`：

- `actual-app-check.mjs`、`actual-before/results.json`、`actual-after/results.json`：修改前後幾何與樣式證據。
- `actual-after/390-home.png`、`actual-after/390-selected.png`：實際首頁、夜間選座手機截圖。
- `npm-test.log`、`host-regression/results.json`、`death-regression/results.json`：測試結果。
- `full-ui-regression/`：完整 UI 測試輸出。
- `actual-server.mjs`：只提供 `public/` 靜態檔案的本機預覽服務，未加入正式 App。

補充截圖測試封鎖 Supabase 網域，沒有執行雲端資料寫入。手機 HTTP 預覽用來檢查外觀與傳統主持；不作為 HTTPS/PWA 安裝、離線或線上發牌驗收。

## 待驗收與範圍

- 待使用者檢視真機玻璃對比、Safari 動態網址列與觸控感受。
- iPhone Safari、iOS 安裝 PWA、Android、低階裝置均未真機驗收。
- 下一階段投票／線上房間、圖鑑／復盤材質尚未施工。
- 尚未發布到正式站；這份報告不表示已部署。

## 安全回退

查找本報告新增的實作提交：`git log --diff-filter=A --format=%H -- docs/glass-home-host-review-20261023.md`。

需要回退時，在乾淨工作樹執行 `git revert <上述實作提交SHA>`，產生新回退提交，保留之後的歷史。若與後續 CSS 編輯衝突，僅處理本輪材質區塊；不要 reset、force push 或覆寫備份分支。完整舊版本仍在 `backup/pre-glass-home-host-20261023-01`。
