import { css } from 'lit';

export default css`
.project-nav {
  border-right: 1px rgba(0, 0, 0, 0.12) solid;
}

main,
.project-nav,
.project-nav > http-client-navigation {
  height: calc(100vh - 74px - 20px);
  margin: 0;
  padding: 0;
}

#app main {
  margin: 0;
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

main layout-panel {
  flex: 1;
  overflow: auto;
}

.environment-editor-content {
  padding: 20px;
}

.environment-editor-content environment-editor {
  max-width: 800px;
}

.missing-data {
  text-align: center;
  margin-top: 40px;
  font-style: italic;
}
`;
