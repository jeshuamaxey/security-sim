import Passenger, { PassengerTask } from "../passenger/Passenger";
import { Game } from "../scenes/Game";

const actionSeekBag = (): PassengerTask => {
  return {
    name: 'seek bag',
    type: 'action',
    init: (scene: Game, passenger: Passenger) => {
      console.log('seek bag');

      scene.time.delayedCall(1000, () => {
        passenger.pLog('seeking bag');
        if(passenger.currentTask) {
          passenger.currentTask.inProgress = false;
          passenger.currentTask.completed = true;
        }
        passenger.moveToNextTask();
      });
    },
    update: () => {},
    inProgress: false
  }
}

export default actionSeekBag;