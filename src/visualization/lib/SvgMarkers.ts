import { svg, css } from 'lit';

export const markerStyles = css`
.parent-marker {
  fill: #90a4ae;
}

.parameter-in polyline {
  stroke: #ff9e91;
}

.parameter-in-marker {
  fill: #ff9e91;
}

.parameter-out polyline {
  stroke: #fbc02d;
}

.parameter-out-marker {
  fill: #fbc02d;
}
`;

/** 
 * A template for the parent entity marker
 */
export const parentEntityMaker = svg`
<marker 
  id="parent" 
  class="parent-marker" 
  viewBox="0 0 20 20" 
  refX="10" 
  refY="5" 
  markerWidth="32" 
  markerHeight="32" 
  orient="auto-start-reverse" 
  markerUnits="userSpaceOnUse"
>
  <path d="M 0 0 L 10 5 L 0 10 z" />
</marker>
`;

/** 
 * A template for the operation parameter in marker
 */
export const parameterInMaker = svg`
<marker 
  id="parameterIn" 
  class="parameter-in-marker" 
  viewBox="0 0 20 20" 
  refX="10" 
  refY="5" 
  markerWidth="32" 
  markerHeight="32" 
  orient="auto-start-reverse" 
  markerUnits="userSpaceOnUse"
>
  <path d="M 0 0 L 10 5 L 0 10 z" />
</marker>
`;

/** 
 * A template for the operation parameter out marker
 */
export const parameterOutMaker = svg`
<marker 
  id="parameterOut" 
  class="parameter-out-marker" 
  viewBox="0 0 20 20" 
  refX="10" 
  refY="5" 
  markerWidth="32" 
  markerHeight="32" 
  orient="auto-start-reverse" 
  markerUnits="userSpaceOnUse"
>
  <path d="M 0 0 L 10 5 L 0 10 z" />
</marker>
`;
