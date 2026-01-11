"use client";

import {
  useRef,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useAnimationFrame,
  MotionValue,
} from "framer-motion";
import { useGallery, MediaItem } from "./GalleryProvider";
import { preloadImages } from "@/lib/imageCache";

// PHYSICS CONFIGURATION - "Weighty" Premium Feel
const SPRING_CONFIG = {
  stiffness: 200, // Lower = more elastic, rubbery
  damping: 100, // Lower = more bouncy
  mass: 1, // Higher = heavier, more momentum
};

// Wheel sensitivity
const WHEEL_SENSITIVITY = 1;

// Gap between items
const GAP = 20;

// Drag threshold for click detection
const DRAG_THRESHOLD = 8;

// RESPONSIVE BREAKPOINTS AND COLUMNS
// Breakpoint widths for responsive column layout (px)
const BREAKPOINT_XXL = 1800;
const BREAKPOINT_XL = 1400;
const BREAKPOINT_LG = 1000;
const BREAKPOINT_MD = 700;
const BREAKPOINT_SM = 500;
// Column counts for each breakpoint
const COLUMNS_XXL = 6;
const COLUMNS_XL = 5;
const COLUMNS_LG = 4;
const COLUMNS_MD = 3;
const COLUMNS_SM = 2;
// Default column count
const DEFAULT_COLUMNS = 4;

// EDGE EFFECTS CONFIGURATION
// Scale reduction factor as items approach edges (0-1)
const EDGE_SCALE_FACTOR = 0.2;
// Opacity reduction factor as items approach edges (0-1)
const EDGE_OPACITY_FACTOR = 0.25;
// Z-depth offset multiplier for edge effect (px)
const EDGE_Z_OFFSET_MULTIPLIER = 80;
// Visibility buffer zone around viewport (px)
const VISIBILITY_BUFFER = 100;

// GRID LAYOUT CONFIGURATION
// Default item height if not provided (px)
const DEFAULT_ITEM_HEIGHT = 400;
// Height scaling factor for items
const HEIGHT_SCALE_FACTOR = 0.6;
// Minimum item height (px)
const MIN_ITEM_HEIGHT = 180;
// Maximum item height (px)
const MAX_ITEM_HEIGHT = 500;

// ANIMATION CONFIGURATION
// Initialization delay after images load (ms)
const INITIALIZATION_DELAY = 100;
// Momentum factor for drag inertia (seconds equivalent)
const MOMENTUM_FACTOR = 0.12;
// Default hover scale for items
const DEFAULT_HOVER_SCALE = 0.96;
// Image hover scale on inner element
const IMAGE_HOVER_SCALE = 1.05;
// Overlay opacity when hovered
const OVERLAY_HOVER_OPACITY = 0.3;
// Overlay opacity when not hovered
const OVERLAY_DEFAULT_OPACITY = 0.6;
// Transition duration for transforms (ms)
const TRANSFORM_DURATION = 500;
// Transition duration for image scale (ms)
const IMAGE_SCALE_DURATION = 700;
// Transition duration for overlay opacity (ms)
const OVERLAY_OPACITY_DURATION = 300;
// Canvas fade-in duration (seconds)
const CANVAS_FADE_DURATION = 0.8;
// Canvas fade-in easing curve
const CANVAS_FADE_EASING: [number, number, number, number] = [0.22, 1, 0.36, 1];
// Instruction overlay delay (seconds)
const INSTRUCTION_OVERLAY_DELAY = 1.2;
// Instruction overlay duration (seconds)
const INSTRUCTION_OVERLAY_DURATION = 0.6;

// Pulse animation delays for instruction dots (seconds)
const PULSE_DELAY_1 = 0.2;
const PULSE_DELAY_2 = 0.4;

// Perspective depth for 3D transforms (px)
const PERSPECTIVE_DEPTH = 1200;

// TYPES
interface GridItem extends MediaItem {
  x: number;
  y: number;
  w: number;
  h: number;
  column: number;
  originalId: string;
}

interface InfiniteCanvasProps {
  items: MediaItem[];
  scaleOnHover?: boolean;
  hoverScale?: number;
}

// UTILITY FUNCTIONS

