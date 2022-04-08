import { css } from 'lit';

export default css`
html, body, #app {
  width: 100vw;
  min-height: 100vh;
  margin: 0;
  padding: 0;
}

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
  border-bottom: 1px rgba(0, 0, 0, 0.12) solid;
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
  background-color: #e6e6e6;
  display: flex;
  flex-direction: row;
  align-items: center;
  font-size: 0.85rem;
  padding: 0 12px;
}

a {
  color: var(--link-color);
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
`;
