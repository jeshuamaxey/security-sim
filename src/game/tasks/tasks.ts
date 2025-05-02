import { PassengerTask } from "../passenger/Passenger";
import actionScanBody from "./action-scan-body";
import actionUnloadBag from "./action-unload-bag";
import actionSeekBag from "./action-seek-bag";
import actionPickupBag from "./action-pickup-bag";
import moveTo from "./move-to";

export type TaskDestinationCode = 'bag_dropoff_passenger_bay' | 'body_scanner' | 'bag_pickup_passenger_bay'  | 'gate';

export type TaskDestination = {
  /**
   * The x coordinate of the destination in world (pixel) coordinates
   */
  x: number;
  /**
   * The x coordinate of the destination in tile coordinates
   */
  tileX: number;
  /**
   * The y coordinate of the destination in world (pixel) coordinates
   */
  y: number;
  /**
   * The y coordinate of the destination in tile coordinates
   */
  tileY: number;
}

export type TaskDestinationMap = {
  [key in TaskDestinationCode]: TaskDestination;
}


const getPassengerTasks = (destinations: TaskDestinationMap): PassengerTask[] => {
  const createMoveToTask = moveTo(destinations);

  return [
    createMoveToTask('bag_dropoff_passenger_bay'),
    actionUnloadBag(),
    createMoveToTask('body_scanner'),
    actionScanBody(),
    createMoveToTask('bag_pickup_passenger_bay'),
    actionSeekBag(),
    actionPickupBag(),
    createMoveToTask('gate')
  ];
};

export default getPassengerTasks;