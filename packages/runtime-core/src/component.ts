import { proxyRefs, reactive } from '@my-vue/reactivity'
import { hasOwn, isFunction, ShapeFlags } from '@my-vue/shared'

export function createComponentInstance(vnode, parent) {
  const instance = {
    data: null,
    vnode,
    subTree: null,
    isMounted: false,
    update: null,
    props: {},
    attrs: {},
    slots: {},
    exposed: null,
    propsOptions: vnode.type.props,
    component: null,
    proxy: null, // 代理 props attrs data 让用户更方便访问
    setupState: {}, // setup函数返回的 state 对象
    parent,

    ctx: {} as any,
    provides: parent ? parent.provides : Object.create(null),
  }

  return instance
}

const publicProperty = {
  $attrs: instance => instance.attrs,
  $slots: instance => instance.slots,
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

const initSlots = (instance, children) => {
  if (instance.vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
    instance.slots = children
  } else {
    instance.slots = {}
  }
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

  initSlots(instance, vnode.children)

  instance.proxy = new Proxy(instance, handler)

  const { data = () => {}, render, setup } = vnode.type

  if (setup) {
    const setupContext = {
      // ...

      slots: instance.slots,
      attrs: instance.attrs,
      emit: (event, ...payload) => {
        const eventName = `on${event.slice(0, 1).toUpperCase()}${event.slice(1)}`
        const handler = instance.vnode.props[eventName]
        handler && handler(...payload)
      },
      expose: value => {
        instance.exposed = value
      },
    }

    setCurrentInsatance(instance)

    const setupResult = setup(instance.props, setupContext)
    unsetCurrentInstance()
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

export let currentInstance = null
export function getCurrentInstance() {
  return currentInstance
}
export function setCurrentInsatance(instance) {
  currentInstance = instance
}
export function unsetCurrentInstance() {
  currentInstance = null
}
