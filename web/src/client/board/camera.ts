import { hexToPixel, pixelToHex, type Hex, type Point } from '../../shared/hex.ts';

/** View center in world units (hex size 1) and zoom in CSS pixels per unit. */
export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export const MIN_ZOOM = 9;
export const MAX_ZOOM = 90;

export const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

export function worldToScreen(cam: Camera, width: number, height: number, p: Point): Point {
  return { x: (p.x - cam.x) * cam.zoom + width / 2, y: (p.y - cam.y) * cam.zoom + height / 2 };
}

export function screenToWorld(cam: Camera, width: number, height: number, sx: number, sy: number): Point {
  return { x: (sx - width / 2) / cam.zoom + cam.x, y: (sy - height / 2) / cam.zoom + cam.y };
}

export function screenToCell(cam: Camera, width: number, height: number, sx: number, sy: number): Hex {
  const w = screenToWorld(cam, width, height, sx, sy);
  return pixelToHex(w.x, w.y, 1);
}

export function zoomAt(cam: Camera, width: number, height: number, sx: number, sy: number, factor: number): Camera {
  const before = screenToWorld(cam, width, height, sx, sy);
  const zoom = clampZoom(cam.zoom * factor);
  return { x: before.x - (sx - width / 2) / zoom, y: before.y - (sy - height / 2) / zoom, zoom };
}

export function fitCells(cells: readonly Hex[], width: number, height: number, margin = 4, maxZoom = 34): Camera {
  const points = cells.length > 0 ? cells.map((c) => hexToPixel(c, 1)) : [{ x: 0, y: 0 }];
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  const spanX = maxX - minX + margin * 2 * Math.sqrt(3);
  const spanY = maxY - minY + margin * 2 * 1.5;
  const zoom = clampZoom(Math.min(width / spanX, height / spanY, maxZoom));
  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2, zoom };
}
