import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { firebase } from '../config'; // Ensure you import your Firebase configuration
import { useNavigation } from '@react-navigation/native';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation(); // To navigate to different screens

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get current user
        const user = firebase.auth().currentUser;

        if (user) {
          // Fetch user data from the appropriate Firestore collection
          const userDoc = await firebase.firestore().collection('Users').doc(user.uid).get();
          const doctorDoc = await firebase.firestore().collection('Doctors').doc(user.uid).get();
          
          if (userDoc.exists) {
            // If the user is a patient, navigate to PatientDashboard
            navigation.replace('PatientDashboard');
          } else if (doctorDoc.exists) {
            // If the user is a doctor, navigate to DoctorDashboard
            navigation.replace('DoctorDashboard');
          } else {
            // Handle the case where the user type is not found
            Alert.alert('Error', 'User type not found.');
          }
        } else {
          // Handle case where user is not logged in
          navigation.replace('Login');
        }
      } catch (error) {
        console.error('Error fetching user data: ', error);
        Alert.alert('Error', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigation]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View>
      <Text>Loading...</Text>
    </View>
  );
};

export default Dashboard;
