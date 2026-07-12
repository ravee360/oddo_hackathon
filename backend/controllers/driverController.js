const db = require('../models/jsonDb');

exports.getDrivers = (req, res) => {
  const { search } = req.query;
  let list = db.getAll('drivers');

  if (search) {
    const s = search.toLowerCase();
    list = list.filter(d => d.name.toLowerCase().includes(s) || d.licenseNo.toLowerCase().includes(s));
  }

  res.status(200).json(list);
};

exports.addDriver = (req, res) => {
  const { name, licenseNo, licenseCategory, licenseExpiry, safetyScore, contact, status } = req.body;

  if (!name || !licenseNo || !licenseCategory || !licenseExpiry || safetyScore === undefined || !contact || !status) {
    return res.status(400).json({ error: 'Missing required driver profile fields.' });
  }

  const record = db.add('drivers', {
    name: name.trim(),
    licenseNo: licenseNo.trim(),
    licenseCategory: licenseCategory.trim(),
    licenseExpiry,
    safetyScore: Number(safetyScore),
    contact: contact.trim(),
    status
  });

  res.status(201).json(record);
};

exports.updateDriver = (req, res) => {
  const { id } = req.params;
  const { name, licenseNo, licenseCategory, licenseExpiry, safetyScore, contact, status } = req.body;

  const existing = db.getById('drivers', id);
  if (!existing) {
    return res.status(404).json({ error: 'Driver profile not found.' });
  }

  const updated = db.update('drivers', id, {
    name: name.trim(),
    licenseNo: licenseNo.trim(),
    licenseCategory: licenseCategory.trim(),
    licenseExpiry,
    safetyScore: Number(safetyScore),
    contact: contact.trim(),
    status
  });

  res.status(200).json(updated);
};

exports.overrideStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required.' });
  }

  const existing = db.getById('drivers', id);
  if (!existing) {
    return res.status(404).json({ error: 'Driver profile not found.' });
  }

  const updated = db.update('drivers', id, { status });
  res.status(200).json(updated);
};

exports.deleteDriver = (req, res) => {
  const { id } = req.params;
  const existing = db.getById('drivers', id);
  if (!existing) {
    return res.status(404).json({ error: 'Driver profile not found.' });
  }

  db.delete('drivers', id);
  res.status(200).json({ success: true, message: `Driver profile for ${existing.name} deleted.` });
};

exports.sendEmailReminders = (req, res) => {
  try {
    const drivers = db.getAll('drivers');
    const today = new Date('2026-07-12');
    const sentEmails = [];

    drivers.forEach(d => {
      const expDate = new Date(d.licenseExpiry);
      const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));

      if (diffDays <= 30) {
        const isExpired = diffDays <= 0;
        const statusText = isExpired ? 'EXPIRED' : `EXPIRING in ${diffDays} days`;

        const subject = `TransitOps Alert: Commercial License is ${statusText} - ${d.name}`;
        const emailBody = `Dear ${d.name},

This is an automated notification from the TransitOps Fleet Management portal.

Our records indicate that your driver license (${d.licenseNo}) is currently ${statusText}.
Expiration Date: ${d.licenseExpiry}

Please note: If your license is expired, you are legally prohibited from dispatch assignments.

Please upload your updated license certificate to the TransitOps compliance registry or contact the Safety Office at safety@transitops.in immediately.

Best regards,
TransitOps Safety & Compliance Office`;

        const toEmail = `${d.name.toLowerCase().replace(/\s+/g, '.')}@transitops.in`;

        const emailRecord = db.add('sent_emails', {
          driverId: d.id,
          driverName: d.name,
          recipient: toEmail,
          subject,
          body: emailBody,
          sentAt: '2026-07-12 12:00:00',
          status: 'Sent (Simulated)'
        });

        sentEmails.push(emailRecord);
      }
    });

    res.status(200).json({
      success: true,
      sentCount: sentEmails.length,
      emails: sentEmails
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to trigger email reminders scan.' });
  }
};
