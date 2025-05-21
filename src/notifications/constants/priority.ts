export const Priority = {
  immediate: 10,
  throttled: 5,
  low: 1,
} as const

export type Priority = (typeof Priority)[keyof typeof Priority]
