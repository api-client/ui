export declare interface TouchCopy {
  identifier: number;
  pageX: number;
  pageY: number;
}

export declare interface TouchMoveResult {
  identifier: number;
  dx: number;
  dy: number;
}

const cache: TouchCopy[] = [];

function copyTouch({ identifier, pageX, pageY }: Touch): TouchCopy {
  return { identifier, pageX, pageY };
}

function getTouchById(id: number): number {
  for (let i = 0; i < cache.length; i++) {
    const { identifier } = cache[i];
    if (id === identifier) {
      return i;
    }
  }
  return -1;
}

export function add(event: TouchEvent): void {
  const touches = event.changedTouches;
  for (let i = 0; i < touches.length; i++) {
    cache.push(copyTouch(touches[i]));
  }
}

export function move(event: TouchEvent): TouchMoveResult[] {
  if (event.cancelable) {
    event.preventDefault();
  }
  const touches = event.changedTouches;
  const result = [];
  for (let i = 0; i < touches.length; i++) {
    const touch = touches[i];
    const index = getTouchById(touch.identifier);
    if (index === -1) {
      continue;
    }
    const copy = copyTouch(touch);
    const { pageX: opx, pageY: opy } = cache[index];
    const { identifier, pageX, pageY } = copy;
    cache.splice(index, 1, copy);
    result.push({
      identifier,
      dx: -(pageX - opx),
      dy: -(pageY - opy),
    });
  }
  return result;
}

export function end(event: TouchEvent): void {
  const touches = event.changedTouches;
  for (let i = 0; i < touches.length; i++) {
    const touch = touches[i];
    const index = getTouchById(touch.identifier);
    if (index === -1) {
      continue;
    }
    cache.splice(index, 1);
  }
}
