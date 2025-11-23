import {
  PoseLandmarker,
  FilesetResolver,
  DrawingUtils
} from "https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.0";

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

let poseLandmarker;
let runningMode = "VIDEO";
let webcamRunning = false;

// Simple stereo camera baseline and intrinsics for demo
// For real application, replace with calibrated values
const focalLength = 800; // px
const baseline = 0.1; // meters between cameras
const cx = 240; // principal point x
const cy = 180; // principal point y

// Load PoseLandmarker
async function createPoseLandmarker() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
  );

  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
      delegate: "GPU"
    },
    runningMode: runningMode,
    numPoses: 1
  });
  demosSection.classList.remove("invisible");
}
createPoseLandmarker();

// Enable webcams
const enableWebcamButton = document.getElementById("webcamButton");
enableWebcamButton.addEventListener("click", enableCams);

async function enableCams() {
  if (!poseLandmarker) return;

  webcamRunning = !webcamRunning;
  enableWebcamButton.innerText = webcamRunning
    ? "DISABLE PREDICTIONS"
    : "ENABLE PREDICTIONS";

  if (!webcamRunning) return;

  const devices = await navigator.mediaDevices.enumerateDevices();
  const cams = devices.filter(d => d.kind === "videoinput");
  if (cams.length < 2) {
    alert("At least 2 cameras are required!");
    return;
  }

  const stream1 = await navigator.mediaDevices.getUserMedia({ video: { deviceId: cams[0].deviceId } });
  video1.srcObject = stream1;

  const stream2 = await navigator.mediaDevices.getUserMedia({ video: { deviceId: cams[1].deviceId } });
  video2.srcObject = stream2;

  video1.addEventListener("loadeddata", () => predictStereo());
  video2.addEventListener("loadeddata", () => predictStereo());
}

// Triangulate depth (Z) using simple stereo
function compute3D(x1, x2, y) {
  const disparity = x1 - x2; // pixels
  if (disparity === 0) return { X: 0, Y: 0, Z: 0 };
  const Z = (focalLength * baseline) / disparity; // meters
  const X = (x1 - cx) * Z / focalLength;
  const Y = (y - cy) * Z / focalLength;
  return { X, Y, Z };
}

// Draw and compute 3D point24
function processFrame(videoEl, ctx, pointDisplay) {
  if (!poseLandmarker || !webcamRunning) return;

  const startTimeMs = performance.now();
  poseLandmarker.detectForVideo(videoEl, startTimeMs, result => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    if (result.landmarks.length > 0) {
      const pt = result.landmarks[0][24];
      if (pt) {
        const drawingUtils = new DrawingUtils(ctx);
        drawingUtils.drawLandmarks([pt], { radius: 5 });
        pointDisplay.dataset.x = pt.x * ctx.canvas.width;
        pointDisplay.dataset.y = pt.y * ctx.canvas.height;
        pointDisplay.innerText = `x=${pt.x.toFixed(3)} y=${pt.y.toFixed(3)} z=${pt.z.toFixed(3)}`;
      }
    }
  });
}

// Main stereo loop
function predictStereo() {
  if (!webcamRunning) return;

  processFrame(video1, ctx1, pointDisplay1);
  processFrame(video2, ctx2, pointDisplay2);

  // Compute approximate 3D coordinates using simple triangulation
  const x1 = parseFloat(pointDisplay1.dataset.x || 0);
  const y1 = parseFloat(pointDisplay1.dataset.y || 0);
  const x2 = parseFloat(pointDisplay2.dataset.x || 0);

  if (x1 && x2) {
    const pt3D = compute3D(x1, x2, y1);
    document.getElementById("stereoXYZ").innerText =
      `Stereo XYZ: X=${pt3D.X.toFixed(3)}m, Y=${pt3D.Y.toFixed(3)}m, Z=${pt3D.Z.toFixed(3)}m`;
  }

  requestAnimationFrame(predictStereo);
}
