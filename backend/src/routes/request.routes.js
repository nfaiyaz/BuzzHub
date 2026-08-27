const express = require('express');

const prisma = require('../prisma');

const { requireAuth } = require('../middleware/auth');

const router = express.Router();


// Send friend request
router.post('/:username/request', requireAuth, async (req, res) => {
  try {
    const username = req.params.username.toLowerCase();

    const target = await prisma.user.findUnique({
      where: {
        username,
      },
    });

    if (!target) {
      return res.status(404).json({
        message: 'User not found.',
      });
    }

    if (target.id === req.userId) {
      return res.status(400).json({
        message: 'You cannot send a request to yourself.',
      });
    }

    const existingRequest = await prisma.friendRequest.findUnique({
      where: {
        senderId_receiverId: {
          senderId: req.userId,
          receiverId: target.id,
        },
      },
    });

    if (existingRequest) {
      if (existingRequest.status === 'PENDING') {
        return res.status(409).json({
          message: 'Request already pending.',
          status: 'PENDING',
        });
      }

      if (existingRequest.status === 'ACCEPTED') {
        return res.status(409).json({
          message: 'You are already connected with this user.',
          status: 'ACCEPTED',
        });
      }

      await prisma.friendRequest.update({
        where: {
          id: existingRequest.id,
        },
        data: {
          status: 'PENDING',
        },
      });

      return res.status(201).json({
        message: 'Friend request sent.',
        status: 'PENDING',
      });
    }

    const reverseRequest = await prisma.friendRequest.findUnique({
      where: {
        senderId_receiverId: {
          senderId: target.id,
          receiverId: req.userId,
        },
      },
    });

    if (reverseRequest && reverseRequest.status === 'PENDING') {
      return res.status(409).json({
        message: 'This user has already sent you a request.',
        status: 'PENDING',
        requestId: reverseRequest.id,
      });
    }

    const request = await prisma.friendRequest.create({
      data: {
        senderId: req.userId,
        receiverId: target.id,
      },
    });

    res.status(201).json({
      message: 'Friend request sent.',
      status: request.status,
      requestId: request.id,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Could not send friend request.',
    });
  }
});


// Get received requests
router.get('/requests/received', requireAuth, async (req, res) => {
  try {
    const requests = await prisma.friendRequest.findMany({
      where: {
        receiverId: req.userId,
        status: 'PENDING',
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.json(requests);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Could not load received requests.',
    });
  }
});


// Get sent requests
router.get('/requests/sent', requireAuth, async (req, res) => {
  try {
    const requests = await prisma.friendRequest.findMany({
      where: {
        senderId: req.userId,
        status: 'PENDING',
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        receiver: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.json(requests);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Could not load sent requests.',
    });
  }
});


// Accept request
router.post('/requests/:id/accept', requireAuth, async (req, res) => {
  try {
    const request = await prisma.friendRequest.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!request) {
      return res.status(404).json({
        message: 'Friend request not found.',
      });
    }

    if (request.receiverId !== req.userId) {
      return res.status(403).json({
        message: 'You cannot accept this request.',
      });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({
        message: 'This request is no longer pending.',
      });
    }

    const updatedRequest = await prisma.friendRequest.update({
      where: {
        id: request.id,
      },
      data: {
        status: 'ACCEPTED',
      },
    });

    res.json({
      message: 'Friend request accepted.',
      status: updatedRequest.status,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Could not accept friend request.',
    });
  }
});


// Reject request
router.post('/requests/:id/reject', requireAuth, async (req, res) => {
  try {
    const request = await prisma.friendRequest.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!request) {
      return res.status(404).json({
        message: 'Friend request not found.',
      });
    }

    if (request.receiverId !== req.userId) {
      return res.status(403).json({
        message: 'You cannot reject this request.',
      });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({
        message: 'This request is no longer pending.',
      });
    }

    const updatedRequest = await prisma.friendRequest.update({
      where: {
        id: request.id,
      },
      data: {
        status: 'REJECTED',
      },
    });

    res.json({
      message: 'Friend request rejected.',
      status: updatedRequest.status,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Could not reject friend request.',
    });
  }
});


module.exports = router;