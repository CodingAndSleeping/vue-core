import { ReactiveFlags } from './contants'
import { activeEffect, trigger } from './effect'
import { track } from './effect'

// 响应性对象处理器
export const mutableHandlers: ProxyHandler<any> = {
  get(target, key, receiver) {
    // 这里判断是否是响应性对象，如果是直接返回 true
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true
    }

    // 取值的时候依赖收集
    track(target, key)

    return Reflect.get(target, key, receiver)
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
