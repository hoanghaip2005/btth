const { GraphQLError } = require('graphql');
const clients = require('./grpcClients');
const { grpc } = require('../lib/grpcLoader');

function graphQLErrorFromGrpc(error) {
  const grpcCode = error.code;
  const message = error.details || error.message || 'Internal server error';
  const codeByGrpcStatus = {
    [grpc.status.INVALID_ARGUMENT]: 'BAD_USER_INPUT',
    [grpc.status.NOT_FOUND]: 'NOT_FOUND',
    [grpc.status.ALREADY_EXISTS]: 'CONFLICT',
    [grpc.status.PERMISSION_DENIED]: 'FORBIDDEN',
    [grpc.status.UNAUTHENTICATED]: 'UNAUTHENTICATED'
  };

  return new GraphQLError(message, {
    extensions: {
      code: codeByGrpcStatus[grpcCode] || 'INTERNAL_SERVER_ERROR'
    }
  });
}

async function callGrpc(operation) {
  try {
    return await operation();
  } catch (error) {
    throw graphQLErrorFromGrpc(error);
  }
}

async function requireUser(token) {
  if (!token) {
    throw new GraphQLError('Authentication is required', {
      extensions: { code: 'UNAUTHENTICATED' }
    });
  }

  return callGrpc(() => clients.auth.me({ token }));
}

async function optionalUserId(token) {
  if (!token) {
    return '';
  }

  try {
    const user = await clients.auth.me({ token });
    return user.id;
  } catch (error) {
    return '';
  }
}

module.exports = {
  Query: {
    me: async (_parent, _args, context) => {
      if (!context.token) {
        return null;
      }

      return callGrpc(() => clients.auth.me({ token: context.token }));
    },
    songs: (_parent, args) => callGrpc(() => clients.song.listSongs(args)),
    song: (_parent, args) => callGrpc(() => clients.song.getSong({ id: args.id })),
    myPlaylists: async (_parent, _args, context) => {
      const user = await requireUser(context.token);
      const response = await callGrpc(() => clients.playlist.listMyPlaylists({ userId: user.id }));
      return response.items || [];
    },
    playlist: async (_parent, args, context) => {
      const userId = await optionalUserId(context.token);
      return callGrpc(() => clients.playlist.getPlaylist({ id: args.id, userId }));
    },
    publicPlaylists: (_parent, args) => callGrpc(() => clients.playlist.listPublicPlaylists(args))
  },
  Mutation: {
    register: (_parent, args) => callGrpc(() => clients.auth.register(args)),
    login: (_parent, args) => callGrpc(() => clients.auth.login(args)),
    logout: async (_parent, _args, context) => {
      const user = await requireUser(context.token);
      const response = await callGrpc(() => clients.auth.logout({ token: context.token, userId: user.id }));
      return Boolean(response.value);
    },
    createPlaylist: async (_parent, args, context) => {
      const user = await requireUser(context.token);
      return callGrpc(() =>
        clients.playlist.createPlaylist({
          userId: user.id,
          name: args.name,
          description: args.description || '',
          isPublic: args.isPublic
        })
      );
    },
    updatePlaylist: async (_parent, args, context) => {
      const user = await requireUser(context.token);
      return callGrpc(() =>
        clients.playlist.updatePlaylist({
          userId: user.id,
          id: args.id,
          name: args.name || '',
          hasName: args.name !== undefined && args.name !== null,
          description: args.description || '',
          hasDescription: args.description !== undefined,
          isPublic: Boolean(args.isPublic),
          hasIsPublic: args.isPublic !== undefined && args.isPublic !== null
        })
      );
    },
    deletePlaylist: async (_parent, args, context) => {
      const user = await requireUser(context.token);
      const response = await callGrpc(() =>
        clients.playlist.deletePlaylist({
          userId: user.id,
          id: args.id
        })
      );
      return Boolean(response.value);
    },
    addSongToPlaylist: async (_parent, args, context) => {
      const user = await requireUser(context.token);
      return callGrpc(() =>
        clients.playlist.addSongToPlaylist({
          userId: user.id,
          playlistId: args.playlistId,
          songId: args.songId
        })
      );
    },
    removeSongFromPlaylist: async (_parent, args, context) => {
      const user = await requireUser(context.token);
      return callGrpc(() =>
        clients.playlist.removeSongFromPlaylist({
          userId: user.id,
          playlistId: args.playlistId,
          songId: args.songId
        })
      );
    }
  },
  SongPage: {
    pageInfo: (value) => value.pageInfo
  },
  PlaylistPage: {
    pageInfo: (value) => value.pageInfo
  }
};
