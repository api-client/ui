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
`;
