"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

type User = {
  id: string;
  name: string;
  username?: string;
  password?: string;
  position: string;
  subbagian: string;
  role: string;
};

interface UserContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  users: User[];
  fetchUsers: () => Promise<void>;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
        
        // Restore user from localStorage
        const savedId = localStorage.getItem("currentUserId");
        if (savedId) {
          const found = data.find((u: User) => u.id === savedId);
          if (found) setCurrentUser(found);
        }
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSetUser = (user: User | null) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem("currentUserId", user.id);
    } else {
      localStorage.removeItem("currentUserId");
    }
  };

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser: handleSetUser, users, fetchUsers, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
