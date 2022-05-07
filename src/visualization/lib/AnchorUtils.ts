import VizWorkspaceElement from '../elements/VizWorkspaceElement.js';
import { Point } from './Point.js';
import { closetsPair, getRelativeClickPoint } from './PositionUtils.js';
import { IWorkspaceEdge } from './types.js';

/**
 * @param element The association anchor object
 * @returns The x,y position of the anchor.
 */
export function anchorToPoint(element: HTMLElement, workspace: VizWorkspaceElement): Point {
  const box = element.getBoundingClientRect();
  let { x, y } = box;
  const { dataset } = element;
  if (dataset.verticalOffset) {
    const vo = Number(dataset.verticalOffset);
    if (!Number.isNaN(vo)) {
      y += vo;
    }
  }
  if (dataset.horizontalOffset) {
    const ho = Number(dataset.horizontalOffset);
    if (!Number.isNaN(ho)) {
      x += ho;
    }
  }
  return getRelativeClickPoint(x, y, workspace);
}

export function closestAnchors(elm1: HTMLElement, elm2: HTMLElement, workspace: VizWorkspaceElement, others: IWorkspaceEdge[]=[]): Point[] | null {
  const dom1 = elm1.shadowRoot || elm1;
  const dom2 = elm2.shadowRoot || elm2;
  const anchors1 = Array.from(dom1.querySelectorAll('[data-association-slot]')) as HTMLElement[];
  const anchors2 = Array.from(dom2.querySelectorAll('[data-association-slot]')) as HTMLElement[];
  if (!anchors1.length || !anchors2.length) {
    return null;
  }
  const points1 = anchors1.map((item) => anchorToPoint(item, workspace));
  const points2 = anchors2.map((item) => anchorToPoint(item, workspace));
  const avoid1: Point[] = [];
  const avoid2: Point[] = [];
  others.forEach((i) => {
    avoid1.push(i.shape.line.startPoint);
    avoid2.push(i.shape.line.startPoint);
    avoid1.push(i.shape.line.endPoint);
    avoid2.push(i.shape.line.endPoint);
  });
  return closetsPair(points1, points2, avoid1, avoid2);
}
