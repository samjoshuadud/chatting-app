'use client'

import { useState, useEffect } from 'react';
import { customAlphabet } from 'nanoid';
import { useRouter } from 'next/navigation';
import { auth, db, rtdb } from '../firebase/config';
import { onAuthStateChanged, updateProfile, deleteUser, reauthenticateWithCredential, EmailAuthProvider, GoogleAuthProvider, reauthenticateWithPopup } from 'firebase/auth';
import { ref, remove } from 'firebase/database';
import { doc, setDoc, getDoc, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";
import Loading from '../components/loading';

const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6);

export default function Join() {
    const [roomId, setRoomId] = useState('');
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUser(user);
                setDisplayName(user.displayName || '');
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

    const handleStartEditName = () => {
        setIsEditingName(true);
    };

    const handleSaveName = async () => {
        if (user && displayName.trim()) {
            try {
                await updateProfile(user, { displayName: displayName.trim() });
                setUser({ ...user, displayName: displayName.trim() });
                setIsEditingName(false);
            } catch (error) {
                console.error("Error updating display name:", error);
            }
        }
    };

    const handleDeleteAccount = async () => {
        console.log("Delete account function called");

        if (!user) {
            console.log("No user found");
            setError("No user found. Please try logging in again.");
            return;
        }

        setError(null);
        setIsLoading(true);

        try {
            console.log("Attempting to re-authenticate");

            // Re-authenticate based on the provider
            if (user.providerData[0].providerId === 'password') {
                const credential = EmailAuthProvider.credential(user.email, password);
                await reauthenticateWithCredential(user, credential);
            } else if (user.providerData[0].providerId === 'google.com') {
                const provider = new GoogleAuthProvider();
                await reauthenticateWithPopup(user, provider);
            } else {
                throw new Error("Unsupported auth provider");
            }

            console.log("Re-authentication successful");

            // Delete user's data from Firestore
            console.log("Deleting user's rooms from Firestore");
            const userRoomsQuery = query(collection(db, "rooms"), where("createdBy", "==", user.uid));
            const userRoomsSnapshot = await getDocs(userRoomsQuery);
            const deletePromises = userRoomsSnapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises);

            console.log("Rooms deleted, now deleting user account");

            // Delete the user's authentication account
            await deleteUser(user);

            console.log("User account deleted");

            // Close the modal and redirect to login page
            setShowDeleteModal(false);
            router.push('/login');
        } catch (error) {
            console.error("Error deleting account:", error);
            setError(`Error deleting account: ${error.message}`);
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <Loading />;
    }

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
                Welcome, {user.displayName || 'Anonymous' + user.uid.slice(0, 4)}
               </h1>
               <div className="flex flex-col items-center mb-6">
                    {isEditingName ? (
                        <div className="flex items-center space-x-2 w-full">
                            <input 
                                type="text" 
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="flex-grow p-2 rounded-lg text-center text-white bg-[#3C3D37]/40 focus:ring-2 focus:ring-[#4A9C6D] transition-all duration-300 ease-in-out"
                                placeholder="Enter new display name"
                            />
                            <button 
                                onClick={handleSaveName}
                                className="bg-[#4A9C6D] text-white px-4 py-2 rounded-lg transition-all duration-300 ease-in-out hover:bg-[#5ABD82] hover:shadow-lg hover:translate-y-[-2px] active:translate-y-[1px]"
                            >
                                Save
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={handleStartEditName}
                            className="w-full md:w-auto mt-2 bg-[#3C3D37] text-white px-6 py-2 rounded-lg transition-all duration-300 ease-in-out md:hover:bg-[#4A4B44] md:hover:shadow-lg md:hover:translate-y-[-2px] active:translate-y-[1px]"
                        >
                            Change Display Name
                        </button>
                    )}
               </div>
               <h2 className="text-white text-xl md:text-2xl font-bold text-center mb-6">
                Join Existing Chat Room
               </h2>
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

            <div className="w-full max-w-[29rem] bg-[#181C14] rounded-lg p-6 md:p-8 shadow-lg transform transition-all duration-500 ease-in-out md:hover:shadow-2xl md:hover:scale-105 animate-fade-in-up mt-8"> 
                <h1 className="text-white text-xl md:text-2xl font-bold text-center mb-6">
                    Account Management
                </h1>
                <div className="flex justify-center">
                    <button 
                        className="w-full md:w-auto mt-2 bg-red-600 text-white px-6 py-2 rounded-lg transition-all duration-300 ease-in-out md:hover:bg-red-700 md:hover:shadow-lg md:hover:translate-y-[-2px] active:translate-y-[1px]"
                        onClick={() => setShowDeleteModal(true)}
                    >
                        Delete Account
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

            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-[#181C14] p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
                        <h2 className="text-white text-xl font-bold mb-4">Delete Account</h2>
                        <p className="text-white mb-4">Are you sure you want to delete your account? This action cannot be undone.</p>
                        {user && user.providerData[0].providerId === 'password' && (
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                className="w-full p-2 rounded-lg mb-4 text-black"
                            />
                        )}
                        {user && user.providerData[0].providerId === 'google.com' && (
                            <p className="text-white mb-4">You'll be prompted to sign in with Google to confirm account deletion.</p>
                        )}
                        {error && <p className="text-red-500 mb-4">{error}</p>}
                        <div className="flex justify-end space-x-4">
                            <button 
                                className="bg-gray-500 text-white px-4 py-2 rounded-lg transition-all duration-300 ease-in-out hover:bg-gray-600"
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setPassword('');
                                    setError(null);
                                }}
                            >
                                Cancel
                            </button>
                            <button 
                                className="bg-red-600 text-white px-4 py-2 rounded-lg transition-all duration-300 ease-in-out hover:bg-red-700"
                                onClick={() => {
                                    console.log("Delete button clicked");
                                    handleDeleteAccount();
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}