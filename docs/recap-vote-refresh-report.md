# 2026-10-25｜復盤人物同步、身分卡融合與投票摘要精簡

## 已實作範圍

- 33 個角色的復盤事件卡與最終身分卡使用圖鑑新插畫。以事件中保存的 role ID 對應，不改寫存檔的 image、職業、陣營或事件資料。
- 新圖沿用人物融入玻璃底的呈現，沒有新增獨立人像框。最終身分卡拿掉插畫四周內縮空白，圖片貼合卡片邊緣，往文字區柔和淡出；原名稱、座號、存活狀態、陣營色及操作按鈕保留。
- 插畫載入失敗時退回快照原圖與原裁切；舊局缺少人物身分仍維持「未記錄」，不推算或補造。感染者、轉化者、接刀角色保留事件當時身分與原職人物。
- 一般放逐、警長選舉、警長 PK、放逐 PK 完成統計後，主持區移除人數／票數摘要及一般操作提示，保留「已選：X號」。修改票型緊鄰平票按鈕；窄螢幕仍可自然換行。
- 完整選票、1.5 票、棄票、平票規則、重新統計、預選、手動改選警示及復盤顯示條件不改。編輯器與正式復盤仍可查看完整票型。
- 前一筆混血兒分類修正為「好人陣營」，其技能中的民位計數與跟隨榜樣勝負不改。

## 修改檔案

| 檔案 | 變更 |
| --- | --- |
| public/recap.js | 僅人物呈現函式使用新圖與載入失敗 fallback；事件及身分模型不變。 |
| public/liquid-glass.css | 僅最終身分卡的插畫貼邊與漸層融合，裁切超出外框部分。 |
| public/app.js | 已完成統計的提示精簡、既有票型按鈕改名並放在平票旁。 |
| public/vote-ui.js | 主持區不再建立統計結果卡；草稿進度、重算提示、改選警示及編輯功能保留。 |
| public/sw.js | 快取識別 council-v22-24；快取策略與存檔 v22 不變。 |
| scripts/recap-vote-refresh-ui.mjs | 新增針對本輪介面、舊紀錄、投票及離線的瀏覽器驗證。 |
| README.md、DESIGN.md、本報告與證據 | 更新現況、圖片使用範圍、測試與發布紀錄。 |

public/engine.js、night.js、identity.js、records.js、votes.js、online.js、online-state.js、timer.js、原始圖片及技能 SVG 均未變更。沒有修改 Supabase 或 Google Drive。

## 實際測試

| 指令／項目 | 通過 | 失敗 | 跳過 |
| --- | ---: | ---: | ---: |
| npm test | 990 | 0 | 0 |
| node scripts/recap-vote-refresh-ui.mjs | 47 | 0 | 0 |
| node scripts/ui-regression.mjs | 39 組（29 板） | 0 | 0 |
| node scripts/update-cache-manifest.mjs --check | 196 資產一致 | 0 | 0 |

- 33 角色的事件／最終身分圖源全部核對，包含舊圖快照；渲染前後事件與狀態逐字比較不變。
- 復盤 320、375、390、430px：圖片貼齊外框、漸層融合、文字／按鈕不溢出、刷新保存、缺圖 fallback、離線。
- 主持人與玩家共用 renderer；玩家驗證使用合法的 recapSnapshot／validateRecap 本機資料契約，沒有連接真實房間。
- 四種投票均經實際瀏覽器操作提交、修改、重新計票、刷新、下一步、上一步及復盤紀錄；票權、全員棄票、手動改選隱藏復盤與改回恢復均實測。
- 全站 39 組在功能修改後完整完成；之後微調最終身分卡貼邊及完成統計提示，再完整執行 47 組定向驗證與 npm test。
- 新瀏覽器腳本初次因把 SVG fallback 誤當一般 img 而超時；第二次在多人模式尋找已分配給其他人的選民而超時。均修正測試操作／定位，未改遊戲規則或移除結果斷言。最後完整結果檔為 47 通過，前兩次不列通過。
- 歷史 scripts/vote62-ui.mjs 仍斷言主持區必須顯示已被本次定案移除的統計卡，未執行；本輪由新腳本驗證新 UI，原有 npm 投票資格、計票、復盤與回退斷言完整執行。

原始結果：[定向 UI](recap-vote-refresh-evidence/local-results.json) · [全站 UI](recap-vote-refresh-evidence/regression-results.json)。

## 截圖

[復盤事件](recap-vote-refresh-evidence/local-recap-events.png) · [最終身分融合](recap-vote-refresh-evidence/local-recap-identities.png) · [完成統計後](recap-vote-refresh-evidence/local-vote-summary.png)。

截圖是隔離瀏覽器的虛構測試資料，不是真實玩家對局。

## 未驗收

iPhone Safari、安裝式 iOS PWA、Android、低階裝置、真機動態網址列、安全區與雙指縮放均為 **待真機驗收**。沒有執行真人多人連線，不以桌面模擬取代真機結果。

## 基準與回退

- 本次前一筆提交：`5ea393ec12d98444344993ae399982066e77e332`，包含混血兒分類標籤。
- 整輪圖鑑改版前的遠端備份 `backup/pre-catalog-ui-20261025` 指向 `340313c503c993a0bae849779758cd25944b9acf`，保留原 Git 歷史與原素材。
- 安全回退採 git revert 本次功能提交，跑測試後正常 push 重新發布。不得 reset、強制推送或刪除使用者存檔；後續只有驗收文件的提交如有衝突，可先 revert 該文件提交再 revert 功能提交。

## 部署

本機驗收已完成，提交與正式站驗收結果於本輪發布後補齊。
