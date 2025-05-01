export let activeEffect: ReactiveEffect // 当前的 effect

const targetMap = new WeakMap() // 存放依赖的对象和 key 映射关系

export function createDep(cleanup, key) {
  let dep = new Map() as any
  dep.cleanup = cleanup
  dep.name = key
  return dep
}

export class ReactiveEffect {
  _trackId = 0 // 用来记录当前effect 执行了几次

  deps = [] // 依赖列表
  _depsLength = 0 // 依赖列表长度

  public active = true // 是否激活

  constructor(public fn, public scheduler) {}

  // 运行函数 fn
  run() {
    if (!this.active) {
      return this.fn()
    }
    // 保存上一个激活的 effect  主要为了解决嵌套 effect 的问题
    let lastEffect = activeEffect
    try {
      activeEffect = this
      return this.fn()
    } finally {
      // 函数执行完毕后恢复上一个激活的 effect
      activeEffect = lastEffect
    }
  }

  stop() {
    this.active = false
  }
}

export function effect(fn, options?) {
  // 创建一个响应性函数，数据变化后可以重新执行

  const _effect = new ReactiveEffect(fn, () => {
    _effect.run()
  })

  _effect.run()

  return _effect
}

function trackEffects(effect, dep) {
  dep.set(effect, effect._trackId)
  effect.deps[effect._depsLength++] = dep
}

export function track(target, key) {
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

export function triggerEffects(dep) {
  for (const effect of dep.keys()) {
    if (effect.scheduler) {
      effect.scheduler()
    }
  }
}

export function trigger(target, key, newValue, oldValue) {
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
