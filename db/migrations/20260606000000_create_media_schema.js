exports.up = async function up(knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('full_name').notNullable();
    table.string('email').notNullable().unique();
    table.string('password_hash').notNullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('songs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('title').notNullable();
    table.string('artist').notNullable();
    table.integer('duration_seconds').notNullable();
    table.string('genre').notNullable();
    table.text('audio_url').notNullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('playlists', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('name').notNullable();
    table.text('description');
    table.boolean('is_public').notNullable().defaultTo(false);
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('playlist_song', (table) => {
    table.uuid('playlist_id').notNullable().references('id').inTable('playlists').onDelete('CASCADE');
    table.uuid('song_id').notNullable().references('id').inTable('songs').onDelete('CASCADE');
    table.integer('order_number').notNullable();
    table.primary(['playlist_id', 'song_id']);
    table.unique(['playlist_id', 'order_number']);
  });

  await knex.schema.alterTable('playlists', (table) => {
    table.index(['user_id']);
    table.index(['is_public']);
  });

  await knex.schema.alterTable('songs', (table) => {
    table.index(['title']);
    table.index(['artist']);
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('playlist_song');
  await knex.schema.dropTableIfExists('playlists');
  await knex.schema.dropTableIfExists('songs');
  await knex.schema.dropTableIfExists('users');
};
