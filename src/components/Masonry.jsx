"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { useGallery } from "./GalleryProvider";
import { preloadImages } from "@/lib/imageCache";

// RESPONSIVE BREAKPOINTS AND COLUMNS
// Breakpoint widths for responsive column layout (px)
const BREAKPOINT_XL = 1500;
const BREAKPOINT_LG = 1000;
const BREAKPOINT_MD = 600;
const BREAKPOINT_SM = 400;
// Column counts for each breakpoint
const COLUMNS_XL = 5;
const COLUMNS_LG = 4;
const COLUMNS_MD = 3;
const COLUMNS_SM = 2;
const COLUMNS_XS = 1;

// LAYOUT CONFIGURATION
// Gap between masonry items (px)
const GAP = 16;
// Height multiplier for items (divides original height)
const HEIGHT_MULTIPLIER = 2;
// Bottom padding for container (px)
const CONTAINER_BOTTOM_PADDING = 16;

// ANIMATION CONFIGURATION
// Default animation duration (seconds)
const DEFAULT_DURATION = 0.6;
// Initial mount animation duration (seconds)
const INITIAL_ANIMATION_DURATION = 0.8;
// Stagger delay between items (seconds)
const DEFAULT_STAGGER = 0.05;
// Hover animation duration (seconds)
const HOVER_ANIMATION_DURATION = 0.3;
// Initial blur amount for blur-to-focus effect (px)
const INITIAL_BLUR = 10;
// Final blur amount (px)
const FINAL_BLUR = 0;
// Hover scale factor
const DEFAULT_HOVER_SCALE = 0.95;
// Color overlay opacity on hover
const COLOR_OVERLAY_HOVER_OPACITY = 0.3;
// Color overlay default opacity
const COLOR_OVERLAY_DEFAULT_OPACITY = 0;

// INITIAL POSITION OFFSETS
// Offset for items animating from top/bottom (px)
const VERTICAL_OFFSET = 200;
// Offset for items animating from left/right (px)
const HORIZONTAL_OFFSET = 200;
// Default fallback offset (px)
const DEFAULT_OFFSET = 100;

