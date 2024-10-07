import Link from 'next/link';

export default function RoomDeleted() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0F110C] transition-all duration-500 ease-in-out">
      <div className="w-[29rem] bg-[#181C14] rounded-lg p-8 shadow-lg transform transition-all duration-500 ease-in-out hover:shadow-2xl hover:scale-105">
        <h1 className="text-center text-white font-bold mb-6 text-3xl animate-fade-in-down">Room Deleted</h1>
        <p className="text-gray-300 text-center mb-8 animate-fade-in">This chat room has been deleted by its creator.</p>
        <div className="flex justify-center">
          <Link href="/join" className="inline-block bg-[#4A9C6D] text-white font-bold px-6 py-3 rounded-lg transition-all duration-300 ease-in-out hover:bg-[#5ABD82] hover:shadow-lg transform hover:translate-y-[-2px] active:translate-y-[1px] animate-fade-in-up">
            Create / Join a Room
          </Link>
        </div>
      </div>
    </div>
  );
}