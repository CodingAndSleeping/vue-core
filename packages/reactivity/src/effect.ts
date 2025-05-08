export let activeEffect: ReactiveEffect // 当前的 effect

export function effect(fn, options?) {
  // 创建一个响应性函数，数据变化后可以重新执行

  const _effect = new ReactiveEffect(fn, () => {
    _effect.run()
  })

  //  先调用一次这个函数
  _effect.run()

  if (options) {
    // 覆盖 _effect 的属性
    Object.assign(_effect, options)
  }

  const runner = _effect.run.bind(_effect)
  runner.effect = _effect
  return runner
}

export class ReactiveEffect {
  _trackId = 0 // 用来记录当前 effect 执行了几次

  deps = [] // 依赖列表
  _depsIndex = 0 //  deps列表的索引

  _running = 0 // 是否正在运行  0表示没有运行

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

      // 每次执行函数前，将 _depsIndex 置为 0, _trackId 加 1
      // 目的是后续进比较
      this._depsIndex = 0
      this._trackId++
      // 标记正在运行
      this._running++

      return this.fn()
    } finally {
      // 标记不在运行
      this._running--

      if (activeEffect.deps.length > activeEffect._depsIndex) {
        for (let i = activeEffect._depsIndex; i < activeEffect.deps.length; i++) {
          activeEffect.deps[i].delete(activeEffect) // 删除多余的 dep
          if (activeEffect.deps[i].size === 0) {
            activeEffect.deps[i].cleanup() // 删除 key
          }
        }
        activeEffect.deps.length = activeEffect._depsIndex
      }
      // 函数执行完毕后恢复上一个激活的 effect
      activeEffect = lastEffect
    }
  }

  stop() {
    this.active = false
  }
}
