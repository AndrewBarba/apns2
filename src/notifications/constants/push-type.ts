export const PushType = {
  alert: "alert",
  background: "background",
  controls: "controls",
  voip: "voip",
  complication: "complication",
  fileprovider: "fileprovider",
  mdm: "mdm",
  liveactivity: "liveactivity",
  location: "location",
  pushtotalk: "pushtotalk",
} as const

export type PushType = (typeof PushType)[keyof typeof PushType]