const useMedia = (queries, values, defaultValue) => {
  const get = () =>
    values[queries.findIndex((q) => matchMedia(q).matches)] ?? defaultValue;

  const [value, setValue] = useState(get);

  useEffect(() => {
    const handler = () => setValue(get);
    queries.forEach((q) => matchMedia(q).addEventListener("change", handler));
    return () =>
      queries.forEach((q) =>
        matchMedia(q).removeEventListener("change", handler),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queries]);

  return value;
};

const useMeasure = () => {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  return [ref, size];
};

const Masonry = ({
  items,
  ease = "power3.out",
  duration = 0.6,
  stagger = 0.05,
  animateFrom = "bottom",
  scaleOnHover = true,
  hoverScale = 0.95,
  blurToFocus = true,
  colorShiftOnHover = false,
}) => {
  const columns = useMedia(
    [
      `(min-width:${BREAKPOINT_XL}px)`,
      `(min-width:${BREAKPOINT_LG}px)`,
      `(min-width:${BREAKPOINT_MD}px)`,
      `(min-width:${BREAKPOINT_SM}px)`,
    ],
    [COLUMNS_XL, COLUMNS_LG, COLUMNS_MD, COLUMNS_SM],
    COLUMNS_XS,
  );

  const [containerRef, { width }] = useMeasure();
  const [imagesReady, setImagesReady] = useState(false);

  const getInitialPosition = (item) => {
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return { x: item.x, y: item.y };

    let direction = animateFrom;
    if (animateFrom === "random") {
      const dirs = ["top", "bottom", "left", "right"];
      direction = dirs[Math.floor(Math.random() * dirs.length)];
    }

    switch (direction) {
      case "top":
        return { x: item.x, y: -VERTICAL_OFFSET };
      case "bottom":
        return { x: item.x, y: window.innerHeight + VERTICAL_OFFSET };
      case "left":
        return { x: -HORIZONTAL_OFFSET, y: item.y };
      case "right":
        return { x: window.innerWidth + HORIZONTAL_OFFSET, y: item.y };
      case "center":
        return {
          x: containerRect.width / 2 - item.w / 2,
          y: containerRect.height / 2 - item.h / 2,
        };
      default:
        return { x: item.x, y: item.y + DEFAULT_OFFSET };
    }
  };

  useEffect(() => {
    const urls = items.map((i) => i.img);
    preloadImages(urls).then(() => setImagesReady(true));
  }, [items]);

  const grid = useMemo(() => {
    if (!width) return [];
    const colHeights = new Array(columns).fill(0);
    const totalGaps = (columns - 1) * GAP;
    const columnWidth = (width - totalGaps) / columns;

    return items.map((child) => {
      const col = colHeights.indexOf(Math.min(...colHeights));
      const x = col * (columnWidth + GAP);
      const height = child.height / HEIGHT_MULTIPLIER;
      const y = colHeights[col];

      colHeights[col] += height + GAP;
      return { ...child, x, y, w: columnWidth, h: height };
    });
  }, [columns, items, width]);

  const hasMounted = useRef(false);

  useLayoutEffect(() => {
    if (!imagesReady) return;

    grid.forEach((item, index) => {
      const selector = `[data-key="${item.id}"]`;

      if (!hasMounted.current) {
        const start = getInitialPosition(item);
        gsap.fromTo(
          selector,
          {
            opacity: 0,
            x: start.x,
            y: start.y,
            // Don't set width/height here since they're set in style
            ...(blurToFocus && { filter: `blur(${INITIAL_BLUR}px)` }),
          },
          {
            opacity: 1,
            x: item.x,
            y: item.y,
            ...(blurToFocus && { filter: `blur(${FINAL_BLUR}px)` }),
            duration: INITIAL_ANIMATION_DURATION,
            ease: "power3.out",
            delay: index * stagger,
          },
        );
      } else {
        gsap.to(selector, {
          x: item.x,
          y: item.y,
          width: item.w,
          height: item.h,
          duration,
          ease,
          overwrite: "auto",
        });
      }
    });

    hasMounted.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, imagesReady, stagger, animateFrom, blurToFocus, duration, ease]);

  const handleMouseEnter = (id, element) => {
    if (scaleOnHover) {
      gsap.to(`[data-key="${id}"]`, {
        scale: hoverScale,
        duration: HOVER_ANIMATION_DURATION,
        ease: "power2.out",
      });
    }
    if (colorShiftOnHover) {
      const overlay = element.querySelector(".color-overlay");
      if (overlay)
        gsap.to(overlay, {
          opacity: COLOR_OVERLAY_HOVER_OPACITY,
          duration: HOVER_ANIMATION_DURATION,
        });
    }
  };

  const handleMouseLeave = (id, element) => {
    if (scaleOnHover) {
      gsap.to(`[data-key="${id}"]`, {
        scale: 1,
        duration: HOVER_ANIMATION_DURATION,
        ease: "power2.out",
      });
    }
    if (colorShiftOnHover) {
      const overlay = element.querySelector(".color-overlay");
      if (overlay)
        gsap.to(overlay, {
          opacity: COLOR_OVERLAY_DEFAULT_OPACITY,
          duration: HOVER_ANIMATION_DURATION,
        });
    }
  };

  const containerHeight = useMemo(() => {
    if (grid.length === 0) return 0;
    return (
      Math.max(...grid.map((item) => item.y + item.h)) +
      CONTAINER_BOTTOM_PADDING
    );
  }, [grid]);

  const { openGallery, openAlbum } = useGallery();

  const handleItemClick = (clickedItem) => {
    if (clickedItem.type === "album" && clickedItem.albumItems) {
      // Open album in masonry view
      openAlbum(clickedItem.albumItems, clickedItem.albumName || "Album");
    } else {
      // Open gallery for images
      const clickedIndex = items.findIndex(
        (item) => item.id === clickedItem.id,
      );
      openGallery(items, clickedIndex);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: `${containerHeight}px` }}
    >
      {grid.map((item) => (
        <div
          key={item.id}
          data-key={item.id}
          className="absolute box-content cursor-pointer"
          style={{
            willChange: "transform, width, height, opacity",
            // Set initial positions immediately to prevent left-stacking
            transform: `translate3d(${item.x}px, ${item.y}px, 0)`,
            width: `${item.w}px`,
            height: `${item.h}px`,
            opacity: hasMounted.current ? 1 : 0, // Hide initially if not mounted
          }}
          onClick={() => handleItemClick(item)}
          onMouseEnter={(e) => handleMouseEnter(item.id, e.currentTarget)}
          onMouseLeave={(e) => handleMouseLeave(item.id, e.currentTarget)}
        >
          <div
            className="relative w-full h-full bg-cover bg-center shadow-[0px_10px_50px_-10px_rgba(0,0,0,0.2)] uppercase text-[10px] leading-[10px] transition-all duration-300"
            style={{ backgroundImage: `url(${item.img})` }}
          >
            {colorShiftOnHover && (
              <div className="color-overlay absolute inset-0 bg-gradient-to-tr from-pink-500/50 to-sky-500/50 opacity-0 pointer-events-none" />
            )}
            {/* Album indicator */}
            {item.type === "album" && (
              <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-medium">
                📁 {item.albumName || "Album"} ({item.albumItems?.length || 0})
              </div>
            )}
            {/* Hover overlay for better visual feedback */}
            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-all duration-300" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default Masonry;
