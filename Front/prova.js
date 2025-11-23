const videoFrame = document.getElementById('video_frame');
const canvasFrame = document.getElementById('canvas_frame');

const constraints = {
    audio: false,
    video: {
        width: 720, height: 405
    }
};

async function init() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        handleSuccess(stream);
    } catch (e) {
        errorMsgElement.innerHTML = `navigator.getUserMedia error:${e.toString()}`;
    }
}

async function handleSuccess(stream) {
    window.stream = stream;
    videoFrame.srcObject = stream;
}

init();