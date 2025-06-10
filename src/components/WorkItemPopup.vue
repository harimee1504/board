<template>
  <Dialog :open="isOpen" @update:open="close">
    <DialogContent class="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          <div class="space-y-1">
            <div class="flex items-center" v-if="workItem?.u_id">
              <a 
                :href="`${domain}?workitem_id=${workItem.u_id}`" 
                target="_blank" 
                class="text-blue-600 hover:underline font-medium bg-blue-50 px-2 py-1 rounded-md"
              >
                #{{ workItem.u_id }}
              </a>
            </div>
            <h2 class="text-2xl font-bold">{{ workItem?.title }}</h2>
          </div>
        </DialogTitle>
      </DialogHeader>

      <div class="space-y-6">
        <!-- Basic Info -->
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="font-semibold">Type</label>
            <p>{{ WorkItemTypeDisplay[workItem?.type] || workItem?.type }}</p>
          </div>
          <div class="space-y-2">
            <label class="font-semibold">State</label>
            <Select v-model="selectedState" @update:modelValue="handleStateChange" :disabled="updateStateLoading">
              <SelectTrigger class="w-full">
                <SelectValue :placeholder="StateDisplay[workItem?.state] || workItem?.state">
                  <span v-if="updateStateLoading" class="text-muted-foreground">Updating...</span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem 
                  v-for="state in availableStates" 
                  :key="state" 
                  :value="state"
                >
                  {{ StateDisplay[state] }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <label class="font-semibold">Priority</label>
            <p>{{ PriorityDisplay[workItem?.priority] || workItem?.priority }}</p>
          </div>
          <!-- Story Points for User Story only -->
          <div v-if="workItem?.type === 'user_story'" class="space-y-2">
            <label class="font-semibold">Story Points</label>
            <p>{{ workItem?.story_points || 'None' }}</p>
          </div>
        </div>

        <!-- Description -->
        <div class="space-y-2">
          <label class="font-semibold">Description</label>
          <p class="whitespace-pre-wrap">{{ workItem?.description }}</p>
        </div>

        <!-- Estimates for Task and Bug -->
        <div v-if="['task', 'bug'].includes(workItem?.type)" class="grid grid-cols-3 gap-4">
          <div class="space-y-2">
            <label class="font-semibold">Original Estimate</label>
            <p>{{ workItem?.original_estimate }}</p>
          </div>
          <div class="space-y-2">
            <label class="font-semibold">Remaining Estimate</label>
            <p>{{ workItem?.remaining_estimate }}</p>
          </div>
          <div class="space-y-2">
            <label class="font-semibold">Completed Estimate</label>
            <div class="flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <Input 
                  v-model="completedEstimate" 
                  type="number" 
                  min="0"
                  step="0.5"
                  class="w-24"
                  :class="{ 'border-red-500': estimateError }"
                  :disabled="updateEstimateLoading"
                  @change="handleCompletedEstimateChange"
                />
                <Button 
                  v-if="completedEstimate !== workItem?.completed_estimate"
                  size="sm"
                  variant="outline"
                  :disabled="updateEstimateLoading || !!estimateError"
                  @click="handleCompletedEstimateChange"
                >
                  <Loader2Icon v-if="updateEstimateLoading" class="mr-2 h-4 w-4 animate-spin" />
                  Update
                </Button>
              </div>
              <p v-if="estimateError" class="text-sm text-red-500">{{ estimateError }}</p>
            </div>
          </div>
        </div>

        <!-- Acceptance Criteria and DoD for User Story -->
        <template v-if="workItem?.type === 'user_story'">
          <div class="space-y-2">
            <label class="font-semibold">Acceptance Criteria</label>
            <p class="whitespace-pre-wrap">{{ workItem?.acceptance_criteria || 'None' }}</p>
          </div>
          <div class="space-y-2">
            <label class="font-semibold">Definition of Done</label>
            <p class="whitespace-pre-wrap">{{ workItem?.definition_of_done || 'None' }}</p>
          </div>
        </template>

        <!-- People -->
        <div class="grid grid-cols-3 gap-4">
          <div class="space-y-2">
            <label class="font-semibold">Assigned To</label>
            <div v-if="workItem?.assignedTo" class="flex items-center">
              <img :src="workItem.assignedTo.imageUrl" class="w-8 h-8 rounded-full mr-2" />
              <span>{{ workItem.assignedTo.firstName }} {{ workItem.assignedTo.lastName }}</span>
            </div>
            <p v-else class="text-gray-500 italic">Not assigned</p>
          </div>
          <div class="space-y-2">
            <label class="font-semibold">Created By</label>
            <div v-if="workItem?.createdBy" class="flex items-center">
              <img :src="workItem.createdBy.imageUrl" class="w-8 h-8 rounded-full mr-2" />
              <span>{{ workItem.createdBy.firstName }} {{ workItem.createdBy.lastName }}</span>
            </div>
            <p v-else class="text-gray-500 italic">Unknown</p>
          </div>
          <div class="space-y-2">
            <label class="font-semibold">Updated By</label>
            <div v-if="workItem?.updatedBy" class="flex items-center">
              <img :src="workItem.updatedBy.imageUrl" class="w-8 h-8 rounded-full mr-2" />
              <span>{{ workItem.updatedBy.firstName }} {{ workItem.updatedBy.lastName }}</span>
            </div>
            <p v-else class="text-gray-500 italic">Not updated yet</p>
          </div>
        </div>

        <!-- Parent Work Item -->
        <div v-if="workItem?.parent" class="space-y-2">
          <label class="font-semibold">Parent Work Item</label>
          <div class="flex items-center">
            <a 
              :href="`${domain}?workitem_id=${workItem.parent.u_id}`" 
              target="_blank" 
              class="text-blue-600 hover:underline font-medium bg-blue-50 px-2 py-1 rounded-md"
            >
              #{{ workItem.parent.u_id }}
            </a>
            <span class="ml-2">{{ workItem.parent.title }}</span>
          </div>
        </div>

        <!-- Dates -->
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="font-semibold">Created At</label>
            <p v-if="workItem?.createdAt">{{ formatDate(workItem.createdAt) }}</p>
            <p v-else class="text-gray-500 italic">Not available</p>
          </div>
          <div class="space-y-2">
            <label class="font-semibold">Updated At</label>
            <p v-if="workItem?.updatedAt">{{ formatDate(workItem.updatedAt) }}</p>
            <p v-else class="text-gray-500 italic">Not available</p>
          </div>
        </div>

        <!-- Tags -->
        <div class="space-y-2">
          <label class="font-semibold">Tags</label>
          <div v-if="workItem?.tags && workItem.tags.length > 0" class="flex gap-2">
            <Badge v-for="tag in workItem.tags" :key="tag.id" variant="secondary">
              {{ tag.tag }}
            </Badge>
          </div>
          <p v-else class="text-gray-500 italic">None</p>
        </div>
      </div>

      <DialogFooter class="flex justify-between">
        <Button variant="outline" @click="close">Close</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PencilIcon } from 'lucide-vue-next'
