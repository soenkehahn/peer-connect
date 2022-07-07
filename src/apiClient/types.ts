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

type literalType<T> = {
  __tag: "literal";
  literal: T;
};
export const literal = <T>(literal: T): literalType<T> => ({
  __tag: "literal",
  literal,
});
const isLiteralType = <T>(input: unknown): input is literalType<T> => {
  return (input as literalType<"foo">).__tag === "literal";
};

export type Type<T = never> =
  | stringType
  | numberType
  | literalType<T>
  | null
  | {
      [key: string]: Type;
    };

export type ToType<T extends Type<U>, U = never> = T extends stringType
  ? string
  : T extends numberType
  ? number
  : T extends literalType<infer U>
  ? U
  : T extends null
  ? null
  : T extends { [key: string]: Type }
  ? {
      [Key in keyof T]: ToType<T[Key]>;
    }
  : never;

const typeToString = <U>(typ: Type<U>): string => {
  if (typ === null) {
    return "null";
  } else if (isStringType(typ)) {
    return "string";
  } else if (isNumberType(typ)) {
    return "number";
  } else if (isLiteralType(typ)) {
    return JSON.stringify(typ.literal);
  } else if (typeof typ === "object") {
    if (Object.keys(typ).length === 0) {
      return "{}";
    }
    let result = "{ ";
    for (const field in typ) {
      result += `${field}: ${typeToString(typ[field])}`;
    }
    result += " }";
    return result;
  } else {
    checkNever(typ);
    throw "impossible";
  }
};

export const parseJSON = <T extends Type<U>, U>(
  typ: T,
  json: string
): ToType<T, U> => {
  const value: unknown = JSON.parse(json);
  return verify(typ, value);
};

export const verify = <T extends Type<U>, U>(
  typ: T,
  value: unknown
): ToType<T, U> => {
  if (!isOfType(typ, value)) {
    throw new Error(
      `expected: ${typeToString(typ)}, got: ${JSON.stringify(value)}`
    );
  }
  return value;
};

const isOfType = <T extends Type<U>, U>(
  typ: T,
  value: unknown
): value is ToType<T, U> => {
  if (typ === null) {
    if (value !== null) {
      return false;
    }
  } else if (isStringType(typ)) {
    if (typeof value !== "string") {
      return false;
    }
  } else if (isNumberType(typ)) {
    if (typeof value !== "number") {
      return false;
    }
  } else if (isLiteralType(typ)) {
    return typ.literal === value;
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
  } else {
    checkNever(typ);
    throw "impossible";
  }
  return true;
};
