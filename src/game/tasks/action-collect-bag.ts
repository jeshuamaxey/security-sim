import Bag from "../bag/Bag";
import Passenger, { PassengerTask } from "../passenger/Passenger";
import { Game } from "../scenes/Game";

const actionCollectBag = (): PassengerTask => {
  return {
    name: 'seek bag',
    type: 'action',
    init: (scene: Game, passenger: Passenger) => {},
    update: (scene: Game, passenger: Passenger) => {
      if(!passenger.currentTask) {
        return;
      }

      const bags: Bag[] = scene.bags.getChildren() as Bag[];
      
      const bag = bags.find((bag: Bag) => {
        return bag.onPickup && bag.id === passenger.bag?.id;
      });

      if(bag) {
        bag.onPerson = true;
        bag.onConveyor = false;
        bag.onPickup = false;
        bag.setVelocity(0, 0);

        passenger.currentTask.inProgress = false;
        passenger.currentTask.completed = true;
        passenger.moveToNextTask();
      }
    },
    inProgress: false
  }
}

export default actionCollectBag;