import { WorkItemTypeDisplay, StateDisplay, PriorityDisplay, State } from '@/typings/enums'
import { ref, computed, onMounted, watch } from 'vue'
import { useMutation, useQuery } from '@vue/apollo-composable'
import { UPDATE_WORK_ITEM, UPDATE_WORK_ITEM_STATE, UPDATE_WORK_ITEM_ESTIMATES } from '@/graphql/mutations'
import { GET_TAGS } from '@/graphql/queries'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Check, ChevronsUpDown } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Loader2Icon } from 'lucide-vue-next'
import { useToast } from '@/components/ui/toast/use-toast'

const props = defineProps<{
  isOpen: boolean
  workItem: any
}>()

const emit = defineEmits<{
  (e: 'update:isOpen', value: boolean): void
}>()

const router = useRouter()
const domain = window.location.origin

// Add Apollo mutations
const { mutate: updateWorkItem, loading: updateLoading } = useMutation(UPDATE_WORK_ITEM)
const { mutate: updateWorkItemState, loading: updateStateLoading } = useMutation(UPDATE_WORK_ITEM_STATE)
const { mutate: updateWorkItemEstimates, loading: updateEstimateLoading } = useMutation(UPDATE_WORK_ITEM_ESTIMATES)

// Add tag selection functionality
const { result: tagsResult } = useQuery(GET_TAGS)
const selectedTags = ref<string[]>([])
const openTagSelect = ref(false)

