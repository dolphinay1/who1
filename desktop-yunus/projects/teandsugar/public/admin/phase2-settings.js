(function () {
    if (window.location.pathname !== '/admin/ayarlar') return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
    const formatCurrency = (value) => `₺ ${Number(value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
        const grid = document.querySelector('.settings-grid');
        if (!grid || document.getElementById('phase2PaymentMethodsCard')) return;

        const paymentCard = document.createElement('section');
        paymentCard.className = 'settings-card fade-in';
        paymentCard.id = 'phase2PaymentMethodsCard';
        paymentCard.innerHTML = `
            <div class="settings-card-header"><i class="fas fa-money-check-dollar"></i><h3>Ödeme Yöntemi Limitleri</h3></div>
            <div class="settings-card-body">
                <div class="phase2-inline-form">
                    <label class="phase2-field"><span>Yöntem</span><input id="phase2MethodKey" placeholder="papara"></label>
                    <label class="phase2-field"><span>Etiket</span><input id="phase2MethodLabel" placeholder="Papara"></label>
                    <label class="phase2-field"><span>Tip</span><select id="phase2MethodType"><option value="deposit">Deposit</option><option value="withdraw">Withdraw</option></select></label>
                    <label class="phase2-field"><span>Alt Limit</span><input id="phase2MethodMin" type="number" step="0.01"></label>
                    <label class="phase2-field"><span>Üst Limit</span><input id="phase2MethodMax" type="number" step="0.01"></label>
                    <label class="phase2-field"><span>Sıra</span><input id="phase2MethodSort" type="number" step="1" value="0"></label>
                </div>
                <div class="phase2-row-actions">
                    <label class="phase2-chip info"><input id="phase2MethodActive" type="checkbox" checked style="accent-color:#22c55e;"> Aktif</label>
                    <button class="phase2-btn secondary" id="phase2MethodReset" type="button">Temizle</button>
                    <button class="phase2-btn primary" id="phase2MethodSave" type="button">Kaydet</button>
                </div>
                <div class="phase2-table-wrap" style="margin-top:16px;">
                    <table class="phase2-table">
                        <thead><tr><th>Yöntem</th><th>Tip</th><th>Limit</th><th>Durum</th><th></th></tr></thead>
                        <tbody id="phase2PaymentMethodRows"><tr><td colspan="5" class="phase2-empty">Yükleniyor...</td></tr></tbody>
                    </table>
                </div>
            </div>
        `;

        const automationCard = document.createElement('section');
        automationCard.className = 'settings-card fade-in';
        automationCard.id = 'phase2AutomationCard';
        automationCard.innerHTML = `
            <div class="settings-card-header"><i class="fas fa-shield-halved"></i><h3>Faz 2 Otomasyon Eşikleri</h3></div>
            <div class="settings-card-body">
                <div class="phase2-inline-form">
                    <label class="phase2-field"><span>BTC Onay</span><input id="phase2BtcConf" type="number" min="1"></label>
                    <label class="phase2-field"><span>ETH Onay</span><input id="phase2EthConf" type="number" min="1"></label>
                    <label class="phase2-field"><span>Fast-Track Limit</span><input id="phase2FastTrackLimit" type="number" step="0.01"></label>
                    <label class="phase2-field"><span>RTP Kill-Switch %</span><input id="phase2RtpThreshold" type="number" step="0.01"></label>
                    <label class="phase2-field"><span>Telegram Token</span><input id="phase2TelegramToken"></label>
                    <label class="phase2-field"><span>Telegram Chat ID</span><input id="phase2TelegramChat"></label>
                </div>
                <div class="phase2-field" style="margin-top:12px;"><span>Crypto Webhook Secret</span><input id="phase2WebhookSecret"></div>
                <div class="phase2-row-actions"><button class="phase2-btn primary" id="phase2AutomationSave" type="button">Kaydet</button></div>
            </div>
        `;

        grid.appendChild(paymentCard);
        grid.appendChild(automationCard);
    };

    const resetForm = () => {
        document.getElementById('phase2MethodKey').value = '';
        document.getElementById('phase2MethodLabel').value = '';
        document.getElementById('phase2MethodType').value = 'deposit';
        document.getElementById('phase2MethodMin').value = '';
        document.getElementById('phase2MethodMax').value = '';
        document.getElementById('phase2MethodSort').value = '0';
        document.getElementById('phase2MethodActive').checked = true;
    };

    const loadPaymentMethods = async () => {
        const payload = await apiFetch('/api/admin/payment-methods');
        const items = payload.items || [];
        const tbody = document.getElementById('phase2PaymentMethodRows');

        if (!items.length) {
            tbody.innerHTML = '<tr><td colspan="5" class="phase2-empty">Kayıtlı limit bulunamadı.</td></tr>';
            return;
        }

        tbody.innerHTML = items.map((item) => `
            <tr>
                <td><strong>${escapeHtml(item.label)}</strong><div class="phase2-subtext">${escapeHtml(item.method_key)}</div></td>
                <td>${escapeHtml(item.transaction_type)}</td>
                <td>${escapeHtml(formatCurrency(item.min_amount))} - ${escapeHtml(formatCurrency(item.max_amount))}</td>
                <td><span class="phase2-chip ${item.is_active ? 'success' : 'danger'}">${item.is_active ? 'Aktif' : 'Pasif'}</span></td>
                <td><div class="phase2-actions"><button class="phase2-btn secondary" data-edit="${item.id}">Düzenle</button><button class="phase2-btn danger" data-delete="${item.id}">Sil</button></div></td>
            </tr>
        `).join('');

        tbody.querySelectorAll('[data-edit]').forEach((button) => {
            button.addEventListener('click', () => {
                const item = items.find((entry) => Number(entry.id) === Number(button.dataset.edit));
                if (!item) return;
                document.getElementById('phase2MethodKey').value = item.method_key;
                document.getElementById('phase2MethodLabel').value = item.label;
                document.getElementById('phase2MethodType').value = item.transaction_type;
                document.getElementById('phase2MethodMin').value = item.min_amount;
                document.getElementById('phase2MethodMax').value = item.max_amount;
                document.getElementById('phase2MethodSort').value = item.sort_order || 0;
                document.getElementById('phase2MethodActive').checked = Boolean(item.is_active);
            });
        });

        tbody.querySelectorAll('[data-delete]').forEach((button) => {
            button.addEventListener('click', async () => {
                if (!confirm('Bu limiti silmek istediğinize emin misiniz?')) return;
                try {
                    await apiFetch(`/api/admin/payment-methods/${button.dataset.delete}`, { method: 'DELETE' });
                    toast('Ödeme limiti silindi.', 'success');
                    await loadPaymentMethods();
                } catch (error) {
                    toast(error.message, 'error');
                }
            });
        });
    };

    const loadAutomation = async () => {
        const settings = await apiFetch('/api/settings');
        document.getElementById('phase2BtcConf').value = settings.btc_confirmations_required || 3;
        document.getElementById('phase2EthConf').value = settings.eth_confirmations_required || 12;
        document.getElementById('phase2FastTrackLimit').value = settings.fast_track_withdraw_limit || 10000;
        document.getElementById('phase2RtpThreshold').value = settings.rtp_kill_switch_threshold || 150;
        document.getElementById('phase2TelegramToken').value = settings.telegram_bot_token || '';
        document.getElementById('phase2TelegramChat').value = settings.telegram_chat_id || '';
        document.getElementById('phase2WebhookSecret').value = settings.crypto_webhook_secret || '';
    };

    document.addEventListener('DOMContentLoaded', async () => {
        ensureShell();
        resetForm();

        document.getElementById('phase2MethodReset').addEventListener('click', resetForm);
        document.getElementById('phase2MethodSave').addEventListener('click', async () => {
            try {
                await apiFetch('/api/admin/payment-methods', {
                    method: 'POST',
                    body: JSON.stringify({
                        methodKey: document.getElementById('phase2MethodKey').value.trim(),
                        label: document.getElementById('phase2MethodLabel').value.trim(),
                        transactionType: document.getElementById('phase2MethodType').value,
                        minAmount: document.getElementById('phase2MethodMin').value,
                        maxAmount: document.getElementById('phase2MethodMax').value,
                        sortOrder: document.getElementById('phase2MethodSort').value,
                        isActive: document.getElementById('phase2MethodActive').checked
                    })
                });
                toast('Ödeme limiti kaydedildi.', 'success');
                resetForm();
                await loadPaymentMethods();
            } catch (error) {
                toast(error.message, 'error');
            }
        });

        document.getElementById('phase2AutomationSave').addEventListener('click', async () => {
            try {
                await apiFetch('/api/settings', {
                    method: 'POST',
                    body: JSON.stringify({
                        btc_confirmations_required: document.getElementById('phase2BtcConf').value,
                        eth_confirmations_required: document.getElementById('phase2EthConf').value,
                        fast_track_withdraw_limit: document.getElementById('phase2FastTrackLimit').value,
                        rtp_kill_switch_threshold: document.getElementById('phase2RtpThreshold').value,
                        telegram_bot_token: document.getElementById('phase2TelegramToken').value,
                        telegram_chat_id: document.getElementById('phase2TelegramChat').value,
                        crypto_webhook_secret: document.getElementById('phase2WebhookSecret').value
                    })
                });
                toast('Faz 2 eşikleri kaydedildi.', 'success');
            } catch (error) {
                toast(error.message, 'error');
            }
        });

        await loadPaymentMethods();
        await loadAutomation();
    });
})();
