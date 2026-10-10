import React, { useRef, useState, useMemo, useEffect } from 'react';
import Map, { Marker, Popup, NavigationControl, FullscreenControl, ScaleControl, GeolocateControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import useSupercluster from 'use-supercluster';
import { useTheme } from '../context/ThemeContext';
import { MapPin } from 'lucide-react';
import api from '../api';

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

export default function TokyoMap({ businesses = [], hoveredId = null, onMarkerClick = null, fitBoundsOnLoad = true }) {
  const { theme } = useTheme();
  const mapRef = useRef();
  const [popupInfo, setPopupInfo] = useState(null);
  
  const [viewState, setViewState] = useState({
    longitude: 139.6503,
    latitude: 35.6762,
    zoom: 11
  });

  // Convert businesses to GeoJSON points for clustering
  const points = useMemo(() => {
    return businesses
      .filter(b => b.geo && b.geo.coordinates && b.geo.coordinates[0] !== 0)
      .map(b => ({
        type: 'Feature',
        properties: {
          cluster: false,
          businessId: b._id,
          business: b
        },
        geometry: {
          type: 'Point',
          coordinates: [b.geo.coordinates[0], b.geo.coordinates[1]]
        }
      }));
  }, [businesses]);

  const bounds = mapRef.current
    ? mapRef.current.getMap().getBounds().toArray().flat()
    : null;

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom: viewState.zoom,
    options: { radius: 40, maxZoom: 15 }
  });

  // Fit bounds on load
  useEffect(() => {
    if (fitBoundsOnLoad && points.length > 0 && mapRef.current) {
      const lats = points.map(p => p.geometry.coordinates[1]);
      const lngs = points.map(p => p.geometry.coordinates[0]);
      
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);

      // Don't fit if it's just one point or same point
      if (minLng !== maxLng || minLat !== maxLat) {
        mapRef.current.fitBounds(
          [[minLng, minLat], [maxLng, maxLat]],
          { padding: 40, duration: 1000, maxZoom: 15 }
        );
      } else {
        mapRef.current.flyTo({ center: [minLng, minLat], zoom: 15, duration: 1000 });
      }
    }
  }, [points.length, fitBoundsOnLoad]);

  // Handle map style transformation for themes + English labels
  const transformStyle = (style) => {
    if (!style) return style;
    const s = JSON.parse(JSON.stringify(style)); // clone
    
    // Theme colors
    const isDark = theme === 'dark';
    const landColor = isDark ? '#111111' : '#f4efe4';
    const waterColor = isDark ? '#0A1E33' : '#c3d1e6';
    const parkColor = isDark ? '#18241b' : '#d2dfd4';
    const roadColor = isDark ? '#C28F27' : '#E94E1B';
    const roadOpacity = isDark ? 0.3 : 0.2;

    if (s.layers) {
      s.layers.forEach(layer => {
        // Enforce English labels
        if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
          layer.layout['text-field'] = ["coalesce", ["get", "name:en"], ["get", "name:latin"], ["get", "name"]];
          if (isDark && layer.paint) {
             if (layer.paint['text-color']) layer.paint['text-color'] = '#F4F4F4';
             if (layer.paint['text-halo-color']) layer.paint['text-halo-color'] = '#111111';
          }
        }
        
        // Background and land
        if (layer.id === 'background' || layer.id.includes('land')) {
          if (!layer.paint) layer.paint = {};
          layer.paint['background-color'] = landColor;
          if (layer.paint['fill-color']) layer.paint['fill-color'] = landColor;
        }
        
        // Water
        if (layer.id.includes('water') && layer.type === 'fill') {
          if (!layer.paint) layer.paint = {};
          layer.paint['fill-color'] = waterColor;
        }

        // Parks/Greenery
        if (layer.id.includes('park') || layer.id.includes('green') || layer.id.includes('forest')) {
          if (layer.type === 'fill') {
            if (!layer.paint) layer.paint = {};
            layer.paint['fill-color'] = parkColor;
          }
        }

        // Roads
        if (layer.id.includes('road') && layer.type === 'line') {
           if (!layer.paint) layer.paint = {};
           if (layer.id.includes('motorway') || layer.id.includes('primary')) {
             layer.paint['line-color'] = roadColor;
             layer.paint['line-opacity'] = roadOpacity;
           } else if (isDark) {
             layer.paint['line-color'] = '#333333';
           }
        }
      });
    }
    return s;
  };

  const handleClusterClick = (clusterId, longitude, latitude) => {
    const expansionZoom = Math.min(supercluster.getClusterExpansionZoom(clusterId), 16);
    mapRef.current.flyTo({
      center: [longitude, latitude],
      zoom: expansionZoom,
      duration: 500
    });
  };

  return (
    <Map
      ref={mapRef}
      {...viewState}
      onMove={evt => setViewState(evt.viewState)}
      mapStyle={MAP_STYLE}
      transformStyle={transformStyle}
      maxBounds={[[138.8, 35.4], [140.0, 36.0]]}
      minZoom={10}
      style={{ width: '100%', height: '100%', borderRadius: 'inherit' }}
      attributionControl={false}
    >
      <GeolocateControl position="top-right" />
      <FullscreenControl position="top-right" />
      <NavigationControl position="top-right" />
      <ScaleControl />

      <div className="mapboxgl-ctrl-bottom-right" style={{ position: 'absolute', right: 10, bottom: 10, fontSize: 10, background: 'rgba(255,255,255,0.7)', padding: '2px 5px', borderRadius: '4px' }}>
        &copy; <a href="https://openfreemap.org">OpenFreeMap</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors
      </div>

      {clusters.map(cluster => {
        const [longitude, latitude] = cluster.geometry.coordinates;
        const { cluster: isCluster, point_count: pointCount } = cluster.properties;

        if (isCluster) {
          return (
            <Marker
              key={`cluster-${cluster.id}`}
              latitude={latitude}
              longitude={longitude}
              onClick={(e) => { e.originalEvent.stopPropagation(); handleClusterClick(cluster.id, longitude, latitude); }}
            >
              <div
                className="cluster-marker"
                style={{
                  width: `${30 + (pointCount / points.length) * 20}px`,
                  height: `${30 + (pointCount / points.length) * 20}px`,
                  background: 'rgba(233, 78, 27, 0.9)',
                  color: 'white',
                  borderRadius: '50%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  cursor: 'pointer',
                  border: '2px solid white'
                }}
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
              e.originalEvent.stopPropagation();
              setPopupInfo(b);
              if (onMarkerClick) onMarkerClick(b);
            }}
            style={{ zIndex: isHovered ? 10 : 1 }}
          >
            <div className={`custom-pin-wrap ${isHovered ? 'hovered' : ''}`} style={{ cursor: 'pointer' }}>
              <div className="custom-pin">
                <div className="pin-inner"></div>
              </div>
            </div>
          </Marker>
        );
      })}

      {popupInfo && (
        <Popup
          anchor="top"
          longitude={popupInfo.geo.coordinates[0]}
          latitude={popupInfo.geo.coordinates[1]}
          onClose={() => setPopupInfo(null)}
          closeButton={true}
          closeOnClick={false}
          maxWidth="250px"
          className="tokyo-popup"
        >
          <div className="map-popup-content" style={{ margin: '-10px -10px -15px -10px', borderRadius: '8px', overflow: 'hidden' }}>
            {popupInfo.images?.[0] && popupInfo.images[0].source !== 'placeholder' ? (
              <img src={popupInfo.images[0].url.startsWith('http') ? popupInfo.images[0].url : `${api.defaults.baseURL.replace('/api/v1', '')}${popupInfo.images[0].url}`} alt={popupInfo.name} style={{ width: '100%', height: 100, objectFit: 'cover' }} />
            ) : (
              <div style={{ height: 60, background: 'var(--color-primary)' }} />
            )}
            <div style={{ padding: '12px', background: 'var(--color-surface)' }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)', lineHeight: 1.2 }}>{popupInfo.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 4 }}>{popupInfo.category}</div>
              <div style={{ fontSize: '0.8rem', marginTop: 4, color: 'var(--color-text)' }}><MapPin size={12} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> {popupInfo.ward || popupInfo.city}</div>
              <a href={`/business/${popupInfo.slug || popupInfo._id}`} style={{ display: 'block', marginTop: 8, color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: 600 }}>View details →</a>
            </div>
          </div>
        </Popup>
      )}
    </Map>
  );
}
