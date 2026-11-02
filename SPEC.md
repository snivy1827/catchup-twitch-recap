# CatchUp — 遊戲直播 AI 回顧｜開發規格 v0.1

日期：2026-11-02，Asia/Taipei。狀態：待使用者確認；尚未開發或完成真人帳號串接測試。

## 1. 目標與已確認需求

- 使用者確認：遊戲直播為主，需要理解畫面；主播主動啟用；觀眾用聊天室指令取得前情摘要；需要成本與防刷控制；可使用截圖加文字回顧。
- 產品承諾：讓中途進台的觀眾了解「目前在做什麼、前面重要進展、有哪些畫面依據」。
- 本規格建議：單頻道、本機 OBS 擷取、定時視覺分析、所有人共用摘要、圖文回顧頁。
- 抽樣理解不是逐秒觀看，不能宣稱讀完所有影片或找出所有精彩片段。只整理啟用後的內容。
- 待確認：實測遊戲、Twitch 測試頻道、OBS 是否已安裝、可用 API 帳號與預算。這些不影響先做離線模式。

## 2. 參賽交付要求

以官方規則為準，查核日期同上：
https://twitchcon-codex.devpost.com/rules
https://twitchcon-codex.devpost.com/

- 截止：2026-11-02 14:00 PST，即台灣 2026-11-03 06:00。
- 作品須在投稿期間新建、以 Codex 開發並實際連接 Twitch；安裝執行結果應符合描述。
- 必交：GitHub/GitLab/Bitbucket 程式碼倉庫網址，包含原始碼、素材與執行說明；ZIP 僅是額外便利包，不能取代倉庫。
- 必交：功能與 Codex 使用方式的文字說明、主要開發對話的真實 Codex Session ID。
- 必交：公開 YouTube 展示影片；保守控制於 2 分 50 秒內，包含真實 Twitch 運作與 Codex 開發畫面。
- 投稿資料需英文或附完整英文翻譯；README、測試指引、影片字幕與產品說明採英文，另附繁體中文操作版。
- 測試存取需免費且於評審期維持可用；評審期至 11/15 17:00 Pacific Time。離線模式降低評審重現門檻，但不代替真實 Twitch 影片。
- 私有倉庫須依官方頁面指定對象分享；不能將未確認的 email 自行填入。所有素材須有使用權。
- 評分：創意、影響、技術實作、設計。以新觀眾體驗、圖片證據與可重現性呈現差異。
- 送出前重新檢查活動頁與實際表單。本文未登入表單，不能保證沒有額外欄位。

## 3. 最小功能與界線

### 必做

1. 主播控制頁：Start / Pause / End、新場次、OBS 連線與來源選擇、分析狀態、用量、最近錯誤；只有主播可操作。
2. OBS 遊戲來源截圖：預設每 10 秒一次、960×540 等比縮放；不擷取整個桌面；每張帶場次與經過時間。
3. 每分鐘視覺分析：最多六張圖＋前一段固定長度狀態，輸出結構化事件；每張圖片獨立帶識別碼與時間。
4. 每十分鐘建立章節摘要；舊事件另存不可因壓縮消失。查詢全場章節＋近期狀態，不重新讀所有原圖。
5. Twitch `!recap` 與 `!回顧`：取得同一份快取摘要；回覆目標不超過 350 字元（含網址），過長先安全截短。無資料則告知尚在建立。
6. 公開唯讀回顧頁：目前目標、全場章節、近期最多三張事件卡、整理截至時間、AI 不確定標示；英文為預設，提供繁中。
7. 事件卡用原始截圖＋簡短文字，不產生新圖片、不輸出 PPTX。
8. 離線模式：使用專案自製遊戲測試畫面／固定事件資料，不需 Twitch 或 API 金鑰即可操作；明顯標示 Fixture / Simulated，不冒充 AI 實測。
9. 真實模式：OBS、影像 API、Twitch 真的串起來；各段連線狀態獨立顯示。
10. 匯出本次摘要、去識別驗證紀錄與實際 token 用量；不匯出任何密鑰。

