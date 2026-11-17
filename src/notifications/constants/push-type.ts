export const PushType = {
  accessory: "accessory",
  alert: "alert",
  background: "background",
  complication: "complication",
  controls: "controls",
  fileprovider: "fileprovider",
  liveactivity: "liveactivity",
  location: "location",
  mdm: "mdm",
  pushtotalk: "pushtotalk",
  voip: "voip",
  widgets: "widgets",
} as const

export type PushType = (typeof PushType)[keyof typeof PushType]
