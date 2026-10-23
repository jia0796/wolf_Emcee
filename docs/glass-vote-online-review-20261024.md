# 玻璃介面第三階段：投票、線上房間與背景搭配

日期：2026-10-24。接續第二階段首頁／主持玻璃材質，兩輪成果共存於本機預覽。使用者補充希望「背景跟按鍵搭配」，因此線上房間採用柔化的新背景，並讓按鍵透出場景、呼應冷藍月光與少量暖色燈火。尚未推送、部署或操作正式房間。

## 基準與修改範圍

- 分支：`feat/eclipse-host-app`。
- 修改前 HEAD：`04c48ed80614313ddbc358ae5ec76f8b7c7a788e`，已含上一輪首頁／主持修改。
- 本機備份：`backup/pre-glass-vote-online-20261023-01`，已核對指向上述 SHA。
- 上一輪報告：`docs/glass-home-host-review-20261023.md`。該報告中的「下一階段投票／線上房間尚未施工」是當時狀態，本報告記錄其後完成內容。

| 檔案 | 修改用途 |
| --- | --- |
| `public/b3.css` | 沿用上一輪材質變數；投票模式、候選人摘要、選民選中狀態、主要操作及鍵盤焦點更清楚。 |
| `public/online.css` | 線上按鍵的場景反光、透明底色、細高光及無 blur 降級；保留選位幾何、原色彩語意及文字。座位回饋只變透明度，不移動。 |
| `public/art/backgrounds/online-plaza-v4.png` | 新增較柔和的村莊廣場背景；原 v3 完整保留。 |
| `public/b3-ui.js` | 只替換線上畫面背景路徑，其他頁面背景不變。 |
| `public/sw.js` | 快取名稱 `council-v22-14` → `council-v22-15`，將新圖加入既有選用資源清單；CORE、漸進下載及離線演算法不變。 |
| `public/cache-manifest.js` | 由原腳本重建 97 個資源版本。 |
| `test/b3-ui.test.js` | 線上背景路徑斷言改成正式採用的 v4；其他斷言保留。 |
| `scripts/glass-vote-online-ui.mjs` | 修改前後幾何比較、四類投票、線上房間模擬、小螢幕、大字、失敗／延遲背景及離線測試。 |
| 本報告 | 範圍、素材、參考依據、測試及回退紀錄。 |

沒有修改遊戲引擎、角色資料、主持步驟、投票業務程式、計時器、復盤、存檔、回退歷史、線上房間 API 或 Supabase。存檔版本維持原樣。原人物插畫、技能 SVG、翻牌正反面均未修改。

## 參考資料如何使用

使用者選擇的四個技能已安裝至 `C:/Users/laptop/.codex/skills/`：`ui-ux-pro-max`、`web-design-guidelines`、`game-feel`、`webapp-testing`。本輪已讀取內容並使用；不需要為此更換 WolfCue 的原生 JavaScript 架構。

