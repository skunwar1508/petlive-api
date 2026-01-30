const mongoose = require('mongoose');
const CMS = require('../../common-modules/index');
const ChatSession = require('../../models/chatSession.model');
const apiResponse = require('../../utils/apiResponse');

const getDoctorDashboard = async (req, res) => {
    try {
        const doctorId = req.user.id;

        // Fetch dashboard statistics from ChatSession
        const totalSessions = await ChatSession.countDocuments({
            doctorId,
            status: { $in: ['accepted', 'started', 'ended'] }
        });

        const todaySessions = await ChatSession.countDocuments({
            doctorId,
            status: { $in: ['accepted', 'started', 'ended'] },
            createdAt: {
                $gte: new Date().setHours(0, 0, 0, 0),
                $lt: new Date().setHours(23, 59, 59, 999)
            }
        });

        const totalPatients = (await ChatSession.distinct('patientId', {
            doctorId,
            status: { $in: ['accepted', 'started', 'ended'] }
        })).length;

        const upcomingSessions = await ChatSession.find({
            doctorId,
            status: { $in: ['pending', 'accepted'] }
        })
            .populate('patientId', 'name email phone')
            .populate('serviceId', 'name')
            .sort({ createdAt: 1 })
            .limit(5);

        // Fetch chat session data
        const activeChatSessions = await ChatSession.countDocuments({
            doctorId,
            status: { $in: ['accepted', 'started'] }
        });

        const completedChatSessions = await ChatSession.countDocuments({
            doctorId,
            status: 'ended'
        });

        const recentChatSessions = await ChatSession.find({ doctorId, status: { $in: ['accepted', 'started', 'ended'] } })
            .populate('patientId', 'name email phone')
            .populate('serviceId', 'name')
            .sort({ createdAt: -1 })
            .limit(5);

        // Get current month start and end dates
        const currentDate = new Date();
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);

        // Calculate monthly patients
        const monthlyPatients = await ChatSession.distinct('patientId', {
            doctorId,
            createdAt: {
                $gte: monthStart,
                $lt: monthEnd
            }
        });

        // Calculate total earning, commission, and consultation from completed sessions
        // const completedSessions = await ChatSession.find({
        //     doctorId,
        //     status: 'ended'
        // });

        let totalEarning = 0;
        let totalCommission = 0;
        let totalConsultation = 0;

        // completedSessions.forEach(session => {
        //     const fee = session.consultationFee || 0;
        //     const commission = session.commission || 0;
        //     totalEarning += fee;
        //     totalCommission += commission;
        // });

        let resData = {
            totalSessions,
            todaySessions,
            totalPatients,
            upcomingSessions,
            activeChatSessions,
            completedChatSessions,
            recentChatSessions,
            monthlyPatients: monthlyPatients.length,
            totalEarning,
            totalCommission,
            totalConsultation
        }
        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), resData);
    } catch (error) {
        return apiResponse.errorMessage(res, 500, error.message);
    };
};

module.exports = {
    getDoctorDashboard
};
