/// Types

export type Type = "string" | "number" | null;

export type ToType<T extends Type> = T extends "string"
  ? string
  : T extends "number"
  ? number
  : null;

export const parseJSON = <T extends Type>(typ: T, json: string): ToType<T> => {
  const value: unknown = JSON.parse(json);
  if (typ === "string") {
    if (typeof value !== "string") {
      throw new Error(`expected: string, got: ${JSON.stringify(value)}`);
    }
    const result: string = value;
    return result as any;
  } else if (typ === "number") {
    if (typeof value !== "number") {
      throw `expected: number, got: ${JSON.stringify(value)}`;
    }
    const result: number = value;
    return result as any;
  }
  throw "nyi parse";
};

/// Apis

export type Api = { [name: string]: Endpoint };

export type ToServer<T extends Api> = {
  [Field in keyof T]: ToFunction<T[Field]>;
};

export type Endpoint = {
  input: Type;
  output: Type;
};

export type ToFunction<T extends Endpoint> = (
  input: ToType<T["input"]>
) => ToType<T["output"]>;

export const handleMessages =
  <ServerApi extends Api>(
    api: ServerApi,
    server: ToServer<ServerApi>
  ): ((endpoint: string, input: string) => string) =>
  (endpoint: string, input: string): string => {
    const functionn = api[endpoint];
    const inputType = functionn.input;
    const parsed = parseJSON(inputType, input);
    return JSON.stringify(server[endpoint](parsed as any));
  };
