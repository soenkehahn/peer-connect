import { websocketChannel, Channel } from "./utils/channel";

export type Peer = Channel;

export const connect = async (args: {
  url: string;
  offer: string;
  seek: string;
}): Promise<Peer> => {
  let channel = await websocketChannel(
    `${args.url}/?offer=${args.offer}&seek=${args.seek}`
  );
  let confirmation = await channel.next();
  if (confirmation !== JSON.stringify({ success: true })) {
    throw new Error("unexpected signaling server message: " + confirmation);
  }
  return channel;
};
