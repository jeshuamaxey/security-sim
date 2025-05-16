export type KPIConstraint = {
  key: 'suspiciousItemsPassed' | 'passengersProcessed' | 'timeTaken';
  max?: number;
  min?: number;
};

export type LevelConfig = {
  id: string;
  name: string;
  description?: string;
  airportId: string;
  spawnRate: number;         // seconds between spawns
  passengerCount: number;    // total for the level
  startDate: string;         // ISO format: '2024-05-06'
  endDate: string;           // ISO format: '2024-05-12'
  kpis: KPIConstraint[];
  isTutorial?: boolean;
  isDebug?: boolean;
};

const LEVELS: LevelConfig[] = [
  // {
  //   id: 'debug',
  //   name: 'Debug',
  //   description: 'Debug level',
  //   airportId: 'LHR', // London Heathrow
  //   spawnRate: 0,
  //   passengerCount: 99,
  //   startDate: '2025-01-06', // Monday
  //   endDate: '2025-01-12',   // Sunday
  //   isTutorial: true,
  //   isDebug: true,
  //   kpis: [
  //     {
  //       key: 'suspiciousItemsPassed',
  //       max: 1
  //     }
  //   ]
  // },
  {
    id: 'tutorial',
    name: 'Training Terminal',
    description: 'Get familiar with airport security operations.',
    airportId: 'LHR', // London Heathrow
    spawnRate: 2.0,
    passengerCount: 3,
    startDate: '2025-01-06', // Monday
    endDate: '2025-01-12',   // Sunday
    isTutorial: true,
    kpis: [
      {
        key: 'suspiciousItemsPassed',
        max: 1
      }
    ]
  },
  {
    id: 'level-1',
    name: 'Week One at Gatwick',
    airportId: 'LGW',
    spawnRate: 1.5,
    passengerCount: 40,
    startDate: '2025-01-13',
    endDate: '2025-01-19',
    kpis: [
      {
        key: 'suspiciousItemsPassed',
        max: 3
      }
    ]
  },
  {
    id: 'level-2',
    name: 'Week Two – Evening Crunch',
    airportId: 'LGW',
    spawnRate: 1.0,
    passengerCount: 60,
    startDate: '2025-01-20',
    endDate: '2025-01-26',
    kpis: [
      {
        key: 'suspiciousItemsPassed',
        max: 2
      },
      {
        key: 'passengersProcessed',
        min: 60
      }
    ]
  }
];

export default LEVELS;