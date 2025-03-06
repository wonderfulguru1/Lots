"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Hash } from "lucide-react"
import { ThemeToggle } from "./theme-provider"

export default function Navigation() {
  const pathname = usePathname()
  const { user, isAdmin, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const closeSheet = () => setIsOpen(false)

  const navItems = [
    { name: "Login", href: "/", show: !user },
    { name: "Register", href: "/register", show: !user },
    { name: "View Numbers", href: "/view", show: !!user },
    { name: "Upload", href: "/upload", show: !!user && isAdmin },
    { name: "Admin", href: "/admin", show: !!user && isAdmin },
  ].filter((item) => item.show)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gold-dark/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href={user ? "/view" : "/"} className="mr-6 flex items-center space-x-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gold-dark/10">
              <Hash className="h-4 w-4 text-gold-light" />
            </div>
            <span className="font-bold text-gold-light">Number-Name App</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`transition-colors hover:text-gold-light ${
                  pathname === item.href ? "text-gold-light" : "text-foreground/60"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="mr-2">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0 border-r border-gold-dark/20">
            <Link href={user ? "/view" : "/"} className="flex items-center" onClick={closeSheet}>
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gold-dark/10 mr-2">
                <Hash className="h-4 w-4 text-gold-light" />
              </div>
              <span className="font-bold text-gold-light">Number-Name App</span>
            </Link>
            <nav className="mt-6 flex flex-col space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeSheet}
                  className={`text-sm transition-colors hover:text-gold-light ${
                    pathname === item.href ? "text-gold-light" : "text-foreground/60"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <Link href={user ? "/view" : "/"} className="mr-6 flex items-center space-x-2 md:hidden">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gold-dark/10">
                <Hash className="h-4 w-4 text-gold-light" />
              </div>
              <span className="font-bold text-gold-light">Number-Name App</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user && (
              <Button variant="ghost" onClick={logout} className="text-sm hover:text-gold-light hover:bg-gold-dark/10">
                Logout
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

