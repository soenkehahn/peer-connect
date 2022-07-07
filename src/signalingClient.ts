import { parseJSON } from "./apiClient/types";
import * as t from "./apiClient/types";
import { Channel, websocketChannel } from "./utils/channel";

export type HasColor = { color: "blue" | "green" };

export const connect = async ({
  url,
  id,
  disallow,
  offer,
  seek,
}: {
  url: string;
  id: string;
  disallow: Array<string>;
  offer: string;
  seek: string;
}): Promise<Channel & HasColor> => {
  type HasColorOptional = {
    color?: "blue" | "green";
  };
  let urlWithParams = `${url}/?id=${id}&offer=${offer}&seek=${seek}`;
  for (const id of disallow) {
    urlWithParams += `&disallow=${id}`;
  }
  let channel: Channel & HasColorOptional = await websocketChannel(
    urlWithParams
  );
  let json = await channel.next();
  if (json === null) {
    throw new Error("did not receive confirmation message");
  }
  let confirmation = parseConfirmation(json);
  if (!confirmation.success) {
    throw new Error("unexpected signaling server message: " + confirmation);
  }
  channel.color = confirmation.color;
  return channel as Channel & HasColor;
};

type Confirmation = { success: boolean } & HasColor;

const Confirmation = {
  success: t.boolean,
  color: t.union(t.literal("blue"), t.literal("green")),
};

const parseConfirmation = (json: string): Confirmation =>
  parseJSON(Confirmation, json);
