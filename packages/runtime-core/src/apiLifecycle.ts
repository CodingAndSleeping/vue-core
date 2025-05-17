import { currentInstance, setCurrentInsatance, unsetCurrentInstance } from './component'

export const enum Lifecycle {
  BEFORE_MOUNT = 'bm',
  MOUNTED = 'm',
  BEFORE_UPDATE = 'bu',
  UPDATED = 'u',
  BEFORE_UNMOUNT = 'bum',
  UNMOUNTED = 'um',
}

function createHook(type) {
  return (hook, target = currentInstance) => {
    if (target) {
      const hooks = target[type] || (target[type] = [])

      const wrapHook = () => {
        setCurrentInsatance(target)

        hook.call(target)

        unsetCurrentInstance()
      }

      hooks.push(wrapHook)
    }
  }
}

export const onBeforeMount = createHook(Lifecycle.BEFORE_MOUNT)
export const onMounted = createHook(Lifecycle.MOUNTED)
export const onBeforeUpdate = createHook(Lifecycle.BEFORE_UPDATE)
export const onUpdated = createHook(Lifecycle.UPDATED)
export const onBeforeUnmount = createHook(Lifecycle.BEFORE_UNMOUNT)
export const onUnmounted = createHook(Lifecycle.UNMOUNTED)
export function invokeArray(fns) {
  for (let i = 0; i < fns.length; i++) {
    fns[i]()
  }
}
