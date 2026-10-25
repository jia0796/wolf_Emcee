# 2026-10-25 新圖鑑發布與驗收報告

## 範圍與結果

現有 33 個角色的圖鑑列表與翻卡正面換用已製作的新系列插畫。首頁圖鑑、主持圖鑑與線上房間圖鑑共用相同呈現；角色／板子數、技能原文、翻卡與返回流程不變。網站發布狀態見本文最後一節。

- 手機維持三欄，以單一深藍玻璃閱讀層減少村莊背景與多張插畫框的干擾。完整外框直接顯示，沒有再加第二圈裝飾框。
- 保留名稱與陣營色、點開大圖、正反翻卡、技能／目標原文、背面捲動、外側點擊與 Escape 關閉、鍵盤操作、Reduce Motion，以及回到原主持畫面。
- 33 張全尺寸 WebP 共 18,161,536 bytes（17.32 MiB）；33 張縮圖共 3,864,758 bytes（3.69 MiB）。縮圖 420×588，大圖 1060×1484，框外 Alpha 保留。WebP 是有損顯示衍生檔，原始 PNG 全部留存。
- 魔術師改為霜藍銀框 #B5BDD3 色相方向；使用既有像素精確遮罩，非 AI 重繪。遮罩外及 Alpha 變動均為 0，最大 OKLab 明度誤差 0.003492；保留原框型、人物、文字與背景。已人工檢查遮罩及正式採用圖。
- Drive 新增種狼、隱狼、平民、混血兒、假面、舞者、尋香魅影、大灰狼、占卜師共九張，魔術師原檔就地更新；目前共 39 張角色、2 張未修改模板及規格表。回讀確認檔名、唯一性與檔案大小，規格表 v4 內容回讀一致；不宣稱已取得遠端 PNG 雜湊。
- 未實作的大灰狼、占卜師、覺醒女巫、覺醒黑狼王、覺醒騎士、覺醒攝夢人僅入庫素材，未增加遊戲規則。

## 修改檔案

| 檔案 | 差異 |
| --- | --- |
| public/app.js | 僅圖鑑列表與展開圖片改用新映射；縮圖／大圖分流。 |
| public/catalog-v2.js | 33 個穩定 role ID 的圖鑑來源，未知 ID 使用既有 fallback。 |
| public/catalog-ui.css | 僅圖鑑／翻卡的閱讀底層、標題、分類、名稱及背面閱讀樣式。 |
| public/index.html | 載入圖鑑樣式，標題／返回鍵並列與簡短翻卡提示。 |
| public/art/catalog-v2/ | 66 張另存的 WebP，原圖及舊衍生檔完整保留。 |
| public/sw.js、public/cache-manifest.js | cache v22-22，加入兩個核心檔及 66 個選用圖像；196 個素材雜湊。 |
| test/catalog-v2.test.js | 圖片 ID 完整性、原圖／線上來源隔離、66 檔案雜湊與快取分層。 |
| scripts/catalog-v2-ui.mjs | 新圖鑑響應式、33 角色、翻卡、返回、鍵盤、失敗降級及離線驗證。 |
| README.md、DESIGN.md、docs/catalog-v2-assets.json、本報告與證據 | 現況、規格、來源 SHA256、結果及回退。 |

## 修改邊界核對

已以 Git 與施工前基準比對：data.js、engine.js、night.js、identity.js、takeover.js、records.js、recap.js、timer.js、online.js、online-state.js、catalog-art.js、全部既有插畫、背景、技能 SVG 均未修改。

線上發牌卡保留既有 catalog-art.js 映射、卡背與外框；復盤仍使用 ROLE_DATA 原圖。本次不改遊戲機制、存檔 v22、回退、後端、Supabase、Realtime 或 Google Drive 的其他文件。Service Worker 的核心優先／每批兩素材／舊資產復用策略不變。

## 本機測試

Node.js v24.21.0，Edge／Playwright 桌面無頭瀏覽器。

| 實際指令 | 通過 | 失敗 | 跳過 |
| --- | ---: | ---: | ---: |
| 修改前 npm test | 987 | 0 | 0 |
| 修改後 npm test | 990 | 0 | 0 |
| node scripts/catalog-v2-ui.mjs | 107 | 0 | 0 |
| node scripts/ui-regression.mjs | 39 | 0 | 0 |
| node scripts/online-card-art-ui.mjs | 39 | 0 | 0 |
| node scripts/update-cache-manifest.mjs --check | 196 素材一致 | 0 | 0 |

- 圖鑑：320×568、375×667、390×844、430×932、390×480 短螢幕、844×390 橫向、768×1024、1440×900；另外 150% 根字級、Reduce Motion、鍵盤 Enter／Escape。所有角色小圖／大圖、完整技能文字、隱藏面 inert、背面最後內容與最末卡可點都實測。
- 完整 UI 回歸包含全部 29 款板子的主持操作、刷新、上一步與重新開局，以及既有圖鑑、警長及離線項目；56 個原素材離線讀取成功。
- 線上發牌卡測試使用虛構 API/Auth/Realtime adapter，未寫入真實房間；不能當成真人連線測試結果。
- 初次沙箱內 Edge 啟動受環境限制，沒有通過結果；在允許的本機環境重新完整執行。新測試初次在第 35 個案例後遇到測試提早 decode 懶載入圖片的競態，修正為等待 IntersectionObserver 的實際載入，再從頭完整跑出 107 項結果；沒有降低圖片路徑、尺寸、內容或遊戲規則斷言。
- 舊 scripts/liquid-glass-ui.mjs（固定 31 角色舊圖）與 scripts/cache-regression.mjs（固定 v17 快取）未執行；本輪對應檢查由新圖鑑與現行全站回歸執行，未把歷史腳本的存在當成通過。

本機原始結果見 [圖鑑](catalog-v2-evidence/local-results.json)、[全站](catalog-v2-evidence/regression-results.json)、[線上卡](catalog-v2-evidence/online-card-results.json)。

## 截圖

- [好人圖鑑](catalog-v2-evidence/local-library-good.png)
- [狼人圖鑑](catalog-v2-evidence/local-library-wolves.png)
- [魔術師新框／正面](catalog-v2-evidence/local-magician-front.png)
- [翻卡背面](catalog-v2-evidence/local-magician-back.png)

## 備份與安全回退

- 施工前完整 SHA：`340313c503c993a0bae849779758cd25944b9acf`。
- 遠端備份：`backup/pre-catalog-ui-20261025`；push 成功，git ls-remote 回讀指向相同 SHA。
- 所有既有歷史、素材、備份分支保留。修改只在 feat/eclipse-host-app，不合併 main。
- 回退採對本輪程式提交執行 git revert，再跑 npm test 及 UI 回歸，推送新提交發布。不要 reset --hard、force push 或刪除存檔。確切提交與指令於發布完成後補入下節。
- Drive 的魔術師與規格表保留原 ID，可使用 Drive 版本歷史回復；新增九張不需為網站回退而刪除。

## 待驗收

**未驗收／待真機驗收**：iPhone Safari、安裝式 iOS PWA、Android、低階裝置、實際動態網址列、安全區及雙指縮放。桌面觸控／尺寸模擬不代表真機通過。此次沒有執行真人 Supabase 多人連線。

## 發布狀態

本機驗收完成，待本輪提交與 GitHub Pages 發布，再補入提交 SHA、Actions 連結與正式站驗證。
