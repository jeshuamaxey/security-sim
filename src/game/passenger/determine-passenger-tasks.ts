import { TileCoordinates } from "../tasks/tasks";
import { PathFinder } from "../utils/tilemaps";
import Passenger, { PassengerTask } from "./Passenger";
import moveTo from "../tasks/move-to";
import { PassengerConfig } from "./Passenger";

const determinePassengerTasks = (passenger: Passenger, pathFinder: PathFinder, pConfig: PassengerConfig) => {
  const tasks: PassengerTask[] = [];
  const startTile = {
    tileX: pathFinder.tilemap.worldToTileX(passenger.x),
    tileY: pathFinder.tilemap.worldToTileY(passenger.y)
  };

  if(startTile.tileX == null || startTile.tileY == null) {
    console.log(passenger.x, passenger.y);
    throw new Error('Invalid start tile coordinates');
  }

  const endTile = {
    tileX: pConfig.destinations.gate.tileX,
    tileY: pConfig.destinations.gate.tileY
  };

  const directPath = pathFinder.findPathInTileCoords(startTile as TileCoordinates, endTile as TileCoordinates);
  const createMoveToTask = moveTo(pConfig.destinations);

  // if (directPath.length > 0) {
  //   passenger.pLog(`Direct path to gate found for ${passenger.name}`, 'log');
  //   tasks.push(createMoveToTask('gate'));
  // } else {
    passenger.pLog(`No direct path to gate for ${passenger.name} — falling back to full security path.`, 'warn');
    tasks.push(...pConfig.tasks);
  // }

  return tasks;
}

export default determinePassengerTasks;