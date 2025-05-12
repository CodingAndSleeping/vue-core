import { isArray, isObject } from '@my-vue/shared'
import { createVnode, isVnode } from './vnode'

export function h(type, propsOrChildren?, children?) {
  const l = arguments.length

  // 如果有一个参数
  if (l === 1) {
    return createVnode(type)
  }

  // 如果只有两个参数
  if (l === 2) {
    // 如果第二个参数是一个对象，但不是数组
    if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
      // 如果第二个参数是一个虚拟节点，就作为  children
      if (isVnode(propsOrChildren)) {
        return createVnode(type, null, [propsOrChildren])
      }
      // 否则就作为 props
      return createVnode(type, propsOrChildren)
    }

    // 否则第二个参数是 数组 或 文本
    return createVnode(type, null, propsOrChildren)
  }

  // 如果有三个参数
  if (l === 3) {
    if (isVnode(children)) {
      return createVnode(type, propsOrChildren, [children])
    }
    return createVnode(type, propsOrChildren, children)
  }

  if (l > 3) {
    children = Array.from(arguments).slice(2)
    return createVnode(type, propsOrChildren, children)
  }
}
