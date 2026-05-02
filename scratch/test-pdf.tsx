import React from 'react';
import ReactPDF, { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 15,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  body: {
    fontSize: 11,
    marginBottom: 5,
    lineHeight: 1.4,
  }
});

const MyDoc = () => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Truehost Deployment Guide</Text>
      <Text style={styles.body}>This is a test PDF document generated for Truehost deployment.</Text>
    </Page>
  </Document>
);

async function main() {
    await ReactPDF.renderToFile(<MyDoc />, './Truehost_Deployment_Guide.pdf');
    console.log('PDF rendered successfully');
}

main().catch(console.error);
