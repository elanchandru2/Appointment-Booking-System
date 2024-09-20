import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert, Image } from 'react-native';
import { firebase } from '../config';
import RNPickerSelect from 'react-native-picker-select';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native'; // Import useNavigation

const Registration = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [userType, setUserType] = useState('patient');
  const [imageUri, setImageUri] = useState(null);

  const navigation = useNavigation(); // Get navigation object

  const registerUser = async () => {
    try {
      const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
  
      await user.sendEmailVerification({
        handleCodeInApp: true,
        url: 'https://booking-c6c69.firebaseapp.com/' // Adjust the URL as needed
      });
  
      const collection = userType === 'doctor' ? 'Doctors' : 'Users';
  
      const userData = { firstName, lastName, email, userType };
  
      if (imageUri) {
        try {
          const response = await fetch(imageUri);
          const blob = await response.blob();
          const storageRef = firebase.storage().refFromURL('gs://booking-c6c69.appspot.com');
          const ref = storageRef.child(`profilePhotos/${user.uid}`);
          await ref.put(blob);
  
          const downloadURL = await ref.getDownloadURL();
          userData.profilePhoto = downloadURL;
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          Alert.alert('Image Upload Failed', 'There was an issue uploading your profile photo.');
        }
      }
  
      await firebase.firestore().collection(collection).doc(user.uid).set(userData);
  
      Alert.alert('Registration Successful', 'Please check your email for verification');
  
      // Reset the form
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
      setUserType('patient');
      setImageUri(null);

      // Navigate to Login after successful registration
      navigation.navigate('Login');
  
    } catch (error) {
      console.error('Registration Failed:', error);
      Alert.alert('Registration Failed', error.message);
    }
  };
  
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'You need to grant permission to access the media library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      Alert.alert('Image Picked', 'You have selected an image for your profile.');
    } else {
      console.warn('Image picking was canceled.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registration</Text>
      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.image} />
      )}
      <TouchableOpacity onPress={pickImage} style={styles.imageButton}>
        <Text style={styles.imageButtonText}>Pick Profile Photo</Text>
      </TouchableOpacity>
      <TextInput
        style={styles.input}
        placeholder="First Name"
        value={firstName}
        onChangeText={text => setFirstName(text)}
        placeholderTextColor="#888"
      />
      <TextInput
        style={styles.input}
        placeholder="Last Name"
        value={lastName}
        onChangeText={text => setLastName(text)}
        placeholderTextColor="#888"
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={text => setEmail(text)}
        placeholderTextColor="#888"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={text => setPassword(text)}
        secureTextEntry
        placeholderTextColor="#888"
      />
      <RNPickerSelect
        onValueChange={(value) => setUserType(value)}
        items={[
          { label: 'Patient', value: 'patient' },
          { label: 'Doctor', value: 'doctor' }
        ]}
        style={pickerSelectStyles}
        value={userType}
        placeholder={{ label: 'Select user type...', value: null }}
      />
      <TouchableOpacity
        style={styles.button}
        onPress={registerUser}
      >
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f7f9fc'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0056a0',
    marginBottom: 30
  },
  input: {
    width: '100%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: '#fff',
    color: '#333',
    fontSize: 16
  },
  button: {
    backgroundColor: '#0056a0',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20
  },
  imageButton: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 20
  },
  imageButtonText: {
    color: '#333',
    fontSize: 16
  }
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    width: '100%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: '#fff',
    color: '#333',
    fontSize: 16
  },
  inputAndroid: {
    width: '100%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: '#fff',
    color: '#333',
    fontSize: 16
  },
  placeholder: {
    color: '#888'
  }
});

export default Registration;
