import { effect, reactive } from '../src/index';

describe('effect', () => {
  test('effect函数应该一上来就执行一次', () => {
    const fn = vi.fn(() => {});
    effect(fn);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('依赖的响应性数据发生变化应执行effect函数', () => {
    const obj = reactive({ count: 0 });
    const fn = vi.fn(() => obj.count);
    effect(fn);
    obj.count++;
    expect(fn).toBeCalledTimes(2);
  });

  test('一个effect函数可以依赖多个响应性数据', () => {
    const obj1 = reactive({ count1: 0, count2: 0 });
    let sum = 0;
    effect(() => (sum = obj1.count1 + obj1.count2));
    expect(sum).toBe(0);
    obj1.count1++;
    expect(sum).toBe(1);
    obj1.count2++;
    expect(sum).toBe(2);
  });

  test('一个响应性数据可以被多个effect函数依赖', () => {
    const obj1 = reactive({ count: 0 });
    const fn1 = vi.fn(() => obj1.count);
    const fn2 = vi.fn(() => obj1.count);
    effect(fn1);
    effect(fn2);
    obj1.count++;
    expect(fn1).toBeCalledTimes(2);
    expect(fn2).toBeCalledTimes(2);
  });

  test('深层依赖的响应性数据发生变化应执行effect函数', () => {
    const obj = reactive({
      children: {
        name: 'foo',
      },
    });
    const fn = vi.fn(() => obj.children.name);
    effect(fn);
    obj.children.name = 'bar';
    expect(fn).toBeCalledTimes(2);
  });

  test('自定义scheller函数', () => {
    const obj = reactive({ count: 0 });
    const fn = vi.fn(() => obj.count);

    let runner;
    const scheduler = vi.fn(() => {
      console.log('scheduler');
      runner();
    });
    runner = effect(fn, { scheduler });
    obj.count++;
    expect(scheduler).toBeCalledTimes(1);
  });

  test('停止收集依赖', () => {
    const obj = reactive({ count: 0 });
    const fn = vi.fn(() => obj.count);
    const runner = effect(fn);

    obj.count++;
    expect(fn).toBeCalledTimes(2);

    runner.effect.stop();

    obj.count++;
    expect(fn).toBeCalledTimes(2);
  });
});
