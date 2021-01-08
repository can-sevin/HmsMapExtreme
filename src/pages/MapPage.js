import React, {Component, useState, useEffect} from 'react';
import {ActivityIndicator, SafeAreaView, View, Text} from 'react-native';
import RNHMSSite from '@hmscore/react-native-hms-site';
import HMSLocation from '@hmscore/react-native-hms-location';
import MapView, {
  Marker,
  InfoWindow,
  TileOverlay,
  Polyline,
  PatternItemTypes,
  JointTypes,
  CapTypes,
} from '@hmscore/react-native-hms-map';
import {SearchBar, ListItem} from 'react-native-elements';
import markerImg from '../markerImg';

let mapView, nearbySearchReq;

const config = {
  apiKey:
    'CgB6e3x9edr9aDKC2hvAgHFWVKbcObkcj/nVGD/sjfcb4ZKV36LHmc5wS+WQqd782FtGwH+Cs2+GQsvSQTJONHPh',
};

const GetPermssions = () => {
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [position, setPosition] = useState();
  const [site, setSite] = useState([]);
  const [search, setSearch] = useState(null);
  const [searchList, setSearchList] = useState([]);
  const [points, setPoints] = useState([]);
  let mPolylines = [];
  let mPoints = [];
  let updateSearch;

  updateSearch = (Getsearch) => {
    setSearch(Getsearch);
    RNHMSSite.querySuggestion(nearbySearchReq)
      .then((res) => {
        setSearchList(res);
        setSite(res.sites);
        mapView.setCameraPosition({
          target: {
            latitude: res.sites[0].location.lat,
            longitude: res.sites[0].location.lng,
          },
          zoom: 17,
        });
      })
      .catch((err) => {
        console.log(JSON.stringify(err) + 'Suggestion Error');
      });
  };

  let directionsApi = (mLat, mLon) => {
    let requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        key:
          'CgB6e3x9edr9aDKC2hvAgHFWVKbcObkcj/nVGD/sjfcb4ZKV36LHmc5wS+WQqd782FtGwH+Cs2+GQsvSQTJONHPh',
      },
      body: JSON.stringify({
        origin: {
          lng: position.longitude,
          lat: position.latitude,
        },
        destination: {
          lng: mLon,
          lat: mLat,
        },
      }),
    };

    fetch(
      'https://mapapi.cloud.huawei.com/mapApi/v1/routeService/walking?key=',
      requestOptions,
    )
      .then((response) => response.json())
      .then((data) => {
        console.log('data steps', data.routes[0].paths[0].steps);
        let steep = data.routes[0].paths[0].steps;
        steep.map((steps) => {
          mPolylines.push(steps.polyline);
        });
        console.log('mPolylines', mPolylines);
        if (mPolylines != null) {
          mPolylines.map((point) => {
            point.map((arr) => {
              mPoints.push({latitude: arr.lat, longitude: arr.lng});
            });
          });
          if (mPoints != null) {
            setPoints(mPoints);
            console.log('mPoints', mPoints);
          }
        }
      });
  };

  useEffect(() => {
    HMSLocation.FusedLocation.Native.hasPermission()
      .then((result) => setHasLocationPermission(result))
      .catch(HMSLocation.FusedLocation.Native.requestPermission());
  }, []);

  if (hasLocationPermission) {
    HMSLocation.FusedLocation.Native.getLastLocation()
      .then((pos) => (position ? null : setPosition(pos)))
      .catch((err) => console.log('Failed to get last location', err));
    position
      ? RNHMSSite.initializeService(config)
          .then(() => {
            nearbySearchReq = {
              query: search,
              location: {
                lat: position.latitude,
                lng: position.longitude,
              },
              radius: 5000,
              poiType: RNHMSSite.LocationType.SUBWAY_STATION,
              countryCode: 'TR',
              language: 'tr',
              pageIndex: 1,
              pageSize: 20,
              politicalView: 'tr',
            };
            site.length === 0
              ? RNHMSSite.nearbySearch(nearbySearchReq)
                  .then((res) => {
                    setSite(res.sites);
                    console.log(JSON.stringify(res));
                    mapView.setCameraPosition({
                      target: {
                        latitude: site[0].location.lat,
                        longitude: site[0].location.lng,
                      },
                      zoom: 17,
                    });
                  })
                  .catch((err) => {
                    console.log(JSON.stringify(err));
                  })
              : null;
          })
          .catch((err) => {
            console.log('Error : ' + err);
          })
      : null;
  } else {
    HMSLocation.FusedLocation.Native.requestPermission();
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
      }}>
      <SearchBar
        placeholder="Type Here..."
        platform="default"
        onChangeText={updateSearch}
        value={search}
        searchIcon={false}
        lightTheme={true}
      />
      {search
        ? Object.keys(searchList).map(function (l, i) {
            return (
              <ListItem key={i} bottomDivider>
                <ListItem.Content>
                  <ListItem.Title>{searchList.sites[i].name}</ListItem.Title>
                  <ListItem.Subtitle>
                    {searchList.sites[i].formatAddress}
                  </ListItem.Subtitle>
                </ListItem.Content>
              </ListItem>
            );
          })
        : null}

      {position ? (
        <MapView
          camera={{
            target: {
              latitude: position.latitude,
              longitude: position.longitude,
            },
            zoom: 15,
          }}
          ref={(e) => (mapView = e)}
          myLocationEnabled={true}
          markerClustering={true}
          myLocationButtonEnabled={true}
          rotateGesturesEnabled={true}
          scrollGesturesEnabled={true}
          tiltGesturesEnabled={true}
          zoomGesturesEnabled={true}>
          {site != null
            ? Object.keys(site).map(function (key, i) {
                return (
                  <Marker
                    visible={true}
                    coordinate={{
                      latitude: site[i].location.lat,
                      longitude: site[i].location.lng,
                    }}
                    icon={{
                      asset: markerImg[site[i].address.subAdminArea],
                    }}
                    key={i}
                    zIndex={1}
                    onClick={() =>
                      directionsApi(site[i].location.lat, site[i].location.lng)
                    }
                    clusterable>
                    <InfoWindow
                      style={{
                        alignContent: 'center',
                        justifyContent: 'center',
                        borderRadius: 8,
                      }}>
                      <View style={style.markerSelectedHms}>
                        <Text
                          style={style.titleSelected}>{`${site[i].name}`}</Text>
                      </View>
                    </InfoWindow>
                  </Marker>
                );
              })
            : null}
          {points != null ? (
            <Polyline
              points={points}
              clickable={false}
              geodesic={true}
              color={-36351}
              jointType={JointTypes.BEVEL}
              pattern={[{type: PatternItemTypes.DASH, length: 20}]}
              startCap={{
                type: CapTypes.ROUND,
              }}
              endCap={{
                type: CapTypes.ROUND,
              }}
              visible={true}
              width={6.0}
              zIndex={2}
            />
          ) : null}
        </MapView>
      ) : (
        <ActivityIndicator size="large" color="#0000ff" />
      )}
    </SafeAreaView>
  );
};

export default class MapPage extends Component {
  state = {
    search: '',
  };

  updateSearch = () => {
    /*
    let params = {
      searchIntent: {
        apiKey:
          'CgB6e3x9edr9aDKC2hvAgHFWVKbcObkcj/nVGD/sjfcb4ZKV36LHmc5wS+WQqd782FtGwH+Cs2+GQsvSQTJONHPh',
        hint: 'myhint',
      },
      searchFilter: {
        query: 'Leeds',
        language: 'en',
      },
    };
    RNHMSSite.createWidget(params)
      .then((res) => {
        console.log(JSON.stringify(res) + 'Search Widget');
      })
      .catch((err) => {
        console.log(JSON.stringify(err) + 'Search Widget');
      }); */
  };

  render() {
    return <GetPermssions />;
  }
}

const style = (base) => ({
  markerSelectedHms: {
    flexDirection: 'row',
    height: 50,
    borderRadius: base.radius.default,
    overflow: 'hidden',
    alignSelf: 'center',
    alignItems: 'center',
    alignContent: 'center',
    justifyContent: 'space-between',
  },
});
