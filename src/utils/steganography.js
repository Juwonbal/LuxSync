/**
 * LuxSync Generative Steganography Engine v2
 * Each theme renders a DRAMATICALLY different visual style while preserving
 * QR scannability via high dark/light contrast ratios.
 *
 * Strategy: We extract the raw QR module grid (not pixel-level), then render
 * each module as a large, themed tile with unique visual character per theme.
 */

import QRCode from 'qrcode';

export const ART_THEMES = {
  standard:       { name: 'Standard QR',              emoji: '⬜' },
  cyberpunk:      { name: 'Cyberpunk Circuitry',       emoji: '⚡' },
  bioluminescent: { name: 'Bioluminescent Grid',       emoji: '🌌' },
  matrix:         { name: 'Matrix Code Rain',          emoji: '💚' },
  mosaic:         { name: 'Neon Stencil Mosaic',        emoji: '🎨' }
};

// Matrix-style glyph characters
const MATRIX_GLYPHS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF';

// Frame counter for animated elements
let frameCount = 0;

/**
 * Master render function — dispatches to theme-specific renderers
 */
export async function renderSteganographicQR(canvas, payload, themeKey = 'cyberpunk') {
  frameCount++;

  if (themeKey === 'standard') {
    await QRCode.toCanvas(canvas, payload, {
      width: canvas.width, margin: 3,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'M'
    });
    return;
  }

  // 1. Extract the raw QR module grid
  const modules = await getQRModuleGrid(payload);
  const gridSize = modules.length;
  const size = canvas.width;
  const ctx = canvas.getContext('2d');

  // 2. Compute module pixel size with margin
  const margin = 3;
  const totalModulesWithMargin = gridSize + margin * 2;
  const modPx = size / totalModulesWithMargin;
  const offsetPx = margin * modPx;

  // 3. Render theme
  ctx.clearRect(0, 0, size, size);

  switch (themeKey) {
    case 'cyberpunk':
      renderCyberpunk(ctx, modules, gridSize, size, modPx, offsetPx);
      break;
    case 'bioluminescent':
      renderBioluminescent(ctx, modules, gridSize, size, modPx, offsetPx);
      break;
    case 'matrix':
      renderMatrix(ctx, modules, gridSize, size, modPx, offsetPx);
      break;
    case 'mosaic':
      renderMosaic(ctx, modules, gridSize, size, modPx, offsetPx);
      break;
  }
}

// ========================================================================
// QR Module Grid Extraction
// ========================================================================

async function getQRModuleGrid(payload) {
  // Render QR to a tiny canvas, then sample the grid
  const tmpCanvas = document.createElement('canvas');
  // Use a known size so we can extract modules cleanly
  const tmpSize = 500;
  tmpCanvas.width = tmpSize;
  tmpCanvas.height = tmpSize;

  await QRCode.toCanvas(tmpCanvas, payload, {
    width: tmpSize, margin: 0,
    color: { dark: '#000000', light: '#ffffff' },
    errorCorrectionLevel: 'M'
  });

  const tmpCtx = tmpCanvas.getContext('2d');
  const imgData = tmpCtx.getImageData(0, 0, tmpSize, tmpSize);
  const pixels = imgData.data;

  // Detect module size by scanning top row for first dark→light transition
  let moduleSize = 1;
  const firstPixelDark = pixels[0] < 128;
  for (let x = 1; x < tmpSize; x++) {
    const dark = pixels[x * 4] < 128;
    if (dark !== firstPixelDark) {
      moduleSize = x;
      break;
    }
  }
  if (moduleSize < 2) moduleSize = Math.round(tmpSize / 25); // fallback estimate

  const gridCount = Math.round(tmpSize / moduleSize);
  const grid = [];

  for (let row = 0; row < gridCount; row++) {
    const rowArr = [];
    for (let col = 0; col < gridCount; col++) {
      // Sample center of each module
      const sx = Math.floor(col * moduleSize + moduleSize / 2);
      const sy = Math.floor(row * moduleSize + moduleSize / 2);
      if (sx < tmpSize && sy < tmpSize) {
        const idx = (sy * tmpSize + sx) * 4;
        rowArr.push(pixels[idx] < 128); // true = dark module
      } else {
        rowArr.push(false);
      }
    }
    grid.push(rowArr);
  }

  return grid;
}

