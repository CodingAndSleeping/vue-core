import { isReactive, isRef, ReactiveEffect } from '@my-vue/reactivity'
import { isFunction, isObject } from '@my-vue/shared'

export function watch(source, cb: Function, options = {} as any) {
  return doWatch(source, cb, options)
}

export function watchEffect(getter: Function, options = {} as any) {
  return doWatch(getter, undefined, options)
}

function doWatch(source, cb: Function, { deep = false, immidiate }) {
  const reactiveGetter = source => traverse(source, deep === false ? 1 : void 0)

  let getter

  if (isReactive(source)) {
    // 如果是响应性对象，循环遍历每个 key 都会触发 getter 函数， 进而出发依赖收集
    getter = () => reactiveGetter(source)
  } else if (isRef(source)) {
    // 如果是 ref 对象，获取 value 值， 也会触发依赖收集
    getter = () => source.value
  } else if (isFunction(source)) {
    // 如果是函数，直接赋值给 getter
    getter = source
  }

  let oldValue

  const job = () => {
    const newValue = effect.run()
    cb && cb(newValue, oldValue)
    oldValue = newValue
  }

  const effect = new ReactiveEffect(getter, job)
  oldValue = effect.run()

  // 立即执行一次回调
  if (immidiate) {
    cb && cb(oldValue, undefined)
  }

  const unwatch = () => {
    effect.stop()
  }

  return unwatch
}

// 遍历对象的每个 key 就会触发 这个对象的 getter 函数
function traverse(source, depth, currentDepth = 0, seen = new Set()) {
  if (!isObject(source)) {
    return source
  }

  // 控制遍历深度
  if (depth) {
    if (currentDepth >= depth) {
      return source
    }
    currentDepth++
  }

  // 防止循环遍历
  if (seen.has(source)) {
    return source
  }
  seen.add(source)

  for (const key in source) {
    traverse(source[key], depth, currentDepth, seen)
  }

  return source
}
