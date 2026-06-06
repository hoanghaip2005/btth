const { grpc, loadPackage } = require('../lib/grpcLoader');
const config = require('../lib/config');

const authPackage = loadPackage('auth.proto', 'auth');
const songPackage = loadPackage('song.proto', 'song');
const playlistPackage = loadPackage('playlist.proto', 'playlist');

function createClient(Service, url) {
  return new Service(url, grpc.credentials.createInsecure());
}

function unary(client, method, payload = {}) {
  return new Promise((resolve, reject) => {
    client[method](payload, (error, response) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(response);
    });
  });
}

const authClient = createClient(authPackage.AuthService, config.grpc.authUrl);
const songClient = createClient(songPackage.SongService, config.grpc.songUrl);
const playlistClient = createClient(playlistPackage.PlaylistService, config.grpc.playlistUrl);

module.exports = {
  auth: {
    register: (payload) => unary(authClient, 'register', payload),
    login: (payload) => unary(authClient, 'login', payload),
    me: (payload) => unary(authClient, 'me', payload),
    logout: (payload) => unary(authClient, 'logout', payload)
  },
  song: {
    listSongs: (payload) => unary(songClient, 'listSongs', payload),
    getSong: (payload) => unary(songClient, 'getSong', payload)
  },
  playlist: {
    listMyPlaylists: (payload) => unary(playlistClient, 'listMyPlaylists', payload),
    getPlaylist: (payload) => unary(playlistClient, 'getPlaylist', payload),
    listPublicPlaylists: (payload) => unary(playlistClient, 'listPublicPlaylists', payload),
    createPlaylist: (payload) => unary(playlistClient, 'createPlaylist', payload),
    updatePlaylist: (payload) => unary(playlistClient, 'updatePlaylist', payload),
    deletePlaylist: (payload) => unary(playlistClient, 'deletePlaylist', payload),
    addSongToPlaylist: (payload) => unary(playlistClient, 'addSongToPlaylist', payload),
    removeSongFromPlaylist: (payload) => unary(playlistClient, 'removeSongFromPlaylist', payload)
  }
};
