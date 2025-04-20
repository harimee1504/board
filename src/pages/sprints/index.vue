<template>
  <div class="container mx-auto p-4 font-poppins">
    <h1 class="text-2xl font-bold mb-6">Sprint Board</h1>

    <div class="overflow-x-auto">
      <div class="min-w-[1200px]">
        <!-- Board Header -->
        <div class="grid grid-cols-8 gap-4 mb-4">
          <div class="font-semibold border border-gray-200 p-2 rounded">User Stories</div>
          <div v-for="state in states" :key="state" class="font-semibold border border-gray-200 p-2 rounded">
            {{ state.charAt(0).toUpperCase() + state.slice(1) }}
            <span class="ml-2 text-sm text-gray-500">({{ workItemCounts[state] }})</span>
          </div>
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
                        class="bg-white p-3 rounded shadow cursor-move hover:shadow-md transition-shadow"
                        :class="[
                          element.type === 'bug' ? 'border-l-4 border-red-500' : 'border-l-4 border-blue-500'
                        ]"
                      >
                        <div class="flex items-center justify-between">
                          <span class="text-sm font-medium">{{ element.title }}</span>
                          <Badge :variant="element.type === 'bug' ? 'destructive' : 'default'">{{ element.type }}</Badge>
                        </div>
                        <div class="text-xs text-gray-500 mt-1">{{ element.u_id }}</div>
                        <div class="flex items-center gap-2 mt-2">
                          <div v-if="element.assignedTo" class="flex items-center">
                            <img 
                              v-if="element.assignedTo.imageUrl" 
                              :src="element.assignedTo.imageUrl" 
                              :alt="element.assignedTo.firstName"
                              class="w-4 h-4 rounded-full mr-1"
                            />
                            <span class="text-xs">{{ element.assignedTo.firstName }}</span>
                          </div>
                          <div v-if="element.story_points" class="text-xs bg-gray-100 px-1 rounded">
                            {{ element.story_points }} SP
                          </div>
                        </div>
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
import { ref, computed, onMounted, watch } from 'vue'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { GET_ACTIVE_USER_STORIES } from '@/graphql/queries'
import { UPDATE_WORK_ITEM_STATE } from '@/graphql/mutations'
import draggable from 'vuedraggable'
import { Badge } from '@/components/ui/badge'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  imageUrl?: string
}

interface Tag {
  id: string
  tag: string
}

interface WorkItem {
  id: string
  u_id: string
  title: string
  description?: string
  state: string
  type: string
  createdBy: User
  updatedBy: User
  sprint?: string
  assignedTo?: User
  org_id: string
  createdAt: string
  updatedAt: string
  spillover: boolean
  initial_sprint?: string
  current_sprint?: string
  priority?: string
  story_points?: number
  original_estimate?: number
  remaining_estimate?: number
  completed_estimate?: number
  acceptance_criteria?: string
  definition_of_done?: string
  parent?: WorkItem
  tags?: Tag[]
  mentions?: User[]
}

interface WorkItemsByState {
  [key: string]: {
    [key: string]: WorkItem[]
  }
}

const states = ['new', 'active', 'on_hold', 'in_test', 'accepted', 'rejected', 'closed'] as const
type State = typeof states[number]

const loading = ref(true)
const error = ref<string | null>(null)

const { result, loading: queryLoading, error: queryError } = useQuery(GET_ACTIVE_USER_STORIES)
const updateWorkItemStateMutation = useMutation(UPDATE_WORK_ITEM_STATE)

// Computed property to get user stories (work items with type 'user_story' and no parent)
const userStories = computed(() => {
  if (!result.value?.getActiveUserStories) return []
  return result.value.getActiveUserStories.filter((item: WorkItem) => 
    item.type === 'user_story' && !item.parent
  )
})

// Computed property to organize work items by state and parent
const workItemsByState = computed<WorkItemsByState>(() => {
  const organized: WorkItemsByState = {}
  
  // Initialize the structure for each user story
  userStories.value.forEach((story: WorkItem) => {
    organized[story.id] = {
      new: [],
      active: [],
      on_hold: [],
      in_test: [],
      accepted: [],
      rejected: [],
      closed: []
    }
  })

  // Organize work items
  result.value?.getActiveUserStories.forEach((item: WorkItem) => {
    if (item.parent && organized[item.parent.id]) {
      const state = item.state.toLowerCase() as State
      if (states.includes(state)) {
        organized[item.parent.id][state].push(item)
      }
    }
  })

  return organized
})

// Computed property to count work items by state
const workItemCounts = computed(() => {
  const counts: Record<State, number> = {
    new: 0,
    active: 0,
    on_hold: 0,
    in_test: 0,
    accepted: 0,
    rejected: 0,
    closed: 0
  }

  Object.values(workItemsByState.value).forEach((stateItems) => {
    Object.entries(stateItems).forEach(([state, items]) => {
      if (state in counts) {
        counts[state as State] += items.length
      }
    })
  })

  return counts
})

// Watch for query loading and error states
watch(queryLoading, (newValue) => {
  loading.value = newValue
})

watch(queryError, (newValue) => {
  error.value = newValue?.message || 'An error occurred while fetching work items'
})

const handleDragEnd = async (event: any, newState: State, userStoryId: string) => {
  if (!event.from || !event.to) return
  
  const item = event.item.__draggable_context.element
  
  try {
    await updateWorkItemStateMutation.mutate({
      input: {
        id: item.id,
        state: newState.toUpperCase(),
        org_id: item.org_id
      }
    })
  } catch (err) {
    console.error('Failed to update work item state:', err)
    // Revert the drag if the update failed
    const fromState = event.from.getAttribute('data-state')
    const fromList = workItemsByState.value[userStoryId][fromState]
    const toList = workItemsByState.value[userStoryId][newState]
    const itemIndex = toList.findIndex((i: WorkItem) => i.id === item.id)
    if (itemIndex !== -1) {
      toList.splice(itemIndex, 1)
      fromList.push(item)
    }
  }
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
