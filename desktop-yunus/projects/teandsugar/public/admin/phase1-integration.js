(function () {
    const token = localStorage.getItem('token');
    if (!token || window.location.pathname === '/admin/login') return;

    const state = { actor: null, searchTimer: null, currentPlayerId: null };
    const iconMap = {
        todayIncoming: 'fa-arrow-down',
        todayOutgoing: 'fa-arrow-up',
        activePlayers: 'fa-users',
        pendingTransactions: 'fa-clock',
        openTickets: 'fa-headset',
        highRiskPlayers: 'fa-shield-halved',
        notesToday: 'fa-note-sticky'
    };
    const dashboardHintMap = {
        todayIncoming: 'Bugünün onaylı yatırımları',
        todayOutgoing: 'Bugünün onaylı çekimleri',
        activePlayers: 'Son 24 saat aktif oyuncular',
        pendingTransactions: 'İşlem kuyruğunda bekleyen talepler',
        openTickets: 'Yanıt bekleyen destek kayıtları',
        highRiskPlayers: 'Risk skoru yüksek oyuncular',
        notesToday: 'Bugün eklenen CRM notları'
    };

    const getPath = () => window.location.pathname.toLowerCase();
    const can = (permissionKey) => (state.actor?.permissions || []).includes(permissionKey);
    const formatCurrency = (value) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 }).format(Number(value) || 0);
    const formatNumber = (value) => new Intl.NumberFormat('tr-TR').format(Number(value) || 0);
    const formatDateTime = (value) => value ? new Intl.DateTimeFormat('tr-TR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '-';
    const escapeHtml = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const showToastSafe = (message, type = 'info') => typeof window.showToast === 'function' ? window.showToast(message, type) : console.log(`[${type}] ${message}`);

    const apiFetch = async (url, options = {}) => {
        const response = await fetch(url, {
            ...options,
            headers: {
                Authorization: `Bearer ${token}`,
                ...(options.body ? { 'Content-Type': 'application/json' } : {}),
                ...(options.headers || {})
            }
        });
        const contentType = response.headers.get('content-type') || '';
        const payload = contentType.includes('application/json') ? await response.json() : { success: response.ok };
        if (!response.ok) {
            throw new Error(payload?.message || payload?.error || 'İstek başarısız oldu.');
        }
        return payload;
    };

    const normalizeSidebarLinks = () => {
        document.querySelectorAll('.sidebar-nav a[href]').forEach((link) => {
            const href = (link.getAttribute('href') || '').toLowerCase();
            if (href.includes('kullan')) link.setAttribute('href', '/admin/kullanicilar');
        });
    };

    const getActorName = () => state.actor?.fullName || state.actor?.username || 'Admin';

    const applyActorChrome = () => {
        normalizeSidebarLinks();

        const avatar = document.querySelector('.sidebar-footer .admin-avatar');
        const name = document.querySelector('.sidebar-footer .admin-info .name');
        const role = document.querySelector('.sidebar-footer .admin-info .role');
        if (avatar) avatar.textContent = getActorName().charAt(0).toUpperCase();
        if (name) name.textContent = getActorName();
        if (role) role.textContent = state.actor?.roleLabel || 'Admin';

        const hiddenPaths = [];
        if (!can('transactions:read')) hiddenPaths.push('/admin/finans');
        if (state.actor?.roleKey !== 'ADMIN') hiddenPaths.push('/admin/bannerler', '/admin/ayarlar', '/admin/loglar', '/admin/dogrulama');
        document.querySelectorAll('.sidebar-nav a[href]').forEach((link) => {
            const href = (link.getAttribute('href') || '').toLowerCase();
            if (hiddenPaths.includes(href)) link.classList.add('phase1-hidden');
        });

        const headerActions = document.querySelector('.page-header .header-actions');
        if (headerActions && !document.getElementById('phase1Toolbar')) {
            const toolbar = document.createElement('div');
            toolbar.className = 'phase1-toolbar';
            toolbar.id = 'phase1Toolbar';
            toolbar.innerHTML = `
                <div class="phase1-role-chip">
                    <i class="fas fa-shield-halved"></i>
                    <div>
                        <strong>${escapeHtml(state.actor?.roleLabel || 'Admin')}</strong>
                        <span>${escapeHtml(state.actor?.username || '')}</span>
                    </div>
                </div>
                <button type="button" class="btn btn-secondary phase1-omnibar-trigger" id="phase1OmnibarTrigger">
                    <i class="fas fa-magnifying-glass"></i>
                    <span>Global Arama</span>
                    <kbd>Ctrl+K</kbd>
                </button>
            `;
            headerActions.prepend(toolbar);
        }
    };

    const navigateToPlayer = (playerId) => {
        if (!playerId) return;
        if (getPath() === '/admin/kullanicilar') {
            openPlayerCrm(playerId);
            return;
        }
        window.location.href = `/admin/kullanicilar?playerId=${playerId}`;
    };

    const renderOmnibarResults = (groups) => {
        const results = document.getElementById('phase1OmnibarResults');
        if (!results) return;

        const sections = [];
        if (groups.users?.length) {
            sections.push(`<div class="phase1-result-group"><h4>Oyuncular</h4>${groups.users.map((item) => `
                <button type="button" class="phase1-result-item" data-entity="user" data-id="${item.id}">
                    <div class="phase1-result-meta"><strong>${escapeHtml(item.username)}</strong><span>${escapeHtml(item.email || 'E-posta yok')}</span></div>
                    <span class="phase1-chip ${Number(item.risk_score || 0) >= 80 ? 'danger' : 'success'}">Risk ${escapeHtml(String(item.risk_score || 0))}</span>
                </button>`).join('')}</div>`);
        }
        if (groups.transactions?.length) {
            sections.push(`<div class="phase1-result-group"><h4>İşlemler</h4>${groups.transactions.map((item) => `
                <button type="button" class="phase1-result-item" data-entity="transaction" data-user-id="${item.user_id}">
                    <div class="phase1-result-meta"><strong>#${item.id} · ${escapeHtml(item.username || 'Oyuncu')}</strong><span>${escapeHtml(item.type)} · ${escapeHtml(formatDateTime(item.created_at))}</span></div>
                    <span class="phase1-chip ${item.type === 'deposit' ? 'success' : 'warning'}">${escapeHtml(formatCurrency(item.amount))}</span>
                </button>`).join('')}</div>`);
        }
        if (groups.tickets?.length) {
            sections.push(`<div class="phase1-result-group"><h4>Ticketlar</h4>${groups.tickets.map((item) => `
                <button type="button" class="phase1-result-item" data-entity="ticket" data-user-id="${item.user_id || ''}">
                    <div class="phase1-result-meta"><strong>#${item.id} · ${escapeHtml(item.subject)}</strong><span>${escapeHtml(item.username || 'Misafir')} · ${escapeHtml(formatDateTime(item.updated_at))}</span></div>
                    <span class="phase1-chip warning">${escapeHtml(item.priority || 'NORMAL')}</span>
                </button>`).join('')}</div>`);
        }

        results.innerHTML = sections.length ? sections.join('') : '<div class="phase1-empty">Eşleşen sonuç bulunamadı.</div>';
    };

    const buildOmnibar = () => {
        if (document.getElementById('phase1Omnibar')) return;

        const omnibar = document.createElement('div');
        omnibar.className = 'phase1-omnibar';
        omnibar.id = 'phase1Omnibar';
        omnibar.hidden = true;
        omnibar.innerHTML = `
            <div class="phase1-omnibar-backdrop" id="phase1OmnibarBackdrop"></div>
            <div class="phase1-omnibar-panel">
                <div class="phase1-omnibar-head">
                    <i class="fas fa-magnifying-glass"></i>
                    <input id="phase1OmnibarInput" type="text" placeholder="Oyuncu, işlem veya ticket ara..." autocomplete="off">
                    <button type="button" class="btn btn-secondary btn-sm" id="phase1OmnibarClose">Kapat</button>
                </div>
                <div class="phase1-omnibar-body">
                    <div class="phase1-omnibar-hint" id="phase1OmnibarHint">Arama için en az 3 karakter yazın. Sonuçlar 300ms gecikmeyle güncellenir.</div>
                    <div id="phase1OmnibarResults"></div>
                </div>
            </div>
        `;
        document.body.appendChild(omnibar);

        const close = () => {
            omnibar.hidden = true;
            document.getElementById('phase1OmnibarInput').value = '';
            document.getElementById('phase1OmnibarResults').innerHTML = '';
            document.getElementById('phase1OmnibarHint').textContent = 'Arama için en az 3 karakter yazın. Sonuçlar 300ms gecikmeyle güncellenir.';
        };
        const open = () => {
            omnibar.hidden = false;
            document.getElementById('phase1OmnibarInput').focus();
        };

        document.getElementById('phase1OmnibarTrigger')?.addEventListener('click', open);
        document.getElementById('phase1OmnibarBackdrop').addEventListener('click', close);
        document.getElementById('phase1OmnibarClose').addEventListener('click', close);

        document.addEventListener('keydown', (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                omnibar.hidden ? open() : close();
            }
            if (event.key === 'Escape' && !omnibar.hidden) close();
        });

        document.getElementById('phase1OmnibarInput').addEventListener('input', (event) => {
            const value = String(event.target.value || '').trim();
            if (state.searchTimer) clearTimeout(state.searchTimer);
            if (value.length < 3) {
                document.getElementById('phase1OmnibarResults').innerHTML = '';
                document.getElementById('phase1OmnibarHint').textContent = 'Arama için en az 3 karakter yazın. Sonuçlar 300ms gecikmeyle güncellenir.';
                return;
            }

            document.getElementById('phase1OmnibarHint').textContent = 'Aranıyor...';
            state.searchTimer = setTimeout(async () => {
                try {
                    const payload = await apiFetch(`/api/admin/phase1/search?q=${encodeURIComponent(value)}`);
                    renderOmnibarResults(payload.groups || {});
                    document.getElementById('phase1OmnibarHint').textContent = '';
                } catch (error) {
                    document.getElementById('phase1OmnibarResults').innerHTML = '';
                    document.getElementById('phase1OmnibarHint').textContent = error.message || 'Arama başarısız oldu.';
                }
            }, 300);
        });

        document.getElementById('phase1OmnibarResults').addEventListener('click', (event) => {
            const button = event.target.closest('.phase1-result-item');
            if (!button) return;
            close();
            const entity = button.dataset.entity;
            const userId = Number(button.dataset.userId || button.dataset.id || 0);
            if (entity === 'user' && userId) navigateToPlayer(userId);
            if ((entity === 'transaction' || entity === 'ticket') && userId) navigateToPlayer(userId);
        });
    };

    const applyDashboardCards = (cards) => {
        const statCards = document.querySelectorAll('.stats-grid .stat-card');
        cards.slice(0, 4).forEach((card, index) => {
            const target = statCards[index];
            if (!target) return;

            target.classList.remove('primary', 'success', 'warning', 'danger', 'info');
            target.classList.add(card.tone || 'primary');

            const label = target.querySelector('.stat-info h4');
            const value = target.querySelector('.value');
            const change = target.querySelector('.change span');
            const icon = target.querySelector('.stat-icon i');

            if (label) label.textContent = card.label;
            if (value) value.textContent = ['todayIncoming', 'todayOutgoing'].includes(card.id) ? formatCurrency(card.value) : formatNumber(card.value);
            if (change) change.textContent = dashboardHintMap[card.id] || 'Faz 1 verisi';
            if (icon) icon.className = `fas ${iconMap[card.id] || 'fa-chart-line'}`;
        });
    };

    const renderDashboardQueues = (queues) => {
        let container = document.getElementById('phase1DashboardShell');
        if (!container) {
            container = document.createElement('section');
            container.className = 'phase1-dashboard-shell';
            container.id = 'phase1DashboardShell';
            const main = document.querySelector('main.main-content');
            if (!main) return;
            main.appendChild(container);
        }

        const cards = [
            {
                title: 'Risk Alarmı',
                icon: 'fa-triangle-exclamation',
                items: queues.highRiskPlayers || [],
                renderer: (item) => `<button type="button" class="phase1-list-item" data-player-id="${item.id}"><div><strong>${escapeHtml(item.username)}</strong><span>${escapeHtml(item.loyalty_level || 'BRONZE')} · Risk ${escapeHtml(String(item.risk_score || 0))}</span></div><span class="phase1-chip danger">${escapeHtml(formatCurrency(item.balance || 0))}</span></button>`
            },
            {
                title: 'Açık Ticketlar',
                icon: 'fa-headset',
                items: queues.openTickets || [],
                renderer: (item) => `<button type="button" class="phase1-list-item" data-player-id="${item.user_id || ''}"><div><strong>#${item.id} · ${escapeHtml(item.subject)}</strong><span>${escapeHtml(item.username || 'Misafir')} · ${escapeHtml(formatDateTime(item.updated_at))}</span></div><span class="phase1-chip warning">${escapeHtml(item.priority || 'NORMAL')}</span></button>`
            }
        ];

        if (can('transactions:read')) {
            cards.push({
                title: 'Bekleyen İşlemler',
                icon: 'fa-money-bill-trend-up',
                items: queues.pendingTransactions || [],
                renderer: (item) => `<button type="button" class="phase1-list-item" data-player-id="${item.user_id}"><div><strong>${escapeHtml(item.username)}</strong><span>${escapeHtml(item.type)} · ${escapeHtml(formatDateTime(item.created_at))}</span></div><span class="phase1-chip success">${escapeHtml(formatCurrency(item.amount || 0))}</span></button>`
            });
        }

        container.innerHTML = `
            <div class="phase1-card-head">
                <div><div class="phase1-eyebrow">Faz 1</div><h2>Operasyon Akışı</h2><p>Risk, destek ve işlem kuyrukları tek bakışta.</p></div>
            </div>
            <div class="phase1-queue-grid">
                ${cards.map((card) => `<article class="phase1-card"><div class="phase1-card-head"><h3><i class="fas ${card.icon}"></i> ${card.title}</h3></div><div class="phase1-list">${card.items.length ? card.items.map(card.renderer).join('') : '<div class="phase1-empty">Şimdilik kayıt yok.</div>'}</div></article>`).join('')}
            </div>
        `;

        container.querySelectorAll('[data-player-id]').forEach((item) => {
            item.addEventListener('click', () => {
                const playerId = Number(item.dataset.playerId || 0);
                if (playerId) navigateToPlayer(playerId);
            });
        });
    };

    const refreshPhase1Dashboard = async () => {
        try {
            const payload = await apiFetch('/api/admin/phase1/dashboard');
            applyDashboardCards(payload.cards || []);
            renderDashboardQueues(payload.queues || {});
        } catch (error) {
            console.error('Phase1 dashboard error:', error);
        }
    };

    const patchDashboardPage = async () => {
        if (typeof window.loadAllData === 'function' && !window.loadAllData.__phase1Wrapped) {
            const original = window.loadAllData;
            const wrapped = function () {
                original();
                refreshPhase1Dashboard();
            };
            wrapped.__phase1Wrapped = true;
            window.loadAllData = wrapped;
        }

        if (!can('transactions:read') && typeof window.loadRecentTransactions === 'function') {
            window.loadRecentTransactions = function () {
                const tbody = document.getElementById('recentTransactions');
                if (tbody) {
                    tbody.innerHTML = '<tr><td colspan="4"><div class="phase1-access-note">Bu rol finansal işlem kuyruğunu görüntüleyemez.</div></td></tr>';
                }
            };
        }

        if (!can('dashboard:financial')) {
            document.querySelectorAll('main.main-content > div').forEach((section) => {
                const styleValue = section.getAttribute('style') || '';
                if (styleValue.includes('grid-template-columns: 2fr 1fr')) {
                    section.classList.add('phase1-hidden');
                }
            });
        }

        await refreshPhase1Dashboard();
    };

    const ensureCrmShell = () => {
        if (document.getElementById('phase1CrmShell')) return;

        const anchor = document.querySelector('main.main-content .card.fade-in');
        if (!anchor) return;

        const shell = document.createElement('section');
        shell.className = 'phase1-crm-shell';
        shell.id = 'phase1CrmShell';
        shell.innerHTML = `
            <div class="phase1-card">
                <div class="phase1-card-head">
                    <div><div class="phase1-eyebrow">Oyuncu CRM</div><h2 id="phase1PlayerTitle">Oyuncu seçin</h2><p id="phase1PlayerSubtitle">Tablodan bir oyuncu seçin ya da Ctrl+K ile arayın.</p></div>
                    <div class="phase1-badge-row">
                        <span class="phase1-badge loyalty" id="phase1PlayerLoyalty">BRONZE</span>
                        <span class="phase1-badge risk" id="phase1PlayerRisk">Risk 0</span>
                        <span class="phase1-badge fraud phase1-hidden" id="phase1PlayerFraud"><i class="fas fa-triangle-exclamation"></i> Multi-Accounting Şüphesi</span>
                    </div>
                </div>
                <div class="phase1-widget-grid" id="phase1PlayerWidgets"><div class="phase1-empty" style="grid-column: 1 / -1;">Oyuncu seçildiğinde kasa, yatırım, çekim ve GGR burada görünecek.</div></div>
                <div class="phase1-crm-grid">
                    <article class="phase1-card">
                        <div class="phase1-card-head"><h3><i class="fas fa-shield-halved"></i> Anti-Fraud</h3></div>
                        <div class="phase1-fraud-summary" id="phase1FraudSummary"></div>
                        <div class="phase1-related-accounts" id="phase1RelatedAccounts"></div>
                    </article>
                    <article class="phase1-card">
                        <div class="phase1-card-head"><h3><i class="fas fa-note-sticky"></i> CRM Notları</h3></div>
                        <form class="phase1-note-form" id="phase1NoteForm">
                            <div class="phase1-field-row">
                                <label class="phase1-field"><span>Not Türü</span><select id="phase1NoteType"><option value="GENERAL">Genel</option><option value="AGGRESSIVE">Çok agresif</option><option value="VIP_CANDIDATE">VIP adayı</option><option value="RISK">Risk / Fraud</option></select></label>
                                <label class="phase1-field"><span>Görünürlük</span><select id="phase1NoteVisibility"><option value="INTERNAL">Internal</option><option value="SUPPORT">Support</option><option value="FINANCE">Finance</option></select></label>
                            </div>
                            <label class="phase1-field"><span>Not İçeriği</span><textarea id="phase1NoteText" rows="4" placeholder="Örn: Çok agresif, VIP adayı, çekim baskısı yüksek..."></textarea></label>
                            <button type="submit" class="phase1-btn primary"><i class="fas fa-plus"></i><span>Not Ekle</span></button>
                        </form>
                        <div class="phase1-note-list" id="phase1NoteList"></div>
                    </article>
                </div>
            </div>
        `;
        anchor.insertAdjacentElement('afterend', shell);

        document.getElementById('phase1NoteForm').addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!state.currentPlayerId) {
                showToastSafe('Önce bir oyuncu seçin.', 'warning');
                return;
            }
            try {
                await apiFetch(`/api/admin/phase1/players/${state.currentPlayerId}/notes`, {
                    method: 'POST',
                    body: JSON.stringify({
                        noteType: document.getElementById('phase1NoteType').value,
                        visibility: document.getElementById('phase1NoteVisibility').value,
                        noteText: document.getElementById('phase1NoteText').value
                    })
                });
                document.getElementById('phase1NoteText').value = '';
                showToastSafe('CRM notu kaydedildi.', 'success');
                await openPlayerCrm(state.currentPlayerId);
            } catch (error) {
                showToastSafe(error.message || 'Not kaydedilemedi.', 'error');
            }
        });
    };

    const renderPlayerWidgets = (widgets) => {
        const target = document.getElementById('phase1PlayerWidgets');
        if (!target) return;
        target.innerHTML = widgets.map((widget) => `<div class="phase1-widget"><span>${escapeHtml(widget.label)}</span><strong>${escapeHtml(formatCurrency(widget.value))}</strong></div>`).join('');
    };

    const renderFraud = (fraud) => {
        const summary = document.getElementById('phase1FraudSummary');
        const related = document.getElementById('phase1RelatedAccounts');
        if (!summary || !related) return;

        summary.innerHTML = `
            <div class="phase1-fraud-row"><strong>Çekim / Yatırım Oranı</strong><span>%${escapeHtml(String(fraud.withdrawToDepositRatio.toFixed(2)))}</span></div>
            <div class="phase1-fraud-row"><strong>Risk Skoru</strong><span>${escapeHtml(String(fraud.riskScore))}</span></div>
            <div class="phase1-fraud-row"><strong>Multi-Accounting</strong><span>${fraud.hasMultiAccounting ? 'Şüpheli' : 'Temiz'}</span></div>
        `;

        const relatedAccounts = [...(fraud.relatedAccounts || []), ...(fraud.sharedIps || []).map((item) => ({ username: `${item.account_count} hesap`, ip_address: item.ip_address }))];
        related.innerHTML = relatedAccounts.length
            ? relatedAccounts.map((item) => `<div class="phase1-related-account"><strong>${escapeHtml(item.username || 'Bağlı hesap')}</strong><small>${escapeHtml(item.ip_address || '-')}</small></div>`).join('')
            : '<div class="phase1-empty">Aynı IP üzerinden eşleşen başka hesap bulunamadı.</div>';
    };

    const renderNotes = (notes) => {
        const target = document.getElementById('phase1NoteList');
        if (!target) return;
        target.innerHTML = notes.length
            ? notes.map((note) => `<article class="phase1-note-item"><div class="phase1-note-meta"><strong>${escapeHtml(note.note_type || 'GENERAL')}</strong><span>${escapeHtml(note.admin_name || note.admin_username || 'Admin')} · ${escapeHtml(formatDateTime(note.created_at))}</span></div><div class="phase1-note-text">${escapeHtml(note.note_text)}</div></article>`).join('')
            : '<div class="phase1-empty">Henüz CRM notu yok.</div>';
    };

    const openPlayerCrm = async (playerId) => {
        ensureCrmShell();

        try {
            const payload = await apiFetch(`/api/admin/phase1/players/${playerId}`);
            state.currentPlayerId = playerId;

            document.getElementById('phase1PlayerTitle').textContent = payload.player.username;
            document.getElementById('phase1PlayerSubtitle').textContent = `${payload.player.email || 'E-posta yok'} · ${payload.player.phone || 'Telefon yok'} · ${payload.player.status}`;
            document.getElementById('phase1PlayerLoyalty').textContent = payload.player.loyalty_level || 'BRONZE';
            document.getElementById('phase1PlayerRisk').textContent = `Risk ${payload.player.risk_score || 0}`;
            document.getElementById('phase1PlayerFraud').classList.toggle('phase1-hidden', !payload.fraud.hasMultiAccounting);

            renderPlayerWidgets(payload.widgets || []);
            renderFraud(payload.fraud || {});
            renderNotes(payload.notes || []);

            const noteForm = document.getElementById('phase1NoteForm');
            if (noteForm) noteForm.classList.toggle('phase1-hidden', !can('notes:write'));

            document.getElementById('phase1CrmShell').scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (error) {
            showToastSafe(error.message || 'Oyuncu CRM verisi yüklenemedi.', 'error');
        }
    };

    const decorateUserRows = () => {
        const tbody = document.getElementById('usersTable');
        if (!tbody) return;

        tbody.querySelectorAll('tr').forEach((row) => {
            const idCell = row.querySelector('td');
            const actionCell = row.querySelector('.action-btns');
            if (!idCell || !actionCell) return;

            const userId = Number(String(idCell.textContent || '').replace('#', '').trim());
            if (!userId) return;

            if (!actionCell.querySelector('.phase1-crm-trigger')) {
                const button = document.createElement('button');
                button.className = 'action-btn phase1-crm-trigger';
                button.title = 'CRM';
                button.innerHTML = '<i class="fas fa-id-card"></i>';
                button.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    openPlayerCrm(userId);
                });
                actionCell.prepend(button);
            }

            if (!row.dataset.phase1Bound) {
                row.dataset.phase1Bound = '1';
                row.addEventListener('dblclick', () => openPlayerCrm(userId));
            }
        });
    };

    const patchUsersPage = async () => {
        ensureCrmShell();

        if (typeof window.renderUsers === 'function' && !window.renderUsers.__phase1Wrapped) {
            const originalRenderUsers = window.renderUsers;
            const wrapped = function (users) {
                originalRenderUsers(users);
                decorateUserRows();
            };
            wrapped.__phase1Wrapped = true;
            window.renderUsers = wrapped;
        }

        decorateUserRows();

        const requestedPlayerId = Number(new URLSearchParams(window.location.search).get('playerId') || 0);
        if (requestedPlayerId) await openPlayerCrm(requestedPlayerId);
    };

    const guardFinancePage = () => {
        if (can('transactions:read')) return;
        sessionStorage.setItem('adminPhase1Toast', 'Bu rol finans ekranını görüntüleyemez.');
        window.location.href = '/admin/dashboard';
    };

    const flushRedirectToast = () => {
        const message = sessionStorage.getItem('adminPhase1Toast');
        if (!message) return;
        sessionStorage.removeItem('adminPhase1Toast');
        showToastSafe(message, 'warning');
    };

    const init = async () => {
        try {
            const session = await apiFetch('/api/admin/session');
            state.actor = session.actor;
            applyActorChrome();
            buildOmnibar();
            flushRedirectToast();

            if (getPath() === '/admin/dashboard') await patchDashboardPage();
            if (getPath() === '/admin/kullanicilar') await patchUsersPage();
            if (getPath() === '/admin/finans') guardFinancePage();
        } catch (error) {
            console.error('Phase1 integration init error:', error);
        }
    };

    document.addEventListener('DOMContentLoaded', init);
})();
