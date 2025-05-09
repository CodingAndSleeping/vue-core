// 抽取创建依赖 Map 的逻辑
export function createDep(cleanup: () => void) {
  // 每个 key 身上 对应的 effect 用 map 来存储，早期是用的 set
  let dep = new Map() as any
  // 给 dep 身上添加一个 删除 的方法
  dep.cleanup = cleanup

  return dep
}
