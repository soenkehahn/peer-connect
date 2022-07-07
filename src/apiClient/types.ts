import { checkNever } from "../utils";

export type stringType = {
  __tag: "string";
};
export const string: stringType = { __tag: "string" };
const isStringType = (input: unknown): input is stringType =>
  (input as stringType).__tag === "string";

export type Type =
  | stringType
  | "number"
  | null
  | {
      [key: string]: Type;
    };

export type ToType<T extends Type> = T extends stringType
  ? string
  : T extends "number"
  ? number
  : T extends null
  ? null
  : T extends { [key: string]: Type }
  ? {
      [Key in keyof T]: ToType<T[Key]>;
    }
  : never;

const typeToString = (typ: Type): string => {
  if (typ === null) {
    return "null";
  } else if (isStringType(typ)) {
    return "string";
  } else if (typ === "number") {
    return "number";
  } else if (typeof typ === "object") {
    if (Object.keys(typ).length === 0) {
      return "{}";
    }
    let result = "{ ";
    for (const field in typ) {
      result += `${field}: ${typ[field]}`;
    }
    result += " }";
    return result;
  } else {
    checkNever(typ);
    throw "impossible";
  }
};

export const parseJSON = <T extends Type>(typ: T, json: string): ToType<T> => {
  const value: unknown = JSON.parse(json);
  return verify(typ, value);
};

export const verify = <T extends Type>(typ: T, value: unknown): ToType<T> => {
  if (!isOfType(typ, value)) {
    throw new Error(
      `expected: ${typeToString(typ)}, got: ${JSON.stringify(value)}`
    );
  }
  return value;
};

const isOfType = <T extends Type>(
  typ: T,
  value: unknown
): value is ToType<T> => {
  if (typ === null) {
    if (value !== null) {
      return false;
    }
  } else if (isStringType(typ)) {
    if (typeof value !== "string") {
      return false;
    }
  } else if (typ === "number") {
    if (typeof value !== "number") {
      return false;
    }
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