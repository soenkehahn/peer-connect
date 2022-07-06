export const wait = async (millis: number) =>
  new Promise((resolve) => setTimeout(resolve, millis));

export const waitFor = async (millis: number, test: () => void) => {
  let counter = 0;
  while (true) {
    try {
      test();
    } catch (e) {
      await wait(50);
      counter += 50;
      if (counter > millis) {
        throw e;
      }
      continue;
    }
    break;
  }
};

export const expectToHang = async (
  millis: number,
  promises: Array<Promise<unknown>>
): Promise<void> => {
  const unique = Math.random();
  const result = await Promise.race([
    wait(millis).then(() => unique),
    ...promises,
  ]);
  if (result !== unique) {
    throw new Error(
      `expectToHang: Promise resolved to: ${JSON.stringify(result)}`
    );
  }
};

export const checkNever = (input: never) => {
  throw new Error("not never: " + input);
};
