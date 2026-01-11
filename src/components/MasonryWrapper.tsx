"use client";

import dynamic from "next/dynamic";
import { ComponentProps } from "react";
import { Loader } from "lucide-react";

// Dynamically import Masonry with SSR disabled
const Masonry = dynamic(() => import("./Masonry"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <Loader className="w-8 h-8 text-gray-400 animate-spin" />
    </div>
  ),
});

// Type-safe wrapper that passes through all props
const MasonryWrapper = (
  props: ComponentProps<typeof import("./Masonry").default>,
) => {
  return <Masonry {...props} />;
};

export default MasonryWrapper;
