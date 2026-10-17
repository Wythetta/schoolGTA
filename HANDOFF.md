# 光明國小 3D 探險遊戲 — 移轉 Claude Code 交接文件

## 專案
- 單一 HTML 檔(`guangming-game.html`,約 2300 行):CSS + HUD 標記 + 一個內嵌 `<script>` IIFE。Three.js r128 UMD,CDN:`https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`。字型 Noto Sans TC(Google Fonts)。
- 已發佈為 Claude Artifact(Version 8):https://claude.ai/artifact/APeNs126FhVfC6iT8gMsvR 。到 Claude Code 後可直接以本地檔案開發,不必再走 Artifact。
- 主題:新竹縣竹北市光明國小,原創、兒童安全、**不開車**的第三人稱自由探索。角色只能走/跑/跳/蹲。
- 使用者慣用語言:繁體中文。

## 座標與地圖(已依使用者提供的大門照片與空拍圖定案)
- x=東、z=南(北為 −z)、y=上,單位公尺。校園 x∈[−58,58]、z∈[−45,56]。玩家邊界 BX=84、BZ=76。
- 大門在東側,位於東邊斑馬線左(西)側:`GX=58, GZ=-24`,門朝東。以旋轉 Group(`host`/`xf` 轉換碰撞)建在局部座標。出生點 `P0={x:GX+4.5,z:GZ}`。
- 操場 `TRK={hl:22,r:26,cz:10}` 體育場形跑道,內圈土 r=18,草皮 `P(0,10,48,34)`,球門在 x=±27.5。
- 建築:西側教學大樓、東側樓、圓頂大樓(25,−37)、司令台(5,−21.5)。南側(籃球場、沙地遊戲場、跳躍方塊、矮棚架、鞦韆、單槓)為自行配置,**不在照片中**。
- 10 顆光明星收集目標、小地圖(MS=1.7)、區域名稱 ZONES。

## 物理與控制(自製,無物理引擎)
- AABB `boxes` + 圓 `circles`;`blocked/groundAt/ceilingAt/canStand`。WALK 3.0、RUN 6.4、跳躍頂點約 1.38 m、STEP 0.45。
- 鍵盤:WASD 走、Shift 跑、Space 跳、C 蹲、F 互動、Q/E 轉視角、V 雲霄飛車換視角、⌘/Win 或 K 換裝。手機:搖桿 + 跳/蹲/互動/換裝按鈕。
- `mode`:`free | swing | bar | coaster`;另有 `chatKid`(對話中,mode 仍是 free)。
- 每格順序:`updateModes → update → pose → updateKids → updateRiders → updateCamera → updateBubbles`。

## 已完成功能
1. 3D 校園、星星收集、大門(依照片)、空拍重排。
2. 鞦韆、兩支單槓(Pendulum 物理)。
3. **單槓 10 動作**:數字鍵 1–0 或畫面按鈕。引體向上、屈膝舉腿、L 型、大擺盪、單手揮手、膝掛倒吊、轉體、翻上撐體、大迴環、飛身下槓(離槓後空翻 `flipP`)。10 種全做完有提示。
4. **46 位同學(手機約 26)**:慢跑(沿跑道)、足球(含傳球的球)、聊天小組、各區漫步。輕量角色工廠 `makeKid`;85 m 外隱藏;與玩家、彼此有分離推擠。
5. **雲霄飛車**(見下),站在操場西側 x≈−35。
6. 對話與想法:靠近同學出現氣泡(DOM 池,最多 6 個,`updateBubbles`);F 開啟對話框(選項 1–5);對話中玩家凍結。
7. 換裝 6 套(校服/體育服/太空人/小廚師/恐龍/超級英雄):`char.applyCostume`,改共用材質顏色並切換配件。
8. 衝撞:Shift 跑步迎面撞到同學 → `kickKid`/`flyStep`/`poseFly`(飛行、落地、暈眩、起身),喜劇風格、無傷害描寫。

