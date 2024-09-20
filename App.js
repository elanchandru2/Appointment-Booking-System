import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { firebase } from './config'; // Adjust path as needed

import Login from './src/Login';
import Registration from './src/Registration';
import PatientDashboard from './src/PatientDashboard';
import DoctorDashboard from './src/DoctorDashboard';
import Sidebar from './src/components/Sidebar';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

const DrawerNavigator = () => (
  <Drawer.Navigator
    drawerContent={() => <Sidebar />}
    screenOptions={{
      headerStyle: {
        backgroundColor: 'black',
      },
      headerTintColor: 'white',
    }}
  >
    <Drawer.Screen name="PatientDashboard" component={PatientDashboard} />
    <Drawer.Screen name="DoctorDashboard" component={DoctorDashboard} />
  </Drawer.Navigator>
);

const App = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  // Handle user state changes
  const onAuthStateChanged = (user) => {
    setUser(user);
    if (initializing) {
      setInitializing(false);
    }
  };

  useEffect(() => {
    const subscriber = firebase.auth().onAuthStateChanged(onAuthStateChanged);
    return () => subscriber(); // Clean up subscription on unmount
  }, [initializing]);

  if (initializing) {
    // Optionally, return a loading spinner here
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!user ? (
          <>
            <Stack.Screen
              name="Login"
              component={Login}
              options={{ title: 'Login' }}
            />
            <Stack.Screen
              name="Registration"
              component={Registration}
              options={{ title: 'Register' }}
            />
          </>
        ) : (
          <Stack.Screen
            name="Drawer"
            component={DrawerNavigator}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
