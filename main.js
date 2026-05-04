const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('magic-canvas');
const canvasCtx = canvasElement.getContext('2d');
const startBtn = document.getElementById('start-btn');

let particles = [];

class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y;
        this.size = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 8;
        this.speedY = (Math.random() - 0.5) * 8;
        this.color = color;
        this.life = 1; // 100% de vida
    }
    update() {
        this.x += this.speedX; this.y += this.speedY;
        this.life -= 0.02; // Se desvanece
    }
    draw() {
        canvasCtx.globalAlpha = this.life;
        canvasCtx.fillStyle = this.color;
        canvasCtx.beginPath();
        canvasCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        canvasCtx.fill();
    }
}

function onResults(results) {
    canvasElement.width = window.innerWidth;
    canvasElement.height = window.innerHeight;
    
    // Efecto de rastro (motion blur)
    canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);

    if (results.multiHandLandmarks) {
        results.multiHandLandmarks.forEach((landmarks, index) => {
            const isLeft = results.multiHandedness[index].label === "Left";
            const color = isLeft ? '#00f2ff' : '#ff00ff';
            
            // Detectar dedos arriba
            const up = {
                index: landmarks[8].y < landmarks[6].y,
                middle: landmarks[12].y < landmarks[10].y,
                ring: landmarks[16].y < landmarks[14].y,
                pinky: landmarks[20].y < landmarks[18].y,
                thumb: Math.abs(landmarks[4].x - landmarks[2].x) > 0.05
            };

            const upCount = Object.values(up).filter(Boolean).length;
            const palmX = (1 - landmarks[9].x) * canvasElement.width;
            const palmY = landmarks[9].y * canvasElement.height;

            // --- LÓGICA DE ANIMACIONES SORPRENDENTES ---

            // GESTO 1: PUÑO (Singularidad)
            if (upCount === 0) {
                drawSingularity(palmX, palmY, color);
            } 
            // GESTO 2: SEÑAL DE PAZ (Arcos Eléctricos)
            else if (upCount === 2 && up.index && up.middle) {
                drawElectricArc(landmarks, color);
            }
            // GESTO 3: SPIDERMAN (Supernova)
            else if (upCount === 2 && up.index && up.pinky) {
                createSupernova(palmX, palmY, color);
            }
            // GESTO 4: PALMA ABIERTA (Flujo Estelar)
            else {
                createFlow(landmarks, color);
            }
        });
    }

    // Dibujar y limpiar partículas
    particles.forEach((p, i) => {
        p.update(); p.draw();
        if (p.life <= 0) particles.splice(i, 1);
    });
}

// --- EFECTOS VISUALES ---

function drawSingularity(x, y, color) {
    canvasCtx.shadowBlur = 30;
    canvasCtx.shadowColor = color;
    canvasCtx.strokeStyle = color;
    canvasCtx.lineWidth = 2;
    canvasCtx.beginPath();
    canvasCtx.arc(x, y, Math.random() * 40, 0, Math.PI * 2);
    canvasCtx.stroke();
    canvasCtx.shadowBlur = 0;
    
    // Succiona partículas
    for(let i=0; i<3; i++) particles.push(new Particle(x + (Math.random()-0.5)*200, y + (Math.random()-0.5)*200, color));
}

function drawElectricArc(lm, color) {
    const x1 = (1 - lm[8].x) * canvasElement.width;
    const y1 = lm[8].y * canvasElement.height;
    const x2 = (1 - lm[12].x) * canvasElement.width;
    const y2 = lm[12].y * canvasElement.height;
    
    canvasCtx.strokeStyle = 'white';
    canvasCtx.lineWidth = 3;
    canvasCtx.beginPath();
    canvasCtx.moveTo(x1, y1);
    // Rayo zig-zag
    for(let i=0; i<5; i++) {
        canvasCtx.lineTo(x1 + (x2-x1)*i/5 + (Math.random()-0.5)*20, y1 + (y2-y1)*i/5 + (Math.random()-0.5)*20);
    }
    canvasCtx.lineTo(x2, y2);
    canvasCtx.stroke();
    for(let i=0; i<5; i++) particles.push(new Particle(x1, y1, color), new Particle(x2, y2, color));
}

function createSupernova(x, y, color) {
    for(let i=0; i<10; i++) {
        let p = new Particle(x, y, color);
        p.speedX *= 2; p.speedY *= 2;
        particles.push(p);
    }
}

function createFlow(lm, color) {
    [8, 12, 16, 20, 4].forEach(pt => {
        const x = (1 - lm[pt].x) * canvasElement.width;
        const y = lm[pt].y * canvasElement.height;
        particles.push(new Particle(x, y, color));
    });
}

// --- CONFIGURACIÓN ---
const hands = new Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
hands.setOptions({ maxNumHands: 2, modelComplexity: 0, minDetectionConfidence: 0.7 });
hands.onResults(onResults);

const camera = new Camera(videoElement, {
    onFrame: async () => { await hands.send({ image: videoElement }); },
    width: 640, height: 480
});

startBtn.addEventListener('click', () => {
    document.getElementById('ui').style.display = 'none';
    camera.start();
});