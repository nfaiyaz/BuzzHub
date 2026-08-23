const express = require('express');

const prisma = require('../prisma');

const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/:username/follow', requireAuth, async (req, res) => {
  try {
    const target = await prisma.user.findUnique({
      where: {
        username: req.params.username.toLowerCase(),
      },
    });

    if (!target) {
      return res.status(404).json({
        message: 'User not found.',
      });
    }

    if (target.id === req.userId) {
      return res.status(400).json({
        message: 'You cannot follow yourself.',
      });
    }

    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: req.userId,
          followingId: target.id,
        },
      },
    });

    let isFollowing;

    if (existing) {
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: req.userId,
            followingId: target.id,
          },
        },
      });

      isFollowing = false;
    } else {
      await prisma.follow.create({
        data: {
          followerId: req.userId,
          followingId: target.id,
        },
      });

      isFollowing = true;
    }

    const followerCount = await prisma.follow.count({
      where: {
        followingId: target.id,
      },
    });

    const followingCount = await prisma.follow.count({
      where: {
        followerId: target.id,
      },
    });

    res.json({
      isFollowing,
      followerCount,
      followingCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Could not update follow status.',
    });
  }
});

router.get('/:username/followers', requireAuth, async (req, res) => {
  const target = await prisma.user.findUnique({
    where: {
      username: req.params.username.toLowerCase(),
    },
  });

  if (!target) {
    return res.status(404).json({
      message: 'User not found.',
    });
  }

  const rows = await prisma.follow.findMany({
    where: {
      followingId: target.id,
    },
    include: {
      followerUser: {
        select: {
          id: true,
          name: true,
          username: true,
          avatarUrl: true,
        },
      },
    },
  });

  res.json(rows.map((row) => row.followerUser));
});

router.get('/:username/following', requireAuth, async (req, res) => {
  const target = await prisma.user.findUnique({
    where: {
      username: req.params.username.toLowerCase(),
    },
  });

  if (!target) {
    return res.status(404).json({
      message: 'User not found.',
    });
  }

  const rows = await prisma.follow.findMany({
    where: {
      followerId: target.id,
    },
    include: {
      followingUser: {
        select: {
          id: true,
          name: true,
          username: true,
          avatarUrl: true,
        },
      },
    },
  });

  res.json(rows.map((row) => row.followingUser));
});

module.exports = router;