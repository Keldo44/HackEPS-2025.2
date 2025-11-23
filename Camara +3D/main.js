import {
  PoseLandmarker,
  FilesetResolver,
  DrawingUtils
}
  from "https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.0";
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js";

// HTML elements
const demosSection = document.getElementById("demos");
const video1 = document.getElementById("webcam1");
const video2 = document.getElementById("webcam2");
const canvas1 = document.getElementById("canvas1");
const canvas2 = document.getElementById("canvas2");
const ctx1 = canvas1.getContext("2d");
const ctx2 = canvas2.getContext("2d");
const pointDisplay1 = document.getElementById("point24Display1");
const pointDisplay2 = document.getElementById("point24Display2");
const stereoDisplay = document.getElementById("stereoXYZ");

let poseLandmarker;
let webcamRunning = false;

// Stereo camera parameters (baseline + focal length)
const focalLength = 800; // pixels
const baseline = 0.1; // meters
const cx = canvas1.width / 2;
const cy = canvas1.height / 2;

// Pre-create DrawingUtils
const drawingUtils1 = new DrawingUtils(ctx1);
const drawingUtils2 = new DrawingUtils(ctx2);

// Load PoseLandmarker
async function createPoseLandmarker() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
  );

  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
      delegate: "GPU"
    },
    runningMode: "VIDEO",
    numPoses: 1
  });

  demosSection.classList.remove("invisible");
}
createPoseLandmarker();

// Enable webcams button
const enableWebcamButton = document.getElementById("webcamButton");
enableWebcamButton.addEventListener("click", enableCams);

let lastTime1 = 0, lastTime2 = 0;

async function enableCams() {
  if (!poseLandmarker) return;

  webcamRunning = !webcamRunning;
  if (webcamRunning) {
    enableWebcamButton.innerText = "DISABLE PREDICTIONS";
    enableWebcamButton.style.backgroundColor = "#7C0000";
  } else {
    enableWebcamButton.innerText = "ENABLE PREDICTIONS";
    enableWebcamButton.style.backgroundColor = "rgb(9, 180, 9)"
  }

  if (!webcamRunning) return;

  // Enumerate video devices
  const devices = await navigator.mediaDevices.enumerateDevices();
  const cams = devices.filter(d => d.kind === "videoinput");
  if (cams.length < 2) {
    alert("Need at least 2 cameras!");
    return;
  }

  // Set video streams
  const stream1 = await navigator.mediaDevices.getUserMedia({ video: { deviceId: cams[0].deviceId } });
  const stream2 = await navigator.mediaDevices.getUserMedia({ video: { deviceId: cams[1].deviceId } });
  video1.srcObject = stream1;
  video2.srcObject = stream2;

  video1.addEventListener("loadeddata", () => requestAnimationFrame(predictStereo));
  video2.addEventListener("loadeddata", () => requestAnimationFrame(predictStereo));
}

enableWebcamButton.addEventListener('mouseenter', () => {
  if (webcamRunning) {
    enableWebcamButton.style.backgroundColor = "#9C0000"; // más claro al pasar
  } else {
    enableWebcamButton.style.backgroundColor = "rgb(0, 220, 0)";
  }
});

enableWebcamButton.addEventListener('mouseleave', () => {
  if (webcamRunning) {
    enableWebcamButton.style.backgroundColor = "#7C0000"; // color original del estado
  } else {
    enableWebcamButton.style.backgroundColor = "rgb(9, 180, 9)";
  }
});
// Triangulate depth
function compute3D(x1, x2, y) {
  const disparity = x1 - x2;
  if (disparity === 0) return { X: 0, Y: 0, Z: 0 };
  const Z = (focalLength * baseline) / disparity;
  const X = (x1 - cx) * Z / focalLength;
  const Y = (y - cy) * Z / focalLength;
  return { X, Y, Z };
}