## 雲霄飛車設計(重要)
- `coaster-core.js` 的 `buildCoasterTrack(CR,cfg)`:純 JS,先在 2D 用直線與半圓組出蛇行路徑(6 條橫向直道、間距 10、轉彎半徑 5、x∈[−52,56]),再用 `CR` 五個彎道頂高度決定谷底曲線(谷深 `VH=40`、單丘飛越 hump),Y 做滑動平均,依 3D 弧長重取樣到 1 m。
- 目前 `CR=[48,45.66,41.33,37.31,33.6]`,是用 `t/ctune.js` 風格的迭代求解得出(讓各彎道速度約 12.5 m/s)。**改任何參數(VH、CHAIN、R、車道數)都必須重新解 CR**。解法:迴圈重建軌道 → 量各彎道 `V` 平均 → `CR[k] += (v²−target²)/(2g)*0.7`。
- 速度:升降機 `CHAIN=14 m/s` → 之後能量守恆(`CF=0.010`、`CD=0.00035`)→ 進站前制動限制(先降到 6.5 m/s 過最後彎,再以 3.2 m/s² 煞停)。軌道長約 870 m、全程約 60 秒、最高約 110 km/h。
- 實測極限:垂直 G 最大約 8、側向 G 約 3、空中感最低約 −0.3 G。**要更快的主要限制是谷底曲率(G 值),不是能量**。
- 幾何:`sweep()` 沿軌道擠出兩條軌(黃)與中樑(藍)、枕木與支柱用 InstancedMesh;支柱用 `blocked()` 過濾並加圓形碰撞。車站(月台、屋頂、招牌)必須在支柱之前建立,以免支柱插進月台。
- 乘車:`mountCoaster/updateCoaster/dismountCoaster/poseCoaster`;`train.dist` 為從站內起點行進的距離,速度 `V[]` 以位置查表。視角 `train.view`(0 追尾 / 1 第一人稱),速度越快 FOV 越大、有震動與速度線(`#speedfx`)。進站後 F 下車,9 秒後自動下車。

## 已定案的決定(別再重做)
- 「當槓」解讀為「單槓」筆誤。
- 單槓的引體向上用手臂 `scale.y` 縮短示意,不做真正肘關節旋轉(符號慣例不明確)。
- 角色模型朝 local +z;腿/手臂 `rotation.x` 為負 = 向前;小腿正值 = 膝蓋向後彎;`upper.rotation.x` 正值 = 前傾。
- 空翻/翻滾用 `hips.rotation.x`(繞髖關節),不要轉 root。玩家 `root.rotation.order='YXZ'`,NPC 預設 XYZ。
- 側向傾斜 bank 由模擬速度算出:`atan2(v²κ, g)` 再平滑;不做垂直迴圈(姿態框架會翻轉)。
- 所有碰撞為近似;樹為 InstancedMesh,不是碰撞物。

## 死路 / 踩過的坑
- 大門位置與外觀曾兩次錯誤,最終以使用者照片重建;舊檔 `guangming-game.html`(南門版)已作廢。
- 本機測試時 `[hidden]` 不生效(Artifact 骨架才提供 `[hidden]{display:none!important}`),測試需手動注入 CSS。
- 無頭瀏覽器 FPS 極低,遊戲 dt 夾在 0.033 會讓時間變慢;`#debug` hash 會放寬到 0.12 並匯出 `window.__g` 供測試。**發佈前可保留,無害**。
- 軌道谷底曾因 hump 不連續與 sm5 曲率集中造成 6–7 G,已改成 sin² 谷型 + 平滑 hump。
- 把雲霄飛車路徑硬畫成逐點 Catmull-Rom 會尖角、曲率爆表,改為解析式直線+圓弧+Y 平滑。

## 測試方式(Claude Code 內可重現)
- 語法:抽出最後一個 `<script>` 內容,`node --check`。
- 執行:Playwright + `/opt/pw-browsers/chromium`,參數 `--use-gl=swiftshader --enable-unsafe-swiftshader --no-sandbox`;攔截 three.min.js 改走本機 `npm i three@0.128.0` 的檔案;開 `file://…/guangming-game.html#debug`,用 `window.__g`(P0、kids、train、CT、mountCoaster、startChat…)操作。
- 軌道調校:node 載入 `coaster-core.js` 跑模擬,看 vmax、各彎速度、垂直/側向 G、車道間最小距離(≥10 m)。

## 尚未驗證 / 風險
- 只在桌機模擬環境測過,**沒有真機與觸控測試**;手機效能(46 位同學 + 軌道 + 陰影)未量測。
- 手機上換裝/聊天/飛車按鈕的版面未實機確認。
- 角色姿勢是風格化的(單槓、坐姿、擠壓);相機穿牆、樹遮擋等細節未處理。
- 司令台、圓頂大樓尺寸為估計值。

## 可能的下一步
- 手機實測與效能優化(同學數量、陰影、貼圖)。
- 同學使用鞦韆/單槓/籃球;更多對話內容與任務(收集星星後的下一階段)。
- 雲霄飛車:音效、G 力顯示、更多軌道造型;若要更快需先加長車道或放寬 G 上限,並重解 CR。
- 把單檔拆成多檔(程式、軌道核心、資料)方便維護。

## 偏好(使用者)
- 回答用繁體中文;大型工作先分段、在適當時機提醒開新對話;除錯時先檢查最近自己改了什麼、必要時用瀏覽器 console 實測;找到修法後先說明並等使用者確認再實作。
