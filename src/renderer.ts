import { createApp } from "vue";
import App from "./App.vue";
import "./index.css";

createApp(App).mount("#app");

console.log(
  '👋 This message is being logged by "renderer.ts", included via Vite'
);
