import { activeEffect, ReactiveEffect } from './effect'

type TargetMap = WeakMap<any, Map<string | symbol, Map<ReactiveEffect, number>>>

const targetMap: TargetMap = new WeakMap() // 存放依赖的对象和 key 映射关系

// 抽取创建依赖 Map 的逻辑
function createDep(cleanup: () => void, key: string | symbol) {
  // 每个 key 身上 对应的 effect 用 map 来存储，早期是用的 set
  let dep = new Map() as any
  // 给 dep 身上添加一个 删除 的方法
  dep.cleanup = cleanup
  // 给 dep 身上添加一个 key 作为名字
  dep.name = key
  return dep
}

export function track(target: TargetMap, key: string | symbol) {
  // 如果当前没有激活的 effect，则不进行依赖收集
  if (!activeEffect) {
    return
  }

  let depsMap = targetMap.get(target)
  if (!depsMap) {
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }

  let dep = depsMap.get(key)
  if (!dep) {
    dep = createDep(() => depsMap.delete(key), key)
    depsMap.set(key, dep)
  }

  // 将当前的 effect 加入到 dep 里
  trackEffects(activeEffect, dep)
}

function trackEffects(effect: ReactiveEffect, dep: Map<ReactiveEffect, number>) {
  debugger
  // 这个函数每次执行都会将 effect的值 设置为当前 effect__trackId
  // 所以当比较 effect._trackId 和 dep.get(effect)的值时
  // 如果等于,说明在同一个effect函数运行期间 某个 key 第二次读取，则直接跟跳过
  if (dep.get(effect) === effect._trackId) {
    return
  }

  // 如果不等于 有两种情况
  // 1. 同一个 effect 函数中 读取了不同的 key 时
  // 将当前的 effect 对应的值 设置为 effect._trackId
  dep.set(effect, effect._trackId)
  // 2. 当重新调用 effect函数时，
  // 需要重新构建 depMap，每次调用 effect 函数时，effect._depsIndex 都从0开始
  // 依次从 effect的 deps 数组中取出对应的 dep 比较，如果不一致，则替换
  let oldDep = effect.deps[effect._depsIndex]
  // 如果不一致
  if (oldDep !== dep) {
    if (oldDep) {
      //旧的存在 就删除旧的
      oldDep.delete(effect)
      if (oldDep.size === 0) {
        oldDep.cleanup() // 删除 key
      }
    }
    // 替换新的 dep
    effect.deps[effect._depsIndex] = dep
    effect._depsIndex++
  } else {
    effect._depsIndex++
  }
}

export function trigger(target: TargetMap, key: string | symbol, newValue, oldValue) {
  const depsMap = targetMap.get(target) // 获取 对象对应的  Map
  if (!depsMap) {
    return
  }

  const dep = depsMap.get(key) // 获取 key 对应的 Map

  if (dep) {
    // 如果有 dep 说明有依赖，则触发依赖更新
    triggerEffects(dep)
  }
}

export function triggerEffects(dep) {
  for (const effect of dep.keys()) {
    if (effect._running) {
      return
    }
    if (effect.scheduler) {
      effect.scheduler()
    }
  }
}
