export enum Priority {
  P1 = 'p1',
  P2 = 'p2',
  P3 = 'p3',
  P4 = 'p4',
  P5 = 'p5'
}

export enum State {
  BACKLOG = 'backlog',
  NEW = 'new',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  IN_TEST = 'in_test',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  CLOSED = 'closed'
}

export enum WorkItemType {
  INITIATIVE = 'initiative',
  EPIC = 'epic',
  FEATURE = 'feature',
  USER_STORY = 'user_story',
  TASK = 'task',
  BUG = 'bug'
}

// Display values for enums
export const PriorityDisplay: Record<Priority, string> = {
  [Priority.P1]: 'P1 - Highest',
  [Priority.P2]: 'P2 - High',
  [Priority.P3]: 'P3 - Medium',
  [Priority.P4]: 'P4 - Low',
  [Priority.P5]: 'P5 - Lowest'
}

export const StateDisplay: Record<State, string> = {
  [State.BACKLOG]: 'Backlog',
  [State.NEW]: 'New',
  [State.ACTIVE]: 'Active',
  [State.ON_HOLD]: 'On Hold',
  [State.IN_TEST]: 'In Test',
  [State.ACCEPTED]: 'Accepted',
  [State.REJECTED]: 'Rejected',
  [State.CLOSED]: 'Closed'
}

export const WorkItemTypeDisplay: Record<WorkItemType, string> = {
  [WorkItemType.INITIATIVE]: 'Initiative',
  [WorkItemType.EPIC]: 'Epic',
  [WorkItemType.FEATURE]: 'Feature',
  [WorkItemType.USER_STORY]: 'User Story',
  [WorkItemType.TASK]: 'Task',
  [WorkItemType.BUG]: 'Bug'
} 