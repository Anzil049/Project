import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useJsApiLoader, Autocomplete, GoogleMap, Marker } from '@react-google-maps/api';
import { toast } from 'react-hot-toast';
import { Search, MapPin, Navigation, Lock } from 'lucide-react';

const LocationPicker = React.forwardRef(({ lat, lng, onLocationSelect, isEditing, disabled, hideLocateButton = false }, ref) => {
  const activeEditing = isEditing !== undefined ? isEditing : (disabled !== undefined ? !disabled : true);
  
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: ['places']
  });

  const [address, setAddress] = useState('');
  const autocompleteRef = useRef(null);

  // Sync address when coordinates change (initial load)
  useEffect(() => {
    if (isLoaded && lat && lng && window.google?.maps) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat: parseFloat(lat), lng: parseFloat(lng) } }, (results, status) => {
        if (status === 'OK' && results[0]) {
          setAddress(results[0].formatted_address);
        }
      });
    }
  }, [lat, lng, isLoaded]);

  const reverseGeocode = useCallback((lat, lng) => {
    if (!isLoaded || !window.google?.maps) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const addressComponents = results[0].address_components;
        const addressData = {
          fullAddress: results[0].formatted_address,
          city: '',
          state: '',
          zip: '',
          address: '',
          locality: '',
          landmark: ''
        };

        addressComponents.forEach(component => {
          const types = component.types;
          if (types.includes('locality')) addressData.city = component.long_name;
          if (types.includes('sublocality') || types.includes('neighborhood')) addressData.locality = component.long_name;
          if (types.includes('administrative_area_level_1')) addressData.state = component.long_name;
          if (types.includes('postal_code')) addressData.zip = component.long_name;
          if (types.includes('point_of_interest') || types.includes('establishment')) addressData.landmark = component.long_name;
          if (types.includes('route') || types.includes('street_number') || types.includes('premise')) {
             addressData.address = addressData.address ? `${component.long_name}, ${addressData.address}` : component.long_name;
          }
        });

        setAddress(results[0].formatted_address);
        onLocationSelect(lat, lng, addressData);
      }
    });
  }, [onLocationSelect]);

  const onPlaceSelected = () => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry) {
        const newPos = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        };
        
        const addressData = {
          fullAddress: place.formatted_address,
          city: '',
          state: '',
          zip: '',
          address: '',
          locality: '',
          landmark: ''
        };

        place.address_components?.forEach(component => {
          const types = component.types;
          if (types.includes('locality')) addressData.city = component.long_name;
          if (types.includes('sublocality') || types.includes('neighborhood')) addressData.locality = component.long_name;
          if (types.includes('administrative_area_level_1')) addressData.state = component.long_name;
          if (types.includes('postal_code')) addressData.zip = component.long_name;
          if (types.includes('point_of_interest') || types.includes('establishment')) addressData.landmark = component.long_name;
          if (types.includes('route') || types.includes('street_number') || types.includes('premise')) {
            addressData.address = addressData.address ? `${component.long_name}, ${addressData.address}` : component.long_name;
          }
        });

        setAddress(place.formatted_address);
        onLocationSelect(newPos.lat, newPos.lng, addressData);
      }
    }
  };

  const handleLocateMe = () => {
    if (!activeEditing) {
      toast.error('Please click "Edit Profile" first');
      return;
    }
    
    if ("geolocation" in navigator) {
      toast.loading('Locating...', { id: 'geo' });
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          toast.success('Location detected', { id: 'geo' });
        },
        (err) => {
          toast.error('Location access denied', { id: 'geo' });
        }
      );
    }
  };

  const mapContainerStyle = {
    width: '100%',
    height: '400px',
    borderRadius: '24px'
  };

  const center = {
    lat: parseFloat(lat) || 20.5937,
    lng: parseFloat(lng) || 78.9629
  };

  const onMapClick = useCallback((e) => {
    if (!activeEditing) return;
    const clickedLat = e.latLng.lat();
    const clickedLng = e.latLng.lng();
    reverseGeocode(clickedLat, clickedLng);
  }, [activeEditing, reverseGeocode]);

  React.useImperativeHandle(ref, () => ({
    handleLocateMe
  }));

  if (!isLoaded) return (
    <div className="animate-pulse bg-gray-50 h-[400px] rounded-[24px] border border-gray-100"></div>
  );

  return (
    <div className="w-full relative">
      {!activeEditing && (
        <div 
          className="absolute inset-0 z-50 cursor-not-allowed bg-white/10 backdrop-blur-[1px] rounded-2xl flex items-center justify-end pr-4 pointer-events-auto"
          onClick={(e) => {
             e.stopPropagation();
             toast.error('Please click "Edit Profile" first to change location');
          }}
        >
           <div className="p-2 bg-navy/5 rounded-full text-navy/20">
              <Lock size={16} />
           </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="relative rounded-[24px] overflow-hidden border-2 border-gray-100 shadow-xl">
           <GoogleMap
             mapContainerStyle={mapContainerStyle}
             center={center}
             zoom={lat && lng ? 15 : 5}
             onClick={onMapClick}
             options={{
               disableDefaultUI: true,
               zoomControl: true,
               styles: [
                 {
                   featureType: "poi",
                   elementType: "labels",
                   stylers: [{ visibility: "off" }]
                 }
               ]
             }}
           >
             {lat && lng && (
               <Marker 
                 position={center}
                 animation={window.google.maps.Animation.DROP}
               />
             )}
           </GoogleMap>

           {/* Search Overlay - keep it for convenience but made subtle as per user "instead of search" hint */}
           <div className="absolute top-4 left-4 right-4 z-10">
              <Autocomplete
                onLoad={(ref) => (autocompleteRef.current = ref)}
                onPlaceChanged={onPlaceSelected}
                options={{
                  componentRestrictions: { country: "in" },
                  fields: ["address_components", "geometry", "formatted_address"],
                  // Priority to Kerala bounds
                  bounds: {
                    north: 12.85,
                    south: 8.15,
                    east: 77.5,
                    west: 74.8,
                  },
                  strictBounds: false
                }}
              >
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-navy/30">
                    <Search size={16} />
                  </div>
                  <input
                    type="text"
                    placeholder="Search for your location (India)..."
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/90 backdrop-blur-md border border-white/20 shadow-2xl outline-none text-xs font-bold text-navy placeholder:text-navy/20 focus:bg-white transition-all"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </Autocomplete>
           </div>
        </div>

        {!hideLocateButton && (
          <div className="flex items-center justify-between px-2">
            <button
              onClick={handleLocateMe}
              disabled={!activeEditing}
              className={`flex items-center gap-3 px-2 py-1 transition-colors group ${
                activeEditing ? 'text-[#0D9488] hover:text-[#0D9488]/80' : 'text-gray-400 cursor-not-allowed opacity-40'
              }`}
            >
              <div className={`p-1.5 rounded-lg bg-current/10 transition-transform ${activeEditing ? 'group-hover:scale-110' : ''}`}>
                <Navigation size={14} className="fill-current" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-widest">Use my current location</span>
            </button>

            {lat && lng && (
              <div className="flex items-center gap-2 text-navy/30 text-[10px] font-black uppercase tracking-widest">
                 <MapPin size={12} /> {Number(lat).toFixed(4)}, {Number(lng).toFixed(4)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default LocationPicker;
