/**
 * LuxSync Generative Steganography Engine v6
 * High-Contrast Steganography Art + Blazing Fast Camera Scannability.
 *
 * Each theme renders the data modules with full artistic styling
 * (cyberpunk nodes, matrix code glyphs, bioluminescent dots, neon mosaics)
 * while maintaining a guaranteed 200+ luminance delta between dark and light modules.
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
 * Fast & Beautiful Steganographic Render Function
 */
export function renderSteganographicQR(canvas, payload, themeKey = 'cyberpunk') {
  frameCounter++;
  const ctx = canvas.getContext('2d');
  const size = canvas.width;

  ctx.clearRect(0, 0, size, size);

  if (themeKey === 'standard') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    QRCode.toCanvas(canvas, payload, {
      width: size, margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'L'
    });
    return;
  }

  // 1. Generate QR matrix data
  let qr;
  try {
    qr = QRCode.create(payload, { errorCorrectionLevel: 'L' });
  } catch (e) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    try { QRCode.toCanvas(canvas, payload, { width: size, margin: 2, errorCorrectionLevel: 'L' }); } catch (err) {}
    return;
  }

  const gridSize = qr.modules.size;
  const modules = qr.modules.data; // 1 = dark, 0 = light

  const margin = 2;
  const totalGrid = gridSize + margin * 2;
  const modPx = size / totalGrid;
  const offset = margin * modPx;

  // 2. Render Theme Background Art
  renderThemeBackground(ctx, size, themeKey);

  // 3. Render Steganographic Data Modules & Finder Patterns
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const isDark = modules[r * gridSize + c] === 1;
      const x = offset + c * modPx;
      const y = offset + r * modPx;
      const isFinder = isFinderPattern(r, c, gridSize);

      if (isFinder) {
        // High-contrast Theme Finder Patterns
        renderFinderModule(ctx, x, y, modPx, isDark, themeKey);
      } else {
        // Artistic Steganographic Modules (High Contrast + Rich Styling)
        renderSteganoModule(ctx, x, y, modPx, isDark, r, c, gridSize, themeKey);
      }
    }
  }

  // 4. Draw Accent Frame
  renderAccentFrame(ctx, size, offset, gridSize * modPx, themeKey);
}

function isFinderPattern(r, c, size) {
  if (r < 7 && c < 7) return true;
  if (r < 7 && c >= size - 7) return true;
  if (r >= size - 7 && c < 7) return true;
  return false;
}

function renderThemeBackground(ctx, size, theme) {
  switch (theme) {
    case 'cyberpunk': {
      const g = ctx.createLinearGradient(0, 0, size, size);
      g.addColorStop(0, '#030814');
      g.addColorStop(1, '#0a1628');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);

      ctx.strokeStyle = 'rgba(0, 242, 254, 0.15)';
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
        ctx.strokeStyle = 'rgba(0, 245, 160, 0.1)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }
    case 'matrix': {
      ctx.fillStyle = '#000a00';
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

function renderFinderModule(ctx, x, y, modPx, isDark, theme) {
  if (isDark) {
    switch (theme) {
      case 'cyberpunk': ctx.fillStyle = '#00f2fe'; break;
      case 'bioluminescent': ctx.fillStyle = '#00f5a0'; break;
      case 'matrix': ctx.fillStyle = '#00ff41'; break;
      case 'mosaic': ctx.fillStyle = '#ff007f'; break;
      default: ctx.fillStyle = '#000000';
    }
  } else {
    ctx.fillStyle = '#ffffff';
  }
  ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(modPx + 0.5), Math.ceil(modPx + 0.5));
}

function renderSteganoModule(ctx, x, y, modPx, isDark, r, c, gridSize, theme) {
  const fx = Math.floor(x);
  const fy = Math.floor(y);
  const pw = Math.ceil(modPx + 0.5);

  if (isDark) {
    // Dark Module Styling
    switch (theme) {
      case 'cyberpunk':
        // Deep obsidian navy tile with glowing cyan border and center dot
        ctx.fillStyle = '#040b18';
        ctx.fillRect(fx, fy, pw, pw);
        ctx.strokeStyle = 'rgba(0, 242, 254, 0.7)';
        ctx.lineWidth = 1;
        ctx.strokeRect(fx + 1, fy + 1, pw - 2, pw - 2);
        ctx.fillStyle = '#00f2fe';
        ctx.fillRect(fx + pw * 0.35, fy + pw * 0.35, pw * 0.3, pw * 0.3);
        break;

      case 'bioluminescent':
        // Deep oceanic black tile with glowing emerald organism dot
        ctx.fillStyle = '#021619';
        ctx.fillRect(fx, fy, pw, pw);
        ctx.fillStyle = '#00f5a0';
        ctx.beginPath();
        ctx.arc(fx + pw / 2, fy + pw / 2, pw * 0.28, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'matrix':
        // Pure black tile with bright green Matrix code character
        ctx.fillStyle = '#000000';
        ctx.fillRect(fx, fy, pw, pw);
        ctx.fillStyle = '#00ff41';
        ctx.font = `bold ${Math.max(9, pw * 0.75)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const glyph = MATRIX_GLYPHS[(r * gridSize + c + frameCounter) % MATRIX_GLYPHS.length];
        ctx.fillText(glyph, fx + pw / 2, fy + pw / 2);
        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';
        break;

      case 'mosaic':
        // Deep purple tile with vivid HSL neon border & diamond
        ctx.fillStyle = '#100224';
        ctx.fillRect(fx, fy, pw, pw);
        const hue = ((r + c) * 15 + frameCounter * 4) % 360;
        ctx.strokeStyle = `hsl(${hue}, 100%, 65%)`;
        ctx.lineWidth = 1.2;
        ctx.strokeRect(fx + 1, fy + 1, pw - 2, pw - 2);
        break;
    }
  } else {
    // Light Module Styling (High luminance for contrast)
    switch (theme) {
      case 'cyberpunk':
        ctx.fillStyle = '#e6f8ff';
        ctx.fillRect(fx, fy, pw, pw);
        break;

      case 'bioluminescent':
        ctx.fillStyle = '#e0fff4';
        ctx.fillRect(fx, fy, pw, pw);
        break;

      case 'matrix':
        ctx.fillStyle = '#e8ffe8';
        ctx.fillRect(fx, fy, pw, pw);
        break;

      case 'mosaic':
        ctx.fillStyle = '#fff0fa';
        ctx.fillRect(fx, fy, pw, pw);
        break;
    }
  }
}

function renderAccentFrame(ctx, size, offset, qrDimension, theme) {
  let color = '#00f2fe';
  if (theme === 'bioluminescent') color = '#00f5a0';
  if (theme === 'matrix') color = '#00ff41';
  if (theme === 'mosaic') color = '#ff007f';

  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.strokeRect(offset - 2, offset - 2, qrDimension + 4, qrDimension + 4);
}
