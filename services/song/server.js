const db = require('../../db/connection');
const config = require('../../lib/config');
const { loadPackage, startGrpcServer } = require('../../lib/grpcLoader');
const { invalidArgument, notFound, wrapUnary } = require('../../lib/grpcErrors');
const { normalizePagination, pageInfo } = require('../../lib/pagination');

const songPackage = loadPackage('song.proto', 'song');

function toIsoString(value) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
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

async function listSongs(request) {
  const { page, limit, offset } = normalizePagination(request.page, request.limit);
  const [{ count }] = await db('songs').count({ count: '*' });
  const total = Number(count);
  const rows = await db('songs')
    .select('*')
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset);

  return {
    items: rows.map(mapSong),
    pageInfo: pageInfo(page, limit, total)
  };
}

async function getSong(request) {
  if (!request.id) {
    throw invalidArgument('Song id is required');
  }

  const song = await db('songs').where({ id: request.id }).first();
  if (!song) {
    throw notFound('Song was not found');
  }

  return mapSong(song);
}

startGrpcServer({
  url: config.grpc.songUrl,
  service: songPackage.SongService.service,
  handlers: {
    listSongs: wrapUnary(listSongs),
    getSong: wrapUnary(getSong)
  },
  name: 'SongService'
});
