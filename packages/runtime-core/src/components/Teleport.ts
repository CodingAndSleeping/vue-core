import { ShapeFlags } from '@my-vue/shared'

export const Teleport = {
  __isTeleport: true,
  process(n1, n2, anchor, parentComponent, internals) {
    const { mountChildren, patchChildren, move } = internals

    if (!n1) {
      const target = (n2.target = document.querySelector(n2.props.to))
      if (target) {
        mountChildren(n2.children, target, parentComponent)
      }
    } else {
      patchChildren(n1, n2, n2.target, parentComponent)

      if (n2.props.to !== n1.props.to) {
        const target = (n2.target = document.querySelector(n2.props.to))

        if (target) {
          n2.children.forEach(child => {
            move(child, target, anchor)
          })
        }
      }
    }
  },

  remove(vnode, unmountChildren) {
    const { shapeFlag, children } = vnode

    if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      unmountChildren(children)
    }
  },
}

export const isTeleport = value => value && value.__isTeleport
