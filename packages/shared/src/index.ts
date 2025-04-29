export function isObject(val: any): val is Record<any, any> {
  return val !== null && typeof val === 'object'
}
