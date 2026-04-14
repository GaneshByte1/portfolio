/* ================================================
   PORTFOLIO — Dreamy Orb Background + Dark Mode + Nav
   ================================================ */

document.addEventListener('DOMContentLoaded', () => {

    // =============================================
    // 1. DARK MODE TOGGLE (localStorage)
    // =============================================
    const html = document.documentElement;
    const themeToggle = document.getElementById('theme-toggle');
    const storedTheme = localStorage.getItem('portfolio-theme');

    if (storedTheme) {
        html.setAttribute('data-theme', storedTheme);
    } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        html.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }

    function getCurrentTheme() {
        return html.getAttribute('data-theme');
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const next = getCurrentTheme() === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', next);
            localStorage.setItem('portfolio-theme', next);
        });
    }


    // =============================================
    // 2. NAVBAR — Auto-hide + Scroll-spy
    // =============================================
    const navbar = document.getElementById('navbar');
    const navLinks = document.querySelectorAll('.navbar__link[data-section]');
    const sections = document.querySelectorAll('.section[id]');
    let lastScrollY = window.scrollY;
    let ticking = false;

    function onScroll() {
        const currentY = window.scrollY;

        if (navbar) {
            if (currentY > lastScrollY && currentY > 100) {
                navbar.classList.add('is-hidden');
            } else {
                navbar.classList.remove('is-hidden');
            }
        }

        let activeId = '';
        sections.forEach((section) => {
            const top = section.offsetTop - 200;
            const bottom = top + section.offsetHeight;
            if (currentY >= top && currentY < bottom) {
                activeId = section.id;
            }
        });

        navLinks.forEach((link) => {
            link.classList.toggle('is-active', link.dataset.section === activeId);
        });

        const backToTop = document.getElementById('back-to-top');
        if (backToTop) {
            backToTop.classList.toggle('is-visible', currentY > 600);
        }

        lastScrollY = currentY;
        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(onScroll);
            ticking = true;
        }
    }, { passive: true });


    // =============================================
    // 3. BACK TO TOP
    // =============================================
    const backToTopBtn = document.getElementById('back-to-top');
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }


    // =============================================
    // 4. HAMBURGER MENU (Mobile)
    // =============================================
    const hamburger = document.getElementById('hamburger');
    const navLinksList = document.getElementById('nav-links');
    const mobileOverlay = document.getElementById('mobile-overlay');

    function closeMobileMenu() {
        hamburger?.classList.remove('is-open');
        navLinksList?.classList.remove('is-open');
        mobileOverlay?.classList.remove('is-visible');
        document.body.style.overflow = '';
    }

    function openMobileMenu() {
        hamburger?.classList.add('is-open');
        navLinksList?.classList.add('is-open');
        mobileOverlay?.classList.add('is-visible');
        document.body.style.overflow = 'hidden';
    }

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.contains('is-open') ? closeMobileMenu() : openMobileMenu();
        });
    }

    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', closeMobileMenu);
    }

    navLinks.forEach((link) => link.addEventListener('click', closeMobileMenu));


    // =============================================
    // 5. SCROLL REVEAL (Intersection Observer)
    // =============================================
    const revealElements = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        root: null,
        rootMargin: '0px 0px -60px 0px',
        threshold: 0.15
    });
    revealElements.forEach((el) => observer.observe(el));


    // =============================================
    // 6. INTERACTIVE CANVAS BACKGROUND (Enhanced)
    // =============================================
    const canvas = document.getElementById('grid-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // --- State ---
    let mouse = { x: 0.5, y: 0.5, px: 0, py: 0 }; // px/py = pixel coords
    let smoothMouse = { x: 0.5, y: 0.5 };
    let animFrame;
    let time = 0;
    let scrollY = 0;
    let smoothScrollY = 0;
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

    // Performance: reduce counts on mobile
    const ORB_COUNT = isMobile ? 4 : 6;
    const PARTICLE_COUNT = isMobile ? 30 : 60;
    const LINE_DISTANCE = isMobile ? 100 : 150; // constellation connection distance
    const MAX_RIPPLES = 5;

    // --- Ripple storage ---
    const ripples = [];

    // --- Get CSS custom property values ---
    function getCSSVar(name) {
        return getComputedStyle(html).getPropertyValue(name).trim();
    }

    // --- Lerp ---
    function lerp(a, b, t) { return a + (b - a) * t; }

    // --- Resize ---
    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width  = window.innerWidth  * dpr;
        canvas.height = window.innerHeight * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    window.addEventListener('resize', resize);
    resize();

    // --- Mouse / Touch tracking ---
    document.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX / window.innerWidth;
        mouse.y = e.clientY / window.innerHeight;
        mouse.px = e.clientX;
        mouse.py = e.clientY;
    });

    document.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            mouse.x = e.touches[0].clientX / window.innerWidth;
            mouse.y = e.touches[0].clientY / window.innerHeight;
            mouse.px = e.touches[0].clientX;
            mouse.py = e.touches[0].clientY;
        }
    }, { passive: true });

    // --- Click/Tap ripple ---
    function addRipple(x, y) {
        if (ripples.length >= MAX_RIPPLES) ripples.shift();
        ripples.push({ x, y, radius: 0, maxRadius: Math.min(window.innerWidth, window.innerHeight) * 0.35, opacity: 0.6, speed: 3.5 });
    }

    document.addEventListener('click', (e) => {
        // Don't trigger on interactive elements
        if (e.target.closest('a, button, iframe, input, textarea, select')) return;
        addRipple(e.clientX, e.clientY);
    });

    document.addEventListener('touchstart', (e) => {
        if (e.target.closest('a, button, iframe, input, textarea, select')) return;
        if (e.touches.length > 0) {
            addRipple(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, { passive: true });

    // --- Device orientation for mobile ---
    if (isMobile && window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', (e) => {
            const beta  = (e.beta  || 0);
            const gamma = (e.gamma || 0);
            mouse.x = Math.min(1, Math.max(0, 0.5 + gamma / 90));
            mouse.y = Math.min(1, Math.max(0, 0.5 + (beta - 45) / 90));
            mouse.px = mouse.x * window.innerWidth;
            mouse.py = mouse.y * window.innerHeight;
        }, { passive: true });
    }

    // --- Scroll tracking ---
    window.addEventListener('scroll', () => {
        scrollY = window.scrollY;
    }, { passive: true });

    // --- Create floating orbs ---
    const orbConfigs = [
        { varName: '--orb1', size: 0.35, speed: 0.0003, offsetX: 0.25, offsetY: 0.3,  parallax: 0.08, scrollFactor: 0.04, phaseX: 0,    phaseY: 0.5 },
        { varName: '--orb2', size: 0.28, speed: 0.0004, offsetX: 0.72, offsetY: 0.2,  parallax: 0.12, scrollFactor: 0.06, phaseX: 1.2,  phaseY: 0.8 },
        { varName: '--orb3', size: 0.22, speed: 0.0005, offsetX: 0.6,  offsetY: 0.65, parallax: 0.06, scrollFactor: 0.03, phaseX: 2.4,  phaseY: 1.6 },
        { varName: '--orb4', size: 0.3,  speed: 0.00035,offsetX: 0.15, offsetY: 0.7,  parallax: 0.1,  scrollFactor: 0.05, phaseX: 3.8,  phaseY: 2.1 },
        { varName: '--orb5', size: 0.18, speed: 0.00045,offsetX: 0.85, offsetY: 0.55, parallax: 0.14, scrollFactor: 0.07, phaseX: 5.0,  phaseY: 3.3 },
        { varName: '--orb1', size: 0.15, speed: 0.0006, offsetX: 0.45, offsetY: 0.85, parallax: 0.09, scrollFactor: 0.04, phaseX: 1.7,  phaseY: 4.2 },
    ];

    // --- Create particles (enhanced with screen positions for constellation) ---
    const particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
            x: Math.random(),
            y: Math.random(),
            size: Math.random() * 2.5 + 0.5,
            baseSpeedX: (Math.random() - 0.5) * 0.0003,
            baseSpeedY: (Math.random() - 0.5) * 0.0003,
            speedX: 0,
            speedY: 0,
            opacity: Math.random() * 0.5 + 0.15,
            phase: Math.random() * Math.PI * 2,
            twinkleSpeed: Math.random() * 0.003 + 0.001,
            parallax: Math.random() * 0.05 + 0.01,
            screenX: 0, // cached screen position for constellation lines
            screenY: 0,
            currentOpacity: 0,
        });
    }

    // --- Draw a soft gradient orb ---
    function drawOrb(cx, cy, radius, rgb, opacity) {
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        grad.addColorStop(0,   `rgba(${rgb}, ${opacity * 0.6})`);
        grad.addColorStop(0.3, `rgba(${rgb}, ${opacity * 0.3})`);
        grad.addColorStop(0.6, `rgba(${rgb}, ${opacity * 0.1})`);
        grad.addColorStop(1,   `rgba(${rgb}, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // --- Draw ripple ring ---
    function drawRipple(ripple) {
        const rgb = getCSSVar('--ripple-color');
        ctx.strokeStyle = `rgba(${rgb}, ${ripple.opacity})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner subtle fill
        if (ripple.opacity > 0.1) {
            ctx.fillStyle = `rgba(${rgb}, ${ripple.opacity * 0.05})`;
            ctx.beginPath();
            ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // --- Draw constellation line ---
    function drawLine(x1, y1, x2, y2, opacity) {
        const rgb = getCSSVar('--line-color');
        ctx.strokeStyle = `rgba(${rgb}, ${opacity})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }

    // --- Main draw loop ---
    function draw() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        time++;

        // Smooth mouse follow
        const lerpSpeed = isMobile ? 0.025 : 0.05;
        smoothMouse.x = lerp(smoothMouse.x, mouse.x, lerpSpeed);
        smoothMouse.y = lerp(smoothMouse.y, mouse.y, lerpSpeed);

        // Smooth scroll follow
        smoothScrollY = lerp(smoothScrollY, scrollY, 0.08);

        // Clear canvas
        ctx.clearRect(0, 0, w, h);

        // --- Draw floating orbs (scroll-reactive) ---
        const orbCount = Math.min(ORB_COUNT, orbConfigs.length);
        const scrollNorm = smoothScrollY / (document.body.scrollHeight - h || 1); // 0..1

        for (let i = 0; i < orbCount; i++) {
            const orb = orbConfigs[i];
            const rgb = getCSSVar(orb.varName);

            // Organic floating motion
            const floatX = Math.sin(time * orb.speed * 6.28 + orb.phaseX) * w * 0.06;
            const floatY = Math.cos(time * orb.speed * 6.28 * 0.7 + orb.phaseY) * h * 0.05;

            // Mouse parallax
            const parallaxX = (smoothMouse.x - 0.5) * w * orb.parallax;
            const parallaxY = (smoothMouse.y - 0.5) * h * orb.parallax;

            // Scroll-reactive drift — orbs shift as you scroll
            const scrollDriftX = Math.sin(scrollNorm * Math.PI * 2 + orb.phaseX) * w * orb.scrollFactor;
            const scrollDriftY = Math.cos(scrollNorm * Math.PI * 3 + orb.phaseY) * h * orb.scrollFactor;

            const cx = orb.offsetX * w + floatX + parallaxX + scrollDriftX;
            const cy = orb.offsetY * h + floatY + parallaxY + scrollDriftY;
            const radius = Math.min(w, h) * orb.size;

            // Breathing opacity with slight scroll modulation
            const breathe = 0.5 + Math.sin(time * 0.008 + i * 1.5) * 0.15 + Math.sin(scrollNorm * Math.PI) * 0.05;

            drawOrb(cx, cy, radius, rgb, breathe * 0.35);
        }

        // --- Draw particles with magnetic cursor effect ---
        const particleRgb = getCSSVar('--particle-color');
        const mousePixelX = smoothMouse.x * w;
        const mousePixelY = smoothMouse.y * h;
        const magnetRadius = isMobile ? 80 : 140;

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];

            // Base drift
            p.speedX = p.baseSpeedX;
            p.speedY = p.baseSpeedY;

            // Calculate screen position
            const rawX = p.x * w + (smoothMouse.x - 0.5) * w * p.parallax;
            const rawY = p.y * h + (smoothMouse.y - 0.5) * h * p.parallax;

            // Magnetic cursor attraction
            const dx = mousePixelX - rawX;
            const dy = mousePixelY - rawY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < magnetRadius && dist > 0) {
                const force = (1 - dist / magnetRadius) * 0.0008;
                p.speedX += (dx / dist) * force;
                p.speedY += (dy / dist) * force;
            }

            // Apply speed
            p.x += p.speedX;
            p.y += p.speedY;

            // Wrap around
            if (p.x < -0.05) p.x = 1.05;
            if (p.x > 1.05) p.x = -0.05;
            if (p.y < -0.05) p.y = 1.05;
            if (p.y > 1.05) p.y = -0.05;

            // Final screen position with parallax
            const px = p.x * w + (smoothMouse.x - 0.5) * w * p.parallax;
            const py = p.y * h + (smoothMouse.y - 0.5) * h * p.parallax;

            p.screenX = px;
            p.screenY = py;

            // Twinkle effect
            const twinkle = Math.sin(time * p.twinkleSpeed + p.phase);
            const opacity = p.opacity * (0.6 + twinkle * 0.4);
            p.currentOpacity = opacity;

            // Draw particle (slightly larger when near cursor)
            const sizeBoost = dist < magnetRadius ? (1 - dist / magnetRadius) * 1.5 : 0;

            if (opacity > 0.05) {
                ctx.fillStyle = `rgba(${particleRgb}, ${opacity})`;
                ctx.beginPath();
                ctx.arc(px, py, p.size + sizeBoost, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // --- Draw constellation lines between nearby particles ---
        if (!isMobile || PARTICLE_COUNT <= 35) {
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const a = particles[i];
                    const b = particles[j];
                    const dx = a.screenX - b.screenX;
                    const dy = a.screenY - b.screenY;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < LINE_DISTANCE) {
                        // Opacity based on distance
                        const lineOpacity = (1 - dist / LINE_DISTANCE) * 0.25 * Math.min(a.currentOpacity, b.currentOpacity);
                        if (lineOpacity > 0.01) {
                            drawLine(a.screenX, a.screenY, b.screenX, b.screenY, lineOpacity);
                        }
                    }
                }

                // Also draw lines from particles to cursor if close enough
                const toCursorDx = particles[i].screenX - mousePixelX;
                const toCursorDy = particles[i].screenY - mousePixelY;
                const toCursorDist = Math.sqrt(toCursorDx * toCursorDx + toCursorDy * toCursorDy);

                if (toCursorDist < LINE_DISTANCE * 1.2) {
                    const cursorLineOpacity = (1 - toCursorDist / (LINE_DISTANCE * 1.2)) * 0.35;
                    if (cursorLineOpacity > 0.01) {
                        drawLine(particles[i].screenX, particles[i].screenY, mousePixelX, mousePixelY, cursorLineOpacity);
                    }
                }
            }
        }

        // --- Draw ripples ---
        for (let i = ripples.length - 1; i >= 0; i--) {
            const r = ripples[i];
            r.radius += r.speed;
            r.opacity -= 0.008;
            r.speed *= 0.99; // slow down over time

            if (r.opacity <= 0 || r.radius > r.maxRadius) {
                ripples.splice(i, 1);
            } else {
                drawRipple(r);
            }
        }

        // --- Cursor proximity glow ---
        const glowCursorRgb = getCSSVar('--glow-cursor');
        const cursorGlowRadius = isMobile ? 120 : 200;
        const cursorGrad = ctx.createRadialGradient(mousePixelX, mousePixelY, 0, mousePixelX, mousePixelY, cursorGlowRadius);
        cursorGrad.addColorStop(0, `rgba(${glowCursorRgb}, 0.12)`);
        cursorGrad.addColorStop(0.4, `rgba(${glowCursorRgb}, 0.05)`);
        cursorGrad.addColorStop(1, `rgba(${glowCursorRgb}, 0)`);
        ctx.fillStyle = cursorGrad;
        ctx.beginPath();
        ctx.arc(mousePixelX, mousePixelY, cursorGlowRadius, 0, Math.PI * 2);
        ctx.fill();

        // --- Subtle center glow (adds depth, scroll-reactive) ---
        const glowX = w * 0.5 + (smoothMouse.x - 0.5) * w * 0.06;
        const glowY = h * (0.4 - scrollNorm * 0.2) + (smoothMouse.y - 0.5) * h * 0.04;
        const glowRgb = getCSSVar('--orb2');
        const glowGrad = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, Math.max(w, h) * 0.45);
        glowGrad.addColorStop(0, `rgba(${glowRgb}, 0.03)`);
        glowGrad.addColorStop(0.5, `rgba(${glowRgb}, 0.01)`);
        glowGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGrad;
        ctx.fillRect(0, 0, w, h);

        animFrame = requestAnimationFrame(draw);
    }

    draw();

    // --- Cleanup on page hide (perf) ---
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(animFrame);
        } else {
            draw();
        }
    });


    // =============================================
    // 7. PARALLAX SCROLL ENGINE
    // =============================================
    const parallaxElements = document.querySelectorAll('[data-parallax]');

    function updateParallax() {
        const scrollTop = window.scrollY;

        parallaxElements.forEach((el) => {
            const speed = parseFloat(el.dataset.speed) || 0.05;
            const rect = el.getBoundingClientRect();
            const centerY = rect.top + rect.height / 2;
            const viewCenter = window.innerHeight / 2;
            const offset = (centerY - viewCenter) * speed;

            el.style.transform = `translateY(${offset}px)`;
        });
    }

    // Use rAF-throttled scroll for parallax
    let parallaxTicking = false;
    window.addEventListener('scroll', () => {
        if (!parallaxTicking) {
            requestAnimationFrame(() => {
                updateParallax();
                parallaxTicking = false;
            });
            parallaxTicking = true;
        }
    }, { passive: true });

    // Initial call
    updateParallax();


    // =============================================
    // 8. STAGGERED CARD REVEAL ON SCROLL
    // =============================================
    const cardElements = document.querySelectorAll('.video-card, .testimonial-card');
    const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Calculate stagger delay based on the element's position among siblings
                const parent = entry.target.parentElement;
                const siblings = Array.from(parent.children);
                const childIndex = siblings.indexOf(entry.target);
                const delay = childIndex * 120 + 50; // Elegant stagger per card

                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0) scale(1)';
                }, delay);

                cardObserver.unobserve(entry.target);
            }
        });
    }, {
        root: null,
        rootMargin: '0px 0px -40px 0px',
        threshold: 0.1
    });

    cardElements.forEach((card) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px) scale(0.95)';
        cardObserver.observe(card);
    });

    // =============================================
    // 9. DYNAMIC COMMENT FORM LOGIC
    // =============================================
    const commentForm = document.getElementById('comment-form');
    const commentInput = document.getElementById('comment-input');
    const commentsContainer = document.getElementById('comments-container');

    if (commentForm && commentInput && commentsContainer) {
        commentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = commentInput.value.trim();
            if (!text) return;

            // Create comment element
            const commentEl = document.createElement('div');
            commentEl.className = 'ui-post-box__comment';

            // Escape HTML to prevent injection
            const safeText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");

            commentEl.innerHTML = `
                <div class="ui-post-box__reply-avatar ui-post-box__reply-avatar--generic">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                </div>
                <div class="ui-post-box__comment-info">
                    <div class="ui-post-box__comment-name">
                        Guest User
                        <span class="ui-post-box__comment-time">• Just now</span>
                    </div>
                    <div class="ui-post-box__comment-text">${safeText}</div>
                </div>
            `;

            // Append at the top
            commentsContainer.prepend(commentEl);

            // Clear input and show feedback
            commentInput.value = '';
            commentInput.placeholder = 'Comment posted! Add another...';
            setTimeout(() => {
                commentInput.placeholder = 'Search, submit a form, or post a comment...';
            }, 3000);
        });
    }
});
