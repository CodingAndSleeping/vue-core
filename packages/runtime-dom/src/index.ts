import { extend } from '@my-vue/shared'
import nodeOps from './nodeOps'

import patchProp from './patchProp'

const renderOptions = extend({ patchProp }, nodeOps)

export { renderOptions }

export * from '@my-vue/runtime-core'
