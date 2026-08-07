// Fast CRC-16 CCITT Implementation
const CRC16_TABLE = new Uint16Array(256);

for (let i = 0; i < 256; i++) {
  let c = i << 8;
  for (let j = 0; j < 8; j++) {
    c = (c & 0x8000) ? ((c << 1) ^ 0x1021) : (c << 1);
  }
  CRC16_TABLE[i] = c & 0xffff;
}

export function crc16(data, length = data.length) {
  let crc = 0xffff;
  for (let i = 0; i < length; i++) {
    const byte = data[i];
    crc = ((crc << 8) ^ CRC16_TABLE[((crc >> 8) ^ byte) & 0xff]) & 0xffff;
  }
  return crc;
}
