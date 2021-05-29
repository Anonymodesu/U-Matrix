import { act, render, screen } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { Hexagon } from './App';

let container = null

beforeEach(() => {
  // setup a DOM element as a render target
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  // cleanup on exiting
  ReactDOM.unmountComponentAtNode(container);
  container.remove();
  container = null;
});

test('Renders U-matrix', () => {
  act(() => {
    ReactDOM.render(<App />, container)
  })
})


/*
https://reactjs.org/docs/testing-recipes.html
https://create-react-app.dev/docs/running-tests/
https://jestjs.io/docs/tutorial-react
*/