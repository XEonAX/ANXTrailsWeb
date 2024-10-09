import "./styles.css";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
document.addEventListener('gesturestart', function (e) {
  e.preventDefault();
});
interface TrailMap {
  [key: string]: {
    points: THREE.Points<THREE.BufferGeometry<THREE.NormalBufferAttributes>, THREE.MeshStandardMaterial, THREE.Object3DEventMap>
    x: number,
    y: number,
    z: number
  } | undefined
}

let trails: TrailMap = {}; // Object to store trails by sessionId
let connections: string[] = []
let noOfPoints = 200;
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
};

// Function to create geometry for each trail
function createTrailGeometry(): THREE.BufferGeometry<THREE.NormalBufferAttributes> {
  const positions = new Float32Array(noOfPoints * 3);
  for (let i = 0; i < noOfPoints; i++) {
    const i3 = i * 3;
    const x = (i / (noOfPoints - 1) - 0.5) * 3;
    const y = Math.sin(i / 10.5) * 0.5;
    positions[i3] = x;
    positions[i3 + 1] = y;
    positions[i3 + 2] = 1;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return geometry;
}

// Function to update a specific trail's position
function updateTrailPositions(trail: { points: THREE.Points<THREE.BufferGeometry<THREE.NormalBufferAttributes>, THREE.MeshStandardMaterial, THREE.Object3DEventMap>; x: number; y: number, z: number }) {
  const positions = trail.points.geometry.attributes.position.array;
  for (let i = 0; i < noOfPoints; i++) {
    const i3 = i * 3;
    const previous = (i - 1) * 3;

    if (i3 === 0) {
      positions[0] = trail.x;
      positions[1] = trail.y + 0.05;
      positions[2] = trail.z;
    } else {
      const currentPoint = new THREE.Vector3(
        positions[i3],
        positions[i3 + 1],
        positions[i3 + 2]
      );

      const previousPoint = new THREE.Vector3(
        positions[previous],
        positions[previous + 1],
        positions[previous + 2]
      );

      const lerpPoint = currentPoint.lerp(previousPoint, 0.9);

      positions[i3] = lerpPoint.x;
      positions[i3 + 1] = lerpPoint.y;
      positions[i3 + 2] = trail.z;
    }
  }
  trail.points.geometry.attributes.position.needsUpdate = true;
}

// Update method to be called with sessionId, x, y positions
function updateTrail(sessionId: string, normalizedX: number, normalizedY: number) {
  var vector = new THREE.Vector3(normalizedX, normalizedY, 0.5);
  vector.unproject(camera);
  var dir = vector.sub(camera.position).normalize();
  var distance = -camera.position.z / dir.z;
  var pos = camera.position.clone().add(dir.multiplyScalar(distance));

  // If a trail doesn't exist for this sessionId, create one
  if (!trails[sessionId]) {
    const geometry = createTrailGeometry();
    const material = new THREE.MeshStandardMaterial({
      color: (Math.random() * 0.25 + 0.5) * 0xffffff,
      emissive: (Math.random() * 0.25 + 0.5) * 0xffffff, // Add emissive color to make it look like it's glowing
      emissiveIntensity: 50 // Adjust this value to control brightness
    }); // Random color for each session
    const points = new THREE.Points(geometry, material);
    scene.add(points);
    trails[sessionId] = { points, x: pos.x, y: pos.y, z: pos.z };
    connections.push(sessionId);
  }

  trails[sessionId].x = pos.x;
  trails[sessionId].y = pos.y;
}

const canvas = document.querySelector("canvas.webgl") as HTMLElement;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.z = 5;
scene.add(camera);

const renderer = new THREE.WebGLRenderer({
  canvas: canvas
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
// Bloom settings
const bloomParams = {
  exposure: 1,
  bloomStrength: 1.5,   // How strong the bloom effect is
  bloomThreshold: 0,     // Threshold for brightness that causes the bloom
  bloomRadius: 0         // Radius of the bloom
};

// Create a RenderPass and BloomPass
const renderPass = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(sizes.width, sizes.height),
  bloomParams.bloomStrength,
  bloomParams.bloomRadius,
  bloomParams.bloomThreshold
);

// Set up composer for post-processing
const composer = new EffectComposer(renderer);
composer.addPass(renderPass);
composer.addPass(bloomPass);

// Ping effect parameters
const pings: { mesh: THREE.Mesh<THREE.CircleGeometry, THREE.MeshStandardMaterial, THREE.Object3DEventMap>; scale: number; opacity: number; }[] = [];
// Animation loop
const tick = () => {
  composer.render();
  connections.forEach(sessionId => {
    if (trails[sessionId]) {
      updateTrailPositions(trails[sessionId]);
    }
  });
  // Update each ping
  pings.forEach((ping, index) => {
    ping.scale += 0.1;
    ping.opacity -= 0.005;

    ping.mesh.scale.set(ping.scale, ping.scale, ping.scale);
    ping.mesh.material.opacity = ping.opacity;

    // Remove pings that are fully transparent
    if (ping.opacity <= 0) {
      scene.remove(ping.mesh);
      pings.splice(index, 1);
    }
  });

  window.requestAnimationFrame(tick);
};

tick();

import * as signalR from "@microsoft/signalr";
const connection = new signalR.HubConnectionBuilder()
  .withUrl("/hub")//.configureLogging(signalR.LogLevel.Trace)
  .build();

connection.on("move", (connId: string, i: number, x: number, y: number) => {
  updateTrail(connId + i, x, y);
});

connection.on("click", (x: number, y: number) => {
  updateClick(x, y);
});

connection.start().catch((err) => console.error(err));


function sendMove(i: number, x: number, y: number) {
  connection.send("Move", i, x, y)
    .then(() => { });
}
function sendClick(x: number, y: number) {
  connection.send("Click", x, y)
    .then(() => { });
}


// Mouse Move
function handleMouseMove(event: MouseEvent) {
  let x = (event.clientX / sizes.width) * 2 - 1;
  let y = -(event.clientY / sizes.height) * 2 + 1;
  updateTrail("selfm", x, y);
  sendMove(-1, x, y);
}

// Mouse Move
function handleTouchMove(event: TouchEvent) {
  for (let i = 0; i < event.touches.length; i++) {
    const touch = event.touches[i];
    let x = (touch.clientX / sizes.width) * 2 - 1;
    let y = -(touch.clientY / sizes.height) * 2 + 1;

    updateTrail("self" + i, x, y);
    sendMove(i, x, y);
  }
}

window.addEventListener("mousemove", handleMouseMove);
window.addEventListener("touchmove", handleTouchMove);



// Handle window resize
function onWindowResize() {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // If you're using post-processing (e.g., bloom effect), update composer size
  composer.setSize(sizes.width, sizes.height);
  composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

// Add resize event listener
window.addEventListener('resize', onWindowResize);



// Create a ping effect on mouse click
window.addEventListener('click', (event) => {
  // Convert click position to normalized device coordinates (-1 to 1)
  const x = (event.clientX / window.innerWidth) * 2 - 1;
  const y = -(event.clientY / window.innerHeight) * 2 + 1;
  updateClick(x, y);

  sendClick(x, y);
});

function updateClick(x: number, y: number) {
  let vector = new THREE.Vector3(x, y, 0.5);
  vector.unproject(camera);
  var dir = vector.sub(camera.position).normalize();
  var distance = -camera.position.z / dir.z;
  var pos2 = camera.position.clone().add(dir.multiplyScalar(distance));

  // Create a circle geometry at the click point
  const geometry = new THREE.CircleGeometry(0.1, 32);
  const material = new THREE.MeshStandardMaterial({
    color: (Math.random() * 0.25 + 0.5) * 0xffffff,
    emissive: (Math.random() * 0.25 + 0.5) * 0xffffff, // Add emissive color to make it look like it's glowing
    emissiveIntensity: 0.2, // Adjust this value to control brightness
    transparent: true
  });
  const circle = new THREE.Mesh(geometry, material);

  circle.position.set(pos2.x, pos2.y, pos2.z);

  // Add to the ping effect array
  pings.push({ mesh: circle, scale: 0.1, opacity: 0.5 });
  scene.add(circle);
}
