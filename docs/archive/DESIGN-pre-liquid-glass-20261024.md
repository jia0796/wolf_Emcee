---
version: alpha
name: Moonlit Council — B3 Arctic Frost
description: "霜月司儀（原月下議會）狼人殺 PWA 北極冰霜視覺系統；B3-C01～C30 已有實作，R01～R09 第二輪 UI 修正定案、待施工及驗收。"
colors:
  primary: "#B2DBE5"
  on-primary: "#13212D"
  secondary: "#8CBACB"
  tertiary: "#F4F8F9"
  neutral: "#13212D"
  canvas: "#13212D"
  panel: "#20394B"
  panel-deep: "#1B3142"
  glass-edge: "#82ABBD"
  glass-home-button: "rgb(27 49 66 / 0.20)"
  glass-seat: "rgb(27 49 66 / 0.48)"
  glass-host-info: "rgb(19 36 52 / 0.68)"
  glass-recap: "rgb(27 49 66 / 0.65)"
  text-primary: "#F4F8F9"
  text-secondary: "#C8DBE6"
  wolf-semantic: "#F0A3B0"
  god-semantic: "#E8D09B"
  villager-semantic: "#C8DBE6"
typography:
  home-title:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Noto Sans TC, sans-serif"
    fontSize: 42px
    fontWeight: 700
    lineHeight: 1.15
  host-script:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Noto Sans TC, sans-serif"
    fontSize: 28px
    fontWeight: 650
    lineHeight: 1.35
  section-title:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Noto Sans TC, sans-serif"
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Noto Sans TC, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Noto Sans TC, sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
rounded:
  sm: 8px
  md: 12px
  lg: 18px
  xl: 22px
  pill: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.lg}"
    padding: 16px
  button-secondary:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: 12px
  button-selected:
    backgroundColor: "{colors.panel-deep}"
    textColor: "{colors.primary}"
    rounded: "{rounded.lg}"
    padding: 12px
  card-glass:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: 16px
  chip-phase:
    backgroundColor: "{colors.panel-deep}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.pill}"
    padding: 8px
  stage-script:
    backgroundColor: "{colors.panel-deep}"
    textColor: "{colors.text-primary}"
    typography: "{typography.host-script}"
    rounded: "{rounded.lg}"
    padding: 16px
  camp-wolf-label:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.wolf-semantic}"
    rounded: "{rounded.sm}"
    padding: 8px
  camp-god-label:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.god-semantic}"
    rounded: "{rounded.sm}"
    padding: 8px
  camp-villager-label:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.villager-semantic}"
    rounded: "{rounded.sm}"
    padding: 8px
  setup-wolf-glass:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.wolf-semantic}"
    rounded: "{rounded.lg}"
    padding: 16px
  setup-good-glass:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.god-semantic}"
    rounded: "{rounded.lg}"
    padding: 16px
  library-role-card:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: 8px
  preview-glass-face:
    backgroundColor: "{colors.panel-deep}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: 16px
  recap-event-glass:
    backgroundColor: "{colors.panel-deep}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: 12px
  recap-identity-glass:
    backgroundColor: "{colors.panel-deep}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: 8px
  dialog-focused:
    backgroundColor: "{colors.panel-deep}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xl}"
    padding: 16px

---

# 月下議會｜B3 北極冰霜設計系統

> 文件日期：2026-10-19。來源格式：google-labs-code/design.md（https://github.com/google-labs-code/design.md）。
>
> **狀態：B3-C01～C30 全部設計定案，尚未套入 App；程式實作、回歸測試與真機驗收仍待進行。**
> 本文件只新增設計規範，不代表任何 UI、遊戲邏輯或快取代碼已改動。
>
> 詳細施工規格與驗收：Google Drive／月下議會／App介面／README.md（上半部分）。
> 三張正式素材：https://drive.google.com/drive/folders/1EALymj05h4CNxQdnKgR8sOQiqlIBxsik

## Overview

### Brand and design intent

月下議會是給真人法官使用的狼人殺主持工具，核心重點是**保持每一步流程可操作、字幕清楚、票型與遊戲紀錄正確**。B3「北極冰霜」以深夜海岸、極光、冰晶、淡藍半透明玻璃為視覺母題；避免濃厚金紫裝飾、繁瑣光效與阻塞操作的電影式過場。

設計決策優先順序：
1. 原有遊戲流程、功能、字幕、可讀性、無障礙與回退相容性。
2. 既有 UI DOM 的位置、選項順序及互動方式。
3. 本文件明確標成定案的視覺 Token 與元件風格。
4. 由真機驗收決定尚未精確定案的透明度、間距、字級等實作值。

所有一般按鈕與互動焦點採冰藍；狼／神／民語意色例外。技能 SVG 的色彩與外形必須維持既有核准版本。目標分支為 jia0796/wolf_Emcee 的 feat/eclipse-host-app，不能直接改 main 或舊備份。

### Decision register — approved

