// Import the Three.js module
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js";

/**************************
 * 1️⃣ Create the scene
 **************************/
const scene = new THREE.Scene(); // This is the 3D world that contains objects, lights, and camera

/**************************
 * 2️⃣ Create the camera
 **************************/
const camera = new THREE.PerspectiveCamera(
  30,                               // Field of view in degrees
  window.innerWidth / window.innerHeight, // Aspect ratio to match the screen
  0.1,                              // Near clipping plane
  3000                              // Far clipping plane
);
camera.position.set(0, 4, 15);      // Move camera up and back
camera.lookAt(0, 0, 0);             // Make camera look at the center of the scene

/**************************
 * 3️⃣ Create the renderer
 **************************/
const renderer = new THREE.WebGLRenderer({ antialias: true }); // Antialias smooths edges
renderer.setSize(window.innerWidth, window.innerHeight);       // Full window size
document.body.appendChild(renderer.domElement);               // Add canvas to HTML

/**************************
 * 4️⃣ Create a plane (ground)
 **************************/
const planeGeometry = new THREE.BoxGeometry(1,1,1);        // Width, height
const planeMaterial = new THREE.MeshPhongMaterial({ color: 0x999999 }); // Material with light shading
const plane = new THREE.Mesh(planeGeometry, planeMaterial);   // Create the mesh
plane.rotation.x = -Math.PI / 2;                              // Rotate to lie flat
plane.scale.set(7, 7, 1);                                   // Scale to make it larger
plane.position.y = -2;                                     // Lower it slightly
scene.add(plane);                                             // Add to scene

/**************************
 * 5️⃣ Add lights
 **************************/
// Ambient light lights up everything evenly
const ambientLight = new THREE.AmbientLight(0x444444);
scene.add(ambientLight);

// Directional light simulates sunlight and casts shadows
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 10, 5);   // Position the light above and to the side
scene.add(dirLight);

/**************************
 * 6️⃣ Create a cube
 **************************/
const cubeGeometry = new THREE.BoxGeometry(1, 3, 1);          // Width, height, depth
const cubeMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 }); // Red color
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
cube.position.y = 0.5; // Raise cube so it sits on top of the plane
cube.rotation.y = Math.PI / 4; // Rotate cube 45 degrees around Y-axis
scene.add(cube);

/**************************
 * 7️⃣ Variables to control cube position
 **************************/
let cubeX = 0; // X-axis position
let cubeZ = 0; // Z-axis position



/**************************
 * 9️⃣ Optional: Move cube with keyboard
 **************************/
// Define movement step
// internal state for the wandering system
// state for the wandering system
let wanderState = {
  driftX: 0,
  driftZ: 0,
};

// EXTREME wandering randomizer
function wanderRandom() {

  // --- 1️⃣ STRONG smooth drift -------------------------------------------
  const driftChange = 0.01;   // was 0.002 → MUCH FASTER directional changes
  wanderState.driftX += (Math.random() * 2 - 1) * driftChange;
  wanderState.driftZ += (Math.random() * 2 - 1) * driftChange;

  // drift magnitude cap (bigger)
  const driftMax = 0.15;      // was 0.05 → now 3X stronger
  wanderState.driftX = THREE.MathUtils.clamp(wanderState.driftX, -driftMax, driftMax);
  wanderState.driftZ = THREE.MathUtils.clamp(wanderState.driftZ, -driftMax, driftMax);

  // --- 2️⃣ VERY LOUD noise -----------------------------------------------
  const noiseStrength = 0.15; // was 0.02 → now 7X stronger
  const noiseX = (Math.random() * 2 - 1) * noiseStrength;
  const noiseZ = (Math.random() * 2 - 1) * noiseStrength;

  // --- 3️⃣ HYPER CHAOTIC SPIKES ------------------------------------------
  const spikeChance = 0.01;   // was 0.003 → more frequent
  if (Math.random() < spikeChance) {

    // HUGE spike force
    const spikeStrength = 2.0; // was 0.5 → MASSIVE spike

    // full random launch in any direction
    wanderState.driftX += (Math.random() * 2 - 1) * spikeStrength;
    wanderState.driftZ += (Math.random() * 2 - 1) * spikeStrength;

    console.log("💥💥 MEGA SPIKE 💥💥");
  }

  // --- 4️⃣ Combine everything --------------------------------------------
  return {
    x: wanderState.driftX + noiseX,
    z: wanderState.driftZ + noiseZ
  };
}

// Internal state for smoothing layer
let smoothState = {
  velX: 0,
  velZ: 0
};

function motionFilter(inputX, inputZ) {

  // --- 1️⃣ PARAMETERS YOU CAN TUNE ---------------------------------------

  const smoothness = 0.85;   // how much inertia to keep (0=raw, 1=smooth)
  const responsiveness = 0.3; // how much to follow noisy input
  const maxSpeed = 0.2;      // speed limit for normal drifting
  const spikeSpeed = 1.0;    // max speed when a real spike happens
  const spikeThreshold = 0.6; // when input is considered a spike

  // --- 2️⃣ APPLY INERTIA -------------------------------------------------

  // blend current velocity with new noisy input
  smoothState.velX = 
      smoothState.velX * smoothness +
      inputX * responsiveness;

  smoothState.velZ = 
      smoothState.velZ * smoothness +
      inputZ * responsiveness;

  // --- 3️⃣ DETECT SPIKE --------------------------------------------------

  const magnitude = Math.sqrt(inputX * inputX + inputZ * inputZ);

  if (magnitude > spikeThreshold) {
    // SPIKE MODE
    console.log("⚡ Filter detected a SPIKE event!");

    // allow large movement, but controlled
    smoothState.velX += (inputX * 0.8);
    smoothState.velZ += (inputZ * 0.8);

    // clamp to spike max speed
    smoothState.velX = THREE.MathUtils.clamp(smoothState.velX, -spikeSpeed, spikeSpeed);
    smoothState.velZ = THREE.MathUtils.clamp(smoothState.velZ, -spikeSpeed, spikeSpeed);
  } 
  else {
    // NORMAL movement clamp
    smoothState.velX = THREE.MathUtils.clamp(smoothState.velX, -maxSpeed, maxSpeed);
    smoothState.velZ = THREE.MathUtils.clamp(smoothState.velZ, -maxSpeed, maxSpeed);
  }

  // --- 4️⃣ RETURN THE SMOOTHED RESULT ------------------------------------

  return {
    x: smoothState.velX,
    z: smoothState.velZ
  };
}


// Movement bounds
const bounds = {
  xMin: -2.5,
  xMax: 2.5,
  zMin: -1.5,
  zMax: 3.5
};

function animate() {
    requestAnimationFrame(animate);

    // get a wandering movement offset
    const noisy = wanderRandom();

    // 🔧 Filter + smooth + control
    const move = motionFilter(noisy.x, noisy.z);


    cubeX += move.x;
    cubeZ += move.z;

    document.getElementById("x").innerText = cubeX.toFixed(2);
    document.getElementById("z").innerText = cubeZ.toFixed(2);
    document.getElementById("y").innerText = cube.position.y.toFixed(2);

    // clamp inside your bounds
    cubeX = THREE.MathUtils.clamp(cubeX, bounds.xMin, bounds.xMax);
    cubeZ = THREE.MathUtils.clamp(cubeZ, bounds.zMin, bounds.zMax);

    cube.position.x = cubeX;
    cube.position.z = cubeZ;

    renderer.render(scene, camera);
}


animate();


