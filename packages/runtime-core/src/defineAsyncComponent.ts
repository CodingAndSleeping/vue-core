import { ref } from '@my-vue/reactivity'
import { h } from './h'
import { isFunction } from '@my-vue/shared'

export function defineAsyncComponent(options) {
  if (isFunction(options)) {
    options = {
      loader: options,
    }
  }
  return {
    setup() {
      const { loader, errorComponent, loadingComponent, timeout, delay } = options
      const loaded = ref(false)
      const loading = ref(false)
      const error = ref(false)

      let loadingTimer = null

      if (delay) {
        loadingTimer = setTimeout(() => {
          loading.value = true
        }, delay)
      }

      let Comp = null

      loader()
        .then(res => {
          Comp = res
          loaded.value = true
        })
        .catch(err => {
          error.value = true
        })
        .finally(() => {
          loading.value = false
          clearTimeout(loadingTimer)
        })

      if (timeout) {
        setTimeout(() => {
          error.value = true
          throw new Error('Async component timed out')
        }, timeout)
      }

      const placeholder = h('div')

      return () => {
        if (loaded.value) {
          return h(Comp)
        } else if (error.value && errorComponent) {
          return h(errorComponent)
        } else if (loading.value && loadingComponent) {
          return h(loadingComponent)
        } else {
          return placeholder
        }
      }
    },
  }
}