| ID | Chosen scheme | Required behavior |
| --- | --- | --- |
| B3-C01 | A 純冰霜藍 | 普通操作元件冰藍，無泛用金紫裝飾 |
| B3-C02 | C 極光透明玻璃 | 深藍極光玻璃、約 68% 初始底色、blur 20px 基準 |
| B3-C03 | C 極光雙層玻璃 | 深藍次要、冰藍主要 CTA、亮邊內光選中態 |
| B3-C04 | B 冰霜調和陣營色 | 狼 #F0A3B0、神 #E8D09B、民 #C8DBE6 |
| B3-C05 | 原始 26 SVG 全保留 | 絕不換色、換形、換檔或改原標記排列 |
| B3-C06 | C 極光漸層卡 | 主持座位卡低透明語意色，狀態優先級不變 |
| B3-C07 | C 月光舞台 | 居中大白字幕、冰藍細分隔、獨立提示玻璃區 |
| B3-C08 | B 冰晶資訊膠囊 | 原頂部階段／板名／房規／圖鑑功能不變 |
| B3-C09 | B 冰晶階層懸浮 | 底部工具弱化，下一步亮冰藍，原順序保留 |
| B3-C10 | B 極光月幕 | 首頁主視覺保留原標題、文字與選單次序 |
| B3-C11 | A 柔霧淡入淡出 | 0.8～1.2 秒目標，非阻塞且支援 reduced motion |
| B3-C12 | A 同場景同步切換 | 海邊村莊的白天／夜晚背景；實際圖像對位需驗收 |
| B3-C13 | A 白天淺／夜晚深 | 不同遮罩強度保護文字閱讀 |
| B3-C14 | A 完整階段同步 | 前進回退跨日夜播過場，恢復存檔直接到正確畫面 |
| B3-C15 | B 智慧適應背景 | 手機滿版；寬螢幕主圖＋同圖模糊側延伸 |
| B3-C16 | B 智慧分階段預載 | 大廳優先，主持雙圖靜默預載，缺圖不阻塞 |
| B3-C17 | A 冰霧字現 | 原暗／曉台詞由微模糊透明漸變為清晰 |
| B3-C18 | C 依頁面智慧遮罩 | 首頁輕、選項中、資訊密集頁面加深內容層 |
| B3-C19 | B 極光雙層浮卡 | 人數與板子列表玻璃浮卡，既有行為不變 |
| B3-C20 | B 極光陣營雙卡 | 設定頁狼人淡玫紅、好人淡金冰藍雙欄；房規與夜序中性玻璃 |
| B3-C21 | A 冰霧簡約卡 | 圖鑑列表深藍透明玻璃、細冰藍框及原插畫 |
| B3-C22 | A 冰霧雙面卡 | 圖鑑正反面冰霧玻璃、原 3D 翻卡及完整文字 |
| B3-C23 | B 極光勝負舞台 | 遊戲結束最上方，勝利陣營柔和極光 |
| B3-C24 | A 冰霧對稱融合 | 人物原畫融於事件卡左右，不用獨立小框 |
| B3-C25 | A 冰霧雙欄身分卡 | 狼人先、神職在平民前；插畫左融合、資訊右顯 |
| B3-C26 | B 月光垂直時間軸 | 左側日夜節點，右側原事件與順序 |
| B3-C27 | A 冰霧並排按鈕 | 復盤左重新一局、右回首頁，前者冰藍邊框 |
| B3-C28 | B 深霧聚焦玻璃 | 一般彈窗深藍玻璃與背景遮罩，內部不變 |
| B3-C29 | B 極光微動回饋 | 0.15 秒按壓冰光，不延後功能 |
| B3-C30 | B 冰霧漸層邊界 | 尚可捲動時淡冰霧提示，到底隱藏 |

**B3-C20～C30 亦已全部定案**，具體規格詳見本文件新增章節及 Google Drive README.md 第 11～16 章。舊推薦示意不代表已選方案。

## Colors

### Authoritative tokens vs implementation suggestions

YAML 內的 primary #B2DBE5、text-primary #F4F8F9、三種陣營色是**已核准精確數值**。canvas、panel、secondary、邊框等為使 agent 能一致執行的**暫定實作基準**，得在符合冰霜主題、對比與真機驗收時微調；不要冒稱這些未核准的數字已由使用者逐項確認。

- Primary：冰晶藍 #B2DBE5，主要 CTA、「下一步」、選中邊緣及必要焦點。
- Text：月光白 #F4F8F9，主持主字幕、大標及重要數值。
- Semantics：狼人 #F0A3B0、神職 #E8D09B、平民 #C8DBE6。不要將這些語意色改成所有卡片的整片實心底色。
- Secondary surfaces：低彩度深藍與冰灰，背景必須有足夠對比。
- Historical skill illustrations：SVG 保留原色，不受一般色盤約束；投票／警徽歷史語意不可因主題換色而改判斷。

### Glass and overlay

B3-C02 的玻璃面板以約 68% 不透明度、backdrop-filter: blur(20px) 為基準，兼容 -webkit-backdrop-filter。控制器、圖文卡及彈窗按內容密度自行提升不透明度。亮日場景遮罩採較淺冰藍灰；夜晚採較深藏藍，必須保持對比。對不支援模糊或性能較弱的裝置，改用較深不透明實心底，**不能降低文字可讀性**。

## Typography

介面文字固定沿用實際 App 原文，繁體中文系統字體優先。YAML 字級為**未逐一批准的基準值**，使用既有 App 媒體查詢、clamp 與真機尺寸校正，不得因這些示意字級覆蓋長文字、系統大字或原可捲動區域。

- 首頁顯示「月下議會」、「狼人殺主持工具」及原三個動作：「開始主持」、「角色圖鑑」、「問題回報」，不更換順序。
- 主持中央舞台使用現有 subtitle(game) 文字，居中較大，月光白 #F4F8F9；提示文字在下方獨立霧面玻璃區。
- 「天黑請閉眼」與「天亮請睜眼」原字句不變；只能在其既有 DOM 文本上增加冰霧字現動畫，不創造第二份台詞。
- 規則、長板名、夜間順序、長台詞可正確換行／獨立捲動；禁止以過小字級硬擠。

## Layout

### Background mapping — three official assets

