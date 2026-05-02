import React from 'react';
import ReactPDF, { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 22,
    marginBottom: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#0891B2',
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 20,
    fontFamily: 'Helvetica-Oblique',
    color: '#64748B',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    marginTop: 14,
    marginBottom: 6,
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
  },
  body: {
    fontSize: 9,
    marginBottom: 4,
    color: '#334155',
    lineHeight: 1.4,
  },
  codeBlock: {
    fontSize: 8,
    fontFamily: 'Courier',
    backgroundColor: '#F8FAFC',
    borderLeftWidth: 3,
    borderLeftColor: '#0891B2',
    padding: 8,
    marginTop: 4,
    marginBottom: 8,
    color: '#1E293B',
    lineHeight: 1.3,
  },
  list: {
    paddingLeft: 12,
  },
  listItem: {
    fontSize: 9,
    marginBottom: 2,
    color: '#334155',
  }
});

const TruehostDeploymentDoc = () => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Truehost Deployment Guide</Text>
      <Text style={styles.subtitle}>Capital Crew Next.js Production Web Application</Text>
      
      <Text style={styles.sectionTitle}>1. Selecting the Truehost Hosting Package</Text>
      <Text style={styles.body}>
        Because Next.js requires server actions and continuous Node.js processes, a standard cPanel package is generally not recommended unless it explicitly includes Node.js App support. The best options are:
      </Text>
      <View style={styles.list}>
        <Text style={styles.listItem}>• Truehost VPS (Recommended) – Provides full Ubuntu access, high uptime, and total control.</Text>
        <Text style={styles.listItem}>• Truehost cPanel with Node.js setup – Best for simpler hosting setups; requires SSH terminal access.</Text>
      </View>

      <Text style={styles.sectionTitle}>2. Production Build and Environment Setup</Text>
      <Text style={styles.body}>
        Before shipping code to production, always validate that all TypeScript rules and routes are sound by running:
      </Text>
      <Text style={styles.codeBlock}>
        npm run build
      </Text>
      
      <Text style={styles.body}>
        Create a secure and standalone .env file on your production server with real production endpoints:
      </Text>
      <Text style={styles.codeBlock}>
        DATABASE_URL="postgresql://neondb_owner:...your-prod-string..."{'\n'}
        AUTH_SECRET="your-secure-32-hex-character-token"{'\n'}
        SMTP_HOST="smtp.gmail.com"{'\n'}
        SMTP_USER="capitalcrewshg@gmail.com"{'\n'}
        SMTP_PASS="your-gmail-app-password"{'\n'}
        DEFAULT_MEMBER_PASSWORD="TemporaryPass123!"{'\n'}
        UPSTASH_REDIS_REST_URL="https://...your-redis-url..."{'\n'}
        UPSTASH_REDIS_REST_TOKEN="your-redis-token"{'\n'}
        GATEWAY_URL="https://gateway.yourdomain.co.ke"{'\n'}
        GATEWAY_HMAC_SECRET="your-production-hmac-secret"
      </Text>

      <Text style={styles.sectionTitle}>3. Deploying via Truehost Linux VPS</Text>
      <Text style={styles.body}>
        1. Connect via SSH and install required runtimes:
      </Text>
      <Text style={styles.codeBlock}>
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -{'\n'}
        sudo apt-get install -y nodejs git nginx{'\n'}
        sudo npm install -g pm2
      </Text>

      <Text style={styles.body}>
        2. Clone code, install dependencies, and build the Next.js production server:
      </Text>
      <Text style={styles.codeBlock}>
        git clone https://github.com/your-username/capital-crew.git{'\n'}
        cd capital-crew{'\n'}
        npm install{'\n'}
        npx prisma generate{'\n'}
        npm run build
      </Text>

      <Text style={styles.body}>
        3. Launch the web application server as a background daemon process using PM2:
      </Text>
      <Text style={styles.codeBlock}>
        pm2 start npm --name "capital-crew" -- start{'\n'}
        pm2 save{'\n'}
        pm2 startup
      </Text>
    </Page>
  </Document>
);

async function main() {
    await ReactPDF.renderToFile(<TruehostDeploymentDoc />, './Truehost_Deployment_Guide.pdf');
    console.log('Production PDF successfully rendered to file.');
}

main().catch(console.error);
