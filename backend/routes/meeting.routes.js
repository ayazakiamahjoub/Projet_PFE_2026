const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meeting.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdminOrManager } = require('../middleware/admin.middleware');

router.use(authenticate);

// Accessible à tous les rôles : voir ses propres réunions
router.get('/my-meetings', meetingController.getMyMeetings);

// Manager et admin uniquement
router.get('/',       isAdminOrManager, meetingController.getMeetings);
router.post('/',      isAdminOrManager, meetingController.createMeeting);
router.put('/:id',    isAdminOrManager, meetingController.updateMeeting);
router.delete('/:id', isAdminOrManager, meetingController.deleteMeeting);

module.exports = router;