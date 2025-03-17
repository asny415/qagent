<template>
    <div class="container">
        <div class="button-container">
            <button @click="loadBaidu">Load Baidu</button>
            <button @click="loadBing">Load Bing</button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

// Interface for the exposed methods from preload.ts
interface WindowWithElectron extends Window {
    electronAPI: {
        send: (channel: string, data: any) => void;
    };
}

// Ensure that window has electronAPI.send
declare const window: WindowWithElectron;

const loadBaidu = () => {
    if (window.myAPI && window.myAPI.send) {
        window.myAPI.send('change-url', 'https://www.baidu.com');
    } else {
        console.error('electronAPI.send is not available!');
    }
};

const loadBing = () => {
    if (window.myAPI && window.myAPI.send) {
        window.myAPI.send('change-url', 'https://www.bing.com');
    } else {
        console.error('electronAPI.send is not available!');
    }
};

onMounted(() => {
    if (!(window.myAPI && window.myAPI.send)) {
        console.error('electronAPI.send is not available!');
    }
})
</script>

<style scoped>
.container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
}

.button-container {
    display: flex;
    gap: 1rem;
}

.iframe-container {
    width: 100%;
}
</style>
