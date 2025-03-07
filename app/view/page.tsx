"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import { collection, getDocs, doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore"
import confetti from "canvas-confetti"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Heart, Send } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export default function ViewPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [currentPair, setCurrentPair] = useState<{ id: string; number: string; name: string } | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [alreadyMatched, setAlreadyMatched] = useState(false)
  const [matchDetails, setMatchDetails] = useState<{
    number: string
    name: string
    message?: string
    matchId?: string
  } | null>(null)
  const [message, setMessage] = useState("")
  const [messageSent, setMessageSent] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
  }, [user, loading, router])

  // Check if user already has a match
  useEffect(() => {
    const checkExistingMatch = async () => {
      if (!user) return

      try {
        // Get the "all" document from the matches collection
        const matchesRef = doc(db, "matches", "all")
        const matchesSnap = await getDoc(matchesRef)

        if (matchesSnap.exists()) {
          const matches = matchesSnap.data().matches || []

          // Find if current user has a match
          const userMatch = matches.find(
            (match: any) => match.user === user.displayName || match.userEmail === user.email,
          )

          if (userMatch) {
            setAlreadyMatched(true)
            setMatchDetails({
              number: userMatch.number,
              name: userMatch.name,
              message: userMatch.message || "",
              matchId: userMatch.id || "",
            })
            setMessageSent(!!userMatch.message)
          } else {
            setAlreadyMatched(false)
            setMatchDetails(null)
            setMessageSent(false)
          }
        }

        setLoaded(true)
      } catch (error) {
        console.error("Error checking existing match:", error)
        setLoaded(true)
      }
    }

    if (user && !loaded) {
      checkExistingMatch()
    }
  }, [user, loaded])

  const fetchRandomPair = async () => {
    if (!user || alreadyMatched) {
      setLoaded(true)
      return
    }

    try {
      // First, get all matched pairs to exclude them
      const matchesRef = doc(db, "matches", "all")
      const matchesSnap = await getDoc(matchesRef)

      let matchedPairIds: string[] = []

      if (matchesSnap.exists()) {
        const matches = matchesSnap.data().matches || []
        // Extract all pairIds that have been matched
        matchedPairIds = matches.map((match: any) => match.pairId)
      }

      // Get all pairs
      const pairsRef = collection(db, "pairs")
      const querySnapshot = await getDocs(pairsRef)

      if (!querySnapshot.empty) {
        // Filter out pairs that have already been matched
        const availablePairs = querySnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...(doc.data() as { number: string; name: string }),
          }))
          .filter((pair) => !matchedPairIds.includes(pair.id))

        if (availablePairs.length === 0) {
          // No available pairs left
          setLoaded(true)
          return
        }

        // Select a random pair from available pairs
        const randomPair = availablePairs[Math.floor(Math.random() * availablePairs.length)]
        setCurrentPair(randomPair)
      }

      setLoaded(true)
    } catch (error) {
      console.error("Error fetching pairs:", error)
      setLoaded(true)
    }
  }

  useEffect(() => {
    const fetchRandomPairWrapper = async () => {
      await fetchRandomPair()
    }

    if (user && !loaded && !alreadyMatched) {
      fetchRandomPairWrapper()
    }
  }, [user, loaded, alreadyMatched])

  const handleReveal = async () => {
    if (!currentPair || !user || alreadyMatched) return

    setRevealed(true)

    // Trigger confetti animation with gold colors
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#d4af37", "#f5d76e", "#996515", "#ffd700"],
    })

    // Generate a unique ID for this match
    const matchId = Date.now().toString()

    // Record the match in Firestore
    try {
      const matchesRef = doc(db, "matches", "all")
      await updateDoc(matchesRef, {
        matches: arrayUnion({
          id: matchId,
          user: user.displayName,
          userEmail: user.email,
          pairId: currentPair.id,
          number: currentPair.number,
          name: currentPair.name,
          timestamp: new Date(),
          message: "",
        }),
      })

      // Update local state to prevent further reveals
      setAlreadyMatched(true)
      setMatchDetails({
        number: currentPair.number,
        name: currentPair.name,
        matchId: matchId,
      })
    } catch (error) {
      console.error("Error recording match:", error)
    }
  }

  const handleSendMessage = async () => {
    if (!message.trim() || !user || !matchDetails?.matchId) return

    setSendingMessage(true)

    try {
      // Get current matches
      const matchesRef = doc(db, "matches", "all")
      const matchesSnap = await getDoc(matchesRef)

      if (matchesSnap.exists()) {
        const matches = matchesSnap.data().matches || []

        // Find and update the specific match
        const updatedMatches = matches.map((match: any) => {
          if (
            match.user === user.displayName ||
            match.userEmail === user.email ||
            (matchDetails.matchId && match.id === matchDetails.matchId)
          ) {
            return { ...match, message: message }
          }
          return match
        })

        // Update the document
        await updateDoc(matchesRef, { matches: updatedMatches })

        // Update local state
        setMessageSent(true)
        setMatchDetails((prev) => (prev ? { ...prev, message: message } : null))
      }
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setSendingMessage(false)
    }
  }

  const handleNext = () => {
    setRevealed(false)
    setLoaded(false)
  }

  if (loading || !loaded) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-light"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <h1 className="text-2xl font-bold mb-8 text-gold-light">Welcome, {user?.displayName || "User"}</h1>

      {alreadyMatched ? (
        <div className="w-full max-w-md">
          <Alert className="mb-6 border-gold-light/30 bg-gold-dark/10">
            <AlertCircle className="h-5 w-5 text-gold-light" />
            <AlertDescription className="text-gold-light font-medium">
              Thank you! You have already been matched.
            </AlertDescription>
          </Alert>

          <Card className="p-8 text-center shadow-lg border border-gold-dark/30 gold-gradient gold-shadow">
            <div className="mb-4 text-sm text-muted-foreground">Your match is:</div>
            <div className="text-5xl font-bold mb-6 text-gold-light shimmer">{matchDetails?.number}</div>
            <div className="text-3xl font-semibold text-gold-light mb-8">{matchDetails?.name}</div>

            {messageSent ? (
              <div className="mt-6 p-4 bg-gold-dark/10 rounded-lg border border-gold-dark/20">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="h-4 w-4 text-gold-light" />
                  <h3 className="text-gold-light font-medium">Your Message</h3>
                </div>
                <p className="text-foreground/80 italic">{matchDetails?.message}</p>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-gold-light" />
                  <Label htmlFor="message" className="text-gold-light font-medium">
                    Send a heartfelt message
                  </Label>
                </div>
                <Textarea
                  id="message"
                  placeholder="Write a message to the person you've been matched with..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[100px] border-gold-dark/20 focus:border-gold-light focus:ring-gold-light/20"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || sendingMessage}
                  className="w-full bg-gold-dark hover:bg-gold-dark/80 text-primary-foreground"
                >
                  {sendingMessage ? (
                    "Sending..."
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="h-4 w-4" /> Send Message
                    </span>
                  )}
                </Button>
              </div>
            )}
          </Card>
        </div>
      ) : currentPair ? (
        <div className="w-full max-w-md">
          <Card className="p-8 text-center shadow-lg border border-gold-dark/30 gold-gradient gold-shadow">
            <div className="text-5xl font-bold mb-6 text-gold-light shimmer">{currentPair.number}</div>

            {revealed ? (
              <div className="mt-6">
                <div className="text-3xl font-semibold text-gold-light animate-fade-in">{currentPair.name}</div>
                <Button
                  onClick={handleNext}
                  className="mt-8 bg-gold-dark hover:bg-gold-dark/80 text-primary-foreground"
                >
                  Next Card
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleReveal}
                size="lg"
                className="mt-6 bg-gold-dark hover:bg-gold-dark/80 text-primary-foreground"
              >
                Reveal Name
              </Button>
            )}
          </Card>
        </div>
      ) : (
        <div className="text-center w-full max-w-md">
          <Card className="p-8 text-center shadow-lg border border-gold-dark/30">
            <AlertCircle className="h-12 w-12 text-gold-light mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-gold-light">No Available Matches</h2>
            <p className="text-muted-foreground mb-4">All number-name pairs have already been matched with users.</p>
            <p className="text-sm text-muted-foreground">Please ask the admin to add more pairs or check back later.</p>
          </Card>
        </div>
      )}
    </div>
  )
}