### 延後

音訊轉錄、逐秒事件保證、多頻道、多遊戲最佳化、自由問答、Twitch Extension、捐款／訂閱、直播角落自動輪播、影片剪輯、雲端帳號平台。

## 4. 技術架構

建議 Node.js 24 LTS + TypeScript；版本與 SDK 相容性於開發開始時核對、鎖定 lockfile。單一服務加簡單 HTML/CSS/JS，避免完整前端框架與資料庫部署。

資料流：

OBS 遊戲來源 → 本機擷取器 → 有界圖片佇列 → 視覺模型 → 結構化事件 → 章節／最新摘要

Twitch EventSub → 固定指令與限流 → 摘要快取 → Twitch Send Chat Message API

摘要與選定截圖 → 公開唯讀回顧頁；本機管理頁與密鑰保持私有。

- OBS：obs-websocket-js，呼叫 GetSourceScreenshot；僅連本機 OBS，密碼由後端環境變數讀取。
- Twitch：EventSub WebSocket 收訊，Helix HTTP API 發訊；第一版以主播本人帳號作為 installed chatbot，省去獨立 bot 與雙方授權。
- AI：OpenAI Responses API，模型由 OPENAI_MODEL 設定，必須支援圖片輸入與結構化輸出；開發時用可用、未停用模型做 10 分鐘比較後選擇，不沿用已棄用模型。
- 儲存：本機 JSON/JSONL＋圖片目錄；單寫入者、原子更新快取、每個場次獨立；不保存完整直播影片。
- 公開頁：可匯出靜態 HTML/JSON/JPEG，部署於靜態主機；本機只推送公開資料，不公開管理服務。開發離線階段 localhost 可看，但不能當作聊天室可點開的公開網址。
- 若時間不足，公開頁先用帶時間標記的手動發布快照；明確顯示更新時間。真實 Twitch 聊天文字回顧仍須工作。
- 不需將 Twitch stream key 提供給 AI 或本工具。

建議模組：capture/、vision/、recap/、twitch/、server/、public/、fixtures/、tests/、docs/、scripts/。

### 事件資料契約

Event：id、sessionId、startSec、endSec、summary、currentState、evidenceFrameIds、uncertainty。

- 只接受本輪存在的圖片 ID；模型回傳不存在 ID 則拒收該證據。
- 不確定與未觀察到分開；前後兩張圖不等於中間動作已被看見。
- 無明顯新事件可輸出空陣列。禁止為湊滿三條編故事。
- 遊戲內文字、聊天室與畫面內容視為資料，不接受其要求改指令或外傳密鑰。
- 一款遊戲設定檔：遊戲名、主播目標、常見狀態；先支援明確關卡／回合／結算，避免以瞬間擊殺為主要驗收。

## 5. 成本與防刷

預設：每 10 秒一張，60 秒一輪，360 張／小時，60 輪／小時；十分鐘測試為 60 張、10 輪。

- 多張同一請求不免除圖片 token 費；JPEG 檔案變小主要降低傳輸，不能假定同比降低模型費。
- 原圖先以 960×540 測試；文字看不清再加 HUD 裁切或提高解析度，不能一律低畫質。detail 設定依選定模型核對，不能假定 low 一定便宜。
- 每輪狀態上限 1,000 字元，最多三個事件；固定 JSON schema，設定輸出 token 上限。
- 歷史圖片不反覆送入；只送新六張＋短狀態。舊章節查詢走現成文字，不讓上下文隨直播無界增長。
- 每頻道 60 秒、每使用者 120 秒指令冷卻；冷卻中靜默，避免錯誤提示洗版；`!recap` 不呼叫 AI。
- 僅一個在途模型任務、佇列最多兩輪；落後時丟棄最舊待處理輪並標記資料缺口；不是無限追趕。
- 每場預設模型預算 US$1，可調；不是實際費用估價。按 usage token 與已查核單價記帳；若無用量紀錄，保留保守預估不能當零。
- 呼叫前預留本輪最大預估額度；不足即停新分析；重試也預留與計費。API 端若不能提供硬上限，明示本地預估可能有誤差。
- 網路暫時失敗最多一次延遲重試；認證、額度錯誤不重試；429 依 Retry-After 處理並受佇列／預算約束。
- 圖片保留策略：未被選為證據者分析後刪除；單場證據預設最多 100 張，超限先清舊縮圖並保留事件文字；End 後提供整場清除。
- 第一版不做場景變化觸發：遊戲鏡頭移動易誤觸，先取得固定頻率基準。
- 十分鐘實測後：模型費用／觀察分鐘×60＝每小時推估；另外列重試、主機、網域、儲存／流量；不能將模型成本稱為總成本。

