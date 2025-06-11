import {
  ApolloClient,
  createHttpLink,
  InMemoryCache,
} from "@apollo/client/core";

const httpLink = createHttpLink({
  uri: "https://boardserver.pythonanywhere.com/graphql",
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
