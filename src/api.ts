/// Types

export type Type =
  | "string"
  | "number"
  | null
  | {
      [key: string]: Type;
    };

const typeToString = (typ: Type): string => {
  if (typ === "string") {
    return "string";
  } else if (typ === "number") {
    return "number";
  } else if (typ === null) {
    return "null";
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

export type ToType<T extends Type> = T extends "string"
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

export const parseJSON = <T extends Type>(typ: T, json: string): ToType<T> => {
  const value: unknown = JSON.parse(json);
  checkJSON(typ, value);
  return value as any;
};

const checkJSON = <T extends Type>(typ: T, value: unknown) => {
  const error = () =>
    new Error(`expected: ${typeToString(typ)}, got: ${JSON.stringify(value)}`);
  if (typ === "string") {
    if (typeof value !== "string") {
      throw error();
    }
  } else if (typ === "number") {
    if (typeof value !== "number") {
      throw error();
    }
  } else if (typ === null) {
    if (value !== null) {
      throw error();
    }
  } else if (typeof typ === "object") {
    if (typeof value !== "object" || value === null) {
      throw error();
    }
    for (const field in typ) {
      if (!Object.keys(value).includes(field)) {
        throw new Error(
          `missing field "${field}" in: ${JSON.stringify(value)}`
        );
      }
      try {
        checkJSON(typ[field], (value as any)[field]);
      } catch (e) {
        throw error();
      }
    }
  } else {
    checkNever(typ);
    throw "impossible";
  }
};

const checkNever = (input: never) => {
  throw new Error("not never: " + input);
};

/// Apis

export type Api = { [name: string]: Endpoint };

export type ToServer<T extends Api> = {
  [Field in keyof T]: EndpointToFunction<T[Field]>;
};

export type Endpoint = {
  input: Type;
  output: Type;
};

export type EndpointToFunction<T extends Endpoint> = (
  input: ToType<T["input"]>
) => ToType<T["output"]> | Promise<ToType<T["output"]>>;

export const handleMessages =
  <ServerApi extends Api>(
    api: ServerApi,
    server: ToServer<ServerApi>
  ): ((endpoint: string, input: string) => Promise<string>) =>
  async (endpoint: string, input: string): Promise<string> => {
    const parsed = parseJSON(api[endpoint].input, input);
    return JSON.stringify(await server[endpoint](parsed as any));
  };
