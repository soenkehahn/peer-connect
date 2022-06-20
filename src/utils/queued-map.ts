type Data = string | number | null | Array<Data> | { [key: string]: Data };

export type QueuedMap<_Key extends Data, Value> = Map<string, Array<Value>>;

export const newQueuedMap = <Key extends Data, Value>(): QueuedMap<
  Key,
  Value
> => new Map();

export const pushMatch = <Key extends Data, Value>(
  matches: QueuedMap<Key, Value>,
  key: Key,
  match: Value
): void => {
  const jsonKey = JSON.stringify(key);
  const array = matches.get(jsonKey);
  if (array) {
    array.push(match);
  } else {
    matches.set(jsonKey, [match]);
  }
};

export const popMatch = <Key extends Data, Value>(
  matches: QueuedMap<Key, Value>,
  key: Key
): null | Value => {
  const jsonKey = JSON.stringify(key);
  const array = matches.get(jsonKey);
  if (array) {
    const result = array.pop() as Value;
    if (array.length === 0) {
      matches.delete(jsonKey);
    }
    return result;
  }
  return null;
};
