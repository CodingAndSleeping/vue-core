import { reactive } from '@my-vue/reactivity'
import { hasOwn, isFunction } from '@my-vue/shared'

export function createComponentInstance(vnode) {
  // const { data = () => {}, render, props: propsOptions } = vnode.type
  // const state = reactive(data())

  const instance = {
    data: null,
    vnode,
    subTree: null,
    isMounted: false,
    update: null,
    props: {},
    attrs: {},
    propsOptions: vnode.type.props,
    components: null,
    proxy: null, // 代理 props attrs data 让用户更方便访问
  }

  return instance
}

const publicProperty = {
  $attrs: instance => instance.attrs,
}

const initProps = (instance, rawProps) => {
  const props = {}
  const attrs = {}

  const propsOptions = instance.propsOptions || {}
  if (rawProps) {
    for (const key in rawProps) {
      const value = rawProps[key]

      if (key in propsOptions) {
        props[key] = value
      } else {
        attrs[key] = value
      }
    }
  }

  instance.props = reactive(props)
  instance.attrs = attrs
}

const handler = {
  get(target, key) {
    const { data, props } = target
    if (data && hasOwn(data, key)) {
      return data[key]
    } else if (props && hasOwn(props, key)) {
      return props[key]
    }

    const getter = publicProperty[key]
    if (getter) {
      return getter(target)
    }
  },
  set(target, key, value) {
    const { data, props } = target
    if (data && hasOwn(data, key)) {
      data[key] = value
    } else if (props && hasOwn(props, key)) {
      console.warn('props are readonly')
    }

    return true
  },
}

export function setupComponent(instance) {
  const { vnode } = instance
  // 根据 propsOptions 计算 props 和 attrs
  initProps(instance, vnode.props)

  instance.proxy = new Proxy(instance, handler)

  const { data, render } = vnode.type

  if (!isFunction(data)) return console.warn('data must be a function')

  instance.data = reactive(data.call(instance.proxy))

  instance.render = render
}
