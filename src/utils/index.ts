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
