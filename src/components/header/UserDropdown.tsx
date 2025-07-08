// src/components/header/UserDropdown.tsx
"use client";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, profile, logout, isLoading } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUsersList, setShowUsersList] = useState(false);

  // Check if the current user is an admin
  const isAdmin = profile?.role === "admin";

  // Fetch all users if the current user is an admin
  useEffect(() => {
    const fetchUsers = async () => {
      if (!isAdmin || !user) return;

      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef);
        const querySnapshot = await getDocs(q);

        const fetchedUsers = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setUsers(fetchedUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin, user]);

  function toggleDropdown(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  }

  function closeDropdown() {
    setIsOpen(false);
    setShowUsersList(false);
  }

  function toggleUsersList() {
    setShowUsersList((prev) => !prev);
  }

  const handleSelectUser = (selectedUser: any) => {
    setSelectedUser(selectedUser);
    // Store the selected user in session storage for persistence
    sessionStorage.setItem("selectedUser", JSON.stringify(selectedUser));
    setShowUsersList(false);
  };

  // Load selected user from session storage on component mount
  useEffect(() => {
    const storedUser = sessionStorage.getItem("selectedUser");
    if (storedUser && isAdmin) {
      setSelectedUser(JSON.parse(storedUser));
    }
  }, [isAdmin]);

  const handleSignOut = async () => {
    try {
      // Clear selected user on sign out
      sessionStorage.removeItem("selectedUser");
      setSelectedUser(null);
      await logout();
      closeDropdown();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Sementara loading: tampilkan loading circle
  if (isLoading) {
    return (
      <div className="flex items-center">
        <div className="animate-pulse">
          <div className="h-11 w-11 bg-gray-300 rounded-full mr-3"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-20"></div>
        </div>
      </div>
    );
  }

  // Jika belum login atau tidak ada profil: tampilkan avatar kosong & label admin
  if (!user || !profile) {
    return (
      <div className="flex items-center gap-3">
        <div className="overflow-hidden rounded-full h-11 w-11 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          <svg
            className="text-gray-400 dark:text-gray-500"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill="currentColor"
              d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5Zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5Z"
            />
          </svg>
        </div>
        <span className="text-gray-500 text-sm dark:text-gray-400">Admin</span>
      </div>
    );
  }

  // Use the selected user profile if we have one, otherwise use the current user
  const displayProfile = selectedUser || profile;
  const displayName = displayProfile?.displayName || user?.displayName || "User";
  const email = displayProfile?.email || user?.email || "";
  const photoURL = displayProfile?.photoURL || user?.photoURL;

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center text-gray-700 dark:text-gray-400 dropdown-toggle"
      >
        <span className="mr-3 overflow-hidden rounded-full h-11 w-11">
          {photoURL ? (
            <Image
              width={44}
              height={44}
              src={photoURL}
              alt={displayName}
              className="h-full w-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/images/user/default-avatar.png";
              }}
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </span>
        <span className="block mr-1 font-medium text-theme-sm">{displayName}</span>
        <svg
          className={`stroke-gray-500 dark:stroke-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          width="18"
          height="20"
          viewBox="0 0 18 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
      >
        <div>
          <span className="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">
            {displayName}
          </span>
          <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
            {email}
          </span>
          {displayProfile?.role && (
            <span className="mt-1 inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900 dark:text-blue-200">
              {displayProfile.role}
            </span>
          )}

          {selectedUser && selectedUser.id !== user.uid && (
            <div className="mt-2">
              <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                Viewing as different user
              </span>
            </div>
          )}
        </div>

        {isAdmin && (
          <div className="mt-3 border-t border-gray-200 pt-3 dark:border-gray-700">
            <button
              onClick={toggleUsersList}
              className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <span>Select user account</span>
              <svg
                className={`transition-transform ${
                  showUsersList ? "rotate-180" : ""
                }`}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 9L12 15L18 9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {showUsersList && (
              <div className="mt-2 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                {/* Current user (you) option */}
                <button
                  key="current-user"
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    !selectedUser || selectedUser.id === user.uid
                      ? "bg-blue-50 dark:bg-blue-900/30"
                      : ""
                  }`}
                  onClick={() => handleSelectUser(profile)}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 mr-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                      {profile.photoURL ? (
                        <Image
                          width={32}
                          height={32}
                          src={profile.photoURL}
                          alt={profile.displayName || ""}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-white font-semibold">
                          {(profile.displayName?.[0] || profile.email?.[0] || "").toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">
                        {profile.displayName || profile.email} (You)
                      </div>
                      {profile.role && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {profile.role}
                        </div>
                      )}
                    </div>
                  </div>
                </button>

                {/* Other users */}
                {users
                  .filter((userItem) => userItem.id !== user.uid)
                  .map((userItem) => (
                    <button
                      key={userItem.id}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        selectedUser && selectedUser.id === userItem.id
                          ? "bg-blue-50 dark:bg-blue-900/30"
                          : ""
                      }`}
                      onClick={() => handleSelectUser(userItem)}
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 mr-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                          {userItem.photoURL ? (
                            <Image
                              width={32}
                              height={32}
                              src={userItem.photoURL}
                              alt={userItem.displayName || ""}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-white font-semibold">
                              {(userItem.displayName?.[0] || userItem.email?.[0] || "").toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">
                            {userItem.displayName || userItem.email}
                          </div>
                          {userItem.role && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {userItem.role}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}

        <ul className="flex flex-col gap-1 pt-4 pb-3 border-b border-gray-200 dark:border-gray-800">
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              href="/profile"
              className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Edit profile
            </DropdownItem>
          </li>
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              href="/settings"
              className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Account settings
            </DropdownItem>
          </li>
        </ul>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 mt-3 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
        >
          Sign out
        </button>
      </Dropdown>
    </div>
  );
}
