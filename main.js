const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('magic-canvas');
const canvasCtx = canvasElement.getContext('2d');
const startBtn = document.getElementById('start-btn');

let stars = [];

class GalaxyStar {
    constructor(x, y, color, armAngle) {
        this.originX = x;
        this.originY = y;
        this.armAngle = armAngle; // El "brazo" al que pertenece (0, 120 o 240 grados)
        this.distance = 0;
        this.angle = 0;
        this.size = Math.random() * 3 + 2;
        this.color = color;
        this.life = 1.0;
        this.rotationSpeed = Math.random() * 0.05 + 0.02;
    }
    update() {
        this.distance += 3; // Qué tan rápido se expande la galaxia
        this.angle += this.rotationSpeed; // Qué tan rápido gira
        
        // Matemáticas de espiral: Coordenadas Polares -> Cartesianas
        this.x = this.originX + Math.cos(this.angle + this.armAngle) * this.distance;
        this.y = this.originY + Math.sin(this.angle + this.armAngle) * this.distance;
        
        this.life -= 0.015; // Tiempo que dura la estrella en pantalla
    }
    draw() {
        canvasCtx.globalAlpha = this.life;
        canvasCtx.fillStyle = this.color;
        // Efecto de resplandor (Glow)
        canvasCtx.shadowBlur = 15;
        canvasCtx.shadowColor = this.color;
        
        canvasCtx.beginPath();
        canvasCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        canvasCtx.fill();
        canvasCtx.shadowBlur = 0;
    }
}

function onResults(results) {
    canvasElement.width = window.innerWidth;
    canvasElement.height = window.innerHeight;
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    if (results.multiHandLandmarks) {
        results.multiHandLandmarks.forEach((landmarks, index) => {
            const isLeft = results.multiHandedness[index].label === "Left";
            const color = isLeft ? '#00f2ff' : '#ff00ff';
            
            // Centro de la palma
            const px = (1 - landmarks[9].x) * canvasElement.width;
            const py = landmarks[9].y * canvasElement.height;

            // Detectar si la mano está abierta (más de 0.2 de distancia entre muñeca y dedo)
            const isOpen = Math.abs(landmarks[8].y - landmarks[0].y) > 0.2;

            if (isOpen) {
                // Creamos estrellas en 3 brazos distintos para formar la galaxia
                for (let arm = 0; arm < 3; arm++) {
                    const armOffset = (Math.PI * 2 / 3) * arm;
                    stars.push(new GalaxyStar(px, py, color, armOffset));
                }
            }
        });
    }

    // Dibujar y actualizar todas las estrellas
    stars.forEach((s, i) => {
        s.update();
        s.draw();
        if (s.life <= 0) stars.splice(i, 1);
    });
}

// Configuración de la IA (MediaPipe)
const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 0, // Optimizado para tu Samsung A55
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});
hands.onResults(onResults);

const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({ image: videoElement });
    },
    width: 640,
    height: 480
});

startBtn.addEventListener('click', () => {
    document.getElementById('ui').style.display = 'none';
    camera.start();
});