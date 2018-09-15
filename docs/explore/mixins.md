# Mixins

When a regular class inheritance is not flexible enough, you can create mixins which can be easily "sprinkled" onto any class in your existing hierarchy. At runtime method fields on the mixin run in the context of a class where you apply them, but typescript doesn't know that, so you have to explicitly set `this` parameter, as shown:

```ts
import { ObjectType, Field, Union } from 'typegql'

interface IHasMyProp {
  myProp: number
}

@ObjectType()
class Mixin {
  @Field()
  printMyProp(
    this: IHasMyProp, // <-- you need to explicitly set an interface which all classes implement for this mixin
    a: string,
  ): string {
    return `my prop is ${this.myProp}`
  }
}

@ObjectType({ mixins: [Mixin] })
class Hello implements IHasMyProp {
  myProp = 5
  @Field()
  world(name: string): string {
    return `Hello, ${name}`
  }
}
```