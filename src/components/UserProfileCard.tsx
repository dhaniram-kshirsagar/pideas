"use client"

import React, { useState, useEffect, useRef } from "react"

interface User {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role?: string;
}

interface UserProfileCardProps {
  user: User;
  onLogout: () => void;
  isVisible: boolean;
  onClose: () => void;
}

export default function UserProfileCard({ user, onLogout, isVisible, onClose }: UserProfileCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Close the card when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Close the card when pressing Escape key
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div 
      ref={cardRef}
      className="absolute top-16 right-4 w-72 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden transition-all duration-300 ease-in-out"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(-10px)',
      }}
    >
      {/* Card Header with User Avatar */}
      <div className="bg-gradient-to-r from-cyan-900 to-gray-800 p-4 flex items-center gap-3">
        <div className="h-14 w-14 rounded-full overflow-hidden border-2 border-cyan-400 flex-shrink-0">
          {user.photoURL ? (
            <img 
              src={user.photoURL} 
              alt={user.displayName || 'User'} 
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-cyan-800 flex items-center justify-center text-white text-xl font-bold">
              {user.displayName?.charAt(0) || 'U'}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold truncate">{user.displayName}</h3>
          <p className="text-gray-300 text-sm truncate">{user.email}</p>
        </div>
      </div>
      
      {/* Card Body */}
      <div className="p-4">
        {user.role && (
          <div className="mb-3">
            <span className="text-gray-400 text-xs">Account Type</span>
            <div className="mt-1">
              <span className="bg-cyan-600/20 text-cyan-300 px-3 py-1 rounded-full text-sm border border-cyan-600/30">
                {user.role}
              </span>
            </div>
          </div>
        )}
        
        {/* User Actions */}
        <div className="space-y-2 mt-4">
          <button 
            className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors text-sm flex items-center gap-2"
            onClick={() => {
              // Profile action can be added here
              console.log('View profile');
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            View Profile
          </button>
          
          <button 
            className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors text-sm flex items-center gap-2"
            onClick={() => {
              // Settings action can be added here
              console.log('Settings');
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </button>
          
          <button 
            className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors text-sm flex items-center gap-2"
            onClick={onLogout}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

// Export a user icon component that can be used to toggle the profile card
export function UserProfileIcon({ onClick, isActive }: { onClick: () => void, isActive: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={`h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300 ${
        isActive 
          ? 'bg-cyan-600 text-white' 
          : 'bg-gray-800 text-cyan-400 hover:bg-gray-700'
      } border-2 border-cyan-400`}
      aria-label="Toggle user profile"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    </button>
  );
}
