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
      <div class="flex flex-col gap-4">
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-4">
            <!-- Sprint Selection Dropdown -->
            <Select v-model="selectedSprintId" @update:modelValue="handleSprintChange">
              <SelectTrigger class="w-[200px]">
                <SelectValue placeholder="Select Sprint" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="sprint in sprintsResult?.getSprints" 
                           :key="sprint.id" 
                           :value="sprint.id"
                           :class="{ 'font-semibold': sprint.current }">
                  {{ sprint.title }}
                  <span v-if="sprint.current" class="ml-2 text-xs text-blue-600">(Current)</span>
                </SelectItem>
                <SelectSeparator />
                <div 
                  class="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none text-blue-600 hover:bg-accent hover:text-blue-700 focus:bg-accent focus:text-blue-700"
                  @click="(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openSprintModal();
                  }"
                >
                  <div class="flex items-center">
                    <Plus class="h-4 w-4 mr-2" />
                    Create New Sprint
                  </div>
                </div>
              </SelectContent>
            </Select>

            <!-- Iteration Selection Dropdown - Only show if multiple iterations exist -->
            <Select 
              v-if="iterations.length > 1"
              v-model="selectedIteration" 
              @update:modelValue="handleIterationChange"
            >
              <SelectTrigger class="w-[150px]">
                <SelectValue placeholder="Select Iteration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="iter in iterations" 
                           :key="iter.id" 
                           :value="iter.id"
                           :class="{ 'font-semibold': iter.id === currentSprint?.id }">
                  Iteration {{ iter.iteration }}
                  <span v-if="iter.id === currentSprint?.id" class="ml-2 text-xs text-blue-600">(Current)</span>
                </SelectItem>
              </SelectContent>
            </Select>

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
          </div>
          <div class="flex items-center gap-2">
            <Badge v-if="currentSprint.current" variant="outline" class="ml-2">Active Sprint</Badge>
            <Button 
              v-if="!currentSprint.current && isSprintEnded(currentSprint.endDate)"
              @click="initiateNewIteration"
              variant="outline"
              class="ml-2"
            >
              Initiate New Iteration
            </Button>
          </div>
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
                <div 
                  class="bg-gray-50 p-4 rounded-lg min-h-[100px] border border-gray-300"
                  :data-state="state"
                >
                  <draggable
                    :list="workItemsByState[userStory.id][state]"
                    :group="{ name: 'workitems', pull: true, put: true }"
                    :animation="200"
                    item-key="id"
                    class="space-y-2 min-h-[50px]"
                    @start="handleDragStart($event, state)"
                    @end="(event) => {
                      const fromState = event.from.closest('[data-state]')?.getAttribute('data-state')
                      const toState = event.to.closest('[data-state]')?.getAttribute('data-state')
                      handleDragEnd(event, fromState, toState, userStory.id)
                    }"
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
import { GET_SPRINT_USER_STORIES, GET_SPRINTS } from '@/graphql/queries'
import { UPDATE_WORK_ITEM_STATE, CREATE_SPRINT, CREATE_SPRINT_ITERATION } from '@/graphql/mutations'
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
  SelectValue,
  SelectSeparator 
} from '@/components/ui/select'
import { Loader2, Plus } from 'lucide-vue-next'
import { toast } from '@/components/ui/toast'

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
const selectedSprintId = ref<string>('')
const selectedIteration = ref<string>('')
const iterations = ref<{ id: string; iteration: string }[]>([])

const sprintForm = ref<SprintForm>({
  title: '',
  description: '',
  duration: 14
})

// Get user stories for selected sprint
const { result: userStoriesResult, loading: userStoriesLoading, error: userStoriesError, refetch: refetchUserStories } = useQuery(
  GET_SPRINT_USER_STORIES,
  () => ({
    sprintId: selectedSprintId.value
  }),
  () => ({
    enabled: !!selectedSprintId.value
  })
)

// Get sprints
const { result: sprintsResult, loading: sprintsLoading, error: sprintsError, refetch: refetchSprints } = useQuery(GET_SPRINTS)

// Update work item state mutation
const updateWorkItemStateMutation = useMutation(UPDATE_WORK_ITEM_STATE)

