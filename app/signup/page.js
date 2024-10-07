'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db, auth } from '../firebase/config';
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged, createUserWithEmailAndPassword } from "firebase/auth";
import Loading from '../components/loading'; // Make sure this component exists

export default function SignUp() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                // User is signed in, redirect to home page
                router.push('/');
            } else {
                // User is not signed in, allow access to signup page
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
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        
        try {
            // Create user in Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Add user to Firestore
            const now = new Date();
            const usersRef = collection(db, "users");
            await addDoc(usersRef, {
                uid: user.uid,
                email: user.email,
                createdAt: now,
                updatedAt: now,
                photoURL: null,
                displayName: null,
                role: 'user',
            });

            // Store the user's UID in local storage
            localStorage.setItem('userId', user.uid);
            
            router.push('/join');
        } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
                setError('An account with this email already exists');
            } else {
                setError('Error creating account: ' + error.message);
            }
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#0F110C] transition-all duration-500 ease-in-out">
            <div className="w-[29rem] h-auto bg-[#181C14] rounded-lg p-8 shadow-lg transform transition-all duration-500 ease-in-out hover:shadow-2xl hover:scale-105">
                <h1 className="text-center text-white font-bold mb-8 text-4xl animate-fade-in-down">Sign Up</h1>
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
                        <label className="block text-white font-light mb-2" htmlFor="password">Password</label>
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
                    <div className="transform transition-all duration-300 ease-in-out hover:translate-y-[-2px]">
                        <label className="block text-white font-light mb-2" htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            className="w-full p-2 rounded-lg text-center text-white bg-[#3C3D37]/40 focus:ring-2 focus:ring-[#4A9C6D] transition-all duration-300 ease-in-out"
                            type="password"
                            id="confirmPassword"
                            required
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>
                    <div>
                        <button
                            type="submit"
                            className="w-full text-white font-bold py-2 rounded-lg bg-[#3C3D37] transition-all duration-300 ease-in-out hover:bg-[#4A4B44] hover:shadow-lg transform hover:translate-y-[-2px] active:translate-y-[1px]"
                        >
                            Sign Up
                        </button>
                    </div>
                </form>
                <div className="text-center mt-8 animate-fade-in-up">
                    <p className="text-white">Already have an account?</p>
                    <Link href="/login" className="text-[#4A9C6D] hover:underline transition-all duration-300 ease-in-out hover:text-[#5ABD82]">
                        Log in here
                    </Link>
                </div>
            </div>
        </div>
    );
}