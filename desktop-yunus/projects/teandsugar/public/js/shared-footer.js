(() => {
    if (window.__clashbetSharedFooterMounted) {
        return;
    }

    window.__clashbetSharedFooterMounted = true;

    const PAYMENT_ITEMS = [
        { src: 'kredi.png', alt: 'Kredi Karti' },
        { src: 'banka.png', alt: 'Banka Havalesi' },
        { src: 'fast.png', alt: 'Fast Havalesi' },
        { src: 'papara.png', alt: 'Papara' },
        { src: 'bitcoin.png', alt: 'Bitcoin' },
        { src: 'litecoin.svg', alt: 'Litecoin' },
        { src: 'ethereum.svg', alt: 'Ethereum' },
        { src: 'payco.svg', alt: 'Payco' },
        { src: 'superhavale.svg', alt: 'Superhavale' },
        { src: 'pep.svg', alt: 'Pep' }
    ];

    const PROVIDERS = [
        { src: '/images/providers/EGT_digital_d0944a3a71.svg', alt: 'EGT Digital' },
        { src: '/images/providers/Playtech-Logo.wine.svg', alt: 'Playtech' },
        { src: '/images/providers/amusnet.png', alt: 'Amusnet' },
        { src: '/images/providers/big-time-gaming-logo-vector.svg', alt: 'Big Time Gaming' },
        { src: '/images/providers/booming_games_New-lg.png', alt: 'Booming Games' },
        { src: '/images/providers/evolution-gaming-logo-vector.svg', alt: 'Evolution Gaming' },
        { src: '/images/providers/hacksaw.svg', alt: 'Hacksaw Gaming' },
        { src: '/images/providers/isoftbet-logo-vector.svg', alt: 'iSoftBet' },
        { src: '/images/providers/js-elk-provider.webp.bv.webp', alt: 'ELK Studios' },
        { src: '/images/providers/logo-@2.webp.bv.webp', alt: 'Provider' },
        { src: '/images/providers/microgaming-logo-vector.svg', alt: 'Microgaming' },
        { src: '/images/providers/netent-logo-vector.svg', alt: 'NetEnt' },
        { src: '/images/providers/nolimit-city-logo-e1663845295134-480x237.png', alt: 'NoLimit City' },
        { src: '/images/providers/playn-go-logo-vector.svg', alt: 'Play&#39;n GO' },
        { src: '/images/providers/pngfind.com-optic-gaming-logo-png-2748360.png', alt: 'Optic Gaming' },
        { src: '/images/providers/pngfind.com-sharknado-png-3519538.png', alt: 'Sharknado' },
        { src: '/images/providers/pragmatic.png', alt: 'Pragmatic Play' },
        { src: '/images/providers/pushgaming.png', alt: 'Push Gaming' },
        { src: '/images/providers/red-tiger-slots-logo-vector.svg', alt: 'Red Tiger' },
        { src: '/images/providers/reevo.png', alt: 'Reevo' },
        { src: '/images/providers/wazdan.png', alt: 'Wazdan' },
        { src: '/images/providers/yggdrasil-gaming-logo-vector.svg', alt: 'Yggdrasil' }
    ];

    const LEGAL_LINKS = [
        { href: 'terms-and-conditions.html', label: '&#350;artlar ve Ko&#351;ullar' },
        { href: 'privacy-policy.html', label: 'Gizlilik Politikas&#305;' },
        { href: 'fair-play.html', label: 'Adil Oyun Politikas&#305;' },
        { href: 'kyc-politikasi.html', label: 'KYC Politikas&#305;' },
        { href: 'responsible-game.html', label: 'Sorumlu Oyun' },
        { href: 'privacy-policy.html', label: '&#199;erez Politikas&#305;' }
    ];

    const SUPPORT_LINKS = [
        { href: 'contact-us.html', label: '&#304;leti&#351;im Sayfas&#305;' },
        { href: 'faq.html', label: 'S&#305;k&#231;a Sorulan Sorular' },
        { href: 'games-rules.html', label: 'Oyun Kurallar&#305;' },
        { href: 'affiliates.html', label: 'Affiliate Program&#305;' }
    ];

    const ICON_FILTER = 'filter: brightness(0) saturate(100%) invert(86%) sepia(35%) saturate(1419%) hue-rotate(334deg) brightness(101%) contrast(96%);';
    const SOCIAL_STYLE = 'width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; color: #9ca3b8; text-decoration: none; font-size: 16px; transition: all 0.2s;';
    const SOCIAL_EVENTS = 'onmouseover="this.style.background=\'rgba(245,197,24,0.15)\';this.style.borderColor=\'#f5c518\';this.style.color=\'#f5c518\'" onmouseout="this.style.background=\'rgba(255,255,255,0.06)\';this.style.borderColor=\'rgba(255,255,255,0.1)\';this.style.color=\'#9ca3b8\'"';
    const TEXT_LINK_STYLE = 'color: #9ca3b8; font-size: 13px; text-decoration: none; transition: color 0.2s;';
    const TEXT_LINK_EVENTS = 'onmouseover="this.style.color=\'#ffffff\'" onmouseout="this.style.color=\'#9ca3b8\'"';

    function ensureStyles() {
        if (document.getElementById('shared-footer-style')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'shared-footer-style';
        style.textContent = `
            .finance-footer[data-shared-footer="true"] .shared-footer-shell {
                background: linear-gradient(180deg, #0f1419 0%, #0a0d13 50%, #050708 100%);
                border-top: 2px solid transparent;
                border-image: linear-gradient(90deg, #f5c518, #d946ef, #3b82f6) 1;
            }

            .finance-footer[data-shared-footer="true"] .shared-footer-container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 40px 24px 30px;
                display: grid;
                grid-template-columns: minmax(260px, 320px) minmax(0, 1fr);
                gap: 32px;
                align-items: start;
            }

            .finance-footer[data-shared-footer="true"] .shared-footer-brand {
                min-width: 0;
                max-width: 320px;
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                text-align: left;
            }

            .finance-footer[data-shared-footer="true"] .shared-footer-logo {
                margin-bottom: 16px;
            }

            .finance-footer[data-shared-footer="true"] .shared-footer-copy {
                font-size: 12px;
                color: #6b7280;
                line-height: 1.6;
                margin: 0 0 20px;
                max-width: 290px;
            }

            .finance-footer[data-shared-footer="true"] .shared-footer-contact {
                display: flex;
                flex-direction: column;
                gap: 12px;
                margin-bottom: 18px;
                align-items: flex-start;
            }

            .finance-footer[data-shared-footer="true"] .shared-footer-socials {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 10px;
            }

            .finance-footer[data-shared-footer="true"] .shared-footer-links {
                min-width: 0;
                display: grid;
                grid-template-columns: repeat(2, minmax(240px, 1fr));
                gap: 20px;
            }

            .finance-footer[data-shared-footer="true"] .shared-footer-card {
                min-width: 0;
                background: rgba(255,255,255,0.02);
                border: 1px solid rgba(255,255,255,0.05);
                border-radius: 12px;
                padding: 28px;
            }

            .finance-footer[data-shared-footer="true"] .shared-footer-card-title {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 24px;
            }

            .finance-footer[data-shared-footer="true"] .shared-footer-card-title h4 {
                font-size: 15px;
                font-weight: 900;
                color: #ffffff;
                letter-spacing: 0.5px;
                text-transform: uppercase;
                margin: 0;
            }

            .finance-footer[data-shared-footer="true"] .shared-footer-links-list {
                list-style: none;
                padding: 0;
                margin: 0;
                display: flex;
                flex-direction: column;
                gap: 18px;
            }

            .finance-footer[data-shared-footer="true"] .shared-footer-license-bar {
                background: #060910;
                border-top: 1px solid rgba(255,255,255,0.06);
                padding: 18px 24px;
            }

            .finance-footer[data-shared-footer="true"] .shared-footer-license-inner {
                max-width: 1100px;
                margin: 0 auto;
                display: grid;
                grid-template-columns: 84px minmax(0, 1fr);
                align-items: center;
                gap: 18px;
            }

            .finance-footer[data-shared-footer="true"] .shared-footer-license-badge {
                background: #1a6b35;
                border-radius: 8px;
                padding: 8px 14px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-width: 84px;
            }

            .finance-footer[data-shared-footer="true"] .shared-footer-license-text {
                margin: 0;
                min-width: 0;
                font-size: 11px;
                color: #6b7280;
                line-height: 1.7;
            }

            @media (max-width: 1024px) {
                .finance-footer[data-shared-footer="true"] .shared-footer-container {
                    grid-template-columns: 1fr;
                }

                .finance-footer[data-shared-footer="true"] .shared-footer-brand {
                    max-width: 100%;
                }
            }

            @media (max-width: 767px) {
                .finance-footer[data-shared-footer="true"] .shared-footer-container {
                    padding: 28px 18px 22px;
                    gap: 22px;
                }

                .finance-footer[data-shared-footer="true"] .shared-footer-brand {
                    align-items: center;
                    text-align: center;
                }

                .finance-footer[data-shared-footer="true"] .shared-footer-copy {
                    max-width: 100%;
                }

                .finance-footer[data-shared-footer="true"] .shared-footer-contact {
                    align-items: center;
                }

                .finance-footer[data-shared-footer="true"] .shared-footer-socials {
                    justify-content: center;
                }

                .finance-footer[data-shared-footer="true"] .shared-footer-links {
                    grid-template-columns: 1fr;
                }

                .finance-footer[data-shared-footer="true"] .shared-footer-card {
                    padding: 22px;
                }

                .finance-footer[data-shared-footer="true"] .shared-footer-license-bar {
                    padding: 16px 18px 18px;
                }

                .finance-footer[data-shared-footer="true"] .shared-footer-license-inner {
                    grid-template-columns: 1fr;
                    justify-items: center;
                    text-align: center;
                }
            }
        `;

        document.head.appendChild(style);
    }

    function renderPaymentItems() {
        return PAYMENT_ITEMS.map((item) => (
            `<div class="pay-item"><img src="${item.src}" alt="${item.alt}" class="pay-icon" style="height: 32px; object-fit: contain; ${ICON_FILTER}"></div>`
        )).join('');
    }

    function renderProviders() {
        return PROVIDERS.concat(PROVIDERS).map((item) => (
            `<div class="provider-item"><img src="${item.src}" alt="${item.alt}"></div>`
        )).join('');
    }

    function renderLinkList(items) {
        return items.map((item) => (
            `<li><a href="${item.href}" style="${TEXT_LINK_STYLE}" ${TEXT_LINK_EVENTS}>${item.label}</a></li>`
        )).join('');
    }

    function renderSocialLinks() {
        return [
            `<a href="#" aria-label="Facebook" style="${SOCIAL_STYLE}" ${SOCIAL_EVENTS}><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>`,
            `<a href="#" aria-label="Twitter" style="${SOCIAL_STYLE}" ${SOCIAL_EVENTS}><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg></a>`,
            `<a href="#" aria-label="Instagram" style="${SOCIAL_STYLE}" ${SOCIAL_EVENTS}><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg></a>`,
            `<a href="#" aria-label="YouTube" style="${SOCIAL_STYLE}" ${SOCIAL_EVENTS}><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg></a>`,
            `<a href="#" aria-label="Telegram" style="${SOCIAL_STYLE}" ${SOCIAL_EVENTS}><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg></a>`,
            `<div aria-label="18 Plus" style="width: 36px; height: 36px; border-radius: 50%; border: 2px solid #6b7280; display: flex; align-items: center; justify-content: center; cursor: default;"><span style="font-size: 11px; font-weight: 800; color: #6b7280;">18+</span></div>`
        ].join('');
    }

    function footerMarkup() {
        return `
            <div class="payment-row">
                ${renderPaymentItems()}
            </div>
            <div class="providers-section">
                <div class="providers-title">
                    <span>OYUN SA&#286;LAYICILAR</span>
                </div>
                <div class="providers-slider">
                    <div class="providers-track">
                        ${renderProviders()}
                    </div>
                </div>
            </div>
            <div class="shared-footer-shell">
                <div class="shared-footer-container">
                    <div class="shared-footer-brand">
                        <div class="shared-footer-logo">
                            <div style="margin-bottom: 16px;">
                                <img src="logo.png" alt="CLASH BET" class="h-20 xl:h-24 object-contain" style="filter: drop-shadow(0 0 8px rgba(245, 197, 24, 0.4));">
                            </div>
                        </div>
                        <p class="shared-footer-copy">
                            Copyright &copy; 2021-2025 Clashbet Company<br>
                            S.L. All rights reserved.
                        </p>
                        <div class="shared-footer-contact">
                            <a href="mailto:destek@clashbet.com" style="display: flex; align-items: center; gap: 10px; color: #9ca3b8; font-size: 13px; text-decoration: none; transition: color 0.2s;" onmouseover="this.style.color='#f5c518'" onmouseout="this.style.color='#9ca3b8'">
                                <span style="font-size: 16px; color: #ef4444;">&#9993;</span>
                                destek@clashbet.com
                            </a>
                            <a href="contact-us.html" style="display: flex; align-items: center; gap: 10px; color: #9ca3b8; font-size: 13px; text-decoration: none; transition: color 0.2s;" onmouseover="this.style.color='#f5c518'" onmouseout="this.style.color='#9ca3b8'">
                                <span style="font-size: 16px; color: #ef4444;">&#9742;</span>
                                Arama Talep Et
                            </a>
                        </div>
                        <div class="shared-footer-socials">
                            ${renderSocialLinks()}
                        </div>
                    </div>
                    <div class="shared-footer-links">
                        <div class="shared-footer-card">
                            <div class="shared-footer-card-title">
                                <div style="width: 4px; height: 18px; border-radius: 4px; background: linear-gradient(to bottom, #f5c518, #ec4899);"></div>
                                <h4>HUKUK&#304; DOK&#220;MANLAR</h4>
                            </div>
                            <ul class="shared-footer-links-list">
                                ${renderLinkList(LEGAL_LINKS)}
                            </ul>
                        </div>
                        <div class="shared-footer-card">
                            <div class="shared-footer-card-title">
                                <div style="width: 4px; height: 18px; border-radius: 4px; background: linear-gradient(to bottom, #a855f7, #3b82f6);"></div>
                                <h4>B&#304;LG&#304; VE DESTEK</h4>
                            </div>
                            <ul class="shared-footer-links-list">
                                ${renderLinkList(SUPPORT_LINKS)}
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="shared-footer-license-bar">
                    <div class="shared-footer-license-inner">
                        <div class="shared-footer-license-badge">
                            <span style="font-size: 22px; font-weight: 900; color: #fff; letter-spacing: 1.5px; line-height: 1;">CGA</span>
                            <span style="font-size: 9px; font-weight: 600; color: rgba(255,255,255,0.8); margin-top: 3px;">cert-gcb.cv</span>
                        </div>
                        <p class="shared-footer-license-text">
                            <span style="color: #f5c518; font-weight: 700;">Clashbet.com</span> sitesi
                            <span style="color: #d1d5db; font-weight: 600;">Socas International B.V.</span> alt&#305;nda Cura&#231;ao lisans numaras&#305;
                            <span style="color: #d1d5db; font-weight: 600;">GLH-OCCHKTW0708022022</span> ile
                            Dr. M.J. Hugenholtzweg 25, Cura&#231;ao adresinde,
                            <span style="color: #d1d5db; font-weight: 600;">Gaming Services Provider N.V.</span> lisans&#305; ile
                            hizmet vermekte olup, <span style="color: #d1d5db; font-weight: 600;">Government of Cura&#231;ao</span> Lisans otoritesi taraf&#305;ndan kontrol edilmektedir.
                        </p>
                    </div>
                </div>
            </div>
        `;
    }

    function mountSharedFooter() {
        ensureStyles();

        let footer = document.querySelector('footer.finance-footer');

        if (!footer) {
            footer = document.createElement('footer');
            footer.className = 'finance-footer';

            const anchor = document.currentScript;
            if (anchor && anchor.parentNode) {
                anchor.parentNode.insertBefore(footer, anchor);
            } else {
                document.body.appendChild(footer);
            }
        }

        footer.setAttribute('data-shared-footer', 'true');
        footer.innerHTML = footerMarkup();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mountSharedFooter, { once: true });
    } else {
        mountSharedFooter();
    }
})();
