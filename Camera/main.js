import {
  PoseLandmarker,
  FilesetResolver,
  DrawingUtils
} from "https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.0";

const demosSection = document.getElementById("demos");

let poseLandmarker;
let runningMode = "IMAGE";
let enableWebcamButton;
let webcamRunning = false;
const videoHeight = "360px";
const videoWidth = "480px";

// Load PoseLandmarker model
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
    numPoses: 2
  });
  demosSection.classList.remove("invisible");
}
createPoseLandmarker();

/********************************************************************
// Demo 1: Clickable images detection
********************************************************************/
const imageContainers = document.getElementsByClassName("detectOnClick");

for (let i = 0; i < imageContainers.length; i++) {
  imageContainers[i].children[0].addEventListener("click", handleClick);
}

async function handleClick(event) {
  if (!poseLandmarker) {
    console.log("Wait for poseLandmarker to load before clicking!");
    return;
  }

  if (runningMode === "VIDEO") {
    runningMode = "IMAGE";
    await poseLandmarker.setOptions({ runningMode: "IMAGE" });
  }

  // Remove old canvases
  const allCanvas = event.target.parentNode.getElementsByClassName("canvas");
  for (let i = allCanvas.length - 1; i >= 0; i--) {
    allCanvas[i].parentNode.removeChild(allCanvas[i]);
  }

  poseLandmarker.detect(event.target, (result) => {
    const canvas = document.createElement("canvas");
    canvas.className = "canvas";
    canvas.width = event.target.naturalWidth;
    canvas.height = event.target.naturalHeight;
    canvas.style =
      "left: 0px;" +
      "top: 0px;" +
      "width: " +
      event.target.width +
      "px;" +
      "height: " +
      event.target.height +
      "px;";

    event.target.parentNode.appendChild(canvas);
    const canvasCtx = canvas.getContext("2d");
    const drawingUtils = new DrawingUtils(canvasCtx);
    for (const landmark of result.landmarks) {
      drawingUtils.drawLandmarks(landmark, {
        radius: (data) => DrawingUtils.lerp(data.from?.z ?? 0, -0.15, 0.1, 5, 1)
      });
      drawingUtils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS);
    }
  });
}

/********************************************************************
// Demo 2: Webcam continuous detection
********************************************************************/
const video1 = document.getElementById("webcam");
const canvas1 = document.getElementById("output_canvas");
const ctx1 = canvas1.getContext("2d");
const point24Display1 = document.getElementById("point24Display");

const video2 = document.getElementById("webcam2");
const canvas2 = document.getElementById("canvas2");
const ctx2 = canvas2.getContext("2d");
const point24Display2 = document.getElementById("point24Display2");

let lastVideoTime1 = -1;
let lastVideoTime2 = -1;

const hasGetUserMedia = () => !!navigator.mediaDevices?.getUserMedia;

if (hasGetUserMedia()) {
  const enableWebcamButton = document.getElementById("webcamButton");
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
  document.getElementById("webcamButton").innerText = webcamRunning
    ? "DISABLE PREDICTIONS"
    : "ENABLE PREDICTIONS";

  if (!webcamRunning) return;

  // Obtener las cámaras disponibles
  navigator.mediaDevices.enumerateDevices().then((devices) => {
    const videoDevices = devices.filter((d) => d.kind === "videoinput");

    if (videoDevices[0]) {
      navigator.mediaDevices.getUserMedia({ video: { deviceId: videoDevices[0].deviceId } })
        .then((stream) => {
          video1.srcObject = stream;
          video1.addEventListener("loadeddata", predictWebcam1);
        });
    }

    if (videoDevices[1]) {
      navigator.mediaDevices.getUserMedia({ video: { deviceId: videoDevices[1].deviceId } })
        .then((stream) => {
          video2.srcObject = stream;
          video2.addEventListener("loadeddata", predictWebcam2);
        });
    }
  });
}

// Función de predicción para la primera cámara
async function predictWebcam1() {
  if (runningMode === "IMAGE") {
    runningMode = "VIDEO";
    await poseLandmarker.setOptions({ runningMode: "VIDEO" });
  }

  const startTimeMs = performance.now();
  if (lastVideoTime1 !== video1.currentTime) {
    lastVideoTime1 = video1.currentTime;

    poseLandmarker.detectForVideo(video1, startTimeMs, (result) => {
      ctx1.clearRect(0, 0, canvas1.width, canvas1.height);

      for (const pose of result.landmarks) {
        const point24 = pose[24];
        if (point24) {
          ctx1.beginPath();
          ctx1.arc(point24.x * canvas1.width, point24.y * canvas1.height, 5, 0, 2 * Math.PI);
          ctx1.fillStyle = "red";
          ctx1.fill();
          point24Display1.innerText = `Point 24: x=${point24.x.toFixed(3)}, y=${point24.y.toFixed(3)}, z=${point24.z.toFixed(3)}`;
        } else {
          point24Display1.innerText = "Point 24: N/A";
        }
      }
    });
  }

  if (webcamRunning) requestAnimationFrame(predictWebcam1);
}

// Función de predicción para la segunda cámara
async function predictWebcam2() {
  if (runningMode === "IMAGE") {
    runningMode = "VIDEO";
    await poseLandmarker.setOptions({ runningMode: "VIDEO" });
  }

  const startTimeMs = performance.now();
  if (lastVideoTime2 !== video2.currentTime) {
    lastVideoTime2 = video2.currentTime;

    poseLandmarker.detectForVideo(video2, startTimeMs, (result) => {
      ctx2.clearRect(0, 0, canvas2.width, canvas2.height);

      for (const pose of result.landmarks) {
        const point24 = pose[24];
        if (point24) {
          ctx2.beginPath();
          ctx2.arc(point24.x * canvas2.width, point24.y * canvas2.height, 5, 0, 2 * Math.PI);
          ctx2.fillStyle = "blue";
          ctx2.fill();
          point24Display2.innerText = `Point 24: x=${point24.x.toFixed(3)}, y=${point24.y.toFixed(3)}, z=${point24.z.toFixed(3)}`;
        } else {
          point24Display2.innerText = "Point 24: N/A";
        }
      }
    });
  }

  if (webcamRunning) requestAnimationFrame(predictWebcam2);
}

