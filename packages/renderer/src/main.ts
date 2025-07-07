import { createApp } from 'vue'
import './style.css'
import 'dockview-vue/dist/styles/dockview.css';
import App from './App.vue'

import PreviewPanel from "./components/PreviewPanel.vue";

const app = createApp(App);
app.component('preview-panel', PreviewPanel);
app.mount('#app');
