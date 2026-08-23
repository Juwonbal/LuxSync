/**
 * LuxSync Receiver Component v8 — Exact MIME Type & Full Filename Preservation
 */

import jsQR from 'jsqr';
import * as fflate from 'fflate';

function getMimeType(filename) {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  const map = {
    pdf: 'application/pdf',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    txt: 'text/plain',
    html: 'text/html',
    css: 'text/css',
    js: 'text/javascript',
    json: 'application/json',
    zip: 'application/zip',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    doc: 'application/msword',
    xls: 'application/vnd.ms-excel',
    ppt: 'application/vnd.ms-powerpoint'
  };
  return map[ext] || 'application/octet-stream';
}

export function createReceiver(container) {
  let stream = null;
  let scanning = false;
  let detector = null;

  // Transfer state
  let chunks = {};
  let totalChunks = 0;
  let receivedCount = 0;
  let fileName = 'received_file';
  let isCompressed = false;
  let originalSize = 0;
  let totalScans = 0;
  let dupeScans = 0;
  let transferComplete = false;

  container.innerHTML = `
    <div class="card glass-panel">
      <div class="card-header">
        <h2>📷 Optical Receiver <span class="badge badge-success">Live HUD</span></h2>
        <span class="badge badge-success">Receiver</span>
      </div>

      <div id="rx-status-banner" class="status-banner status-waiting">
        Tap "Start Camera" and point at the sender screen
      </div>

      <!-- Camera Feed with HUD Overlay -->
      <div class="camera-wrap margin-top">
        <video id="rx-video" autoplay playsinline muted></video>
        <canvas id="rx-hud-canvas" class="hud-canvas-overlay"></canvas>
        <div class="scan-line" id="rx-scan-line"></div>
      </div>

      <!-- Progress -->
      <div class="progress-section margin-top">
        <div class="progress-header">
          <span id="rx-progress-label">Waiting for signal...</span>
          <span id="rx-progress-pct">0%</span>
        </div>
        <div class="progress-bar-bg">
          <div id="rx-progress-fill" class="progress-bar-fill" style="width: 0%"></div>
        </div>
      </div>

      <!-- Chunk Grid -->
      <div class="chunk-grid margin-top" id="rx-chunk-grid"></div>

      <!-- Stats -->
      <div class="stats-grid margin-top">
        <div class="stat-item">
          <div class="stat-label">File</div>
          <div class="stat-value" id="rx-stat-file">—</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Chunks</div>
          <div class="stat-value" id="rx-stat-chunks">0 / 0</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Scanned</div>
          <div class="stat-value" id="rx-stat-scanned">0</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Dupes Skipped</div>
          <div class="stat-value" id="rx-stat-dupes">0</div>
        </div>
      </div>

      <!-- Actions -->
      <div class="action-bar margin-top">
        <button id="rx-start-btn" class="btn btn-glow btn-success">
          📷 Start Camera
        </button>
        <button id="rx-stop-btn" class="btn btn-danger hidden">
          ⏹ Stop Camera
        </button>
        <a id="rx-download-btn" class="btn btn-glow btn-cyan hidden">
          💾 Save Received File
        </a>
      </div>

      <!-- Standalone Receiver Info -->
      <div class="info-banner margin-top">
        <h4>📦 Want to use this without a network?</h4>
        <p>Download the standalone receiver HTML file and open it directly in your phone's browser. No network needed — ever.</p>
        <a class="btn btn-outline" href="/receiver.html" download="LuxSync_Receiver.html">
          ⬇ Download LuxSync_Receiver.html
        </a>
      </div>
    </div>
  `;

  const video = container.querySelector('#rx-video');
  const hudCanvas = container.querySelector('#rx-hud-canvas');
  const hudCtx = hudCanvas.getContext('2d');
  const scanLine = container.querySelector('#rx-scan-line');
  const statusBanner = container.querySelector('#rx-status-banner');
  const progressFill = container.querySelector('#rx-progress-fill');
  const progressLabel = container.querySelector('#rx-progress-label');
  const progressPct = container.querySelector('#rx-progress-pct');
  const chunkGrid = container.querySelector('#rx-chunk-grid');
  const statFile = container.querySelector('#rx-stat-file');
  const statChunks = container.querySelector('#rx-stat-chunks');
  const statScanned = container.querySelector('#rx-stat-scanned');
  const statDupes = container.querySelector('#rx-stat-dupes');
  const startBtn = container.querySelector('#rx-start-btn');
  const stopBtn = container.querySelector('#rx-stop-btn');
  const downloadBtn = container.querySelector('#rx-download-btn');

  if ('BarcodeDetector' in window) {
    try { detector = new BarcodeDetector({ formats: ['qr_code'] }); } catch (e) {}
  }

  const scanCanvas = document.createElement('canvas');
  const scanCtx = scanCanvas.getContext('2d', { willReadFrequently: true });

  startBtn.addEventListener('click', startCamera);
  stopBtn.addEventListener('click', stopCamera);

  async function startCamera() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      video.srcObject = stream;
      await video.play();

      scanning = true;
      scanLine.classList.add('active');
      startBtn.classList.add('hidden');
      stopBtn.classList.remove('hidden');
      downloadBtn.classList.add('hidden');
      setStatus('Scanning... Point camera at sender screen', 'status-scanning');

      chunks = {}; totalChunks = 0; receivedCount = 0;
      totalScans = 0; dupeScans = 0; transferComplete = false;
      progressFill.style.width = '0%';
      progressPct.textContent = '0%';
      chunkGrid.innerHTML = '';

      scanLoop();
    } catch (e) {
      setStatus('Camera error: ' + e.message, 'status-error');
    }
  }

  function stopCamera() {
    scanning = false;
    scanLine.classList.remove('active');
    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
    stopBtn.classList.add('hidden');
    if (!transferComplete) {
      startBtn.classList.remove('hidden');
      setStatus('Camera stopped.', 'status-waiting');
    }
  }

  async function scanLoop() {
    if (!scanning) return;

    if (video.readyState >= video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
      const maxDim = 640;
      let w = video.videoWidth;
      let h = video.videoHeight;
      if (w > maxDim) {
        h = Math.round((h * maxDim) / w);
        w = maxDim;
      }
      scanCanvas.width = w;
      scanCanvas.height = h;
      scanCtx.drawImage(video, 0, 0, w, h);

      hudCanvas.width = video.videoWidth;
      hudCanvas.height = video.videoHeight;
      hudCtx.clearRect(0, 0, hudCanvas.width, hudCanvas.height);

      let foundQR = false;

      // 1. Hardware BarcodeDetector
      if (detector) {
        try {
          const results = await detector.detect(scanCanvas);
          for (const qr of results) {
            if (qr.rawValue && qr.rawValue.startsWith('LX|')) {
              foundQR = true;
              totalScans++;
              statScanned.textContent = totalScans;
              drawQRBoundingBox(qr.cornerPoints, w, h, hudCanvas.width, hudCanvas.height);
              processQR(qr.rawValue);
            }
          }
        } catch (e) {}
      }

      // 2. jsQR Engine
      if (!foundQR) {
        try {
          const imageData = scanCtx.getImageData(0, 0, w, h);
          const code = jsQR(imageData.data, w, h, {
            inversionAttempts: 'dontInvert'
          });

          if (code && code.data && code.data.startsWith('LX|')) {
            totalScans++;
            statScanned.textContent = totalScans;
            drawJsQRBoundingBox(code.location, w, h, hudCanvas.width, hudCanvas.height);
            processQR(code.data);
          }
        } catch (e) {}
      }
    }

    if (scanning && !transferComplete) {
      requestAnimationFrame(scanLoop);
    }
  }

  function drawQRBoundingBox(points, srcW, srcH, dstW, dstH) {
    if (!points || points.length < 4) return;
    const scaleX = dstW / srcW;
    const scaleY = dstH / srcH;

    hudCtx.strokeStyle = '#00f5a0';
    hudCtx.lineWidth = 4;
    hudCtx.shadowColor = '#00f5a0';
    hudCtx.shadowBlur = 10;
    hudCtx.beginPath();
    hudCtx.moveTo(points[0].x * scaleX, points[0].y * scaleY);
    for (let i = 1; i < points.length; i++) {
      hudCtx.lineTo(points[i].x * scaleX, points[i].y * scaleY);
    }
    hudCtx.closePath();
    hudCtx.stroke();
    hudCtx.shadowBlur = 0;
  }

  function drawJsQRBoundingBox(loc, srcW, srcH, dstW, dstH) {
    if (!loc) return;
    const scaleX = dstW / srcW;
    const scaleY = dstH / srcH;

    hudCtx.strokeStyle = '#00f5a0';
    hudCtx.lineWidth = 4;
    hudCtx.shadowColor = '#00f5a0';
    hudCtx.shadowBlur = 10;
    hudCtx.beginPath();
    hudCtx.moveTo(loc.topLeftCorner.x * scaleX, loc.topLeftCorner.y * scaleY);
    hudCtx.lineTo(loc.topRightCorner.x * scaleX, loc.topRightCorner.y * scaleY);
    hudCtx.lineTo(loc.bottomRightCorner.x * scaleX, loc.bottomRightCorner.y * scaleY);
    hudCtx.lineTo(loc.bottomLeftCorner.x * scaleX, loc.bottomLeftCorner.y * scaleY);
    hudCtx.closePath();
    hudCtx.stroke();
    hudCtx.shadowBlur = 0;
  }

  function processQR(raw) {
    if (!raw || !raw.startsWith('LX|')) return;
    const parts = raw.split('|');
    if (parts.length < 5) return;

    let idx, total, name, data;

    if (parts.length >= 7) {
      idx = parseInt(parts[1], 10);
      total = parseInt(parts[2], 10);
      isCompressed = parts[3] === '1';
      originalSize = parseInt(parts[4], 10);
      try { name = decodeURIComponent(parts[5]); } catch (e) { name = parts[5]; }
      data = parts.slice(6).join('|');
    } else {
      idx = parseInt(parts[1], 10);
      total = parseInt(parts[2], 10);
      try { name = decodeURIComponent(parts[3]); } catch (e) { name = parts[3]; }
      data = parts.slice(4).join('|');
    }

    if (isNaN(idx) || isNaN(total) || total <= 0) return;

    if (totalChunks === 0) {
      totalChunks = total;
      fileName = name || 'received_file';
      statFile.textContent = fileName;
      setStatus('Receiving data stream via light...', 'status-receiving');
      buildGrid(total);
    }

    if (chunks[idx] !== undefined) {
      dupeScans++;
      statDupes.textContent = dupeScans;
      return;
    }

    chunks[idx] = data;
    receivedCount++;
    if (navigator.vibrate) navigator.vibrate(20);

    const pct = Math.floor((receivedCount / totalChunks) * 100);
    progressFill.style.width = pct + '%';
    progressPct.textContent = pct + '%';
    progressLabel.textContent = `Frame ${receivedCount} of ${totalChunks}`;
    statChunks.textContent = `${receivedCount} / ${totalChunks}`;

    const cell = document.getElementById('rxcg-' + idx);
    if (cell) cell.classList.add('received');

    if (receivedCount >= totalChunks) finishTransfer();
  }

  function buildGrid(total) {
    chunkGrid.innerHTML = '';
    const display = Math.min(total, 300);
    for (let i = 0; i < display; i++) {
      const cell = document.createElement('div');
      cell.className = 'chunk-cell';
      cell.id = 'rxcg-' + i;
      chunkGrid.appendChild(cell);
    }
  }

  function finishTransfer() {
    transferComplete = true;
    stopCamera();
    setStatus('✅ File received! Preparing download...', 'status-done');
    progressFill.style.width = '100%';
    progressPct.textContent = '100%';
    progressLabel.textContent = 'Complete!';

    let fullBase64 = '';
    for (let i = 0; i < totalChunks; i++) fullBase64 += chunks[i] || '';

    try {
      const bin = atob(fullBase64);
      let bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

      if (isCompressed && fflate && fflate.decompressSync) {
        bytes = fflate.decompressSync(bytes);
      }

      const mimeType = getMimeType(fileName);
      const blob = new Blob([bytes], { type: mimeType });
      const url = URL.createObjectURL(blob);
      downloadBtn.href = url;
      downloadBtn.download = fileName;
      downloadBtn.classList.remove('hidden');
      if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
    } catch (e) {
      setStatus('Error processing file: ' + e.message, 'status-error');
    }
  }

  function setStatus(text, cls) {
    statusBanner.textContent = text;
    statusBanner.className = 'status-banner ' + cls;
  }

  return { destroy: () => { stopCamera(); } };
}
