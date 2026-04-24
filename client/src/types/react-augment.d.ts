// src/types/react-augment.d.ts
import type { AriaAttributes, DOMAttributes } from "react";

declare module 'react' {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    // Allows any attribute starting with data- to be a string
    [key: `data-${string}`]: string | undefined;
  }
}
