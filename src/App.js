import React from 'react';
import { getSOM } from './SOM';
import Color from 'color';

/**
 * @param {*} props 
 * @returns A single display hexagon in the U-Matrix
 */
function Hexagon(props) {
  const color = Color('rgb(255, 255, 255)').darken(props.distanceRatio)

  let centre;
  if (props.isVector) {
    centre = <circle cx="8" cy="8" r="1.5"
      fill={props.distanceRatio > 0.5 ? "white" : "black"} />
  } else {
    centre = null
  }

  return (
    <svg xmlns="http://www.w3.org/2000/svg"
      width={props.size}
      class="bi bi-hexagon-fill"
      viewBox="0 0 16 16">
      <path fill={color} fill-rule="evenodd"
        d="M8.5.134a1 1 0 0 0-1 0l-6 3.577a1 1 0 0 0-.5.866v6.846a1 1 0 0 0 .5.866l6 3.577a1 1 0 0 0 1 0l6-3.577a1 1 0 0 0 .5-.866V4.577a1 1 0 0 0-.5-.866L8.5.134z"
      />
      {centre}
    </svg>
  );
}

/**
 * Generates the displayed U-Matrix.
 * The grid's coordinate system is inspired by https://www.redblobgames.com/grids/hexagons/. 
 * Check the topics 'Offset coordinates' and 'Doubled coordinates'.
 * 
 * Inspired by the above, there's two coordinate systems being simultaneously used in the code below:
 *  - The SOM coordinate system described by the SOM paper. The following variables refer to this coordinate system:
 *    - rowNum
 *    - colNum
 *    - xDim
 *    - yDim
 *  - The 'expanded' coordinate system which considers the intermediate hexagons between vectors, representing their distance.
 *    The following variables refer to this coordinate system:
 *    - expandedRowNum
 *    - expandedColNum
 *    - xExpandedDim
 *    - yExpandedDim
 */
class UMatrix extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      hexagonGrid: null
    }
  }

  //Load the hexagon grid into memory
  componentDidMount() {
    getSOM().then(grid => this.setState({
      hexagonGrid: grid,
      maxDistance: grid.getMaxDistance(),
      xExpandedDim: grid.xDim * 4 - 1,
      yExpandedDim: grid.yDim * 2 - 1,

      // Hexagon dimensions explained here https://www.redblobgames.com/grids/hexagons/
      hexagonWidth: Math.sqrt(3) * this.props.hexagonSize,
      hexagonHeight: 1.5 * this.props.hexagonSize
    }))
  }

  // Returns CSS to correctly place the hexagon in the grid
  getHexagonCSS(expandedRowNum, expandedColNum) {
    // CSS grid indices start from 1 instead of 0
    return {
      'grid-column': `${expandedColNum + 1}`,
      'grid-column-end': `${expandedColNum + 2}`,
      'grid-row-start': `${expandedRowNum + 1}`,
      'grid-row-end': `${expandedRowNum + 2}`,
    }
  }

  /**
   * @param {JSX.Element} hexagon 
   * @param {number} expandedRowNum 
   * @param {number} expandedColNum 
   * @returns a div that captures the hexagon's position in the displayed/expanded hexagon grid
   */
  getGridItem(hexagon, expandedRowNum, expandedColNum) {
    return <div key={expandedRowNum * this.state.xExpandedDim + expandedColNum}
      style={this.getHexagonCSS(expandedRowNum, expandedColNum)}>
      {hexagon}
    </div>
  }

  /**
   * Returns the coordinates of the hexagon (in the expanded space) representing the distance between
   * the hexagon at (expandedColNum, expandedRowNum) and its neighbour
   * @param {'bottom-left'|'bottom-right'|'right'} neighbour 
   * @param {number} expandedRowNum 
   * @param {number} expandedColNum 
   * @returns coordinates of the distance hexagon
   */
  getNeighbourCoordinates(neighbour, expandedRowNum, expandedColNum) {
    switch (neighbour) {
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

  /**
   * Generates the hexagon at position (colNum, rowNum) in the grid, representing a codebook vector.
   * Also generates up to 3 hexagons to represent the vector's distances to three of its neighbours.
   * Check out the Components tab in React's Devtools plugin to see the order of hexagon generation.
   * @param {number} rowNum 
   * @param {number} colNum 
   * @returns a list of up to 4 JSX elements, 
   * 
   */
  generateHexagonNeighbourhood(rowNum, colNum) {
    const hexagon = this.state.hexagonGrid.grid[rowNum][colNum]
    const vectorHexagon = <Hexagon
      size={this.state.hexagonWidth}
      isVector={true}
      distanceRatio={hexagon.getAverageDistance() / this.state.maxDistance}
    />

    // For odd-indexed rows we add 2 * (rowNum % 2) to shift it forward
    const expandedColNum = 4 * colNum + 2 * (rowNum % 2)
    const expandedRowNum = 2 * rowNum

    // First add the vector hexagon
    const neighbourhood = [this.getGridItem(vectorHexagon, expandedRowNum, expandedColNum)]

    // Then add the vector hexagon's neighbours (which are distance hexagons)
    for (const neighbour of ['bottom-left', 'bottom-right', 'right']) {
      if (hexagon.neighbours[neighbour]) {
        const distanceHexagon = <Hexagon
          size={this.state.hexagonWidth}
          isVector={false}
          distanceRatio={hexagon.getDistance(neighbour) / this.state.maxDistance}
        />
        const [x, y] = this.getNeighbourCoordinates(neighbour, expandedRowNum, expandedColNum)
        neighbourhood.push(this.getGridItem(distanceHexagon, y, x))
      }
    }

    return neighbourhood
  }

  render() {
    if (!this.state.hexagonGrid) {
      return null
    }

    const gridCssStyle = {
      'display': 'grid',
      'grid-template-columns': `repeat(${this.state.xExpandedDim}, ${0.5 * this.state.hexagonWidth}px)`,
      'grid-template-rows': `repeat(${this.state.yExpandedDim}, ${this.state.hexagonHeight}px)`,
      'justify-content': 'center',
    }

    let gridItems = []
    for (let rowNum = 0; rowNum < this.state.hexagonGrid.yDim; rowNum++) {
      for (let colNum = 0; colNum < this.state.hexagonGrid.xDim; colNum++) {
        const neighbourhood = this.generateHexagonNeighbourhood(rowNum, colNum)
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
    <div>
      <header style={{'text-align': 'center'}}>
        <h2>Hexagon</h2>
      </header>
      <body>
        <UMatrix hexagonSize={30}/>
      </body>
    </div>
  );
}

export default App;
