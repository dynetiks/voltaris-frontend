// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { APIProvider, AdvancedMarker, ColorScheme, Map, useMap } from '@vis.gl/react-google-maps';
import config from '@lib/utils/config';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getGoogleMapsApiKey,
  setGoogleMapsApiKey,
} from '@lib/utils/store/maps.slice';
import { getGoogleMapsApiKeyAction } from '@lib/server/actions/map/getGoogleMapsApiKeyAction';
import type { LocationDto } from '@citrineos/base';
import { ClusteredLocationMarkers } from '@lib/client/components/map/map.clusters';
import { Skeleton } from '@lib/client/components/ui/skeleton';
import { useTheme } from 'next-themes';

const defaultCenter = {
  lat: config.defaultMapCenterLatitude!,
  lng: config.defaultMapCenterLongitude!,
};

const getLocationLatLng = (
  location: LocationDto,
): google.maps.LatLngLiteral | null => {
  const coords = location.coordinates?.coordinates;
  if (!coords || coords.length < 2) return null;
  return { lat: coords[1]!, lng: coords[0]! };
};

const getStationPoints = (
  locations: LocationDto[],
): google.maps.LatLngLiteral[] =>
  locations
    .map(getLocationLatLng)
    .filter((point): point is google.maps.LatLngLiteral => point !== null);

/** Centers the map on the user's current location; falls back to station bounds. */
const MapViewportController = ({
  locations,
  userPosition,
}: {
  locations: LocationDto[];
  userPosition: google.maps.LatLngLiteral | null;
}) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    if (userPosition) {
      map.setCenter(userPosition);
      map.setZoom(13);
      return;
    }

    const stationPoints = getStationPoints(locations);

    if (stationPoints.length === 1) {
      map.setCenter(stationPoints[0]);
      map.setZoom(12);
      return;
    }

    if (stationPoints.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      stationPoints.forEach((point) => bounds.extend(point));
      map.fitBounds(bounds, { top: 48, right: 48, bottom: 48, left: 48 });
      return;
    }

    map.setCenter(defaultCenter);
    map.setZoom(4);
  }, [map, locations, userPosition]);

  return null;
};

const MapUserLocationMarker = ({
  position,
}: {
  position: google.maps.LatLngLiteral | null;
}) => {
  if (!position) return null;

  return (
    <AdvancedMarker position={position} title="Your location">
      <div className="relative flex size-4 items-center justify-center">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-blue-400 opacity-60" />
        <span className="relative inline-flex size-3 rounded-full border-2 border-white bg-blue-600 shadow-md" />
      </div>
    </AdvancedMarker>
  );
};

export const LocationMapV2 = ({ locations }: { locations: LocationDto[] }) => {
  const dispatch = useDispatch();
  const apiKey = useSelector(getGoogleMapsApiKey);
  const [userPosition, setUserPosition] =
    React.useState<google.maps.LatLngLiteral | null>(null);

  const { theme } = useTheme();

  useEffect(() => {
    if (apiKey === undefined) {
      getGoogleMapsApiKeyAction().then((result) =>
        dispatch(setGoogleMapsApiKey(result.success ? result.data : '')),
      );
    }
  }, [apiKey, dispatch]);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserPosition({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        setUserPosition(null);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  return apiKey === undefined ? (
    <Skeleton className="size=full" />
  ) : (
    <div className="size-full">
      <APIProvider apiKey={apiKey ?? ''}>
        <Map
          mapId={config.googleMapsOverviewMapId}
          defaultZoom={4}
          defaultCenter={defaultCenter}
          gestureHandling="cooperative"
          disableDefaultUI
          zoomControl
          colorScheme={theme === 'dark' ? ColorScheme.DARK : ColorScheme.LIGHT}
        >
          <MapViewportController
            locations={locations}
            userPosition={userPosition}
          />
          <MapUserLocationMarker position={userPosition} />
          <ClusteredLocationMarkers
            locations={locations.filter((location) => location.coordinates)}
          />
        </Map>
      </APIProvider>
    </div>
  );
};
