'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    const { user, loading: authLoading, authFetch, updateUser } = useAuth();
    const router = useRouter();

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [age, setAge] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    const [profileLoading, setProfileLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [profileMsg, setProfileMsg] = useState('');
    const [profileError, setProfileError] = useState('');
    const [passwordMsg, setPasswordMsg] = useState('');
    const [passwordError, setPasswordError] = useState('');

    useEffect(function () {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }
        if (user) fetchProfile();
    }, [user, authLoading]);

    async function fetchProfile() {
        try {
            const res = await authFetch('/auth/profile');
            if (!res.ok) {
                // Fall back to user data from context if profile API fails
                if (user) {
                    setUsername(user.username || '');
                    setEmail(user.email || '');
                    setAge(user.age !== null && user.age !== undefined ? String(user.age) : '');
                }
                return;
            }
            const data = await res.json();
            setUsername(data.username || '');
            setEmail(data.email || '');
            setAge(data.age !== null && data.age !== undefined ? String(data.age) : '');
        } catch (err) {
            // Fall back to user data from context
            if (user) {
                setUsername(user.username || '');
                setEmail(user.email || '');
                setAge(user.age !== null && user.age !== undefined ? String(user.age) : '');
            }
            console.error('Failed to fetch profile:', err);
        }
    }

    async function handleProfileUpdate(e) {
        e.preventDefault();
        setProfileMsg('');
        setProfileError('');
        setProfileLoading(true);

        try {
            const res = await authFetch('/auth/profile', {
                method: 'PATCH',
                body: JSON.stringify({
                    username: username || null,
                    email: email,
                    age: age === '' ? null : parseInt(age),
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setProfileMsg('Profile updated successfully');
                updateUser(data.user);
            } else {
                setProfileError(data.message || 'Update failed');
            }
        } catch (err) {
            setProfileError('Failed to update profile');
        } finally {
            setProfileLoading(false);
        }
    }

    async function handlePasswordChange(e) {
        e.preventDefault();
        setPasswordMsg('');
        setPasswordError('');

        if (newPassword !== confirmNewPassword) {
            setPasswordError('New passwords do not match');
            return;
        }

        setPasswordLoading(true);
        try {
            const res = await authFetch('/auth/change-password', {
                method: 'PATCH',
                body: JSON.stringify({
                    currentPassword: currentPassword,
                    newPassword: newPassword,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setPasswordMsg('Password changed successfully');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmNewPassword('');
            } else {
                setPasswordError(data.message || 'Password change failed');
            }
        } catch (err) {
            setPasswordError('Failed to change password');
        } finally {
            setPasswordLoading(false);
        }
    }

    if (authLoading) {
        return (
            <div className="page-loader">
                <div className="spinner"></div>
                <p>Loading profile...</p>
            </div>
        );
    }

    return (
        <div className="profile-page">
            <h1 className="profile-title">Profile Settings</h1>
            <p className="profile-subtitle">Manage your account details</p>

            <div className="profile-section">
                <h2 className="profile-section-title">Personal Information</h2>
                <form onSubmit={handleProfileUpdate} className="profile-form">
                    <div className="form-group">
                        <label htmlFor="profile-username" className="form-label">Username <span className="form-optional">(optional)</span></label>
                        <input
                            id="profile-username"
                            type="text"
                            className="form-input"
                            placeholder="e.g. john_doe"
                            value={username}
                            onChange={function (e) { setUsername(e.target.value); }}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="profile-email" className="form-label">Email Address</label>
                        <input
                            id="profile-email"
                            type="email"
                            className="form-input"
                            value={email}
                            onChange={function (e) { setEmail(e.target.value); }}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="profile-age" className="form-label">Age <span className="form-optional">(optional)</span></label>
                        <input
                            id="profile-age"
                            type="number"
                            className="form-input"
                            placeholder="Not set"
                            value={age}
                            onChange={function (e) { setAge(e.target.value); }}
                            min={1}
                            max={120}
                        />
                    </div>
                    {profileError && <div className="auth-error">{profileError}</div>}
                    {profileMsg && <div className="profile-success">{profileMsg}</div>}
                    <button type="submit" className="btn-profile-save" disabled={profileLoading}>
                        {profileLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </div>

            <div className="profile-section">
                <h2 className="profile-section-title">Change Password</h2>
                <form onSubmit={handlePasswordChange} className="profile-form">
                    <div className="form-group">
                        <label htmlFor="current-password" className="form-label">Current Password</label>
                        <input
                            id="current-password"
                            type="password"
                            className="form-input"
                            placeholder="Enter current password"
                            value={currentPassword}
                            onChange={function (e) { setCurrentPassword(e.target.value); }}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="new-password" className="form-label">New Password</label>
                        <input
                            id="new-password"
                            type="password"
                            className="form-input"
                            placeholder="Min 6 characters"
                            value={newPassword}
                            onChange={function (e) { setNewPassword(e.target.value); }}
                            required
                            minLength={6}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirm-new-password" className="form-label">Confirm New Password</label>
                        <input
                            id="confirm-new-password"
                            type="password"
                            className="form-input"
                            placeholder="Repeat new password"
                            value={confirmNewPassword}
                            onChange={function (e) { setConfirmNewPassword(e.target.value); }}
                            required
                        />
                    </div>
                    {passwordError && <div className="auth-error">{passwordError}</div>}
                    {passwordMsg && <div className="profile-success">{passwordMsg}</div>}
                    <button type="submit" className="btn-profile-save" disabled={passwordLoading}>
                        {passwordLoading ? 'Changing...' : 'Change Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}
