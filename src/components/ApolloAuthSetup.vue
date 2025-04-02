<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useAuth } from 'vue-clerk';
import { setContext } from "@apollo/client/link/context";
import { createHttpLink } from "@apollo/client/core";
import apolloClient from '../graphql/apollo-client';

const httpLink = createHttpLink({
  uri: "http://localhost:5001/graphql",
  credentials: "include",
  fetchOptions: {
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
  },
});

const { getToken, isSignedIn } = useAuth();

// Function to create auth link with current token
const createAuthLink = async () => {
  const authLink = setContext(async (_, { headers }) => {
    try {
      if (isSignedIn.value) {
        const token = await getToken.value({ template: "convex" });
        return {
          headers: {
            ...headers,
            Authorization: token ? `Bearer ${token}` : "",
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
        };
      }
      return {
        headers: {
          ...headers,
          Authorization: "",
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      };
    } catch (error) {
      console.error("Error getting convex token:", error);
      return {
        headers: {
          ...headers,
          Authorization: "",
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      };
    }
  });

  return authLink;
};

// Set up initial auth link
onMounted(async () => {
  const authLink = await createAuthLink();
  apolloClient.setLink(authLink.concat(httpLink));
});

// Watch for auth state changes
watch(isSignedIn, async (newValue) => {
  const authLink = await createAuthLink();
  apolloClient.setLink(authLink.concat(httpLink));
});
</script>

<template>
  <div></div>
</template> 