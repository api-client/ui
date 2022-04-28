import { css } from 'lit';

export default css`
ul {
  margin: 0;
  padding: 0;
  list-style-image: none;
}

.list-item-content {
  height: 40px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  width: 100%;
  box-sizing: border-box;
}

.object-icon {
  width: 20px;
  height: 20px;
  margin-right: 8px;
  /* color: var(--accent-color); */
}

:not([data-disabled]) .list-item-content:hover {
  background-color: var(--list-hover-background);
}

li {
  outline: none;
  list-style: none;
}

li[data-disabled] {
  pointer-events: none;
  opacity: var(--disabled-opacity);
}

li:focus > .list-item-content,
li.focused > .list-item-content {
  background: var(--list-active-background, #e3f2fd);
}

.opened > div > .open-icon {
  transform: rotate(90deg);
}

.item-label {
  font-size: medium;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

li[data-parent] {
  padding-left: 8px;
}

.name-change {
  height: 40px;
  display: flex;
  align-items: center;
  padding: 0px 20px;
  border-top: 1px rgba(0, 0, 0, var(--dark-divider-opacity)) solid;
  border-bottom: 1px rgba(0, 0, 0, var(--dark-divider-opacity)) solid;
}

.name-change input {
  flex: 1;
  height: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  background-color: transparent;
  outline: none;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-style: italic;
}
`;
