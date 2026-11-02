# CatchUp｜遊戲直播 AI 回顧 v0.1

目前已完成離線 demo；OBS、OpenAI、Twitch 接口已實作，尚未使用真實帳號與付費 API 完成端到端驗證。沒有自動投稿或公開上傳。

## 離線啟動

需要 Node.js 24 以上，不需要 npm 或安裝套件。在專案資料夾執行：

```sh
node src/server.mjs
```

開啟 http://localhost:3000 。

1. 按「＋ Simulate one minute」加入一分鐘的固定測試事件與圖片。
2. 按 Start session，每三秒自動推進一分鐘的模擬劇情；Pause 暫停、End 結束。
3. 按 Send 模擬 `!recap`，第二次會顯示冷卻，不會呼叫 AI 或發送 Twitch 訊息。
4. 開 Viewer recap 檢視觀眾頁。十分鐘後產生章節筆記。
5. New session 會封存上一場；伺服器重啟後保留資料並維持暫停。

所有離線畫面與事件皆為自製測試素材，不能用來證明 AI 辨識準確率。

## 真實串接

將 `.env.example` 複製為 `.env`；金鑰僅填本機檔案，不貼到聊天。

- OpenAI：填 `OPENAI_API_KEY`，確認模型可用與單價。預設每場預算 US$1，非供應商保證的硬上限。
- OBS：啟用 Tools → WebSocket Server Settings、設定密碼，在 `.env` 填 `OBS_PASSWORD`。
- 用 `node --env-file=.env src/server.mjs` 啟動。List OBS sources → 選遊戲來源 → Use → 建立 Live 場次 → Start。
- Twitch：依 [串接指引](docs/TWITCH_SETUP.md) 建立應用程式、填 Client ID/Secret、Connect Twitch。第一版以主播本人身分回覆。
- 第一輪需收集六張截圖，約一分鐘，再加 AI 處理與公開延遲時間。

## 交付與限制

- `node --test` 執行自動化測試；需允許本機 localhost 測試服務。
- `scripts/package.ps1` 產生 ZIP；不含 `.env`、本機 token、真實截圖、資料與私人背景。
- 本機 viewer 網址不能給其他觀眾使用。執行 `node --env-file-if-exists=.env scripts/export.mjs`，只將 exports 中四個公開檔案上傳靜態主機；這是手動更新的快照，不會自動同步。
- 第一版未做音訊、逐秒影片理解、全語系切換、刪除場次按鈕或自動發布。章節是既有事件的文字彙整，不另付費呼叫 AI。
- 調整公開延遲避免比 Twitch 播放更早顯示結果。抽樣可能漏掉瞬間事件，不補編未看到的動作。
- 詳細英文文件見 [README](README.md)、[實作差異](docs/IMPLEMENTATION.md)、[驗證紀錄](docs/verification.md)。

參賽仍需真實 Twitch 展示影片、程式碼倉庫網址、英文投稿內容與真實 Codex Session ID。ZIP 本身不是完成投稿。
