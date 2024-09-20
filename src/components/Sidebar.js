// src/components/Sidebar.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { firebase } from '../../config'; // Ensure the correct path to your firebase config

const Sidebar = () => {
  const navigation = useNavigation();

  const handleSignOut = async () => {
    try {
      await firebase.auth().signOut();
      // Navigate to Login or a specific screen after sign out
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }], // Reset navigation stack and navigate to Login screen
      });
    } catch (error) {
      Alert.alert('Sign Out Error', 'An error occurred while signing out. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>MediSched</Text>
      </View>
      <View style={styles.footer}>
        <TouchableOpacity onPress={handleSignOut} style={styles.link}>
          <Text style={styles.linkText}>Sign Out</Text>
        </TouchableOpacity>
        {/* You can add more buttons or links here if needed */}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f0f4f8',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  header: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  footer: {
    justifyContent: 'flex-end',
  },
  title: {
    marginTop: 30,
    fontSize: 24,
    fontWeight: 'bold',
  },
  link: {
    marginBottom: 15,
  },
  linkText: {
    fontSize: 18,
    color: '#008080',
  },
});

export default Sidebar;
