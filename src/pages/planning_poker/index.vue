<template>
  <div class="container mx-auto p-4 font-poppins">
    <h1 class="text-2xl font-bold mb-6">Planning Poker</h1>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-4">
      <div class="inline-block animate-spin h-8 w-8 border-4 border-gray-200 border-t-blue-500 rounded-full"></div>
      <p class="mt-2">Loading work items...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="p-4 bg-red-50 text-red-500 rounded-lg border border-red-200 mb-6">
      {{ error }}
    </div>

    <!-- Main Content -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Work Items List -->
      <div class="lg:col-span-1 bg-white rounded-lg shadow p-4">
        <h2 class="text-lg font-semibold mb-4">Work Items to Estimate</h2>
        <div class="space-y-3">
          <div v-for="item in unestimatedItems" :key="item.id" 
               class="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
               :class="{ 'border-blue-500 bg-blue-50': selectedItem?.id === item.id }"
               @click="selectItem(item)">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-medium">{{ item.title }}</h3>
                <p class="text-sm text-gray-500">{{ item.u_id }}</p>
              </div>
              <Badge>{{ item.type }}</Badge>
            </div>
            <div v-if="item.description" class="mt-2 text-sm text-gray-600 line-clamp-2">
              {{ item.description }}
            </div>
          </div>
        </div>
      </div>

      <!-- Estimation Area -->
      <div class="lg:col-span-2">
        <div v-if="selectedItem" class="bg-white rounded-lg shadow p-6">
          <div class="mb-6">
            <h2 class="text-xl font-semibold mb-2">{{ selectedItem.title }}</h2>
            <div class="flex items-center gap-2 mb-4">
              <Badge>{{ selectedItem.type }}</Badge>
              <span class="text-sm text-gray-500">{{ selectedItem.u_id }}</span>
            </div>
            <p v-if="selectedItem.description" class="text-gray-600 mb-4">
              {{ selectedItem.description }}
            </p>
          </div>

          <!-- Story Points Selection -->
          <div class="mb-6">
            <h3 class="text-lg font-medium mb-3">Select Story Points</h3>
            <div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
              <button v-for="point in storyPoints" 
                      :key="point"
                      class="p-3 border rounded-lg text-center hover:bg-gray-50 transition-colors"
                      :class="{ 'border-blue-500 bg-blue-50': selectedPoints === point }"
                      @click="selectPoints(point)">
                {{ point }}
              </button>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex justify-end gap-3">
            <Button variant="outline" @click="skipItem">Skip</Button>
            <Button @click="submitEstimation" :disabled="!selectedPoints">
              Submit Estimation
            </Button>
          </div>
        </div>

        <!-- No Item Selected -->
        <div v-else class="bg-white rounded-lg shadow p-6 text-center">
          <p class="text-gray-500">Select a work item to begin estimation</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { GET_ACTIVE_USER_STORIES } from '@/graphql/queries'
import { UPDATE_WORK_ITEM_STORY_POINTS } from '@/graphql/mutations'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  imageUrl?: string
}

interface WorkItem {
  id: string
  u_id: string
  title: string
  description?: string
  state: string
  type: string
  story_points?: number
  createdBy: User
  updatedBy: User
  sprint?: string
  assignedTo?: User
  org_id: string
  createdAt: string
  updatedAt: string
}

// Story points options (Fibonacci sequence)
const storyPoints = [1, 2, 3, 5, 8, 13]

// State
const loading = ref(true)
const error = ref<string | null>(null)
const selectedItem = ref<WorkItem | null>(null)
const selectedPoints = ref<number | null>(null)

// Get work items
const { result: workItemsResult, loading: workItemsLoading, error: workItemsError, refetch: refetchWorkItems } = useQuery(GET_ACTIVE_USER_STORIES)

// Update story points mutation
const updateStoryPointsMutation = useMutation(UPDATE_WORK_ITEM_STORY_POINTS)

// Computed property to get unestimated items
const unestimatedItems = computed(() => {
  if (!workItemsResult.value?.getActiveUserStories) return []
  return workItemsResult.value.getActiveUserStories.filter((item: WorkItem) => 
    item.type === 'user_story' && 
    item.state.toLowerCase() === 'backlog' &&
    !item.story_points
  )
})

// Methods
const selectItem = (item: WorkItem) => {
  selectedItem.value = item
  selectedPoints.value = null
}

const selectPoints = (points: number) => {
  selectedPoints.value = points
}

const skipItem = () => {
  selectedItem.value = null
  selectedPoints.value = null
}

const submitEstimation = async () => {
  if (!selectedItem.value || !selectedPoints.value) return

  try {
    await updateStoryPointsMutation.mutate({
      input: {
        id: selectedItem.value.id,
        story_points: selectedPoints.value,
        org_id: selectedItem.value.org_id
      }
    })

    toast({
      title: "Estimation Submitted",
      description: `Successfully estimated "${selectedItem.value.title}" as ${selectedPoints.value} story points`,
      variant: "default",
    })
    
    // Reset selection and refetch work items
    selectedItem.value = null
    selectedPoints.value = null
    await refetchWorkItems()
  } catch (err: any) {
    console.error('Failed to submit estimation:', err)
    error.value = err?.message || 'Failed to submit estimation'
    
    toast({
      title: "Error",
      description: err?.message || 'Failed to submit estimation',
      variant: "destructive",
    })
  }
}

// Watch for query loading and error states
watch([workItemsLoading], ([workItemsLoadingVal]) => {
  loading.value = workItemsLoadingVal
})

watch([workItemsError], ([workItemsErrorVal]) => {
  error.value = workItemsErrorVal?.message || null
})

onMounted(() => {
  // Initial setup if needed
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style> 