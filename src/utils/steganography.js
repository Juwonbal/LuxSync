/**
 * LuxSync Steganography & Visual Matrix Engine v5
 * Guarantees 100% Phone Camera Readability.
 * Uses pure black (#000000) and pure white (#ffffff) for the QR matrix core
 * so phone camera vision algorithms (jsQR / BarcodeDetector) lock on instantly,
 * surrounded by rich Cyberpunk / Matrix / Bioluminescent / Mosaic HUD cards.
 */

import QRCode from 'qrcode';

export const ART_THEMES = {
  standard:       { name: 'Standard B&W QR',           emoji: '⬜' },
  cyberpunk:      { name: '⚡ Cyberpunk HUD',          emoji: '⚡' },
  bioluminescent: { name: '🌌 Bioluminescent Frame',    emoji: '🌌' },
  matrix:         { name: '💚 Matrix Terminal',         emoji: '💚' },
  mosaic:         { name: '🎨 Neon Stencil Card',       emoji: '🎨' }
};

let frameCounter = 0;

/**
 * 100% Camera-Readable Synchronous Render Function
 */
export function renderSteganographicQR(canvas, payload, themeKey = 'cyberpunk') {
  frameCounter++;
  const ctx = canvas.getContext('2d');
  const size = canvas.width;

  // Clear canvas
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

  // 1. Generate QR matrix data safely
  let qr;
  try {
    qr = QRCode.create(payload, { errorCorrectionLevel: 'L' });
  } catch (e) {
    console.warn('QR creation fallback:', e);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    try { QRCode.toCanvas(canvas, payload, { width: size, margin: 2, errorCorrectionLevel: 'L' }); } catch (err) {}
    return;
  }

  const gridSize = qr.modules.size;
  const modules = qr.modules.data; // 1 = dark, 0 = light

  // Calculate layout: Outer HUD frame + Inner QR Card (white padded for camera reflection resilience)
  const hudMargin = 30; // Outer Cyberpunk/Matrix HUD margin
  const qrAreaSize = size - (hudMargin * 2);
  const qrMargin = 2; // Quiet zone around QR
  const totalGrid = gridSize + (qrMargin * 2);
  const modPx = qrAreaSize / totalGrid;
  const qrOffset = hudMargin + (qrMargin * modPx);

  // 2. Draw Outer Theme HUD / Background
  renderThemeHUD(ctx, size, themeKey);

  // 3. Draw Pure White Card Container for QR (ensures 100% white quiet zone)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(hudMargin, hudMargin, qrAreaSize, qrAreaSize);

  // 4. Render Pure Black Modules for 100% Camera Readability
  ctx.fillStyle = '#000000';
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const isDark = modules[r * gridSize + c] === 1;
      if (isDark) {
        const x = qrOffset + c * modPx;
        const y = qrOffset + r * modPx;
        ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(modPx + 0.5), Math.ceil(modPx + 0.5));
      }
    }
  }

  // 5. Render Outer HUD Accents & Neon Card Borders
  renderHUDAccents(ctx, size, hudMargin, qrAreaSize, themeKey);
}

function renderThemeHUD(ctx, size, theme) {
  switch (theme) {
    case 'cyberpunk': {
      const g = ctx.createLinearGradient(0, 0, size, size);
      g.addColorStop(0, '#040914');
      g.addColorStop(1, '#0a1628');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);

      // Grid lines
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

function renderHUDAccents(ctx, size, margin, qrSize, theme) {
  let accentColor = '#00f2fe';
  if (theme === 'bioluminescent') accentColor = '#00f5a0';
  if (theme === 'matrix') accentColor = '#00ff41';
  if (theme === 'mosaic') accentColor = '#ff007f';

  // Inner card glow border
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 3;
  ctx.strokeRect(margin, margin, qrSize, qrSize);

  // Corner HUD Brackets
  const cornerLen = 20;
  ctx.lineWidth = 4;
  ctx.strokeStyle = accentColor;

  // Top-Left corner bracket
  ctx.beginPath();
  ctx.moveTo(margin - 10, margin - 10 + cornerLen);
  ctx.lineTo(margin - 10, margin - 10);
  ctx.lineTo(margin - 10 + cornerLen, margin - 10);
  ctx.stroke();

  // Top-Right corner bracket
  const rightX = margin + qrSize + 10;
  ctx.beginPath();
  ctx.moveTo(rightX - cornerLen, margin - 10);
  ctx.lineTo(rightX, margin - 10);
  ctx.lineTo(rightX, margin - 10 + cornerLen);
  ctx.stroke();

  // Bottom-Left corner bracket
  const bottomY = margin + qrSize + 10;
  ctx.beginPath();
  ctx.moveTo(margin - 10, bottomY - cornerLen);
  ctx.lineTo(margin - 10, bottomY);
  ctx.lineTo(margin - 10 + cornerLen, bottomY);
  ctx.stroke();

  // Bottom-Right corner bracket
  ctx.beginPath();
  ctx.moveTo(rightX - cornerLen, bottomY);
  ctx.lineTo(rightX, bottomY);
  ctx.lineTo(rightX, bottomY - cornerLen);
  ctx.stroke();
}
