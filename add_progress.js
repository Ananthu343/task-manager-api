const db = require('./src/config/db');

const migrate = async () => {
    try {
        console.log("Adding progress column to report_history...");
        await db.query(`
            ALTER TABLE report_history 
            ADD COLUMN IF NOT EXISTS progress INT DEFAULT 0;
        `);
        console.log("Migration successful!");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
};

migrate();
