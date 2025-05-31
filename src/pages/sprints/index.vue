<template>
  <div class="container mx-auto p-4 font-poppins">
    <h1 class="text-2xl font-bold mb-6">Sprint Board</h1>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-4">
      <div class="inline-block animate-spin h-8 w-8 border-4 border-gray-200 border-t-blue-500 rounded-full"></div>
      <p class="mt-2">Loading sprint data...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="p-4 bg-red-50 text-red-500 rounded-lg border border-red-200 mb-6">
      {{ error }}
    </div>

    <!-- No Sprint Section -->
    <div v-else-if="!currentSprint" class="flex flex-col items-center justify-center p-8 mb-6 bg-gray-50 rounded-lg border border-gray-200">
      <h2 class="text-xl font-semibold mb-4">No Active Sprint</h2>
      <p class="text-gray-500 mb-4">There are no active sprints at the moment. Start a new sprint to begin tracking work items.</p>
      <Button @click="openSprintModal">Initiate Sprint</Button>
    </div>

    <!-- Sprint Info Banner -->
    <div v-else class="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-xl font-semibold">{{ currentSprint.title }}</h2>
          <p class="text-gray-600 mt-1">{{ currentSprint.description }}</p>
          <div class="flex mt-2 text-sm text-gray-500 space-x-4">
            <div>
              <span class="font-medium">Start:</span> {{ formatDate(currentSprint.startDate) }}
            </div>
            <div>
              <span class="font-medium">End:</span> {{ formatDate(currentSprint.endDate) }}
            </div>
            <div>
              <span class="font-medium">Iteration:</span> {{ currentSprint.iteration }}
            </div>
          </div>
        </div>
        <div>
          <Badge variant="outline" class="ml-2">Active Sprint</Badge>
        </div>
      </div>
    </div>

    <!-- Sprint Board -->
    <div v-if="currentSprint" class="overflow-x-auto">
      <div class="min-w-[1200px]">
        <!-- Board Header -->
        <div class="grid grid-cols-8 gap-4 mb-4">
          <div class="font-semibold border border-gray-200 p-2 rounded">User Stories</div>
          <div v-for="state in states" :key="state" class="font-semibold border border-gray-200 p-2 rounded">
            {{ state.charAt(0).toUpperCase() + state.slice(1) }}
            <span class="ml-2 text-sm text-gray-500">({{ workItemCounts[state] }})</span>
          </div>
        </div>

        <!-- No User Stories Message -->
        <div v-if="userStories.length === 0" class="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
          <p class="text-gray-500">No user stories found for this sprint. Add user stories to get started.</p>
        </div>

        <!-- Swimming Lanes -->
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

  <!-- Sprint creation modal -->
  <Dialog :open="isSprintModalOpen" @update:open="isSprintModalOpen = $event">
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>Initiate Sprint</DialogTitle>
        <DialogDescription>
          Create a new sprint to organize your work items
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid gap-2">
          <Label for="title">Title</Label>
          <Input id="title" v-model="sprintForm.title" placeholder="Sprint title" />
        </div>
        <div class="grid gap-2">
          <Label for="description">Description</Label>
          <Textarea id="description" v-model="sprintForm.description" placeholder="Sprint description" />
        </div>
        <div class="grid gap-2">
          <Label for="duration">Duration (days)</Label>
          <Input id="duration" v-model="sprintForm.duration" type="number" min="1" />
        </div>
      </div>
      <DialogFooter>
        <Button @click="closeSprintModal" variant="outline">Cancel</Button>
        <Button @click="createSprint" :disabled="creatingSprintLoading">
          <Loader2 v-if="creatingSprintLoading" class="mr-2 h-4 w-4 animate-spin" />
          Create
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { GET_ACTIVE_USER_STORIES, GET_SPRINTS } from '@/graphql/queries'
import { UPDATE_WORK_ITEM_STATE, CREATE_SPRINT } from '@/graphql/mutations'
import draggable from 'vuedraggable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Loader2 } from 'lucide-vue-next'

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

