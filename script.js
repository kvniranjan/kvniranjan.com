/* ===================================
   Personal Website - JavaScript
   Enhanced with Three.js 3D and GSAP
   =================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all components
    initNavigation();
    init3DParticles();
    initSmoothScroll();
    initProfileTilt();
});

/* ===================================
   Navigation
   =================================== */
function initNavigation() {
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Scroll effect for navbar
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
    });

    // Mobile menu toggle
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
        document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    });

    // Close menu on link click
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // Active section highlighting
    const sections = document.querySelectorAll('section[id]');
    
    window.addEventListener('scroll', () => {
        const scrollY = window.pageYOffset;
        
        sections.forEach(section => {
            const sectionHeight = section.offsetHeight;
            const sectionTop = section.offsetTop - 100;
            const sectionId = section.getAttribute('id');
            const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
            
            if (navLink) {
                if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                    navLink.classList.add('active');
                } else {
                    navLink.classList.remove('active');
                }
            }
        });
    });
}

/* ===================================
   3D Particle Network (Three.js)
   Replaces 2D canvas particles with 
   depth, mouse parallax, and glow.
   =================================== */
function init3DParticles() {
    const canvas = document.getElementById('network-canvas');
    if (!canvas) return;

    // Check for WebGL support, fall back to 2D
    let gl;
    try {
        gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    } catch (e) { /* ignore */ }

    if (!gl || typeof THREE === 'undefined') {
        // Fallback to 2D canvas particles
        init2DParticlesFallback(canvas);
        return;
    }

    // --- Three.js setup ---
    const heroSection = document.getElementById('hero');
    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 50;

    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: false, // Performance
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // --- Particle system ---
    const particleCount = Math.min(120, Math.floor((width * height) / 12000));
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 100;     // x
        positions[i * 3 + 1] = (Math.random() - 0.5) * 80;  // y
        positions[i * 3 + 2] = (Math.random() - 0.5) * 60;  // z (depth!)

        velocities.push({
            x: (Math.random() - 0.5) * 0.08,
            y: (Math.random() - 0.5) * 0.08,
            z: (Math.random() - 0.5) * 0.04,
        });

        sizes[i] = Math.random() * 2.5 + 1;
    }

    const particleGeom = new THREE.BufferGeometry();
    particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeom.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Custom shader material for glowing particles
    const particleMat = new THREE.ShaderMaterial({
        uniforms: {
            uColor: { value: new THREE.Color(0xf0b429) },
            uTime: { value: 0 },
        },
        vertexShader: `
            attribute float size;
            varying float vAlpha;
            void main() {
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = size * (50.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
                // Depth-based alpha: closer = brighter
                vAlpha = clamp(1.0 - (-mvPosition.z / 80.0), 0.15, 0.9);
            }
        `,
        fragmentShader: `
            uniform vec3 uColor;
            varying float vAlpha;
            void main() {
                // Circular point with soft edge
                float dist = length(gl_PointCoord - vec2(0.5));
                if (dist > 0.5) discard;
                float alpha = smoothstep(0.5, 0.1, dist) * vAlpha;
                gl_FragColor = vec4(uColor, alpha);
            }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeom, particleMat);
    scene.add(particles);

    // --- Connection lines ---
    const lineMaxDist = 18;
    const lineGeom = new THREE.BufferGeometry();
    const maxLines = particleCount * 8; // Max possible connections
    const linePositions = new Float32Array(maxLines * 6); // 2 points * 3 coords
    const lineColors = new Float32Array(maxLines * 6);    // 2 points * 3 color channels
    lineGeom.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeom.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

    const lineMat = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });

    const lines = new THREE.LineSegments(lineGeom, lineMat);
    scene.add(lines);

    // --- Mouse tracking ---
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    document.addEventListener('mousemove', (e) => {
        targetMouseX = (e.clientX / width - 0.5) * 2;
        targetMouseY = (e.clientY / height - 0.5) * 2;
    });

    // --- Animation ---
    let animationId;
    const clock = new THREE.Clock();

    function animate() {
        animationId = requestAnimationFrame(animate);
        const time = clock.getElapsedTime();

        // Smooth mouse tracking
        mouseX += (targetMouseX - mouseX) * 0.05;
        mouseY += (targetMouseY - mouseY) * 0.05;

        // Camera parallax based on mouse
        camera.position.x = mouseX * 5;
        camera.position.y = -mouseY * 3;
        camera.lookAt(0, 0, 0);

        // Update particle positions
        const posArray = particleGeom.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            posArray[i3] += velocities[i].x;
            posArray[i3 + 1] += velocities[i].y;
            posArray[i3 + 2] += velocities[i].z;

            // Wrap around
            if (posArray[i3] > 50) posArray[i3] = -50;
            if (posArray[i3] < -50) posArray[i3] = 50;
            if (posArray[i3 + 1] > 40) posArray[i3 + 1] = -40;
            if (posArray[i3 + 1] < -40) posArray[i3 + 1] = 40;
            if (posArray[i3 + 2] > 30) posArray[i3 + 2] = -30;
            if (posArray[i3 + 2] < -30) posArray[i3 + 2] = 30;
        }
        particleGeom.attributes.position.needsUpdate = true;

        // Update connection lines
        let lineIndex = 0;
        const lp = lineGeom.attributes.position.array;
        const lc = lineGeom.attributes.color.array;
        const accentR = 240 / 255;
        const accentG = 180 / 255;
        const accentB = 41 / 255;

        for (let i = 0; i < particleCount; i++) {
            for (let j = i + 1; j < particleCount; j++) {
                if (lineIndex >= maxLines) break;

                const dx = posArray[i * 3] - posArray[j * 3];
                const dy = posArray[i * 3 + 1] - posArray[j * 3 + 1];
                const dz = posArray[i * 3 + 2] - posArray[j * 3 + 2];
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (dist < lineMaxDist) {
                    const alpha = (1 - dist / lineMaxDist);
                    const li = lineIndex * 6;

                    lp[li] = posArray[i * 3];
                    lp[li + 1] = posArray[i * 3 + 1];
                    lp[li + 2] = posArray[i * 3 + 2];
                    lp[li + 3] = posArray[j * 3];
                    lp[li + 4] = posArray[j * 3 + 1];
                    lp[li + 5] = posArray[j * 3 + 2];

                    lc[li] = accentR * alpha;
                    lc[li + 1] = accentG * alpha;
                    lc[li + 2] = accentB * alpha;
                    lc[li + 3] = accentR * alpha;
                    lc[li + 4] = accentG * alpha;
                    lc[li + 5] = accentB * alpha;

                    lineIndex++;
                }
            }
            if (lineIndex >= maxLines) break;
        }

        // Zero out unused line vertices
        for (let i = lineIndex * 6; i < maxLines * 6; i++) {
            lp[i] = 0;
            lc[i] = 0;
        }

        lineGeom.setDrawRange(0, lineIndex * 2);
        lineGeom.attributes.position.needsUpdate = true;
        lineGeom.attributes.color.needsUpdate = true;

        // Update time uniform
        particleMat.uniforms.uTime.value = time;

        renderer.render(scene, camera);
    }

    animate();

    // --- Resize ---
    window.addEventListener('resize', () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    });

    // --- Pause when not visible ---
    const heroObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (!animationId) animate();
            } else {
                if (animationId) {
                    cancelAnimationFrame(animationId);
                    animationId = null;
                }
            }
        });
    }, { threshold: 0 });

    if (heroSection) {
        heroObserver.observe(heroSection);
    }
}

/* ===================================
   2D Particles Fallback (no WebGL)
   =================================== */
function init2DParticlesFallback(canvas) {
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let animationId;
    let particles = [];
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.radius = Math.random() * 2 + 1;
        }
        
        update() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x < 0) this.x = canvas.width;
            if (this.x > canvas.width) this.x = 0;
            if (this.y < 0) this.y = canvas.height;
            if (this.y > canvas.height) this.y = 0;
        }
        
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(240, 180, 41, 0.5)';
            ctx.fill();
        }
    }
    
    const particleCount = Math.min(50, Math.floor((canvas.width * canvas.height) / 20000));
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
    
    function drawConnections() {
        const maxDistance = 150;
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < maxDistance) {
                    const opacity = (1 - distance / maxDistance) * 0.3;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(240, 180, 41, ${opacity})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        drawConnections();
        animationId = requestAnimationFrame(animate);
    }
    
    animate();
    
    const heroSection = document.getElementById('hero');
    const heroObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (!animationId) animate();
            } else {
                if (animationId) {
                    cancelAnimationFrame(animationId);
                    animationId = null;
                }
            }
        });
    }, { threshold: 0 });
    
    if (heroSection) {
        heroObserver.observe(heroSection);
    }
}

/* ===================================
   3D Profile Image Parallax Tilt
   =================================== */
function initProfileTilt() {
    const heroImage = document.querySelector('.hero-image');
    const imageFrame = document.querySelector('.image-frame');
    if (!heroImage || !imageFrame) return;

    const MAX_TILT = 12; // degrees
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;
    let isHovering = false;

    heroImage.addEventListener('mouseenter', () => {
        isHovering = true;
    });

    heroImage.addEventListener('mousemove', (e) => {
        if (!isHovering) return;
        const rect = heroImage.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        targetX = ((y - centerY) / centerY) * -MAX_TILT;
        targetY = ((x - centerX) / centerX) * MAX_TILT;
    });

    heroImage.addEventListener('mouseleave', () => {
        isHovering = false;
        targetX = 0;
        targetY = 0;
    });

    // Smooth animation loop
    function animateTilt() {
        currentX += (targetX - currentX) * 0.08;
        currentY += (targetY - currentY) * 0.08;

        imageFrame.style.transform = `perspective(800px) rotateX(${currentX}deg) rotateY(${currentY}deg)`;

        requestAnimationFrame(animateTilt);
    }

    animateTilt();
}

/* ===================================
   Smooth Scrolling
   =================================== */
function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            
            if (href === '#') return;
            
            e.preventDefault();
            
            const target = document.querySelector(href);
            
            if (target) {
                const offsetTop = target.offsetTop - 80; // Account for fixed navbar
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/* ===================================
   Utility: Debounce Function
   =================================== */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
