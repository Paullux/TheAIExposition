// Au début du worker.js
let particles = undefined;
let cerveau = undefined;

self.addEventListener("message", receiveMessage, false);

self.onmessage = function(event) {
    if (event.data.type === "process") {
        const positions = new Float32Array(event.data.positions);

        // Traitement des données, par exemple, déplacer les points
        for (let i = 0; i < positions.length; i += 3) {
            positions[i] += 0.1; // déplacer le point
        }

        // Renvoyer les données traitées
        self.postMessage({ positions: positions.buffer }, [positions.buffer]);
    }
};


function receiveMessage(event) {
    switch (event.data.type) {
        case "initialize":
            initialize(event.data.payload);
            break;
        case "start":
            startWorker();
            break;
        case "stop":
            stopWorker();
            break;
    }
}

function initialize(payload) {
    particles = payload.particles;
    cerveau = payload.cerveau;
}


let isRunning = false;
let dataArray = [];

function startWorker() {
    isRunning = true;
    loop();
}

function stopWorker() {
    isRunning = false;
}

function cleanup() {
    particles = undefined;
    cerveau = undefined;
}

function loop() {
    if (!isRunning || dataArray.length <= 0) {
        setTimeout(() => {
        self.postMessage({ type: "sendData", value: dataArray });
        }, 100);
        return;
    }
    
    // Traitez les données ici si besoin

    dataArray = []; // Effacez les anciennes données

    setTimeout(() => {
        self.postMessage({ type: "sendData", value: dataArray });
    }, 100);
}