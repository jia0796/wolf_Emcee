# 狼序 WolfCue｜B3 R10～R16、逐人投票自動跳號與部署報告

2026-10-19。[正式App](https://jia0796.github.io/wolf_Emcee/) · [逐項驗證原始結果](b3-r10-r16-validation.json) · [上一輪報告](b3-r01-r09-report.md)。

## 版本、規格與備份

- 指定工作分支 `feat/b3-arctic-ui-20261019`；開始本機HEAD為748cc40，僅快轉取得fc50925／4af260d兩筆最新規格提交，改App前基準為 `4af260d338cc7e889c0a3d03eae77f469b982034`。
- 指定遠端文件備份 `backup/pre-b3-r10-r16-docs-20261019` 已確認存在，指向 `748cc40429d7e9bd928fce07343d468f23174995`，沒有改動。
- 改App前另外建立並推送 `backup/pre-b3-r10-r16-implementation-20261019` → `4af260d338cc7e889c0a3d03eae77f469b982034`，重新核對遠端指向後才施工。
- 已閱讀本分支最新README／DESIGN，以及Drive「月下議會/App介面/README.md」完整內容與第三輪R10～R16（modified 2026-10-19T14:59:19.305Z）。格式參考[google-labs-code/design.md](https://github.com/google-labs-code/design.md)。未改DESIGN、Drive原稿、main或舊開發分支。
- 最終正式站程式 `bdc33fe26de000f5b5554a4dd396b9f746afcf70`，[Pages發布39277460295成功](https://github.com/jia0796/wolf_Emcee/actions/runs/39277460295)。未合併main／feat/eclipse-host-app；發布暫時新增的精確B3分支規則已刪除，原4項限制完整恢復。

## R10～R16逐項結果

| 編號 | 狀態 | 實作與驗證 | 程式檔案 |
|---|---|---|---|
| R10 | 已實作／桌面及線上通過 | 三行資訊；34px視覺與44px實際熱區，雙欄、換行及滾動保留 | `public/index.html`, `public/b3.css` |
| R11 | 已實作／桌面及線上通過 | 完整2px選取框、警上角標與文字、退水弱框；原資格及疊加狀態保留 | `public/b3.css` |
| R12 | 已實作／桌面及線上通過 | 全部投票冰藍；無顯式棄票，原引擎驗證、票權、PK及復盤保留 | `public/b3.css`, `public/vote-ui.js` |
| R13 | 已實作並補修暖色偽元素／桌面及線上通過 | 主持陣營色一致、65%冷冰藍；移除舊金棕::after，人物/邊框/模型不改 | `public/b3.css` |
| R14 | 已實作／桌面及線上通過 | 安全冰藍、離局霧玫紅；文字、順序及確認資料處理不改 | `public/b3.css` |
| R15 | 已實作／桌面及線上通過 | 選板外層42%／列卡34%；實測computed alpha、合成與無blur模擬 | `public/b3.css` |
| R16 | 已實作／桌面及線上通過 | 9種名稱／17個10/12配置；穩定ID、角色及房規原樣 | `public/data.js` |

全項真機仍待驗收，表中通過限模型、桌面Edge與正式站自動化。

### 依後續對話新增：逐人投票自動前進

一般放逐、警長選舉、警長PK／重投、放逐PK／重投全部適用。選中目標後按合法投票者順序往後找**尚未記錄**的人；尾端找不到就回最前面的未投票者。已有選票及已記為棄票者都略過。取消選取停留原位，再次選中繼續前進；全部完成就停留，不自動提交。上一位／下一位保留，未選目標按下一位仍可記棄票。多人模式繼續保留原本複選操作，兩模式共用同份草稿。

`selectIndividualVote()`僅編輯UI草稿並計算顯示索引；`completeVoteDraft()`用複本將未分配合法選民交給既有`setBallot()`記棄票，再走原`submitVote()`。取消或空統計拒絕時不產生正式紀錄。沒有修改votes.js、資格、票權、最高票／平票、強制預選、PK或復盤引擎。

### R13補修：金棕疊層與插圖

最初只檢查主背景已是65%冷冰藍，漏掉舊`.event-card::after`的金棕漸層。依使用者指出補查後，以`#finished .recap-event::after { background:none }`只清除暖色背景，未改偽元素位置、邊框、人物融合、時間軸或資料。

最終本機及正式站均驗證主底色`rgba(27,49,66,.65)`、卡片opacity=1，`::after`背景圖片為none、底色透明。神職名稱的原金色語意、原始PNG／SVG色彩、勝負標題及時間軸保留。14處示範復盤原畫全部載入成功後才截圖；原人物、職業、技能與座號仍依原欄位顯示。

### R15透明度與降級

實際computed外層42%、板子列卡34%，內容opacity=1。兩層均勻填色合成為`1-(1-.42)*(1-.34)=61.72%`，另有原有高光、背景遮罩及模糊，沒有把它說成整體只有34%。不支援blur的已寫樣式採外層78%、列卡60%深藍以保護文字；以改寫測試端supports條件驗證這條降級路徑，**不是Safari真機通過**。其他頁面玻璃透明度未改。

### R16名稱與相容性

九種板子名稱在兩人數系列共17個現有配置套用，僅替換name／canonicalName／shortLabel；角色名稱「血月使者」等完全未改。

| 顯示名稱 | 穩定board ID |
|---|---|
| 黑狼王 / 魔術師 | 10、12 |
| 黑狼王 / 守衛 | kingGuard10、kingGuard12 |
| 黑狼王 / 攝夢人 | kingDream10、kingDream12 |
| 惡靈騎士 / 守衛 | evilKnight10、evilKnight12 |
| 血月 / 獵魔人 | blood10、blood12 |
| 夢魘 / 攝夢人 | nightmare10、nightmare12 |
| 機械狼 / 通靈師 | mechanical10、mechanical12 |
| 覺醒石像鬼 / 守墓人 | gargoyle10、gargoyle12 |
| 狼兄狼弟 / 黑市商人 | brothers12 |

12人清單、設定、主持、房規與恢復後名稱已逐筆驗證。舊局仍用boardId解析，歷史與事件內容不重算；原復盤沒有板名欄位，因此不為本輪增加新欄位。

## 修改檔案與提交

| Commit | 用途 |
|---|---|
| e666233a58aabaa04cf116ae123f3f25d2522a8f | R10/R11/R13/R14/R15視覺、原操作DOM分行與R16穩定ID名稱 |
| 7eb8de7a09df31bebf437a662f407a4dc492a532 | R12隱式棄票、全投票逐人自動跳號、精準測試與快取資源版號 |
| 3cc5b1444825a2909f8276bb334653ccee404c50 | 原復盤插圖載入完成後才拍驗收截圖 |
| bdc33fe26de000f5b5554a4dd396b9f746afcf70 | 移除漏掉的金棕偽元素背景，補強實際疊層斷言 |

- `public/b3.css`：本輪指定外觀、背景alpha、狀態與熱區；只移除復盤暖色背景疊層。
- `public/index.html`：原operationCard/actions外加視覺列容器；投票者標示加aria-live，不改事件或字幕。
- `public/data.js`：穩定ID映射九種顯示名稱，不改板子結構。
- `public/vote-ui.js`：移除可點棄票選項，使用原投票函式；加入已確認的逐人跳號及對應操作提示。
- `public/sw.js`：**確有碰觸，只將CACHE資源版號v22-8→v22-9**，讓已安裝App能取得本輪CSS／JS；策略、資源清單、下載批次、演算法及存檔版本全未改。
- `scripts/b3-r10-r16-ui.mjs`：50組幾何、狀態、全部票型、自動跳號、偽元素、原圖、名稱及恢復驗證。
- `scripts/b3-ui.mjs`：原B3復盤斷言補查偽元素，沒有削弱原順序或資料驗證。
- `scripts/b3-r01-r09-ui.mjs`：選取框斷言按R11改為2px，其餘舊回歸保留。
- `scripts/vote62-ui.mjs`：逐人路徑按新自動跳號操作，保留原票權、結果、取消、草稿、回退及復盤斷言。
- `test/b3-r10-r16.test.js`：新增14項精準測試，涵蓋26板非顯示資料不變、原角色、穩定名稱、歷史、4種投票與自動跳號。
- `test/fixtures/b3-r16-baseline.json`：修改前26板移除顯示名後的結構雜湊與角色原稿雜湊。
- `test/vote-navigation.test.js`：僅按R12更新可見候選序列，原計票／資格答案保留。
- `docs/b3-r10-r16-report.md`、`docs/b3-r10-r16-validation.json`、`docs/b3-r10-r16-screens/`：本報告、實跑證據與正式站截圖。
- `README.md`：最後統整目前版本、R10～R16完成狀態、自動跳號、測試及回退索引，從428行精簡為186行。
- `docs/vote62-spec-history.md`、`docs/b3-r01-r09-spec.md`、`docs/b3-r10-r16-spec.md`：完整保留原定稿與歷史紀錄，標明目前實作報告與最新UI優先順序，沒有刪除遊戲規則。

差異核對：只有上述5個public檔案改動；app.js原事件、engine／night／votes／records／recap／timer及其他技能模組未改。113份art／skills原檔逐位元組相同，含全部26技能SVG與正式背景。26板扣除三個顯示欄位的結構雜湊相同，ROLE_DATA原文相同。存檔仍v22，原localStorage鍵與歷史完整保留；沒有資料清除或遷移版本變動。

## 實際測試與部署後驗收

環境：Windows／Playwright headless Edge；GitHub Actions Node22。桌面模擬不是iPhone／Android真機。腳本的「組」不混加為單元測試數。

- `STRESS_SEEDS=18 npm test`：主功能7eb8de7版**824通過、0失敗**，26板×18局共468局；最後僅修復盤CSS偽元素。
- `STRESS_SEEDS=2 npm test`：最終bdc33fe版**824通過、0失敗**，共52局；Pages的原Verify host rules亦成功。
- 完整瀏覽器7eb8de7版：**36組、26板、2327次操作**；最終CSS修復後重跑專項、B3、長局與單元及正式站全套如下。沒有把中斷的前輪算通過。

| 實際指令 | 環境／程式版本 | 結果 |
|---|---|---|
| `node scripts/b3-r10-r16-ui.mjs` | local/bdc33fe | 50組通過／0頁面錯誤 |
| `B3_STAGE=final node scripts/b3-ui.mjs` | local/bdc33fe | 32組通過／0頁面錯誤 |
| `UI_PORT=5396 node scripts/ui-regression.mjs` | local/7eb8de7 | 36組通過／0頁面錯誤 |
| `node scripts/vote62-ui.mjs` | local/7eb8de7 | 32組通過／0頁面錯誤 |
| `node scripts/ui56-ui.mjs` | local/7eb8de7 | 13組通過／0頁面錯誤 |
| `node scripts/timer-review-ui.mjs` | local/7eb8de7 | 6組通過／0頁面錯誤 |
| `node scripts/takeover-ui.mjs` | local/7eb8de7 | 15組通過／0頁面錯誤 |
| `node scripts/complete-recap-ui.mjs` | local/bdc33fe | 5組通過／0頁面錯誤 |
| `node scripts/b3-r01-r09-ui.mjs` | local/7eb8de7 | 22組通過／0頁面錯誤 |
| `UI_BASE=<正式站> node scripts/b3-r10-r16-ui.mjs` | live/bdc33fe | 50組通過／0頁面錯誤 |
| `UI_BASE=<正式站> B3_STAGE=final node scripts/b3-ui.mjs` | live/bdc33fe | 32組通過／0頁面錯誤 |
| `UI_BASE=<正式站> node scripts/vote62-ui.mjs` | live/bdc33fe | 32組通過／0頁面錯誤 |
| `UI_BASE=<正式站> node scripts/ui56-ui.mjs` | live/bdc33fe | 13組通過／0頁面錯誤 |
| `UI_BASE=<正式站> node scripts/timer-review-ui.mjs` | live/bdc33fe | 6組通過／0頁面錯誤 |
| `node scripts/verify-deployment.mjs` | live/bdc33fe | 5組通過／0頁面錯誤 |

- `node scripts/update-cache-manifest.mjs --check`：94項素材摘要吻合；JS語法與git diff --check通過。專案沒有獨立build或TypeScript指令，不宣稱跑過不存在的檢查。
- 正式站40檔對最終Git blob全部相同；含改動檔、原引擎、三張正式背景及26SVG。
- 幾何驗證含320／375／390／430px、320×480短屏、844×390橫向、平板、150%／200%字級、模擬safe-area、Reduce Motion。一般放逐最後候選與投票者可直接點；警長／PK沿用原布局並通過原回歸。
- 長局40晚／40天、五種視窗與放大字體通過；正式站確認原圖載入與暖色偽元素清除。

## 遇到的問題、修復與重跑

1. 首次沙箱無法啟動Edge，未列通過；以獨立隔離瀏覽器完整重跑。
2. 新三行測試最初在空選取時量測被隱藏的結果列而失敗；改為實際選9號後保留原三行與熱區斷言，完整通過。
3. 使用者加入自動跳號需求後，中止兩輪進行中的26板／專項，不列通過；最終7eb8de7完整26板36組及2327操作重新完成。
4. 舊逐人測試的手動下一位步驟按新定稿改成自動跳號／取消停留，但票權、候選人、結果、草稿、回退及復盤答案保留。
5. 最初復盤截圖過早，原圖未載入；14處原圖請求實查成功，新增等待原圖後截圖及尺寸斷言，沒有修改原畫或融合版型。
6. 使用者指出仍偏古金：主背景量測漏查event-card::after的舊金棕漸層；bdc33fe僅清除該背景疊層，新增偽元素透明斷言後重跑50專項、32B3、長局、824單元及所有線上驗證。

## 規格衝突、限制與待辦

沒有更改遊戲規則的未解衝突。依原引擎，一般放逐全棄票可保存但不自行產生放逐結果；警長／PK無有效票仍拒絕完成統計，保留原手動／平票處理，沒有自行創造新判定。移除棄票鍵及自動前進都由UI草稿實現。

**待真機驗收**：iPhone Safari、iOS安裝PWA、Android、低階裝置，含動態網址列、Home Indicator／瀏海、慣性／巢狀捲動、實際雙指縮放、防雙擊差異、玻璃效能與舊已安裝App更新。六項既有角色原圖比例／框色例外仍見[前輪清單](b3-r01-r09-portraits.json)，本輪未改原畫。大容量長局儲存風險仍維持原限制。

建議下一輪優先真機及弱網初次載圖驗收；這些是待驗收項目，未額外擴充玩法、插圖或UI版型。

## 正式站截圖

[三行操作](b3-r10-r16-screens/compact-390x844-100.png) · [座位狀態](b3-r10-r16-screens/states-390-1.png) · [選板玻璃](b3-r10-r16-screens/boards-390x844-100.png) · [離局警示](b3-r10-r16-screens/leave-warning.png) · [冷冰藍復盤與原插圖](b3-r10-r16-screens/recap.png)

## 安全回退

備份保留完整修改前App與全部歷史。以下新增反向提交，不重置或覆寫後續工作：

```powershell
git fetch origin
git switch -c revert/b3-r10-r16 origin/feat/b3-arctic-ui-20261019
git revert --no-edit bdc33fe 3cc5b14 7eb8de7 e666233
npm test
```

若後續提交有衝突，逐檔保留後續工作後重測；不要reset --hard或force push。只想查看原始版本，可從`origin/backup/pre-b3-r10-r16-implementation-20261019`建立新分支，不能修改備份。

回退後網站需另將測試通過的還原分支依原deploy.yml發布；不必合併main。README／本報告為獨立文件提交，可另更新當前狀態，歷史報告保留。本輪未實際部署演練回退，不冒稱回退驗收通過。
