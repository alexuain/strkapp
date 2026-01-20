// --- 3D SCENE: STABLE PHYSICS ---

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050305, 0.02);

const camera = new THREE.PerspectiveCamera(CONFIG.cam.fov, window.innerWidth/window.innerHeight, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('mainCanvas'), antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputEncoding = THREE.sRGBEncoding;

// --- LIGHTS ---
const ambient = new THREE.AmbientLight(0x404040, 0.8); 
scene.add(ambient);

const keyLight = new THREE.SpotLight(0xffeebb, 1.5); 
keyLight.position.set(5, 10, 15); 
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
scene.add(keyLight);

const rimLight = new THREE.SpotLight(0x4080ff, 1.2);
rimLight.position.set(-8, 5, -5); 
scene.add(rimLight); 

const fillLight = new THREE.PointLight(0x804040, 0.5);
fillLight.position.set(0, -10, 5);
scene.add(fillLight);

// --- MATERIALS ---
const skinMap = (typeof createRealisticSkinTexture === 'function') ? createRealisticSkinTexture() : null;

const realSkinMat = new THREE.MeshPhysicalMaterial({ 
    color: new THREE.Color(0xcfa898),        
    emissive: new THREE.Color(0x330000),     
    emissiveIntensity: 0.0, 
    roughness: 0.45,        
    metalness: 0.0,
    reflectivity: 0.5,
    clearcoat: 0.4,         
    clearcoatRoughness: 0.3,
    bumpMap: skinMap,
    bumpScale: 0.025,
    side: THREE.DoubleSide
});

const ringMat = new THREE.MeshStandardMaterial({ 
    color: 0x111111, roughness: 0.2, metalness: 0.8 
});

// --- GROUPS ---
window.masterRig = new THREE.Group(); 
masterRig.position.y = -3.5; 
scene.add(masterRig);

window.bodyGroup = new THREE.Group(); 
masterRig.add(bodyGroup);

// --- LOAD ---
const loader = new THREE.GLTFLoader();
let penisMesh = null; 

loader.load('penis/scene.gltf', (gltf) => {
    const model = gltf.scene;
    
    model.traverse((o) => {
        if (o.isMesh) {
            o.material = realSkinMat;
            o.castShadow = true; o.receiveShadow = true;
            penisMesh = o;
        }
    });
    
    // SAFE SCALE LOGIC (Защита от деления на 0)
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3(); box.getSize(size);
    
    // Если размер некорректный, ставим дефолт 1.0
    const height = (size.y > 0.1) ? size.y : 1.0; 
    const scale = 7.5 / height; 
    
    model.scale.set(scale, scale, scale);
    
    const center = new THREE.Vector3(); box.getCenter(center);
    model.position.sub(center);
    model.position.y += (height * scale) / 2;

    bodyGroup.add(model);
}, undefined, (e) => {
    // Fallback
    const geo = new THREE.CapsuleGeometry(1.2, 5, 4, 16);
    penisMesh = new THREE.Mesh(geo, realSkinMat);
    bodyGroup.add(penisMesh);
});

window.ringGroup = new THREE.Group(); 
masterRig.add(ringGroup);
const ringMesh = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.25, 32, 64), ringMat);
ringMesh.rotation.x = Math.PI/2; 
ringGroup.add(ringMesh);

// --- VISUALS UPDATE (SAFE MATH) ---
window.updateVisuals = function(arousal, strokeSpeed, time, velocity, ringY) {
    if (!penisMesh) return;

    // 1. SKIN COLOR
    const baseColor = new THREE.Color(0xcfa898);
    const flushedColor = new THREE.Color(0xaa5555); 
    const engorgedColor = new THREE.Color(0x773333); 
    
    let targetColor = baseColor;
    if (arousal > 0.4) targetColor = flushedColor;
    if (arousal > 0.85) targetColor = engorgedColor;

    realSkinMat.color.lerp(targetColor, 0.05);
    realSkinMat.emissiveIntensity = arousal * 0.15; 

    // 2. PULSE
    const bpm = 1.0 + (arousal * 3.0);
    const heartbeat = Math.sin(time * 7 * bpm);
    const throb = (heartbeat > 0.5) ? (heartbeat - 0.5) * 0.08 * Math.max(0, arousal - 0.2) : 0;

    // 3. PHYSICS (Защита от краша)
    // Ограничиваем скорость деформации
    let safeVelocity = Math.max(-0.8, Math.min(0.8, velocity || 0));
    
    let deformation = safeVelocity * 0.15; 
    let firmness = 1.0 - (arousal * 0.5); 
    
    // Защита: scaleY не должен быть <= 0
    let scaleY = 1.0 + (deformation * firmness) + (arousal * 0.1) + throb;
    scaleY = Math.max(0.5, scaleY); 
    
    // Защита: sqrt не должен получать отрицательные числа
    let volumePreserve = 1.0 / Math.sqrt(scaleY);
    let scaleXZ = volumePreserve * (1.0 + arousal * 0.2);
    
    bodyGroup.scale.set(scaleXZ, scaleY, scaleXZ);

    // 4. WOBBLE
    let safeRingY = ringY || 0;
    let leverage = (safeRingY + 3.5) / 7.0; 
    bodyGroup.rotation.x = -safeVelocity * 0.15 * leverage;

    // 5. CAMERA
    if (arousal > 0.95) {
        const shake = 0.04;
        camera.position.x = (Math.random() - 0.5) * shake;
        camera.position.y = CONFIG.cam.height + (Math.random() - 0.5) * shake;
    } else {
        camera.position.x = 0;
        camera.position.y = CONFIG.cam.height;
    }
    camera.lookAt(0, 1, 0);
};