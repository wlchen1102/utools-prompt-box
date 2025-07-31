<template>
  <n-modal
    :show="visible"
    preset="dialog"
    :title="title"
    :positive-text="positiveText"
    :negative-text="negativeText"
    :positive-button-props="{ type: 'error' }"
    :negative-button-props="{ type: 'default' }"
    @positive-click="handleConfirm"
    @negative-click="handleCancel"
    @close="handleCancel"
  >
    <div class="confirm-content">
      <div class="confirm-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
      </div>
      <div class="confirm-message">
        {{ message }}
      </div>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import { NModal } from 'naive-ui'

interface Props {
  visible: boolean
  title?: string
  message: string
  positiveText?: string
  negativeText?: string
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  title: '确认操作',
  positiveText: '确认',
  negativeText: '取消'
})

const emit = defineEmits<Emits>()

const handleConfirm = () => {
  emit('confirm')
  emit('update:visible', false)
}

const handleCancel = () => {
  emit('cancel')
  emit('update:visible', false)
}
</script>

<style scoped>
.confirm-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
  text-align: center;
}

.confirm-icon {
  color: #f56565;
  margin-bottom: 16px;
}

.confirm-message {
  font-size: 16px;
  line-height: 1.5;
  color: var(--text-color);
}
</style> 