// Create sprint mutation
const createSprintMutation = useMutation(CREATE_SPRINT)

// Create sprint iteration mutation
const createSprintIterationMutation = useMutation(CREATE_SPRINT_ITERATION)

// Format date helper function
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

// Update currentSprint computed to use selectedSprintId
const currentSprint = computed(() => {
  if (!sprintsResult.value?.getSprints || sprintsResult.value.getSprints.length === 0) return null;
  
  const sprints = sprintsResult.value.getSprints;
  
  // If a sprint is selected, return that sprint
  if (selectedSprintId.value) {
    const selectedSprint = sprints.find((sprint: Sprint) => sprint.id === selectedSprintId.value);
    if (selectedSprint) return selectedSprint;
  }
  
  // Otherwise, find sprint with current=true, or just return the first one if none marked as current
  const currentSprint = sprints.find((sprint: Sprint) => sprint.current === true);
  return currentSprint || sprints[0];
})

// Update computed property to get user stories
const userStories = computed(() => {
  console.log('Raw sprint user stories:', userStoriesResult.value?.getSprintUserStories)
  if (!userStoriesResult.value?.getSprintUserStories) {
    console.log('No sprint user stories data available')
    return []
  }
  const filtered = userStoriesResult.value.getSprintUserStories.filter((item: WorkItem) => {
    const isUserStory = item.type === 'user_story'
    console.log('Item:', item.title, 'Type:', item.type, 'Is User Story:', isUserStory)
    return isUserStory
  })
  console.log('Filtered user stories:', filtered)
  return filtered
})

// Update computed property to organize work items by state and parent
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

  // Organize all work items that belong to user stories in the current sprint
  userStoriesResult.value?.getSprintUserStories.forEach((item: WorkItem) => {
    // Skip if it's a user story itself
    if (item.type === 'user_story') return;

    // Find the parent user story
    const parentUserStory = userStoriesResult.value?.getSprintUserStories.find(
      (story: WorkItem) => story.id === item.parent?.id
    );

    // If the item has a parent user story and that parent is in our organized structure
    if (parentUserStory && organized[parentUserStory.id]) {
      // Default to 'new' state if state is undefined
      const state = (item.state || 'new').toLowerCase() as State;
      if (states.includes(state)) {
        // Add the item to its parent's state column
        organized[parentUserStory.id][state].push(item);
      }
    }
  });

  return organized;
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

// Add dragStart handler and state tracking
const dragSourceState = ref<State | null>(null)
const dragTargetState = ref<State | null>(null)

const handleDragStart = (event: any, state: State) => {
  dragSourceState.value = state
  dragTargetState.value = null
}

