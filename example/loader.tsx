import React, { createElement, useEffect } from "react";
import { ComponentType, ReactElement, useState } from "react";

export function withLoader<T>(
  load: () => Promise<T>,
  makeComponent: (loaded: T) => ComponentType
): ReactElement {
  const [inner, setInner] = useState<ReactElement>(<div>loading...</div>);
  useEffect(() => {
    (async () => {
      const t = await load();
      setInner(createElement(makeComponent(t)));
    })();
  }, []);
  return inner;
}