interface Sprint {
  id: string
  title: string
  description: string
  orgId: string
  createdBy: User
  updatedBy: User
  createdAt: string
  updatedAt: string
  startDate: string
  endDate: string
  iteration: string
  current?: boolean
}

interface WorkItemsByState {
  [key: string]: {
    [key: string]: WorkItem[]
  }
}

interface SprintForm {
  title: string
  description: string
  duration: number
}

const states = ['new', 'active', 'on_hold', 'in_test', 'accepted', 'rejected', 'closed'] as const
type State = typeof states[number]

const loading = ref(true)
const error = ref<string | null>(null)
const isSprintModalOpen = ref(false)
const creatingSprintLoading = ref(false)

const sprintForm = ref<SprintForm>({
  title: '',
  description: '',
  duration: 14
})

// Get active user stories
const { result: userStoriesResult, loading: userStoriesLoading, error: userStoriesError } = useQuery(GET_ACTIVE_USER_STORIES)

// Get sprints
const { result: sprintsResult, loading: sprintsLoading, error: sprintsError, refetch: refetchSprints } = useQuery(GET_SPRINTS)

// Update work item state mutation
const updateWorkItemStateMutation = useMutation(UPDATE_WORK_ITEM_STATE)

// Create sprint mutation
const createSprintMutation = useMutation(CREATE_SPRINT)

// Format date helper function
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

// Computed property to get current sprint
const currentSprint = computed(() => {
  if (!sprintsResult.value?.getSprints || sprintsResult.value.getSprints.length === 0) return null;
  
  // Find sprint with current=true, or just return the first one if none marked as current
  const sprints = sprintsResult.value.getSprints;
  const currentSprint = sprints.find((sprint: Sprint) => sprint.current === true);
  return currentSprint || sprints[0];
})

// Computed property to get user stories (work items with type 'user_story' and no parent)
const userStories = computed(() => {
  if (!userStoriesResult.value?.getActiveUserStories) return []
  return userStoriesResult.value.getActiveUserStories.filter((item: WorkItem) => 
    item.type === 'user_story' && !item.parent &&
    (item.sprint === currentSprint.value?.id || item.current_sprint === currentSprint.value?.id)
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

  // Organize work items that belong to the current sprint
  userStoriesResult.value?.getActiveUserStories.forEach((item: WorkItem) => {
    if (item.parent && organized[item.parent.id] && 
       (item.sprint === currentSprint.value?.id || item.current_sprint === currentSprint.value?.id)) {
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
watch([userStoriesLoading, sprintsLoading], ([userStoriesLoadingVal, sprintsLoadingVal]) => {
  loading.value = userStoriesLoadingVal || sprintsLoadingVal
})

watch([userStoriesError, sprintsError], ([userStoriesErrorVal, sprintsErrorVal]) => {
  error.value = userStoriesErrorVal?.message || sprintsErrorVal?.message || null
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
  } catch (err: any) {
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
    error.value = err?.message || 'Failed to update work item'
  }
}

const openSprintModal = () => {
  isSprintModalOpen.value = true
}

const closeSprintModal = () => {
  isSprintModalOpen.value = false
  sprintForm.value = {
    title: '',
    description: '',
    duration: 14
  }
}

const createSprint = async () => {
  if (!sprintForm.value.title) {
    error.value = 'Title is required'
    return
  }

  creatingSprintLoading.value = true

  try {
    const startDate = new Date()
    // Calculate end date by adding duration days to start date
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + sprintForm.value.duration)

    await createSprintMutation.mutate({
      input: {
        title: sprintForm.value.title,
        description: sprintForm.value.description || '',
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      }
    })

    closeSprintModal()
    await refetchSprints()
  } catch (err: any) {
    console.error('Failed to create sprint:', err)
    error.value = err?.message || 'Failed to create sprint'
  } finally {
    creatingSprintLoading.value = false
  }
}

onMounted(async () => {
  try {
    await refetchSprints()
  } catch (err: any) {
    console.error('Failed to fetch sprints:', err)
    error.value = 'Failed to fetch sprints'
  }
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
