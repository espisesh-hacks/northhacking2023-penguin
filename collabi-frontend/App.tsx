import * as React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, useWindowDimensions, Image } from 'react-native';
import { PaperProvider, TextInput, Appbar, Button, Dialog, Portal, Text, ProgressBar, MD3Colors, ActivityIndicator} from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
// image assets expo
import { useAssets } from 'expo-asset';

import { loginState, serverIP } from './src/state';
import { StudioScreen } from './src/StudioScreen';


const Stack = createNativeStackNavigator();

function LoginScreen({navigation}) {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [room, setRoom] = React.useState('');

  const [text, setText] = React.useState('');

  loginState.username = username;
  loginState.password = password;
  loginState.room = room;

  // Dialog
  const [visible, setVisible] = React.useState(false);
  const showDialog = () => setVisible(true);
  const hideDialog = () => setVisible(false);
  return (
    <View style={styles.container}>
        <Portal>
         <Dialog visible={visible} onDismiss={hideDialog} >
            <Dialog.Title>Error</Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyMedium">{text}</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={hideDialog}>Done</Button>
            </Dialog.Actions>
          </Dialog>
          
        </Portal>
        <Text style={
          {
            fontSize: 30,
            fontWeight: "bold",
            margin: 10,
          }}>
            Collabi AI Studio
          </Text>
        <TextInput style={{
          width: "50%",
          margin: 10,
        }} label="Username" value={username} onChangeText={text => setUsername(text)} />
        <TextInput style={{
          width: "50%",
          margin: 10,
        }} label="Password" value={password} onChangeText={text => setPassword(text)} />
        <TextInput style={{
          width: "50%",
          margin: 10,
        }} label="Room" value={room} onChangeText={text => setRoom(text)} />
        {/*<View style={{
          flexDirection: "row",
          width: "100%",
          justifyContent: "center",
        }}>
          <Button style={{
            width: "25%",
            margin: 10,
          }} mode="contained" onPress={() => {
            setUsername("sesh");
            setPassword("password");
            setRoom("1");
          }}>
            Debug A
          </Button>
          <Button style={{
            width: "25%",
            margin: 10,
          }} mode="contained" onPress={() => {
            setUsername("aron");
            setPassword("password1");
            setRoom("1");
          }}>
            Debug B
          </Button>
        </View>*/}


        <Button style={{
          width: "50%",
          margin: 10,
        }} mode="contained" onPress={() => {
          const ws = new WebSocket('ws://' + serverIP + ':3000');
          ws.onopen = () => {
            // connection opened
            console.log("Connection opened (Login)");
            ws.send(JSON.stringify({
              action: "login",
              payload: {
                username: username,
                password: password,
                room: room,
              }
            }));
            ws.onmessage = (e) => {
              // a message was received
              console.log(e.data);
              const msg = JSON.parse(e.data);
              if (msg.action === "result" && msg.payload.forAction === "login") {
                if (msg.payload.result === true) {
                  console.log("Login success");
                  loginState.uuid = msg.payload.msg;
                  ws.close();
                  console.log(loginState.uuid)
                  console.log("Closed connection (Login)")
                  navigation.navigate('StudioScreen');
                } else {
                  console.log("Login failed");
                  setText(msg.payload.msg);
                  showDialog();
                  ws.close();
                  console.log("Closed connection (Login failed)")
                }
              }
            }
          };
        }}>
          Login
        </Button>
        <Button style={{
          width: "50%",
          margin: 10,
        }} mode="contained" onPress={() => {
        }}>
          Register
        </Button>
      </View>
  );
}

export default function App() {
  return (
    <PaperProvider>
      <NavigationContainer>
          <Stack.Navigator initialRouteName="Login">
            <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Login' }} />
            <Stack.Screen name="StudioScreen" component={StudioScreen} options={{ title: 'Collabi AI Studio' }}  />
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar style="auto" />
    </PaperProvider>
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
