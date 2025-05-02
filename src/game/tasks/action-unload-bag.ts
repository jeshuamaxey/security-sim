import Passenger, { PassengerTask } from "../passenger/Passenger";
import { Game } from "../scenes/Game";

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

      let bagConveyorTiles = scene.collidablesLayer.getTilesWithin(
        passengerTileX - searchRadius, 
        passengerTileY - searchRadius, 
        searchRadius*2, 
        searchRadius*2
      );

      const bagConveyorTile = bagConveyorTiles.find((tile: any) => tile.properties.destinationKey === 'bag_conveyor');

      if(!bagConveyorTile) {
        console.warn('no bag conveyor tile found');
        return;
      }

      const conveyorTileX = bagConveyorTile?.pixelX + (bagConveyorTile?.width / 2);
      const conveyorTileY = bagConveyorTile?.pixelY + (bagConveyorTile?.height / 2);

      scene.time.delayedCall(2000, () => {
        if(!passenger.bag) {
          console.warn('no bag to unload');
          return;
        }

        passenger.bag.onConveyor = true;
        passenger.bag.onPerson = false;
        passenger.bag.setPosition(conveyorTileX, conveyorTileY);
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