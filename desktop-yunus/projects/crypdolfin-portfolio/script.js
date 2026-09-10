/* ================================================
   CRYPDOLFIN — Interactions Engine v10
   ================================================ */

(function () {
    'use strict';

    // ==========================================
    // MOBILE DETECTION
    // ==========================================
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        || window.matchMedia('(max-width: 768px)').matches;

    // ==========================================
    // HAMBURGER MENU
    // ==========================================
    const hamburgerMenu = document.getElementById('hamburger');
    const mobileNavPills = document.getElementById('navPills');
    
    if (hamburgerMenu && mobileNavPills) {
        hamburgerMenu.addEventListener('click', () => {
            hamburgerMenu.classList.toggle('active');
            mobileNavPills.classList.toggle('mobile-active');
        });
        
        // Close menu when a link is clicked
        const mobileNavLinks = mobileNavPills.querySelectorAll('a');
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburgerMenu.classList.remove('active');
                mobileNavPills.classList.remove('mobile-active');
            });
        });
    }

    // ==========================================
    // 1. CUSTOM CURSOR (Desktop only)
    // ==========================================
    const cursor = document.getElementById('cursor');
    const cursorDot = document.getElementById('cursorDot');

    if (!isMobile) {
        let cx = 0, cy = 0, dx = 0, dy = 0;

        document.addEventListener('mousemove', e => {
            dx = e.clientX;
            dy = e.clientY;
        });

        function animateCursor() {
            cx += (dx - cx) * 0.12;
            cy += (dy - cy) * 0.12;
            if (cursor) {
                cursor.style.left = cx + 'px';
                cursor.style.top = cy + 'px';
            }
            if (cursorDot) {
                cursorDot.style.left = dx + 'px';
                cursorDot.style.top = dy + 'px';
            }
            requestAnimationFrame(animateCursor);
        }
        animateCursor();

        // Hover state for interactive elements
        document.querySelectorAll('a, button, [data-cursor], .service-card, .portfolio-card, .contact-card-item').forEach(el => {
            el.addEventListener('mouseenter', () => cursor && cursor.classList.add('hovering'));
            el.addEventListener('mouseleave', () => cursor && cursor.classList.remove('hovering'));
        });
    }

    // ==========================================
    // 2. SMOOTH SCROLL
    // ==========================================
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const target = document.querySelector(link.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // ==========================================
    // 3. UNIFIED SCROLL HANDLER
    //    (Navbar hide/show + Back to Top + Active nav pill)
    // ==========================================
    const nav = document.getElementById('nav');
    const backToTopBtn = document.getElementById('backToTop');
    const sections = document.querySelectorAll('section[id]');
    const navPills = document.querySelectorAll('.nav-pill:not(.nav-pill--accent)');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const s = window.scrollY;
        
        // Navbar logic
        if (s > 200) {
            nav && nav.classList.toggle('hidden', s > lastScroll);
        } else {
            nav && nav.classList.remove('hidden');
        }
        
        // Back to top logic
        if (backToTopBtn) {
            if (s > 500) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        }

        // Active nav pill
        let current = '';
        sections.forEach(section => {
            const top = section.offsetTop - 150;
            if (s >= top) {
                current = section.getAttribute('id');
            }
        });

        navPills.forEach(pill => {
            pill.classList.remove('nav-pill--active');
            if (pill.getAttribute('href') === '#' + current) {
                pill.classList.add('nav-pill--active');
            }
        });
        
        lastScroll = s;
    }, { passive: true });
    
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ==========================================
    // 4. FLOATING BUBBLES
    // ==========================================
    const bubblesContainer = document.getElementById('bubbles');
    if (bubblesContainer) {
        for (let i = 0; i < 20; i++) {
            const bubble = document.createElement('div');
            bubble.className = 'bubble';
            const size = Math.random() * 30 + 10;
            bubble.style.width = size + 'px';
            bubble.style.height = size + 'px';
            bubble.style.left = Math.random() * 100 + '%';
            bubble.style.animationDuration = (Math.random() * 15 + 10) + 's';
            bubble.style.animationDelay = (Math.random() * 10) + 's';
            bubblesContainer.appendChild(bubble);
        }
    }

    // ==========================================
    // 5. SCROLL REVEAL
    // ==========================================
    const revealTargets = document.querySelectorAll(
        '.service-card, .service-card-v2, .portfolio-card, .pb-card, .contact-card-item, .cta-content, .section-header, .process-step, .testimonial-card'
    );

    revealTargets.forEach(el => el.classList.add('reveal'));

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Stagger the animations slightly
                const siblings = entry.target.parentElement.querySelectorAll('.reveal:not(.visible)');
                let delay = 0;
                siblings.forEach(sib => {
                    if (sib === entry.target || sib.getBoundingClientRect().top < window.innerHeight) {
                        sib.style.transitionDelay = delay + 's';
                        sib.classList.add('visible');
                        delay += 0.08;
                    }
                });
                if (!entry.target.classList.contains('visible')) {
                    entry.target.classList.add('visible');
                }
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.05, rootMargin: '0px 0px -40px 0px' });

    revealTargets.forEach(el => revealObserver.observe(el));

    // ==========================================
    // 6. HERO COUNTER ANIMATION
    // ==========================================
    const counters = document.querySelectorAll('[data-count]');
    let countersAnimated = false;

    function animateCounters() {
        if (countersAnimated) return;
        countersAnimated = true;

        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-count'));
            const duration = 2000;
            const start = performance.now();

            function updateCounter(now) {
                const elapsed = now - start;
                const progress = Math.min(elapsed / duration, 1);
                // Ease-out cubic
                const eased = 1 - Math.pow(1 - progress, 3);
                counter.textContent = Math.round(target * eased);

                if (progress < 1) {
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.textContent = target;
                }
            }

            requestAnimationFrame(updateCounter);
        });
    }

    // Trigger counter animation when hero stats are in view
    const heroStats = document.querySelector('.hero-stats');
    if (heroStats) {
        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounters();
                    statsObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        statsObserver.observe(heroStats);
    }

    // ==========================================
    // 7. HERO ENTRANCE ANIMATION
    // ==========================================
    window.addEventListener('load', () => {
        document.querySelectorAll('.hero-line-text').forEach((el, i) => {
            el.style.transform = 'translateY(110%)';
            el.style.transition = `transform 1.2s ${0.1 + i * 0.15}s cubic-bezier(0.16, 1, 0.3, 1)`;
            requestAnimationFrame(() => {
                el.style.transform = 'translateY(0)';
            });
        });
    });

    // ==========================================
    // 8. SERVICE CARD TILT EFFECT (Desktop only)
    // ==========================================
    if (!isMobile) {
        document.querySelectorAll('[data-tilt]').forEach(card => {
            card.addEventListener('mousemove', e => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = (y - centerY) / centerY * -3;
                const rotateY = (x - centerX) / centerX * 3;
                card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;

                // Set CSS variables for radial gradient glow effects
                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateY(0)';
            });
        });
    }

    // ==========================================
    // 9. PORTFOLIO REVEAL TOGGLE
    // ==========================================
    // Content is always revealed
    document.body.classList.add('content-revealed');

    // Add bento items to scroll reveal
    document.querySelectorAll('.bento-item').forEach(el => {
        el.classList.add('reveal');
        revealObserver.observe(el);
    });

    // ==========================================
    // 10. FAQ ACCORDION LOGIC
    // ==========================================
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const questionBtn = item.querySelector('.faq-question');

        questionBtn.addEventListener('click', () => {
            const isActive = item.classList.contains('active');

            // Close all other open items
            faqItems.forEach(otherItem => {
                otherItem.classList.remove('active');
                const otherAnswer = otherItem.querySelector('.faq-answer');
                if (otherAnswer) {
                    otherAnswer.style.maxHeight = null;
                }
            });

            // Toggle current item
            if (!isActive) {
                item.classList.add('active');
                const answer = item.querySelector('.faq-answer');
                if (answer) {
                    answer.style.maxHeight = answer.scrollHeight + 'px';
                }
            }
        });
    });

    // ==========================================
    // 11. PORTFOLIO MODALS LOGIC
    // ==========================================
    const modalTriggers = document.querySelectorAll('[data-modal]');
    const closeButtons = document.querySelectorAll('.modal-close');
    const overlays = document.querySelectorAll('.modal-overlay');

    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }
    }

    function closeModal() {
        overlays.forEach(overlay => overlay.classList.remove('active'));
        document.body.style.overflow = ''; // Restore background scrolling
    }

    modalTriggers.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const modalId = btn.getAttribute('data-modal');
            openModal(modalId);
        });
    });

    closeButtons.forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    // Close on overlay click
    overlays.forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal();
            }
        });
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });

    // ==========================================
    // 12. COOKIE CONSENT BANNER
    // ==========================================
    const cookieBanner = document.getElementById('cookieBanner');
    const cookieAccept = document.getElementById('cookieAccept');

    if (cookieBanner && cookieAccept) {
        // Check if user already accepted
        if (localStorage.getItem('crypdolfin_cookie_consent') === 'accepted') {
            cookieBanner.classList.add('hidden');
        }

        cookieAccept.addEventListener('click', () => {
            localStorage.setItem('crypdolfin_cookie_consent', 'accepted');
            cookieBanner.classList.add('hidden');
        });
    }

    // ==========================================
    // 13. LIVE DASHBOARD COUNTER ANIMATION
    // ==========================================
    const dashValues = document.querySelectorAll('[data-dash-count]');
    let dashAnimated = false;

    function formatNumber(num) {
        return num.toLocaleString('tr-TR');
    }

    function animateDashCounters() {
        if (dashAnimated) return;
        dashAnimated = true;

        dashValues.forEach(el => {
            const target = parseInt(el.getAttribute('data-dash-count'));
            const prefix = el.getAttribute('data-dash-prefix') || '';
            const suffix = el.getAttribute('data-dash-suffix') || '';
            const duration = 2500;
            const start = performance.now();

            function updateDash(now) {
                const elapsed = now - start;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = Math.round(target * eased);
                el.textContent = prefix + formatNumber(current) + suffix;

                if (progress < 1) {
                    requestAnimationFrame(updateDash);
                } else {
                    el.textContent = prefix + formatNumber(target) + suffix;
                }
            }

            requestAnimationFrame(updateDash);
        });

        // Animate progress bars
        document.querySelectorAll('.dash-bar-fill').forEach(bar => {
            setTimeout(() => bar.classList.add('animated'), 300);
        });
    }

    const dashSection = document.querySelector('.dashboard-section');
    if (dashSection) {
        const dashObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateDashCounters();
                    dashObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });

        dashObserver.observe(dashSection);

        // Add dashboard cards to reveal
        document.querySelectorAll('.dashboard-card').forEach(el => {
            el.classList.add('reveal');
            revealObserver.observe(el);
        });
    }

    // ==========================================
    // 14. ROI CALCULATOR
    // ==========================================
    const roiTraffic = document.getElementById('roiTraffic');
    const roiConversion = document.getElementById('roiConversion');
    const roiAvgSale = document.getElementById('roiAvgSale');
    const roiCurrentEl = document.getElementById('roiCurrentRevenue');
    const roiProjectedEl = document.getElementById('roiProjectedRevenue');
    const roiGrowthEl = document.getElementById('roiGrowthPercent');

    function calculateROI() {
        if (!roiTraffic || !roiConversion || !roiAvgSale) return;

        const traffic = parseFloat(roiTraffic.value) || 0;
        const conversion = parseFloat(roiConversion.value) || 0;
        const avgSale = parseFloat(roiAvgSale.value) || 0;

        // Current revenue
        const currentRevenue = Math.round(traffic * (conversion / 100) * avgSale);
        
        // Projected: CRYPDOLFIN average improvement is 2.3x conversion + 20% traffic boost
        const projectedConversion = conversion * 2.3;
        const projectedTraffic = traffic * 1.2;
        const projectedRevenue = Math.round(projectedTraffic * (projectedConversion / 100) * avgSale);

        // Growth percentage
        const growthPercent = currentRevenue > 0 
            ? Math.round(((projectedRevenue - currentRevenue) / currentRevenue) * 100) 
            : 0;

        // Update UI
        if (roiCurrentEl) roiCurrentEl.textContent = '₺' + formatNumber(currentRevenue);
        if (roiProjectedEl) roiProjectedEl.textContent = '₺' + formatNumber(projectedRevenue);
        if (roiGrowthEl) roiGrowthEl.textContent = '+%' + growthPercent + ' Büyüme';
    }

    // Listen for input changes
    [roiTraffic, roiConversion, roiAvgSale].forEach(input => {
        if (input) {
            input.addEventListener('input', calculateROI);
        }
    });

    // Initial calculation
    calculateROI();

    // ==========================================
    // 15. ANALYTICS EVENT BINDINGS (if Firebase available)
    // ==========================================
    const hasAnalytics = typeof window.crypLogEvent === 'function';

    if (hasAnalytics) {
        const safeLog = (name, params) => {
            try {
                window.crypLogEvent(name, params);
            } catch (e) {
                console.error('Analytics log error', e);
            }
        };

        // Hero CTAs
        const heroPrimary = document.querySelector('.hero-cta-group .btn-primary[href="#services"]');
        const heroSecondary = document.querySelector('.hero-cta-group .btn-ghost[href="#contact"]');

        if (heroPrimary) {
            heroPrimary.addEventListener('click', () => {
                safeLog('cta_click', { location: 'hero', label: 'view_packages' });
            });
        }

        if (heroSecondary) {
            heroSecondary.addEventListener('click', () => {
                safeLog('cta_click', { location: 'hero', label: 'start_now' });
            });
        }

        // WhatsApp FAB
        const fab = document.querySelector('.fab-wrapper[href^="https://wa.me"]');
        if (fab) {
            fab.addEventListener('click', () => {
                safeLog('whatsapp_click', { location: 'fab' });
            });
        }

        // CTA section buttons
        const ctaWhatsApp = document.querySelector('.cta-buttons .btn-primary[href^="https://wa.me"]');
        const ctaTelegram = document.querySelector('.cta-buttons .btn-ghost[href^="https://t.me"]');

        if (ctaWhatsApp) {
            ctaWhatsApp.addEventListener('click', () => {
                safeLog('whatsapp_click', { location: 'cta_section' });
            });
        }

        if (ctaTelegram) {
            ctaTelegram.addEventListener('click', () => {
                safeLog('telegram_click', { location: 'cta_section' });
            });
        }

        // Contact cards
        document.querySelectorAll('.contact-card-item').forEach(card => {
            card.addEventListener('click', () => {
                const href = card.getAttribute('href') || '';
                let channel = 'other';
                if (href.startsWith('mailto:')) channel = 'email';
                else if (href.includes('twitter.com') || href.includes('x.com')) channel = 'x';
                else if (href.includes('t.me')) channel = 'telegram';
                else if (href.includes('instagram.com')) channel = 'instagram';

                safeLog('contact_click', { channel });
            });
        });

        // ROI calculator value changes (coarse-grained)
        if (roiTraffic && roiConversion && roiAvgSale) {
            const roiInputs = [roiTraffic, roiConversion, roiAvgSale];
            let roiTimeout;
            roiInputs.forEach(input => {
                input.addEventListener('change', () => {
                    clearTimeout(roiTimeout);
                    roiTimeout = setTimeout(() => {
                        safeLog('roi_calculated', {
                            traffic: parseFloat(roiTraffic.value) || 0,
                            conversion_percent: parseFloat(roiConversion.value) || 0,
                            avg_sale_try: parseFloat(roiAvgSale.value) || 0
                        });
                    }, 500);
                });
            });
        }
    }

})();
