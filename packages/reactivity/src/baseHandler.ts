import { isObject } from '@my-vue/shared'
import { ReactiveFlags } from './contants'
import { trigger, track } from './dep'
import { reactive } from './reactive'

// 响应性对象处理器
export const mutableHandlers: ProxyHandler<any> = {
  get(target, key, receiver) {
    // 这里判断是否是响应性对象，如果是直接返回 true
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true
    }

    // 取值的时候依赖收集
    track(target, key)

    let res = Reflect.get(target, key, receiver)

    // 如果取到的值是对象，则返回一个响应性对象, 递归代理
    if (isObject(res)) {
      return reactive(res)
    }

    return res
  },

  set(target, key, value, receiver) {
    let oldValue = target[key]

    let result = Reflect.set(target, key, value, receiver)

    if (oldValue !== value) {
      // 触发依赖更新
      trigger(target, key, value, oldValue)
    }

    return result
  },
}
