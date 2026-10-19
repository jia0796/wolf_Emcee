# 狼序 WolfCue｜B3 R01～R09 修正與部署報告

日期：2026-10-19。[正式App](https://jia0796.github.io/wolf_Emcee/)；[逐項原始驗證](b3-r01-r09-validation.json)。本輪在既有B3增量修改，沒有重建App。

## 版本與保護

- 工作分支 `feat/b3-arctic-ui-20261019`；施工前 `409ec893a9466992583d30f004a7dc546c5b9a35`，先取得兩筆最新規格文件提交。
- 原文件備份 `backup/pre-b3-r01-r09-docs-20261019` 仍為 `8610b96e110061006da1f47d44698933a1fa4e26`。
- 新施工備份 `backup/pre-b3-r01-r09-implementation-20261019` 為 `409ec893a9466992583d30f004a7dc546c5b9a35`，改程式前已推送及核對遠端。沒有修改兩個備份。
- 依據本分支README／DESIGN與Drive「月下議會／App介面／README.md」第17章（讀取版本時間2026-10-19T11:23:27.721Z），格式參照[google-labs-code/design.md](https://github.com/google-labs-code/design.md)。DESIGN、Drive原稿與正式背景不改。
- 主實作 `59ba4a2cb2aa46bdd45111caa704adc5225d4d04`；最終修復 `add4a55328d349e30baaeb8bb53776841256751f`。
- [Pages 39252743867](https://github.com/jia0796/wolf_Emcee/actions/runs/39252743867)已成功發布最終修復。首次發布59ba4a2後發現真實備援層遺漏，修正再發布。
- 沒有合併、強推或重置main／feat/eclipse-host-app。每次發布僅暫增B3精確分支規則，完成後移除，已核對原4項限制恢復。

## 逐項狀態

| 項目 | 狀態 | 實作及驗證 |
|---|---|---|
| R01 | 已實作 | 提示／原SVG／技能名與小按鈕同區、同列優先及換行；座位維持雙欄 |
| R02 | 已實作 | 警上、退水、投票已選為1px冰晶框及文字；資格與狀態優先順序保留 |
| R03 | 已實作 | 僅一般放逐：得票大橫列＋下拉、獨立投票方格、冰藍勾選；原逐人棄票與底部導航不改 |
| R04 | 已實作 | 透明冰霧時間滾輪、冰藍刻線、月白數字與開始鍵；原模式／時鐘／動畫不改 |
| R05 | 已實作 | 底色alpha：首頁20%、座位48%、資訊68%、復盤65%；不把內容一起淡化 |
| R06 | 已實作 | 事件及最終身分中性65%玻璃；原畫無獨立小框融合、職業／技能資料分區 |
| R07 | 已實作；待真機驗收 | manipulation與pan-y pinch-zoom；保留原生滾動、縮放、焦點 |
| R08 | 顯示校正已實作；6項素材例外 | 30原畫完整contain、去額外藍框、逐角色位置；不可獨立移動點陣圖中的人物與框 |
| R09 | 已實作並修復實際備援層 | confirm日景與準備標籤；dark才夜景；回退、重整、冷啟與失敗均檢查真實CSS |

額外：問題回報文字水平／垂直置中，原href與44px觸控保留。依後續對話更名「狼序 WolfCue」，安裝簡稱「狼序」，新增冰藍狼首＋流程箭頭Logo，保留舊Logo。「開始主持」加強冰藍漸層、亮邊、柔光及字重，底色仍20%。

## 修改檔案及禁止範圍核對

- `README.md`：部署與測試完成後更新名稱、完成狀態、驗收限制及報告索引，保留歷史規格。
- `docs/b3-r01-r09-portraits.json`：30角色檢查與6項原稿例外。
- `docs/b3-r01-r09-report.md`：必要測試／視覺斷言或驗證報告與截圖。
- `docs/b3-r01-r09-screens/guard-390x844-100.png`：必要測試／視覺斷言或驗證報告與截圖。
- `docs/b3-r01-r09-screens/home.png`：必要測試／視覺斷言或驗證報告與截圖。
- `docs/b3-r01-r09-screens/ordinary-vote.png`：必要測試／視覺斷言或驗證報告與截圖。
- `docs/b3-r01-r09-screens/timer.png`：必要測試／視覺斷言或驗證報告與截圖。
- `docs/b3-r01-r09-validation.json`：必要測試／視覺斷言或驗證報告與截圖。
- `public/app.js`：呈現掛接、準備標籤、投票狀態文字及角色顯示ID，原處理器不改。
- `public/b3-ui.js`：純呈現準備階段映射與防夜景殘留。
- `public/b3.css`：R01～R09視覺、藍色主CTA與真實備援層。
- `public/data.js`：只改BRANDING.name。
- `public/index.html`：原操作節點移位、新品牌及Logo連結。
- `public/manifest.webmanifest`：名稱／Logo；App identity不改。
- `public/sw.js`：僅版號及三份新Logo資源，核心機制不改。
- `public/wolfcue-192.png`：原創SVG及192／512 Logo，保留舊圖標。
- `public/wolfcue-512.png`：原創SVG及192／512 Logo，保留舊圖標。
- `public/wolfcue.svg`：原創SVG及192／512 Logo，保留舊圖標。
- `scripts/b3-r01-r09-ui.mjs`：必要測試／視覺斷言或驗證報告與截圖。
- `scripts/b3-ui.mjs`：必要測試／視覺斷言或驗證報告與截圖。
- `scripts/timer-review-ui.mjs`：原測試增加正式站URL／輸出及有界導頁等待。
- `scripts/ui-regression.mjs`：必要測試／視覺斷言或驗證報告與截圖。
- `scripts/verify-deployment.mjs`：必要測試／視覺斷言或驗證報告與截圖。
- `scripts/vote62-ui.mjs`：必要測試／視覺斷言或驗證報告與截圖。
- `test/b3-refinements.test.js`：必要測試／視覺斷言或驗證報告與截圖。
- `test/b3-ui.test.js`：必要測試／視覺斷言或驗證報告與截圖。

- 13個業務／原樣式檔逐位元組未改，包含engine、night、records、votes、timer、recap、takeover及原style.css等。
- art／skills共113個已追蹤檔案Git差異為空，26技能SVG的SHA256完全相同。原畫、正式背景不改；只新增App Logo。
- data.js除了品牌字串完全相同；26板配置、房規、角色、字幕與文案未改。public/vote-ui.js未改，普通放逐自動棄票等沿用現有實作。
- 存檔仍v22，原儲存鍵及歷史保留。hostPresentation只從原phase／step／night產生UI標籤與背景；phaseOf、next、previous、canNext與結算未改。
- 快取資源版號由council-v22-6升至v22-8，僅變更版號與新增Logo三份CORE／ASSETS名單，以發布離線更新；既有漸進快取及清理演算法未改，不清空localStorage。
- 新透明度只作用底色；原死亡／未啟用／禁用的狀態淡化維持。沒有把文字、原圖或26SVG因玻璃Token一起淡化。

## 實際測試

環境為Windows／Playwright headless Edge，GitHub Actions Node22；不是Safari或Android真機。各腳本的案例「組」不是單元測試數量，不合併誇大總數。

- 主UI版 `STRESS_SEEDS=18 npm test`：810通過、0失敗，26板×18局＝468局；在最後Logo接入前完成，遊戲引擎未改。
- 最終修正後 `STRESS_SEEDS=2 npm test`：810通過、0失敗，26板×2局＝52局；最終Pages建置亦執行原npm test成功。
- 完整瀏覽器回歸：36組、26板、2327次流程操作，含重整、回退、重開與離線。完成於59ba4a2；之後僅修背景CSS及測試等待，另外重跑22專項、32B3與單元測試。

| 指令 | 環境／版本 | 結果 |
|---|---|---|
| `node scripts/b3-r01-r09-ui.mjs` | local/add4a55 | 22組通過，0頁面錯誤 |
| `B3_STAGE=final node scripts/b3-ui.mjs` | local/add4a55 | 32組通過，0頁面錯誤 |
| `UI_PORT=5394 node scripts/ui-regression.mjs` | local/59ba4a2 | 36組通過，0頁面錯誤 |
| `node scripts/vote62-ui.mjs` | local | 32組通過，0頁面錯誤 |
| `node scripts/ui56-ui.mjs` | local | 13組通過，0頁面錯誤 |
| `node scripts/takeover-ui.mjs` | local | 15組通過，0頁面錯誤 |
| `node scripts/fv57-ui.mjs` | local | 7組通過，0頁面錯誤 |
| `node scripts/complete-recap-ui.mjs` | local | 5組通過，0頁面錯誤 |
| `node scripts/timer-review-ui.mjs` | local | 6組通過，0頁面錯誤 |
| `UI_BASE=<正式站> node scripts/b3-r01-r09-ui.mjs` | live/add4a55 | 22組通過，0頁面錯誤 |
| `UI_BASE=<正式站> node scripts/vote62-ui.mjs` | live/59ba4a2 | 32組通過，0頁面錯誤 |
| `UI_BASE=<正式站> node scripts/ui56-ui.mjs` | live/59ba4a2 | 13組通過，0頁面錯誤 |
| `UI_BASE=<正式站> node scripts/timer-review-ui.mjs` | live/59ba4a2 | 6組通過，0頁面錯誤 |
| `UI_BASE=<正式站> B3_STAGE=final node scripts/b3-ui.mjs` | live/add4a55 | 32組通過，0頁面錯誤 |
| `node scripts/verify-deployment.mjs` | live/add4a55 | 5組通過，0頁面錯誤 |

- `node scripts/update-cache-manifest.mjs --check`：94項雜湊吻合；JS語法及git diff --check通過。沒有獨立build／TypeScript腳本，不宣稱執行不存在的檢查。
- 正式站46個檔案對Git blob全相同，含程式、新Logo、正式三背景及全部技能SVG。
- 尺寸含320／375／390／430px、320×480、844×390、平板、150%／200%字體、模擬safe-area與Reduce Motion；長名稱可換行，末列與問題回報可直接點。

## 發現的問題及處理

1. 新首頁20%被舊高優先級選擇器覆蓋成44%，修正限定首頁的選擇器，驗證實際底色。
2. 普通放逐舊!important紫框覆蓋冰藍，只在#exileVoteDialog覆寫，警長／PK保持原樣。
3. **R09真實遺漏**：早期只驗變數／裝飾層，部署後查出body::before固定shared夜景。add4a55修復主持備援層，cold／日景失敗測試新增檢查真正computed背景，不允許shared或host-night出現於準備階段。
4. 新測試fixture曾缺候選池及結束頁誤等host，只補fixture與正確screen，不改遊戲答案。舊框色／角色外框／選票底色斷言僅按定案更新；票權、結果與回退斷言保留。
5. 早期完整對局中斷沒有最終JSON，不計通過；以獨立port重新完整通過26板。
6. 線上計時器reload等待全部背景30秒逾時，只改測試為DOM可互動、90秒上限，原T01～T08斷言保留，重跑通過。
7. 初次線上原圖decode無期限等待已停止、不計成功；改90秒complete／原始尺寸檢查，最終仍完整驗證30張原畫。
8. 舊發布檢查曾誤把首頁legacy備援當成B3主景，試驗斷言已撤回；另一次發布切換中sw雜湊不同未列成功。最終穩定版本再次驗證通過。

## R08素材例外及待真機驗收

全部30角色均使用完整原圖、contain及逐角色顯示參數，見[b3-r01-r09-portraits.json](b3-r01-r09-portraits.json)。以下6項原稿差異保留，不冒稱已獨立移動人物與框：

- 覺醒石像鬼（gargoyle，1060×1484）：核准原圖為紫框；保留原稿，不擅自改為金框。
- 血月使者（blood，1086×1448）：原圖接近3:4，採頂部對齊並保留留白；上下框完全一致須另改原稿。
- 獵魔人（demon，1086×1448）：原圖接近3:4，採頂部對齊並保留留白；上下框完全一致須另改原稿。
- 混血兒（mixed，1089×1445）：原圖接近3:4，採頂部對齊並保留留白；上下框完全一致須另改原稿。
- 騎士（duelist，1054×1492）：原圖略高於5:7，置中完整顯示，不裁切外框。
- 覺醒預言家（awakenedSeer，1060×1484）：核准原圖為紫框；保留原稿，不擅自改為金框。

原框與人物是同一點陣圖，無法同時獨立移動又不改畫／裁切。可做的頂部／中央對齊已做；若要求完全一致構圖與框色，需另核准素材。本輪未製仿框或改原畫。

**待真機驗收**：iPhone Safari動態網址列、瀏海／Home Indicator、安裝iOS PWA、Android及低階裝置；含慣性捲動、實際雙指縮放／防雙擊差異、20px玻璃效能、原已安裝名稱／Logo更新時機。桌面模擬不能取代真機。使用者已授權先部署，不隱藏待驗收狀態。

本輪通過範圍未發現其他未修復遊戲回歸，不代表所有裝置／對局都已測完。歷史腳本沒有全部逐一執行，只列實跑項目。建議下一輪先做真機與6項素材審核，沒有自行擴充其他功能。

## 視覺截圖

[首頁](b3-r01-r09-screens/home.png) · [守衛內嵌操作](b3-r01-r09-screens/guard-390x844-100.png) · [一般放逐](b3-r01-r09-screens/ordinary-vote.png) · [計時器](b3-r01-r09-screens/timer.png) · [新Logo](../public/wolfcue-512.png)

## 安全回退

原始完整B3保存在施工備份 `409ec893a9466992583d30f004a7dc546c5b9a35`；文件備份8610b96也保留。新增反向提交保留後續歷史，不reset或force push：

```powershell
git fetch origin
git switch -c revert/b3-r01-r09 origin/feat/b3-arctic-ui-20261019
git revert add4a55 59ba4a2
npm test
```

後續有衝突時逐檔保留新工作後重測。報告／README是另一筆文件提交，回退App後另更新現況，不必刪歷史報告。查看原版可從施工備份建立新分支，不能修改備份本身。

網站回退以經測試還原分支手動dispatch既有deploy.yml，暫時精確允許該分支、成功後移除新增規則；不修改main或覆蓋備份。本輪沒有實際演練線上回退，以上是操作指南。
