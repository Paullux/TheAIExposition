// //------------------------ThreeJS------------------------
// import * as THREE from "./three.module.min.js";
// import { MTLLoader } from "./MTLLoader.js";
// import { OBJLoader } from "./OBJLoader.js";
// import { PointerLockControls } from './PointerLockControls.js';

// const scene = new THREE.Scene();
// const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// const renderer = new THREE.WebGLRenderer({ alpha: true });
// renderer.setClearColor(0x000000, 0);
// renderer.setSize(window.innerWidth, window.innerHeight);
// document.body.appendChild(renderer.domElement);

// const manager = new THREE.LoadingManager();
// new MTLLoader(manager).load('public/assets/Models3D/Cube.mtl', (materialCreator) => {
//     materialCreator.preload();
//     const materials = Object.values(materialCreator.materials);

//     new OBJLoader(manager)
//         .setMaterials(materialCreator)
//         .load('public/assets/Models3D/Cube.obj', (object) => {
//             object.traverse((child) => {
//                 if (child instanceof THREE.Mesh) {
//                     // Ici, assurez-vous que le matériau du child est bien défini
//                     if (child.material && !(child.material instanceof THREE.MeshBasicMaterial)) {
//                         const basicMaterial = new THREE.MeshBasicMaterial({
//                             color: child.material.color,
//                             map: child.material.map
//                         });
//                         child.material = basicMaterial;
//                     }
//                 }
//             });
//             scene.add(object);
//         });
// });

// // PointLight qui suit la caméra
// const flashlight = new THREE.PointLight(0xffffff, 0.5, 100);
// flashlight.position.set(0, 1, 1); // Position relative à la caméra
// camera.add(flashlight); // Ajoute la lumière à la caméra pour qu'elle suive le mouvement de la caméra
// scene.add(camera); // Ajoute la caméra et la lumière à la scène

// // Lumière ambiante pour un éclairage uniforme
// const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Intensité réglable selon les besoins
// scene.add(ambientLight);

// // Lumière hémisphérique pour simuler une lumière naturelle diffuse
// const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x000000, 0.5); // Ciel, sol, intensité
// scene.add(hemisphereLight);

// // Assurez-vous que la caméra commence au-dessus du sol de la cage
// camera.position.set(0, 5, 0);

// const controls = new PointerLockControls(camera, renderer.domElement);
// document.body.addEventListener('click', () => {
//     controls.lock();
// });

// function onWindowResize() {
//     camera.aspect = window.innerWidth / window.innerHeight;
//     camera.updateProjectionMatrix();
//     renderer.setSize(window.innerWidth, window.innerHeight);
// }

// window.addEventListener('resize', onWindowResize, false);

// function animate() {
//     requestAnimationFrame(animate);
//     renderer.render(scene, camera);
// }

// animate();



//------------------------ThreeJS------------------------
import * as THREE from "./three.module.min.js";
import { MTLLoader } from "./MTLLoader.js";
import { OBJLoader } from "./OBJLoader.js";
import { PointerLockControls } from './PointerLockControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 0);
let mediaType= "";
let mediaSource= "";

const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
let lastIntersectedObjectName = "";

let lastCameraPosition = new THREE.Vector3();
let lastCameraQuaternion = new THREE.Quaternion();

// Création d'un groupe pour tous les objets 3D chargés
let loadedObjectsGroup = new THREE.Group();
scene.add(loadedObjectsGroup);

// Contrôles de type FPS
const controls = new PointerLockControls(camera, renderer.domElement);
scene.add(controls.getObject());

// Créer un sprite pour le pointeur central
const textureLoader = new THREE.TextureLoader();
const particleTexture = textureLoader.load('public/assets/images/particlesTexture.png');
const spriteMaterial = new THREE.SpriteMaterial({ map: particleTexture });
const sprite = new THREE.Sprite(spriteMaterial);
sprite.scale.set(0.015, 0.015, 0.015); // Taille du sprite
sprite.position.set(0, 0, -0.5);
scene.add(camera);

let mediaDisplayed = false;
let currentMedia = null; // Déclaré en haut du fichier

// Gestion de l'activation du mode FPS
document.body.addEventListener('click', () => {
    controls.isLocked ? controls.unlock() : controls.lock();
});

// Initialisez ces variables juste après la création de la caméra
let previousCameraPosition = camera.position.clone();
let previousCameraQuaternion = camera.quaternion.clone();
let mediaMesh;

const ringGeometry = new THREE.TorusGeometry(0.02, 0.005, 16, 100);
const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);

// Positionner le cercle autour du sprite
ringMesh.position.set(0, 0, -0.5);

// Mettre à jour la progression et le cercle lors de la collision
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(0, 0); // Centre de l'écran

// Création d'un indicateur de progression
let loadingProgress = 0;
const maxProgress = 100;

function checkCameraMovement() {
    if (!camera.position.equals(previousCameraPosition) || !camera.quaternion.equals(previousCameraQuaternion)) {
        if (mediaMesh) {
            scene.remove(mediaMesh);
            mediaMesh.material.map.dispose();
            mediaMesh.material.dispose();
            mediaMesh.geometry.dispose();
            mediaMesh = null;
            mediaDisplayed = false;
        }

        // Mise à jour de la position et de la rotation précédentes de la caméra
        previousCameraPosition.copy(camera.position);
        previousCameraQuaternion.copy(camera.quaternion);
    }
}

