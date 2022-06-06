# This only documents breaking changes

To refer to all changes made, see commits.

## 2.0.0

- you must use graphql 17, older are not supported anymore.
- complete rewrite of type inferring-thanks to [typescript-rtti](https://github.com/typescript-rtti/typescript-rtti) we are able to infer all the types directly from TS types
- API changes:
  - `castTo` is removed
  - `ArrayField` decorator removed

## 1.0.0

- you must use graphql 16, older are not supported anymore

## 0.6.10

- compileSchema now takes a @Schema decorated class or an array of @Schema decorated classes, not a config object
