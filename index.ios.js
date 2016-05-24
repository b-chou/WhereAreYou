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

console.disableYellowBox = true;

const GOOGLEMAP_API_KEY = 'AIzaSyBOT8ZSLWLrh8aV-HJgkR20Lcc_tuTyyx0';
const mongDB_API_KEY = 'wA1TEG2k7D3gXqsJ8SmM-FHmWiOsjkwU';
const baseLink = 'https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins='
var username, password, groupNameTemp, destinationTemp, groupViewData, groupList, userGPS; 
username = 'default';
var watchID = (null: ?number);

class AwesomeProject extends Component {

  constructor(props) {
    super(props);
    this.state = {
      userSignName: '',
      userSignPass: '',
      etaObj: {},
      meetUpObj: {},
      userObj: {},
      currentGroup: {},
      groupData: {},
      groupMemberDistanceFinalData: {},
      focalDestination: '',
      loaded: false,
      signedIn: false,
      groupSelected: false,
      groupCreateScreen: false,
      groupViewScreen: false,
      myGroupsScreen: false,
      individualGroupScreen: false,
    };
  }

  componentDidMount() {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        userGPS = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude        
        };
      this.reverseGeoCoding();
      this.setDestination('danville,ca'); //need user input
      this.setState({
        loaded: true
        });
      });
    watchID = navigator.geolocation.watchPosition((position) => {
      userGPS = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude        
        };
    });

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

  fetchData(originLat, originLong, endpoint) {
    console.error(originLat, originLong, endpoint);
    fetch(baseLink + '&origins=' + originLat + ',' + originLong + '&destinations=' + endpoint + '&key=' + GOOGLEMAP_API_KEY)
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

  reverseGeoCoding() {
    fetch('https://maps.googleapis.com/maps/api/geocode/json?latlng=' + userGPS.latitude + ',' + userGPS.longitude + '&key=' + GOOGLEMAP_API_KEY)
    .then((response) => response.json())
    .then((responseData) => {
      userGPS.neighborhood = responseData.results[0].address_components[2].long_name;
      var address = responseData.results[0].address_components[0].short_name + " " + responseData.results[0].address_components[1].short_name + ", " + responseData.results[0].address_components[3].short_name;
      userGPS.address = address;  
    });
  }

  // flag functions
  viewMyGroupsFlag() {
    groupViewData = [];
    fetch('https://api.mlab.com/api/1/databases/meetup/collections/Groups?apiKey=' + mongDB_API_KEY)
      .then((response) => response.json())
        .then((responseData) => {
          responseData.forEach((group) => {
            var groupObj = {
              dbID: group._id.$oid,
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
      password: password,
      latitude: userGPS.latitude,
      longitude: userGPS.longitude
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
          userDB_ID = responseData[i]._id.$oid;
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
        .then((response) => {
          app.setState({
          signedIn: true
        });
          userDB_ID = JSON.parse(response._bodyInit)._id.$oid;
        })
        .then(() => console.warn('Account not found. Creating new Account.'));            
        }
    })
    .catch((e) => console.error(e));
  }

// WORK here next!!!!!!
  viewGroup(groupID, groupDestination){
    this.setState({
      focalDestination: groupDestination
    });
    fetch('https://api.mlab.com/api/1/databases/meetup/collections/Groups/' + groupID + '?apiKey=' + mongDB_API_KEY)
              .then((response) => response.json())
              .then((responseData) => {
                this.setState({
                  currentGroup: responseData
                });
              })
              .then(() => {
                fetch('https://api.mlab.com/api/1/databases/meetup/collections/Accounts?apiKey='+ mongDB_API_KEY,)
                .then((response) => response.json())
                .then((responseData) => {
                  const memberList = this.state.currentGroup.groupMembers;
                  this.state.groupData = [];
                  memberList.forEach((name) => {
                    for (var i = 0; i < responseData.length; i++) {
                      if (responseData[i].username === name) {
                        this.state.groupData.push({
                          username: name,
                          latitude: responseData[i].latitude,
                          longitude: responseData[i].longitude
                        });
                      }
                    }
                  });
                })
                .then(() => {
                  this.setState({
                    groupMemberDistanceFinalData: {}
                  });
                  for (var i = 0; i < this.state.groupData.length; i++) {
                    this.fetchData(this.state.groupData[i].latitude, this.state.groupData[i].longitude, this.state.focalDestination);
                  }
                })
                .then(() => this.setState({
                  individualGroupScreen: true,
                  myGroupsScreen: false
                })
              );
              });
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
            return <TouchableHighlight style={styles.buttonBox} onPress={() => this.joinGroup(r[1]).bind(this)}> 
            <Text style= {{marginTop: 5, marginLeft: 10, marginRight: 10}}>{r[0]} </Text>
            </TouchableHighlight>
          })}
    </View>
    );
  }

  renderMyGroupScreen() {
    groupList = [];
    for (var i = 0; i < groupViewData.length; i++) {
      if (groupViewData[i].groupMembers.indexOf(username) !== -1){
        var t = groupViewData[i].groupName + '\nDestination: ' + groupViewData[i].destination + '\n';
        var dbID = groupViewData[i].dbID;
        groupList.push([t,i, dbID, groupViewData[i].destination]);
      }
    }
    return (
    <View style = {styles.title}>
      <Text>Your Groups</Text>
          {groupList.map( (r) => {
            return <TouchableHighlight style={styles.buttonBox} onPress={() => this.viewGroup(r[2], r[3])}> 
            <Text style= {{marginTop: 10, marginLeft: 10, marginRight: 10}}>{r[0]} </Text>
            </TouchableHighlight>
          })}
    </View>
    );
  }

  renderGroupCreateScreen() {
    return(
      <View>
        <View style={styles.gpsContainer}>
        <Text style={styles.gpsInfo}> ({userGPS.latitude}, {userGPS.longitude})</Text>
        <Text style={styles.gpsInfo}> Neighborhood: {userGPS.neighborhood} </Text>
        <Text style={styles.gpsInfo}> Approx Address: {userGPS.address} </Text>
        </View>
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
        <View style={styles.gpsContainer}>
        <Text style={styles.gpsInfo}> ({userGPS.latitude}, {userGPS.longitude})</Text>
        <Text style={styles.gpsInfo}> Neighborhood: {userGPS.neighborhood} </Text>
        <Text style={styles.gpsInfo}> Approx Address: {userGPS.address} </Text>
        </View>
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
        <View style={styles.gpsContainer}>
        <Text style={styles.gpsInfo}> ({userGPS.latitude}, {userGPS.longitude})</Text>
        <Text style={styles.gpsInfo}> Neighborhood: {userGPS.neighborhood} </Text>
        <Text style={styles.gpsInfo}> Approx Address: {userGPS.address} </Text>
        </View>
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
          Loading Global Position Data
        </Text>
      </View>
    );
  }

  renderIndividualGroupScreen() {
    console.error(this.state.groupData);
    return (
      <View>
        <Text style={styles.title}> {this.state.currentGroup.groupName} </Text>
        <Text style={[styles.title, {marginTop: 30, marginBottom: 100}]}> Destination: {this.state.currentGroup.destination} </Text>
        {this.state.currentGroup.groupMembers.map((member) => {
          return <Text style={{marginLeft: 50, marginBottom: 20, fontSize: 16}}>{member}</Text>
        })}
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

    if (this.state.individualGroupScreen) {
      return this.renderIndividualGroupScreen();
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
  gpsContainer: {
    flex: 1,
    marginTop: 20,
  },
  gpsInfo: {
    flexDirection: 'row',
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
    fontWeight: 'bold',
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
    marginTop: 200,
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
    width: 200,
    marginTop: 10,
    marginBottom: 10,
    height: 50,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderBottomColor: 'black',
  }
});
AppRegistry.registerComponent('AwesomeProject', () => AwesomeProject);
