# 主持操作目前版本驗證

本次依使用者指示移除技能禁選外觀與「不可選取」標示，並從 README 清除該功能的規格、摘要及驗收要求。縮小發言計時器與多人記票功能保留。

- 程式提交：`4b6497a0e54bcfea1a034dfe54d16ef553571aa2`。
- 移除前版本：`b31e3fd3204c738394f5e2198487f8b72aa2a2b6`；遠端備份 `backup/pre-host01-removal-20261022` 已保留。
- 座位渲染區塊與加入禁選外觀之前的 `dec4fea4ad9729f8aeb431b510e1009ff406d78c` **完全一致**，SHA256 相同。[比對](host02-03-current-evidence/invariants.json)。合法選人判斷仍由原引擎負責。
- 未修改遊戲引擎、角色、投票引擎、計時器狀態機、存檔／回退、SW、技能 SVG 或 Supabase。

## 實際測試

| 項目 | 結果 |
|---|---|
| `npm test` | **881 通過、0 失敗、0 跳過**，含全部 28 板×18種子＝504 完整對局。原有 875 項保留；只移除 18 項針對已刪除 UI 分類函式的測試，6 項多人記票單元測試保留。 |
| 本機 `scripts/host01-03-ui.mjs` | **41 組通過**；技能座位標示確實消失、disabled 與原引擎一致，計時器及四種投票均通過。 |
| 本機 `scripts/host01-03-offline.mjs` | **3 組通過**；離線恢復原座位外觀與保留計時器功能。 |
| 語法／差異檢查 | `node --check`、`git diff --check` 通過。 |
| 正式站部署後 | **41 組 UI＋3 組離線通過，0 失敗、0 page error**；三個更新檔案與提交 SHA256 一致。 |

[完整單元測試輸出](host02-03-current-evidence/npm-test.txt) · [本機 UI](host02-03-current-evidence/local/results.json) · [本機離線](host02-03-current-evidence/local/offline-results.json) · [恢復後座位](host02-03-current-evidence/local/original-seats.png)。

真機 Safari／安裝 PWA／Android／低階裝置仍待驗收。原有快取清單校驗差異未在此輪擴充修改。先前報告及截圖只作歷史紀錄，不代表目前座位樣式。

[Pages 發布成功](https://github.com/jia0796/wolf_Emcee/actions/runs/39701046852) · [部署與檔案雜湊](host02-03-current-evidence/deployment.json) · [正式站 UI 結果](host02-03-current-evidence/live/results.json) · [正式站離線](host02-03-current-evidence/live/offline-results.json) · [正式站座位截圖](host02-03-current-evidence/live/original-seats.png)。

## 安全回退

若要撤銷本次移除、恢復移除前版本的對應程式，使用新提交反向撤銷，保留後續歷史：

```powershell
git switch feat/eclipse-host-app
git pull --ff-only origin feat/eclipse-host-app
git revert 4b6497a0e54bcfea1a034dfe54d16ef553571aa2
git push origin feat/eclipse-host-app
```

如出現後續同檔衝突需審查處理，不使用 reset --hard 或 force push；同步更新 README 狀態。備份分支不刪除、不覆寫。
