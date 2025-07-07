<script setup lang="ts">
import { ref, inject, watch, computed } from 'vue';
import type { AnimationState } from '../types/animation';
import type { Anm2Frame } from '../types/anm2';

// 전역 애니메이션 상태 주입
const animationState = inject<AnimationState>('animationState');

// 현재 프레임 데이터를 computed로 계산
const currentFrameData = computed<Anm2Frame | null>(() => {
  if (!animationState) return null;

  // 현재 프레임 업데이트
  if (animationState.renderer) {
    animationState.currentFrame = animationState.renderer.getCurrentFrame();
  }

  return animationState.getCurrentFrameData();
});

// 선택된 레이어 이름
const selectedLayerName = computed(() => {
  if (!animationState) return "레이어를 선택하세요";
  return animationState.getSelectedLayerName() || "레이어를 선택하세요";
});

// 선택된 레이어가 null인지 확인
const isSelectedLayerNull = computed(() => {
  if (!animationState || animationState.selectedLayerId === null) return false;

  const layerStates = animationState.renderer?.getCurrentLayerStates() || [];
  const selectedLayerState = layerStates.find((state: any) => state.layerId === animationState.selectedLayerId);

  return selectedLayerState?.isNull || false;
});

// 각 속성들을 computed로 정의하여 실시간 업데이트
const cropX = computed(() => currentFrameData.value?.xCrop?.toString() || '');
const cropY = computed(() => currentFrameData.value?.yCrop?.toString() || '');
const width = computed(() => currentFrameData.value?.width?.toString() || '');
const height = computed(() => currentFrameData.value?.height?.toString() || '');
const positionX = computed(() => currentFrameData.value?.xPosition || 0);
const positionY = computed(() => currentFrameData.value?.yPosition || 0);
const pivotX = computed(() => currentFrameData.value?.xPivot?.toString() || '');
const pivotY = computed(() => currentFrameData.value?.yPivot?.toString() || '');
const scaleX = computed(() => currentFrameData.value?.xScale || 100);
const scaleY = computed(() => currentFrameData.value?.yScale || 100);
const rotation = computed(() => currentFrameData.value?.rotation || 0);
const visible = computed(() => currentFrameData.value?.visible || false);
const interpolated = computed(() => currentFrameData.value?.interpolated || false);
const duration = computed(() => currentFrameData.value?.delay || 1);
const tintR = computed(() => currentFrameData.value?.redTint || 255);
const tintG = computed(() => currentFrameData.value?.greenTint || 255);
const tintB = computed(() => currentFrameData.value?.blueTint || 255);
const offsetR = computed(() => currentFrameData.value?.redOffset || 0);
const offsetG = computed(() => currentFrameData.value?.greenOffset || 0);
const offsetB = computed(() => currentFrameData.value?.blueOffset || 0);
const tintAlpha = computed(() => currentFrameData.value?.alphaTint || 255);

</script>

