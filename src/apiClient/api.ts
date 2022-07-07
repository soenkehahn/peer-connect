import { ToType, Type, verify } from "./types";
import * as t from "./types";

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
  ): ((message: unknown) => Promise<unknown>) =>
  async (message: unknown): Promise<unknown> => {
    const parsed = verify({ endpoint: t.string }, message);
    const endpoint = parsed.endpoint;
    const input: unknown = (parsed as any).input;
    verify(api[endpoint].input, input);
    return await server[endpoint](input as any);
  };

export const makeServer = <ServerApi extends Api>(
  api: ServerApi,
  relayMessage: (message: unknown) => Promise<unknown>
): ToServer<ServerApi> => {
  const server: any = {};
  for (const endpoint in api) {
    server[endpoint] = async (input: any) => {
      const message = { endpoint, input };
      const response = await relayMessage(message);
      return response;
    };
  }
  return server;
};
