<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-6">Sprint Board</h1>

    <div class="grid grid-cols-7 gap-4">
      <!-- User Stories Column -->
      <div class="bg-gray-100 p-4 rounded-lg">
        <h2 class="font-semibold mb-4">User Stories</h2>
        <div class="space-y-3">
          <template v-for="story in userStories" :key="story.id">
            <div class="relative" :style="`margin-bottom: ${getStorySpacing(story.id)}px`">
              <div class="bg-white p-3 rounded shadow">
                <div class="flex items-center">
                  <div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                    <span class="text-xs text-blue-600">#{{story.id}}</span>
                  </div>
                  <span class="text-sm font-medium">{{ story.title }}</span>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- Status Columns -->
      <template v-for="status in statuses" :key="status">
        <div 
          class="bg-gray-100 p-4 rounded-lg"
          @dragover.prevent
          @drop="handleDrop($event, status)"
        >
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-semibold">{{ status }}</h2>
            <span class="text-sm text-gray-500">
              {{ getWorkItemsCountByStatus(status) }}
            </span>
          </div>
          <div class="space-y-3">
            <template v-for="story in userStories" :key="story.id">
              <div class="relative" :style="`margin-bottom: ${getStorySpacing(story.id)}px`">
                <div v-for="item in getWorkItemsByStatusAndStory(status, story.id)" 
                     :key="item.id"
                     class="bg-white p-3 rounded shadow cursor-move mb-2 hover:shadow-md transition-shadow"
                     draggable="true"
                     @dragstart="handleDragStart($event, item)"
                >
                  <div class="flex items-center mb-2">
                    <div class="w-5 h-5 bg-gray-100 rounded flex items-center justify-center mr-2">
                      <span class="text-xs">#{{item.id}}</span>
                    </div>
                    <div class="text-sm font-medium">{{ item.title }}</div>
                  </div>
                  <div class="flex items-center">
                    <div class="text-xs text-gray-500 flex items-center">
                      <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
                      </svg>
                      {{ getStoryTitle(item.storyId) }}
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
export default {
  name: "SprintBoard",
  data() {
    return {
      statuses: ['New', 'Active', 'On Hold', 'In Test', 'Accepted', 'Closed'],
      userStories: [
        { id: 1, title: 'User Authentication Flow' },
        { id: 2, title: 'Dashboard Analytics' },
        { id: 3, title: 'Payment Integration' },
      ],
      workItems: [
        { id: 1, title: 'Login Page UI', storyId: 1, status: 'New' },
        { id: 2, title: 'Auth API Integration', storyId: 1, status: 'New' },
        { id: 3, title: 'Analytics Dashboard', storyId: 1, status: 'New' },
        { id: 4, title: 'Data Visualization', storyId: 2, status: 'On Hold' },
        { id: 5, title: 'Stripe Setup', storyId: 2, status: 'Closed' },
        { id: 6, title: 'Payment Gateway Integration', storyId: 3, status: 'New' },
        { id: 7, title: 'Payment Processing', storyId: 3, status: 'New' },
        { id: 8, title: 'Payment Notifications', storyId: 3, status: 'New' },
      ],
      draggedItem: null,
      itemBaseHeight: 90 // Base height for work items including margin
    }
  },
  computed: {
    userStoriesWithSpacing() {
      return this.userStories.map(story => {
        const maxItems = Math.max(...this.statuses.map(status => 
          this.workItems.filter(item => 
            item.storyId === story.id && item.status === status
          ).length
        ));
        
        return {
          ...story,
          maxItems
        };
      });
    }
  },
  methods: {
    getWorkItemsByStatus(status) {
      return this.workItems.filter(item => item.status === status)
    },
    getWorkItemsCountByStatus(status) {
      return this.workItems.filter(item => item.status === status).length
    },
    getWorkItemsByStatusAndStory(status, storyId) {
      return this.workItems.filter(item => item.status === status && item.storyId === storyId)
    },
    getStoryTitle(storyId) {
      const story = this.userStories.find(s => s.id === storyId)
      return story ? story.title : 'Unknown Story'
    },
    getStorySpacing(storyId) {
      // Calculate spacing based on the maximum number of items across all statuses for this story
      const maxItemsInAnyStatus = Math.max(
        ...this.statuses.map(status =>
          this.workItems.filter(item => 
            item.storyId === storyId && item.status === status
          ).length
        )
      );
      return Math.max(maxItemsInAnyStatus-1,1) * this.itemBaseHeight
    },
    handleDragStart(event, item) {
      this.draggedItem = item
      event.target.classList.add('opacity-50')
    },
    handleDrop(event, newStatus) {
      if (this.draggedItem) {
        const itemIndex = this.workItems.findIndex(item => item.id === this.draggedItem.id)
        if (itemIndex !== -1) {
          this.workItems[itemIndex] = {
            ...this.workItems[itemIndex],
            status: newStatus
          }
        }
        this.draggedItem = null
        event.target.classList.remove('opacity-50')
      }
    }
  }
}
</script>