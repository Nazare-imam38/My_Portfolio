import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import * as turf from '@turf/turf';
import styled from 'styled-components';

const MapContainer = styled.div`
  width: 100%;
  height: 100%;
  max-width: 400px;
  max-height: 400px;
  min-width: 400px;
  min-height: 400px;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid ${({ theme }) => theme.primary};
  box-shadow: ${({ theme }) => theme.bg === "#000000" 
    ? "0 0 30px rgba(29, 66, 144, 0.5)" 
    : "0 0 30px rgba(29, 66, 144, 0.3)"};
  position: relative;
  z-index: 100;
  background-color: ${({ theme }) => theme.card};
  
  @media (max-width: 640px) {
    max-width: 280px;
    max-height: 280px;
    min-width: 280px;
    min-height: 280px;
  }

  .mapboxgl-map {
    border-radius: 12px;
    position: relative;
    z-index: 1;
  }

  .mapboxgl-canvas {
    border-radius: 12px;
    position: relative;
    z-index: 1;
  }
`;

// Helper functions for animation
function clamp(v) {
  return Math.max(0.0, Math.min(v, 1.0));
}

function mix(a, b, mixFactor) {
  const f = clamp(mixFactor);
  return a * (1 - f) + b * f;
}

function rad2deg(angRad) {
  return (angRad * 180.0) / Math.PI;
}

function animSinPhaseFromTime(animTimeS, phaseLen) {
  return (
    Math.sin(((animTimeS % phaseLen) / phaseLen) * Math.PI * 2.0) * 0.5 + 0.5
  );
}

// FlightRoute class handles loading and sampling flight path data
class FlightRoute {
  constructor(url) {
    this.coordinates = [];
    this.elevationData = [];
    this.distances = [];
    this.maxElevation = 0;
    
    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        const targetRouteFeature = data.features[0];
        this.setFromFeatureData(targetRouteFeature);
      })
      .catch((error) => {
        console.error('Error loading flight path data:', error);
      });
  }

  get totalLength() {
    if (!this.distances || this.distances.length === 0) return 0;
    return this.distances[this.distances.length - 1];
  }

  setFromFeatureData(targetRouteFeature) {
    const coordinates = targetRouteFeature.geometry.coordinates;
    this.elevationData = targetRouteFeature.properties.elevation;
    this.coordinates = coordinates;
    this.maxElevation = 0;
    
    if (this.elevationData.length !== this.coordinates.length) {
      console.error('Number of elevation samples does not match coordinate data length');
    }

    const distances = [0];
    for (let i = 1; i < coordinates.length; i++) {
      const segmentDistance =
        turf.distance(
          turf.point(coordinates[i - 1]),
          turf.point(coordinates[i]),
          { units: 'kilometers' }
        ) * 1000.0;
      distances.push(distances[i - 1] + segmentDistance);
      this.maxElevation = Math.max(this.maxElevation, this.elevationData[i]);
    }
    this.distances = distances;
  }

  sample(currentDistance) {
    if (!this.distances || this.distances.length === 0) return null;

    let segmentIndex = this.distances.findIndex((d) => d >= currentDistance) - 1;
    if (segmentIndex < 0) segmentIndex = 0;
    if (segmentIndex >= this.coordinates.length - 1) {
      segmentIndex = this.coordinates.length - 2;
    }

    const p1 = this.coordinates[segmentIndex];
    const p2 = this.coordinates[segmentIndex + 1];
    const segmentLength = this.distances[segmentIndex + 1] - this.distances[segmentIndex];
    const segmentRatio = segmentLength > 0 
      ? (currentDistance - this.distances[segmentIndex]) / segmentLength 
      : 0;

    const e1 = this.elevationData[segmentIndex];
    const e2 = this.elevationData[segmentIndex + 1];
    const bearing = turf.bearing(p1, p2);
    const altitude = e1 + (e2 - e1) * segmentRatio;
    const segmentDistanceMeters = segmentLength;
    const pitch = rad2deg(Math.atan2(e2 - e1, segmentDistanceMeters));

    return {
      position: [
        p1[0] + (p2[0] - p1[0]) * segmentRatio,
        p1[1] + (p2[1] - p1[1]) * segmentRatio
      ],
      altitude: altitude,
      bearing: bearing,
      pitch: pitch
    };
  }
}

// Airplane class manages airplane state and animations
class Airplane {
  constructor() {
    this.position = [0, 0];
    this.altitude = 0;
    this.bearing = 0;
    this.pitch = 0;
    this.roll = 0;
    this.rearGearRotation = 0;
    this.frontGearRotation = 0;
    this.lightPhase = 0;
    this.lightPhaseStrobe = 0;
    this.lightTaxiPhase = 0;
    this.animTimeS = 0;
  }

