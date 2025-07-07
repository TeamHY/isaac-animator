import { createApp } from 'vue'
import './style.css'
import 'dockview-vue/dist/styles/dockview.css';
import App from './App.vue'

import PreviewPanel from "./components/PreviewPanel.vue";
import TimelinePanel from "./components/TimelinePanel.vue";
import AnimationListPanel from "./components/AnimationListPanel.vue";
import PropertiesPanel from "./components/PropertiesPanel.vue";

const app = createApp(App);
app.component('preview-panel', PreviewPanel);
app.component('timeline-panel', TimelinePanel);
app.component('animation-list-panel', AnimationListPanel);
app.component('properties-panel', PropertiesPanel);
app.mount('#app');
