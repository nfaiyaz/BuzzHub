const express = require('express');

const prisma = require('../prisma');

const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/:username', requireAuth, async (req, res) => {
  try {
    const username = req.params.username.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: req.userId,
          followingId: user.id,
        },
      },
    });

    const request = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          {
            senderId: req.userId,
            receiverId: user.id,
          },
          {
            senderId: user.id,
            receiverId: req.userId,
          },
        ],
        status: 'PENDING',
      },
    });

    return res.json({
      ...user,
      isFollowing: Boolean(follow),
      requestStatus: request ? 'PENDING' : null,
      requestId: request?.id || null,
      requestSenderId: request?.senderId || null,
      isMe: req.userId === user.id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not load profile.' });
  }
});

router.patch('/me', requireAuth, async (req, res) => {
  try {
    const { name, bio, avatarUrl } = req.body;

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        ...(name !== undefined
          ? { name: String(name).trim() }
          : {}),

        ...(bio !== undefined
          ? { bio: String(bio).trim() }
          : {}),

        ...(avatarUrl !== undefined
          ? { avatarUrl: String(avatarUrl).trim() || null }
          : {}),
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        bio: true,
        avatarUrl: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not update profile.' });
  }
});

router.get('/:username/posts', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        username: req.params.username.toLowerCase(),
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const posts = await prisma.post.findMany({
      where: {
        authorId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
        likes: {
          where: {
            userId: req.userId,
          },
          select: {
            userId: true,
          },
        },
      },
    });

    res.json(
      posts.map((post) => ({
        ...post,
        isLiked: post.likes.length > 0,
        likes: undefined,
      }))
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Could not load user posts.',
    });
  }
});

router.get('/suggestions', requireAuth, async (req, res) => {
  try {
    const following = await prisma.follow.findMany({
      where: {
        followerId: req.userId,
      },
      select: {
        followingId: true,
      },
    });

    const followingIds = following.map(
      (follow) => follow.followingId
    );

    const users = await prisma.user.findMany({
      where: {
        id: {
          not: req.userId,
          notIn: followingIds,
        },
      },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        avatarUrl: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    const suggestions = await Promise.all(
      users.map(async (user) => {
        const request = await prisma.friendRequest.findFirst({
          where: {
            OR: [
              {
                senderId: req.userId,
                receiverId: user.id,
              },
              {
                senderId: user.id,
                receiverId: req.userId,
              },
            ],
            status: 'PENDING',
          },
        });

        return {
          ...user,
          requestStatus: request ? 'PENDING' : null,
          requestId: request?.id || null,
        };
      })
    );

    res.json(suggestions);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Could not load user suggestions.',
    });
  }
});

module.exports = router;