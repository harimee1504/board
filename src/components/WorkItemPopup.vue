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
            <Select v-model="selectedState" @update:modelValue="handleStateChange" :disabled="updateLoading">
              <SelectTrigger class="w-full">
                <SelectValue :placeholder="StateDisplay[workItem?.state] || workItem?.state">
                  <span v-if="updateLoading" class="text-muted-foreground">Updating...</span>
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
          <!-- Story Points for Epic, Feature, User Story -->
          <div v-if="['epic', 'feature', 'user_story'].includes(workItem?.type)" class="space-y-2">
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
            <p>{{ workItem?.completed_estimate }}</p>
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
import { ref, computed } from 'vue'
import { useMutation } from '@vue/apollo-composable'
import { UPDATE_WORK_ITEM } from '@/graphql/mutations'
import useOrganizationStore from '@/lib/useOrganization'

const props = defineProps<{
  isOpen: boolean
  workItem: any
}>()

const emit = defineEmits<{
  (e: 'update:isOpen', value: boolean): void
}>()

const router = useRouter()
const domain = window.location.origin

// Add Apollo mutation
const { mutate: updateWorkItem, loading: updateLoading } = useMutation(UPDATE_WORK_ITEM)

// Get the current organization ID
const { currentOrgId } = useOrganization()

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
  if (!props.workItem?.u_id) return

  try {
    await updateWorkItem({
      variables: {
        org_id: currentOrgId.value,
        input: {
          id: props.workItem.id,
          state: newState,
          type: props.workItem.type // Required field
        }
      },
      fetchPolicy: 'network-only'
    })
    
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
</script> 