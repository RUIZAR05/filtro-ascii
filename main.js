const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('magic-canvas');
const canvasCtx = canvasElement.getContext('2d');
const startBtn = document.getElementById('start-btn');
const ui = document.getElementById('ui');

// Los índices de las 5 puntas de los dedos en la IA de MediaPipe
const fingerTips = [4, 8, 12, 16, 20]; // Pulgar, Índice, Medio, Anular, Meñique

function onResults(results) {
    canvasElement.width = window.innerWidth;
    canvasElement.height = window.innerHeight;

    // TRUCO DE INGENIERÍA: En lugar de borrar (clearRect), pintamos de negro al 15%
    // Esto hace que la luz deje un "rastro" o estela en el aire al mover las manos
    canvasCtx.fillStyle = "rgba(0, 0, 0, 0.15)";
    canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length === 2) {
        const hand1 = results.multiHandLandmarks[0];
        const hand2 = results.multiHandLandmarks[1];

        // Color dinámico que cambia con el tiempo (Arcoíris Neón)
        const timeColor = `hsl(${Date.now() % 360}, 100%, 50%)`;

        // 1. Dibujar los láseres que conectan dedo con dedo (Mano 1 con Mano 2)
        for (let i = 0; i < 5; i++) {
            const p1 = hand1[fingerTips[i]];
            const p2 = hand2[fingerTips[i]];

            const x1 = (1 - p1.x) * canvasElement.width;
            const y1 = p1.y * canvasElement.height;
            const x2 = (1 - p2.x) * canvasElement.width;
            const y2 = p2.y * canvasElement.height;

            // Línea brillante
            canvasCtx.beginPath();
            canvasCtx.moveTo(x1, y1);
            canvasCtx.lineTo(x2, y2);
            canvasCtx.strokeStyle = timeColor;
            canvasCtx.lineWidth = 3;
            canvasCtx.stroke();

            // Dibujar las "esferas de energía" en las puntas de los 10 dedos
            drawOrb(x1, y1, timeColor);
            drawOrb(x2, y2, timeColor);
        }

        // 2. Dibujar un polígono que conecta los 5 dedos de CADA mano
        drawHandPolygon(hand1, canvasElement.width, canvasElement.height, "rgba(0, 242, 255, 0.3)");
        drawHandPolygon(hand2, canvasElement.width, canvasElement.height, "rgba(255, 0, 255, 0.3)");
    }
}

// Función para pintar esferas de luz en las yemas
function drawOrb(x, y, color) {
    canvasCtx.beginPath();
    canvasCtx.arc(x, y, 8, 0, 2 * Math.PI);
    canvasCtx.fillStyle = "#ffffff"; // Centro blanco caliente
    canvasCtx.fill();
    
    canvasCtx.beginPath();
    canvasCtx.arc(x, y, 15, 0, 2 * Math.PI);
    canvasCtx.fillStyle = color; // Borde de color
    canvasCtx.globalAlpha = 0.5;
    canvasCtx.fill();
    canvasCtx.globalAlpha = 1.0;
}

// Función para conectar los 5 dedos de una misma mano creando una figura geométrica
function drawHandPolygon(hand, w, h, color) {
    canvasCtx.beginPath();
    for (let i = 0; i < 5; i++) {
        const x = (1 - hand[fingerTips[i]].x) * w;
        const y = hand[fingerTips[i]].y * h;
        if (i === 0) canvasCtx.moveTo(x, y);
        else canvasCtx.lineTo(x, y);
    }
    canvasCtx.closePath();
    canvasCtx.fillStyle = color;
    canvasCtx.fill();
    canvasCtx.lineWidth = 1;
    canvasCtx.strokeStyle = "#ffffff";
    canvasCtx.stroke();
}

// Inicializar la Inteligencia artificial
const hands = new Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
hands.setOptions({ maxNumHands: 2, modelComplexity: 0, minDetectionConfidence: 0.5 });
hands.onResults(onResults);

const camera = new Camera(videoElement, {
    onFrame: async () => { await hands.send({ image: videoElement }); },
    width: 640, height: 480
});

startBtn.addEventListener('click', () => {
    ui.style.display = 'none';
    camera.start();
});