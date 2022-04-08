import { css } from 'lit';

export default css`
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

.spaces-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, 240px);
  gap: 20px;
}

.space-tile {
  border: 1px rgba(0, 0, 0, 0.12) solid;
  border-radius: 4px;
  display: flex;
  flex-direction: row;
  align-items: center;
}

.file-tile {
  /* background-color: #fff; */
  border-radius: 4px;
  border: 1px rgba(0, 0, 0, 0.12) solid;
}

/* .space-tile:focus {
  outline: var(--primary-color) solid;
} */

.space-icon {
  margin: 4px 8px;
}

.space-icon .icon {
  width: 40px;
  height: 40px;
}

.space-label {
  margin: 0 8px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selected-title {
  border: 1px var(--primary-color) solid;
  background-color: #e3f2fd;
}



.files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, 240px);
  gap: 20px;
}

.tile-label {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 20px 12px;
  /* border-top: 1px rgba(0, 0, 0, 0.12) solid; */
}

.tile-label .icon {
  margin: 0 12px;
}

.files-section-title {
  padding: 32px 12px;
  font-size: 0.83rem;
  color: rgba(0, 0, 0, 0.74);
}

.file-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: row;
}

.file-thumb .icon {
  width: 160px;
  height: 160px;
  color: rgba(0, 0, 0, 0.54);
}

.title-area {
  border-bottom: 1px rgba(0, 0, 0, 0.12) solid;
  margin-bottom: 40px;
}

.dropdown-list-container {
  padding: 12px 0;
  border-radius: 4px;
}

.dropdown-option {
  padding: 0 24px;
  min-width: 180px;
}

`;