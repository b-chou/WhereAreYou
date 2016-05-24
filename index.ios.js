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
var username, password, groupNameTemp, destinationTemp, groupViewData, groupList; 
username = 'default';

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
      groupSelected: false,
      groupCreateScreen: false,
      groupViewScreen: false,
      myGroupsScreen: false
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

// google map functions
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

  // flag functions
  viewMyGroupsFlag() {
    groupViewData = [];
    fetch('https://api.mlab.com/api/1/databases/meetup/collections/Groups?apiKey=' + mongDB_API_KEY)
      .then((response) => response.json())
        .then((responseData) => {
          responseData.forEach((group) => {
            var groupObj = {
              groupName: group.groupName,
              destination: group.destination,
              groupMembers: group.groupMembers
            };
              groupViewData.push(groupObj);
          });
      })
        .then(() => this.setState({
          myGroupsScreen: true
        }));
  }

  createGroupFlag() {
    this.setState({
      groupCreateScreen: true
    });
  }

  viewGroupsFlag() {
    groupViewData = [];
    fetch('https://api.mlab.com/api/1/databases/meetup/collections/Groups?apiKey=' + mongDB_API_KEY)
      .then((response) => response.json())
        .then((responseData) => {
          responseData.forEach((group) => {
            var groupObj = {
              groupName: group.groupName,
              destination: group.destination,
              groupMembers: group.groupMembers
            };
              groupViewData.push(groupObj);
          });
      })
        .then(() => this.setState({
          groupViewScreen: true
        }));
  }

  // driver functions
  createGroup() {
    var groupObj = {
      groupName: groupNameTemp,
      creator: username,
      destination: destinationTemp,
      groupMembers: [username]
    }
    fetch('https://api.mlab.com/api/1/databases/meetup/collections/Groups?apiKey=' + mongDB_API_KEY,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(groupObj)
      }).then(() => console.warn('Group Created'));
    this.setState({
      groupCreateScreen: false
    });
  }

  joinGroup(x) {
    // get all the groups
    fetch('https://api.mlab.com/api/1/databases/meetup/collections/Groups?apiKey=' + mongDB_API_KEY)
        .then((response) => response.json())
          .then((responseData) => {
              var id = responseData[x]._id.$oid;
              // get the id of the individual group we want to join
              fetch('https://api.mlab.com/api/1/databases/meetup/collections/Groups/' + id + '?apiKey=' + mongDB_API_KEY)
              .then((response) => response.json())
              .then((responseData) => {
                var tempStorage = responseData.groupMembers;
                tempStorage.push(username);
                var obj = {
                  groupName: responseData.groupName,
                  creator: responseData.creator,
                  destination: responseData.destination,
                  groupMembers: tempStorage
                };
                // add self to database as a group member
                fetch('https://api.mlab.com/api/1/databases/meetup/collections/Groups?apiKey=' + mongDB_API_KEY,
                {
                  method: 'POST',
                  headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(obj)
                });
                // delete old version of group
                fetch('https://api.mlab.com/api/1/databases/meetup/collections/Groups/' + id + '?apiKey=' + mongDB_API_KEY,
                {
                  method: 'DELETE'
                }
                );
              });
          })
          .then(() => {
            console.warn('Joined new group.');
            this.setState({
              groupViewScreen: false
            });
        });
  }

  signIn() {
    var app = this;
    var accObj = {
      username: username,
      password: password
    };
    var accFound = false;
    fetch('https://api.mlab.com/api/1/databases/meetup/collections/Accounts?apiKey='+ mongDB_API_KEY,)
    .then((response) => response.json())
    .then((responseData) => {
      for (var i = 0; i < responseData.length; i++) {
        if (accObj.username === responseData[i].username && accObj.password === responseData[i].password) {
          accFound = true;
          app.setState({
            signedIn: true
          });
          console.warn('Account Found.')
          break;
        }
      }
     })
    .then(() => {
      if (!accFound) {
        fetch('https://api.mlab.com/api/1/databases/meetup/collections/Accounts?apiKey=' + mongDB_API_KEY,
        {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(accObj)
        })
        .then((response) => app.setState({
          signedIn: true
        }))
        .then(() => console.warn('Account not found. Creating new Account.'));            
        }
    })
    .catch((e) => console.error(e));
  }