// State transition map
const stateTransitions: Record<State, State[]> = {
  [State.NEW]: [State.ACTIVE, State.REJECTED],
  [State.BACKLOG]: [State.NEW, State.REJECTED],
  [State.ACTIVE]: [State.ON_HOLD, State.IN_TEST, State.CLOSED],
  [State.ON_HOLD]: [State.ACTIVE, State.REJECTED],
  [State.IN_TEST]: [State.ACCEPTED, State.REJECTED, State.ON_HOLD],
  [State.ACCEPTED]: [State.CLOSED],
  [State.REJECTED]: [State.CLOSED],
  [State.CLOSED]: []
}

const selectedState = ref<State>(props.workItem?.state)

// Compute available states based on current state
const availableStates = computed(() => {
  if (!props.workItem?.state) return []
  return stateTransitions[props.workItem.state as State] || []
})

const handleStateChange = async (newState: State) => {
  if (!props.workItem?.id || !props.workItem?.org_id) {
    console.error('Missing required fields:', { id: props.workItem?.id, org_id: props.workItem?.org_id })
    return
  }

  try {
    console.log('Updating state:', { id: props.workItem.id, state: newState, org_id: props.workItem.org_id })
    const result = await updateWorkItemState({
      input: {
        id: props.workItem.id,
        state: newState.toString(),
        org_id: props.workItem.org_id
      }
    })
    
    console.log('State update result:', result)
    
    // Update local state
    selectedState.value = newState
    if (props.workItem) {
      props.workItem.state = newState
    }
  } catch (error) {
    console.error('Failed to update work item state:', error)
    // Revert the selected state on error
    selectedState.value = props.workItem.state
  }
}

// Add console log to debug work item data
console.log('WorkItemPopup - workItem data:', props.workItem)

// Format date to be more human-readable
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

const close = () => {
  emit('update:isOpen', false)
}

const handleEdit = () => {
  if (props.workItem?.u_id) {
    router.push(`/work-items/${props.workItem.u_id}/edit`)
  }
}

const { toast } = useToast()
const completedEstimate = ref<number | undefined>(props.workItem?.completed_estimate)
const estimateError = ref<string>('')

// Watch for workItem changes to update completedEstimate
watch(() => props.workItem, (newWorkItem) => {
  if (newWorkItem) {
    completedEstimate.value = newWorkItem.completed_estimate
    validateEstimate(newWorkItem.completed_estimate, newWorkItem.original_estimate)
  }
}, { immediate: true })

// Validate completed estimate
const validateEstimate = (completed: number | undefined, original: number | undefined) => {
  if (completed === undefined || original === undefined) {
    estimateError.value = ''
    return true
  }
  
  if (completed < 0) {
    estimateError.value = 'Completed estimate cannot be negative'
    return false
  }
  
  if (completed > original) {
    estimateError.value = 'Completed estimate cannot exceed original estimate'
    return false
  }
  
  estimateError.value = ''
  return true
}

// Watch for changes to completed estimate to validate
watch(completedEstimate, (newValue) => {
  validateEstimate(newValue, props.workItem?.original_estimate)
})

const handleCompletedEstimateChange = async () => {
  if (!props.workItem?.id || !props.workItem?.org_id) {
    console.error('Missing required fields:', { id: props.workItem?.id, org_id: props.workItem?.org_id })
    return
  }

  // Validate before sending to server
  if (!validateEstimate(completedEstimate.value, props.workItem.original_estimate)) {
    toast({
      title: "Validation Error",
      description: estimateError.value,
      variant: "destructive",
      duration: 3000
    })
    return
  }

  try {
    updateEstimateLoading.value = true
    
    const result = await updateWorkItemEstimates({
      input: {
        id: props.workItem.id,
        completed_estimate: completedEstimate.value || 0,
        org_id: props.workItem.org_id
      }
    })
    
    console.log('Estimate update result:', result)
    
    // Update local state
    if (props.workItem && result?.data?.updateWorkItemEstimates) {
      const updated = result.data.updateWorkItemEstimates
      props.workItem.completed_estimate = updated.completed_estimate
      props.workItem.remaining_estimate = updated.remaining_estimate
    }

    toast({
      title: "Success",
      description: "Work item estimates updated successfully",
      duration: 3000
    })
  } catch (error) {
    console.error('Failed to update work item estimates:', error)
    // Revert the completed estimate on error
    completedEstimate.value = props.workItem.completed_estimate
    
    toast({
      title: "Error",
      description: "Failed to update work item estimates",
      variant: "destructive",
      duration: 3000
    })
  } finally {
    updateEstimateLoading.value = false
  }
}
</script> 