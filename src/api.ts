import { Channel } from "./signalingClient";

/// Types

export type Type = "string" | "number";

export type ToType<T extends Type> = T extends "string" ? string : number;

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

export type Api = Type;
export type ToServer<T extends Api> = (input: ToType<T>) => void;

export const runServer = <ServerApi extends Api>(
  api: ServerApi,
  server: ToServer<ServerApi>
): Channel => {
  return {
    send(input: string) {
      const inputType: ServerApi = api;
      const parsed: ToType<ServerApi> = parseJSON(inputType, input);
      server(parsed);
    },
    next() {
      return new Promise(() => {});
    },
  };
};