  update(target, dtimeMs) {
    if (!target) return;
    
    this.position[0] = mix(this.position[0], target.position[0], dtimeMs * 0.05);
    this.position[1] = mix(this.position[1], target.position[1], dtimeMs * 0.05);
    this.altitude = mix(this.altitude, target.altitude, dtimeMs * 0.05);
    this.bearing = mix(this.bearing, target.bearing, dtimeMs * 0.01);
    this.pitch = mix(this.pitch, target.pitch, dtimeMs * 0.01);
    this.frontGearRotation = mix(0, 90, this.altitude / 50.0);
    this.rearGearRotation = mix(0, -90, this.altitude / 50.0);
    this.lightPhase = animSinPhaseFromTime(this.animTimeS, 2.0) * 0.25 + 0.75;
    this.lightPhaseStrobe = animSinPhaseFromTime(this.animTimeS, 1.0);
    this.lightTaxiPhase = mix(1.0, 0, this.altitude / 100.0);
    this.roll = rad2deg(
      mix(
        0,
        Math.sin(this.animTimeS * Math.PI * 0.2) * 0.1,
        (this.altitude - 50.0) / 100.0
      )
    );
    this.animTimeS += dtimeMs / 1000.0;
  }
}

// Asset helper function
function asset(uri) {
  return `https://docs.mapbox.com/mapbox-gl-js/assets/${uri}`;
}

