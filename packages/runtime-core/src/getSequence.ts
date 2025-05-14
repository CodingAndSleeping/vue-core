export default function getSequence(arr) {
  const result = [0]
  const p = result.slice(0)
  let start
  let end
  let middle
  const len = arr.length

  for (let i = 1; i < len; i++) {
    const arrI = arr[i]
    if (arrI !== 0) {
      let resuleLastIndex = result[result.length - 1]
      if (arr[resuleLastIndex] < arrI) {
        p[i] = result[result.length - 1]
        result.push(i)
        continue
      }
    }

    start = 0
    end = result.length - 1

    while (start < end) {
      middle = ((start + end) / 2) | 0

      if (arr[result[middle]] < arrI) {
        start = middle + 1
      } else {
        end = middle
      }
    }

    if (arrI < arr[result[start]]) {
      p[i] = result[start - 1]
      result[start] = i
    }
  }

  let l = result.length
  let last = result[l - 1]

  while (l-- > 0) {
    result[l] = last
    last = p[last]
  }

  return result
}
