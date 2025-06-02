const Team = require('../models/Team');
const User = require('../models/User');

// Get all teams
exports.getTeams = async (req, res) => {
  try {
    const teams = await Team.find().populate('mainMembers', 'name email');
    res.status(200).json({
      success: true,
      count: teams.length,
      data: teams
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single team
exports.getTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id).populate('mainMembers', 'name email');
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    res.status(200).json({
      success: true,
      data: team
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create team
exports.createTeam = async (req, res) => {
  try {
    // Add current user as creator
    req.body.createdBy = req.user.id;
    
    const team = await Team.create(req.body);
    
    res.status(201).json({
      success: true,
      data: team
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update team
exports.updateTeam = async (req, res) => {
  try {
    let team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    team = await Team.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('mainMembers', 'name email');
    
    res.status(200).json({
      success: true,
      data: team
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete team
exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    await team.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add member to team
exports.addMember = async (req, res) => {
  try {
    const { userId, isMainMember } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'Please provide a user ID' });
    }
    
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user's team
    user.team = team._id;
    user.isMainMember = isMainMember || false;
    await user.save();
    
    // If main member, add to team's mainMembers array
    if (isMainMember) {
      if (!team.mainMembers.includes(userId)) {
        team.mainMembers.push(userId);
        await team.save();
      }
    }
    
    res.status(200).json({
      success: true,
      data: team
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove member from team
exports.removeMember = async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'Please provide a user ID' });
    }
    
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove team from user
    user.team = undefined;
    user.isMainMember = false;
    await user.save();
    
    // Remove from mainMembers if present
    team.mainMembers = team.mainMembers.filter(
      member => member.toString() !== userId
    );
    await team.save();
    
    res.status(200).json({
      success: true,
      data: team
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};