// Process a single frame for one video
function processFrame(videoEl, ctx, drawingUtils, pointDisplay, lastTime) {
  if (!poseLandmarker || !webcamRunning) return lastTime;
  if (videoEl.currentTime === lastTime) return lastTime;

  poseLandmarker.detectForVideo(videoEl, performance.now(), result => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    if (result.landmarks.length > 0) {
      const pt = result.landmarks[0][24];
      if (pt) {
        drawingUtils.drawLandmarks([pt], { radius: 5 });
        pointDisplay.dataset.x = pt.x * ctx.canvas.width;
        pointDisplay.dataset.y = pt.y * ctx.canvas.height;
        pointDisplay.dataset.z = pt.z;
        pointDisplay.innerText = `x=${pt.x.toFixed(3)} y=${pt.y.toFixed(3)} z=${pt.z.toFixed(3)}`;
      }
    }
  });

  return videoEl.currentTime;
}
var X = 0, Y = 0, Z = 0, max_X = -1000, max_Z = -1000, min_X = 2000, min_Z = 2000;
// Main stereo loop
function predictStereo() {
  if (!webcamRunning) return;

  lastTime1 = processFrame(video1, ctx1, drawingUtils1, pointDisplay1, lastTime1);
  lastTime2 = processFrame(video2, ctx2, drawingUtils2, pointDisplay2, lastTime2);

  // Compute stereo 3D only if both points are available
  if (pointDisplay1.dataset.x && pointDisplay2.dataset.x) {
    const x1 = parseFloat(pointDisplay1.dataset.x);
    const y1 = parseFloat(pointDisplay1.dataset.y);
    const x2 = parseFloat(pointDisplay2.dataset.x);

    const pt3D = compute3D(x1, x2, y1);
    X = pt3D.X.toFixed(2);
    Y = pt3D.Y.toFixed(2);
    Z = pt3D.Z.toFixed(2);
    if (Z < min_Z) {
      min_Z = Z;
    }
    if (X < min_X) {
      min_X = X;
    }
    if (Z > max_Z) {
      max_Z = Z;
    }
    if (X > max_X) {
      max_X = X;
    }
    stereoDisplay.innerText = `Stereo XYZ: X=${X}m, Y=${Y}m, Z=${Z}m`;
    console.log(`Stereo XYZ: X=${X}m, Y=${Y}m, Z=${Z}m`);
    console.log(`Maxims i minims XZ: max_X=${max_X}m, max_Z=${max_Z}m, min_X=${min_X}m, min_Z=${min_Z}m`);

  }

  requestAnimationFrame(predictStereo);
}

// Import the Three.js module

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
window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
});
const renderer = new THREE.WebGLRenderer({ antialias: true }); // Antialias smooths edges
renderer.setSize(window.innerWidth, window.innerHeight);       // Full window size
renderer.domElement.id = "canva3";
document.body.appendChild(renderer.domElement);               // Add canvas to HTML

/**************************
 * 4️⃣ Create a plane (ground)
 **************************/
const planeGeometry = new THREE.BoxGeometry(1, 1, 1);        // Width, height
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
function adjustValues(x1, x2, k = 0.1) {
  // Calculate the absolute difference
  const diff = Math.abs(x1 - x2);

  // Calculate the exponential adjustment factor
  const adjustment = 3 * (1 - Math.exp(-k * diff));

  if (x1 > x2) {
    // If x1 is greater than x2, increase x2
    x2 += adjustment;
  } else if (x1 < x2) {
    // If x2 is greater than x1, decrease x2
    x2 -= adjustment;
  }

  return x2;
}
function animate() {
  requestAnimationFrame(animate);

  // 🔧 Filter + smooth + control
  const move = motionFilter(X, Z);
  X = X * 3;
  let numX = parseFloat(X);
  let numZ = parseFloat(Z);

  if (Math.abs(cubeX - numX) < 3) {
    cubeX = numX;
  }
  if (Math.abs(cubeZ - numZ) < 3) {
    cubeZ = numZ;
  }

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
