// --- CONFIGURACIÓN DEL ÁRBITRO DE POSTURAS (MODO DEPURACIÓN) ---
let URL = "https://teachablemachine.withgoogle.com/models/sXY3xJ09Y/";

let model, maxPredictions;
let video;
let currentLabel = "Esperando...";
let currentPose = null; // Para guardar el esqueleto

async function setup() {
    createCanvas(640, 480);
    
    // 1. Encendemos la cámara primero
    video = createCapture(VIDEO);
    video.size(640, 480);
    video.hide(); 

    // 2. Cargamos el modelo
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";
    
    // IMPORTANTE: Le decimos al modelo que NO voltee la predicción por defecto, 
    // nosotros lo manejaremos.
    model = await tmPose.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    // 3. Iniciamos el bucle
    window.requestAnimationFrame(loopModelo);
}

async function loopModelo() {
    if(video.elt.readyState >= 2 && model) {
       // --- CORRECCIÓN CLAVE ---
       // El 'true' aquí fuerza a que la IA analice el video como espejo 
       // (igual que como entrenaste en Teachable Machine)
       const { pose, posenetOutput } = await model.estimatePose(video.elt, true);
       
       // Guardamos la pose para dibujarla luego
       if (pose) {
           currentPose = pose;
           const prediction = await model.predict(posenetOutput);

           let maxProb = 0;
           for (let i = 0; i < maxPredictions; i++) {
               if (prediction[i].probability > maxProb) {
                   maxProb = prediction[i].probability;
                   currentLabel = prediction[i].className;
                   
                   // Si la confianza es muy baja (menos del 50%), dudamos
                   if (maxProb < 0.50) {
                       currentLabel = "¿Inseguro? (" + nfc(maxProb*100, 0) + "%)";
                   }
               }
           }
       }
    }
    window.requestAnimationFrame(loopModelo);
}

function draw() {
    background(0);
    
    if (!video) {
        fill(255); text("Iniciando cámara...", width/2, height/2); return;
    }

    // Dibujamos el video en modo espejo
    push();
    translate(width, 0);
    scale(-1, 1);
    image(video, 0, 0, width, height);

    // --- DIBUJAR ESQUELETO (Para ver si la IA te detecta) ---
    if (currentPose) {
        // Dibujar puntos (ojos, hombros, codos)
        for (let i = 0; i < currentPose.keypoints.length; i++) {
            let x = currentPose.keypoints[i].position.x;
            let y = currentPose.keypoints[i].position.y;
            
            fill(0, 255, 0); // Puntos verdes
            noStroke();
            ellipse(x, y, 10, 10);
        }
    }
    pop(); // Fin del modo espejo

    // --- LÓGICA DEL ÁRBITRO ---
    textSize(32);
    textAlign(CENTER, CENTER);
    fill(255);
    stroke(0);
    strokeWeight(4);

    // Mensaje principal
    text(currentLabel, width / 2, height - 50);

    // Lógica de colores (Tus poses)
    if (currentLabel == "brazo-abierto") {
        fill(255, 0, 255, 100); rect(0,0,width,height);
    } else if (currentLabel == "Brazo-triangulo") {
        fill(0, 0, 255, 100); rect(0,0,width,height);
    } else if (currentLabel == "Brazo-adelante") {
        fill(0, 255, 0, 100); rect(0,0,width,height);
    } else if (currentLabel == "Posicion-jarra") {
        fill(255, 255, 0, 100); rect(0,0,width,height);
    }
}
