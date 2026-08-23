const express = require('express');

const prisma = require('../prisma');

const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/posts/:postId/comments', requireAuth, async (req, res) => {
  try {
    const comments = await prisma.comment.findMany({
      where: {
        postId: req.params.postId,
      },
      orderBy: {
        createdAt: 'asc',
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

    res.json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Could not load comments.',
    });
  }
});

router.post('/posts/:postId/comments', requireAuth, async (req, res) => {
  try {
    const content = String(req.body.content || '').trim();

    if (!content) {
      return res.status(400).json({
        message: 'Comment is required.',
      });
    }

    if (content.length > 500) {
      return res.status(400).json({
        message: 'Comment is too long.',
      });
    }

    const post = await prisma.post.findUnique({
      where: {
        id: req.params.postId,
      },
    });

    if (!post) {
      return res.status(404).json({
        message: 'Post not found.',
      });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        postId: post.id,
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

    res.status(201).json(comment);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Could not add comment.',
    });
  }
});

router.delete('/comments/:id', requireAuth, async (req, res) => {
  try {
    const comment = await prisma.comment.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!comment) {
      return res.status(404).json({
        message: 'Comment not found.',
      });
    }

    if (comment.authorId !== req.userId) {
      return res.status(403).json({
        message: 'You can delete only your own comments.',
      });
    }

    await prisma.comment.delete({
      where: {
        id: comment.id,
      },
    });

    res.json({
      message: 'Comment deleted.',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Could not delete comment.',
    });
  }
});

module.exports = router;