export default function patchEvent(el, name, value) {
  //给 el 身上加一个对象属性   _vei -->  vue_event_invoker
  const invokers = el._vei || (el._vei = {})

  // 获取事件名    onClick --> click
  const eventName = name.slice(2).toLowerCase()

  const exisitingInvoker = invokers[eventName]

  //如果新旧都有值，说明事件已经绑定过，直接修改 invoker.value 的属性
  if (value && exisitingInvoker) {
    // 事件换绑，修改 invoker.value 的属性
    exisitingInvoker.value = value
    return
  }

  // 如果只有新值，说明是新增事件，直接绑定事件
  if (value) {
    // 创建一个 invoker 对象
    const invoker = createInvoker(value)

    // 添加事件
    el.addEventListener(eventName, invoker)

    // 保存 invoker 对象
    invokers[eventName] = invoker

    return
  }

  // 如果只有旧值，说明是删除事件，直接解绑事件
  if (exisitingInvoker) {
    el.removeEventListener(eventName, exisitingInvoker)
    invokers[eventName] = null
  }
}

function createInvoker(value) {
  //创建一个 invoker 函数， 事件触发实际调用的是 invoker.value 函数
  const invoker = e => invoker.value(e)
  // 修改 invoker.value 的属性
  invoker.value = value
  return invoker
}
