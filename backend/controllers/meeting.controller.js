/**
 * 📅 Réunions du membre connecté (celles où il est participant)
 * GET /api/meetings/my-meetings
 */
exports.getMyMeetings = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId, {
      include: [{
        model: Meeting,
        as: 'meetings',
        include: [
          {
            model: User,
            as: 'participants',
            attributes: ['id', 'firstName', 'lastName', 'avatarUrl'],
            through: { attributes: [] }
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName']
          }
        ]
      }]
    });

    const meetings = user?.meetings || [];

    res.status(200).json({ success: true, data: { meetings } });
  } catch (error) {
    console.error('❌ Erreur mes réunions:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

const { Meeting, User, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * 📅 Obtenir les réunions du manager connecté
 * GET /api/meetings
 */
exports.getMeetings = async (req, res) => {
  try {
    const managerId = req.user.id;

    const meetings = await Meeting.findAll({
      where: { createdBy: managerId },
      order: [['scheduledAt', 'ASC']],
      include: [
        {
          model: User,
          as: 'participants',
          attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'],
          through: { attributes: [] }
        }
      ]
    });

    res.status(200).json({ success: true, data: { meetings } });
  } catch (error) {
    console.error('❌ Erreur récupération réunions:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

/**
 * ➕ Créer une réunion
 * POST /api/meetings
 */
exports.createMeeting = async (req, res) => {
  try {
    const { title, scheduledAt, duration, description, meetLink, participants } = req.body;
    const managerId = req.user.id;

    if (!title || !scheduledAt) {
      return res.status(400).json({ success: false, message: 'Titre et date/heure sont requis' });
    }

    const meeting = await Meeting.create({
      title: title.trim(),
      scheduledAt: new Date(scheduledAt),
      duration: duration || 60,
      description: description || null,
      meetLink: meetLink || null,
      createdBy: managerId
    });

    // Associer les participants
    if (participants && participants.length > 0) {
      const users = await User.findAll({ where: { id: participants } });
      await meeting.setParticipants(users);
    }

    // Recharger avec les relations
    const meetingWithRelations = await Meeting.findByPk(meeting.id, {
      include: [{
        model: User,
        as: 'participants',
        attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'],
        through: { attributes: [] }
      }]
    });

    console.log('✅ Réunion créée:', { id: meeting.id, title: meeting.title, by: req.user.email });

    res.status(201).json({
      success: true,
      message: 'Réunion créée avec succès',
      data: { meeting: meetingWithRelations }
    });
  } catch (error) {
    console.error('❌ Erreur création réunion:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

/**
 * ✏️ Modifier une réunion
 * PUT /api/meetings/:id
 */
exports.updateMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, scheduledAt, duration, description, meetLink, participants } = req.body;
    const managerId = req.user.id;

    const meeting = await Meeting.findOne({ where: { id, createdBy: managerId } });

    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Réunion non trouvée' });
    }

    if (title)       meeting.title       = title.trim();
    if (scheduledAt) meeting.scheduledAt = new Date(scheduledAt);
    if (duration)    meeting.duration    = parseInt(duration);
    meeting.description = description || null;
    meeting.meetLink    = meetLink    || null;

    await meeting.save();

    if (participants !== undefined) {
      const users = await User.findAll({ where: { id: participants } });
      await meeting.setParticipants(users);
    }

    const updated = await Meeting.findByPk(meeting.id, {
      include: [{
        model: User,
        as: 'participants',
        attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'],
        through: { attributes: [] }
      }]
    });

    console.log('✅ Réunion modifiée:', { id: meeting.id, by: req.user.email });

    res.status(200).json({
      success: true,
      message: 'Réunion modifiée avec succès',
      data: { meeting: updated }
    });
  } catch (error) {
    console.error('❌ Erreur modification réunion:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};


/**
 * 🗑️ Supprimer une réunion
 * DELETE /api/meetings/:id
 */
exports.deleteMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const managerId = req.user.id;

    const meeting = await Meeting.findOne({ where: { id, createdBy: managerId } });

    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Réunion non trouvée' });
    }

    await meeting.destroy();

    res.status(200).json({ success: true, message: 'Réunion supprimée avec succès' });
  } catch (error) {
    console.error('❌ Erreur suppression réunion:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};