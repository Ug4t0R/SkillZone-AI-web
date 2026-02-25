
import React from 'react';

const CyberSeparator: React.FC = React.memo(() => {
  return (
    <div className="w-full h-6 bg-transparent relative overflow-hidden flex items-center justify-center py-2">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-sz-red/40 to-transparent"></div>
      </div>
      <div className="relative z-10 px-4 bg-dark-bg">
        <div className="flex items-center gap-1">
          <div className="w-1 h-1 bg-sz-red/50 rounded-full"></div>
          <div className="w-2 h-2 border border-sz-red rotate-45 bg-dark-bg"></div>
          <div className="w-1 h-1 bg-sz-red/50 rounded-full"></div>
        </div>
      </div>
    </div>
  );
});

CyberSeparator.displayName = 'CyberSeparator';

export default CyberSeparator;
