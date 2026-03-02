'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
    const { user, logout } = useAuth();

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <Link href="/" className="navbar-brand">
                    <span className="brand-text">LearnPath</span>
                </Link>

                <div className="navbar-links">
                    {user ? (
                        <>
                            <Link href="/dashboard" className="nav-link">
                                Dashboard
                            </Link>
                            <Link href="/dashboard/paths" className="nav-link">
                                Learning Paths
                            </Link>
                            <Link href="/profile" className="nav-link">
                                Profile
                            </Link>
                            <span className="nav-email">{user.username || user.email}</span>
                            <button onClick={logout} className="nav-btn-logout">
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="nav-link">
                                Login
                            </Link>
                            <Link href="/signup" className="nav-btn-primary">
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
