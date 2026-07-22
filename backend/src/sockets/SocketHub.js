class SocketHub {
  static io = null;

  static attach(io) {
    SocketHub.io = io;
    io.on('connection', (socket) => {
      socket.on('joinPosition', (positionId) => socket.join(`position:${positionId}`));
      socket.on('leavePosition', (positionId) => socket.leave(`position:${positionId}`));
    });
  }

  static broadcastPost(positionId, post) {
    SocketHub.io?.to(`position:${positionId}`).emit('discussion:post', post);
  }
}

export default SocketHub;