function updateProgress(intersectedObjectName) {
    if (intersectedObjectName) {
        if (intersectedObjectName != lastIntersectedObjectName || loadingProgress < maxProgress) {
            loadingProgress = Math.min(loadingProgress + 1, maxProgress);
            lastIntersectedObjectName = intersectedObjectName;
        }
    } else {
        loadingProgress = 0;
    }

    const progressRatio = loadingProgress / maxProgress;
    ringMesh.scale.set(progressRatio, progressRatio, progressRatio);

    if (loadingProgress >= maxProgress && !mediaDisplayed) {
        displayMedia(intersectedObjectName);
    }
}

function displayMedia(intersectedObjectName) {
    // Supprimez le média précédent s'il existe
    if (currentMedia) {
        clearCurrentMedia();
    }

    controls.unlock();
    let mediaPath;
    let isVideo = false;

    if (intersectedObjectName.endsWith("_video")) {
        isVideo = true;
        const videoName = intersectedObjectName.replace("Cube_", "") + ".mp4";
        mediaPath = `./public/assets/videos/${videoName}`;
    } else if (intersectedObjectName.endsWith("_Image")) {
        const imageName = intersectedObjectName.replace("Cube_", "") + ".png";
        mediaPath = `./public/assets/images/${imageName}`;
    }

    if (!mediaPath) {
        console.error("Media path is undefined");
        return;
    }

    const mediaContainer = document.getElementById('mediaContainer');
    const mediaContent = document.getElementById('mediaContent');
    mediaContainer.style.display = 'flex'; // Affiche le conteneur

    // Supprimez tout contenu précédent
    mediaContent.innerHTML = '';

    if (isVideo) {
        const videoElement = document.createElement('video');
        videoElement.id = 'mediaElement';
        videoElement.src = mediaPath;
        videoElement.autoplay = true;
        videoElement.loop = true;
        document.body.appendChild(videoElement);
        currentMedia = videoElement;
    } else {
        const imageElement = new Image();
        imageElement.id = 'mediaElement';
        imageElement.src = mediaPath;
        document.body.appendChild(imageElement);
        currentMedia = imageElement;
    }

    mediaElement.onload = () => {
        // Ajuster la hauteur de l'élément média pour maintenir le ratio d'aspect
        const ratio = mediaElement.naturalWidth / mediaElement.naturalHeight;
        const containerWidth = mediaContainer.offsetWidth; // Largeur du conteneur
        mediaElement.style.width = `${containerWidth}px`;
        mediaElement.style.height = `${containerWidth / ratio}px`;
    };

    mediaElement.src = mediaPath; // Définir le chemin après avoir configuré onload
    mediaContent.appendChild(mediaElement); // Ajoutez l'élément au conteneur
    currentMedia = mediaElement;

    mediaDisplayed = true;
}

// Gestion de la fermeture du média
document.getElementById('closeMedia').addEventListener('click', () => {
    const mediaContainer = document.getElementById('mediaContainer');
    mediaContainer.style.display = 'none'; // Masque le conteneur
    clearCurrentMedia();
    controls.lock(); // Re-active les contrôles de la caméra
});

function clearCurrentMedia() {
    const mediaContent = document.getElementById('mediaContent');
    mediaContent.innerHTML = ''; // Efface le contenu précédent
    mediaDisplayed = false;
}

controls.addEventListener('lock', () => {
    camera.add(sprite); // Ajouter le sprite à la caméra pour qu'il suive la vue
    camera.add(ringMesh); // Ajouter le sprite à la caméra pour qu'il suive la vue
});

controls.addEventListener('unlock', () => {
    camera.remove(sprite); // Retirer le sprite de la caméra
    camera.remove(ringMesh); // Retirer le sprite de la caméra
});

// Chargement du modèle 3D
const manager = new THREE.LoadingManager();
new MTLLoader(manager).load('public/assets/Models3D/Cube.mtl', (materialCreator) => {
    materialCreator.preload();
    const objLoader = new OBJLoader(manager);
    objLoader.setMaterials(materialCreator);
    objLoader.load('public/assets/Models3D/Cube.obj', (object) => {
        scene.add(object);
    });
});

// Lumière ambiante pour un éclairage uniforme
const ambientLight = new THREE.AmbientLight(0xffffff, 0.05); // Intensité réglable selon les besoins
scene.add(ambientLight);

// Lumière hémisphérique pour simuler une lumière naturelle diffuse
const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x000000, 0.5); // Ciel, sol, intensité
scene.add(hemisphereLight);

function performRaycast() {
    if (controls.isLocked === true) {
        // Masquer le sprite pour éviter de l'intercepter avec le raycast
        sprite.visible = false;

        // Effectuez le raycast
        raycaster.setFromCamera(pointer, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);

        let intersectedObjectName = null;

        // Assurez-vous que nous avons au moins une intersection
        if (intersects.length > 0) {
            const intersectedObject = intersects[intersects.length - 1].object;
            intersectedObjectName = intersectedObject.name;
            if (intersectedObjectName.endsWith("_Image") || intersectedObjectName.endsWith("_video")) {
                if (lastIntersectedObjectName !== intersectedObjectName) {
                    lastIntersectedObjectName = intersectedObjectName;
                    loadingProgress = 0; // Réinitialiser si un nouvel objet est intersecté
                }
                updateProgress(intersectedObjectName);
            } else {
                // Si aucun objet pertinent n'est intersecté, réinitialiser la progression.
                updateProgress("");
            }

        } else {
            // Si aucun objet n'est intersecté, réinitialiser la progression.
            updateProgress("");
        }

        lastIntersectedObjectName = intersectedObjectName;

        if (loadingProgress == 100) loadingProgress = 0;

        // Remettre le sprite visible après le raycasting
        sprite.visible = true;
    }
}

function animate() {
    requestAnimationFrame(animate);

    if (controls.isLocked === true) {
        checkCameraMovement();
        performRaycast();
    }

    renderer.render(scene, camera);
}

animate();
// initializeCameraTracking(); 

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
