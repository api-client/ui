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
  text-transform: uppercase;
  font-size: 0.873rem;
}

.secondary {
  font-size: .875rem;
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

/* For autocomplete */
.highlight {
  background-color: rgba(0, 0, 0, 0.12);
}
`;
