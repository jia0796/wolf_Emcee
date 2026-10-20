# 線上發牌 Beta、背景閃現與圖鑑入口修正

2026-10-21。分支 `feat/online-deal-20261020`，沒有合併 main。

程式提交：`9bffd96827d145aa7d19d3e749be585a5d1ff4a1`；最後按鈕順序提交：`7af2cc8bfe02045ed9b381de15e5401126f8befc`。

[正式網站](https://jia0796.github.io/wolf_Emcee/) · [Pages 成功發布](https://github.com/jia0796/wolf_Emcee/actions/runs/39453374951) · [正式站驗證資料](online-background-evidence/live.json)。

## 已完成

- 修正剛進入線上發牌頁會閃出舊背景：新背景未就緒時清除上一頁場景，同時取消線上頁的 legacy 圖片備援，只顯示原深藍底色；載入後直接顯示村莊廣場。等待期間不阻擋按鍵。
- 重新整理、前景恢復及載入失敗也不復活舊場景。離開線上頁後才完成的過期圖片，不覆蓋目前頁面。
- 入口改名「線上發牌（Beta版）」，建立／加入時的初始標題同步。
- 線上主持房間新增圖鑑入口，沿用一般房間的陣營分類、角色卡與翻卡；玩家的「本板子圖鑑」改為「圖鑑」。
- 主持房間右上順序依最後指示為 **圖鑑 → 解散房間**。玩家右上只有圖鑑。
- 主持人正在閱讀角色預覽時，若另一分頁確認發牌，會關閉預覽並進入原主持流程。玩家端同樣維持發牌後蓋牌。

## 修改檔案

| 檔案 | 用途 |
|---|---|
| `public/b3-ui.js` | 線上入口清除前一場景，前景恢復時不啟用尚未載入的圖層 |
| `public/online.css` | 線上頁取消舊底圖備援、圖鑑與解散按鈕位置 |
| `public/online.js` | 主持圖鑑、兩端名稱、最終順序、發牌時關閉主持預覽 |
| `public/index.html` | 線上發牌（Beta版）入口文字 |
| `public/sw.js` | 更新至 `council-v22-12`，快取策略未改 |
| `test/b3-ui.test.js` | 明確驗證線上頁使用村莊廣場來源 |
| `backend/scripts/online-background-ui.mjs` | 延遲／失敗背景、返回圖鑑、刷新、前景恢復與傳統日夜流程測試 |
| `backend/scripts/online-feedback-ui.mjs` | 補測主持與玩家同時閱讀圖鑑時收到發牌 |
| `backend/scripts/live-online-background.mjs` | 真正 Pages／Supabase 上的背景、文字、排序及圖鑑操作驗證 |

遊戲引擎、規則、角色配置、投票、計時器、存檔、原畫與技能 SVG 未修改；Supabase schema／權限及 Edge Functions 未修改。

## 實際測試

| 測試 | 最終結果 |
|---|---|
| 本機 `npm test` | 824 通過、0 失敗；最新提交的 GitHub CI 亦成功 |
| `online-background-ui.mjs` | 24 通過、0 失敗、completed=true |
| `online-feedback-ui.mjs`，12 人 | 24 通過、0 失敗，含主持／玩家圖鑑遇到發牌 |
| `online-ui.mjs`，12 人 | 27 通過、0 失敗，含原按鍵開始發牌、角色隱私、刷新及正式終局 |
| `live-online-background.mjs`，正式站 | 18 通過、0 失敗、completed=true |

本機測試先以舊 CSS／背景元件成功重現 legacy 圖片閃現，再驗證新版本。圖片被延遲或拒絕時，仍可選座、開圖鑑與操作主持按鍵；每一個取樣到的線上頁畫格均不包含舊背景。傳統主持準備白天、天黑、上一步及刷新背景皆正常。

正式站另核對 5 個發布檔案與提交 SHA256 一致，並驗證 Beta 文字、主持入口及順序、玩家入口、圖片延遲期間與載入後畫面。使用新建虛構房間，測試完成後已解散。截圖在 `online-background-evidence/live-host.png`。

過程中正式站測試曾因截圖等待字體就緒超時，另一次放行背景後等待圖片完成超時，均未列為通過。改在放行圖片後截圖，並增加公開圖片請求追蹤後，重新完整執行上述 18 項，最後程序 exit 0。沒有刪除背景或操作斷言；第一次圖片等待超時的實際原因未取得足夠追蹤，不宣稱已證實為特定原因。

測試為桌面 Edge 與真實網頁；iPhone Safari／iOS Chrome／安裝 PWA 的真機首幀、切前景與弱網仍待實機驗收。若新圖確實下載失敗，預期維持深藍底色並保持可操作，不保證離線首次取得未快取圖片。

## 備份與回退

備份分支 `backup/pre-online-background-flash-20261020` 指向 `f692f380f44a9a42fb2c29ab2347824a86816f7e`。

安全撤回本輪：依序 `git revert 7af2cc8bfe02045ed9b381de15e5401126f8befc`、`git revert 9bffd96827d145aa7d19d3e749be585a5d1ff4a1`，檢查衝突及差異後推送發布分支。保留所有後續提交、資料庫及備份，不使用 reset 或 force push。
