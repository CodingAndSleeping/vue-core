export default function patchClass(el, value) {
  if (value) {
    el.setAttribute('class', value)
  } else {
    el.removeAttribute('class')
  }
}
