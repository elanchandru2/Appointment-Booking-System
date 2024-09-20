import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Modal, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { firebase } from '../config';
import LottieView from 'lottie-react-native';

const Login = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isForgotPasswordModalVisible, setIsForgotPasswordModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const validateFields = () => {
    if (!email || !password) {
      Alert.alert('Missing Information', 'Please fill out both email and password.');
      return false;
    }
    return true;
  };

  const getAuthErrorScenario = (code) => {
    switch (code) {
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/user-not-found':
        return 'No user found with this email.';
      case 'auth/invalid-email':
        return 'Invalid email address. Please check and try again.';
      default:
        return 'An error occurred. Please try again later.';
    }
  };

  const loginUser = async () => {
    if (!validateFields()) return;

    setLoading(true);
    try {
      const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
  
      const userDoc = await firebase.firestore().collection('Users').doc(user.uid).get();
      const doctorDoc = await firebase.firestore().collection('Doctors').doc(user.uid).get();
  
      if (userDoc.exists || doctorDoc.exists) {
        const userRole = userDoc.exists ? 'patient' : 'doctor';
        if (userRole === 'patient') {
          navigation.navigate('PatientDashboard');
        } else {
          navigation.navigate('DoctorDashboard');
        }
      } else {
        Alert.alert('Error', 'User does not exist.');
      }
    } catch (error) {
      const errorMessage = getAuthErrorScenario(error.code);
      Alert.alert('Login Error', errorMessage);
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      Alert.alert('Missing Information', 'Please enter your email.');
      return;
    }
    
    try {
      await firebase.auth().sendPasswordResetEmail(resetEmail);
      Alert.alert('Success', 'Password reset email sent. Please check your inbox.');
      setIsForgotPasswordModalVisible(false);
    } catch (error) {
      const errorMessage = getAuthErrorScenario(error.code);
      Alert.alert('Error', errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#008080" />
      ) : (
        <>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>MediSched</Text>
            <Text style={styles.subtitle}>Your Health, Our Priority</Text>
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Email"
              value={email}
              onChangeText={(text) => setEmail(text)}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholderTextColor="#888"
            />
            <TextInput
              style={styles.textInput}
              placeholder="Password"
              value={password}
              onChangeText={(text) => setPassword(text)}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              placeholderTextColor="#888"
            />
          </View>
          <TouchableOpacity
            onPress={loginUser}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setIsForgotPasswordModalVisible(true)}
            style={styles.forgotPasswordLink}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Registration')}
            style={styles.registerLink}
          >
            <Text style={styles.registerText}>Don't have an account? Register</Text>
          </TouchableOpacity>

          <Modal
            visible={isForgotPasswordModalVisible}
            animationType="slide"
            onRequestClose={() => setIsForgotPasswordModalVisible(false)}
            transparent={true}
          >
            <View style={styles.modalBackground}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Reset Password</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter your email"
                  value={resetEmail}
                  onChangeText={setResetEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  placeholderTextColor="#888"
                />
                <TouchableOpacity style={styles.modalButton} onPress={handleForgotPassword}>
                  <Text style={styles.modalButtonText}>Send Reset Link</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalButton} onPress={() => setIsForgotPasswordModalVisible(false)}>
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#008080',
  },
  subtitle: {
    fontSize: 20,
    color: '#006666',
    marginTop: 5,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 30,
  },
  textInput: {
    paddingVertical: 15,
    width: '100%',
    borderWidth: 1,
    borderColor: '#008080',
    borderRadius: 25,
    marginBottom: 15,
    paddingLeft: 20,
    backgroundColor: '#fff',
    color: '#008080',
    fontSize: 16,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#008080',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#fff',
  },
  registerLink: {
    marginTop: 20,
    alignSelf: 'center',
  },
  registerText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#008080',
  },
  forgotPasswordLink: {
    marginTop: 10,
  },
  forgotPasswordText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#008080',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '80%',
    padding: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#008080',
    marginBottom: 15,
  },
  modalInput: {
    width: '100%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 25,
    marginBottom: 15,
    color: '#008080',
    fontSize: 16,
  },
  modalButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#008080',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 5,
  },
  modalButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#fff',
  },
});

export default Login;
 