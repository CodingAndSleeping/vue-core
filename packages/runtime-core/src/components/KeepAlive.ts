import { ShapeFlags } from '@my-vue/shared'
import { onMounted, onUpdated } from '../apiLifecycle'
import { getCurrentInstance } from '../component'

export const KeepAlive = {
  __isKeepAlive: true,
  props: {
    max: Number,
  },
  setup(props, { slots }) {
    const { max } = props

    const keys = new Set()
    const cache = new Map()

    let pendingCacheKey = null

    const instance = getCurrentInstance()

    const { move, createElement, unmount } = instance.ctx.renderer

    const reset = vnode => {
      console.log(vnode)
      let shapeFlag = vnode.shapeFlag
      if (shapeFlag & ShapeFlags.COMPONENT_KEPT_ALIVE) {
        shapeFlag -= ShapeFlags.COMPONENT_KEPT_ALIVE
      }
      if (shapeFlag & ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE) {
        shapeFlag -= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE
      }
      vnode.shapeFlag = shapeFlag
    }

    const purneCacheEntry = key => {
      keys.delete(key)
      const cached = cache.get(key)

      if (cached) {
        reset(cached)
        unmount(cached)
        cache.delete(key)
      }
    }
    instance.ctx.activate = (vnode, container, anchor) => {
      move(vnode, container, anchor)
    }

    const storageContent = createElement('div') // 临时的div
    instance.ctx.deactivate = vnode => {
      move(vnode, storageContent, null)
    }

    const cacheSubTree = () => {
      cache.set(pendingCacheKey, instance.subTree)
    }

    onMounted(cacheSubTree)

    onUpdated(cacheSubTree)

    return () => {
      const vnode = slots.default()

      const component = vnode.type

      pendingCacheKey = vnode.key === null ? component : vnode.key

      const cacheVNode = cache.get(pendingCacheKey)

      if (cacheVNode) {
        vnode.component = cacheVNode.component
        vnode.shapeFlag |= ShapeFlags.COMPONENT_KEPT_ALIVE
        keys.delete(pendingCacheKey)
        keys.add(pendingCacheKey)
      } else {
        keys.add(pendingCacheKey)

        if (max && keys.size > max) {
          purneCacheEntry(keys.values().next().value)
        }
      }

      // 这个组件不需要真的卸载，放到临时的dom中
      vnode.shapeFlag |= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE

      return vnode
    }
  },
}

export const isKeepAlive = value => value && value.__isKeepAlive
