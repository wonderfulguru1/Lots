"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { auth, db } from "./firebase"
import {
  updateProfile,
  signOut,
  onAuthStateChanged,
  type User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth"
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore"

type AuthContextType = {
  user: User | null
  loading: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  // Check if user is admin
  const checkAdminStatus = async (userId: string) => {
    try {
      const adminDoc = await getDoc(doc(db, "admins", userId))
      return adminDoc.exists()
    } catch (error) {
      console.error("Error checking admin status:", error)
      return false
    }
  }

  // Check if this is the first user and make them admin
  const setupFirstUserAsAdmin = async (userId: string) => {
    try {
      // Check if admins collection exists and has any documents
      const adminsSnapshot = await getDocs(collection(db, "admins"))

      // If no admins exist, make this user an admin
      if (adminsSnapshot.empty) {
        await setDoc(doc(db, "admins", userId), {
          isFirstUser: true,
          createdAt: new Date(),
        })
        return true
      }

      return false
    } catch (error) {
      console.error("Error setting up first user as admin:", error)
      return false
    }
  }

  // Initialize matches collection
  const initializeMatchesCollection = async () => {
    try {
      const matchesRef = doc(collection(db, "matches"), "all")
      const matchesSnap = await getDoc(matchesRef)

      if (!matchesSnap.exists()) {
        await setDoc(matchesRef, { matches: [] }, { merge: true })
      }
    } catch (error) {
      console.error("Error initializing matches collection:", error)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)

      if (currentUser) {
        // Check if user is admin
        const adminStatus = await checkAdminStatus(currentUser.uid)
        setIsAdmin(adminStatus)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      setUser(userCredential.user)

      // Check admin status after login
      const adminStatus = await checkAdminStatus(userCredential.user.uid)
      setIsAdmin(adminStatus)

      // Ensure matches collection exists
      await initializeMatchesCollection()
    } catch (error) {
      console.error("Error during login:", error)
      throw error
    }
  }

  const register = async (name: string, email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(userCredential.user, {
        displayName: name,
      })
      setUser(userCredential.user)

      // Initialize matches collection if needed
      await initializeMatchesCollection()

      // Check if this is the first user and make them admin
      const isFirstAdmin = await setupFirstUserAsAdmin(userCredential.user.uid)
      setIsAdmin(isFirstAdmin)
    } catch (error) {
      console.error("Error during registration:", error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      setUser(null)
      setIsAdmin(false)
    } catch (error) {
      console.error("Error during logout:", error)
      throw error
    }
  }

  const value = {
    user,
    loading,
    isAdmin,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

