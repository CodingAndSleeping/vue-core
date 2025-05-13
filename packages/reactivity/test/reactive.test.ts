import { reactive, isReactive } from '../src/index'

describe('reactive', () => {
  test('代理一个普通对象', () => {
    const originalObj = { name: 'foo', age: 20 }
    const reactiveObj = reactive(originalObj)
    expect(isReactive(reactiveObj)).toBe(true)
    expect(isReactive(originalObj)).toBe(false)
    expect(reactiveObj.name).toBe('foo')
    expect(reactiveObj.age).toBe(20)
  })

  test('深层代理', () => {
    const originalObj = {
      name: 'foo',
      age: 20,
      child: {
        name: 'bar',
        age: 18,
      },
      hobbies: ['reading', 'running'],
    }
    const reactiveObj = reactive(originalObj)
    expect(isReactive(reactiveObj)).toBe(true)
    expect(isReactive(originalObj)).toBe(false)
    expect(reactiveObj.name).toBe('foo')
    expect(reactiveObj.child.name).toBe('bar')
    expect(reactiveObj.hobbies[0]).toBe('reading')
  })
})
