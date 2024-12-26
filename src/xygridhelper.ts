import * as THREE from "three";

class XYGridHelper extends THREE.LineSegments {

    constructor(size = 10, divisions = 10, centerColor = new THREE.Color(0x3b0088)) {
        centerColor = new THREE.Color(centerColor);

        const step = size / divisions;
        const halfSize = size / 2;

        const vertices = [], colors: number[] | undefined = [];

        // Create grid in the x-y plane
        for (let i = 0, j = 0, k = -halfSize; i <= divisions; i++, k += step) {
            // Lines parallel to the x-axis
            vertices.push(-halfSize, k, 0, halfSize, k, 0);
            // Lines parallel to the y-axis
            vertices.push(k, -halfSize, 0, k, halfSize, 0);

            const color = centerColor;

            // Set color for each vertex
            color.toArray(colors, j); j += 3;
            color.toArray(colors, j); j += 3;
            color.toArray(colors, j); j += 3;
            color.toArray(colors, j); j += 3;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const material = new THREE.LineBasicMaterial({ vertexColors: true, toneMapped: false });

        super(geometry, material);


        this.updateSize(); // Initial size update based on the viewport

        window.addEventListener('resize', this.updateSize.bind(this)); // Update grid on window resize
    }
    type = 'XYGridHelper';
    updateSize() {
        const aspectRatio = window.innerWidth / window.innerHeight;
        const size = 7.67; // You can adjust the base size here

        this.scale.set(size * aspectRatio, size, 1); // Update the grid size relative to the viewport
    }

    dispose() {
        this.geometry.dispose();
        (this.material as THREE.Material).dispose();
        window.removeEventListener('resize', this.updateSize.bind(this)); // Clean up resize event listener
    }
}

export { XYGridHelper };