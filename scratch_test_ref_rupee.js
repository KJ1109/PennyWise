const THREE = require('three');
const fs = require('fs');

// Let's model the exact authentic Rupee symbol from the reference image:
// Proportions from Image 2:
// - Height: from y = -1.0 to y = 1.0 (total height = 2.0)
// - Top bar: y from 0.72 to 0.94 (thickness 0.22)
//   Left end: x = -0.65. Right end: x = 0.55 (angled cut: top at 0.55, bottom at 0.44)
// - Gap between bars: y from 0.54 to 0.72 (gap height 0.18)
// - Second bar: y from 0.36 to 0.54 (thickness 0.18)
//   Left end: x = -0.65. Right end: x = 0.50 (cuts across the arch!)
// - Stem: x from -0.22 to -0.04 (width 0.18) connecting top bar and second bar
// - Arch (Upper bowl):
//   Starts at top bar (x ~ -0.04 to 0.14, y = 0.72)
//   Arcs out to x = 0.52 at y = 0.54
//   Curves down to junction at (x ~ -0.04, y = 0.18)
// - Diagonal leg:
//   Starts at junction (x = -0.04 to 0.14, y = 0.18)
//   Extends down-right at ~55 deg to bottom-right:
//   Foot at y = -0.95, x from 0.28 to 0.52.
//   Bottom foot edge is horizontal at y = -0.95.

function buildReferenceRupeeShape() {
  const shape = new THREE.Shape();
  
  // Outer contour:
  // Start at top-left of top bar:
  shape.moveTo(-0.65, 0.94);
  // Top edge of top bar:
  shape.lineTo(0.55, 0.94);
  // Angled right end of top bar (matching reference image):
  shape.lineTo(0.44, 0.72);
  // Bottom edge of top bar to outer start of arch:
  shape.lineTo(0.12, 0.72);
  
  // Outer arch curve:
  // Sweeps from (0.12, 0.72) to apex at (0.54, 0.54) then to (0.18, 0.18)
  shape.bezierCurveTo(0.52, 0.72, 0.56, 0.42, 0.18, 0.18);
  
  // Diagonal leg outer edge:
  shape.lineTo(0.52, -0.95);
  // Bottom foot edge:
  shape.lineTo(0.30, -0.95);
  // Diagonal leg inner edge:
  shape.lineTo(-0.06, 0.05);
  
  // Arch inner curve bottom meeting the stem:
  shape.bezierCurveTo(-0.14, 0.10, -0.20, 0.22, -0.22, 0.36);
  
  // Second bar bottom edge going left:
  shape.lineTo(-0.65, 0.36);
  // Second bar left end:
  shape.lineTo(-0.65, 0.54);
  // Second bar top edge going right to stem:
  shape.lineTo(-0.22, 0.54);
  
  // Stem right edge going up to top bar:
  shape.lineTo(-0.22, 0.72);
  // Top bar bottom edge to left end:
  shape.lineTo(-0.65, 0.72);
  // Top bar left end going up to start:
  shape.closePath();

  // Now, what about the open hole inside the arch?
  // In the reference image, the space inside the arch is a clean D-shaped cutout:
  // It is between the stem (-0.04), the top bar (0.72), the inner arch, and the second bar!
  const hole = new THREE.Path();
  hole.moveTo(-0.04, 0.68);
  hole.bezierCurveTo(0.28, 0.68, 0.32, 0.36, -0.04, 0.36);
  hole.lineTo(-0.04, 0.68);
  hole.closePath();
  shape.holes.push(hole);

  return shape;
}

const shape = buildReferenceRupeeShape();
const geo = new THREE.ExtrudeGeometry(shape, {
  depth: 0.32,
  bevelEnabled: true,
  bevelThickness: 0.05,
  bevelSize: 0.04,
  bevelSegments: 8,
  curveSegments: 48
});
geo.center();
geo.computeVertexNormals();

console.log('Geometry vertices:', geo.attributes.position.count);
console.log('Bounds:', geo.boundingBox);
