import React, {
  Component,
} from 'react';
import {
  AppRegistry,
  Image,
  ListView,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableHighlight,
} from 'react-native';


const GOOGLEMAP_API_KEY = 'AIzaSyBOT8ZSLWLrh8aV-HJgkR20Lcc_tuTyyx0';
const mongDB_API_KEY = 'wA1TEG2k7D3gXqsJ8SmM-FHmWiOsjkwU';
const baseLink = 'https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins='
var username = 'abc';
var password = '123';
class AwesomeProject extends Component {
  constructor(props) {
    super(props);

    this.state = {
      userSignName: '',
      userSignPass: '',
      etaObj: {},
      meetUpObj: {},
      userObj: {},
      loaded: false,
      signedIn: false,
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
            time: responseData.rows[0].elements[0].duration.text,
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

    if (!this.state.signedIn) {
      return this.renderSignInView();
    }

    var eta = (this.state.etaObj);
    return (
      <View style={styles.container}>
      <Text style={styles.thumbnail}>
          Destination: {eta.destination}   
      </Text>

      <Text style={styles.thumbnail}>
          {eta.miles} away
      </Text>
      <Text style={styles.thumbnail}>
          {eta.time} away
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
  signIn() {
    var accObj = {
      username: username,
      password: password
    };
    fetch('https://api.mlab.com/api/1/databases/meetup/collections/Accounts?apiKey=' + mongDB_API_KEY,
    {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(accObj)
    })
    .then((response) => response.json())
    .then((responseData) => console.warn(responseData));
  }
  renderSignInView() {
    var TouchableElement = TouchableHighlight;

    return (
      <View>
        <Text style={[styles.signIn, styles.title]}>
        User Sign In
        </Text>
        <TextInput ref="username" onChangeText={(name) => username = name} style={[styles.searchInput, styles.Username]} placeholder='Username'/>
        <TextInput ref="password" onChangeText={(pass) => password = pass}style={[styles.searchInput, styles.Password]} placeholder='Password'/>
        <TouchableHighlight onPress={this.signIn}>
        <Image style={styles.button} source={{uri: 'http://static1.squarespace.com/static/520b9d90e4b0db6a8088f152/t/5229f6e1e4b0fdd7a4e49392/1378481894683/Sign+In+Button.png'}}/>
        </TouchableHighlight>
      </View>
    );
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
    marginTop: 100,
    marginBottom: 8,
    alignItems: 'center',
    textAlign: 'center',
  },
  year: {
    textAlign: 'center',
  },
  thumbnail: {
    width: 110,
    height: 81,
  },
  listView: {
    paddingTop: 20,
    backgroundColor: '#F5FCFF',
  },
  searchInput: {
    marginTop: 100,
    height: 36,
    padding: 4,
    marginRight: 80,
    marginLeft: 80,
    flex: 2,
    fontSize: 18,
    borderWidth: 1,
    borderColor: '#48BBEC',
    borderRadius: 8,
    color: '#48BBEC'
  },
  signIn: {
    marginTop: 300,
  },
  button: {
    width: 200,
    height: 50,
    marginLeft: 90,
    marginTop: 30,
  },
  Password: {
    marginTop: 20,
  }
});
AppRegistry.registerComponent('AwesomeProject', () => AwesomeProject);
