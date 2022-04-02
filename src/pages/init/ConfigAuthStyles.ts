import { css } from 'lit';

export default css`
.config-init {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 900px;
  margin: 40px auto;
}

h1 {
  font-size: 34px;
  font-weight: 200;
  text-align: center;
}

.description {
  text-align: center;
  color: var(--secondary-text-color);
  margin-top: 40px;
}

.data-option {
  display: block;
  margin-bottom: 8px;
}

.action {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 40px;
}

.general-error {
  margin-top: 40px;
  text-align: center;
  color: var(--error-color);
  user-select: text;
}

anypoint-progress {
  width: 100%;
}
`;
