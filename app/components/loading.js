import React from 'react';

const Loading = () => {
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-[#0F110C] text-white">
      <div className="relative w-24 h-24">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-[#3C3D37] rounded-full animate-pulse"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-t-[#4A9C6D] rounded-full animate-spin"></div>
      </div>
      <p className="mt-8 text-2xl font-bold animate-pulse">
        Loading
        <span className="inline-flex overflow-hidden">
          <span className="animate-typing-dot">.</span>
          <span className="animate-typing-dot animation-delay-300">.</span>
          <span className="animate-typing-dot animation-delay-600">.</span>
        </span>
      </p>
    </div>
  );
};

export default Loading;
