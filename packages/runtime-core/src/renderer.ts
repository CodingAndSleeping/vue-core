import { ShapeFlags } from '@my-vue/shared';
import { isSameVnode } from './vnode';

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
  } = options;

  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      patch(null, children[i], container);
    }
  };

  const mountElement = (vnode, container, anchor) => {
    const { type, children, props, shapeFlag } = vnode;

    const el = hostCreateElement(type);
    vnode.el = el;

    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, children);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el);
    }

    hostInsert(el, container, anchor);
  };

  const unmount = vnode => {
    hostRemove(vnode.el);
  };

  const unmountChildren = children => {
    for (let i = 0; i < children.length; i++) {
      let child = children[i];
      unmount(child);
    }
  };

  // 比较 两个数组子节点的差异 diff
  const patchKeyedChildren = (c1, c2, el) => {
    let i = 0;

    let e1 = c1.length - 1; // 旧的最后一个索引
    let e2 = c2.length - 1; // 新的最后一个索引

    // 任何一方循环结束就终止
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];

      if (isSameVnode(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }

      i++;
    }

    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];

      if (isSameVnode(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }

      e1--;
      e2--;
    }

    if (i > e1) {
      // 新的多
      if (i <= e2) {
        let nextPos = e2 + 1;
        let anchor = c2[nextPos]?.el;
        while (i <= e2) {
          patch(null, c2[i], el, anchor);
          i++;
        }
      }
    } else if (i > e2) {
      // 旧的多
      if (i <= e1) {
        while (i <= e1) {
          unmount(c1[i]);
          i++;
        }
      }
    } else {
      let s1 = i;
      let s2 = i;

      const keyToNewIndexMap = new Map(); // key 和 新索引的映射

      for (let i = s2; i < e2; i++) {
        const vnode = c2[i];
        keyToNewIndexMap.set(vnode.key, i);
      }

      for (let i = s1; i <= e1; i++) {
        const vnode = c1[i];
        const key = vnode.key;
        const newIndex = keyToNewIndexMap.get(key);
        if (newIndex === undefined) {
          unmount(vnode);
        } else {
          patch(vnode, c2[newIndex], el);
        }
      }

      // 调整顺序
      const toBePatched = e2 - s2 + 1;

      for (let i = toBePatched - 1; i >= 0; i--) {
        let newIndex = s2 + i;
        const anchor = c2[newIndex + 1]?.el;

        if (c2[newIndex].el) {
          patch(null, c2[newIndex], el, anchor);
        } else {
          hostInsert(c2[newIndex].el, el, anchor);
        }
      }
    }
  };

  // 比较 新旧节点的子节点
  const patchChildren = (n1, n2, el) => {
    const c1 = n1.children;
    const c2 = n2.children;

    const prevShapeFlag = n1.shapeFlag;
    const shapeFlag = n2.shapeFlag;

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(c1); // 旧的是数组的话 移除旧的
      }

      // 旧的不是数组，也就是文本，判断一下新旧相不相等 不相等直接替换
      if (c1 !== c2) {
        hostSetElementText(el, c2);
      }
    } else {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 新旧都是数组  diff 算法
          patchKeyedChildren(c1, c2, el);
        } else {
          // 旧的是数组，新的不是数组也不是文本，也就是空，就移除旧的
          unmountChildren(c1);
        }
      } else {
        // 旧的是文本，就把旧的清空
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          hostSetElementText(el, '');
        }

        // 新的如果是数组，就添加新的
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2, el);
        }
      }
    }
  };

  // 比较 新旧节点的属性
  const patchProps = (oldProps, newProps, el) => {
    for (const key in newProps) {
      hostPatchProp(el, key, oldProps[key], newProps[key]);
    }

    for (const key in oldProps) {
      if (!newProps.hasOwnProperty(key)) {
        hostPatchProp(el, key, oldProps[key], null);
      }
    }
  };

  // 比较新旧节点
  const patchElement = (n1, n2, container) => {
    // 保存一个旧 dom 元素  比较 dom 的属性的时候可以复用
    let el = (n2.el = n1.el);

    let oldProps = n1.props || {};
    let newProps = n2.props || {};

    // 比较节点的属性
    patchProps(oldProps, newProps, el);

    // 比较节点的子节点
    patchChildren(n1, n2, el);
  };

  // 对元素的处理
  const processElement = (n1, n2, container, anchor) => {
    if (n1 === null) {
      mountElement(n2, container, anchor);
    } else {
      patchElement(n1, n2, container);
    }
  };

  const patch = (n1, n2, container, anchor = null) => {
    // 两次的虚拟节点是相同的 直接跳过
    if (n1 === n2) {
      return;
    }

    processElement(n1, n2, container, anchor);
  };

  // render 函数 将虚拟节点 vnode 渲染到 container 容器中
  const render = (vnode, container) => {
    if (vnode === null && container._vnode) {
      unmount(container._vnode);
    }

    patch(container._vnode || null, vnode, container);

    // 保存 vnode，方便下次比较
    container._vnode = vnode;
  };

  return { render };
}
