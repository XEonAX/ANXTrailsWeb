import "./styles.css";
import * as THREE from "three";

let mouse = new THREE.Vector3(0, 0, 1);
let noOfPoints = 200;
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
};

function setPosition(array: Float32Array) {
  for (let i = 0; i < noOfPoints; i++) {
    const i3 = i * 3;

    const x = (i / (noOfPoints - 1) - 0.5) * 3;
    const y = Math.sin(i / 10.5) * 0.5;

    array[i3] = x;
    array[i3 + 1] = y;
    array[i3 + 2] = 1;
  }
  return array;
}

function handleMove() {
  // convert screen coordinates to threejs world position
  // https://stackoverflow.com/questions/13055214/mouse-canvas-x-y-to-three-js-world-x-y-z
  var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
  vector.unproject(camera);
  var dir = vector.sub(camera.position).normalize();
  var distance = -camera.position.z / dir.z;
  var pos = camera.position.clone().add(dir.multiplyScalar(distance));
  mouse = pos;
}

// Mouse Move
function handleMouseMove(event: MouseEvent) {
  mouse.x = (event.clientX / sizes.width) * 2 - 1;
  mouse.y = -(event.clientY / sizes.height) * 2 + 1;
  mouse.z = 1;
  handleMove();
}

// Mouse Move
function handleTouchMove(event: TouchEvent) {
  mouse.x = (event.touches[0].clientX / sizes.width) * 2 - 1;
  mouse.y = -(event.touches[0].clientY / sizes.height) * 2 + 1;
  mouse.z = 1;
  handleMove();
}
window.addEventListener("mousemove", handleMouseMove);
window.addEventListener("touchmove", handleTouchMove);

const canvas = document.querySelector("canvas.webgl") as HTMLElement;

const scene = new THREE.Scene();

const geometry = new THREE.BufferGeometry();

const material = new THREE.MeshBasicMaterial({
  color: 0xffff00
});

const positions = setPosition(new Float32Array(noOfPoints * 3));

geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

const points = new THREE.Points(geometry, material);
scene.add(points);

const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);

camera.position.z = 5;
scene.add(camera);

const renderer = new THREE.WebGLRenderer({
  canvas: canvas
});

renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const tick = () => {
  renderer.render(scene, camera);

  for (let i = 0; i < noOfPoints; i++) {
    const i3 = i * 3;
    const previous = (i - 1) * 3;

    if (i3 === 0) {
      positions[0] = mouse.x;
      positions[1] = mouse.y + 0.05;
      positions[2] = mouse.z;
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
      positions[i3 + 2] = mouse.z;
    }
  }
  geometry.attributes.position.needsUpdate = true;

  window.requestAnimationFrame(tick);
};

tick();
