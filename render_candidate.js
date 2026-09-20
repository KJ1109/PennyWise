const sharp = require('sharp');

// Circular/elliptical arc parameterization for perfectly smooth curvature
const svgV4 = `
<svg width="600" height="600" viewBox="-1.2 -1.2 2.4 2.4" xmlns="http://www.w3.org/2000/svg">
  <rect x="-1.2" y="-1.2" width="2.4" height="2.4" fill="#050812" />
  
  <g transform="scale(1, -1)">
    <path d="
      M -0.65 0.90
      L 0.58 0.90
      L 0.46 0.70
      C 0.58 0.56, 0.58 0.28, 0.36 0.10
      L 0.56 -0.90
      L 0.32 -0.90
      L 0.08 0.04
      C 0.00 0.08, -0.06 0.16, -0.08 0.34
      L -0.65 0.34
      L -0.65 0.52
      L -0.08 0.52
      L -0.08 0.70
      L -0.65 0.70
      Z
      
      M 0.10 0.70
      C 0.38 0.70, 0.38 0.14, 0.10 0.14
      L 0.10 0.34
      L -0.08 0.34
      L -0.08 0.52
      L 0.10 0.52
      Z
    " fill="url(#grad)" fill-rule="evenodd" stroke="#00e5ff" stroke-width="0.012" />
  </g>

  <defs>
    <linearGradient id="grad" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="#00ff88" />
      <stop offset="35%" stop-color="#00e5ff" />
      <stop offset="70%" stop-color="#2563eb" />
      <stop offset="100%" stop-color="#9333ea" />
    </linearGradient>
  </defs>
</svg>
`;

sharp(Buffer.from(svgV4))
  .png()
  .toFile('scratch_candidate_v4.png')
  .then(() => console.log('Rendered scratch_candidate_v4.png successfully'));
