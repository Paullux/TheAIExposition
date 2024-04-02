import * as THREE from "./three.module.min.js";
import { GLTFLoader } from "./GLTFLoader.js";
import { OrbitControls } from "./OrbitControls.js";
import { MeshSurfaceSampler } from "./MeshSurfaceSampler.js";

let camera, scene, renderer, cerveau, particles;
let brainGroup = new THREE.Group();
let particlesGroup = new THREE.Group();
const raycaster = new THREE.Raycaster();
let linesMaterial = new THREE.LineBasicMaterial({ color: 0xaaffdd, linewidth: 2 }); // Augmentez `linewidth`
let linesMesh;
let lastUpdateTime = 0;
const updateInterval = 200; 

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 500);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 1);
    scene.add(directionalLight);

    new OrbitControls(camera, renderer.domElement);

    scene.add(brainGroup);
    loadBrainModel();

    window.addEventListener('resize', onWindowResize, false);
}

function loadBrainModel() {
    const loader = new GLTFLoader();
    loader.load('public/assets/Models3D/Brain.glb', function(gltf) {
        // Trouver le maillage spécifique du cerveau par son nom
        cerveau = gltf.scene.getObjectByName("Brain_3");

        // Vérifier si le cerveau a été trouvé
        if (!cerveau) {
            console.error('Maillage du cerveau Brain_3 non trouvé dans le modèle chargé.');
            return;
        }

        // Assurer que les normales des vertices sont calculées
        if (!cerveau.geometry.attributes.normal) {
            cerveau.geometry.computeVertexNormals();
        }

        // Ajuster la taille et la position comme nécessaire
        cerveau.scale.set(1, 1, 1); // ou un autre facteur d'échelle approprié
        cerveau.position.set(0, 0, -250); // ou une autre position appropriée

        // Ajouter le cerveau au groupe de la scène
        // brainGroup.add(cerveau);
        // scene.add(brainGroup);

        // Initialiser les particules avec le maillage du cerveau
        initParticles(cerveau);
    });
}

function updateConnections(particles) {
    if (!particles || !particles.geometry || !particles.geometry.attributes.position) {
        return;  // Quitter la fonction si particles n'est pas encore prêt
    }
    const positions = particles.geometry.attributes.position.array;
    const minDistanceSquared = Math.pow(2 + Math.random() * 5, 2);  // Ajustez selon le besoin
    const maxDistanceSquared = Math.pow(10 + Math.random() * 5, 2);  // Ajustez selon le besoin
    const linePositions = [];

    for (let i = 0; i < positions.length; i += 3) {
        for (let j = 0; j < positions.length; j += 3) {
            if (i !== j) {
                const dx = positions[i] - positions[j];
                const dy = positions[i + 1] - positions[j + 1];
                const dz = positions[i + 2] - positions[j + 2];
                const distanceSquared = dx * dx + dy * dy + dz * dz;

                if (distanceSquared >= minDistanceSquared && distanceSquared <= maxDistanceSquared) {
                    linePositions.push(positions[i], positions[i + 1], positions[i + 2]);
                    linePositions.push(positions[j], positions[j + 1], positions[j + 2]);
                }
            }
        }
    }

    if (linesMesh) {
        linesMesh.geometry.dispose();  // Dispose old geometry
        linesMesh.geometry = new THREE.BufferGeometry();
        linesMesh.geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        linesMesh.geometry.attributes.position.needsUpdate = true;
    } else {
        linesMesh = new THREE.LineSegments(
            new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3)),
            linesMaterial
        );
        particlesGroup.add(linesMesh);
    }
}

// Initialisation des particules sur la surface du maillage
function initParticles(brainMesh, count = 2000) {  // Augmentez le compte pour plus de particules
    const sampler = new MeshSurfaceSampler(brainMesh).build();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        const position = new THREE.Vector3();
        sampler.sample(position);
        positions.set([position.x, position.y, position.z], i * 3);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xaaff55,
        size: 5,  // Augmentez la taille pour des particules plus grandes
        map: new THREE.TextureLoader().load('public/assets/images/particlesTexture.png'),
        transparent: true,
        opacity: 0.9
    });

    particles = new THREE.Points(geometry, material);
    particlesGroup.add(particles)
    scene.add(particlesGroup);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Mise à jour de la fonction animate
function animate() {
    requestAnimationFrame(animate);

    // if (cerveau) {
        particlesGroup.rotation.y += 0.01;
            // Mettez à jour les liaisons indépendamment de la rotation des particules
    if (Date.now() - lastUpdateTime > updateInterval) {
        updateConnections(particles);
        lastUpdateTime = Date.now();
    }
        //moveParticlesOnSurface(particles, cerveau);  // Intensité réduite pour un mouvement plus lent
        //projectParticlesOnMesh(particles, cerveau); 
    // }

    renderer.render(scene, camera);
}

function clampToMeshSurface(position, mesh, maxDistance) {
    // Trouver le point le plus proche sur la surface du maillage
    const nearestPoint = new THREE.Vector3();
    mesh.geometry.closestPointToPoint(position, nearestPoint);
    
    // Calculer la distance entre le point et la position actuelle
    const distance = nearestPoint.distanceTo(position);
    
    // Si la distance est inférieure à la distance de clamp, retourner la position actuelle
    if (distance <= maxDistance) {
        return position;
    }
    
    // Sinon, retourner le point le plus proche sur la surface
    return nearestPoint;
}

function projectParticleOnMeshSurface(particlePosition, brainMesh) {
    // Utiliser raycasting pour trouver le point le plus proche sur le maillage
    raycaster.set(particlePosition, new THREE.Vector3(0, -1, 0)); // Raycaster vers le bas
    const intersects = raycaster.intersectObject(brainMesh, true);

    if (intersects.length > 0) {
        return intersects[0].point; // Retourner le point d'intersection le plus proche
    }

    return particlePosition; // Retourner la position originale si aucune intersection n'est trouvée
}

init();
animate();