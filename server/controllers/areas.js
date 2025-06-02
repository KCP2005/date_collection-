const Area = require('../models/Area');

// Get all areas
exports.getAreas = async (req, res) => {
  try {
    let query;
    
    // Copy req.query
    const reqQuery = { ...req.query };
    
    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];
    
    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);
    
    // Create query string
    let queryStr = JSON.stringify(reqQuery);
    
    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
    
    // Finding resource
    query = Area.find(JSON.parse(queryStr));
    
    // Select fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }
    
    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Area.countDocuments(JSON.parse(queryStr));
    
    query = query.skip(startIndex).limit(limit);
    
    // Executing query
    const areas = await query;
    
    // Pagination result
    const pagination = {};
    
    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }
    
    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }
    
    res.status(200).json({
      success: true,
      count: areas.length,
      pagination,
      data: areas
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single area
exports.getArea = async (req, res) => {
  try {
    const area = await Area.findById(req.params.id);
    
    if (!area) {
      return res.status(404).json({ message: 'Area not found' });
    }
    
    res.status(200).json({
      success: true,
      data: area
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create area
exports.createArea = async (req, res) => {
  try {
    const area = await Area.create(req.body);
    
    res.status(201).json({
      success: true,
      data: area
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update area
exports.updateArea = async (req, res) => {
  try {
    let area = await Area.findById(req.params.id);
    
    if (!area) {
      return res.status(404).json({ message: 'Area not found' });
    }
    
    area = await Area.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: area
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete area
exports.deleteArea = async (req, res) => {
  try {
    const area = await Area.findById(req.params.id);
    
    if (!area) {
      return res.status(404).json({ message: 'Area not found' });
    }
    
    await area.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};