| Screen | Official asset | Expected local source | Drive original |
| --- | --- | --- | --- |
| home | lobby-shared.png | public/art/backgrounds/lobby-shared.png | https://drive.google.com/file/d/1yIIpiiQhju_0xZKTTtXYm0wx9o-7wtGQ/view?usp=drivesdk |
| counts | lobby-shared.png | 同上 | 同上 |
| boards | lobby-shared.png | 同上 | 同上 |
| setup | lobby-shared.png | 同上 | 同上 |
| encyclopedia | lobby-shared.png | 同上 | 同上 |
| finished | lobby-shared.png | 同上 | 同上 |
| host（白天） | host-day.png | public/art/backgrounds/host-day.png | https://drive.google.com/file/d/1Q1959FisULE-XlFos4PrMA7Npc7Mexd6/view?usp=drivesdk |
| host（夜晚） | host-night.png | public/art/backgrounds/host-night.png | https://drive.google.com/file/d/1k_sVFUVHX6Oh8FKIM7mZTT12rJtCP0oD/view?usp=drivesdk |

不可把 Google Drive preview URL 當 production CSS 圖片來源；原始 PNG 必須複製入 App 同源資產目錄供離線快取，且保留舊 art/backgrounds/shared.png。非主持頁**全部同一張 lobby-shared.png**。

### Responsive cropping

直立手機滿版 cover；橫向平板／電腦中央保留完整主圖，兩側以同一圖柔化延伸，不拉伸失真。host-day 與 host-night 相同縮放／對位算法。這兩張分別生成的村莊圖**不保證像素級相同場景**，需檢驗不一致的建築／海岸位置；在目前素材下利用霧遮罩降低切換破綻，不私換圖片。

保留 iPhone Safari／iOS PWA 的 env(safe-area-inset-*)、動態視口 dvh/svh、縮放、短螢幕可捲動、手勢防誤觸；裝飾背景 layer pointer-events: none 且不影響文字或按鈕。頁內列表可滾至最後一列並直接點擊。

## Elevation & Depth

- 底層：官方村莊 PNG；中層：依畫面與日夜區分的閱讀遮罩；上層：極光玻璃卡片與功能控件。
- 卡片：微弱漸層、淡冰色細邊、少量內光；避免強烈陰影、過度霓虹與高頻動畫。
- 次要功能按鈕位於暗玻璃層，主 CTA 冰藍且更突出。選中態以冰藍外框／內光，不靠純顏色傳達所有資訊。
- 主持頂部膠囊、中央字幕、座位卡、底部雙層浮動操作區視覺分明，但**不變動原有功能排列、遊戲步驟或高級別的狀態優先順序**。

## Shapes

- 圓角尺寸見 YAML Token；這些尺寸屬施工基準，應依原有 DOM、字體及手機尺寸微調。
- 首頁按鈕與選項浮卡相對圓潤；主持座位卡和字幕面板可偏中等圓角；頂部階段資訊使用 pill。
- 使用圓角不能遮掉尾端座號、技能 SVG 或難以點選的內容；勿把資訊區改成不可捲動的固定高度。

## Components

### B3-C03 buttons

一般按鈕暗藍雙層玻璃，主 CTA 亮冰藍 #B2DBE5；選取冰亮框＋內光。hover、active、focus-visible、disabled 都須辨識；觸控目標約 44px 起，實際遵守既有頁面及文字大小。沒有使用者確認時，不改原按鈕文字和次序。

### B3-C05/C06 seat cards and skill icons

主持 2 側座位卡用深藍極光漸層與陣營淡暈色，保留座號、玩家狀態、選人可用性、標記、死亡、警徽、上警／退水、PK 等。**26 技能 SVG 形狀、原始顏色、尺寸、對位、重疊邏輯一律保持不變**。任何較早重新繪製或換色的討論都已撤回。

### B3-C07 host central moonlight stage

字幕置中月白 #F4F8F9，下緣冰霧細分隔；原法官 hint 區為另一塊可讀霧玻璃。沿用 engine.subtitle() 與現有特殊提示條件，不能新增／合併台詞。長文字正常換行、必要時局部捲動。

### B3-C08 top information capsules

原本夜數／階段、板名、房規與圖鑑操作維持原順序和入口，只換冰晶玻璃資訊膠囊。短螢幕與大字不可截去功能或使座位區完全不可用。

### B3-C09 bottom hierarchy

上排輔助工具（計時器、決鬥、自爆、重開等依原條件顯示）使用低權重霧面玻璃，下排上一步／下一步視覺突出，其中下一步使用 primary。保留原有順序、所有觸發條件、底部安全區與動態高度。

### B3-C10 home aurora

原首頁三個按鈕、原標題文字與順序不變；大廳圖做背景，月幕／極光是低強度視覺裝飾，不因圖片繁複犧牲文字閱讀。

### B3-C18 overlay by screen

首頁相對輕遮罩，使村莊可見；counts／boards 中度遮罩；setup／encyclopedia／finished 資訊區較深玻璃以提升文字對比。仍全部指向同一張 lobby-shared.png。

### B3-C19 count and board option cards

counts 的大卡及 boards 的垂直滾動清單使用極光雙層浮卡、冷色內亮與冰邊，右側保留導航箭頭。人數及板子資料、排序、一般／特殊分類切換、單擊進入下一頁、返回功能及最後列表項可點選性保持完全一致。**B3-C20 B「極光陣營雙卡」已定案**，細節見新增章節。

### B3-C11～C17 host day-night animation

