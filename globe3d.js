/* ===================================
   Interactive 3D Globe - Contact Section
   Three.js wireframe globe with location pins
   showing countries where user has worked.
   =================================== */

(function () {
    'use strict';

    // Country pin data: [lat, lon, name]
    const LOCATIONS = [
        { lat: 20.5937, lon: 78.9629, name: 'India', size: 1.2 },
        { lat: 37.0902, lon: -95.7129, name: 'USA', size: 1.2 },
        { lat: -14.2350, lon: -51.9253, name: 'Brazil', size: 1.0 },
        { lat: -38.4161, lon: -63.6167, name: 'Argentina', size: 0.8 },
        { lat: 4.5709, lon: -74.2973, name: 'Colombia', size: 0.8 },
        { lat: -9.1900, lon: -75.0152, name: 'Peru', size: 0.8 },
        { lat: 23.6345, lon: -102.5528, name: 'Mexico', size: 0.8 },
        { lat: 35.9078, lon: 127.7669, name: 'South Korea', size: 0.8 },
        { lat: 39.0742, lon: 21.8243, name: 'Greece', size: 0.8 },
        { lat: 51.5074, lon: -0.1278, name: 'UK', size: 0.8 },
    ];

    const ACCENT_COLOR = 0xf0b429;
    const ACCENT_COLOR_CSS = '#f0b429';
    const GLOBE_RADIUS = 2.2;

    function latLonToVector3(lat, lon, radius) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);
        const x = -(radius * Math.sin(phi) * Math.cos(theta));
        const z = radius * Math.sin(phi) * Math.sin(theta);
        const y = radius * Math.cos(phi);
        return new THREE.Vector3(x, y, z);
    }

    function createGlobe(canvas) {
        const scene = new THREE.Scene();

        // Responsive sizing
        const container = canvas.parentElement;
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Camera
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        camera.position.z = 6.5;

        // Renderer
        const renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            alpha: true,
            antialias: true,
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Globe group (for rotation)
        const globeGroup = new THREE.Group();
        scene.add(globeGroup);

        // --- Wireframe sphere ---
        const sphereGeom = new THREE.SphereGeometry(GLOBE_RADIUS, 36, 24);
        const wireframe = new THREE.WireframeGeometry(sphereGeom);
        const wireMat = new THREE.LineBasicMaterial({
            color: ACCENT_COLOR,
            transparent: true,
            opacity: 0.12,
        });
        const sphere = new THREE.LineSegments(wireframe, wireMat);
        globeGroup.add(sphere);

        // --- Equator ring ---
        const equatorGeom = new THREE.RingGeometry(GLOBE_RADIUS + 0.01, GLOBE_RADIUS + 0.03, 128);
        const equatorMat = new THREE.MeshBasicMaterial({
            color: ACCENT_COLOR,
            transparent: true,
            opacity: 0.25,
            side: THREE.DoubleSide,
        });
        const equator = new THREE.Mesh(equatorGeom, equatorMat);
        equator.rotation.x = Math.PI / 2;
        globeGroup.add(equator);

        // --- Latitude rings ---
        [30, -30, 60, -60].forEach(lat => {
            const r = GLOBE_RADIUS * Math.cos(lat * Math.PI / 180);
            const y = GLOBE_RADIUS * Math.sin(lat * Math.PI / 180);
            const ringGeom = new THREE.RingGeometry(r - 0.01, r + 0.01, 64);
            const ringMat = new THREE.MeshBasicMaterial({
                color: ACCENT_COLOR,
                transparent: true,
                opacity: 0.08,
                side: THREE.DoubleSide,
            });
            const ring = new THREE.Mesh(ringGeom, ringMat);
            ring.position.y = y;
            ring.rotation.x = Math.PI / 2;
            globeGroup.add(ring);
        });

        // --- Atmospheric glow ---
        const glowGeom = new THREE.SphereGeometry(GLOBE_RADIUS + 0.15, 32, 32);
        const glowMat = new THREE.ShaderMaterial({
            uniforms: {
                glowColor: { value: new THREE.Color(ACCENT_COLOR) },
                viewVector: { value: camera.position },
            },
            vertexShader: `
                uniform vec3 viewVector;
                varying float intensity;
                void main() {
                    vec3 vNormal = normalize(normalMatrix * normal);
                    vec3 vNormel = normalize(normalMatrix * viewVector);
                    intensity = pow(0.65 - dot(vNormal, vNormel), 3.0);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 glowColor;
                varying float intensity;
                void main() {
                    vec3 glow = glowColor * intensity;
                    gl_FragColor = vec4(glow, intensity * 0.4);
                }
            `,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true,
        });
        const glowMesh = new THREE.Mesh(glowGeom, glowMat);
        globeGroup.add(glowMesh);

        // --- Location pins ---
        const pinMeshes = [];
        const tooltipData = [];

        LOCATIONS.forEach(loc => {
            const pos = latLonToVector3(loc.lat, loc.lon, GLOBE_RADIUS);

            // Pin sphere
            const pinGeom = new THREE.SphereGeometry(0.04 * loc.size, 12, 12);
            const pinMat = new THREE.MeshBasicMaterial({
                color: ACCENT_COLOR,
                transparent: true,
                opacity: 0.9,
            });
            const pin = new THREE.Mesh(pinGeom, pinMat);
            pin.position.copy(pos);
            pin.userData = { name: loc.name };
            globeGroup.add(pin);
            pinMeshes.push(pin);

            // Pin glow ring
            const glowRingGeom = new THREE.RingGeometry(0.06 * loc.size, 0.1 * loc.size, 24);
            const glowRingMat = new THREE.MeshBasicMaterial({
                color: ACCENT_COLOR,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide,
            });
            const glowRing = new THREE.Mesh(glowRingGeom, glowRingMat);
            glowRing.position.copy(pos);
            glowRing.lookAt(0, 0, 0);
            globeGroup.add(glowRing);

            // Pin pulse (animated ring)
            const pulseGeom = new THREE.RingGeometry(0.08 * loc.size, 0.14 * loc.size, 24);
            const pulseMat = new THREE.MeshBasicMaterial({
                color: ACCENT_COLOR,
                transparent: true,
                opacity: 0.0,
                side: THREE.DoubleSide,
            });
            const pulse = new THREE.Mesh(pulseGeom, pulseMat);
            pulse.position.copy(pos);
            pulse.lookAt(0, 0, 0);
            pulse.userData.phase = Math.random() * Math.PI * 2;
            globeGroup.add(pulse);

            tooltipData.push({ mesh: pin, pulse, pulseMat, name: loc.name });
        });

        // --- Tooltip element ---
        const tooltip = document.createElement('div');
        tooltip.classList.add('globe-tooltip');
        tooltip.style.cssText = `
            position: absolute;
            padding: 6px 14px;
            background: rgba(10, 25, 47, 0.9);
            border: 1px solid ${ACCENT_COLOR_CSS};
            border-radius: 6px;
            color: ${ACCENT_COLOR_CSS};
            font-family: 'Source Sans 3', sans-serif;
            font-size: 0.8rem;
            font-weight: 600;
            letter-spacing: 1px;
            text-transform: uppercase;
            pointer-events: none;
            opacity: 0;
            transition: opacity 200ms ease;
            z-index: 10;
            white-space: nowrap;
            box-shadow: 0 0 14px rgba(240, 180, 41, 0.2);
        `;
        container.style.position = 'relative';
        container.appendChild(tooltip);

        // --- Mouse interaction ---
        let isDragging = false;
        let previousMouse = { x: 0, y: 0 };
        let rotationVelocity = { x: 0, y: 0 };
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            previousMouse.x = e.clientX;
            previousMouse.y = e.clientY;
            rotationVelocity = { x: 0, y: 0 };
        });

        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

            if (isDragging) {
                const deltaX = e.clientX - previousMouse.x;
                const deltaY = e.clientY - previousMouse.y;
                rotationVelocity.x = deltaY * 0.003;
                rotationVelocity.y = deltaX * 0.003;
                previousMouse.x = e.clientX;
                previousMouse.y = e.clientY;
            }

            // Raycast for tooltip
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(pinMeshes);
            if (intersects.length > 0) {
                const hit = intersects[0].object;
                tooltip.textContent = hit.userData.name;
                tooltip.style.opacity = '1';
                // position tooltip near cursor
                tooltip.style.left = (e.clientX - rect.left + 15) + 'px';
                tooltip.style.top = (e.clientY - rect.top - 10) + 'px';
                canvas.style.cursor = 'pointer';
            } else {
                tooltip.style.opacity = '0';
                canvas.style.cursor = isDragging ? 'grabbing' : 'grab';
            }
        });

        canvas.addEventListener('mouseup', () => {
            isDragging = false;
        });

        canvas.addEventListener('mouseleave', () => {
            isDragging = false;
            tooltip.style.opacity = '0';
        });

        canvas.style.cursor = 'grab';

        // --- Animation loop ---
        const clock = new THREE.Clock();
        let animationId;

        function animate() {
            animationId = requestAnimationFrame(animate);
            const elapsed = clock.getElapsedTime();

            // Auto rotation (slow)
            if (!isDragging) {
                globeGroup.rotation.y += 0.003;
                // Apply velocity damping
                globeGroup.rotation.x += rotationVelocity.x;
                globeGroup.rotation.y += rotationVelocity.y;
                rotationVelocity.x *= 0.95;
                rotationVelocity.y *= 0.95;
            } else {
                globeGroup.rotation.x += rotationVelocity.x;
                globeGroup.rotation.y += rotationVelocity.y;
            }

            // Animate pin pulses
            tooltipData.forEach(data => {
                const pulseFactor = (Math.sin(elapsed * 2 + data.pulse.userData.phase) + 1) / 2;
                data.pulseMat.opacity = pulseFactor * 0.4;
                const scale = 1 + pulseFactor * 0.8;
                data.pulse.scale.set(scale, scale, scale);
            });

            renderer.render(scene, camera);
        }

        // --- Resize handler ---
        function onResize() {
            const w = container.clientWidth;
            const h = container.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        }
        window.addEventListener('resize', onResize);

        // --- Lazy loading: only start when visible ---
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animate();
                    observer.disconnect();
                } else {
                    if (animationId) {
                        cancelAnimationFrame(animationId);
                        animationId = null;
                    }
                }
            });
        }, { threshold: 0.1 });

        observer.observe(canvas);

        // Cleanup function
        return function cleanup() {
            if (animationId) cancelAnimationFrame(animationId);
            window.removeEventListener('resize', onResize);
            renderer.dispose();
        };
    }

    // Initialize when DOM is ready
    function init() {
        // Check for WebGL support
        try {
            const testCanvas = document.createElement('canvas');
            const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
            if (!gl) throw new Error('No WebGL');
        } catch (e) {
            console.warn('WebGL not supported, keeping CSS globe fallback');
            return;
        }

        const canvas = document.getElementById('globe-canvas');
        if (!canvas) return;

        // Wait for Three.js to load
        if (typeof THREE === 'undefined') {
            console.warn('Three.js not loaded, skipping 3D globe');
            return;
        }

        createGlobe(canvas);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // Slight delay to ensure Three.js CDN is loaded
        setTimeout(init, 100);
    }
})();
