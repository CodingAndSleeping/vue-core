import { isArray, isFunction, ShapeFlags } from '@my-vue/shared'
import { Fragment, isSameVnode, normalizeVnode, Text } from './vnode'
import getSequence from './getSequence'
import { isRef, ReactiveEffect } from '@my-vue/reactivity'
import { queueJob } from './scheduler'
import { createComponentInstance, setupComponent } from './component'
import { invokeArray } from './apiLifecycle'
import { isKeepAlive } from '@my-vue/runtime-dom'

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

  const mountChildren = (children, container, parentComponent) => {
    for (let i = 0; i < children.length; i++) {
      children[i] = normalizeVnode(children[i])
      patch(null, children[i], container, null, parentComponent)
    }
  }

  const mountElement = (vnode, container, anchor, parentComponent) => {
    const { type, children, props, shapeFlag, transition } = vnode

    const el = (vnode.el = hostCreateElement(type))

    if (props) {
      for (const key in props) {
        if (key !== 'ref') {
          hostPatchProp(el, key, null, props[key])
        }
      }
    }

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, children)
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el, parentComponent)
    }

    if (transition) {
      transition.beforeEnter(el)
    }

    hostInsert(el, container, anchor)

    if (transition) {
      transition.enter(el)
    }
  }

  const unmount = (vnode, parentComponent) => {
    const { shapeFlag, transition, el } = vnode

    const performLeave = () => {
      hostRemove(el)
    }

    if (shapeFlag & ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE) {
      parentComponent.ctx.deactivate(vnode)
    } else if (vnode.type === Fragment) {
      unmountChildren(vnode.children, parentComponent)
    } else if (shapeFlag & ShapeFlags.COMPONENT) {
      const { bum, um } = vnode.component
      if (bum) {
        invokeArray(bum)
      }
      unmount(vnode.component.subTree, vnode.component)
      if (um) {
        invokeArray(um)
      }
    } else if (shapeFlag & ShapeFlags.TELEPORT) {
      vnode.type.remove(vnode, unmountChildren)
    } else {
      if (transition) {
        transition.leave(el, performLeave)
      } else {
        performLeave()
      }
    }
  }

  const unmountChildren = (children, parentComponent) => {
    for (let i = 0; i < children.length; i++) {
      let child = children[i]
      unmount(child, parentComponent)
    }
  }

  // 比较 两个数组子节点的差异 diff
  const patchKeyedChildren = (c1, c2, el, parentComponent) => {
    let i = 0

    let e1 = c1.length - 1 // 旧的最后一个索引
    let e2 = c2.length - 1 // 新的最后一个索引

    // 任何一方循环结束就终止
    while (i <= e1 && i <= e2) {
      const n1 = c1[i]
      const n2 = c2[i]

      if (isSameVnode(n1, n2)) {
        patch(n1, n2, el)
      } else {
        break
      }

      i++
    }

    while (i <= e1 && i <= e2) {
      const n1 = c1[e1]
      const n2 = c2[e2]

      if (isSameVnode(n1, n2)) {
        patch(n1, n2, el)
      } else {
        break
      }

      e1--
      e2--
    }

    if (i > e1) {
      // 新的多
      if (i <= e2) {
        let nextPos = e2 + 1
        let anchor = c2[nextPos]?.el
        while (i <= e2) {
          patch(null, c2[i], el, anchor)
          i++
        }
      }
    } else if (i > e2) {
      // 旧的多
      if (i <= e1) {
        while (i <= e1) {
          unmount(c1[i], parentComponent)
          i++
        }
      }
    } else {
      let s1 = i
      let s2 = i

      const keyToNewIndexMap = new Map() // key 和 新索引的映射
      // 调整顺序
      const toBePatched = e2 - s2 + 1

      let newIndexToOldMapIndex = new Array(toBePatched).fill(0) // 新索引和旧索引的映射

      for (let i = s2; i < e2; i++) {
        const vnode = c2[i]
        keyToNewIndexMap.set(vnode.key, i)
      }

      for (let i = s1; i <= e1; i++) {
        const vnode = c1[i]
        const key = vnode.key
        const newIndex = keyToNewIndexMap.get(key)
        if (newIndex === undefined) {
          unmount(vnode, parentComponent)
        } else {
          newIndexToOldMapIndex[newIndex - s2] = i + 1
          patch(vnode, c2[newIndex], el)
        }
      }

      let increasingSeq = getSequence(newIndexToOldMapIndex)
      let j = increasingSeq.length - 1
      for (let i = toBePatched - 1; i >= 0; i--) {
        let newIndex = s2 + i
        const anchor = c2[newIndex + 1]?.el

        if (c2[newIndex].el) {
          patch(null, c2[newIndex], el, anchor)
        } else {
          if (i === increasingSeq[j]) {
            j--
          } else {
            hostInsert(c2[newIndex].el, el, anchor)
          }
        }
      }
    }
  }

  // 比较 新旧节点的子节点
  const patchChildren = (n1, n2, el, parentComponent) => {
    const c1 = n1.children
    const c2 = isArray(n2.children) ? n2.children.map(child => normalizeVnode(child)) : n2.children

    const prevShapeFlag = n1.shapeFlag
    const shapeFlag = n2.shapeFlag

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(c1, parentComponent) // 旧的是数组的话 移除旧的
      }

      // 旧的不是数组，也就是文本，判断一下新旧相不相等 不相等直接替换
      if (c1 !== c2) {
        hostSetElementText(el, c2)
      }
    } else {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 新旧都是数组  diff 算法
          patchKeyedChildren(c1, c2, el, parentComponent)
        } else {
          // 旧的是数组，新的不是数组也不是文本，也就是空，就移除旧的
          unmountChildren(c1, parentComponent)
        }
      } else {
        // 旧的是文本，就把旧的清空
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          hostSetElementText(el, '')
        }

        // 新的如果是数组，就添加新的
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2, el, parentComponent)
        }
      }
    }
  }

  // 比较 新旧节点的属性
  const patchProps = (oldProps, newProps, el) => {
    for (const key in newProps) {
      if (key !== 'ref') {
        hostPatchProp(el, key, oldProps[key], newProps[key])
      }
    }

    for (const key in oldProps) {
      if (!newProps.hasOwnProperty(key)) {
        hostPatchProp(el, key, oldProps[key], null)
      }
    }
  }

  // 比较新旧节点
  const patchElement = (n1, n2, container, parentComponent) => {
    // 保存一个旧 dom 元素  比较 dom 的属性的时候可以复用
    const el = (n2.el = n1.el)

    const oldProps = n1.props || {}
    const newProps = n2.props || {}

    // 比较节点的属性
    patchProps(oldProps, newProps, el)

    // 比较节点的子节点
    patchChildren(n1, n2, el, parentComponent)
  }

  // 对元素的处理
  const processElement = (n1, n2, container, anchor, parentComponent) => {
    if (n1 === null) {
      mountElement(n2, container, anchor, parentComponent)
    } else {
      patchElement(n1, n2, container, parentComponent)
    }
  }

  const processText = (n1, n2, container) => {
    if (n1 === null) {
      n2.el = hostCreateText(n2.children)
      hostInsert(n2.el, container)
    } else {
      const el = (n2.el = n1.el)
      if (n1.children !== n2.children) {
        hostSetText(el, n2.children)
      }
    }
  }

  const processFragment = (n1, n2, container, parentComponent) => {
    if (n1 === null) {
      mountChildren(n2.children, container, parentComponent)
    } else {
      patchChildren(n1, n2, container, parentComponent)
    }
  }

  const updateComponentPreRender = (instance, next) => {
    instance.next = null
    instance.vnode = next
    updateProps(instance, instance.props, next.props || {})

    Object.assign(instance.slots, next.children)
  }

  const renderComponent = instance => {
    const { render, vnode, proxy, slots, attrs } = instance

    if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
      return render.call(proxy, proxy)
    } else {
      return vnode.type(attrs, { slots })
    }
  }

  function setupRenderEffect(instance, container, anchor) {
    const componentUpdateFn = () => {
      const { bm, m, bu, u } = instance

      if (!instance.isMounted) {
        if (bm) {
          invokeArray(bm)
        }

        const subTree = renderComponent(instance)
        patch(null, subTree, container, anchor, instance)
        instance.subTree = subTree
        instance.isMounted = true

        if (m) {
          invokeArray(m)
        }
      } else {
        const { next } = instance
        if (next) {
          updateComponentPreRender(instance, next)
        }

        if (bu) {
          invokeArray(bu)
        }

        const subTree = renderComponent(instance)

        patch(instance.subTree, subTree, container, anchor, instance)
        instance.subTree = subTree

        if (u) {
          invokeArray(u)
        }
      }
    }

    const effect = new ReactiveEffect(componentUpdateFn, () => queueJob(update))
    const update = () => effect.run()

    update()

    instance.update = update
  }

  const mountComponent = (vnode, container, anchor, parentComponent) => {
    const instance = (vnode.component = createComponentInstance(vnode, parentComponent))

    if (isKeepAlive(vnode.type)) {
      instance.ctx.renderer = {
        createElement: hostCreateElement,
        move(vnode, container, anchor) {
          hostInsert(vnode.component.subTree.el, container, anchor)
        },
        unmount,
      }
    }

    setupComponent(instance)

    setupRenderEffect(instance, container, anchor)
  }

  const hasPropsChanged = (prevProps, nextProps) => {
    let pKeys = Object.keys(prevProps)
    let nKeys = Object.keys(nextProps)
    if (nKeys.length !== pKeys.length) {
      return true
    }

    for (let i = 0; i < nKeys.length; i++) {
      const key = nKeys[i]
      if (prevProps[key] !== nextProps[key]) {
        return true
      }
    }

    return false
  }

  const updateProps = (instance, prevProps, nextProps) => {
    if (hasPropsChanged(prevProps, nextProps)) {
      for (const key in nextProps) {
        instance.props[key] = nextProps[key]
      }

      for (const key in instance.props) {
        if (!(key in nextProps)) {
          delete instance.props[key]
        }
      }
    }
  }

  const shouleComponentUpdate = (n1, n2) => {
    const { props: prevProps, children: prevChildren } = n1
    const { props: nextProps, children: nextChildren } = n2

    if (prevChildren || nextChildren) return true

    if (prevProps === nextProps) return false

    return hasPropsChanged(prevProps, nextProps || {})
  }

  const updateComponent = (n1, n2) => {
    const instance = (n2.component = n1.component)

    if (shouleComponentUpdate(n1, n2)) {
      instance.next = n2
      instance.update()
    }
  }

  const processComponent = (n1, n2, container, anchor, parentComponent) => {
    if (n1 === null) {
      if (n2.shapeFlag & ShapeFlags.COMPONENT_KEPT_ALIVE) {
        parentComponent.ctx.activate(n2, container, anchor)
      } else {
        mountComponent(n2, container, anchor, parentComponent)
      }
    } else {
      updateComponent(n1, n2)
    }
  }

  const setRef = (rawRef, vnode) => {
    const value =
      vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT ? vnode.component.exposed || vnode.component.proxy : vnode.el

    if (isRef(rawRef)) {
      rawRef.value = value
    }
  }

  const patch = (n1, n2, container, anchor = null, parentComponent = null) => {
    // 两次的虚拟节点是相同的 直接跳过
    if (n1 === n2) {
      return
    }

    // 直接移除老的dom元素，初始化新的dom元素
    if (n1 && !isSameVnode(n1, n2)) {
      unmount(n1, parentComponent)
      n1 = null // 就会执行后续的n2的初始化
    }

    const { type, shapeFlag, ref } = n2
    switch (type) {
      case Text:
        processText(n1, n2, container)
        break
      case Fragment:
        processFragment(n1, n2, container, parentComponent)
        break

      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, anchor, parentComponent)
        } else if (shapeFlag & ShapeFlags.TELEPORT) {
          type.process(n1, n2, anchor, parentComponent, {
            mountChildren,
            patchChildren,
            move(vnode, container, anchor) {
              if (vnode.component) {
                hostInsert(vnode.component.subTree.el, container, anchor)
              } else {
                hostInsert(vnode.el, container, anchor)
              }
            },
          })
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
          processComponent(n1, n2, container, anchor, parentComponent)
        }
    }

    if (ref !== null) {
      setRef(ref, n2)
    }
  }

  // render 函数 将虚拟节点 vnode 渲染到 container 容器中
  const render = (vnode, container) => {
    if (vnode === null && container._vnode) {
      unmount(container._vnode, null)
    } else {
      patch(container._vnode || null, vnode, container)
      // 保存 vnode，方便下次比较
      container._vnode = vnode
    }
  }

  return { render }
}
