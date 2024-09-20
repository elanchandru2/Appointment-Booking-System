import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, Alert, Modal, Platform, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { firebase } from '../config';

const Booking = ({ isVisible, onClose, doctor }) => {
  const [preferredDate, setPreferredDate] = useState(new Date());
  const [preferredTime, setPreferredTime] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) setPreferredDate(selectedDate);
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) setPreferredTime(selectedTime);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const user = firebase.auth().currentUser;
      if (user) {
        const combinedDateTime = new Date(
          preferredDate.getFullYear(),
          preferredDate.getMonth(),
          preferredDate.getDate(),
          preferredTime.getHours(),
          preferredTime.getMinutes()
        );

        await firebase.firestore().collection('Bookings').add({
          userId: user.uid,
          doctorId: doctor.id,
          appointmentDate: combinedDateTime.toISOString(),
          status: 'Waiting for approval',
        });

        Alert.alert('Success', 'Your appointment has been booked.');
        onClose();
      } else {
        Alert.alert('Error', 'User is not authenticated.');
      }
    } catch (error) {
      console.error('Error booking appointment: ', error);
      Alert.alert('Error', 'Failed to book the appointment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.content}>
          <Text style={styles.modalTitle}>
            Book an appointment with {doctor?.firstName || 'Unknown'} {doctor?.lastName || ''}
          </Text>

          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={styles.input}
          >
            <Text style={styles.inputText}>
              {preferredDate ? preferredDate.toLocaleDateString() : 'Select Date'}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={preferredDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()} // Prevent selection of past dates
            />
          )}

          <TouchableOpacity
            onPress={() => setShowTimePicker(true)}
            style={styles.input}
          >
            <Text style={styles.inputText}>
              {preferredTime ? preferredTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Select Time'}
            </Text>
          </TouchableOpacity>

          {showTimePicker && (
            <DateTimePicker
              value={preferredTime}
              mode="time"
              display="default"
              onChange={handleTimeChange}
            />
          )}

          <Button
            title={isSubmitting ? 'Submitting...' : 'Submit'}
            onPress={handleSubmit}
            disabled={isSubmitting}
          />
          <Button title="Close" onPress={onClose} color="#ff0000" />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    backgroundColor: '#333333',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 10,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: '#ffffff',
    borderWidth: 1,
    borderRadius: 5,
    width: '100%',
    marginBottom: 10,
    paddingHorizontal: 10,
    justifyContent: 'center',
    backgroundColor: '#555555',
  },
  inputText: {
    color: '#ffffff',
  },
});

export default Booking;
