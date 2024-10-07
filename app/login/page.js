'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, query, where, getDocs, doc, setDoc, getDoc } from "firebase/firestore";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth";
import { db, auth } from '../firebase/config';
import Loading from '../components/loading'; // Make sure to create this component

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                // User is signed in, redirect to home page
                router.push('/');
            } else {
                // User is not signed in, allow access to login page
                setLoading(false);
            }
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, [router]);

    if (loading) {
        return <Loading />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            // Use Firebase's signInWithEmailAndPassword instead of custom logic
            await signInWithEmailAndPassword(auth, email, password);
            console.log("Sign in successful");
            router.push('/');
        } catch (error) {
            console.error('Login error:', error);
            setError(getErrorMessage(error));
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            await createOrUpdateUser(result.user);
            router.push('/'); // Redirect to chat page after successful login
        } catch (error) {
            console.error('Google sign-in error:', error);
            setError(getErrorMessage(error));
        }
    };

    const createOrUpdateUser = async (user) => {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            // User doesn't exist in Firestore, create a new document
            await setDoc(userRef, {
                email: user.email,
                displayName: user.displayName || '',
                photoURL: user.photoURL || '',
                createdAt: new Date(),
                lastLogin: new Date(),
                role: 'user'
            });
        } else {
            // User exists, update last login
            await setDoc(userRef, { lastLogin: new Date() }, { merge: true });
        }
    };

    const updateUserLastLogin = async (userId) => {
        const userRef = doc(db, "users", userId);
        await setDoc(userRef, { lastLogin: new Date() }, { merge: true });
    };

    const getErrorMessage = (error) => {
        switch (error.code) {
            case 'auth/user-not-found':
            case 'auth/invalid-credential':
                return 'Invalid email or password.';
            case 'auth/invalid-email':
                return 'Invalid email address. Please check and try again.';
            case 'auth/user-disabled':
                return 'This account has been disabled. Please contact support.';
            case 'auth/operation-not-allowed':
                return 'Email/password sign-in is not enabled. Please contact support.';
            case 'auth/popup-closed-by-user':
                return 'Sign-in popup was closed before completing the sign-in process.';
            default:
                return 'An error occurred. Please try again.';
        }
    };

    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0F110C] transition-all duration-500 ease-in-out"> 
        <div className="w-[29rem] h-auto bg-[#181C14] rounded-lg p-8 shadow-lg transform transition-all duration-500 ease-in-out hover:shadow-2xl hover:scale-105">
          <h1 className="text-center text-white font-bold mb-8 text-4xl animate-fade-in-down">Log in</h1>
          {error && <p className="text-red-500 text-center mb-4 animate-shake">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="transform transition-all duration-300 ease-in-out hover:translate-y-[-2px]">
              <label className="block text-white font-light mb-2" htmlFor="email">Email</label>
              <input
                className="w-full p-2 rounded-lg text-center text-white bg-[#3C3D37]/40 focus:ring-2 focus:ring-[#4A9C6D] transition-all duration-300 ease-in-out"
                type="email"
                id="email"
                required
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="transform transition-all duration-300 ease-in-out hover:translate-y-[-2px]">
              <label className="block text-white mb-2" htmlFor="password">Password</label>
              <input
                className="w-full p-2 rounded-lg text-center text-white bg-[#3C3D37]/40 focus:ring-2 focus:ring-[#4A9C6D] transition-all duration-300 ease-in-out"
                type="password"
                id="password"
                required
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <button
                type="submit"
                className="w-full text-white font-bold py-2 rounded-lg bg-[#3C3D37] transition-all duration-300 ease-in-out hover:bg-[#4A4B44] hover:shadow-lg transform hover:translate-y-[-2px] active:translate-y-[1px]"
              >
                Login
              </button>
            </div>
          </form>
          <div className="mt-4 text-center">
            <p className="text-white mb-2">Or</p>
            <button
              onClick={handleGoogleSignIn}
              className="w-full text-white font-bold py-2 rounded-lg bg-[#4A9C6D] transition-all duration-300 ease-in-out hover:bg-[#5ABD82] hover:shadow-lg transform hover:translate-y-[-2px] active:translate-y-[1px]"
            >
              Sign in with Google
            </button>
          </div>
          <div className="text-center mt-8 animate-fade-in-up">
            <p className="text-white">Don't have an account?</p>
            <Link href="/signup" className="text-[#4A9C6D] hover:underline transition-all duration-300 ease-in-out hover:text-[#5ABD82]">
              Sign up here
            </Link>
          </div>
        </div>
  
      </div>
    );
}