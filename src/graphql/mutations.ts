import gql from "graphql-tag";

export const CREATE_WORK_ITEM = gql`
  mutation CreateWorkItem($input: WorkItemCreate!) {
    createWorkItem(input: $input) {
      id
      u_id
      title
      description
      type
      assignedTo{
        id
        firstName
        lastName
        email
        imageUrl
      }
      sprint
      priority
      story_points
      original_estimate
      parent {
        id
        u_id
        title
      }
      createdAt
      createdBy{
        id
        firstName
        lastName
        email
        imageUrl
      }
      org_id
      tags {
        id
        tag
      }
    }
  }
`;

export const DELETE_WORK_ITEM = gql`
mutation DeleteWorkItem($input: WorkItemDelete!) {
    deleteWorkItem(input: $input) {
        deleted
    }
}
`;
export const UPDATE_WORK_ITEM = gql`
  mutation UpdateWorkItem($input: WorkItemUpdate!) {
    updateWorkItem(input: $input) {
      id
      u_id
      title
      description
      type
      assignedTo {
        id
        firstName
        lastName
        email
        imageUrl
      }
      sprint
      priority
      story_points
      original_estimate
      parent {
        id
        u_id
        title
      }
      updatedAt
      updatedBy {
        id
        firstName
        lastName
        email
        imageUrl
      }
      org_id
      tags {
        id
        tag
      }
    }
  }
`;

export const UPDATE_WORK_ITEM_STATE = gql`
  mutation UpdateWorkItemState($input: WorkItemStateUpdate!) {
    updateWorkItemState(input: $input) {
      id
      u_id
      state
      updatedAt
      updatedBy {
        id
        firstName
        lastName
        email
        imageUrl
      }
      tags {
        id
        tag
      }
    }
  }
`;

export const CREATE_SPRINT = gql`
  mutation CreateSprint($input: SprintCreate!) {
    createSprint(input: $input) {
      id
      title
      description
      orgId
      createdBy {
        id
        firstName
        lastName
      }
      updatedBy {
        id
        firstName
        lastName
      }
      createdAt
      updatedAt
      startDate
      endDate
      iteration
      initiative
    }
  }
`;

export const UPDATE_WORK_ITEM_STORY_POINTS = gql`
  mutation UpdateWorkItemStoryPoints($input: WorkItemUpdateStoryPoints!) {
    updateWorkItemStoryPoints(input: $input) {
      id
      u_id
      title
      story_points
      current_sprint
      updatedAt
      updatedBy {
        id
        firstName
        lastName
        email
        imageUrl
      }
    }
  }
`;

export const UPDATE_WORK_ITEM_ESTIMATES = gql`
  mutation UpdateWorkItemEstimates($input: UpdateWorkItemEstimatesInput!) {
    updateWorkItemEstimates(input: $input) {
      id
      completed_estimate
      remaining_estimate
      original_estimate
    }
  }
`;

export const CREATE_SPRINT_ITERATION = gql`
  mutation CreateSprintIteration($input: SprintIterationCreate!) {
    createSprintIteration(input: $input) {
      id
      title
      description
      orgId
      createdBy {
        id
        firstName
        lastName
      }
      updatedBy {
        id
        firstName
        lastName
      }
      createdAt
      updatedAt
      startDate
      endDate
      iteration
      current
    }
  }
`;
