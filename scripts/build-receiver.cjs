const fs = require('fs');
const path = require('path');

const jsQRMin = fs.readFileSync(path.join(__dirname, '../public/jsQR.min.js'), 'utf8');
const fflateMin = fs.readFileSync(path.join(__dirname, '../public/fflate.min.js'), 'utf8');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>LuxSync Optical Receiver</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap');

    :root {
      --bg: #070a12;
      --surface: rgba(15, 23, 42, 0.75);
      --border: rgba(0, 242, 254, 0.18);
      --cyan: #00f2fe;
      --green: #00f5a0;
      --magenta: #ff007f;
      --text: #f1f5f9;
      --muted: #94a3b8;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      background: var(--bg);
      background-image:
        radial-gradient(circle at 20% 30%, rgba(0,242,254,0.06) 0%, transparent 50%),
        radial-gradient(circle at 80% 70%, rgba(127,0,255,0.06) 0%, transparent 50%);
      color: var(--text);
      font-family: 'Outfit', system-ui, -apple-system, sans-serif;
      min-height: 100vh;
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px;
      overflow-x: hidden;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 12px 0 6px;
    }

    .logo-icon {
      width: 36px; height: 36px;
      background: linear-gradient(135deg, var(--cyan), #7f00ff);
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px;
      box-shadow: 0 0 18px rgba(0,242,254,0.3);
    }

    .logo h1 {
      font-size: 1.5rem; font-weight: 800; letter-spacing: -0.5px;
      background: linear-gradient(90deg, #fff, var(--cyan));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }

    .subtitle {
      font-size: 0.82rem; color: var(--muted); margin-bottom: 14px; text-align: center;
    }

    .card {
      width: 100%; max-width: 460px;
      background: var(--surface);
      backdrop-filter: blur(16px);
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 16px;
      margin-bottom: 12px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.4);
    }

    #status-banner {
      text-align: center; padding: 10px;
      font-weight: 600; font-size: 0.95rem;
      border-radius: 10px;
      margin-bottom: 12px;
      transition: all 0.3s ease;
    }
    .status-waiting { background: rgba(148,163,184,0.1); color: var(--muted); }
    .status-scanning { background: rgba(0,242,254,0.1); color: var(--cyan); border: 1px solid rgba(0,242,254,0.3); }
    .status-receiving { background: rgba(0,245,160,0.1); color: var(--green); border: 1px solid rgba(0,245,160,0.3); }
    .status-done { background: rgba(0,245,160,0.15); color: var(--green); border: 1px solid var(--green); }
    .status-error { background: rgba(255,0,127,0.1); color: var(--magenta); border: 1px solid var(--magenta); }

    .camera-wrap {
      position: relative; width: 100%;
      border-radius: 14px; overflow: hidden;
      border: 2px solid var(--border);
      aspect-ratio: 4 / 3;
      background: #000;
      margin-bottom: 12px;
    }
    .camera-wrap video {
      width: 100%; height: 100%; object-fit: cover; display: block;
    }
    .hud-canvas-overlay {
      position: absolute; inset: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 10;
    }
    .scan-line {
      position: absolute; left: 5%; width: 90%; height: 2px;
      background: linear-gradient(90deg, transparent, var(--cyan), transparent);
      box-shadow: 0 0 12px var(--cyan);
      animation: scanMove 2s ease-in-out infinite;
      display: none;
    }
    .scan-line.active { display: block; }
    @keyframes scanMove {
      0%, 100% { top: 15%; }
      50% { top: 85%; }
    }

    .progress-section { margin-bottom: 12px; }
    .progress-header {
      display: flex; justify-content: space-between;
      font-size: 0.85rem; font-weight: 600;
      margin-bottom: 6px;
    }
    .progress-track {
      height: 14px; background: rgba(255,255,255,0.06);
      border-radius: 7px; overflow: hidden;
      border: 1px solid var(--border);
    }
    .progress-fill {
      height: 100%; width: 0;
      background: linear-gradient(90deg, var(--cyan), var(--green));
      box-shadow: 0 0 10px rgba(0,245,160,0.3);
      border-radius: 7px;
      transition: width 0.25s ease;
    }

    .chunk-grid {
      display: flex; flex-wrap: wrap; gap: 2px;
      margin: 10px 0;
      max-height: 60px; overflow: hidden;
    }
    .chunk-cell {
      width: 8px; height: 8px;
      background: rgba(255,255,255,0.06);
      border-radius: 2px;
      transition: background 0.2s;
    }
    .chunk-cell.received {
      background: var(--green);
      box-shadow: 0 0 4px rgba(0,245,160,0.4);
    }

    .stats-grid {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 8px; font-size: 0.82rem;
    }
    .stat-item {
      background: rgba(0,0,0,0.2);
      padding: 8px 10px; border-radius: 8px;
    }
    .stat-label { color: var(--muted); margin-bottom: 2px; }
    .stat-value { font-weight: 700; color: var(--cyan); font-family: 'JetBrains Mono', monospace, system-ui; }

    .btn {
      width: 100%; padding: 14px;
      border: none; border-radius: 12px;
      font-family: inherit; font-weight: 700; font-size: 1rem;
      cursor: pointer; display: flex; align-items: center;
      justify-content: center; gap: 8px;
      transition: all 0.25s ease;
      text-decoration: none;
    }
    .btn-start {
      background: linear-gradient(135deg, var(--cyan), #00a8ff);
      color: #000;
    }
    .btn-stop {
      background: linear-gradient(135deg, var(--magenta), #d50000);
      color: #fff;
    }
    .btn-download {
      background: linear-gradient(135deg, var(--green), #00c853);
      color: #000; font-size: 1.1rem;
      box-shadow: 0 0 20px rgba(0,245,160,0.3);
    }
    .btn:active { transform: scale(0.97); }
    .hidden { display: none !important; }

    #celebration {
      position: fixed; inset: 0;
      display: none; align-items: center; justify-content: center;
      background: rgba(7,10,18,0.85);
      backdrop-filter: blur(8px);
      z-index: 100;
      flex-direction: column; gap: 16px;
      padding: 24px; text-align: center;
    }
    #celebration.show { display: flex; }
    #celebration h2 { font-size: 2rem; }
    #celebration .file-name {
      font-size: 0.9rem; color: var(--cyan);
      word-break: break-all;
    }
  </style>
  <script>
  // Embedded jsQR Engine
  ${jsQRMin}
  // Embedded fflate Decompression Engine
  ${fflateMin}
  </script>
</head>
<body>

  <div class="logo">
    <div class="logo-icon">⚡</div>
    <h1>LuxSync Receiver</h1>
  </div>
  <p class="subtitle">Air-Gapped Optical Receiver — Point camera at the screen</p>

  <div class="card">
    <div id="status-banner" class="status-waiting">
      Tap "Start Camera" and point at the sender screen
    </div>

    <div class="camera-wrap">
      <video id="cam-video" autoplay playsinline muted></video>
      <canvas id="cam-hud-canvas" class="hud-canvas-overlay"></canvas>
      <div class="scan-line" id="scan-line"></div>
    </div>

    <div class="progress-section">
      <div class="progress-header">
        <span id="progress-label">Waiting for signal...</span>
        <span id="progress-pct">0%</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" id="progress-fill"></div>
      </div>
    </div>

    <div class="chunk-grid" id="chunk-grid"></div>

    <div class="stats-grid">
      <div class="stat-item">
        <div class="stat-label">File</div>
        <div class="stat-value" id="stat-file">—</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Chunks</div>
        <div class="stat-value" id="stat-chunks">0 / 0</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Scanned</div>
        <div class="stat-value" id="stat-scanned">0</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Dupes Skipped</div>
        <div class="stat-value" id="stat-dupes">0</div>
      </div>
    </div>
  </div>

  <button class="btn btn-start" id="btn-start" onclick="startCamera()">
    📷 Start Camera
  </button>
  <button class="btn btn-stop hidden" id="btn-stop" onclick="stopCamera()">
    ⏹ Stop Camera
  </button>
  <a class="btn btn-download hidden" id="btn-download">
    💾 Save Received File
  </a>

  <!-- Celebration Overlay -->
  <div id="celebration">
    <h2>🎉 Transfer Complete!</h2>
    <p>File received via light & ready to open.</p>
    <p class="file-name" id="cel-filename"></p>
    <a class="btn btn-download" id="cel-download" style="max-width:300px">
      💾 Save File
    </a>
  </div>

  <script>
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

    const video = document.getElementById('cam-video');
    const hudCanvas = document.getElementById('cam-hud-canvas');
    const hudCtx = hudCanvas.getContext('2d');
    const scanLine = document.getElementById('scan-line');
    const progressFill = document.getElementById('progress-fill');
    const progressLabel = document.getElementById('progress-label');
    const progressPct = document.getElementById('progress-pct');
    const statusBanner = document.getElementById('status-banner');
    const chunkGrid = document.getElementById('chunk-grid');
    const statFile = document.getElementById('stat-file');
    const statChunks = document.getElementById('stat-chunks');
    const statScanned = document.getElementById('stat-scanned');
    const statDupes = document.getElementById('stat-dupes');
    const btnStart = document.getElementById('btn-start');
    const btnStop = document.getElementById('btn-stop');
    const btnDownload = document.getElementById('btn-download');
    const celebration = document.getElementById('celebration');
    const celFilename = document.getElementById('cel-filename');
    const celDownload = document.getElementById('cel-download');

    let stream = null;
    let scanning = false;

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

    let detector = null;
    if ('BarcodeDetector' in window) {
      try { detector = new BarcodeDetector({ formats: ['qr_code'] }); } catch (e) {}
    }

    function setStatus(text, cls) {
      statusBanner.textContent = text;
      statusBanner.className = cls;
    }

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 }
          }
        });

        video.srcObject = stream;
        await video.play();

        scanning = true;
        scanLine.classList.add('active');
        btnStart.classList.add('hidden');
        btnStop.classList.remove('hidden');
        setStatus('Scanning... Point camera at sender screen', 'status-scanning');

        chunks = {}; totalChunks = 0; receivedCount = 0;
        totalScans = 0; dupeScans = 0; transferComplete = false;
        progressFill.style.width = '0%';
        progressPct.textContent = '0%';
        chunkGrid.innerHTML = '';

        scanLoop();
      } catch (e) {
        setStatus('📷 Camera error: ' + e.message, 'status-error');
      }
    }

    function stopCamera() {
      scanning = false;
      scanLine.classList.remove('active');
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
        stream = null;
      }
      btnStop.classList.add('hidden');
      if (!transferComplete) {
        btnStart.classList.remove('hidden');
        setStatus('Camera stopped. Tap Start to resume.', 'status-waiting');
      }
    }

    const scanCanvas = document.createElement('canvas');
    const scanCtx = scanCanvas.getContext('2d', { willReadFrequently: true });

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
                processQRData(qr.rawValue);
              }
            }
          } catch (e) {}
        }

        // 2. High-speed jsQR (<10ms)
        if (!foundQR && typeof jsQR === 'function') {
          try {
            const imageData = scanCtx.getImageData(0, 0, w, h);
            const code = jsQR(imageData.data, w, h, {
              inversionAttempts: 'dontInvert'
            });
            if (code && code.data && code.data.startsWith('LX|')) {
              totalScans++;
              statScanned.textContent = totalScans;
              drawJsQRBoundingBox(code.location, w, h, hudCanvas.width, hudCanvas.height);
              processQRData(code.data);
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

    function processQRData(raw) {
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
        setStatus('Receiving data stream...', 'status-receiving');
        buildChunkGrid(total);
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
      progressLabel.textContent = \`Receiving frame \${receivedCount} of \${totalChunks}\`;
      statChunks.textContent = \`\${receivedCount} / \${totalChunks}\`;

      const cell = document.getElementById('cg-' + idx);
      if (cell) cell.classList.add('received');

      if (receivedCount >= totalChunks) {
        finishTransfer();
      }
    }

    function buildChunkGrid(total) {
      chunkGrid.innerHTML = '';
      const display = Math.min(total, 300);
      for (let i = 0; i < display; i++) {
        const cell = document.createElement('div');
        cell.className = 'chunk-cell';
        cell.id = 'cg-' + i;
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
      for (let i = 0; i < totalChunks; i++) {
        fullBase64 += chunks[i] || '';
      }

      try {
        const binaryStr = atob(fullBase64);
        let bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }

        if (isCompressed && typeof fflate !== 'undefined' && fflate.decompressSync) {
          bytes = fflate.decompressSync(bytes);
        }

        const mimeType = getMimeType(fileName);
        const blob = new Blob([bytes], { type: mimeType });
        const url = URL.createObjectURL(blob);

        btnDownload.href = url;
        btnDownload.download = fileName;
        btnDownload.classList.remove('hidden');

        celDownload.href = url;
        celDownload.download = fileName;
        celFilename.textContent = fileName + ' (' + formatBytes(bytes.length) + ')';
        celebration.classList.add('show');

        if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
      } catch (e) {
        setStatus('⚠ Error processing file: ' + e.message, 'status-error');
      }
    }

    function formatBytes(bytes) {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / 1048576).toFixed(1) + ' MB';
    }

    celebration.addEventListener('click', (e) => {
      if (e.target === celebration) {
        celebration.classList.remove('show');
      }
    });
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(__dirname, '../public/receiver.html'), htmlContent);
console.log('Successfully rebuilt receiver.html with MIME type preservation!');