// ========================================================================
// THEME 1: CYBERPUNK CIRCUITRY
// Neon cyan circuit traces, glowing dark modules, chrome light modules
// ========================================================================

function renderCyberpunk(ctx, modules, gridSize, size, modPx, offset) {
  // Background: deep dark blue-black
  const bgGrad = ctx.createLinearGradient(0, 0, size, size);
  bgGrad.addColorStop(0, '#020810');
  bgGrad.addColorStop(0.5, '#0a1628');
  bgGrad.addColorStop(1, '#020810');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, size, size);

  // Circuit trace grid lines
  ctx.strokeStyle = 'rgba(0, 242, 254, 0.12)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i < gridSize; i++) {
    const pos = offset + i * modPx;
    ctx.beginPath();
    ctx.moveTo(pos, 0); ctx.lineTo(pos, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, pos); ctx.lineTo(size, pos);
    ctx.stroke();
  }

  // Render modules
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const x = offset + col * modPx;
      const y = offset + row * modPx;
      const dark = modules[row][col];

      if (dark) {
        // Dark module: glowing cyan-bordered dark tile
        ctx.fillStyle = '#030a14';
        ctx.fillRect(x, y, modPx, modPx);

        // Inner glow border
        ctx.strokeStyle = 'rgba(0, 242, 254, 0.6)';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(x + 1, y + 1, modPx - 2, modPx - 2);

        // Tiny cyan dot in center
        ctx.fillStyle = 'rgba(0, 242, 254, 0.35)';
        ctx.beginPath();
        ctx.arc(x + modPx / 2, y + modPx / 2, modPx * 0.15, 0, Math.PI * 2);
        ctx.fill();

        // Circuit connector lines to adjacent dark modules
        ctx.strokeStyle = 'rgba(0, 242, 254, 0.4)';
        ctx.lineWidth = 1.5;
        if (col + 1 < gridSize && modules[row][col + 1]) {
          ctx.beginPath();
          ctx.moveTo(x + modPx, y + modPx / 2);
          ctx.lineTo(x + modPx + modPx * 0.05, y + modPx / 2);
          ctx.stroke();
        }
        if (row + 1 < gridSize && modules[row + 1][col]) {
          ctx.beginPath();
          ctx.moveTo(x + modPx / 2, y + modPx);
          ctx.lineTo(x + modPx / 2, y + modPx + modPx * 0.05);
          ctx.stroke();
        }
      } else {
        // Light module: bright chrome white with subtle blue sheen
        const lightGrad = ctx.createLinearGradient(x, y, x + modPx, y + modPx);
        lightGrad.addColorStop(0, '#e8f4ff');
        lightGrad.addColorStop(0.5, '#ffffff');
        lightGrad.addColorStop(1, '#d0eaff');
        ctx.fillStyle = lightGrad;
        ctx.fillRect(x, y, modPx, modPx);
      }
    }
  }

  // Outer glow border
  ctx.shadowColor = '#00f2fe';
  ctx.shadowBlur = 15;
  ctx.strokeStyle = '#00f2fe';
  ctx.lineWidth = 3;
  ctx.strokeRect(offset - 2, offset - 2, gridSize * modPx + 4, gridSize * modPx + 4);
  ctx.shadowBlur = 0;
}

// ========================================================================
// THEME 2: BIOLUMINESCENT GRID
// Deep ocean dark, teal/emerald glowing organisms, pulsing radial rings
// ========================================================================

