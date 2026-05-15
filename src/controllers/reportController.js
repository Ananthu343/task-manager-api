const db = require('../config/db');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

// Initialize SQS Client
// Configured to pick up process.env.AWS_REGION etc automatically.
const sqsClient = new SQSClient({ 
    region: process.env.AWS_REGION || 'eu-north-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }, 
});

const getReportHistory = async (req, res, next) => {
    try {
        const { tenant_id } = req.user;
        
        const query = `
            SELECT id, tenant_id, dummy_count AS "dummyCount", status, link, created_at AS date 
            FROM report_history 
            WHERE tenant_id = $1 
            ORDER BY created_at DESC
        `;
        
        const { rows } = await db.query(query, [tenant_id]);

        res.status(200).json({ status: 'success', data: { reports: rows } });
    } catch (error) {
        next(error);
    }
};

const generateReport = async (req, res, next) => {
    try {
        const { tenant_id } = req.user;
        const { dummyCount } = req.body;

        const count = parseInt(dummyCount) || 0;

        // 1. Insert a pending report record
        const insertQuery = `
            INSERT INTO report_history (tenant_id, dummy_count, status)
            VALUES ($1, $2, 'pending')
            RETURNING id, tenant_id, dummy_count AS "dummyCount", status, link, created_at AS date;
        `;
        const { rows } = await db.query(insertQuery, [tenant_id, count]);
        const newReport = rows[0];

        // 2. Push message to SQS
        const queueUrl = process.env.AWS_SQS_QUEUE_URL;
        
        if (queueUrl) {
            const messageBody = JSON.stringify({
                reportId: newReport.id,
                tenantId: tenant_id,
                dummyCount: count
            });

            const command = new SendMessageCommand({
                QueueUrl: queueUrl,
                MessageBody: messageBody,
                MessageGroupId: tenant_id // Assuming FIFO queue for ordered processing per tenant, or just a generic attribute
            });

            try {
                await sqsClient.send(command);
                console.log(`[SQS] Successfully queued report generation for ${newReport.id}`);
            } catch (sqsError) {
                console.error(`[SQS Error] Failed to queue report ${newReport.id}:`, sqsError.message);
                // Optionally: update the db record to 'failed' here
            }
        } else {
            console.warn('[SQS Warning] AWS_SQS_QUEUE_URL is not defined. Skipping SQS push.');
        }

        // Return the pending report data immediately
        res.status(201).json({ status: 'success', data: newReport });
    } catch (error) {
        next(error);
    }
};

module.exports = { getReportHistory, generateReport };
