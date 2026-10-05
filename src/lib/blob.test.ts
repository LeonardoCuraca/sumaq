import { describe, it, expect } from 'vitest';
import { sniffImageType } from './blob';

describe('image magic byte sniffing', () => {
  it('detects JPEG format from header bytes', () => {
    const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    expect(sniffImageType(jpegBytes)).toBe('image/jpeg');
  });

  it('detects PNG format from header bytes', () => {
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(sniffImageType(pngBytes)).toBe('image/png');
  });

  it('detects WebP format from RIFF/WEBP header bytes', () => {
    // RIFF....WEBP
    const webpBytes = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, // "RIFF"
      0x00, 0x00, 0x00, 0x00, // file length placeholder
      0x57, 0x45, 0x42, 0x50, // "WEBP"
    ]);
    expect(sniffImageType(webpBytes)).toBe('image/webp');
  });

  it('rejects text, HTML, and executables disguised with image extensions', () => {
    const htmlBytes = new TextEncoder().encode('<!DOCTYPE html><html>');
    expect(sniffImageType(htmlBytes)).toBeNull();

    const exeBytes = new Uint8Array([0x4d, 0x5a, 0x90, 0x00]); // MZ header
    expect(sniffImageType(exeBytes)).toBeNull();
  });
});
