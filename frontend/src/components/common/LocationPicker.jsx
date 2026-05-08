import React, { useState, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const center = {
  lat: 20.5937,
  lng: 78.9629
};

const LocationPicker = ({ lat, lng, onLocationSelect, isEditing = true }) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: ['places']
  });

  const [map, setMap] = useState(null);
  const [position, setPosition] = useState(lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null);
  const autocompleteRef = useRef(null);

  const onLoad = useCallback(function callback(map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map) {
    setMap(null);
  }, []);

  const onMapClick = useCallback((e) => {
    if (!isEditing) return;
    const newPos = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng()
    };
    setPosition(newPos);
    onLocationSelect(newPos.lat, newPos.lng);
  }, [isEditing, onLocationSelect]);

  const onPlaceSelected = () => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry) {
        const newPos = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        };
        setPosition(newPos);
        onLocationSelect(newPos.lat, newPos.lng);
        map.panTo(newPos);
        map.setZoom(15);
      }
    }
  };

  if (!isLoaded) return (
    <div className="h-[300px] w-full bg-gray-50 flex items-center justify-center rounded-2xl border-2 border-dashed border-gray-200">
      <div className="text-center space-y-2">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-[10px] font-black text-navy/40 uppercase tracking-widest">Loading Google Maps...</p>
      </div>
    </div>
  );

  return (
    <div className="h-[300px] w-full rounded-2xl overflow-hidden border-2 border-gray-100 shadow-inner relative z-0">
      {isEditing && (
        <div className="absolute top-4 left-4 right-4 z-10 px-4">
          <Autocomplete
            onLoad={(ref) => (autocompleteRef.current = ref)}
            onPlaceChanged={onPlaceSelected}
          >
            <input
              type="text"
              placeholder="Search for your clinic address..."
              className="w-full px-6 py-3.5 rounded-2xl bg-white/95 backdrop-blur-md shadow-2xl border border-gray-100 outline-none text-sm font-bold text-navy placeholder:text-navy/30 focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </Autocomplete>
        </div>
      )}

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={position || center}
        zoom={position ? 15 : 5}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={onMapClick}
        options={{
            disableDefaultUI: false,
            clickableIcons: false,
            styles: [
                {
                    "featureType": "administrative",
                    "elementType": "labels.text.fill",
                    "stylers": [{ "color": "#444444" }]
                },
                {
                    "featureType": "landscape",
                    "elementType": "all",
                    "stylers": [{ "color": "#f2f2f2" }]
                },
                {
                    "featureType": "poi",
                    "elementType": "all",
                    "stylers": [{ "visibility": "off" }]
                }
            ]
        }}
      >
        {position && <Marker position={position} />}
      </GoogleMap>
      
      {isEditing && !position && (
        <div className="absolute bottom-4 left-4 right-4 bg-navy/80 backdrop-blur-md p-3 rounded-xl shadow-lg z-10 text-[9px] font-black text-white text-center uppercase tracking-widest">
          Search above or click on the map to set location
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
