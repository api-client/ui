import { css } from 'lit';

/** 
 * A grid layout with:
 * 
 * - header
 * - navigation
 * - main 
 * - footer
 * 
 * ```html
 * <body>
 *  <div id="app">
 *    <header></header>
 *    <nav></nav>
 *    <main></main>
 *    <footer></footer>
 *  </div>
 * </body>
 * ```
 */
export default css`
#app {
  display: grid;
  grid-template:
    "header header" 72px
    "nav content" 
    "footer footer" 20px / minmax(200px, 2fr) 10fr;
}

header {
  grid-area: header;
  background-color: var(--app-header-background-color, #ffffff);
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0 24px;
  border-bottom: 1px var(--app-header-border-bottom-color, rgba(0, 0, 0, 0.12)) solid;
}

nav {
  margin-top: 20px;
  grid-area: nav;
}

main {
  overflow: auto;
  margin-top: 20px;
  padding: 0 20px;
  grid-area: content;
}

footer {
  grid-area: footer;
  background-color: var(--app-footer-background-color, #e6e6e6);
  display: flex;
  flex-direction: row;
  align-items: center;
  font-size: 0.85rem;
  padding: 0 12px;
}
`;
