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

const parseConfirmation = (json: string): Confirmation => {
  const error = (message: string) =>
    new Error(
      `parse error for confirmation message: ${message}\nreceived: ${json}`
    );
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    if (e instanceof SyntaxError) {
      throw error("invalid json");
    } else {
      throw e;
    }
  }
  if (typeof parsed !== "object" || parsed === null) {
    throw error("expected: object");
  }
  if (!hasSuccess(parsed)) {
    throw error("field not found or invalid: success");
  }
  if (!hasColor(parsed)) {
    throw error("field not found or invalid: color");
  }
  return parsed;
};

const hasSuccess = (parsed: {}): parsed is { success: boolean } =>
  (parsed as Confirmation).success !== undefined &&
  typeof (parsed as Confirmation).success === "boolean";

const hasColor = (parsed: {}): parsed is HasColor =>
  (parsed as Confirmation).color === "blue" ||
  (parsed as Confirmation).color === "green";
