import * as React from 'react';
import { StyleSheet, View, useWindowDimensions, Image, ScrollView, FlatList } from 'react-native';
import { TextInput, Button, Dialog, Portal, Text, ActivityIndicator} from 'react-native-paper';

// image assets expo
import { useAssets } from 'expo-asset';

import { serverIP, loginState } from './state';

/* ----------------- Studio Screen ----------------- */

export function StudioScreen() {
    const [usernameCursors, setUsernameCursors] = React.useState({});
    const [promptBoxText, setPromptBoxText] = React.useState({
      text: "",
      lastChangeWasRemote: false,
    });
    const [remotePromptBoxText, setRemotePromptBoxText] = React.useState("");
    const [aiResponse, setAIResponse] = React.useState("");
    let ws = React.useRef<null | WebSocket>(null);
    const d = useWindowDimensions();
    const [loading, setLoading] = React.useState(false);

    // {"model": "gpt-3.5-turbo", "prompt": "hello!", "room": "1", "uuid": "ff64a208-0a53-40b4-8ead-a0afd5fe4706"}
    const [savedPromptList, setSavedPromptList] = React.useState([{
      model: "gpt-3.5-turbo",
      prompt: "hello!",
      room: "1",
      uuid: "ff64a208-0a53-40b4-8ead-a0afd5fe4706",
    }]);
  
    React.useEffect(() => {
      
    }, [promptBoxText]);
  
    // Websocket ----------------------------------
    React.useEffect(() => {
      ws.current = new WebSocket('ws://' + serverIP + ':3000');
      ws.current.onopen = () => {
        if(!ws.current) return;
        // connection opened
        console.log("Connection pened (Studoio)");
        ws.current.send(JSON.stringify({
          action: "login",
          payload: {
            username: loginState.username,
            password: loginState.password,
            room: loginState.room,
          }
        }));
        ws.current.onmessage = (e) => {
          // a message was received
          //console.log(e.data);
          const msg = JSON.parse(e.data);
          switch(msg.action) {
            case "result": {
              console.log("Result message received")
              switch(msg.payload.forAction) {
                case "ai-complete": {
                  setAIResponse(msg.payload.msg);
                  setLoading(false);
                } break;
                case "get-saved-prompts": {
                  console.log(msg.payload.msg);
                  setSavedPromptList(msg.payload.msg);
                  setLoading(false);
                } break;
                case "save-prompt": {
                  console.log(msg.payload.msg);
                  setTimeout(() => {
                    setLoading(false);
                  }, 500);
                } break;
              } // forAction switch ----------------------------------
            } break; // result payload ----------------------------------
            case "broadcast": {
              //console.log("Broadcast message received")
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
                case "prompt-box": {
                  //if(payload.bpayload.username === loginState.username) return;
                  setPromptBoxText({
                    text: payload.bpayload.text,
                    lastChangeWasRemote: true,
                  });
                  console.log("broad prompt box text changed" + payload.bpayload.username);
                }
              } // baction switch ----------------------------------
            } break; // broadcast payload ----------------------------------
          }
        }
        ws.current.onclose = () => {
          console.log("Connection closed (Upstream Server, Studio)");
        }
        return () => {
          if(!ws.current) return;
          ws.current.close();
          console.log("Closed connection (Studio)")
        }
      };
    }, []);
    return (
      <View style={{
        flex: 1,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center", 
      }}
      onPointerMove={(evt) => {
        try {
          if(!ws.current) return;
          ws.current.send(JSON.stringify({
            action: "broadcast",
            payload: JSON.stringify({
              baction: "pointer-move",
              bpayload: {
                username: loginState.username,
                x: evt.nativeEvent.clientX / d.width-0.25,
                y: evt.nativeEvent.clientY / d.height - 0.1,
              }
            })
          }));
        } catch (e) {
          console.log(e);
        }
      }}>
        <View style={{height: "100%", width: "25%"}}>
          <View style={{...styles.container, width: "100%"}}>
            <Button style={{
              width: "90%",
              margin: 10,
            }} mode="contained" icon="refresh" onPress={() => {
              ws.current?.send(JSON.stringify({
                action: "get-saved-prompts",
                payload: {}
              }));
              setLoading(true);
            }}>
              Refresh Prompt List
            </Button>
            <Text>Prompt List</Text>
            <FlatList 
              data={savedPromptList}
              style={{
                width: "100%",
                height: "100%",
              }}
              renderItem={({item}) => {
                return (
                  <View style={{
                    flexDirection: "row",
                    width: "100%",
                    margin: 10,
                    borderWidth: 1,
                  }}>
                    <Text style={{
                      fontSize: 20,
                      fontWeight: "bold",
                    }}>{item.prompt}</Text>
                    <Button style={{
                      justifyContent: "center",
                      margin: 10,
                      alignContent: "center",
                      height: "50%",
                    }} mode="outlined" onPress={() => {
                      ws.current?.send(JSON.stringify({
                        action: "",
                        payload: {
                          uuid: item.uuid,
                        }
                      }));
                    }} icon={"send"}>
                      Delete
                    </Button>
                  </View>
                );
              }} ></FlatList>
          </View>
        </View>
        <View style={{...styles.container, height: "100%"}}>
          <View style={{
            flexDirection: "row",
            width: "90%",
            height: "15%",
            margin: 20,
            marginLeft: 150
          }}>
            <TextInput style={{
              width: "50%",
              margin: 10,
              }} 
              label="AI Prompt" value={promptBoxText.text}
              onKeyPress={(e) => {
                console.log("HELLO KEYPRESS ", e.nativeEvent);
                ws.current?.send(JSON.stringify({
                  action: "broadcast",
                  payload: JSON.stringify({
                    baction: "prompt-box",
                    bpayload: {
                      username: loginState.username,
                      text: promptBoxText.text,
                      }
                    })
                  }));
              }}
              onChangeText={(t) => {
                  setPromptBoxText({
                    text: t,
                    lastChangeWasRemote: false,
                  }); 
              }}
              //multiline={true}
              autoComplete="off"
            />  
            <View style={{
              flex: 1,
              flexDirection: "column",
              width: "100%",
            }}>
              <Button style={{
                width: "50%",
                height: "50%",
                justifyContent: "center",
                margin: 10,
                alignContent: "center",
              }} mode="contained" onPress={() => {
                ws.current?.send(JSON.stringify({
                  action: "ai-complete",
                  payload: {
                    model: "gpt-3.5-turbo",
                    prompt: promptBoxText.text,
                  }
                }));
                setLoading(true);
              }} icon={"send"}>
                Send
              </Button>

              <Button style={{
                width: "50%",
                height: "50%",
                justifyContent: "center",
                alignContent: "center",
                marginLeft: 10
              }} mode="contained" onPress={() => {
                ws.current?.send(JSON.stringify({
                  action: "save-prompt",
                  payload: {
                    model: "gpt-3.5-turbo",
                    prompt: promptBoxText.text,
                  }
                }));
                setLoading(true);
              }} icon={"floppy"}>
                Save
              </Button>
            </View>
    
          </View>
    
          <ActivityIndicator animating={loading}
          size={"large"}
          pointerEvents="none" 
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: 100,
            }}
          />
    
        <ScrollView style={{
            width: "75%",
            backgroundColor: "lightgrey",
            margin: 10,
            borderRadius: 8,
            padding: 10,
          }}>
            <Text style={{
              fontSize: 20,
              fontWeight: "bold",
            }}>{aiResponse}</Text>
          </ScrollView>
          {Object.values(usernameCursors).map((cursor: any) => {
            return (
              <View key={cursor.username} style={{
                position: "absolute",
                // percentage of screen
                left: cursor.x * d.width,
                top: cursor.y * d.height,
                
              }}>
                <Image source={require('./cursor.png')} style={{
                  width: 20,
                  height: 20,
                }} />
                <Text style={{
                  position: "absolute",
                  top: 20,
                  left: 10,
                  fontSize: 10,
                  fontWeight: "bold",
                  width: 100,
                }}>{cursor.username}</Text>
              </View>
            );
          })}
      
    
        </View>
      </View>
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