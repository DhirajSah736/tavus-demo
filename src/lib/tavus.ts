export interface TavusConversation {
  conversation_id: string
  conversation_url: string
  status: string
}

export interface TavusError {
  error: string
  message: string
}

class TavusAPI {
  private apiKey: string
  private baseUrl = 'https://tavusapi.com/v2'

  constructor() {
    this.apiKey = import.meta.env.VITE_TAVUS_API_KEY
    if (!this.apiKey) {
      throw new Error('VITE_TAVUS_API_KEY is required')
    }
  }

  async createConversation(): Promise<TavusConversation> {
    const replicaId = import.meta.env.VITE_TAVUS_REPLICA_ID
    const personaId = import.meta.env.VITE_TAVUS_PERSONA_ID

    if (!replicaId || !personaId) {
      throw new Error('Tavus replica_id and persona_id are required')
    }

    console.log('Creating Tavus conversation with:', {
      replica_id: replicaId,
      persona_id: personaId,
      api_key_present: !!this.apiKey
    })

    try {
      const response = await fetch(`${this.baseUrl}/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify({
          replica_id: replicaId,
          persona_id: personaId,
        }),
      })

      console.log('Tavus API response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Tavus API error response:', errorText)
        
        let error: TavusError
        try {
          error = JSON.parse(errorText)
        } catch {
          error = { error: 'API_ERROR', message: `HTTP ${response.status}: ${errorText}` }
        }
        
        throw new Error(error.message || `Tavus API error: ${response.status}`)
      }

      const result = await response.json()
      console.log('Tavus conversation created successfully:', result)
      
      // Validate the response structure
      if (!result.conversation_id || !result.conversation_url) {
        throw new Error('Invalid response from Tavus API: missing conversation_id or conversation_url')
      }

      return result
    } catch (error) {
      console.error('Tavus API Error:', error)
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to Tavus API. Please check your internet connection.')
      }
      
      throw error
    }
  }

  async endConversation(conversationId: string): Promise<void> {
    console.log('Ending Tavus conversation:', conversationId)
    
    try {
      const response = await fetch(`${this.baseUrl}/conversations/${conversationId}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
      })

      console.log('End conversation response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('End conversation error response:', errorText)
        
        let error: TavusError
        try {
          error = JSON.parse(errorText)
        } catch {
          error = { error: 'API_ERROR', message: `HTTP ${response.status}: ${errorText}` }
        }
        
        throw new Error(error.message || `Failed to end conversation: ${response.status}`)
      }

      console.log('Conversation ended successfully')
    } catch (error) {
      console.error('End conversation error:', error)
      throw error
    }
  }
}

export const tavusAPI = new TavusAPI()