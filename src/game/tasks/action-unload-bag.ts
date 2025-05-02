import Passenger, { PassengerTask } from "../passenger/Passenger";
import { Game } from "../scenes/Game";

const actionUnloadBag = (): PassengerTask => {
  return {
    name: 'unload bag',
    type: 'action',
    init: (scene: Game, passenger: Passenger) => {
      console.log('init unload bag');
      scene.time.delayedCall(2000, () => {
        passenger.bag = undefined;
        passenger.pLog('unloaded bag');
        if(passenger.currentTask) {
          passenger.currentTask.inProgress = false;
          passenger.currentTask.completed = true;
        }

        passenger.moveToNextTask();
      });
    },
    update: (scene: Game, passenger: Passenger) => {
      console.log('unload bag');
    },
    inProgress: false 
  }
}

export default actionUnloadBag;