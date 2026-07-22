import { DiscussionPost, User } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import SocketHub from '../sockets/SocketHub.js';

const AUTHOR_INCLUDE = { model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'role'] };

class DiscussionController {
  list = asyncHandler(async (req, res) => {
    const posts = await DiscussionPost.findAll({
      where: { positionId: req.params.positionId },
      include: [AUTHOR_INCLUDE],
      order: [['createdAt', 'ASC']],
    });
    res.json(posts);
  });

  create = asyncHandler(async (req, res) => {
    const { content } = req.body;
    if (!content?.trim()) throw ApiError.badRequest('Post content cannot be empty');

    const post = await DiscussionPost.create({ positionId: req.params.positionId, authorId: req.user.id, content });
    const full = await DiscussionPost.findByPk(post.id, { include: [AUTHOR_INCLUDE] });

    SocketHub.broadcastPost(req.params.positionId, full);
    res.status(201).json(full);
  });
}

export default new DiscussionController();
