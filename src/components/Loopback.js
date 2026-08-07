/**
 * LuxSync Loopback & Optical Physics Simulator
 * Runs Transmitter and Receiver in real-time loopback mode with controllable optical noise & drop rate.
 */

import { createTransmitter } from './Transmitter.js';
import { createReceiver } from './Receiver.js';
import { VisionScanner } from '../utils/vision.js';

export function createLoopback(container) {
  container.innerHTML = `
    <div class="glass-panel card">
      <div class="card-header">
        <h2><i data-lucide="repeat"></i> Air-Gap Optical Loopback Simulator</h2>
        <span class="badge badge-warning">Single-Device Test Mode</span>
      </div>
      <p class="description">
        Simulates screen-to-camera optical transfer directly in your browser. 
        Test file compression, fountain codes, dropped frames, and visual noise without needing two separate devices!
      </p>

      <!-- Simulation Noise Controls -->
      <div class="controls-grid margin-top">
        <div class="control-group">
          <label>Simulated Packet Loss (Drop Rate): <span id="sim-drop-val" class="text-warning">15%</span></label>
          <input type="range" id="sim-drop-slider" min="0" max="60" value="15" step="5" />
        </div>
        <div class="control-group">
          <label>Camera Blur Noise</label>
          <select id="sim-blur-select" class="select-input">
            <option value="none">Clear Line of Sight (0px Blur)</option>
            <option value="low">Subtle Glare / Soft Blur (1px)</option>
            <option value="high">Heavy Motion Blur (2px)</option>
          </select>
        </div>
      </div>

      <!-- Split View layout: Transmitter Left, Receiver Right -->
      <div class="simulator-split margin-top">
        <div id="sim-tx-container" class="sim-pane"></div>
        <div id="sim-rx-container" class="sim-pane"></div>
      </div>
    </div>
  `;

  const txContainer = container.querySelector('#sim-tx-container');
  const rxContainer = container.querySelector('#sim-rx-container');
  const dropSlider = container.querySelector('#sim-drop-slider');
  const dropVal = container.querySelector('#sim-drop-val');
  const blurSelect = container.querySelector('#sim-blur-select');

  let dropRatePct = 15;

  dropSlider.addEventListener('input', (e) => {
    dropRatePct = parseInt(e.target.value);
    dropVal.textContent = `${dropRatePct}%`;
  });

  // Mount Transmitter & Receiver components inside simulator panes
  const tx = createTransmitter(txContainer);
  const rx = createReceiver(rxContainer);

  const txCanvas = txContainer.querySelector('#tx-canvas');
  let visionScanner = new VisionScanner(16, 2);

  // Hook into animation frame loop to bridge Tx canvas to Rx engine with simulated optical degradation
  let isSimulating = true;
  let animId = null;

  function loopbackStep() {
    if (isSimulating && txCanvas) {
      // Get current Tx parameters
      const params = tx.getParams();
      visionScanner.setParams(params.gridSize, params.bitsPerCell);

      // Simulate optical drop rate
      const roll = Math.random() * 100;
      if (roll >= dropRatePct) {
        // Sample frame from Tx Canvas
        const txCtx = txCanvas.getContext('2d');
        const res = visionScanner.processFrame(txCtx, txCanvas.width, txCanvas.height);
        
        if (res.success && res.frame) {
          rx.ingestExternalFrame(res.frame);
        }
      }
    }
    animId = requestAnimationFrame(loopbackStep);
  }

  animId = requestAnimationFrame(loopbackStep);

  return {
    destroy: () => {
      isSimulating = false;
      if (animId) cancelAnimationFrame(animId);
    }
  };
}
