export const PASSENGER = {
  SPEED: 100,
  HEIGHT: 32,
  WIDTH: 32,

  ORIGIN_X: 0.5,
  ORIGIN_Y: 0.8,

  SPAWN_RADIUS: 100,

  WAYPOINT_TOLERANCE: 10,

  WAIT_AFTER_COLLISION_MS: 1000
}

export const BAG = {
  CONVEYOR_SPEED: 100,
}

export const DESTINATION_KEYS = {
  BAG_DROP_OFF_PASSENGER_BAY: 'bag_dropoff_passenger_bay',
  BAG_CONVEYOR: 'bag_conveyor',
  
  BODY_SCANNER: 'body_scanner',
  BAG_SCANNER: 'bag_scanner',
  
  BAG_PICKUP_PASSENGER_BAY: 'bag_pickup_passenger_bay',
  BAG_PICKUP: 'bag_pickup',
  
  GATE: 'gate',
}
