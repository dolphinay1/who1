(() => {
    const mobileNav = document.querySelector('.mobile-nav');
    if (!mobileNav) return;

    const currentPage = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    const currentHash = (window.location.hash || '').toLowerCase();
    const isHomePage = currentPage === 'index.html' || currentPage === '';
    const deferredHomeActions = new Set(['market', 'promotions', 'login', 'register', 'deposit', 'withdraw', 'contact', 'profile']);
    const sharedMenuStyleId = 'shared-mobile-menu-styles';
    const sharedMenuLogoSrc = '/logo.png';

    let currentUser = null;
    let cachedBodyOverflow = '';

    try {
        currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    } catch (error) {
        currentUser = null;
    }

    function updateUserBalanceUI(user) {
        if (!user) return;

        const username = user.username || user.user || '';
        const balance = Number(user.balance || 0);
        const navUserName = document.getElementById('navUserName');
        const mainBalance = document.getElementById('mainBalance');
        const profileBalance = document.getElementById('pBal');

        if (navUserName && username) navUserName.textContent = username;
        if (mainBalance) mainBalance.textContent = `${balance.toFixed(2)} TL`;
        if (profileBalance) profileBalance.textContent = `${balance.toFixed(2)} TL`;

        if (typeof window.updateUI === 'function') {
            try {
                window.updateUI();
            } catch (error) { }
        }
    }

    async function syncCurrentUserProfile() {
        const token = localStorage.getItem('token');
        if (!token || !currentUser) return;

        try {
            const response = await fetch('/api/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await response.json();
            if (!data?.success || !data?.user) return;

            currentUser = {
                ...currentUser,
                ...data.user,
                user: data.user.username || currentUser.user || currentUser.username
            };

            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            localStorage.setItem('userBalance', String(Number(data.user.balance || 0)));
            updateUserBalanceUI(currentUser);

            window.dispatchEvent(new CustomEvent('clashbet:user-sync', {
                detail: { user: currentUser }
            }));
        } catch (error) { }
    }

    const activeMap = {
        '#menu': 'menu',
        '#market': 'market',
        '#promotions': 'promotions',
        '#profile': 'profile',
        'slots.html': 'slots',
        'login.html': 'account'
    };

    const activeKey = activeMap[isHomePage ? currentHash : currentPage] || activeMap[currentPage] || '';
    const items = [
        { key: 'menu', href: '#menu', icon: '&#9776;', label: 'Men&#252;', action: 'menu', accent: true },
        { key: 'home', href: 'index.html', icon: '&#x1F3E0;', label: 'Anasayfa' },
        { key: 'slots', href: 'slots.html', icon: '&#x1F3B0;', label: 'Slotlar' },
        { key: 'bonus', href: 'index.html#dailyChestBtn', icon: '&#x1F381;', label: 'Bonus', center: true },
        { key: 'market', href: 'index.html', icon: '&#x1F48E;', label: 'Market', action: 'market' },
        { key: 'promotions', href: 'index.html', icon: '&#x1F381;', label: 'Promosyonlar', action: 'promotions' },
        {
            key: 'profile',
            href: 'index.html#profile',
            icon: '&#x1F464;',
            label: currentUser ? 'Profil' : 'Giri&#351;',
            action: 'profile'
        }
    ];

    function ensureMobileMenuStyles() {
        if (document.getElementById(sharedMenuStyleId)) return;

        const style = document.createElement('style');
        style.id = sharedMenuStyleId;
        style.textContent = `
            #mobileMenuModal {
                position: fixed;
                inset: 0;
                display: none;
                align-items: flex-end;
                justify-content: center;
                background: rgba(6, 8, 12, 0.76);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                padding-top: 40px;
                z-index: 9999 !important;
            }

            #mobileMenuModal.active {
                display: flex;
            }

            #mobileMenuModal .mmenu-panel {
                width: min(100%, 560px);
                max-height: min(92vh, 860px);
                background: linear-gradient(180deg, #1a1e28 0%, #12141c 100%);
                border-radius: 26px 26px 0 0;
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-bottom: none;
                box-shadow: 0 -24px 64px rgba(0, 0, 0, 0.45);
                position: relative;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                transform: translateY(100%);
            }

            #mobileMenuModal .mmenu-panel::before {
                content: '';
                position: absolute;
                inset: 0 0 auto 0;
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(245, 197, 24, 0.85), transparent);
            }

            #mobileMenuModal .mmenu-handle {
                display: flex;
                justify-content: center;
                padding: 8px 0 6px;
            }

            #mobileMenuModal .mmenu-handle-bar {
                width: 56px;
                height: 5px;
                border-radius: 999px;
                background: rgba(255, 255, 255, 0.22);
            }

            #mobileMenuModal .mmenu-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 14px;
                padding: 6px 18px 12px;
            }

            #mobileMenuModal .mmenu-header-left {
                display: flex;
                align-items: center;
                gap: 12px;
                min-width: 0;
            }

            #mobileMenuModal .mmenu-logo-icon {
                width: 42px;
                height: 42px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(245, 197, 24, 0.08);
                border: 1px solid rgba(245, 197, 24, 0.18);
                padding: 4px;
                flex-shrink: 0;
            }

            #mobileMenuModal .mmenu-logo-image {
                width: 100%;
                height: 100%;
                object-fit: contain;
                filter: drop-shadow(0 0 7px rgba(245, 197, 24, 0.28));
            }

            #mobileMenuModal .mmenu-title-wrap {
                min-width: 0;
            }

            #mobileMenuModal .mmenu-title {
                color: #f5c518;
                font-size: 13px;
                font-weight: 800;
                letter-spacing: 0.12em;
                text-transform: uppercase;
                line-height: 1.1;
            }

            #mobileMenuModal .mmenu-subtitle {
                margin-top: 4px;
                color: rgba(255, 255, 255, 0.55);
                font-size: 12px;
                line-height: 1.3;
            }

            #mobileMenuModal .mmenu-close-btn {
                width: 42px;
                height: 42px;
                border: 1px solid rgba(255, 255, 255, 0.08);
                background: rgba(255, 255, 255, 0.04);
                color: #d1d5db;
                border-radius: 14px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                line-height: 1;
                cursor: pointer;
                transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
            }

            #mobileMenuModal .mmenu-close-btn:hover,
            #mobileMenuModal .mmenu-close-btn:active {
                background: rgba(245, 197, 24, 0.12);
                color: #fff3c4;
                transform: translateY(-1px);
            }

            #mobileMenuModal .mmenu-body {
                flex: 1;
                overflow-y: auto;
                min-height: 0;
                padding: 0 20px 28px;
            }

            #mobileMenuModal .mmenu-body::-webkit-scrollbar {
                width: 4px;
            }

            #mobileMenuModal .mmenu-body::-webkit-scrollbar-track {
                background: transparent;
            }

            #mobileMenuModal .mmenu-body::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.08);
                border-radius: 999px;
            }

            #mobileMenuModal .mmenu-section {
                margin-top: 22px;
            }

            #mobileMenuModal .mmenu-section-label {
                color: rgba(148, 163, 184, 0.72);
                font-size: 12px;
                font-weight: 800;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                margin-bottom: 12px;
            }

            #mobileMenuModal .mmenu-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 12px;
            }

            #mobileMenuModal .mmenu-grid-3 {
                grid-template-columns: repeat(3, minmax(0, 1fr));
            }

            #mobileMenuModal .mmenu-row {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 12px;
            }

            #mobileMenuModal .mmenu-btn {
                border: 1px solid rgba(255, 255, 255, 0.06);
                background: linear-gradient(180deg, rgba(28, 33, 46, 0.96), rgba(22, 25, 35, 0.98));
                border-radius: 16px;
                min-height: 98px;
                padding: 16px 14px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 10px;
                text-align: center;
                box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
                transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
                cursor: pointer;
            }

            #mobileMenuModal .mmenu-btn:active,
            #mobileMenuModal .mmenu-action-btn:active,
            #mobileMenuModal .mmenu-live-support:active {
                transform: translateY(1px) scale(0.99);
            }

            #mobileMenuModal .mmenu-btn:hover,
            #mobileMenuModal .mmenu-btn:focus-visible,
            #mobileMenuModal .mmenu-action-btn:hover,
            #mobileMenuModal .mmenu-action-btn:focus-visible,
            #mobileMenuModal .mmenu-live-support:hover,
            #mobileMenuModal .mmenu-live-support:focus-visible {
                border-color: rgba(245, 197, 24, 0.28);
                box-shadow: 0 10px 24px rgba(0, 0, 0, 0.24);
                outline: none;
            }

            #mobileMenuModal .mmenu-btn-icon,
            #mobileMenuModal .mmenu-btn-icon-sm {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                border-radius: 14px;
                color: #fff;
                flex-shrink: 0;
            }

            #mobileMenuModal .mmenu-btn-icon {
                width: 54px;
                height: 54px;
                font-size: 24px;
                box-shadow: 0 10px 22px rgba(0, 0, 0, 0.2);
            }

            #mobileMenuModal .mmenu-btn-text {
                color: #e5e7eb;
                font-size: 14px;
                font-weight: 600;
                line-height: 1.3;
            }

            #mobileMenuModal .mmenu-btn-sm {
                min-height: 84px;
                padding: 14px 10px;
                gap: 8px;
            }

            #mobileMenuModal .mmenu-btn-icon-sm {
                width: 42px;
                height: 42px;
                font-size: 18px;
                background: rgba(255, 255, 255, 0.08);
            }

            #mobileMenuModal .mmenu-btn-text-sm {
                color: #d1d5db;
                font-size: 12px;
                font-weight: 600;
                line-height: 1.3;
            }

            #mobileMenuModal .mmenu-action-btn {
                min-height: 56px;
                border: none;
                border-radius: 16px;
                font-size: 14px;
                font-weight: 700;
                color: #fff;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                cursor: pointer;
                box-shadow: 0 10px 22px rgba(0, 0, 0, 0.24);
            }

            #mobileMenuModal .mmenu-action-icon {
                font-size: 18px;
                line-height: 1;
            }

            #mobileMenuModal .mmenu-deposit {
                background: linear-gradient(135deg, #10b981, #0f9f6e);
            }

            #mobileMenuModal .mmenu-withdraw {
                background: linear-gradient(135deg, #ef4444, #dc2626);
            }

            #mobileMenuModal .mmenu-live-support {
                width: 100%;
                margin-top: 14px;
                border: 1px solid rgba(245, 197, 24, 0.18);
                border-radius: 18px;
                min-height: 56px;
                background: linear-gradient(135deg, rgba(245, 197, 24, 0.12), rgba(245, 158, 11, 0.08));
                color: #fff3c4;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                font-size: 14px;
                font-weight: 700;
                cursor: pointer;
            }

            #mobileMenuModal .mmenu-live-dot {
                width: 9px;
                height: 9px;
                border-radius: 999px;
                background: #22c55e;
                box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.16);
            }

            @keyframes mmenuSlideUp {
                from { transform: translateY(100%); }
                to { transform: translateY(0); }
            }

            @keyframes mmenuSlideDown {
                from { transform: translateY(0); }
                to { transform: translateY(100%); }
            }

            @media (max-width: 480px) {
                #mobileMenuModal {
                    padding-top: 26px;
                }

                #mobileMenuModal .mmenu-panel {
                    width: 100%;
                    max-height: 94vh;
                    border-radius: 22px 22px 0 0;
                }

                #mobileMenuModal .mmenu-header {
                    padding: 4px 16px 10px;
                }

                #mobileMenuModal .mmenu-body {
                    padding: 0 16px 24px;
                }

                #mobileMenuModal .mmenu-grid,
                #mobileMenuModal .mmenu-row {
                    gap: 10px;
                }

                #mobileMenuModal .mmenu-btn {
                    min-height: 94px;
                    padding: 14px 12px;
                }
            }
        `;

        document.head.appendChild(style);
    }

    function normalizeMenuBranding(modal) {
        const headerLeft = modal.querySelector('.mmenu-header-left');
        if (!headerLeft) return;

        let logoBox = headerLeft.querySelector('.mmenu-logo-icon');
        if (!logoBox) {
            logoBox = document.createElement('div');
            logoBox.className = 'mmenu-logo-icon';
            headerLeft.prepend(logoBox);
        }

        logoBox.innerHTML = `<img class="mmenu-logo-image" src="${sharedMenuLogoSrc}" alt="Clash Bet">`;

        let titleWrap = headerLeft.querySelector('.mmenu-title-wrap');
        let title = headerLeft.querySelector('.mmenu-title');
        let subtitle = headerLeft.querySelector('.mmenu-subtitle');

        if (!titleWrap) {
            titleWrap = document.createElement('div');
            titleWrap.className = 'mmenu-title-wrap';

            if (title) titleWrap.appendChild(title);
            if (subtitle) titleWrap.appendChild(subtitle);
            headerLeft.appendChild(titleWrap);
        }

        if (!title) {
            title = document.createElement('div');
            title.className = 'mmenu-title';
            titleWrap.prepend(title);
        }

        if (!subtitle) {
            subtitle = document.createElement('div');
            subtitle.className = 'mmenu-subtitle';
            titleWrap.appendChild(subtitle);
        }

        title.id = 'sharedMobileMenuTitle';
        title.textContent = 'CLASH BET';
        subtitle.textContent = 'Hızlı Menü';
    }

    function ensureMobileMenuModal() {
        ensureMobileMenuStyles();

        let modal = document.getElementById('mobileMenuModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'mobileMenuModal';
            modal.className = 'modal';
            document.body.appendChild(modal);
        }

        if (!modal.querySelector('.mmenu-body')) {
            modal.innerHTML = `
                <div class="mmenu-panel" role="dialog" aria-modal="true" aria-labelledby="sharedMobileMenuTitle">
                    <div class="mmenu-handle">
                        <div class="mmenu-handle-bar"></div>
                    </div>
                    <div class="mmenu-header">
                        <div class="mmenu-header-left">
                            <div class="mmenu-logo-icon">
                                <img class="mmenu-logo-image" src="/logo.png" alt="Clash Bet">
                            </div>
                            <div class="mmenu-title-wrap">
                                <div class="mmenu-title" id="sharedMobileMenuTitle">CLASH BET</div>
                                <div class="mmenu-subtitle">H&#305;zl&#305; Men&#252;</div>
                            </div>
                        </div>
                        <button type="button" class="mmenu-close-btn" aria-label="Men&#252;y&#252; kapat">&times;</button>
                    </div>
                    <div class="mmenu-body"></div>
                </div>
            `;
        }

        if (!modal.dataset.sharedMenuBound) {
            modal.addEventListener('click', (event) => {
                if (event.target === modal) {
                    window.closeMobileMenu();
                }
            });

            const closeButton = modal.querySelector('.mmenu-close-btn');
            if (closeButton) {
                closeButton.addEventListener('click', () => window.closeMobileMenu());
            }

            modal.dataset.sharedMenuBound = 'true';
        }

        normalizeMenuBranding(modal);

        return modal;
    }

    function animateMenu(open) {
        const modal = ensureMobileMenuModal();
        const panel = modal.querySelector('.mmenu-panel');
        if (!panel) return;

        if (open) {
            cachedBodyOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            modal.style.display = 'flex';
            modal.classList.add('active');
            panel.style.animation = 'none';
            panel.offsetHeight;
            panel.style.animation = 'mmenuSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards';
            return;
        }

        panel.style.animation = 'mmenuSlideDown 0.25s cubic-bezier(0.4, 0, 1, 1) forwards';
        window.setTimeout(() => {
            modal.classList.remove('active');
            modal.style.display = 'none';
            document.body.style.overflow = cachedBodyOverflow || '';
        }, 250);
    }

    window.openMobileMenu = () => {
        animateMenu(true);
    };

    window.closeMobileMenu = () => {
        animateMenu(false);
    };

    function setDeferredHomeAction(action) {
        try {
            sessionStorage.setItem('clashbet_mobile_home_action', action);
        } catch (error) { }
    }

    function openMenuModal() {
        ensureMobileMenuModal();
        window.openMobileMenu();
    }

    function closeMenuModal(nextStep) {
        const runNext = () => {
            if (typeof nextStep === 'function') nextStep();
        };

        const modal = document.getElementById('mobileMenuModal');
        const isModalVisible = !!(modal && window.getComputedStyle(modal).display !== 'none');

        if (isModalVisible) {
            window.closeMobileMenu();
            window.setTimeout(runNext, 170);
            return;
        }

        runNext();
    }

    function queueHomeAction(action) {
        if (!deferredHomeActions.has(action)) return;
        setDeferredHomeAction(action);
        window.location.href = action === 'profile' ? 'index.html#profile' : 'index.html';
    }

    function triggerHomeAction(action) {
        switch (action) {
            case 'market':
                if (typeof window.handleMarketClick === 'function') {
                    window.handleMarketClick();
                    return true;
                }
                if (typeof window.openMarket === 'function') {
                    window.openMarket();
                    return true;
                }
                return false;
            case 'promotions':
                if (typeof window.openPromotions === 'function') {
                    window.openPromotions();
                    return true;
                }
                return false;
            case 'login':
                if (typeof window.openModal === 'function') {
                    window.openModal('loginModal');
                    return true;
                }
                return false;
            case 'register':
                if (typeof window.openModal === 'function') {
                    window.openModal('registerModal');
                    return true;
                }
                return false;
            case 'deposit':
                if (typeof window.checkAuth === 'function') {
                    window.checkAuth('deposit');
                    return true;
                }
                if (typeof window.openModal === 'function') {
                    window.openModal('depositModal');
                    return true;
                }
                return false;
            case 'withdraw':
                if (typeof window.checkAuth === 'function') {
                    window.checkAuth('withdraw');
                    return true;
                }
                if (typeof window.openModal === 'function') {
                    window.openModal('withdrawModal');
                    return true;
                }
                return false;
            case 'contact':
                if (typeof window.openSupportChat === 'function') {
                    return !!window.openSupportChat();
                }
                if (typeof window.toggleChat === 'function') {
                    const widget = document.getElementById('liveChatWidget');
                    if (widget && !widget.classList.contains('active')) {
                        window.toggleChat();
                    }
                    return true;
                }
                return false;
            case 'profile':
                if (typeof window.checkAuth === 'function') {
                    window.checkAuth('profile');
                    return true;
                }
                if (typeof window.openModal === 'function') {
                    window.openModal('profileModal');
                    return true;
                }
                return false;
            default:
                return false;
        }
    }

    function dispatchAction(action) {
        if (action === 'menu') {
            openMenuModal();
            return;
        }

        if (action === 'profile' && !isHomePage) {
            queueHomeAction('profile');
            return;
        }

        if (isHomePage && triggerHomeAction(action)) {
            return;
        }

        if (deferredHomeActions.has(action)) {
            queueHomeAction(action);
        }
    }

    function bindActionHandlers(scope) {
        if (!scope) return;

        scope.querySelectorAll('[data-action]').forEach((element) => {
            element.addEventListener('click', (event) => {
                event.preventDefault();
                const action = element.getAttribute('data-action');
                closeMenuModal(() => dispatchAction(action));
            });
        });

        scope.querySelectorAll('[data-link]').forEach((element) => {
            element.addEventListener('click', (event) => {
                event.preventDefault();
                const href = element.getAttribute('data-link');
                if (!href) return;
                closeMenuModal(() => {
                    window.location.href = href;
                });
            });
        });
    }

    function renderMobileNav() {
        mobileNav.innerHTML = items.map((item) => {
            const classes = ['nav-item'];
            if (item.center) classes.push('nav-item-center');
            if (item.key === activeKey) classes.push('active');
            if (item.accent) classes.push('nav-item-menu');

            if (item.center) {
                return `<a class="${classes.join(' ')}" href="${item.href}" aria-label="Bonus">
                    <div class="nav-center-btn">${item.icon}</div>
                </a>`;
            }

            const ariaCurrent = item.key === activeKey ? 'aria-current="page"' : '';
            const dataAction = item.action ? `data-action="${item.action}"` : '';

            return `<a class="${classes.join(' ')}" href="${item.href}" ${ariaCurrent} ${dataAction}>
                <div class="nav-icon">${item.icon}</div>
                <span>${item.label}</span>
            </a>`;
        }).join('');

        bindActionHandlers(mobileNav);

        if (typeof window.closeMobileNav === 'function') {
            mobileNav.querySelectorAll('a').forEach((link) => {
                link.addEventListener('click', () => window.closeMobileNav());
            });
        }
    }

    function renderMobileMenuModal() {
        const modal = ensureMobileMenuModal();
        const menuBody = modal.querySelector('.mmenu-body');
        if (!menuBody) return;

        const authMarkup = currentUser ? '' : `
            <div class="mmenu-auth-row">
                <button class="mmenu-auth-btn mmenu-auth-login" data-action="login">
                    <span class="mmenu-auth-glow"></span>
                    <span class="mmenu-auth-icon">&#x1F511;</span>
                    <span class="mmenu-auth-text">Giri&#351; Yap</span>
                </button>
                <button class="mmenu-auth-btn mmenu-auth-register" data-action="register">
                    <span class="mmenu-auth-glow"></span>
                    <span class="mmenu-auth-icon">&#x2728;</span>
                    <span class="mmenu-auth-text">&#xDC;ye Ol</span>
                </button>
            </div>
        `;

        menuBody.innerHTML = `
            ${authMarkup}
            <div class="mmenu-section">
                <div class="mmenu-section-label">Sayfalar</div>
                <div class="mmenu-grid">
                    <button class="mmenu-btn" data-action="promotions">
                        <span class="mmenu-btn-icon" style="background: linear-gradient(135deg, #f5c518, #f9a825);">&#x1F381;</span>
                        <span class="mmenu-btn-text">Promosyonlar</span>
                    </button>
                    <button class="mmenu-btn" data-link="vip.html">
                        <span class="mmenu-btn-icon" style="background: linear-gradient(135deg, #f5c518, #d97706);">&#x1F451;</span>
                        <span class="mmenu-btn-text">VIP Program</span>
                    </button>
                    <button class="mmenu-btn" data-link="affiliates.html">
                        <span class="mmenu-btn-icon" style="background: linear-gradient(135deg, #8b5cf6, #6d28d9);">&#x1F91D;</span>
                        <span class="mmenu-btn-text">Afiliyet</span>
                    </button>
                    <button class="mmenu-btn" data-link="games-rules.html">
                        <span class="mmenu-btn-icon" style="background: linear-gradient(135deg, #ec4899, #be185d);">&#x1F4D6;</span>
                        <span class="mmenu-btn-text">Oyun Kurallar&#305;</span>
                    </button>
                </div>
            </div>

            <div class="mmenu-section">
                <div class="mmenu-section-label">Oyunlar</div>
                <div class="mmenu-grid mmenu-grid-games">
                    <button class="mmenu-btn mmenu-btn-game" data-link="slots.html">
                        <span class="mmenu-btn-icon" style="background: linear-gradient(135deg, #9333ea, #6d28d9);">&#x1F3B0;</span>
                        <span class="mmenu-btn-text">Slotlar</span>
                    </button>
                    <button class="mmenu-btn mmenu-btn-game" data-link="spor.html">
                        <span class="mmenu-btn-icon" style="background: linear-gradient(135deg, #22c55e, #15803d);">&#x26BD;</span>
                        <span class="mmenu-btn-text">Spor</span>
                    </button>
                    <button class="mmenu-btn mmenu-btn-game" data-link="canli-casino.html">
                        <span class="mmenu-btn-icon" style="background: linear-gradient(135deg, #06b6d4, #2563eb);">&#x1F0CF;</span>
                        <span class="mmenu-btn-text">Canl&#305; Casino</span>
                    </button>
                </div>
            </div>

            <div class="mmenu-section">
                <div class="mmenu-section-label">Para &#304;&#351;lemleri</div>
                <div class="mmenu-row">
                    <button class="mmenu-action-btn mmenu-deposit" data-action="deposit">
                        <span class="mmenu-action-icon">&#x1F4B0;</span>
                        <span>Para Yat&#305;rma</span>
                    </button>
                    <button class="mmenu-action-btn mmenu-withdraw" data-action="withdraw">
                        <span class="mmenu-action-icon">&#x1F3E7;</span>
                        <span>Para &#xC7;ekme</span>
                    </button>
                </div>
            </div>

            <div class="mmenu-section">
                <div class="mmenu-section-label">Bilgi & Hukuki</div>
                <div class="mmenu-grid mmenu-grid-3">
                    <button class="mmenu-btn mmenu-btn-sm" data-link="terms-and-conditions.html">
                        <span class="mmenu-btn-icon-sm">&#x1F4CB;</span>
                        <span class="mmenu-btn-text-sm">&#x15E;artlar</span>
                    </button>
                    <button class="mmenu-btn mmenu-btn-sm" data-link="privacy-policy.html">
                        <span class="mmenu-btn-icon-sm">&#x1F512;</span>
                        <span class="mmenu-btn-text-sm">Gizlilik</span>
                    </button>
                    <button class="mmenu-btn mmenu-btn-sm" data-link="kyc-politikasi.html">
                        <span class="mmenu-btn-icon-sm">&#x1F194;</span>
                        <span class="mmenu-btn-text-sm">KYC</span>
                    </button>
                    <button class="mmenu-btn mmenu-btn-sm" data-link="responsible-game.html">
                        <span class="mmenu-btn-icon-sm">&#x267B;&#xFE0F;</span>
                        <span class="mmenu-btn-text-sm">Sorumlu Oyun</span>
                    </button>
                    <button class="mmenu-btn mmenu-btn-sm" data-link="fair-play.html">
                        <span class="mmenu-btn-icon-sm">&#x2696;&#xFE0F;</span>
                        <span class="mmenu-btn-text-sm">Adil Oyun</span>
                    </button>
                </div>
            </div>

            <div class="mmenu-section" style="padding-bottom: 20px;">
                <div class="mmenu-section-label">Destek</div>
                <div class="mmenu-grid">
                    <button class="mmenu-btn" data-link="faq.html">
                        <span class="mmenu-btn-icon" style="background: linear-gradient(135deg, #06b6d4, #0e7490);">&#x2753;</span>
                        <span class="mmenu-btn-text">SSS</span>
                    </button>
                    <button class="mmenu-btn" data-link="contact-us.html">
                        <span class="mmenu-btn-icon" style="background: linear-gradient(135deg, #64748b, #475569);">&#x2709;&#xFE0F;</span>
                        <span class="mmenu-btn-text">&#x130;leti&#351;im</span>
                    </button>
                </div>
                <button class="mmenu-live-support" data-action="contact">
                    <span class="mmenu-live-dot"></span>
                    <span>&#x1F4AC; Canl&#305; Destek</span>
                </button>
            </div>
        `;

        bindActionHandlers(menuBody);
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            const modal = document.getElementById('mobileMenuModal');
            if (modal && window.getComputedStyle(modal).display !== 'none') {
                window.closeMobileMenu();
            }
        }
    });

    renderMobileNav();
    renderMobileMenuModal();
    syncCurrentUserProfile();
})();
