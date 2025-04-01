<template>
  <div class="container mx-auto p-4 font-poppins">
    <h1 class="text-2xl font-bold mb-6">Sprint Board</h1>

    <div class="overflow-x-auto">
      <div class="min-w-[1200px]">
        <!-- Board Header -->
        <div class="grid grid-cols-8 gap-4 mb-4">
          <div class="font-semibold border border-gray-200 p-2 rounded">User Stories</div>
          <div class="font-semibold border border-gray-200 p-2 rounded">New</div>
          <div class="font-semibold border border-gray-200 p-2 rounded">Active</div>
          <div class="font-semibold border border-gray-200 p-2 rounded">On Hold</div>
          <div class="font-semibold border border-gray-200 p-2 rounded">In Test</div>
          <div class="font-semibold border border-gray-200 p-2 rounded">Accepted</div>
          <div class="font-semibold border border-gray-200 p-2 rounded">Rejected</div>
          <div class="font-semibold border border-gray-200 p-2 rounded">Closed</div>
        </div>

        <!-- Swimming Lanes -->
        <div v-if="loading" class="text-center py-4">Loading...</div>
        <div v-else-if="error" class="text-center text-red-500 py-4">{{ error }}</div>
        <div v-else>
          <!-- Group work items by user stories -->
          <div v-for="userStory in userStories" :key="userStory.id" class="mb-4 border border-gray-200 p-4 rounded">
            <div class="grid grid-cols-8 gap-4">
              <!-- User Story Column (Fixed) -->
              <div class="bg-gray-50 p-4 rounded-lg border border-gray-300">
                <div class="bg-white p-3 rounded shadow">
                  <h3 class="font-medium">{{ userStory.title }}</h3>
                  <Badge>Story</Badge>
                </div>
              </div>

              <!-- Draggable Columns -->
              <template v-for="state in states" :key="state">
                <div class="bg-gray-50 p-4 rounded-lg min-h-[100px] border border-gray-300">
                  <draggable
                    :list="workItemsByState[userStory.id][state]"
                    :group="{ name: 'workitems', pull: true, put: true }"
                    :animation="200"
                    item-key="id"
                    class="space-y-2 min-h-[50px]"
                    @end="handleDragEnd($event, state, userStory.id)"
                  >
                    <template #item="{ element }">
                      <div 
                        class="bg-white p-3 rounded shadow cursor-move"
                        :class="[
                          element.type === 'bug' ? 'border-l-4 border-red-500' : 'border-l-4 border-blue-500'
                        ]"
                      >
                        <div class="flex items-center justify-between">
                          <span class="text-sm font-medium">{{ element.title }}</span>
                          <Badge>{{ element.type }}</Badge>
                        </div>
                        <div class="text-xs text-gray-500 mt-1">{{ element.u_id }}</div>
                      </div>
                    </template>
                  </draggable>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { GET_WORK_ITEMS } from '@/graphql/queries'
import draggable from 'vuedraggable'
import { Badge } from '@/components/ui/badge'

const loading = ref(true)
const error = ref(null)
const states = ['new', 'active', 'onhold', 'intest', 'accepted', 'rejected', 'closed']

const { result } = useQuery(GET_WORK_ITEMS)

// Computed property to get user stories
const userStories = computed(() => {
  if (!result.value) return []
  return result.value.getWorkItems.filter(item => item.type === 'user_story')
})

// Organize work items by user story and state
const workItemsByState = computed(() => {
  if (!result.value) return {}

  const workItems = result.value.getWorkItems
  const stateMap = {}

  userStories.value.forEach(story => {
    stateMap[story.id] = {
      new: [],
      active: [],
      onhold: [],
      intest: [], 
      accepted: [],
      rejected: [],
      closed: []
    }
  })

  workItems.forEach(item => {
    if (item.type === 'task' || item.type === 'bug') {
      const parentId = item.parent?.id
      if (parentId && stateMap[parentId]) {
        const state = (item.state || 'new').toLowerCase()
        if (stateMap[parentId][state]) {
          stateMap[parentId][state].push(item)
        }
      }
    }
  })

  return stateMap
})

const handleDragEnd = (event, newState, storyId) => {
  if (!event.from || !event.to) return
  
  const fromState = event.from.getAttribute('data-state')
  const toState = event.to.getAttribute('data-state')
  const item = event.item.__draggable_context.element

  console.log(`Moving item ${item.id} from ${fromState} to ${toState} under story ${storyId}`)
  // Here you would update your backend with the new state
}

onMounted(() => {
  loading.value = false
})
</script>

<style scoped>
.draggable-ghost {
  opacity: 0.5;
  background: #c8ebfb;
}

.draggable-drag {
  opacity: 0.8;
}
</style>
