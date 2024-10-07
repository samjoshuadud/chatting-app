'use client'

import { useState, useEffect } from 'react';
import { customAlphabet } from 'nanoid';
import { useRouter } from 'next/navigation';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { ref as sRef, set, get } from 'firebase/database';
import { doc, setDoc, getDoc } from "firebase/firestore";
import Loading from '../components/loading';

const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6);

export default function Join() {
    const [roomId, setRoomId] = useState('');
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUser(user);
            } else {
                router.push('/login'); // Redirect to login page if not authenticated
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    const createRoom = async () => {
        if (user) {
            console.log("testing")
            const newRoomId = nanoid();
            const roomRef = doc(db, "rooms", newRoomId);
            await setDoc(roomRef, {
                createdBy: user.uid,
                createdAt: Date.now()
            });
            router.push(`/${newRoomId}`);
        }
    };

    const joinRoom = async () => {
        if (user && roomId) {
            const roomRef = doc(db, "rooms", roomId);
            try {
                const snapshot = await getDoc(roomRef);
                if (snapshot.exists()) {
                    router.push(`/${roomId}`);
                } else {
                    setShowModal(true);
                }
            } catch (error) {
                console.error("Error checking room:", error);
                setShowModal(true);
            }
        }
    };

    if (loading) {
        return <Loading />;
    }

    if (!user) {
        return null; // This will prevent the main content from flashing before redirect
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0F110C] px-4 py-8 transition-all duration-500 ease-in-out">
            <div className="w-full max-w-[29rem] bg-[#181C14] rounded-lg mb-8 p-6 md:p-8 shadow-lg transform transition-all duration-500 ease-in-out md:hover:shadow-2xl md:hover:scale-105 animate-fade-in-down"> 
               <h1 className="text-white text-xl md:text-2xl font-bold text-center mb-6">
                Join Existing Chat Room
               </h1>
               <div className="flex flex-col items-center">
                     <input 
                         type="text" 
                         placeholder="Enter Room ID" 
                         className="w-full p-2 rounded-lg mb-4 text-center text-white bg-[#3C3D37]/40 focus:ring-2 focus:ring-[#4A9C6D] transition-all duration-300 ease-in-out md:hover:translate-y-[-2px]"
                         value={roomId}
                         onChange={(e) => setRoomId(e.target.value)}
                     />
                    <button 
                        className="w-full md:w-auto mt-2 bg-[#3C3D37] text-white px-6 py-2 rounded-lg transition-all duration-300 ease-in-out md:hover:bg-[#4A4B44] md:hover:shadow-lg md:hover:translate-y-[-2px] active:translate-y-[1px]"
                        onClick={joinRoom}
                    >
                        Join Room
                    </button>
               </div>
            </div>

            <div className="w-full max-w-[29rem] bg-[#181C14] rounded-lg p-6 md:p-8 shadow-lg transform transition-all duration-500 ease-in-out md:hover:shadow-2xl md:hover:scale-105 animate-fade-in-up"> 
               <h1 className="text-white text-xl md:text-2xl font-bold text-center mb-6">
                Create New Chat Room
               </h1>
               <div className="flex justify-center">
                    <button 
                        className="w-full md:w-auto mt-2 bg-[#3C3D37] text-white px-6 py-2 rounded-lg transition-all duration-300 ease-in-out md:hover:bg-[#4A4B44] md:hover:shadow-lg md:hover:translate-y-[-2px] active:translate-y-[1px]"
                        onClick={createRoom}
                    >
                        Create Room
                    </button>
               </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-[#181C14] p-6 rounded-lg shadow-xl">
                        <h2 className="text-white text-xl font-bold mb-4">Room Not Found</h2>
                        <p className="text-white mb-4">The room you're trying to join does not exist.</p>
                        <button 
                            className="bg-[#3C3D37] text-white px-4 py-2 rounded-lg transition-all duration-300 ease-in-out hover:bg-[#4A4B44]"
                            onClick={() => setShowModal(false)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
