import { h } from '../h'

function nextFrame(fn) {
  requestAnimationFrame(() => {
    requestAnimationFrame(fn)
  })
}

export function resloveTransitionProps(props) {
  const {
    name = 'v',
    enterFromClass = `${name}-enter-from`,
    enterActiveClass = `${name}-enter-active`,
    enterToClass = `${name}-enter-to`,
    leaveFromClass = `${name}-leave-from`,
    leaveActiveClass = `${name}-leave-active`,
    leaveToClass = `${name}-leave-to`,
    onBeforeEnter,
    onEnter,
    onLeave,
  } = props

  return {
    onBeforeEnter(el) {
      onBeforeEnter && onBeforeEnter(el)
      el.classList.add(enterFromClass)
      el.classList.add(enterActiveClass)
    },

    onEnter(el, done) {
      const reslove = () => {
        el.classList.remove(enterToClass)
        el.classList.remove(enterActiveClass)
        done && done()
      }

      onEnter && onEnter(el, reslove)

      nextFrame(() => {
        el.classList.remove(enterFromClass)
        el.classList.add(enterToClass)

        if (!onEnter || onEnter.length <= 1) {
          el.addEventListener('transitionend', reslove)
        }
      })
    },
    onLeave(el, done) {
      const reslove = () => {
        el.classList.remove(leaveActiveClass)
        el.classList.remove(leaveToClass)
        done && done()
      }

      onLeave && onLeave(el, reslove)

      el.classList.add(leaveFromClass)
      document.body.offsetHeight // force reflow
      el.classList.add(leaveActiveClass)

      nextFrame(() => {
        el.classList.remove(leaveFromClass)
        el.classList.add(leaveToClass)

        if (!onLeave || onLeave.length <= 1) {
          el.addEventListener('transitionend', reslove)
        }
      })
    },
  }
}

export function Transition(props, { slots }) {
  return h(BaseTransitionImpl, resloveTransitionProps(props), slots)
}

const BaseTransitionImpl = {
  props: {
    onBeforeEnter: Function,
    onEnter: Function,
    onLeave: Function,
  },

  setup(props, { slots }) {
    return () => {
      const vnode = slots.default && slots.default()

      if (!vnode) {
        return
      }

      vnode.transition = {
        beforeEnter: props.onBeforeEnter,
        enter: props.onEnter,
        leave: props.onLeave,
      }
      return vnode
    }
  },
}
