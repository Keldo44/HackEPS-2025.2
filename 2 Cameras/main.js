import { 
  PoseLandmarker, 
  FilesetResolver, 
  DrawingUtils } 
from "https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.0";

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
  enableWebcamButton.innerText = webcamRunning ? "DISABLE PREDICTIONS" : "ENABLE PREDICTIONS";
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

// Main stereo loop
function predictStereo() {
  if (!webcamRunning) return;

  lastTime1 = processFrame(video1, ctx1, drawingUtils1, pointDisplay1, lastTime1);
  lastTime2 = processFrame(video2, ctx2, drawingUtils2, pointDisplay2, lastTime2);
  var X,Y,Z;
  // Compute stereo 3D only if both points are available
  if (pointDisplay1.dataset.x && pointDisplay2.dataset.x) {
    const x1 = parseFloat(pointDisplay1.dataset.x);
    const y1 = parseFloat(pointDisplay1.dataset.y);
    const x2 = parseFloat(pointDisplay2.dataset.x);

    const pt3D = compute3D(x1, x2, y1);
    X = pt3D.X.toFixed(3);
    Y = pt3D.Y.toFixed(3);
    Z = pt3D.Z.toFixed(3);
    stereoDisplay.innerText = `Stereo XYZ: X=${X}m, Y=${Y}m, Z=${Z}m`;
    console.log(`Stereo XYZ: X=${X}m, Y=${Y}m, Z=${Z}m`);
  }

  requestAnimationFrame(predictStereo);
}
