module.exports = `#graphql
type User {
  id: ID!
  fullName: String!
  email: String!
  createdAt: String!
}

type AuthPayload {
  user: User!
  token: String!
}

type Song {
  id: ID!
  title: String!
  artist: String!
  durationSeconds: Int!
  genre: String!
  audioUrl: String!
  createdAt: String!
}

type PageInfo {
  page: Int!
  limit: Int!
  total: Int!
  totalPages: Int!
}

type SongPage {
  items: [Song!]!
  pageInfo: PageInfo!
}

type PlaylistSummary {
  id: ID!
  userId: ID!
  name: String!
  description: String
  isPublic: Boolean!
  createdAt: String!
}

type Playlist {
  id: ID!
  userId: ID!
  name: String!
  description: String
  isPublic: Boolean!
  createdAt: String!
  songs: [Song!]!
}

type PlaylistPage {
  items: [PlaylistSummary!]!
  pageInfo: PageInfo!
}

type Query {
  me: User
  songs(page: Int, limit: Int): SongPage!
  song(id: ID!): Song
  myPlaylists: [PlaylistSummary!]!
  playlist(id: ID!): Playlist
  publicPlaylists(page: Int, limit: Int): PlaylistPage!
}

type Mutation {
  register(fullName: String!, email: String!, password: String!): AuthPayload!
  login(email: String!, password: String!): AuthPayload!
  logout: Boolean!
  createPlaylist(
    name: String!
    description: String
    isPublic: Boolean!
  ): PlaylistSummary!
  updatePlaylist(
    id: ID!
    name: String
    description: String
    isPublic: Boolean
  ): PlaylistSummary!
  deletePlaylist(id: ID!): Boolean!
  addSongToPlaylist(playlistId: ID!, songId: ID!): Playlist!
  removeSongFromPlaylist(playlistId: ID!, songId: ID!): Playlist!
}
`;