| 參考 | 本輪採用 |
| --- | --- |
| [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | 使用其搜尋工具查焦點可見性、觸控目標與回饋；區分選中／一般／主要操作，保留現有熱區。 |
| [Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines/blob/main/command.md) | 焦點放在可見內緣、文字及狀態標籤保留、捲動末列可操作、Reduced Motion。 |
| [Game Feel](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/b105e1cf617adf0b68ed98790a716bbb60993179/skills/disciplines/game-feel/SKILL.md) | 將回饋限於短暫光線變化；座位不位移，不增加操作等待、音效或阻塞動畫。 |
| [Webapp Testing](https://github.com/anthropics/skills/blob/main/skills/webapp-testing/SKILL.md) | 使用真實頁面 DOM、Playwright 操作及截圖；先確認原行為再改視覺，保留可重現結果。 |
| [Higgsfield Websites](https://github.com/higgsfield-ai/skills/blob/d071406147a37b835bed09543d85ab3e9bd85c7d/higgsfield-websites/SKILL.md)、[Expo Skills](https://github.com/expo/skills) | 參考視覺整合與行動裝置考量；未引入它們的生成部署流程或原生框架。 |

## 背景與按鍵

新圖由內建 ImageGen 編輯原 `online-plaza-v3.png`，未使用其他網路圖片。編輯要求：保留直立構圖、左側木造建築、右側教堂階梯、中央海港與遠山、旗幟、廣場石路及角落座椅；以藏藍與冰藍統一藍調時刻，保留克制的暖色窗光，降低中央操作範圍高反差與碎亮反射；不加入人物、文字、UI 或新物件，不裁切構圖。

生成檔複製至 `public/art/backgrounds/online-plaza-v4.png`，大小 2,522,245 bytes；SHA256：`b3b788d401d192311cf45dcff438c409ab1b5bec670048fa99627186c342c75f`。原圖未覆寫。

按鍵沿用冰藍色與原位置，加入冷藍斜向反光、低強度暖光、頂部細高光。線上一般按鍵底色 alpha 0.56，無 blur 時降級 0.88；文字未套用整體透明度。主要發牌按鍵保留原資格與操作；未滿員按鍵修正深色文字對比，但沒有改為新的禁用機制。沒有增加點狀裝飾。

## 實際驗證

| 指令／檢查 | 結果 |
| --- | --- |
| `npm test` | 946 通過、0 失敗、0 跳過、0 取消；既有 28 板子模擬及原素材核對在內。最終日誌 `npm-test-final.log`。 |
| `node scripts/host01-03-ui.mjs` | 41 組通過、0 失敗。 |
| `node scripts/glass-vote-online-ui.mjs before` | 30 組基準通過。 |
| `node scripts/glass-vote-online-ui.mjs after` | 最後一次按鍵調整後重跑：34 組通過、0 失敗，pageerror 為空；30 組幾何與修改前一致。 |
| `node scripts/update-cache-manifest.mjs --check` | 97 資源版本核對通過。 |
| `git diff --check` | 通過。 |

介面矩陣：320×568、375×667、390×844、430×932、844×390，每個尺寸包含一般放逐、警長選舉、警長重投、放逐重投，以及線上主持／玩家畫面。驗證選民末列點擊、取消、模式切換、前後導航、對話框關閉、鍵盤焦點、座位按壓不移位、入座顯示、圖鑑進出。

另四組涵蓋 320px／200% root 字級末列與完成按鈕、背景延遲不閃舊圖、背景失敗仍可操作、Reduced Motion，以及實際本機 Service Worker 離線取得 App 與新圖。離線測試不代表 iOS 安裝 PWA 真機驗收。

線上畫面使用合成 API 與 Realtime adapter，真實 Supabase 請求被攔截；沒有建立正式測試房間。這些測試驗證前端互動，不證明後端授權、多使用者同步或真實發牌安全。舊的本機 Supabase 專用測試及過時的 `vote62-ui.mjs` 沒有執行，不列為通過。

首次建立基準時，測試程式曾點擊第一位選民的禁用「上一位」而超時；修正操作順序後完整重跑通過，未修改 App 功能來遷就測試。原始失敗證據仍保留。

## 截圖與限制

原始結果位於專案外 `../wolfcue-ui-review-20261023/vote-online/`：

- `before/results.json`、`after/results.json`：幾何及驗收結果。
- `after/online-host.png`、`after/online-player.png`：新版背景與按鍵實際畫面，使用虛構房號與座位。
- `after/*-batch.png`、`after/*-individual.png`：四類投票兩種模式。
- `host-regression/results.json`、`npm-test-final.log`：完整結果。

本輪與上一輪整合保留；圖鑑／復盤材質後續階段未施工。視覺對比已人工檢視，但沒有宣稱全站 WCAG 對比稽核通過。iPhone Safari、iOS 安裝 PWA、Android、低階裝置、動態網址列及真實系統大字均待真機驗收。

## 安全回退

本報告所在提交即本輪實作提交，可查：

```sh
git log --diff-filter=A --format=%H -- docs/glass-vote-online-review-20261024.md
```

工作樹乾淨時用 `git revert <本輪實作提交SHA>` 產生回退提交，保留後續歷史。若與後續 CSS 或資源版本衝突，逐項處理，再執行快取清單產生器；正式發布回退時應使用新的快取版本。不要 reset、force push 或覆寫備份分支。

完整前版仍在 `backup/pre-glass-vote-online-20261023-01`，其中已包含上一輪首頁／主持材質。本輪尚未發布正式站。
