/**
 * Soliton Fountain Code Engine (Luby / LT Code Implementation)
 * Enables resilient broadcast file transfer over lossy visual optical channels.
 */

// PRNG: Mulberry32 for deterministic random seed generation
function mulberry32(seed) {
  return function() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Generate degree distribution based on Ideal/Robust Soliton distribution
export function getSolitonDegree(randomFunc, K) {
  if (K <= 1) return 1;

  // Simplified Robust Soliton Sampling
  const r = randomFunc();
  if (r < 0.35) return 1;           // 35% chance of degree 1 (for fast peeling bootup)
  if (r < 0.65) return 2;           // 30% chance of degree 2
  if (r < 0.85) return Math.min(3, K); // 20% chance of degree 3
  if (r < 0.95) return Math.min(Math.floor(K * 0.2) + 2, K);

  // Remainder: larger degree for dense coverage
  const maxDeg = Math.min(K, Math.floor(K * 0.5) + 3);
  return Math.min(K, Math.floor(randomFunc() * (maxDeg - 1)) + 1);
}

/**
 * Given K total blocks and a 16-bit seed, returns the array of source block indices
 */
export function getBlockIndices(seed, K) {
  const rng = mulberry32(seed);
  const degree = getSolitonDegree(rng, K);

  const indices = new Set();
  // Fisher-Yates style deterministic selection
  while (indices.size < degree) {
    const idx = Math.floor(rng() * K);
    indices.add(idx);
  }

  return Array.from(indices);
}

/**
 * Fountain Encoder
 */
export class FountainEncoder {
  constructor(fileBytes, blockSize = 64) {
    this.fileBytes = fileBytes;
    this.blockSize = blockSize;
    this.totalBytes = fileBytes.length;
    this.K = Math.ceil(this.totalBytes / blockSize);

    // Prepare fixed-size source blocks
    this.sourceBlocks = new Array(this.K);
    for (let i = 0; i < this.K; i++) {
      const block = new Uint8Array(blockSize);
      const start = i * blockSize;
      const end = Math.min(start + blockSize, this.totalBytes);
      block.set(fileBytes.subarray(start, end));
      this.sourceBlocks[i] = block;
    }

    this.currentSeed = 1;
  }

  /**
   * Produce next fountain packet (drop)
   */
  generatePacket(forcedSeed = null) {
    const seed = forcedSeed !== null ? forcedSeed : (this.currentSeed++ & 0xffff);
    const indices = getBlockIndices(seed, this.K);
    const payload = new Uint8Array(this.blockSize);

    // XOR source blocks together
    for (const idx of indices) {
      const src = this.sourceBlocks[idx];
      for (let b = 0; b < this.blockSize; b++) {
        payload[b] ^= src[b];
      }
    }

    return {
      seed,
      K: this.K,
      blockSize: this.blockSize,
      totalBytes: this.totalBytes,
      indices,
      payload
    };
  }
}

/**
 * Fountain Decoder using Real-time Belief Propagation (Peeling Algorithm)
 */
export class FountainDecoder {
  constructor(K, blockSize, totalBytes) {
    this.K = K;
    this.blockSize = blockSize;
    this.totalBytes = totalBytes;

    this.decodedBlocks = new Array(K).fill(null); // Uint8Array or null
    this.decodedCount = 0;
    
    // Store unprocessed equations (drops with degree > 1)
    this.pendingDrops = []; // { indices: Set, payload: Uint8Array }
    this.receivedSeeds = new Set();
  }

  /**
   * Ingest a fountain drop packet
   * Returns progress object: { decodedCount, total: K, isComplete, newlyDecodedIndex }
   */
  receiveDrop(seed, payload) {
    if (this.isComplete()) {
      return { decodedCount: this.decodedCount, total: this.K, isComplete: true };
    }

    if (this.receivedSeeds.has(seed)) {
      return { decodedCount: this.decodedCount, total: this.K, isComplete: this.isComplete() };
    }
    this.receivedSeeds.add(seed);

    const indicesArray = getBlockIndices(seed, this.K);
    let indices = new Set(indicesArray);
    const dropPayload = new Uint8Array(payload);

    // Reduce drop using already decoded blocks
    for (const idx of Array.from(indices)) {
      if (this.decodedBlocks[idx] !== null) {
        // XOR out known block
        const knownData = this.decodedBlocks[idx];
        for (let i = 0; i < this.blockSize; i++) {
          dropPayload[i] ^= knownData[i];
        }
        indices.delete(idx);
      }
    }

    // Process reduced drop
    if (indices.size === 0) {
      // Drop carries no new info
      return { decodedCount: this.decodedCount, total: this.K, isComplete: this.isComplete() };
    }

    // Store drop
    const drop = { indices, payload: dropPayload };
    this.pendingDrops.push(drop);

    // Run peeling loop
    this.peel();

    return {
      decodedCount: this.decodedCount,
      total: this.K,
      isComplete: this.isComplete()
    };
  }

  peel() {
    let changed = true;
    while (changed) {
      changed = false;
      
      // Find drops with degree 1
      for (let i = 0; i < this.pendingDrops.length; i++) {
        const drop = this.pendingDrops[i];
        if (drop.indices.size === 1) {
          const [decodedIdx] = Array.from(drop.indices);
          
          if (this.decodedBlocks[decodedIdx] === null) {
            // New block decoded!
            this.decodedBlocks[decodedIdx] = new Uint8Array(drop.payload);
            this.decodedCount++;
            changed = true;

            // Propagate into all other pending drops
            const knownData = drop.payload;
            for (let j = 0; j < this.pendingDrops.length; j++) {
              if (j === i) continue;
              const otherDrop = this.pendingDrops[j];
              if (otherDrop.indices.has(decodedIdx)) {
                for (let b = 0; b < this.blockSize; b++) {
                  otherDrop.payload[b] ^= knownData[b];
                }
                otherDrop.indices.delete(decodedIdx);
              }
            }
          }

          // Remove processed drop
          this.pendingDrops.splice(i, 1);
          i--;
        }
      }
    }
  }

  isComplete() {
    return this.decodedCount === this.K;
  }

  /**
   * Reassemble final file bytes
   */
  getReassembledBytes() {
    if (!this.isComplete()) return null;
    const result = new Uint8Array(this.totalBytes);
    for (let i = 0; i < this.K; i++) {
      const start = i * this.blockSize;
      const end = Math.min(start + this.blockSize, this.totalBytes);
      result.set(this.decodedBlocks[i].subarray(0, end - start), start);
    }
    return result;
  }
}
