import { isObject } from '@my-vue/shared'
import { ReactiveFlags } from './contants'
import { mutableHandlers } from './baseHandler'

// 响应性对象缓存
const proxyMap = new WeakMap()

function createReactiveObject(target) {
  // 如果不是对象，直接返回
  if (!isObject(target)) {
    return target
  }

  // 判断这个对象是否是代理后的对象，如果是直接返回这个对象
  // 这里定义了一个标记，用来标记是否是响应性对象
  // 如果是响应性对象，就会到get方法里，返回一个 true
  if (target[ReactiveFlags.IS_REACTIVE]) {
    return target
  }

  // 先从缓存中取，存在直接返回
  const existProxy = proxyMap.get(target)
  if (existProxy) {
    return existProxy
  }

  // 创建代理对象
  let proxy = new Proxy(target, mutableHandlers)

  proxyMap.set(target, proxy)

  return proxy
}

export function reactive(target) {
  // 创建响应性对象
  return createReactiveObject(target)
}
