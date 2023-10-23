type StructInput = Record<string, any>;

type Nullable<T> = {
  nullable: true;
  type: T;
};
export function Nullable<T>(type: T) {
  return {
    nullable: true,
    type,
  } as Nullable<T>;
}
type Optional<T> = {
  optional: true;
  type: T;
};
export function Optional<T>(type: T) {
  return {
    optional: true,
    type,
  } as Optional<T>;
}
type Union<T extends any[]> = {
  union: true;
  types: T;
};
export function Union<T extends any[]>(...types: T) {
  return {
    union: true,
    types,
  } as Union<T>;
}

type InferStructType = any;

type ConstructorToValue<T> = T extends StringConstructor ? string
  : T extends NumberConstructor ? number
  : T extends BooleanConstructor ? boolean
  : T extends Nullable<infer U>
    ? ConstructorToValue<U> | null | undefined | void
  : T extends Optional<infer U> ? ConstructorToValue<U>
  : T extends Union<infer U> ? ConstructorToValue<U[number]>
  // : T extends new (...args: any[]) => any ? MapConstructors<InferStructType<T>>
  : T extends Array<infer U> ? ConstructorToValue<U>[]
  : T;

type OptionalKeys<T> = {
  [K in keyof T]: T[K] extends Optional<any> ? K : never;
}[keyof T];
type NonOptional<T> = Exclude<keyof T, OptionalKeys<T>>;
type MapConstructors<T extends StructInput> =
  & {
    [K in NonOptional<T>]: ConstructorToValue<T[K]>;
  }
  & {
    [K in OptionalKeys<T>]?: ConstructorToValue<T[K]>;
  };

const prims = {
  a: String,
  b: Number,
  c: Nullable(String),
  d: Nullable(Number),
  e: Union(String, Number),
  f: Nullable(Union(String, Number)),
  g: Optional(String),
  h: Optional(Union(String, Number)),
  i: Struct({
    a: String,
    b: Optional(Number),
    c: Optional(Array(Union(String, Number))),
    d: Struct({
      a: Number,
    }),
  }),
};

const prims2: MapConstructors<typeof prims> = {
  a: "Hello",
  b: 10,
  c: null,
  d: undefined,
  e: 10,
  f: 23,
  g: "2",
  i: {},
};

type AorB<A, B> = A extends never ? B : A;

export type RequiredProperties<AllProps, DefaultProps> =
  Exclude<keyof AllProps, keyof DefaultProps> extends never ? never
    : Pick<AllProps, Exclude<keyof AllProps, keyof DefaultProps>>;

export function Struct<AllProps extends StructInput>(defaults?: never): new (
  data: AllProps,
) => AllProps;

export function Struct<
  AllProps extends StructInput,
  DefaultProps extends AllProps extends never ? StructInput : Partial<AllProps>,
>(
  defaults: DefaultProps,
): RequiredProperties<AllProps, DefaultProps> extends never
  ? new (
    data?: Partial<AllProps>,
  ) => AllProps
  : new (
    data:
      & Partial<AllProps>
      & RequiredProperties<AllProps, DefaultProps>,
  ) => AllProps;

export function Struct<
  AllProps extends StructInput,
  DefaultProps extends Partial<AllProps>,
>(
  defaults?: DefaultProps,
) {
  return class {
    constructor(proto: AllProps) {
      Object.assign(this, defaults);
      Object.assign(this, proto);
    }
  };
}

const Vec2 = Struct({
  y: 0,
  x: 0,
});

const vec = new Vec2({ x: 10 });
