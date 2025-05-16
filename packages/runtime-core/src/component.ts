import { proxyRefs, reactive } from '@my-vue/reactivity'
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
    component: null,
    proxy: null, // 代理 props attrs data 让用户更方便访问
    setupState: {},
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
    const { data, props, setupState } = target
    if (data && hasOwn(data, key)) {
      return data[key]
    } else if (props && hasOwn(props, key)) {
      return props[key]
    } else if (setupState && hasOwn(setupState, key)) {
      return setupState[key]
    }

    const getter = publicProperty[key]
    if (getter) {
      return getter(target)
    }
  },
  set(target, key, value) {
    const { data, props, setupState } = target
    if (data && hasOwn(data, key)) {
      data[key] = value
    } else if (props && hasOwn(props, key)) {
      console.warn('props are readonly')
    } else if (setupState && hasOwn(setupState, key)) {
      setupState[key] = value
    }

    return true
  },
}

export function setupComponent(instance) {
  const { vnode } = instance
  // 根据 propsOptions 计算 props 和 attrs
  initProps(instance, vnode.props)

  instance.proxy = new Proxy(instance, handler)

  const { data = () => {}, render, setup } = vnode.type

  if (setup) {
    const setupContext = {}

    const setupResult = setup(instance.props, setupContext)

    if (isFunction(setupResult)) {
      instance.render = setupResult
    } else {
      instance.setupState = proxyRefs(setupResult)
    }
  }

  if (!isFunction(data)) {
    console.warn('data must be a function')
  } else {
    instance.data = reactive(data.call(instance.proxy))
  }

  if (!instance.render) {
    instance.render = render
  }
}
