import VizWorkspaceElement from '../elements/VizWorkspaceElement.js';
import { getObjectBoundingClientRect, notifyMoved } from './PositionUtils.js';

interface IPositionInfo {
  node: HTMLElement; 
  box: DOMRect;
}

/**
 * A class that adds support for the nodes alignment on the workspace.
 * It adds methods that can align and distribute selected nodes.
 */
export class WorkspaceAlignment {
  /**
   * @return Currently selected on the workspace items.
   */
  get items(): HTMLElement[] {
    const { workspace } = this;
    const result: HTMLElement[] = [];
    workspace.selection.selected.forEach((i) => {
      const item = workspace.querySelector(`[data-key="${i.id}"][data-alignable]`) as HTMLElement | null;
      if (item) {
        result.push(item);
      }
    });
    return result;
  }

  constructor(public workspace: VizWorkspaceElement) {
  }

  /**
   * @returns True when the number of selected items is above 1.
   */
  multiSelection(): boolean {
    return this.items.length > 1;
  }

  /**
   * Aligns selected items vertically to the top.
   */
  verticalTop(): void {
    if (!this.multiSelection()) {
      return;
    }
    const { items } = this;
    const first = items.shift()!;
    const box = getObjectBoundingClientRect(first, this.workspace);
    items.forEach(async (node) => {
      const nodeBox = getObjectBoundingClientRect(node, this.workspace);
      const dy = box.y - nodeBox.y;
      if (dy !== 0) {
        notifyMoved(node, 0, dy);
      }
    });
  }

  /**
   * Aligns selected items vertically to the middle.
   */
  verticalCenter(): void {
    if (!this.multiSelection()) {
      return;
    }
    const { items } = this;
    const first = items.shift()!;
    const box = getObjectBoundingClientRect(first, this.workspace);
    const middle = box.height / 2 + box.y;
    items.forEach((node) => {
      const nodeBox = getObjectBoundingClientRect(node, this.workspace);
      const nodeMiddle = nodeBox.height / 2 + nodeBox.y;
      const dy = middle - nodeMiddle;
      if (dy !== 0) {
        notifyMoved(node, 0, dy);
      }
    });
  }

  /**
   * Aligns selected items vertically to the bottom.
   */
  verticalBottom(): void {
    if (!this.multiSelection()) {
      return;
    }
    const { items } = this;
    const first = items.shift();
    const box = getObjectBoundingClientRect(first!, this.workspace);
    const end = box.height + box.top;
    items.forEach((node) => {
      const nodeBox = getObjectBoundingClientRect(node, this.workspace);
      const dy =  end - nodeBox.height - nodeBox.y;
      if (dy !== 0) {
        notifyMoved(node, 0, dy);
      }
    });
  }

  /**
   * Distributes selected items vertically.
   * 
   */
  verticalDistribute(): void {
    if (!this.multiSelection()) {
      return;
    }
    const { items } = this;
    let maxStart = 0; // minimum y value
    let maxEnd = 0; // maximum y value
    const positioned: IPositionInfo[] = [];
    items.forEach((node) => {
      const box = getObjectBoundingClientRect(node, this.workspace);
      positioned.push({
        node,
        box,
      });
      const heightY = box.height + box.y;
      if (!maxStart || box.y <= maxStart) {
        maxStart = box.y;
      }
      if (!maxEnd || heightY >= maxEnd) {
        maxEnd = heightY;
      }
    });

    const first = positioned.shift()!;
    const last = positioned.pop()!;

    // The first element is to be positioned to the top line.
    notifyMoved(first.node, 0, maxStart - first.box.y);
    // The last element is to be positioned to the bottom line,
    notifyMoved(last.node, 0, maxEnd - last.box.height - last.box.y);
    // Elements in between to be positioned to the remaining space between the first and the last
    // split into equal sections, and positioned in the middle of each section.
    const distributionLength = (maxEnd - last.box.height) - (maxStart + first.box.height);
    const boxesLength = positioned.reduce((result, item) => (result + item.box.height), 0);
    const spaceAvailable = distributionLength - boxesLength;
    const spaceLength = spaceAvailable / (positioned.length + 1);
    let current = maxStart + first.box.height;
    positioned.forEach((item) => {
      const { node, box } = item;
      const newY = current + spaceLength;
      const dy = newY - box.y;
      current += spaceLength + box.height;
      if (dy !== 0) {
        notifyMoved(node, 0, dy);
      }
    });
  }

