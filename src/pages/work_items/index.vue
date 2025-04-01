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
  <div class="grid grid-cols-1 md:grid-cols-7 gap-4 mb-6">
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
    <Card v-else v-for="item in filteredWorkItems" :key="item.uid" class="p-4">
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <span>{{ item.uid }}</span>
            <span>{{ item.title }}</span>
          </div>
          <div class="flex items-center gap-4">
            <Badge>{{ item.type }}</Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVerticalIcon class="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem @click="editWorkItem(item)">
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem @click="deleteWorkItem(item)">
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div v-if="item.tags && item.tags.length > 0" class="flex gap-2">
          <Badge v-for="tag in item.tags" :key="tag" variant="outline">{{ tag }}</Badge>
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
          <Select v-model="newWorkItem.tags" multiple :defaultValue="newWorkItem.tags">
            <SelectTrigger>
              <SelectValue placeholder="Select tags" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="tag in availableTags" :key="tag.id" :value="tag.id">
                {{ tag.tag }}
              </SelectItem>
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
                :key="item.uid" 
                :value="item.id"
              >
                {{ item.title }} ({{ item.uid }})
              </SelectItem>
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
import { PlusIcon, MoreVerticalIcon, Loader2Icon } from 'lucide-vue-next'
import { useAuth } from 'vue-clerk'

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
  uid: string
  title: string
  description?: string
  assigned_to: AssignedTo
  type: WorkItemType
  parent_uid?: string
  priority?: Priority
  tags?: string[]
  original_estimate?: number
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

const { result: tagsResult, loading: tagsLoading } = useQuery(GET_TAGS)
const { result: usersResult, loading: usersLoading } = useQuery(GET_USERS_BY_ORG)
const { result: workItemsResult, loading: workItemsLoading } = useQuery(GET_WORK_ITEMS)

// Watch for tags query result
watch(tagsResult, (newResult) => {
  if (newResult?.getTags) {
    availableTags.value = newResult.getTags
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
      uid: item.u_id,
      title: item.title,
      description: item.description,
      assigned_to: item.assignedTo,
      type: item.type as WorkItemType,
      parent_uid: item.parent,
      priority: item.priority as Priority,
      tags: item.tags,
      original_estimate: item.original_estimate
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
  switch (type) {
    case 'epic':
      return workItems.value.filter(item => item.type === 'initiative')
    case 'feature':
      return workItems.value.filter(item => item.type === 'epic')
    case 'user_story':
      return workItems.value.filter(item => item.type === 'feature')
    case 'task':
    case 'bug':
      return workItems.value.filter(item => item.type === 'user_story')
    default:
      return []
  }
})

const filteredWorkItems = computed(() => {
  return workItems.value.filter(item => {
    const textMatch = item.title.toLowerCase().includes(filters.value.text.toLowerCase()) ||
                     (item.description?.toLowerCase().includes(filters.value.text.toLowerCase()) ?? false)
    const uidMatch = item.uid.toLowerCase().includes(filters.value.uid.toLowerCase())
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
  })
}

const { mutate: deleteWorkItemMutation } = useMutation(DELETE_WORK_ITEM)
const { mutate: updateWorkItem } = useMutation(UPDATE_WORK_ITEM)

const editWorkItem = (item: WorkItem) => {
  isEditMode.value = true
  isEditWorkItemDialogOpen.value = true
  console.log(item)
  newWorkItem.value = { ...item }
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

const deleteWorkItem = async (item: WorkItem) => {
  try {
    loading.value = true
    const { data } = await deleteWorkItemMutation({
      input: {
        id: item.id
      }
    })

    if (data?.deleteWorkItem) {
      const index = workItems.value.findIndex(wi => wi.uid === item.uid)
      if (index !== -1) {
        workItems.value.splice(index, 1)
      }
      toast({
        title: "Work Item Deleted",
        description: `Successfully deleted work item ${item.uid}`,
      })
    }
  } catch (error) {
    console.error('Failed to delete work item:', error)
    toast({
      title: "Error",
      description: "Failed to delete work item",
      variant: "destructive",
    })
  } finally {
    loading.value = false
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

  if (needsParent.value && !newWorkItem.value.parent_uid) {
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
      variant: "destructive",
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
        const index = workItems.value.findIndex(item => item.id === newWorkItem.value.id)
        if (index !== -1) {
          workItems.value[index] = {
            ...workItems.value[index],
            title: data.updateWorkItem.title,
            description: data.updateWorkItem.description,
            assigned_to: data.updateWorkItem.assignedTo,
            type: data.updateWorkItem.type as WorkItemType,
            parent_uid: data.updateWorkItem.parent,
            priority: data.updateWorkItem.priority as Priority,
            tags: data.updateWorkItem.tags,
            original_estimate: data.updateWorkItem.original_estimate
          }
        }

        toast({
          title: "Success",
          description: "Work item updated successfully",
        })
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
        workItems.value.push({
          id: data.createWorkItem.id,
          uid: data.createWorkItem.u_id,
          title: data.createWorkItem.title,
          description: data.createWorkItem.description,
          assigned_to: data.createWorkItem.assignedTo,
          type: data.createWorkItem.type as WorkItemType,
          parent_uid: data.createWorkItem.parent,
          priority: data.createWorkItem.priority as Priority,
          tags: data.createWorkItem.tags,
          original_estimate: data.createWorkItem.original_estimate
        })

        toast({
          title: "Success",
          description: "Work item created successfully",
        })
      }
    }

    closeDialog()
  } catch (error) {
    console.error('Failed to save work item:', error)
    toast({
      title: "Error",
      description: `Failed to ${isEditMode.value ? 'update' : 'create'} work item`,
      variant: "destructive",
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
  } catch (error) {
    console.error('Error during initialization:', error)
    toast({
      title: "Error",
      description: "Failed to initialize application",
      variant: "destructive",
    })
  } finally {
    loading.value = false
  }
})

</script>