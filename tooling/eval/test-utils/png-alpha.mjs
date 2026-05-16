import fs from "node:fs";
import zlib from "node:zlib";

const PNG_SIGNATURE = "89504e470d0a1a0a";

function channelsForColorType(colorType) {
  switch (colorType) {
    case 0: return 1; // grayscale
    case 2: return 3; // RGB
    case 3: return 1; // indexed palette
    case 4: return 2; // grayscale + alpha
    case 6: return 4; // RGBA
    default: throw new Error(`Unsupported PNG color type ${colorType}`);
  }
}

function paethPredictor(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function parseChunks(buffer) {
  if (buffer.subarray(0, 8).toString("hex") !== PNG_SIGNATURE) {
    throw new Error("Not a PNG file");
  }

  const chunks = [];
  let offset = 8;

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString("ascii");
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    chunks.push({ type, data });
    offset += 12 + length;
    if (type === "IEND") break;
  }

  return chunks;
}

export function readPngAlpha(filePath) {
  const buffer = fs.readFileSync(filePath);
  const chunks = parseChunks(buffer);
  const ihdr = chunks.find((chunk) => chunk.type === "IHDR")?.data;
  if (!ihdr) throw new Error(`Missing IHDR: ${filePath}`);

  const width = ihdr.readUInt32BE(0);
  const height = ihdr.readUInt32BE(4);
  const bitDepth = ihdr.readUInt8(8);
  const colorType = ihdr.readUInt8(9);
  const compression = ihdr.readUInt8(10);
  const filter = ihdr.readUInt8(11);
  const interlace = ihdr.readUInt8(12);

  if (bitDepth !== 8) throw new Error(`Only 8-bit PNGs are supported: ${filePath}`);
  if (compression !== 0 || filter !== 0 || interlace !== 0) {
    throw new Error(`Unsupported PNG encoding: ${filePath}`);
  }

  const idat = Buffer.concat(chunks.filter((chunk) => chunk.type === "IDAT").map((chunk) => chunk.data));
  const raw = zlib.inflateSync(idat);
  const channels = channelsForColorType(colorType);
  const stride = width * channels;
  const palette = chunks.find((chunk) => chunk.type === "PLTE")?.data || null;
  const transparency = chunks.find((chunk) => chunk.type === "tRNS")?.data || null;
  const alpha = new Uint8Array(width * height);

  let src = 0;
  let prev = Buffer.alloc(stride);

  for (let y = 0; y < height; y += 1) {
    const filterType = raw[src++];
    const scanline = Buffer.from(raw.subarray(src, src + stride));
    src += stride;

    for (let x = 0; x < stride; x += 1) {
      const left = x >= channels ? scanline[x - channels] : 0;
      const up = prev[x] || 0;
      const upperLeft = x >= channels ? prev[x - channels] || 0 : 0;

      switch (filterType) {
        case 0:
          break;
        case 1:
          scanline[x] = (scanline[x] + left) & 0xff;
          break;
        case 2:
          scanline[x] = (scanline[x] + up) & 0xff;
          break;
        case 3:
          scanline[x] = (scanline[x] + Math.floor((left + up) / 2)) & 0xff;
          break;
        case 4:
          scanline[x] = (scanline[x] + paethPredictor(left, up, upperLeft)) & 0xff;
          break;
        default:
          throw new Error(`Unsupported PNG filter ${filterType}: ${filePath}`);
      }
    }

    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      const px = x * channels;

      if (colorType === 6) alpha[i] = scanline[px + 3];
      else if (colorType === 4) alpha[i] = scanline[px + 1];
      else if (colorType === 3) {
        const paletteIndex = scanline[px];
        alpha[i] = transparency && paletteIndex < transparency.length ? transparency[paletteIndex] : 255;
        if (!palette) throw new Error(`Indexed PNG missing palette: ${filePath}`);
      } else {
        alpha[i] = 255;
      }
    }

    prev = scanline;
  }

  return { width, height, alpha };
}

export function alphaBounds(filePath, threshold = 16) {
  const { width, height, alpha } = readPngAlpha(filePath);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let pixels = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (alpha[y * width + x] <= threshold) continue;
      pixels += 1;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  if (!pixels) {
    return { width, height, pixels: 0, empty: true, x: 0, y: 0, w: 0, h: 0, coverageX: 0, coverageY: 0, centerOffsetX: 0, centerOffsetY: 0 };
  }

  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  const centerX = minX + w / 2;
  const centerY = minY + h / 2;

  return {
    width,
    height,
    pixels,
    empty: false,
    x: minX,
    y: minY,
    w,
    h,
    coverageX: w / width,
    coverageY: h / height,
    centerOffsetX: (centerX - width / 2) / width,
    centerOffsetY: (centerY - height / 2) / height,
  };
}