function renderBioluminescent(ctx, modules, gridSize, size, modPx, offset) {
  // Background: deep ocean black
  ctx.fillStyle = '#010c0e';
  ctx.fillRect(0, 0, size, size);

  // Pulsing concentric rings emanating from center
  const cx = size / 2, cy = size / 2;
  const maxRadius = size * 0.7;
  const ringPhase = (frameCount * 0.15) % 40;
  for (let r = ringPhase; r < maxRadius; r += 40) {
    ctx.strokeStyle = `rgba(0, 245, 160, ${0.08 * (1 - r / maxRadius)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Scattered bioluminescent particles in background
  ctx.fillStyle = 'rgba(0, 245, 160, 0.06)';
  const seed = frameCount * 7;
  for (let i = 0; i < 40; i++) {
    const px = ((seed + i * 137) % size);
    const py = ((seed + i * 211) % size);
    ctx.beginPath();
    ctx.arc(px, py, 1.5 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }

  // Render modules
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const x = offset + col * modPx;
      const y = offset + row * modPx;
      const dark = modules[row][col];

      if (dark) {
        // Dark module: deep ocean dark with bioluminescent border glow
        ctx.fillStyle = '#020e10';
        ctx.fillRect(x, y, modPx, modPx);

        // Emerald glow halo
        const haloGrad = ctx.createRadialGradient(
          x + modPx / 2, y + modPx / 2, 0,
          x + modPx / 2, y + modPx / 2, modPx * 0.7
        );
        haloGrad.addColorStop(0, 'rgba(0, 245, 160, 0.25)');
        haloGrad.addColorStop(0.6, 'rgba(0, 245, 160, 0.08)');
        haloGrad.addColorStop(1, 'rgba(0, 245, 160, 0)');
        ctx.fillStyle = haloGrad;
        ctx.fillRect(x, y, modPx, modPx);

        // Bioluminescent dot organism
        ctx.fillStyle = '#00f5a0';
        ctx.beginPath();
        ctx.arc(x + modPx / 2, y + modPx / 2, modPx * 0.12, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Light module: warm bioluminescent white with teal tint
        const lightGrad = ctx.createRadialGradient(
          x + modPx / 2, y + modPx / 2, 0,
          x + modPx / 2, y + modPx / 2, modPx
        );
        lightGrad.addColorStop(0, '#ffffff');
        lightGrad.addColorStop(0.8, '#d0fff0');
        lightGrad.addColorStop(1, '#a0ffe0');
        ctx.fillStyle = lightGrad;
        ctx.fillRect(x, y, modPx, modPx);
      }
    }
  }

  // Outer glow
  ctx.shadowColor = '#00f5a0';
  ctx.shadowBlur = 20;
  ctx.strokeStyle = '#00f5a0';
  ctx.lineWidth = 3;
  ctx.strokeRect(offset - 2, offset - 2, gridSize * modPx + 4, gridSize * modPx + 4);
  ctx.shadowBlur = 0;
}

// ========================================================================
// THEME 3: MATRIX CODE RAIN
// Black background, green glyphs raining down, digital terminal feel
// ========================================================================

function renderMatrix(ctx, modules, gridSize, size, modPx, offset) {
  // Background: pure black
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, size, size);

  // Vertical rain streaks in background
  ctx.fillStyle = 'rgba(0, 255, 65, 0.04)';
  const rainSeed = frameCount * 3;
  for (let col = 0; col < 30; col++) {
    const rx = ((rainSeed + col * 97) % size);
    const ry = ((rainSeed * (col + 1) * 13) % size);
    const rh = 30 + (col * 17) % 120;
    ctx.fillRect(rx, ry, 3, rh);
  }

  // Render falling glyph column traces
  ctx.font = `${Math.max(8, modPx * 0.6)}px monospace`;
  ctx.fillStyle = 'rgba(0, 255, 65, 0.07)';
  for (let c = 0; c < gridSize; c += 3) {
    const gx = offset + c * modPx + modPx * 0.3;
    for (let r = 0; r < gridSize; r++) {
      const gy = offset + r * modPx + modPx * 0.7;
      const glyphIdx = (frameCount + r * 7 + c * 13) % MATRIX_GLYPHS.length;
      ctx.fillText(MATRIX_GLYPHS[glyphIdx], gx, gy);
    }
  }

  // Render modules
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const x = offset + col * modPx;
      const y = offset + row * modPx;
      const dark = modules[row][col];

      if (dark) {
        // Dark module: black with bright green glyph stamped on top
        ctx.fillStyle = '#000000';
        ctx.fillRect(x, y, modPx, modPx);

        // Green glyph character
        const gi = (row * gridSize + col + frameCount) % MATRIX_GLYPHS.length;
        ctx.fillStyle = '#00ff41';
        ctx.font = `bold ${Math.max(10, modPx * 0.75)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(MATRIX_GLYPHS[gi], x + modPx / 2, y + modPx / 2);
        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';

        // Green border
        ctx.strokeStyle = 'rgba(0, 255, 65, 0.3)';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(x, y, modPx, modPx);
      } else {
        // Light module: bright green-white terminal glow
        const lightGrad = ctx.createLinearGradient(x, y, x, y + modPx);
        lightGrad.addColorStop(0, '#e0ffe0');
        lightGrad.addColorStop(0.5, '#ffffff');
        lightGrad.addColorStop(1, '#c0ffc0');
        ctx.fillStyle = lightGrad;
        ctx.fillRect(x, y, modPx, modPx);
      }
    }
  }

  // Outer frame: green terminal border
  ctx.shadowColor = '#00ff41';
  ctx.shadowBlur = 12;
  ctx.strokeStyle = '#00ff41';
  ctx.lineWidth = 2;
  ctx.strokeRect(offset - 2, offset - 2, gridSize * modPx + 4, gridSize * modPx + 4);
  ctx.shadowBlur = 0;

  // Scanline effect
  const scanY = (frameCount * 4) % size;
  ctx.fillStyle = 'rgba(0, 255, 65, 0.06)';
  ctx.fillRect(0, scanY, size, 3);
}

