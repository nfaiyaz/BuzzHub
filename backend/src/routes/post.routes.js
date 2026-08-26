const express = require('express');

const prisma = require('../prisma');

const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const allowedReactionTypes = [
  'LIKE',
  'LOVE',
  'HAHA',
  'WOW',
  'SAD',
  'ANGRY',
];

router.get('/', requireAuth, async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
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

        reactions: {
          select: {
            userId: true,
            type: true,
          },
        },
      },
    });

    res.json(
      posts.map((post) => {
        const reactionCounts = {
          LIKE: 0,
          LOVE: 0,
          HAHA: 0,
          WOW: 0,
          SAD: 0,
          ANGRY: 0,
        };

        post.reactions.forEach((reaction) => {
          reactionCounts[reaction.type] += 1;
        });

        const myReaction =
          post.reactions.find(
            (reaction) => reaction.userId === req.userId
          )?.type || null;

        return {
          id: post.id,
          content: post.content,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          author: post.author,
          likeCount: post._count.likes,
          commentCount: post._count.comments,
          isLiked: post.likes.length > 0,
          reactionCounts,
          myReaction,
        };
      })
    );
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Could not load posts.',
    });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const content = String(req.body.content || '').trim();

    if (!content) {
      return res.status(400).json({
        message: 'Post content is required.',
      });
    }

    if (content.length > 1000) {
      return res.status(400).json({
        message: 'Post is too long.',
      });
    }

    const post = await prisma.post.create({
      data: {
        content,
        authorId: req.userId,
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
      },
    });

    res.status(201).json({
      ...post,
      likeCount: 0,
      commentCount: 0,
      isLiked: false,
      reactionCounts: {
        LIKE: 0,
        LOVE: 0,
        HAHA: 0,
        WOW: 0,
        SAD: 0,
        ANGRY: 0,
      },
      myReaction: null,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Could not create post.',
    });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const post = await prisma.post.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!post) {
      return res.status(404).json({
        message: 'Post not found.',
      });
    }

    if (post.authorId !== req.userId) {
      return res.status(403).json({
        message: 'You can delete only your own posts.',
      });
    }

    await prisma.post.delete({
      where: {
        id: post.id,
      },
    });

    res.json({
      message: 'Post deleted.',
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Could not delete post.',
    });
  }
});

router.post('/:id/like', requireAuth, async (req, res) => {
  try {
    const post = await prisma.post.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!post) {
      return res.status(404).json({
        message: 'Post not found.',
      });
    }

    const existing = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: req.userId,
          postId: post.id,
        },
      },
    });

    let isLiked;

    if (existing) {
      await prisma.like.delete({
        where: {
          userId_postId: {
            userId: req.userId,
            postId: post.id,
          },
        },
      });

      isLiked = false;
    } else {
      await prisma.like.create({
        data: {
          userId: req.userId,
          postId: post.id,
        },
      });

      isLiked = true;
    }

    const likeCount = await prisma.like.count({
      where: {
        postId: post.id,
      },
    });

    res.json({
      isLiked,
      likeCount,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Could not update like.',
    });
  }
});

router.post('/:id/reaction', requireAuth, async (req, res) => {
  try {
    const post = await prisma.post.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!post) {
      return res.status(404).json({
        message: 'Post not found.',
      });
    }

    const type = String(req.body.type || '').toUpperCase();

    if (!allowedReactionTypes.includes(type)) {
      return res.status(400).json({
        message: 'Invalid reaction type.',
      });
    }

    const existing = await prisma.reaction.findUnique({
      where: {
        userId_postId: {
          userId: req.userId,
          postId: post.id,
        },
      },
    });

    let myReaction = null;

    if (existing && existing.type === type) {
      await prisma.reaction.delete({
        where: {
          userId_postId: {
            userId: req.userId,
            postId: post.id,
          },
        },
      });
    } else if (existing) {
      const updated = await prisma.reaction.update({
        where: {
          userId_postId: {
            userId: req.userId,
            postId: post.id,
          },
        },
        data: {
          type,
        },
      });

      myReaction = updated.type;
    } else {
      const created = await prisma.reaction.create({
        data: {
          type,
          userId: req.userId,
          postId: post.id,
        },
      });

      myReaction = created.type;
    }

    const reactionRows = await prisma.reaction.findMany({
      where: {
        postId: post.id,
      },
      select: {
        type: true,
      },
    });

    const reactionCounts = {
      LIKE: 0,
      LOVE: 0,
      HAHA: 0,
      WOW: 0,
      SAD: 0,
      ANGRY: 0,
    };

    reactionRows.forEach((reaction) => {
      reactionCounts[reaction.type] += 1;
    });

    if (!myReaction) {
      const current = await prisma.reaction.findUnique({
        where: {
          userId_postId: {
            userId: req.userId,
            postId: post.id,
          },
        },
        select: {
          type: true,
        },
      });

      myReaction = current?.type || null;
    }

    res.json({
      reactionCounts,
      myReaction,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Could not update reaction.',
    });
  }
});

module.exports = router;