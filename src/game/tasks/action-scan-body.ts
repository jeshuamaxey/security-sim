import Passenger, { PassengerTask } from "../passenger/Passenger";
import { Game } from "../scenes/Game";

const actionScanBody = (): PassengerTask => {
  return {
    name: 'scan body',
    type: 'action',
    update: () => {},
    init: (scene: Game, passenger: Passenger) => {
      console.log('scan body');

      scene.time.delayedCall(2000, () => {
        passenger.pLog('scanned body');
        if(passenger.currentTask) {
          passenger.currentTask.inProgress = false;
          passenger.currentTask.completed = true;
        }
        passenger.moveToNextTask();
      });
    },
    inProgress: false
  }
}

export default actionScanBody;