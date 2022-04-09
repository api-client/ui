import { css } from 'lit';

/** 
 * Global styles for all pages.
 * 
 * Note, all colors used here should have a CSS variable assigned.
 */
export default css`
html, body, #app {
  width: 100vw;
  min-height: 100vh;
  margin: 0;
  padding: 0;
}

body {
  user-select: none;
}

.text-selectable {
  user-select: text;
}

.general-error {
  margin: 40px 0;
  text-align: center;
  color: var(--error-color);
  user-select: text;
}

.start-page-header-title {
  font-size: 22px;
  font-weight: 300;
  flex: 1;
}

.navigation-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.navigation-item a {
  display: flex;
  align-items: center;
  height: 48px;
  padding-left: 24px;
  text-decoration: none;
}

.navigation-item.selected {
  font-weight: 500;
}

.navigation-item.selected a {
  background-color: #E0E0E0;
  border-top-right-radius: 24px;
  border-bottom-right-radius: 24px;
}

.section-title {
  font-size: medium;
  font-weight: 500;
}

.title-area {
  display: flex;
  align-items: center;
}

.auth-required-screen,
.app-loader {
  display: flex;
  flex-direction: column;
  flex: 1;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.auth-required-screen h1 {
  font-size: 34px;
  font-weight: 200;
  text-align: center;
}
`;