// ========================================================================
// THEME 4: NEON STENCIL MOSAIC
// Deep purple base, vivid pink/purple/blue neon gradients, geometric shapes
// ========================================================================

function renderMosaic(ctx, modules, gridSize, size, modPx, offset) {
  // Background: deep purple-black
  const bgGrad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size * 0.8);
  bgGrad.addColorStop(0, '#1a0533');
  bgGrad.addColorStop(0.5, '#0d0220');
  bgGrad.addColorStop(1, '#050010');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, size, size);

  // Decorative diagonal neon streaks
  ctx.globalAlpha = 0.06;
  for (let i = 0; i < 8; i++) {
    const streakGrad = ctx.createLinearGradient(0, i * size / 8, size, i * size / 8 + size / 4);
    streakGrad.addColorStop(0, '#ff007f');
    streakGrad.addColorStop(0.5, '#7f00ff');
    streakGrad.addColorStop(1, '#00aaff');
    ctx.fillStyle = streakGrad;
    ctx.fillRect(0, i * size / 8, size, size / 16);
  }
  ctx.globalAlpha = 1;

  // Render modules
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const x = offset + col * modPx;
      const y = offset + row * modPx;
      const dark = modules[row][col];
      const inset = modPx * 0.08;

      if (dark) {
        // Dark module: deep purple with vivid neon border
        ctx.fillStyle = '#0a0018';
        ctx.fillRect(x, y, modPx, modPx);

        // Neon gradient border — color shifts based on position
        const hue = ((col + row) * 25 + frameCount * 5) % 360;
        ctx.strokeStyle = `hsl(${hue}, 100%, 60%)`;
        ctx.lineWidth = 1.8;
        ctx.strokeRect(x + inset, y + inset, modPx - inset * 2, modPx - inset * 2);

        // Inner diamond shape
        const cx = x + modPx / 2;
        const cy = y + modPx / 2;
        const r = modPx * 0.22;
        ctx.fillStyle = `hsla(${hue}, 100%, 55%, 0.5)`;
        ctx.beginPath();
        ctx.moveTo(cx, cy - r);
        ctx.lineTo(cx + r, cy);
        ctx.lineTo(cx, cy + r);
        ctx.lineTo(cx - r, cy);
        ctx.closePath();
        ctx.fill();
      } else {
        // Light module: vibrant gradient fill (pink → blue shifts by position)
        const hue1 = ((col + row) * 20) % 360;
        const lightGrad = ctx.createLinearGradient(x, y, x + modPx, y + modPx);
        lightGrad.addColorStop(0, `hsl(${hue1}, 30%, 95%)`);
        lightGrad.addColorStop(0.5, '#ffffff');
        lightGrad.addColorStop(1, `hsl(${(hue1 + 60) % 360}, 30%, 92%)`);
        ctx.fillStyle = lightGrad;
        ctx.fillRect(x, y, modPx, modPx);
      }
    }
  }

  // Outer glow border: magenta-purple
  ctx.shadowColor = '#ff007f';
  ctx.shadowBlur = 18;
  ctx.strokeStyle = '#ff007f';
  ctx.lineWidth = 3;
  ctx.strokeRect(offset - 2, offset - 2, gridSize * modPx + 4, gridSize * modPx + 4);
  ctx.shadowBlur = 0;

  // Second outer border: blue offset
  ctx.strokeStyle = 'rgba(0, 170, 255, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(offset - 5, offset - 5, gridSize * modPx + 10, gridSize * modPx + 10);
}
