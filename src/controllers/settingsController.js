const db = require('../config/db');

const getSettings = async (req, res, next) => {
    try {
        const { tenant_id } = req.user;
        const query = 'SELECT * FROM tenant_settings WHERE tenant_id = $1';
        const { rows } = await db.query(query, [tenant_id]);

        let settings = rows[0];

        // If no settings exist yet, return a default object
        if (!settings) {
            settings = {
                emailNotifications: true,
                pushNotifications: false,
                theme: 'dark',
                timezone: 'UTC'
            };
        } else {
            // Map db snake_case to frontend camelCase
            settings = {
                emailNotifications: settings.email_notifications,
                pushNotifications: settings.push_notifications,
                theme: settings.theme,
                timezone: settings.timezone
            };
        }

        res.status(200).json({ status: 'success', data: settings });
    } catch (error) {
        next(error);
    }
};

const updateSettings = async (req, res, next) => {
    try {
        const { tenant_id } = req.user;
        const { emailNotifications, pushNotifications, theme, timezone } = req.body;

        const query = `
            INSERT INTO tenant_settings (tenant_id, email_notifications, push_notifications, theme, timezone)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (tenant_id)
            DO UPDATE SET 
                email_notifications = EXCLUDED.email_notifications,
                push_notifications = EXCLUDED.push_notifications,
                theme = EXCLUDED.theme,
                timezone = EXCLUDED.timezone,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *;
        `;
        
        const values = [
            tenant_id, 
            emailNotifications ?? true, 
            pushNotifications ?? false, 
            theme || 'dark', 
            timezone || 'UTC'
        ];

        const { rows } = await db.query(query, values);
        
        const updatedSettings = {
            emailNotifications: rows[0].email_notifications,
            pushNotifications: rows[0].push_notifications,
            theme: rows[0].theme,
            timezone: rows[0].timezone
        };

        res.status(200).json({ status: 'success', data: updatedSettings });
    } catch (error) {
        next(error);
    }
};

module.exports = { getSettings, updateSettings };
