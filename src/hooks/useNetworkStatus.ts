import { useState, useEffect } from 'react'
import { Network } from '@capacitor/network'

export function useNetworkStatus() {
    // Default to true to avoid initial flash
    const [isOnline, setIsOnline] = useState(true)

    useEffect(() => {
        // Initial check
        Network.getStatus().then(status => {
            setIsOnline(status.connected)
        })

        // Listener
        const handler = Network.addListener('networkStatusChange', status => {
            setIsOnline(status.connected)
        })

        return () => {
            handler.then(h => h.remove())
        }
    }, [])

    return isOnline
}
