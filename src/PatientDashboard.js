
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ActivityIndicator, RefreshControl, Alert, Image } from 'react-native';
import { firebase } from '../config';
import Booking from './Booking';
import { MaterialIcons } from '@expo/vector-icons';

const PatientDashboard = () => {
  const [patientName, setPatientName] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [seenAppointments, setSeenAppointments] = useState(new Set());
  const [notifications, setNotifications] = useState([]);
  const [isNotificationModalVisible, setIsNotificationModalVisible] = useState(false);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);

  const fetchPatientData = useCallback(async () => {
    setLoading(true);
    try {
      const user = firebase.auth().currentUser;
      if (user) {
        const patientQuery = await firebase.firestore().collection('Users')
          .where('email', '==', user.email)
          .get();

        if (!patientQuery.empty) {
          const patientDoc = patientQuery.docs[0];
          const patientData = patientDoc.data();

          setPatientName(`${patientData.firstName} ${patientData.lastName}`);
          setProfilePicture(patientData.profilePhoto || '');
        } else {
          setPatientName('Patient');
          setProfilePicture('');
        }

        const appointmentsSnapshot = await firebase.firestore().collection('Bookings')
          .where('userId', '==', user.uid)
          .get();

        const fetchedAppointments = await Promise.all(appointmentsSnapshot.docs.map(async doc => {
          const data = doc.data();
          const doctorDoc = await firebase.firestore().collection('Doctors').doc(data.doctorId).get();
          const doctorData = doctorDoc.exists ? doctorDoc.data() : { firstName: 'Unknown', lastName: 'Doctor' };

          return {
            id: doc.id,
            ...data,
            doctorName: `${doctorData.firstName} ${doctorData.lastName}`,
            status: data.status || 'Pending',
            appointmentDate: data.appointmentDate ? new Date(data.appointmentDate).toLocaleString() : 'N/A'
          };
        }));

        setAppointments(fetchedAppointments);

        const notificationsSnapshot = await firebase.firestore().collection('Notifications')
          .where('userId', '==', user.uid)
          .orderBy('timestamp', 'desc')
          .get();
        
        const fetchedNotifications = notificationsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            timestamp: data.timestamp.toDate()
          };
        });

        setNotifications(fetchedNotifications);
      }
    } catch (error) {
      console.error('Error fetching patient data: ', error);
      Alert.alert('Error', 'Error fetching data. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchDoctors = useCallback(async () => {
    try {
      const doctorsSnapshot = await firebase.firestore().collection('Doctors').get();
      const doctorsList = await Promise.all(doctorsSnapshot.docs.map(async doc => {
        const doctor = doc.data();
        const doctorId = doc.id;

        const appointmentsSnapshot = await firebase.firestore().collection('Bookings')
          .where('doctorId', '==', doctorId)
          .get();
        const isBusy = !appointmentsSnapshot.empty;

        return {
          id: doctorId,
          ...doctor,
          status: isBusy ? 'Busy' : 'Available'
        };
      }));

      setDoctors(doctorsList);
    } catch (error) {
      console.error('Error fetching doctors: ', error);
      Alert.alert('Error', 'Error fetching doctors. Please try again later.');
    }
  }, []);

  useEffect(() => {
    fetchPatientData();
    fetchDoctors();
  }, [fetchPatientData, fetchDoctors]);

  useEffect(() => {
    const handleRejectedAppointments = async () => {
      const rejectedAppointments = appointments.filter(app => app.status === 'Rejected');
      for (const appointment of rejectedAppointments) {
        if (seenAppointments.has(appointment.id)) {
          try {
            await firebase.firestore().collection('Bookings').doc(appointment.id).delete();
            setAppointments(prevAppointments => prevAppointments.filter(app => app.id !== appointment.id));
            Alert.alert('Appointment Rejected', 'Your appointment has been rejected and deleted.');
          } catch (error) {
            console.error('Error deleting rejected appointment: ', error);
            Alert.alert('Error', 'Error deleting rejected appointment. Please try again later.');
          }
        }
      }
    };

    handleRejectedAppointments();
  }, [appointments, seenAppointments]);

  const handleDoctorSelect = (doctor) => {
    if (doctor && doctor.id) {
      if (doctor.status === 'Busy') {
        Alert.alert('Busy', 'This doctor is currently busy. Please select another doctor.');
      } else {
        setSelectedDoctor(doctor);
        setIsModalVisible(true);
      }
    } else {
      console.error('Selected doctor data is incomplete:', doctor);
      Alert.alert('Error', 'Unable to select doctor. Please try again.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPatientData();
    await fetchDoctors();
  };

  const handleDeleteAppointment = async (appointmentId) => {
    Alert.alert(
      "Delete Appointment",
      "Are you sure you want to delete this appointment?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "OK",
          onPress: async () => {
            try {
              await firebase.firestore().collection('Bookings').doc(appointmentId).delete();
              setAppointments(prevAppointments => prevAppointments.filter(appointment => appointment.id !== appointmentId));
              Alert.alert('Success', 'Appointment deleted successfully.');
            } catch (error) {
              console.error('Error deleting appointment: ', error);
              Alert.alert('Error', 'Error deleting appointment. Please try again later.');
            }
          }
        }
      ]
    );
  };

  const markAppointmentAsSeen = (appointmentId) => {
    setSeenAppointments(prevSeen => new Set(prevSeen).add(appointmentId));
  };

  const handleDeleteNotification = async (notificationId) => {
    Alert.alert(
      "Delete Notification",
      "Are you sure you want to delete this notification?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "OK",
          onPress: async () => {
            try {
              await firebase.firestore().collection('Notifications').doc(notificationId).delete();
              setNotifications(prevNotifications => prevNotifications.filter(notification => notification.id !== notificationId));
              Alert.alert('Success', 'Notification deleted successfully.');
            } catch (error) {
              console.error('Error deleting notification: ', error);
              Alert.alert('Error', 'Error deleting notification. Please try again later.');
            }
          }
        }
      ]
    );
  };

  const renderDoctorItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleDoctorSelect(item)} style={styles.doctorItem}>
      <View style={styles.doctorInfo}>
        <Text style={styles.doctorName}>{item.firstName} {item.lastName}</Text>
        <Text style={[styles.doctorStatus, item.status === 'Busy' ? styles.busyStatus : styles.availableStatus]}>
          {item.status}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderAppointmentItem = ({ item }) => {
    if (item.status === 'Rejected') {
      markAppointmentAsSeen(item.id);
    }

    return (
      <View style={styles.appointmentItem}>
        <View>
          <Text style={styles.appointmentText}>Doctor: {item.doctorName || 'N/A'}</Text>
          <Text style={styles.appointmentText}>Date: {item.appointmentDate}</Text>
          <Text style={styles.appointmentText}>Status: {item.status}</Text>
        </View>
        <TouchableOpacity onPress={() => handleDeleteAppointment(item.id)} style={styles.deleteButton}>
          <MaterialIcons name="delete" size={24} color="red" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderNotificationItem = ({ item }) => (
    <View style={styles.notificationItem}>
      <Text>{item.message}</Text>
      <TouchableOpacity onPress={() => handleDeleteNotification(item.id)} style={styles.deleteButton}>
        <MaterialIcons name="clear" size={24} color="red" />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return <ActivityIndicator size="large" color



="#0000ff" style={styles.loader} />;
  }

  return (
    <View style={styles.container}>
      {profilePicture ? (
        <Image source={{ uri: profilePicture }} style={styles.profilePicture} />
      ) : (
        <View style={styles.defaultProfilePicture}></View>
      )}
      <Text style={styles.welcomeMessage}>Welcome, {patientName}!</Text>

      <TouchableOpacity onPress={() => setIsOverlayVisible(!isOverlayVisible)} style={styles.notificationButton}>
        <MaterialIcons name="notifications" size={24} color="black" />
      </TouchableOpacity>

      {isOverlayVisible && (
        <View style={styles.overlay}>
          <FlatList
            data={notifications}
            renderItem={renderNotificationItem}
            keyExtractor={item => item.id}
            ListEmptyComponent={<Text style={styles.noNotifications}>No notifications</Text>}
          />
        </View>
      )}

      <FlatList
        data={doctors}
        renderItem={renderDoctorItem}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={<Text style={styles.header}>Available Doctors</Text>}
      />

      <Text style={styles.header}>My Appointments</Text>
      <FlatList
        data={appointments}
        renderItem={renderAppointmentItem}
        keyExtractor={item => item.id}
        ListEmptyComponent={<Text style={styles.noAppointments}>No appointments</Text>}
      />

      <Modal visible={isModalVisible} transparent={true} animationType="slide">
        <Booking
          doctor={selectedDoctor}
          onClose={() => setIsModalVisible(false)}
          onRefresh={fetchPatientData}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  defaultProfilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ccc',
    marginBottom: 20,
  },
  welcomeMessage: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#007bff',
  },
  doctorItem: {
    padding: 15,
    backgroundColor: '#ffffff',
    marginBottom: 10,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  doctorInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  doctorName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  doctorStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  availableStatus: {
    color: 'green',
  },
  busyStatus: {
    color: 'red',
  },
  appointmentItem: {
    padding: 15,
    backgroundColor: '#ffffff',
    marginBottom: 10,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appointmentText: {
    fontSize: 16,
  },
  deleteButton: {
    padding: 5,
  },
  notificationButton: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  overlay: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 250,
    backgroundColor: 'white',
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  notificationItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noNotifications: {
    padding: 20,
    textAlign: 'center',
    color: '#888',
  },
  noAppointments: {
    padding: 20,
    textAlign: 'center',
    color: '#888',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PatientDashboard;
 