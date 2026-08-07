/**
 * LuxSync Optical Framing & Color Protocol
 */

import { crc16 } from './crc.js';

// Color Palette Definitions
export const PALETTES = {
  // 1-Bit (Binary Black/White - Maximum robustness against bad cameras & lighting)
  1: [
    [0, 0, 0],         // 0: Black
    [255, 255, 255]    // 1: White
  ],
  // 2-Bit (4 High-Contrast Colors - 2x Density Boost)
  2: [
    [0, 0, 0],         // 0: Black
    [0, 229, 255],     // 1: Vivid Cyan
    [255, 0, 85],      // 2: Vivid Magenta / Red
    [255, 255, 255]    // 3: White
  ],
  // 3-Bit (8 Distinct RGB Colors - 3x Density Boost)
  3: [
    [0, 0, 0],         // 0: Black
    [255, 0, 0],       // 1: Red
    [0, 255, 0],       // 2: Green
    [0, 0, 255],       // 3: Blue
    [0, 255, 255],     // 4: Cyan
    [255, 0, 255],     // 5: Magenta
    [255, 255, 0],     // 6: Yellow
    [255, 255, 255]    // 7: White
  ]
};

// Convert RGB array to hex string for HTML Canvas fillStyle
export function rgbToHex(rgb) {
  return `#${((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1)}`;
}

/**
 * Calculates max payload bytes supported in a grid frame given grid size & color bits
 */
export function getGridCapacity(gridSize, bitsPerCell) {
  const totalCells = gridSize * gridSize;
  // Reserve 4 corners (4 x 9 cells) + borders for alignment
  const anchorCells = 36; 
  const borderCells = (gridSize - 6) * 4;
  const usableCells = Math.max(0, totalCells - anchorCells - borderCells);

  const totalBits = usableCells * bitsPerCell;
  const totalBytes = Math.floor(totalBits / 8);

  // Header consumes 12 bytes: Magic(2) + Type(1) + FileID(2) + Seed(2) + K(2) + Len(1) + CRC(2)
  const headerBytes = 12;
  const payloadBytes = Math.max(0, totalBytes - headerBytes);

  return { usableCells, totalBytes, payloadBytes, headerBytes };
}

/**
 * Encodes packet header + payload into a stream of byte symbols
 */
export function encodeFrameBytes({ type, fileId, seed, K, payload, totalFileBytes }) {
  const len = payload.length;
  const header = new Uint8Array(12);

  header[0] = 0x4C; // 'L'
  header[1] = 0x58; // 'X'
  header[2] = type; // 1 = Metadata, 2 = Fountain Data
  header[3] = (fileId >> 8) & 0xff;
  header[4] = fileId & 0xff;
  header[5] = (seed >> 8) & 0xff;
  header[6] = seed & 0xff;
  header[7] = (K >> 8) & 0xff;
  header[8] = K & 0xff;
  header[9] = len & 0xff;

  // Header CRC
  const headerCrc = crc16(header.subarray(0, 10));
  header[10] = (headerCrc >> 8) & 0xff;
  header[11] = headerCrc & 0xff;

  // Combine header + payload
  const frameBytes = new Uint8Array(header.length + len);
  frameBytes.set(header, 0);
  frameBytes.set(payload, header.length);

  return frameBytes;
}

/**
 * Parses received byte array back into packet header + payload
 */
export function decodeFrameBytes(bytes) {
  if (bytes.length < 12) return null;

  if (bytes[0] !== 0x4C || bytes[1] !== 0x58) {
    return null; // Invalid magic marker
  }

  const headerCrcCalculated = crc16(bytes.subarray(0, 10));
  const headerCrcStored = (bytes[10] << 8) | bytes[11];
  if (headerCrcCalculated !== headerCrcStored) {
    return null; // Corrupted header
  }

  const type = bytes[2];
  const fileId = (bytes[3] << 8) | bytes[4];
  const seed = (bytes[5] << 8) | bytes[6];
  const K = (bytes[7] << 8) | bytes[8];
  const len = bytes[9];

  if (bytes.length < 12 + len) {
    return null; // Truncated frame
  }

  const payload = bytes.subarray(12, 12 + len);

  return { type, fileId, seed, K, len, payload };
}

/**
 * Renders an optical frame onto a Canvas context
 */
export function renderGridFrame(ctx, canvasWidth, canvasHeight, { gridSize, bitsPerCell, frameBytes }) {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  const palette = PALETTES[bitsPerCell] || PALETTES[1];
  const cellSize = Math.floor(Math.min(canvasWidth, canvasHeight) / gridSize);
  const offsetX = Math.floor((canvasWidth - cellSize * gridSize) / 2);
  const offsetY = Math.floor((canvasHeight - cellSize * gridSize) / 2);

  // Convert frameBytes into color indices
  const cellColorIndices = [];
  let byteIdx = 0;
  let bitPos = 0;

  const getBits = (numBits) => {
    if (byteIdx >= frameBytes.length) return 0;
    let val = 0;
    for (let i = 0; i < numBits; i++) {
      const bit = (frameBytes[byteIdx] >> (7 - bitPos)) & 1;
      val = (val << 1) | bit;
      bitPos++;
      if (bitPos >= 8) {
        bitPos = 0;
        byteIdx++;
      }
    }
    return val;
  };

  // Build grid map
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const x = offsetX + col * cellSize;
      const y = offsetY + row * cellSize;

      // 1. Check if Corner Alignment Anchor (3x3 blocks at 4 corners)
      const isTopLeftAnchor = (row < 3 && col < 3);
      const isTopRightAnchor = (row < 3 && col >= gridSize - 3);
      const isBottomLeftAnchor = (row >= gridSize - 3 && col < 3);
      const isBottomRightAnchor = (row >= gridSize - 3 && col >= gridSize - 3);

      if (isTopLeftAnchor || isTopRightAnchor || isBottomLeftAnchor || isBottomRightAnchor) {
        // Render concentric target anchor
        const rInAnchor = (row < 3) ? row : (row - (gridSize - 3));
        const cInAnchor = (col < 3) ? col : (col - (gridSize - 3));

        if (rInAnchor === 1 && cInAnchor === 1) {
          // Center dot: Red for visual detection
          ctx.fillStyle = '#FF0033';
        } else if (rInAnchor === 0 || rInAnchor === 2 || cInAnchor === 0 || cInAnchor === 2) {
          // Outer ring: Pure Black
          ctx.fillStyle = '#FFFFFF';
        } else {
          ctx.fillStyle = '#000000';
        }
        ctx.fillRect(x, y, cellSize, cellSize);
        continue;
      }

      // 2. Check if Border Sync Track
      const isBorder = (row === 0 || row === gridSize - 1 || col === 0 || col === gridSize - 1);
      if (isBorder) {
        // Alternating sync pattern
        ctx.fillStyle = ((row + col) % 2 === 0) ? '#FFFFFF' : '#000000';
        ctx.fillRect(x, y, cellSize, cellSize);
        continue;
      }

      // 3. Data Cell
      const colorIdx = getBits(bitsPerCell) % palette.length;
      const rgb = palette[colorIdx];
      ctx.fillStyle = rgbToHex(rgb);
      ctx.fillRect(x, y, cellSize, cellSize);
    }
  }

  // Draw bright bounding border around whole pattern
  ctx.strokeStyle = '#00f2fe';
  ctx.lineWidth = 2;
  ctx.strokeRect(offsetX, offsetY, cellSize * gridSize, cellSize * gridSize);
}
