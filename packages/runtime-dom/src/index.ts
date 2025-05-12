import { extend } from '@my-vue/shared'
import nodeOps from './nodeOps'

import patchProp from './patchProp'
import { createRenderer } from '@my-vue/runtime-core'

export const renderOptions = extend({ patchProp }, nodeOps)

export const render = (vnode, container) => {
  return createRenderer(renderOptions).render(vnode, container)
}

export * from '@my-vue/runtime-core'
