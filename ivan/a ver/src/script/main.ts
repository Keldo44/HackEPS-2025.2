// main.ts
import { PoseLandmarker, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";

// Grab DOM elements
const demosSection = document.getElementById("demos")!;
const video = document.getElementById("webcam") as HTMLVideoElement;
const canvasElement = document.getElementById("output_canvas") as HTMLCanvasElement;
const canvasCtx = canvasElement.getContext("2d")!;
const drawingUtils = new DrawingUtils(canvasCtx);

let poseLandmarker: PoseLandmarker | null = null;
let runningMode: "IMAGE" | "VIDEO" = "IMAGE";
let enableWebcamButton: HTMLButtonElement;
let webcamRunning = false;

const videoHeight = "360px";
const videoWidth = "480px";

// Load PoseLandmarker model
async function createPoseLandmarker() {
  const vision = await FilesetResolver.forVisionTasks(
    // Local or CDN path to wasm
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
  );

  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
      delegate: "GPU",
    },
    runningMode,
    numPoses: 2,
  });

  demosSection.classList.remove("invisible");
}

createPoseLandmarker();

/********************************************************************
// Demo 1: Clickable images detection
********************************************************************/
const imageContainers = document.getElementsByClassName("detectOnClick");

for (let i = 0; i < imageContainers.length; i++) {
  const container = imageContainers[i] as HTMLElement | null;
  if (container) {
    const firstChild = container.children[0];
    if (firstChild instanceof HTMLImageElement) {
      firstChild.addEventListener("click", handleClick);
    }
  }
}

async function handleClick(event: MouseEvent) {
  const target = event.target as HTMLImageElement;
  if (!poseLandmarker) {
    console.log("Wait for poseLandmarker to load before clicking!");
    return;
  }

  if (runningMode === "VIDEO") {
    runningMode = "IMAGE";
    await poseLandmarker.setOptions({ runningMode: "IMAGE" });
  }

  // Remove old canvases
  const parent = target.parentElement!;
  const allCanvas = parent.getElementsByClassName("canvas");
  for (let i = allCanvas.length - 1; i >= 0; i--) {
    const child = allCanvas[i];
    if (child) {
      parent.removeChild(child);
    }
  }

  poseLandmarker.detect(target, (result) => {
    const canvas = document.createElement("canvas");
    canvas.className = "canvas";
    canvas.width = target.naturalWidth;
    canvas.height = target.naturalHeight;
    canvas.style.cssText = `
      position: absolute;
      left: 0;
      top: 0;
      width: ${target.width}px;
      height: ${target.height}px;`
    target.parentElement!.appendChild(canvas);
    target.parentNode!.appendChild(canvas);

    const ctx = canvas.getContext("2d")!;
    const utils = new DrawingUtils(ctx);

    for (const landmark of result.landmarks) {
      utils.drawLandmarks(landmark, {
        radius: (data) =>
          DrawingUtils.lerp(data.from?.z ?? 0, -0.15, 0.1, 5, 1),
      });
      utils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS);
    }
  });
}

/********************************************************************
// Demo 2: Webcam continuous detection
********************************************************************/
const hasGetUserMedia = () => !!navigator.mediaDevices?.getUserMedia;

if (hasGetUserMedia()) {
  enableWebcamButton = document.getElementById("webcamButton") as HTMLButtonElement;
  enableWebcamButton.addEventListener("click", enableCam);
} else {
  console.warn("getUserMedia() is not supported by your browser");
}

function enableCam() {
  if (!poseLandmarker) {
    console.log("Wait! poseLandmarker not loaded yet.");
    return;
  }

  webcamRunning = !webcamRunning;
  enableWebcamButton.innerText = webcamRunning
    ? "DISABLE PREDICTIONS"
    : "ENABLE PREDICTIONS";

  if (!webcamRunning) return;

  navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
    video.srcObject = stream;
    video.addEventListener("loadeddata", predictWebcam);
  });
}

let lastVideoTime = -1;

async function predictWebcam() {
  canvasElement.style.height = videoHeight;
  canvasElement.style.width = videoWidth;
  video.style.height = videoHeight;
  video.style.width = videoWidth;

  if (runningMode === "IMAGE") {
    runningMode = "VIDEO";
    await poseLandmarker!.setOptions({ runningMode: "VIDEO" });
  }

  const startTimeMs = performance.now();

  if (lastVideoTime !== video.currentTime) {
    lastVideoTime = video.currentTime;

    poseLandmarker!.detectForVideo(video, startTimeMs, (result) => {
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

      for (const pose of result.landmarks) {
        const point24 = pose[24];
        if (point24) {
          drawingUtils.drawLandmarks([point24], { radius: 5 });
        }
      }

      canvasCtx.restore();
    });
  }

  if (webcamRunning) {
    window.requestAnimationFrame(predictWebcam);
  }
}
