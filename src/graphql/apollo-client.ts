import {
  ApolloClient,
  createHttpLink,
  InMemoryCache,
} from "@apollo/client/core";
import { setContext } from "@apollo/client/link/context";

const httpLink = createHttpLink({
  uri: "http://localhost:5001/graphql",
});

// Cache implementation
const cache = new InMemoryCache();

// Auth link to add headers
const authLink = setContext(async (_, { headers }) => {
  try {
    const token = localStorage.getItem("authToken");

    return {
      headers: {
        ...headers,
        Authorization: token ? `Bearer ${token}` : "",
      },
    };
  } catch (error) {
    console.error("Error getting session token from cookie:", error);
    return {
      headers,
    };
  }
});

// Create Apollo Client
const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache,
});

export default apolloClient;
