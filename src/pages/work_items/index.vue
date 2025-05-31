<template>
<div class="container mx-auto p-4 font-poppins">
  <!-- Navigation -->
  <nav class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold">Work Items</h1>
    <Button @click="isNewWorkItemDialogOpen = true">
      <PlusIcon class="mr-2 h-4 w-4" />
      Add New Work Item
    </Button>
  </nav>

  <!-- Filters -->
  <div class="grid md:grid-cols-7 gap-4 mb-6">
    <Input 
      v-model="filters.text"
      placeholder="Search by text..."
    />
    <Input 
      v-model="filters.uid"
      placeholder="Filter by UID..."
    />
    <Select v-model="filters.type">
      <SelectTrigger>
        <SelectValue placeholder="Select type" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="initiative">Initiative</SelectItem>
        <SelectItem value="epic">Epic</SelectItem>
        <SelectItem value="feature">Feature</SelectItem>
        <SelectItem value="user_story">User Story</SelectItem>
        <SelectItem value="task">Task</SelectItem>
        <SelectItem value="bug">Bug</SelectItem>
      </SelectContent>
    </Select>
    <Select v-model="filters.priority">
      <SelectTrigger>
        <SelectValue placeholder="Filter by priority" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="p1">P1</SelectItem>
        <SelectItem value="p2">P2</SelectItem>
        <SelectItem value="p3">P3</SelectItem>
        <SelectItem value="p4">P4</SelectItem>
        <SelectItem value="p5">P5</SelectItem>
      </SelectContent>
    </Select>
    <Select v-model="filters.assigned_to">
      <SelectTrigger>
        <SelectValue placeholder="Filter by assignee" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem 
          v-for="user in users" 
          :key="user.id" 
          :value="user.email"
        >
          {{ user.firstName }} {{ user.lastName }}
        </SelectItem>
      </SelectContent>
    </Select>
    <Select v-model="filters.tags" multiple>
      <SelectTrigger>
        <SelectValue placeholder="Filter by tags" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="tag in availableTags" :key="tag.id" :value="tag.tag">
          {{ tag.tag }}
        </SelectItem>
      </SelectContent>
    </Select>
    <Button variant="outline" @click="resetFilters">
      Clear Filters
    </Button>
  </div>

  <!-- Work Items List -->
  <div class="space-y-4">
    <div v-if="loading || workItemsLoading" class="text-center py-8">
      <Loader2Icon class="h-8 w-8 animate-spin mx-auto" />
      <p class="mt-2 text-gray-500">Loading work items...</p>
    </div>
    <div v-else-if="filteredWorkItems.length === 0" class="text-center py-8 text-gray-500">
      No work items available. Create a work item to get started.
    </div>
    <Card v-else v-for="item in filteredWorkItems" :key="item.u_id" class="p-4 cursor-pointer hover:bg-gray-50" @click="openWorkItemPopup(item)">
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <a 
              :href="`${baseUrl}?workitem_id=${item.u_id}`"
              target="_blank"
              class="text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-2 py-1 rounded-md"
              @click.stop
            >
              #{{ item.u_id }}
            </a>
            <span>{{ item.title }}</span>
          </div>
          <div class="flex items-center gap-4">
            <Badge>{{ WorkItemTypeDisplay[item.type] || item.type }}</Badge>
            <div @click.stop>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" @click.stop>
                  <MoreVerticalIcon class="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
                <DropdownMenuContent @click.stop>
                  <DropdownMenuItem @click.stop="editWorkItem(item)">
                  Edit
                </DropdownMenuItem>
                  <DropdownMenuItem @click.stop="deleteWorkItem(item.id)">
                  Delete
                </DropdownMenuItem>
                  <DropdownMenuItem @click.stop="copyWorkItemLink(item)">
                    Copy Link
                  </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        </div>
        <div v-if="item.tags && item.tags.length > 0" class="flex gap-2">
          <Badge v-for="tag in item.tags" :key="tag" variant="outline">{{ tag.tag }}</Badge>
        </div>
      </div>
    </Card>
  </div>

  <!-- New/Edit Work Item Dialog -->
  <Dialog :open="isNewWorkItemDialogOpen || isEditWorkItemDialogOpen" @update:open="closeDialog">
    <DialogContent class="w-3/4 max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{{ isEditMode ? 'Edit Work Item' : 'Create New Work Item' }}</DialogTitle>
        <DialogDescription>Fill in the details for the work item</DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <div class="space-y-2">
          <Label for="title">Title <span class="text-red-500">*</span></Label>
          <Input id="title" v-model="newWorkItem.title" placeholder="Enter work item title" />
          <span v-if="formErrors.title" class="text-sm text-red-500">{{ formErrors.title }}</span>
        </div>

        <div class="space-y-2">
          <Label for="description">Description (Optional)</Label>
          <Input id="description" v-model="newWorkItem.description" placeholder="Enter work item description" />
        </div>

        <div class="space-y-2">
          <Label for="type">Type <span class="text-red-500">*</span></Label>
          <Select v-model="newWorkItem.type">
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="initiative">Initiative</SelectItem>
              <SelectItem value="epic">Epic</SelectItem>
              <SelectItem value="feature">Feature</SelectItem>
              <SelectItem value="user_story">User Story</SelectItem>
              <SelectItem value="task">Task</SelectItem>
              <SelectItem value="bug">Bug</SelectItem>
            </SelectContent>
          </Select>
          <span v-if="formErrors.type" class="text-sm text-red-500">{{ formErrors.type }}</span>
        </div>

        <div class="space-y-2">
          <Label for="assigned_to">Assigned To <span class="text-red-500">*</span></Label>
          <Select v-model="newWorkItem.assigned_to">
            <SelectTrigger>
              <SelectValue>
                {{ newWorkItem.assigned_to?.firstName ? `${newWorkItem.assigned_to.firstName} ${newWorkItem.assigned_to.lastName}` : 'Select assignee' }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem 
                v-for="user in users" 
                :key="user.id" 
                :value="user"
              >
                {{ user.firstName }} {{ user.lastName }}
              </SelectItem>
              <div v-if="users.length === 0" class="p-2 text-sm text-gray-500 text-center">
                No data available
              </div>
            </SelectContent>
          </Select>
          <span v-if="formErrors.assigned_to" class="text-sm text-red-500">{{ formErrors.assigned_to }}</span>
        </div>

        <div class="space-y-2">
          <Label for="priority">Priority (Optional)</Label>
          <Select v-model="newWorkItem.priority">
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="p1">P1</SelectItem>
              <SelectItem value="p2">P2</SelectItem>
              <SelectItem value="p3">P3</SelectItem>
              <SelectItem value="p4">P4</SelectItem>
              <SelectItem value="p5">P5</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <Label for="tags">Tags (Optional)</Label>
          <Select v-model="newWorkItem.tags" multiple>
            <SelectTrigger>
              <SelectValue>
                <div class="flex flex-wrap gap-1">
                  <template v-if="newWorkItem.tags && newWorkItem.tags.length > 0">
                    <Badge 
                      v-for="tagId in newWorkItem.tags" 
                      :key="tagId" 
                      variant="secondary"
                      class="mr-1"
                    >
                      {{ getTagName(tagId) }}
                    </Badge>
                  </template>
                  <span v-else class="text-muted-foreground">Select tags</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="tag in availableTags" :key="tag.id" :value="tag.id">
                <div class="flex items-center">
                  <Check 
                    v-if="newWorkItem.tags && newWorkItem.tags.includes(tag.id)" 
                    class="mr-2 h-4 w-4" 
                  />
                  {{ tag.tag }}
                </div>
              </SelectItem>
              <div v-if="availableTags.length === 0" class="p-2 text-sm text-gray-500 text-center">
                No data available
              </div>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2" v-if="needsParent">
          <Label for="parent">Parent Work Item <span class="text-red-500">*</span></Label>
          <Select v-model="newWorkItem.parent_uid">
            <SelectTrigger>
              <SelectValue placeholder="Select parent work item" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem 
                v-for="item in availableParents" 
                :key="item.u_id" 
                :value="item.id"
              >
                {{ item.title }} ({{ item.u_id }})
              </SelectItem>
              <div v-if="availableParents.length === 0" class="p-2 text-sm text-gray-500 text-center">
                No data available
              </div>
            </SelectContent>
          </Select>
          <span v-if="formErrors.parent_uid" class="text-sm text-red-500">{{ formErrors.parent_uid }}</span>
        </div>

        <div class="space-y-2" v-if="['task', 'bug'].includes(newWorkItem.type)">
          <Label for="original_estimate">Original Estimate (hours) <span class="text-red-500">*</span></Label>
          <Input 
            id="original_estimate" 
            v-model="newWorkItem.original_estimate" 
            type="number" 
            min="0"
            step="0.5"
            placeholder="Enter estimated hours" 
          />
          <span v-if="formErrors.original_estimate" class="text-sm text-red-500">{{ formErrors.original_estimate }}</span>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="closeDialog" :disabled="saving">Cancel</Button>
        <Button @click="saveWorkItem" :disabled="saving">
          <Loader2Icon v-if="saving" class="mr-2 h-4 w-4 animate-spin" />
          {{ saving ? 'Saving...' : 'Save' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- Add WorkItemPopup component -->
  <WorkItemPopup
    v-model:isOpen="isWorkItemPopupOpen"
    :work-item="selectedWorkItem"
  />
</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, inject, getCurrentInstance } from 'vue'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { CREATE_WORK_ITEM, DELETE_WORK_ITEM, UPDATE_WORK_ITEM } from '@/graphql/mutations'
import { GET_TAGS, GET_USERS_BY_ORG, GET_WORK_ITEMS } from '@/graphql/queries'
import { useToast } from '@/components/ui/toast/use-toast'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { PlusIcon, MoreVerticalIcon, Loader2Icon, Check } from 'lucide-vue-next'
import { useAuth } from 'vue-clerk'
import WorkItemPopup from '@/components/WorkItemPopup.vue'
import { WorkItemTypeDisplay, StateDisplay, PriorityDisplay } from '@/typings/enums'

type WorkItemType = 'initiative' | 'epic' | 'feature' | 'user_story' | 'task' | 'bug'
type Priority = 'p1' | 'p2' | 'p3' | 'p4' | 'p5' | ''

interface AssignedTo {
  id: string
  firstName: string
  lastName: string
  email: string
  imageUrl: string
}

interface WorkItem {
  id: string
  u_id: string
  title: string
  description?: string
  assigned_to: AssignedTo
  type: WorkItemType
  parent_uid?: any
  priority?: Priority
  tags?: Tag[]
  original_estimate?: number
  createdBy?: AssignedTo
  updatedBy?: AssignedTo
  createdAt?: string
  updatedAt?: string
  story_points?: number
  remaining_estimate?: number
  completed_estimate?: number
  acceptance_criteria?: string
  definition_of_done?: string
  state?: string
}

interface Tag {
  id: string
  tag: string
}

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  imageUrl: string
}

const { toast } = useToast()
const loading = ref(false)
const saving = ref(false)
const workItems = ref<WorkItem[]>([])
const isEditMode = ref(false)
const isEditWorkItemDialogOpen = ref(false)

const users = ref<User[]>([])
const availableTags = ref<Tag[]>([])

const { result: tagsResult, loading: tagsLoading, refetch: refetchTags } = useQuery(GET_TAGS)
const { result: usersResult, loading: usersLoading, refetch: refetchUsers } = useQuery(GET_USERS_BY_ORG)
const { result: workItemsResult, loading: workItemsLoading, refetch: refetchWorkItems } = useQuery(GET_WORK_ITEMS, null, {
  fetchPolicy: 'network-only',
  notifyOnNetworkStatusChange: true
})

// Watch for tags query result
watch(tagsResult, (newResult) => {
  if (newResult?.getTags) {
    availableTags.value = newResult.getTags
    
    // If we're in edit mode and have selected tags, ensure they're properly initialized
    if (isEditMode.value && newWorkItem.value.tags && newWorkItem.value.tags.length > 0) {
      console.log("Tags loaded, selected tags:", newWorkItem.value.tags)
    }
  }
})

// Watch for users query result
watch(usersResult, (newResult) => {
  if (newResult?.getUsers) {
    users.value = newResult.getUsers
  }
})

// Watch for work items query result
watch(workItemsResult, (newResult) => {
  if (newResult?.getWorkItems) {
    workItems.value = newResult.getWorkItems.map(item => ({
      id: item.id,
      u_id: item.u_id,
      title: item.title,
      org_id: item.org_id,
      description: item.description,
      assigned_to: item.assignedTo,
      type: item.type as WorkItemType,
      parent_uid: item.parent,
      priority: item.priority as Priority,
      tags: item.tags,
      original_estimate: item.original_estimate,
      createdBy: item.createdBy,
      updatedBy: item.updatedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      story_points: item.story_points,
      remaining_estimate: item.remaining_estimate,
      completed_estimate: item.completed_estimate,
      acceptance_criteria: item.acceptance_criteria,
      definition_of_done: item.definition_of_done,
      state: item.state
    }))
  }
})

const filters = ref({
  text: '',
  uid: '',
  type: '',
  priority: '',
  assigned_to: '',
  tags: [] as string[]
})

const isNewWorkItemDialogOpen = ref(false)
const newWorkItem = ref({
  id: '',
  title: '',
  description: '',
  assigned_to: {} as AssignedTo,
  type: '' as WorkItemType,
  parent_uid: '',
  priority: '' as Priority,
  tags: [] as string[],
  original_estimate: undefined as number | undefined
})

const formErrors = ref({
  title: '',
  assigned_to: '',
  type: '',
  parent_uid: '',
  original_estimate: ''
})

const needsParent = computed(() => {
  const type = newWorkItem.value.type
  return type && type !== 'initiative'
})

const availableParents = computed(() => {
  const type = newWorkItem.value.type
  const closedStates = ['closed', 'rejected']
  switch (type) {
    case 'epic':
      return workItems.value.filter(item => 
        item.type === 'initiative' && 
        !closedStates.includes(item.state?.toLowerCase())
      )
    case 'feature':
      return workItems.value.filter(item => 
        item.type === 'epic' && 
        !closedStates.includes(item.state?.toLowerCase())
      )
    case 'user_story':
      return workItems.value.filter(item => 
        item.type === 'feature' && 
        !closedStates.includes(item.state?.toLowerCase())
      )
    case 'task':
    case 'bug':
      return workItems.value.filter(item => 
        item.type === 'user_story' && 
        item.state?.toLowerCase() === 'active'
      )
    default:
      return []
  }
})

const filteredWorkItems = computed(() => {
  return workItems.value.filter(item => {
    const textMatch = item.title.toLowerCase().includes(filters.value.text.toLowerCase()) ||
                     (item.description?.toLowerCase().includes(filters.value.text.toLowerCase()) ?? false)
    const uidMatch = item.u_id.toLowerCase().includes(filters.value.uid.toLowerCase())
    const typeMatch = !filters.value.type || item.type === filters.value.type
    const priorityMatch = !filters.value.priority || item.priority === filters.value.priority
    const assignedToMatch = !filters.value.assigned_to || item.assigned_to.email === filters.value.assigned_to
    const tagsMatch = filters.value.tags.length === 0 || 
                     (item.tags && filters.value.tags.every(tag => item.tags?.includes(tag)))
    
    return textMatch && uidMatch && typeMatch && priorityMatch && assignedToMatch && tagsMatch
  })
})

const resetFilters = () => {
  filters.value = {
    text: '',
    uid: '',
    type: '',
    priority: '',
    assigned_to: '',
    tags: []
  }
  toast({
    title: "Filters Reset",
    description: "All filters have been cleared",
    duration: 3000
  })
}

const { mutate: deleteWorkItemMutation } = useMutation(DELETE_WORK_ITEM)
const { mutate: updateWorkItem } = useMutation(UPDATE_WORK_ITEM)

const editWorkItem = (item: WorkItem) => {
  isEditMode.value = true
  isEditWorkItemDialogOpen.value = true
  console.log(item)
  
  // Create a deep copy of the item to avoid reference issues
  newWorkItem.value = { 
    ...item,
    // Ensure tags are properly initialized as an array of tag IDs
    tags: item.tags ? item.tags.map(tag => tag.id) : [],
    // Ensure parent_uid is properly set to the parent's ID
    parent_uid: item.parent_uid?.id || item.parent_uid
  }
  
  console.log("Initialized tags:", newWorkItem.value.tags)
  console.log("Initialized parent:", newWorkItem.value.parent_uid)
}

const closeDialog = () => {
  isNewWorkItemDialogOpen.value = false
  isEditWorkItemDialogOpen.value = false
  isEditMode.value = false
  newWorkItem.value = {
    id: '',
    title: '',
    description: '',
    assigned_to: {} as AssignedTo,
    type: '' as WorkItemType,
    parent_uid: '',
    priority: '' as Priority,
    tags: [],
    original_estimate: undefined
  }
  formErrors.value = {
    title: '',
    assigned_to: '',
    type: '',
    parent_uid: '',
    original_estimate: ''
  }
}

const deleteWorkItem = async (id: string) => {
  try {
    await deleteWorkItemMutation({
      input: {
        id
      }
    })

    toast({
      title: "Success",
      description: "Work item deleted successfully",
      duration: 3000
    })
    
    // Refetch work items instead of setting workItemsResult.value to null
    await refetchWorkItems()
  } catch (error) {
    console.error("Error deleting work item:", error)
    toast({
      title: "Error",
      description: "Failed to delete work item",
      duration: 3000
    })
  }
}

const validateForm = () => {
  let isValid = true
  formErrors.value = {
    title: '',
    assigned_to: '',
    type: '',
    parent_uid: '',
    original_estimate: ''
  }

  if (!newWorkItem.value.title.trim()) {
    formErrors.value.title = 'Title is required'
    isValid = false
  }

  if (!newWorkItem.value.assigned_to.id) {
    formErrors.value.assigned_to = 'Assignee is required'
    isValid = false
  }

  if (!newWorkItem.value.type) {
    formErrors.value.type = 'Type is required'
    isValid = false
  }

  if (needsParent.value && (!newWorkItem.value.parent_uid || newWorkItem.value.parent_uid === '' || 
      (typeof newWorkItem.value.parent_uid === 'object' && Object.keys(newWorkItem.value.parent_uid).length === 0))) {
    const requiredParentType = (() => {
      switch (newWorkItem.value.type) {
        case 'epic': return 'Initiative'
        case 'feature': return 'Epic'
        case 'user_story': return 'Feature'
        case 'task': return 'User Story'
        case 'bug': return 'User Story'
        default: return ''
      }
    })()
    formErrors.value.parent_uid = `Parent work item (${requiredParentType}) is required`
    isValid = false
  }

  if (['task', 'bug'].includes(newWorkItem.value.type) && !newWorkItem.value.original_estimate) {
    formErrors.value.original_estimate = 'Original estimate is required for tasks and bugs'
    isValid = false
  }

  return isValid
}

const { mutate: createWorkItem } = useMutation(CREATE_WORK_ITEM)

const saveWorkItem = async () => {
  if (!validateForm()) {
    toast({
      title: "Validation Error",
      description: "Please fill in all required fields",
      duration: 3000
    })
    return
  }

  try {
    saving.value = true
    
    if (isEditMode.value) {
      const { data } = await updateWorkItem({
        input: {
          id: newWorkItem.value.id,
          title: newWorkItem.value.title,
          description: newWorkItem.value.description,
          type: newWorkItem.value.type,
          assignedTo: newWorkItem.value.assigned_to.id,
          priority: newWorkItem.value.priority,
          parent: newWorkItem.value.parent_uid,
          tags: newWorkItem.value.tags,
          original_estimate: newWorkItem.value.original_estimate
          }
      })

      if (data?.updateWorkItem) {
        toast({
          title: "Success",
          description: "Work item updated successfully",
          duration: 3000
        })
        
        // Refetch work items instead of manually updating the array
        await refetchWorkItems()
      }
    } else {
      const { data } = await createWorkItem({
        input: {
          title: newWorkItem.value.title,
          description: newWorkItem.value.description,
          type: newWorkItem.value.type,
          assignedTo: newWorkItem.value.assigned_to.id,
          priority: newWorkItem.value.priority,
          parent: newWorkItem.value.parent_uid,
          tags: newWorkItem.value.tags,
          original_estimate: newWorkItem.value.original_estimate
          }
      })

      if (data?.createWorkItem) {
        toast({
          title: "Success",
          description: "Work item created successfully",
          duration: 3000
        })
        
        // Refetch work items instead of manually pushing to the array
        await refetchWorkItems()
      }
    }

    closeDialog()
  } catch (error) {
    console.error('Failed to save work item:', error)
    toast({
      title: "Error",
      description: `Failed to ${isEditMode.value ? 'update' : 'create'} work item`,
      variant: "destructive",
      duration: 3000
    })
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  loading.value = true
  try {
    // Get the component instance
    const { proxy } = getCurrentInstance()
    console.log(proxy.$window)  
    const token = await proxy.$window.Clerk.session.getToken({ template: 'convex' })
    localStorage.setItem("authToken", token || "")
    
    // Refetch work items when component is mounted
    await refetchWorkItems()
  } catch (error) {
    console.error('Error during initialization:', error)
    toast({
      title: "Error",
      description: "Failed to initialize application",
      variant: "destructive",
      duration: 3000
    })
  } finally {
    loading.value = false
  }
})

// Add these refs
const isWorkItemPopupOpen = ref(false)
const selectedWorkItem = ref(null)

// Add this function
const openWorkItemPopup = (item) => {
  // Log the complete work item data
  console.log('Work item data from server:', item)
  
  // Make sure we're passing the complete work item with all fields
  selectedWorkItem.value = {
    ...item,
    org_id: item.org_id,
    // Ensure these fields are properly passed
    assignedTo: item.assignedTo || item.assigned_to,
    createdBy: item.createdBy,
    updatedBy: item.updatedBy,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    // Ensure other fields are properly mapped
    story_points: item.story_points,
    original_estimate: item.original_estimate,
    remaining_estimate: item.remaining_estimate,
    completed_estimate: item.completed_estimate,
    acceptance_criteria: item.acceptance_criteria,
    definition_of_done: item.definition_of_done,
    // Fix the parent property structure
    parent: item.parent_uid || null,
    tags: item.tags || []
  }
  isWorkItemPopupOpen.value = true
}

// Add computed property for base URL
const baseUrl = computed(() => {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return ''
})

const copyWorkItemLink = async (item: WorkItem) => {
  try {
    const link = `${baseUrl.value}?workitem_id=${item.u_id}`
    await navigator.clipboard.writeText(link)
    toast({
      title: "Link Copied",
      description: "Work item link has been copied to clipboard",
      duration: 3000
    })
  } catch (error) {
    console.error('Failed to copy link:', error)
    toast({
      title: "Error",
      description: "Failed to copy link to clipboard",
      variant: "destructive",
      duration: 3000
    })
  }
}

const getTagName = (tagId: string) => {
  const tag = availableTags.value.find(tag => tag.id === tagId)
  return tag ? tag.tag : ''
}

</script>