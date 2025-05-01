import { PassengerTask } from "./Passenger";

type TaskDestinationCode = 'bag_dropoff' | 'body_scanner' | 'bag_pickup' | 'gate';

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
  return [
    {
      name: 'move to bag drop',
      type: 'move',
      destination: destinations['bag_dropoff'],
      inProgress: false
    },
    {
      name: 'unload bag',
      type: 'action',
      update: () => {
        console.log('unload bag');
      },
      init: () => {
        console.log('init unload bag');
      },
      inProgress: false 
    },
    // move to body scanner
    {
      name: 'move to body scanner',
      type: 'move',
      destination: destinations['body_scanner'],
      inProgress: false
    },
    // scan body
    {
      name: 'scan body',
      type: 'action',
      update: () => {
        console.log('scan body');
      },
      init: () => {
        console.log('init scan body');
      },
      inProgress: false
    },
    // move to bag pickup
    {
      name: 'move to bag pickup',
      type: 'move',
      destination: destinations['bag_pickup'],
      inProgress: false
    },
    // seek bag
    {
      name: 'seek bag',
      type: 'action',
      update: () => {
        console.log('seek bag');
      },
      init: () => {
        console.log('init seek bag');
      },
      inProgress: false
    },
    // pickup bag
    {
      name: 'pickup bag',
      type: 'action',
      update: () => {
        console.log('pickup bag');
      },
      init: () => {
        console.log('init pickup bag');
      },
      inProgress: false
    },
    // move to gate
    {
      name: 'move to gate',
      type: 'move',
      destination: destinations['gate'],
      inProgress: false
    }
  ];
};

export default getPassengerTasks;