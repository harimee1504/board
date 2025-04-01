<template>
    <div class="board-app">
        <SignedIn>
            <RouterView />
            <Toaster />
        </SignedIn>
        <SignedOut>
            <RedirectToSignIn />
        </SignedOut>
    </div>
</template>

<script setup>
import { RouterView } from 'vue-router';
import { SignedIn, SignedOut, RedirectToSignIn } from 'vue-clerk'
import Toaster from '@/components/ui/toast/Toaster.vue'
</script>
