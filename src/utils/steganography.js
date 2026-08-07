/**
 * LuxSync Generative Steganography Engine v4
 * Production-Grade: Safe QR payload handling (error-level 'L' for max data capacity),
 * synchronous rendering, high-contrast finder patterns.
 */

import QRCode from 'qrcode';

export const ART_THEMES = {
  standard:       { name: 'Standard B&W QR',           emoji: '⬜' },
  cyberpunk:      { name: '⚡ Cyberpunk Circuitry',     emoji: '⚡' },
  bioluminescent: { name: '🌌 Bioluminescent Grid',     emoji: '🌌' },
  matrix:         { name: '💚 Matrix Code Rain',        emoji: '💚' },
  mosaic:         { name: '🎨 Neon Stencil Mosaic',      emoji: '🎨' }
};

const MATRIX_GLYPHS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨ0123456789';
let frameCounter = 0;

/**
 * Safe Synchronous Master Render Function
 */
export function renderSteganographicQR(canvas, payload, themeKey = 'cyberpunk') {
  frameCounter++;
  const ctx = canvas.getContext('2d');
  const size = canvas.width;

  if (themeKey === 'standard') {
    try {
      QRCode.toCanvas(canvas, payload, {
        width: size, margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'L'
      });
    } catch (e) {
      console.warn('Standard QR render error:', e);
    }
    return;
  }

  // 1. Generate QR matrix data safely
  let qr;
  try {
    qr = QRCode.create(payload, { errorCorrectionLevel: 'L' });
  } catch (e) {
    // If payload exceeds capacity, fallback gracefully
    console.warn('Payload exceeds QR capacity, falling back:', e);
    try {
      QRCode.toCanvas(canvas, payload, { width: size, margin: 2, errorCorrectionLevel: 'L' });
    } catch (err) {}
    return;
  }

  const gridSize = qr.modules.size;
  const modules = qr.modules.data; // 1 = dark, 0 = light

  const margin = 2;
  const totalGrid = gridSize + margin * 2;
  const modPx = size / totalGrid;
  const offset = margin * modPx;

  ctx.clearRect(0, 0, size, size);

  // 2. Render Theme Background
  renderBackground(ctx, size, themeKey);

  // 3. Render Modules
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const isDark = modules[r * gridSize + c] === 1;
      const x = offset + c * modPx;
      const y = offset + r * modPx;

      const isFinder = isFinderPattern(r, c, gridSize);

      if (isFinder) {
        ctx.fillStyle = isDark ? getFinderDarkColor(themeKey) : '#ffffff';
        ctx.fillRect(x, y, modPx + 0.5, modPx + 0.5);
      } else {
        renderArtModule(ctx, x, y, modPx, isDark, r, c, gridSize, themeKey);
      }
    }
  }

  // 4. Outer Accent Border
  renderOuterBorder(ctx, size, offset, gridSize * modPx, themeKey);
}

function isFinderPattern(r, c, size) {
  if (r < 7 && c < 7) return true;
  if (r < 7 && c >= size - 7) return true;
  if (r >= size - 7 && c < 7) return true;
  return false;
}

function getFinderDarkColor(theme) {
  switch (theme) {
    case 'cyberpunk': return '#00f2fe';
    case 'bioluminescent': return '#00f5a0';
    case 'matrix': return '#00ff41';
    case 'mosaic': return '#ff007f';
    default: return '#000000';
  }
}

function renderBackground(ctx, size, theme) {
  switch (theme) {
    case 'cyberpunk': {
      const g = ctx.createLinearGradient(0, 0, size, size);
      g.addColorStop(0, '#040914');
      g.addColorStop(1, '#0a1628');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);

      ctx.strokeStyle = 'rgba(0, 242, 254, 0.12)';
      ctx.lineWidth = 1;
      for (let i = 0; i < size; i += 24) {
        ctx.beginPath();
        ctx.moveTo(i, 0); ctx.lineTo(i, size);
        ctx.moveTo(0, i); ctx.lineTo(size, i);
        ctx.stroke();
      }
      break;
    }
    case 'bioluminescent': {
      ctx.fillStyle = '#010f12';
      ctx.fillRect(0, 0, size, size);

      const cx = size / 2, cy = size / 2;
      for (let r = 20; r < size; r += 40) {
        ctx.strokeStyle = 'rgba(0, 245, 160, 0.08)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }
    case 'matrix': {
      ctx.fillStyle = '#000c00';
      ctx.fillRect(0, 0, size, size);
      break;
    }
    case 'mosaic': {
      const g = ctx.createRadialGradient(size/2, size/2, 10, size/2, size/2, size);
      g.addColorStop(0, '#1c053a');
      g.addColorStop(1, '#080114');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
      break;
    }
  }
}

function renderArtModule(ctx, x, y, modPx, isDark, r, c, gridSize, theme) {
  if (isDark) {
    switch (theme) {
      case 'cyberpunk':
        ctx.fillStyle = '#081220';
        ctx.fillRect(x, y, modPx + 0.5, modPx + 0.5);
        ctx.strokeStyle = 'rgba(0, 242, 254, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 1, y + 1, modPx - 2, modPx - 2);
        break;

      case 'bioluminescent':
        ctx.fillStyle = '#031c20';
        ctx.fillRect(x, y, modPx + 0.5, modPx + 0.5);
        ctx.fillStyle = '#00f5a0';
        ctx.beginPath();
        ctx.arc(x + modPx / 2, y + modPx / 2, modPx * 0.25, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'matrix':
        ctx.fillStyle = '#000000';
        ctx.fillRect(x, y, modPx + 0.5, modPx + 0.5);
        ctx.fillStyle = '#00ff41';
        ctx.font = `bold ${Math.max(9, modPx * 0.7)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const glyph = MATRIX_GLYPHS[(r * gridSize + c + frameCounter) % MATRIX_GLYPHS.length];
        ctx.fillText(glyph, x + modPx / 2, y + modPx / 2);
        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';
        break;

      case 'mosaic':
        ctx.fillStyle = '#120228';
        ctx.fillRect(x, y, modPx + 0.5, modPx + 0.5);
        const hue = ((r + c) * 15 + frameCounter * 4) % 360;
        ctx.strokeStyle = `hsl(${hue}, 100%, 60%)`;
        ctx.lineWidth = 1.2;
        ctx.strokeRect(x + 1, y + 1, modPx - 2, modPx - 2);
        break;
    }
  } else {
    switch (theme) {
      case 'cyberpunk':
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, y, modPx + 0.5, modPx + 0.5);
        break;

      case 'bioluminescent':
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, y, modPx + 0.5, modPx + 0.5);
        break;

      case 'matrix':
        ctx.fillStyle = '#e8ffe8';
        ctx.fillRect(x, y, modPx + 0.5, modPx + 0.5);
        break;

      case 'mosaic':
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, y, modPx + 0.5, modPx + 0.5);
        break;
    }
  }
}

function renderOuterBorder(ctx, size, offset, qrDimension, theme) {
  let color = '#00f2fe';
  if (theme === 'bioluminescent') color = '#00f5a0';
  if (theme === 'matrix') color = '#00ff41';
  if (theme === 'mosaic') color = '#ff007f';

  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.strokeRect(offset - 2, offset - 2, qrDimension + 4, qrDimension + 4);
}
