import { isFunction } from '@my-vue/shared'
import { ReactiveEffect } from './effect'
import { createDep } from './dep'
import { trackRefValue, triggerRefValue } from './ref'

export function computed(getterOrOptions) {
  const onlyGetter = isFunction(getterOrOptions)

  let getter
  let setter

  if (onlyGetter) {
    getter = getterOrOptions
    setter = () => {}
  } else {
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }

  return new ComputedRefImpl(getter, setter)
}

class ComputedRefImpl {
  public _value

  public _effect: ReactiveEffect

  public _dirty = true // 标记当前的计算属性是否是脏的，如果是脏的，需要重新计算

  public dep

  constructor(public getter, public setter) {
    this.dep = createDep(() => (this.dep = void 0))

    this._effect = new ReactiveEffect(
      () => getter(this._value),
      () => {
        // compoted 本身是一个 effect 函数，当它依赖的值发生变化时，就会触发这个 scheduler
        // 如果这个值是不脏的，触发更新需要将值变为脏值
        // 目的是为了让依赖这个计算属性的 effect 函数在执行期间访问计算属性时，重新计算获取新的值
        if (!this._dirty) {
          this._dirty = true
        }

        // 计算属性的所依赖的值发生变化，那么依赖了计算属性的 effect 函数的需要重新执行
        triggerRefValue(this)
      }
    )
  }

  get value() {
    // 这里收集的是 effect 与 计算属性的依赖关系
    trackRefValue(this)

    // 如果 effect 身上的 dirty 属性是 true，说明计算属性的值需要重新计算
    if (this._dirty) {
      // 将 dirty 置为 false
      this._dirty = false

      // 调 run 方法 相当于 调 getter 函数  ，重新计算属性的值
      // run方法执行期间 会让 getter 函数 与 计算属性所依赖的值 建立依赖关系
      // 并将 计算属性所依赖的值 标记为脏值
      this._value = this._effect.run()
    }

    // 返回 _value
    return this._value
  }

  set value(newValue) {
    this.setter(newValue)
  }
}
