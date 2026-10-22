# HOST-02 長按拖曳改為 0.25 秒

依使用者確認，縮小計時器的拖曳門檻由 200ms 改為 **250ms（0.25 秒）**。只修改 `public/b3-ui.js` 該次長按排程，縮小／還原動畫仍是原本 200ms；計時器狀態機、投票、遊戲及存檔完全不變。README 的兩處長按規格同步更新。

- 修改前版本：`aa6b887e2158ffca83cf19910153f9b0c7e66b1b`。
- 遠端回退備份：`backup/pre-host02-drag250-20261022`。
- 本機瀏覽器專項：**41 組通過**，包含凍結測試時鐘後確認 **249ms 不啟動、250ms 啟動**、放手不貼邊、觸控長按、長按前滑動不拖曳、安全區／縮放／轉向及保留的投票功能。
- [本機結果](host02-drag250-evidence/local/results.json)。真機 Safari／PWA／Android 仍待驗收。

- `npm test`：**881 通過、0 失敗、0 跳過**（含 504 局壓力測試）。[完整輸出](host02-drag250-evidence/npm-test.txt)。
- 程式提交：`f920dd0ba9dddd9eb41e04b892658ada028bd277`，已推送至原開發分支並[發布成功](https://github.com/jia0796/wolf_Emcee/actions/runs/39766258443)。
- 部署後正式站 **41 組通過、0 失敗、0 page error**，含精準 249ms／250ms 門檻驗證。[結果](host02-drag250-evidence/live/results.json)。
- 正式站 `b3-ui.js` HTTP 200，SHA256 與本次提交完全相同。[部署證據](host02-drag250-evidence/deployment.json)。
- 安全回退：以 `git revert f920dd0ba9dddd9eb41e04b892658ada028bd277` 建立反向提交，保留後續歷史；不使用 reset --hard 或 force push。
