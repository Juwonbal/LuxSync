/**
 * LuxSync Generative Steganography Engine
 * Blends QR code data matrix into artistic generative canvas themes
 * (Cyberpunk Circuitry, Bioluminescent Grid, Matrix Code, Neon Mosaic).
 */

import QRCode from 'qrcode';

export const ART_THEMES = {
  standard: { name: 'Standard QR', desc: 'Classic black & white QR' },
  cyberpunk: { name: '⚡ Cyberpunk Circuitry', desc: 'Glowing neon circuitry & metallic tiles' },
  bioluminescent: { name: '🌌 Bioluminescent Grid', desc: 'Deep ocean neon teal & emerald glow' },
  matrix: { name: '💚 Matrix Code Rain', desc: 'Digital code rain & green glyph stencils' },
  mosaic: { name: '🎨 Neon Stencil Mosaic', desc: 'Vivid geometric mosaic gradients' }
};

/**
 * Renders a QR code with chosen Steganographic Art Theme onto a canvas
 */
export async function renderSteganographicQR(canvas, payload, themeKey = 'cyberpunk') {
  if (themeKey === 'standard') {
    await QRCode.toCanvas(canvas, payload, {
      width: canvas.width,
      margin: 3,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'M'
    });
    return;
  }

  // 1. Generate standard QR data matrix on an offscreen canvas
  const offscreen = document.createElement('canvas');
  const size = canvas.width;
  offscreen.width = size;
  offscreen.height = size;

  await QRCode.toCanvas(offscreen, payload, {
    width: size,
    margin: 3,
    color: { dark: '#000000', light: '#ffffff' },
    errorCorrectionLevel: 'M'
  });

  const offCtx = offscreen.getContext('2d');
  const qrImageData = offCtx.getImageData(0, 0, size, size);
  const qrData = qrImageData.data;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);

  // 2. Draw Generative Background Art depending on theme
  drawThemeBackground(ctx, size, themeKey);

  // 3. Composite QR Matrix into Generative Art Layer
  // Sample QR pixels: dark QR pixels map to artistic shadow/metal tiles, light QR pixels map to bright glowing art tiles
  const step = 4;
  for (let y = 0; y < size; y += step) {
    for (let x = 0; x < size; x += step) {
      const idx = (y * size + x) * 4;
      const isDark = qrData[idx] < 128; // Dark QR module

      if (isDark) {
        // Render Dark Module with Theme Stencil
        drawDarkModule(ctx, x, y, step, themeKey);
      } else {
        // Render Light Module with Theme Stencil
        drawLightModule(ctx, x, y, step, themeKey);
      }
    }
  }

  // 4. Draw high-contrast outer frame border
  ctx.strokeStyle = themeKey === 'cyberpunk' ? '#00f2fe' : (themeKey === 'bioluminescent' ? '#00f5a0' : '#00ff66');
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, size - 4, size - 4);
}

function drawThemeBackground(ctx, size, theme) {
  if (theme === 'cyberpunk') {
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, '#070a12');
    grad.addColorStop(0.5, '#0f172a');
    grad.addColorStop(1, '#070a12');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Draw decorative circuit lines
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.15)';
    ctx.lineWidth = 1.5;
    for (let i = 20; i < size; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0); ctx.lineTo(i, size);
      ctx.moveTo(0, i); ctx.lineTo(size, i);
      ctx.stroke();
    }
  } else if (theme === 'bioluminescent') {
    ctx.fillStyle = '#031016';
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = 'rgba(0, 245, 160, 0.12)';
    ctx.lineWidth = 1;
    for (let i = 0; i < size; i += 30) {
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, i, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (theme === 'matrix') {
    ctx.fillStyle = '#000800';
    ctx.fillRect(0, 0, size, size);
  } else {
    // Mosaic
    const grad = ctx.createRadialGradient(size/2, size/2, 10, size/2, size/2, size);
    grad.addColorStop(0, '#1a0b2e');
    grad.addColorStop(1, '#05020a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
}

function drawDarkModule(ctx, x, y, step, theme) {
  if (theme === 'cyberpunk') {
    ctx.fillStyle = '#090d16';
    ctx.fillRect(x, y, step, step);
    ctx.fillStyle = 'rgba(0, 242, 254, 0.08)';
    ctx.fillRect(x + 1, y + 1, step - 2, step - 2);
  } else if (theme === 'bioluminescent') {
    ctx.fillStyle = '#02181a';
    ctx.fillRect(x, y, step, step);
  } else if (theme === 'matrix') {
    ctx.fillStyle = '#001400';
    ctx.fillRect(x, y, step, step);
  } else {
    ctx.fillStyle = '#120824';
    ctx.fillRect(x, y, step, step);
  }
}

function drawLightModule(ctx, x, y, step, theme) {
  if (theme === 'cyberpunk') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y, step, step);
  } else if (theme === 'bioluminescent') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y, step, step);
  } else if (theme === 'matrix') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y, step, step);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y, step, step);
  }
}
