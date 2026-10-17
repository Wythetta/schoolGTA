# 光明國小 3D 探險遊戲 — 移轉 Claude Code 交接文件

## 專案
- 單一 HTML 檔(`guangming-game.html`,約 2900 行):CSS + HUD 標記 + 一個內嵌 `<script>` IIFE。Three.js r128 UMD,CDN:`https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`。字型 Noto Sans TC(Google Fonts)。
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
- AABB `boxes` + 圓 `circles`;`blocked/groundAt/ceilingAt/canStand`。WALK 3.0、跳躍頂點約 1.38 m、STEP 0.45。玩家移動每步 ≤0.3 m 分段檢查碰撞(高速防穿牆)。
- 跑步四段變速 `GEARS=[3,7,9.5,12,15]`(`gear`、`updateGear`):按住 Shift/搖桿推到底,速度達該段 85% 持續 1.1 s 升一段;急轉彎(方向夾角 >~70°)或撞到東西掉段;放開 Shift 落地後歸零。
- 鍵盤:WASD 走、Shift 跑(按住加速)、Space 跳、C 蹲、F 互動、Q/E 轉視角、V 雲霄飛車換視角、⌘/Win 或 K 換裝、M 音效開關、X 解散跟班;單槓上 1–0 動作、R 編排、Enter 連續播放、Backspace 刪除、Esc 停止。手機:搖桿 + 跳/蹲/互動/換裝/解散按鈕,單槓第 6 欄為「編排/開始」。
- `mode`:`free | swing | bar | coaster`;另有 `chatKid`(對話中,mode 仍是 free)。
- 每格順序:`updateModes → update → pose → updateKids → updateRiders → updateCamera → updateBubbles`,之後 `dust.update`、`updateFireworks`。

## 已完成功能
1. 3D 校園、星星收集、大門(依照片)、空拍重排。
2. 鞦韆、兩支單槓(Pendulum 物理)。
3. **單槓 10 動作**:數字鍵 1–0 或畫面按鈕。引體向上、屈膝舉腿、L 型、大擺盪、單手揮手、膝掛倒吊、轉體、翻上撐體、大迴環、飛身下槓(離槓後空翻 `flipP`)。10 種全做完有提示。
4. **46 位同學(手機約 26)**:慢跑(沿跑道)、足球(含傳球的球)、聊天小組、各區漫步。輕量角色工廠 `makeKid`;85 m 外隱藏;與玩家、彼此有分離推擠。
5. **雲霄飛車**(見下),站在操場西側 x≈−35。
6. 對話與想法:靠近同學出現氣泡(DOM 池,最多 6 個,`updateBubbles`);F 開啟對話框(選項 1–5);對話中玩家凍結。
7. 換裝 6 套(校服/體育服/太空人/小廚師/恐龍/超級英雄):`char.applyCostume`,改共用材質顏色並切換配件。
8. 衝撞:Shift 跑步迎面撞到同學 → `kickKid`/`flyStep`/`poseFly`(飛行、落地、暈眩、起身),喜劇風格、無傷害描寫。力道隨速度增加。飛完後 `startReturn`:跑者走回跑道、聊天的走回原位(`hx/hz`),不再瞬移。
9. **跑步四段變速**:HUD `#gear` 顯示段數;高速步幅加大、前傾,極速段手臂後擺;FOV 放大、速度線、腳下揚塵 `dust`。
10. **單槓連續動作** `combo={edit,seq,run,i}`:`comboEdit/comboAdd/comboBack/comboPlay/comboNext`。動作結束(含引體向上 `pullT` 歸零)時接下一個;最多 12 個,「飛身下槓」只能放最後。
11. **音效** `SFX`(Web Audio 即時合成,無音檔):腳步依地面 `surfaceAt`(草/沙/跑道/硬地)、跳/落地、換段、撞人(bonk + 滑哨)、落地暈眩、星星、鞦韆風聲、單槓、聊天、換裝、雲霄飛車鏈條 `clack`/煞車 `hiss`、持續風聲 `wind`(跑速/飛車速度)、煙火升空 `whistle` 與爆炸 `boom`。第一次點擊/按鍵才建立 AudioContext;分頁隱藏時暫停;開關存在 localStorage `gm-sound`。
12. **跟班**(最多 `MAXF=5`):聊天選「一起玩吧」→ `recruit`。玩家路徑記成麵包屑 `trail`(每 0.3 m,含 y 與蹲下),第 i 位追 `trailAt(頭 − (i+1)×1.3 m)`;跑步跳在原地點 `jumpPts` 重現、原地跳依序跳 `jumpT`、蹲下同步。`followStep` 自帶重力/台階/天花板;卡住 2.5 s 會「咻」回路線上。踢球的同學加入時從 `soc.kids` 移出,解散後放回。轉身面對跟班才會出現聊天提示,選項 4 變成「解散」。
13. **解散**(X、觸控「解散」、或對跟班說):朝鏡頭前方扇形飛出(`dismissAll`),到最高點時在飛行方向前上方炸煙火 `firework`(Points + 圓點貼圖),鏡頭 `camShow` 壓低約 3 秒看天空。雲霄飛車上不能解散。
14. **跟班模仿器材**:玩家上鞦韆/單槓時 `assignSeats` 依距離分配其他座位,跟班走過去 `sitDown`(10 s 未到就直接就位)。鞦韆座位擺角以指數消除差距後與玩家同步;另一支單槓的 pivot 旋轉跟玩家那支一樣;姿勢用 `swingPose` / `applyBarPose(r,BP,scale)`(依身高縮放)。玩家跳下或飛身下槓時跟班一起(`leaveSeat(k,true)`,彈道 `ballistic`,飛身含空翻)。雲霄飛車:`mountCoaster` 先進 `board` 狀態等跟班走上月台、替換預設乘客 `train.riders[i].sub`(最多 7 s),下車時排在月台上。

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
- 鞦韆改為兩跨 6 個座位(x −52.5…−45.5,z 52),沙地加寬到 x −54;單槓移到 z 46.0 / 49.3(原 49.5 / 52.8 時從後槓飛身下槓會飛出南側圍牆),每支 3 個位置 `BAR_SLOTS=[−0.85,0,0.85]`,玩家吸附最近的位置。
- 跟班上限 5 人 = 雲霄飛車可替換的乘客數 = 鞦韆/單槓空位數(扣掉玩家)。
- 走跑姿勢共用 `walkPose`,改主角動作時跟班會一起變。

