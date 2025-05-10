import { reactive } from './reactive'
import { activeEffect, trackEffects, triggerEffects } from './effect'
import { createDep } from './dep'
import { isObject } from '@my-vue/shared'

export function ref(value) {
  return createRef(value)
}

function createRef(value) {
  return new RefImpl(value)
}

class RefImpl {
  public __v_isRef = true // 标记是否是 ref 对象

  public _value // 存储 ref 的 value 值

  public dep // 用于收集依赖

  constructor(public rawValue) {
    // 如果 rawValue 是一个对象，将 rawValue 转为响应性对象
    this._value = convert(rawValue)
    this.dep = createDep(() => (this.dep = void 0))
  }

  get value() {
    // 收集依赖
    trackRefValue(this)

    return this._value
  }

  set value(newValue) {
    if (newValue !== this.rawValue) {
      this.rawValue = newValue
      this._value = newValue

      // 触发更新
      triggerRefValue(this)
    }
  }
}

class ObjectRefImpl {
  public __v_isRef = true // 标记是否是 ref 对象

  constructor(public object, public key) {}

  get value() {
    return this.object[this.key]
  }

  set value(newValue) {
    this.object[this.key] = newValue
  }
}

export function trackRefValue(ref) {
  if (activeEffect) {
    trackEffects(activeEffect, ref.dep)
  }
}
export function triggerRefValue(ref) {
  if (ref.dep) {
    triggerEffects(ref.dep)
  }
}

//  将一个变量转为响应性对象
export function convert(value) {
  return isObject(value) ? reactive(value) : value
}

export function isRef(value) {
  return !!value.__v_isRef
}

export function unRef(ref) {
  return isRef(ref) ? ref.value : ref
}

export function toRef(object, key) {
  return new ObjectRefImpl(object, key)
}

export function toRefs(object) {
  const res = {}

  // 遍历 object 的 key，将每个 key 转为 ref 对象
  for (const key in object) {
    res[key] = toRef(object, key)
  }

  return res
}

export function proxyRefs(objectWithRef) {
  return new Proxy(objectWithRef, {
    get(target, key, receiver) {
      let res = Reflect.get(target, key, receiver)
      return unRef(res)
    },

    set(target, key, value, receiver) {
      const oldValue = target[key]
      if (oldValue !== value) {
        if (isRef(oldValue)) {
          target[key].value = value
          return target[key]
        } else {
          return Reflect.set(target, key, value, receiver)
        }
      }
    },
  })
}
