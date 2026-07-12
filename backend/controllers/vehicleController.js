const db = require('../models/jsonDb');
const fs = require('fs');
const path = require('path');

exports.getVehicles = (req, res) => {
  const { type, status, search } = req.query;
  let list = db.getAll('vehicles');

  if (type) {
    list = list.filter(v => v.type === type);
  }
  if (status) {
    list = list.filter(v => v.status === status);
  }
  if (search) {
    const s = search.toLowerCase();
    list = list.filter(v => v.regNo.toLowerCase().includes(s) || v.name.toLowerCase().includes(s));
  }

  res.status(200).json(list);
};

exports.addVehicle = (req, res) => {
  const { regNo, name, type, maxCapacity, odometer, acquisitionCost, status } = req.body;

  if (!regNo || !name || !type || !maxCapacity || odometer === undefined || acquisitionCost === undefined || !status) {
    return res.status(400).json({ error: 'Missing required vehicle registry fields.' });
  }

  const cleanReg = regNo.toUpperCase().trim();
  if (!db.isRegNoUnique(cleanReg)) {
    return res.status(409).json({ error: `Registration Number ${cleanReg} already exists.` });
  }

  const record = db.add('vehicles', {
    regNo: cleanReg,
    name: name.trim(),
    type,
    maxCapacity: Number(maxCapacity),
    odometer: Number(odometer),
    acquisitionCost: Number(acquisitionCost),
    status
  });

  res.status(201).json(record);
};

exports.updateVehicle = (req, res) => {
  const { id } = req.params;
  const { name, type, maxCapacity, odometer, acquisitionCost, status } = req.body;

  const existing = db.getById('vehicles', id);
  if (!existing) {
    return res.status(404).json({ error: 'Vehicle asset not found.' });
  }

  const updated = db.update('vehicles', id, {
    name: name.trim(),
    type,
    maxCapacity: Number(maxCapacity),
    odometer: Number(odometer),
    acquisitionCost: Number(acquisitionCost),
    status
  });

  res.status(200).json(updated);
};

exports.deleteVehicle = (req, res) => {
  const { id } = req.params;
  const existing = db.getById('vehicles', id);
  if (!existing) {
    return res.status(404).json({ error: 'Vehicle asset not found.' });
  }

  db.delete('vehicles', id);
  res.status(200).json({ success: true, message: `Asset ${existing.regNo} deleted.` });
};

exports.uploadDocument = (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, size, fileData, fileName } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Missing document name or type.' });
    }

    const vehicle = db.getById('vehicles', id);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle asset not found.' });
    }

    let fileUrl = '';
    if (fileData && fileName) {
      const base64Content = fileData.split(';base64,').pop();
      const cleanFileName = `vehicle_${id}_${Date.now()}_${fileName.replace(/\s+/g, '_')}`;
      const uploadPath = path.join(__dirname, '..', 'uploads', cleanFileName);
      
      fs.writeFileSync(uploadPath, base64Content, { encoding: 'base64' });
      fileUrl = `/uploads/${cleanFileName}`;
    }

    const documents = vehicle.documents || [];
    const newDoc = {
      id: `doc_${Math.random().toString(36).substr(2, 5)}`,
      name: name.trim(),
      type,
      size: size || '45 KB',
      url: fileUrl
    };

    documents.push(newDoc);
    db.update('vehicles', id, { documents });

    res.status(200).json(newDoc);
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Failed to upload document.' });
  }
};

exports.deleteDocument = (req, res) => {
  try {
    const { id, docId } = req.params;

    const vehicle = db.getById('vehicles', id);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle asset not found.' });
    }

    let documents = vehicle.documents || [];
    const docToDelete = documents.find(doc => doc.id === docId);
    
    if (docToDelete && docToDelete.url) {
      const filePath = path.join(__dirname, '..', docToDelete.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    documents = documents.filter(doc => doc.id !== docId);
    db.update('vehicles', id, { documents });

    res.status(200).json({ success: true, message: 'Document deleted.' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document.' });
  }
};
