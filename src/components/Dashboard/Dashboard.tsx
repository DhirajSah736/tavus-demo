import React, { useState } from 'react'
import { Video, Plus, History, LogOut, User, Moon, Sun } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useConversations } from '../../hooks/useConversations'
import { tavusAPI } from '../../lib/tavus'
import { VideoInterface } from '../VideoChat/VideoInterface'
import { ConversationCard } from './ConversationCard'

type ActiveConversation = {
  id: string
  url?: string
  tavusId: string
  type: 'video'
}

export function Dashboard() {
  const { user, signOut } = useAuth()
  const { conversations, createConversation, updateConversation, deleteConversation, loading } = useConversations()
  const [activeConversation, setActiveConversation] = useState<ActiveConversation | null>(null)
  const [isStartingVideo, setIsStartingVideo] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startVideoConversation = async () => {
    if (!user) return

    setIsStartingVideo(true)
    setError(null)
    
    try {
      console.log('Starting new video conversation...')
      
      // Create conversation with Tavus
      const tavusConversation = await tavusAPI.createConversation()
      console.log('Tavus conversation created:', tavusConversation)
      
      // Validate the conversation URL
      if (!tavusConversation.conversation_url) {
        throw new Error('No conversation URL received from Tavus')
      }
      
      console.log('Conversation URL:', tavusConversation.conversation_url)
      
      // Save to database
      const dbConversation = await createConversation({
        user_id: user.id,
        tavus_conversation_id: tavusConversation.conversation_id,
        status: 'active',
        conversation_type: 'video',
        metadata: { conversation_url: tavusConversation.conversation_url }
      })

      console.log('Database conversation created:', dbConversation)

      // Set as active conversation
      setActiveConversation({
        id: dbConversation.id,
        url: tavusConversation.conversation_url,
        tavusId: tavusConversation.conversation_id,
        type: 'video'
      })
    } catch (error) {
      console.error('Failed to start video conversation:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to start conversation'
      setError(errorMessage)
      
      // Show more specific error messages
      if (errorMessage.includes('API key')) {
        setError('Invalid Tavus API key. Please check your configuration.')
      } else if (errorMessage.includes('replica_id') || errorMessage.includes('persona_id')) {
        setError('Invalid Tavus replica or persona ID. Please check your configuration.')
      } else if (errorMessage.includes('fetch')) {
        setError('Network error. Please check your internet connection and try again.')
      }
    } finally {
      setIsStartingVideo(false)
    }
  }

  const endConversation = async () => {
    if (!activeConversation) return

    try {
      // End conversation with Tavus
      await tavusAPI.endConversation(activeConversation.tavusId)
      
      // Update database
      await updateConversation(activeConversation.id, {
        status: 'ended',
        ended_at: new Date().toISOString()
      })

      setActiveConversation(null)
      setError(null)
    } catch (error) {
      console.error('Failed to end conversation:', error)
    }
  }

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await deleteConversation(conversationId)
    } catch (error) {
      console.error('Failed to delete conversation:', error)
      setError('Failed to delete conversation. Please try again.')
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
  }

  if (activeConversation) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={endConversation}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                End Conversation
              </button>
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
            </div>
            
            <VideoInterface
              conversationUrl={activeConversation.url!}
              onEndCall={endConversation}
              isActive={true}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
                  <Video className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  AI Video Chat
                </h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={toggleDarkMode}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <User className="w-4 h-4" />
                  <span>{user?.email}</span>
                </div>
                
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-1 px-3 py-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    Connection Error
                  </h3>
                  <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
                  <div className="mt-2">
                    <button
                      onClick={() => setError(null)}
                      className="text-sm text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300 underline"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Video Chat Card */}
          <div className="mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700 max-w-2xl mx-auto">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Video className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    AI Video Chat
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Interactive AI video conversation
                  </p>
                </div>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Connect with your AI persona for a face-to-face video conversation experience powered by Tavus.
              </p>
              
              <button
                onClick={startVideoConversation}
                disabled={isStartingVideo}
                className="w-full inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <Video className="w-5 h-5" />
                <span>{isStartingVideo ? 'Starting...' : 'Start Video Chat'}</span>
              </button>
            </div>
          </div>

          {/* Conversation History */}
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <History className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Conversation History
              </h2>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Loading conversations...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No conversations yet.</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">Start your first AI video conversation!</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {conversations.map((conversation) => (
                  <ConversationCard
                    key={conversation.id}
                    id={conversation.id}
                    tavusConversationId={conversation.tavus_conversation_id}
                    status={conversation.status}
                    createdAt={conversation.created_at}
                    endedAt={conversation.ended_at}
                    conversationType="video"
                    onDelete={handleDeleteConversation}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}