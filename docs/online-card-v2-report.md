# 線上角色卡正面同步新版插畫

2026-10-26（台北）；工作分支 `feat/eclipse-host-app`。

## 原因及修正

線上翻牌原本仍呼叫 catalogImage()，讀取舊 catalog-clear 圖源；新版圖鑑及復盤已使用 catalog-v2，因此正面人物停留在上一套插畫。這不是 Supabase 替角色指定了舊圖片。

透過使用者標記的 Supabase 連線唯讀核對：`room` Edge Function 為 ACTIVE／version 3，將操作傳給 wolfcue_command；實際 wolfcue_private.command 的 my_role 分支確認房間已發牌、當前使用者及座位 lease，回傳 seat、role、dealId、boardId，沒有插畫 URL。本輪只讀取函式定義，沒有修改資料、角色分配、Auth、RLS、Realtime、Edge Functions 或部署後端。

修正 online.js 的正面圖源為 libraryImage()，依伺服器已確認的職業 ID 使用 catalog-v2 的 33 張完整插畫。保留原線上卡框、底色、尺寸、90% 圖片區、contain、職業文字、卡背與翻牌；沒有新增或重畫人物、沒有改 CSS／卡片布局。新圖載入失敗時沿原機制只退回一次既有原圖。

權限確認、請求票號、背景蓋牌、重新同步與角色隔離邏輯不變；只有 my_role 成功後才建立正面。蓋牌仍清空正面，未確認權限不顯示人物或名稱。既有房間、座位與發牌結果不重建、不重發；仍在對局的頁面於重新整理後載入新圖源。

## 修改檔案

| 檔案 | 差異 |
| --- | --- |
| public/online.js | 新增 catalog-v2 匯入，只更換角色圖片解析式。 |
| public/catalog-v2.js、public/catalog-art.js | 註解分清新版共用圖源與舊素材 fallback；映射與檔案未改。 |
| public/sw.js | council-v22-29；核心與素材清單、漸進策略不變，存檔仍 v22。 |
| scripts/online-card-art-ui.mjs | 全 33 位角色核對新版 full 圖源，保留原卡框／卡背與隱私斷言，缺圖測試改為阻擋新版 WebP。新增兩位覺醒角色截圖。 |
| test/catalog-v2.test.js | 測試名稱改為「保留原畫及歷史透明素材」；所有原始雜湊、映射及 fallback 斷言保留。 |
| README.md、DESIGN.md、本報告與證據 | 新現況、測試與回退；歷史報告不覆寫。 |

已比較修改前 SHA：online.css、liquid-glass.css、style.css、b3.css、engine.js、night.js、records.js、recap.js、data.js、online-state.js、全部 art／skills、backend 均未修改；main 與 Google Drive 未修改。

## 實際測試

| 指令 | 通過 | 失敗 | 跳過 |
| --- | ---: | ---: | ---: |
| npm test | 1108 | 0 | 0 |
| node scripts/online-card-art-ui.mjs | 39 組 | 0 | 0 |
| node scripts/update-cache-manifest.mjs --check | 196 資產一致 | 0 | 0 |

39 組包含：390px 全 33 位角色、320／430px 的預言家、新圖可解碼、來源／名稱／陣營色與原卡框／尺寸不變、蓋牌清空、三種尺寸的權限拒絕維持蓋牌，以及缺圖 fallback。完整測試仍涵蓋現有規則、存檔、回退及角色圖源雜湊。

UI 使用隔離瀏覽器及虛構 Auth／Realtime／API adapter，只針對已部署前端的角色呈現作驗證，不寫入雲端房間；為核對全部角色而輪換虛構 role，不代表任一板子的實際配牌配置。未重新執行全站 29 板 UI 或真人多玩家發牌，不將先前結果列為本次重測。

原始結果：[完整測試摘要](online-card-v2-evidence/unit-results.json) · [本機 39 組](online-card-v2-evidence/local-results.json)。

截圖：[原卡背](online-card-v2-evidence/local-back.png) · [預言家](online-card-v2-evidence/local-seer.png) · [狼人](online-card-v2-evidence/local-wolf.png) · [覺醒狼美人](online-card-v2-evidence/local-awakenedBeauty.png) · [覺醒獵人](online-card-v2-evidence/local-awakenedHunter.png)。

## 待驗收

iPhone Safari、安裝式 iOS PWA、Android、低階裝置仍為 **待真機驗收**。本輪沒有重新操作真實房間或發牌。先前已開啟的頁面需要重新整理才會載入新 JavaScript；不需要清除存檔或重新發牌。

## 備份與回退

- 修改前完整 SHA：`2875b9b485bf904b20ee4b89d86d1ae3b9482c00`。
- 遠端備份：`backup/pre-online-card-v2-20261026`，已重新核對指向相同 SHA，既有所有備份保留。
- 使用本輪功能提交的 git revert 建立回退提交，重測後正常推送部署；不 reset、不 force push、不清除房間或玩家資料。發布後補上完整功能 SHA。

## 部署

本機檢查完成後發布，正式站的同一套 39 組 UI、檔案雜湊及發布紀錄於完成後補入。
