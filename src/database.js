const { Pool } = require('pg');
class Database {
    constructor() {
        if (!process.env.DATABASE_URL) { this.pool = null; return; }
        this.pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    }
    async init() {
        if (!this.pool) return;
        try {
            const client = await this.pool.connect();
            await client.query('CREATE TABLE IF NOT EXISTS alerts (id SERIAL PRIMARY KEY, ca VARCHAR(50), user_from VARCHAR(50), created_at TIMESTAMP DEFAULT NOW())');
            client.release();
        } catch(e) {}
    }
    async log(ca, user) { 
        if (!this.pool) return;
        this.pool.query('INSERT INTO alerts (ca, user_from) VALUES ($1, $2)', [ca, user]).catch(e => {});
    }
}
module.exports = Database;
