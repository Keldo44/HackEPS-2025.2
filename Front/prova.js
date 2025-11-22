const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const video2 = document.getElementById('video2');
const constraints = { video: true };
const constraints2 = { video2: true };

function handleSuccess(stream) {
  video.srcObject = stream;
  video.play();
}

function handleError(error) {
  console.error('Error al acceder a la cámara:', error);
}

// Accedemos a la cámara
navigator.mediaDevices.getUserMedia(constraints).then(handleSuccess).catch(handleError);
navigator.mediaDevices.getUserMedia(constraints2).then(handleSuccess).catch(handleError);

