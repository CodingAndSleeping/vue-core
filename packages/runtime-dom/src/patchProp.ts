import patchClass from './modules/patchClass'
import patchEvent from './modules/patchEvent'
import patchStyle from './modules/patchStyle'
import patchAttr from './modules/patchAttr'
export default function patchProp(el, key, preValue, nextValue) {
  if (key === 'class') {
    return patchClass(el, nextValue)
  } else if (key === 'style') {
    return patchStyle(el, preValue, nextValue)
  } else if (/^on([A-Z].*|[a-z]+)$/.test(key)) {
    return patchEvent(el, key, nextValue)
  } else {
    return patchAttr(el, key, nextValue)
  }
}
