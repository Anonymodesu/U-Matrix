import raw from './ex.cod';

class Hexagon {
  constructor(x, y, vector) {
    this.x = x
    this.y = y
    this.vector = vector
    this.neighbours = {}
  }

  // Calculate the distance between this vector with one of its neighbours
  // This is quite slow; Freya can switch to use https://mathjs.org/docs/datatypes/matrices.html if she wants
  getDistance(position) {
    const neighbour = this.neighbours[position]
    if(neighbour) {
      let distance = 0

      for(let i = 0; i < this.vector.length; i++) {
        const diff = this.vector[i] - neighbour.vector[i]
        distance += diff * diff
      }
      return Math.sqrt(distance)

    } else {
      return null
    }
  }

  // Returns the average distance between this hexagon and its immediate neighbours
  getAverageDistance() {
    const neighbours = Object.keys(this.neighbours)
    return neighbours.map(neighbour => this.getDistance(neighbour))
          .reduce((sum, val) => sum + val, 0) / neighbours.length
  }

  // Returns the max distance between this hexagon and its immediate neighbours
  getMaxDistance() {
    return Math.max(...Object.keys(this.neighbours).map(neighbour => this.getDistance(neighbour)))
  }
}

class HexagonGrid {
  constructor(hexagonGrid, vectorDim, xDim, yDim) {
    this.grid = hexagonGrid
    this.vectorDim = vectorDim
    this.xDim = xDim
    this.yDim = yDim
  }

  // out of bounds means that the hexagon is on the border of the SOM
  inBounds(colNum, rowNum) {
    return colNum >= 0 && colNum < this.xDim
    && rowNum >= 0 && rowNum < this.yDim;
  }

  // calculates the (x,y) coordinates of this hexagon's neighbours
  neighbourCalculators(colNum, rowNum) {
    // hexagons on odd-indexed rows are shifted forward once, compared to hexagons on even-indexed rows
    const rowIndexShift = (rowNum % 2 === 0) ? 0 : 1

    return {
      'top-left':     () => [colNum - 1 + rowIndexShift,  rowNum - 1],
      'top-right':    () => [colNum + rowIndexShift,      rowNum - 1],
      'left':         () => [colNum - 1,                  rowNum],
      'right':        () => [colNum + 1,                  rowNum],
      'bottom-left':  () => [colNum - 1 + rowIndexShift,  rowNum + 1],
      'bottom-right': () => [colNum + rowIndexShift,      rowNum + 1]
    }
  }

  // determines the immediate neighbours of each hexagon
  calculateAllNeighbours() {
    for (let rowNum = 0; rowNum < this.yDim; rowNum++) {
      for (let colNum = 0; colNum < this.xDim; colNum++) {
        this.calculateNeighbours(colNum, rowNum)
      }
    }
  }

  // sets the immediate neighbours of the hexagon at (colNum, rowNum)
  calculateNeighbours(colNum, rowNum) {
    const hexagon = this.grid[rowNum][colNum]

    for (const [key, getCoordinates] of Object.entries(this.neighbourCalculators(colNum, rowNum))) {
      const [x, y] = getCoordinates()

      if (this.inBounds(x, y)) {
        const neighbour = this.grid[y][x]
        hexagon.neighbours[key] = neighbour
      }
    }
  }

  // returns the maximum distance between any 2 vectors in the SOM
  getMaxDistance() {
    return Math.max(
          ...this.grid.map(row => 
          Math.max(...row.map(hexagon => 
          hexagon.getMaxDistance()))))
  }

}

function constructHexagonGrid(vectorGrid, vectorDim, xDim, yDim) {
  const grid = vectorGrid.map((vectorRow, rowNum) => 
                vectorRow.map((vector, colNum) => 
                new Hexagon(colNum, rowNum, vector)))

  const hexagonGrid = new HexagonGrid(grid, vectorDim, xDim, yDim)
  hexagonGrid.calculateAllNeighbours()
  return hexagonGrid
}

/**
 * Given a flattened array of vectors, convert them to a 2D array of vectors (which is a 3D array of numbers)
 * @param {string[]} vectorArr A flattened array of vectors in string format
 * @param {number} vectorDim Number of elements per vector in the SOM
 * @param {number} xDim Number of vectors on the x dimension in the SOM
 * @param {number} yDim Number of neurons on the y dimension in the SOM
 * @returns A 2D array of vectors
 */
function getVectorGrid(vectorArr, vectorDim, xDim, yDim) {
  const vectorGrid = Array(yDim)

  for (let rowNum = 0; rowNum < yDim; rowNum++) {
    const vectorRow = Array(xDim)

    for (let colNum = 0; colNum < xDim; colNum++) {
      const currentVector = vectorArr[rowNum * xDim + colNum]
        .split(' ')
        .slice(0, vectorDim)
        .map(num => parseFloat(num))
      vectorRow[colNum] = currentVector
    }

    vectorGrid[rowNum] = vectorRow
  }

  return vectorGrid
}

/**
 * Generates a grid of hexagons given ./ex.cod
 * @returns {HexagonGrid} 
 */
async function getSOM() {
  const text = (await fetch(raw)).text()
  const lines = (await text).split('\r\n')
  const hyperparameters = lines[0].split(' ')

  const vectorDim = parseInt(hyperparameters[0])
  const xDim = parseInt(hyperparameters[2])
  const yDim = parseInt(hyperparameters[3])
  lines.shift();

  const vectorGrid = getVectorGrid(lines, vectorDim, xDim, yDim)
  return constructHexagonGrid(vectorGrid, vectorDim, xDim, yDim)
}

export { getSOM, HexagonGrid }