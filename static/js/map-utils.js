/**
 * Map Utilities for Job Board Application
 * Provides consistent mapping functionality across the application
 */

// Declare L as a global variable, assuming it's provided by Leaflet library
const L = window.L

const MapUtils = {
  // Store map instances to prevent memory leaks
  mapInstances: {},

  // Default map settings
  defaults: {
    center: [14.5995, 120.9842], // Manila, Philippines
    zoom: 13,
    maxZoom: 19,
    minZoom: 3,
    geocodeDelay: 300, // ms to wait before geocoding to prevent rate limiting
  },

  /**
   * Initialize a map with improved accuracy and features
   * @param {string} containerId - The HTML element ID for the map container
   * @param {string} inputId - The ID of the input field for the location text
   * @param {string} latInputId - The ID of the input field for latitude
   * @param {string} lngInputId - The ID of the input field for longitude
   * @param {Object} options - Additional options
   * @returns {Object} Map instance and marker
   */
  initMap: function (containerId, inputId, latInputId, lngInputId, options = {}) {
    // Get the map container
    const container = document.getElementById(containerId)
    if (!container) {
      console.error(`Map container #${containerId} not found`)
      return null
    }

    // Make the container visible
    container.style.display = "block"

    // Check if a map instance already exists
    if (this.mapInstances[containerId]) {
      const instance = this.mapInstances[containerId]
      // Refresh the map to handle container size changes
      instance.map.invalidateSize()
      return instance
    }

    // Set initial coordinates
    const initialLat = options.lat || document.getElementById(latInputId)?.value || this.defaults.center[0]
    const initialLng = options.lng || document.getElementById(lngInputId)?.value || this.defaults.center[1]
    const initialZoom = options.zoom || this.defaults.zoom

    // Create the map with improved options
    const map = L.map(container, {
      center: [initialLat, initialLng],
      zoom: initialZoom,
      maxZoom: this.defaults.maxZoom,
      minZoom: this.defaults.minZoom,
      zoomControl: true,
      scrollWheelZoom: true,
      attributionControl: true,
    })

    // Add the tile layer with higher zoom capability for better accuracy
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: this.defaults.maxZoom,
    }).addTo(map)

    // Create a marker if coordinates are provided
    let marker = null
    if (initialLat && initialLng && !isNaN(initialLat) && !isNaN(initialLng)) {
      marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map)

      // Update hidden inputs with initial coordinates
      this.updateCoordinateInputs(latInputId, lngInputId, initialLat, initialLng)

      // Update coordinates when marker is dragged
      marker.on("dragend", (e) => {
        const position = marker.getLatLng()
        this.updateCoordinateInputs(latInputId, lngInputId, position.lat, position.lng)
        this.reverseGeocode(position.lat, position.lng, inputId)
      })
    }

    // Handle map clicks to place/move marker
    map.on("click", (e) => {
      const latlng = e.latlng

      // Update hidden inputs
      this.updateCoordinateInputs(latInputId, lngInputId, latlng.lat, latlng.lng)

      // Update or create marker
      if (marker) {
        marker.setLatLng(latlng)
      } else {
        marker = L.marker(latlng, { draggable: true }).addTo(map)

        // Update coordinates when marker is dragged
        marker.on("dragend", (e) => {
          const position = marker.getLatLng()
          this.updateCoordinateInputs(latInputId, lngInputId, position.lat, position.lng)
          this.reverseGeocode(position.lat, position.lng, inputId)
        })
      }

      // Reverse geocode to get address
      this.reverseGeocode(latlng.lat, latlng.lng, inputId)
    })

    // If initial location is provided but no coordinates, geocode it
    if (options.location && (!initialLat || !initialLng || isNaN(initialLat) || isNaN(initialLng))) {
      this.geocodeLocation(options.location, map, marker, latInputId, lngInputId)
    }

    // Force a map redraw after initialization to ensure proper rendering
    setTimeout(() => {
      map.invalidateSize()
    }, 100)

    // Store the map instance
    this.mapInstances[containerId] = { map, marker }

    return { map, marker }
  },

  /**
   * Update coordinate input fields
   * @param {string} latInputId - The ID of the latitude input field
   * @param {string} lngInputId - The ID of the longitude input field
   * @param {number} lat - Latitude value
   * @param {number} lng - Longitude value
   */
  updateCoordinateInputs: (latInputId, lngInputId, lat, lng) => {
    const latInput = document.getElementById(latInputId)
    const lngInput = document.getElementById(lngInputId)

    if (latInput) latInput.value = lat
    if (lngInput) lngInput.value = lng
  },

  /**
   * Geocode a location string to coordinates with improved accuracy
   * @param {string} locationString - The location to geocode
   * @param {Object} map - The Leaflet map instance
   * @param {Object} marker - The Leaflet marker instance
   * @param {string} latInputId - The ID of the latitude input field
   * @param {string} lngInputId - The ID of the longitude input field
   * @returns {Promise<Object>} The geocoded coordinates
   */
  geocodeLocation: async function (locationString, map, marker, latInputId, lngInputId) {
    if (!locationString) return null

    try {
      // Use Nominatim with additional parameters for better accuracy
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
          `format=json&q=${encodeURIComponent(locationString)}` +
          `&addressdetails=1&limit=1&polygon_geojson=0`,
      )

      const data = await response.json()

      if (data && data.length > 0) {
        const lat = Number.parseFloat(data[0].lat)
        const lng = Number.parseFloat(data[0].lon)

        if (isNaN(lat) || isNaN(lng)) {
          console.error("Invalid coordinates returned from geocoding")
          return null
        }

        // Update map view with appropriate zoom level
        map.setView([lat, lng], 15)

        // Update or create marker
        if (marker) {
          marker.setLatLng([lat, lng])
        } else {
          marker = L.marker([lat, lng], { draggable: true }).addTo(map)

          // Add dragend event listener to the new marker
          marker.on("dragend", (e) => {
            const position = marker.getLatLng()
            this.updateCoordinateInputs(latInputId, lngInputId, position.lat, position.lng)
            this.reverseGeocode(position.lat, position.lng, document.getElementById(latInputId)?.dataset.inputId)
          })

          // Store the marker in the map instance
          const containerId = map._container.id
          if (this.mapInstances[containerId]) {
            this.mapInstances[containerId].marker = marker
          }
        }

        // Update hidden inputs
        this.updateCoordinateInputs(latInputId, lngInputId, lat, lng)

        return { lat, lng }
      } else {
        console.warn("No results found for location:", locationString)
        return null
      }
    } catch (error) {
      console.error("Error geocoding location:", error)
      return null
    }
  },

  /**
   * Reverse geocode coordinates to an address with improved accuracy
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {string} inputId - The ID of the input field to update with the address
   * @returns {Promise<string>} The address
   */
  reverseGeocode: async (lat, lng, inputId) => {
    if (isNaN(lat) || isNaN(lng)) return null

    try {
      // Use Nominatim with additional parameters for better accuracy
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?` +
          `format=json&lat=${lat}&lon=${lng}` +
          `&zoom=18&addressdetails=1`,
      )

      const data = await response.json()

      if (data && data.display_name) {
        const inputElement = document.getElementById(inputId)
        if (inputElement) {
          inputElement.value = data.display_name
        }
        return data.display_name
      }
      return null
    } catch (error) {
      console.error("Error reverse geocoding:", error)
      return null
    }
  },

  /**
   * Clean up a map instance to prevent memory leaks
   * @param {string} containerId - The ID of the map container
   */
  cleanupMap: function (containerId) {
    if (this.mapInstances[containerId]) {
      const { map, marker } = this.mapInstances[containerId]

      // Remove marker if it exists
      if (marker) {
        map.removeLayer(marker)
      }

      // Remove all event listeners
      map.off()

      // Remove the map
      map.remove()

      // Delete the instance
      delete this.mapInstances[containerId]
    }
  },

  /**
   * Search for a location and update the map
   * @param {string} query - The location to search for
   * @param {string} containerId - The ID of the map container
   * @param {string} inputId - The ID of the input field
   * @param {string} latInputId - The ID of the latitude input field
   * @param {string} lngInputId - The ID of the longitude input field
   */
  searchLocation: function (query, containerId, inputId, latInputId, lngInputId) {
    if (!query) return

    const instance = this.mapInstances[containerId]
    if (!instance) {
      console.error(`Map instance for container #${containerId} not found`)
      return
    }

    this.geocodeLocation(query, instance.map, instance.marker, latInputId, lngInputId)
  },
}

// Export the MapUtils object for use in other scripts
window.MapUtils = MapUtils
