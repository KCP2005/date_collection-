const House = require('../models/House');

// Get all houses
exports.getHouses = async (req, res) => {
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
    query = House.find(JSON.parse(queryStr)).populate('area', 'name').populate('team', 'name');
    
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
      query = query.sort('-submissionDate');
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await House.countDocuments(JSON.parse(queryStr));
    
    query = query.skip(startIndex).limit(limit);
    
    // Executing query
    const houses = await query;
    
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
      count: houses.length,
      pagination,
      data: houses
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single house
exports.getHouse = async (req, res) => {
  try {
    const house = await House.findById(req.params.id)
      .populate('area', 'name')
      .populate('team', 'name')
      .populate('submittedBy', 'name');
    
    if (!house) {
      return res.status(404).json({ message: 'House not found' });
    }
    
    res.status(200).json({
      success: true,
      data: house
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create house
exports.createHouse = async (req, res) => {
  try {
    // Add user to req.body
    req.body.submittedBy = req.user.id;
    
    // If user is not admin, they can only submit for their team
    if (req.user.role !== 'admin') {
      req.body.team = req.user.team;
    }
    
    const house = await House.create(req.body);
    
    res.status(201).json({
      success: true,
      data: house
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update house
exports.updateHouse = async (req, res) => {
  try {
    let house = await House.findById(req.params.id);
    
    if (!house) {
      return res.status(404).json({ message: 'House not found' });
    }
    
    // Make sure user is house owner or admin
    if (house.submittedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to update this house' });
    }
    
    house = await House.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: house
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete house
exports.deleteHouse = async (req, res) => {
  try {
    const house = await House.findById(req.params.id);
    
    if (!house) {
      return res.status(404).json({ message: 'House not found' });
    }
    
    // Make sure user is house owner or admin
    if (house.submittedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to delete this house' });
    }
    
    await house.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};