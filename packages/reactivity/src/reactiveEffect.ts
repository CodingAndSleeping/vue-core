import { activeEffect } from './effect'

const targetMap = new WeakMap() // 存放依赖的对象和 key 映射关系

export function createDep(cleanup, key) {
  let dep = new Map() as any
  dep.cleanup = cleanup
  dep.name = key
  return dep
}

export function track(target, key) {
  // 如果当前没有激活的 effect，则不进行依赖收集
  if (!activeEffect) {
    return
  }

  let depsMap = targetMap.get(target)
  if (!depsMap) {
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }

  let dep = depsMap.get(key)
  if (!dep) {
    dep = createDep(() => depsMap.delete(key), key)
    depsMap.set(key, dep)
  }

  trackEffects(activeEffect, dep)
}
