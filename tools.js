// --- TOOLS: TEXTURES & GEOMETRY GENERATORS ---

// Вспомогательные векторы для математики (оптимизация памяти)
const _up = new THREE.Vector3(0, 0, 1);
const _tan = new THREE.Vector3();
const _binorm = new THREE.Vector3();
const _norm = new THREE.Vector3();
const _pt = new THREE.Vector3();
const _tempX = new THREE.Vector3(1, 0, 0);

/**
 * 1. Генератор реалистичной текстуры кожи (Noise + Veins + Pores)
 * Создает CanvasTexture для использования в bumpMap или map.
 */
function createRealisticSkinTexture() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size; 
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // А. Базовый шум (неоднородность цвета)
    const imgData = ctx.createImageData(size, size);
    for (let i = 0; i < imgData.data.length; i += 4) {
        // Генерируем шум для R, G, B каналов
        const noise = (Math.random() - 0.5) * 15;
        imgData.data[i] = 180 + noise;     // R
        imgData.data[i+1] = 120 + noise;   // G
        imgData.data[i+2] = 100 + noise;   // B
        imgData.data[i+3] = 255;           // Alpha
    }
    ctx.putImageData(imgData, 0, 0);

    // Б. Подкожные вены (размытые линии)
    ctx.globalAlpha = 0.08; 
    ctx.filter = 'blur(6px)'; 
    ctx.strokeStyle = 'rgba(80, 40, 60, 0.5)'; 
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    
    for(let i=0; i<8; i++) {
        ctx.beginPath(); 
        let x = Math.random() * size; 
        let y = size; 
        ctx.moveTo(x, y);
        
        // Рисуем извилистые кривые Безье снизу вверх
        const controlX1 = x + (Math.random()-0.5) * 200;
        const controlX2 = x + (Math.random()-0.5) * 200;
        const endX = Math.random() * size;
        
        ctx.bezierCurveTo(controlX1, y - size/3, controlX2, y - size*0.6, endX, 0);
        ctx.stroke();
    }
    
    // В. Микро-детали (поры/неровности)
    ctx.globalAlpha = 0.04;
    ctx.filter = 'none';
    ctx.fillStyle = '#402020';
    for(let i=0; i<800; i++) {
        ctx.beginPath();
        // Случайные точки разного размера
        const r = Math.random() * 1.5;
        ctx.arc(Math.random()*size, Math.random()*size, r, 0, Math.PI*2);
        ctx.fill();
    }
    
    return new THREE.CanvasTexture(canvas);
}

/**
 * 2. Генератор текстуры для частиц (Мягкий круг)
 * Используется для спрайтов (жидкость, искры), чтобы убрать квадратные края.
 */
function createSoftParticleTexture() {
    const size = 32;
    const canvas = document.createElement('canvas');
    canvas.width = size; 
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Радиальный градиент: Белый центр -> Прозрачные края
    const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2); 
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)'); 
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = grad; 
    ctx.fillRect(0, 0, size, size); 
    
    return new THREE.CanvasTexture(canvas);
}

/**
 * 3. Процедурный генератор органической формы
 * Используется как FALLBACK, если GLTF модель не загрузилась.
 * Создает геометрию на основе кривой (curve) с переменным радиусом.
 */
function createAnatomicalMesh(curve, segments, radialSegments) {
    const geometry = new THREE.BufferGeometry();
    const vertices = []; 
    const indices = []; 
    const uvs = [];

    for (let i = 0; i <= segments; i++) {
        const t = i / segments; // Прогресс от 0.0 до 1.0 вдоль кривой
        
        // Получаем точку на кривой и касательную для ориентации кольца
        curve.getPoint(t, _pt);
        curve.getTangent(t, _tan).normalize();
        
        // Вычисляем нормаль и бинормаль (система координат кольца)
        _norm.crossVectors(_tan, _up);
        if (_norm.lengthSq() < 0.0001) _norm.crossVectors(_tan, _tempX);
        _norm.normalize();
        _binorm.crossVectors(_tan, _norm).normalize();

        // === МАТЕМАТИКА ФОРМЫ ===
        let radius = 1.0; 
        
        if (t < 0.82) {
            // СТВОЛ (Shaft)
            // t=0 (низ), t=0.82 (начало головки)
            const baseShape = 1.0 - Math.pow(t, 2) * 0.1; // Легкое сужение к верху
            const bump = Math.sin(t * 15) * 0.02; // Небольшая неровность
            radius = 1.1 * baseShape + bump;
        } else {
            // ГОЛОВКА (Head)
            const glansT = (t - 0.82) / 0.18; // Нормализуем участок 0.82-1.0 в 0.0-1.0
            
            if (glansT < 0.25) {
                // Венец (Crown) - расширение
                radius = 1.05 + (glansT / 0.25) * 0.35; 
            } else {
                // Купол - закругление
                const shape = Math.max(0, 1 - Math.pow((glansT - 0.25)/0.75, 2.5));
                radius = 1.45 * Math.sqrt(shape); 
            }
        }

        // Генерация кольца вершин
        for (let j = 0; j <= radialSegments; j++) {
            const v = j / radialSegments; 
            const theta = v * Math.PI * 2;
            const cos = Math.cos(theta); 
            const sin = Math.sin(theta);
            
            let rMod = 1.0; 
            
            // Добавляем детализацию формы (не идеальный круг)
            
            // 1. Уретральный канал снизу (Corpus spongiosum)
            if (sin < -0.2 && t < 0.82) {
                rMod += 0.12 * Math.pow(Math.sin((sin + 0.2) * Math.PI), 2);
            }
            
            // 2. Сплющивание (овальное сечение)
            const ovalX = 1.05; // Чуть шире
            const ovalZ = 0.95; // Чуть уже

            // Расчет координат вершины
            const px = _pt.x + (_norm.x * cos * ovalX + _binorm.x * sin * ovalZ) * radius * rMod;
            const py = _pt.y + (_norm.y * cos * ovalX + _binorm.y * sin * ovalZ) * radius * rMod;
            const pz = _pt.z + (_norm.z * cos * ovalX + _binorm.z * sin * ovalZ) * radius * rMod;

            vertices.push(px, py, pz);
            uvs.push(t, v);
        }
    }

    // Генерация полигонов (индексов)
    for (let i = 0; i < segments; i++) {
        for (let j = 0; j < radialSegments; j++) {
            const a = i * (radialSegments + 1) + j; 
            const b = (i + 1) * (radialSegments + 1) + j;
            const c = (i + 1) * (radialSegments + 1) + (j + 1); 
            const d = i * (radialSegments + 1) + (j + 1);
            
            // Два треугольника на грань
            indices.push(a, b, d); 
            indices.push(b, c, d);
        }
    }
    
    // Сборка геометрии
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices); 
    geometry.computeVertexNormals(); // Важно для освещения!
    
    return geometry;
}