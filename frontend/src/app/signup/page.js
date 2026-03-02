'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
    const { signup, user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [age, setAge] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(function () {
        if (!authLoading && user) router.push('/dashboard');
    }, [user, authLoading]);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            await signup(username || null, email, password, age || null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <h1 className="auth-title">Create Account</h1>
                    <p className="auth-subtitle">Start building your personalized learning path</p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="username" className="form-label">Username <span className="form-optional">(optional)</span></label>
                        <input
                            id="username"
                            type="text"
                            className="form-input"
                            placeholder="e.g. john_doe"
                            value={username}
                            onChange={function (e) { setUsername(e.target.value); }}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email" className="form-label">Email</label>
                        <input
                            id="email"
                            type="email"
                            className="form-input"
                            placeholder="you@example.com"
                            value={email}
                            onChange={function (e) { setEmail(e.target.value); }}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password" className="form-label">Password</label>
                        <input
                            id="password"
                            type="password"
                            className="form-input"
                            placeholder="Min 6 characters"
                            value={password}
                            onChange={function (e) { setPassword(e.target.value); }}
                            required
                            minLength={6}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            className="form-input"
                            placeholder="Repeat password"
                            value={confirmPassword}
                            onChange={function (e) { setConfirmPassword(e.target.value); }}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="age" className="form-label">Age <span className="form-optional">(optional)</span></label>
                        <input
                            id="age"
                            type="number"
                            className="form-input"
                            placeholder="e.g. 25"
                            value={age}
                            onChange={function (e) { setAge(e.target.value); }}
                            min={1}
                            max={120}
                        />
                    </div>

                    <button type="submit" className="auth-submit" disabled={loading}>
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <p className="auth-footer">
                    Already have an account?{' '}
                    <Link href="/login" className="auth-link">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
