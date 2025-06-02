const Person = require('../models/Person');
const House = require('../models/House');

// Get all people
exports.getPeople = async (req, res) => {
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
    query = Person.find(JSON.parse(queryStr)).populate('house', 'address');
    
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
    const total = await Person.countDocuments(JSON.parse(queryStr));
    
    query = query.skip(startIndex).limit(limit);
    
    // Executing query
    const people = await query;
    
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
      count: people.length,
      pagination,
      data: people
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single person
exports.getPerson = async (req, res) => {
  try {
    const person = await Person.findById(req.params.id).populate('house', 'address');
    
    if (!person) {
      return res.status(404).json({ message: 'Person not found' });
    }
    
    res.status(200).json({
      success: true,
      data: person
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create person
exports.createPerson = async (req, res) => {
  try {
    // Add user to req.body
    req.body.submittedBy = req.user.id;
    
    // Check if house exists
    const house = await House.findById(req.body.house);
    
    if (!house) {
      return res.status(404).json({ message: 'House not found' });
    }
    
    // Make sure user is house owner or admin
    if (house.submittedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to add person to this house' });
    }
    
    const person = await Person.create(req.body);
    
    res.status(201).json({
      success: true,
      data: person
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update person
exports.updatePerson = async (req, res) => {
  try {
    let person = await Person.findById(req.params.id);
    
    if (!person) {
      return res.status(404).json({ message: 'Person not found' });
    }
    
    // Make sure user is person submitter or admin
    if (person.submittedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to update this person' });
    }
    
    person = await Person.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: person
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete person
exports.deletePerson = async (req, res) => {
  try {
    const person = await Person.findById(req.params.id);
    
    if (!person) {
      return res.status(404).json({ message: 'Person not found' });
    }
    
    // Make sure user is person submitter or admin
    if (person.submittedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to delete this person' });
    }
    
    await person.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};