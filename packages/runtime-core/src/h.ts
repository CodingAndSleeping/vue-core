import { isArray, isObject } from '@my-vue/shared';
import { createVnode, isVnode } from './vnode';

export function h(type, propsOrChildren?, children?) {
  const l = arguments.length;

  // 如果只有两个参数
  if (l === 2) {
    // 如果第二个参数是一个对象，但不是数组
    if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
      // 如果第二个参数是一个虚拟节点，就作为  children
      if (isVnode(propsOrChildren)) {
        return createVnode(type, null, [propsOrChildren]);
      }
      // 否则就是一个普通对象 就作为 props
      return createVnode(type, propsOrChildren);
    } else {
      // 否则第二个参数是 数组 或 文本，就作为 children
      return createVnode(type, null, propsOrChildren);
    }
  } else {
    // 如果大于三个参数
    if (l > 3) {
      // 从第三个参数开始都是 children
      children = Array.from(arguments).slice(2);
    } else if (l === 3 && isVnode(children)) {
      // 如果只有三个参数，且第三个参数是一个虚拟节点，就作为  children,并用数组包起来
      children = [children];
    }

    // 其他情况 就直接传给 createVnode
    return createVnode(type, propsOrChildren, children);
  }
}
