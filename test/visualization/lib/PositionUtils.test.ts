import { assert, fixture, html, nextFrame } from '@open-wc/testing';
import sinon from 'sinon';
import {
  filterPoints,
  getRelativeClickPoint,
  findDirection,
  // theSamePair,
  closetsPair,
  getWorkspaceClick,
  getObjectBoundingClientRect,
  notifyMoved,
} from '../../../src/visualization/lib/PositionUtils.js';
import { Point } from '../../../src/visualization/lib/Point.js';
import VizWorkspaceElement from '../../../src/visualization/elements/VizWorkspaceElement.js';
import '../../../src/define/viz-workspace.js';

describe('PositionUtils', () => {
  async function emptyWorkspaceFixture(): Promise<VizWorkspaceElement> {
    return fixture(html`<viz-workspace style="width: 400px; height: 400px;"></viz-workspace>`);
  } 
  
  async function scaledWorkspaceFixture(): Promise<VizWorkspaceElement> {
    return fixture(html`<viz-workspace style="width: 400px; height: 400px;" zoom="10"></viz-workspace>`);
  }

  async function positionedWorkspaceFixture(): Promise<VizWorkspaceElement> {
    const elm = await fixture(html`
    <div class="workspace-position-wrapper">
      <viz-workspace style="width: 400px; height: 400px;"></viz-workspace>
    </div>
    `);
    return elm.querySelector('viz-workspace');
  }

  async function workspaceFixture(): Promise<VizWorkspaceElement> {
    return fixture(html`<viz-workspace style="width: 400px; height: 400px;">
      <div class="workspace-dummy" style="transform: translate(10px, 10px)"></div>
      <div class="workspace-dummy" style="transform: translate(60px, 60px)"></div>
      <div class="workspace-dummy" style="transform: translate(200px, 200px)"></div>
    </viz-workspace>`);
  }

  async function positionedDataFixture(): Promise<VizWorkspaceElement> {
    const elm = await fixture(html`
    <div class="workspace-position-wrapper">
      <viz-workspace style="width: 400px; height: 400px;">
        <div class="workspace-dummy" style="transform: translate(10px, 10px)"></div>
        <div class="workspace-dummy" style="transform: translate(60px, 60px)"></div>
        <div class="workspace-dummy" style="transform: translate(200px, 200px)"></div>
      </viz-workspace>
    </div>
    `);
    return elm.querySelector('viz-workspace');
  }

  async function scaledDataFixture(): Promise<VizWorkspaceElement> {
    return fixture(html`
    <viz-workspace style="width: 400px; height: 400px;" zoom="10">
      <div class="workspace-dummy" style="transform: translate(10px, 10px)"></div>
      <div class="workspace-dummy" style="transform: translate(60px, 60px)"></div>
      <div class="workspace-dummy" style="transform: translate(200px, 200px)"></div>
    </viz-workspace>`);
  }

  async function eventTargetFixture(): Promise<HTMLDivElement> {
    return fixture(html`<div></div>`);
  }

  // let styles: HTMLLinkElement;
  // before(async () => {
  //   styles = document.createElement('link');
  //   styles.rel = 'stylesheet';
  //   styles.href = '/test/visualization/lib/test-styles.css';
  //   document.body.appendChild(styles);
  //   await nextFrame();
  //   await aTimeout(100);
  // });

  // after(() => {
  //   document.body.removeChild(styles);
  // });

  describe('filterPoints', () => {
    it('returns all valid points', () => {
      const arr = [new Point(0, 0), new Point(10, 1000)];
      const result = filterPoints(arr);
      assert.deepEqual(result, arr);
    });

    it('filters out invalid points', () => {
      const arr = [new Point(0, 0), new Point(10, Number('test'))];
      const result = filterPoints(arr);
      assert.deepEqual(result, [arr[0]]);
    });
  });

  describe('getRelativeClickPoint()', () => {
    it('returns the same values when no scale and no positioning', async () => {
      const workspace = await emptyWorkspaceFixture();
      const result = getRelativeClickPoint(10, 10, workspace);
      assert.equal(result.x, 10, 'the x is set');
      assert.equal(result.y, 10, 'the y is set');
    });

    it('returns position relative to the canvas position', async () => {
      const workspace = await positionedWorkspaceFixture();
      const result = getRelativeClickPoint(110, 120, workspace);
      const { marginTop, marginLeft } = getComputedStyle(workspace.parentElement)
      const mt = Number(marginTop.replace('px', ''));
      const ml = Number(marginLeft.replace('px', ''));
      assert.equal(result.x, 110 - ml, 'the x is set');
      assert.equal(result.y, 120 - mt, 'the y is set');
    });

    it('returns relative position to the scroll position', async () => {
      const workspace = await positionedWorkspaceFixture();
      workspace.scrollTo(-200, -200); // to the right and bottom
      await nextFrame();
      const result = getRelativeClickPoint(0, 0, workspace);
      const { marginTop, marginLeft } = getComputedStyle(workspace.parentElement)
      const mt = Number(marginTop.replace('px', ''));
      const ml = Number(marginLeft.replace('px', ''));
      assert.equal(result.x, 200 - ml, 'the x is set');
      assert.equal(result.y, 200 - mt, 'the y is set');
    });

    it('applies the scale', async () => {
      const workspace = await scaledWorkspaceFixture();
      workspace.scrollTo(-100, -200); // to the right and bottom
      await nextFrame();
      const result = getRelativeClickPoint(50, 80, workspace);
      assert.approximately(result.x, 138, 1, 'the x is set');
      assert.approximately(result.y, 261, 1, 'the y is set');
    });
  });

  describe('findDirection()', () => {
    it('starts in west', () => {
      const sp = new Point(10, 20);
      const ep = new Point(0, 0);
      const sb = new DOMRect(9, 10, 100, 100);
      const eb = new DOMRect(1, 1, 1, 1);
      const result = findDirection(sp, ep, sb, eb);
      assert.equal(result.start, 'west');
    });

    it('starts in east', () => {
      const sp = new Point(110, 20);
      const ep = new Point(0, 0);
      const sb = new DOMRect(10, 10, 100, 100);
      const eb = new DOMRect(1, 1, 100, 100);
      const result = findDirection(sp, ep, sb, eb);
      assert.equal(result.start, 'east');
    });

    it('starts in north', () => {
      const sp = new Point(20, 10);
      const ep = new Point(0, 0);
      const sb = new DOMRect(10, 10, 100, 100);
      const eb = new DOMRect(1, 1, 100, 100);
      const result = findDirection(sp, ep, sb, eb);
      assert.equal(result.start, 'north');
    });

    it('starts in south', () => {
      const sp = new Point(20, 110);
      const ep = new Point(0, 0);
      const sb = new DOMRect(10, 10, 100, 100);
      const eb = new DOMRect(1, 1, 100, 100);
      const result = findDirection(sp, ep, sb, eb);
      assert.equal(result.start, 'south');
    });

    it('ends in east', () => {
      const sp = new Point(0, 0);
      const ep = new Point(10, 20);
      const sb = new DOMRect(1, 1, 100, 100);
      const eb = new DOMRect(10, 10, 100, 100);
      const result = findDirection(sp, ep, sb, eb);
      assert.equal(result.end, 'east');
    });

    it('ends in west', () => {
      const sp = new Point(0, 0);
      const ep = new Point(110, 20);
      const sb = new DOMRect(1, 1, 100, 100);
      const eb = new DOMRect(10, 10, 100, 100);
      const result = findDirection(sp, ep, sb, eb);
      assert.equal(result.end, 'west');
    });

    it('ends in south', () => {
      const sp = new Point(0, 0);
      const ep = new Point(20, 110);
      const sb = new DOMRect(1, 1, 100, 100);
      const eb = new DOMRect(10, 10, 100, 100);
      const result = findDirection(sp, ep, sb, eb);
      assert.equal(result.end, 'south');
    });

    it('ends in north', () => {
      const sp = new Point(0, 0);
      const ep = new Point(20, 10);
      const sb = new DOMRect(1, 1, 100, 100);
      const eb = new DOMRect(10, 10, 100, 100);
      const result = findDirection(sp, ep, sb, eb);
      assert.equal(result.end, 'north');
    });
  });

  // describe('theSamePair()', () => {
  //   it('the same for even pairs', () => {
  //     const p1 = new Point(1, 2);
  //     const p2 = new Point(3, 4);
  //     const p3 = new Point(1, 2);
  //     const p4 = new Point(3, 4);
  //     const result = theSamePair(p1, p2, p3, p4);
  //     assert.isTrue(result);
  //   });

  //   it('the same for odd pairs', () => {
  //     const p1 = new Point(1, 2);
  //     const p2 = new Point(3, 4);
  //     const p3 = new Point(3, 4);
  //     const p4 = new Point(1, 2);
  //     const result = theSamePair(p1, p2, p3, p4);
  //     assert.isTrue(result);
  //   });

  //   it('is false when not equal', () => {
  //     const p1 = new Point(1, 3);
  //     const p2 = new Point(3, 4);
  //     const p3 = new Point(3, 4);
  //     const p4 = new Point(1, 2);
  //     const result = theSamePair(p1, p2, p3, p4);
  //     assert.isFalse(result);
  //   });
  // });

  describe('closetsPair()', () => {
    it('finds the closest 2 points', () => {
      const set1 = [
        new Point(1, 6), new Point(2, 6), new Point(3, 6),
        new Point(1, 5), new Point(3, 5),
        new Point(1, 3), new Point(2, 3), new Point(3, 3),
      ];

      const set2 = [
        new Point(4, 3), new Point(5, 3), new Point(6, 3),
        new Point(4, 2), new Point(6, 2),
        new Point(4, 1), new Point(5, 1), new Point(6, 1),
      ];

      const result = closetsPair(set1, set2);
      assert.deepEqual(result[0], set1[7], 'has the fist point');
      assert.deepEqual(result[1], set2[0], 'has the second point');
    });

    it('avoids a specific point', () => {
      const set1 = [
        new Point(1, 6), new Point(2, 6), new Point(3, 6),
        new Point(1, 5), new Point(3, 5),
        new Point(1, 3), new Point(2, 3), new Point(3, 3),
      ];

      const set2 = [
        new Point(4, 3), new Point(5, 3), new Point(6, 3),
        new Point(4, 2), new Point(6, 2),
        new Point(4, 1), new Point(5, 1), new Point(6, 1),
      ];

      const result = closetsPair(set1, set2, [set1[7]], [set2[0]]);
      assert.deepEqual(result[0], set1[6], 'has the fist point');
      assert.deepEqual(result[1], set2[3], 'has the second point');
    });

    it('returns null when the pair cannot be find', () => {
      const set1 = [];
      const set2 = [];
      const result = closetsPair(set1, set2);
      assert.strictEqual(result, null);
    });

    it('returns avoided pairs when necessary', () => {
      const set1 = [
        new Point(1, 6),
      ];

      const set2 = [
        new Point(4, 3),
      ];

      const result = closetsPair(set1, set2, [set1[0]], [set2[0]]);
      assert.deepEqual(result[0], set1[0], 'has the fist point');
      assert.deepEqual(result[1], set2[0], 'has the second point');
    });
  });

  describe('getWorkspaceClick()', () => {
    it('returns the click position when not positioned', async () => {
      const workspace = await emptyWorkspaceFixture();
      const result = getWorkspaceClick(100, 200, workspace);
      assert.equal(result.x, 100);
      assert.equal(result.y, 200);
    });

    it('returns the click position when positioned', async () => {
      const x = 100;
      const y = 200;
      const workspace = await positionedWorkspaceFixture();
      const result = getWorkspaceClick(x, y, workspace);
      const { marginTop, marginLeft } = getComputedStyle(workspace.parentElement)
      const mt = Number(marginTop.replace('px', ''));
      const ml = Number(marginLeft.replace('px', ''));
      assert.equal(result.x, x - ml);
      assert.equal(result.y, y - mt);
    });
  });

  describe('getObjectBoundingClientRect()', () => {
    it('returns the DOMRect when not positioned', async () => {
      const workspace = await workspaceFixture();
      const elm = workspace.querySelector('.workspace-dummy');
      const result = getObjectBoundingClientRect(elm, workspace);
      // the .content.canvas element in the workspace has 1px border
      assert.equal(result.x, 11, 'has computed x');
      assert.equal(result.y, 11, 'has computed y');
      assert.equal(result.width, 40, 'has computed width');
      assert.equal(result.height, 80, 'has computed height');
    });

    it('returns the DOMRect when positioned', async () => {
      const workspace = await positionedDataFixture();
      const elm = workspace.querySelector('.workspace-dummy');
      const result = getObjectBoundingClientRect(elm, workspace);
      // the .content.canvas element in the workspace has 1px border
      assert.equal(result.x, 11, 'has computed x');
      assert.equal(result.y, 11, 'has computed y');
      assert.equal(result.width, 40, 'has computed width');
      assert.equal(result.height, 80, 'has computed height');
    });

    it('returns the DOMRect when positioned', async () => {
      const workspace = await scaledDataFixture();
      const elm = workspace.querySelector('.workspace-dummy');
      const result = getObjectBoundingClientRect(elm, workspace);
      // the .content.canvas element in the workspace has 1px border
      assert.approximately(result.x, 11, 1, 'has computed x');
      assert.approximately(result.y, 11, 1, 'has computed y');
      assert.approximately(result.width, 40, 1, 'has computed width');
      assert.approximately(result.height, 80, 1, 'has computed height');
    });
  });

  describe('notifyMoved()', () => {
    let element: HTMLDivElement;

    beforeEach(async () => { element = await eventTargetFixture(); });

    it('dispatches the bubbling event', () => {
      const spy = sinon.spy();
      window.addEventListener('positionchange', spy);
      notifyMoved(element, 10, 20);
      window.removeEventListener('positionchange', spy);
      assert.isTrue(spy.calledOnce);
    });

    it('is cancelable', () => {
      const spy = sinon.spy();
      element.addEventListener('positionchange', spy);
      notifyMoved(element, 10, 20);
      const e = spy.args[0][0];
      assert.isTrue(e.cancelable);
    });

    it('has the position delta', () => {
      const spy = sinon.spy();
      element.addEventListener('positionchange', spy);
      notifyMoved(element, 10, 20);
      const { detail } = spy.args[0][0];
      assert.equal(detail.dx, 10);
      assert.equal(detail.dy, 20);
    });
  });
});
