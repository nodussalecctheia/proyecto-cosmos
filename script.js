/* ==========================================================================
   1. SIMULACIÓN 3D DEL AGUJERO NEGRO (ESTILO GARGANTÚA DE INTERSTELLAR)
   ========================================================================== */
let bhScene, bhCamera, bhRenderer, bhControls;
let mainDisk, verticalRing, particleSystem;

function initBlackHole3D() {
    const container = document.getElementById('blackhole-canvas-container');
    if (!container) return;

    // Limpiar canvas previo si se re-inicializa
    container.innerHTML = '';

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 550;

    // 1. Escena y Cámara (Distancia optimizada para ver el agujero completo de costado)
    bhScene = new THREE.Scene();
    bhCamera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    
    // Posición Cinemática Inicial: Ángulo de costado/izquierda sin exceso de zoom
    bhCamera.position.set(-8.5, 3.2, 8.5);

    // 2. Renderizador WebGL
    bhRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    bhRenderer.setSize(width, height);
    bhRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(bhRenderer.domElement);

    // 3. Controles de Órbita Interactivos
    if (typeof THREE.OrbitControls !== 'undefined') {
        bhControls = new THREE.OrbitControls(bhCamera, bhRenderer.domElement);
        bhControls.enableDamping = true;
        bhControls.dampingFactor = 0.05;
        bhControls.maxDistance = 25;
        bhControls.minDistance = 4;
    }

    // 4. Fondo Estrellado Profundo
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 2500;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++) {
        starPos[i] = (Math.random() - 0.5) * 140;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.12, transparent: true, opacity: 0.8 });
    bhScene.add(new THREE.Points(starsGeo, starsMat));

    // 5. Centro Negro Absoluto (Horizonte de Sucesos)
    const eventHorizonGeo = new THREE.SphereGeometry(1.8, 64, 64);
    const eventHorizonMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const eventHorizon = new THREE.Mesh(eventHorizonGeo, eventHorizonMat);
    bhScene.add(eventHorizon);

    // 6. Halo Fotonico / Anillo de Luz Interno
    const glowGeo = new THREE.SphereGeometry(1.92, 64, 64);
    const glowMat = new THREE.MeshBasicMaterial({
        color: 0xff7700,
        transparent: true,
        opacity: 0.5
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    bhScene.add(glowMesh);

    // 7. Disco de Acreción Principal (Horizontal)
    const diskGeo = new THREE.RingGeometry(2.1, 5.5, 128);
    const diskMat = new THREE.MeshBasicMaterial({
        color: 0xff4500,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85
    });
    mainDisk = new THREE.Mesh(diskGeo, diskMat);
    mainDisk.rotation.x = Math.PI / 2.15;
    bhScene.add(mainDisk);

    // 8. Arco de Lente Gravitacional (Curvado Vertical Estilo Interstellar)
    const vertGeo = new THREE.RingGeometry(2.0, 4.4, 128);
    const vertMat = new THREE.MeshBasicMaterial({
        color: 0xff9900,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.55
    });
    verticalRing = new THREE.Mesh(vertGeo, vertMat);
    bhScene.add(verticalRing);

    // 9. Sistema de Partículas Incandescentes en Rotación Orbital
    const pCount = 1500;
    const pGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(pCount * 3);
    const pAngles = new Float32Array(pCount);
    const pRadii = new Float32Array(pCount);

    for (let i = 0; i < pCount; i++) {
        const r = 2.1 + Math.random() * 3.4;
        const angle = Math.random() * Math.PI * 2;
        pRadii[i] = r;
        pAngles[i] = angle;

        pPositions[i * 3] = Math.cos(angle) * r;
        pPositions[i * 3 + 1] = (Math.random() - 0.5) * 0.18;
        pPositions[i * 3 + 2] = Math.sin(angle) * r;
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    const pMat = new THREE.PointsMaterial({ color: 0xffddaa, size: 0.05, transparent: true, opacity: 0.8 });
    particleSystem = new THREE.Points(pGeo, pMat);
    bhScene.add(particleSystem);

    // Bucle de Animación Continua
    function animate() {
        requestAnimationFrame(animate);

        // Rotación fluida de los discos
        mainDisk.rotation.z -= 0.003;
        verticalRing.rotation.z -= 0.0015;

        // Física Kepleriana de partículas (materia cercana gira más rápido)
        const positions = particleSystem.geometry.attributes.position.array;
        for (let i = 0; i < pCount; i++) {
            pAngles[i] += (0.022 / pRadii[i]);
            positions[i * 3] = Math.cos(pAngles[i]) * pRadii[i];
            positions[i * 3 + 2] = Math.sin(pAngles[i]) * pRadii[i];
        }
        particleSystem.geometry.attributes.position.needsUpdate = true;

        if (bhControls) bhControls.update();
        bhRenderer.render(bhScene, bhCamera);
    }

    animate();
}

/* ==========================================================================
   2. CAMBIO DE ÁNGULOS Y PERSPECTIVAS DE CÁMARA (TRANSICIÓN SUAVE)
   ========================================================================== */
function setCameraView(viewType) {
    if (!bhCamera) return;

    if (viewType === 'perspective') {
        // Vista Lateral / Cinemática de Costado Izquierdo
        smoothCameraMove(-8.5, 3.2, 8.5);
    } else if (viewType === 'top') {
        // Vista Superior / Zenital (Arriba)
        smoothCameraMove(0, 12.0, 0.1);
    } else if (viewType === 'front') {
        // Vista Frontal Directa
        smoothCameraMove(0, 0, 10.5);
    }
}

// Transición animada de la cámara
function smoothCameraMove(targetX, targetY, targetZ) {
    let steps = 25;
    let currentStep = 0;
    let startX = bhCamera.position.x;
    let startY = bhCamera.position.y;
    let startZ = bhCamera.position.z;

    function animateCamera() {
        if (currentStep <= steps) {
            let t = currentStep / steps;
            bhCamera.position.x = startX + (targetX - startX) * t;
            bhCamera.position.y = startY + (targetY - startY) * t;
            bhCamera.position.z = startZ + (targetZ - startZ) * t;
            if (bhControls) bhControls.update();
            currentStep++;
            requestAnimationFrame(animateCamera);
        }
    }
    animateCamera();
}

/* ==========================================================================
   3. SIMULACIÓN 3D DEL SISTEMA SOLAR
   ========================================================================== */
let ssScene, ssCamera, ssRenderer;

function initSolarSystem3D() {
    const container = document.getElementById('solarsystem-canvas-container');
    if (!container) return;

    ssScene = new THREE.Scene();
    ssCamera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    ssCamera.position.set(0, 20, 35);

    ssRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    ssRenderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(ssRenderer.domElement);

    // Sol Central
    const sunGeo = new THREE.SphereGeometry(3, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    const sun = new THREE.Mesh(sunGeo, sunMat);
    ssScene.add(sun);

    // Planetas representativos
    const planets = [
        { name: 'Mercurio', color: 0x888888, dist: 6, speed: 0.04, size: 0.5 },
        { name: 'Venus', color: 0xe3bb76, dist: 9, speed: 0.025, size: 0.8 },
        { name: 'Tierra', color: 0x2233ff, dist: 13, speed: 0.018, size: 0.9 },
        { name: 'Marte', color: 0xff4422, dist: 17, speed: 0.014, size: 0.7 },
        { name: 'Júpiter', color: 0xd4a373, dist: 23, speed: 0.008, size: 1.8 }
    ];

    const planetMeshes = [];

    planets.forEach(p => {
        // Orbita visual
        const orbitGeo = new THREE.RingGeometry(p.dist - 0.05, p.dist + 0.05, 64);
        const orbitMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.15 });
        const orbit = new THREE.Mesh(orbitGeo, orbitMat);
        orbit.rotation.x = Math.PI / 2;
        ssScene.add(orbit);

        // Malla del planeta
        const pGeo = new THREE.SphereGeometry(p.size, 16, 16);
        const pMat = new THREE.MeshBasicMaterial({ color: p.color });
        const mesh = new THREE.Mesh(pGeo, pMat);
        ssScene.add(mesh);

        planetMeshes.push({ mesh, dist: p.dist, speed: p.speed, angle: Math.random() * Math.PI * 2 });
    });

    ssCamera.lookAt(0, 0, 0);

    function animateSS() {
        requestAnimationFrame(animateSS);
        planetMeshes.forEach(p => {
            p.angle += p.speed;
            p.mesh.position.x = Math.cos(p.angle) * p.dist;
            p.mesh.position.z = Math.sin(p.angle) * p.dist;
        });
        ssRenderer.render(ssScene, ssCamera);
    }
    animateSS();
}

/* ==========================================================================
   4. MODAL DE INFORMACIÓN DE PLANETAS
   ========================================================================== */
const planetData = {
    sol: { title: "El Sol", text: "Estrella de tipo espectral G2V en el centro de nuestro sistema solar. Concentra el 99.86% de la masa total del sistema." },
    mercurio: { title: "Mercurio", text: "El planeta más cercano al Sol y el más pequeño del sistema solar. Carece de atmósfera significativa para retener calor." },
    venus: { title: "Venus", text: "Posee una atmósfera densa rica en dióxido de carbono que genera un efecto invernadero descontrolado con temperaturas superiores a 450°C." },
    tierra: { title: "La Tierra", text: "Nuestro hogar, el único cuerpo celeste conocido que alberga vida. Cuenta con agua líquida en superficie y un campo magnético protector." },
    marte: { title: "Marte", text: "El planeta rojo. Posee el volcán más grande del sistema solar (Monte Olimpo) y evidencia de un pasado con agua líquida." },
    jupiter: { title: "Júpiter", text: "El planeta más grande del sistema solar. Un gigante gaseoso con más de 95 lunas confirmadas, incluyendo a Europa y Ganímedes." },
    saturno: { title: "Saturno", text: "Famoso por su complejo y brillante sistema de anillos compuestos de hielo y rocas. Alberga a Titán, una luna con atmósfera densa." },
    urano: { title: "Urano", text: "Gigante helado con un eje de rotación extremadamente inclinado (98 grados), haciendo que prácticamente gire de lado." },
    neptuno: { title: "Neptuno", text: "El planeta más distante del Sol. Posee los vientos más veloces registrados en el sistema solar (hasta 2,100 km/h)." }
};

function openPlanetDetails(key) {
    const data = planetData[key];
    if (!data) return;

    document.getElementById('modalTitle').innerText = data.title;
    document.getElementById('modalBody').innerHTML = `<p>${data.text}</p>`;
    document.getElementById('infoModal').style.display = 'flex';
}

/* ==========================================================================
   5. INICIALIZACIÓN Y EVENTOS GENERALES
   ========================================================================== */
window.addEventListener('DOMContentLoaded', () => {
    initBlackHole3D();
    initSolarSystem3D();

    // Evento para cerrar modal
    const closeModalBtn = document.getElementById('closeModal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            document.getElementById('infoModal').style.display = 'none';
        });
    }

    // Cerrar modal al hacer clic fuera del contenido
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('infoModal');
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
});

// Re-ajustar canvas al redimensionar pantalla
window.addEventListener('resize', () => {
    const container = document.getElementById('blackhole-canvas-container');
    if (container && bhCamera && bhRenderer) {
        bhCamera.aspect = container.clientWidth / container.clientHeight;
        bhCamera.updateProjectionMatrix();
        bhRenderer.setSize(container.clientWidth, container.clientHeight);
    }
});