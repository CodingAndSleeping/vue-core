import { computed, effect, reactive } from '../src/index';

describe('computed', () => {
  test('基本使用', () => {
    const obj = reactive({
      count: 0,
    });
    const computedValue = computed(() => obj.count * 2);
    expect(computedValue.value).toBe(0);
    obj.count = 1;
    expect(computedValue.value).toBe(2);
  });

  test('计算属性的缓存', () => {
    const obj = reactive({
      count: 0,
    });
    const getter = vi.fn(() => obj.count * 2);
    const computedValue = computed(getter);
    expect(getter).not.toHaveBeenCalled();
    expect(computedValue.value).toBe(0);
    expect(getter).toHaveBeenCalledTimes(1);
    computedValue.value;
    expect(getter).toHaveBeenCalledTimes(1);
    obj.count = 1;
    expect(computedValue.value).toBe(2);
    expect(getter).toHaveBeenCalledTimes(2);
  });
});
