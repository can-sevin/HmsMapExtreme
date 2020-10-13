import React, {Component, useState, useEffect} from 'react';
import {ActivityIndicator, View} from 'react-native';
import RNHMSSite from '@hmscore/react-native-hms-site';
import HMSLocation from '@hmscore/react-native-hms-location';
import MapView, {Marker} from '@hmscore/react-native-hms-map';

const config = {
  apiKey:
    'CgB6e3x9edr9aDKC2hvAgHFWVKbcObkcj/nVGD/sjfcb4ZKV36LHmc5wS+WQqd782FtGwH+Cs2+GQsvSQTJONHPh',
};

const GetPermssions = () => {
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [position, setPosition] = useState();
  const [site, setSite] = useState([]);
  useEffect(() => {
    HMSLocation.FusedLocation.Native.hasPermission()
      .then((result) => setHasLocationPermission(result))
      .catch(HMSLocation.FusedLocation.Native.requestPermission());
  }, []);
  if (hasLocationPermission) {
    HMSLocation.FusedLocation.Native.getLastLocation()
      .then((pos) => setPosition(pos))
      .catch((err) => console.log('Failed to get last location', err));
    position
      ? RNHMSSite.initializeService(config)
          .then(() => {
            console.log(
              'Service is initialized successfully' +
                position.longitude +
                position.latitude,
            );
            let nearbySearchReq = {
              location: {
                lat: position.latitude,
                lng: position.longitude,
              },
              radius: 1000,
              poiType: RNHMSSite.LocationType.BUS_STATION,
              countryCode: 'TR',
              language: 'tr',
              pageIndex: 1,
              pageSize: 4,
              politicalView: 'tr',
            };
            RNHMSSite.nearbySearch(nearbySearchReq)
              .then((res) => {
                {
                  setSite(res);
                }
              })
              .catch((err) => {
                console.log(JSON.stringify(err));
              });
          })
          .catch((err) => {
            console.log('Error : ' + err);
          })
      : null;
  } else {
    HMSLocation.FusedLocation.Native.requestPermission();
  }

  return (
    <View>
      {position ? (
        <MapView
          camera={{
            target: {
              latitude: position.latitude,
              longitude: position.longitude,
            },
            zoom: 16,
          }}
          myLocationEnabled={true}
          myLocationButtonEnabled={true}
          rotateGesturesEnabled={true}
          scrollGesturesEnabled={true}
          tiltGesturesEnabled={true}
          zoomGesturesEnabled={true}>
          {site.sites != null
            ? Object.keys(site.sites).map(function (key, i) {
                return (
                  <Marker // Simple example
                    coordinate={{
                      latitude: site.sites[i].location.lat,
                      longitude: site.sites[i].location.lng,
                    }}
                    title={site.sites[i].name}
                  />
                );
              })
            : console.log('Site boş geliyor')}
        </MapView>
      ) : (
        <ActivityIndicator size="large" color="#0000ff" />
      )}
    </View>
  );
};

export default class MapPage extends Component {
  render() {
    return <GetPermssions />;
  }
}
