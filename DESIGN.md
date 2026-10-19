---
version: alpha
name: Moonlit Council — B3 Arctic Frost
description: "月下議會狼人殺法官 PWA 北極冰霜視覺規格；僅 B3-C01～C19 已定案，尚未實作。"
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
---

# 月下議會｜B3 北極冰霜設計系統

> 文件日期：2026-10-19。來源格式：google-labs-code/design.md（https://github.com/google-labs-code/design.md）。
>
> **狀態：B3-C01～C19 設計定案，尚未套入 App；B3-C20 遊戲設定頁細節仍待使用者選擇。**
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

**B3-C20 尚未定案。** 即使先前曾推薦某方案，也不可把推薦當設計定案。

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

counts 的大卡及 boards 的垂直滾動清單使用極光雙層浮卡、冷色內亮與冰邊，右側保留導航箭頭。人數及板子資料、排序、一般／特殊分類切換、單擊進入下一頁、返回功能及最後列表項可點選性保持完全一致。**B3-C20 設定頁的整體內部風格不得自行定案。**

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
2. 僅實作 B3-C01～C19 已定案內容，C20 保留待選，不猜測後續投票／圖鑑／復盤細節設計。
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
- 不要把 B3-C20 推薦方案當定案，也不要把本文件當成已部署的證明。

### Verification gate

正式實作後必須跑現有 npm test、全 26 板回歸與原票型／PK／復盤／計時器驗收；檢查所有頁面、瀏覽器尺寸、裝置方向、點擊穿透、背景載入失敗、重新整理、回退和離線。真機測試與是否已部署請逐一紀錄事實，**此 DESIGN.md 產出當下不代表任何檢查已通過**。