// Wrap function for true infinite scrolling - keeps value in [0, max) range
const wrap = (value: number, max: number): number => {
  if (max === 0) return 0;
  return ((value % max) + max) % max;
};

// Calculate edge distance factor (0 at center, 1 at edge)
const getEdgeFactor = (
  x: number,
  y: number,
  width: number,
  height: number,
  itemW: number,
  itemH: number,
  viewportW: number,
  viewportH: number,
): number => {
  const centerX = x + itemW / 2;
  const centerY = y + itemH / 2;

  // Distance from center of viewport as percentage
  const distX = Math.abs(centerX - viewportW / 2) / (viewportW / 2);
  const distY = Math.abs(centerY - viewportH / 2) / (viewportH / 2);

  // Use max distance for edge effect
  return Math.min(Math.max(distX, distY), 1);
};

// RESPONSIVE COLUMNS HOOK
const useColumns = () => {
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);

  useEffect(() => {
    const getColumns = () => {
      const width = window.innerWidth;
      if (width >= BREAKPOINT_XXL) return COLUMNS_XXL;
      if (width >= BREAKPOINT_XL) return COLUMNS_XL;
      if (width >= BREAKPOINT_LG) return COLUMNS_LG;
      if (width >= BREAKPOINT_MD) return COLUMNS_MD;
      if (width >= BREAKPOINT_SM) return COLUMNS_SM;
      return COLUMNS_SM;
    };

    setColumns(getColumns());

    const handleResize = () => setColumns(getColumns());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return columns;
};

// GRID ITEM COMPONENT
// Each item updates its position via animation frame for GPU-accelerated movement
const GridItemComponent = ({
  item,
  scrollX,
  scrollY,
  tileWidth,
  tileHeight,
  viewportWidth,
  viewportHeight,
  onItemClick,
  scaleOnHover,
  hoverScale,
  dragDistanceRef,
}: {
  item: GridItem;
  scrollX: MotionValue<number>;
  scrollY: MotionValue<number>;
  tileWidth: number;
  tileHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  onItemClick: (item: GridItem) => void;
  scaleOnHover: boolean;
  hoverScale: number;
  dragDistanceRef: React.MutableRefObject<number>;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Use animation frame for GPU-accelerated position updates
  useAnimationFrame(() => {
    if (!ref.current || tileWidth === 0 || tileHeight === 0) return;

    const currentScrollX = scrollX.get();
    const currentScrollY = scrollY.get();

    // Calculate wrapped position using modulo for infinite scrolling
    // The wrap function returns a value in [0, tileWidth) / [0, tileHeight)
    let wrappedX = wrap(item.x + currentScrollX, tileWidth);
    let wrappedY = wrap(item.y + currentScrollY, tileHeight);

    // Shift items to create seamless infinite scrolling
    // We need items to appear both before and after the viewport
    // Center the wrapped position so items tile correctly in both directions
    if (wrappedX > viewportWidth + item.w) {
      wrappedX -= tileWidth;
    }
    if (wrappedY > viewportHeight + item.h) {
      wrappedY -= tileHeight;
    }

    // Calculate edge effects for parallax/lens effect
    const edgeFactor = getEdgeFactor(
      wrappedX,
      wrappedY,
      item.w,
      item.h,
      item.w,
      item.h,
      viewportWidth,
      viewportHeight,
    );

    // Scale decreases slightly as items approach edges
    const edgeScale = 1 - edgeFactor * EDGE_SCALE_FACTOR;

    // Opacity decreases as items approach edges (subtle)
    const edgeOpacity = 1 - edgeFactor * EDGE_OPACITY_FACTOR;

    // Z-depth effect - items near center come forward slightly
    const zOffset = edgeFactor * EDGE_Z_OFFSET_MULTIPLIER;

    // Check visibility with extended buffer
    const buffer = VISIBILITY_BUFFER;
    const visible =
      wrappedX + item.w > -buffer &&
      wrappedX < viewportWidth + buffer &&
      wrappedY + item.h > -buffer &&
      wrappedY < viewportHeight + buffer;

    // GPU-accelerated transform with 3D for depth
    ref.current.style.transform = `translate3d(${wrappedX}px, ${wrappedY}px, ${-zOffset}px)`;
    ref.current.style.visibility = visible ? "visible" : "hidden";
    ref.current.style.pointerEvents = visible ? "auto" : "none";

    // Apply edge effects to inner element for smooth transitions
    if (innerRef.current) {
      innerRef.current.style.transform = `scale(${edgeScale})`;
      innerRef.current.style.opacity = String(edgeOpacity);
    }
  });

  const handleClick = () => {
    if (dragDistanceRef.current < DRAG_THRESHOLD) {
      onItemClick(item);
    }
  };

  return (
    <div
      ref={ref}
      className="absolute"
      style={{
        width: `${item.w}px`,
        height: `${item.h}px`,
        willChange: "transform",
        transformStyle: "preserve-3d",
      }}
      onClick={handleClick}
      onMouseEnter={() => scaleOnHover && setIsHovered(true)}
      onMouseLeave={() => scaleOnHover && setIsHovered(false)}
    >
      <div
        ref={innerRef}
        className="relative w-full h-full transition-transform ease-out cursor-pointer overflow-hidden rounded-sm"
        style={{
          transformOrigin: "center center",
          transform: isHovered ? `scale(${hoverScale})` : "scale(1)",
          transitionDuration: `${TRANSFORM_DURATION}ms`,
        }}
      >
        {/* Main Image */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform ease-out"
          style={{
            backgroundImage: `url(${item.img})`,
            transform: isHovered ? `scale(${IMAGE_HOVER_SCALE})` : "scale(1)",
            transitionDuration: `${IMAGE_SCALE_DURATION}ms`,
          }}
        />

        {/* Overlay gradient for depth */}
        <div
          className="absolute inset-0 transition-opacity"
          style={{
            background:
              "linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.4) 100%)",
            opacity: isHovered
              ? OVERLAY_HOVER_OPACITY
              : OVERLAY_DEFAULT_OPACITY,
            transitionDuration: `${OVERLAY_OPACITY_DURATION}ms`,
          }}
        />

        {/* Hover glow effect */}
        <div
          className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
          style={{
            boxShadow: isHovered
              ? "inset 0 0 30px rgba(255,255,255,0.1), 0 20px 60px -20px rgba(0,0,0,0.5)"
              : "inset 0 0 0 rgba(255,255,255,0)",
            opacity: isHovered ? 1 : 0,
          }}
        />

        {/* Album indicator */}
        {item.type === "album" && (
          <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/50 backdrop-blur-md text-white/90 px-3 py-1.5 rounded-full text-xs font-medium tracking-wide">
            <svg
              className="w-3.5 h-3.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            </svg>
            {item.albumName || "Album"} · {item.albumItems?.length || 0}
          </div>
        )}
      </div>
    </div>
  );
};

const InfiniteCanvas = ({
  items,
  scaleOnHover = true,
  hoverScale = DEFAULT_HOVER_SCALE,
}: InfiniteCanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const columns = useColumns();
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [imagesReady, setImagesReady] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // MOTION VALUES - Core of the infinite canvas physics

  // Raw scroll values (set directly by drag/wheel)
  const rawScrollX = useMotionValue(0);
  const rawScrollY = useMotionValue(0);

  // Spring-smoothed values for rendering (provides inertia)
  const scrollX = useSpring(rawScrollX, SPRING_CONFIG);
  const scrollY = useSpring(rawScrollY, SPRING_CONFIG);

  // Velocity tracking for momentum
  const velocityX = useRef(0);
  const velocityY = useRef(0);
  const lastDragTime = useRef(Date.now());
  const dragDistanceRef = useRef(0);
  const isDragging = useRef(false);

  const { openGallery, openAlbum } = useGallery();

  // PRELOAD IMAGES
  useEffect(() => {
    const urls = items.map((i) => i.img);
    preloadImages(urls).then(() => {
      setImagesReady(true);
      // Slight delay for smooth entrance
      setTimeout(() => setIsInitialized(true), INITIALIZATION_DELAY);
    });
  }, [items]);

  // VIEWPORT SIZE TRACKING
  // Use window dimensions directly for fixed inset-0 container
  // This ensures we have correct dimensions on initial load before container mounts
  useLayoutEffect(() => {
    const updateSize = () => {
      // For fixed inset-0 container, use window dimensions directly
      // This avoids the issue where containerRef isn't available during loading state
      setViewportSize({ width: window.innerWidth, height: window.innerHeight });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // GRID LAYOUT CALCULATION
  // Creates the "tile" that repeats infinitely in all directions
  // Optimized to create minimal DOM elements - only enough to cover viewport + buffer
  const { grid, tileWidth, tileHeight } = useMemo(() => {
    if (!viewportSize.width || items.length === 0) {
      return { grid: [], tileWidth: 0, tileHeight: 0 };
    }

    const colHeights = new Array(columns).fill(0);
    const totalGaps = (columns - 1) * GAP;
    const columnWidth = (viewportSize.width - totalGaps - GAP * 2) / columns;

    const gridItems: GridItem[] = items.map((child) => {
      const col = colHeights.indexOf(Math.min(...colHeights));
      const x = GAP + col * (columnWidth + GAP);
      // Vary heights more dramatically for visual interest
      const baseHeight = child.height || DEFAULT_ITEM_HEIGHT;
      const height = Math.min(
        Math.max(baseHeight * HEIGHT_SCALE_FACTOR, MIN_ITEM_HEIGHT),
        MAX_ITEM_HEIGHT,
      );
      const y = colHeights[col];

      colHeights[col] += height + GAP;

      return {
        ...child,
        originalId: child.id,
        x,
        y,
        w: columnWidth,
        h: height,
        column: col,
      };
    });

    // Tile dimensions for wrapping
    const tileH = Math.max(...colHeights) + GAP;
    const tileW = viewportSize.width;

    // Calculate minimal tile copies needed:
    // - Horizontally: tileW equals viewportWidth, so we only need 1 copy (0 and -1 for wrap)
    // - Vertically: need enough to cover viewport height with buffer
    const repeatY = Math.max(1, Math.ceil(viewportSize.height / tileH));

    const expandedGrid: GridItem[] = [];

    // Only create tiles for x = 0 (since tileW = viewportWidth, the wrap logic handles seamless scrolling)
    // For Y, create just enough tiles to fill viewport + one buffer tile
    for (let ry = 0; ry <= repeatY; ry++) {
      gridItems.forEach((item) => {
        expandedGrid.push({
          ...item,
          id: `${item.id}-0-${ry}`,
          x: item.x,
          y: item.y + ry * tileH,
        });
      });
    }

    return {
      grid: expandedGrid,
      tileWidth: tileW,
      tileHeight: tileH,
    };
  }, [items, columns, viewportSize.width, viewportSize.height]);

  // WHEEL HANDLER - Smooth trackpad/mouse wheel scrolling
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();

      // Apply wheel delta to raw values (spring will smooth it)
      const deltaX = e.deltaX * WHEEL_SENSITIVITY;
      const deltaY = e.deltaY * WHEEL_SENSITIVITY;

      rawScrollX.set(rawScrollX.get() - deltaX);
      rawScrollY.set(rawScrollY.get() - deltaY);
    },
    [rawScrollX, rawScrollY],
  );

  // DRAG HANDLERS - Weighty drag with momentum
  const handleDragStart = useCallback(() => {
    isDragging.current = true;
    dragDistanceRef.current = 0;
    velocityX.current = 0;
    velocityY.current = 0;
    lastDragTime.current = Date.now();
  }, []);

  const handleDrag = useCallback(
    (
      _: MouseEvent | TouchEvent | PointerEvent,
      info: {
        delta: { x: number; y: number };
        velocity: { x: number; y: number };
        offset: { x: number; y: number };
      },
    ) => {
      const now = Date.now();

      // Track cumulative drag distance
      dragDistanceRef.current = Math.sqrt(
        info.offset.x ** 2 + info.offset.y ** 2,
      );

      // Store velocity for momentum
      velocityX.current = info.velocity.x;
      velocityY.current = info.velocity.y;
      lastDragTime.current = now;

      // Update raw scroll position (spring smooths it)
      rawScrollX.set(rawScrollX.get() + info.delta.x);
      rawScrollY.set(rawScrollY.get() + info.delta.y);
    },
    [rawScrollX, rawScrollY],
  );

  const handleDragEnd = useCallback(() => {
    isDragging.current = false;

    // Apply momentum - continue in direction of velocity
    const targetX = rawScrollX.get() + velocityX.current * MOMENTUM_FACTOR;
    const targetY = rawScrollY.get() + velocityY.current * MOMENTUM_FACTOR;

    // Use inertia config for post-drag animation
    rawScrollX.set(targetX);
    rawScrollY.set(targetY);
  }, [rawScrollX, rawScrollY]);

  // ITEM CLICK HANDLER
  const handleItemClick = useCallback(
    (clickedItem: GridItem) => {
      const originalItem =
        items.find((item) => item.id === clickedItem.originalId) || clickedItem;

      if (originalItem.type === "album" && originalItem.albumItems) {
        openAlbum(originalItem.albumItems, originalItem.albumName || "Album");
      } else {
        const clickedIndex = items.findIndex(
          (item) => item.id === clickedItem.originalId,
        );
        openGallery(items, Math.max(0, clickedIndex));
      }
    },
    [items, openGallery, openAlbum],
  );

  // LOADING STATE
  if (!imagesReady || items.length === 0) {
    return (
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
              style={{
                animationDirection: "reverse",
                animationDuration: "1.5s",
              }}
            />
          </div>
          <p className="text-white/40 text-sm tracking-widest uppercase">
            Loading Gallery
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden cursor-grab active:cursor-grabbing"
      style={{
        touchAction: "none",
        perspective: `${PERSPECTIVE_DEPTH}px`,
        perspectiveOrigin: "50% 50%",
        background: `
          radial-gradient(ellipse at 30% 20%, rgba(40, 40, 60, 0.4) 0%, transparent 50%),
          radial-gradient(ellipse at 70% 80%, rgba(30, 30, 50, 0.3) 0%, transparent 50%),
          linear-gradient(135deg, #0a0a0a 0%, #12121f 50%, #0a0a0a 100%)
        `,
      }}
      onWheel={handleWheel}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0}
      dragMomentum={false}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      initial={{ opacity: 0 }}
      animate={{ opacity: isInitialized ? 1 : 0 }}
      transition={{ duration: CANVAS_FADE_DURATION, ease: CANVAS_FADE_EASING }}
    >
      {/* Vignette overlay for depth */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: `
            radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.6) 100%)
          `,
        }}
      />

      {/* Grid container with 3D perspective */}
      <div
        className="absolute inset-0"
        style={{
          transformStyle: "preserve-3d",
        }}
      >
        {grid.map((item) => (
          <GridItemComponent
            key={item.id}
            item={item}
            scrollX={scrollX}
            scrollY={scrollY}
            tileWidth={tileWidth}
            tileHeight={tileHeight}
            viewportWidth={viewportSize.width}
            viewportHeight={viewportSize.height}
            onItemClick={handleItemClick}
            scaleOnHover={scaleOnHover}
            hoverScale={hoverScale}
            dragDistanceRef={dragDistanceRef}
          />
        ))}
      </div>

      {/* Subtle instruction overlay */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: INSTRUCTION_OVERLAY_DELAY,
          duration: INSTRUCTION_OVERLAY_DURATION,
        }}
      >
        <div className="flex items-center gap-3 px-5 py-2.5 bg-white/5 backdrop-blur-xl rounded-full border border-white/10">
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />
            <div
              className="w-1.5 h-1.5 rounded-full bg-white/30 animate-pulse"
              style={{ animationDelay: `${PULSE_DELAY_1}s` }}
            />
            <div
              className="w-1.5 h-1.5 rounded-full bg-white/20 animate-pulse"
              style={{ animationDelay: `${PULSE_DELAY_2}s` }}
            />
          </div>
          <span className="text-white/50 text-xs tracking-[0.2em] uppercase font-light">
            Drag to explore · Click to view
          </span>
        </div>
      </motion.div>

      {/* Corner gradient accents */}
      <div
        className="absolute top-0 left-0 w-64 h-64 pointer-events-none z-10 opacity-30"
        style={{
          background:
            "radial-gradient(circle at top left, rgba(100, 100, 255, 0.1) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-64 h-64 pointer-events-none z-10 opacity-30"
        style={{
          background:
            "radial-gradient(circle at bottom right, rgba(255, 100, 100, 0.08) 0%, transparent 70%)",
        }}
      />
    </motion.div>
  );
};

export default InfiniteCanvas;
