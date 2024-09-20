// src/services/appointmentService.js

import { firebase } from '../config';
import { doc, setDoc, collection } from 'firebase/firestore';

// Function to book an appointment
export const bookAppointment = async (appointmentDetails, selectedDoctor) => {
  try {
    const userId = firebase.auth().currentUser.uid;
    const bookingRef = doc(collection(firebase.firestore(), 'Bookings'));

    // Add the appointment details to the Bookings collection
    await setDoc(bookingRef, {
      ...appointmentDetails,
      userId: userId, // Make sure userId is included
      doctorId: selectedDoctor.id, // Ensure doctorId is included
      createdAt: new Date(),
    });

    console.log('Appointment booked successfully!');
  } catch (error) {
    console.error('Error booking appointment: ', error);
  }
};
