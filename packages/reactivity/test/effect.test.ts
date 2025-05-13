import { effect, reactive } from '../src/index'

describe('effect', () => {
  test('effect函数应该一上来就执行一次', () => {
    const fn = vi.fn(() => {})
    effect(fn)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  test('响应性数据发生变化是执行effect函数', () => {
    const obj = reactive({ count: 0 })
    const fn = vi.fn(() => {
      console.log(obj.count)
    })
    effect(fn)
    obj.count++
    expect(fn).toBeCalledTimes(2)
  })
})
