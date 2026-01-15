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

// --- CONFIGURATION ---
const SPRING_CONFIG = { stiffness: 200, damping: 100, mass: 0.5 };
const WHEEL_SENSITIVITY = 1;
const GAP = 20;
const DRAG_THRESHOLD = 8;
const MOMENTUM_FACTOR = 0.12;
const VISIBILITY_BUFFER = 200; // Increased buffer for smoother entry

// Visual configuration
const DEFAULT_ITEM_HEIGHT = 400;
const MIN_ITEM_HEIGHT = 180;
const MAX_ITEM_HEIGHT = 500;
const EDGE_SCALE_FACTOR = 0.2;
const EDGE_OPACITY_FACTOR = 0.25;
const EDGE_Z_OFFSET = 80;
const PERSPECTIVE_DEPTH = 1200;

// Breakpoints for column sizing (keeping consistent with original design)
const BREAKPOINTS = {
  XXL: { width: 1800, cols: 6 },
  XL: { width: 1400, cols: 5 },
  LG: { width: 1000, cols: 4 },
  MD: { width: 700, cols: 3 },
  SM: { width: 500, cols: 2 },
};
const DEFAULT_COLUMNS = 4;

// --- TYPES ---
interface GridItem extends MediaItem {
  x: number;
  y: number;
  w: number;
  h: number;
  originalId: string;
}

interface InfiniteCanvasProps {
  items: MediaItem[];
  scaleOnHover?: boolean;
  hoverScale?: number;
}

// --- UTILS ---

// Standard modulo that handles negative numbers correctly: ((n % m) + m) % m
const mod = (n: number, m: number) => ((n % m) + m) % m;

