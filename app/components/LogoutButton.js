'use client';

import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config'; // Make sure this path is correct
import { useEffect, useState } from 'react';

export default function LogoutButton() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="fixed md:absolute right-4 md:right-0 bottom-4 md:top-1/2 md:mr-6 w-12 h-12 md:w-14 md:h-14 bg-[#181C14] rounded-full flex items-center justify-center transition-all duration-300 ease-in-out hover:bg-[#22271B] hover:scale-110 hover:shadow-lg active:scale-95 animate-fade-in"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="#3C3D37" 
        className="size-6 md:size-7 transition-transform duration-300 ease-in-out group-hover:rotate-12"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
      </svg>
    </button>
  );
}