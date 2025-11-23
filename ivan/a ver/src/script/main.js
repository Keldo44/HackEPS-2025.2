"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
// main.ts
var tasks_vision_1 = require("@mediapipe/tasks-vision");
// Grab DOM elements
var demosSection = document.getElementById("demos");
var video = document.getElementById("webcam");
var canvasElement = document.getElementById("output_canvas");
var canvasCtx = canvasElement.getContext("2d");
var drawingUtils = new tasks_vision_1.DrawingUtils(canvasCtx);
var poseLandmarker = null;
var runningMode = "IMAGE";
var enableWebcamButton;
var webcamRunning = false;
var videoHeight = "360px";
var videoWidth = "480px";
// Load PoseLandmarker model
function createPoseLandmarker() {
    return __awaiter(this, void 0, void 0, function () {
        var vision;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, tasks_vision_1.FilesetResolver.forVisionTasks(
                    // Local or CDN path to wasm
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm")];
                case 1:
                    vision = _a.sent();
                    return [4 /*yield*/, tasks_vision_1.PoseLandmarker.createFromOptions(vision, {
                            baseOptions: {
                                modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
                                delegate: "GPU",
                            },
                            runningMode: runningMode,
                            numPoses: 2,
                        })];
                case 2:
                    poseLandmarker = _a.sent();
                    demosSection.classList.remove("invisible");
                    return [2 /*return*/];
            }
        });
    });
}
createPoseLandmarker();
/********************************************************************
// Demo 1: Clickable images detection
********************************************************************/
var imageContainers = document.getElementsByClassName("detectOnClick");
for (var i = 0; i < imageContainers.length; i++) {
    var container = imageContainers[i];
    if (container) {
        var firstChild = container.children[0];
        if (firstChild instanceof HTMLImageElement) {
            firstChild.addEventListener("click", handleClick);
        }
    }
}
function handleClick(event) {
    return __awaiter(this, void 0, void 0, function () {
        var target, parent, allCanvas, i, child;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    target = event.target;
                    if (!poseLandmarker) {
                        console.log("Wait for poseLandmarker to load before clicking!");
                        return [2 /*return*/];
                    }
                    if (!(runningMode === "VIDEO")) return [3 /*break*/, 2];
                    runningMode = "IMAGE";
                    return [4 /*yield*/, poseLandmarker.setOptions({ runningMode: "IMAGE" })];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    parent = target.parentElement;
                    allCanvas = parent.getElementsByClassName("canvas");
                    for (i = allCanvas.length - 1; i >= 0; i--) {
                        child = allCanvas[i];
                        if (child) {
                            parent.removeChild(child);
                        }
                    }
                    poseLandmarker.detect(target, function (result) {
                        var canvas = document.createElement("canvas");
                        canvas.className = "canvas";
                        canvas.width = target.naturalWidth;
                        canvas.height = target.naturalHeight;
                        canvas.style.cssText = "\n      position: absolute;\n      left: 0;\n      top: 0;\n      width: ".concat(target.width, "px;\n      height: ").concat(target.height, "px;");
                        target.parentElement.appendChild(canvas);
                        target.parentNode.appendChild(canvas);
                        var ctx = canvas.getContext("2d");
                        var utils = new tasks_vision_1.DrawingUtils(ctx);
                        for (var _i = 0, _a = result.landmarks; _i < _a.length; _i++) {
                            var landmark = _a[_i];
                            utils.drawLandmarks(landmark, {
                                radius: function (data) { var _a, _b; return tasks_vision_1.DrawingUtils.lerp((_b = (_a = data.from) === null || _a === void 0 ? void 0 : _a.z) !== null && _b !== void 0 ? _b : 0, -0.15, 0.1, 5, 1); },
                            });
                            utils.drawConnectors(landmark, tasks_vision_1.PoseLandmarker.POSE_CONNECTIONS);
                        }
                    });
                    return [2 /*return*/];
            }
        });
    });
}
/********************************************************************
// Demo 2: Webcam continuous detection
********************************************************************/
var hasGetUserMedia = function () { var _a; return !!((_a = navigator.mediaDevices) === null || _a === void 0 ? void 0 : _a.getUserMedia); };
if (hasGetUserMedia()) {
    enableWebcamButton = document.getElementById("webcamButton");
    enableWebcamButton.addEventListener("click", enableCam);
}
else {
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
    if (!webcamRunning)
        return;
    navigator.mediaDevices.getUserMedia({ video: true }).then(function (stream) {
        video.srcObject = stream;
        video.addEventListener("loadeddata", predictWebcam);
    });
}
var lastVideoTime = -1;
function predictWebcam() {
    return __awaiter(this, void 0, void 0, function () {
        var startTimeMs;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    canvasElement.style.height = videoHeight;
                    canvasElement.style.width = videoWidth;
                    video.style.height = videoHeight;
                    video.style.width = videoWidth;
                    if (!(runningMode === "IMAGE")) return [3 /*break*/, 2];
                    runningMode = "VIDEO";
                    return [4 /*yield*/, poseLandmarker.setOptions({ runningMode: "VIDEO" })];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    startTimeMs = performance.now();
                    if (lastVideoTime !== video.currentTime) {
                        lastVideoTime = video.currentTime;
                        poseLandmarker.detectForVideo(video, startTimeMs, function (result) {
                            canvasCtx.save();
                            canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
                            for (var _i = 0, _a = result.landmarks; _i < _a.length; _i++) {
                                var pose = _a[_i];
                                var point24 = pose[24];
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
                    return [2 /*return*/];
            }
        });
    });
}
