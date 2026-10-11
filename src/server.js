'use strict';

/**
 * Server entry point: wires the file-backed database from configuration into
 * the application and starts listening. Run with `npm start`.
 *
 * @module server
 */

const { createDb } = require('./db');
const createApp = require('./app');
const config = require('./config');

const db = createDb();
const app = createApp(db);

const server = app.listen(config.port, config.host, () => {
  console.log(`Tinshed Crew Roster listening on http://localhost:${config.port}`);
  console.log(`Environment: ${config.env}`);
  console.log(`Database: ${config.dbPath}`);
});

function shutdown() {
  server.close(() => { db.close(); process.exit(0); });
}
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
