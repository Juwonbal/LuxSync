/**
 * LuxSync Transmitter v5 — Fast Steganography Sender
 * Features real-time DEFLATE compression, up to 18 FPS, 800B chunk density.
 */

import QRCode from 'qrcode';
import * as fflate from 'fflate';
import { ART_THEMES, renderSteganographicQR } from '../utils/steganography.js';

export function createTransmitter(container) {
  let file = null;
  let fileBytes = null;
  let compressedBytes = null;
  let isCompressed = false;
  let dataChunks = [];
  let totalChunks = 0;
  let isFlashing = false;
  let animFrameId = null;

  let fps = 10;           // Fast scanning FPS
  let chunkSize = 800;    // High-speed chunk size
  let currentTheme = 'cyberpunk';
  let currentIdx = 0;
  let cycleCount = 0;
  let framesSent = 0;
  let lastFrameTime = 0;

  let receiverUrl = '';

  container.innerHTML = `
    <div class="card glass-panel">
      <div class="card-header">
        <h2>⚡ Optical Transmitter <span class="badge badge-success">Turbo Speed</span></h2>
        <span class="badge badge-primary">Sender</span>
      </div>

      <!-- File Drop Area -->
      <div id="tx-dropzone" class="dropzone">
        <div class="drop-icon-wrap">📁</div>
        <h3>Drop Any File to Beam via Light</h3>
        <p>Images, PDFs, Documents, Code, Zips — auto-compressed</p>
        <input type="file" id="tx-file-input" style="display: none;" />
        <button class="btn btn-outline" onclick="document.getElementById('tx-file-input').click()">
          Browse File
        </button>
      </div>

      <!-- File Info Banner -->
      <div id="tx-file-info" class="file-info-box hidden">
        <div class="file-details">
          <span class="file-emoji">📄</span>
          <div>
            <h4 id="tx-filename">filename.bin</h4>
            <p id="tx-filesize">0 KB → 0 frames</p>
            <p id="tx-comp-info" class="text-cyan" style="font-size: 0.8rem; margin-top: 2px;"></p>
          </div>
        </div>
        <button class="btn btn-sm btn-danger" id="tx-remove-file">✕</button>
      </div>

      <!-- Step 1: Get Receiver on Phone -->
      <div id="tx-step1" class="step-section hidden">
        <div class="step-header">
          <span class="step-number">1</span>
          <div>
            <h3>Get the Receiver on your phone</h3>
            <p class="step-desc">Scan or download the receiver on the target phone</p>
          </div>
        </div>

        <div class="receiver-options">
          <div class="option-card" id="tx-qr-option">
            <h4>📱 Scan QR Code <span class="option-badge">Same Network</span></h4>
            <p>Both devices on same WiFi? Scan to open receiver instantly:</p>
            <div class="qr-display">
              <canvas id="tx-bootstrap-qr" width="220" height="220"></canvas>
            </div>
            <p class="url-display" id="tx-receiver-url"></p>
          </div>

          <div class="option-card">
            <h4>📦 Download Receiver File <span class="option-badge">100% Offline</span></h4>
            <p>No network? Download this HTML file, send to phone once, open in browser.</p>
            <a class="btn btn-outline" id="tx-download-receiver" href="/receiver.html" download="LuxSync_Receiver.html">
              ⬇ Download receiver.html (45KB)
            </a>
          </div>
        </div>

        <button class="btn btn-primary btn-glow margin-top" id="tx-ready-btn">
          🚀 Start High-Speed Beam
        </button>
      </div>

      <!-- Step 2: Flashing QR Codes / Steganography -->
      <div id="tx-step2" class="step-section hidden">
        <div class="step-header">
          <span class="step-number">2</span>
          <div>
            <h3>Point phone camera at the screen</h3>
            <p class="step-desc">Steganographic art frames cycling. Receiver captures automatically.</p>
          </div>
        </div>

        <div class="controls-grid margin-top">
          <div class="control-group">
            <label>Speed: <span id="tx-fps-val" class="text-cyan">10 FPS</span></label>
            <input type="range" id="tx-fps-slider" min="4" max="18" value="10" step="1" />
          </div>

          <div class="control-group">
            <label>🎨 Steganography Theme</label>
            <select id="tx-theme-select" class="select-input">
              <option value="standard">Standard B&W QR</option>
              <option value="cyberpunk" selected>⚡ Cyberpunk Circuitry</option>
              <option value="bioluminescent">🌌 Bioluminescent Grid</option>
              <option value="matrix">💚 Matrix Code Rain</option>
              <option value="mosaic">🎨 Neon Stencil Mosaic</option>
            </select>
          </div>

          <div class="control-group">
            <label>Frame Density</label>
            <select id="tx-density-select" class="select-input">
              <option value="450">450 B (Easy Scan)</option>
              <option value="800" selected>800 B (Fast Beam)</option>
              <option value="1200">1200 B (Turbo Max)</option>
            </select>
          </div>
        </div>

        <!-- Steganographic QR Display Canvas -->
        <div class="qr-flash-wrapper margin-top">
          <canvas id="tx-flash-canvas" width="460" height="460"></canvas>
          <div class="qr-flash-label">
            <span id="tx-chunk-label">Frame 0 / 0</span>
            <span id="tx-cycle-label">Cycle 1</span>
          </div>
        </div>

        <div class="action-bar margin-top">
          <button id="tx-pause-btn" class="btn btn-warning">
            ⏸ Pause
          </button>
          <button id="tx-restart-btn" class="btn btn-outline">
            🔄 Restart from Beginning
          </button>
        </div>

        <div class="telemetry margin-top">
          <div><small>Total Frames:</small> <strong id="tx-tele-total">0</strong></div>
          <div><small>Frames Flashed:</small> <strong id="tx-tele-sent">0</strong></div>
          <div><small>Cycles:</small> <strong id="tx-tele-cycles">0</strong></div>
          <div><small>Payload Size:</small> <strong id="tx-tele-size">0 KB</strong></div>
        </div>
      </div>
    </div>
  `;

  const dropzone = container.querySelector('#tx-dropzone');
  const fileInput = container.querySelector('#tx-file-input');
  const fileInfo = container.querySelector('#tx-file-info');
  const filenameEl = container.querySelector('#tx-filename');
  const filesizeEl = container.querySelector('#tx-filesize');
  const compInfoEl = container.querySelector('#tx-comp-info');
  const removeFileBtn = container.querySelector('#tx-remove-file');

  const step1 = container.querySelector('#tx-step1');
  const bootstrapQrCanvas = container.querySelector('#tx-bootstrap-qr');
  const receiverUrlEl = container.querySelector('#tx-receiver-url');
  const readyBtn = container.querySelector('#tx-ready-btn');

  const step2 = container.querySelector('#tx-step2');
  const flashCanvas = container.querySelector('#tx-flash-canvas');
  const fpsSlider = container.querySelector('#tx-fps-slider');
  const fpsVal = container.querySelector('#tx-fps-val');
  const themeSelect = container.querySelector('#tx-theme-select');
  const densitySelect = container.querySelector('#tx-density-select');
  const chunkLabel = container.querySelector('#tx-chunk-label');
  const cycleLabel = container.querySelector('#tx-cycle-label');
  const pauseBtn = container.querySelector('#tx-pause-btn');
  const restartBtn = container.querySelector('#tx-restart-btn');

  const teleTotal = container.querySelector('#tx-tele-total');
  const teleSent = container.querySelector('#tx-tele-sent');
  const teleCycles = container.querySelector('#tx-tele-cycles');
  const teleSize = container.querySelector('#tx-tele-size');

  try {
    const loc = window.location;
    receiverUrl = `${loc.protocol}//${loc.hostname}:${loc.port}/receiver.html`;
    receiverUrlEl.textContent = receiverUrl;
  } catch (e) {
    receiverUrlEl.textContent = '(Run with --host to enable)';
  }

  dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault(); dropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', (e) => { if (e.target.files.length) handleFile(e.target.files[0]); });

  removeFileBtn.addEventListener('click', () => {
    stopFlashing();
    file = null; fileBytes = null; compressedBytes = null; dataChunks = [];
    fileInfo.classList.add('hidden');
    dropzone.classList.remove('hidden');
    step1.classList.add('hidden');
    step2.classList.add('hidden');
  });

  fpsSlider.addEventListener('input', (e) => {
    fps = parseInt(e.target.value);
    fpsVal.textContent = `${fps} FPS`;
  });

  themeSelect.addEventListener('change', (e) => {
    currentTheme = e.target.value;
    if (dataChunks.length) renderCurrentQR();
  });

  densitySelect.addEventListener('change', (e) => {
    chunkSize = parseInt(e.target.value);
    if (fileBytes) prepareChunks();
  });

  readyBtn.addEventListener('click', () => {
    step1.classList.add('hidden');
    step2.classList.remove('hidden');
    startFlashing();
  });

  pauseBtn.addEventListener('click', () => {
    if (isFlashing) {
      stopFlashing();
      pauseBtn.textContent = '▶ Resume';
      pauseBtn.classList.remove('btn-warning');
      pauseBtn.classList.add('btn-primary');
    } else {
      startFlashing();
      pauseBtn.textContent = '⏸ Pause';
      pauseBtn.classList.remove('btn-primary');
      pauseBtn.classList.add('btn-warning');
    }
  });

  restartBtn.addEventListener('click', () => {
    currentIdx = 0;
    cycleCount = 0;
    framesSent = 0;
    teleCycles.textContent = '0';
    teleSent.textContent = '0';
    if (!isFlashing) {
      startFlashing();
      pauseBtn.textContent = '⏸ Pause';
      pauseBtn.classList.remove('btn-primary');
      pauseBtn.classList.add('btn-warning');
    }
  });

  function handleFile(f) {
    file = f;
    const reader = new FileReader();
    reader.onload = (e) => {
      fileBytes = new Uint8Array(e.target.result);
      filenameEl.textContent = file.name;

      try {
        const compressed = fflate.compressSync(fileBytes);
        if (compressed.length < fileBytes.length) {
          compressedBytes = compressed;
          isCompressed = true;
          const ratio = Math.round((1 - compressed.length / fileBytes.length) * 100);
          compInfoEl.textContent = `⚡ DEFLATE Compressed: ${formatBytes(fileBytes.length)} → ${formatBytes(compressed.length)} (${ratio}% smaller)`;
        } else {
          compressedBytes = fileBytes;
          isCompressed = false;
          compInfoEl.textContent = `Raw Data: ${formatBytes(fileBytes.length)}`;
        }
      } catch (err) {
        compressedBytes = fileBytes;
        isCompressed = false;
        compInfoEl.textContent = `Raw Data: ${formatBytes(fileBytes.length)}`;
      }

      prepareChunks();
      dropzone.classList.add('hidden');
      fileInfo.classList.remove('hidden');
      step1.classList.remove('hidden');
      step2.classList.add('hidden');

      generateBootstrapQR();
    };
    reader.readAsArrayBuffer(file);
  }

  function prepareChunks() {
    const bytesToChunk = compressedBytes || fileBytes;
    const fullBase64 = uint8ToBase64(bytesToChunk);
    const b64ChunkLen = Math.ceil(chunkSize * 4 / 3);
    dataChunks = [];

    for (let i = 0; i < fullBase64.length; i += b64ChunkLen) {
      dataChunks.push(fullBase64.slice(i, i + b64ChunkLen));
    }

    totalChunks = dataChunks.length;
    const truncName = file.name.length > 20 ? file.name.slice(0, 20) : file.name;
    const compFlag = isCompressed ? '1' : '0';
    const origLen = fileBytes ? fileBytes.length : 0;

    for (let i = 0; i < totalChunks; i++) {
      dataChunks[i] = `LX|${i}|${totalChunks}|${compFlag}|${origLen}|${truncName}|${dataChunks[i]}`;
    }

    filesizeEl.textContent = `${formatBytes(fileBytes.length)} → ${totalChunks} frames @ ${chunkSize}B`;
    teleTotal.textContent = totalChunks;
    teleSize.textContent = formatBytes(bytesToChunk.length);

    currentIdx = 0;
    cycleCount = 0;
    framesSent = 0;
  }

  async function generateBootstrapQR() {
    try {
      await QRCode.toCanvas(bootstrapQrCanvas, receiverUrl, {
        width: 220,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'M'
      });
    } catch (e) {
      console.warn('Bootstrap QR error:', e);
    }
  }

  function startFlashing() {
    if (!dataChunks.length) return;
    isFlashing = true;
    lastFrameTime = performance.now();
    loop();
  }

  function stopFlashing() {
    isFlashing = false;
    if (animFrameId) cancelAnimationFrame(animFrameId);
  }

  function loop(now = performance.now()) {
    if (!isFlashing) return;

    const interval = 1000 / fps;
    if (now - lastFrameTime >= interval) {
      lastFrameTime = now - ((now - lastFrameTime) % interval);
      renderCurrentQR();

      currentIdx++;
      if (currentIdx >= totalChunks) {
        currentIdx = 0;
        cycleCount++;
        teleCycles.textContent = cycleCount;
      }

      framesSent++;
      teleSent.textContent = framesSent;
      chunkLabel.textContent = `Frame ${currentIdx} / ${totalChunks}`;
      cycleLabel.textContent = `Cycle ${cycleCount + 1}`;
    }

    animFrameId = requestAnimationFrame(loop);
  }

  function renderCurrentQR() {
    if (!dataChunks.length) return;
    const payload = dataChunks[currentIdx];
    try {
      renderSteganographicQR(flashCanvas, payload, currentTheme);
    } catch (e) {
      console.warn('Steganography render error:', e);
    }
  }

  function uint8ToBase64(uint8) {
    let binary = '';
    const len = uint8.length;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(uint8[i]);
    }
    return btoa(binary);
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  return {
    destroy: () => { stopFlashing(); }
  };
}
