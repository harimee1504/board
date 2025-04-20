// import "./assets/index.css";
import { createApp } from "vue";
import { createWebHistory, createRouter } from "vue-router";
import { DefaultApolloClient } from '@vue/apollo-composable';
import { provide } from 'vue';
import { createRoot } from 'react-dom/client';
import React from 'react';

import App from "./App.vue";
import apolloClient from "./graphql/apollo-client";

import Sprints from "./pages/sprints/index.vue";
import Workitems from "./pages/work_items/index.vue";
import Workitem from "./pages/work_items/workitem.vue";
import LeaveTracker from "./pages/leave_tracker/index.vue";

import { clerkPlugin } from "vue-clerk";

// Declare the remote module type
declare module 'auth/wrapper' {
  const Wrapper: React.ComponentType<{
    children: React.ReactNode;
    data: {
      navMain: Array<{
        title: string;
        url: string;
        icon?: string;
        isActive: boolean;
        items: Array<{
          title: string;
          url: () => void;
        }>;
      }>;
    };
  }>;
  export default Wrapper;
}

const routes = [
  {
    path: "/",
    component: Sprints,
  },
    {
      path: "/workitems",
      component: Workitems,
    },
    {
      path: "/workitem/:u_id",
      component: Workitem,
    },
];

const app = createApp(App);

const router = createRouter({
  history: createWebHistory(),
  routes,
});

app.use(router);

const PUBLISHABLE_KEY = import.meta.env.VITE_VUE_APP_CLERK_PUBLISHABLE_KEY;

app.use(clerkPlugin, {
  publishableKey: PUBLISHABLE_KEY,
});

// Provide the Apollo Client instance to the Vue app
app.provide(DefaultApolloClient, apolloClient);

app.config.globalProperties.$window = window;

// Load and initialize the React auth wrapper
const loadAuthWrapper = async () => {
  try {
    const authModule = await import('auth/wrapper');
    if (!authModule.default) {
      throw new Error('Wrapper component not found in remote module');
    }

    // Create navigation data based on Vue routes
    const navigationData = {
      navMain: [
        {
          title: "Board",
          url: "#",
          icon: undefined,
          isActive: true,
          items: [
            {
              title: "Sprints",
              url: () => router.push("/")
            },
            {
              title: "Work Items",
              url: () => router.push("/workitems")
            }
          ]
        }
      ]
    };

    // First, create the root React element
    const root = createRoot(document.getElementById('app')!);
    
    // Render React wrapper with Vue container
    root.render(
      React.createElement(authModule.default, {
        data: navigationData
      },
        React.createElement('div', { id: 'vue-app' })
      )
    );

    // Wait for next tick to ensure DOM is updated
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Mount Vue app
    app.mount('#vue-app');
  } catch (error) {
    console.error('Failed to load auth wrapper:', error);
    // Fallback to render Vue app directly if auth wrapper fails
    app.mount("#app");
  }
};

// Start the application
loadAuthWrapper().catch(console.error);
