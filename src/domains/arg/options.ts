export interface IArgOptions {
  description?: string
  type?: any
  nullable?: boolean
  name?: string
}

export const defaultArgOptions: IArgOptions = {
  nullable: false
}