  /**
   * Aligns selected items horizontally to the left.
   */
  horizontalLeft(): void {
    if (!this.multiSelection()) {
      return;
    }
    const { items } = this;
    const first = items.shift();
    const box = getObjectBoundingClientRect(first!, this.workspace);
    items.forEach((node) => {
      const nodeBox = getObjectBoundingClientRect(node, this.workspace);
      const dx = box.x - nodeBox.x;
      if (dx !== 0) {
        notifyMoved(node, dx, 0);
      }
    });
  }

  /**
   * Aligns selected items horizontally to the center.
   */
  horizontalCenter(): void {
    if (!this.multiSelection()) {
      return;
    }
    const { items } = this;
    const first = items.shift();
    const box = getObjectBoundingClientRect(first!, this.workspace);
    const middle = box.width / 2 + box.x;
    items.forEach((node) => {
      const nodeBox = getObjectBoundingClientRect(node, this.workspace);
      const nodeMiddle = nodeBox.width / 2 + nodeBox.x;
      const dx = middle - nodeMiddle;
      if (dx !== 0) {
        notifyMoved(node, dx, 0);
      }
    });
  }

  /**
   * Aligns selected items horizontally to the bottom.
   */
  horizontalRight(): void {
    if (!this.multiSelection()) {
      return;
    }
    const { items } = this;
    const first = items.shift();
    const box = getObjectBoundingClientRect(first!, this.workspace);
    const end = box.width + box.x;
    items.forEach((node) => {
      const nodeBox = getObjectBoundingClientRect(node, this.workspace);
      const dx =  end - nodeBox.width - nodeBox.x;
      if (dx !== 0) {
        notifyMoved(node, dx, 0);
      }
    });
  }

  /**
   * Distributes selected items horizontally.
   */
  horizontalDistribute(): void {
    if (!this.multiSelection()) {
      return;
    }
    const { items } = this;
    let maxStart = 0; // minimum x value
    let maxEnd = 0; // maximum x value
    const positioned: IPositionInfo[] = [];
    items.forEach((node) => {
      const box = getObjectBoundingClientRect(node, this.workspace);
      positioned.push({
        node,
        box,
      });
      const widthX = box.width + box.x;
      if (!maxStart || box.x <= maxStart) {
        maxStart = box.x;
      }
      if (!maxEnd || widthX >= maxEnd) {
        maxEnd = widthX;
      }
    });

    const first = positioned.shift()!;
    const last = positioned.pop()!;

    // The first element is to be positioned to the left line.
    notifyMoved(first.node, maxStart - first.box.x, 0);
    // The last element is to be positioned to the right line,
    notifyMoved(last.node, maxEnd - last.box.width - last.box.x, 0);
    // Elements in between to be positioned to the remaining space between the first and the last
    // split into equal sections, and positioned in the middle of each section.
    const distributionLength = (maxEnd - last.box.width) - (maxStart + first.box.width);
    const boxesLength = positioned.reduce((result, item) => (result + item.box.width), 0);
    const spaceAvailable = distributionLength - boxesLength;
    const spaceLength = spaceAvailable / (positioned.length + 1);
    let current = maxStart + first.box.width;
    positioned.forEach((item) => {
      const { node, box } = item;
      const newX = current + spaceLength;
      const dx = newX - box.x;
      current += spaceLength + box.width;
      if (dx !== 0) {
        notifyMoved(node, dx, 0);
      }
    });
  }
}
