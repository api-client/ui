/* eslint-disable prefer-destructuring */
import { TemplateResult } from 'lit';
import { assert, fixture, html, nextFrame } from '@open-wc/testing';
import { anchorToPoint, closestAnchors } from '../../../src/visualization/lib/AnchorUtils.js';
import { Point } from '../../../src/visualization/lib/Point.js';
import VizWorkspaceElement from '../../../src/visualization/elements/VizWorkspaceElement.js';
import '../../../src/define/viz-workspace.js';


describe('AnchorUtils', () => {

  function slotsTemplate(): TemplateResult {
    const items = [
      ['top-edge left-slot', 'top-left', '6', '6'],
      ['top-edge center-slot', 'top-center', '6', '6'],
      ['top-edge right-slot', 'top-right', '6', '6'],

      ['bottom-edge left-slot', 'bottom-left', '6', '6'],
      ['bottom-edge center-slot', 'bottom-center', '6', '6'],
      ['bottom-edge right-slot', 'bottom-right', '6', '6'],

      ['left-edge top-slot', 'left-top', '8', '6'],
      ['left-edge middle-slot', 'left-middle', '8', '6'],
      ['left-edge bottom-slot', 'left-bottom', '8', '6'],

      ['right-edge top-slot', 'right-top', '8', '6'],
      ['right-edge middle-slot', 'right-middle', '8', '6'],
      ['right-edge bottom-slot', 'right-bottom', '8', '6'],
    ];
    return html`
    ${items.map((item) => html`
    <div class="manual-association ${item[0]}" 
      data-association-slot="${item[1]}"
      data-vertical-offset="${item[2]}"
      data-horizontal-offset="${item[3]}"
    ></div>
    `)}
    `;
  }
  
  async function workspaceEntityFixture(): Promise<HTMLElement> {
    return fixture(html`
    <div class="workspace-position-wrapper">
      <viz-workspace style="width: 400px; height: 400px;">
        <div class="entity" data-association-slots data-key="testId" style="transform: translate(100px, 200px)">
          ${slotsTemplate()}
        </div>
      </viz-workspace>
    </div>
    `);
  }

  async function workspaceMultiEntityFixture(): Promise<HTMLElement> {
    return fixture(html`
    <div class="workspace-position-wrapper">
      <viz-workspace style="width: 400px; height: 400px;">
        <div class="entity" data-association-slots data-key="testId1" style="transform: translate(100px, 200px)">
          ${slotsTemplate()}
        </div>
        <div class="entity" data-association-slots data-key="testId2" style="transform: translate(300px, 300px)">
          ${slotsTemplate()}
        </div>
        <div class="entity" data-association-slots data-key="testId3" style="transform: translate(10px, 10px)">
          ${slotsTemplate()}
        </div>
      </viz-workspace>
    </div>
    `);
  }

  async function noAnchorsFixture(): Promise<HTMLElement> {
    return fixture(html`
    <div class="workspace-position-wrapper">
      <viz-workspace style="width: 400px; height: 400px;">
        <div class="entity" data-key="testId1" style="transform: translate(100px, 200px)"></div>
        <div class="entity" data-key="testId2" style="transform: translate(300px, 300px)"></div>
        <div class="entity" data-key="testId3" style="transform: translate(10px, 10px)"></div>
      </viz-workspace>
    </div>
    `);
  }

  describe('anchorToPoint()', () => {
    let workspace: VizWorkspaceElement;
    let element: HTMLElement;

    beforeEach(async () => { 
      const wrapper = await workspaceEntityFixture();
      workspace = wrapper.querySelector('viz-workspace');
      const entity = workspace.querySelector('.entity');
      element = entity.querySelector('.manual-association');
    });

    it('computes position with vertical/horizontal offset', async () => {
      await nextFrame();
      const result = anchorToPoint(element, workspace);
      // offset to the parent (entity), + position change + v/h offset + border
      assert.approximately(result.x, element.offsetLeft + 100 + 6 + 2, 1, 'has the x position')
      assert.approximately(result.y, element.offsetTop + 200 + 6 + 2, 1, 'has the y position')
    });

    it('computes position without vertical/horizontal offset', async () => {
      delete element.dataset.verticalOffset;
      delete element.dataset.horizontalOffset;
      await nextFrame();
      const result = anchorToPoint(element, workspace);
      // offset to the parent (entity), + position change + border
      assert.approximately(result.x, element.offsetLeft + 100 + 2, 1, 'has the x position')
      assert.approximately(result.y, element.offsetTop + 200 + 2, 1, 'has the y position')
    });

    it('ignores invalid vertical/horizontal offset', async () => {
      element.dataset.verticalOffset = 'test 1';
      element.dataset.horizontalOffset = 'test 2';
      await nextFrame();
      const result = anchorToPoint(element, workspace);
      // offset to the parent (entity), + position change + border
      assert.approximately(result.x, element.offsetLeft + 100 + 2, 1, 'has the x position')
      assert.approximately(result.y, element.offsetTop + 200 + 2, 1, 'has the y position')
    });
  });

  describe('closestAnchors()', () => {
    it('returns the closest points', async () => {
      const wrapper = await workspaceMultiEntityFixture();
      const workspace = wrapper.querySelector('viz-workspace');
      const entities = workspace.querySelectorAll('.entity') as NodeListOf<HTMLElement>;
      
      const result = closestAnchors(entities[1], entities[2], workspace);
      assert.typeOf(result, 'array', 'returns an array')
      assert.lengthOf(result, 2, 'returns two points')
      const [p1, p2] = result;
      
      assert.approximately(p1.x, 356, 1, 'p1.x is set');
      assert.approximately(p2.x, 252, 1, 'p2.x is set');
      assert.approximately(p1.y, 300, 1, 'p1.y is set');
      assert.approximately(p2.y, 166, 1, 'p2.y is set');
    });

    it('returns null when no anchors', async () => {
      const wrapper = await noAnchorsFixture();
      const workspace = wrapper.querySelector('viz-workspace');
      const entities = workspace.querySelectorAll('.entity') as NodeListOf<HTMLElement>;
      const result = closestAnchors(entities[1], entities[2], workspace);
      assert.strictEqual(result, null);
    });

    it('avoids already used anchors', async () => {
      const wrapper = await workspaceMultiEntityFixture();
      const workspace = wrapper.querySelector('viz-workspace');
      const entities = workspace.querySelectorAll('.entity') as NodeListOf<HTMLElement>;
      const result = closestAnchors(entities[1], entities[2], workspace, [{
        directions: { start: 'east', end: 'north' },
        id: 'test',
        positionChange: false,
        shape: {
          line: {
            startPoint: new Point(356, 300),
            endPoint: new Point(254, 127),
            type: 'rectilinear',
            transformOrigin: '0px 0px',
          },
        },
        source: 's1',
        target: 't1',
      }]);
      assert.typeOf(result, 'array', 'returns an array')
      assert.lengthOf(result, 2, 'returns two points')
      const [p1, p2] = result;
      assert.approximately(p1.x, 300, 1, 'p1.x is set');
      assert.approximately(p2.x, 196, 1, 'p2.x is set');
      assert.approximately(p1.y, 350, 1, 'p1.y is set');
      assert.approximately(p2.y, 212, 1, 'p2.y is set');
    });
  });
});
