const express = require('express');

const prisma = require('../prisma');

const { requireAuth } = require('../middleware/auth');

const router = express.Router();

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
      },
    });

    res.json(
      posts.map((post) => ({
        id: post.id,
        content: post.content,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        author: post.author,
        likeCount: post._count.likes,
        commentCount: post._count.comments,
        isLiked: post.likes.length > 0,
      }))
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

module.exports = router;