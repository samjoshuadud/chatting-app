import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const RoomNotFound = () => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsOpen(true);
  }, []);

  const closeModal = () => {
    setIsOpen(false);
    router.push('/join');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0F110C]">
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-[#181C14] rounded-lg p-8 w-[29rem] transform transition-all duration-300 ease-in-out animate-scale-in">
            <div className="flex justify-center mb-6">
              <svg className="w-16 h-16 text-[#4A9C6D]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white text-center mb-4">Room Not Found</h2>
            <p className="text-gray-300 text-center mb-6">
              Oops! The room you're looking for doesn't exist or has been removed.
            </p>
            <div className="flex justify-center">
              <button
                onClick={closeModal}
                className="bg-[#4A9C6D] text-white font-bold px-6 py-3 rounded-lg transition-all duration-300 ease-in-out hover:bg-[#5ABD82] hover:shadow-lg transform hover:translate-y-[-2px] active:translate-y-[1px]"
              >
                Create /Join Another Room
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomNotFound;