// WORK here next!!!!!!
  viewGroup(){

  }

  // render functions
  renderGroupsView() {
    groupList = [];
    for (var i = 0; i < groupViewData.length; i++) {
      var t = groupViewData[i].groupName + '\n Destination: ' + groupViewData[i].destination + '\n';
      groupList.push([t,i]);
    }
    return (
    <View style = {styles.title}>
          {groupList.map( (r) => {
            return <TouchableHighlight style={styles.buttonBox} onPress={() => this.joinGroup(r[1])}> 
            <Text style= {{marginTop: 10, marginLeft: 10, marginRight: 10}}>{r[0]} </Text>
            </TouchableHighlight>
          })}
    </View>
    );
  }

  renderMyGroupScreen() {
    groupList = [];
    for (var i = 0; i < groupViewData.length; i++) {
      if (groupViewData[i].groupMembers.indexOf(username) !== -1){
        var t = groupViewData[i].groupName + '\n Destination: ' + groupViewData[i].destination + '\n';
        groupList.push([t,i]);
      }

    }
    return (
    <View style = {styles.title}>
      <Text>Your Groups</Text>
          {groupList.map( (r) => {
            return <TouchableHighlight style={styles.buttonBox} onPress={() => this.viewGroup(r[1])}> 
            <Text style= {{marginTop: 10, marginLeft: 10, marginRight: 10}}>{r[0]} </Text>
            </TouchableHighlight>
          })}
    </View>
    );
  }

  renderGroupCreateScreen() {
    return(
      <View>
        <TextInput ref="groupName" onChangeText={(name) => groupNameTemp = name} style={[styles.searchInput, styles.Username]} placeholder='Group Name'/>
        <TextInput ref="groupDestination" onChangeText={(name) => destinationTemp = name} style={[styles.searchInput, styles.Username, {marginTop: 20}]} placeholder='Destination'/>
        <TouchableHighlight onPress={this.createGroup.bind(this)}> 
        <Image style={[styles.button, {marginLeft: 85, width: 200, marginTop: 20}]} source={{uri: 'http://dabuttonfactory.com/button.png?t=Create+Group&f=Calibri-Bold&ts=24&tc=fff&tshs=1&tshc=000&w=212&h=50&c=15&bgt=gradient&bgc=3d85c6&ebgc=073763&bs=1&bc=569&shs=1&shc=444&sho=s'}}/>
        </TouchableHighlight>
      </View>
    );
  }

  renderGroupSelect() {
    return(
      <View>
        <TouchableHighlight onPress={this.createGroupFlag.bind(this)}> 
        <Image style={[styles.button, {marginLeft:40, width: 300, marginTop: 100}]} source={{uri: 'http://dabuttonfactory.com/button.png?t=Create+a+Group&f=Calibri-Bold&ts=24&tc=fff&tshs=1&tshc=000&hp=31&vp=17&c=8&bgt=gradient&bgc=3d85c6&ebgc=073763&bs=1&bc=569&shs=1&shc=444&sho=s'}}/>
        </TouchableHighlight>
        <TouchableHighlight onPress={this.viewGroupsFlag.bind(this)}> 
        <Image style={[styles.button, {marginLeft: 40, width: 300, marginTop: 100}]} source={{uri: 'http://dabuttonfactory.com/button.png?t=Search+for+a+Group&f=Calibri-Bold&ts=24&tc=fff&tshs=1&tshc=000&hp=31&vp=17&c=8&bgt=gradient&bgc=3d85c6&ebgc=073763&bs=1&bc=569&shs=1&shc=444&sho=s'}}/>
        </TouchableHighlight>
        <TouchableHighlight onPress={this.viewMyGroupsFlag.bind(this)}> 
        <Image style={[styles.button, {marginLeft: 40, width: 300, marginTop: 100}]} source={{uri: 'http://dabuttonfactory.com/button.png?t=View+My+Groups&f=Calibri-Bold&ts=24&tc=fff&tshs=1&tshc=000&hp=31&vp=17&c=8&bgt=gradient&bgc=3d85c6&ebgc=073763&bs=1&bc=569&shs=1&shc=444&sho=s'}}/>
        </TouchableHighlight>
      </View>
    );
  }

  renderSignInView() {
    return (
      <View>
        <Text style={[styles.signIn, styles.title]}>
        User Sign In
        </Text>
        <TextInput ref="username" onChangeText={(name) => username = name} style={[styles.searchInput, styles.Username]} placeholder='Username'/>
        <TextInput ref="password" onChangeText={(pass) => password = pass}style={[styles.searchInput, styles.Password]} placeholder='Password'/>
        <TouchableHighlight onPress={this.signIn.bind(this)}>
        <Image style={[styles.button]} source={{uri: 'http://static1.squarespace.com/static/520b9d90e4b0db6a8088f152/t/5229f6e1e4b0fdd7a4e49392/1378481894683/Sign+In+Button.png'}}/>
        </TouchableHighlight>
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

  render() {
    if (!this.state.loaded) {
      return this.renderLoadingView();
    }

    if (!this.state.signedIn) {
      return this.renderSignInView();
    }

    if (this.state.groupViewScreen) {
      return this.renderGroupsView();
    }

    if (this.state.groupCreateScreen) {
      return this.renderGroupCreateScreen();
    }

    if (this.state.myGroupsScreen) {
      return this.renderMyGroupScreen();
    }

    if (!this.state.groupSelected) {
      return this.renderGroupSelect();
    }

    if (etaSelected) {
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
    height: 70,
    marginLeft: 90,
    marginTop: 30,
  },
  Password: {
    marginTop: 20,
  },
  buttonBox: {
    marginTop: 10,
    marginBottom: 20,
    height: 60,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderBottomColor: 'black',
  }
});
AppRegistry.registerComponent('AwesomeProject', () => AwesomeProject);
