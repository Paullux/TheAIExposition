//------------------------Particules------------------------
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const numberOfParticles = 125;
let particlesArray = [];
const baseNumberOfParticles = 100; // Nombre de base pour un écran de taille moyenne
const particleDensity = 0.0001; // Ajuster en fonction des tests de performance

const mouse = {
    x: null,
    y: null,
    radius: 100
};

window.addEventListener('mousemove', function(event) {
    mouse.x = event.x;
    mouse.y = event.y;
});

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 5 + 1;
        this.speedX = Math.random() * 3 - 1.5;
        this.speedY = Math.random() * 3 - 1.5;
        // Génère des couleurs moins saturées (30% de saturation) et plus lumineuses (75% de luminosité)
        this.color = `hsl(${Math.random() * 360}, 30%, 65%)`;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.distance(mouse.x, mouse.y) < mouse.radius) {
            this.avoidMouse();
        }
        this.bounceOffWalls();
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
    }

    distance(x, y) {
        let dx = this.x - x;
        let dy = this.y - y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    avoidMouse() {
        if (mouse.x < this.x && this.x < canvas.width - this.size * 10) {
            this.x += 10;
        }
        if (mouse.x > this.x && this.x > this.size * 10) {
            this.x -= 10;
        }
        if (mouse.y < this.y && this.y < canvas.height - this.size * 10) {
            this.y += 10;
        }
        if (mouse.y > this.y && this.y > this.size * 10) {
            this.y -= 10;
        }
    }

    bounceOffWalls() {
        if (this.x < 0 || this.x > canvas.width) this.speedX = -this.speedX;
        if (this.y < 0 || this.y > canvas.height) this.speedY = -this.speedY;
    }
}

function calculateNumberOfParticles() {
    const area = canvas.width * canvas.height;
    return Math.min(area * particleDensity + baseNumberOfParticles, 1000); // Limite à 1000 particules pour les performances
}

// Fonction init mise à jour pour utiliser le calcul dynamique
function init() {
    particlesArray = [];
    const numberOfParticles = calculateNumberOfParticles();
    for (let i = 0; i < numberOfParticles; i++) {
        particlesArray.push(new Particle());
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particlesArray.forEach(particle => {
        particle.update();
        particle.draw();
    });
    connect();
    requestAnimationFrame(animate);
}

// Connect mise à jour pour limiter les connexions
function connect() {
    for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a + 1; b < particlesArray.length; b++) {
            let distance = particlesArray[a].distance(particlesArray[b].x, particlesArray[b].y);
            if (distance < 150) { // Distance de connectivité réduite pour améliorer les performances
                ctx.strokeStyle = `rgba(255,255,255,${1 - distance / 150})`;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                ctx.stroke();
            }
        }
    }
}

// Mise à jour lors du redimensionnement de la fenêtre
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    init(); // Réinitialise les particules à la nouvelle taille
});

init();
animate();