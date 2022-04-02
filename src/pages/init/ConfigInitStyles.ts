import { css } from 'lit';

export default css`
.config-init {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.form {
  max-width: 800px;
  width: 100%;
  margin: 40px auto;
  flex: 1;
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

.data-source {
  margin: 40px auto;
  width: 180px;
}

.data-option {
  display: block;
  margin-bottom: 8px;
}

.actions {
  margin: 12px 24px;
  display: flex;
  align-items: end;
  flex-direction: column;
}

.store-url-input {
  display: flex;
}

.store-url {
  flex: 1;
}

.help-dialog {
  max-width: 400px;
}

.info-headline {
  font-weight: bold;
}

anypoint-progress {
  width: 100%;
}
`;
