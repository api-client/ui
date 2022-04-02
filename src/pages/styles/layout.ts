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

.general-error {
  margin: 40px 0;
  text-align: center;
  color: var(--error-color);
  user-select: text;
}
`;
