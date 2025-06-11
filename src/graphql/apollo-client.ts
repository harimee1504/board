import {
  ApolloClient,
  createHttpLink,
  InMemoryCache,
} from "@apollo/client/core";

const httpLink = createHttpLink({
  uri: "https://55ae-2409-40f4-1120-8c84-14b5-b21c-6fb2-7342.ngrok-free.app/graphql",
  credentials: "include",
  fetchOptions: {
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
  },
});

// Cache implementation
const cache = new InMemoryCache();

// Create Apollo Client with default auth link
const apolloClient = new ApolloClient({
  link: httpLink,
  cache,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-first',
      nextFetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
  },
  connectToDevTools: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

export default apolloClient;