## 死路 / 踩過的坑
- 大門位置與外觀曾兩次錯誤,最終以使用者照片重建;舊檔 `guangming-game.html`(南門版)已作廢。
- 本機測試時 `[hidden]` 不生效(Artifact 骨架才提供 `[hidden]{display:none!important}`),測試需手動注入 CSS。
- 煙火若在跟班身邊炸開會貼著鏡頭糊滿畫面;若放太高又因鏡頭俯角看不到。現行解法:沿飛行方向前方 9 m、高 7 m 炸開 + 解散時鏡頭短暫壓低。
- 跟班走向單槓兩端位置時會被立柱卡住:位置內縮到 ±0.85,並從單槓前方 0.6 m 抓槓。
- 無頭瀏覽器 FPS 極低,遊戲 dt 夾在 0.033 會讓時間變慢;`#debug` hash 會放寬到 0.12 並匯出 `window.__g` 供測試。**發佈前可保留,無害**。
- 軌道谷底曾因 hump 不連續與 sm5 曲率集中造成 6–7 G,已改成 sin² 谷型 + 平滑 hump。
- 把雲霄飛車路徑硬畫成逐點 Catmull-Rom 會尖角、曲率爆表,改為解析式直線+圓弧+Y 平滑。

## 測試方式(Claude Code 內可重現)
- 語法:抽出最後一個 `<script>` 內容,`node --check`。
- 執行:Playwright + `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`,參數 `--use-gl=swiftshader --enable-unsafe-swiftshader --no-sandbox --autoplay-policy=no-user-gesture-required`(手機版加 `isMobile/hasTouch`,viewport 844×390);攔截 three.min.js 改走本機 `npm i three@0.128.0` 的檔案;開 `file://…/guangming-game.html#debug`,用 `window.__g`(P0、kids、train、CT、mountCoaster、startChat、followers、recruit、dismissAll、combo、SFX、gear…)與 `window.__setYaw` 操作。無頭模式遊戲時間約為實際的 0.4 倍。
- 軌道調校:node 載入 `coaster-core.js` 跑模擬,看 vmax、各彎速度、垂直/側向 G、車道間最小距離(≥10 m)。

## 尚未驗證 / 風險
- 只在桌機模擬環境測過,**沒有真機與觸控測試**;手機效能(46 位同學 + 軌道 + 陰影 + 煙火)未量測。
- 音效只驗證過會被呼叫、無錯誤,**沒有實際聽過**;音量平衡、iOS Safari(靜音鍵、需手勢解鎖)未確認。
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
