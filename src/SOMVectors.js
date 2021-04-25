import raw from './ex.cod';

class Hexagon {
  constructor(x, y, vector) {
    this.x = x
    this.y = y
    this.vector = vector
    this.neighbours = {}
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

  calculateNeighbours(colNum, rowNum) {
    const hexagon = this.grid[rowNum][colNum]

    for (const [key, getCoordinates] of Object.entries(neighbourCalculators(colNum, rowNum))) {
      const [x, y] = getCoordinates()
      let neighbour;

      if (this.inBounds(x, y)) {
        neighbour = this.grid[y][x]

      } else {
        neighbour = null
      }

      hexagon.neighbours[key] = neighbour
    }
  }

}

// calculates the (x,y) coordinates of this hexagon's neighbours
function neighbourCalculators(colNum, rowNum) {
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

function constructHexagonGrid(vectorGrid, vectorDim, xDim, yDim) {
  const grid = vectorGrid.map((vectorRow, rowNum) => 
                vectorRow.map((vector, colNum) => 
                new Hexagon(colNum, rowNum, vector)))

  const hexagonGrid = new HexagonGrid(grid, vectorDim, xDim, yDim)

  for (let rowNum = 0; rowNum < yDim; rowNum++) {
    for (let colNum = 0; colNum < xDim; colNum++) {
      hexagonGrid.calculateNeighbours(colNum, rowNum)
    }
  }
  return hexagonGrid
}

/**
 * Given a flattened array of vectors, convert them to a 2D array of vectors (which is a 3D array of numbers)
 * @param {string[]} vectorArr A flattened array of vectors in string format
 * @param {*} vectorDim Number of elements per vector in the SOM
 * @param {*} xDim Number of vectors on the x dimension in the SOM
 * @param {*} yDim Number of neurons on the y dimension in the SOM
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

async function getHexagonGrid() {
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

export { getHexagonGrid, HexagonGrid }