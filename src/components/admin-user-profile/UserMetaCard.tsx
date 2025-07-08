"use client";
import React, { useState, useEffect } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { doc, updateDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function UserMetaCard() {
  const { user, profile, isLoading } = useAuth();
  const { isOpen, openModal, closeModal } = useModal();
  // Get selected user from session storage
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Check if current user is admin
  const isAdmin = profile?.role === 'admin';
  
  // Fetch all admin users
  useEffect(() => {
    const fetchAdminUsers = async () => {
      if (!isAdmin) return;
      
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("role", "==", "admin"));
        const querySnapshot = await getDocs(q);
        
        const admins = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setAdminUsers(admins);
      } catch (error) {
        console.error("Error fetching admin users:", error);
      }
    };
    
    if (isAdmin) {
      fetchAdminUsers();
    }
  }, [isAdmin]);
  
  useEffect(() => {
    // Load selected user from session storage
    if (isAdmin) {
      const storedUser = sessionStorage.getItem('selectedUser');
      if (storedUser) {
        setSelectedUser(JSON.parse(storedUser));
      }
    }
  }, [isAdmin]);

  // Use the selected user profile if available (and user is admin), otherwise use current user profile
  const displayProfile = (isAdmin && selectedUser) ? selectedUser : profile;
  
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    phone: "",
    facebook: "",
    twitter: "",
    linkedin: "",
    instagram: ""
  });

  useEffect(() => {
    if (displayProfile) {
      setForm({
        displayName: displayProfile.displayName || "",
        email: displayProfile.email || user?.email || "",
        phone: displayProfile.phone || "",
        facebook: displayProfile.facebook || "",
        twitter: displayProfile.twitter || "",
        linkedin: displayProfile.linkedin || "",
        instagram: displayProfile.instagram || ""
      });
    }
  }, [displayProfile, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    if (!user) return;
    
    // Determine which user to update based on selection and admin status
    const userIdToUpdate = (isAdmin && selectedUser) ? selectedUser.id : user.uid;
    
    try {
      const userRef = doc(db, "users", userIdToUpdate);
      await updateDoc(userRef, form);
      console.log("Profile updated successfully");
      closeModal();
      
      // If editing selected user, update the session storage
      if (isAdmin && selectedUser) {
        const updatedUser = { ...selectedUser, ...form };
        sessionStorage.setItem('selectedUser', JSON.stringify(updatedUser));
        setSelectedUser(updatedUser);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };
  
  const handleSelectUser = (adminUser: any) => {
    setSelectedUser(adminUser);
    sessionStorage.setItem('selectedUser', JSON.stringify(adminUser));
    setIsDropdownOpen(false);
  };

  // Render loading state
  if (isLoading) {
    return <div className="text-center">Loading...</div>;
  }

  // Render no user data state
  if (!user || !profile) {
    return (
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800">
        <p className="text-center text-gray-500 dark:text-gray-400">
          No user data available.
        </p>
      </div>
    );
  }

  // Get the first letter of the display name for the avatar fallback
  const displayName = displayProfile.displayName || "User";
  const firstLetter = displayName.charAt(0).toUpperCase();

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
              {displayProfile.photoURL ? (
                // If photo URL exists, display the image
                <Image
                  width={80}
                  height={80}
                  src={displayProfile.photoURL}
                  alt={displayName}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    // If image fails to load, show fallback icon
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    (e.currentTarget.parentNode as HTMLElement).classList.add('bg-gradient-to-br', 'from-blue-500', 'to-purple-600', 'flex', 'items-center', 'justify-center');
                    (e.currentTarget.parentNode as HTMLElement).innerHTML = `<span class="text-2xl font-semibold text-white">${firstLetter}</span>`;
                  }}
                />
              ) : (
                // If no photo URL, show gradient background with first letter
                <div className="h-full w-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-2xl">
                  {firstLetter}
                </div>
              )}
            </div>
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {displayProfile.displayName || "User"}
              </h4>                 
              {isAdmin && selectedUser && selectedUser.id !== user.uid && (
                <div className="mt-2">
                  <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                    Viewing as different user
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end">
              {/* Admin user selection dropdown */}
              {isAdmin && (
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Select Admin User
                    <svg
                      className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>
                  
                  {isDropdownOpen && (
                    <div className="absolute right-0 z-10 w-56 mt-2 origin-top-right bg-white rounded-md shadow-lg dark:bg-gray-800 ring-1 ring-black ring-opacity-5">
                      <div className="py-1 max-h-60 overflow-y-auto">
                        {/* Current user option */}
                        <button
                          onClick={() => handleSelectUser(profile)}
                          className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                          <div className="flex items-center">
                            <div className="w-8 h-8 mr-3 overflow-hidden rounded-full">
                              {profile.photoURL ? (
                                <Image
                                  width={32}
                                  height={32}
                                  src={profile.photoURL}
                                  alt={profile.displayName || ""}
                                  className="object-cover w-full h-full"
                                />
                              ) : (
                                <div className="flex items-center justify-center w-full h-full text-white bg-gradient-to-br from-blue-500 to-purple-600">
                                  {(profile.displayName?.[0] || "").toUpperCase()}
                                </div>
                              )}
                            </div>
                            <span>
                              {profile.displayName || profile.email} (You)
                            </span>
                          </div>
                        </button>
                        
                        {/* Other admin users */}
                        {adminUsers
                          .filter(admin => admin.id !== user.uid)
                          .map(admin => (
                            <button
                              key={admin.id}
                              onClick={() => handleSelectUser(admin)}
                              className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                              <div className="flex items-center">
                                <div className="w-8 h-8 mr-3 overflow-hidden rounded-full">
                                  {admin.photoURL ? (
                                    <Image
                                      width={32}
                                      height={32}
                                      src={admin.photoURL}
                                      alt={admin.displayName || ""}
                                      className="object-cover w-full h-full"
                                    />
                                  ) : (
                                    <div className="flex items-center justify-center w-full h-full text-white bg-gradient-to-br from-blue-500 to-purple-600">
                                      {(admin.displayName?.[0] || "").toUpperCase()}
                                    </div>
                                  )}
                                </div>
                                <span>
                                  {admin.displayName || admin.email}
                                </span>
                              </div>
                            </button>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={openModal}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            <svg
              className="fill-current"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                fill=""
              />
            </svg>
            Edit
          </button>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit User Information
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update user details
            </p>
          </div>
          <form className="flex flex-col">
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                User Information
              </h5>
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div className="col-span-2">
                  <Label>Display Name</Label>
                  <Input name="displayName" value={form.displayName} onChange={handleChange} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input name="email" value={form.email} onChange={handleChange} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input name="phone" value={form.phone} onChange={handleChange} />
                </div>           
                <div className="col-span-2">
                  <h5 className="mb-3 mt-3 text-md font-medium text-gray-800 dark:text-white/90">
                    Social Links
                  </h5>
                </div>
                
                <div>
                  <Label>Facebook</Label>
                  <Input name="facebook" value={form.facebook} onChange={handleChange} />
                </div>
                <div>
                  <Label>Twitter</Label>
                  <Input name="twitter" value={form.twitter} onChange={handleChange} />
                </div>
                <div>
                  <Label>LinkedIn</Label>
                  <Input name="linkedin" value={form.linkedin} onChange={handleChange} />
                </div>
                <div>
                  <Label>Instagram</Label>
                  <Input name="instagram" value={form.instagram} onChange={handleChange} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Close
              </Button>
              <Button size="sm" onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
