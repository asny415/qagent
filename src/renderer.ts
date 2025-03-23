import { createApp } from "vue";
import App from "./App.vue";
import "./index.css";
import "./cron";

if (window.myAPI) {
  window.myAPI.on("set-left-view-bounds", (event, bounds) => {
    //update view size here.
    const leftViewEle = document.getElementById("app");
    if (leftViewEle) {
      leftViewEle.style.width = `${bounds.width}px`;
      leftViewEle.style.height = `${bounds.height}px`;
      leftViewEle.style.overflow = "hidden"; // Add overflow hidden to prevent content overflow
    } else {
      console.error("left-view element not found.");
    }
  });
} else {
  console.error("myAPI is not available in the window object.");
}

createApp(App).mount("#app");

console.log(
  '👋 This message is being logged by "renderer.ts", included via Vite'
);
