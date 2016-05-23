import React, {
  Component,
} from 'react';
import {
  AppRegistry,
  Image,
  ListView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const GOOGLEMAP_API_KEY = 'AIzaSyBOT8ZSLWLrh8aV-HJgkR20Lcc_tuTyyx0';
const baseLink = 'https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins='

class AwesomeProject extends Component {
  constructor(props) {
    super(props);
    this.state = {
      etaObj: {},
      meetUpObj: {},
      userObj: {},
      loaded: false,
    };
  }

  componentDidMount() {
    this.getGeoLocation();
    this.setDestination('danville,ca'); //need user input
    this.fetchData();
  }

  componentLoop(){
    this.getGeoLocation();
  }

  getGeoLocation() {
    fetch('http://freegeoip.net/json/')
      .then((response) => response.json())
      .then((responseData) => {
        var finalDestinationStorage = this.state.meetUpObj;
        finalDestinationStorage.currentLocation = responseData.latitude + ',' + responseData.longitude;

        this.setState({
          userObj: {
            ip: responseData.ip,
            latitude: responseData.latitude,
            longitude: responseData.longitude
          },
          meetUpObj: finalDestinationStorage
        });
      })
      .then(() => this.fetchData);
  }

  setDestination(destination, time, day) {
    fetch('https://maps.googleapis.com/maps/api/geocode/json?address=' + destination.replace(' ', '+') + '&key=' + GOOGLEMAP_API_KEY)
    .then((response) => response.json())
    .then((responseData) => {
      var currentLocationStorage = this.state.meetUpObj;
      currentLocationStorage.destination = responseData.results.pop().formatted_address;
      currentLocationStorage.time = time;
      currentLocationStorage.day = day;
      this.setState({
        meetUpObj: currentLocationStorage
      });
    })
    .catch((err) => {
      this.setState({
        meetUpObj: {
          destination: null
        }
      });
    })
  }
//this.state.meetUpObj.currentLocation.replace(' ', '+') + 
//+ this.state.meetUpObj.destination.replace(' ', '+') 
  fetchData() {
    fetch(baseLink + 'Danville,CA&destinations=' + 'Phoenix,AZ' + '&key=' + GOOGLEMAP_API_KEY)
      .then((response) => response.json())
      .then((responseData) => {
        this.setState({
          etaObj: {
            miles: responseData.rows[0].elements[0].distance.text,
            time: responseData.rows[0].elements[0].distance.text,
            destination: responseData.destination_addresses[0]
          },
          loaded: true,
        });
      })
      .done();
  }

  render() {
    if (!this.state.loaded) {
      return this.renderLoadingView();
    }
    
    return (
      <View style={styles.container}>
      <Text style={styles.title}>
          {JSON.stringify(this.state.etaObj)}     
      </Text>
      </View>
    );
  }

  renderLoadingView() {
    return (
      <View style={styles.container}>
        <Text>
          Loading movies...
        </Text>
      </View>
    );
  }

  renderMovie(movie) {
    return (
      <View style={styles.container}>
      <Text>
        {movie}
      </Text>
      </View>
    );
  //   return (
      // <View style={styles.container}>
      //   // <Image
      //   //   source={{uri: movie.posters.thumbnail}}
      //   //   style={styles.thumbnail}
      //   // />
      //   // <View style={styles.rightContainer}>
      //   // <Text style={styles.title}>abc</Text>
      //     // <Text style={styles.year}>{movie.year}</Text>
      //   // </View>
      // </View>
  //   );
  }
}

var styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  rightContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  year: {
    textAlign: 'center',
  },
  thumbnail: {
    width: 53,
    height: 81,
  },
  listView: {
    paddingTop: 20,
    backgroundColor: '#F5FCFF',
  },
});
AppRegistry.registerComponent('AwesomeProject', () => AwesomeProject);
