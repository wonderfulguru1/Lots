"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Hash } from "lucide-react"

export default function RegisterPage() {
  const { register, user, isAdmin } = useAuth()
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isRegistering, setIsRegistering] = useState(false)

  useEffect(() => {
    if (user && isAdmin) {
      setSuccess("Registration successful! You are the first user, so you've been made an admin.")
      // Redirect after a short delay to show the success message
      const timer = setTimeout(() => {
        router.push("/view")
      }, 3000)
      return () => clearTimeout(timer)
    } else if (user) {
      router.push("/view")
    }
  }, [user, isAdmin, router])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("All fields are required")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setIsRegistering(true)
    setError("")

    try {
      await register(name, email, password)
      // Redirect is handled in the useEffect
    } catch (error: any) {
      console.error("Registration error:", error)
      if (error.code === "auth/email-already-in-use") {
        setError("This email is already registered. Please use a different email or login.")
      } else {
        setError("Registration failed. Please try again.")
      }
      setIsRegistering(false)
    }
  }

  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <Card className="w-full max-w-md border-gold-dark/30 gold-shadow">
        <CardHeader className="space-y-1 pb-2">
          <div className="flex justify-center mb-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gold-dark/10">
              <Hash className="h-6 w-6 text-gold-light" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center text-gold-light">Create an Account</CardTitle>
          <CardDescription className="text-center">
            Register to access the number-name matching application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister}>
            <div className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-gold-light/30 bg-gold-dark/10">
                  <CheckCircle className="h-4 w-4 text-gold-light" />
                  <AlertDescription className="text-gold-light">{success}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground/80">
                  Full Name
                </Label>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="border-gold-dark/20 focus:border-gold-light focus:ring-gold-light/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground/80">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-gold-dark/20 focus:border-gold-light focus:ring-gold-light/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground/80">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-gold-dark/20 focus:border-gold-light focus:ring-gold-light/20"
                />
                <p className="text-xs text-muted-foreground">Password must be at least 6 characters</p>
              </div>

              <Button
                type="submit"
                className="w-full bg-gold-dark hover:bg-gold-dark/80 text-primary-foreground"
                disabled={isRegistering || !!success}
              >
                {isRegistering ? "Creating Account..." : "Register"}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/" className="text-gold-light hover:underline">
              Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

