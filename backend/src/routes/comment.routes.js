const express = require('express');

const prisma = require('../prisma');

const { requireAuth } = require('../middleware/auth');

const router = express.Router();


// Get comments for a post
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
        reactions: {
          select: {
            userId: true,
            emoji: true,
          },
        },
        replies: {
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
    },
      },
    });

    const formattedComments = comments.map((comment) => {
      const reactionCounts = {};

      for (const reaction of comment.reactions) {
        reactionCounts[reaction.emoji] =
          (reactionCounts[reaction.emoji] || 0) + 1;
      }

      const myReaction = comment.reactions.find(
        (reaction) => reaction.userId === req.userId
      );

      return {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        postId: comment.postId,
        parentId: comment.parentId,
        author: comment.author,
        reactionCounts,
        myReaction: myReaction ? myReaction.emoji : null,
      };
    });

    res.json(formattedComments);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Could not load comments.',
    });
  }
});


// Add comment or reply
router.post('/posts/:postId/comments', requireAuth, async (req, res) => {
  try {
    const content = String(req.body.content || '').trim();
    const parentId = req.body.parentId || null;

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

    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: {
          id: parentId,
        },
      });

      if (!parentComment) {
        return res.status(404).json({
          message: 'Parent comment not found.',
        });
      }

      if (parentComment.postId !== post.id) {
        return res.status(400).json({
          message: 'Invalid parent comment.',
        });
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        postId: post.id,
        authorId: req.userId,
        parentId,
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
      ...comment,
      reactionCounts: {},
      myReaction: null,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Could not add comment.',
    });
  }
});


// React to a comment
router.post('/comments/:id/reaction', requireAuth, async (req, res) => {
  try {
    const emoji = String(req.body.emoji || '').trim();

    if (!emoji) {
      return res.status(400).json({
        message: 'Emoji reaction is required.',
      });
    }

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

    const existingReaction = await prisma.commentReaction.findUnique({
      where: {
        userId_commentId: {
          userId: req.userId,
          commentId: comment.id,
        },
      },
    });

    if (existingReaction) {
      if (existingReaction.emoji === emoji) {
        await prisma.commentReaction.delete({
          where: {
            userId_commentId: {
              userId: req.userId,
              commentId: comment.id,
            },
          },
        });

        return res.json({
          myReaction: null,
        });
      }

      const updatedReaction = await prisma.commentReaction.update({
        where: {
          userId_commentId: {
            userId: req.userId,
            commentId: comment.id,
          },
        },
        data: {
          emoji,
        },
      });

      return res.json({
        myReaction: updatedReaction.emoji,
      });
    }

    const reaction = await prisma.commentReaction.create({
      data: {
        userId: req.userId,
        commentId: comment.id,
        emoji,
      },
    });

    res.status(201).json({
      myReaction: reaction.emoji,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Could not update comment reaction.',
    });
  }
});


// Delete comment
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