- 現有 SCRIPT.dark / SCRIPT.dawn 對應「天黑請閉眼」／「天亮請睜眼」。用 phaseOf(game) 及現有 game.step 觀測實際晝夜，不增加新階段。
- 跨白天／黑夜邊界時背景在約 0.8～1.2 秒內柔霧淡入；日／夜遮罩深淺同步切換。
- 同一夜角色睜眼、技能或閉眼步驟不應重播整段日夜轉場。
- previous() 回退跨界也轉場；快速反覆點擊即以最新遊戲狀態為準，取消過期動畫。
- 恢復／重新整理直接渲染正確背景，不補播過場或重複台詞。
- 既有字幕本身由微模糊／半透明逐漸清晰，結束時即正常文字；不複製一份新字幕、不卡住下一步。
- 所有動畫視覺 layer 必須 pointer-events: none，不攔截座位／按鈕；不能延遲遊戲 next/previous，不增加 modal、timer 或觸發機制。
- prefers-reduced-motion: reduce 改立即切換；圖片載入失敗仍有深藍／最後可用背景，操作不中斷。

### B3-C16 background loading and offline PWA

大廳共用圖優先準備，主持兩張圖靜默背景下載，遵循目前 sw.js 的 CORE/OPTIONAL、warmAssets、SET_FOREGROUND 與 cache 版本策略。首次啟動**不等待三張圖片全下載才能操作**。夜景、日景未快取時保持可用降級，網路恢復再靜默補取。不顯示進度提示，不用私人 Drive URL 作正式 App 圖，不重置儲存／歷史／其他快取素材。

## Do's and Don'ts

### Do

1. 先讀現有 public/index.html、app.js、data.js、engine.js、style.css、sw.js、cache-manifest.js，再依最小差異實作；先保存可以還原的 Git commit 歷史。
2. B3-C01～C30 全部設計定案；只套用已選方案，不改動既有投票、計時器、圖鑑翻卡、復盤資料、遊戲規則。
3. 維持原字幕、場次／頁面、票權、計時器、可回退存檔、網頁捲動、人物及 26 技能 SVG。
4. 測試 320／375／390／430px、低高度、橫向、字級放大、觸控、焦點、亮夜對比、動畫連點、離線降級與 PWA 回復。
5. 把未經 iPhone Safari／iOS PWA／Android／低階設備真機驗收的項目標為待驗收；不能把桌面模擬算成真機通過。

### Don't

- 不要重寫遊戲引擎、投票／PK、法官下一步／上一步邏輯或更動玩家身分與勝負判斷。
- 不要改任何 26 技能 SVG 的外型、原始顏色，或用新的狼徽／SVG 取代原標記。
- 不要把每個夜間角色子步驟都觸發日夜背景切換，也不要使用動畫全畫面攔截點擊。
- 不要新增要求使用者下載圖片的對話框、等待計時或進度 UI。
- 不要刪除 shared.png、舊背景、回退歷史或舊存檔。
- 不要宣稱現有日夜兩張 PNG 精確對位；要在實作轉場時驗收。
- 不要把 B3-C20～C30 的未選方案當成定案，也不要把本文件當成已部署的證明。

### Verification gate

正式實作後必須跑現有 npm test、全 26 板回歸與原票型／PK／復盤／計時器驗收；檢查所有頁面、瀏覽器尺寸、裝置方向、點擊穿透、背景載入失敗、重新整理、回退和離線。真機測試與是否已部署請逐一紀錄事實，**此 DESIGN.md 產出當下不代表任何檢查已通過**。


## B3-C20～C30 正式新增設計規格

> 本節是 2026-10-19 的正式選定方案。詳盡施工規格、排版例外及逐項驗收見 Google Drive／月下議會／App介面／README.md 第 11～16 章。**所有效果只改 UI，不變更遊戲規則、原始字幕、票型、投票資格、回退、計時器或存檔。尚未修改 App 或執行回歸。**

