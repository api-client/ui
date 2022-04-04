import { css } from 'lit';

export default css`
#app {
  display: flex;
  flex-direction: column;
  flex: 1;
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

/* A common header in the application start page */
.start-page-header {
  height: 72px;
  background-color: var(--start-page-header-background-color, #ffffff);
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0 24px;
}

.start-page-header-title {
  font-size: 22px;
  font-weight: 300;
  flex: 1;
}

.page-content {
  flex: 1;
}

.page-content.navigation {
  display: flex;
  flex-direction: row;
}

.page-content.navigation nav {
  width: 300px;
  margin-top: 20px;
}

.page-content.navigation main {
  margin-top: 20px;
  margin-right: 20px;
  margin-left: 20px;
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
