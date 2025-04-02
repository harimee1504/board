<template>
    <div class="board-app">
        <ApolloAuthSetup />
        <SignedIn>
            <RouterView />
            <Toaster />
        </SignedIn>
        <SignedOut>
            <RedirectToSignIn />
        </SignedOut>
    </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router';
import { SignedIn, SignedOut, RedirectToSignIn } from 'vue-clerk'
import Toaster from '@/components/ui/toast/Toaster.vue'
import ApolloAuthSetup from './components/ApolloAuthSetup.vue';
</script>
