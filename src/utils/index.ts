export const wait = async (millis: number) =>
  new Promise((resolve) => setTimeout(resolve, millis));
