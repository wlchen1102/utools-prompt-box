<template>
  <div v-if="visible" class="dialog-overlay" @click="handleOverlayClick">
    <div class="dialog-container" @click.stop>
      <div class="dialog-header">
        <h3 class="dialog-title">{{ title }}</h3>
        <button class="dialog-close" @click="cancel">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <div class="dialog-content">
        <div v-if="icon" class="dialog-icon" :class="iconType">
          <svg v-if="iconType === 'warning'" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <svg v-else-if="iconType === 'danger'" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
          <svg v-else-if="iconType === 'info'" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        </div>
        
        <div class="dialog-message">
          <p v-if="typeof message === 'string'" class="message-text">{{ message }}</p>
          <div v-else v-html="message"></div>
        </div>
      </div>
      
      <div class="dialog-footer">
        <button 
          class="btn btn-secondary" 
          @click="cancel"
          :disabled="loading"
        >
          {{ cancelText }}
        </button>
        <button 
          class="btn btn-primary" 
          :class="{ 'btn-danger': type === 'danger' }"
          @click="confirm"
          :disabled="loading"
        >
          <svg v-if="loading" class="btn-spinner" width="16" height="16" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
            <path d="M12 2 A 10 10 0 0 1 22 12" fill="none" stroke="currentColor" stroke-width="2"/>
          </svg>
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface ConfirmDialogProps {
  visible?: boolean
  title?: string
  message?: string
  type?: 'info' | 'warning' | 'danger'
  icon?: boolean
  confirmText?: string
  cancelText?: string
  loading?: boolean
  closeOnOverlay?: boolean
}

const props = withDefaults(defineProps<ConfirmDialogProps>(), {
  visible: false,
  title: '确认操作',
  message: '您确定要执行此操作吗？',
  type: 'info',
  icon: true,
  confirmText: '确认',
  cancelText: '取消',
  loading: false,
  closeOnOverlay: true
})

const emit = defineEmits<{
  confirm: []
  cancel: []
  close: []
}>()

const iconType = computed(() => props.type)

const confirm = () => {
  if (!props.loading) {
    emit('confirm')
  }
}

const cancel = () => {
  if (!props.loading) {
    emit('cancel')
    emit('close')
  }
}

const handleOverlayClick = () => {
  if (props.closeOnOverlay && !props.loading) {
    cancel()
  }
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.dialog-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  max-width: 480px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  animation: dialogSlideIn 0.3s ease-out;
}

@keyframes dialogSlideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--border-color);
}

.dialog-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.dialog-close {
  background: none;
  border: none;
  color: var(--text-color-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.dialog-close:hover {
  background: var(--hover-background);
  color: var(--text-color);
}

.dialog-content {
  padding: 24px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.dialog-icon {
  flex-shrink: 0;
}

.dialog-icon.info {
  color: #2196f3;
}

.dialog-icon.warning {
  color: #ff9800;
}

.dialog-icon.danger {
  color: #f44336;
}

.dialog-message {
  flex: 1;
}

.message-text {
  font-size: 16px;
  line-height: 1.6;
  color: var(--text-color);
  margin: 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px 24px;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 80px;
  justify-content: center;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f5f5f5;
  color: var(--text-color);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover:not(:disabled) {
  background: #e0e0e0;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #00a555;
}

.btn-danger {
  background: #f44336;
}

.btn-danger:hover:not(:disabled) {
  background: #d32f2f;
}

.btn-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dialog-container {
    width: 95%;
    margin: 0 auto;
  }
  
  .dialog-content {
    padding: 20px;
    flex-direction: column;
    text-align: center;
  }
  
  .dialog-footer {
    flex-direction: column-reverse;
    gap: 8px;
  }
  
  .btn {
    width: 100%;
  }
}
</style> 