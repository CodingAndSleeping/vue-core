import { isArray, isObject, isString, ShapeFlags } from '@my-vue/shared'

export function createVnode(type, props?, children?) {
  const shapeFlag = isString(type) ? ShapeFlags.ELEMENT : isObject(type) ? ShapeFlags.STATEFUL_COMPONENT : 0

  const vnode = {
    __v_isVnode: true, // 标记为虚拟节点
    type, // 节点类型
    props, // 节点属性
    children, // 子节点
    key: props && props.key, // diff算法需要用到的 key
    el: null, // 虚拟节点对应的真实 dom 元素
    shapeFlag, // 子节点类型标识
  }

  if (children) {
    if (isArray(children)) {
      // 如果是数组，就与 ARRAY_CHILDREN 进行 或运算
      vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN
    } else if (isObject(children)) {
      vnode.shapeFlag |= ShapeFlags.SLOTS_CHILDREN
    } else {
      // 如果不是数组，就当作文本节点来处理，先转字符串 然后与 TEXT_CHILDREN 进行 或运算
      children = String(children)
      vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN
    }
  }

  return vnode
}

export const Text = Symbol('Text')
export const Fragment = Symbol('Fragment')

export function isVnode(value) {
  return value && value.__v_isVnode
}

export function isSameVnode(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key
}