<template>
  <div class="properties-panel">
    <div class="panel-header">
      <div class="header-title">
        <span class="layer-name">{{ selectedLayerName }}</span>
        <span v-if="isSelectedLayerNull" class="layer-type-badge">(Null Layer)</span>
      </div>
      <div class="frame-info" v-if="animationState">
        프레임: {{ animationState.currentFrame + 1 }} / {{ animationState.renderer?.getTotalFrames() || 0 }}
      </div>
    </div>
    <div class="panel-content">
      <!-- Null 레이어가 아닌 경우에만 Crop, Width, Height, Pivot 표시 -->
      <div v-if="!isSelectedLayerNull" class="property-row">
        <div class="input-group">
          <label for="cropX">Crop X</label>
          <input id="cropX" type="text" :value="cropX" readonly>
        </div>
        <div class="input-group">
          <label for="cropY">Crop Y</label>
          <input id="cropY" type="text" :value="cropY" readonly>
        </div>
      </div>
      <div v-if="!isSelectedLayerNull" class="property-row">
        <div class="input-group">
          <label for="width">Width</label>
          <input id="width" type="text" :value="width" readonly>
        </div>
        <div class="input-group">
          <label for="height">Height</label>
          <input id="height" type="text" :value="height" readonly>
        </div>
      </div>
      <div class="property-row">
        <div class="input-group">
          <label for="positionX">Position X</label>
          <input id="positionX" type="number" :value="positionX" readonly>
        </div>
        <div class="input-group">
          <label for="positionY">Position Y</label>
          <input id="positionY" type="number" :value="positionY" readonly>
        </div>
      </div>
      <div v-if="!isSelectedLayerNull" class="property-row">
        <div class="input-group">
          <label for="pivotX">Pivot X</label>
          <input id="pivotX" type="text" :value="pivotX" readonly>
        </div>
        <div class="input-group">
          <label for="pivotY">Pivot Y</label>
          <input id="pivotY" type="text" :value="pivotY" readonly>
        </div>
      </div>
      <div class="property-row">
        <div class="input-group">
          <label for="scaleX">Scale X</label>
          <input id="scaleX" type="number" :value="scaleX" readonly>
        </div>
        <div class="input-group">
          <label for="scaleY">Scale Y</label>
          <input id="scaleY" type="number" :value="scaleY" readonly>
        </div>
      </div>
      <div class="property-row">
        <div class="input-group single">
          <label for="rotation">Rotation</label>
          <input id="rotation" type="number" :value="rotation" readonly>
        </div>
      </div>
      <div class="property-row checkboxes">
        <div class="input-group checkbox-group">
          <input id="visible" type="checkbox" :checked="visible" disabled>
          <label for="visible">Visible</label>
        </div>
        <div class="input-group checkbox-group">
          <input id="interpolated" type="checkbox" :checked="interpolated" disabled>
          <label for="interpolated">Interpolated</label>
        </div>
      </div>
       <div class="property-row">
        <div class="input-group single">
          <label for="duration">Duration</label>
          <input id="duration" type="number" :value="duration" readonly>
        </div>
      </div>
      <div class="property-row color-row">
        <div class="color-group">
          <label>Tint RGB</label>
          <div class="rgb-inputs">
            <div class="input-group">
              <label for="tintR">R:</label>
              <input id="tintR" type="number" :value="tintR" readonly>
            </div>
            <div class="input-group">
              <label for="tintG">G:</label>
              <input id="tintG" type="number" :value="tintG" readonly>
            </div>
            <div class="input-group">
              <label for="tintB">B:</label>
              <input id="tintB" type="number" :value="tintB" readonly>
            </div>
          </div>
        </div>
        <div class="color-group">
          <label>Offset RGB</label>
          <div class="rgb-inputs">
            <div class="input-group">
              <label for="offsetR">R:</label>
              <input id="offsetR" type="number" :value="offsetR" readonly>
            </div>
            <div class="input-group">
              <label for="offsetG">G:</label>
              <input id="offsetG" type="number" :value="offsetG" readonly>
            </div>
            <div class="input-group">
              <label for="offsetB">B:</label>
              <input id="offsetB" type="number" :value="offsetB" readonly>
            </div>
          </div>
        </div>
      </div>
      <div class="property-row">
        <div class="input-group single">
          <label for="tintAlpha">Tint Alpha</label>
          <input id="tintAlpha" type="number" :value="tintAlpha" readonly>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.properties-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #2a2a2a;
  color: #ffffff;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 12px;
  box-sizing: border-box;
}

.panel-header {
  padding: 8px 12px;
  background-color: #404040;
  border-bottom: 1px solid #555;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.layer-name {
  font-weight: bold;
  font-size: 12px;
  color: #ffffff;
}

.layer-type-badge {
  color: #FF9800;
  font-size: 10px;
  font-weight: normal;
  font-style: italic;
}

.frame-info {
  font-size: 11px;
  color: #cccccc;
}

.panel-content {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}

.property-row {
  display: flex;
  gap: 12px;
}

.property-row.checkboxes {
  align-items: center;
}

.property-row.color-row {
  flex-direction: column;
  gap: 8px;
}

.input-group {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 4px;
}

.input-group.single {
  flex: unset;
  width: 100%;
}

.input-group label {
  color: #cccccc;
  font-size: 11px;
}

.input-group input[type="text"],
.input-group input[type="number"] {
  background-color: #353535;
  color: #cccccc;
  border: 1px solid #555;
  border-radius: 3px;
  padding: 4px 6px;
  width: 100%;
  box-sizing: border-box;
  font-size: 11px;
}

.input-group input[readonly] {
  background-color: #2d2d2d;
  color: #888;
  cursor: not-allowed;
}

.input-group.checkbox-group {
  flex-direction: row;
  align-items: center;
  gap: 6px;
}

.input-group.checkbox-group label {
  margin-bottom: 0;
}

.input-group input[type="checkbox"]:disabled {
  cursor: not-allowed;
}

.color-group {
  border: 1px solid #555;
  padding: 8px;
  border-radius: 4px;
  background-color: #353535;
}

.color-group > label {
  display: block;
  text-align: center;
  margin-bottom: 6px;
  font-size: 11px;
  color: #cccccc;
}

.rgb-inputs {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rgb-inputs .input-group {
  flex-direction: row;
  align-items: center;
  gap: 6px;
}

.rgb-inputs .input-group label {
  margin-bottom: 0;
  width: 20px;
  font-size: 10px;
}

/* 스크롤바 스타일링 */
.panel-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-track {
  background: #2a2a2a;
}

.panel-content::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: #666;
}
</style>
