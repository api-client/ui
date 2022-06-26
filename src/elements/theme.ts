import { css } from "lit";

/** 
 * These are the styles that would be considered as theme styles.
 * Contains a definition of common UI widgets like titles, lists, etc.
 * 
 * Implementers should overwrite as least as possible to ensure consistency between apps and screens.
 */
export default css`
.section-title {
  margin: 8px 20px;
  text-transform: var(--section-title-font-transform, uppercase);
  font-size: var(--section-title-font-size, 0.873rem);
  font-weight: var(--section-title-font-weight, 500);
}

.section-divider {
  height: 1px;
  background-color: var(--divider-color);
  margin: 20px 0;
}

.section-description {
  font-size: var(--secondary-text-size, .875rem);
  color: var(--secondary-text-color);
  max-width: 800px;
}

.secondary {
  font-size: var(--secondary-text-size, .875rem);
  color: var(--secondary-text-color);
  display: flex;
  align-items: center;
  overflow: hidden;
  white-space: nowrap;
}

.drop-zone {
  height: 120px;
  border: 4px var(--accent-color) dotted;
  margin: 28px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.text-selectable {
  user-select: text;
}

.destructive-button {
  background: var(--destructive-color);
}

.highlight {
  /* For autocomplete */
  background-color: rgba(0, 0, 0, 0.12);
}
`;