官方影像成本依據：https://developers.openai.com/api/docs/guides/images-vision
官方價目：https://developers.openai.com/api/docs/pricing

## 6. Twitch／OBS 串接與逐步驗證

這是已查核文件支持的「待執行流程」，不是已在使用者帳號驗證成功。

1. Twitch 帳號確認 email 與啟用 2FA；進 https://dev.twitch.tv/console → Applications → Register Your Application。
2. 建立獨立應用程式、選擇合適分類，設定與本機服務完全一致的 OAuth callback（建議 http://localhost:3000/auth/twitch/callback，依主控台實際接受值確認）。記錄 Client ID；Client Secret 如流程需要僅存在後端。
3. 本機後端實作 Authorization Code Flow，使用隨機 state 防偽造；只請求 user:read:chat、user:write:chat。測試階段可用 Twitch CLI 官方 token 命令，但 token 的 client ID 必須與 API 標頭一致。
4. 主播本人授權；後端透過 token validation 驗證 client ID、user ID、scope、到期時間，啟動與定期驗證並處理 refresh。token 永不放網址、截圖、前端或 log。
5. 連 wss://eventsub.wss.twitch.tv/ws；收到 session_welcome，預設十秒內 POST https://api.twitch.tv/helix/eventsub/subscriptions。
6. 訂閱 type=channel.chat.message、version=1；condition 的 broadcaster_user_id 與 user_id 在此單帳號模式均為已授權主播 ID；transport.method=websocket、session_id=welcome ID。驗收 HTTP 202 與 enabled 狀態。
7. 觀眾輸入 !recap；驗收 notification 有對應事件 ID。按 metadata.message_id 去重；不將同一訊息處理兩次。
8. POST https://api.twitch.tv/helix/chat/messages；broadcaster_id 與 sender_id 使用此主播 ID，message 使用快取短摘要。驗收 HTTP 成功且 data[0].is_sent=true，並在真實聊天室看到回覆；若 is_sent=false 顯示 drop_reason，不能只看 HTTP 200。
9. 處理 keepalive timeout、session_reconnect、撤權與重連；一般斷線需重新訂閱，標示斷線期間訊息無法重播。不得把聊天文字送進 EventSub socket。
10. OBS：Tools → WebSocket Server Settings，啟用與設定密碼；本機程式連線 → 列出來源 → 選遊戲來源 → GetSourceScreenshot。驗收圖片與 OBS 當下遊戲一致，切換／隱藏來源時要檢查不黑畫面。
11. Start 後跑十分鐘；觀眾下指令，看到真實回覆、公開回顧頁和實際截圖，核對來源時間。圖片擷取時間與 Twitch 播放延遲不同，公開發布設定延遲門檻，原型先用 30 秒並實測調整，以免回顧劇透直播。
12. 重複輸入指令，確認不新增 AI 任務；Pause／End 後停止擷取；撤銷授權與額度不足時顯示可理解的狀態。

驗證紀錄存 docs/verification.md：日期、版本、遮罩後帳號、步驟、預期／實際、去識別 API 結果、成功／失敗／未執行。不得虛構真人驗證。

官方步驟來源：
- https://dev.twitch.tv/docs/authentication/register-app
- https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/
- https://dev.twitch.tv/docs/authentication/validate-tokens/
- https://dev.twitch.tv/docs/chat/authenticating/
- https://dev.twitch.tv/docs/eventsub/handling-websocket-events
- https://dev.twitch.tv/docs/chat/send-receive-messages/
- https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#getsourcescreenshot

