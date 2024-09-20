import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Animated, Image } from 'react-native';
import { firebase } from '../config';
import AwesomeAlert from 'react-native-awesome-alerts';
import { getAuth } from 'firebase/auth';

const DoctorDashboard = () => {
  const [doctorName, setDoctorName] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('info');
  const [onConfirm, setOnConfirm] = useState(() => () => {});

  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (currentUser) {
      fetchDoctorData(currentUser.email);
    } else {
      setLoading(false);
      // Handle case when user is not authenticated
    }
  }, [currentUser]);

  const fetchDoctorData = async (email) => {
    setRefreshing(true);
    try {
      const doctorSnapshot = await firebase.firestore()
        .collection('Doctors')
        .where('email', '==', email)
        .get();

      if (!doctorSnapshot.empty) {
        const doctorData = doctorSnapshot.docs[0].data();
        setDoctorName(`Dr. ${doctorData.firstName} ${doctorData.lastName}`);
        setProfilePicture(doctorData.profilePhoto || '');

        const bookingsSnapshot = await firebase.firestore()
          .collection('Bookings')
          .where('doctorId', '==', doctorSnapshot.docs[0].id)
          .get();

        const fetchedAppointments = await Promise.all(bookingsSnapshot.docs.map(async doc => {
          const data = doc.data();
          let appointmentDate = 'Invalid Date';
          let hour = '';
          let minute = '';

          if (data.appointmentDate) {
            try {
              const dateObj = new Date(data.appointmentDate);
              if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
                const options = {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
                  hour12: true
                };
                appointmentDate = dateObj.toLocaleString('en-US', options);
                const hours = dateObj.getHours();
                const minutes = dateObj.getMinutes();
                hour = hours % 12 || 12;
                minute = minutes < 10 ? `0${minutes}` : minutes;
              } else {
                appointmentDate = 'Invalid Date';
              }
            } catch (error) {
              console.error('Error parsing appointment date: ', error);
            }
          }

          let patientName = 'N/A';
          if (data.userId) {
            const patientDoc = await firebase.firestore().collection('Users').doc(data.userId).get();
            if (patientDoc.exists) {
              const patientData = patientDoc.data();
              patientName = `${patientData.firstName || 'Unknown'} ${patientData.lastName || ''}`;
            }
          }

          return {
            id: doc.id,
            ...data,
            appointmentDate,
            patientName,
            hour,
            minute,
          };
        }));

        setAppointments(fetchedAppointments);
      } else {
        setDoctorName('Doctor');
      }
    } catch (error) {
      console.error('Error fetching doctor data: ', error);
    } finally {
      setRefreshing(false);
      setLoading(false);
      setLoadingAppointments(false);
    }
  };

  const handleAccept = async (appointmentId, patientId) => {
    try {
      await firebase.firestore().collection('Bookings').doc(appointmentId).update({
        status: 'accepted',
      });
      setAlertTitle('Appointment Accepted');
      setAlertMessage('The appointment has been accepted successfully.');
      setAlertType('success');
      setOnConfirm(() => () => fetchDoctorData(currentUser.email));
      setShowAlert(true);

      await firebase.firestore().collection('Notifications').add({
        userId: patientId,
        message: `Your appointment with ${doctorName} has been accepted.`,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error('Error accepting appointment: ', error);
      setAlertTitle('Error');
      setAlertMessage('There was an error accepting the appointment. Please try again.');
      setAlertType('error');
      setOnConfirm(() => () => setShowAlert(false));
      setShowAlert(true);
    }
  };

  const handleReject = async (appointmentId, patientId) => {
    try {
      // Update the appointment status to 'rejected'
      await firebase.firestore().collection('Bookings').doc(appointmentId).update({
        status: 'rejected',
      });
  
      // Delete the rejected appointment from the database
      await firebase.firestore().collection('Bookings').doc(appointmentId).delete();
  
      // Send a notification to the patient
      await firebase.firestore().collection('Notifications').add({
        userId: patientId,
        message: `Your appointment with ${doctorName} has been rejected.`,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });
  
      // Show success alert
      setAlertTitle('Appointment Rejected');
      setAlertMessage('The appointment has been rejected and deleted successfully.');
      setAlertType('success');
      setOnConfirm(() => () => fetchDoctorData(currentUser.email));
      setShowAlert(true);
    } catch (error) {
      console.error('Error rejecting appointment: ', error);
      setAlertTitle('Error');
      setAlertMessage('There was an error rejecting the appointment. Please try again.');
      setAlertType('error');
      setOnConfirm(() => () => setShowAlert(false));
      setShowAlert(true);
    }
  };
  

  const renderItem = ({ item }) => (
    <Animated.View style={styles.appointmentItem}>
      <Text style={styles.appointmentText}>Patient: {item.patientName || 'N/A'}</Text>
      <Text style={styles.appointmentText}>Date: {item.appointmentDate}</Text>
      <Text style={styles.appointmentText}>Time: {item.hour}:{item.minute}</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.acceptButton]}
          onPress={() => handleAccept(item.id, item.userId)}
        >
          <Text style={styles.buttonText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.rejectButton]}
          onPress={() => handleReject(item.id, item.userId)}
        >
          <Text style={styles.buttonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileContainer}>
          {profilePicture ? (
            <Image source={{ uri: profilePicture }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Text style={styles.profileImageText}>No Profile Picture</Text>
            </View>
          )}
          <View style={styles.profileTextContainer}>
            <Text style={styles.welcomeText}>Welcome, {doctorName}!</Text>
          </View>
        </View>
      </View>
      <Text style={styles.appointmentsTitle}>Upcoming Appointments:</Text>
      {loadingAppointments ? (
        <Text style={styles.loadingText}>Loading appointments...</Text>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchDoctorData(currentUser.email)}
            />
          }
        />
      )}

      <AwesomeAlert
        show={showAlert}
        title={alertTitle}
        message={alertMessage}
        showCancelButton={alertType !== 'success'}
        showConfirmButton={true}
        confirmText="OK"
        cancelText="Cancel"
        confirmButtonColor={alertType === 'success' ? '#28a745' : '#DD6B55'}
        cancelButtonColor="#AAAAAA"
        onCancelPressed={() => setShowAlert(false)}
        onConfirmPressed={() => {
          if (typeof onConfirm === 'function') {
            onConfirm();
          }
          setShowAlert(false);
        }}
        titleStyle={styles.alertTitle}
        messageStyle={styles.alertMessage}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f1f1',
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 10,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  profileImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageText: {
    color: '#fff',
    textAlign: 'center',
  },
  profileTextContainer: {
    marginLeft: 15,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  appointmentsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  appointmentItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
    elevation: 2,
  },
  appointmentText: {
    fontSize: 14,
    marginBottom: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  acceptButton: {
    backgroundColor: '#28a745',
  },
  rejectButton: {
    backgroundColor: '#DD6B55',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#888',
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  alertMessage: {
    fontSize: 16,
  },
});

export default DoctorDashboard;
