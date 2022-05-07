import { css } from "lit";

export default css`
#app main {
  margin: 0;
  padding: 0;
}

schema-design-navigation {
  border-right: 1px var(--divider-color) solid
}

viz-workspace {
  flex: 1;
  height: 100%;
}

[data-selectable][data-selected] {
  border: 1px blue solid;
}
`;
