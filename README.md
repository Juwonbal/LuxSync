# ⚡ LuxSync — Air-Gapped Optical File Transfer

<p align="center">
  <img src="https://img.shields.io/badge/Air--Gapped-Optical%20Light%20Beam-00f2fe?style=for-the-badge&logo=fastapi&logoColor=black" alt="Air Gapped" />
  <img src="https://img.shields.io/badge/Zero%20Network-100%25%20Offline-00f5a0?style=for-the-badge" alt="Zero Network" />
  <img src="https://img.shields.io/badge/No%20App%20Required-Native%20Browser-ff007f?style=for-the-badge" alt="No App Required" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License" />
</p>

<p align="center">
  <b>Beam files from screen to phone using high-speed optical light patterns. No cables, no Bluetooth, no Wi-Fi, no cloud servers, and no app installs required.</b>
</p>

---

## 🌟 What is LuxSync?

**LuxSync** is an air-gapped optical file transmission system that moves data between completely isolated devices using visible light on a screen and a smartphone camera. 

Inspired by optical data fountains and visual steganography, LuxSync slices any file (images, PDFs, documents, code, archives, audio, video) into structured binary frames, encodes them into high-contrast QR matrices surrounded by animated Sci-Fi HUD themes, and streams them off the display. A receiving smartphone camera captures the optical stream in real time, reconstructs the chunks, and downloads the original file.

---

## ✨ Key Features

- **🛡️ 100% Air-Gapped & Private**: Zero packets sent over the internet, local network, Bluetooth, or NFC. Complete immunity against network sniffing or remote interception.
- **📱 Zero App Installation**: The receiver is an ultra-lightweight, offline-first standalone HTML file (`receiver.html`, ~45KB) that runs in any mobile browser (Safari, Chrome, Firefox) with no app download.
- **🗜️ User-Controlled DEFLATE Compression**: Choose between exact raw binary transfer or real-time DEFLATE compression (`fflate`) to shrink documents, code, and PDFs by up to 90% for high-speed transmission.
- **🎯 10ms Mobile Vision Pipeline**: Optimized camera stream normalization (640p) and dual-engine recognition (`BarcodeDetector` API + embedded `jsQR`) for sub-10ms frame detection.
- **🟩 Live HUD Bounding Box Tracker**: The receiver draws a live neon-green tracking bounding box over detected QR codes in real time, with haptic and visual confirmation.
- **🎨 Sci-Fi & Cyberpunk HUD Themes**: Choose between multiple visual container styles:
  - ⚡ **Cyberpunk HUD**: Neon cyan grid lines & obsidian tiles
  - 🌌 **Bioluminescent Frame**: Organic emerald energy rings
  - 💚 **Matrix Terminal**: Terminal green scanlines & digital glyph accents
  - 🎨 **Neon Stencil Card**: HSL color-shifting neon border brackets
  - ⬜ **Standard B&W QR**: Classic high-contrast monochrome
- **📄 Full Filename & Native MIME Preservation**: Preserves exact filename extensions and attaches native system MIME types so iOS/Android open received files directly in default apps (PDF Reader, Word, Gallery, Files).
- **🔄 Auto-Cycle Redundancy**: Streams frames in continuous cyclic loops — if glare or camera shake causes a missed frame, the receiver catches it on the next pass without restarting.

---

## 🔬 Protocol Specification

LuxSync encodes file payloads into pipe-delimited optical packets:

```text
LX|<chunk_index>|<total_chunks>|<comp_flag>|<original_size>|<encoded_filename>|<base64_payload>
```

| Field | Type | Description |
|---|---|---|
| `LX` | String | Protocol identifier magic bytes |
| `chunk_index` | Integer | 0-indexed sequence number of the current frame |
| `total_chunks` | Integer | Total number of frames required to reassemble the file |
| `comp_flag` | String | `1` if payload is DEFLATE compressed, `0` if raw original binary |
| `original_size` | Integer | Original uncompressed file byte length |
| `encoded_filename` | String | URI-encoded filename preserving extension (`encodeURIComponent`) |
| `base64_payload` | String | Base64-encoded binary chunk payload |

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/Juwonbal/LuxSync.git

# Navigate to directory
cd LuxSync

# Install dependencies
npm install

# Start development server with LAN host support
npm run dev
```

### Production Build

```bash
# Build the production bundle and standalone receiver
npm run build

# Preview the production build
npm run preview
```

---

## 📖 How to Transfer Files

### 1. Sender (Computer / Screen)
1. Open LuxSync in your browser (`http://localhost:5173/` or your hosted URL).
2. Drag and drop any file (PDF, image, document, archive, code).
3. Select your preferred **Compression Option**:
   - **📦 Original Raw Format**: Sends exact byte-for-byte replica.
   - **⚡ DEFLATE Compression**: Compresses file for fewer optical frames.
4. Select your **Theme** and **Flashing Speed** (5 FPS recommended).

### 2. Receiver (Phone / Device)
1. **Option A (Same Network / Online)**: Scan the Step 1 QR code with your phone camera or visit the hosted receiver URL.
2. **Option B (100% Offline Air-Gap)**: Download `receiver.html` once to your phone. Open it directly in your mobile browser with Wi-Fi and Cellular data turned completely off!
3. Tap **📷 Start Camera** and point the phone camera at the screen.
4. Watch the chunk grid light up in green as frames are captured!
5. Tap **💾 Save Received File** when complete — your file opens directly in your phone's native viewer.

---

## 🛠️ Tech Stack

- **Frontend Core**: Vanilla ES6+, Vite
- **Optical Encoding**: [`qrcode`](https://www.npmjs.com/package/qrcode)
- **Computer Vision Decoding**: Native `BarcodeDetector` API + [`jsQR`](https://github.com/cozmo/jsQR) fallback
- **Real-Time Binary Compression**: [`fflate`](https://github.com/101arrowz/fflate) (high-speed DEFLATE implementation)
- **Styling**: Cyberpunk Glassmorphism CSS, Outfit & JetBrains Mono typography

---

## 🔒 Security & Air-Gap Applications

LuxSync is designed for environments where traditional electronic connections are forbidden or compromised:
- **Zero RF Emissions**: No radio frequencies emitted during transfer (Wi-Fi, Bluetooth, Cellular disabled).
- **Physical Isolation**: Enables data extraction from physically air-gapped workstations, secure enclaves, and offline cryptographic hardware wallets.
- **No Residual Traces**: Data exists solely as transient light pulses on screen and is assembled directly in memory on the receiving device.

---

## 📄 License

This project is open-source and licensed under the [MIT License](LICENSE).
