import gql from "graphql-tag";

export const GET_TAGS = gql`
  query {
    getTags {
      id
      tag
    }
  }
`;

export const GET_USERS_BY_ORG = gql`
  query {
    getUsers {
      id
      firstName
      lastName
      email
      imageUrl
    }
  }
`;

export const GET_WORK_ITEMS = gql`
  query {
    getWorkItems {
      id
    u_id
    title
    description
    state
    type
    createdBy{
      id
      firstName
      lastName
      email
      imageUrl    
    }
    updatedBy{
      id
      firstName
      lastName
      email
      imageUrl
    }
    sprint
    assignedTo{
      id
      firstName
      lastName
      email
      imageUrl
    }
    org_id
    createdAt
    updatedAt
    spillover
    initial_sprint
    current_sprint
    priority
    story_points
    original_estimate
    remaining_estimate
    completed_estimate
    acceptance_criteria
    definition_of_done
    parent {
      id
      u_id
      title
    }
    tags {
      id
      tag
    }
    mentions{
      id
      firstName
      lastName
      email
      imageUrl
    }
    }
  }
`;

export const GET_ACTIVE_USER_STORIES_WITH_CHILDREN = gql`
  query GetActiveUserStoriesWithChildren {
    getWorkItems {
      id
      u_id
      title
      description
      state
      type
      createdBy {
        id
        firstName
        lastName
        email
        imageUrl    
      }
      updatedBy {
        id
        firstName
        lastName
        email
        imageUrl
      }
      sprint
      assignedTo {
        id
        firstName
        lastName
        email
        imageUrl
      }
      org_id
      createdAt
      updatedAt
      spillover
      initial_sprint
      current_sprint
      priority
      story_points
      original_estimate
      remaining_estimate
      completed_estimate
      acceptance_criteria
      definition_of_done
      parent {
        id
        u_id
        title
        state
        type
      }
      tags {
        id
        tag
      }
      mentions {
        id
        firstName
        lastName
        email
        imageUrl
      }
    }
  }
`;

export const GET_ACTIVE_USER_STORIES = gql`
  query GetActiveUserStories {
    getActiveUserStories {
      id
      u_id
      title
      description
      state
      type
      createdBy {
        id
        firstName
        lastName
        email
        imageUrl    
      }
      updatedBy {
        id
        firstName
        lastName
        email
        imageUrl
      }
      sprint
      assignedTo {
        id
        firstName
        lastName
        email
        imageUrl
      }
      org_id
      createdAt
      updatedAt
      spillover
      initial_sprint
      current_sprint
      priority
      story_points
      original_estimate
      remaining_estimate
      completed_estimate
      acceptance_criteria
      definition_of_done
      parent {
        id
        u_id
        title
        state
        type
      }
      tags {
        id
        tag
      }
      mentions {
        id
        firstName
        lastName
        email
        imageUrl
      }
    }
  }
`;
