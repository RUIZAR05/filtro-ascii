const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('ascii-canvas');
const canvasCtx = canvasElement.getContext('2d');
const startBtn = document.getElementById('start-btn');
const ui = document.getElementById('ui');

// Las letras y símbolos que usaremos para rellenar
const asciiChars = "@#S%?*+;:,. ".split("");

// Esta función se ejecuta cada vez que la cámara ve tus manos
function onResults(results) {
    canvasElement.width = window.innerWidth;
    canvasElement.height = window.innerHeight;
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    // Si detecta 2 manos o más...
    if (results.multiHandLandmarks && results.multiHandLandmarks.length >= 2) {
        // Buscamos la punta de los dedos índices (el punto número 8)
        const hand1 = results.multiHandLandmarks[0][8]; 
        const hand2 = results.multiHandLandmarks[1][8]; 

        // Calculamos dónde están en la pantalla
        const x1 = (1 - hand1.x) * canvasElement.width;
        const y1 = hand1.y * canvasElement.height;
        const x2 = (1 - hand2.x) * canvasElement.width;
        const y2 = hand2.y * canvasElement.height;

        // Dibujamos el rectángulo de Matrix
        drawAsciiRect(x1, y1, x2, y2);
    }
}

// Función para pintar las letras
function drawAsciiRect(x1, y1, x2, y2) {
    const left = Math.min(x1, x2);
    const top = Math.min(y1, y2);
    const width = Math.abs(x1 - x2);
    const height = Math.abs(y1 - y2);

    // Fondo rosa semitransparente
    canvasCtx.fillStyle = "rgba(255, 0, 255, 0.2)"; 
    canvasCtx.fillRect(left, top, width, height);

    // Letras azules brillantes
    canvasCtx.fillStyle = "#00f2ff"; 
    const fontSize = 14;
    canvasCtx.font = fontSize + "px monospace";

    // Rellenamos el cuadro de letras al azar
    for (let y = top; y < top + height; y += fontSize) {
        for (let x = left; x < left + width; x += fontSize * 0.6) {
            const randomChar = asciiChars[Math.floor(Math.random() * asciiChars.length)];
            canvasCtx.fillText(randomChar, x, y);
        }
    }
}

// Encendemos la Inteligencia Artificial
const hands = new Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
hands.setOptions({ maxNumHands: 2, modelComplexity: 0, minDetectionConfidence: 0.5 });
hands.onResults(onResults);

const camera = new Camera(videoElement, {
    onFrame: async () => { await hands.send({ image: videoElement }); },
    width: 640, height: 480
});

// El botón de inicio quita la pantalla negra y prende la cámara
startBtn.addEventListener('click', () => {
    ui.style.display = 'none';
    camera.start();
});
