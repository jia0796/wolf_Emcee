# 線上角色卡圖片更新｜2026-10-24

依使用者最後確認：保留原線上角色卡樣式，僅將內部角色圖換成圖鑑目前的去背版本。外框、底色、尺寸、下方職業名稱、卡背及翻牌不變。

## 修改

- `public/online.js`：使用現有 `catalogImage()` 及 `catalogFallback()`，只在既有伺服器角色確認成功後設定圖片。角色文字、權限、資料、翻牌及蓋牌流程不變。
- `public/catalog-art.js`：註解更新為圖鑑與線上卡共用；映射及行為不改。
- `public/sw.js`：快取版號升至 `council-v22-17`，確保既有 PWA 更新 JS；存檔仍 v22，快取策略／素材清單不改。
- `README.md`、`DESIGN.md`：記錄此輪圖片替換，修正前輪「線上仍用原圖」的過期描述。
- `scripts/online-card-art-ui.mjs`：以虛構房間驗證全部31角色、卡片原樣、蓋牌／角色確認失敗及原圖 fallback；不寫入 Supabase。
- `docs/online-card-art-evidence/`：結果與截圖。

沒有修改任何 CSS、人物圖檔、遊戲引擎、復盤、後端、真實房間或存檔格式。

## 回退

施工前 HEAD：`2f76a7e44f421e28605857c4799730e1f227cb24`；遠端備份 `backup/pre-online-card-catalog-20261024` 已推送，並以 ls-remote 核對相同 SHA。既有備份保留。

本機原檔另存於專案父目錄 `online-card-rollback-20261024/`，包含修改前 online.js、catalog-art.js、sw.js 與基準說明。

發布後可用 `git revert <本輪程式提交>` 撤銷此輪，不重置或覆寫後續歷史。若之後已有其他修改，處理衝突後再測試、提交。PWA 回退發布時使用新的快取版號，不清除玩家儲存資料。

## 實際驗證

- 本機線上卡 UI：**37 組通過、0 失敗、0 頁面例外**。390px 檢查全部31角色，320／430px 額外驗證預言家；33組圖片／原樣／蓋牌檢查、3組角色權限不明維持蓋牌、1組新圖失敗回原圖。
- 使用的是測試瀏覽器內虛構 API／Auth／Realtime adapter；不代表本輪完成真人連線或後端安全測試。
- 原 CSS 與卡背保留；每張卡驗證原1px外框、18px圓角、漸層底色、contain圖片、90%圖片高度及下方職業名稱。
- 完整 `npm test`：**949 通過、0 失敗、0 跳過、0 取消**；資源雜湊清單128項核對及 `git diff --check` 通過。
- 390px 卡背修改前後截圖 SHA256 完全相同，見 `online-card-art-evidence/back-comparison.json`。所有 CSS 檔無修改。
- 部署後結果於完成後補記；真機 Safari／iOS PWA／Android **未驗收**。

本機結果：`online-card-art-evidence/local/results.json`。
