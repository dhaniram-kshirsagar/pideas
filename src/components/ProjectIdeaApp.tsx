"use client"

import React, { useState, useEffect } from "react"
import LoginWithParticles from "./LoginWithParticles"

// Firebase imports
declare global {
  interface Window {
    firebase: any;
  }
}

interface User {
  uid: string;
  displayName: string;
  email: string;
}

interface ProjectIdea {
  title: string;
  description: string;
  technologies: string[];
  difficulty: string;
}

export default function ProjectIdeaApp() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [projectIdea, setProjectIdea] = useState<ProjectIdea | null>(null)
  const [generating, setGenerating] = useState(false)
  const [lastQuery, setLastQuery] = useState("")

  // Initialize Firebase Auth listener
  useEffect(() => {
    if (!window.firebase) {
      setLoading(false)
      return
    }

    const auth = window.firebase.auth()
    const unsubscribe = auth.onAuthStateChanged((user: any) => {
      if (user) {
        setUser({
          uid: user.uid,
          displayName: user.displayName,
          email: user.email
        })
        loadUserProfile(user.uid)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const loadUserProfile = async (uid: string) => {
    try {
      const firestore = window.firebase.firestore()
      const doc = await firestore.collection('users').doc(uid).get()
      if (doc.exists) {
        const data = doc.data()
        setLastQuery(data.lastQuery || "")
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
    }
  }

  const handleLogin = (user: User) => {
    setUser(user)
  }

  const handleLogout = async () => {
    try {
      const auth = window.firebase.auth()
      await auth.signOut()
      setUser(null)
      setProjectIdea(null)
      setQuery("")
      setLastQuery("")
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const generateProjectIdea = async () => {
    if (!query.trim() || !user) return

    setGenerating(true)
    try {
      // Save query to user profile
      const firestore = window.firebase.firestore()
      await firestore.collection('users').doc(user.uid).set({
        lastQuery: query,
        name: user.displayName,
        email: user.email,
        lastUpdated: new Date().toISOString()
      }, { merge: true })

      // Call Firebase function to generate idea
      const functions = window.firebase.functions()
      const generateIdea = functions.httpsCallable('generateProjectIdea')
      
      const result = await generateIdea({ query })
      setProjectIdea(result.data)
      setLastQuery(query)
    } catch (error) {
      console.error('Error generating project idea:', error)
      // Fallback mock data for development
      setProjectIdea({
        title: `${query} Project`,
        description: `A comprehensive project based on your query: "${query}". This project would involve modern technologies and best practices.`,
        technologies: ["React", "Node.js", "Firebase", "TypeScript"],
        difficulty: "Intermediate"
      })
    } finally {
      setGenerating(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      generateProjectIdea()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!user) {
    return <LoginWithParticles onLoginSuccess={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Project Idea Generator</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-300">Welcome, {user.displayName}!</span>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {lastQuery && (
          <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <p className="text-gray-300">
              <span className="text-cyan-400">Last query:</span> {lastQuery}
            </p>
          </div>
        )}

        {/* Query Input */}
        <div className="mb-8">
          <label htmlFor="query" className="block text-white text-lg font-medium mb-4">
            What kind of project would you like to build?
          </label>
          <div className="flex gap-4">
            <textarea
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g., A web app for managing personal finances with charts and budgeting tools"
              className="flex-1 p-4 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
              rows={3}
            />
            <button
              onClick={generateProjectIdea}
              disabled={generating || !query.trim()}
              className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white px-8 py-4 rounded-lg font-medium transition-colors disabled:cursor-not-allowed flex items-center gap-2"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Generating...
                </>
              ) : (
                'Generate Idea'
              )}
            </button>
          </div>
        </div>

        {/* Project Idea Display */}
        {projectIdea && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4">{projectIdea.title}</h2>
            <p className="text-gray-300 mb-6 leading-relaxed">{projectIdea.description}</p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-3">Technologies</h3>
                <div className="flex flex-wrap gap-2">
                  {projectIdea.technologies.map((tech, index) => (
                    <span
                      key={index}
                      className="bg-cyan-600/20 text-cyan-300 px-3 py-1 rounded-full text-sm border border-cyan-600/30"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-3">Difficulty</h3>
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                  projectIdea.difficulty === 'Beginner' ? 'bg-green-600/20 text-green-300 border border-green-600/30' :
                  projectIdea.difficulty === 'Intermediate' ? 'bg-yellow-600/20 text-yellow-300 border border-yellow-600/30' :
                  'bg-red-600/20 text-red-300 border border-red-600/30'
                }`}>
                  {projectIdea.difficulty}
                </span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
