/* ===================================
   GSAP ScrollTrigger Animations
   Cinematic scroll-driven animations
   replacing IntersectionObserver-based
   fade-in/slide-up animations.
   =================================== */

(function () {
    'use strict';

    function initScrollAnimations() {
        // Ensure GSAP and ScrollTrigger are available
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
            console.warn('GSAP or ScrollTrigger not loaded, skipping scroll animations');
            return;
        }

        gsap.registerPlugin(ScrollTrigger);

        // --- Hero Section: Name character reveal ---
        const heroName = document.querySelector('.hero-name');
        if (heroName) {
            // Wrap each letter in a span for animation
            const text = heroName.innerHTML;
            // We'll animate the whole block instead of individual chars for simplicity
            gsap.from('.hero-greeting', {
                opacity: 0,
                y: 30,
                duration: 0.8,
                ease: 'power3.out',
                delay: 0.2,
            });

            gsap.from('.hero-name', {
                opacity: 0,
                y: 50,
                duration: 1,
                ease: 'power3.out',
                delay: 0.4,
            });

            gsap.from('.hero-title', {
                opacity: 0,
                y: 30,
                duration: 0.8,
                ease: 'power3.out',
                delay: 0.7,
            });

            gsap.from('.hero-company', {
                opacity: 0,
                y: 20,
                duration: 0.8,
                ease: 'power3.out',
                delay: 0.9,
            });

            gsap.from('.hero-stats .stat', {
                opacity: 0,
                y: 30,
                scale: 0.8,
                duration: 0.6,
                ease: 'back.out(1.7)',
                stagger: 0.15,
                delay: 1.1,
            });

            gsap.from('.btn-primary', {
                opacity: 0,
                y: 20,
                duration: 0.6,
                ease: 'power3.out',
                delay: 1.5,
            });
        }

        // --- Hero image floating animation ---
        gsap.to('.image-frame', {
            y: -10,
            duration: 3,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
        });

        // --- Section headers: Clip-path reveal ---
        gsap.utils.toArray('.section-header').forEach(header => {
            const tag = header.querySelector('.section-tag');
            const title = header.querySelector('.section-title');

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: header,
                    start: 'top 85%',
                    end: 'bottom 60%',
                    toggleActions: 'play none none none',
                },
            });

            if (tag) {
                tl.from(tag, {
                    opacity: 0,
                    y: 20,
                    duration: 0.6,
                    ease: 'power2.out',
                }, 0);
            }

            if (title) {
                tl.from(title, {
                    opacity: 0,
                    y: 40,
                    clipPath: 'inset(0 0 100% 0)',
                    duration: 0.8,
                    ease: 'power3.out',
                }, 0.2);
            }
        });

        // --- About section ---
        gsap.from('.about-lead', {
            scrollTrigger: {
                trigger: '.about-content',
                start: 'top 80%',
                toggleActions: 'play none none none',
            },
            opacity: 0,
            y: 40,
            duration: 0.8,
            ease: 'power3.out',
        });

        gsap.from('.about-text > p:not(.about-lead)', {
            scrollTrigger: {
                trigger: '.about-content',
                start: 'top 75%',
                toggleActions: 'play none none none',
            },
            opacity: 0,
            y: 30,
            duration: 0.7,
            ease: 'power2.out',
            delay: 0.3,
        });

        gsap.from('.highlight', {
            scrollTrigger: {
                trigger: '.about-highlights',
                start: 'top 85%',
                toggleActions: 'play none none none',
            },
            opacity: 0,
            x: -50,
            duration: 0.6,
            ease: 'power3.out',
            stagger: 0.12,
        });

        gsap.from('.about-card', {
            scrollTrigger: {
                trigger: '.about-card',
                start: 'top 85%',
                toggleActions: 'play none none none',
            },
            opacity: 0,
            x: 50,
            rotateY: 15,
            duration: 0.8,
            ease: 'power3.out',
        });

        // --- Timeline items: Slide in from left ---
        gsap.utils.toArray('.timeline-item').forEach((item, index) => {
            gsap.from(item, {
                scrollTrigger: {
                    trigger: item,
                    start: 'top 85%',
                    toggleActions: 'play none none none',
                },
                opacity: 0,
                x: -60,
                duration: 0.7,
                ease: 'power3.out',
                delay: index * 0.1,
            });
        });

        // --- Skill cards: Staggered scale-up with rotation ---
        gsap.utils.toArray('.skill-category').forEach((card, index) => {
            gsap.from(card, {
                scrollTrigger: {
                    trigger: card,
                    start: 'top 88%',
                    toggleActions: 'play none none none',
                },
                opacity: 0,
                scale: 0.8,
                rotateX: 15,
                y: 40,
                duration: 0.6,
                ease: 'back.out(1.4)',
                delay: index * 0.08,
            });
        });

        // --- Cert cards: Flip-in from 3D rotation ---
        gsap.utils.toArray('.cert-card').forEach((card, index) => {
            gsap.from(card, {
                scrollTrigger: {
                    trigger: card,
                    start: 'top 88%',
                    toggleActions: 'play none none none',
                },
                opacity: 0,
                rotateY: -30,
                x: 30,
                duration: 0.7,
                ease: 'power3.out',
                delay: index * 0.1,
            });
        });

        // --- Endorsement numbers: Animated counter ---
        gsap.utils.toArray('.endorsement-count').forEach(counter => {
            const text = counter.textContent.trim();
            const hasPlus = text.includes('+');
            const num = parseInt(text.replace('+', ''));

            if (!isNaN(num)) {
                const obj = { val: 0 };
                gsap.to(obj, {
                    scrollTrigger: {
                        trigger: counter,
                        start: 'top 90%',
                        toggleActions: 'play none none none',
                    },
                    val: num,
                    duration: 1.5,
                    ease: 'power1.out',
                    onUpdate: () => {
                        counter.textContent = Math.round(obj.val) + (hasPlus ? '+' : '');
                    },
                });
            }
        });

        // --- Stat numbers: Animated counter ---
        gsap.utils.toArray('.stat-number').forEach(counter => {
            const text = counter.textContent.trim();
            const hasPlus = text.includes('+');
            const num = parseInt(text.replace('+', ''));

            if (!isNaN(num)) {
                const obj = { val: 0 };
                gsap.to(obj, {
                    val: num,
                    duration: 2,
                    ease: 'power1.out',
                    delay: 1.2,
                    onUpdate: () => {
                        counter.textContent = Math.round(obj.val) + (hasPlus ? '+' : '');
                    },
                });
            }
        });

        // --- Contact section ---
        gsap.from('.contact-content > *', {
            scrollTrigger: {
                trigger: '.contact-wrapper',
                start: 'top 80%',
                toggleActions: 'play none none none',
            },
            opacity: 0,
            y: 40,
            duration: 0.6,
            ease: 'power3.out',
            stagger: 0.15,
        });

        // --- Parallax backgrounds between sections ---
        gsap.utils.toArray('.section').forEach(section => {
            gsap.to(section, {
                scrollTrigger: {
                    trigger: section,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: 1,
                },
                backgroundPositionY: '30%',
                ease: 'none',
            });
        });

        // --- Footer entrance ---
        gsap.from('.footer-content', {
            scrollTrigger: {
                trigger: '.footer',
                start: 'top 95%',
                toggleActions: 'play none none none',
            },
            opacity: 0,
            y: 20,
            duration: 0.6,
            ease: 'power2.out',
        });

        // --- Endorsement badges ---
        gsap.from('.endorsement', {
            scrollTrigger: {
                trigger: '.endorsements',
                start: 'top 85%',
                toggleActions: 'play none none none',
            },
            opacity: 0,
            scale: 0.5,
            duration: 0.5,
            ease: 'back.out(1.7)',
            stagger: 0.15,
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initScrollAnimations);
    } else {
        initScrollAnimations();
    }
})();
