import * as THREE from 'https://unpkg.com/three@0.151.2/build/three.module.js';

var scene = new THREE.Scene();
// scene.background = new THREE.Color('skyblue')

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();

// AQUI EL ERROR  -----------v   Tienes 3 "nnn"
//renderer.setSize( window.innnerWidth, window.innerHeight);

//ASI debería ser:
renderer.setSize( window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshBasicMaterial( { color: 'skyblue' } );
var cube = new THREE.Mesh(geometry, material);
scene.add(cube);

camera.position.z = 5;

var animate = function(){
    requestAnimationFrame( animate )
      
    //AGREGAR ROTACIÖN
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    

    renderer.render(scene, camera)
};
animate(); 