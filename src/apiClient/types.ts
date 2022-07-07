import { checkNever } from "../utils";

type stringType = {
  __tag: "string";
};
export const string: stringType = { __tag: "string" };
const isStringType = (input: unknown): input is stringType =>
  (input as stringType).__tag === "string";

type numberType = {
  __tag: "number";
};
export const number: numberType = { __tag: "number" };
const isNumberType = (input: unknown): input is numberType =>
  (input as numberType).__tag === "number";

type booleanType = {
  __tag: "boolean";
};
export const boolean: booleanType = { __tag: "boolean" };
const isBooleanType = (input: unknown): input is booleanType =>
  (input as booleanType).__tag === "boolean";

type literalType<T> = {
  __tag: "literal";
  literal: T;
};
export const literal = <T extends string>(literal: T): literalType<T> => ({
  __tag: "literal",
  literal,
});
const isLiteralType = <T>(input: unknown): input is literalType<T> =>
  (input as literalType<"foo">).__tag === "literal";

type unionType<A, B> = { __tag: "union"; a: A; b: B };
export const union = <
  A extends Type<AA, AB>,
  AA,
  AB,
  B extends Type<BA, BB>,
  BA,
  BB
>(
  a: A,
  b: B
): unionType<A, B> => ({
  __tag: "union",
  a,
  b,
});
const isUnionType = <A, B>(input: unknown): input is unionType<A, B> =>
  (input as unionType<null, null>).__tag === "union";

export type Type<T = unknown, U = unknown> =
  | null
  | stringType
  | numberType
  | booleanType
  | literalType<T>
  | unionType<T, U>
  | {
      [key: string]: Type;
    };

export type ToType<T> = T extends null
  ? null
  : T extends stringType
  ? string
  : T extends numberType
  ? number
  : T extends booleanType
  ? boolean
  : T extends literalType<infer U extends string>
  ? U
  : T extends unionType<
      infer U extends Type<infer _, infer _>,
      infer V extends Type<infer _, infer _>
    >
  ? ToType<U> | ToType<V>
  : T extends { [key: string]: Type<infer _, infer _> }
  ? {
      [Key in keyof T]: ToType<T[Key]>;
    }
  : never;

const typeToString = <U, V>(typ: Type<U, V>): string => {
  if (typ === null) {
    return "null";
  } else if (isStringType(typ)) {
    return "string";
  } else if (isNumberType(typ)) {
    return "number";
  } else if (isBooleanType(typ)) {
    return "boolean";
  } else if (isLiteralType(typ)) {
    return JSON.stringify(typ.literal);
  } else if (isUnionType(typ)) {
    const a = typeToString(typ.a as unknown as Type);
    const b = typeToString(typ.b as unknown as Type);
    return `${a} | ${b}`;
  } else if (typeof typ === "object") {
    if (Object.keys(typ).length === 0) {
      return "{}";
    }
    let result = "{ ";
    let first = true;
    for (const field in typ) {
      if (!first) {
        result += ", ";
      }
      first = false;
      result += `${field}: ${typeToString(typ[field])}`;
    }
    result += " }";
    return result;
  } else {
    checkNever(typ);
    throw "impossible";
  }
};

export const parseJSON = <T extends Type<U, V>, U, V>(
  typ: T,
  json: string
): ToType<T> => {
  const value: unknown = JSON.parse(json);
  return verify(typ, value);
};

export const verify = <T extends Type<U, V>, U, V>(
  typ: T,
  value: unknown
): ToType<T> => {
  if (!isOfType(typ, value)) {
    throw new Error(
      `expected: ${typeToString(typ)}, got: ${JSON.stringify(value)}`
    );
  }
  return value;
};

const isOfType = <T extends Type<U, V>, U, V>(
  typ: T,
  value: unknown
): value is ToType<T> => {
  if (typ === null) {
    return value === null;
  } else if (isStringType(typ)) {
    return typeof value === "string";
  } else if (isNumberType(typ)) {
    return typeof value === "number";
  } else if (isBooleanType(typ)) {
    return typeof value === "boolean";
  } else if (isLiteralType(typ)) {
    return typ.literal === value;
  } else if (isUnionType(typ)) {
    return (
      isOfType(typ.a as unknown as Type, value) ||
      isOfType(typ.b as unknown as Type, value)
    );
  } else if (typeof typ === "object") {
    if (typeof value !== "object" || value === null) {
      return false;
    }
    for (const field in typ) {
      if (!Object.keys(value).includes(field)) {
        return false;
      }
      if (!isOfType(typ[field], (value as any)[field])) {
        return false;
      }
    }
    return true;
  } else {
    checkNever(typ);
    throw "impossible";
  }
};
