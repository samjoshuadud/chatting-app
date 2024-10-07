'use client'

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged, updateProfile } from 'firebase/auth';
import { doc, getDoc, collection, addDoc, onSnapshot, query, orderBy, deleteDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDatabase, ref, onDisconnect, set, serverTimestamp as rtdbServerTimestamp } from 'firebase/database';
import Modal from 'react-modal';
import Loading from '../components/loading';
import RoomNotFound from '../components/roomnotfound';
import RoomDeleted from '../components/RoomDeleted';

export default function Room() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roomStatus, setRoomStatus] = useState('loading');
  const [isCreator, setIsCreator] = useState(false);
  const [roomDeleted, setRoomDeleted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const router = useRouter();
  const params = useParams();
  const roomId = params?.roomId;

  useEffect(() => {
    Modal.setAppElement(document.body);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        setDisplayName(user.displayName || `Anonymous_${user.uid.slice(0, 4)}`);
        checkRoomExists(user);
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, roomId]);

  useEffect(() => {
    if (roomId && user) {
      const messagesRef = collection(db, 'rooms', roomId, 'messages');
      const q = query(messagesRef, orderBy('createdAt', 'desc'));

      const messagesUnsubscribe = onSnapshot(q, (snapshot) => {
        const newMessages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMessages(newMessages.reverse());
      });

      // Add join notification
      addJoinNotification();

      // Set up presence system
      const rtdb = getDatabase();
      const presenceRef = ref(rtdb, `rooms/${roomId}/presence/${user.uid}`);
      const userStatusRef = ref(rtdb, `rooms/${roomId}/status/${user.uid}`);

      set(presenceRef, true);
      onDisconnect(presenceRef).remove();
      onDisconnect(userStatusRef).set('offline');

      // Listen for disconnects and add leave notification
      onDisconnect(userStatusRef).set('offline').then(() => {
        addLeaveNotification();
      });

      return () => {
        messagesUnsubscribe();
        set(presenceRef, null);
        set(userStatusRef, 'offline');
        addLeaveNotification();
      };
    }
  }, [roomId, user]);

  useEffect(() => {
    if (roomId) {
      const roomRef = doc(db, "rooms", roomId);
      const unsubscribe = onSnapshot(roomRef, (doc) => {
        if (!doc.exists()) {
          setRoomDeleted(true);
          setRoomStatus('deleted');
        }
      });

      return () => unsubscribe();
    }
  }, [roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    const container = document.getElementById('messages-container');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  };

  const checkRoomExists = async (user) => {
    if (!roomId) return;
    const roomRef = doc(db, "rooms", roomId);
    try {
      const snapshot = await getDoc(roomRef);
      if (snapshot.exists()) {
        setRoomStatus('exists');
        setIsCreator(snapshot.data().createdBy === user.uid);
      } else {
        setRoomStatus('not_found');
      }
    } catch (error) {
      console.error("Error checking room:", error);
      setRoomStatus('not_found');
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    const messagesRef = collection(db, 'rooms', roomId, 'messages');
    await addDoc(messagesRef, {
      text: newMessage,
      createdAt: serverTimestamp(),
      uid: user.uid,
      username: displayName
    });

    setNewMessage('');
  };

  const handleNameChange = async () => {
    try {
      await updateProfile(auth.currentUser, { displayName: displayName });
      setIsEditingName(false);
    } catch (error) {
      console.error("Error updating display name:", error);
    }
  };

  const handleDeleteRoom = () => {
    if (!isCreator) {
      alert("Only the room creator can delete this room.");
      return;
    }
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteRoom = async () => {
    if (!roomId) {
      console.error("Room ID is undefined");
      return;
    }

    try {
      const roomRef = doc(db, "rooms", roomId);
      await deleteDoc(roomRef);
      console.log("Room successfully deleted");
      router.push('/join');
    } catch (error) {
      console.error("Error deleting room:", error);
      alert("Failed to delete the room. Please try again.");
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  const addJoinNotification = async () => {
    if (!roomId || !user) return;

    const messagesRef = collection(db, 'rooms', roomId, 'messages');
    await addDoc(messagesRef, {
      type: 'notification',
      text: `${displayName} joined the room`,
      createdAt: serverTimestamp(),
      uid: user.uid
    });
  };

  const addLeaveNotification = async () => {
    if (!roomId || !user) return;

    const messagesRef = collection(db, 'rooms', roomId, 'messages');
    await addDoc(messagesRef, {
      type: 'notification',
      text: `${displayName} left the room`,
      createdAt: serverTimestamp(),
      uid: user.uid
    });
  };

  const handleLeaveRoom = () => {
    addLeaveNotification().then(() => {
      router.push('/join');
    });
  };

  if (loading) {
    return <Loading />;
  }

  switch (roomStatus) {
    // case 'deleted':
    //   return <RoomDeleted />;
    case 'not_found':
      return <RoomNotFound />;
    case 'exists':
      return (
        <div className="flex items-center justify-center min-h-screen bg-[#0F110C] transition-all duration-500 ease-in-out p-4">
          <div className="w-full max-w-[45rem] bg-[#181C14] rounded-lg p-4 sm:p-8 shadow-lg transform transition-all duration-500 ease-in-out hover:shadow-2xl hover:scale-[1.02]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
              <h1 className="text-white text-2xl sm:text-3xl font-bold animate-fade-in-down">Chat room #{roomId}</h1>
              <div className="flex flex-col sm:flex-row items-center justify-end gap-2 sm:gap-4">
                {isEditingName ? (
                  <div className="flex items-center space-x-2 animate-fade-in w-full sm:w-auto">
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="bg-[#3C3D37]/40 text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-[#4A9C6D] transition-all duration-300 ease-in-out flex-grow"
                    />
                    <button 
                      onClick={handleNameChange}
                      className="bg-[#4A9C6D] text-white px-4 py-2 rounded-lg transition-all duration-300 ease-in-out hover:bg-[#5ABD82] hover:shadow-lg transform hover:translate-y-[-2px] active:translate-y-[1px] whitespace-nowrap"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsEditingName(true)}
                    className="bg-[#3C3D37] text-white px-4 py-2 rounded-lg transition-all duration-300 ease-in-out hover:bg-[#4A4B44] hover:shadow-lg transform hover:translate-y-[-2px] active:translate-y-[1px] whitespace-nowrap w-full sm:w-auto"
                  >
                    Change Name
                  </button>
                )}
                {isCreator && (
                  <button 
                    onClick={handleDeleteRoom}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg transition-all duration-300 ease-in-out hover:bg-red-600 hover:shadow-lg transform hover:translate-y-[-2px] active:translate-y-[1px] whitespace-nowrap w-full sm:w-auto"
                  >
                    Delete Room
                  </button>
                )}
                <button 
                  onClick={handleLeaveRoom}
                  className="bg-[#4A9C6D] text-white px-4 py-2 rounded-lg transition-all duration-300 ease-in-out hover:bg-[#5ABD82] hover:shadow-lg transform hover:translate-y-[-2px] active:translate-y-[1px] whitespace-nowrap w-full sm:w-auto"
                >
                  Leave Room
                </button>
              </div>
            </div>

            <div id="messages-container" className="bg-[#3C3D37]/40 rounded-lg h-[35rem] mb-6 p-4 overflow-y-auto flex flex-col-reverse">
              <div>
                {messages.map((message) => (
                  <div key={message.id} className={`max-w-[70%] rounded-lg p-3 mb-3 ${
                    message.type === 'notification' 
                      ? 'mx-auto bg-[#2C2D2A] text-center' 
                      : message.uid === user.uid 
                        ? 'ml-auto bg-[#4A9C6D]' 
                        : 'bg-[#3C3D37]'
                  } transform transition-all duration-300 ease-in-out hover:translate-y-[-2px]`}>
                    {message.type === 'notification' ? (
                      <div className="text-gray-400 text-sm italic">{message.text}</div>
                    ) : (
                      <>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-gray-300">{message.username}</span>
                          <span className="text-xs text-gray-400">
                            {message.createdAt ? new Date(message.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        <div className="text-white">{message.text}</div>
                      </>
                    )}
                  </div>
                ))}
              </div>
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="flex space-x-4">
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message here" 
                className="flex-grow p-3 rounded-lg text-white bg-[#3C3D37]/40 focus:ring-2 focus:ring-[#4A9C6D] transition-all duration-300 ease-in-out"
              />
              <button 
                type="submit"
                className="bg-[#4A9C6D] text-white px-6 py-3 rounded-lg transition-all duration-300 ease-in-out hover:bg-[#5ABD82] hover:shadow-lg transform hover:translate-y-[-2px] active:translate-y-[1px]"
              >
                Send
              </button>
            </form>

            <Modal
              isOpen={isDeleteModalOpen}
              onRequestClose={() => setIsDeleteModalOpen(false)}
              contentLabel="Delete Room Confirmation"
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#181C14] p-8 rounded-lg outline-none max-w-[90%] w-[30rem] shadow-xl animate-fade-in"
              overlayClassName="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center"
            >
              <h2 className="text-2xl font-bold text-white mb-4">Delete Room</h2>
              <p className="text-gray-300 mb-6">Are you sure you want to delete this room? This action cannot be undone.</p>
              <div className="flex justify-end space-x-4">
                <button 
                  onClick={() => setIsDeleteModalOpen(false)} 
                  className="bg-[#3C3D37] text-white px-4 py-2 rounded-lg transition-all duration-300 ease-in-out hover:bg-[#4A4B44] hover:shadow-lg transform hover:translate-y-[-2px] active:translate-y-[1px]"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDeleteRoom} 
                  className="bg-red-500 text-white px-4 py-2 rounded-lg transition-all duration-300 ease-in-out hover:bg-red-600 hover:shadow-lg transform hover:translate-y-[-2px] active:translate-y-[1px]"
                >
                  Delete
                </button>
              </div>
            </Modal>
          </div>
        </div>
      );
    default:
      return null;
  }
}