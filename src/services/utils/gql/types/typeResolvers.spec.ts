import { resolveType } from './typeResolvers.js'

describe('resolveType', function () {
  it('should resolve an array type', () => {
    expect(resolveType({ runtimeType: [Number] })).toMatchInlineSnapshot(
      `"[Float!]!"`
    )
  })

  it('should resolve a thunk returning an array type', () => {
    expect(resolveType({ runtimeType: () => [Number] })).toMatchInlineSnapshot(
      `"[Float!]!"`
    )
  })
})
