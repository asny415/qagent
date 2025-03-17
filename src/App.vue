<template>
    <div class="container">
        <div class="button-container">
            <button @click="loadBaidu">Load Baidu</button>
            <button @click="loadBing">Load Bing</button>
            <button @click="captureScreen">Capture Screen</button>
        </div>
        <div v-if="screenshotDataUrl" class="screenshot-container">
            <h3>Screenshot:</h3>
            <img :src="screenshotDataUrl" alt="Screenshot" class="screenshot-image" />
        </div>
        <div v-else class="screenshot-container">
            <h3>No Screenshot Captured Yet</h3>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

// Interface for the exposed methods from preload.ts
interface WindowWithElectron extends Window {
    myAPI: {
        send: (channel: string, data: any) => void;
    }
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

const screenshotDataUrl = ref<string | null>(null);

const captureScreen = async () => {
    if (window.myAPI && window.myAPI.send) {
        const dataurl = await window.myAPI.send('capture-right-view', null);
        screenshotDataUrl.value = dataurl
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

.screenshot-container {
    margin-top: 1rem;
    border: 1px solid #ccc;
    padding: 1rem;
}

.screenshot-image {
    max-width: 100%;
    height: auto;
}
</style>
