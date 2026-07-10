# Student Course Allocation System - Server

This is the backend API server for the Student Course Allocation System. It handles course listings, admissions applications, merit-based seat allocation matching using MongoDB multi-document transactions, and AI-assisted reporting using the Google Gemini API.

---

## Prerequisites

Before starting, ensure you have the following installed:
1. **Node.js** (v16 or higher)
2. **npm** (v7 or higher)
3. **MongoDB** (v5.0 or higher) **configured as a Replica Set**. A replica set is **strictly required** because MongoDB transactions (sessions) are used to guarantee integrity during the seat allocation algorithm process.

---

## 1. MongoDB Replica Set Setup (Windows Guide)

If you are running a standard local MongoDB instance, transactions will fail unless you enable a replica set (`rs0`). Follow these steps to set it up:

### Method A: Quick setup via Command Line (Run as Administrator)

1. Stop the running default MongoDB Windows service if it is active:
   ```cmd
   net stop MongoDB
   ```
2. Start MongoDB manually with the replica set flag from a PowerShell or Command Prompt:
   ```cmd
   mongod --port 27017 --dbpath "C:\Program Files\MongoDB\Server\<VERSION>\data" --replSet rs0
   ```
   *(Ensure the `--dbpath` directory exists and points to your actual MongoDB data folder).*

### Method B: Configuring the `mongod.cfg` file

1. Open your MongoDB configuration file (usually located at `C:\Program Files\MongoDB\Server\<VERSION>\bin\mongod.cfg`) in an editor as Administrator.
2. Add or update the replication settings:
   ```yaml
   replication:
      replSetName: rs0
   ```
3. Save the file and restart the MongoDB Windows service:
   ```cmd
   net stop MongoDB
   net start MongoDB
   ```

### Initiating the Replica Set

Once MongoDB is running with `--replSet rs0`, open MongoDB Shell (`mongosh`) and run:
```javascript
rs.initiate()
```
Verify the status by running `rs.status()`. You should see this instance become the `PRIMARY` member.

---

## 2. Server Installation & Environment Configuration

1. Clone or navigate to the server repository directory:
   ```bash
   cd Server-ai-powered-student-course-allocation
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root of the server directory:
   ```bash
   cp .env.example .env
   ```
4. Fill in the required environment variables:

| Variable | Description | Example Value |
| :--- | :--- | :--- |
| `PORT` | Port the backend server listens on | `5000` |
| `MONGO_URI` | MongoDB connection URI (must include `?replicaSet=rs0`) | `mongodb://localhost:27017/student-course-allocation?replicaSet=rs0` |
| `GEMINI_API_KEY` | Your Google Gemini API Key | `your_gemini_api_key` |
| `JWT_SECRET` | Secret key used to sign JWT session cookies | `your_jwt_secret_key` |
| `ADMIN_EMAIL` | Default administrator account email | `admin@university.com` |
| `ADMIN_PASSWORD` | Default administrator account password | `Admin@123` |
| `IS_PRODUCTION` | Production environment flag | `false` |
| `CLIENT_URL` | Frontend client origin URL | `http://localhost:5173` |

---

## 3. Database Seeding

A seed script is provided to initialize the default Admin Account so you can log in to the dashboard immediately.

To seed the database:
```bash
npm run seed
```
This will automatically connect to MongoDB, hash the admin password, and create the default user.

---

## 4. Run the Server

Start the development server using nodemon (automatic restarts on file save):
```bash
npm start
```
The server will start running on `http://localhost:5000`.