// --- COMPONENT: GRID ITEM ---
const GridItemComponent = ({
  item,
  scrollX,
  scrollY,
  totalWidth,
  totalHeight,
  viewportSize,
  onItemClick,
  scaleOnHover,
  hoverScale,
  dragDistanceRef,
}: {
  item: GridItem;
  scrollX: MotionValue<number>;
  scrollY: MotionValue<number>;
  totalWidth: number;
  totalHeight: number;
  viewportSize: { width: number; height: number };
  onItemClick: (item: GridItem) => void;
  scaleOnHover: boolean;
  hoverScale: number;
  dragDistanceRef: React.MutableRefObject<number>;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

useAnimationFrame(() => {
  if (!ref.current || totalWidth === 0 || totalHeight === 0) return;

  const currentX = scrollX.get();
  const currentY = scrollY.get();

  // 1. Calculate raw position based on scroll (forces value between 0 and totalWidth)
  let wrappedX = mod(item.x + currentX, totalWidth);
  let wrappedY = mod(item.y + currentY, totalHeight);

  // 2. Smart Wrap Logic 
  // "If we shift this item to the left/top by subtracting totalWidth, is it visible?"
  
  // Check X axis
  const shiftX = wrappedX - totalWidth;
  if (wrappedX > viewportSize.width && shiftX > -(item.w + VISIBILITY_BUFFER)) {
    wrappedX -= totalWidth;
  }

  // Check Y axis
  const shiftY = wrappedY - totalHeight;
  if (wrappedY > viewportSize.height && shiftY > -(item.h + VISIBILITY_BUFFER)) {
    wrappedY -= totalHeight;
  }

  // 3. Calculate Parallax/Edge Effects
  const centerX = wrappedX + item.w / 2;
  const centerY = wrappedY + item.h / 2;
  
  const distX = Math.abs(centerX - viewportSize.width / 2) / (viewportSize.width / 2);
  const distY = Math.abs(centerY - viewportSize.height / 2) / (viewportSize.height / 2);
  
  const edgeFactor = Math.min(Math.max(distX, distY), 1); 

  const visible = 
    wrappedX + item.w > -VISIBILITY_BUFFER &&
    wrappedX < viewportSize.width + VISIBILITY_BUFFER &&
    wrappedY + item.h > -VISIBILITY_BUFFER &&
    wrappedY < viewportSize.height + VISIBILITY_BUFFER;

  if (visible) {
    const zOffset = edgeFactor * EDGE_Z_OFFSET;
    const scale = 1 - edgeFactor * EDGE_SCALE_FACTOR;
    const opacity = 1 - edgeFactor * EDGE_OPACITY_FACTOR;

    ref.current.style.transform = `translate3d(${wrappedX}px, ${wrappedY}px, ${-zOffset}px)`;
    ref.current.style.display = 'block'; 
    
    if (innerRef.current) {
      innerRef.current.style.transform = `scale(${scale})`;
      innerRef.current.style.opacity = String(opacity);
    }
  } else {
    ref.current.style.display = 'none';
  }
});

  return (
    <div
      ref={ref}
      className="absolute will-change-transform"
      style={{
        width: `${item.w}px`,
        height: `${item.h}px`,
        transformStyle: "preserve-3d",
      }}
      onClick={() => dragDistanceRef.current < DRAG_THRESHOLD && onItemClick(item)}
      onMouseEnter={() => scaleOnHover && setIsHovered(true)}
      onMouseLeave={() => scaleOnHover && setIsHovered(false)}
    >
      <div
        ref={innerRef}
        className="relative w-full h-full overflow-hidden rounded-sm cursor-pointer"
        style={{
          transformOrigin: "center center",
          transition: "transform 0.1s linear, opacity 0.1s linear" // Smooth out pure JS updates
        }}
      >
        {/* Inner Scale wrapper for Hover Effect */}
        <div 
          className="w-full h-full transition-transform duration-500 ease-out"
          style={{ transform: isHovered ? `scale(${hoverScale})` : "scale(1)" }}
        >
            {/* Image */}
            <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out"
            style={{
                backgroundImage: `url(${item.img})`,
                transform: isHovered ? "scale(1.05)" : "scale(1)",
            }}
            />

            {/* Overlay */}
            <div
            className="absolute inset-0 transition-opacity duration-300"
            style={{
                background: "linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.4) 100%)",
                opacity: isHovered ? 0.3 : 0.6,
            }}
            />

            {/* Hover Glow */}
            <div
            className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
            style={{
                boxShadow: isHovered
                ? "inset 0 0 30px rgba(255,255,255,0.1), 0 20px 60px -20px rgba(0,0,0,0.5)"
                : "none",
                opacity: isHovered ? 1 : 0,
            }}
            />

            {/* Album Badge */}
            {item.type === "album" && (
            <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/50 backdrop-blur-md text-white/90 px-3 py-1.5 rounded-full text-xs font-medium tracking-wide">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                </svg>
                {item.albumName || "Album"} · {item.albumItems?.length || 0}
            </div>
            )}
        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

const InfiniteCanvas = ({
  items,
  scaleOnHover = true,
  hoverScale = 0.96,
}: InfiniteCanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [imagesReady, setImagesReady] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Physics State
  const rawScrollX = useMotionValue(0);
  const rawScrollY = useMotionValue(0);
  const scrollX = useSpring(rawScrollX, SPRING_CONFIG);
  const scrollY = useSpring(rawScrollY, SPRING_CONFIG);
  
  // Interaction Refs
  const velocityX = useRef(0);
  const velocityY = useRef(0);
  const dragDistanceRef = useRef(0);
  const isDragging = useRef(false);

  const { openGallery, openAlbum } = useGallery();

  // Detect Touch
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  useEffect(() => {
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  // Viewport Handling
  useLayoutEffect(() => {
    const updateSize = () => {
      setViewportSize({ width: window.innerWidth, height: window.innerHeight });
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Preload
  useEffect(() => {
    if(!items.length) return;
    preloadImages(items.map((i) => i.img)).then(() => {
      setImagesReady(true);
      setTimeout(() => setIsInitialized(true), 100);
    });
  }, [items]);

  // --- LAYOUT GENERATION ---
  // Calculates the grid ONCE. 
  // Solves the "repetition" issue by creating a roughly square grid regardless of viewport width.
  const { gridItems, totalWidth, totalHeight } = useMemo(() => {
    if (!viewportSize.width || items.length === 0) {
      return { gridItems: [], totalWidth: 0, totalHeight: 0 };
    }

    // 1. Determine Column Width based on responsive logic
    // We check what the "screen" column count would be to determine an appropriate tile width
    let screenCols = DEFAULT_COLUMNS;
    const w = viewportSize.width;
    if (w >= BREAKPOINTS.XXL.width) screenCols = BREAKPOINTS.XXL.cols;
    else if (w >= BREAKPOINTS.XL.width) screenCols = BREAKPOINTS.XL.cols;
    else if (w >= BREAKPOINTS.LG.width) screenCols = BREAKPOINTS.LG.cols;
    else if (w >= BREAKPOINTS.MD.width) screenCols = BREAKPOINTS.MD.cols;
    else if (w >= BREAKPOINTS.SM.width) screenCols = BREAKPOINTS.SM.cols;
    else screenCols = 2; // Mobile fallback

    // Calculate the physical width of a column based on screen size
    const columnWidth = (viewportSize.width - (screenCols - 1) * GAP - GAP * 2) / screenCols;

    // 2. Determine "Virtual" Grid Dimensions
    const idealCols = Math.ceil(Math.sqrt(items.length));
    const activeCols = Math.max(screenCols, idealCols); 

    // 3. Masonry Layout Algorithm
    const colHeights = new Array(activeCols).fill(0);
    const calculatedItems: GridItem[] = items.map((child) => {
        // Find shortest column
      const colIndex = colHeights.indexOf(Math.min(...colHeights));
      
      const x = GAP + colIndex * (columnWidth + GAP);
      const y = colHeights[colIndex];
      
      // Randomize height slightly for visual interest
      const baseHeight = child.height || DEFAULT_ITEM_HEIGHT;
      const h = Math.min(Math.max(baseHeight * 0.6, MIN_ITEM_HEIGHT), MAX_ITEM_HEIGHT);

      colHeights[colIndex] += h + GAP;

      return {
        ...child,
        originalId: child.id,
        x,
        y,
        w: columnWidth,
        h,
        column: colIndex,
      };
    });

    return {
      gridItems: calculatedItems,
      totalWidth: activeCols * (columnWidth + GAP) + GAP,
      totalHeight: Math.max(...colHeights) + GAP,
    };
  }, [items, viewportSize]);

  // --- EVENT HANDLERS ---
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    rawScrollX.set(rawScrollX.get() - e.deltaX * WHEEL_SENSITIVITY);
    rawScrollY.set(rawScrollY.get() - e.deltaY * WHEEL_SENSITIVITY);
  }, [rawScrollX, rawScrollY]);

  const handleDrag = useCallback((_: any, info: any) => {
    dragDistanceRef.current = Math.sqrt(info.offset.x ** 2 + info.offset.y ** 2);
    velocityX.current = info.velocity.x;
    velocityY.current = info.velocity.y;
    rawScrollX.set(rawScrollX.get() + info.delta.x);
    rawScrollY.set(rawScrollY.get() + info.delta.y);
  }, [rawScrollX, rawScrollY]);

  const handleDragEnd = useCallback(() => {
    isDragging.current = false;
    const targetX = rawScrollX.get() + velocityX.current * MOMENTUM_FACTOR;
    const targetY = rawScrollY.get() + velocityY.current * MOMENTUM_FACTOR;
    rawScrollX.set(targetX);
    rawScrollY.set(targetY);
  }, [rawScrollX, rawScrollY]);

  // --- RENDER LOADING ---
  if (!imagesReady || items.length === 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0a0a0a]">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
      </div>
    );
  }

  // --- RENDER MAIN ---
  return (
    <motion.div
      ref={containerRef}
      className={`fixed inset-0 overflow-hidden ${isTouchDevice ? "cursor-grab active:cursor-grabbing" : ""}`}
      style={{
        background: `radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0a 100%)`,
        perspective: `${PERSPECTIVE_DEPTH}px`,
        touchAction: "none",
      }}
      onWheel={handleWheel}
      drag={isTouchDevice}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} // Infinite drag
      dragElastic={0}
      dragMomentum={false} // We handle momentum manually via springs
      onDragStart={() => { isDragging.current = true; dragDistanceRef.current = 0; }}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      initial={{ opacity: 0 }}
      animate={{ opacity: isInitialized ? 1 : 0 }}
      transition={{ duration: 0.8 }}
    >
        {/* Background Gradients/Vignette */}
      <div className="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(transparent_30%,rgba(0,0,0,0.6)_100%)]" />
      <div className="absolute top-0 left-0 w-64 h-64 pointer-events-none z-10 opacity-30 bg-[radial-gradient(circle_at_top_left,rgba(100,100,255,0.1),transparent_70%)]" />
      
      {/* 3D Container */}
      <div className="absolute inset-0 preserve-3d">
        {gridItems.map((item) => (
          <GridItemComponent
            key={item.id}
            item={item}
            scrollX={scrollX}
            scrollY={scrollY}
            totalWidth={totalWidth}
            totalHeight={totalHeight}
            viewportSize={viewportSize}
            onItemClick={(item) => {
               // Map back to original dataset index
               const index = items.findIndex(i => i.id === item.originalId);
               if(item.type === "album" && item.albumItems) {
                   openAlbum(item.albumItems, item.albumName || "Album");
               } else {
                   openGallery(items, index);
               }
            }}
            scaleOnHover={scaleOnHover}
            hoverScale={hoverScale}
            dragDistanceRef={dragDistanceRef}
          />
        ))}
      </div>

      {/* Instructions */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
      >
        <div className="flex items-center gap-3 px-5 py-2.5 bg-white/5 backdrop-blur-xl rounded-full border border-white/10">
          <span className="text-white/50 text-xs tracking-[0.2em] uppercase font-light">
            {isTouchDevice ? "Drag to explore" : "Scroll to explore"}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default InfiniteCanvas;