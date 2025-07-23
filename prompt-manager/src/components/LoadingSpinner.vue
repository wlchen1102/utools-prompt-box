<template>
  <div v-if="visible" class="loading-container" :class="containerClass">
    <div class="loading-content">
      <!-- 加载动画 -->
      <div class="spinner-wrapper">
        <div v-if="type === 'spinner'" class="spinner" :class="sizeClass">
          <div class="spinner-circle"></div>
        </div>
        
        <div v-else-if="type === 'dots'" class="dots-spinner" :class="sizeClass">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
        
        <div v-else-if="type === 'pulse'" class="pulse-spinner" :class="sizeClass">
          <div class="pulse-dot"></div>
        </div>
        
        <div v-else-if="type === 'bars'" class="bars-spinner" :class="sizeClass">
          <div class="bar"></div>
          <div class="bar"></div>
          <div class="bar"></div>
          <div class="bar"></div>
          <div class="bar"></div>
        </div>
      </div>
      
      <!-- 加载文字 -->
      <div v-if="text" class="loading-text" :class="textSizeClass">
        {{ text }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface LoadingSpinnerProps {
  visible?: boolean
  type?: 'spinner' | 'dots' | 'pulse' | 'bars'
  size?: 'small' | 'medium' | 'large'
  text?: string
  overlay?: boolean
  inline?: boolean
  color?: string
}

const props = withDefaults(defineProps<LoadingSpinnerProps>(), {
  visible: true,
  type: 'spinner',
  size: 'medium',
  text: '',
  overlay: false,
  inline: false,
  color: ''
})

const containerClass = computed(() => {
  return {
    'loading-overlay': props.overlay,
    'loading-inline': props.inline,
    'loading-block': !props.overlay && !props.inline
  }
})

const sizeClass = computed(() => {
  return `size-${props.size}`
})

const textSizeClass = computed(() => {
  const sizeMap = {
    small: 'text-sm',
    medium: 'text-md',
    large: 'text-lg'
  }
  return sizeMap[props.size]
})
</script>

<style scoped>
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  z-index: 999;
  backdrop-filter: blur(2px);
}

.loading-inline {
  display: inline-flex;
}

.loading-block {
  width: 100%;
  min-height: 120px;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.spinner-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 旋转加载器 */
.spinner {
  position: relative;
}

.spinner-circle {
  width: 100%;
  height: 100%;
  border: 3px solid #f0f0f0;
  border-top: 3px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner.size-small {
  width: 20px;
  height: 20px;
}

.spinner.size-medium {
  width: 32px;
  height: 32px;
}

.spinner.size-large {
  width: 48px;
  height: 48px;
}

/* 点状加载器 */
.dots-spinner {
  display: flex;
  gap: 4px;
}

.dots-spinner .dot {
  border-radius: 50%;
  background: var(--primary-color);
  animation: dotsBounce 1.4s ease-in-out infinite both;
}

.dots-spinner.size-small .dot {
  width: 6px;
  height: 6px;
}

.dots-spinner.size-medium .dot {
  width: 8px;
  height: 8px;
}

.dots-spinner.size-large .dot {
  width: 12px;
  height: 12px;
}

.dots-spinner .dot:nth-child(1) {
  animation-delay: -0.32s;
}

.dots-spinner .dot:nth-child(2) {
  animation-delay: -0.16s;
}

/* 脉冲加载器 */
.pulse-spinner {
  position: relative;
}

.pulse-dot {
  border-radius: 50%;
  background: var(--primary-color);
  animation: pulse 1.5s ease-in-out infinite;
}

.pulse-spinner.size-small .pulse-dot {
  width: 20px;
  height: 20px;
}

.pulse-spinner.size-medium .pulse-dot {
  width: 32px;
  height: 32px;
}

.pulse-spinner.size-large .pulse-dot {
  width: 48px;
  height: 48px;
}

/* 条形加载器 */
.bars-spinner {
  display: flex;
  align-items: flex-end;
  gap: 2px;
}

.bars-spinner .bar {
  background: var(--primary-color);
  animation: barsScale 1.2s ease-in-out infinite;
}

.bars-spinner.size-small .bar {
  width: 3px;
  height: 16px;
}

.bars-spinner.size-medium .bar {
  width: 4px;
  height: 24px;
}

.bars-spinner.size-large .bar {
  width: 6px;
  height: 36px;
}

.bars-spinner .bar:nth-child(1) {
  animation-delay: -1.2s;
}

.bars-spinner .bar:nth-child(2) {
  animation-delay: -1.1s;
}

.bars-spinner .bar:nth-child(3) {
  animation-delay: -1.0s;
}

.bars-spinner .bar:nth-child(4) {
  animation-delay: -0.9s;
}

.bars-spinner .bar:nth-child(5) {
  animation-delay: -0.8s;
}

/* 加载文字 */
.loading-text {
  color: var(--text-color-secondary);
  font-weight: 500;
  text-align: center;
}

.loading-text.text-sm {
  font-size: 12px;
}

.loading-text.text-md {
  font-size: 14px;
}

.loading-text.text-lg {
  font-size: 16px;
}

/* 动画定义 */
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes dotsBounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

@keyframes pulse {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}

@keyframes barsScale {
  0%, 40%, 100% {
    transform: scaleY(0.4);
  }
  20% {
    transform: scaleY(1);
  }
}

/* 暗色主题支持 */
@media (prefers-color-scheme: dark) {
  .loading-overlay {
    background: rgba(0, 0, 0, 0.8);
  }
}
</style> 