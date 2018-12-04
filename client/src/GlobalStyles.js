import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  html {
    box-sizing: border-box;
    font-size: 62.5%;
    font-family: 'Open Sans', sans-serif;
    *, *:before, *:after {
      box-sizing: inherit;
    }
  }
  body {
    padding: 0;
    margin: 0;
    font-size: ${props => props.theme.fontSize.normal};
    line-height: 1.8;
  }
  input, select, textarea, button {
    font-size: inherit;
  }
  a {
    color: ${props => props.theme.colors.stratosphere};
  }
`;

export default GlobalStyle;