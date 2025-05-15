const queue = [] // 任务队列
let isFlushing = false // 是否正在执行

const reslovePromise = Promise.resolve() // 空 promise

export function queueJob(job) {
  if (!queue.includes(job)) {
    queue.push(job)
  }

  if (!isFlushing) {
    isFlushing = true

    reslovePromise.then(() => {
      isFlushing = false
      const copy = queue.slice(0) // 先复制一份队列
      queue.length = 0 // 清空队列
      copy.forEach(job => job())
      copy.length = 0 // 清空队列
    })
  }
}
