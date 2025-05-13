import { ShapeFlags } from '@my-vue/shared'
import { isSameVnode } from './vnode'

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

    const el = hostCreateElement(type)
    vnode.el = el

    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key])
      }
    }

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, children)
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el)
    }

    hostInsert(el, container)
  }

  const unmount = vnode => {
    hostRemove(vnode.el)
  }
  // 对元素的处理
  const processElement = (n1, n2, container) => {
    if (n1 === null) {
      mountElement(n2, container)
    } else {
      patchElement(n1, n2, container)
    }
  }

  // 比较 新旧节点的属性
  const patchProps = (oldProps, newProps, el) => {
    for (const key in newProps) {
      hostPatchProp(el, key, oldProps[key], newProps[key])
    }

    for (const key in oldProps) {
      if (!newProps.hasOwnProperty(key)) {
        hostPatchProp(el, key, oldProps[key], null)
      }
    }
  }

  const unmountChildren = children => {
    for (let i = 0; i < children.length; i++) {
      let child = children[i]
      unmount(child)
    }
  }

  // 比较 新旧节点的子节点
  const patchChildren = (n1, n2, el) => {
    const c1 = n1.children
    const c2 = n2.children

    const prevShapeFlag = n1.shapeFlag
    const shapeFlag = n2.shapeFlag

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(c1) // 旧的是数组的话 移除旧的
      }

      // 旧的不是数组，也就是文本，判断一下新旧相不相等 不相等直接替换
      if (c1 !== c2) {
        hostSetElementText(el, c2)
      }
    } else {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 新旧都是数组  diff 算法
        } else {
          // 旧的是数组，新的不是数组也不是文本，也就是空，就移除旧的
          unmountChildren(c1)
        }
      } else {
        // 旧的是文本，就把旧的清空
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          hostSetElementText(el, '')
        }

        // 新的如果是数组，就添加新的
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2, el)
        }
      }
    }
  }

  // 比较新旧节点
  const patchElement = (n1, n2, container) => {
    // 比较节点 可以复用 dom
    n2.el = n1.el
    let el = n2.el

    let oldProps = n1.props || {}
    let newProps = n2.props || {}

    patchProps(oldProps, newProps, el)

    patchChildren(n1, n2, el)
  }

  const patch = (n1, n2, container) => {
    // 两次的虚拟节点是相同的 直接跳过
    if (n1 === n2) {
      return
    }

    processElement(n1, n2, container)
  }

  // render 函数 将虚拟节点 vnode 渲染到 container 容器中
  const render = (vnode, container) => {
    if (vnode === null && container._vnode) {
      unmount(container._vnode)
    }

    patch(container._vnode || null, vnode, container)

    container._vnode = vnode
  }

  return { render }
}
