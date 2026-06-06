const bcrypt = require('bcryptjs');

exports.seed = async function seed(knex) {
  await knex('playlist_song').del();
  await knex('playlists').del();
  await knex('songs').del();
  await knex('users').del();

  const passwordHash = await bcrypt.hash('password123', 10);

  const [alice] = await knex('users')
    .insert({
      full_name: 'Alice Nguyen',
      email: 'alice@example.com',
      password_hash: passwordHash
    })
    .returning('*');

  const [bob] = await knex('users')
    .insert({
      full_name: 'Bob Tran',
      email: 'bob@example.com',
      password_hash: passwordHash
    })
    .returning('*');

  const songs = await knex('songs')
    .insert([
      {
        title: 'Morning Signal',
        artist: 'Luna Park',
        duration_seconds: 212,
        genre: 'Pop',
        audio_url: 'https://cdn.example.com/audio/morning-signal.mp3'
      },
      {
        title: 'City Lights',
        artist: 'The Metro Lines',
        duration_seconds: 185,
        genre: 'Indie',
        audio_url: 'https://cdn.example.com/audio/city-lights.mp3'
      },
      {
        title: 'Ocean Drive',
        artist: 'Kai Rivers',
        duration_seconds: 240,
        genre: 'Electronic',
        audio_url: 'https://cdn.example.com/audio/ocean-drive.mp3'
      },
      {
        title: 'Soft Rain',
        artist: 'Minh Anh',
        duration_seconds: 198,
        genre: 'Acoustic',
        audio_url: 'https://cdn.example.com/audio/soft-rain.mp3'
      },
      {
        title: 'After Hours',
        artist: 'North Studio',
        duration_seconds: 226,
        genre: 'R&B',
        audio_url: 'https://cdn.example.com/audio/after-hours.mp3'
      }
    ])
    .returning('*');

  const [publicPlaylist] = await knex('playlists')
    .insert({
      user_id: alice.id,
      name: 'Public Favorites',
      description: 'Songs shared with everyone.',
      is_public: true
    })
    .returning('*');

  const [privatePlaylist] = await knex('playlists')
    .insert({
      user_id: alice.id,
      name: 'Private Mix',
      description: 'Personal listening queue.',
      is_public: false
    })
    .returning('*');

  const [bobPlaylist] = await knex('playlists')
    .insert({
      user_id: bob.id,
      name: 'Weekend Rotation',
      description: 'Public playlist from Bob.',
      is_public: true
    })
    .returning('*');

  await knex('playlist_song').insert([
    { playlist_id: publicPlaylist.id, song_id: songs[0].id, order_number: 1 },
    { playlist_id: publicPlaylist.id, song_id: songs[1].id, order_number: 2 },
    { playlist_id: privatePlaylist.id, song_id: songs[2].id, order_number: 1 },
    { playlist_id: privatePlaylist.id, song_id: songs[3].id, order_number: 2 },
    { playlist_id: bobPlaylist.id, song_id: songs[4].id, order_number: 1 }
  ]);
};
