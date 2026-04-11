/* ===================================
   3D Tilt Effect for Cards
   Applies interactive perspective tilt 
   on mouse hover with a glare effect.
   =================================== */

(function () {
    'use strict';

    const TILT_MAX = 12; // Max tilt in degrees
    const GLARE_OPACITY = 0.15;
    const TRANSITION_SPEED = '400ms';

    function initTilt3D() {
        const cards = document.querySelectorAll('.skill-category, .cert-card');

        cards.forEach(card => {
            // Set up 3D transform context
            card.style.transformStyle = 'preserve-3d';
            card.style.willChange = 'transform';

            // Create glare overlay
            const glare = document.createElement('div');
            glare.classList.add('tilt-glare');
            glare.style.cssText = `
                position: absolute;
                top: 0; left: 0;
                width: 100%;
                height: 100%;
                border-radius: inherit;
                pointer-events: none;
                opacity: 0;
                transition: opacity ${TRANSITION_SPEED} ease;
                z-index: 2;
                background: linear-gradient(
                    135deg,
                    rgba(255, 255, 255, ${GLARE_OPACITY}) 0%,
                    transparent 80%
                );
            `;
            card.style.position = 'relative';
            card.style.overflow = 'hidden';
            card.appendChild(glare);

            // Mouse move handler
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                // Calculate tilt angles
                const rotateX = ((y - centerY) / centerY) * -TILT_MAX;
                const rotateY = ((x - centerX) / centerX) * TILT_MAX;

                // Apply tilt
                card.style.transition = 'transform 100ms ease-out';
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

                // Move glare
                const glareAngle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI) + 90;
                glare.style.background = `linear-gradient(${glareAngle}deg, rgba(240, 180, 41, ${GLARE_OPACITY}) 0%, transparent 80%)`;
                glare.style.opacity = '1';
            });

            // Mouse leave handler
            card.addEventListener('mouseleave', () => {
                card.style.transition = `transform ${TRANSITION_SPEED} ease`;
                card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
                glare.style.opacity = '0';
            });

            // Mouse enter handler
            card.addEventListener('mouseenter', () => {
                card.style.transition = `transform ${TRANSITION_SPEED} ease`;
            });
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTilt3D);
    } else {
        initTilt3D();
    }
})();
