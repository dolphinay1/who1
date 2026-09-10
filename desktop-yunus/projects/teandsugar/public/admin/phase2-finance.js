(function () {
    if (window.location.pathname !== '/admin/finans') return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const formatCurrency = (value) => `₺ ${Number(value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const formatDateTime = (value) => value ? new Date(value).toLocaleString('tr-TR') : '-';
    const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));

    const apiFetch = async (url, options = {}) => {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Authorization': `Bearer ${token}`,
                ...(options.body ? { 'Content-Type': 'application/json' } : {}),
                ...(options.headers || {})
            }
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || payload.success === false) throw new Error(payload.message || payload.error || 'İstek başarısız.');
        return payload;
    };

    const toast = (message, type = 'info') => {
        if (typeof window.showToast === 'function') window.showToast(message, type === 'error' ? 'error' : type);
    };

    const ensureModal = () => {
        if (document.getElementById('phase2DecisionModal')) return;
        const backdrop = document.createElement('div');
        backdrop.id = 'phase2DecisionBackdrop';
        backdrop.className = 'phase2-modal-backdrop';
        const modal = document.createElement('div');
        modal.id = 'phase2DecisionModal';
        modal.className = 'phase2-modal';
        modal.innerHTML = `
            <div class="phase2-card">
                <div class="phase2-card-head">
                    <div><div class="phase2-subtext">Finans Kararı</div><h3 id="phase2DecisionTitle">İşlem Kararı</h3></div>
                    <button class="phase2-btn secondary" type="button" id="phase2DecisionClose">Kapat</button>
                </div>
                <div style="padding:20px;">
                    <div class="phase2-field"><span>Operasyon Notu</span><textarea id="phase2DecisionNote" placeholder="Not veya açıklama..."></textarea></div>
                    <div class="phase2-row-actions">
                        <button class="phase2-btn secondary" type="button" id="phase2DecisionCancel">İptal</button>
                        <button class="phase2-btn primary" type="button" id="phase2DecisionSubmit">Uygula</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(backdrop);
        document.body.appendChild(modal);
        backdrop.addEventListener('click', closeModal);
        document.getElementById('phase2DecisionClose').addEventListener('click', closeModal);
        document.getElementById('phase2DecisionCancel').addEventListener('click', closeModal);
    };

    const decisionState = { id: null, action: 'approve' };
    const openModal = (id, action) => {
        ensureModal();
        decisionState.id = id;
        decisionState.action = action;
        document.getElementById('phase2DecisionTitle').textContent = action === 'approve' ? 'İşlemi Onayla' : 'İşlemi Reddet';
        document.getElementById('phase2DecisionSubmit').className = `phase2-btn ${action === 'approve' ? 'success' : 'danger'}`;
        document.getElementById('phase2DecisionSubmit').textContent = action === 'approve' ? 'Onayla' : 'Reddet';
        document.getElementById('phase2DecisionNote').value = '';
        document.getElementById('phase2DecisionBackdrop').classList.add('show');
        document.getElementById('phase2DecisionModal').classList.add('show');
    };

    function closeModal() {
        document.getElementById('phase2DecisionBackdrop')?.classList.remove('show');
        document.getElementById('phase2DecisionModal')?.classList.remove('show');
    }

    const ensureShell = () => {
        if (document.getElementById('phase2FinanceShell')) return;
        const statsGrid = document.querySelector('.stats-grid');
        if (!statsGrid) return;
        const section = document.createElement('section');
        section.id = 'phase2FinanceShell';
        section.className = 'phase2-shell';
        section.innerHTML = `
            <div class="phase2-card">
                <div class="phase2-card-head">
                    <div><div class="phase2-subtext">Finans Merkezi</div><h3><i class="fas fa-wave-square"></i> Canlı Kuyruk</h3></div>
                    <div class="phase2-status"><span class="phase2-status-dot"></span><span id="phase2FinanceStatus">Polling aktif · 8s</span></div>
                </div>
                <div style="padding:20px;">
                    <div class="phase2-grid three" id="phase2FinanceMetrics"></div>
                    <div class="phase2-table-wrap" style="margin-top:16px;">
                        <table class="phase2-table">
                            <thead><tr><th>Oyuncu</th><th>İşlem</th><th>Tutar</th><th>Risk / Sadakat</th><th>Not</th><th>Karar</th></tr></thead>
                            <tbody id="phase2FinanceRows"><tr><td colspan="6" class="phase2-empty">Yükleniyor...</td></tr></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        statsGrid.insertAdjacentElement('afterend', section);
    };

    const renderQueue = (payload) => {
        ensureShell();
        const summary = payload.summary || {};
        document.getElementById('phase2FinanceStatus').textContent = `Son güncelleme · ${new Date().toLocaleTimeString('tr-TR')}`;
        document.getElementById('phase2FinanceMetrics').innerHTML = [
            ['Bekleyen Yatırım', formatCurrency(summary.pending_deposit_total || 0)],
            ['Bekleyen Çekim', formatCurrency(summary.pending_withdraw_total || 0)],
            ['Bugün Tamamlanan', formatCurrency(summary.today_approved_total || 0)]
        ].map(([label, value]) => `<div class="phase2-metric"><div class="phase2-metric-label">${label}</div><div class="phase2-metric-value">${value}</div></div>`).join('');

        if (document.getElementById('pendingDeposits')) document.getElementById('pendingDeposits').textContent = formatCurrency(summary.pending_deposit_total || 0);
        if (document.getElementById('pendingWithdraws')) document.getElementById('pendingWithdraws').textContent = formatCurrency(summary.pending_withdraw_total || 0);
        if (document.getElementById('pendingDepositCount')) document.getElementById('pendingDepositCount').textContent = `${summary.pending_deposit_count || 0} talep`;
        if (document.getElementById('pendingWithdrawCount')) document.getElementById('pendingWithdrawCount').textContent = `${summary.pending_withdraw_count || 0} talep`;
        if (document.getElementById('todayApproved')) document.getElementById('todayApproved').textContent = formatCurrency(summary.today_approved_total || 0);
        if (document.getElementById('todayTotal')) document.getElementById('todayTotal').textContent = summary.today_total_count || 0;

        const rows = payload.items || [];
        const tbody = document.getElementById('phase2FinanceRows');
        if (!rows.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="phase2-empty">Bekleyen finans kuyruğu temiz.</td></tr>';
            return;
        }

        tbody.innerHTML = rows.map((item) => `
            <tr>
                <td><strong>${escapeHtml(item.username)}</strong><div class="phase2-subtext">${escapeHtml(formatDateTime(item.created_at))}</div></td>
                <td><span class="phase2-chip ${item.type === 'deposit' ? 'success' : 'warning'}">${item.type === 'deposit' ? 'Yatırım' : 'Çekim'}</span><div class="phase2-subtext">${escapeHtml(item.method || '-')}</div></td>
                <td><strong>${escapeHtml(formatCurrency(item.amount))}</strong></td>
                <td><span class="phase2-chip ${Number(item.risk_score || 0) >= 70 ? 'danger' : 'info'}">Risk ${escapeHtml(String(item.risk_score || 0))}</span> <span class="phase2-chip info">${escapeHtml(item.loyalty_level || 'BRONZE')}</span>${item.fastTrackEligible ? ' <span class="phase2-chip success">VIP Fast-Track</span>' : ''}</td>
                <td><div class="phase2-subtext">${escapeHtml(item.asset_symbol ? `${item.asset_symbol} ${item.confirmations || 0}/${item.required_confirmations || 0} onay` : (item.review_reason || item.admin_note || '-'))}</div></td>
                <td><div class="phase2-actions"><button class="phase2-btn success" data-action="approve" data-id="${item.id}">Onayla</button><button class="phase2-btn danger" data-action="reject" data-id="${item.id}">Reddet</button></div></td>
            </tr>
        `).join('');

        tbody.querySelectorAll('[data-action]').forEach((button) => {
            button.addEventListener('click', () => openModal(Number(button.dataset.id), button.dataset.action));
        });
    };

    const refreshQueue = async () => {
        const payload = await apiFetch('/api/admin/finance/queue');
        renderQueue(payload);
    };

    const submitDecision = async () => {
        try {
            await apiFetch(`/api/admin/finance/transactions/${decisionState.id}/decision`, {
                method: 'POST',
                body: JSON.stringify({ action: decisionState.action, note: document.getElementById('phase2DecisionNote').value.trim() })
            });
            closeModal();
            toast(decisionState.action === 'approve' ? 'İşlem onaylandı.' : 'İşlem reddedildi.', 'success');
            await refreshQueue();
            if (typeof window.loadTransactions === 'function') window.loadTransactions();
            if (typeof window.loadStats === 'function') window.loadStats();
        } catch (error) {
            toast(error.message, 'error');
        }
    };

    document.addEventListener('DOMContentLoaded', async () => {
        ensureShell();
        ensureModal();
        document.getElementById('phase2DecisionSubmit').addEventListener('click', submitDecision);
        document.getElementById('rejectModal')?.remove();
        document.getElementById('modalBackdrop')?.remove();
        window.approveTransaction = (id) => openModal(id, 'approve');
        window.openRejectModal = (id) => openModal(id, 'reject');
        await refreshQueue();
        setInterval(() => refreshQueue().catch((error) => console.error(error)), 8000);
    });
})();