### C20 B — 極光陣營雙卡（設定頁）
狼人陣營卡以深冰藍玻璃疊局部淡玫紅 (#F0A3B0) 極光，好人陣營卡以淡金 (#E8D09B) 與冰藍 (#C8DBE6) 局部漸層；維持原雙欄、角色列表與數量。特殊房規、夜間順序採中性冰霧玻璃；details/summary 折疊、select 預設與隱藏條件、夜間文字、開始主持及上一頁功能不動。短螢幕需可讀及可捲。

### C21 A — 冰霧簡約卡（角色圖鑑列表）
使用深藍半透明底、細冰藍邊框，不加 B 方案陣營漸層大底；保留原角色插畫、圖片比例、名稱及語意色、狼人／好人切換、神職先平民後、主持限定角色篩選、點卡進入預覽、捲動及回來源。

### C22 A — 冰霧雙面卡（圖鑑預覽）
正反面使用一致的深藍冰霧玻璃與邊框；正面完整原角色畫、背面原［陣營］［技能］［目標］全文及長文字捲動。保持 3D 翻卡約 0.45 秒、關閉、焦點、aria/inert、主持／首頁返回。reduced motion 時可即時翻面。

### C23 B — 極光勝負舞台（復盤最上方）
遊戲結束卡維持復盤頂端，依真實狼勝／好人勝使用柔和語意色極光，保留實際 winnerTitle、winnerReason 原文字；不補造勝負、不新增確認／鎖定動畫。下方原順序為完整復盤及最終身分回顧。

### C24 A — 冰霧對稱融合（復盤事件卡）
左右原人物插畫**直接融入整張事件卡背景**，以相近柔化強度左右對稱，中央技能 SVG、結果與發動者／目標關係清晰；**不得加左右獨立人物小框**。維持原 26 SVG、票型、雙目標、單人事件、空過、無目標、實際目標映射、舊存檔快照 fallback，依當時記錄不倒推資料。

### C25 A — 冰霧雙欄身分卡
維持原雙欄、人物融入卡片左側、右側原座號／最終職業／存活與出局／感染及轉化原職。狼人陣營在前，好人神職在前平民在後；保留原排序、資料、末項完整可捲與 Safari/PWA。

### C26 B — 月光垂直時間軸
日夜段落左側用細線串聯冰藍月亮夜節點、淡金太陽日節點，右側保留原事件卡。依現有日／夜段落，不插事件或更改順序，不破壞原展開收合、長文字與捲動。節點層 pointer-events: none，低效能和窄螢幕優先可讀性。

### C27 A — 冰霧並排按鈕（復盤下方）
「重新一局」左、「回首頁」右，兩個深藍半透明冰霧玻璃按鈕並排，重新一局的冰藍細邊稍突出；保留確認流程、觸控範圍、固定底部安全區與最末復盤可捲到。

### C28 B — 深霧聚焦玻璃（一般彈窗）
一般對話框只改深色玻璃外框和暗化背景遮罩，原投票／警長／PK／計時器／技能／決鬥／自爆等內部操作、開關、按鈕、焦點、ESC/close、選項與捲動均不變。角色圖鑑預覽優先依 C22 雙面卡，不能覆蓋其功能；無 blur 時用較深實色降級。

### C29 B — 極光微動回饋（全站按鈕）
可按鈕下壓與冰藍內光約 0.15 秒，**功能立即執行**，沒有額外 delay、lock、debounce。selected/aria-pressed、disabled 與 focus-visible 清楚，reduced motion 改靜態即時回饋。保留一般放逐、警長、所有 PK、技能和危險操作按鈕既有語意，不全面換色。

### C30 B — 冰霧漸層邊界（捲動提示）
每個可捲動內容區只有下方仍有內容時才出現淡冰霧邊界，到底／無溢出時消失。漸層 pointer-events: none，絕不遮蓋末列／票型觸控；保留原生慣性、縮放、鍵盤焦點、safe area、固定操作列和 Safari/PWA 滾動回復。避免持續動畫與高頻重排。

### 驗收及施工界限

- 舊 26 板、角色圖、26 技能 SVG、一般放逐／警長／PK、計時器、技能、復盤、舊存檔與回退全部需回歸。不得藉主題修改 engine、record snapshots 或投票資格。
- 查驗 320／375／390／430px，短橫向、系統大字、Safari 地址列、雙指捏合、長文字最後一列、iOS Safari／安裝 PWA／Android／低階裝置真機。桌面 viewport 模擬不能冒稱真機通過。
- 實作前保留可回退 Git commit，按背景與快取 → 共用 Token 與主持 → 一般頁／圖鑑／對話框 → 復盤 → 回歸測試分批提交；不 force push，不覆蓋舊背景。
- **本次僅更新 DESIGN.md 與 Google Drive README.md。** 未修改 public、GitHub 原 README.md、Google Drive 背景圖，也沒有聲稱程式已完成或測試通過。

## B3-R01～R09 第二輪 UI 修正定案（2026-10-19；尚未施工）

> 適用基線：\`feat/b3-arctic-ui-20261019\` 的現有 B3 實作；本章優先於前述 C01～C30 中與外觀衝突的舊敘述，但絕不覆寫遊戲規則。此章是「新一輪設計定案／待 Codex 施工」，不是測試、上線或真機驗收證明。設計格式參照 https://github.com/google-labs-code/design.md ，保留 YAML tokens + Markdown rationale；具體驗收與 UI 元件邊界見本分支 README.md 對應章節，以及 Google Drive／月下議會／App介面／README.md。

### R01 A — 狼刀式內嵌主持操作列
將主持字幕下方的提示小字、既有技能 SVG、技能名稱與「空守／空刀／不使用」等小操作鍵整合成一個視覺連續的操作區；小按鈕優先和技能名稱同列，寬度不足自然換行。可參考接手狼刀時 \`#knifeToggle\` 與 \`.operation-control\` 的同列呈現。清除 \`#hint\`、\`#operationCard\`、\`#actions\` 之間多餘分層、框線及空白，但保留 DOM 可供原操作邏輯綁定，不改任何 onclick、文案、啟用判定與交互順序。**不是改玩家座位為單欄**，\`#left\` 1–6／\`#right\` 7–12 維持原雙欄。實際觸控目標至少 44px，短螢幕不能裁斷按鈕。

### R02 A — 冰晶細框＋狀態標籤
警上、退水、投票選取依既有狀態分別顯示細緻 **1px** 冰晶框與明確文字標籤（警上／退水／投票已選），取消過厚白框。不同狀態保持可辨，選中標示不得把出局、禁投、候選、警徽、PK 與技能狀態覆蓋。只改樣式及必要呈現，警長／一般放逐／PK 的資格和判定不變。

### R03 A — 一般放逐票型「冰霧雙區分層」
**僅 \`#exileVoteDialog\`**：多人投同一位模式上方為大型可點擊得票對象橫列／展開條列清單（座號＋即時票數），下方為格狀投票者選擇區；兩區形制明顯不同，已選用冰藍框與勾選，底部保留「完成統計」。逐人紀錄模式仍不顯示棄票選項；未選擇而按「下一位」視既有流程自動棄票；上一位／下一位保留在底部。草稿、清空、退出不記錄、紀錄結果、預選得票結果、復盤資料、票權及計票皆保留。**\`#voteDialog\` 的警長與所有 PK 介面及其按鈕、規則完全不變**；避免共享 CSS 污染。

### R04 A — 極簡冰晶發言計時器
只更新既有計時器 dialog 內部視覺：設定模式以半透明冰霧滾輪、冰藍選取細線、月光白數字與冰藍「開始」主按鈕取代厚黑／舊金色外觀；位置仍是「−10秒／時間滾輪／+10秒」，下方「開始／重置」及較小「重設」。倒數模式仍是**沒有滾輪的純大數字**，下方「暫停／重置」及較小「重設」；原暫停／繼續、重置回已設定時間、重設、動畫、關閉與狀態機不變。不可修改計時運算或存檔。

### R05 B — 智慧高透液態玻璃（新的不透明度優先值）
下列是**玻璃背景底色的 opacity／alpha，不是元素整體 \`opacity\`**：首頁按鈕 **20%**、玩家座位卡 **48%**、主持資訊卡 **68%**、復盤事件／最終身分卡 **65%**。原始背景圖保持可見；文字、原圖、技能 SVG 不套透明度；細冰藍邊緣、液態高光與局部遮罩仍在。日夜亮度變化及 Safari 不支援 blur 時需維持閱讀對比，必要時僅局部加深文字背板；高密度彈窗確保資訊可讀。本 R05 覆蓋舊 C02 一般玻璃 opacity 的預設建議，不重定義陣營語意色。

### R06 A — 復盤統一冰藍玻璃
復盤事件卡、最終身分卡統一上述 **65%** 冰霧玻璃底色，不採整卡粉／金／灰黑色或左右大面積語意暈染。陣營色只留在**人物名稱及原有圖示**（不重繪、不改 26 SVG 內部顏色）；原角色插畫直接融合背景、不可另加獨立圖片小框。保留事件時間軸、勝負原因、真實行為、空過／雙目標／無目標／投票 PK、舊存檔 fallback；最終身分雙欄、狼人先、好人神職先平民後、感染轉化與出局資訊不變。

### R07 A — 全站防雙擊誤放大
優先使用按鍵／可互動容器的 \`touch-action: manipulation\` 及正確 touch target，防止連點被瀏覽器當成雙擊放大；**保留雙指 pinch-zoom、文字縮放、原生慣性捲動、鍵盤焦點與系統輔助功能**。不得加 \`user-scalable=no\`、\`maximum-scale=1\` 或全站 \`touchmove/gesturestart\` 強制攔截。iPhone Safari、已安裝 iOS PWA、Android 都需真機驗證；無法保證所有瀏覽器完全阻止手勢，應如實記錄。

### R08 C — 金框統一＋人物個別校正
角色圖鑑、角色翻卡預覽**移除額外冰藍外框**，保留原始黑底、原金框與原畫；金框先依統一顯示比例對齊，再逐角色校正人物顯示水平／垂直中心、縮放、留白。優先角色專屬 CSS 顯示參數，不拉伸、不裁掉任何人物或金框；若畫像內在偏移無法非破壞修正，列出例外供另行核准，**不覆寫任何原始圖片**。復盤角色插圖維持無獨立小框的融圖方式。

### R09 B — 剛進主持區先白天，正式閉眼才入夜
初次新局 \`step==='confirm'\`（確認身分）時，**視覺背景選用已核准 \`host-day.png\`、頂部顯示「第1天・準備階段」**；進入 \`step==='dark'\` 字幕「天黑請閉眼」才切 \`host-night.png\`、標籤改「第1天・夜晚」，依既有 0.8～1.2s 非阻塞柔霧轉場。previous 回 confirm 恢復白天；重新整理／恢復存檔直接呈現正確畫面不重播動畫，不允許在日景未載入時短暫閃夜景。**只改呈現層背景映射與頂部字樣，不修改 \`phaseOf()\`、\`next/previous\`、遊戲步驟、原字幕、引擎、存檔及日夜結算。**

### 同輪附帶修正 — 首頁「問題回報」置中
首頁既有「問題回報」連結須在自己的點擊區域水平及垂直置中；保留 44px 以上觸控高度、原連結與 focus-visible，不增減操作。

### 優先序、界限與驗收
- 優先序：本章 R01～R09（僅衝突的第二輪 UI 表現）＞既有 B3-C01～C30 外觀通則＞舊版金紫色歷史描述。遊戲規則、票型、資格、角色、台詞、26 SVG、舊存檔及回退不因外觀新版而重排。
- 這次文件寫入僅更新 DESIGN.md、GitHub README.md 與 Drive App介面 README.md；**不修改 App、JS/CSS/HTML、圖檔、Service Worker、版本號，也不宣稱已部署或通過回歸**。Codex 實作需額外執行與驗收。
- 完整檢查 26 板、警長／一般放逐／所有 PK、兩種票型輸入、空守與接手狼刀、小螢幕 320／375／390／430px、長文字、safe area、旋轉、放大、捲動到底、動畫連點、恢復、離線及復盤；iPhone Safari／iOS PWA／Android／低階機必須標明尚未真機驗收的項目。

## B3-R10～R16 第三輪設計定案（2026-10-19；待實作／待驗收）

> 這些 R10～R16 為 R01～R09 已部署後的新修訂，尚未透過本次文件操作修改 App。與舊 R02/R03/R05/R06/C 系列**外觀**衝突時，以 R10～R16 最新約定為準；既有遊戲規則、投票算法、角色、事件紀錄、SVG、存檔與部署歷史不變。參照 https://github.com/google-labs-code/design.md 的 YAML token + rationale 格式。B3 工作分支：`feat/b3-arctic-ui-20261019`。

### R10 A｜主持操作區「緊湊三行式」
提示小字為第一行；原始技能 SVG＋技能名稱＋小操作鍵同列為第二行；已選玩家／當前結果第三行。狼刀、查驗及所有適用角色保持一致的資訊節奏。小按鍵**視覺**高 32～36px，實際觸控 target 最少 44×44 CSS px，允許使用透明點擊熱區但不得與旁邊重疊或蓋住座位；狹窄寬度自然換行。三行都要完整可見，不把第三行切在容器邊界之外。原技能 SVG、按鍵動作、原提示文案、`#left/#right` 雙欄、短螢幕內捲動、Safari/PWA 相容性不變。

### R11｜警上／退水／選取分層辨識（取代 R02 混用細框的外觀）
**選取中**：整張玩家卡明顯的**較粗完整選取框**（建議 2px 起、相對基本框明顯更粗），不同於警上／退水；若選取與身分狀態並存，粗框優先，但原標籤不能被遮蓋。
**警上**：保留原有框線，再加**冰藍角標與「警上」明確標誌／文字**，不可用選取粗框代替警上標記。
**退水**：弱化外框、色調接近普通警下但仍有可辨識差別，保留「退水」明確文字／標記。與完全沒有狀態的警下玩家在真實明亮日景及暗夜場景均能區分。
保留角色名、座號、警徽、26 SVG、出局／禁投／PK 與原投票資格及優先級。基本普通框保持原定冰晶質感。

### R12｜一般放逐、警長與所有 PK 統一冰藍投票介面，取消顯式棄票選項
適用 `#exileVoteDialog`、`#voteDialog`，包含普通放逐、警長選舉、警長 PK、放逐 PK／重投：分頁、選擇格、選中邊框、功能按鈕及彈窗一般裝飾**統一冰藍＋深藍霧玻璃**，不得殘留舊紫色 `!important`／古金棕按鈕。多人／逐人兩模式遵循相同的視覺語言；已有合法投票者、候選人、PK 排除資格與原互動方法全部保留。
所有模式**移除 UI 上可點選的「棄票」選項／按鈕**；逐人未選擇而按下一位，依已核准行為記錄棄票；多人模式未被指派的合法投票者，完成統計時按照既有棄票紀錄規則處理，不能因隱藏按鈕遺失記錄或改票權。不得修改投票引擎、計票、同票 PK 判定、資格、草稿、強制預選結果、復盤、回退／存檔。**舊 R03 對警長／PK 不改外觀的限制在本項被新定案取代**，但不代表可以修改其遊戲規則。

### R13｜復盤只改陣營顏色與卡片底色，其餘保留
事件卡與最終身分卡的角色／陣營語意文字色直接使用**目前主持座位卡實際陣營配色**（狼人、神職、平民，並依既有陣營語意）；不要另建不同的復盤陣營色或重繪原 SVG。卡片**背景底色**改為中性冷冰藍玻璃，背景 alpha **0.65／65%**，排除古金／金棕色背景疊層；調整僅限底色而非整張卡 opacity。**其餘完全保留**：現有邊框形狀／粗細、人物融圖、光影、卡片版型、標題／內文階層、技能 SVG、時間軸、排序、勝負理由、內容與復盤資料。不可擴大為復盤全頁重設計。

### R14 A｜離局警示按鈕
在「重新開局」等確認彈窗中，**繼續本局**採冰藍主要安全操作色；**回首頁**採低飽和霧玫紅玻璃警示色（非古金色、非刺眼正紅）。其他具相同「結束／清空／離開目前局面」語意的確認按鈕套相同安全與警示階層。只改按鈕外觀；原文字、左右排序、點擊、確認與返回步驟、資料清除條件、存檔處理不變；不把一般導航用回首頁連結誤套破壞性語意。

### R15 A｜選板子「超高透冰霧玻璃」
只在 `#boards` 的選板子清單區調整**底色 alpha**：列表外層候選起始值 **0.40～0.44**（40～44% 不透明）、單列板子卡候選起始值 **0.32～0.36**（32～36% 不透明）。原則為「越透明越好，但板名／箭頭可讀性絕對優先」；若實際亮景／夜景／低 blur 環境不易閱讀，可局部加深**文字背後**遮罩，而不是不透明整張卡。文字、箭頭、框線、focus、點擊內容不得一起透明；保留原冰藍邊線、適度 backdrop blur、內光。驗收使用瀏覽器 `getComputedStyle` 及畫面實測內外層 computed background-color 的真實 alpha，檢查高優先級選擇器與 `!important` 未覆蓋；注意雙層玻璃視覺合成不透明度較各自 alpha 高。分類切換、清單獨立捲動、最後一列可點、iOS Safari/PWA 均維持。

### R16｜九款特殊板子的**顯示名稱**正式調整
- 黑狼王 / 魔術師
- 黑狼王 / 守衛
- 黑狼王 / 攝夢人
- 惡靈騎士 / 守衛
- 血月 / 獵魔人
- 夢魘 / 攝夢人
- 機械狼 / 通靈師
- 覺醒石像鬼 / 守墓人
- 狼兄狼弟 / 黑市商人

以上九筆在 **12 人板子選擇清單、板子標題與其他引用板子「顯示名稱」之處**統一採 `A / B`（ASCII 半形斜線前後各 1 個空格）。如畫面需保留「12人」前綴，維持原前綴，並替換其後標題。需以**穩定 board id、實際角色組成**對照原九板，不依模糊字串誤改其他板。不變更 board id、角色在 `ROLE_DATA` 的職業名稱、夜間順序、房規、角色配置、勝利條件、PK、存檔識別及舊復盤相容；若有 canonicalName／shortLabel／列表來源，讓所有可見名稱一致且保留舊資料可載入。切勿將「血月」顯示名稱要求誤做成「血月使者」角色改名。

### 限界與測試
R10～R16 本次僅更新 GitHub DESIGN.md／README.md、Drive 原 README.md。**程式尚未因此修改、未新驗收、未新部署**。Codex 正式施工需另行執行，保留目前 commit 與備份，不 force push，不順手變更投票引擎、角色、26 SVG、原圖、service worker、背景或存檔。至少測試 26 板、全部選票模式、投票資格／結果／回退與復盤、iOS 320／375／390／430px、短螢幕、放大字體／捏合縮放、日夜對比、最後一列可點、九板顯示名與舊檔相容；真機未測則明示待驗收。

## B3-R17～R19｜第四輪實機截圖修正定案（2026-10-19，待 Codex 施工）

> 本章為使用者檢視 23:28／23:30／23:31 iPhone Safari 截圖後的新定案，**只核准 R17～R19 新增範圍**。R10～R16 已有實作／部署報告 `docs/b3-r10-r16-report.md`，不得把本章「待施工」誤套到 R10～R16。工作分支 `feat/b3-arctic-ui-20261019`；文件前 SHA `31beb7787ddecad6c607c00133f230a55519fba2`；回退分支 `backup/pre-b3-r17-r19-docs-20261019`。延續 https://github.com/google-labs-code/design.md 的 YAML token＋Markdown 形式，既有 Design Tokens 不另開新顏色。

### B3-R17｜抽發言順序：「完成」冰藍＋首次結果直接下一步
- **配色**：在現有「抽發言順序」結果對話框內，將「完成」按鈕從舊古金／金棕外觀改成共用冰藍主 CTA `#B2DBE5`（深色文字、冰藍 focus／active、至少 44×44px 熱區）。僅限此確認鍵，不改警徽、警徽 SVG、原始結果文案或其他按鈕。
- **流程**：第一次真正完成抽籤、結果已確定並可前進時，點一次「完成」應 **確認／保留既有發言順序 → 關閉結果彈窗 → 呼叫現有下一步操作一次**，直接進入原本「底部下一步」會到的那個步驟。不再要求法官第二次點「下一步」；**不得越過兩個以上步驟、重新抽籤、改順時／逆時針、覆寫已存結果或修改引擎的 `next()` 規則**。
- **防誤前進**：「查看抽籤結果」純檢視再次開啟時，按「完成」**只關閉**；同一已完成階段重開／重整／上一步返回後的顯示，也不得無條件重複前進。實作前查清真實抽籤 state 和 dialog/handler，依原狀態、首次確認來源及可前進性做 guard；如無法安全區分初次確認與再次查看，先回報阻礙，不可僅對所有關閉事件掛 `next()`。
- **回退與可及性**：原上一步、存檔恢復、結果再查看、Escape／關窗取消、快速連點、鍵盤／Safari PWA 原行為保留。需證明首次只執行一次既有推進，不依賴動畫計時。

### B3-R18｜全部逐人票型頂列加「投票玩家」
- 現在逐人紀錄頂部孤立大字如「6號」的深藍資訊格，改為同格**左／上提示「投票玩家」＋強調當前玩家座號「6號」**（隨已存在的逐人 index 更新）；兼容 320px／字級放大與長內容，勿為了補字增加大片空白或新流程。
- 套用一般放逐、警長選舉、全部警長／放逐 PK（含重投）的**逐人模式**；多人投同一位模式的「得票對象」頂列不改，避免語意混用。
- 補的是**UI 標籤**，不是一個新的投票者／票權來源：候選池、投票者顯示號碼、進度 `n/N`、已紀錄／草稿、上一位／下一位、R12「未選下一位自動棄票」及 R10～R16 已實作的逐人自動跳號保持原資料與機制；不可新增顯式棄票選項。

### B3-R19｜完整復盤「查看投票紀錄」冰藍明細
- 只鎖定 `finished`／完整復盤內「查看投票紀錄」展開層、每輪票型的明細容器／單筆票型卡：移除殘存**紫底、紫框與偏金紫裝飾**，改中性**深藍／冷冰藍玻璃、冰藍細框、白／冰灰字**，色彩與 R13 事件／身分卡相容；背景填色可參照 R13 0.65 起點，唯對比合格優先，避免嵌套玻璃過暗。
- **不得換圖或換技能／投票箱原 SVG 的內部顏色**；已有警長事件徽章金色及原插畫都是原始素材語意，不在這次「去紫」範圍。其他復盤事件卡的人物融合、布局、時間軸及角色陣營色維持原樣。
- **所有真實紀錄原封不動**：每輪投票標題、各玩家票數及投票者、已投票／棄票／未獲票資訊（即使編輯器 R12 已移除「棄票」操作仍須保留歷史「棄票：0人」等顯示）、警長／放逐／所有 PK 統計、展開收合、次序、snapshot fallback 與舊存檔復盤，不修改 `public/recap.js` 的事件演算或票型資料。CSS 使用復盤區限定選擇器，確認 `!important` 與 cascade 真實 computed 顏色，不能誤套投票編輯彈窗。

### 本輪實作限制與驗收（R17～R19 尚未施工）
1. **文件同步僅修改** `DESIGN.md`、`README.md` 及 Google Drive 的 `月下議會/App介面/README.md`；保留備份，不改 App、測試檔或部署。Codex 施工另行執行。
2. R17 至少驗證：初次抽出結果按完成只推進**一個**原步驟；純查看僅關窗；取消／Escape 不推進；上一步／reload／快速雙點／iPhone Safari PWA 不跳步或重抽，抽籤方向、座號、發言順序、歷史保持正確。
3. R18 至少驗證：一般放逐、警長及各種 PK 逐人模式，當前玩家座號同步、進度與自動跳號正確；未選按下一位依既有邏輯棄票；多人模式仍顯示「得票對象」。
4. R19 至少驗證：復盤投票明細 CSS computed 背景／邊框**無紫色**、日／夜背景、深淺面板、舊快照、平票及 PK 票型，所有歷史統計／棄票／未獲票資料不變，原 SVG、人物事件卡不動。
5. 跑 `npm test`、26 板功能回歸、現有票權／復盤／回退斷言與 320／375／390／430px，Safari 真機／PWA 未實測不可宣稱通過。記錄檔案、commit SHA、測試證據；不 force push，不合併 main，不自行部署。
