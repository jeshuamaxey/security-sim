import { PassengerTask } from "../passenger/Passenger"
import { TaskDestinationCode, TaskDestinationMap } from "./tasks"

const moveTo = (destinations: TaskDestinationMap) => (destination_key: TaskDestinationCode): PassengerTask => {
  return {
    name: `move to ${destination_key}`,
    type: 'move',
    destination: destinations[destination_key],
    inProgress: false
  }
}

export default moveTo;