const handleDragEnd = async (event: any, fromState: string | null, toState: string | null, userStoryId: string) => {
  if (!event.from || !event.to) {
    console.error('Invalid drag event:', event)
    return
  }
  
  const item = event.item.__draggable_context.element
  if (!item || !item.id) {
    console.error('Invalid dragged item:', item)
    return
  }

  if (!fromState || !toState || !states.includes(fromState as State) || !states.includes(toState as State)) {
    console.error('Invalid states:', { fromState, toState })
    return
  }

  // Don't process if source and target states are the same
  if (fromState === toState) {
    console.log('Same state drag, ignoring:', { fromState, toState })
    return
  }

  // Validate that we have the required state lists
  if (!workItemsByState.value[userStoryId] || 
      !workItemsByState.value[userStoryId][fromState] || 
      !workItemsByState.value[userStoryId][toState]) {
    console.error('Invalid state structure:', {
      userStoryId,
      fromState,
      toState,
      workItemsByState: workItemsByState.value[userStoryId]
    })
    toast({
      title: "Error",
      description: "Invalid state structure. Please refresh the page.",
      variant: "destructive",
    })
    return
  }
  
  try {
    // Log the state transition for debugging
    console.log('State transition:', {
      from: fromState,
      to: toState,
      itemId: item.id
    })

    // The item is already in the target list due to vuedraggable's behavior
    // We just need to update the backend with the new state
    const result = await updateWorkItemStateMutation.mutate({
      input: {
        id: item.id,
        state: toState,
        org_id: item.org_id
      }
    })

    // Log the mutation result for debugging
    console.log('State update result:', result)

    // Refetch data to ensure UI is in sync with backend
    await refetchUserStories()

    // Show success toast
    toast({
      title: "Success",
      description: `Work item moved from ${fromState} to ${toState}`,
      variant: "default",
    })
  } catch (err: any) {
    console.error('Failed to update work item state:', err)
    
    // Since the item is already moved by vuedraggable, we need to move it back
    const fromList = workItemsByState.value[userStoryId][fromState]
    const toList = workItemsByState.value[userStoryId][toState]
    const itemIndex = toList.findIndex((i: WorkItem) => i.id === item.id)
    
    if (itemIndex !== -1) {
      // Remove from target list and add back to source list
      const [movedItem] = toList.splice(itemIndex, 1)
      fromList.push(movedItem)
    }

    // Show error toast
    toast({
      title: "Error",
      description: err?.message || 'Failed to update work item state',
      variant: "destructive",
    })

    // Refetch to ensure UI is in sync with backend
    await refetchUserStories()
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
    await createSprintMutation.mutate({
      input: {
        title: sprintForm.value.title,
        description: sprintForm.value.description || '',
        duration: sprintForm.value.duration,
      }
    })

    toast({
      title: "Sprint Created",
      description: `Successfully created sprint "${sprintForm.value.title}"`,
      variant: "default",
    })

    closeSprintModal()
    await refetchSprints()
  } catch (err: any) {
    console.error('Failed to create sprint:', err)
    error.value = err?.message || 'Failed to create sprint'
    
    toast({
      title: "Error",
      description: err?.message || 'Failed to create sprint',
      variant: "destructive",
    })
  } finally {
    creatingSprintLoading.value = false
  }
}

// Add new methods
const isSprintEnded = (endDate: string) => {
  return new Date(endDate) < new Date()
}

const handleIterationChange = async (iterationId: string) => {
  selectedIteration.value = iterationId
  if (iterationId) {
    await refetchUserStories()
  }
}

const initiateNewIteration = async () => {
  if (!currentSprint.value) return

  try {
    const result = await createSprintIterationMutation.mutate({
      input: {
        title: currentSprint.value.title,
        description: currentSprint.value.description,
        duration: Math.ceil((new Date(currentSprint.value.endDate).getTime() - new Date(currentSprint.value.startDate).getTime()) / (1000 * 60 * 60 * 24)),
        previousSprintId: currentSprint.value.id
      }
    })

    toast({
      title: "New Iteration Created",
      description: `Successfully created new iteration for "${currentSprint.value.title}"`,
      variant: "default",
    })

    await refetchSprints()
  } catch (err: any) {
    console.error('Failed to create new iteration:', err)
    error.value = err?.message || 'Failed to create new iteration'
    
    toast({
      title: "Error",
      description: err?.message || 'Failed to create new iteration',
      variant: "destructive",
    })
  }
}

// Update handleSprintChange to populate iterations
const handleSprintChange = async (sprintId: string) => {
  selectedSprintId.value = sprintId
  if (sprintId && sprintsResult.value?.getSprints) {
    // Find all iterations of the selected sprint
    const selectedSprint = sprintsResult.value.getSprints.find((s: Sprint) => s.id === sprintId)
    if (selectedSprint) {
      iterations.value = sprintsResult.value.getSprints
        .filter((s: Sprint) => s.title === selectedSprint.title)
        .sort((a: Sprint, b: Sprint) => parseInt(a.iteration) - parseInt(b.iteration))
        .map((s: Sprint) => ({ id: s.id, iteration: s.iteration }))
      
      // Set the current iteration as selected
      selectedIteration.value = sprintId
    }
    await refetchUserStories()
  }
}

// Update onMounted to set initial selected sprint
onMounted(async () => {
  try {
    await refetchSprints()
    // Set initial selected sprint to current sprint or first sprint
    if (sprintsResult.value?.getSprints?.length > 0) {
      const currentSprint = sprintsResult.value.getSprints.find((sprint: Sprint) => sprint.current === true);
      selectedSprintId.value = currentSprint?.id || sprintsResult.value.getSprints[0].id;
      if (selectedSprintId.value) {
        await refetchUserStories();
      }
    }
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
