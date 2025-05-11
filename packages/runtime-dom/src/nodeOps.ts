export default {
  insert(el, container, anchor) {
    container.insertBefore(el, anchor || null)
  },

  remove(el) {
    const parent = el.parentNode
    if (parent) {
      parent.removeChild(el)
    }
  },

  createElement(type) {
    return document.createElement(type)
  },

  createText(text) {
    return document.createTextNode(text)
  },

  setText(node, text) {
    node.nodeValue = text
  },

  setElementText(el, text) {
    el.textContent = text
  },

  parentNode(node) {
    return node.parentNode
  },

  nextSibling(node) {
    return node.nextSibling
  },
}
