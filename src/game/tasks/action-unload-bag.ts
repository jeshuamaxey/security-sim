import Passenger, { PassengerTask } from "../passenger/Passenger";
import { Game } from "../scenes/Game";
import { DESTINATION_KEYS } from "../passenger/constants";
const actionUnloadBag = (): PassengerTask => {
  return {
    name: 'unload bag',
    type: 'action',
    init: (scene: Game, passenger: Passenger) => {
      // find nearest tile in map that is a bag conveyor
      const passengerTileX = scene.map.worldToTileX(passenger.x);
      const passengerTileY = scene.map.worldToTileY(passenger.y);
      const searchRadius = 1; // in tiles

      if(!passengerTileX || !passengerTileY) {
        console.warn('passenger tile coords not found');
        return;
      }

      let localTiles = scene.collidablesLayer?.getTilesWithin(
        passengerTileX - searchRadius, 
        passengerTileY - searchRadius, 
        searchRadius*2+1, 
        searchRadius*2+1,
        { isNotEmpty: true }
      );

      if(!localTiles) {
        console.error('no bag conveyor tiles found');
        return;
      }

      const bagConveyorTiles = localTiles.filter((tile: any) => tile.properties.destinationKey === DESTINATION_KEYS.BAG_CONVEYOR);
      const bagConveyorTile = scene.tilemapUtils.findClosestTile({ x: passenger.x, y: passenger.y }, bagConveyorTiles);

      if(!bagConveyorTile) {
        console.error('no bag conveyor tile found');
        return;
      }

      const conveyorTileX = bagConveyorTile?.pixelX + (bagConveyorTile?.width / 2);
      const conveyorTileY = bagConveyorTile?.pixelY + (bagConveyorTile?.height / 2);

      scene.time.delayedCall(2000, () => {
        if(!passenger.bag) {
          console.error('no bag to unload');
          return;
        }

        passenger.bag.onConveyor = true;
        passenger.bag.onPerson = false;

        const local = scene.gameContainer.getLocalPoint(conveyorTileX, conveyorTileY);
        passenger.bag.setPosition(local.x, local.y);

        passenger.pLog('unloaded bag');
        

        if(passenger.currentTask) {
          passenger.currentTask.inProgress = false;
          passenger.currentTask.completed = true;
        }

        passenger.moveToNextTask();
      });
    },
    update: (scene: Game, passenger: Passenger) => {},
    inProgress: false 
  }
}

export default actionUnloadBag;