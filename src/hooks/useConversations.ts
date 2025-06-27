import { useState, useEffect } from 'react'
import { supabase, Database } from '../lib/supabase'
import { useAuth } from './useAuth'

type Conversation = Database['public']['Tables']['conversations']['Row']
type ConversationInsert = Database['public']['Tables']['conversations']['Insert']
type ConversationUpdate = Database['public']['Tables']['conversations']['Update']

export function useConversations() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setConversations([])
      setLoading(false)
      return
    }

    fetchConversations()
  }, [user])

  const fetchConversations = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setConversations(data || [])
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const createConversation = async (conversation: ConversationInsert) => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert(conversation)
        .select()
        .single()

      if (error) throw error
      
      setConversations(prev => [data, ...prev])
      return data
    } catch (error) {
      console.error('Error creating conversation:', error)
      throw error
    }
  }

  const updateConversation = async (id: string, updates: ConversationUpdate) => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      
      setConversations(prev =>
        prev.map(conv => (conv.id === id ? data : conv))
      )
      return data
    } catch (error) {
      console.error('Error updating conversation:', error)
      throw error
    }
  }

  const deleteConversation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setConversations(prev => prev.filter(conv => conv.id !== id))
    } catch (error) {
      console.error('Error deleting conversation:', error)
      throw error
    }
  }

  return {
    conversations,
    loading,
    createConversation,
    updateConversation,
    deleteConversation,
    refetch: fetchConversations,
  }
}