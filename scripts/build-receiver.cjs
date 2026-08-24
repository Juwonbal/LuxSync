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
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');

    :root {
      /* 60% Dominant Base Neutral */
      --bg-deep: #020826;
      --bg-indigo: #040F49;
      --bg-surface: rgba(4, 15, 73, 0.8);
      
      /* 30% Secondary Structure (Royal Azure & Vivid Teal) */
      --royal-azure: #006BDF;
      --royal-azure-dim: rgba(0, 107, 223, 0.15);
      --vivid-teal: #00BFA6;
      --vivid-teal-dim: rgba(0, 191, 166, 0.15);
      --border-subtle: rgba(0, 107, 223, 0.22);
      
      /* 10% Accent (Cyber Lime & Electric Purple) */
      --cyber-lime: #00FF88;
      --cyber-lime-glow: rgba(0, 255, 136, 0.45);
      --electric-purple: #A259FF;
      
      --text-primary: #ffffff;
      --text-secondary: #c2d1e8;
      --text-tertiary: #7c92b8;
      --font-sans: 'Plus Jakarta Sans', -apple-system, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-font-smoothing: antialiased; }

    body {
      background-color: var(--bg-deep);
      background-image: 
        radial-gradient(ellipse 80% 50% at 50% -10%, rgba(0, 107, 223, 0.2), transparent 70%),
        radial-gradient(ellipse 60% 40% at 85% 95%, rgba(162, 89, 255, 0.12), transparent 70%),
        linear-gradient(to right, rgba(0, 107, 223, 0.04) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(0, 107, 223, 0.04) 1px, transparent 1px);
      background-size: 100% 100%, 100% 100%, 36px 36px, 36px 36px;
      color: var(--text-primary);
      font-family: var(--font-sans);
      min-height: 100vh;
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px;
      overflow-x: hidden;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 12px 0 16px;
    }

    .brand-icon {
      width: 40px; height: 40px;
      background: linear-gradient(135deg, var(--royal-azure), #020826);
      border: 1.5px solid var(--vivid-teal);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 16px rgba(0, 191, 166, 0.25);
    }
    .brand-icon svg { width: 20px; height: 20px; stroke: var(--cyber-lime); }

    .brand-text h1 {
      font-size: 1.35rem; font-weight: 800; letter-spacing: -0.02em;
      background: linear-gradient(135deg, #fff 40%, var(--vivid-teal) 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .brand-sub {
      font-size: 0.72rem; color: var(--text-secondary); font-family: var(--font-mono);
    }

    .surface-card {
      width: 100%; max-width: 460px;
      background: var(--bg-surface);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid var(--border-subtle);
      border-radius: 20px;
      padding: 16px;
      box-shadow: 0 16px 40px -10px rgba(2, 8, 38, 0.8);
      margin-bottom: 14px;
    }

    .status-pill {
      display: flex; align-items: center; justify-content: center; gap: 6px;
      padding: 8px 12px; border-radius: 9999px;
      font-size: 0.82rem; font-weight: 600; text-align: center;
      margin-bottom: 12px; transition: all 0.25s ease;
    }
    .status-waiting { background: rgba(0, 107, 223, 0.1); color: var(--text-secondary); border: 1px solid var(--border-subtle); }
    .status-scanning { background: var(--royal-azure-dim); color: #70b4ff; border: 1px solid var(--royal-azure); }
    .status-receiving { background: var(--vivid-teal-dim); color: var(--vivid-teal); border: 1px solid var(--vivid-teal); box-shadow: 0 0 16px rgba(0,191,166,0.2); }
    .status-done { background: rgba(0,255,136,0.15); color: var(--cyber-lime); border: 1px solid var(--cyber-lime); }

    .pulse-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: var(--cyber-lime); box-shadow: 0 0 6px var(--cyber-lime);
      animation: pulse 2s infinite;
    }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

    .viewport-chassis {
      position: relative; width: 100%;
      border-radius: 14px; overflow: hidden;
      border: 1.5px solid var(--royal-azure);
      aspect-ratio: 4 / 3; background: #020826;
      margin-bottom: 12px;
    }
    .viewport-chassis video { width: 100%; height: 100%; object-fit: cover; display: block; }
    .hud-overlay-canvas { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 10; }
    
    .laser-line {
      position: absolute; left: 8%; width: 84%; height: 2px;
      background: linear-gradient(90deg, transparent, var(--cyber-lime), transparent);
      box-shadow: 0 0 14px var(--cyber-lime);
      animation: laser 2.4s ease-in-out infinite;
      display: none; z-index: 5;
    }
    .laser-line.active { display: block; }
    @keyframes laser { 0%, 100% { top: 18%; opacity: 0.3; } 50% { top: 82%; opacity: 1; } }

    .viewfinder-reticle {
      position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; z-index: 4;
    }
    .viewfinder-reticle::before {
      content: ''; width: 55%; height: 55%; border: 1.5px solid rgba(0, 191, 166, 0.35); border-radius: 12px;
    }

    .timeline-bar {
      height: 6px; background: rgba(0, 107, 223, 0.25);
      border-radius: 3px; overflow: hidden; margin-bottom: 6px;
    }
    .timeline-fill {
      height: 100%; background: linear-gradient(90deg, var(--royal-azure), var(--vivid-teal));
      width: 0%; transition: width 0.15s linear;
    }
    .timeline-labels {
      display: flex; justify-content: space-between;
      font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-secondary);
      margin-bottom: 10px;
    }

    .chunk-matrix {
      display: flex; flex-wrap: wrap; gap: 3px; max-height: 60px; overflow: hidden;
      padding: 6px; background: rgba(2, 8, 38, 0.6); border-radius: 10px;
      border: 1px solid var(--border-subtle); margin-bottom: 10px;
    }
    .chunk-node {
      width: 7px; height: 7px; background: rgba(0, 107, 223, 0.2);
      border-radius: 2px; transition: background 0.2s, box-shadow 0.2s;
    }
    .chunk-node.received { background: var(--cyber-lime); box-shadow: 0 0 6px var(--cyber-lime); }

    .telemetry-deck {
      display: grid; grid-template-columns: 1fr 1fr; gap: 6px;
      background: rgba(2, 8, 38, 0.5); border: 1px solid var(--border-subtle);
      border-radius: 10px; padding: 8px 10px; font-size: 0.78rem;
    }
    .tele-item { display: flex; flex-direction: column; }
    .tele-label { font-size: 0.65rem; font-family: var(--font-mono); color: var(--text-tertiary); text-transform: uppercase; }
    .tele-val { font-family: var(--font-mono); font-weight: 700; color: var(--vivid-teal); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    /* 10% Pop CTA Buttons */
    .btn-tactical {
      width: 100%; padding: 14px; border: none; border-radius: 12px;
      font-family: var(--font-sans); font-weight: 700; font-size: 0.95rem;
      cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); text-decoration: none;
    }
    .btn-cyber-lime {
      background: linear-gradient(135deg, var(--cyber-lime), #00BFA6);
      color: #020826; box-shadow: 0 8px 30px -4px rgba(0, 255, 136, 0.45);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .btn-cyber-lime:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 35px -2px rgba(0, 255, 136, 0.6);
    }
    .btn-stop {
      background: rgba(255, 0, 127, 0.1); border: 1px solid rgba(255, 0, 127, 0.3); color: #ff007f;
    }
    .hidden { display: none !important; }
  </style>
  <script>
  ${jsQRMin}
  ${fflateMin}
  </script>
</head>
<body>

  <div class="brand">
    <div class="brand-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
      </svg>
    </div>
    <div>
      <div class="brand-text"><h1>LuxSync</h1></div>
      <div class="brand-sub">Optical Air-Gap Receiver</div>
    </div>
  </div>

  <div class="surface-card">
    <div id="status-pill" class="status-pill status-waiting">
      <span class="pulse-dot"></span>
      <span id="status-text">Tap Initialize to activate camera viewfinder</span>
    </div>

    <div class="viewport-chassis">
      <video id="cam-video" autoplay playsinline muted></video>
      <canvas id="hud-canvas" class="hud-overlay-canvas"></canvas>
      <div class="laser-line" id="laser-line"></div>
      <div class="viewfinder-reticle"></div>
    </div>

    <div class="timeline-bar">
      <div class="timeline-fill" id="progress-fill"></div>
    </div>
    <div class="timeline-labels">
      <span id="progress-label">Awaiting optical stream...</span>
      <span id="progress-pct" style="color:var(--vivid-teal);">0%</span>
    </div>

    <div class="chunk-matrix" id="chunk-grid"></div>

    <div class="telemetry-deck">
      <div class="tele-item">
        <span class="tele-label">File Target</span>
        <span class="tele-val" id="stat-file">—</span>
      </div>
      <div class="tele-item">
        <span class="tele-label">Chunks</span>
        <span class="tele-val" id="stat-chunks">0 / 0</span>
      </div>
      <div class="tele-item">
        <span class="tele-label">Total Scans</span>
        <span class="tele-val" id="stat-scanned">0</span>
      </div>
      <div class="tele-item">
        <span class="tele-label">Duplicates</span>
        <span class="tele-val" id="stat-dupes">0</span>
      </div>
    </div>
  </div>

  <!-- 10% Pop CTA Button: Cyber Lime -->
  <button class="btn-tactical btn-cyber-lime" id="btn-start" onclick="startCamera()">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
      <circle cx="12" cy="13" r="3"></circle>
    </svg>
    Initialize Camera Scanner
  </button>
  <button class="btn-tactical btn-stop hidden" id="btn-stop" onclick="stopCamera()">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="6" y="6" width="12" height="12"></rect>
    </svg>
    Stop Camera Viewfinder
  </button>
  <a class="btn-tactical btn-cyber-lime hidden" id="btn-download">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
    Save Reconstructed File
  </a>

  <script>
    function getMimeType(filename) {
      const ext = (filename.split('.').pop() || '').toLowerCase();
      const map = {
        pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
        gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', mp4: 'video/mp4',
        mov: 'video/quicktime', mp3: 'audio/mpeg', wav: 'audio/wav', txt: 'text/plain',
        html: 'text/html', css: 'text/css', js: 'text/javascript', json: 'application/json',
        zip: 'application/zip', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      };
      return map[ext] || 'application/octet-stream';
    }

    const video = document.getElementById('cam-video');
    const hudCanvas = document.getElementById('hud-canvas');
    const hudCtx = hudCanvas.getContext('2d');
    const laserLine = document.getElementById('laser-line');
    const progressFill = document.getElementById('progress-fill');
    const progressLabel = document.getElementById('progress-label');
    const progressPct = document.getElementById('progress-pct');
    const statusPill = document.getElementById('status-pill');
    const statusText = document.getElementById('status-text');
    const chunkGrid = document.getElementById('chunk-grid');
    const statFile = document.getElementById('stat-file');
    const statChunks = document.getElementById('stat-chunks');
    const statScanned = document.getElementById('stat-scanned');
    const statDupes = document.getElementById('stat-dupes');
    const btnStart = document.getElementById('btn-start');
    const btnStop = document.getElementById('btn-stop');
    const btnDownload = document.getElementById('btn-download');

    let stream = null;
    let scanning = false;
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
      statusText.textContent = text;
      statusPill.className = 'status-pill ' + cls;
    }

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } }
        });
        video.srcObject = stream;
        await video.play();

        scanning = true;
        laserLine.classList.add('active');
        btnStart.classList.add('hidden');
        btnStop.classList.remove('hidden');
        setStatus('Optical lock active. Point camera at screen.', 'status-scanning');

        chunks = {}; totalChunks = 0; receivedCount = 0;
        totalScans = 0; dupeScans = 0; transferComplete = false;
        progressFill.style.width = '0%';
        progressPct.textContent = '0%';
        chunkGrid.innerHTML = '';

        scanLoop();
      } catch (e) {
        setStatus('Camera error: ' + e.message, 'status-waiting');
      }
    }

    function stopCamera() {
      scanning = false;
      laserLine.classList.remove('active');
      if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
      btnStop.classList.add('hidden');
      if (!transferComplete) {
        btnStart.classList.remove('hidden');
        setStatus('Camera stopped.', 'status-waiting');
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

        if (!foundQR && typeof jsQR === 'function') {
          try {
            const imageData = scanCtx.getImageData(0, 0, w, h);
            const code = jsQR(imageData.data, w, h, { inversionAttempts: 'dontInvert' });
            if (code && code.data && code.data.startsWith('LX|')) {
              totalScans++;
              statScanned.textContent = totalScans;
              drawJsQRBoundingBox(code.location, w, h, hudCanvas.width, hudCanvas.height);
              processQRData(code.data);
            }
          } catch (e) {}
        }
      }

      if (scanning && !transferComplete) requestAnimationFrame(scanLoop);
    }

    function drawQRBoundingBox(points, srcW, srcH, dstW, dstH) {
      if (!points || points.length < 4) return;
      const scaleX = dstW / srcW;
      const scaleY = dstH / srcH;
      hudCtx.strokeStyle = '#00FF88';
      hudCtx.lineWidth = 4;
      hudCtx.shadowColor = '#00FF88';
      hudCtx.shadowBlur = 12;
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
      hudCtx.strokeStyle = '#00FF88';
      hudCtx.lineWidth = 4;
      hudCtx.shadowColor = '#00FF88';
      hudCtx.shadowBlur = 12;
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
        setStatus('Capturing optical data stream...', 'status-receiving');
        buildChunkGrid(total);
      }

      if (chunks[idx] !== undefined) {
        dupeScans++;
        statDupes.textContent = dupeScans;
        return;
      }

      chunks[idx] = data;
      receivedCount++;
      if (navigator.vibrate) navigator.vibrate(25);

      const pct = Math.floor((receivedCount / totalChunks) * 100);
      progressFill.style.width = pct + '%';
      progressPct.textContent = pct + '%';
      progressLabel.textContent = 'Frame ' + receivedCount + ' of ' + totalChunks;
      statChunks.textContent = receivedCount + ' / ' + totalChunks;

      const node = document.getElementById('cg-' + idx);
      if (node) node.classList.add('received');

      if (receivedCount >= totalChunks) finishTransfer();
    }

    function buildChunkGrid(total) {
      chunkGrid.innerHTML = '';
      const display = Math.min(total, 300);
      for (let i = 0; i < display; i++) {
        const node = document.createElement('div');
        node.className = 'chunk-node';
        node.id = 'cg-' + i;
        chunkGrid.appendChild(node);
      }
    }

    function finishTransfer() {
      transferComplete = true;
      stopCamera();
      setStatus('Transfer complete! File reconstructed.', 'status-done');
      progressFill.style.width = '100%';
      progressPct.textContent = '100%';
      progressLabel.textContent = 'Complete';

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
        btnDownload.href = url;
        btnDownload.download = fileName;
        btnDownload.classList.remove('hidden');

        if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
      } catch (e) {
        setStatus('Error: ' + e.message, 'status-waiting');
      }
    }
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(__dirname, '../public/receiver.html'), htmlContent);
console.log('Successfully generated receiver.html with 60-30-10 color scheme!');
