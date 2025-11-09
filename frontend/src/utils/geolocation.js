/**
 * Get user's current location using browser geolocation API
 */
export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      (error) => {
        reject(new Error(`Geolocation error: ${error.message}`))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  })
}

/**
 * Reverse geocode coordinates to address using OpenStreetMap Nominatim API
 * This is a free service, no API key required
 */
export async function reverseGeocode(latitude, longitude) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'E-BloodBank App', // Required by Nominatim
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch address')
    }

    const data = await response.json()
    const address = data.address || {}

    return {
      address: data.display_name || '',
      street: address.road || address.street || '',
      city: address.city || address.town || address.village || address.municipality || '',
      state: address.state || address.region || '',
      pincode: address.postcode || '',
      country: address.country || '',
      latitude,
      longitude,
    }
  } catch (error) {
    throw new Error(`Reverse geocoding failed: ${error.message}`)
  }
}

/**
 * Get current location and reverse geocode to get full address
 */
export async function getCurrentAddress() {
  try {
    const location = await getCurrentLocation()
    const address = await reverseGeocode(location.latitude, location.longitude)
    return address
  } catch (error) {
    throw error
  }
}

