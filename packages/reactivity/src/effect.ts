import { extend } from '@my-vue/shared'
import { createDep } from './dep'

export let activeEffect: ReactiveEffect // 当前的 effect

type TargetMap = WeakMap<any, Map<string | symbol, Map<ReactiveEffect, number>>>

const targetMap: TargetMap = new WeakMap() // 存放依赖的对象和 key 映射关系

export function postCleanEffect(effect) {
  if (effect.deps.length > effect._depsLength) {
    for (let i = effect._depsLength; i < effect.deps.length; i++) {
      effect.deps[i].delete(effect) // 删除多余的 dep
      if (effect.deps[i].size === 0) {
        effect.deps[i].cleanup() // 删除 key
      }
    }
    effect.deps.length = effect._depsLength
  }
}

export function effect(fn, options?) {
  // 创建一个响应性函数，数据变化后可以重新执行

  const _effect = new ReactiveEffect(fn, () => {
    _effect.run()
  })

  //  先调用一次这个函数
  _effect.run()

  if (options) {
    // 覆盖 _effect 的属性
    extend(_effect, options)
  }

  const runner = _effect.run.bind(_effect)
  runner.effect = _effect
  return runner
}

export class ReactiveEffect {
  public _trackId = 0 // 用来记录当前 effect 执行了几次

  public deps = [] // 依赖列表
  public _depsLength = 0 //  deps列表的索引

  public _running = 0 // 是否正在运行  0表示没有运行

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

      // 每次执行函数前，将 _depsLength 置为 0, _trackId 加 1
      // 目的是后续进比较
      this._depsLength = 0
      this._trackId++
      // 标记正在运行
      this._running++

      return this.fn()
    } finally {
      // 标记不在运行
      this._running--

      postCleanEffect(this)

      // 函数执行完毕后恢复上一个激活的 effect
      activeEffect = lastEffect
    }
  }

  stop() {
    this.active = false
    this._depsLength = 0
    postCleanEffect(this)
  }
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
    dep = createDep(() => depsMap.delete(key))
    depsMap.set(key, dep)
  }

  // 将当前的 effect 加入到 dep 里
  trackEffects(activeEffect, dep)
}

export function trackEffects(effect: ReactiveEffect, dep: Map<ReactiveEffect, number>) {
  // 判断 dep 中是否已经有了当前的 effect， 有直接返回，不再收集
  if (dep.get(effect) === effect._trackId) {
    return
  }

  // 将当前的 effect 对应的值 设置为 effect._trackId
  dep.set(effect, effect._trackId)

  // 依次从 effect的 deps 数组中取出对应的 dep 比较，如果不一致，则替换
  let oldDep = effect.deps[effect._depsLength]
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
    effect.deps[effect._depsLength] = dep
    effect._depsLength++
  } else {
    effect._depsLength++
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
