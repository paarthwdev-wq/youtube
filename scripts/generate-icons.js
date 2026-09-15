import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Minimal pure-JS PNG encoder to create crisp icons with no external binary dependencies
function createPNG(width, height, colorBuffer) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // 8-bit depth
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Raw image scanlines with filter byte 0
  const scanlines = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;
  for (let y = 0; y < height; y++) {
    scanlines.writeUInt8(0, offset++); // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      scanlines.writeUInt8(colorBuffer[idx], offset++);
      scanlines.writeUInt8(colorBuffer[idx + 1], offset++);
      scanlines.writeUInt8(colorBuffer[idx + 2], offset++);
      scanlines.writeUInt8(colorBuffer[idx + 3], offset++);
    }
  }

  const compressed = zlib.deflateSync(scanlines);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4);
  data.copy(chunk, 8);
  const crc = crc32(Buffer.concat([Buffer.from(type), data]));
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

// CRC32 implementation
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Generate stylized icon buffer
function renderIconBuffer(size, maskable = false) {
  const buf = Buffer.alloc(size * size * 4);
  const center = size / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      
      // Background gradient (Dark modern charcoal #18181b to #09090b)
      const gradT = (y / size);
      let r = Math.round(24 - gradT * 15);
      let g = Math.round(24 - gradT * 15);
      let b = Math.round(27 - gradT * 16);
      let a = 255;

      // Card / YouTube rounded rect
      const cardScale = maskable ? 0.65 : 0.8;
      const cardW = size * cardScale;
      const cardH = size * cardScale * 0.7;
      const cardX = (size - cardW) / 2;
      const cardY = (size - cardH) / 2.3;

      if (x >= cardX && x <= cardX + cardW && y >= cardY && y <= cardY + cardH) {
        // Red YouTube card color #FF0033 to #D90429
        const cyGrad = (y - cardY) / cardH;
        r = Math.round(255 - cyGrad * 38);
        g = Math.round(0 + cyGrad * 10);
        b = Math.round(51 - cyGrad * 20);

        // Center Play triangle
        const triCenterX = cardX + cardW * 0.48;
        const triCenterY = cardY + cardH * 0.5;
        const triSize = cardH * 0.35;
        
        // Check if inside triangle
        const px = x - (triCenterX - triSize * 0.5);
        const py = y - triCenterY;
        if (px >= 0 && px <= triSize * 1.2 && Math.abs(py) <= px * 0.58) {
          r = 255;
          g = 255;
          b = 255;
        }
      }

      // Small Mic badge on lower-right
      const badgeX = size * 0.72;
      const badgeY = size * 0.72;
      const badgeR = size * (maskable ? 0.14 : 0.16);
      const distBadge = Math.hypot(x - badgeX, y - badgeY);

      if (distBadge <= badgeR) {
        // Red circle with white center mic
        if (distBadge <= badgeR * 0.85) {
          r = 220; g = 20; b = 40;
          if (distBadge <= badgeR * 0.4) {
            r = 255; g = 255; b = 255;
          }
        } else {
          r = 40; g = 40; b = 45;
        }
      }

      buf[idx] = r;
      buf[idx + 1] = g;
      buf[idx + 2] = b;
      buf[idx + 3] = a;
    }
  }
  return buf;
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

// 192x192
const buf192 = renderIconBuffer(192, false);
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPNG(192, 192, buf192));

// 512x512
const buf512 = renderIconBuffer(512, false);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPNG(512, 512, buf512));

// maskable 512x512
const bufMask = renderIconBuffer(512, true);
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPNG(512, 512, bufMask));

// apple-touch-icon 180x180
const buf180 = renderIconBuffer(180, false);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPNG(180, 180, buf180));

// favicon
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPNG(192, 192, buf192));

console.log('Successfully generated all PWA icons.');
