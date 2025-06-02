const House = require('../models/House');
const Person = require('../models/Person');
const Team = require('../models/Team');
const Area = require('../models/Area');
const mongoose = require('mongoose');

// Build query from request query params
const buildQuery = (reqQuery) => {
  const query = {};
  
  // Filter by area
  if (reqQuery.area) {
    query.area = mongoose.Types.ObjectId(reqQuery.area);
  }
  
  // Filter by team
  if (reqQuery.team) {
    query.team = mongoose.Types.ObjectId(reqQuery.team);
  }
  
  // Filter by date range
  if (reqQuery.startDate || reqQuery.endDate) {
    query.submissionDate = {};
    
    if (reqQuery.startDate) {
      query.submissionDate.$gte = new Date(reqQuery.startDate);
    }
    
    if (reqQuery.endDate) {
      query.submissionDate.$lte = new Date(reqQuery.endDate);
    }
  }
  
  return query;
};

// Get summary stats
exports.getSummary = async (req, res) => {
  try {
    const houseQuery = buildQuery(req.query);
    
    // Get counts
    const totalHouses = await House.countDocuments(houseQuery);
    const totalTeams = await Team.countDocuments();
    const totalAreas = await Area.countDocuments();
    
    // Get house IDs for person query
    const houses = await House.find(houseQuery).select('_id');
    const houseIds = houses.map(house => house._id);
    
    // Get people count and gender distribution
    const personQuery = { house: { $in: houseIds } };
    const totalPeople = await Person.countDocuments(personQuery);
    
    const genderDistribution = await Person.aggregate([
      { $match: personQuery },
      { $group: {
        _id: '$gender',
        count: { $sum: 1 }
      }}
    ]);
    
    // Format gender distribution
    const genderCounts = {
      male: 0,
      female: 0,
      other: 0
    };
    
    genderDistribution.forEach(item => {
      if (item._id === 'Male') genderCounts.male = item.count;
      if (item._id === 'Female') genderCounts.female = item.count;
      if (item._id === 'Other') genderCounts.other = item.count;
    });
    
    res.status(200).json({
      success: true,
      data: {
        totalHouses,
        totalPeople,
        totalTeams,
        totalAreas,
        avgPeoplePerHouse: totalHouses > 0 ? (totalPeople / totalHouses).toFixed(2) : 0,
        genderDistribution: genderCounts
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get stats by team
exports.getStatsByTeam = async (req, res) => {
  try {
    const query = buildQuery(req.query);
    
    const teamStats = await House.aggregate([
      { $match: query },
      { $group: {
        _id: '$team',
        houses: { $sum: 1 }
      }},
      { $lookup: {
        from: 'teams',
        localField: '_id',
        foreignField: '_id',
        as: 'teamInfo'
      }},
      { $unwind: '$teamInfo' },
      { $project: {
        _id: 1,
        name: '$teamInfo.name',
        houses: 1
      }}
    ]);
    
    // Get house IDs for each team
    const teamIds = teamStats.map(team => team._id);
    
    // For each team, get people count
    for (const team of teamStats) {
      const houses = await House.find({ team: team._id }).select('_id');
      const houseIds = houses.map(house => house._id);
      
      const peopleCount = await Person.countDocuments({ house: { $in: houseIds } });
      team.people = peopleCount;
      team.avgPeoplePerHouse = team.houses > 0 ? (peopleCount / team.houses).toFixed(2) : 0;
    }
    
    res.status(200).json({
      success: true,
      data: teamStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get stats by area
exports.getStatsByArea = async (req, res) => {
  try {
    const query = buildQuery(req.query);
    
    const areaStats = await House.aggregate([
      { $match: query },
      { $group: {
        _id: '$area',
        houses: { $sum: 1 }
      }},
      { $lookup: {
        from: 'areas',
        localField: '_id',
        foreignField: '_id',
        as: 'areaInfo'
      }},
      { $unwind: '$areaInfo' },
      { $project: {
        _id: 1,
        name: '$areaInfo.name',
        houses: 1
      }}
    ]);
    
    // For each area, get people count and gender distribution
    for (const area of areaStats) {
      const houses = await House.find({ area: area._id }).select('_id');
      const houseIds = houses.map(house => house._id);
      
      const peopleCount = await Person.countDocuments({ house: { $in: houseIds } });
      area.people = peopleCount;
      
      const genderDistribution = await Person.aggregate([
        { $match: { house: { $in: houseIds } } },
        { $group: {
          _id: '$gender',
          count: { $sum: 1 }
        }}
      ]);
      
      const genderCounts = {
        male: 0,
        female: 0,
        other: 0
      };
      
      genderDistribution.forEach(item => {
        if (item._id === 'Male') genderCounts.male = item.count;
        if (item._id === 'Female') genderCounts.female = item.count;
        if (item._id === 'Other') genderCounts.other = item.count;
      });
      
      area.genderDistribution = genderCounts;
    }
    
    res.status(200).json({
      success: true,
      data: areaStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get stats by time
exports.getStatsByTime = async (req, res) => {
  try {
    const query = buildQuery(req.query);
    
    // Group by day
    const timeStats = await House.aggregate([
      { $match: query },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$submissionDate' } },
        houses: { $sum: 1 }
      }},
      { $sort: { _id: 1 } },
      { $project: {
        _id: 0,
        date: '$_id',
        houses: 1
      }}
    ]);
    
    // For each day, get people count
    for (const day of timeStats) {
      const startDate = new Date(day.date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(day.date);
      endDate.setHours(23, 59, 59, 999);
      
      const houses = await House.find({
        ...query,
        submissionDate: {
          $gte: startDate,
          $lte: endDate
        }
      }).select('_id');
      
      const houseIds = houses.map(house => house._id);
      
      const peopleCount = await Person.countDocuments({ house: { $in: houseIds } });
      day.people = peopleCount;
    }
    
    res.status(200).json({
      success: true,
      data: timeStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};