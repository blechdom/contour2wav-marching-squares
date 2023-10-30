const data = JuliaData;

const coordArray = [];
let firstCoord = null;
let lastCoord = null;

function testSquare(x, y) {
  NW = (x, y + 1)
  NE = (x + 1, y + 1)
  SW = (x, y)
  SE = (x + 1, y)

  return deriveCase(NW, NE, SE, SW);
}

function writeCoords([x, y]) {
  if([x, y] === firstCoord) {
    // CLOSE PATH
    return false;
  }

  if(coordArray.length === 0) {
    firstCoord = [x, y];
  }
  coordArray.push([x, y]);
  return true;
}

function nextStep([x, y]) {

  const case = testSquare([x, y]);

  switch (case) {
    case 0:
      nextStep(x+1, y); // MOVE RIGHT
    case 1:
      writeCoords([x, y]) ?? return;
      nextStep(x, y-1); // MOVE DOWN
    case 2:
      writeCoords([x, y]) ?? return;
      nextStep(x+1, y); // MOVE RIGHT
    case 3:
      writeCoords([x, y]) ?? return;
      nextStep(x+1, y); // MOVE RIGHT
    case 4:
      writeCoords([x, y]) ?? return;
      nextStep(x, y+1); // MOVE UP
    case 5:
      writeCoords([x, y]) ?? return;
      //lastCoord
      nextStep(x+1, y); // MOVE UP OR DOWN
    case 6:
      writeCoords([x, y]) ?? return;
      nextStep(x, y+1); // MOVE UP
    case 7:
      writeCoords([x, y]) ?? return;
      nextStep(x, y+1); // MOVE UP
    case 8:
      writeCoords([x, y]) ?? return;
      nextStep(x-1, y); // MOVE LEFT
    case 9:
      writeCoords([x, y]) ?? return;
      nextStep(x, y-1); // MOVE DOWN
    case 10:
      writeCoords([x, y]) ?? return;
      nextStep(x-1, y); // MOVE LEFT OR RIGHT
    case 11:
      writeCoords([x, y]) ?? return;
      nextStep(x+1, y); // MOVE RIGHT
    case 12:
      writeCoords([x, y]) ?? return;
      nextStep(x-1, y); // MOVE LEFT
    case 13:
      writeCoords([x, y]) ?? return;
      nextStep(x, y-1); // MOVE DOWN
    case 14:
      writeCoords([x, y]) ?? return;
      nextStep(x-1, y); // MOVE LEFT
  }

  lastCoord = [x, y];
}

const startingPoint = [Math.floor(data.length / 2) * -1, 0];

generateBoundary(startingPoint);