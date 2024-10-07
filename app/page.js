'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from './firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import Loading from './components/loading';
import Link from 'next/link';

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return null; // Prevent content flash before redirect
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#181C14] text-white transition-all duration-500 ease-in-out">
      <h1 className="text-4xl font-bold mb-8 animate-fade-in-down">Welcome to ChatApp</h1>
      <div className="space-y-4 animate-fade-in-up">
        <Link 
          href="/join" 
          className="block px-6 py-3 bg-[#3C3D37] rounded-lg text-center transition-all duration-300 ease-in-out hover:bg-[#2A2E24] hover:shadow-lg transform hover:translate-y-[-2px] active:translate-y-[1px]"
        >
          Continue
        </Link>
      </div>
    </div>
  );
}
