// main.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js';

// 1️⃣ Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xaaaaaa);

// 2️⃣ Camera
const camera = new THREE.PerspectiveCamera(
    75, 
    window.innerWidth / window.innerHeight, 
    0.1, 
    1000
);
camera.position.set(0, 1, 5);

// 3️⃣ Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 4️⃣ Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// 5️⃣ Light
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7.5);
scene.add(light);

// 6️⃣ Load 3D Model
const loader = new GLTFLoader();
loader.load(
    './cubo.glb', // 🔹 replace with your model path
    function(gltf) {
        scene.add(gltf.scene);
        gltf.scene.position.set(0, 0, 0);
    },
    undefined,
    function(error) {
        console.error('An error happened while loading the model:', error);
    }
);

// 7️⃣ Animate
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// 8️⃣ Handle Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
