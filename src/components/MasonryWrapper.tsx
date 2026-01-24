"use client";

import dynamic from "next/dynamic";
import { Loader } from "lucide-react";
import { MediaItem } from "@/types/media";

// Dynamically import Masonry with SSR disabled
const Masonry = dynamic(() => import("./Masonry"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <Loader className="w-8 h-8 text-gray-400 animate-spin" />
    </div>
  ),
});

// Extended props interface to include selection mode
interface MasonryProps {
  items: MediaItem[];
  ease?: string;
  duration?: number;
  stagger?: number;
  animateFrom?: "top" | "bottom" | "left" | "right" | "center" | "random";
  scaleOnHover?: boolean;
  hoverScale?: number;
  blurToFocus?: boolean;
  colorShiftOnHover?: boolean;
  // Selection mode props
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: ((id: string) => void) | null;
}

// Type-safe wrapper that passes through all props
const MasonryWrapper = (props: MasonryProps) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <Masonry {...(props as any)} />;
};

export default MasonryWrapper;
