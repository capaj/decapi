export type DeepWeakMapPath = (string) | Array<string | number>

function flattenPaths(paths: DeepWeakMapPath[]): string[] {
  return paths.reduce((accumulatedPath: string[], nextPath) => {
    if (Array.isArray(nextPath)) {
      return [...accumulatedPath, ...nextPath.map((pathPart) => `${pathPart}`)]
    }
    return [...accumulatedPath, `${nextPath}`]
  }, []) as string[]
}

export class DeepWeakMap<
  Key extends object,
  Value,
  Structure = { [key: string]: Value }
> {
  private map: WeakMap<Key, Structure>
  constructor() {
    this.map = new WeakMap()
  }

  isEmpty(target: Key) {
    return !Object.keys(this.getAll(target)).length
  }

  getAll(target: Key): Structure {
    const { map } = this
    if (!map.has(target)) {
      const empty = {}
      map.set(target, empty as Structure)
    }
    return map.get(target) as Structure
  }

  set(target: Key, path: DeepWeakMapPath, value: Value) {
    const metaData = this.getAll(target) as Record<string, any>
    if (typeof path === 'string') {
      metaData[path] = value
    } else {
      let onFirstPath = metaData[path[0]]
      if (!onFirstPath) {
        onFirstPath = []
      }

      onFirstPath[path[1]] = value
      metaData[path[0]] = onFirstPath
    }
  }

  get(target: Key, ...paths: DeepWeakMapPath[]): Value {
    const path = flattenPaths(paths)

    const metaData = this.getAll(target) as Record<string, any>
    if (path.length === 1) {
      return metaData[path[0]]
    } else {
      const onFirstPath = metaData[path[0]]

      return onFirstPath && onFirstPath[path[1]]
    }
  }

  has(target: Key, ...paths: DeepWeakMapPath[]): boolean {
    const path = flattenPaths(paths)
    return !!this.get(target, path)
  }
}
