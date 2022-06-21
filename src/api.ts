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
  } else if (typ === null) {
    if (value !== null) {
      throw `expected: null, got: ${JSON.stringify(value)}`;
    }
    const result: null = value;
    return result as any;
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
