/* eslint-disable prefer-destructuring */
import { assert, fixture, html } from '@open-wc/testing';
import { findClosestAnchors, readEastAnchorPoints, readWestAnchorPoints, readNorthAnchorPoints, readSouthAnchorPoints } from '../../../src/visualization/lib/AnchorFinder.js';
import VizWorkspaceElement from '../../../src/visualization/elements/VizWorkspaceElement.js';
import '../../../src/define/viz-workspace.js';

describe('AnchorFinder', () => {
  async function objectsFixture(): Promise<VizWorkspaceElement> {
    return fixture(html`
    <viz-workspace style="width: 1200px; height: 800px;">
      <div class="workspace-dummy big" style="transform: translate(0px, 0px)"></div>
      <div class="workspace-dummy big" style="transform: translate(0px, 0px)"></div>
    </viz-workspace>
    `);
  }

  async function objectFixture(): Promise<VizWorkspaceElement> {
    return fixture(html`
    <viz-workspace style="width: 1200px; height: 800px;">
      <div class="workspace-dummy" style="transform: translate(0px, 0px)"></div>
    </viz-workspace>
    `);
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

  describe('readEastAnchorPoints()', () => {
    let el: HTMLElement;

    beforeEach(async () => { 
      const workspace = await objectFixture();
      el = workspace.querySelector('div');
    });

    it('reads anchors', () => {
      el.style.transform = 'translate(10px, 20px)';
      const box = el.getBoundingClientRect();
      
      const result = readEastAnchorPoints(box, 0);
      assert.typeOf(result, 'array', 'returns an array');
      assert.lengthOf(result, 3, 'has 3 points');
      const [p1, p2, p3] = result;
      
      assert.equal(p1.x, 51, 'p1.x has value');
      assert.equal(p1.y, 21, 'p1.y has value');
      assert.equal(p2.x, 51, 'p2.x has value');
      assert.equal(p2.y, 61, 'p2.y has value');
      assert.equal(p3.x, 51, 'p3.x has value');
      assert.equal(p3.y, 101, 'p3.y has value');
    });

    it('reads anchors with padding', () => {
      el.style.transform = 'translate(10px, 20px)';
      const box = el.getBoundingClientRect();
      const result = readEastAnchorPoints(box, 10);
      const [p1, p2, p3] = result;
      assert.equal(p1.x, 51, 'p1.x has value');
      assert.equal(p1.y, 31, 'p1.y has value');
      assert.equal(p2.x, 51, 'p2.x has value');
      assert.equal(p2.y, 61, 'p2.y has value');
      assert.equal(p3.x, 51, 'p3.x has value');
      assert.equal(p3.y, 91, 'p3.y has value');
    });
  });

  describe('readWestAnchorPoints()', () => {
    let el: HTMLElement;

    beforeEach(async () => { 
      const workspace = await objectFixture();
      el = workspace.querySelector('div');
    });

    it('reads anchors', () => {
      el.style.transform = 'translate(10px, 20px)';
      const box = el.getBoundingClientRect();
      const result = readWestAnchorPoints(box, 0);
      assert.typeOf(result, 'array', 'returns an array');
      assert.lengthOf(result, 3, 'has 3 points');
      const [p1, p2, p3] = result;
      assert.equal(p1.x, 11, 'p1.x has value');
      assert.equal(p1.y, 21, 'p1.y has value');
      assert.equal(p2.x, 11, 'p2.x has value');
      assert.equal(p2.y, 61, 'p2.y has value');
      assert.equal(p3.x, 11, 'p3.x has value');
      assert.equal(p3.y, 101, 'p3.y has value');
    });

    it('reads anchors with padding', () => {
      el.style.transform = 'translate(10px, 20px)';
      const box = el.getBoundingClientRect();
      const result = readWestAnchorPoints(box, 10);
      const [p1, p2, p3] = result;
      assert.equal(p1.x, 11, 'p1.x has value');
      assert.equal(p1.y, 31, 'p1.y has value');
      assert.equal(p2.x, 11, 'p2.x has value');
      assert.equal(p2.y, 61, 'p2.y has value');
      assert.equal(p3.x, 11, 'p3.x has value');
      assert.equal(p3.y, 91, 'p3.y has value');
    });
  });

  describe('readNorthAnchorPoints()', () => {
    let el: HTMLElement;

    beforeEach(async () => { 
      const workspace = await objectFixture();
      el = workspace.querySelector('div');
    });

    it('reads anchors', () => {
      el.style.transform = 'translate(10px, 20px)';
      const box = el.getBoundingClientRect();
      const result = readNorthAnchorPoints(box, 0);
      assert.typeOf(result, 'array', 'returns an array');
      assert.lengthOf(result, 3, 'has 3 points');
      const [p1, p2, p3] = result;
      assert.equal(p1.x, 11, 'p1.x has value');
      assert.equal(p1.y, 21, 'p1.y has value');
      assert.equal(p2.x, 31, 'p2.x has value');
      assert.equal(p2.y, 21, 'p2.y has value');
      assert.equal(p3.x, 51, 'p3.x has value');
      assert.equal(p3.y, 21, 'p3.y has value');
    });

    it('reads anchors with padding', () => {
      el.style.transform = 'translate(10px, 20px)';
      const box = el.getBoundingClientRect();
      const result = readNorthAnchorPoints(box, 10);
      const [p1, p2, p3] = result;
      assert.equal(p1.x, 21, 'p1.x has value');
      assert.equal(p1.y, 21, 'p1.y has value');
      assert.equal(p2.x, 31, 'p2.x has value');
      assert.equal(p2.y, 21, 'p2.y has value');
      assert.equal(p3.x, 41, 'p3.x has value');
      assert.equal(p3.y, 21, 'p3.y has value');
    });
  });

  describe('readSouthAnchorPoints()', () => {
    let el: HTMLElement;

    beforeEach(async () => { 
      const workspace = await objectFixture();
      el = workspace.querySelector('div');
    });

    it('reads anchors', () => {
      el.style.transform = 'translate(10px, 20px)';
      const box = el.getBoundingClientRect();
      const result = readSouthAnchorPoints(box, 0);
      assert.typeOf(result, 'array', 'returns an array');
      assert.lengthOf(result, 3, 'has 3 points');
      const [p1, p2, p3] = result;
      assert.equal(p1.x, 11, 'p1.x has value');
      assert.equal(p1.y, 101, 'p1.y has value');
      assert.equal(p2.x, 31, 'p2.x has value');
      assert.equal(p2.y, 101, 'p2.y has value');
      assert.equal(p3.x, 51, 'p3.x has value');
      assert.equal(p3.y, 101, 'p3.y has value');
    });

    it('reads anchors with padding', () => {
      el.style.transform = 'translate(10px, 20px)';
      const box = el.getBoundingClientRect();
      const result = readSouthAnchorPoints(box, 10);
      const [p1, p2, p3] = result;
      assert.equal(p1.x, 21, 'p1.x has value');
      assert.equal(p1.y, 101, 'p1.y has value');
      assert.equal(p2.x, 31, 'p2.x has value');
      assert.equal(p2.y, 101, 'p2.y has value');
      assert.equal(p3.x, 41, 'p3.x has value');
      assert.equal(p3.y, 101, 'p3.y has value');
    });
  });

  describe('findClosestAnchors()', () => {
    let e1: HTMLElement;
    let e2: HTMLElement;

    beforeEach(async () => { 
      const workspace = await objectsFixture();
      const objects = workspace.querySelectorAll('div');
      e1 = objects[0];
      e2 = objects[1];
    });

    // Testing without the padding so the anchors are in the vertexes.
    // .workspace-dummy has `width: 200px;` and `height: 360px;`.

    it('computes equal sizes and y-position (top anchors)', () => {
      e1.style.transform = 'translate(10px, 20px)';
      e2.style.transform = 'translate(220px, 20px)';
      const b1 = e1.getBoundingClientRect();
      const b2 = e2.getBoundingClientRect();
      const result = findClosestAnchors(b1, b2, 0);
      const [p1, p2] = result;

      assert.equal(p1.x, 211, 'has p1.x'); // right
      assert.equal(p1.y, 21, 'has p1.y'); // y
      assert.equal(p2.x, 221, 'has p2.x'); // left
      assert.equal(p2.y, 21, 'has p2.y'); // y
    });

    it('computes equal sizes, target below-right, middle-top anchors', () => {
      e1.style.transform = 'translate(10px, 180px)';
      e2.style.transform = 'translate(250px, 305px)';
      const b1 = e1.getBoundingClientRect();
      const b2 = e2.getBoundingClientRect();
      const result = findClosestAnchors(b1, b2, 0);
      const [p1, p2] = result;
      assert.equal(p1.x, 211, 'has p1.x'); // right
      assert.equal(p1.y, 361, 'has p1.y'); // middle
      assert.equal(p2.x, 251, 'has p2.x'); // left
      assert.equal(p2.y, 306, 'has p2.y'); // top
    });

    it('computes equal sizes, target below-right, bottom-top anchors', () => {
      e1.style.transform = 'translate(10px, 180px)';
      e2.style.transform = 'translate(250px, 405px)';
      const b1 = e1.getBoundingClientRect();
      const b2 = e2.getBoundingClientRect();
      const result = findClosestAnchors(b1, b2, 0);
      const [p1, p2] = result;
      assert.equal(p1.x, 211, 'has p1.x'); // right
      assert.equal(p1.y, 361, 'has p1.y'); // bottom
      assert.equal(p2.x, 251, 'has p2.x'); // left
      assert.equal(p2.y, 406, 'has p2.y'); // top
    });

    it('computes equal sizes, target below-right, bottom-middle anchors', () => {
      e1.style.transform = 'translate(10px, 180px)';
      e2.style.transform = 'translate(250px, 255px)';
      const b1 = e1.getBoundingClientRect();
      const b2 = e2.getBoundingClientRect();
      const result = findClosestAnchors(b1, b2, 0);
      const [p1, p2] = result;
      assert.equal(p1.x, 211, 'has p1.x'); // right
      assert.equal(p1.y, 181, 'has p1.y'); // bottom
      assert.equal(p2.x, 251, 'has p2.x'); // left
      assert.equal(p2.y, 256, 'has p2.y'); // middle
    });

    it('computes aligned, the same sizes (top anchors)', () => {
      e1.style.transform = 'translate(10px, 180px)';
      e2.style.transform = 'translate(250px, 180px)';
      const b1 = e1.getBoundingClientRect();
      const b2 = e2.getBoundingClientRect();
      const result = findClosestAnchors(b1, b2, 0);
      const [p1, p2] = result;
      assert.equal(p1.x, 211, 'has p1.x'); // right
      assert.equal(p1.y, 181, 'has p1.y'); // bottom
      assert.equal(p2.x, 251, 'has p2.x'); // left
      assert.equal(p2.y, 181, 'has p2.y'); // middle
    });

    it('computes target East-South', () => {
      e1.style.transform = 'translate(10px, 10px)';
      e2.style.transform = 'translate(250px, 400px)';
      const b1 = e1.getBoundingClientRect();
      const b2 = e2.getBoundingClientRect();
      const result = findClosestAnchors(b1, b2, 0);
      const [p1, p2] = result;
      assert.equal(p1.x, 211, 'has p1.x'); // right
      assert.equal(p1.y, 371, 'has p1.y'); // bottom
      assert.equal(p2.x, 251, 'has p2.x'); // left
      assert.equal(p2.y, 401, 'has p2.y'); // top
    });

    it('computes target South', () => {
      e1.style.transform = 'translate(10px, 10px)';
      e2.style.transform = 'translate(10px, 400px)';
      const b1 = e1.getBoundingClientRect();
      const b2 = e2.getBoundingClientRect();
      const result = findClosestAnchors(b1, b2, 0);
      const [p1, p2] = result;
      assert.equal(p1.x, 211, 'has p1.x'); // right
      assert.equal(p1.y, 371, 'has p1.y'); // bottom
      assert.equal(p2.x, 211, 'has p2.x'); // right
      assert.equal(p2.y, 401, 'has p2.y'); // top
    });

    it('computes target South-West', () => {
      e1.style.transform = 'translate(155px, 10px)';
      e2.style.transform = 'translate(10px, 400px)';
      const b1 = e1.getBoundingClientRect();
      const b2 = e2.getBoundingClientRect();
      const result = findClosestAnchors(b1, b2, 0);
      const [p1, p2] = result;
      assert.equal(p1.x, 156, 'has p1.x'); // left
      assert.equal(p1.y, 371, 'has p1.y'); // bottom
      assert.equal(p2.x, 111, 'has p2.x'); // middle
      assert.equal(p2.y, 401, 'has p2.y'); // top
    });
  });
});
