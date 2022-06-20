import { Channel, websocketChannel } from "./utils/channel";
export { Channel } from "./utils/channel";

export type HasColor = { color: "blue" | "green" };

export const connect = async (args: {
  url: string;
  offer: string;
  seek: string;
}): Promise<Channel & HasColor> => {
  let channel = await websocketChannel(
    `${args.url}/?offer=${args.offer}&seek=${args.seek}`
  );
  let confirmation = parseConfirmation(await channel.next());
  if (!confirmation.success) {
    throw new Error("unexpected signaling server message: " + confirmation);
  }
  return { ...channel, color: confirmation.color };
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
