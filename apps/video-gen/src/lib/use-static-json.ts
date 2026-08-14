import { useState, useEffect } from "react";
import { staticFile, delayRender, continueRender } from "remotion";

/** Fetch a staged staticFile JSON, delaying the frame until it resolves. Returns
 *  null until loaded (or on fetch error — the caller degrades gracefully). */
export function useStaticJson<T>(path: string, label: string): T | null {
  const [data, setData] = useState<T | null>(null);
  useEffect(() => {
    const handle = delayRender(label);
    fetch(staticFile(path))
      .then((r) => {
        if (!r.ok) throw new Error(`${path} fetch ${r.status}`);
        return r.json() as Promise<T>;
      })
      .then((d) => {
        setData(d);
        continueRender(handle);
      })
      .catch((e) => {
        console.error(`${path} load failed:`, e);
        continueRender(handle);
      });
  }, [path, label]);
  return data;
}
