import React from 'react';

const SkeletonLoader: React.FC = () => {
    return (
        <div className="w-full flex flex-col items-center justify-center min-h-[50vh] animate-pulse py-20 px-4">
            {/* Header skeleton */}
            <div className="w-3/4 md:w-1/2 h-12 bg-gray-200 dark:bg-zinc-800 rounded mb-8"></div>

            {/* Grid skeleton matching common SkillZone layouts */}
            <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map((item) => (
                    <div key={item} className="flex flex-col gap-4">
                        <div className="w-full h-48 md:h-64 bg-gray-200 dark:bg-zinc-800 rounded-lg"></div>
                        <div className="w-3/4 h-6 bg-gray-200 dark:bg-zinc-800 rounded"></div>
                        <div className="w-full h-20 bg-gray-100 dark:bg-zinc-900 rounded"></div>
                    </div>
                ))}
            </div>

            {/* Subtle branding hint */}
            <div className="mt-12 opacity-50 flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-sz-red animate-ping"></div>
                <span className="font-orbitron font-bold text-xs tracking-widest text-gray-400 uppercase">Loading Sector...</span>
            </div>
        </div>
    );
};

export default SkeletonLoader;
