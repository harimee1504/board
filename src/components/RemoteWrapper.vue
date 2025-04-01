<template>
  <div>
    <div ref="reactContainer"></div>
    <div id="vue-main-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, onBeforeUnmount, nextTick } from 'vue';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { useRouter } from 'vue-router';

const router = useRouter();
const reactContainer = ref(null);
let root = null;

const handleNavigation = (item) => {
  switch (item.title) {
    case 'Board':
      router.push('/');
      break;
    case 'Work Items':
      router.push('/workitems');
      break;
    case 'Leave Tracker':
      router.push('/leave-tracker');
      break;
    case 'Planning Poker':
      router.push('/planning-poker');
      break;
    default:
      break;
  }
};

onMounted(async () => {
  const { default: Page } = await import('auth/wrapper');
  root = ReactDOM.createRoot(reactContainer.value);

  await nextTick(); // Wait for Vue slot content to render

  // Convert Vue web components to React elements
  const vueElements = Array.from(document.querySelectorAll('vue-child'))
    .map(element => React.createElement(element.tagName.toLowerCase(), {
      ...element.attributes,
      key: element.id || Math.random()
    }));

  root.render(
    React.createElement(
      Page,
      {
        data: {
          navMain: [
            {
              title: "Sprint Board",
              url: () => "#",
              icon: "SquareKanban",
              isActive: true,
              items: [
                {
                  title: "Board",
                  args: {},
                  icon: "Presentation",
                  url: () => "/",
                  onClick: () => handleNavigation({ title: 'Board' })
                },
                {
                  title: "Work Items",
                  args: { favourites: true },
                  icon: "LayoutList",
                  url: () => "/workitems",
                  onClick: () => handleNavigation({ title: 'Work Items' })
                },
                {
                  title: "Leave Tracker",
                  args: { recycle: true },
                  icon: "Gauge",
                  url: () => "/leave-tracker",
                  onClick: () => handleNavigation({ title: 'Leave Tracker' })
                },
                {
                  title: "Planning Poker",
                  args: { recycle: true },
                  icon: "Spade",
                  url: () => "/planning-poker",
                  onClick: () => handleNavigation({ title: 'Planning Poker' })
                },
              ],
            },
          ]
        }
      },
      React.createElement('div', { id: 'app-content' }, vueElements)
    )
  );

  // Move Vue content to the app-content div
  const appContent = document.getElementById('app-content');
  const vueContent = document.getElementById('vue-main-content');
  if (appContent && vueContent) {
    while (vueContent.firstChild) {
      appContent.appendChild(vueContent.firstChild);
    }
  }
});

onBeforeUnmount(() => {
  root?.unmount();
});
</script>

<style scoped>
#app-content {
  width: 100%;
  height: 100%;
}

#vue-main-content {
  position: absolute;
  visibility: hidden;
}
</style> 