const Map3D = () => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const animationModeRef = useRef('airplane'); // 'airplane' or 'floorplan'
  const floorPlanStartTimeRef = useRef(null);

  useEffect(() => {
    // Set Mapbox access token
    const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || 'pk.eyJ1IjoibmF6YXJpbWFtNCIsImEiOiJjbWw2Y240ejQwYnZoM2VzZjRvY3g5OGFyIn0.7TwMCvRBdlwezSkigtrNiA';
    mapboxgl.accessToken = MAPBOX_TOKEN;

    // Don't initialize if map already exists
    if (mapRef.current) return;

    const flightPathJsonUri = asset('flightpath.json');
    const airplaneModelUri = asset('airplane.glb');

    // Create custom style with both floor plan and airplane model
    const style = {
      'version': 8,
      'imports': [
        {
          'id': 'basemap',
          'url': 'mapbox://styles/mapbox/standard',
          'config': {
            'lightPreset': 'dusk',
            'showPointOfInterestLabels': false,
            'showRoadLabels': false
          }
        }
      ],
      'sources': {
        'floorplan': {
          'type': 'geojson',
          'data': asset('indoor-3d-map.geojson')
        },
        'flightpath': {
          'type': 'geojson',
          'data': flightPathJsonUri
        },
        '3d-model-source': {
          'type': 'model',
          'models': {
            'plane': {
              'uri': airplaneModelUri,
              'position': [-122.38405485266087, 37.61853120385187],
              'orientation': [0, 0, 0]
            }
          }
        }
      },
      'layers': [
        // Floor plan room extrusion
        {
          'id': 'room-extrusion',
          'type': 'fill-extrusion',
          'source': 'floorplan',
          'paint': {
            'fill-extrusion-color': ['get', 'color'],
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': ['get', 'base_height'],
            'fill-extrusion-opacity': 0.5
          }
        },
        // Flight path line
        {
          'id': 'flight-path-line',
          'slot': 'middle',
          'type': 'line',
          'source': 'flightpath',
          'layout': {
            'line-join': 'round',
            'line-cap': 'round'
          },
          'paint': {
            'line-color': '#007cbf',
            'line-emissive-strength': 1,
            'line-width': 8
          }
        },
        // 3D model layer for airplane
        {
          'id': '3d-model-layer',
          'type': 'model',
          'source': '3d-model-source',
          'slot': 'top',
          'paint': {
            'model-translation': [0, 0, ['feature-state', 'z-elevation']],
            'model-scale': [
              'interpolate',
              ['exponential', 0.5],
              ['zoom'],
              2.0,
              ['literal', [40000.0, 40000.0, 40000.0]],
              14.0,
              ['literal', [1.0, 1.0, 1.0]]
            ],
            'model-type': 'location-indicator',
            'model-emissive-strength': [
              'match',
              ['get', 'part'],
              'lights_position_white',
              ['feature-state', 'light-emission-strobe'],
              'lights_position_white_volume',
              ['feature-state', 'light-emission-strobe'],
              'lights_anti_collision_red',
              ['feature-state', 'light-emission-strobe'],
              'lights_anti_collision_red_volume',
              ['feature-state', 'light-emission-strobe'],
              'lights_position_red',
              ['feature-state', 'light-emission'],
              'lights_position_red_volume',
              ['feature-state', 'light-emission'],
              'lights_position_green',
              ['feature-state', 'light-emission'],
              'lights_position_green_volume',
              ['feature-state', 'light-emission'],
              'lights_taxi_white',
              ['feature-state', 'light-emission-taxi'],
              'lights_taxi_white_volume',
              ['feature-state', 'light-emission-taxi'],
              0.0
            ],
            'model-rotation': [
              'match',
              ['get', 'part'],
              'front_gear',
              ['feature-state', 'front-gear-rotation'],
              'rear_gears',
              ['feature-state', 'rear-gear-rotation'],
              'propeller_left_outer',
              ['feature-state', 'propeller-rotation'],
              'propeller_left_inner',
              ['feature-state', 'propeller-rotation'],
              'propeller_right_outer',
              ['feature-state', 'propeller-rotation'],
              'propeller_right_inner',
              ['feature-state', 'propeller-rotation'],
              'propeller_left_outer_blur',
              ['feature-state', 'propeller-rotation-blur'],
              'propeller_left_inner_blur',
              ['feature-state', 'propeller-rotation-blur'],
              'propeller_right_outer_blur',
              ['feature-state', 'propeller-rotation-blur'],
              'propeller_right_inner_blur',
              ['feature-state', 'propeller-rotation-blur'],
              [0.0, 0.0, 0.0]
            ],
            'model-opacity': [
              'match',
              ['get', 'part'],
              'lights_position_white_volume',
              ['*', ['feature-state', 'light-emission-strobe'], 0.25],
              'lights_anti_collision_red_volume',
              ['*', ['feature-state', 'light-emission-strobe'], 0.45],
              'lights_position_green_volume',
              ['*', ['feature-state', 'light-emission'], 0.25],
              'lights_position_red_volume',
              ['*', ['feature-state', 'light-emission'], 0.25],
              'lights_taxi_white',
              ['*', ['feature-state', 'light-emission-taxi'], 0.25],
              'lights_taxi_white_volume',
              ['*', ['feature-state', 'light-emission-taxi'], 0.25],
              'propeller_blur',
              0.2,
              1.0
            ]
          }
        }
      ]
    };

    // Initialize map with custom style
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      projection: 'globe',
      style: style,
      interaction: true,
      center: [-122.37204647633236, 37.619836883832306], // San Francisco - where flight path is
      zoom: 19,
      bearing: 0,
      pitch: 45,
      antialias: true
    });

    // Initialize airplane (will be used after route loads)
    const airplane = new Airplane();
    let flightRoute = null;

    // Function to update model source and feature state
    function updateModelSourceAndFeatureState(map, airplane) {
      const modelSource = map.getSource('3d-model-source');
      if (modelSource) {
        const modelsSpec = {
          'plane': {
            'uri': airplaneModelUri,
            'position': airplane.position,
            'orientation': [
              airplane.roll,
              airplane.pitch,
              airplane.bearing + 90
            ],
            'materialOverrideNames': [
              'propeller_blur',
              'lights_position_white',
              'lights_position_white_volume',
              'lights_position_red',
              'lights_position_red_volume',
              'lights_position_green',
              'lights_position_green_volume',
              'lights_anti_collision_red',
              'lights_anti_collision_red_volume',
              'lights_taxi_white',
              'lights_taxi_white_volume'
            ],
            'nodeOverrideNames': [
              'front_gear',
              'rear_gears',
              'propeller_left_inner',
              'propeller_left_outer',
              'propeller_right_inner',
              'propeller_right_outer',
              'propeller_left_inner_blur',
              'propeller_left_outer_blur',
              'propeller_right_inner_blur',
              'propeller_right_outer_blur'
            ]
          }
        };
        modelSource.setModels(modelsSpec);
      }

      const planeFeatureState = {
        'z-elevation': airplane.altitude,
        'front-gear-rotation': [0, 0, airplane.frontGearRotation],
        'rear-gear-rotation': [0, 0, airplane.rearGearRotation],
        'propeller-rotation': [
          0,
          0,
          -(airplane.animTimeS % 0.5) * 2.0 * 360.0
        ],
        'propeller-rotation-blur': [
          0,
          0,
          (airplane.animTimeS % 0.1) * 10.0 * 360.0
        ],
        'light-emission': airplane.lightPhase,
        'light-emission-strobe': airplane.lightPhaseStrobe,
        'light-emission-taxi': airplane.lightTaxiPhase
      };
      map.setFeatureState(
        { source: '3d-model-source', sourceLayer: '', id: 'plane' },
        planeFeatureState
      );
    }

    mapRef.current.on('load', () => {
      setMapLoaded(true);
      
      // Initialize flight route (async)
      flightRoute = new FlightRoute(asset('flightpath.json'));
      
      // Wait a bit for route to load, then start animation
      setTimeout(() => {
        // Animation constants
        const animationDuration = 50000; // Airplane animation duration (50 seconds)
        const floorPlanDuration = 10000; // Floor plan display duration (10 seconds)
        const flightTravelAltitudeMin = 200;
        const flightTravelAltitudeMax = 3000;

        let phase = 0;
        let lastFrameTime;
        let routeElevation = 0;
        let floorPlanRotation = 0;

        function frame(time) {
          if (!lastFrameTime) lastFrameTime = time;

          const frameDeltaTime = time - lastFrameTime;
          lastFrameTime = time;

          // Check current animation mode
          if (animationModeRef.current === 'airplane') {
            // Airplane animation mode
            const animFade = clamp(
              (routeElevation - flightTravelAltitudeMin) /
                (flightTravelAltitudeMax - flightTravelAltitudeMin)
            );

            const timelapseFactor = mix(0.001, 10.0, animFade * animFade);
            phase += (frameDeltaTime * timelapseFactor) / animationDuration;

            if (phase > 1) {
              // Airplane animation complete, switch to floor plan
              phase = 0;
              routeElevation = 0;
              animationModeRef.current = 'floorplan';
              floorPlanStartTimeRef.current = time;
              
              // Fly camera to floor plan view (Chicago)
              mapRef.current.flyTo({
                center: [-87.61694, 41.86625], // Chicago - floor plan location
                zoom: 15.99,
                pitch: 40,
                bearing: 0,
                duration: 2000
              });
            } else {
              // Continue airplane animation
              if (flightRoute && flightRoute.totalLength > 0) {
                const alongRoute = flightRoute.sample(flightRoute.totalLength * phase);
                if (alongRoute) {
                  routeElevation = alongRoute.altitude;
                  airplane.update(alongRoute, frameDeltaTime);
                }
              }

              updateModelSourceAndFeatureState(mapRef.current, airplane);

              // Update camera to follow airplane
              const camera = mapRef.current.getFreeCameraOptions();
              const cameraOffset = [
                mix(-0.0014, 0.0, routeElevation / 200.0),
                mix(0.0014, 0, routeElevation / 200.0)
              ];

              camera.position = mapboxgl.MercatorCoordinate.fromLngLat(
                {
                  lng: airplane.position[0] + cameraOffset[0],
                  lat: airplane.position[1] + cameraOffset[1]
                },
                airplane.altitude + 50.0 + mix(0, 10000000.0, animFade)
              );

              camera.lookAtPoint(
                {
                  lng: airplane.position[0],
                  lat: airplane.position[1]
                },
                [0, 0, 1],
                airplane.altitude
              );
              mapRef.current.setFreeCameraOptions(camera);
            }
          } else {
            // Floor plan mode
            if (!floorPlanStartTimeRef.current) {
              floorPlanStartTimeRef.current = time;
            }

            const floorPlanElapsed = time - floorPlanStartTimeRef.current;
            
            // Slow rotation of floor plan view
            floorPlanRotation += frameDeltaTime * 0.0001;
            mapRef.current.rotateTo(floorPlanRotation * 10, { duration: 0 });

            // After floor plan duration, switch back to airplane
            if (floorPlanElapsed > floorPlanDuration) {
              animationModeRef.current = 'airplane';
              floorPlanStartTimeRef.current = null;
              phase = 0;
              routeElevation = 0;
              floorPlanRotation = 0;
              
              // Reset airplane position
              airplane.position = [0, 0];
              airplane.altitude = 0;
              airplane.bearing = 0;
              airplane.pitch = 0;
              
              // Fly camera back to airplane start position (San Francisco)
              mapRef.current.flyTo({
                center: [-122.37204647633236, 37.619836883832306],
                zoom: 19,
                pitch: 45,
                bearing: 0,
                duration: 2000
              });
            }
          }

          animationFrameRef.current = window.requestAnimationFrame(frame);
        }

        // Start animation
        animationFrameRef.current = window.requestAnimationFrame(frame);
      }, 1000); // Wait 1 second for route data to load
    });

    mapRef.current.on('error', (e) => {
      console.error('Mapbox error:', e);
      setMapLoaded(false);
    });

    // Add navigation controls
    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Cleanup function
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <MapContainer>
      <div 
        ref={mapContainerRef} 
        style={{ 
          width: '100%', 
          height: '100%', 
          minHeight: '400px',
          minWidth: '400px',
          borderRadius: '12px',
          position: 'relative',
          zIndex: 1
        }} 
      />
      {!mapLoaded && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#1d4290',
          fontSize: '14px',
          zIndex: 1000,
          pointerEvents: 'none'
        }}>
          Loading 3D Map...
        </div>
      )}
    </MapContainer>
  );
};

export default Map3D;

