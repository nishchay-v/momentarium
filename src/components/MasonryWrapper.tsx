'use client';

import dynamic from 'next/dynamic';
import { ComponentProps } from 'react';

// Dynamically import Masonry with SSR disabled
const Masonry = dynamic(() => import('./Masonry'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-500">Loading gallery...</div>
    </div>
  ),
});

// Type-safe wrapper that passes through all props
const MasonryWrapper = (props: ComponentProps<typeof import('./Masonry').default>) => {
  return <Masonry {...props} />;
};

export default MasonryWrapper;