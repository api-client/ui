import { css } from 'lit';

export default css`
.nav-separator {
  height: 1px;
  background-color: var(--divider-color);
  width: 100%;
  margin: 20px 0;
}

.apps {
  padding: 2rem;
}

.apps > ul {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  grid-gap: 1rem;
}

.apps > ul > li {
  border: 1px solid #E2E2E2;
  border-radius: .5rem;
  list-style: none;
  display: flex;
  flex-direction: column;
}

.apps > ul > li > figure {
  max-height: 220px;
  overflow: hidden;
  border-top-left-radius: .5rem;
  border-top-right-radius: .5rem;
  position: relative;
  text-align: center;
}

.apps > ul > li > figure > api-icon {
  width: 120px;
  height: 120px;
}

.apps > ul > li > figure > figcaption {
  width: 100%;
}

.apps > ul > li > figure > figcaption > h3 {
  font-size: 1.25rem;
  font-weight: 300;
}

.apps > ul > li > p {
  font-size: 1rem;
  line-height: 1.5;
  padding: 1rem .75rem;
  color: var(--secondary-text-color);
  flex: 1;
}

.apps > ul > li > .actions {
  align-self: start;
  /* margin: 12px 12px; */
  padding: 1rem .75rem;
}
.apps > ul > li.inactive {
  opacity: 0.31;
}
`;
