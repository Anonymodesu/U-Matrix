import raw from './ex.cod';

/**
 * A single node in the SOM
 */
class Node {
  /**
   * @param {*} y y-coordinate of the node in the SOM
   * @param {*} x x-coordinate of the node in the SOM
   * @param {*} vector reference vector in higher dimensional space
   */
  constructor(y, x, vector) {
    this.x = x
    this.y = y
    this.vector = vector
    this.neighbours = {}
  }

  /**
   * This is quite slow; Freya can switch to use https://mathjs.org/docs/datatypes/matrices.html if she wants
   * @param {'top-left'|'top-right'|'left'|'bottom-left'|'bottom-right'|'right'} position position of the neighbour relative to this node
   * @returns Euclidean distance to that neighbour
   */
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

  /**
   * @returns Returns the average distance between this vector and its immediate neighbours
   */
  getAverageDistance() {
    const neighbours = Object.keys(this.neighbours)
    return neighbours.map(neighbour => this.getDistance(neighbour))
          .reduce((sum, val) => sum + val, 0) / neighbours.length
  }

  /**
   * @returns Returns the max distance between this vector and its immediate neighbours
   */
  getMaxDistance() {
    return Math.max(...Object.keys(this.neighbours).map(neighbour => this.getDistance(neighbour)))
  }
}

/**
 * Hexagonal SOM
 */
class SOM {

  /**
   * @param {Node[][][]} nodeGrid a 2D array of nodes in the format [yDim][xDim]
   * @param {number} vectorDim dimension of each node's reference vector
   * @param {number} xDim size of the vectorGrid's x dimension
   * @param {number} yDim size of the vectorGrid's y dimension
   */
  constructor(nodeGrid, vectorDim, xDim, yDim) {
    this.grid = nodeGrid
    this.vectorDim = vectorDim
    this.xDim = xDim
    this.yDim = yDim
  }

  /**
   * @param {number} colNum 
   * @param {number} rowNum 
   * @returns {boolean} whether coordinates (colNum, rowNum) is out of bounds in the SOM vector grid 
   */
  inBounds(rowNum, colNum) {
    return colNum >= 0 && colNum < this.xDim
    && rowNum >= 0 && rowNum < this.yDim;
  }

  /**
   * @param {number} rowNum 
   * @param {number} colNum 
   * @returns a dictionary of functions that calculates the (x,y) coordinates of the neighbours of the vector at (rowNum, colNum)
   */
  neighbourCalculators(rowNum, colNum) {
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

  /**
   * Set the immediate neighbours of each vector in the SOM
   */
  calculateAllNeighbours() {
    for (let rowNum = 0; rowNum < this.yDim; rowNum++) {
      for (let colNum = 0; colNum < this.xDim; colNum++) {
        this.calculateNeighbours(rowNum, colNum)
      }
    }
  }

  /**
   * Set the immediate neighbours of the hexagon at (colNum, rowNum)
   * @param {number} rowNum 
   * @param {number} colNum 
   */
  calculateNeighbours(rowNum, colNum) {
    const hexagon = this.grid[rowNum][colNum]

    for (const [key, getCoordinates] of Object.entries(this.neighbourCalculators(rowNum, colNum))) {
      const [x, y] = getCoordinates()

      if (this.inBounds(y, x)) {
        const neighbour = this.grid[y][x]
        hexagon.neighbours[key] = neighbour
      }
    }
  }

  /**
   * @returns returns the maximum distance between any 2 vectors in the SOM
   */
  getMaxDistance() {
    return Math.max(
          ...this.grid.map(row => 
          Math.max(...row.map(hexagon => 
          hexagon.getMaxDistance()))))
  }

}

/**
 * @param {number[][][]} vectorGrid a 2D array of vectors in the format [yDim][xDim][vectorDim]
 * @param {number} vectorDim dimension of each vector
 * @param {number} xDim size of the vectorGrid's x dimension
 * @param {number} yDim size of the vectorGrid's y dimension
 * @returns A SOM object
 */
function constructSOM(vectorGrid, vectorDim, xDim, yDim) {
  const grid = vectorGrid.map((vectorRow, rowNum) => 
                vectorRow.map((vector, colNum) => 
                new Node(rowNum, colNum, vector)))

  const som = new SOM(grid, vectorDim, xDim, yDim)
  som.calculateAllNeighbours()
  return som
}

/**
 * Given a flattened array of vectors, convert them to a 2D array of vectors (which is a 3D array of numbers)
 * @param {string[]} vectorArr A flattened array of vectors in string format
 * @param {number} vectorDim Number of elements per vector in the SOM
 * @param {number} xDim Number of nodes on the x dimension in the SOM
 * @param {number} yDim Number of nodes on the y dimension in the SOM
 * @returns {number[][][]} A 2D array of vectors
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
 * Generates a SOM given ./ex.cod
 * @returns {SOM} 
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
  return constructSOM(vectorGrid, vectorDim, xDim, yDim)
}

export { getSOM, Node }