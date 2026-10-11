import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import Map, { Marker, Popup, NavigationControl, FullscreenControl, ScaleControl, GeolocateControl } from 'react-map-gl/maplibre';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import useSupercluster from 'use-supercluster';
import { useTheme } from '../context/ThemeContext';
import { MapPin, Navigation, ExternalLink } from 'lucide-react';
import { API_URL } from '../api';
import { getSpotImageUrl } from '../utils/imageFallback';

const OPENFREEMAP_LIBERTY = "https://tiles.openfreemap.org/styles/liberty";
const OPENFREEMAP_BRIGHT = "https://tiles.openfreemap.org/styles/bright";

export default function TokyoMap({ businesses = [], hoveredId = null, onMarkerClick = null, fitBoundsOnLoad = true }) {
  const { theme } = useTheme();
  const mapRef = useRef(null);
  const [popupInfo, setPopupInfo] = useState(null);
  const [bounds, setBounds] = useState(null);
  
  const [viewState, setViewState] = useState({
    longitude: 139.7314,
    latitude: 35.6895,
    zoom: 11.5
  });

  const activeMapStyle = theme === 'dark' ? OPENFREEMAP_LIBERTY : OPENFREEMAP_BRIGHT;

  // Convert businesses to GeoJSON points for clustering
  const points = useMemo(() => {
    return businesses
      .filter(b => b.geo && b.geo.coordinates && b.geo.coordinates.length === 2 && (b.geo.coordinates[0] !== 0 || b.geo.coordinates[1] !== 0))
      .map(b => ({
        type: 'Feature',
        properties: {
          cluster: false,
          businessId: b._id,
          business: b
        },
        geometry: {
          type: 'Point',
          coordinates: [Number(b.geo.coordinates[0]), Number(b.geo.coordinates[1])]
        }
      }));
  }, [businesses]);

  const updateBounds = useCallback(() => {
    if (mapRef.current) {
      try {
        const map = mapRef.current.getMap?.() || mapRef.current;
        const b = map.getBounds();
        if (b) {
          setBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
        }
      } catch (e) {}
    }
  }, []);

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds: bounds || [138.8, 35.4, 140.2, 36.1],
    zoom: viewState.zoom,
    options: { radius: 45, maxZoom: 16 }
  });

  // Fit bounds when points change
  useEffect(() => {
    if (fitBoundsOnLoad && points.length > 0 && mapRef.current) {
      try {
        const lats = points.map(p => p.geometry.coordinates[1]);
        const lngs = points.map(p => p.geometry.coordinates[0]);
        
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);

        if (minLng !== maxLng || minLat !== maxLat) {
          const map = mapRef.current.getMap?.() || mapRef.current;
          map.fitBounds(
            [[minLng, minLat], [maxLng, maxLat]],
            { padding: 50, duration: 800, maxZoom: 14 }
          );
        }
      } catch (err) {}
    }
  }, [points, fitBoundsOnLoad]);

  const handleClusterClick = (clusterId, longitude, latitude) => {
    if (!supercluster) return;
    try {
      const expansionZoom = Math.min(supercluster.getClusterExpansionZoom(clusterId), 16);
      const map = mapRef.current.getMap?.() || mapRef.current;
      map.flyTo({
        center: [longitude, latitude],
        zoom: expansionZoom,
        duration: 500
      });
    } catch (e) {}
  };

  const recenterTokyo = () => {
    if (mapRef.current) {
      const map = mapRef.current.getMap?.() || mapRef.current;
      map.flyTo({
        center: [139.7314, 35.6895],
        zoom: 11.5,
        duration: 800
      });
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '600px', borderRadius: 'inherit', overflow: 'hidden' }}>
      <Map
        ref={mapRef}
        mapLib={maplibregl}
        {...viewState}
        onMove={evt => {
          setViewState(evt.viewState);
        }}
        onMoveEnd={updateBounds}
        onLoad={updateBounds}
        mapStyle={activeMapStyle}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
      >
        <GeolocateControl position="top-right" />
        <FullscreenControl position="top-right" />
        <NavigationControl position="top-right" />
        <ScaleControl />

        {/* Floating Tokyo Badge & Recenter Button */}
        <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 5, display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ background: 'var(--color-surface)', backdropFilter: 'blur(8px)', border: '1px solid var(--color-border)', padding: '6px 14px', borderRadius: 'var(--radius-pill)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', color: 'var(--color-text)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#E94E1B', display: 'inline-block' }} />
            Tokyo Map • 東京 ({points.length} spots)
          </div>
          <button 
            onClick={recenterTokyo}
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '6px 12px', borderRadius: 'var(--radius-pill)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', color: 'var(--color-text)' }}
            title="Recenter to Tokyo Center"
          >
            <Navigation size={12} /> Recenter
          </button>
        </div>

        {/* Attribution Notice */}
        <div style={{ position: 'absolute', right: 10, bottom: 10, fontSize: 10, background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '2px 8px', borderRadius: '4px', zIndex: 5 }}>
          &copy; <a href="https://carto.com" target="_blank" rel="noreferrer" style={{ color: '#fff', textDecoration: 'none' }}>CARTO</a> &copy; <a href="https://openstreetmap.org" target="_blank" rel="noreferrer" style={{ color: '#fff', textDecoration: 'none' }}>OpenStreetMap</a>
        </div>

        {/* Markers & Clusters */}
        {clusters.map(cluster => {
          const [longitude, latitude] = cluster.geometry.coordinates;
          const { cluster: isCluster, point_count: pointCount } = cluster.properties;

          if (isCluster) {
            const size = Math.min(32 + Math.log2(pointCount) * 6, 56);
            return (
              <Marker
                key={`cluster-${cluster.id}`}
                latitude={latitude}
                longitude={longitude}
                onClick={(e) => {
                  e.originalEvent?.stopPropagation();
                  handleClusterClick(cluster.id, longitude, latitude);
                }}
              >
                <div
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    background: 'linear-gradient(135deg, #E94E1B 0%, #C22D00 100%)',
                    color: 'white',
                    borderRadius: '50%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontWeight: 700,
                    fontSize: '13px',
                    boxShadow: '0 4px 14px rgba(233, 78, 27, 0.45)',
                    cursor: 'pointer',
                    border: '2.5px solid #ffffff',
                    transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {pointCount}
                </div>
              </Marker>
            );
          }

          const b = cluster.properties.business;
          const isHovered = hoveredId === b._id;

          return (
            <Marker
              key={b._id}
              latitude={latitude}
              longitude={longitude}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent?.stopPropagation();
                setPopupInfo(b);
                if (onMarkerClick) onMarkerClick(b);
              }}
              style={{ zIndex: isHovered ? 20 : 1 }}
            >
              <div 
                style={{ 
                  cursor: 'pointer',
                  transform: isHovered ? 'scale(1.25) translateY(-4px)' : 'scale(1)',
                  transition: 'transform 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}
              >
                <div 
                  style={{
                    width: isHovered ? '28px' : '22px',
                    height: isHovered ? '28px' : '22px',
                    background: isHovered ? '#111' : '#E94E1B',
                    borderRadius: '50% 50% 50% 0',
                    transform: 'rotate(-45deg)',
                    border: '2px solid #ffffff',
                    boxShadow: '0 3px 8px rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <div style={{ width: 6, height: 6, background: '#ffffff', borderRadius: '50%' }} />
                </div>
              </div>
            </Marker>
          );
        })}

        {/* Rich Spot Popup */}
        {popupInfo && (
          <Popup
            anchor="top"
            longitude={popupInfo.geo.coordinates[0]}
            latitude={popupInfo.geo.coordinates[1]}
            onClose={() => setPopupInfo(null)}
            closeButton={true}
            closeOnClick={false}
            maxWidth="280px"
          >
            <div style={{ margin: '-10px -10px -15px -10px', borderRadius: '12px', overflow: 'hidden', background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <div style={{ height: 110, position: 'relative', overflow: 'hidden' }}>
                <img 
                  src={getSpotImageUrl(popupInfo, API_URL)} 
                  alt={popupInfo.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
                <div style={{ position: 'absolute', top: 8, left: 8, background: '#E94E1B', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>
                  {popupInfo.category}
                </div>
              </div>
              
              <div style={{ padding: '12px 14px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)', lineHeight: 1.3 }}>
                  {popupInfo.name}
                </div>
                {popupInfo.nameJa && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                    {popupInfo.nameJa}
                  </div>
                )}
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={12} color="#E94E1B" /> {popupInfo.ward || popupInfo.area || popupInfo.city || 'Tokyo'}
                </div>
                <a 
                  href={`/business/${popupInfo.slug || popupInfo._id}`} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: 4, 
                    marginTop: 10, 
                    padding: '6px 12px', 
                    background: '#E94E1B', 
                    color: '#fff', 
                    borderRadius: '8px', 
                    fontSize: '0.82rem', 
                    fontWeight: 600, 
                    textDecoration: 'none' 
                  }}
                >
                  View Spot Details →
                </a>
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
