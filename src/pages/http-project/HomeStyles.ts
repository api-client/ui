import { css } from 'lit';

export default css`
.page-content {
  background-color: #EEEEEE;
}

.right {
  margin-left: auto;
}

.introduction {
  text-align: center;
  max-width: 700px;
  margin: 80px auto;
  border: 1px #9e9e9e solid;
  border-radius: 4px;
  padding: 24px;
}

.add-space-dialog {
  max-width: 480px;
  width: 100%;
}

.space-name {
  margin: 0;
  width: 100%;
}

.spaces-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, 140px);
  gap: 20px;
}

.space-icon {
  width: 140px;
  height: 140px;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.space-icon .icon {
  width: 40px;
  height: 40px;
}

.space-label {
  margin: 8px;
}

.space-tile:focus {
  outline: var(--primary-color) solid;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, 248px);
  gap: 20px;
  margin-top: 40px;
}

.project-tile {
  background-color: #fff;
}

.project-label {
  margin: 24px;
  font-size: 1.31rem;
  font-weight: bold;
}

.updated-label {
  margin: 24px;
}
`;
