// Generate or retrieve a persistent device identifier for this browser
// This is used to track which staff member is clocked-in on this specific device

export function getDeviceId(): string {
    const DEVICE_ID_KEY = 'pos_device_id'

    // Try to get existing device ID from localStorage
    if (typeof window !== 'undefined') {
        let deviceId = localStorage.getItem(DEVICE_ID_KEY)

        if (!deviceId) {
            // Generate a new device ID
            deviceId = 'device_' +
                Date.now().toString(36) + '_' +
                Math.random().toString(36).substring(2, 15)

            localStorage.setItem(DEVICE_ID_KEY, deviceId)
        }

        return deviceId
    }

    // Fallback for SSR
    return 'device_ssr'
}
