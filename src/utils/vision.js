/**
 * LuxSync Receiver Vision Engine
 * Real-time canvas optical reader, marker detector, and color sampling pipeline.
 */

import { PALETTES, decodeFrameBytes } from './protocol.js';

/**
 * Finds closest color index in palette given sampled [R, G, B]
 */
export function findClosestColor(sampledRgb, bitsPerCell) {
  const palette = PALETTES[bitsPerCell] || PALETTES[1];
  let minDistance = Infinity;
  let closestIndex = 0;

  for (let i = 0; i < palette.length; i++) {
    const target = palette[i];
    const dr = sampledRgb[0] - target[0];
    const dg = sampledRgb[1] - target[1];
    const db = sampledRgb[2] - target[2];
    // Weighted Euclidean distance for human perception / camera RGB sensor response
    const dist = (dr * dr * 0.3) + (dg * dg * 0.59) + (db * db * 0.11);
    
    if (dist < minDistance) {
      minDistance = dist;
      closestIndex = i;
    }
  }

  return closestIndex;
}

/**
 * Scans video/canvas ImageData for optical grid pattern and extracts frame bytes
 */
export class VisionScanner {
  constructor(gridSize = 16, bitsPerCell = 2) {
    this.gridSize = gridSize;
    this.bitsPerCell = bitsPerCell;
  }

  setParams(gridSize, bitsPerCell) {
    this.gridSize = gridSize;
    this.bitsPerCell = bitsPerCell;
  }

  /**
   * Process a single video frame / canvas context
   * Returns: { success: boolean, frame: decodedFrameObject, corners: Array of [x, y] }
   */
  processFrame(ctx, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // 1. Locate alignment bounds
    // In camera view or loopback view, we locate the pattern bounding region
    const bounds = this.findGridBounds(data, width, height);
    if (!bounds) {
      return { success: false, reason: 'No pattern detected' };
    }

    const { minX, minY, maxX, maxY } = bounds;
    const patternWidth = maxX - minX;
    const patternHeight = maxY - minY;

    if (patternWidth < 40 || patternHeight < 40) {
      return { success: false, reason: 'Pattern too small' };
    }

    const cellSizeX = patternWidth / this.gridSize;
    const cellSizeY = patternHeight / this.gridSize;

    // 2. Sample cells and extract bit sequence
    const bits = [];

    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        // Skip corner anchors & border sync track
        const isTopLeftAnchor = (row < 3 && col < 3);
        const isTopRightAnchor = (row < 3 && col >= this.gridSize - 3);
        const isBottomLeftAnchor = (row >= this.gridSize - 3 && col < 3);
        const isBottomRightAnchor = (row >= this.gridSize - 3 && col >= this.gridSize - 3);
        const isBorder = (row === 0 || row === this.gridSize - 1 || col === 0 || col === this.gridSize - 1);

        if (isTopLeftAnchor || isTopRightAnchor || isBottomLeftAnchor || isBottomRightAnchor || isBorder) {
          continue;
        }

        // Sample center pixel of cell
        const sampleX = Math.floor(minX + (col + 0.5) * cellSizeX);
        const sampleY = Math.floor(minY + (row + 0.5) * cellSizeY);

        if (sampleX >= 0 && sampleX < width && sampleY >= 0 && sampleY < height) {
          const pixelIdx = (sampleY * width + sampleX) * 4;
          const sampledRgb = [data[pixelIdx], data[pixelIdx + 1], data[pixelIdx + 2]];

          const colorIdx = findClosestColor(sampledRgb, this.bitsPerCell);

          // Convert color index to bits
          for (let b = this.bitsPerCell - 1; b >= 0; b--) {
            const bit = (colorIdx >> b) & 1;
            bits.push(bit);
          }
        }
      }
    }

    // 3. Convert bit stream to Uint8Array
    const bytes = new Uint8Array(Math.floor(bits.length / 8));
    for (let i = 0; i < bytes.length; i++) {
      let b = 0;
      for (let bitIdx = 0; bitIdx < 8; bitIdx++) {
        b = (b << 1) | bits[i * 8 + bitIdx];
      }
      bytes[i] = b;
    }

    // 4. Decode header and payload
    const decodedFrame = decodeFrameBytes(bytes);

    if (!decodedFrame) {
      return { 
        success: false, 
        reason: 'CRC error or header mismatch',
        corners: [[minX, minY], [maxX, minY], [maxX, maxY], [minX, maxY]] 
      };
    }

    return {
      success: true,
      frame: decodedFrame,
      corners: [[minX, minY], [maxX, minY], [maxX, maxY], [minX, maxY]]
    };
  }

  /**
   * Fast spatial grid bounding box finder
   */
  findGridBounds(data, width, height) {
    // Look for Cyan/Blue outer border stroke (#00f2fe) or high contrast boundary
    let minX = width, minY = height, maxX = 0, maxY = 0;
    let count = 0;

    // Subsample scan for speed
    const step = 4;
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // Detect high-contrast neon cyan border (#00f2fe: R<50, G>200, B>200) or Red Anchor (#FF0033: R>200, G<50, B<80)
        const isCyanBorder = (r < 80 && g > 180 && b > 180);
        const isRedAnchor = (r > 200 && g < 80 && b < 100);

        if (isCyanBorder || isRedAnchor) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          count++;
        }
      }
    }

    // Fallback: If full frame pattern (e.g. clean canvas loopback mode)
    if (count < 20) {
      // Check centered bounding box fallback
      const size = Math.floor(Math.min(width, height) * 0.85);
      minX = Math.floor((width - size) / 2);
      minY = Math.floor((height - size) / 2);
      maxX = minX + size;
      maxY = minY + size;
      return { minX, minY, maxX, maxY };
    }

    return { minX, minY, maxX, maxY };
  }
}
