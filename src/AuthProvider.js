import React, { useEffect, useState, createContext, useContext } from 'react';
import { firebase } from '../config'; // Adjust path as needed
import { useNavigation } from '@react-navigation/native';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        // Navigate to the appropriate dashboard based on the user role
        const checkUserRole = async () => {
          const userDoc = await firebase.firestore().collection('Users').doc(user.uid).get();
          const doctorDoc = await firebase.firestore().collection('Doctors').doc(user.uid).get();
          if (userDoc.exists) {
            navigation.navigate('PatientDashboard');
          } else if (doctorDoc.exists) {
            navigation.navigate('DoctorDashboard');
          }
        };
        checkUserRole();
      } else {
        navigation.navigate('Login');
      }
    });

    return () => unsubscribe();
  }, [navigation]);

  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
