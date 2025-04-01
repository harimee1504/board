<template>
  <div class="container mx-auto p-4 font-poppins">
    <div v-if="loading" class="flex justify-center items-center h-screen">
      <div class="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
    </div>

    <div v-else-if="error" class="text-red-500 text-center">
      {{ error }}
    </div>

    <div v-else-if="workItem" class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold">{{ workItem.title }}</h1>
          <p class="text-gray-600">{{ workItem.u_id }}</p>
        </div>
        <Button @click="handleEdit">
          <PencilIcon class="mr-2 h-4 w-4" />
          Edit
        </Button>
      </div>

      <!-- Main Content -->
      <div class="space-y-6">
        <!-- Basic Info -->
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="font-semibold">Type</label>
            <p>{{ workItem.type }}</p>
          </div>
          <div class="space-y-2">
            <label class="font-semibold">State</label>
            <p>{{ workItem.state }}</p>
          </div>
          <div class="space-y-2">
            <label class="font-semibold">Priority</label>
            <p>{{ workItem.priority }}</p>
          </div>
          <div class="space-y-2">
            <label class="font-semibold">Story Points</label>
            <p>{{ workItem.story_points }}</p>
          </div>
        </div>

        <!-- Description -->
        <div class="space-y-2">
          <label class="font-semibold">Description</label>
          <p class="whitespace-pre-wrap">{{ workItem.description }}</p>
        </div>

        <!-- Estimates -->
        <div class="grid grid-cols-3 gap-4">
          <div class="space-y-2">
            <label class="font-semibold">Original Estimate</label>
            <p>{{ workItem.original_estimate }}</p>
          </div>
          <div class="space-y-2">
            <label class="font-semibold">Remaining Estimate</label>
            <p>{{ workItem.remaining_estimate }}</p>
          </div>
          <div class="space-y-2">
            <label class="font-semibold">Completed Estimate</label>
            <p>{{ workItem.completed_estimate }}</p>
          </div>
        </div>

        <!-- People -->
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="font-semibold">Assigned To</label>
            <div v-if="workItem.assignedTo" class="flex items-center">
              <img :src="workItem.assignedTo.imageUrl" class="w-8 h-8 rounded-full mr-2" />
              <span>{{ workItem.assignedTo.firstName }} {{ workItem.assignedTo.lastName }}</span>
            </div>
          </div>
          <div class="space-y-2">
            <label class="font-semibold">Created By</label>
            <div v-if="workItem.createdBy" class="flex items-center">
              <img :src="workItem.createdBy.imageUrl" class="w-8 h-8 rounded-full mr-2" />
              <span>{{ workItem.createdBy.firstName }} {{ workItem.createdBy.lastName }}</span>
            </div>
          </div>
        </div>

        <!-- Tags -->
        <div class="space-y-2">
          <label class="font-semibold">Tags</label>
          <div class="flex gap-2">
            <Badge v-for="tag in workItem.tags" :key="tag.id" variant="secondary">
              {{ tag.tag }}
            </Badge>
          </div>
        </div>

        <!-- Parent Work Item -->
        <div v-if="workItem.parent" class="space-y-2">
          <label class="font-semibold">Parent Work Item</label>
          <div class="flex items-center">
            <RouterLink :to="`/work-items/${workItem.parent.u_id}`" class="text-blue-600 hover:underline">
              {{ workItem.parent.title }}
            </RouterLink>
          </div>
        </div>

        <!-- Dates -->
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="font-semibold">Created At</label>
            <p>{{ new Date(workItem.createdAt).toLocaleString() }}</p>
          </div>
          <div class="space-y-2">
            <label class="font-semibold">Updated At</label>
            <p>{{ new Date(workItem.updatedAt).toLocaleString() }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { GET_WORK_ITEMS } from '@/graphql/queries'
import { useQuery } from '@vue/apollo-composable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PencilIcon } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const workItem = ref(null)
const loading = ref(true)
const error = ref(null)

const { result, loading: queryLoading, error: queryError } = useQuery(GET_WORK_ITEMS)

onMounted(async () => {
  try {
    loading.value = true
    await result.value
    const items = result.value.getWorkItems
    workItem.value = items.find(item => item.u_id === route.params.u_id)
    
    if (!workItem.value) {
      error.value = 'Work item not found'
    }
  } catch (e) {
    error.value = 'Error loading work item'
    console.error(e)
  } finally {
    loading.value = false
  }
})

const handleEdit = () => {
  router.push(`/work-items/${route.params.u_id}/edit`)
}
</script>
