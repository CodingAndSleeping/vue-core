// 抽取创建依赖 Map 的逻辑
function createDep(cleanup: () => void, key: string | symbol) {
  // 每个 key 身上 对应的 effect 用 map 来存储，早期是用的 set
  let dep = new Map() as any
  // 给 dep 身上添加一个 删除 的方法
  dep.cleanup = cleanup
  // 给 dep 身上添加一个 key 作为名字
  dep.name = key
  return dep
}
