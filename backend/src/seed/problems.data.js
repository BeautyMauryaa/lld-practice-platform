// Seed data for the LLD Practice Platform.
//
// NOTE on expectedConcepts: these are concepts that MAY be relevant to a
// good solution, not a required answer key. LLD problems generally have
// more than one valid design, so this list is intentionally not exhaustive
// and not phrased as "the correct pattern to use."

const problems = [
  {
    title: 'Design a Parking Lot',
    difficulty: 'medium',
    requirements: [
      'Support multiple spot sizes (e.g. compact, large, handicapped)',
      'Track which spots are occupied and which are free',
      'Record when a vehicle enters and exits',
      'Support multiple entry/exit points',
    ],
    constraints: [
      'No payment gateway integration is required',
      'Assume a single parking lot location (not multiple sites)',
    ],
    expectedConcepts: [
      'Some form of spot allocation strategy',
      'Polymorphism across vehicle or spot types',
      'A clear relationship between ParkingLot, Spot, and Vehicle',
    ],
  },
  {
    title: 'Design a Vending Machine',
    difficulty: 'easy',
    requirements: [
      'Support selecting and dispensing an item',
      'Accept payment and calculate change',
      'Handle out-of-stock items',
      'Support restocking inventory',
    ],
    constraints: [
      'No real payment processor integration is required',
      'Assume a single machine, not a fleet of machines',
    ],
    expectedConcepts: [
      'Some representation of machine state (e.g. idle, selecting, dispensing)',
      'Separation between inventory management and payment handling',
    ],
  },
  {
    title: 'Design an Elevator System',
    difficulty: 'hard',
    requirements: [
      'Support multiple elevators serving multiple floors',
      'Handle floor requests from inside and outside the elevator',
      'Decide which elevator responds to a given request',
      'Handle direction changes (up/down) sensibly',
    ],
    constraints: [
      'No need to model real-time scheduling optimization in depth',
      'Assume a single building (not multiple buildings/zones)',
    ],
    expectedConcepts: [
      'Some notion of elevator state or mode',
      'A dispatch/selection approach for assigning requests to elevators',
      'A clear model of request direction and floor queues',
    ],
  },
];

module.exports = problems;