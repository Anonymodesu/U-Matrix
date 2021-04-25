import './App.css';
import React from 'react';
import { getHexagonGrid, HexagonGrid } from './SOMVectors';
import 'color'
import Color from 'color';

function Hexagon(props) {
  const color = Color('rgb(255, 255, 255)').darken(props.distanceRatio)

  let centre;
  if (props.isVector) {
    centre = <circle cx="8" cy="8" r="1.5" fill={props.distanceRatio > 0.5 ? "white" : "black"} />
  } else {
    centre = null
  }

  return (
    <svg xmlns="http://www.w3.org/2000/svg"
      width={props.size}
      class="bi bi-hexagon-fill"
      viewBox="0 0 16 16">
      <path fill={color} fill-rule="evenodd" d="M8.5.134a1 1 0 0 0-1 0l-6 3.577a1 1 0 0 0-.5.866v6.846a1 1 0 0 0 .5.866l6 3.577a1 1 0 0 0 1 0l6-3.577a1 1 0 0 0 .5-.866V4.577a1 1 0 0 0-.5-.866L8.5.134z" />
      {centre}
    </svg>
  );
}

class SOM extends React.Component {

  constructor(props) {
    super(props);
    // Initialise an empty grid while the real one loads
    this.state = {
      hexagonGrid: new HexagonGrid([[]], 1, 0, 0)
    }
  }

  //Load the real hexagon grid into memory
  componentDidMount() {
    getHexagonGrid().then(grid => this.setState({
      hexagonGrid: grid
    }))
  }

  render() {
    const hexagonGrid = this.state.hexagonGrid
    const maxDistance = hexagonGrid.getMaxDistance()

    // Hexagon dimensions explained here https://www.redblobgames.com/grids/hexagons/
    // Check the topics 'Offset coordinates' and 'Doubled coordinates'
    // I'm using Doubled coordinates
    const hexagonWidth = Math.sqrt(3) * this.props.hexagonSize
    const hexagonHeight = 1.5 * this.props.hexagonSize

    // props.xDim and props.yDim represent the structure of codebook vectors
    // their expanded versions take into account the intermediate distances hexagons
    const xExpandedDim = hexagonGrid.xDim * 4 - 1
    const yExpandedDim = hexagonGrid.yDim * 2 - 1

    let gridItems = []
    const gridCssStyle = {
      'display': 'grid',
      'grid-template-columns': `repeat(${xExpandedDim}, ${0.5 * hexagonWidth}px)`,
      'grid-template-rows': `repeat(${yExpandedDim}, ${hexagonHeight}px)`,
      'justify-content': 'center',
    }

    // Returns CSS to correctly place the hexagon in the grid
    function getHexagonCSS(expandedRowNum, expandedColNum) {

      // CSS grid indices start from 1 instead of 0
      return {
        'grid-column': `${expandedColNum + 1}`,
        'grid-column-end': `${expandedColNum + 2}`,
        'grid-row-start': `${expandedRowNum + 1}`,
        'grid-row-end': `${expandedRowNum + 2}`,
      }
    }

    function getGridItem(gridItem, expandedRowNum, expandedColNum) {
      return <div key={expandedRowNum * xExpandedDim + expandedColNum} 
                  style={getHexagonCSS(expandedRowNum, expandedColNum)}>
                {gridItem}
            </div>
    }

    function getNeighbourCoordinates(neighbour, expandedRowNum, expandedColNum) {
      switch(neighbour) {
        case 'bottom-left':
          expandedRowNum++
          expandedColNum--
          break
        case 'bottom-right':
          expandedRowNum++
          expandedColNum++
          break
        case 'right':
          expandedColNum += 2
          break;
        default:
          throw new Error(`${neighbour} is not a valid neighbour`)
      }
      return [expandedColNum, expandedRowNum]
    }

    function generateHexagonNeighbourhood(rowNum, colNum) {
      const hexagon = hexagonGrid.grid[rowNum][colNum]
      const vectorHexagon = <Hexagon 
                              size={hexagonWidth} 
                              isVector={true} 
                              distanceRatio={hexagon.getAverageDistance() / maxDistance}
                            />

      const expandedColNum = 4 * colNum + 2 * (rowNum % 2)
      const expandedRowNum = 2 * rowNum

      //First add the vector hexagon
      const neighbourhood = [ getGridItem(vectorHexagon, expandedRowNum, expandedColNum) ]

      // Then add the vector hexagon's neighbours (which are distance hexagons)
      for(const neighbour of ['bottom-left', 'bottom-right', 'right']) {
        if(hexagon.neighbours[neighbour]) {
          const distanceHexagon = <Hexagon 
                                    size={hexagonWidth} 
                                    isVector={false} 
                                    distanceRatio={hexagon.getDistance(neighbour) / maxDistance}
                                  />
          const [x, y] = getNeighbourCoordinates(neighbour, expandedRowNum, expandedColNum)
          neighbourhood.push(getGridItem(distanceHexagon, y, x))
        } 
      }

      return neighbourhood
    }

    for (let rowNum = 0; rowNum < hexagonGrid.yDim; rowNum++) {
      for (let colNum = 0; colNum < hexagonGrid.xDim; colNum++) {
        const neighbourhood = generateHexagonNeighbourhood(rowNum, colNum)
        gridItems = gridItems.concat(neighbourhood)
      }
    }

    return (
      <div style={gridCssStyle} >
        {gridItems}
      </div>
    )
  }
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
