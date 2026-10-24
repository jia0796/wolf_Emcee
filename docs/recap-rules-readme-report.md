# 巡獵規則收合區、復盤精簡與 README 整理

日期：2026-10-24。分支：`feat/eclipse-host-app`。

**最新樣式修訂**：使用者要求沿用 App 風格，首版紫晶書頁樣式已改為 App 共用冰藍液態玻璃；下方首版實作與截圖作歷史紀錄。最新規格以 README／DESIGN 及文末修訂為準。

## 已完成內容

1. 覺醒獵人復盤不再顯示槍圖示上方的巡獵起點／命中小字。人物、座號、槍圖示、目標與「不巡獵」維持；原始 result、direction、targets 與存檔資料完全不刪除。
2. 「覺醒狼美人 / 覺醒獵人」設定頁的夜間順序下新增原生 details 收合區，預設收合，名稱為「覺醒獵人巡獵規則」。紫晶書頁式玻璃與原冰藍房規區分，沒有新增遊戲步驟或確認。
3. 依使用者提供內容顯示「採用官方狼人殺規則」；四點使用真正的編號清單，第 4 點以子清單區分放逐／狼刀。文字採「未魅惑／魅惑」，長句自然換行對齊文字開頭，不使用手動空白排版。
4. README 由 607 行整理為 111 行，集中現況、板子數、使用方式、架構／規格、驗收及回退索引。詳細已完成規格移至 `docs/current-rules.md`，整理前全文保留於 `docs/archive/README-before-recap-cleanup-20261024.md`；舊版號／測試數明確作歷史資料。
5. 修正現況數字為 29 板、33 角色、27 線上板；詳細手冊將舊長按計時器說明更新為已完成的直接拖曳，12 人機通字幕明確引用較新裁定。沒有變更這些既有功能。

## 修改檔案

| 檔案 | 修改原因 |
| --- | --- |
| `public/recap.js` | 對 awakenedPatrol 回傳空顯示標籤；只改呈現，不改事件。 |
| `public/index.html` | 新增具四點編號、兩點子層級的收合說明。 |
| `public/app.js` | 以穩定 board ID 控制顯示；既有切板流程將所有 details 關閉。 |
| `public/liquid-glass.css` | 僅新收合區的紫晶樣式、44px 以上標題熱區、自然懸掛縮排、鍵盤焦點與 Reduce Motion。 |
| `public/sw.js` | 快取識別更新 council-v22-20；快取策略／素材清單不變。 |
| `test/complete-recap.test.js` | 增加一項呈現回歸，確認原事件未變、普通獵人文字不受影響。 |
| `scripts/patrol-rules-ui.mjs` | 六種尺寸／大字體、鍵盤收合、層級與實際換行、切板隔離、舊存檔復盤顯示的瀏覽器驗證與截圖。 |
| `README.md`、`DESIGN.md`、`docs/current-rules.md`、歷史快照、本報告 | 更新已完成內容並分離現行概況與歷史；調整搬移後相對連結。 |

沒有修改角色插畫、技能 SVG、背景、遊戲引擎、投票、死亡結算、計時運算、原始復盤資料或存檔版本；本輪沒有 Supabase／Google Drive 變更。

## 實測結果

- `npm test`：**987 通過、0 失敗、0 跳過、0 取消**，含新增呈現斷言與原完整回歸。
- `node scripts/patrol-rules-ui.mjs`：**9 組通過、0 失敗，page errors 空**。[結果](patrol-rules-evidence/local/results.json)。
- `UI_BOARDS=awakenedBeauty12,beauty12,mechanical12 node scripts/ui-regression.mjs`：**13 組通過，errors 空**。三張板完整流程含刷新、回退、重新一局，另含共用圖鑑、響應式與 56 資源離線檢查。[結果](patrol-rules-evidence/regression/council-ui-results.json)。這是指定三板回歸，不宣稱本輪重跑全部 29 板的瀏覽器流程；完整 29 板仍在 npm 壓力測試覆蓋。
- 版面：320×568、375×667、390×844、430×932、844×390，及 390×844 根字級 150%。已以文字 Range 實際位置檢查子層級長句後續行對齊，無水平溢出。
- 鍵盤 Enter／Space 收合、原生 details、44px 標題觸控熱區、最後一項可捲動查看、切到普通狼美人／機通／石像鬼不顯示、切回本板重新收合均通過。
- 復盤使用合成的本機存檔，不碰人類房間；比較呈現前後 dayEvents 完全相同。畫面中的測試終局不代表真人完整對局。
- `node scripts/update-cache-manifest.mjs --check`：130 素材修訂符合，沒有新增圖片下載或更動策略。
- 三份整理後文件的本機相對連結已逐一確認存在；舊正文保留於快照並重設相對路徑，沒有刪除正式規則原文。
- **未真機驗收**：iPhone Safari、iOS PWA、Android、低階裝置及實際系統字級／捏合手勢；桌面模擬不能替代。

