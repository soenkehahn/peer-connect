/// Types

export type Type = "string" | "number" | null;

export type ToType<T extends Type> = T extends "string"
  ? string
  : T extends "number"
  ? number
  : null;

const parseJSON = <T extends Type>(typ: T, json: string): ToType<T> => {
  const value: unknown = JSON.parse(json);
  if (typ === "string") {
    if (typeof value !== "string") {
      throw "not";
    }
    const result: string = value;
    return result as any;
  }
  throw "nyi parse";
};

/// Apis

export type Api = {
  input: Type;
  output: Type;
};

export type ToServer<T extends Api> = (
  input: ToType<T["input"]>
) => ToType<T["output"]>;

export const handleMessages =
  <ServerApi extends Api>(
    api: ServerApi,
    server: ToServer<ServerApi>
  ): ((input: string) => string) =>
  (input: string): string => {
    const inputType: ServerApi["input"] = api.input;
    const parsed: ToType<ServerApi["input"]> = parseJSON(inputType, input);
    return JSON.stringify(server(parsed));
  };
