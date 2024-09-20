// DoctorsList.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { firestore } from '../config'; // Adjust the path as needed

const DoctorsList = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const snapshot = await firestore.collection('doctor').get();
        const doctorsList = snapshot.docs.map(doc => doc.data());
        setDoctors(doctorsList);
      } catch (error) {
        setError("Error fetching doctors: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  if (loading) {
    return <Text>Loading...</Text>;
  }

  if (error) {
    return <Text>{error}</Text>;
  }

  return (
    <View style={styles.container}>
      {doctors.length > 0 ? (
        doctors.map((doctor, index) => (
          <View key={index} style={styles.item}>
            <Text style={styles.name}>{doctor.name}</Text>
            <Text>{doctor.specialty}</Text>
          </View>
        ))
      ) : (
        <Text>No doctors available</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  item: {
    marginBottom: 16,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default DoctorsList;
