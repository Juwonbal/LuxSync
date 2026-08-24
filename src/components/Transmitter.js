/**
 * LuxSync Transmitter v11 — SentinelOne Style Template
 * Primary Violet (#5F01FB), Slate Indigo (#514A85), Cosmic Obsidian (#0B0D1B).
 */

import QRCode from 'qrcode';
import * as fflate from 'fflate';
import { ART_THEMES, renderSteganographicQR } from '../utils/steganography.js';

export function createTransmitter(container) {
  let file = null;
  let fileBytes = null;
  let compressedBytes = null;
  let useCompression = false;
  let dataChunks = [];
  let totalChunks = 0;
  let isFlashing = false;
  let animFrameId = null;

  let fps = 5;
  let chunkSize = 250;
  let currentTheme = 'cyberpunk';
  let currentIdx = 0;
  let cycleCount = 0;
  let framesSent = 0;
  let lastFrameTime = 0;

  let receiverUrl = '';

  container.innerHTML = `
    <div class="surface-panel">
      <div class="panel-header">
        <div class="panel-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c49fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"></path>
            <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"></path>
            <circle cx="12" cy="12" r="2"></circle>
            <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"></path>
            <path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1"></path>
          </svg>
          <h2>Optical Transmitter</h2>
        </div>
        <span class="tag-pill tag-violet">Beam Station</span>
      </div>

      <!-- File Drop Stage -->
      <div id="tx-dropzone" class="dropzone-stage">
        <div class="dropzone-icon-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
        </div>
        <h3>Drop any file to beam</h3>
        <p>PDF, Images, Video, Audio, Documents, Archives & Code</p>
        <input type="file" id="tx-file-input" style="display: none;" />
        <button class="btn-tactical btn-primary-violet" onclick="document.getElementById('tx-file-input').click()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          </svg>
          Browse File
        </button>
      </div>

      <!-- File Spec Card -->
      <div id="tx-file-info" class="file-spec-card hidden">
        <div class="file-spec-left">
          <div class="file-type-badge" id="tx-file-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
          </div>
          <div>
            <div class="file-name-text" id="tx-filename">filename.bin</div>
            <div class="file-meta-text" id="tx-filesize">0 KB</div>
          </div>
        </div>
        <button class="file-remove-btn" id="tx-remove-file" title="Remove File">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- Compression Toggle Cards -->
      <div id="tx-compression-box" class="compression-section hidden">
        <div class="section-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c49fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="4 14 10 14 10 20"></polyline>
            <polyline points="20 10 14 10 14 4"></polyline>
            <line x1="14" y1="10" x2="21" y2="3"></line>
            <line x1="3" y1="21" x2="10" y2="14"></line>
          </svg>
          Packaging Format
        </div>
        <div class="compression-cards-grid">
          <label class="compress-card selected" id="card-raw">
            <input type="radio" name="tx-compression" value="raw" checked />
            <div class="compress-radio-custom"></div>
            <div class="compress-body">
              <strong>Raw Binary (Exact Format)</strong>
              <p>Streams exact byte-for-byte replica with zero compression.</p>
            </div>
          </label>
          <label class="compress-card" id="card-deflate">
            <input type="radio" name="tx-compression" value="deflate" />
            <div class="compress-radio-custom"></div>
            <div class="compress-body">
              <strong>DEFLATE Compression</strong>
              <p>Shrinks file size for faster transfer in fewer frames.</p>
              <div class="savings-chip" id="tx-deflate-preview"></div>
            </div>
          </label>
        </div>
      </div>

      <!-- Step 1: Connect Phone Receiver -->
      <div id="tx-step1" class="margin-top hidden">
        <div class="section-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c49fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
            <line x1="12" y1="18" x2="12.01" y2="18"></line>
          </svg>
          Connect Receiving Device
        </div>

        <div class="setup-grid">
          <div class="setup-card">
            <div>
              <div class="setup-card-header">
                <h4>📱 Instant Camera Scan</h4>
                <span class="tag-pill tag-violet">Online / LAN</span>
              </div>
              <p>Scan with your phone camera to launch receiver instantly:</p>
            </div>
            <div>
              <div class="qr-canvas-mount">
                <canvas id="tx-bootstrap-qr" width="200" height="200"></canvas>
              </div>
              <div class="url-subtext" id="tx-receiver-url"></div>
            </div>
          </div>

          <div class="setup-card">
            <div>
              <div class="setup-card-header">
                <h4>🛡️ Standalone HTML</h4>
                <span class="tag-pill tag-indigo">100% Offline</span>
              </div>
              <p>Completely disconnected from internet? Download the standalone HTML receiver once. Works permanently offline.</p>
            </div>
            <div>
              <a class="btn-tactical btn-glass btn-block" id="tx-download-receiver" href="/receiver.html" download="LuxSync_Receiver.html">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Download Standalone Receiver (45KB)
              </a>
            </div>
          </div>
        </div>

        <!-- Primary Violet Pill Button (#5F01FB) -->
        <button class="btn-tactical btn-primary-violet btn-lg btn-block margin-top" id="tx-ready-btn">
          <span>Initialize Optical Stream</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>
      </div>

      <!-- Step 2: Optical Flasher Stage -->
      <div id="tx-step2" class="margin-top hidden">
        <div class="deck-controls-strip">
          <div class="deck-control-item">
            <label>Flashing Speed: <span id="tx-fps-val" class="text-violet">5 FPS</span></label>
            <input type="range" id="tx-fps-slider" min="2" max="10" value="5" step="1" />
          </div>

          <div class="deck-control-item">
            <label>Visual HUD Style</label>
            <select id="tx-theme-select" class="sleek-select">
              <option value="cyberpunk" selected>⚡ Cyberpunk HUD</option>
              <option value="bioluminescent">🌌 Bioluminescent Frame</option>
              <option value="matrix">💚 Matrix Terminal</option>
              <option value="mosaic">🎨 Neon Stencil Card</option>
              <option value="standard">Standard B&W QR</option>
            </select>
          </div>

          <div class="deck-control-item">
            <label>Optical Density</label>
            <select id="tx-density-select" class="sleek-select">
              <option value="150">150 B (Large Blocks - Far Distance)</option>
              <option value="250" selected>250 B (Balanced - Recommended)</option>
              <option value="400">400 B (Fast Beam)</option>
            </select>
          </div>
        </div>

        <!-- Cinema Flasher Chassis -->
        <div class="flasher-chassis">
          <div class="flasher-canvas-holder">
            <canvas id="tx-flash-canvas" width="460" height="460"></canvas>
          </div>
          <div class="flasher-timeline">
            <div class="timeline-bar">
              <div class="timeline-progress" id="tx-timeline-fill"></div>
            </div>
            <div class="timeline-labels">
              <span id="tx-chunk-label">Frame 0 / 0</span>
              <span id="tx-cycle-label">Cycle 1</span>
            </div>
          </div>
        </div>

        <!-- Transport Action Buttons -->
        <div class="transport-bar">
          <button id="tx-pause-btn" class="btn-tactical btn-warning-glass">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
            <span>Pause [Space]</span>
          </button>
          <button id="tx-next-btn" class="btn-tactical btn-glass">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="5 4 15 12 5 20 5 4"></polygon>
              <line x1="19" y1="5" x2="19" y2="19"></line>
            </svg>
            <span>Step Next [→]</span>
          </button>
          <button id="tx-restart-btn" class="btn-tactical btn-glass">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="1 4 1 10 7 10"></polyline>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
            </svg>
            <span>Reset [R]</span>
          </button>
        </div>

        <!-- Telemetry Deck -->
        <div class="telemetry-deck">
          <div class="telemetry-stat">
            <span class="stat-header">Total Chunks</span>
            <span class="stat-figure" id="tx-tele-total">0</span>
          </div>
          <div class="telemetry-stat">
            <span class="stat-header">Frames Flashed</span>
            <span class="stat-figure" id="tx-tele-sent">0</span>
          </div>
          <div class="telemetry-stat">
            <span class="stat-header">Cycles</span>
            <span class="stat-figure" id="tx-tele-cycles">0</span>
          </div>
          <div class="telemetry-stat">
            <span class="stat-header">Throughput</span>
            <span class="stat-figure" id="tx-tele-rate">0 kbps</span>
          </div>
        </div>
      </div>
    </div>
  `;

  // === Element References ===
  const dropzone = container.querySelector('#tx-dropzone');
  const fileInput = container.querySelector('#tx-file-input');
  const fileInfo = container.querySelector('#tx-file-info');
  const filenameEl = container.querySelector('#tx-filename');
  const filesizeEl = container.querySelector('#tx-filesize');
  const removeFileBtn = container.querySelector('#tx-remove-file');
  const compressionBox = container.querySelector('#tx-compression-box');
  const deflatePreview = container.querySelector('#tx-deflate-preview');
  const cardRaw = container.querySelector('#card-raw');
  const cardDeflate = container.querySelector('#card-deflate');
  const compressionRadios = container.querySelectorAll('input[name="tx-compression"]');

  const step1 = container.querySelector('#tx-step1');
  const bootstrapQrCanvas = container.querySelector('#tx-bootstrap-qr');
  const receiverUrlEl = container.querySelector('#tx-receiver-url');
  const readyBtn = container.querySelector('#tx-ready-btn');

  const step2 = container.querySelector('#tx-step2');
  const flashCanvas = container.querySelector('#tx-flash-canvas');
  const timelineFill = container.querySelector('#tx-timeline-fill');
  const fpsSlider = container.querySelector('#tx-fps-slider');
  const fpsVal = container.querySelector('#tx-fps-val');
  const themeSelect = container.querySelector('#tx-theme-select');
  const densitySelect = container.querySelector('#tx-density-select');
  const chunkLabel = container.querySelector('#tx-chunk-label');
  const cycleLabel = container.querySelector('#tx-cycle-label');
  const pauseBtn = container.querySelector('#tx-pause-btn');
  const restartBtn = container.querySelector('#tx-restart-btn');
  const nextBtn = container.querySelector('#tx-next-btn');

  const teleTotal = container.querySelector('#tx-tele-total');
  const teleSent = container.querySelector('#tx-tele-sent');
  const teleCycles = container.querySelector('#tx-tele-cycles');
  const teleRate = container.querySelector('#tx-tele-rate');

  try {
    const loc = window.location;
    receiverUrl = `${loc.protocol}//${loc.hostname}:${loc.port}/receiver.html`;
    receiverUrlEl.textContent = receiverUrl;
  } catch (e) {
    receiverUrlEl.textContent = '(Run with --host to enable LAN access)';
  }

  // === Drag & Drop Handlers ===
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
    compressionBox.classList.add('hidden');
    dropzone.classList.remove('hidden');
    step1.classList.add('hidden');
    step2.classList.add('hidden');
  });

  // Compression choice card toggles
  compressionRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      useCompression = e.target.value === 'deflate';
      if (useCompression) {
        cardDeflate.classList.add('selected');
        cardRaw.classList.remove('selected');
      } else {
        cardRaw.classList.add('selected');
        cardDeflate.classList.remove('selected');
      }
      if (fileBytes) prepareChunks();
    });
  });

  fpsSlider.addEventListener('input', (e) => {
    fps = parseInt(e.target.value);
    fpsVal.textContent = `${fps} FPS${fps === 5 ? ' (Recommended)' : ''}`;
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

  pauseBtn.addEventListener('click', togglePause);
  restartBtn.addEventListener('click', restartStream);
  nextBtn.addEventListener('click', stepNextFrame);

  // Keyboard Shortcuts
  function handleKeyDown(e) {
    if (step2.classList.contains('hidden')) return;
    if (e.code === 'Space') {
      e.preventDefault();
      togglePause();
    } else if (e.code === 'ArrowRight') {
      e.preventDefault();
      stepNextFrame();
    } else if (e.code === 'KeyR') {
      e.preventDefault();
      restartStream();
    }
  }
  window.addEventListener('keydown', handleKeyDown);

  function togglePause() {
    if (isFlashing) {
      stopFlashing();
      pauseBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
        <span>Resume [Space]</span>
      `;
      pauseBtn.className = 'btn-tactical btn-primary-violet';
    } else {
      startFlashing();
      pauseBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="6" y="4" width="4" height="16"></rect>
          <rect x="14" y="4" width="4" height="16"></rect>
        </svg>
        <span>Pause [Space]</span>
      `;
      pauseBtn.className = 'btn-tactical btn-warning-glass';
    }
  }

  function restartStream() {
    currentIdx = 0;
    cycleCount = 0;
    framesSent = 0;
    teleCycles.textContent = '0';
    teleSent.textContent = '0';
    if (!isFlashing) {
      startFlashing();
      pauseBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="6" y="4" width="4" height="16"></rect>
          <rect x="14" y="4" width="4" height="16"></rect>
        </svg>
        <span>Pause [Space]</span>
      `;
      pauseBtn.className = 'btn-tactical btn-warning-glass';
    }
  }

  function stepNextFrame() {
    if (!dataChunks.length) return;
    if (isFlashing) stopFlashing();
    pauseBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>
      <span>Resume [Space]</span>
    `;
    pauseBtn.className = 'btn-tactical btn-primary-violet';
    currentIdx = (currentIdx + 1) % totalChunks;
    renderCurrentQR();
    updateTimeline();
  }

  function handleFile(f) {
    file = f;
    const reader = new FileReader();
    reader.onload = (e) => {
      fileBytes = new Uint8Array(e.target.result);
      filenameEl.textContent = file.name;

      try {
        const compressed = fflate.compressSync(fileBytes);
        compressedBytes = compressed;
        const ratio = Math.round((1 - compressed.length / fileBytes.length) * 100);
        if (ratio > 5) {
          deflatePreview.textContent = `⚡ Saves ${ratio}% (${formatBytes(fileBytes.length)} → ${formatBytes(compressed.length)})`;
        } else {
          deflatePreview.textContent = `File already compressed (${formatBytes(fileBytes.length)})`;
        }
      } catch (err) {
        compressedBytes = null;
        deflatePreview.textContent = `Shrinks data size.`;
      }

      prepareChunks();
      dropzone.classList.add('hidden');
      fileInfo.classList.remove('hidden');
      compressionBox.classList.remove('hidden');
      step1.classList.remove('hidden');
      step2.classList.add('hidden');

      generateBootstrapQR();
    };
    reader.readAsArrayBuffer(file);
  }

  function prepareChunks() {
    const bytesToChunk = (useCompression && compressedBytes) ? compressedBytes : fileBytes;
    const fullBase64 = uint8ToBase64(bytesToChunk);
    const b64ChunkLen = Math.ceil(chunkSize * 4 / 3);
    dataChunks = [];

    for (let i = 0; i < fullBase64.length; i += b64ChunkLen) {
      dataChunks.push(fullBase64.slice(i, i + b64ChunkLen));
    }

    totalChunks = dataChunks.length;
    const encodedFileName = encodeURIComponent(file.name);
    const compFlag = (useCompression && compressedBytes) ? '1' : '0';
    const origLen = fileBytes ? fileBytes.length : 0;

    for (let i = 0; i < totalChunks; i++) {
      dataChunks[i] = `LX|${i}|${totalChunks}|${compFlag}|${origLen}|${encodedFileName}|${dataChunks[i]}`;
    }

    filesizeEl.textContent = `${formatBytes(fileBytes.length)} • ${totalChunks} frames (${chunkSize} B/frame)`;
    teleTotal.textContent = totalChunks;

    const approxRate = ((chunkSize * fps * 8) / 1000).toFixed(1);
    teleRate.textContent = `${approxRate} kbps`;

    currentIdx = 0;
    cycleCount = 0;
    framesSent = 0;
  }

  async function generateBootstrapQR() {
    try {
      await QRCode.toCanvas(bootstrapQrCanvas, receiverUrl, {
        width: 200,
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
      updateTimeline();
    }

    animFrameId = requestAnimationFrame(loop);
  }

  function updateTimeline() {
    const pct = Math.round(((currentIdx + 1) / totalChunks) * 100);
    timelineFill.style.width = `${pct}%`;
    chunkLabel.textContent = `Frame ${currentIdx + 1} / ${totalChunks} (${pct}%)`;
    cycleLabel.textContent = `Cycle ${cycleCount + 1}`;
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
    const sliceLen = 8192;
    for (let i = 0; i < uint8.length; i += sliceLen) {
      binary += String.fromCharCode.apply(null, uint8.subarray(i, i + sliceLen));
    }
    return btoa(binary);
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  return {
    destroy: () => {
      stopFlashing();
      window.removeEventListener('keydown', handleKeyDown);
    }
  };
}
