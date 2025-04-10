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
