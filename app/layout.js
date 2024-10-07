import "./globals.css";
import LogoutButton from './components/LogoutButton';

export const metadata = {
  title: "Chat App",
  description: "Simple Chat App",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`antialiased bg-[#3C3D37]`}>
        {children}
        <LogoutButton />
      </body>
    </html>
  );
}
