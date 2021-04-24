import './App.css';
import React from 'react';

function Hexagon(props) {
  let centre;
  if (props.isVector) {
    centre = <circle cx="8" cy="8" r="1.5" fill="black" />
  } else {
    centre = null
  }

  return (
    <svg xmlns="http://www.w3.org/2000/svg"
      width={props.size}
      class="bi bi-hexagon-fill"
      viewBox="0 0 16 16">
      <path fill="cyan" fill-rule="evenodd" d="M8.5.134a1 1 0 0 0-1 0l-6 3.577a1 1 0 0 0-.5.866v6.846a1 1 0 0 0 .5.866l6 3.577a1 1 0 0 0 1 0l6-3.577a1 1 0 0 0 .5-.866V4.577a1 1 0 0 0-.5-.866L8.5.134z" />
      {centre}
    </svg>
  );
}

function SOM(props) {
  // Hexagon dimensions explained here https://www.redblobgames.com/grids/hexagons/
  const hexagonWidth = Math.sqrt(3) * props.hexagonSize
  const hexagonHeight = 1.5 * props.hexagonSize

  // props.xDim and props.yDim represent the structure of codebook vectors
  // their expanded versions take into account the intermediate hexagons
  const xExpandedDim = props.xDim * 4 - 1
  const yExpandedDim = props.yDim * 2 - 1

  //gridShift represents how the rows in the hexagon grid move forward and backward
  const gridShift = [0, 1, 2, 1]
  const maxGridShift = 2
  const gridItems = []
  const gridCssStyle = {
    'display': 'grid',
    'grid-template-columns': `repeat(${xExpandedDim}, ${0.5 * hexagonWidth}px)`,
    'grid-template-rows': `repeat(${yExpandedDim}, ${hexagonHeight}px)`,
    'justify-content': 'center',
    'align-content': 'center',
  }

  function getGridItem(rowNum, colNum) {
    let gridItem;
    const currentGridShift = gridShift[rowNum % gridShift.length]

    if(colNum < currentGridShift || colNum > xExpandedDim - (maxGridShift - currentGridShift)) {
      gridItem = null

    } else if (rowNum % 2 === 0 &&
      (colNum + rowNum) % 4 === 0) {
      gridItem = <Hexagon size={hexagonWidth} isVector={true} />

    } else if ((colNum + rowNum) % 2 === 0) {
      gridItem = <Hexagon size={hexagonWidth} isVector={false} />

    } else {
      gridItem = null
    }

    return gridItem
  }

  for (let rowNum = 0; rowNum < yExpandedDim; rowNum++) {
    for (let colNum = 0; colNum < xExpandedDim; colNum++) {
      const gridItem = getGridItem(rowNum, colNum)
      gridItems.push(<div key={rowNum * xExpandedDim + colNum}>{gridItem}</div>)
    }
  }

  return (
    <table style={gridCssStyle} >
      {gridItems}
    </table>
  )
}

function App() {
  
  return (
    <div className="App">
      <header>
        <h2>Hexagon</h2>
      </header>
      <body>
        <SOM
          hexagonSize={30}
          xDim={6}
          yDim={6}
        />
        <p>
          <br></br>
          Blah
        </p>
      </body>
    </div>
  );
}

export default App;
