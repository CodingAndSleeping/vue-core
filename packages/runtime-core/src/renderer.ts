import { ShapeFlags } from '@my-vue/shared'

export function createRenderer(options) {
  const {
    insert: hostInsert,
    remove: hostRemove,
    createElement: hostCreateElement,
    createText: hostCreateText,
    setText: hostSetText,
    setElementText: hostSetElementText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    patchProp: hostPatchProp,
  } = options

  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      patch(null, children[i], container)
    }
  }

  const mountElement = (vnode, container) => {
    const { type, children, props, shapeFlag } = vnode

    const ele = hostCreateElement(type)

    if (props) {
      for (const key in props) {
        hostPatchProp(ele, key, null, props[key])
      }
    }

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(ele, children)
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, ele)
    }

    hostInsert(ele, container)
  }

  const patch = (n1, n2, container) => {
    // 两次的虚拟节点是相同的 直接跳过
    if (n1 === n2) {
      return
    }

    if (n1 === null) {
      mountElement(n2, container)
    }
  }

  // render 函数 将虚拟节点 vnode 渲染到 container 容器中
  const render = (vnode, container) => {
    patch(container._vnode || null, vnode, container)

    container._vnode = vnode
  }

  return { render }
}
