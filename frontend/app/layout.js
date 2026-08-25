import './globals.css';
import Navbar from '../components/Navbar';
export const metadata = {
title: 'MiniSocial',
description: 'A beginner-friendly social media app'
};
export default function RootLayout({ children }) {
return (
<html lang="en">
<body>
<Navbar />
<main>{children}</main>
</body>
</html>
);
}