## 7. 開發順序與退出條件

以下為工程估計，不保證工時；先做可驗證縱向流程。

1. 離線骨架（約 1–2 小時）：自製六至十二張狀態畫面、事件 schema、摘要頁、固定指令模擬；不需金鑰。退出：新使用者可依 README 啟動、辨識模擬模式。
2. 真實畫面＋AI（約 2–4 小時）：OBS 擷取、六圖分析、事件卡、章節、用量與暫停；用一款遊戲跑十分鐘。退出：事件有證據、沒有憑空結果、實際計費可查。
3. Twitch（約 1–3 小時，不含帳號驗證等待）：OAuth、EventSub、回覆、去重、限流、重連；先串快取再接 AI。退出：真實聊天室輸入一次得到正確摘要。
4. 交付（約 1–2 小時）：公開回顧頁、英文說明、測試、去密鑰 ZIP、Git 倉庫、影片腳本。退出：全新目錄依 README 可重現。

時間不足依序刪：語系切換美化 → 更多圖片卡 → 複雜章節排版；保留真實 Twitch、視覺證據、限流與英文測試說明。

## 8. 必要測試與驗收

- 離線全流程可重現；fixture 不是 AI 正確率證據。
- 同一事件重送／同時多人指令：最多一次允許回覆，AI 呼叫數不增加。
- 預算不足：下一輪不發出；失敗重試有計數；重啟不重置同場預算。
- 六圖順序、事件證據 ID、未知欄位與錯誤 JSON 都有驗證；頁面 escape 模型文字避免 HTML 注入。
- 30 分鐘直播人工核對：至少記錄五個可觀察關鍵事件的命中、漏掉、錯誤敘述；不預先宣稱準確率。
- 資料持久化、OBS 斷線、API 失敗、Twitch 斷線各測一次；明示停止／缺口。
- 公開頁不能讀環境變數、管理端、原始帳號／token 或私人資料；發布與 ZIP 皆採 allowlist。
- 無現成 API／帳號時標示 pending，不能勾選 live validated。

## 9. 確認後要產出的交付包

- src/、public/、fixtures/、tests/、package.json、lockfile：完整原始碼、可重現依賴與必要素材。
- README.md（英文）、README.zh-TW.md：安裝、offline/live、設定、限制、排錯與測試步驟。
- .env.example：僅空值與非秘密預設；.gitignore 排除 .env、token、log、真實圖片與 node_modules。
- docs/TWITCH_SETUP.md：逐步帳號串接與每步驗證。
- docs/verification.md：實際執行證據與未執行項。
- docs/SUBMISSION.md：英文 Devpost 文案、repo/video/session ID 待填欄；不虛構連結。
- docs/DEMO_SCRIPT.md：150–170 秒英文腳本與字幕，包含 Twitch 與 Codex 畫面。
- docs/COSTS.md：使用模型、單價查核日、實測 usage、成本範圍與上限限制。
- LICENSE、素材來源與授權；只放有權使用素材。
- scripts/package：從允許清單打包 catchup-demo-v0.1.zip，附 SHA256；ZIP 解壓後依 README 可重現。

README 不內含本專案私人職涯／財務背景。生成、上傳影片、建立公開倉庫與實際提交分別回報狀態，不把本機 ZIP 當成已投稿。

## 10. 開發交接指令

依此規格開發 CatchUp。先檢查本機執行環境與適用 AGENTS.md，採最少依賴，不改動職涯文件。先交付無金鑰可啟動的離線流程，再接 OBS、視覺 API、Twitch。所有外部服務驗證記錄成功、失敗與未執行；不可偽造。API key、Twitch OAuth 與 OBS 密碼僅在本機設定，不要求貼到聊天。完成必要測試、英文 README 與 ZIP 後回報可重現步驟及仍需使用者操作的帳號步驟。真實影片應呈現實際 Twitch 運作，依官方要求填入真實 Codex Session ID。未獲確認前只整理規格，不開始 demo 實作。
