<template>
  <div>
    <h1>Leave Tracker</h1>
    <p>
      <strong>Current route path:</strong> {{ $route.fullPath }}
    </p>
    <p>{{ count }}</p>
    <button @click="decrement">increment</button>
    <button @click="increment">decrement</button>
  </div>
</template>

<script lang="ts">
export default {
  name: "LeaveTracker",
  data() {
    return {
      count: 0
    };
  },
  methods: {
    increment() {
      this.count++;
    },
    decrement() {
      this.count--;
    }
  }
};
</script>