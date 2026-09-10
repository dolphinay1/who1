(function () {
    if (window.location.pathname !== '/admin/dashboard') return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
    const formatCurrency = (value) => `₺ ${Number(value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const formatDateTime = (value) => value ? new Date(value).toLocaleString('tr-TR') : '-';

    const state = { actor: null };

    const toast = (message, type = 'info') => {
        if (typeof window.showToast === 'function') window.showToast(message, type === 'error' ? 'error' : type);
    };

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

    const ensureShell = () => {
        if (document.getElementById('phase2ProviderShell')) return;
        const main = document.querySelector('main.main-content');
        if (!main) return;

        const section = document.createElement('section');
        section.id = 'phase2ProviderShell';
        section.className = 'phase2-shell';
        section.innerHTML = `
            <div class="phase2-card">
                <div class="phase2-card-head">
                    <div><div class="phase2-subtext">Provider Güvenlik Kalkanı</div><h3><i class="fas fa-shield-heart"></i> Sağlayıcı Kâr/Zarar ve RTP Alarmı</h3></div>
                    <div class="phase2-status"><span class="phase2-status-dot"></span><span id="phase2ProviderStatus">Veri yükleniyor...</span></div>
                </div>
                <div style="padding:20px;">
                    <div class="phase2-provider-cards" id="phase2ProviderCards"></div>
                    <div class="phase2-grid two" style="margin-top:18px;">
                        <div class="phase2-card"><div class="phase2-card-head"><h3><i class="fas fa-triangle-exclamation"></i> Son Alarmlar</h3></div><div style="padding:18px;" id="phase2ProviderAlerts"></div></div>
                        <div class="phase2-card"><div class="phase2-card-head"><h3><i class="fas fa-wave-square"></i> Sıcak Oyunlar</h3></div><div class="phase2-table-wrap"><table class="phase2-table"><thead><tr><th>Oyun</th><th>RTP</th><th>Durum</th><th></th></tr></thead><tbody id="phase2ProviderHotGames"></tbody></table></div></div>
                    </div>
                    <div class="phase2-card" id="phase2ProviderSimulator" style="margin-top:18px; display:none;">
                        <div class="phase2-card-head"><h3><i class="fas fa-flask"></i> RTP Simülatörü</h3></div>
                        <div style="padding:20px;">
                            <div class="phase2-inline-form">
                                <label class="phase2-field"><span>Provider</span><input id="phase2SimProvider" value="pragmatic-play"></label>
                                <label class="phase2-field"><span>Provider Etiketi</span><input id="phase2SimProviderLabel" value="Pragmatic Play"></label>
                                <label class="phase2-field"><span>Oyun ID</span><input id="phase2SimGameId" value="vs20olympgate"></label>
                                <label class="phase2-field"><span>Oyun Adı</span><input id="phase2SimGameName" value="Gates of Olympus"></label>
                                <label class="phase2-field"><span>Toplam Bet</span><input id="phase2SimBet" type="number" value="10000"></label>
                                <label class="phase2-field"><span>Toplam Win</span><input id="phase2SimWin" type="number" value="17000"></label>
                            </div>
                            <div class="phase2-row-actions"><button class="phase2-btn danger" id="phase2SimSubmit">Anomaliyi Test Et</button></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const anchor = main.children[2];
        if (anchor) anchor.insertAdjacentElement('afterend', section);
        else main.appendChild(section);
    };

    const renderOverview = (payload) => {
        document.getElementById('phase2ProviderStatus').textContent = `Son yenileme · ${new Date().toLocaleTimeString('tr-TR')}`;
        const cards = payload.providers || [];
        document.getElementById('phase2ProviderCards').innerHTML = cards.length
            ? cards.map((item) => `
                <div class="phase2-provider-card">
                    <h4>${escapeHtml(item.provider_label || item.provider_key)}</h4>
                    <div class="phase2-provider-profit ${Number(item.profit_loss || 0) >= 0 ? 'positive' : 'negative'}">${escapeHtml(formatCurrency(item.profit_loss || 0))}</div>
                    <div class="phase2-subtext">${item.total_games || 0} oyun · ${item.disabled_games || 0} devre dışı · Peak RTP ${Number(item.peak_rtp || 0).toFixed(2)}%</div>
                </div>
            `).join('')
            : '<div class="phase2-empty">Henüz provider metriği yok.</div>';

        const alerts = payload.alerts || [];
        document.getElementById('phase2ProviderAlerts').innerHTML = alerts.length
            ? alerts.map((alert) => `
                <div class="phase2-alert-item">
                    <strong>${escapeHtml(alert.provider_label)} / ${escapeHtml(alert.game_name)}</strong>
                    <p>${escapeHtml(alert.message)}</p>
                    <div class="phase2-subtext">${escapeHtml(formatDateTime(alert.created_at))}</div>
                </div>
            `).join('')
            : '<div class="phase2-empty">Aktif alarm görünmüyor.</div>';

        const hotGames = payload.hotGames || [];
        const tbody = document.getElementById('phase2ProviderHotGames');
        tbody.innerHTML = hotGames.length
            ? hotGames.map((item) => `
                <tr>
                    <td><strong>${escapeHtml(item.game_name)}</strong><div class="phase2-subtext">${escapeHtml(item.provider_label)}</div></td>
                    <td><span class="phase2-chip ${Number(item.current_rtp_percent || 0) > 150 ? 'danger' : Number(item.current_rtp_percent || 0) > 120 ? 'warning' : 'success'}">${Number(item.current_rtp_percent || 0).toFixed(2)}%</span></td>
                    <td><span class="phase2-chip ${item.is_active ? 'success' : 'danger'}">${item.is_active ? 'Aktif' : 'Pasif'}</span></td>
                    <td>${state.actor?.roleKey === 'ADMIN' ? `<button class="phase2-btn secondary" data-id="${item.id}" data-active="${item.is_active ? 'true' : 'false'}">${item.is_active ? 'Pasifleştir' : 'Aktifleştir'}</button>` : ''}</td>
                </tr>
            `).join('')
            : '<tr><td colspan="4" class="phase2-empty">Henüz veri yok.</td></tr>';

        tbody.querySelectorAll('button[data-id]').forEach((button) => {
            button.addEventListener('click', async () => {
                try {
                    await apiFetch(`/api/admin/providers/games/${button.dataset.id}/toggle`, {
                        method: 'POST',
                        body: JSON.stringify({ isActive: button.dataset.active !== 'true' })
                    });
                    toast('Oyun durumu güncellendi.', 'success');
                    await loadOverview();
                } catch (error) {
                    toast(error.message, 'error');
                }
            });
        });
    };

    const loadOverview = async () => {
        const payload = await apiFetch('/api/admin/providers/overview');
        renderOverview(payload);
    };

    const submitSimulation = async () => {
        try {
            await apiFetch('/api/admin/providers/metrics', {
                method: 'POST',
                body: JSON.stringify({
                    providerKey: document.getElementById('phase2SimProvider').value.trim(),
                    providerLabel: document.getElementById('phase2SimProviderLabel').value.trim(),
                    gameKey: document.getElementById('phase2SimGameId').value.trim(),
                    gameName: document.getElementById('phase2SimGameName').value.trim(),
                    totalBet: Number(document.getElementById('phase2SimBet').value || 0),
                    totalWin: Number(document.getElementById('phase2SimWin').value || 0)
                })
            });
            toast('Provider metriği işlendi.', 'success');
            await loadOverview();
        } catch (error) {
            toast(error.message, 'error');
        }
    };

    document.addEventListener('DOMContentLoaded', async () => {
        ensureShell();
        const session = await apiFetch('/api/admin/session').catch(() => ({ actor: null }));
        state.actor = session.actor || null;
        if (state.actor?.roleKey === 'ADMIN') {
            document.getElementById('phase2ProviderSimulator').style.display = 'block';
            document.getElementById('phase2SimSubmit').addEventListener('click', submitSimulation);
        }
        await loadOverview();
        setInterval(() => loadOverview().catch((error) => console.error(error)), 12000);
    });
})();
