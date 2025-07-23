import type { DirectiveBinding } from 'vue'

export interface ClickOutsideElement extends HTMLElement {
  clickOutsideEvent?: (event: Event) => void
}

const clickOutside = {
  beforeMount(el: ClickOutsideElement, binding: DirectiveBinding) {
    // 定义点击事件处理函数
    el.clickOutsideEvent = function(event: Event) {
      // 检查点击的元素是否在目标元素内部
      if (!(el === event.target || el.contains(event.target as Node))) {
        // 如果点击在外部，执行回调函数
        if (typeof binding.value === 'function') {
          binding.value(event)
        }
      }
    }
    
    // 添加事件监听器
    document.addEventListener('click', el.clickOutsideEvent)
  },
  
  unmounted(el: ClickOutsideElement) {
    // 清理事件监听器
    if (el.clickOutsideEvent) {
      document.removeEventListener('click', el.clickOutsideEvent)
      delete el.clickOutsideEvent
    }
  }
}

export default clickOutside 