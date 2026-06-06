const db = require('../../db/connection');
const config = require('../../lib/config');
const { loadPackage, startGrpcServer } = require('../../lib/grpcLoader');
const {
  invalidArgument,
  notFound,
  permissionDenied,
  unauthenticated,
  wrapUnary
} = require('../../lib/grpcErrors');
const { normalizePagination, pageInfo } = require('../../lib/pagination');

const playlistPackage = loadPackage('playlist.proto', 'playlist');

function toIsoString(value) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function requireUserId(userId) {
  if (!userId) {
    throw unauthenticated();
  }
}

function mapSummary(row) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description || '',
    isPublic: Boolean(row.is_public),
    createdAt: toIsoString(row.created_at)
  };
}

function mapSong(row) {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    durationSeconds: row.duration_seconds,
    genre: row.genre,
    audioUrl: row.audio_url,
    createdAt: toIsoString(row.created_at)
  };
}

async function songsForPlaylist(playlistId) {
  const rows = await db('playlist_song')
    .join('songs', 'songs.id', 'playlist_song.song_id')
    .select('songs.*')
    .where('playlist_song.playlist_id', playlistId)
    .orderBy('playlist_song.order_number', 'asc');

  return rows.map(mapSong);
}

async function mapPlaylist(row) {
  return {
    ...mapSummary(row),
    songs: await songsForPlaylist(row.id)
  };
}

async function findPlaylist(id) {
  if (!id) {
    throw invalidArgument('Playlist id is required');
  }

  const playlist = await db('playlists').where({ id }).first();
  if (!playlist) {
    throw notFound('Playlist was not found');
  }

  return playlist;
}

function assertOwner(playlist, userId) {
  requireUserId(userId);
  if (playlist.user_id !== userId) {
    throw permissionDenied('Only playlist owner can perform this action');
  }
}

async function listMyPlaylists(request) {
  requireUserId(request.userId);

  const rows = await db('playlists')
    .select('*')
    .where({ user_id: request.userId })
    .orderBy('created_at', 'desc');

  return { items: rows.map(mapSummary) };
}

async function getPlaylist(request) {
  const playlist = await findPlaylist(request.id);
  const isOwner = request.userId && playlist.user_id === request.userId;

  if (!playlist.is_public && !isOwner) {
    throw permissionDenied('Private playlist can only be viewed by its owner');
  }

  return mapPlaylist(playlist);
}

async function listPublicPlaylists(request) {
  const { page, limit, offset } = normalizePagination(request.page, request.limit);
  const [{ count }] = await db('playlists').where({ is_public: true }).count({ count: '*' });
  const total = Number(count);
  const rows = await db('playlists')
    .select('*')
    .where({ is_public: true })
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset);

  return {
    items: rows.map(mapSummary),
    pageInfo: pageInfo(page, limit, total)
  };
}

async function createPlaylist(request) {
  requireUserId(request.userId);

  const name = String(request.name || '').trim();
  if (!name) {
    throw invalidArgument('Playlist name is required');
  }

  const [playlist] = await db('playlists')
    .insert({
      user_id: request.userId,
      name,
      description: request.description || null,
      is_public: Boolean(request.isPublic)
    })
    .returning('*');

  return mapSummary(playlist);
}

async function updatePlaylist(request) {
  const playlist = await findPlaylist(request.id);
  assertOwner(playlist, request.userId);

  const patch = {};
  if (request.hasName) {
    const name = String(request.name || '').trim();
    if (!name) {
      throw invalidArgument('Playlist name cannot be empty');
    }
    patch.name = name;
  }

  if (request.hasDescription) {
    patch.description = request.description || null;
  }

  if (request.hasIsPublic) {
    patch.is_public = Boolean(request.isPublic);
  }

  if (Object.keys(patch).length === 0) {
    return mapSummary(playlist);
  }

  const [updated] = await db('playlists')
    .where({ id: playlist.id })
    .update(patch)
    .returning('*');

  return mapSummary(updated);
}

async function deletePlaylist(request) {
  const playlist = await findPlaylist(request.id);
  assertOwner(playlist, request.userId);

  await db('playlists').where({ id: playlist.id }).del();
  return { value: true };
}

async function addSongToPlaylist(request) {
  const playlist = await findPlaylist(request.playlistId);
  assertOwner(playlist, request.userId);

  const song = await db('songs').where({ id: request.songId }).first();
  if (!song) {
    throw notFound('Song was not found');
  }

  const existing = await db('playlist_song')
    .where({
      playlist_id: playlist.id,
      song_id: song.id
    })
    .first();

  if (!existing) {
    const [{ max }] = await db('playlist_song')
      .where({ playlist_id: playlist.id })
      .max({ max: 'order_number' });

    await db('playlist_song').insert({
      playlist_id: playlist.id,
      song_id: song.id,
      order_number: Number(max || 0) + 1
    });
  }

  return mapPlaylist(playlist);
}

async function removeSongFromPlaylist(request) {
  const playlist = await findPlaylist(request.playlistId);
  assertOwner(playlist, request.userId);

  await db.transaction(async (trx) => {
    await trx('playlist_song')
      .where({
        playlist_id: playlist.id,
        song_id: request.songId
      })
      .del();

    const rows = await trx('playlist_song')
      .where({ playlist_id: playlist.id })
      .select('song_id')
      .orderBy('order_number', 'asc');

    for (let index = 0; index < rows.length; index += 1) {
      await trx('playlist_song')
        .where({
          playlist_id: playlist.id,
          song_id: rows[index].song_id
        })
        .update({ order_number: index + 1 });
    }
  });

  return mapPlaylist(playlist);
}

startGrpcServer({
  url: config.grpc.playlistUrl,
  service: playlistPackage.PlaylistService.service,
  handlers: {
    listMyPlaylists: wrapUnary(listMyPlaylists),
    getPlaylist: wrapUnary(getPlaylist),
    listPublicPlaylists: wrapUnary(listPublicPlaylists),
    createPlaylist: wrapUnary(createPlaylist),
    updatePlaylist: wrapUnary(updatePlaylist),
    deletePlaylist: wrapUnary(deletePlaylist),
    addSongToPlaylist: wrapUnary(addSongToPlaylist),
    removeSongFromPlaylist: wrapUnary(removeSongFromPlaylist)
  },
  name: 'PlaylistService'
});
