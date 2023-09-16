import * as React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { PaperProvider, TextInput, Appbar, Button, Dialog, Portal, Text} from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
let uuid = "";
let loginState = {
  username: "",
  password: "",
  room: "",
}
const serverIP = "10.33.134.188"

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
        <View style={{
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
        </View>


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
                  uuid = msg.payload.msg;
                  ws.close();
                  console.log(uuid)
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
      </View>
  );
}

/* ----------------- Studio Screen ----------------- */

function StudioScreen() {
  // store username cursors in state
  const [usernameCursors, setUsernameCursors] = React.useState({});

  let ws = null;
  React.useEffect(() => {
    ws = new WebSocket('ws://' + serverIP + ':3000');
    ws.onopen = () => {
      // connection opened
      console.log("Connection pened (Studoio)");
      ws.send(JSON.stringify({
        action: "login",
        payload: {
          username: loginState.username,
          password: loginState.password,
          room: loginState.room,
        }
      }));
      ws.onmessage = (e) => {
        // a message was received
        console.log(e.data);
        const msg = JSON.parse(e.data);
        switch(msg.action) {
          case "result": {} break;
          case "broadcast": {
            console.log("Broadcast message received")
            const payload = JSON.parse(msg.payload);
            switch(payload.baction) {
              case "pointer-move": {
                setUsernameCursors(prev => ({...prev, [payload.bpayload.username]: 
                  {
                    x: payload.bpayload.x,
                    y: payload.bpayload.y,
                    username: payload.bpayload.username,
                  }
                }));
              } break;
            } break;
          }
        }

      }
      return () => {
        ws.close();
        console.log("Closed connection (Studio)")
      }
    };
  }, []);
  return (
    <View style={{...styles.container}} onPointerMove={(evt) => {
      try {
        // random number to slow down pointer movement
        //if (Math.random() > 0.5) return;
        ws.send(JSON.stringify({
          action: "broadcast",
          payload: JSON.stringify({
            baction: "pointer-move",
            bpayload: {
              username: loginState.username,
              x: evt.nativeEvent.clientX,
              y: evt.nativeEvent.clientY,
            }
          })
        }));
      } catch (e) {
        console.log(e);
      }
    }}>
      <Text>Details Screen</Text>
      {Object.values(usernameCursors).map((cursor: any) => {
        console.log("item", cursor);
        return (
          <Text key={cursor.username} style={{
            position: "absolute",
            left: cursor.x,
            top: cursor.y,
            fontSize: 20,
            fontWeight: "bold",
          }}>{cursor.username}</Text>
        );
      })}
  

    </View>
  );
}

export default function App() {
  return (
    <PaperProvider>
      <NavigationContainer>
          <Stack.Navigator initialRouteName="Login">
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="StudioScreen" component={StudioScreen} />
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
