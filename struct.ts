import { createDeepOnChangeProxy } from "./deepProxy.ts";

type StructKeys = string | number;
type StructInput = Record<StructKeys, any>;

type Primitives = string | number | boolean | bigint;
type VPrimitives = string | number | boolean | bigint | undefined | null | void;
type VPrimitiveConstructors =
  | StringConstructor
  | NumberConstructor
  | BooleanConstructor
  | BigIntConstructor
  | Nullable<unknown>
  | Optional<unknown>
  | Union<unknown[]>
  | Array<unknown>;

type VStructInput = {
  [key: StructKeys]:
    | VPrimitives
    | VPrimitiveConstructors
    | VStructInput
    | VStructInput[];
};

const IS_NULLABLE = Symbol("is_nullable");
type Nullable<T> = {
  [IS_NULLABLE]: true;
  type: T;
};
export function Nullable<T>(type: T) {
  return {
    [IS_NULLABLE]: true,
    type,
  } as Nullable<T>;
}
const IS_OPTIONAL = Symbol("is_optional");
type Optional<T> = {
  [IS_OPTIONAL]: true;
  type: T;
};
export function Optional<T>(type: T) {
  return {
    [IS_OPTIONAL]: true,
    type,
  } as Optional<T>;
}
const IS_UNION = Symbol("is_union");
type Union<T extends any[]> = {
  [IS_UNION]: true;
  types: T;
};
export function Union<T extends any[]>(...types: T) {
  return {
    [IS_UNION]: true,
    types,
  } as Union<T>;
}

export type InferVStruct<T extends new (...args: any[]) => any> = T extends
  new (
    ...args: any[]
  ) => infer U ? U
  : never;

export type InferSchema<T extends VStructInput> = MapConstructors<T>;

type ConstructorToValue<T> = T extends StringConstructor ? string
  : T extends NumberConstructor ? number
  : T extends BooleanConstructor ? boolean
  : T extends Nullable<infer U>
    ? ConstructorToValue<U> | null | undefined | void
  : T extends Optional<infer U> ? ConstructorToValue<U>
  : T extends Union<infer U> ? ConstructorToValue<U[number]>
  : T extends Array<infer U> ? ConstructorToValue<U>[]
  : T extends Record<string | number | symbol, any> ? MapConstructors<T>
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
  i: {
    a: String,
    b: Optional(Number),
    c: Optional(Array(Union(String, Number))),
    d: {
      a: Number,
      lol: Optional(String),
    },
  },
};
const prims2: MapConstructors<typeof prims> = {
  a: "Hello",
  b: 10,
  c: null,
  d: undefined,
  e: 10,
  f: 23,
  g: "2",
  i: {
    a: "h",
    d: {
      a: 10,
    },
    b: 10,
  },
};

export type RequiredProperties<AllProps, DefaultProps> =
  Exclude<keyof AllProps, keyof DefaultProps> extends never ? never
    : Pick<AllProps, Exclude<keyof AllProps, keyof DefaultProps>>;

export function Struct<AllProps extends StructInput>(defaults?: never): new (
  data: AllProps,
) => AllProps;

export function Struct<AllProps extends StructInput>(defaults: AllProps): new (
  data?: Partial<AllProps>,
) => AllProps;

export function Struct<
  AllProps extends StructInput,
  DefaultProps extends AllProps extends never ? StructInput : Partial<AllProps>,
