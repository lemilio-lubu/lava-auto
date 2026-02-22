'use client';

import { useState, useEffect } from 'react';
import { MapPin, Search, Crosshair, AlertCircle } from 'lucide-react';

// Declaración de tipos para Google Maps
declare global {
  interface Window {
    google: any;
  }
}

interface LocationPickerProps {
  defaultAddress?: string;
  defaultLat?: number;
  defaultLng?: number;
  onLocationChange?: (location: {
    address: string;
    latitude: number;
    longitude: number;
  }) => void;
}

export default function LocationPicker({
  defaultAddress = '',
  defaultLat,
  defaultLng,
  onLocationChange,
}: LocationPickerProps) {
  const [address, setAddress] = useState(defaultAddress);
  const [coordinates, setCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(
    defaultLat && defaultLng ? { lat: defaultLat, lng: defaultLng } : null
  );
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [error, setError] = useState<string>('');
  const [mapLoaded, setMapLoaded] = useState(false);

  // Cargar script de Google Maps
  useEffect(() => {
    // Verificar si el script ya existe en el DOM
    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com/maps/api/js"]'
    );

    if (typeof window !== 'undefined' && !window.google && !existingScript) {
      const script = document.createElement('script');
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    } else if (window.google) {
      setMapLoaded(true);
    } else if (existingScript) {
      // Si el script existe pero aún no está cargado, esperar a que cargue
      const checkGoogleLoaded = setInterval(() => {
        if (window.google) {
          setMapLoaded(true);
          clearInterval(checkGoogleLoaded);
        }
      }, 100);

      return () => clearInterval(checkGoogleLoaded);
    }
  }, []);

  // Inicializar mapa
  useEffect(() => {
    if (!mapLoaded || map) return;

    const defaultCenter = coordinates || { lat: -0.1807, lng: -78.4678 }; // Quito por defecto

    const mapInstance = new window.google.maps.Map(
      document.getElementById('map') as HTMLElement,
      {
        center: defaultCenter,
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      }
    );

    const markerInstance = new window.google.maps.Marker({
      position: defaultCenter,
      map: mapInstance,
      draggable: true,
      animation: window.google.maps.Animation.DROP,
    });

    // Listener para cuando se arrastra el marcador
    markerInstance.addListener('dragend', () => {
      const position = markerInstance.getPosition();
      if (position) {
        const newCoords = {
          lat: position.lat(),
          lng: position.lng(),
        };
        setCoordinates(newCoords);
        reverseGeocode(newCoords.lat, newCoords.lng);
      }
    });

    // Listener para clicks en el mapa
    mapInstance.addListener('click', (e: any) => {
      if (e.latLng) {
        const newCoords = {
          lat: e.latLng.lat(),
          lng: e.latLng.lng(),
        };
        markerInstance.setPosition(e.latLng);
        setCoordinates(newCoords);
        reverseGeocode(newCoords.lat, newCoords.lng);
      }
    });

    setMap(mapInstance);
    setMarker(markerInstance);
  }, [mapLoaded]);

  // Geocodificación inversa (coordenadas a dirección)
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const geocoder = new window.google.maps.Geocoder();
      const result = await geocoder.geocode({ location: { lat, lng } });
      
      if (result.results[0]) {
        const newAddress = result.results[0].formatted_address;
        setAddress(newAddress);
        
        if (onLocationChange) {
          onLocationChange({
            address: newAddress,
            latitude: lat,
            longitude: lng,
          });
        }
      }
    } catch (error) {
      console.error('Error en geocodificación inversa:', error);
    }
  };

  // Buscar dirección
  const searchAddress = async () => {
    if (!address.trim()) return;

    setError('');
    setIsLoadingLocation(true);

    try {
      const geocoder = new window.google.maps.Geocoder();
      const result = await geocoder.geocode({ address });

      if (result.results[0]) {
        const location = result.results[0].geometry.location;
        const newCoords = {
          lat: location.lat(),
          lng: location.lng(),
        };

        setCoordinates(newCoords);

        if (map && marker) {
          map.setCenter(location);
          marker.setPosition(location);
        }

        if (onLocationChange) {
          onLocationChange({
            address: result.results[0].formatted_address,
            latitude: newCoords.lat,
            longitude: newCoords.lng,
          });
        }
      } else {
        setError('No se encontró la dirección. Intenta con otra búsqueda.');
      }
    } catch (error) {
      setError('Error al buscar la dirección. Intenta nuevamente.');
      console.error('Error en búsqueda:', error);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Obtener ubicación actual
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización.');
      return;
    }

    setIsLoadingLocation(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setCoordinates(newCoords);

        if (map && marker) {
          const location = new window.google.maps.LatLng(newCoords.lat, newCoords.lng);
          map.setCenter(location);
          marker.setPosition(location);
        }

        reverseGeocode(newCoords.lat, newCoords.lng);
        setIsLoadingLocation(false);
      },
      (error) => {
        setError('No se pudo obtener tu ubicación. Verifica los permisos.');
        setIsLoadingLocation(false);
        console.error('Error de geolocalización:', error);
      }
    );
  };

  return (
    <div className="space-y-4">
      {/* Buscador de dirección */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Dirección del Servicio
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchAddress())}
            placeholder="Calle, número, colonia, ciudad"
            className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 dark:bg-slate-700 dark:text-white"
          />
          <button
            type="button"
            onClick={searchAddress}
            disabled={isLoadingLocation || !address.trim()}
            className="px-4 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-400 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Search className="w-5 h-5" />
            Buscar
          </button>
          <button
            type="button"
            onClick={getCurrentLocation}
            disabled={isLoadingLocation}
            className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white rounded-lg transition-colors"
            title="Usar mi ubicación actual"
          >
            <Crosshair className="w-5 h-5" />
          </button>
        </div>
        {error && (
          <div className="mt-2 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Mapa */}
      <div className="relative">
        <div
          id="map"
          className="w-full h-96 rounded-lg border-2 border-slate-300 dark:border-slate-600"
        />
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400">Cargando mapa...</p>
            </div>
          </div>
        )}
      </div>

      {/* Información de coordenadas */}
      {coordinates && (
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-cyan-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-semibold text-slate-900 dark:text-white mb-1">
                Ubicación seleccionada
              </p>
              <p className="text-slate-600 dark:text-slate-400 mb-2">{address}</p>
              <p className="text-xs text-slate-500 dark:text-slate-500">
                Lat: {coordinates.lat.toFixed(6)}, Lng: {coordinates.lng.toFixed(6)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Instrucciones */}
      <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-lg p-4 border border-cyan-200 dark:border-cyan-800">
        <p className="text-sm text-cyan-900 dark:text-cyan-100">
          <strong>Tip:</strong> Puedes buscar tu dirección, usar tu ubicación actual, o hacer clic
          directamente en el mapa. También puedes arrastrar el marcador para ajustar la posición.
        </p>
      </div>

      {/* Campos ocultos para el formulario */}
      <input type="hidden" name="address" value={address} />
      <input type="hidden" name="latitude" value={coordinates?.lat || ''} />
      <input type="hidden" name="longitude" value={coordinates?.lng || ''} />
    </div>
  );
}
