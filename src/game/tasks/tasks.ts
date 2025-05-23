import { PassengerTask } from "../passenger/Passenger";
import actionScanBody from "./action-scan-body";
import actionUnloadBag from "./action-unload-bag";
import actionCollectBag from "./action-collect-bag";
import moveTo from "./move-to";

export type TaskDestinationCode = 'bag_dropoff_passenger_bay' | 'body_scanner' | 'bag_pickup_passenger_bay'  | 'gate';

export type TileCoordinates = {
  /**
   * The x coordinate of the destination in tile coordinates
   */
  tileX: number;
  /**
   * The y coordinate of the destination in tile coordinates
   */
  tileY: number;
}

export type WorldCoordinates = {
  /**
   * The x coordinate of the destination in world (pixel) coordinates
   */
  x: number;
  /**
   * The y coordinate of the destination in world (pixel) coordinates
   */
  y: number;
}

export type TaskDestination = TileCoordinates & WorldCoordinates;

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
    actionCollectBag(),
    createMoveToTask('gate')
  ];
};

export default getPassengerTasks;