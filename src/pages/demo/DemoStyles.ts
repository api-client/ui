import { css } from 'lit';

export default css`
html {
  font-size: 15px;
  line-height: 20px;
}

body {
  font-family: 'Roboto', 'Noto', sans-serif;
  font-size: 15px;
}

.demo {
  margin: 0;
  padding: 0;
  height: 100vh;
}

header {
  padding: 12px 24px;
  background-color: #2196F3;
  color: #000;
  display: flex;
  align-items: center;
}

header h1 {
  font-size: 24px;
  font-weight: 400;
  letter-spacing: -.012em;
  line-height: 32px;
}

.spacer {
  flex: 1;
}

h2 {
  font-size: 60px;
  color: #202124;
  font-weight: 400;
  line-height: 1.2;
}
h3 {
  font-size: 24px;
  color: #202124;
  font-weight: 400;
  line-height: 1.2;
}
h4 {
  font-size: 20px;
  font-weight: 400;
  line-height: 1.2;
  margin: 0 0 8px;
}
.styled.dark h2,
.styled.dark h3,
.styled.dark h4 {
  color: #F5F5F5;
}

ul {
  padding-left: 20px;
}
p {
  margin: 1.40em 0;
}


.centered {
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.centered.medium {
  max-width: 1024px;
}

.centered.large {
  max-width: 1280px;
}

.centered.x-large {
  max-width: 1400px;
}

.centered.xx-large {
  max-width: 1800px;
}

#app.with-nav {
  display: grid;
  grid-template:
    "header header" 72px
    "nav content" auto / minmax(200px, 2fr) 10fr;
}

#app.with-nav header {
  grid-area: header;
}

#app.with-nav nav {
  grid-area: nav;
}

#app.with-nav content {
  grid-area: nav;
}

.nav-item {
  appearance: none;
  border: none;
  background-color: transparent;
  min-height: 40px;
  display: flex;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  padding: 0px 20px;
  border-radius: 0 20px 20px 0;
}

.nav-item:hover {
  background: #eeeeee;
}

.nav-item:active {
  background: #e3f2fd;
}
`;
