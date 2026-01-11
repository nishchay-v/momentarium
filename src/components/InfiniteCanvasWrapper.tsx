"use client";

import dynamic from "next/dynamic";
import { ComponentProps } from "react";

// Dynamically import InfiniteCanvas with SSR disabled
const InfiniteCanvas = dynamic(() => import("./InfiniteCanvas"), {
  ssr: false,
  loading: () => (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        background:
          "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)",
      }}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-white/60 animate-spin" />
          <div
            className="absolute inset-0 w-12 h-12 rounded-full border-2 border-transparent border-b-white/30 animate-spin"
            style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
          />
        </div>
        <p className="text-white/40 text-sm tracking-widest uppercase">
          Loading Gallery
        </p>
      </div>
    </div>
  ),
});

// Type-safe wrapper that passes through all props
const InfiniteCanvasWrapper = (
  props: ComponentProps<typeof import("./InfiniteCanvas").default>,
) => {
  return <InfiniteCanvas {...props} />;
};

export default InfiniteCanvasWrapper;
