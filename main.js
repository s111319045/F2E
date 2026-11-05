// 管理密碼常數
    const ADMIN_PASSWORD = "1314";

    // 預設全域狀態物件 (Default App State)
    const DEFAULT_APP_STATE = {
      board: {
        room: {
          user: "",
          badgeType: "dnd", // dnd, dark, chill, welcome
          badgeText: "勿擾 DND",
          desc: "專注工作中",
          battery: 80
        },
        bath: {
          status: "空閒",
          minutes: 0,
          next: "",
          laundry: "無待洗/待取衣物"
        },
        chore: {
          text: "倒垃圾",
          time: "晚上 20:45"
        },
        supplies: [
          { id: "s1", name: "衛生紙", status: "存量尚足", isUrgent: false },
          { id: "s2", name: "洗碗精", status: "存量尚足", isUrgent: false },
          { id: "s3", name: "專用垃圾袋", status: "存量尚足", isUrgent: false }
        ],
        broadcast: ""
      },
      cms: {
        hero: {
          title: "無聲的默契，剛剛好的距離。",
          subtitle: "專為合租與共居生活打造的低功耗 E-ink 狀態同步看板。不發光、免牽線、無聲溝通，化解日常所有的尷尬碰撞。"
        },
        expo: {
          venue: "畢業成果展出資訊：松山文創園區",
          advisor: "",
          code: "",
          tag: "2026 畢業設計展"
        },
        slides: [
          { title: "不是另一塊讓人分心的發光螢幕，而是一張會自動更新的紙。" },
          { title: "免敲門、免寒暄，一眼看透彼此的「社交電量」。" },
          { title: "告別「我以為你會倒」，終結共居生活的家務猜忌日常。" },
          { title: "極限低功耗物聯網架構，兼具美學與工程實力。" }
        ],
        team: []
      },
      notes: [],
      poll: {
        question: "在合租或共居生活裡，哪一瞬間最讓你感到心累與尷尬？",
        desc: "你的心聲，正是我們本次畢業專題誕生的理由。請點選最戳中你的一項：",
        options: [
          { id: "opt0", text: "1. 衣服洗好留在洗衣機兩天沒人收", votes: 0 },
          { id: "opt1", text: "2. 以為衛生紙還有，如廁後才發現只剩紙筒", votes: 0 },
          { id: "opt2", text: "3. 戴著耳機在房間，室友沒敲門突然推開探頭", votes: 0 },
          { id: "opt3", text: "4. 想洗澡但永遠不知道裡面有沒有人、還要等多久", votes: 0 }
        ]
      },
      leads: []
    };

    // 當前運行狀態
    let appState = null;

    function initAppState() {
      // 清除舊版本模擬資料快取，保證無虛假人物與假票數
      localStorage.removeItem('synk_app_state_v1');
      const saved = localStorage.getItem('synk_app_state_v2');
      if (saved) {
        try {
          appState = JSON.parse(saved);
          // 深度清除舊快取中的遺留虛構人名
          if (appState.cms && appState.cms.expo && (appState.cms.expo.advisor === '張教授 Dr. Chang' || appState.cms.expo.advisor === '成果展指導組')) {
            appState.cms.expo.advisor = '';
          }
          if (appState.board && appState.board.room && (appState.board.room.user === 'Alan' || appState.board.room.user === '小明')) {
            appState.board.room.user = '';
          }
          if (appState.board && appState.board.bath && (appState.board.bath.next === 'Alan' || appState.board.bath.next === '小明')) {
            appState.board.bath.next = '';
          }
          // 修復簡報標題快取，若第 4 頁缺少或標題為空則恢復預設標題
          if (!appState.cms) appState.cms = {};
          if (!Array.isArray(appState.cms.slides) || appState.cms.slides.length < 4 || !appState.cms.slides[3] || !appState.cms.slides[3].title) {
            appState.cms.slides = JSON.parse(JSON.stringify(DEFAULT_APP_STATE.cms.slides));
          }
          // 修復首頁投票題目快取，若題目或描述為空則恢復預設
          if (!appState.poll || !appState.poll.question || !appState.poll.desc || !Array.isArray(appState.poll.options) || appState.poll.options.length < 4) {
            appState.poll = JSON.parse(JSON.stringify(DEFAULT_APP_STATE.poll));
          }
          // 保證便條陣列為 Array
          if (!Array.isArray(appState.notes)) {
            appState.notes = [];
          }
          localStorage.setItem('synk_app_state_v2', JSON.stringify(appState));
        } catch (e) {
          console.error("Failed to parse saved state, fallback to default", e);
          appState = JSON.parse(JSON.stringify(DEFAULT_APP_STATE));
        }
      } else {
        appState = JSON.parse(JSON.stringify(DEFAULT_APP_STATE));
      }
    }

    function saveState() {
      localStorage.setItem('synk_app_state_v2', JSON.stringify(appState));
    }

    function showToast(msg) {
      const toast = document.getElementById('toast-notification');
      document.getElementById('toast-message').textContent = msg;
      toast.classList.remove('translate-y-20', 'opacity-0');
      setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
      }, 2500);
    }

    // ==========================================
    // 密碼驗證邏輯 (Password Auth: 1314)
    // ==========================================
    function requestAdminAccess() {
      document.getElementById('password-modal').classList.remove('hidden');
      document.getElementById('admin-pass-input').value = '';
      document.getElementById('password-error-msg').classList.add('hidden');
      setTimeout(() => {
        document.getElementById('admin-pass-input').focus();
      }, 100);
      lucide.createIcons();
    }

    function closePasswordModal() {
      document.getElementById('password-modal').classList.add('hidden');
      document.getElementById('password-error-msg').classList.add('hidden');
    }

    function verifyAdminPassword(e) {
      e.preventDefault();
      const input = document.getElementById('admin-pass-input').value.trim();
      if (input === ADMIN_PASSWORD) {
        closePasswordModal();
        openAdminDrawer();
        showToast("🔓 驗證成功，已進入後台管理！");
      } else {
        const errorMsg = document.getElementById('password-error-msg');
        errorMsg.classList.remove('hidden');
        const card = document.getElementById('password-modal-card');
        card.classList.add('translate-x-2');
        setTimeout(() => card.classList.remove('translate-x-2'), 100);
        setTimeout(() => card.classList.add('-translate-x-2'), 200);
        setTimeout(() => card.classList.remove('-translate-x-2'), 300);
        document.getElementById('admin-pass-input').value = '';
        document.getElementById('admin-pass-input').focus();
        lucide.createIcons();
      }
    }

    // ==========================================
    // 渲染函數 (Renderers)
    // ==========================================
    function renderAll() {
      renderHeroBoard();
      renderCmsContent();
      renderPoll();
      renderStickyNotes();
      renderAdminFields();
      lucide.createIcons();
    }

    // 1. 渲染 Hero 電子紙看板
    function renderHeroBoard() {
      const b = appState.board;
      document.getElementById('hero-room-user').textContent = b.room.user || '房門狀態看板';
      document.getElementById('hero-room-desc').textContent = b.room.desc || '專注工作中';
      document.getElementById('hero-room-battery').textContent = `${b.room.battery}% ${getBatteryShortEmoji(b.room.battery)}`;

      // Badge Style
      const badge = document.getElementById('hero-badge-elem');
      badge.textContent = b.room.badgeText || '狀態看板';
      badge.className = getBadgeClass(b.room.badgeType);

      // Bath & Laundry
      document.getElementById('hero-bath-badge').textContent = b.bath.status || '空閒';
      document.getElementById('hero-bath-title').textContent = `主衛浴：${b.bath.status || '空閒'}`;
      const bathTime = b.bath.minutes > 0 ? `預估剩餘 ${b.bath.minutes} 分鐘` : '目前無人使用';
      const bathNext = b.bath.next ? ` ｜ 下一位：${escapeHtml(b.bath.next)}` : '';
      document.getElementById('hero-bath-desc').textContent = `${bathTime}${bathNext}`;
      document.getElementById('hero-laundry-text').textContent = (b.bath.laundry && b.bath.laundry !== '無待洗/待取衣物') ? b.bath.laundry : '無待洗/待取';

      // Chores & Supplies
      const choreTask = b.chore.text ? `${b.chore.text} (${b.chore.time || '本日'})` : '暫無排定家務';
      document.getElementById('hero-chore-line').innerHTML = `<span class="w-2 h-2 rounded-full bg-stone-900 inline-block"></span> ${escapeHtml(choreTask)}`;
      
      const firstUrgent = b.supplies.find(s => s.isUrgent);
      const alertBox = document.getElementById('hero-supply-alert-box');
      if (firstUrgent) {
        alertBox.innerHTML = `<span class="font-bold text-eink-red shrink-0">物資警示：</span><span class="truncate">${escapeHtml(firstUrgent.name)} (${escapeHtml(firstUrgent.status)})</span>`;
      } else {
        alertBox.innerHTML = `<span class="font-bold text-emerald-800 shrink-0">物資：</span><span class="truncate">公用物資皆尚足</span>`;
      }

      // Broadcast
      document.getElementById('hero-broadcast-note').textContent = b.broadcast || '全屋公告：暫無即時廣播事項';
      
      // Update Live Clock
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      document.getElementById('board-live-clock').textContent = timeStr;
      const simClock = document.getElementById('sim-screen-time');
      if (simClock) simClock.textContent = timeStr;

      // Slide 3 耗材清單同步預覽
      renderSlideSupplies();
    }

    function renderSlideSupplies() {
      const container = document.getElementById('slide-supplies-preview');
      if (!container) return;
      container.innerHTML = appState.board.supplies.map(item => `
        <div class="flex items-center justify-between p-2.5 ${item.isUrgent ? 'bg-stone-100' : 'bg-stone-50'} rounded-lg">
          <span class="font-medium">${escapeHtml(item.name)}</span>
          <span class="${item.isUrgent ? 'text-eink-red font-bold font-mono' : 'text-stone-500 font-mono'}">${escapeHtml(item.status)}</span>
        </div>
      `).join('');
    }

    // 2. 渲染 CMS 文案與團隊
    function renderCmsContent() {
      const c = appState.cms;
      document.getElementById('view-hero-title').textContent = (c.hero.title || '無聲的默契，剛剛好的距離。').replace(/\r?\n/g, '');
      const heroSubEl = document.getElementById('view-hero-subtitle');
      if (heroSubEl) {
        if (c.hero.subtitle.includes('E-ink 狀態同步看板') && !c.hero.subtitle.includes('<span')) {
          heroSubEl.innerHTML = c.hero.subtitle.replace('E-ink 狀態同步看板', '<span class="font-semibold text-stone-900 underline decoration-stone-300 decoration-2 underline-offset-4">E-ink 狀態同步看板</span>').replace('。不發光', '。<br class="hidden sm:inline" />不發光');
        } else {
          heroSubEl.textContent = c.hero.subtitle;
        }
      }
      document.getElementById('view-expo-venue').textContent = c.expo.venue;
      const tagEl = document.getElementById('nav-badge-text');
      if (tagEl) {
        const badgeText = (c.expo && c.expo.tag !== undefined) ? c.expo.tag.trim() : '2026 畢業設計展';
        if (badgeText) {
          tagEl.textContent = badgeText;
          tagEl.style.display = '';
        } else {
          tagEl.style.display = 'none';
        }
      }
      const advisorRow = document.getElementById('view-advisor-row');
      const advisorWrap = document.getElementById('view-advisor-wrap');
      const advisorName = document.getElementById('view-advisor-name');
      const projectCode = document.getElementById('view-project-code');

      const rawAdvisor = (c.expo && c.expo.advisor) ? c.expo.advisor.trim() : '';
      const isFakeAdvisor = !rawAdvisor || rawAdvisor === '成果展指導組' || rawAdvisor === '張教授 Dr. Chang';
      const actualAdvisor = isFakeAdvisor ? '' : rawAdvisor;
      const actualCode = (c.expo && c.expo.code) ? c.expo.code.trim() : '';

      if (advisorName) {
        advisorName.textContent = actualAdvisor;
      }
      if (advisorWrap) {
        advisorWrap.style.display = actualAdvisor ? 'inline' : 'none';
      }
      if (projectCode) {
        projectCode.textContent = actualCode;
      }
      if (advisorRow) {
        advisorRow.style.display = (actualAdvisor || actualCode) ? 'flex' : 'none';
      }

      // Slides - 安全渲染，永遠保證四張簡報標題完整呈現，絕不因快取缺失而反白或空白
      const defaultSlideTitles = [
        '不是另一塊讓人分心的發光螢幕，<br class="hidden sm:inline" />而是一張會自動更新的紙。',
        '免敲門、免寒暄，<br class="hidden sm:inline" />一眼看透彼此的「社交電量」。',
        '告別「我以為你會倒」，<br class="hidden sm:inline" />終結共居生活的家務猜忌日常。',
        '極限低功耗物聯網架構，<br class="hidden sm:inline" />兼具美學與工程實力。'
      ];

      for (let i = 0; i < 4; i++) {
        const el = document.getElementById(`view-slide-${i}-title`);
        if (el) {
          const rawTitle = (c.slides && c.slides[i] && c.slides[i].title) ? c.slides[i].title.trim() : '';
          if (rawTitle) {
            let formatted = rawTitle;
            if (!formatted.includes('<br')) {
              formatted = formatted.replace('，', '，<br class="hidden sm:inline" />');
            }
            el.innerHTML = formatted;
          } else {
            el.innerHTML = defaultSlideTitles[i];
          }
        }
      }

      // Team
      const teamContainer = document.getElementById('view-team-container');
      if (!c.team || c.team.length === 0) {
        teamContainer.innerHTML = `
          <div class="space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div class="p-3 rounded-xl bg-white border border-stone-200 flex items-center gap-2.5 shadow-2xs">
                <div class="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-700 font-mono text-xs font-bold shrink-0">01</div>
                <div>
                  <div class="text-xs font-bold text-stone-900">工業設計 & 機構</div>
                  <div class="text-[11px] text-stone-500">3D 外殼與磁吸模組</div>
                </div>
              </div>
              <div class="p-3 rounded-xl bg-white border border-stone-200 flex items-center gap-2.5 shadow-2xs">
                <div class="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-700 font-mono text-xs font-bold shrink-0">02</div>
                <div>
                  <div class="text-xs font-bold text-stone-900">嵌入式與韌體</div>
                  <div class="text-[11px] text-stone-500">ESP32 低功耗電墨驅動</div>
                </div>
              </div>
              <div class="p-3 rounded-xl bg-white border border-stone-200 flex items-center gap-2.5 shadow-2xs">
                <div class="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-700 font-mono text-xs font-bold shrink-0">03</div>
                <div>
                  <div class="text-xs font-bold text-stone-900">雲端與後端工程</div>
                  <div class="text-[11px] text-stone-500">MQTT 雙向推播架構</div>
                </div>
              </div>
              <div class="p-3 rounded-xl bg-white border border-stone-200 flex items-center gap-2.5 shadow-2xs">
                <div class="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-700 font-mono text-xs font-bold shrink-0">04</div>
                <div>
                  <div class="text-xs font-bold text-stone-900">介面體驗與前端</div>
                  <div class="text-[11px] text-stone-500">響應式互動與資訊可視化</div>
                </div>
              </div>
            </div>
            <div class="p-3 rounded-xl bg-stone-100/80 border border-dashed border-stone-300 text-center flex items-center justify-between px-4">
              <span class="text-xs text-stone-500 font-mono">專案團隊架構（可於管理後台填寫真實組員）</span>
              <button onclick="requestAdminAccess(); switchAdminTab('cms');" class="text-xs font-bold text-stone-900 hover:underline cursor-pointer">＋ 點此前進後台編輯</button>
            </div>
          </div>
        `;
      } else {
        teamContainer.innerHTML = c.team.map(m => `
          <div class="p-3.5 sm:p-4 bg-white rounded-2xl border border-stone-200 flex items-center justify-between shadow-2xs">
            <div>
              <div class="font-bold text-stone-900 text-base sm:text-lg">${escapeHtml(m.name)}</div>
              <div class="text-xs sm:text-sm text-stone-500 mt-0.5">${escapeHtml(m.role)}</div>
            </div>
            <span class="text-xs sm:text-sm font-mono bg-stone-100 px-3 py-1 rounded-lg text-stone-700 font-medium">${escapeHtml(m.tag)}</span>
          </div>
        `).join('');
      }
    }

    // ==========================================
    // 3. 線上體驗模擬器互動邏輯 (Interactive Playground)
    // ==========================================
    let currentSimPreset = 'work';
    let simSupplyAlertActive = false;

    function setSimulatorState(preset) {
      currentSimPreset = preset;
      updateSimButtonStyles();

      const screen = document.getElementById('virtual-eink-screen');
      const status = document.getElementById('refresh-status');

      // 1. 物理電子墨水刷新動畫
      if (screen) {
        screen.classList.remove('eink-refreshing');
        void screen.offsetWidth; // Force reflow
        screen.classList.add('eink-refreshing');
      }

      if (status) {
        status.textContent = 'BUSY (1.2mA REFRESH)...';
        status.classList.add('text-eink-red', 'font-bold');
      }

      // 2. 在黑白反轉切換點 (200ms) 替換畫面文字，模擬真實墨水反轉後成像
      setTimeout(() => {
        const badge = document.getElementById('sim-screen-badge');
        const title = document.getElementById('sim-screen-title');
        const desc = document.getElementById('sim-screen-desc');
        const battery = document.getElementById('sim-screen-battery');

        if (preset === 'work') {
          if (badge) {
            badge.textContent = 'DO NOT DISTURB';
            badge.className = 'inline-block px-2.5 py-0.5 rounded text-xs font-bold bg-eink-red text-white uppercase';
          }
          if (title) title.textContent = '線上會議中・請勿敲門';
          if (desc) desc.textContent = '正在進行期末發表連線，預計 16:30 結束。急事請傳訊息。';
          if (battery) battery.textContent = '15% 🪫 (CRITICAL LOW)';
        } else if (preset === 'chill') {
          if (badge) {
            badge.textContent = 'SOLO RECHARGE';
            badge.className = 'inline-block px-2.5 py-0.5 rounded text-xs font-bold bg-stone-800 text-paper-50 uppercase';
          }
          if (title) title.textContent = '社交電量過低放空中 🪫';
          if (desc) desc.textContent = '今天已連續工作 10 小時，需要獨處聽音樂充電，晚點見！';
          if (battery) battery.textContent = '5% 🪫 (RECHARGING)';
        } else if (preset === 'party') {
          if (badge) {
            badge.textContent = 'GUEST NOTICE';
            badge.className = 'inline-block px-2.5 py-0.5 rounded text-xs font-bold border-2 border-stone-900 bg-amber-100 text-stone-900 uppercase';
          }
          if (title) title.textContent = '今晚客廳有訪客 (2人)';
          if (desc) desc.textContent = '19:00 - 21:30 預計在客廳搭伙吃火鍋，歡迎室友一起加入！';
          if (battery) battery.textContent = '85% 🟢 (SOCIAL READY)';
        }
        lucide.createIcons();
      }, 200);

      // 3. 刷新完成，恢復極低待機靜態功耗顯示
      setTimeout(() => {
        if (screen) screen.classList.remove('eink-refreshing');
        if (status) {
          status.textContent = 'IDLE (STATIC 0W)';
          status.classList.remove('text-eink-red', 'font-bold');
        }
      }, 450);
    }

    // 支援舊名別名
    const setSimulatorPreset = setSimulatorState;

    function updateSimButtonStyles() {
      const btnWork = document.getElementById('sim-btn-work');
      const btnChill = document.getElementById('sim-btn-chill');
      const btnParty = document.getElementById('sim-btn-party');

      const activeClasses = ['border-2', 'border-stone-900', 'bg-stone-50', 'shadow-sm'];
      const normalClasses = ['border', 'border-stone-300', 'bg-white', 'hover:border-stone-900'];

      [btnWork, btnChill, btnParty].forEach(btn => {
        if (!btn) return;
        btn.classList.remove('border-2', 'border-stone-900', 'bg-stone-50', 'shadow-sm', 'border', 'border-stone-300', 'bg-white', 'hover:border-stone-900');
      });

      if (currentSimPreset === 'work' && btnWork) {
        btnWork.classList.add(...activeClasses);
      } else if (btnWork) {
        btnWork.classList.add(...normalClasses);
      }

      if (currentSimPreset === 'chill' && btnChill) {
        btnChill.classList.add(...activeClasses);
      } else if (btnChill) {
        btnChill.classList.add(...normalClasses);
      }

      if (currentSimPreset === 'party' && btnParty) {
        btnParty.classList.add(...activeClasses);
      } else if (btnParty) {
        btnParty.classList.add(...normalClasses);
      }
    }

    function triggerSupplyAlertSim() {
      simSupplyAlertActive = !simSupplyAlertActive;

      const screen = document.getElementById('virtual-eink-screen');
      const status = document.getElementById('refresh-status');
      const footerText = document.getElementById('sim-screen-footer-text');
      const supplyBtn = document.getElementById('sim-btn-supply');
      const supplyBtnText = document.getElementById('sim-btn-supply-text');

      if (screen) {
        screen.classList.remove('eink-refreshing');
        void screen.offsetWidth;
        screen.classList.add('eink-refreshing');
      }

      if (status) {
        status.textContent = 'RF BROADCASTING...';
        status.classList.add('text-eink-red', 'font-bold');
      }

      setTimeout(() => {
        if (simSupplyAlertActive) {
          if (footerText) {
            footerText.innerHTML = '<span class="text-eink-red font-bold flex items-center gap-1">⚠️ 採買警報：衛生紙 +1 (全屋急需)</span>';
          }
          if (supplyBtn) {
            supplyBtn.className = "w-full p-3.5 rounded-xl border-2 border-eink-red bg-rose-50 text-eink-red text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm";
          }
          if (supplyBtnText) {
            supplyBtnText.textContent = "已廣播！衛生紙缺貨 +1（再次點擊取消）";
          }
          showToast("📢 耗材警報已即時廣播至各房門看板！");
        } else {
          if (footerText) {
            footerText.innerHTML = '<span>公用耗材狀態：存量尚足</span>';
          }
          if (supplyBtn) {
            supplyBtn.className = "w-full p-3.5 rounded-xl border border-dashed border-stone-400 hover:border-stone-700 bg-stone-100 text-stone-700 text-xs font-medium transition flex items-center justify-center gap-2";
          }
          if (supplyBtnText) {
            supplyBtnText.textContent = "模擬按下「衛生紙快沒了 +1」";
          }
          showToast("已重設公用耗材狀態");
        }
        lucide.createIcons();
      }, 200);

      setTimeout(() => {
        if (screen) screen.classList.remove('eink-refreshing');
        if (status) {
          status.textContent = 'IDLE (STATIC 0W)';
          status.classList.remove('text-eink-red', 'font-bold');
        }
      }, 450);
    }

    // 4. 渲染投票彈窗
    function renderPoll() {
      const p = appState.poll || {};
      const defaultQ = "在合租或共居生活裡，哪一瞬間最讓你感到心累與尷尬？";
      const defaultD = "你的心聲，正是我們本次畢業專題誕生的理由。請點選最戳中你的一項：";
      const defaultOptions = [
        "1. 衣服洗好留在洗衣機兩天沒人收",
        "2. 以為衛生紙還有，如廁後才發現只剩紙筒",
        "3. 戴著耳機在房間，室友沒敲門突然推開探頭",
        "4. 想洗澡但永遠不知道裡面有沒有人、還要等多久"
      ];

      const q = (p.question && p.question.trim()) ? p.question : defaultQ;
      const d = (p.desc && p.desc.trim()) ? p.desc : defaultD;

      const qEl = document.getElementById('view-poll-question');
      const dEl = document.getElementById('view-poll-desc');
      if (qEl) qEl.textContent = q;
      if (dEl) dEl.textContent = d;

      const optsContainer = document.getElementById('poll-options-container');
      const opts = (Array.isArray(p.options) && p.options.length) ? p.options : defaultOptions.map((t, i) => ({ id: `opt${i}`, text: t, votes: 0 }));
      if (optsContainer) {
        optsContainer.innerHTML = opts.map((opt, idx) => `
          <button onclick="submitVote(${idx})" class="w-full text-left p-4 rounded-xl border border-stone-300 bg-white hover:border-stone-900 hover:bg-stone-50 transition-all flex items-center justify-between group">
            <span class="text-sm sm:text-base font-medium text-stone-800 group-hover:text-black">${escapeHtml(opt.text || defaultOptions[idx])}</span>
            <i data-lucide="arrow-right" class="w-4 h-4 text-stone-400 group-hover:text-black group-hover:translate-x-1 transition-all"></i>
          </button>
        `).join('');
      }

      // 計算總票數
      const totalVotes = opts.reduce((sum, o) => sum + (o.votes || 0), 0);
      const barsContainer = document.getElementById('poll-bars-container');
      if (barsContainer) {
        barsContainer.innerHTML = opts.map(opt => {
          const votes = opt.votes || 0;
          const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
          return `
            <div>
              <div class="flex justify-between mb-1 text-stone-700 text-xs sm:text-sm">
                <span>${escapeHtml((opt.text || '').replace(/^[0-9]\.\s*/, ''))}</span>
                <span class="font-mono font-bold">${pct}% (${votes} 票)</span>
              </div>
              <div class="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                <div class="bg-stone-900 h-full rounded-full transition-all duration-1000" style="width: ${pct}%"></div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // 5. 渲染後台表單輸入值
    function renderAdminFields() {
      const b = appState.board;
      document.getElementById('cfg-room-user').value = b.room.user || '';
      document.getElementById('cfg-room-badge-type').value = b.room.badgeType;
      document.getElementById('cfg-room-badge-text').value = b.room.badgeText || '';
      document.getElementById('cfg-room-desc').value = b.room.desc || '';
      document.getElementById('cfg-room-battery').value = b.room.battery;
      updateBatterySliderDisplay(b.room.battery);

      document.getElementById('cfg-bath-status').value = b.bath.status;
      document.getElementById('cfg-bath-minutes').value = b.bath.minutes;
      document.getElementById('cfg-bath-next').value = b.bath.next || '';
      document.getElementById('cfg-laundry-text').value = b.bath.laundry || '';

      document.getElementById('cfg-chore-text').value = b.chore.text || '';
      document.getElementById('cfg-chore-time').value = b.chore.time || '';
      document.getElementById('cfg-broadcast-note').value = b.broadcast || '';

      // 耗材清單
      renderSuppliesEditor();

      // CMS
      const c = appState.cms;
      document.getElementById('cms-hero-title').value = (c.hero.title || '').replace(/\r?\n/g, '');
      document.getElementById('cms-hero-subtitle').value = c.hero.subtitle;
      document.getElementById('cms-expo-venue').value = c.expo.venue || '';
      if (document.getElementById('cms-header-tag')) {
        document.getElementById('cms-header-tag').value = (c.expo && c.expo.tag !== undefined) ? c.expo.tag : '2026 畢業設計展';
      }
      document.getElementById('cms-advisor-name').value = (c.expo.advisor === '成果展指導組' || c.expo.advisor === '張教授 Dr. Chang') ? '' : (c.expo.advisor || '');
      document.getElementById('cms-project-code').value = c.expo.code || '';

      if (c.slides[0]) document.getElementById('cms-slide-0-title').value = c.slides[0].title;
      if (c.slides[1]) document.getElementById('cms-slide-1-title').value = c.slides[1].title;
      if (c.slides[2]) document.getElementById('cms-slide-2-title').value = c.slides[2].title;
      if (c.slides[3]) document.getElementById('cms-slide-3-title').value = c.slides[3].title;

      renderTeamEditor();

      // 投票設定
      document.getElementById('poll-cfg-question').value = appState.poll.question;
      document.getElementById('poll-cfg-desc').value = appState.poll.desc;
      renderPollEditor();

      // 名單表格
      renderLeadsTable();
    }

    function renderSuppliesEditor() {
      const list = document.getElementById('cfg-supplies-list-container');
      list.innerHTML = appState.board.supplies.map((item, idx) => `
        <div class="flex items-center gap-2 p-2 rounded-lg bg-paper-100 border border-stone-200">
          <input type="text" value="${escapeHtml(item.name)}" onchange="updateSupplyItem(${idx}, 'name', this.value)" class="flex-1 px-2 py-1 text-xs bg-white border border-stone-300 rounded" placeholder="耗材名稱" />
          <input type="text" value="${escapeHtml(item.status)}" onchange="updateSupplyItem(${idx}, 'status', this.value)" class="w-28 px-2 py-1 text-xs bg-white border border-stone-300 rounded" placeholder="狀態說明" />
          <button onclick="toggleSupplyUrgent(${idx})" class="text-[10px] px-2 py-1 rounded font-mono ${item.isUrgent ? 'bg-eink-red text-white' : 'bg-stone-200 text-stone-700'}" title="標記急迫">
            ${item.isUrgent ? '缺貨警示' : '充足'}
          </button>
          <button onclick="removeSupplyItem(${idx})" class="text-stone-400 hover:text-rose-600 p-1" title="刪除">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      `).join('');
      lucide.createIcons();
    }

    function renderTeamEditor() {
      const container = document.getElementById('cms-team-list-container');
      if (!appState.cms.team || appState.cms.team.length === 0) {
        container.innerHTML = `
          <div class="text-xs text-stone-500 py-4 px-3 text-center border border-dashed border-stone-300 rounded-xl space-y-2 bg-stone-50">
            <p>目前尚無組員資料，點擊下方即可新增</p>
            <button onclick="addTeamMember()" class="px-3 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-medium hover:bg-stone-800 transition inline-flex items-center gap-1 cursor-pointer">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i> 新增第一位組員
            </button>
          </div>`;
        lucide.createIcons();
        return;
      }
      container.innerHTML = appState.cms.team.map((m, idx) => `
        <div class="p-2.5 rounded-lg bg-paper-100 border border-stone-200 space-y-1.5">
          <div class="flex items-center gap-2">
            <input type="text" value="${escapeHtml(m.name)}" oninput="updateTeamMember(${idx}, 'name', this.value)" class="flex-1 px-2 py-1 text-xs bg-white border border-stone-300 rounded font-bold" placeholder="姓名" />
            <input type="text" value="${escapeHtml(m.tag)}" oninput="updateTeamMember(${idx}, 'tag', this.value)" class="w-24 px-2 py-1 text-xs bg-white border border-stone-300 rounded font-mono" placeholder="標籤 (例: Hardware)" />
            <button onclick="removeTeamMember(${idx})" class="text-stone-400 hover:text-rose-600 p-1 cursor-pointer" title="刪除">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
          <input type="text" value="${escapeHtml(m.role)}" oninput="updateTeamMember(${idx}, 'role', this.value)" class="w-full px-2 py-1 text-xs bg-white border border-stone-300 rounded text-stone-600" placeholder="分工說明" />
        </div>
      `).join('');
      lucide.createIcons();
    }

    function renderPollEditor() {
      const container = document.getElementById('poll-options-editor');
      container.innerHTML = appState.poll.options.map((opt, idx) => `
        <div class="flex items-center gap-2">
          <span class="text-xs font-mono font-bold text-stone-500 w-4">${idx + 1}.</span>
          <input type="text" value="${escapeHtml(opt.text)}" onchange="updatePollOptionText(${idx}, this.value)" class="flex-1 px-2.5 py-1.5 text-xs bg-paper-50 border border-stone-300 rounded-lg" />
          <div class="flex items-center gap-1 font-mono text-xs">
            <input type="number" min="0" value="${opt.votes || 0}" onchange="updatePollOptionVotes(${idx}, this.value)" class="w-16 px-1.5 py-1.5 text-center bg-paper-50 border border-stone-300 rounded-lg" />
            <span class="text-stone-400">票</span>
          </div>
        </div>
      `).join('');
    }

    function renderLeadsTable() {
      const tbody = document.getElementById('leads-table-body');
      const leads = appState.leads || [];
      document.getElementById('leads-count-badge').textContent = `共 ${leads.length} 筆登記`;
      
      if (leads.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="p-6 text-center text-stone-400 text-xs">目前暫無訪客登記資料</td></tr>`;
        return;
      }

      tbody.innerHTML = leads.map(l => `
        <tr class="hover:bg-stone-50">
          <td class="p-2 font-medium text-stone-900">${escapeHtml(l.name)}</td>
          <td class="p-2 text-stone-600 font-mono">${escapeHtml(l.email)}</td>
          <td class="p-2 text-stone-600">${escapeHtml(l.housing || '-')}</td>
          <td class="p-2 text-stone-400 font-mono text-[11px]">${escapeHtml(l.date || '-')}</td>
        </tr>
      `).join('');
    }

    // ==========================================
    // 後台管理互動操作
    // ==========================================
    function openAdminDrawer() {
      renderAdminFields();
      document.getElementById('admin-backdrop').classList.remove('opacity-0', 'pointer-events-none');
      document.getElementById('admin-drawer').classList.remove('translate-x-full');
      lucide.createIcons();
    }

    function closeAdminDrawer() {
      document.getElementById('admin-backdrop').classList.add('opacity-0', 'pointer-events-none');
      document.getElementById('admin-drawer').classList.add('translate-x-full');
    }

    // ESC 快捷鍵關閉
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeAdminDrawer();
        closePasswordModal();
        closePreorderModal();
      }
    });

    function switchAdminTab(tabKey) {
      ['board', 'cms', 'poll', 'leads'].forEach(k => {
        const pane = document.getElementById(`admin-tab-${k}`);
        const btn = document.getElementById(`tab-btn-${k}`);
        if (k === tabKey) {
          pane.classList.remove('hidden');
          btn.classList.add('border-stone-900', 'text-stone-900', 'font-bold');
          btn.classList.remove('border-transparent');
        } else {
          pane.classList.add('hidden');
          btn.classList.remove('border-stone-900', 'text-stone-900', 'font-bold');
          btn.classList.add('border-transparent');
        }
      });
      lucide.createIcons();
    }

    function updateBatterySliderDisplay(val) {
      document.getElementById('cfg-battery-val-display').textContent = `${val}% ${getBatteryEmoji(val)}`;
    }

    function getBatteryShortEmoji(val) {
      val = parseInt(val) || 0;
      if (val <= 15) return '🪫';
      if (val <= 40) return '🔋';
      if (val <= 75) return '⚡';
      return '🟢';
    }

    function getBatteryEmoji(val) {
      val = parseInt(val) || 0;
      if (val <= 15) return '🪫 (想安靜獨處)';
      if (val <= 40) return '🔋 (電量偏低)';
      if (val <= 75) return '⚡ (放鬆充電中)';
      return '🟢 (社交充沛，隨時可聊)';
    }

    function getBadgeClass(type) {
      switch (type) {
        case 'dnd':
          return 'px-2 py-0.5 text-[11px] font-bold bg-eink-red text-white rounded whitespace-nowrap shrink-0';
        case 'dark':
          return 'px-2 py-0.5 text-[11px] font-bold bg-stone-900 text-white rounded whitespace-nowrap shrink-0';
        case 'chill':
          return 'px-2 py-0.5 text-[11px] font-bold bg-stone-500 text-white rounded whitespace-nowrap shrink-0';
        case 'welcome':
        default:
          return 'px-2 py-0.5 text-[11px] font-bold border-2 border-stone-900 text-stone-900 rounded bg-white whitespace-nowrap shrink-0';
      }
    }

    function updateSupplyItem(idx, key, val) {
      if (appState.board.supplies[idx]) {
        appState.board.supplies[idx][key] = val;
      }
    }

    function toggleSupplyUrgent(idx) {
      if (appState.board.supplies[idx]) {
        appState.board.supplies[idx].isUrgent = !appState.board.supplies[idx].isUrgent;
        renderSuppliesEditor();
      }
    }

    function removeSupplyItem(idx) {
      appState.board.supplies.splice(idx, 1);
      renderSuppliesEditor();
    }

    function addSupplyItem() {
      appState.board.supplies.push({
        id: 's_' + Date.now(),
        name: '新耗材品項',
        status: '存量尚足',
        isUrgent: false
      });
      renderSuppliesEditor();
    }
    window.addSupplyItem = addSupplyItem;
    window.addSupplyItemPrompt = addSupplyItem;

    function updateTeamMember(idx, key, val) {
      if (appState.cms.team[idx]) {
        appState.cms.team[idx][key] = val;
      }
    }

    function removeTeamMember(idx) {
      appState.cms.team.splice(idx, 1);
      renderTeamEditor();
    }

    function addTeamMember() {
      if (!appState.cms) appState.cms = {};
      if (!Array.isArray(appState.cms.team)) appState.cms.team = [];
      appState.cms.team.push({
        name: '組員姓名',
        role: '負責項目與分工職稱',
        tag: '專案組員'
      });
      renderTeamEditor();
      lucide.createIcons();
    }
    window.addTeamMember = addTeamMember;
    window.addTeamMemberPrompt = addTeamMember;

    function updatePollOptionText(idx, val) {
      if (appState.poll.options[idx]) {
        appState.poll.options[idx].text = val;
      }
    }

    function updatePollOptionVotes(idx, val) {
      if (appState.poll.options[idx]) {
        appState.poll.options[idx].votes = parseInt(val) || 0;
      }
    }

    function saveAllFromAdmin() {
      // Board
      const b = appState.board;
      b.room.user = document.getElementById('cfg-room-user').value.trim();
      b.room.badgeType = document.getElementById('cfg-room-badge-type').value;
      b.room.badgeText = document.getElementById('cfg-room-badge-text').value.trim() || "狀態看板";
      b.room.desc = document.getElementById('cfg-room-desc').value.trim();
      b.room.battery = parseInt(document.getElementById('cfg-room-battery').value) || 0;

      b.bath.status = document.getElementById('cfg-bath-status').value;
      b.bath.minutes = parseInt(document.getElementById('cfg-bath-minutes').value) || 0;
      b.bath.next = document.getElementById('cfg-bath-next').value.trim();
      b.bath.laundry = document.getElementById('cfg-laundry-text').value.trim();

      b.chore.text = document.getElementById('cfg-chore-text').value.trim();
      b.chore.time = document.getElementById('cfg-chore-time').value.trim();
      b.broadcast = document.getElementById('cfg-broadcast-note').value.trim();

      // CMS
      const c = appState.cms;
      c.hero.title = document.getElementById('cms-hero-title').value.trim().replace(/\r?\n/g, '');
      c.hero.subtitle = document.getElementById('cms-hero-subtitle').value.trim();
      c.expo.venue = document.getElementById('cms-expo-venue').value.trim();
      if (document.getElementById('cms-header-tag')) {
        c.expo.tag = document.getElementById('cms-header-tag').value.trim();
      }
      c.expo.advisor = document.getElementById('cms-advisor-name').value.trim();
      c.expo.code = document.getElementById('cms-project-code').value.trim();

      if (c.slides[0]) c.slides[0].title = document.getElementById('cms-slide-0-title').value;
      if (c.slides[1]) c.slides[1].title = document.getElementById('cms-slide-1-title').value;
      if (c.slides[2]) c.slides[2].title = document.getElementById('cms-slide-2-title').value;
      if (c.slides[3]) c.slides[3].title = document.getElementById('cms-slide-3-title').value;

      // Poll
      appState.poll.question = document.getElementById('poll-cfg-question').value.trim();
      appState.poll.desc = document.getElementById('poll-cfg-desc').value.trim();

      saveState();
      renderAll();
      showToast("✅ 所有設定已成功保存！");
    }

    // 觸發電子紙黑白反轉刷新動畫 (主看板)
    function syncAndFlash() {
      saveAllFromAdmin();

      const heroScreen = document.getElementById('hero-eink-screen');
      if (heroScreen) {
        heroScreen.classList.remove('eink-refreshing');
        void heroScreen.offsetWidth;
        heroScreen.classList.add('eink-refreshing');
      }

      showToast("⚡ 看板已完成黑白反轉重繪！");
    }

    function resetPollVotes() {
      if (confirm("確定要將所有投票選項的票數歸零嗎？")) {
        appState.poll.options.forEach(o => o.votes = 0);
        saveState();
        renderPollEditor();
        renderPoll();
        showToast("投票數據已歸零");
      }
    }

    // 名單匯出與備份
    function exportLeadsCSV() {
      const leads = appState.leads || [];
      if (leads.length === 0) {
        alert("目前尚無名單可匯出。");
        return;
      }
      let csv = "\uFEFF姓名,Email,居住型態,登記時間\n";
      leads.forEach(l => {
        csv += `"${(l.name||'').replace(/"/g, '""')}","${(l.email||'').replace(/"/g, '""')}","${(l.housing||'').replace(/"/g, '""')}","${l.date||''}"\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `synk_preorder_leads_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("已成功下載早鳥名單 CSV！");
    }

    function clearLeadsPrompt() {
      if (confirm("確定要清空所有已登記的早鳥訪客名單嗎？此動作無法復原。")) {
        appState.leads = [];
        saveState();
        renderLeadsTable();
        showToast("已清空所有名單記錄");
      }
    }

    function exportConfigJSON() {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appState, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `synk_config_backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast("已成功匯出設定檔 JSON！");
    }

    function importConfigJSON(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const imported = JSON.parse(e.target.result);
          if (imported && imported.board && imported.cms) {
            appState = imported;
            saveState();
            renderAll();
            showToast("✅ 設定檔匯入成功！");
          } else {
            alert("匯入的 JSON 格式不正確，請確認是 Synk 設定備份檔。");
          }
        } catch (err) {
          alert("讀取檔案失敗：" + err.message);
        }
      };
      reader.readAsText(file);
      event.target.value = '';
    }

    function restoreDefaultPrompt() {
      if (confirm("確定要清除所有自訂修改，還原為初始狀態嗎？")) {
        appState = JSON.parse(JSON.stringify(DEFAULT_APP_STATE));
        saveState();
        renderAll();
        showToast("🔄 已成功還原初始狀態");
      }
    }

    // ==========================================
    // 訪客端表單與簡報切換
    // ==========================================
    // 破冰投票
    function submitVote(choiceIndex) {
      if (appState.poll.options[choiceIndex]) {
        appState.poll.options[choiceIndex].votes = (appState.poll.options[choiceIndex].votes || 0) + 1;
        saveState();
      }
      document.getElementById('poll-question-view').classList.add('hidden');
      document.getElementById('poll-result-view').classList.remove('hidden');
      renderPoll();
      lucide.createIcons();
    }

    document.getElementById('close-poll-btn').addEventListener('click', dismissPoll);
    document.getElementById('skip-poll').addEventListener('click', dismissPoll);

    function dismissPoll() {
      const modal = document.getElementById('poll-modal');
      if (!modal) return;
      modal.classList.add('opacity-0', 'pointer-events-none');
      setTimeout(() => {
        modal.style.display = 'none';
        modal.classList.add('hidden');
      }, 300);
    }

    // 簡報切換
    let currentSlide = 0;
    const slides = document.querySelectorAll('.slide-item');
    const totalSlides = slides.length;
    const indicator = document.getElementById('slide-indicator');

    function updateSlide() {
      slides.forEach((s, idx) => {
        if (idx === currentSlide) {
          s.classList.remove('hidden');
          s.classList.add('opacity-100');
          s.classList.remove('opacity-0');
        } else {
          s.classList.add('hidden', 'opacity-0');
          s.classList.remove('opacity-100');
        }
      });
      if (indicator) {
        indicator.textContent = `0${currentSlide + 1} / 0${totalSlides}`;
      }

      // 更新四個導覽標籤外觀狀態 (完全同步，邊框統一保證寬度不抖動)
      document.querySelectorAll('.slide-tab-pill').forEach((pill, idx) => {
        if (idx === currentSlide) {
          pill.className = 'slide-tab-pill px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-stone-900 text-white border border-stone-900 shadow-sm transition cursor-pointer';
        } else {
          pill.className = 'slide-tab-pill px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-mono font-medium bg-white/90 hover:bg-stone-100 text-stone-600 border border-stone-300 transition cursor-pointer';
        }
      });

      lucide.createIcons();
    }

    function navigateSlide(direction) {
      currentSlide = (currentSlide + direction + totalSlides) % totalSlides;
      updateSlide();
    }

    function goToSlide(idx) {
      currentSlide = (idx + totalSlides) % totalSlides;
      updateSlide();
    }
    window.goToSlide = goToSlide;
    window.navigateSlide = navigateSlide;

    // 早鳥 Modal
    function openPreorderModal() {
      document.getElementById('preorder-modal').classList.remove('hidden');
      document.getElementById('preorder-form').classList.remove('hidden');
      document.getElementById('preorder-success').classList.add('hidden');
      lucide.createIcons();
    }

    function closePreorderModal() {
      document.getElementById('preorder-modal').classList.add('hidden');
    }

    function handlePreorderSubmit(e) {
      e.preventDefault();
      if (!validatePreorderForm()) {
        const card = document.getElementById('preorder-modal').querySelector('.relative');
        if (card) {
          card.classList.add('animate-shake');
          setTimeout(() => card.classList.remove('animate-shake'), 450);
        }
        showToast("⚠️ 請檢查並完整填寫姓名與正確的信箱格式");
        return;
      }
      const name = document.getElementById('preorder-name').value.trim();
      const email = document.getElementById('preorder-email').value.trim();
      const housing = document.getElementById('preorder-housing').value;
      const now = new Date();
      const dateStr = `${now.getFullYear()}/${now.getMonth()+1}/${now.getDate()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

      appState.leads = appState.leads || [];
      appState.leads.unshift({ name, email, housing, date: dateStr });
      saveState();

      document.getElementById('preorder-form').classList.add('hidden');
      document.getElementById('preorder-success').classList.remove('hidden');
      lucide.createIcons();
    }

    // 工具函數
    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    // 確保每次重新整理 (F5 / Reload) 都自動回到頁面最頂端
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    window.addEventListener('beforeunload', () => {
      window.scrollTo(0, 0);
    });

    // 初始化啟動
    window.addEventListener('DOMContentLoaded', () => {
      if (window.location.hash) {
        history.replaceState(null, null, ' ');
      }
      window.scrollTo(0, 0);
      initAppState();
      renderAll();
      initSectionSnapping();
      scrollToSectionIndex(0, true);
    });

    window.addEventListener('load', () => {
      window.scrollTo(0, 0);
    });
  

    // ==========================================
    // 特製電子墨水游標控制系統 (Custom E-ink Cursor)
    // ==========================================
    (function initCustomCursor() {
      // 僅在支援滑鼠指針的裝置上啟用（自動排除觸控螢幕/手機）
      if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        return;
      }

      const wrapper = document.getElementById('custom-cursor-wrapper');
      const dot = document.getElementById('cursor-dot');
      const follower = document.getElementById('cursor-follower');
      const badge = document.getElementById('cursor-badge');
      const ripplesContainer = document.getElementById('cursor-ripples');

      if (!wrapper || !dot || !follower) return;

      let mouseX = -100;
      let mouseY = -100;
      let followerX = -100;
      let followerY = -100;
      let isVisible = false;

      // 監聽滑鼠移動：成功偵測到移動時才啟用游標，並保證原生指針隱藏
      window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        if (!isVisible) {
          isVisible = true;
          wrapper.classList.remove('opacity-0');
          document.body.classList.add('custom-cursor-active');
          followerX = mouseX;
          followerY = mouseY;
        }

        dot.style.left = `${mouseX}px`;
        dot.style.top = `${mouseY}px`;
      });

      // 視窗進入與離開偵測
      document.addEventListener('mouseleave', () => {
        isVisible = false;
        wrapper.classList.add('opacity-0');
      });

      document.addEventListener('mouseenter', () => {
        isVisible = true;
        wrapper.classList.remove('opacity-0');
      });

      // 60FPS 物理阻尼平滑插值運動 (Lerp Follower)
      function renderFollower() {
        if (isVisible) {
          // 速度阻尼系數 0.16，呈現紙張墨水牽引的流體高級感
          followerX += (mouseX - followerX) * 0.16;
          followerY += (mouseY - followerY) * 0.16;
          follower.style.left = `${followerX}px`;
          follower.style.top = `${followerY}px`;
        }
        requestAnimationFrame(renderFollower);
      }
      requestAnimationFrame(renderFollower);

      // 點擊觸發電子紙微膠囊電泳擴散波紋
      window.addEventListener('mousedown', (e) => {
        dot.style.transform = 'translate(-50%, -50%) scale(0.6)';
        follower.style.transform = 'translate(-50%, -50%) scale(0.85)';

        const ripple = document.createElement('div');
        ripple.className = 'cursor-ripple-effect';
        ripple.style.left = `${e.clientX}px`;
        ripple.style.top = `${e.clientY}px`;
        ripplesContainer.appendChild(ripple);

        setTimeout(() => ripple.remove(), 460);
      });

      window.addEventListener('mouseup', () => {
        dot.style.transform = 'translate(-50%, -50%) scale(1)';
        follower.style.transform = 'translate(-50%, -50%) scale(1)';
      });

      // 智慧辨識目標元素互動狀態 (Hover Detection)
      document.addEventListener('mouseover', (e) => {
        const target = e.target;
        if (!target) return;

        // 1. 檢測是否在電子紙硬體螢幕面板上 (Hero 看板或模擬器看板)
        const inScreen = target.closest('#hero-eink-screen, #virtual-eink-screen');
        if (inScreen) {
          wrapper.classList.remove('is-hovering', 'is-text-hover');
          wrapper.classList.add('is-screen-hover');
          badge.textContent = 'EPD';
          return;
        }

        // 2. 檢測是否在文字輸入框
        const isTextInput = target.closest('input[type="text"], input[type="password"], input[type="email"], textarea');
        if (isTextInput) {
          wrapper.classList.remove('is-hovering', 'is-screen-hover');
          wrapper.classList.add('is-text-hover');
          badge.textContent = '';
          return;
        }

        // 3. 檢測是否為可互動元素 (按鈕、連結、卡片、滑桿、開關)
        const isClickable = target.closest('a, button, [role="button"], input[type="range"], input[type="checkbox"], input[type="submit"], .sim-btn, .cursor-pointer, select, summary');
        if (isClickable) {
          wrapper.classList.remove('is-screen-hover', 'is-text-hover');
          wrapper.classList.add('is-hovering');
          badge.textContent = '';
          return;
        }

        // 預設純淨墨點狀態
        wrapper.classList.remove('is-hovering', 'is-screen-hover', 'is-text-hover');
        badge.textContent = '';
      });
    })();

  

    // ==========================================
    // APP 下載預約控制
    // ==========================================
    function openAppDownloadModal() {
      const modal = document.getElementById('app-download-modal');
      if (modal) modal.classList.remove('hidden');
      const form = document.getElementById('app-notify-form');
      if (form) form.classList.remove('hidden');
      const succ = document.getElementById('app-notify-success');
      if (succ) succ.classList.add('hidden');
      const emailInput = document.getElementById('app-notify-email');
      if (emailInput) emailInput.value = '';
      lucide.createIcons();
    }

    function closeAppDownloadModal() {
      const modal = document.getElementById('app-download-modal');
      if (modal) modal.classList.add('hidden');
    }

    function handleAppNotifySubmit(e) {
      e.preventDefault();
      if (!validateAppNotifyForm()) {
        const card = document.getElementById('app-download-modal').querySelector('.relative');
        if (card) {
          card.classList.add('animate-shake');
          setTimeout(() => card.classList.remove('animate-shake'), 450);
        }
        showToast("⚠️ 請輸入有效的電子信箱格式");
        return;
      }
      const email = document.getElementById('app-notify-email').value.trim();
      const now = new Date();
      const dateStr = `${now.getFullYear()}/${now.getMonth()+1}/${now.getDate()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

      appState.leads = appState.leads || [];
      appState.leads.unshift({
        name: "APP 下載預約訪客",
        email: email,
        housing: "APP 上線推播通知",
        date: dateStr
      });
      saveState();

      document.getElementById('app-notify-form').classList.add('hidden');
      document.getElementById('app-notify-success').classList.remove('hidden');
      showToast("🎉 已成功登記！APP 上架時將第一時間通知您");
      lucide.createIcons();
    }

  

    // ==========================================
    // ==========================================
    // ==========================================
    // ==========================================
    // ==========================================
    // 手機版 RWD 漢堡選單控制器 (Mobile Navigation Drawer)
    // ==========================================
    let isMobileMenuOpen = false;

    function toggleMobileMenu() {
      isMobileMenuOpen = !isMobileMenuOpen;
      const menu = document.getElementById('mobile-menu');
      const icon = document.getElementById('mobile-menu-icon');

      if (isMobileMenuOpen) {
        menu.classList.remove('-translate-y-full', 'opacity-0', 'pointer-events-none');
        if (icon) icon.setAttribute('data-lucide', 'x');
      } else {
        closeMobileMenu();
      }
      lucide.createIcons();
    }

    function closeMobileMenu() {
      isMobileMenuOpen = false;
      const menu = document.getElementById('mobile-menu');
      const icon = document.getElementById('mobile-menu-icon');
      if (menu) {
        menu.classList.add('-translate-y-full', 'opacity-0', 'pointer-events-none');
      }
      if (icon) icon.setAttribute('data-lucide', 'menu');
      lucide.createIcons();
    }

    function handleMobileNavClick(sectionIndex) {
      closeMobileMenu();
      setTimeout(() => {
        scrollToSectionIndex(sectionIndex);
      }, 150);
    }

    // ==========================================
    // 表單即時驗證與防呆反饋 (Live Form Validation & UX)
    // ==========================================
    function isValidEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email).trim());
    }

    function validatePreorderForm() {
      const nameInput = document.getElementById('preorder-name');
      const emailInput = document.getElementById('preorder-email');
      const nameMsg = document.getElementById('preorder-name-msg');
      const emailMsg = document.getElementById('preorder-email-msg');
      const nameCheck = document.getElementById('preorder-name-check');
      const emailCheck = document.getElementById('preorder-email-check');

      let isValid = true;

      if (nameInput) {
        const val = nameInput.value.trim();
        if (val.length === 0) {
          nameInput.classList.remove('border-emerald-500', 'border-rose-500', 'ring-2', 'ring-rose-500/20');
          nameInput.classList.add('border-stone-300');
          if (nameMsg) nameMsg.classList.add('hidden');
          if (nameCheck) nameCheck.classList.add('hidden');
          isValid = false;
        } else if (val.length < 2) {
          nameInput.classList.remove('border-emerald-500', 'border-stone-300');
          nameInput.classList.add('border-rose-500', 'ring-2', 'ring-rose-500/20');
          if (nameMsg) {
            nameMsg.textContent = "⚠️ 稱呼或姓名至少需 2 個字元";
            nameMsg.className = "text-[11px] font-mono text-rose-500";
            nameMsg.classList.remove('hidden');
          }
          if (nameCheck) nameCheck.classList.add('hidden');
          isValid = false;
        } else {
          nameInput.classList.remove('border-rose-500', 'border-stone-300', 'ring-2', 'ring-rose-500/20');
          nameInput.classList.add('border-emerald-500');
          if (nameMsg) {
            nameMsg.textContent = "✓ 稱呼填寫完整";
            nameMsg.className = "text-[11px] font-mono text-emerald-600";
            nameMsg.classList.remove('hidden');
          }
          if (nameCheck) nameCheck.classList.remove('hidden');
        }
      }

      if (emailInput) {
        const val = emailInput.value.trim();
        if (val.length === 0) {
          emailInput.classList.remove('border-emerald-500', 'border-rose-500', 'ring-2', 'ring-rose-500/20');
          emailInput.classList.add('border-stone-300');
          if (emailMsg) emailMsg.classList.add('hidden');
          if (emailCheck) emailCheck.classList.add('hidden');
          isValid = false;
        } else if (!isValidEmail(val)) {
          emailInput.classList.remove('border-emerald-500', 'border-stone-300');
          emailInput.classList.add('border-rose-500', 'ring-2', 'ring-rose-500/20');
          if (emailMsg) {
            emailMsg.textContent = "⚠️ 請輸入正確的信箱格式（例：name@example.com）";
            emailMsg.className = "text-[11px] font-mono text-rose-500";
            emailMsg.classList.remove('hidden');
          }
          if (emailCheck) emailCheck.classList.add('hidden');
          isValid = false;
        } else {
          emailInput.classList.remove('border-rose-500', 'border-stone-300', 'ring-2', 'ring-rose-500/20');
          emailInput.classList.add('border-emerald-500');
          if (emailMsg) {
            emailMsg.textContent = "✓ 電子信箱格式正確";
            emailMsg.className = "text-[11px] font-mono text-emerald-600";
            emailMsg.classList.remove('hidden');
          }
          if (emailCheck) emailCheck.classList.remove('hidden');
        }
      }

      lucide.createIcons();
      return isValid;
    }

    function validateAppNotifyForm() {
      const emailInput = document.getElementById('app-notify-email');
      const emailMsg = document.getElementById('app-notify-email-msg');
      const emailCheck = document.getElementById('app-notify-email-check');

      if (!emailInput) return true;
      const val = emailInput.value.trim();

      if (val.length === 0) {
        emailInput.classList.remove('border-emerald-500', 'border-rose-500', 'ring-2', 'ring-rose-500/20');
        emailInput.classList.add('border-stone-300');
        if (emailMsg) emailMsg.classList.add('hidden');
        if (emailCheck) emailCheck.classList.add('hidden');
        return false;
      } else if (!isValidEmail(val)) {
        emailInput.classList.remove('border-emerald-500', 'border-stone-300');
        emailInput.classList.add('border-rose-500', 'ring-2', 'ring-rose-500/20');
        if (emailMsg) {
          emailMsg.textContent = "⚠️ 請輸入有效 Email 格式";
          emailMsg.className = "text-[11px] font-mono text-rose-500";
          emailMsg.classList.remove('hidden');
        }
        if (emailCheck) emailCheck.classList.add('hidden');
        return false;
      } else {
        emailInput.classList.remove('border-rose-500', 'border-stone-300', 'ring-2', 'ring-rose-500/20');
        emailInput.classList.add('border-emerald-500');
        if (emailMsg) {
          emailMsg.textContent = "✓ 信箱格式正確";
          emailMsg.className = "text-[11px] font-mono text-emerald-600";
          emailMsg.classList.remove('hidden');
        }
        if (emailCheck) emailCheck.classList.remove('hidden');
        lucide.createIcons();
        return true;
      }
    }

    // ==========================================
    // 室友微紙感便條留言溝通系統 (Roommate Sticky Notes Wall)
    // ==========================================
    let currentSelectedNoteStyle = 'white';

    function selectNoteStyle(style) {
      currentSelectedNoteStyle = style;
      ['white', 'red', 'cream'].forEach(s => {
        const btn = document.getElementById(`note-style-${s}`);
        if (!btn) return;
        if (s === style) {
          btn.className = 'note-style-btn py-2 px-2 rounded-xl border-2 border-stone-900 bg-stone-900 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm';
        } else {
          btn.className = 'note-style-btn py-2 px-2 rounded-xl border border-stone-300 bg-white text-stone-700 text-xs font-medium flex items-center justify-center gap-1.5 transition hover:bg-stone-50';
        }
      });
    }

    function applyNoteTemplate(text) {
      const textarea = document.getElementById('note-content-input');
      if (textarea) {
        textarea.value = text;
        updateNoteCharCount();
        textarea.focus();
      }
    }

    function updateNoteCharCount() {
      const textarea = document.getElementById('note-content-input');
      const counter = document.getElementById('note-char-count');
      if (textarea && counter) {
        const len = textarea.value.length;
        counter.textContent = `${len} / 60 字`;
        if (len >= 55) {
          counter.className = "text-[11px] font-mono text-rose-500 font-bold";
        } else {
          counter.className = "text-[11px] font-mono text-stone-500";
        }
      }
    }

    function renderStickyNotes() {
      const container = document.getElementById('sticky-notes-container');
      const countLabel = document.getElementById('note-board-count');
      if (!container) return;

      const notes = appState.notes || [];
      if (countLabel) {
        countLabel.textContent = `${notes.length} 則待辦便條`;
      }

      if (notes.length === 0) {
        container.className = "flex flex-col items-center justify-center py-16 text-center text-stone-500";
        container.innerHTML = `
          <div class="w-12 h-12 rounded-2xl bg-stone-200/80 flex items-center justify-center mb-3">
            <i data-lucide="check" class="w-6 h-6 text-stone-600"></i>
          </div>
          <p class="font-bold text-stone-800 text-sm">目前看板乾淨無待辦便條</p>
          <p class="text-xs text-stone-500 mt-1">在左側寫一張便條，同步貼上電子紙吧！</p>
        `;
        lucide.createIcons();
        return;
      }

      container.className = "grid grid-cols-1 sm:grid-cols-2 gap-4";
      container.innerHTML = notes.map(note => {
        let cardBg = "bg-white border-stone-300 text-stone-800";
        let tapeBg = "bg-stone-300/80";
        let badgeColor = "bg-stone-200 text-stone-700";

        if (note.style === 'red') {
          cardBg = "bg-red-50/90 border-red-200 text-stone-900";
          tapeBg = "bg-eink-red/60";
          badgeColor = "bg-eink-red text-white";
        } else if (note.style === 'cream') {
          cardBg = "bg-[#FBF8EF] border-amber-200 text-stone-900";
          tapeBg = "bg-amber-300/60";
          badgeColor = "bg-amber-200 text-stone-800";
        }

        return `
          <div id="sticky-note-item-${note.id}" class="sticky-note-card ${cardBg} p-4 rounded-2xl border shadow-sm relative flex flex-col justify-between select-none">
            <!-- 模擬頂部半透明微遮蔽紙膠帶 -->
            <div class="w-14 h-3.5 ${tapeBg} rounded-xs mx-auto -mt-6 mb-2.5 shadow-2xs rotate-[-1.5deg]"></div>

            <div>
              <div class="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-black/5">
                <span class="text-[11px] font-mono px-2 py-0.5 rounded-full ${badgeColor} font-bold truncate max-w-[140px]">
                  ${escapeHtml(note.author || '室友留言')}
                </span>
                <span class="text-[10px] font-mono text-stone-500 whitespace-nowrap">
                  ${note.time || '剛剛'}
                </span>
              </div>
              <p class="text-xs sm:text-sm font-medium leading-relaxed my-2 text-stone-900">
                ${escapeHtml(note.content)}
              </p>
            </div>

            <div class="pt-2 mt-2 border-t border-black/5 flex items-center justify-end">
              <button onclick="tearOffStickyNote(${note.id})" class="text-[11px] font-mono text-stone-500 hover:text-stone-900 hover:bg-black/5 px-2 py-1 rounded-lg transition flex items-center gap-1 active:scale-95" title="撕下便條並標記完成">
                <i data-lucide="check" class="w-3 h-3 text-emerald-600"></i>
                <span>撕下完成</span>
              </button>
            </div>
          </div>
        `;
      }).join('');

      lucide.createIcons();
    }

    function postStickyNote() {
      const authorInput = document.getElementById('note-author-input');
      const contentInput = document.getElementById('note-content-input');
      if (!contentInput) return;

      const content = contentInput.value.trim();
      if (!content) {
        contentInput.focus();
        contentInput.classList.add('border-rose-500', 'ring-2', 'ring-rose-500/20');
        showToast("⚠️ 請先填寫便條內容再貼上看板喔！");
        return;
      }

      contentInput.classList.remove('border-rose-500', 'ring-2', 'ring-rose-500/20');

      const author = authorInput ? authorInput.value.trim() || '302 室友' : '302 室友';
      const now = new Date();
      const timeStr = `今天 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      appState.notes = appState.notes || [];
      appState.notes.unshift({
        id: Date.now(),
        author: author,
        style: currentSelectedNoteStyle,
        content: content,
        time: timeStr
      });

      saveState();

      // 清空輸入並更新字數
      contentInput.value = '';
      updateNoteCharCount();

      // 觸發電子紙畫布反轉刷墨
      const canvas = document.getElementById('sticky-board-canvas');
      if (canvas) {
        canvas.classList.add('eink-flash');
        setTimeout(() => canvas.classList.remove('eink-flash'), 450);
      }

      renderStickyNotes();
      showToast("📌 便條已同步至電子紙看板！室友即時可見");
    }

    function tearOffStickyNote(id) {
      const noteEl = document.getElementById(`sticky-note-item-${id}`);
      if (noteEl) {
        noteEl.classList.add('sticky-note-tearing');
        setTimeout(() => {
          appState.notes = (appState.notes || []).filter(n => n.id !== id);
          saveState();
          renderStickyNotes();
          showToast("✓ 便條已撕下並標記處理完畢！");
        }, 400);
      } else {
        appState.notes = (appState.notes || []).filter(n => n.id !== id);
        saveState();
        renderStickyNotes();
      }
    }

    // 全自動滾輪換格吸附控制器 (Full-page Wheel Snap Controller)
    // ==========================================
    let isSectionSnapActive = true;
    let snapSections = [];
    let currentSectionIndex = 0;
    let isWheelLocked = false;
    let currentScrollAnimationId = null;

    // 自訂 requestAnimationFrame 物理動態平滑滾動
    function smoothScrollTo(targetY, duration = 580, callback) {
      if (currentScrollAnimationId) {
        cancelAnimationFrame(currentScrollAnimationId);
        currentScrollAnimationId = null;
      }

      const startY = window.scrollY;
      const diff = targetY - startY;
      if (Math.abs(diff) < 2) {
        if (callback) callback();
        return;
      }

      const startTime = performance.now();

      function step(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // easeOutQuart 物理曲線：啟動敏捷、落點極致柔和
        const ease = 1 - Math.pow(1 - progress, 4);

        window.scrollTo(0, startY + diff * ease);

        if (progress < 1) {
          currentScrollAnimationId = requestAnimationFrame(step);
        } else {
          window.scrollTo(0, targetY);
          currentScrollAnimationId = null;
          if (callback) callback();
        }
      }

      currentScrollAnimationId = requestAnimationFrame(step);
    }

    // 檢測是否有彈窗或抽屜開啟
    function isModalElementActive(el) {
      if (!el) return false;
      if (el.classList.contains('hidden')) return false;
      if (el.classList.contains('opacity-0')) return false;
      if (el.style.display === 'none') return false;
      return true;
    }

    function isAnyModalOrDrawerOpen() {
      // 1. 後台抽屜
      const adminDrawer = document.getElementById('admin-drawer');
      if (adminDrawer && !adminDrawer.classList.contains('translate-x-full')) return true;

      // 2. 密碼驗證視窗
      const pwdModal = document.getElementById('password-modal');
      if (isModalElementActive(pwdModal)) return true;

      // 3. 早鳥預約視窗
      const preorderModal = document.getElementById('preorder-modal');
      if (isModalElementActive(preorderModal)) return true;

      // 4. APP 下載預約視窗
      const appModal = document.getElementById('app-download-modal');
      if (isModalElementActive(appModal)) return true;

      return false;
    }

    // 更新右側章節導航小圓點
    function updateSectionIndicators(activeIndex) {
      // 1. 同步更新右側章節導覽小圓點
      const dots = document.querySelectorAll('.section-dot');
      dots.forEach((dot, idx) => {
        if (idx === activeIndex) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });

      // 2. 同步更新最上方常駐導覽列 (Navbar) 的目前章節外框與標記
      const navLinks = document.querySelectorAll('#desktop-nav .nav-link, #mobile-menu a');
      const activeNavMap = {
        0: '#hero',
        1: '#presentation',
        2: '#interactive-simulator',
        3: '#sticky-notes-wall',
        4: '#tech-specs',
        5: '#team'
      };
      const activeHref = activeNavMap[activeIndex] || '#hero';

      navLinks.forEach(link => {
        if (link.getAttribute('href') === activeHref) {
          link.className = 'nav-link px-2.5 py-1 rounded-md transition font-bold text-stone-900 border border-stone-800 bg-white/70 shadow-xs';
        } else {
          link.className = 'nav-link px-2.5 py-1 rounded-md transition font-medium text-stone-600 hover:text-stone-900 border border-transparent';
        }
      });
    }

    // 計算最靠近視窗視覺黃金線的章節
    function getClosestSectionIndex() {
      if (!snapSections.length) return 0;
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;

      // 1. 若已經滑動到接近頁面最底部（緩衝 60px），絕對為最後一個章節 (Footer)
      if (scrollY + windowHeight >= scrollHeight - 60) {
        return snapSections.length - 1;
      }

      // 2. 若在頁面最頂部（小於 50px），絕對為第一個章節 (Hero)
      if (scrollY <= 50) {
        return 0;
      }

      const viewportMid = scrollY + (windowHeight * 0.45);
      let closestIdx = 0;
      let minDist = Infinity;

      for (let i = 0; i < snapSections.length; i++) {
        const sec = snapSections[i];
        const top = sec.getBoundingClientRect().top + scrollY;
        const bottom = top + sec.offsetHeight;
        if (viewportMid >= top && viewportMid <= bottom) {
          return i;
        }
        const mid = (top + bottom) / 2;
        const dist = Math.abs(viewportMid - mid);
        if (dist < minDist) {
          minDist = dist;
          closestIdx = i;
        }
      }
      return closestIdx;
    }

    // 精準吸附滾動至指定章節
    function scrollToSectionIndex(index, immediate = false) {
      if (!snapSections || !snapSections.length) return;
      if (index < 0) index = 0;
      if (index >= snapSections.length) index = snapSections.length - 1;

      currentSectionIndex = index;
      const targetSec = snapSections[index];

      // 計算目標頂部位置
      let targetY = 0;
      if (index === 0) {
        targetY = 0;
      } else if (index === snapSections.length - 1) {
        targetY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      } else {
        const secTop = targetSec.getBoundingClientRect().top + window.scrollY;
        targetY = Math.max(0, secTop - 64); // 扣除 sticky header (64px)
      }

      // 同步更新右側章節小圓點
      updateSectionIndicators(index);

      if (immediate) {
        window.scrollTo(0, targetY);
        isWheelLocked = false;
      } else {
        isWheelLocked = true;
        smoothScrollTo(targetY, 580, () => {
          setTimeout(() => {
            isWheelLocked = false;
          }, 120);
        });
      }
    }

    // 全域滾輪滑動監聽處理器
    function onPageWheel(e) {
      if (!isSectionSnapActive) return;

      // 若在管理後台或輸入視窗中，完全放行原生捲動
      if (isAnyModalOrDrawerOpen()) return;

      // 若滑鼠懸停於內部可滾動元素上，放行
      if (e.target && e.target.closest('#admin-drawer, .overflow-y-auto, .overflow-auto, textarea, input, select')) {
        return;
      }

      // 若開場投票小彈窗仍在，滾動滾輪自動略過關閉，不阻擋閱覽
      const pollModal = document.getElementById('poll-modal');
      if (isModalElementActive(pollModal)) {
        dismissPoll();
      }

      // 阻止瀏覽器預設的任意無吸附滾動
      e.preventDefault();

      // 若正在換格滾動動畫中，吸收滾輪事件防止暴衝
      if (isWheelLocked) return;

      // 稍微滾動即觸發換格 (閾值 8px，靈敏捕捉滾輪微動)
      if (Math.abs(e.deltaY) < 8) return;

      const curIdx = getClosestSectionIndex();
      let nextIdx = curIdx;

      if (e.deltaY > 0) {
        // 向下滾動 -> 下一格
        if (curIdx < snapSections.length - 1) {
          nextIdx = curIdx + 1;
        }
      } else {
        // 向上滾動 -> 上一格
        if (curIdx > 0) {
          nextIdx = curIdx - 1;
        }
      }

      scrollToSectionIndex(nextIdx);
    }

    function initSectionSnapping() {
      // 收集所有主要區塊：hero, presentation, simulator, tech-specs, footer
      const targets = document.querySelectorAll('section#hero, section#presentation, section#interactive-simulator, section#sticky-notes-wall, section#tech-specs, footer');
      snapSections = Array.from(targets);

      // 攔截頂部導航連結，使其精準滑動換格
      const anchorMap = {
        '#hero': 0,
        '#presentation': 1,
        '#interactive-simulator': 2,
        '#sticky-notes-wall': 3,
        '#tech-specs': 4,
        '#team': 4
      };

      document.querySelectorAll('header nav a, header a[href^="#"]').forEach(a => {
        const href = a.getAttribute('href');
        if (href in anchorMap) {
          a.addEventListener('click', (e) => {
            e.preventDefault();
            scrollToSectionIndex(anchorMap[href]);
          });
        }
      });

      // 註冊滾輪事件監聽 (使用 passive: false 確保可精確攔截與吸附)
      // 使用原生 CSS 滾動吸附，wheel 事件維持 passive: true 避免劫持觸控板與滾輪動量
      window.addEventListener('wheel', onPageWheel, { passive: true });

      // 鍵盤方向鍵與換頁鍵支援 (ArrowDown, ArrowUp, PageDown, PageUp, Space)
      window.addEventListener('keydown', (e) => {
        if (!isSectionSnapActive || isAnyModalOrDrawerOpen()) return;
        const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        if (activeTag === 'input' || activeTag === 'textarea') return;

        if (e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) {
          e.preventDefault();
          const cur = getClosestSectionIndex();
          if (cur < snapSections.length - 1) scrollToSectionIndex(cur + 1);
        } else if (e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) {
          e.preventDefault();
          const cur = getClosestSectionIndex();
          if (cur > 0) scrollToSectionIndex(cur - 1);
        } else if (e.key === 'Home') {
          e.preventDefault();
          scrollToSectionIndex(0);
        } else if (e.key === 'End') {
          e.preventDefault();
          scrollToSectionIndex(snapSections.length - 1);
        }
      });

      // 手機觸控滑動支援 (Swipe)
      let touchStartY = 0;
      let touchStartX = 0;
      window.addEventListener('touchstart', (e) => {
        if (isAnyModalOrDrawerOpen()) return;
        touchStartY = e.touches[0].clientY;
        touchStartX = e.touches[0].clientX;
      }, { passive: true });

      window.addEventListener('touchend', (e) => {
        if (!isSectionSnapActive || isAnyModalOrDrawerOpen() || isWheelLocked) return;
        const deltaY = touchStartY - e.changedTouches[0].clientY;
        const deltaX = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(deltaY) > 50 && Math.abs(deltaY) > Math.abs(deltaX) * 1.5) {
          const cur = getClosestSectionIndex();
          if (deltaY > 0 && cur < snapSections.length - 1) {
            scrollToSectionIndex(cur + 1);
          } else if (deltaY < 0 && cur > 0) {
            scrollToSectionIndex(cur - 1);
          }
        }
      }, { passive: true });

      // 當使用者透過拖曳滾動條時，同步更新右側圓點
      window.addEventListener('scroll', () => {
        if (!isWheelLocked) {
          const curIdx = getClosestSectionIndex();
          updateSectionIndicators(curIdx);
        }
      }, { passive: true });

      window.addEventListener('resize', () => {
        const curIdx = getClosestSectionIndex();
        updateSectionIndicators(curIdx);
      }, { passive: true });

      // 初始執行一次更新圓點
      setTimeout(() => {
        const initialIdx = getClosestSectionIndex();
        updateSectionIndicators(initialIdx);
      }, 100);
    }

    // 切換滾輪自動換格吸附開關
    function toggleSnapMode() {
      isSectionSnapActive = !isSectionSnapActive;
      const toggleText = document.getElementById('snap-toggle-text');
      const dot = document.getElementById('snap-dot-indicator');

      // 同步切換 CSS 原生滾動吸附類別
      document.documentElement.classList.toggle('scroll-snap-enabled', isSectionSnapActive);

      if (isSectionSnapActive) {
        if (toggleText) toggleText.textContent = "滾動對齊吸附：開啟";
        if (dot) dot.className = "w-2 h-2 rounded-full bg-emerald-500 animate-pulse";
        showToast("⚡ 滾動自然吸附已開啟：滾動至區塊邊緣時自然對齊");
      } else {
        if (toggleText) toggleText.textContent = "滾動對齊吸附：關閉";
        if (dot) dot.className = "w-2 h-2 rounded-full bg-stone-400";
        showToast("自由滾動模式已開啟（已關閉區塊吸附）");
      }
    }

    // 全域鍵盤 ESC 鍵：直覺關閉所有對話框與後台抽屜 (HCI 易用性規範)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closePasswordModal();
        closePreorderModal();
        closeAppDownloadModal();
        dismissPoll();
        closeAdminDrawer();
      }
    });

    // 行動端簡報輪播觸控左右滑動 (Swipe Gesture)
    (function initPresentationSwipe() {
      const presSection = document.getElementById('presentation');
      if (!presSection) return;
      let touchStartX = 0;
      let touchStartY = 0;
      presSection.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }, { passive: true });

      presSection.addEventListener('touchend', (e) => {
        const deltaX = e.changedTouches[0].clientX - touchStartX;
        const deltaY = e.changedTouches[0].clientY - touchStartY;
        if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
          if (deltaX < 0) {
            navigateSlide(1);
          } else {
            navigateSlide(-1);
          }
        }
      }, { passive: true });
    })();
