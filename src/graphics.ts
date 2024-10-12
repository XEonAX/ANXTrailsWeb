import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

interface TrailMap {
    [key: string]: {
        points: THREE.Points<THREE.BufferGeometry<THREE.NormalBufferAttributes>, THREE.MeshStandardMaterial, THREE.Object3DEventMap>,
        x: number,
        y: number,
        z: number
    } | undefined;
}

let trails: TrailMap = {}; // Object to store trails by sessionId
let connections: string[] = [];
let noOfPoints = 200;
const sizes = { width: window.innerWidth, height: window.innerHeight };

const canvas = document.querySelector("canvas.webgl") as HTMLElement;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.z = 5;
scene.add(camera);

const renderer = new THREE.WebGLRenderer({ canvas: canvas });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const bloomParams = { exposure: 1, bloomStrength: 1.5, bloomThreshold: 0, bloomRadius: 0 };
const renderPass = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(sizes.width, sizes.height), bloomParams.bloomStrength, bloomParams.bloomRadius, bloomParams.bloomThreshold);

const composer = new EffectComposer(renderer);
composer.addPass(renderPass);
composer.addPass(bloomPass);

// Ping effect parameters
const pings: { mesh: THREE.Mesh<THREE.CircleGeometry, THREE.MeshStandardMaterial, THREE.Object3DEventMap>; scale: number; opacity: number; }[] = [];

// Create trail geometry
function createTrailGeometry(): THREE.BufferGeometry<THREE.NormalBufferAttributes> {
    const positions = new Float32Array(noOfPoints * 3);
    for (let i = 0; i < noOfPoints; i++) {
        const i3 = i * 3;
        positions[i3] = (i / (noOfPoints - 1) - 0.5) * 3;
        positions[i3 + 1] = Math.sin(i / 10.5) * 0.5;
        positions[i3 + 2] = 1;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geometry;
}

// Update trail positions
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
            const currentPoint = new THREE.Vector3(positions[i3], positions[i3 + 1], positions[i3 + 2]);
            const previousPoint = new THREE.Vector3(positions[previous], positions[previous + 1], positions[previous + 2]);
            const lerpPoint = currentPoint.lerp(previousPoint, 0.9);
            positions[i3] = lerpPoint.x;
            positions[i3 + 1] = lerpPoint.y;
            positions[i3 + 2] = trail.z;
        }
    }
    trail.points.geometry.attributes.position.needsUpdate = true;
}

// Update trail
export function updateTrail(sessionId: string, normalizedX: number, normalizedY: number) {
    var vector = new THREE.Vector3(normalizedX, normalizedY, 0.5);
    vector.unproject(camera);
    var dir = vector.sub(camera.position).normalize();
    var distance = -camera.position.z / dir.z;
    var pos = camera.position.clone().add(dir.multiplyScalar(distance));

    if (!trails[sessionId]) {
        const geometry = createTrailGeometry();
        const material = new THREE.MeshStandardMaterial({
            color: (Math.random() * 0.25 + 0.5) * 0xffffff,
            emissive: (Math.random() * 0.25 + 0.5) * 0xffffff,
            emissiveIntensity: 50
        });
        const points = new THREE.Points(geometry, material);
        scene.add(points);
        trails[sessionId] = { points, x: pos.x, y: pos.y, z: pos.z };
        connections.push(sessionId);
    }

    trails[sessionId].x = pos.x;
    trails[sessionId].y = pos.y;
}

export function updateClick(x: number, y: number) {
    let vector = new THREE.Vector3(x, y, 0.5);
    vector.unproject(camera);
    var dir = vector.sub(camera.position).normalize();
    var distance = -camera.position.z / dir.z;
    var pos2 = camera.position.clone().add(dir.multiplyScalar(distance));

    const geometry = new THREE.CircleGeometry(0.1, 32);
    const material = new THREE.MeshStandardMaterial({
        color: (Math.random() * 0.25 + 0.5) * 0xffffff,
        emissive: (Math.random() * 0.25 + 0.5) * 0xffffff,
        emissiveIntensity: 0.2,
        transparent: true
    });
    const circle = new THREE.Mesh(geometry, material);

    circle.position.set(pos2.x, pos2.y, pos2.z);

    pings.push({ mesh: circle, scale: 0.1, opacity: 0.5 });
    scene.add(circle);
}

// Animation loop
function tick() {
    composer.render();
    connections.forEach(sessionId => {
        if (trails[sessionId]) {
            updateTrailPositions(trails[sessionId]);
        }
    });
    pings.forEach((ping, index) => {
        ping.scale += 0.1;
        ping.opacity -= 0.005;
        ping.mesh.scale.set(ping.scale, ping.scale, ping.scale);
        ping.mesh.material.opacity = ping.opacity;

        if (ping.opacity <= 0) {
            scene.remove(ping.mesh);
            pings.splice(index, 1);
        }
    });
    window.requestAnimationFrame(tick);
}
tick();

window.addEventListener('resize', () => {
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
});
