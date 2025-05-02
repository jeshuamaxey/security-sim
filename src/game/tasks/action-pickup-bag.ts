import Passenger, { PassengerTask } from "../passenger/Passenger";
import { Game } from "../scenes/Game";

const actionPickupBag = (): PassengerTask => {
  return {
    name: 'pickup bag',
    type: 'action',
    init: (scene: Game, passenger: Passenger) => {
      console.log('pickup bag');

      // find the nearest bag dropoff tile
      const bagDropoffTiles = scene.destinations.bag_dropoff

      // passenger.bag.moveTo(bagDropoffTiles.x, bagDropoffTiles.y);

      scene.time.delayedCall(1000, () => {
        passenger.pLog('picked up bag');
        if(passenger.currentTask) {
          passenger.currentTask.inProgress = false;
          passenger.currentTask.completed = true;
        }
        passenger.moveToNextTask();
      });
    },
    update: () => {
      console.log('init pickup bag');
    },
    inProgress: false
  }
}

export default actionPickupBag;