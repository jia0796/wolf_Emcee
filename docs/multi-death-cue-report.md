# 多人死亡技能詢問字幕修正｜2026-10-23

依使用者截圖定案，第二天起多人夜間死亡，當輪死亡名單包含有合法槍技能的玩家時，該玩家原無遺言技能操作頁改顯示：

> X號玩家，是否發動技能

多人死亡公告照舊。首夜遺言、單人死亡、沒有合法槍或禁止開槍者維持原字幕。沿用原開槍／不開槍選擇、目標、提交、消耗、死亡批次與終局判定。

## 修改與回退基準

- 原始 Commit：`0b5c7f1439a980c1d16f529e17ab1276aa41d792`。
- 遠端備份：`backup/pre-multi-death-cue-20261023`，已用 `git ls-remote` 確認指向原始 Commit。
- 程式 Commit：`7ebb9e3b331a82d27b68cfc12bff2283ab96ffcc`。
- `public/engine.js`：只新增一條字幕條件，限定第二天起、多人死亡、原無遺言操作頁及合法技能。
- `test/dsk-mec-bro.test.js`：新增 7 項，覆蓋第 2／3 天原生獵人、學獵人機械狼、幸運兒槍，以及首夜／單死／禁槍的排除條件。
- `scripts/dsk-mec-bro-ui.mjs`：新增四種手機寬度的多人死亡公告 → 技能詢問、模式切換、重整及回退操作。
- 未修改存檔版本、歷史、復盤、角色規則、投票、計時器、素材、Service Worker、線上發牌或 Supabase。

## 已執行測試

| 測試 | 通過 | 失敗 | 跳過 |
|---|---:|---:|---:|
| 本機 `npm test` | 946 | 0 | 0 |
| 本機 `node scripts/dsk-mec-bro-ui.mjs` | 30 | 0 | 0 |
| 正式站同一 UI 腳本 | 30 | 0 | 0 |

手機 UI 涵蓋 320、375、390、430px，驗證未決定時下一步禁用、明確不開槍、切回開槍、選目標、重新整理及上一步。原有機械狼字幕與房規 UI 檢查亦保留。自動化使用 Windows Node.js／Playwright Edge，iPhone Safari、安裝 PWA、Android 真機仍未驗收。

[自動測試日誌](multi-death-cue-evidence/npm-test.txt) · [本機 UI 結果](multi-death-cue-evidence/local/results.json)

## 部署

發布工作：[GitHub Actions](https://github.com/jia0796/wolf_Emcee/actions/runs/39893615825)。部署前 CI 測試與 Pages 發布均成功；正式站 30 組 UI 全數通過。`engine.js` 的 HTTP 200 內容與發布 Commit SHA256 完全一致，確認新版字幕已實際上線。

[正式站 UI 結果](multi-death-cue-evidence/live/results.json) · [部署證據](multi-death-cue-evidence/deployment.json) · [正式站 390px 畫面](multi-death-cue-evidence/live/multi-death-390.png)。

## 安全回退

保留其他尚未提交工作後，在開發分支新增反向提交，不重置或覆寫歷史：

```powershell
git switch feat/eclipse-host-app
git revert 7ebb9e3b331a82d27b68cfc12bff2283ab96ffcc
npm test
```

經確認後正常推送即可重新發布。備份分支保留，main 未修改。
