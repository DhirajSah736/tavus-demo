import React, { useState, useRef, useEffect } from 'react'
import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff, Settings, Maximize, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react'

interface VideoInterfaceProps {
  conversationUrl: string
  onEndCall: () => void
  isActive: boolean
}

export function VideoInterface({ conversationUrl, onEndCall, isActive }: VideoInterfaceProps) {
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [iframeError, setIframeError] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [retryCount, setRetryCount] = useState(0)
  const [showFallback, setShowFallback] = useState(false)
  const [embedBlocked, setEmbedBlocked] = useState(false)
  const videoRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    console.log('VideoInterface mounted with URL:', conversationUrl)
    
    // Reset states when URL changes
    setIframeLoaded(false)
    setIframeError(false)
    setLoadingProgress(0)
    setRetryCount(0)
    setShowFallback(false)
    setEmbedBlocked(false)
    
    // Validate URL format
    if (!conversationUrl || !conversationUrl.startsWith('http')) {
      console.error('Invalid conversation URL:', conversationUrl)
      setIframeError(true)
      return
    }

    // Check if the URL is likely to be blocked in iframe
    if (conversationUrl.includes('daily.co') || conversationUrl.includes('tavus')) {
      console.log('Detected Daily.co/Tavus URL - may have iframe restrictions')
    }

    // Simulate loading progress
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return prev
        }
        return prev + Math.random() * 15
      })
    }, 200)

    // Set a timeout to detect iframe blocking
    const embedTimeout = setTimeout(() => {
      if (!iframeLoaded && !iframeError) {
        console.log('Iframe may be blocked by X-Frame-Options, showing fallback')
        setEmbedBlocked(true)
        setShowFallback(true)
        setLoadingProgress(100)
      }
    }, 5000) // Shorter timeout for embed detection

    return () => {
      clearInterval(progressInterval)
      clearTimeout(embedTimeout)
    }
  }, [conversationUrl, retryCount])

  const handleIframeLoad = () => {
    console.log('Iframe loaded successfully')
    setIframeLoaded(true)
    setIframeError(false)
    setEmbedBlocked(false)
    setShowFallback(false)
    setLoadingProgress(100)
    
    // Verify the iframe actually loaded content
    setTimeout(() => {
      if (videoRef.current) {
        try {
          // Try to access iframe properties to detect if it's actually loaded
          const iframeDoc = videoRef.current.contentDocument
          if (!iframeDoc) {
            console.log('Iframe loaded but content may be restricted')
          }
        } catch (error) {
          console.log('Iframe content access restricted (expected for cross-origin)')
        }
      }
    }, 1000)
  }

  const handleIframeError = (error?: any) => {
    console.error('Iframe failed to load:', error)
    setIframeError(true)
    setIframeLoaded(false)
    setLoadingProgress(0)
    
    // If it's a loading error, it might be due to X-Frame-Options
    setTimeout(() => {
      setEmbedBlocked(true)
      setShowFallback(true)
    }, 1000)
  }

  const openInNewWindow = () => {
    console.log('Opening video chat in new window')
    
    // Calculate optimal window size
    const width = Math.min(1200, window.screen.width * 0.8)
    const height = Math.min(800, window.screen.height * 0.8)
    const left = (window.screen.width - width) / 2
    const top = (window.screen.height - height) / 2
    
    const windowFeatures = [
      `width=${width}`,
      `height=${height}`,
      `left=${left}`,
      `top=${top}`,
      'scrollbars=yes',
      'resizable=yes',
      'toolbar=no',
      'menubar=no',
      'location=no',
      'status=no'
    ].join(',')
    
    const newWindow = window.open(conversationUrl, 'tavus-video-chat', windowFeatures)
    
    if (!newWindow) {
      // Fallback to new tab if popup is blocked
      console.log('Popup blocked, opening in new tab')
      window.open(conversationUrl, '_blank', 'noopener,noreferrer')
    } else {
      // Focus the new window
      newWindow.focus()
      
      // Monitor the window to detect when it's closed
      const checkClosed = setInterval(() => {
        if (newWindow.closed) {
          console.log('Video chat window was closed')
          clearInterval(checkClosed)
          // Optionally end the call when window is closed
          // onEndCall()
        }
      }, 1000)
      
      // Clean up the interval after 30 minutes
      setTimeout(() => clearInterval(checkClosed), 30 * 60 * 1000)
    }
  }

  const retryEmbed = () => {
    console.log('Retrying iframe embed...')
    setRetryCount(prev => prev + 1)
    setIframeError(false)
    setIframeLoaded(false)
    setEmbedBlocked(false)
    setShowFallback(false)
    setLoadingProgress(0)
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Listen for messages from the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only listen to messages from trusted domains
      const trustedDomains = ['tavus.io', 'daily.co', 'tavusapi.com']
      const isFromTrustedDomain = trustedDomains.some(domain => 
        event.origin.includes(domain)
      )
      
      if (isFromTrustedDomain) {
        console.log('Received message from video chat:', event.data)
        
        // Handle different message types from the video chat
        if (event.data.type === 'video-call-started') {
          console.log('Video call started')
          setIframeLoaded(true)
        } else if (event.data.type === 'video-call-ended') {
          console.log('Video call ended')
          onEndCall()
        } else if (event.data.type === 'iframe-blocked') {
          console.log('Iframe embedding blocked')
          setEmbedBlocked(true)
          setShowFallback(true)
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onEndCall])

  return (
    <div 
      ref={containerRef}
      className={`relative w-full ${isFullscreen ? 'h-screen' : 'h-96 md:h-[500px] lg:h-[600px]'} bg-gray-900 rounded-2xl overflow-hidden shadow-2xl`}
    >
      {/* Try iframe embedding first, but hide if showing fallback */}
      {conversationUrl && !showFallback && (
        <iframe
          key={`iframe-${retryCount}`}
          ref={videoRef}
          src={conversationUrl}
          className={`w-full h-full border-0 ${iframeLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
          allow="camera *; microphone *; fullscreen *; display-capture *; autoplay *; encrypted-media *; geolocation *; gyroscope *; accelerometer *; picture-in-picture *; web-share *"
          allowFullScreen
          title="AI Video Chat"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation allow-camera allow-microphone allow-popups-to-escape-sandbox allow-top-navigation allow-top-navigation-by-user-activation"
          style={{ 
            border: 'none',
            colorScheme: 'normal'
          }}
          referrerPolicy="strict-origin-when-cross-origin"
        />
      )}

      {/* Loading State */}
      {!iframeLoaded && !iframeError && !showFallback && (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
          <div className="text-center text-white max-w-md px-6">
            <div className="relative mb-6">
              <div className="animate-spin w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Video className="w-8 h-8 text-purple-300" />
              </div>
            </div>
            
            <h3 className="text-xl font-bold mb-2">Connecting to AI...</h3>
            <p className="text-purple-200 text-sm mb-4">Setting up your video conversation</p>
            
            {/* Progress bar */}
            <div className="w-full bg-purple-800/30 rounded-full h-2 mb-4">
              <div 
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            
            <div className="text-xs text-purple-300 space-y-1">
              <p>• Requesting camera and microphone access</p>
              <p>• Establishing secure connection</p>
              <p>• Loading AI video interface</p>
            </div>
          </div>
        </div>
      )}

      {/* Fallback State - Open in New Window */}
      {(showFallback || embedBlocked) && (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
          <div className="text-center text-white p-8 max-w-md">
            <Video className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-4">
              {embedBlocked ? 'Embed Restricted' : 'Video Chat Ready'}
            </h3>
            <p className="text-purple-200 mb-6">
              {embedBlocked 
                ? 'The video service prevents embedding for security. We\'ll open it in a new window for the best experience.'
                : 'For the best video chat experience with full camera and microphone access, we\'ll open this in a dedicated window.'
              }
            </p>
            
            <div className="space-y-4">
              <button
                onClick={openInNewWindow}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                <ExternalLink className="w-5 h-5" />
                <span>Open Video Chat</span>
              </button>
              
              {!embedBlocked && (
                <button
                  onClick={retryEmbed}
                  className="w-full bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 border border-white/20"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Try Embed Again</span>
                </button>
              )}
            </div>
            
            <div className="mt-6 p-4 bg-black/20 rounded-lg">
              <p className="text-purple-200 text-sm">
                <strong>Why a new window?</strong>
              </p>
              <p className="text-purple-300 text-xs mt-1">
                Video services like Tavus use security measures that prevent embedding. 
                A new window ensures full functionality and better performance.
              </p>
            </div>
            
            <div className="mt-4 p-3 bg-blue-900/20 rounded-lg border border-blue-500/30">
              <p className="text-blue-200 text-xs">
                <strong>💡 Tip:</strong> Allow popups for this site and keep the video window open during your conversation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error State with Retry */}
      {iframeError && !showFallback && (
        <div className="absolute inset-0 bg-gradient-to-br from-red-900 via-red-800 to-red-900 flex items-center justify-center">
          <div className="text-center text-white p-8 max-w-md">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-4">Connection Issue</h3>
            <p className="text-red-200 mb-6">
              There was a problem loading the video chat. This might be due to browser security settings or network issues.
            </p>
            
            <div className="space-y-4">
              <button
                onClick={openInNewWindow}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                <ExternalLink className="w-5 h-5" />
                <span>Open in New Window</span>
              </button>
              
              <button
                onClick={retryEmbed}
                className="w-full bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 border border-white/20"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry Embed</span>
              </button>
            </div>
            
            <div className="mt-6 text-left bg-red-800/30 rounded-lg p-4 text-sm">
              <p className="font-medium text-red-200 mb-2">Troubleshooting:</p>
              <ul className="text-red-300 space-y-1 text-xs">
                <li>• Allow camera and microphone permissions</li>
                <li>• Disable ad blockers for this site</li>
                <li>• Allow popups for this domain</li>
                <li>• Check your internet connection</li>
                <li>• Try using a different browser</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Overlay Controls */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/50 to-transparent p-4 pointer-events-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  iframeLoaded ? 'bg-green-500 animate-pulse' : 
                  embedBlocked || showFallback ? 'bg-yellow-500' :
                  iframeError ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
                }`} />
                <span className="text-white text-sm font-medium">
                  {iframeLoaded ? 'Connected' : 
                   embedBlocked || showFallback ? 'Ready to Connect' :
                   iframeError ? 'Connection Error' : 'Connecting...'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {(iframeError || embedBlocked) && (
                <button
                  onClick={openInNewWindow}
                  className="p-2 bg-purple-500/80 hover:bg-purple-600/80 rounded-lg transition-colors text-white"
                  title="Open in new window"
                >
                  <ExternalLink className="w-5 h-5" />
                </button>
              )}
              
              {iframeError && !embedBlocked && (
                <button
                  onClick={retryEmbed}
                  className="p-2 bg-black/30 hover:bg-black/50 rounded-lg transition-colors text-white"
                  title="Retry embed"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              )}
              
              {iframeLoaded && (
                <button
                  onClick={toggleFullscreen}
                  className="p-2 bg-black/30 hover:bg-black/50 rounded-lg transition-colors text-white"
                  title="Toggle fullscreen"
                >
                  <Maximize className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-6 pointer-events-auto">
          <div className="flex items-center justify-center space-x-4">
            {/* End Call - Always available */}
            <button
              onClick={onEndCall}
              className="p-4 bg-red-500 hover:bg-red-600 rounded-full transition-all duration-200 text-white transform hover:scale-105"
              title="End conversation"
            >
              <PhoneOff className="w-6 h-6" />
            </button>

            {/* Show additional controls when loaded */}
            {iframeLoaded && (
              <>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-4 rounded-full transition-all duration-200 ${
                    isMuted 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm'
                  }`}
                  title="Audio controls are handled within the video chat"
                >
                  {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>

                <button
                  onClick={() => setIsVideoOn(!isVideoOn)}
                  className={`p-4 rounded-full transition-all duration-200 ${
                    !isVideoOn 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm'
                  }`}
                  title="Video controls are handled within the video chat"
                >
                  {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                </button>

                <button 
                  className="p-4 bg-white/20 hover:bg-white/30 rounded-full transition-all duration-200 text-white backdrop-blur-sm"
                  title="Settings are available within the video chat"
                >
                  <Settings className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
          
          <div className="text-center mt-4">
            {iframeLoaded ? (
              <p className="text-white/70 text-sm">
                Video chat is active - use the controls within the chat interface
              </p>
            ) : showFallback || embedBlocked ? (
              <p className="text-white/70 text-sm">
                Click "Open Video Chat" to start your conversation in a new window
              </p>
            ) : iframeError ? (
              <p className="text-white/70 text-sm">
                Connection failed - try opening in a new window or retry embed
              </p>
            ) : (
              <p className="text-white/70 text-sm">
                Please allow camera and microphone access when prompted
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}