>(
  defaults: DefaultProps,
): RequiredProperties<AllProps, DefaultProps> extends never ? new (
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

const primitiveTypeMap = {
  String: (input: unknown) => typeof input === "string",
  Number: (input: unknown) => typeof input === "number",
  Boolean: (input: unknown) => typeof input === "boolean",
  BigInt: (input: unknown) => typeof input === "bigint",
  Symbol: (input: unknown) => typeof input === "symbol",
  Object: (input: unknown) => typeof input === "object",
  Function: (input: unknown) => typeof input === "function",
};

function isPrimitive(input: unknown): input is Primitives {
  return typeof input === "string" || typeof input === "number" ||
    typeof input === "boolean" || typeof input === "bigint";
}

function isNull(input: unknown): input is null {
  return input === null;
}

function isFunction(input: unknown): input is Function {
  return typeof input === "function";
}

function isNullableHelper(input: unknown): input is Nullable<any> {
  return typeof input === "object" && input !== null && IS_NULLABLE in input;
}

function isOptionalHelper(input: unknown): input is Optional<any> {
  return typeof input === "object" && input !== null && IS_OPTIONAL in input;
}

function isUnionHelper(input: unknown): input is Union<any[]> {
  return typeof input === "object" && input !== null && IS_UNION in input;
}

function isArray(input: unknown): input is any[] {
  return Array.isArray(input);
}

function isObject(input: unknown): input is object {
  return typeof input === "object" && input !== null;
}

export function validate(schema: VStructInput, input: unknown, quiet = false) {
  if (!input || typeof input !== "object") {
    throw new Error("Validation error: Input must be an object.");
  }

  function validateImpl(schema: unknown, input: unknown) {
    if (typeof schema === "undefined") {
      throw new Error("Validation error: Schema is undefined.");
    }
    if (isNull(schema)) {
      if (!isNull(input)) {
        throw new Error(
          `Validation error: Expected null but got ${typeof input}`,
        );
      }
      return;
    }
    if (isFunction(schema)) {
      // @ts-ignore yah yah whatever
      if (!primitiveTypeMap[schema.name]?.(input)) {
        throw new Error(
          `Validation error: Expected ${schema.name} but got ${typeof input}`,
        );
      }
      return;
    }
    if (isArray(schema)) {
      if (!isArray(input)) {
        throw new Error(
          `Validation error: Expected array but got ${typeof input}`,
        );
      }
      for(const item of input) {
        validateImpl(schema[0], item);
      }
      return;
    }
    if (isObject(schema)) {
      if (isNullableHelper(schema)) {
        if (typeof input === "undefined") {
          throw new Error(
            `Validation error: Expected ${schema.type.name} but got undefined`,
          );
        }
        if (input !== null) {
          validateImpl(schema.type, input);
        }
        return;
      }
      if (isOptionalHelper(schema)) {
        input && validateImpl(schema.type, input);
        return;
      }
      if (isUnionHelper(schema)) {
        let found = false;
        for (const type of schema.types) {
          try {
            validateImpl(type, input);
            found = true;
            break;
          } catch {}
        }
        if (!found) {
          throw new Error(
            `Validation error: Expected ${
              schema.types.map((t) => t.name).join(", ")
            } but got ${typeof input}`,
          );
        }
        return;
      }
      for (const [key, value] of Object.entries(schema)) {
        // @ts-ignore key now exists in input
        validateImpl(value, input[key]);
      }
      return;
    }
    if (isPrimitive(schema)) {
      if (typeof input !== typeof schema) {
        throw new Error(
          `Validation error: Expected ${typeof schema} but got ${typeof input}`,
        );
      }
      return;
    }
  }

  if(!quiet) validateImpl(schema, input);
  else try {
    validateImpl(schema, input);
  } catch {
    return false;
  }
  
  return true;
}



function toProxy(schema: VStructInput, input: unknown) {
  return createDeepOnChangeProxy(input)
}

export function VStruct<
  Schema extends VStructInput,
>(
  schema: Schema,
) {
  return class {
    constructor(input: any) {
      validate(schema, input);
      // @ts-ignore yah yah whatever
      return toProxy(schema, input);
    }
  } as unknown as new (
    data: ConstructorToValue<Schema>,
  ) => ConstructorToValue<Schema>;
}

// type UserSchema = InferSchema<typeof userSchema>;

// const VerifiedUser = VStruct(userSchema);

// const User = Struct<UserSchema, Pick<UserSchema, "username">>({
//   username: "anon",
// });

// const userData = {
//   username: "hello",
//   password: "world",
//   email: "",
// };

// const user = new User(userData);
// const verifiedUser = new VerifiedUser(user);
