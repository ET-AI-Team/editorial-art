/**
 * Smart crop window selection (Step 6.7.2), pure so it is easy to test. Boxes are fractions of the
 * source image. The window keeps the target aspect at the largest size the source allows and
 * contains every subject box with padding; when no such window exists the size must be extended.
 */

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CropWindow {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function clampBoxes(boxes: Box[]): Box[] {
  return boxes
    .map((b) => {
      const x = Math.min(1, Math.max(0, b.x));
      const y = Math.min(1, Math.max(0, b.y));
      return { x, y, w: Math.min(1 - x, Math.max(0, b.w)), h: Math.min(1 - y, Math.max(0, b.h)) };
    })
    .filter((b) => b.w >= 0.01 && b.h >= 0.01);
}

/** Returns null when no window of this aspect can contain all the boxes. */
export function cropWindow(srcW: number, srcH: number, aspect: number, boxes: Box[], pad = 0.04): CropWindow | null {
  let width = srcW;
  let height = Math.round(srcW / aspect);
  if (height > srcH) {
    height = srcH;
    width = Math.round(srcH * aspect);
  }
  if (!boxes.length) return { left: Math.round((srcW - width) / 2), top: Math.round((srcH - height) / 2), width, height };

  const minX = Math.max(0, Math.min(...boxes.map((b) => b.x)) - pad) * srcW;
  const maxX = Math.min(1, Math.max(...boxes.map((b) => b.x + b.w)) + pad) * srcW;
  const minY = Math.max(0, Math.min(...boxes.map((b) => b.y)) - pad) * srcH;
  const maxY = Math.min(1, Math.max(...boxes.map((b) => b.y + b.h)) + pad) * srcH;
  if (maxX - minX > width + 0.5 || maxY - minY > height + 0.5) return null;

  // Centre the window on the subjects, then slide it back inside the image.
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const left = Math.round(Math.min(srcW - width, Math.max(0, cx - width / 2)));
  const top = Math.round(Math.min(srcH - height, Math.max(0, cy - height / 2)));
  return { left, top, width, height };
}