部署完成：[GitHub Pages 成功](https://github.com/jia0796/wolf_Emcee/actions/runs/40088864385)，發布程式 `7c01ba2a564d9326c4ab9f04c3159bec94d2ec2f`。`PATROL_RULES_LIVE=1 node scripts/patrol-rules-ui.mjs` 正式站 **9 組通過、0 失敗，errors 空**，[完整結果](patrol-rules-evidence/live/results.json)。五個更新檔案（app.js、index.html、liquid-glass.css、recap.js、sw.js）正規化換行後 SHA256 與本機相同，[核對記錄](patrol-rules-evidence/live/hashes.json)。

## 備份與安全回退

修改前基準 `7f44a7c15f684451cd1b372847106461fec5e2cb`；遠端 `backup/pre-recap-readme-20261024` 已建立、推送並核對。其他備份與 main 不變。

發布後以本報告列出的程式提交執行 `git revert <程式 SHA>`、`npm test`，再推送原開發分支；不要 reset、force push 或以備份覆蓋後續提交。文件整理可獨立反向提交；搬移前完整 README 可在上述備份與歷史快照讀取。回退不刪使用者存檔。

程式提交：`7c01ba2a564d9326c4ab9f04c3159bec94d2ec2f`。只回退程式可使用 `git revert 7c01ba2a564d9326c4ab9f04c3159bec94d2ec2f`；若其後有同區修改，先人工處理衝突並重測。文件整理另筆提交，保留彼此獨立回退能力。

## 截圖

- [巡獵規則／階層](patrol-rules-evidence/local/rules-390x844.png)
- [320px 規則](patrol-rules-evidence/local/rules-320x568.png)
- [移除小字後復盤](patrol-rules-evidence/local/recap-patrol.png)
- [不巡獵仍保留](patrol-rules-evidence/local/recap-skip.png)
- [正式站收合區／層級](patrol-rules-evidence/live/rules-390x844.png) · [正式站復盤](patrol-rules-evidence/live/recap-patrol.png)

## 後續修訂：改回 App 冰藍液態玻璃

- 修改前基準：`9bb6ca24a0e4c9737fd92b3c2349da303ca51de6`，Git 歷史保留。
- 收合區改用共用 v-blue／v-line／v-sheen／v-edge／v-ink／v-muted，底色、漸層、16px 圓角、邊框、文字與字體均與現有夜間順序區一致；保留液態高光與模糊材質。
- 標題、文字、編號與子層級、換行對齊、熱區、收合行為與遊戲規則不變；沒有修改角色插畫的紫色外框。
- 只修改新收合區材質、快取識別 council-v22-21，以及測試／文件；素材清單與存檔版本不變。README、DESIGN 與 current-rules 同步採用最新要求，首版證據不覆寫。
- 本機 UI 9 組通過，包含以 getComputedStyle 核對新區塊與 App 夜間順序區的實際材質，以及六種 viewport、文字縮排、鍵盤收合、切板與復盤；[結果](patrol-style-evidence/local/results.json) · [新畫面](patrol-style-evidence/local/rules-390x844.png)。
- 材質修正後再次完整 `npm test`：987 通過、0 失敗／跳過／取消，[原始輸出](patrol-style-evidence/npm-test.txt)。程式提交 `24c4512f0ca221ec1335ffc0afea306cd28c21f7`；單獨回退本次材質採 `git revert 24c4512f0ca221ec1335ffc0afea306cd28c21f7`、重新測試後推送，不覆蓋後續歷史。
- 已發布：[GitHub Pages 成功](https://github.com/jia0796/wolf_Emcee/actions/runs/40089574274)。正式站 UI 9 組通過、0 失敗，五個檔案雜湊與已測版本一致；[正式站結果](patrol-style-evidence/live/results.json) · [雜湊](patrol-style-evidence/live/hashes.json) · [最新畫面](patrol-style-evidence/live/rules-390x844.png)。真機 Safari／PWA／Android 仍未驗收。
