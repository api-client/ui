import { css } from 'lit';

export default css`
:host {
  display: block;
  position: relative;
  overflow: hidden;
  background-color: var(--workspace-background-color, #E5E5E5);
}

:host ::slotted(*) {
  position: absolute;
  z-index: 2;
}

/* this chess board background was removed after a team meeting, May 2021. */
/* :host {
  background-image:
    linear-gradient(to right, rgba(226, 226, 226, 0.85), rgba(226, 226, 226, 0.85)),
    linear-gradient(to right, black 50%, white 50%),
    linear-gradient(to bottom, black 50%, white 50%);
  background-blend-mode: normal, difference, normal;
  background-size: 1.5em 1.5em;
} */

.hidden {
  display: none;
}

.content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--workspace-content-background-color, #E5E5E5);
  /* background-color: transparent; */
  transform: scale(1) translate(0px, 0px);
  transform-origin: top left;
  border-radius: 12px;
  border: 1px var(--workspace-border-color, #c0c0c0) solid;
}

.content ::slotted(.selected) {
  border: 1px var(--selection-color) solid;
}

.association {
  position: absolute;
}

.association polyline {
  stroke-width: 2px;
  fill: none;
  outline: none;
}

.association .association-line {
  fill: none;
  stroke: #afafaf;
  stroke-width: 4px;
}

.association .association-line-area {
  fill: none;
  stroke: transparent;
  stroke-width: 28px;
}

.association .association-line:hover,
.association-group.hovered .association-line {
  stroke: #898989;
}

.association-group.selected .association-line {
  stroke: var(--selection-color);
}

.selectedSecondary .association-line {
  stroke: var(--secondary-selection-color);
}

/* Edge tips */
.edge-tip {
  fill: #607D8B;
  stroke: none;
}

.edge-tip.parent {
  fill: #90a4ae;
}

.edge-tip.parameter-in {
  fill: #ff9e91;
}

.edge-tip.parameter-out {
  fill: #fbc02d;
}

.edge-tip.association {
  stroke: #afafaf;
  stroke-width: 3px;
}

.parameter-in path {
  stroke: #ff9e91;
}

.parameter-out path {
  stroke: #fbc02d;
}

.edge-vertex {
  stroke: transparent;
  fill: transparent;
}

.selected .edge-vertex,
.selectedSecondary .edge-vertex {
  stroke: var(--selection-color);
  stroke-width: 3px;
}

/* Edge label */
.association-label {
  fill: var(--workspace-edge-label-color, #212121);
  font-size: 0.9rem;
  user-select: none;
}

.edge-name-input {
  border: 1px #757575 solid;
  padding: 4px 6px;
  font-size: 1rem;
  outline: none;
  background-color: var(--workspace-edge-input-background-color, #fff);
  color: var(--workspace-edge-input-color, initial);
}

.edge-name-input:focus {
  border-color: var(--primary-color);
}

.selection-zone {
  z-index: 100;
  position: absolute;
  width: 4px;
  height: 4px;
  border: 1px solid #2196F3;
  background-color: var(--workspace-selection-zone-background-color, rgb(3 169 244 / 0.54));
}

anypoint-listbox {
  box-shadow: var(--anypoint-dropdown-shadow);
}


/* edges selection zones */

.association-draggable {
  fill: white;
  stroke: #424242;
  stroke-width: 2;
  cursor: pointer;
}
`;
