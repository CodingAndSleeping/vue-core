import { ref, effect, isRef, unRef, toRef, reactive, toRefs, proxyRefs } from '../src/index';

describe('ref', () => {
  test('创建一个基本数据类型的响应式数据', () => {
    const num = ref(0);
    expect(num.value).toBe(0);
  });

  test('ref 数据可以被 effect 依赖收集', () => {
    const num = ref(0);
    const fn = vi.fn(() => num.value);
    effect(fn);
    num.value = 1;
    expect(fn).toHaveBeenCalledTimes(2);
  });

  test('ref 函数也可以创建一个对象类型的响应式数据', () => {
    const obj = ref({ name: 'jack', age: 18 });
    expect(obj.value.name).toBe('jack');
    expect(obj.value.age).toBe(18);
  });

  test('对象类型的响应式数据，也可以被 effect 依赖收集', () => {
    const obj = ref({ name: 'jack', age: 18 });
    const fn = vi.fn(() => obj.value.name);
    effect(fn);
    obj.value.name = 'tom';
    expect(fn).toHaveBeenCalledTimes(2);
  });

  test('isRef', () => {
    const originNum = 0;
    const num = ref(originNum);
    expect(isRef(originNum)).toBe(false);
    expect(isRef(num)).toBe(true);
  });

  test('unRef', () => {
    const numRef = ref(0);
    const num = unRef(numRef);
    expect(num).toBe(0);
  });

  test('toRef', () => {
    const obj = reactive({ name: 'jack', age: 18 });
    const objRef = toRef(obj, 'name');
    expect(objRef.value).toBe('jack');
    objRef.value = 'tom';
    expect(obj.name).toBe('tom');
    obj.name = 'jerry';
    expect(objRef.value).toBe('jerry');
  });

  test('toRefs', () => {
    const obj = reactive({ name: 'jack', age: 18 });
    const objRefs = toRefs(obj);
    expect(objRefs.name.value).toBe('jack');
    objRefs.name.value = 'tom';
    expect(obj.name).toBe('tom');
    obj.name = 'jerry';
    expect(objRefs.name.value).toBe('jerry');
  });

  test('proxyRefs', () => {
    const obj = { name: ref('jack'), age: ref(18) };
    const objWithRef = proxyRefs(obj);
    expect(objWithRef.name).toBe('jack');
    objWithRef.name = 'tom';
    expect(objWithRef.name).toBe('tom');
  });
});
