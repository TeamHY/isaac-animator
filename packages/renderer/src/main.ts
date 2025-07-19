import { createApp } from 'vue'
import './style.css'
import 'dockview-vue/dist/styles/dockview.css';
import App from './App.vue'

import PreviewPanel from "./components/PreviewPanel.vue";
import TimelinePanel from "./components/TimelinePanel.vue";
import PropertiesPanel from "./components/PropertiesPanel.vue";
import ProjectPanel from "./components/ProjectPanel.vue";
import SpritesheetViewerPanel from "./components/SpritesheetViewerPanel.vue";

const app = createApp(App);
app.component('preview-panel', PreviewPanel);
app.component('timeline-panel', TimelinePanel);
app.component('properties-panel', PropertiesPanel);
app.component('project-panel', ProjectPanel);
app.component('spritesheet-viewer-panel', SpritesheetViewerPanel);
app.mount('#app');
