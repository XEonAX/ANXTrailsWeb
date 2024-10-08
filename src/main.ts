import "./styles.css";
import * as THREE from "three";

interface TrailMap {
  [key: string]: {
    points: THREE.Points<THREE.BufferGeometry<THREE.NormalBufferAttributes>, THREE.MeshBasicMaterial, THREE.Object3DEventMap>
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
function updateTrailPositions(trail: { points: THREE.Points<THREE.BufferGeometry<THREE.NormalBufferAttributes>, THREE.MeshBasicMaterial, THREE.Object3DEventMap>; x: number; y: number, z: number }) {
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
    const material = new THREE.MeshBasicMaterial({ color: (Math.random() * 0.25 + 0.75) * 0xffffff }); // Random color for each session
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

// Animation loop
const tick = () => {
  renderer.render(scene, camera);
  connections.forEach(sessionId => {
    if (trails[sessionId]) {
      updateTrailPositions(trails[sessionId]);
    }
  });
  window.requestAnimationFrame(tick);
};

tick();

import * as signalR from "@microsoft/signalr";
const connection = new signalR.HubConnectionBuilder()
  .withUrl("/hub")//.configureLogging(signalR.LogLevel.Trace)
  .build();

connection.on("move", (connId: string, x: number, y: number) => {
  updateTrail(connId, x, y);
});

connection.start().catch((err) => console.error(err));


function sendMove(x: number, y: number) {
  connection.send("Move", x, y)
    .then(() => { });
}


// Mouse Move
function handleMouseMove(event: MouseEvent) {
  let x = (event.clientX / sizes.width) * 2 - 1;
  let y = -(event.clientY / sizes.height) * 2 + 1;
  updateTrail("self", x, y);
  sendMove(x, y);
}

// Mouse Move
function handleTouchMove(event: TouchEvent) {
  let x = (event.touches[0].clientX / sizes.width) * 2 - 1;
  let y = -(event.touches[0].clientY / sizes.height) * 2 + 1;

  updateTrail("self", x, y);
  sendMove(x, y);
}

window.addEventListener("mousemove", handleMouseMove);
window.addEventListener("touchmove", handleTouchMove);
